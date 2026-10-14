(()=>{
'use strict';
class V41LeftPanel extends HTMLElement{
  constructor(){super();this._page=1;this._busy=false;}
  connectedCallback(){
    if(this.shadowRoot)return;
    const root=this.attachShadow({mode:'open'});
    root.innerHTML=`
<style>
:host{display:block;width:260px;height:494px;user-select:none;contain:layout style paint;filter:drop-shadow(0 7px 10px rgba(5,2,24,.42))}
*{box-sizing:border-box}.panel{position:relative;width:260px;height:494px;overflow:visible;isolation:isolate}
.fixed-bg{position:absolute;left:5.2%;right:5.2%;top:10%;bottom:8.7%;border-radius:9.2%/5.2%;background:radial-gradient(circle at 50% 36%,rgba(55,20,150,.34),transparent 38%),linear-gradient(180deg,#1c0875 0%,#14045f 55%,#10034f 100%);z-index:0;pointer-events:none;clip-path:polygon(12% 3.8%,88% 3.8%,96% 8%,100% 14%,100% 100%,0 100%,0 14%,4% 8%)}
.top-fill{position:absolute;left:16.1%;right:16.1%;top:7.2%;height:6.55%;z-index:1;pointer-events:none;background:radial-gradient(circle at 50% 58%,rgba(83,38,190,.24),transparent 74%),linear-gradient(180deg,#251084 0%,#1d0977 58%,#180568 100%);clip-path:polygon(0 100%,0 88%,5% 66%,12% 45%,22% 25%,33% 16%,43% 25%,50% 40%,57% 25%,67% 16%,78% 25%,88% 45%,95% 66%,100% 88%,100% 100%)}
.viewport{position:absolute;inset:0;overflow:hidden;z-index:2;clip-path:inset(9.8% 8.4% 8.1% 8.4% round 3.2%)}
.page{position:absolute;inset:0;opacity:0;pointer-events:none}.page.active{opacity:1;z-index:2;pointer-events:auto}.page>img.art{position:absolute;width:86%;height:86%;left:7%;top:7.2%;object-fit:contain;display:block;pointer-events:none}
.frame{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:10;pointer-events:none}
.nav{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border:0;padding:0;border-radius:50%;background:transparent;cursor:pointer;z-index:30;transition:transform .14s ease,filter .14s ease}.nav svg{width:100%;height:100%;display:block;overflow:visible}.prev{left:-25px}.next{right:-25px}.nav:hover{transform:translateY(-50%) scale(1.08);filter:drop-shadow(0 0 7px rgba(255,211,68,.78))}.nav:active{transform:translateY(-50%) scale(.93)}
.action{position:absolute;padding:0;margin:0;border:0;background:transparent;overflow:hidden;cursor:pointer;z-index:6;outline:none;touch-action:manipulation}.action img{position:absolute;pointer-events:none;max-width:none;max-height:none}.action:hover{filter:brightness(1.10) drop-shadow(0 0 5px rgba(255,220,92,.45))}.action:focus-visible{outline:2px solid rgba(255,244,194,.95);outline-offset:-3px}
</style>
<div class="panel">
 <div class="fixed-bg"></div><div class="top-fill"></div>
 <div class="viewport">
   <div class="page active" data-page="1"><img class="art" src="components/left_panel/assets/page1.png" alt=""></div>
   <div class="page" data-page="2"><img class="art" src="components/left_panel/assets/page2.png" alt=""></div>
   <div class="page" data-page="3"><img class="art" src="components/left_panel/assets/page3.png" alt=""></div>
 </div>
 <img class="frame" src="components/left_panel/assets/frame.png" alt="">
 <button class="nav prev" aria-label="הדף הקודם"><svg viewBox="0 0 64 64"><defs><radialGradient id="bp" cx="34%" cy="28%" r="76%"><stop offset="0" stop-color="#69e5ff"/><stop offset=".46" stop-color="#287ded"/><stop offset="1" stop-color="#11106b"/></radialGradient><linearGradient id="gp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff5b0"/><stop offset=".26" stop-color="#ffd64c"/><stop offset=".57" stop-color="#e99a00"/><stop offset="1" stop-color="#7b4100"/></linearGradient></defs><circle cx="32" cy="32" r="29" fill="url(#gp)" stroke="#6d3900" stroke-width="2"/><circle cx="32" cy="32" r="23.5" fill="url(#bp)" stroke="#fff0a0" stroke-width="2"/><path d="M36.5 20.5 L25 32 L36.5 43.5" fill="none" stroke="#fff8d4" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
 <button class="nav next" aria-label="הדף הבא"><svg viewBox="0 0 64 64"><defs><radialGradient id="bn" cx="34%" cy="28%" r="76%"><stop offset="0" stop-color="#69e5ff"/><stop offset=".46" stop-color="#287ded"/><stop offset="1" stop-color="#11106b"/></radialGradient><linearGradient id="gn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff5b0"/><stop offset=".26" stop-color="#ffd64c"/><stop offset=".57" stop-color="#e99a00"/><stop offset="1" stop-color="#7b4100"/></linearGradient></defs><circle cx="32" cy="32" r="29" fill="url(#gn)" stroke="#6d3900" stroke-width="2"/><circle cx="32" cy="32" r="23.5" fill="url(#bn)" stroke="#fff0a0" stroke-width="2"/><path d="M27.5 20.5 L39 32 L27.5 43.5" fill="none" stroke="#fff8d4" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
</div>`;
    this._pages=[...root.querySelectorAll('.page')];
    root.querySelector('.next').addEventListener('click',()=>this.go(1));
    root.querySelector('.prev').addEventListener('click',()=>this.go(-1));
    this._installActions(root);
  }
  _addAction(root,page,action,label,rect){
    const p=root.querySelector(`.page[data-page="${page}"]`); if(!p)return;
    const b=document.createElement('button'); b.className='action'; b.dataset.action=action; b.setAttribute('aria-label',label);
    // rect is in original 910x1729 page-art coordinates. The approved art itself occupies 86% x 86% of the 260x494 panel.
    const panelW=260,panelH=494,artL=panelW*.07,artT=panelH*.072,artW=panelW*.86,artH=panelH*.86;
    const sx=artW/910,sy=artH/1729;
    const left=artL+rect[0]*sx,top=artT+rect[1]*sy,w=rect[2]*sx,h=rect[3]*sy;
    Object.assign(b.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
    const im=document.createElement('img'); im.src=`components/left_panel/assets/page${page}.png`; im.alt='';
    Object.assign(im.style,{width:artW+'px',height:artH+'px',left:(artL-left)+'px',top:(artT-top)+'px'}); b.appendChild(im);
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();this.dispatchEvent(new CustomEvent('v41-left-action',{detail:{action,page:this._page},bubbles:true,composed:true}))});
    p.appendChild(b);
  }
  _installActions(root){
    this._addAction(root,1,'inviteAdults','הזמנת מבוגרים',[38,115,835,490]);
    this._addAction(root,1,'launchAdults','שיגור מבוגרים',[38,620,835,292]);
    this._addAction(root,1,'inviteBabies','הזמנת תינוקות',[38,995,835,355]);
    this._addAction(root,1,'launchBabies','שיגור תינוקות',[38,1360,835,245]);
    this._addAction(root,2,'inviteAll','הזמנת כולם',[35,145,840,665]);
    this._addAction(root,2,'launchAll','שיגור כולם',[35,915,840,655]);
    this._addAction(root,3,'inviteAdults','הזמנת מבוגרים',[35,115,840,650]);
    this._addAction(root,3,'launchAllG','שיגור מבוגרים ל-g',[35,855,840,675]);
  }
  go(delta){if(this._busy)return;this.setPage(((this._page-1+delta+3)%3)+1,true)}
  setPage(n,animate=true){
    n=Math.max(1,Math.min(3,Number(n)||1)); if(n===this._page)return; if(this._busy)return;
    const current=this._pages[this._page-1],incoming=this._pages[n-1],delta=n>this._page?1:-1,dur=720;
    this._busy=true; incoming.style.transition='none';incoming.style.opacity='1';incoming.style.transform=`translateX(${delta>0?'100%':'-100%'})`;incoming.style.zIndex='3';incoming.getBoundingClientRect();
    current.style.transition=`transform ${dur}ms cubic-bezier(.22,.78,.22,1)`;incoming.style.transition=`transform ${dur}ms cubic-bezier(.22,.78,.22,1)`;current.style.transform=`translateX(${delta>0?'-100%':'100%'})`;incoming.style.transform='translateX(0)';
    setTimeout(()=>{current.classList.remove('active');current.style.cssText='';incoming.classList.add('active');incoming.style.cssText='';this._page=n;this._busy=false;this.dispatchEvent(new CustomEvent('v41-left-page',{detail:{page:n},bubbles:true,composed:true}))},animate?dur+30:0);
  }
  get page(){return this._page}
}
customElements.define('v41-left-panel',V41LeftPanel);
})();
