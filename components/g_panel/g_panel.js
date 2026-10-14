(()=>{
'use strict';
class V41GPanel extends HTMLElement{
 connectedCallback(){
  if(this.shadowRoot)return;
  const root=this.attachShadow({mode:'open'});
  root.innerHTML=`<style>:host{display:block;width:100%;height:100%;contain:layout style paint}canvas{display:block;width:100%;height:100%;touch-action:manipulation;outline:none}</style><canvas id="gpanel" width="1024" height="1536" tabindex="0" aria-label="חלונית טרנספורמציות g"></canvas>`;
  
  'use strict';
  const W=1024,H=1536;
  const canvas=root.getElementById('gpanel');
  const ctx=canvas.getContext('2d',{willReadFrequently:true});

  // ONE visual surface only: this canvas. No DOM overlays/hotspots.
  const img1=new Image(), img2=new Image();
  img1.src='components/g_panel/assets/page1.png';
  img2.src='components/g_panel/assets/page2.png';

  const state={
    page:1,
    selected:null,
    hoverKey:null,
    hoverAKey:null,
    editor:null,
    a:{plusA:null,aMul:null,xPlusA:null,ax:null},
    confirmed:false,
    confirmedKey:null,
    confirmedA:null
  };

  // Exact hit boxes in the approved 1024x1536 artwork.
  const P1=[
    {key:'plusA',   x:217,y:563,w:291,h:194, a:{x:402,y:615,w:78,h:88}},
    {key:'abs',     x:517,y:563,w:291,h:194},
    {key:'square',  x:217,y:767,w:291,h:194},
    {key:'sqrt',    x:517,y:767,w:291,h:194},
    {key:'recip',   x:217,y:973,w:291,h:194},
    {key:'neg',     x:517,y:973,w:291,h:194}
  ];
  const P2=[
    {key:'aMul',    x:217,y:575,w:291,h:276, a:{x:264,y:647,w:84,h:103}},
    {key:'xPlusA',  x:517,y:575,w:291,h:276, a:{x:714,y:647,w:86,h:103}},
    {key:'ax',      x:217,y:861,w:291,h:262, a:{x:340,y:930,w:90,h:104}},
    {key:'mirrorY', x:517,y:861,w:291,h:262}
  ];
  const NAV={left:{x:265,y:1184,w:108,h:108},right:{x:649,y:1184,w:108,h:108},check:{x:432,y:1264,w:160,h:160}};
  const TITLE={x:287,y:405,w:451,h:126};

  const MODAL={x:238,y:420,w:548,h:664};
  const PAD_KEYS=[['7','8','9','⌫'],['4','5','6','−'],['1','2','3','.'],['AC','0','ביטול','✓']];

  function currentImg(){return state.page===1?img1:img2}
  function currentTiles(){return state.page===1?P1:P2}
  function tileFor(key){return currentTiles().find(t=>t.key===key)}

  function fitCanvas(){canvas.style.width='100%';canvas.style.height='100%';}
  function pointFromEvent(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*W/r.width, y:(e.clientY-r.top)*H/r.height};
  }
  function inside(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
  function roundedRectPath(x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }

  function draw(){
    const im=currentImg(); if(!im.complete)return;
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(im,0,0,W,H);

    // First repaint only formulas whose a-value actually changed.
    // Then add a LIGHT-ONLY hover/selection effect, so the original formula is never duplicated.
    drawDynamicAFormulas();

    const hover=!state.confirmed?tileFor(state.hoverKey):null;
    const sel=tileFor(state.selected);
    if(hover) goldize(hover,1.05);
    if(sel && (!hover || hover.key!==sel.key)) goldize(sel,1.14);
    // IMPORTANT: in the untouched/normal state the approved source image is shown exactly as-is.
    // We repaint the title face only after a real selection exists.
    if(state.selected) drawLiveTitle();
    if(state.hoverAKey && !state.editor && !state.confirmed) drawAHotHint(state.hoverAKey);
    if(state.confirmed) drawConfirmedGlow();
    if(state.editor) drawRoyalEditor();
  }

  // LIGHT-ONLY hover/selection on the SAME canvas.
  // It never redraws the formula and never adds a second text layer.
  function goldize(r,strength=1){
    const pad=11, cut=18;
    const x=r.x+pad, y=r.y+pad, w=r.w-pad*2, h=r.h-pad*2;
    ctx.save();
    ctx.globalCompositeOperation='screen';

    // Clip to the original tile silhouette.
    ctx.beginPath();
    ctx.moveTo(x+cut,y); ctx.lineTo(x+w-cut,y); ctx.lineTo(x+w,y+cut); ctx.lineTo(x+w,y+h-cut);
    ctx.lineTo(x+w-cut,y+h); ctx.lineTo(x+cut,y+h); ctx.lineTo(x,y+h-cut); ctx.lineTo(x,y+cut); ctx.closePath();
    ctx.clip();

    // Warm transparent light only — original artwork and original formula remain visible underneath.
    const glow=ctx.createRadialGradient(x+w*.5,y+h*.46,10,x+w*.5,y+h*.46,Math.max(w,h)*.72);
    glow.addColorStop(0,`rgba(255,238,112,${.46*strength})`);
    glow.addColorStop(.46,`rgba(255,210,54,${.31*strength})`);
    glow.addColorStop(.76,`rgba(255,181,20,${.12*strength})`);
    glow.addColorStop(1,'rgba(255,170,0,0)');
    ctx.fillStyle=glow;
    ctx.fillRect(x,y,w,h);

    const topShine=ctx.createLinearGradient(x,y,x,y+h);
    topShine.addColorStop(0,`rgba(255,249,198,${.22*strength})`);
    topShine.addColorStop(.46,`rgba(255,222,82,${.11*strength})`);
    topShine.addColorStop(1,'rgba(255,183,0,0)');
    ctx.fillStyle=topShine;
    ctx.fillRect(x,y,w,h);
    ctx.restore();

    // A thin luminous edge makes hover obvious without covering or rewriting the formula.
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.strokeStyle=`rgba(255,228,92,${.92*strength})`;
    ctx.lineWidth=4.1;
    ctx.shadowColor=`rgba(255,198,24,${1.0*strength})`;
    ctx.shadowBlur=28*strength;
    ctx.beginPath();
    ctx.moveTo(x+cut,y); ctx.lineTo(x+w-cut,y); ctx.lineTo(x+w,y+cut); ctx.lineTo(x+w,y+h-cut);
    ctx.lineTo(x+w-cut,y+h); ctx.lineTo(x+cut,y+h); ctx.lineTo(x,y+h-cut); ctx.lineTo(x,y+cut); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function paintInterior(r,mode='purple'){
    const pad=22, x=r.x+pad,y=r.y+pad,w=r.w-pad*2,h=r.h-pad*2;
    const g=ctx.createLinearGradient(x,y,x,y+h);
    if(mode==='gold'){g.addColorStop(0,'#ffeaa7');g.addColorStop(.55,'#f6d66f');g.addColorStop(1,'#d5a842')}
    else{g.addColorStop(0,'#25106a');g.addColorStop(.55,'#1d0a58');g.addColorStop(1,'#160747')}
    ctx.fillStyle=g; roundedRectPath(x,y,w,h,8); ctx.fill();
  }

  function drawTextCentered(r,text,mode='purple',size=52){
    ctx.save(); ctx.direction='ltr';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`italic ${size}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle=mode==='gold'?'#2d0b4e':'#fff1ca'; ctx.fillText(text,r.x+r.w/2,r.y+r.h/2+2); ctx.restore();
  }

  function formulaLabel(key){
    const a=state.a[key];
    switch(key){
      case 'plusA':return a==null?'f(x) + a':(a===0?'f(x)':`f(x) ${a>0?'+':'−'} ${Math.abs(a)}`);
      case 'abs':return '|f(x)|'; case 'square':return '(f(x))²'; case 'sqrt':return '√f(x)'; case 'recip':return '1/f(x)'; case 'neg':return '−f(x)';
      case 'aMul':return a==null?'a · f(x)':(a===1?'f(x)':a===-1?'−f(x)':`${a} · f(x)`);
      case 'xPlusA':return a==null?'f(x + a)':(a===0?'f(x)':`f(x ${a>0?'+':'−'} ${Math.abs(a)})`);
      case 'ax':return a==null?'f(ax)':(a===1?'f(x)':a===-1?'f(−x)':`f(${a}x)`);
      case 'mirrorY':return 'f(−x)';
    }
    return '';
  }

  function drawDynamicAFormulas(){
    for(const key of ['plusA','aMul','xPlusA','ax']){
      const t=tileFor(key); if(!t || state.a[key]==null)continue;
      // The only reason to repaint this tile is that the a-value changed.
      // Always repaint the normal purple face once, then the separate light-only glow is applied later.
      paintInterior(t,'purple');
      drawTextCentered(t,formulaLabel(key),'purple', key==='xPlusA'?44:48);
    }
  }

  function titleText(){
    const key=state.selected; if(!key)return 'g(x) = …';
    const a=state.a[key];
    switch(key){
      case 'plusA':return a==null?'g(x) = f(x) + a':(a===0?'g(x) = f(x)':`g(x) = f(x) ${a>0?'+':'−'} ${Math.abs(a)}`);
      case 'abs':return 'g(x) = |f(x)|'; case 'square':return 'g(x) = (f(x))²'; case 'sqrt':return 'g(x) = √f(x)'; case 'recip':return 'g(x) = 1/f(x)'; case 'neg':return 'g(x) = −f(x)';
      case 'aMul':return a==null?'g(x) = a · f(x)':(a===1?'g(x) = f(x)':a===-1?'g(x) = −f(x)':`g(x) = ${a} · f(x)`);
      case 'xPlusA':return a==null?'g(x) = f(x + a)':(a===0?'g(x) = f(x)':`g(x) = f(x ${a>0?'+':'−'} ${Math.abs(a)})`);
      case 'ax':return a==null?'g(x) = f(ax)':(a===1?'g(x) = f(x)':a===-1?'g(x) = f(−x)':`g(x) = f(${a}x)`);
      case 'mirrorY':return 'g(x) = f(−x)';
    }
    return 'g(x) = …';
  }

  function drawLiveTitle(){
    // Paint the whole inner plaque face, not a smaller rounded rectangle.
    // This avoids the visible "second layer" effect.
    const r=TITLE;
    const x=r.x+4,y=r.y+5,w=r.w-8,h=r.h-10,cut=26;
    const g=ctx.createLinearGradient(x,y,x+w,y+h);
    g.addColorStop(0,'#260861'); g.addColorStop(.48,'#321078'); g.addColorStop(1,'#1b064e');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x+cut,y);ctx.lineTo(x+w-cut,y);ctx.lineTo(x+w,y+cut);ctx.lineTo(x+w,y+h-cut);
    ctx.lineTo(x+w-cut,y+h);ctx.lineTo(x+cut,y+h);ctx.lineTo(x,y+h-cut);ctx.lineTo(x,y+cut);ctx.closePath();
    ctx.fillStyle=g;ctx.fill();
    ctx.direction='ltr';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff0c6';
    let text='\u2066'+titleText()+'\u2069',fs=58;ctx.font=`italic ${fs}px Georgia, "Times New Roman", serif`;
    while(fs>37 && ctx.measureText(text).width>w-56){fs-=2;ctx.font=`italic ${fs}px Georgia, "Times New Roman", serif`}
    ctx.shadowColor='rgba(255,224,151,.28)';ctx.shadowBlur=5;
    ctx.fillText(text,x+w/2,y+h/2+2);ctx.restore();
  }

  function drawAHotHint(key){
    const t=tileFor(key); if(!t||!t.a)return; const a=t.a;
    // No box and no overlay element: just a soft warm hover directly on the letter-a region.
    const cx=a.x+a.w/2,cy=a.y+a.h/2;
    const rg=ctx.createRadialGradient(cx,cy,4,cx,cy,Math.max(a.w,a.h)*.58);
    rg.addColorStop(0,'rgba(255,226,86,.22)');rg.addColorStop(.55,'rgba(255,207,55,.10)');rg.addColorStop(1,'rgba(255,207,55,0)');
    ctx.save();ctx.fillStyle=rg;ctx.beginPath();ctx.ellipse(cx,cy,a.w*.56,a.h*.50,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function drawConfirmedGlow(){
    // Confirmation is visible without adding any DOM layer: the existing check itself glows on the same canvas.
    const cx=NAV.check.x+NAV.check.w/2,cy=NAV.check.y+NAV.check.h/2;
    ctx.save();ctx.globalCompositeOperation='screen';
    const g=ctx.createRadialGradient(cx,cy,35,cx,cy,120);
    g.addColorStop(0,'rgba(255,244,175,.42)');g.addColorStop(.42,'rgba(255,199,46,.26)');g.addColorStop(1,'rgba(255,156,0,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,122,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,244,178,.92)';ctx.lineWidth=6;ctx.shadowColor='#ffd34a';ctx.shadowBlur=22;ctx.beginPath();ctx.arc(cx,cy,84,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  function keyLabel(key){return formulaLabel(key)}

  function openEditor(tile){
    if(state.confirmed)return;
    const current=state.a[tile.key]; state.editor={key:tile.key,value:current==null?'':String(current)}; state.selected=tile.key; state.hoverAKey=null; draw();
  }

  function editorButtons(){
    const gap=12, innerX=MODAL.x+48, innerY=MODAL.y+235, bw=(MODAL.w-96-gap*3)/4,bh=76,out=[];
    PAD_KEYS.forEach((row,ri)=>row.forEach((label,ci)=>out.push({label,x:innerX+ci*(bw+gap),y:innerY+ri*(bh+gap),w:bw,h:bh})));
    return out;
  }
  function drawRoyalEditor(){
    const m=MODAL;ctx.save();ctx.fillStyle='rgba(8,1,28,.56)';ctx.fillRect(0,0,W,H);
    ctx.shadowColor='rgba(255,193,63,.95)';ctx.shadowBlur=30;ctx.fillStyle='#c57b14';roundedRectPath(m.x,m.y,m.w,m.h,34);ctx.fill();ctx.shadowBlur=0;
    const grad=ctx.createLinearGradient(m.x,m.y,m.x,m.y+m.h);grad.addColorStop(0,'#3e1789');grad.addColorStop(.52,'#240a68');grad.addColorStop(1,'#170545');ctx.fillStyle=grad;roundedRectPath(m.x+7,m.y+7,m.w-14,m.h-14,29);ctx.fill();
    ctx.strokeStyle='#ffe383';ctx.lineWidth=3;roundedRectPath(m.x+18,m.y+18,m.w-36,m.h-36,24);ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff2c7';ctx.font='700 38px Georgia, "Times New Roman", serif';ctx.fillText('בחר ערך עבור a',m.x+m.w/2,m.y+72);
    const dx=m.x+70,dy=m.y+124,dw=m.w-140,dh=86;ctx.fillStyle='rgba(10,2,42,.88)';roundedRectPath(dx,dy,dw,dh,18);ctx.fill();ctx.strokeStyle='#f7c94f';ctx.lineWidth=3;roundedRectPath(dx,dy,dw,dh,18);ctx.stroke();ctx.fillStyle='#fff7d8';ctx.font='italic 42px Georgia, "Times New Roman", serif';ctx.fillText(state.editor.value||'a',dx+dw/2,dy+dh/2+2);
    for(const b of editorButtons()){const g=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.h);if(b.label==='✓'){g.addColorStop(0,'#f8d765');g.addColorStop(1,'#a95b06')}else if(b.label==='ביטול'){g.addColorStop(0,'#6d2c9f');g.addColorStop(1,'#34115f')}else{g.addColorStop(0,'#4b1e9f');g.addColorStop(1,'#251064')}ctx.fillStyle=g;roundedRectPath(b.x,b.y,b.w,b.h,16);ctx.fill();ctx.strokeStyle=(b.label==='✓'||b.label==='ביטול')?'#ffe69b':'#d99d2d';ctx.lineWidth=2.5;roundedRectPath(b.x,b.y,b.w,b.h,16);ctx.stroke();ctx.fillStyle='#fff4ce';ctx.font=b.label==='ביטול'?'700 24px Arial':'700 34px Georgia';ctx.fillText(b.label,b.x+b.w/2,b.y+b.h/2+1)}
    ctx.restore();
  }

  function handleEditorButton(label){
    if(!state.editor)return;
    if(label==='✓'){
      const raw=state.editor.value.trim().replace(',','.');const v=Number(raw);
      if(Number.isFinite(v)){state.a[state.editor.key]=v;state.selected=state.editor.key;state.editor=null;draw();emitChange(false)}
      return;
    }
    if(label==='ביטול'){state.editor=null;draw();return}
    if(label==='AC'){state.editor.value='';draw();return}
    if(label==='⌫'){state.editor.value=state.editor.value.slice(0,-1);draw();return}
    if(label==='−'){state.editor.value=state.editor.value.startsWith('-')?state.editor.value.slice(1):'-'+state.editor.value;draw();return}
    if(label==='.'){if(!state.editor.value.includes('.'))state.editor.value+=(state.editor.value?'':'0')+'.';draw();return}
    if(/^\d$/.test(label)){state.editor.value=state.editor.value==='0'?label:state.editor.value+label;draw()}
  }

  function hoverTarget(p){
    for(const t of currentTiles())if(t.a&&inside(p,t.a))return{aKey:t.key,tileKey:t.key};
    for(const t of currentTiles())if(inside(p,t))return{aKey:null,tileKey:t.key};
    return{aKey:null,tileKey:null};
  }

  function emitChange(confirmed){
    const detail={page:state.page,key:state.selected,a:state.selected?state.a[state.selected]:null,label:state.selected?keyLabel(state.selected):null,expression:titleText(),confirmed:!!confirmed,locked:!!state.confirmed};
    canvas.dispatchEvent(new CustomEvent(confirmed?'g-transform-confirm':'g-transform-change',{detail,bubbles:true}));
    window.dispatchEvent(new CustomEvent(confirmed?'g-transform-confirm':'g-transform-change',{detail}));
    if(typeof window.GPanel?.onchange==='function') window.GPanel.onchange(detail);
    if(confirmed && typeof window.GPanel?.onconfirm==='function') window.GPanel.onconfirm(detail);
  }

  canvas.addEventListener('pointermove',e=>{
    const p=pointFromEvent(e); if(state.editor){canvas.style.cursor='pointer';return}
    if(state.confirmed){
      canvas.style.cursor=inside(p,NAV.check)?'pointer':'default';
      if(state.hoverKey||state.hoverAKey){state.hoverKey=null;state.hoverAKey=null;draw()}
      return;
    }
    const h=hoverTarget(p);
    const pointer=!!h.tileKey||inside(p,NAV.left)||inside(p,NAV.right)||inside(p,NAV.check);
    canvas.style.cursor=pointer?'pointer':'default';
    if(h.tileKey!==state.hoverKey||h.aKey!==state.hoverAKey){state.hoverKey=h.tileKey;state.hoverAKey=h.aKey;draw()}
  });
  canvas.addEventListener('pointerleave',()=>{if(!state.editor&&(state.hoverKey||state.hoverAKey)){state.hoverKey=null;state.hoverAKey=null;draw()}});

  canvas.addEventListener('pointerdown',()=>{canvas.focus({preventScroll:true})});

  canvas.addEventListener('click',e=>{
    const p=pointFromEvent(e);
    if(state.editor){for(const b of editorButtons())if(inside(p,b)){handleEditorButton(b.label);return}return}

    // Confirmed means locked. The same existing ✓ unlocks back to edit mode.
    if(state.confirmed){
      if(inside(p,NAV.check)){state.confirmed=false;state.confirmedKey=null;state.confirmedA=null;draw();emitChange(false)}
      return;
    }

    for(const t of currentTiles())if(t.a&&inside(p,t.a)){openEditor(t);emitChange(false);return}
    for(const t of currentTiles())if(inside(p,t)){
      state.selected=state.selected===t.key?null:t.key;
      state.hoverKey=t.key;
      draw();emitChange(false);return
    }
    if(inside(p,NAV.right)||inside(p,NAV.left)){state.page=state.page===1?2:1;state.selected=null;state.hoverKey=null;state.hoverAKey=null;state.editor=null;draw();emitChange(false);return}
    if(inside(p,NAV.check)){
      if(state.selected){
        state.confirmed=true;state.confirmedKey=state.selected;state.confirmedA=state.a[state.selected];
        state.hoverKey=null;state.hoverAKey=null;draw();emitChange(true);
      }
      return
    }
  });

  canvas.addEventListener('keydown',e=>{
    if(!state.editor)return;
    if(e.key==='Enter'){handleEditorButton('✓');e.preventDefault()} else if(e.key==='Escape'){handleEditorButton('ביטול');e.preventDefault()} else if(e.key==='Backspace'){handleEditorButton('⌫');e.preventDefault()} else if(e.key==='Delete'){handleEditorButton('AC');e.preventDefault()} else if(e.key==='-'||e.key==='−'){handleEditorButton('−');e.preventDefault()} else if(e.key==='.'||e.key===','){handleEditorButton('.');e.preventDefault()} else if(/^\d$/.test(e.key)){handleEditorButton(e.key);e.preventDefault()}
  });

  window.GPanel={
    onchange:null,onconfirm:null,
    getState:()=>JSON.parse(JSON.stringify(state)),
    getExpression:()=>titleText(),
    isConfirmed:()=>!!state.confirmed,
    confirm:()=>{if(state.selected&&!state.confirmed){state.confirmed=true;state.confirmedKey=state.selected;state.confirmedA=state.a[state.selected];draw();emitChange(true)}},
    unlock:()=>{if(state.confirmed){state.confirmed=false;state.confirmedKey=null;state.confirmedA=null;draw();emitChange(false)}},
    setPage:n=>{if(state.confirmed)return;state.page=n===2?2:1;state.selected=null;state.hoverKey=null;state.hoverAKey=null;state.editor=null;draw();emitChange(false)},
    reset:()=>{state.page=1;state.selected=null;state.hoverKey=null;state.hoverAKey=null;state.editor=null;state.confirmed=false;state.confirmedKey=null;state.confirmedA=null;state.a={plusA:null,aMul:null,xPlusA:null,ax:null};draw();emitChange(false)}
  };

  Promise.all([new Promise(r=>{img1.onload=r;if(img1.complete)r()}),new Promise(r=>{img2.onload=r;if(img2.complete)r()})]).then(()=>{fitCanvas();draw()});
  window.addEventListener('resize',fitCanvas);

 }
}
customElements.define('v41-g-panel',V41GPanel);
})();
