/* V71 visuals and V3.13 math remain untouched. Only royal calculator UI. */
(()=>{
'use strict';
const module=document.getElementById('functionEditorModule');
if(!module||!window.FunctionRide)return;
const connectorIds=['functionEditorJointHit','functionEditorSocket','functionEditorPlug'];
const overlay=document.createElement('div');overlay.id='royalV71CalcOverlay';
overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','מחשבון להזנת פונקציה');
overlay.innerHTML='<div id="royalV71CalcCard"><button id="royalV71CalcClose" type="button" aria-label="סגירה ללא שמירה">×</button><iframe id="royalV71CalcFrame" title="מחשבון הפונקציה המלכותי" src="assets/royal_calculator_embedded.html" tabindex="0"></iframe><div id="royalV71CalcError" role="status"></div></div>';
document.body.appendChild(overlay);
const card=overlay.querySelector('#royalV71CalcCard'),frame=overlay.querySelector('#royalV71CalcFrame'),error=overlay.querySelector('#royalV71CalcError');
let visible=false,loaded=false,openingEvent=null,formula='',unit='deg';
function concise(cfg){
 if(!cfg)return'x+1';
 if(cfg.type==='expression')return String(cfg.expression||'x+1');
 const terms=cfg.type==='quadratic'?[[Number(cfg.a),'x^2'],[Number(cfg.b),'x'],[Number(cfg.c),'']]:[[Number(cfg.m),'x'],[Number(cfg.b),'']];
 return terms.filter(([n])=>Number.isFinite(n)&&Math.abs(n)>1e-12).map(([n,x],i)=>{const abs=Math.abs(n),body=(x&&abs===1?'':String(abs))+x;return (i===0?(n<0?'-':''):(n<0?'-':'+'))+body}).join('')||'0';
}
function align(){
 const r=module.getBoundingClientRect();const width=Math.min(670,window.innerWidth*.60,window.innerHeight*.91);
 const height=width*941/1672;
 const cx=Math.min(window.innerWidth-width/2-8,Math.max(width/2+8,r.left+r.width/2));
 const top=Math.max(8,Math.min(window.innerHeight-height-12,r.top-height-13));
 card.style.width=width+'px';card.style.height=height+'px';card.style.left=(cx-width/2)+'px';card.style.top=top+'px';
}
function beginEdit(){window.__ROYAL_COMPOSITION_CALC_ACTIVE__=true;const editor=window.FunctionRideEditorPreview;if(editor&&!editor.openState)editor.open();document.getElementById('ride')?.classList.add('royal-composition-calc-open');}
function endEdit(){window.__ROYAL_COMPOSITION_CALC_ACTIVE__=false;document.getElementById('ride')?.classList.remove('royal-composition-calc-open');const editor=window.FunctionRideEditorPreview;if(editor?.openState)editor.dismiss();}
function sendStart(){if(!loaded||!visible)return;frame.contentWindow?.postMessage({type:'mamlachat:royalcalc-open',expression:formula,unit},'*');try{frame.contentWindow?.focus();frame.focus({preventScroll:true})}catch(_){}}
function show(){
 if(visible)return;const cfg=window.FunctionRide.getFunction();formula=concise(cfg);unit=cfg.angleUnit==='rad'?'rad':'deg';
 error.textContent='';visible=true;beginEdit();overlay.classList.add('open');align();sendStart();
}
function hide(){if(!visible)return;visible=false;overlay.classList.remove('open');error.textContent='';endEdit();}
frame.addEventListener('load',()=>{loaded=true;sendStart()});
overlay.querySelector('#royalV71CalcClose').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();hide()});
// Clicking anywhere outside the real calculator is a cancel, including scene background.
document.addEventListener('pointerdown',e=>{
 if(!visible)return;if(card.contains(e.target)||module.contains(e.target))return;
 hide();
},true);
for(const id of connectorIds){const el=document.getElementById(id);if(!el)continue;
 el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(visible)hide();else show()},true);
}
window.addEventListener('resize',()=>{if(visible)align()});
window.addEventListener('scroll',()=>{if(visible)align()},true);
// The embedded calculator normally handles physical keyboard events itself.
// Forward a stray key pressed on the host page if browser focus did not cross the iframe.
document.addEventListener('keydown',e=>{
 if(!visible)return;
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();hide();return}
 if(e.key==='Tab'||e.metaKey||e.ctrlKey)return;
 try{const doc=frame.contentWindow?.document;
   if(doc&&document.activeElement!==frame){const forwarded=new KeyboardEvent('keydown',{key:e.key,code:e.code,bubbles:true,cancelable:true,shiftKey:e.shiftKey,altKey:e.altKey});doc.dispatchEvent(forwarded);e.preventDefault();e.stopImmediatePropagation()}
 }catch(_){/* leave original input handling if iframe is cross-origin */}
},true);
function normalise(text){
 let s=String(text||'').trim().replace(/−/g,'-').replace(/π/g,'pi');
 for(let iter=0;iter<48;iter++){
  const start=s.lastIndexOf('frac(');if(start<0)break;
  let depth=1,sep=-1,end=-1;
  for(let i=start+5;i<s.length;i++){const c=s[i];if(c==='(')depth++;else if(c===')'){depth--;if(!depth){end=i;break}}else if(c===','&&depth===1&&sep<0)sep=i;}
  if(sep<0||end<0)throw Error('יש להשלים את השבר');
  const a=s.slice(start+5,sep),b=s.slice(sep+1,end);
  if(!a.trim()||!b.trim())throw Error('יש להזין מונה ומכנה');
  s=s.slice(0,start)+'('+a+')/('+b+')'+s.slice(end+1);
 }
 return s.replace(/^\s*(?:f\s*\(\s*x\s*\)|y)\s*=\s*/i,'').trim();
}
window.addEventListener('message',e=>{
 if(e.source!==frame.contentWindow||e.data?.type!=='mamlachat:royalcalc-confirm')return;
 try{
  const expr=normalise(e.data.expression);if(!expr)throw Error('יש להזין פונקציה');
  const cfg=window.FunctionRide.parseFormula(expr);
  if(cfg.type==='expression')cfg.angleUnit=e.data.unit==='rad'?'rad':'deg';
  window.FunctionRide.setFunction(cfg,{persist:true,notify:true,source:'royal-composition'});
  hide();
 }catch(err){error.textContent=err?.message||'לא ניתן לקלוט את הפונקציה';}
});
window.RoyalV71Calculator=Object.freeze({open:show,close:hide,get isOpen(){return visible}});
})();
