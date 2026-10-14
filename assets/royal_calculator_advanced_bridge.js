/* Add-on for the user's COMPOSITION ADVANCED V3.13.
   No engine, ride, fraction renderer, or editor code is replaced. */
(() => {
  'use strict';
  if (!document.getElementById('functionEditorModule')) return;
  const calcSource = 'assets/royal_calculator_embedded.html';
  const style = document.createElement('style');
  style.id = 'royalCalcAdvancedSupplementStyles';
  style.textContent = `
  #royalCalcAdvancedOverlay{position:fixed!important;inset:0!important;z-index:2147483000!important;background:transparent!important;backdrop-filter:none!important;display:none;pointer-events:none;direction:rtl;box-sizing:border-box}
  #royalCalcAdvancedOverlay.open{display:block!important;pointer-events:auto!important}
  #royalCalcAdvancedCard{position:fixed;left:50%;top:39%;transform:translate(-50%,-50%);width:min(570px,60vw,calc(43vh * 1.776));max-width:96vw;pointer-events:auto;filter:drop-shadow(0 8px 15px #0007);transform-origin:50% 100%}#royalCalcAdvancedOverlay.open #royalCalcAdvancedCard{animation:advRise .33s cubic-bezier(.18,.8,.3,1) both}@keyframes advRise{from{opacity:.12;translate:0 20px;scale:.82}to{opacity:1;translate:0 0;scale:1}}
  #royalCalcAdvancedFrame{display:block;width:100%;aspect-ratio:1672/941;border:0;border-radius:0;background:transparent;box-shadow:none}
  #royalCalcAdvancedClose{position:absolute;top:-15px;right:-13px;width:42px;height:42px;border-radius:50%;border:2px solid #ffe5b2;background:#30204c;color:#fff;z-index:2;font:28px Arial;cursor:pointer}
  #royalCalcAdvancedError{margin-top:7px;color:#ffe9c0;text-align:center;font:600 14px Arial,sans-serif;text-shadow:0 1px 4px #000}
  #advancedPairedQuickNav{position:fixed;right:14px;bottom:12px;z-index:2005;width:min(370px,37vw);aspect-ratio:2048/682;background:transparent!important;box-shadow:none!important;border:0;padding:0;direction:ltr;filter:none!important}
  /* Two separate, fully visual buttons — NOT overlays over a shared image. */
  #advancedPairedQuickNav{display:flex!important;overflow:visible;pointer-events:none!important;isolation:isolate}#functionEditorModule{z-index:2010!important}
  #advancedPairedQuickNav>button{position:relative!important;top:auto!important;left:auto!important;right:auto!important;flex:0 0 50%;width:50%!important;height:100%!important;border:0!important;padding:0!important;margin:0!important;background-color:transparent!important;background-image:url('assets/axes_and_cylinder_nav.png')!important;background-repeat:no-repeat!important;background-size:200% 100%!important;box-shadow:none!important;outline:none!important;border-radius:0!important;cursor:pointer!important;opacity:1!important;filter:none!important;pointer-events:auto!important;transition:filter .15s ease}
  #advancedPairedQuickNav>button[data-to="axes"]{background-position:left center!important;clip-path:polygon(0 7%,100% 7%,100% 97%,0 97%)}
  #advancedPairedQuickNav>button[data-to="cylinder"]{background-position:right center!important;clip-path:polygon(0 10%,88% 10%,88% 99%,0 99%)}
  #advancedPairedQuickNav>button:hover,#advancedPairedQuickNav>button:focus-visible{filter:brightness(1.18) drop-shadow(0 0 7px rgba(255,222,155,.65))!important;background-color:transparent!important}
  @media(max-width:600px){#royalCalcAdvancedCard{width:min(95vw,600px);top:42%}#royalCalcAdvancedClose{right:0;top:-25px}#advancedPairedQuickNav{width:min(270px,64vw);right:5px;bottom:6px}}
  `;
  document.head.appendChild(style);
  const overlay=document.createElement('div');
  overlay.id='royalCalcAdvancedOverlay';
  overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','מחשבון מלכותי');
  overlay.innerHTML='<div id="royalCalcAdvancedCard"><button id="royalCalcAdvancedClose" type="button" aria-label="סגירת המחשבון">×</button><iframe id="royalCalcAdvancedFrame" title="המחשבון המלכותי" src="'+calcSource+'"></iframe><div id="royalCalcAdvancedError" role="status" aria-live="polite"></div></div>';
  document.body.appendChild(overlay);
  const frame=document.getElementById('royalCalcAdvancedFrame');
  const error=document.getElementById('royalCalcAdvancedError');
  let loaded=false, initial='', currentUnit='deg';
  function prettyPolynomial(values,degree){
    const vars=degree===2?['x^2','x','']:['x',''];
    return values.map((n,i)=>{const val=Number(n);if(!Number.isFinite(val)||Math.abs(val)<1e-12)return '';
      const variable=vars[i],abs=Math.abs(val);return (val<0?'-':'+')+(variable&&abs===1?'':String(abs))+variable;
    }).filter(Boolean).join('').replace(/^\+/,'')||'0';
  }
  function configExpression(cfg){
    if (!cfg) return '';
    if (cfg.type==='expression') return String(cfg.expression||'');
    if (cfg.type==='quadratic') return prettyPolynomial([cfg.a,cfg.b,cfg.c],2);
    if (cfg.type==='linear') return prettyPolynomial([cfg.m,cfg.b],1);
    return '';
  }
  // Honor explicit navigation from PLAY/axes; do not let stale local storage override it.
  try {
    const query=new URLSearchParams(location.search);
    const provided=query.get('f');
    const engine=window.FunctionRide;
    if(provided&&engine?.parseFormula){
      const cfg=engine.parseFormula(provided);
      if(cfg.type==='expression')cfg.angleUnit=query.get('angleUnit')==='rad'?'rad':'deg';
      engine.setFunction(cfg,{persist:true,notify:true,source:'kingdom-navigation'});
    }else if(query.has('type')&&engine?.setFunction){
      const type=query.get('type');
      if(type==='linear'&&(query.has('m')||query.has('b'))){
        engine.setFunction({type:'linear',m:Number(query.get('m')||1),b:Number(query.get('b')||0)},{persist:true,notify:true,source:'kingdom-navigation'});
      }else if(type==='quadratic'&&(query.has('a')||query.has('b')||query.has('c'))){
        engine.setFunction({type:'quadratic',a:Number(query.get('a')||1),b:Number(query.get('b')||0),c:Number(query.get('c')||0)},{persist:true,notify:true,source:'kingdom-navigation'});
      }
    }
  } catch(err){console.warn('Navigation function was not applied',err?.message||err)}
  function sendOpen(){if (loaded) frame.contentWindow.postMessage({type:'mamlachat:royalcalc-open',expression:initial,unit:currentUnit},'*')}
  frame.addEventListener('load',()=>{loaded=true;if(overlay.classList.contains('open'))sendOpen()});
  function positionCard(){
    const trigger=document.getElementById('functionEditorModule');
    const r=trigger?.getBoundingClientRect();if(!r)return;
    const card=document.getElementById('royalCalcAdvancedCard');
    const w=Math.min(570,innerWidth*.72,Math.max(260,innerHeight*.44*1672/941));
    const h=w*941/1672;
    card.style.width=w+'px';
    card.style.left=Math.min(innerWidth-w/2-8,Math.max(w/2+8,r.left+r.width/2))+'px';
    const preferred=r.top-h/2-16;
    const where=preferred>=h/2+8?preferred:r.bottom+h/2+16;
    card.style.top=Math.max(h/2+8,Math.min(innerHeight-h/2-8,where))+'px';
  }
  function openCalc(){
    if(overlay.classList.contains('open'))return;
    const cfg=window.FunctionRide?.getFunction?.();
    initial=configExpression(cfg);currentUnit=cfg?.angleUnit==='rad'?'rad':'deg';
    window.__ROYAL_COMPOSITION_CALC_ACTIVE__=true;document.documentElement.classList.add('royal-composition-calculator-open');
    // Original socket/plug opening animation drives the calculator's emergence.
    window.FunctionRideEditorPreview?.open?.();
    positionCard();error.textContent='';overlay.classList.add('open');sendOpen();frame.focus();try{frame.contentWindow?.focus()}catch(_){}
  }
  function closeCalc(){
    if(!overlay.classList.contains('open'))return;
    overlay.classList.remove('open');error.textContent='';window.__ROYAL_COMPOSITION_CALC_ACTIVE__=false;document.documentElement.classList.remove('royal-composition-calculator-open');
    window.FunctionRideEditorPreview?.dismiss?.();
  }
  document.addEventListener('pointerdown',e=>{if(overlay.classList.contains('open')&&!document.getElementById('royalCalcAdvancedCard').contains(e.target))closeCalc()},true);
  window.addEventListener('resize',()=>{if(overlay.classList.contains('open'))positionCard()});
  document.getElementById('royalCalcAdvancedClose').addEventListener('click',closeCalc);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeCalc()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closeCalc()}},true);
  /* Transform explicit 2-D fractions recursively into ordinary division.
     The V3 engine, not this adapter, validates and evaluates the result. */
  function convertFractions(text){
    let s=String(text||'').trim().replace(/−/g,'-').replace(/π/g,'pi');
    for (let count=0;count<60;count++){
      let start=s.lastIndexOf('frac(');if(start<0)break;
      let depth=1,split=-1,end=-1;
      for(let i=start+5;i<s.length;i++){
        const c=s[i];if(c==='(')depth++;
        else if(c===')'){depth--;if(depth===0){end=i;break}}
        else if(c===','&&depth===1&&split<0)split=i;
      }
      if(end<0||split<0)throw new Error('השבר אינו שלם');
      const numerator=s.slice(start+5,split),denominator=s.slice(split+1,end);
      if(!numerator.trim()||!denominator.trim())throw new Error('צריך למלא מונה ומכנה');
      s=s.slice(0,start)+'('+numerator+')/('+denominator+')'+s.slice(end+1);
    }
    if(s.includes('frac('))throw new Error('מבנה השבר אינו תקין');
    return s.replace(/^\s*(?:f\s*\(\s*x\s*\)|y)\s*=\s*/i,'').trim();
  }
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.data?.type!=='mamlachat:royalcalc-confirm')return;
    try{
      const expression=convertFractions(event.data.expression);
      if(!expression)throw new Error('יש להזין פונקציה לפני האישור');
      if(expression.length>350)throw new Error('הפונקציה ארוכה מדי');
      const engine=window.FunctionRide;
      if(!engine||typeof engine.parseFormula!=='function')throw new Error('מנוע הפונקציה החכם עדיין לא נטען');
      const cfg=engine.parseFormula(expression);
      if(cfg.type==='expression') cfg.angleUnit=event.data.unit==='rad'?'rad':'deg';
      engine.setFunction(cfg,{persist:true,notify:true,source:'royal-calculator-v3'});
      closeCalc();
    }catch(e){error.textContent=e?.message||'לא ניתן לקבל את הפונקציה'}
  });
  // Physical keyboard fallback: iframe normally receives keys itself. In browsers that
  // leave focus on the scene, deliver exactly one event to its same-origin document.
  document.addEventListener('keydown',event=>{
    if(!overlay.classList.contains('open')||event.key==='Escape'||event.metaKey||event.ctrlKey||event.altKey)return;
    if(document.activeElement===frame||!event.key||event.key.length>1&&!['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(event.key))return;
    try{const doc=frame.contentWindow?.document;if(!doc)return;
      doc.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,code:event.code,bubbles:true,cancelable:true,shiftKey:event.shiftKey}));
      event.preventDefault();event.stopPropagation();
    }catch(_){}
  },true);
  // One click is the only entry path. Avoid opening on pointerdown: the new modal
  // would otherwise intercept the release/click and immediately close itself.
  for(const id of ['functionEditorJointHit','functionEditorSocket','functionEditorPlug']){
    const el=document.getElementById(id);
    el?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCalc()},true);
  }
  // Preserve the previously approved paired navigator at its saved location.
  const nav=document.createElement('nav');nav.id='advancedPairedQuickNav';nav.setAttribute('aria-label','מעבר בין מתחמים');
  nav.innerHTML='<button type="button" data-to="axes" aria-label="מעבר לממלכת הצירים" title="ממלכת הצירים"></button><button type="button" data-to="cylinder" aria-label="מעבר לגליל הראשי" title="הגליל הראשי"></button>';
  const POS_KEY='mamlachat.composition.quickNav.position.v1';
  try{const p=JSON.parse(localStorage.getItem(POS_KEY)||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){nav.style.left=p.x+'px';nav.style.top=p.y+'px';nav.style.right='auto';nav.style.bottom='auto'}}catch(_){}
  const HUB='mamlachat.functionHub.v1';
  function publish(cfg){
    const expression=configExpression(cfg);if(!expression)return;
    try{
      const prev=JSON.parse(localStorage.getItem(HUB)||'null');
      if(prev?.expression===expression&&prev?.angleUnit===(cfg?.angleUnit||null))return;
      const next={schemaVersion:1,revision:Math.max(Date.now(),Number(prev?.revision||0)+1),updatedAt:Date.now(),expression,display:'f(x)='+expression,angleUnit:cfg?.angleUnit||null,source:'advanced-composition'};
      localStorage.setItem(HUB,JSON.stringify(next));
    }catch(_){}
  }
  window.addEventListener('functionride:change',e=>publish(e.detail?.function||window.FunctionRide?.getFunction?.()));
  nav.addEventListener('click',e=>{
    const btn=e.target.closest('button[data-to]');if(!btn)return;
    const key=btn.dataset.to,cfg=window.FunctionRide?.getFunction?.();publish(cfg);
    const target=key==='axes'?'ממלכת הצירים מושלם מסך מלא.html':'PLAY.html';
    const url=new URL(target,location.href),expression=configExpression(cfg);
    if(expression){url.searchParams.set('f',expression);url.searchParams.set('display','f(x)='+expression);}
    if(cfg?.angleUnit)url.searchParams.set('angleUnit',cfg.angleUnit);
    if(key==='cylinder'){url.searchParams.set('fromKingdom','composition');url.searchParams.set('connect','1');}
    location.assign(url.href);
  });
  if(!['basic','table','axes'].includes(new URLSearchParams(location.search).get('lesson')))document.body.appendChild(nav);
  // The visual two-button navigator used to physically cover the socket on the
  // bottom-right of V71. Its transparent pixels still intercepted pointer hits.
  // Reposition it ONLY if the rectangles overlap; keep approved appearance/art.
  function keepSocketClickable(){
    if(!nav.isConnected)return;
    const dock=document.getElementById('functionEditorModule');if(!dock)return;
    const n=nav.getBoundingClientRect(),r=dock.getBoundingClientRect();
    if(n.right<=r.left-8||n.left>=r.right+8||n.bottom<=r.top-8||n.top>=r.bottom+8)return;
    if(r.top>=n.height+24){nav.style.top=Math.max(8,r.top-n.height-18)+'px';nav.style.bottom='auto';}
    else{nav.style.left='8px';nav.style.right='auto';}
  }
  requestAnimationFrame(keepSocketClickable);
  window.addEventListener('resize',()=>requestAnimationFrame(keepSocketClickable));
  window.AdvancedRoyalCalculator=Object.freeze({open:openCalc,close:closeCalc});
})();
