/* Royal calculator: shared, realm-specific drag-and-resize layout; no math or socket logic. */
(()=>{'use strict';
 if(window.RoyalCalcLayout)return;
 const style=document.createElement('style');style.id='royal-calc-layout-v1';
 style.textContent=`
 .royal-layout-tools{position:absolute;left:5px;top:-49px;z-index:5;display:flex;align-items:center;gap:7px;direction:rtl;color:#ffecbe;font:600 12px Arial,'Noto Sans Hebrew',sans-serif;background:rgba(23,15,46,.96);border:1px solid #cfa86a;border-radius:22px;padding:5px 8px;box-shadow:0 4px 14px #0a0613a8;pointer-events:auto;white-space:nowrap;user-select:none}
 .royal-layout-handle{background:transparent;border:0;color:#ffecbe;font:inherit;cursor:grab;padding:4px 8px;touch-action:none}
 .royal-layout-handle:active{cursor:grabbing}
 .royal-layout-tools input[type=range]{width:83px;accent-color:#aa76fc;cursor:ew-resize;vertical-align:middle}
 .royal-layout-reset{border:1px solid #ba9dcd;border-radius:12px;background:#372456;color:#fff4da;padding:4px 8px;font:inherit;cursor:pointer}
 .royal-layout-reset:hover,.royal-layout-handle:hover{filter:brightness(1.24)}
 @media(max-width:640px){.royal-layout-tools{top:-43px;gap:3px;padding:3px 5px;font-size:11px}.royal-layout-tools input[type=range]{width:62px}.royal-layout-handle{padding:4px}}
 `;document.head.appendChild(style);
 function create({card,overlay,storageKey,reposition}){
   let saved=null,activePosition=null,defaultPosition=null;
   try{const obj=JSON.parse(localStorage.getItem(storageKey)||'null');if(obj&&Number.isFinite(obj.x)&&Number.isFinite(obj.y)&&Number.isFinite(obj.scale)){saved={x:obj.x,y:obj.y,scale:Math.max(.60,Math.min(1.50,obj.scale))}}}catch(_e){}
   const tools=document.createElement('div');tools.className='royal-layout-tools';tools.setAttribute('aria-label','התאמת גודל ומיקום המחשבון');
   tools.innerHTML='<button type="button" class="royal-layout-handle" title="גרור להזזת המחשבון" aria-label="גרור להזזת המחשבון">⠿ הזזה</button><label>גודל <input type="range" min="60" max="150" value="100" step="5" aria-label="גודל המחשבון"></label><button type="button" class="royal-layout-reset" title="איפוס המיקום והגודל">איפוס</button>';
   card.appendChild(tools);
   const drag=tools.querySelector('.royal-layout-handle'),slider=tools.querySelector('input'),reset=tools.querySelector('.royal-layout-reset');
   const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
   function fit(x,y,width){
     const maxW=Math.min(innerWidth-24,(innerHeight-92)*1672/941);
     const w=clamp(width,Math.min(140,maxW),Math.max(140,maxW));
     const h=w*941/1672;
     const left=clamp(x,w/2+8,innerWidth-w/2-8);
     // Reserve 50px above card for its drag / scale controls.
     const top=clamp(y,h/2+55,innerHeight-h/2-8);
     card.style.setProperty('width',w+'px','important');
     card.style.setProperty('left',left+'px','important');
     card.style.setProperty('top',top+'px','important');
     activePosition={left,top,width:w};return activePosition;
   }
   function persist(){if(!activePosition||!defaultPosition)return;
     saved={x:activePosition.left/innerWidth,y:activePosition.top/innerHeight,scale:Number(slider.value)/100};
     try{localStorage.setItem(storageKey,JSON.stringify(saved))}catch(_e){}
   }
   function layout(def){
     defaultPosition=def;
     const scale=saved?.scale||1;
     slider.value=String(Math.round(scale*100/5)*5);
     const x=saved? saved.x*innerWidth:def.left;
     const y=saved? saved.y*innerHeight:def.top;
     return fit(x,y,def.width*scale);
   }
   let pointer=null;
   drag.addEventListener('pointerdown',e=>{
     if(e.button!==0)return;
     e.preventDefault();e.stopPropagation();
     const r=activePosition||{left:card.getBoundingClientRect().left,top:card.getBoundingClientRect().top};
     pointer={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};
     drag.setPointerCapture(e.pointerId);
   });
   drag.addEventListener('pointermove',e=>{
     if(!pointer||pointer.id!==e.pointerId||!activePosition)return;
     e.preventDefault();
     fit(pointer.left+(e.clientX-pointer.x),pointer.top+(e.clientY-pointer.y),activePosition.width);
   });
   function finish(e){if(!pointer||pointer.id!==e.pointerId)return;pointer=null;persist()}
   drag.addEventListener('pointerup',finish);drag.addEventListener('pointercancel',finish);
   slider.addEventListener('input',()=>{
     if(!defaultPosition)return;
     const scale=Number(slider.value)/100;
     const current=activePosition||defaultPosition;
     fit(current.left,current.top,defaultPosition.width*scale);persist();
   });
   reset.addEventListener('click',()=>{
     saved=null;try{localStorage.removeItem(storageKey)}catch(_e){}
     slider.value='100';if(typeof reposition==='function')reposition();
   });
   return {layout,refresh:()=>{if(defaultPosition)layout(defaultPosition)},read:()=>activePosition};
 }
 window.RoyalCalcLayout={create};
})();
