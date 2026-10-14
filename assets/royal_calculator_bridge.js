(() => {
'use strict';
const ASSET='assets/royal_calculator_embedded.html';
const axes=!!document.getElementById('functionPlugDock');
const composition=!axes&&!!document.getElementById('functionEditorModule');
const play=!axes&&!composition&&!!document.getElementById('perfectCylinder');
if(!axes&&!composition&&!play)return;

const style=document.createElement('style');
style.id='royal-calculator-host-styles';
style.textContent=`
#royalCalcOverlay{position:fixed!important;inset:0!important;z-index:2147483000!important;background:transparent!important;backdrop-filter:none!important;display:none;pointer-events:none;direction:rtl;box-sizing:border-box}
#royalCalcOverlay.royal-open{display:block!important;pointer-events:auto!important}
html.royal-axes-calculator-open #functionPlugEditor{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
#royalCalcCard{position:fixed;left:50%;top:39%;transform:translate(-50%,-50%);width:min(580px,62vw,calc(43vh * 1.776));max-width:96vw;box-sizing:border-box;filter:drop-shadow(0 9px 17px #0007);pointer-events:auto;transform-origin:50% 100%}#royalCalcOverlay.royal-open #royalCalcCard{animation:royalRise .3s cubic-bezier(.18,.8,.3,1) both}@keyframes royalRise{from{opacity:.12;translate:0 23px;scale:.84}to{opacity:1;translate:0 0;scale:1}}
#royalCalcFrame{display:block;width:100%;aspect-ratio:1672/941;border:0;border-radius:0;background:transparent;box-shadow:none}
#royalCalcClose{position:absolute;right:-10px;top:-14px;width:43px;height:43px;border-radius:50%;z-index:3;background:linear-gradient(#402556,#1b1136);border:2px solid #ffe2a5;color:#fff;font:29px Arial;cursor:pointer;box-shadow:0 0 15px #0009;display:grid;place-items:center;padding:0}
#royalCalcError{min-height:0;margin:8px 0 0;color:#ffe9c0;text-align:center;font:600 15px Arial,'Noto Sans Hebrew',sans-serif;text-shadow:0 1px 4px #000;display:none}
#royalCalcError:not(:empty){display:block}
#stage.royalcalc-third .dial{visibility:hidden!important;pointer-events:none!important}
#stage.royalcalc-third #scrollSnapshotCanvas{display:none!important}
#stage.royalcalc-third #scroll iframe{visibility:visible!important}
#royalCalcCylinderButton{display:none;position:absolute;left:51.05%;top:42.7%;width:3.3%;height:12.5%;z-index:7;border:0;background:transparent;cursor:pointer;padding:0;filter:none}
#stage.royalcalc-third #royalCalcCylinderButton{display:flex!important}
#royalCalcCylinderButton:hover,#royalCalcCylinderButton:focus-visible{filter:drop-shadow(0 0 6px #f3d589)}
@media(max-width:600px){#royalCalcCard{width:min(95vw,600px);top:42%}#royalCalcClose{right:0;top:-28px;width:37px;height:37px;font-size:23px}#royalCalcError{font-size:12px}}
`;
document.head.appendChild(style);
const overlay=document.createElement('div');overlay.id='royalCalcOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','מחשבון מלכותי');
overlay.innerHTML='<div id="royalCalcCard"><button id="royalCalcClose" type="button" aria-label="סגירת מחשבון">×</button><iframe id="royalCalcFrame" title="המחשבון המלכותי" src="'+ASSET+'"></iframe><div id="royalCalcError" aria-live="polite"></div></div>';
document.body.appendChild(overlay);
const frame=overlay.querySelector('#royalCalcFrame'),error=overlay.querySelector('#royalCalcError');
// Axes realm only: install one real drag/resize controller onto the single royal calculator.
const axesLayout=axes&&window.RoyalCalcLayout?.create({card:overlay.querySelector('#royalCalcCard'),overlay,
  storageKey:'mamlachat.royalCalc.layout.axes.v1',reposition:()=>positionCard()});
let isLoaded=false,requestedValue='';
function send(){if(isLoaded)frame.contentWindow.postMessage({type:'mamlachat:royalcalc-open',expression:requestedValue},'*')}
frame.addEventListener('load',()=>{isLoaded=true;send()});
let anchor=null;
function positionCard(){
 const card=overlay.querySelector('#royalCalcCard'),r=anchor?.getBoundingClientRect();if(!r)return;
 const w=Math.min(580,innerWidth*.78,Math.max(240,innerHeight*.44*1672/941));
 const h=w*941/1672;
 const left=Math.min(innerWidth-w/2-8,Math.max(w/2+8,r.left+r.width/2));
 const above=r.top-h-16>=8, top=above?r.top-h/2-14:Math.min(innerHeight-h/2-8,r.bottom+h/2+12);
 if(axesLayout){axesLayout.layout({left,top:Math.max(h/2+8,top),width:w});}
 else{card.style.left=left+'px';card.style.top=Math.max(h/2+8,top)+'px';card.style.width=w+'px';}
}
function open(value,target){
 if(overlay.classList.contains('royal-open'))return;
 requestedValue=String(value||'');anchor=target||null;error.textContent='';
 if(axes){window.__ROYAL_AXES_CALC_ACTIVE__=true;window.__FUNCTION_PLUG__?.open?.();document.documentElement.classList.add('royal-axes-calculator-open')}
 positionCard();overlay.classList.add('royal-open');send();frame.focus()
}
function close(){
 if(!overlay.classList.contains('royal-open'))return;
 overlay.classList.remove('royal-open');error.textContent='';anchor=null;
 if(axes){window.__ROYAL_AXES_CALC_ACTIVE__=false;document.documentElement.classList.remove('royal-axes-calculator-open');window.__FUNCTION_PLUG__?.close?.()}
}
window.addEventListener('resize',()=>{if(overlay.classList.contains('royal-open'))positionCard()});
document.addEventListener('pointerdown',e=>{if(overlay.classList.contains('royal-open')&&!overlay.querySelector('#royalCalcCard').contains(e.target))close()},true);
overlay.querySelector('#royalCalcClose').addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('royal-open')){e.stopImmediatePropagation();close()}},true);
function normalizeCalc(raw){
 let s=String(raw||'').trim().replace(/−/g,'-').replace(/²/g,'^2').replace(/^\s*(?:f\s*\(\s*x\s*\)|y)\s*=\s*/i,'');
 // An entered two-dimensional fraction may be numeric or algebraic.
 for(let i=0;i<6 && s.includes('frac(');i++){
  let next=s.replace(/frac\(\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)/g,(_,n,d)=>`${n}/${d}`);
  next=next.replace(/frac\(([^(),]+),([^(),]+)\)/g,(_,a,b)=>`(${a})/(${b})`);
  if(next===s)break;s=next;
 }
 return s.trim();
}
function safeCompositionExpr(expr){
 // Reuse the existing function editor, which is intentionally limited to polynomials.
 return expr.replace(/\^2/g,'²').replace(/\*/g,'').replace(/\s/g,'');
}
async function receiveCalculation(expression,unit){
 const expr=normalizeCalc(expression);
 if(!expr)throw new Error('יש להקליד פונקציה לפני האישור.');
 if(expr.length>260)throw new Error('הביטוי ארוך מדי.');
 if(axes){
  if(/\b(sin|cos|tan)\s*\(/i.test(expr)&&unit==='deg')throw new Error('לטריגונומטריה יש לבחור RAD כדי לשמור על התאמה למנוע הקיים.');
  const callback=window.__FUNCTION_PLUG__?.commit;
  if(typeof callback!=='function')throw new Error('חיבור הפונקציה עדיין לא מוכן.');
  try{window.FunctionRuntimeV2.create({expression:expr})}catch(err){throw new Error('הביטוי אינו נתמך: '+String(err?.message||'פונקציה לא תקינה'))}
  if(!await callback(expr)){
    window.__FUNCTION_PLUG__?.close?.();
    throw new Error('לא ניתן לקבל את הפונקציה. בדוק את הביטוי.');
  }
 }else if(composition){
  if(document.documentElement.hasAttribute('data-lesson-mode'))throw new Error('עורך הפונקציה אינו פעיל בשלב הלימודי.');
  const editor=window.FunctionRideEditorPreview;
  if(!editor?.parse)throw new Error('עורך הפונקציה עדיין לא מוכן.');
  const converted=safeCompositionExpr(expr);
  editor.parse(converted); // Exact original validation — rejects unsupported functions.
  editor.open();
  const input=document.getElementById('functionEditorInput');input.value=converted;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  editor.apply();
  if(editor.openState)throw new Error('לא ניתן לאשר את הפונקציה.');
 }else if(play){
  if(typeof window.__MAMLACHAT_PLAY_APPLY_FROM_CALCULATOR__!=='function')throw new Error('הגליל עדיין לא מוכן.');
  window.__MAMLACHAT_PLAY_APPLY_FROM_CALCULATOR__(expr);
  window.__ROYAL_PLAY_RESET_PAGE__?.();
 }
}
window.addEventListener('message',async event=>{
 if(event.source!==frame.contentWindow||!event.data||event.data.type!=='mamlachat:royalcalc-confirm')return;
 try{await receiveCalculation(event.data.expression,event.data.unit);close()}catch(err){error.textContent=String(err?.message||'לא ניתן לקבל את הפונקציה.')} 
});

if(axes){
  const current=()=>{try{return window.__FUNCTION_PLUG__?.expression||''}catch(e){return ''}};
  for(const id of ['functionSocket','functionPlug']){
   const el=document.getElementById(id);if(!el)continue;
   el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopImmediatePropagation();open(current(),document.getElementById('functionPlugDock')||el)},true);
   el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation()},true);
  }
}else if(composition){
  if(!document.documentElement.hasAttribute('data-lesson-mode')){
   const current=()=>{const config=window.FunctionRide?.getFunction?.();if(!config)return '';
    if(config.type==='quadratic')return `${config.a}*x^2+${config.b}*x+${config.c}`;
    return `${config.m}*x+${config.b}`;};
   for(const id of ['functionEditorJointHit','functionEditorSocket','functionEditorPlug']){
    const el=document.getElementById(id);if(!el)continue;
    el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open(current(),el)},true);
   }
  }
}else if(play){
  const stage=document.getElementById('stage'),scroll=document.getElementById('scroll');
  const control=document.createElement('button');control.type='button';control.id='royalCalcCylinderButton';
  control.setAttribute('aria-label','פתח מחשבון להזנת פונקציה');
  control.title='פתיחת מחשבון';
  control.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open('',document.getElementById('scroll')||control)});
  control.addEventListener('pointerup',e=>e.stopPropagation());
  scroll.appendChild(control);
  let page=0;
  function status(){return window.__MAMLACHAT_PLAY_STATUS__?.()||{power:false,mode:'linear'}}
  function virtual(on){stage.classList.toggle('royalcalc-third',on)}
  function setPage(mode){page=mode==='general'?2:mode==='quadratic'?1:0;virtual(page===2)}
  window.__ROYAL_PLAY_SET_PAGE__=setPage;
  const frameCylinder=document.getElementById('perfectCylinder');
  function travel(dir,e){
    if(overlay.classList.contains('royal-open')||status().power||stage.classList.contains('cylinder-spinning'))return;
    e.preventDefault();e.stopImmediatePropagation();
    // This is the ORIGINAL iframe's 2550ms animation. Dials wait for its end event.
    stage.classList.add('cylinder-spinning');
    frameCylinder?.contentWindow?.postMessage({type:dir>0?'cylinder:spinNext':'cylinder:spinPrev'},'*');
  }
  const prev=document.getElementById('scrollPrev'),next=document.getElementById('scrollNext');
  for(const [el,dir] of [[prev,-1],[next,1]])if(el)el.addEventListener('pointerup',e=>travel(dir,e),true);
  scroll?.addEventListener('pointerup',e=>{
    if(e.target===prev||e.target===next||e.target===control)return;
    travel(1,e);
  },true);
  window.__ROYAL_PLAY_RESET_PAGE__=()=>setPage(status().general?'general':status().mode==='parabola'?'quadratic':'linear');
  window.addEventListener('message',e=>{
    if(e.source!==frameCylinder?.contentWindow||e.data?.type!=='cylinder:page-changed')return;
    setPage(e.data.key);
  });
  window.__ROYAL_PLAY_RESET_PAGE__();
  window.addEventListener('focus',()=>{if(status().power)window.__ROYAL_PLAY_RESET_PAGE__()});
}
})();