(()=>{
'use strict';
class V41PropertyPanel extends HTMLElement{
 connectedCallback(){
  if(this.shadowRoot)return;const host=this;const root=this.attachShadow({mode:'open'});
  root.innerHTML=`<style>*{box-sizing:border-box}:host{display:block;position:absolute;inset:0;pointer-events:none;contain:layout style}#workspace{position:absolute;inset:0;width:1672px;height:941px;overflow:visible;user-select:none}.movable{position:absolute;touch-action:none;pointer-events:auto}#mainObj{left:385px;top:125px;width:380px;height:570px}#mainCanvas{display:block;width:100%;height:100%;background:transparent;outline:none}#trayObj{left:700px;top:706px;width:460px;height:181px}#trayCanvas{display:block;width:100%;height:100%;background:transparent;outline:none}.dragging{cursor:grabbing!important}</style><div id="workspace"><div id="mainObj" class="movable"><canvas id="mainCanvas" width="1024" height="1536" tabindex="0"></canvas></div><div id="trayObj" class="movable"><canvas id="trayCanvas" width="736" height="289" tabindex="0"></canvas></div></div>`;
  
  const mainObj=root.getElementById('mainObj');
  const trayObj=root.getElementById('trayObj');
  const main=root.getElementById('mainCanvas');
  const tray=root.getElementById('trayCanvas');
  const ctx=main.getContext('2d');
  const tctx=tray.getContext('2d');
  const W=1024,H=1536,TW=736,TH=289;

  const defs=[
    ['x_intercepts','חיתוך עם ציר x',112,113,424,228,0],
    ['y_intercept','חיתוך עם ציר y',564,113,425,228,0],
    ['positive','תחום חיובי',112,354,424,229,1],
    ['negative','תחום שלילי',564,354,425,229,1],
    ['increasing','עלייה',112,605,424,229,1],
    ['decreasing','ירידה',564,605,425,229,1],
    ['extrema','קיצון',112,855,424,228,1],
    ['inflection','פיתול',564,855,425,228,1],
    ['concave_up','קעירות כלפי מעלה',112,1106,424,226,2],
    ['concave_down','קעירות כלפי מטה',564,1106,425,226,2]
  ];

  function tilePath(x,y,w,h,rowType,inset=0){
    const p=new Path2D();
    const l=x+18+inset, r=x+w-18-inset, t=y+15+inset, b=y+h-24-inset;
    const cut=18, notchW=38, notchD=22, cx=x+w/2;
    p.moveTo(l+cut,t);
    if(rowType!==0){
      p.lineTo(cx-notchW,t); p.lineTo(cx-15,t+10); p.quadraticCurveTo(cx,t+notchD,cx+15,t+10); p.lineTo(cx+notchW,t);
    }
    p.lineTo(r-cut,t); p.lineTo(r,t+cut); p.lineTo(r,b-cut); p.lineTo(r-cut,b);
    if(rowType!==2){
      p.lineTo(cx+notchW,b); p.lineTo(cx+15,b-10); p.quadraticCurveTo(cx,b-notchD,cx-15,b-10); p.lineTo(cx-notchW,b);
    }
    p.lineTo(l+cut,b); p.lineTo(l,b-cut); p.lineTo(l,t+cut); p.closePath();
    return p;
  }

  const tiles=defs.map(([key,label,x,y,w,h,rowType])=>({
    key,label,x,y,w,h,rowType,
    hit:tilePath(x,y,w,h,rowType,-5),
    face:tilePath(x,y,w,h,rowType,0),
    inner:tilePath(x,y,w,h,rowType,5)
  }));

  const assets={base:new Image(),tray:new Image(),gold:new Image(),blue:new Image()};
  assets.base.src='components/property_panel/assets/main_panel.png';
  assets.tray.src='components/property_panel/assets/selection_tray.png';
  assets.gold.src='components/property_panel/assets/glow_gold.png';
  assets.blue.src='components/property_panel/assets/glow_blue.png';
  let loaded=0;
  Object.values(assets).forEach(im=>{im.onload=()=>{loaded++; if(loaded===4){drawMain();drawTray();}};});

  const selected=[];
  let hoverKey=null;
  let trayHits=[];

  function drawMagicTexture(t,kind){
    const img=kind==='blue'?assets.blue:assets.gold;
    const p=t.face;
    ctx.save();
    ctx.clip(p);

    // A subdued full-face tint first.
    const grad=ctx.createLinearGradient(t.x,t.y,t.x,t.y+t.h);
    if(kind==='blue'){
      grad.addColorStop(0,'rgba(221,249,255,.22)');
      grad.addColorStop(.45,'rgba(59,176,255,.22)');
      grad.addColorStop(1,'rgba(0,86,255,.28)');
    }else{
      grad.addColorStop(0,'rgba(255,251,217,.28)');
      grad.addColorStop(.48,'rgba(255,220,100,.21)');
      grad.addColorStop(1,'rgba(255,193,36,.18)');
    }
    ctx.fillStyle=grad; ctx.fillRect(t.x,t.y,t.w,t.h);

    // Use the approved magical artwork as light texture. Screen makes the black
    // background neutral, while clipping prevents any pixel from escaping the tile.
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=kind==='blue'?.62:.52;
    const sx=120, sy=90, sw=1360, sh=720;
    // Keep the approved left alignment, but stretch the light farther to the right
    // so the magical texture reaches the full inner edge of the tile.
    const dx=t.x+5, dy=t.y+4, dw=t.w-3, dh=t.h-17;
    ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);

    // Restore the original stone and dark symbol definition without creating a second visible tile.
    ctx.globalCompositeOperation='multiply';
    ctx.globalAlpha=kind==='blue'?.76:.84;
    ctx.drawImage(assets.base,t.x,t.y,t.w,t.h,t.x,t.y,t.w,t.h);
    ctx.restore();

    // Inward-only luminous edge: clip first, so the glow cannot leak outward.
    ctx.save();
    ctx.clip(p);
    ctx.lineJoin='round';
    if(kind==='blue'){
      ctx.shadowColor='rgba(0,170,255,.98)';ctx.shadowBlur=22;ctx.lineWidth=10;ctx.strokeStyle='rgba(0,126,255,.84)';ctx.stroke(p);
      ctx.shadowColor='rgba(128,250,255,.98)';ctx.shadowBlur=12;ctx.lineWidth=5;ctx.strokeStyle='rgba(66,211,255,.98)';ctx.stroke(p);
      ctx.shadowBlur=5;ctx.lineWidth=2.1;ctx.strokeStyle='rgba(241,255,255,.98)';ctx.stroke(t.inner);
    }else{
      ctx.shadowColor='rgba(255,164,0,.98)';ctx.shadowBlur=18;ctx.lineWidth=9;ctx.strokeStyle='rgba(255,183,27,.92)';ctx.stroke(p);
      ctx.shadowColor='rgba(255,236,113,.96)';ctx.shadowBlur=9;ctx.lineWidth=4.5;ctx.strokeStyle='rgba(255,221,71,.98)';ctx.stroke(p);
      ctx.shadowBlur=4;ctx.lineWidth=1.9;ctx.strokeStyle='rgba(255,255,228,.98)';ctx.stroke(t.inner);
    }
    ctx.restore();
  }

  function drawMain(){
    if(!assets.base.naturalWidth)return;
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(assets.base,0,0,W,H);
    for(const t of tiles){
      if(selected.includes(t.key)) drawMagicTexture(t,'blue');
      else if(t.key===hoverKey) drawMagicTexture(t,'gold');
    }
  }

  function mainPoint(e){
    const r=main.getBoundingClientRect();
    return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
  }
  function tileAt(x,y){
    for(const t of tiles) if(ctx.isPointInPath(t.hit,x,y)) return t;
    return null;
  }

  function drawMiniTile(t,x,y,w,h){
    const crop={x:t.x,y:t.y,w:t.w,h:t.h};
    tctx.save();
    const p=new Path2D();
    const c=10;
    p.moveTo(x+c,y);p.lineTo(x+w-c,y);p.lineTo(x+w,y+c);p.lineTo(x+w,y+h-c);p.lineTo(x+w-c,y+h);p.lineTo(x+c,y+h);p.lineTo(x,y+h-c);p.lineTo(x,y+c);p.closePath();
    tctx.clip(p);
    tctx.drawImage(assets.base,crop.x,crop.y,crop.w,crop.h,x,y,w,h);
    const g=tctx.createLinearGradient(x,y,x,y+h);
    g.addColorStop(0,'rgba(210,250,255,.26)');g.addColorStop(.55,'rgba(55,178,255,.28)');g.addColorStop(1,'rgba(0,82,255,.34)');
    tctx.fillStyle=g;tctx.fillRect(x,y,w,h);
    tctx.globalCompositeOperation='screen';tctx.globalAlpha=.45;
    tctx.drawImage(assets.blue,120,90,1360,720,x,y,w+2,h);
    tctx.restore();
    tctx.save();tctx.clip(p);tctx.lineJoin='round';
    tctx.shadowColor='rgba(0,179,255,.95)';tctx.shadowBlur=12;tctx.lineWidth=5;tctx.strokeStyle='rgba(40,183,255,.95)';tctx.stroke(p);
    tctx.shadowBlur=4;tctx.lineWidth=1.7;tctx.strokeStyle='rgba(235,255,255,.98)';tctx.stroke(p);tctx.restore();
  }

  function drawTray(){
    if(!assets.tray.naturalWidth)return;
    tctx.clearRect(0,0,TW,TH);
    tctx.drawImage(assets.tray,0,0,TW,TH);
    trayHits=[];
    const n=selected.length;
    if(!n)return;
    const innerX=67,innerY=116,innerW=620,innerH=111;
    const gap=9;
    const maxW=132;
    const chipW=Math.min(maxW,(innerW-gap*(n-1))/Math.max(n,1));
    const chipH=Math.min(91,chipW*.63);
    const total=chipW*n+gap*(n-1);
    let x=innerX+Math.max(0,(innerW-total)/2);
    const y=innerY+(innerH-chipH)/2;
    for(let i=0;i<n;i++){
      const key=selected[i],t=tiles.find(z=>z.key===key);
      drawMiniTile(t,x,y,chipW,chipH);
      const rr=Math.max(12,chipW*.13), cx=x+chipW-3, cy=y+3;
      tctx.save();tctx.beginPath();tctx.arc(cx,cy,rr,0,Math.PI*2);tctx.fillStyle='#071a34';tctx.fill();
      tctx.lineWidth=Math.max(2,chipW*.025);tctx.strokeStyle='#f59b19';tctx.stroke();
      tctx.strokeStyle='#ffad23';tctx.lineWidth=Math.max(2.3,chipW*.025);tctx.lineCap='round';
      tctx.beginPath();tctx.moveTo(cx-rr*.38,cy-rr*.38);tctx.lineTo(cx+rr*.38,cy+rr*.38);tctx.moveTo(cx+rr*.38,cy-rr*.38);tctx.lineTo(cx-rr*.38,cy+rr*.38);tctx.stroke();tctx.restore();
      trayHits.push({type:'remove',index:i,cx,cy,r:rr+6,x,y,w:chipW,h:chipH});
      x+=chipW+gap;
    }
  }

  main.addEventListener('pointermove',e=>{
    const p=mainPoint(e),t=tileAt(p.x,p.y),next=t?.key||null;
    if(next!==hoverKey){hoverKey=next;drawMain();}
    main.style.cursor=t?'pointer':'grab';
  });
  main.addEventListener('pointerleave',()=>{hoverKey=null;drawMain();main.style.cursor='default';});
  main.addEventListener('click',e=>{
    if(mainObj.dataset.wasDrag==='1'){mainObj.dataset.wasDrag='0';return;}
    const p=mainPoint(e),t=tileAt(p.x,p.y);if(!t)return;
    const i=selected.indexOf(t.key); if(i>=0)selected.splice(i,1);else selected.push(t.key);
    drawMain();drawTray();
  });
  main.addEventListener('keydown',e=>{
    if(e.key==='Escape'){selected.splice(0);drawMain();drawTray();}
    if((e.key==='Enter'||e.key===' ')&&hoverKey){e.preventDefault();const i=selected.indexOf(hoverKey);if(i>=0)selected.splice(i,1);else selected.push(hoverKey);drawMain();drawTray();}
  });

  function trayPoint(e){const r=tray.getBoundingClientRect();return{x:(e.clientX-r.left)*TW/r.width,y:(e.clientY-r.top)*TH/r.height};}
  function trayHit(x,y){for(const h of trayHits){const dx=x-h.cx,dy=y-h.cy;if(dx*dx+dy*dy<=h.r*h.r)return h;}return null;}
  tray.addEventListener('pointermove',e=>{const p=trayPoint(e);tray.style.cursor=trayHit(p.x,p.y)?'pointer':'grab';});
  tray.addEventListener('click',e=>{
    if(trayObj.dataset.wasDrag==='1'){trayObj.dataset.wasDrag='0';return;}
    const p=trayPoint(e),h=trayHit(p.x,p.y);if(!h)return;
    selected.splice(h.index,1);drawMain();drawTray();emitSelection();
  });


  function emitSelection(){
    const detail={selected:[...selected]};
    host.dispatchEvent(new CustomEvent('v41-property-change',{detail,bubbles:true,composed:true}));
  }
  host.getSelected=()=>[...selected];
  host.clearSelections=()=>{selected.splice(0);drawMain();drawTray();emitSelection()};

  // Dragging: main panel drags only when the press begins outside an interactive tile.
  function makeDraggable(obj,canvasEl,isBlocked){
    let drag=null;
    canvasEl.addEventListener('pointerdown',e=>{
      if(isBlocked(e))return;
      const rect=obj.getBoundingClientRect();
      drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,left:obj.offsetLeft,top:obj.offsetTop,moved:false};
      canvasEl.setPointerCapture(e.pointerId);obj.classList.add('dragging');
    });
    canvasEl.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
      if(Math.hypot(dx,dy)>4)drag.moved=true;
      obj.style.left=(drag.left+dx)+'px';obj.style.top=(drag.top+dy)+'px';
    });
    const end=e=>{if(!drag||e.pointerId!==drag.id)return;obj.dataset.wasDrag=drag.moved?'1':'0';drag=null;obj.classList.remove('dragging');};
    canvasEl.addEventListener('pointerup',end);canvasEl.addEventListener('pointercancel',end);
  }
  makeDraggable(mainObj,main,e=>{const p=mainPoint(e);return !!tileAt(p.x,p.y);});
  makeDraggable(trayObj,tray,e=>{const p=trayPoint(e);return !!trayHit(p.x,p.y);});

 }
}
customElements.define('v41-property-panel',V41PropertyPanel);
})();
