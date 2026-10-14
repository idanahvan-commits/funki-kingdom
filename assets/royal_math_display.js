/* Single presentation-only renderer shared by all kingdoms. Never mutates the evaluatable expression. */
(function(root){
'use strict';
const U={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','+':'⁺','n':'ⁿ','x':'ˣ','(':'⁽',')':'⁾'};
const encoded={'²':'^2','³':'^3','⁴':'^4','⁵':'^5','⁶':'^6','⁷':'^7','⁸':'^8','⁹':'^9'};
function normalize(raw){
 let s=String(raw==null?'':raw).trim();
 s=s.replace(/\u2212/g,'-').replace(/\b(?:Math\.)?PI\b/gi,'π').replace(/\bpi\b/gi,'π')
    .replace(/\bsqrt\s*\(/gi,'√(').replace(/\bcbrt\s*\(/gi,'∛(');
 for(const k of Object.keys(encoded))s=s.replaceAll(k,encoded[k]);
 s=s.replace(/\+\s*-/g,'-').replace(/-\s*-/g,'+').replace(/\+\s*\+/g,'+');
 // Omit implicit coefficient one only when it is a multiplier of x, never constants.
 s=s.replace(/(^|[=+\-(])\s*1\s*\*\s*x(?=\b|\^)/gi,'$1x')
    .replace(/(^|[=+\-(])\s*1x(?=\b|\^)/gi,'$1x')
    .replace(/(^|[=+\-(])\s*-1\s*\*\s*x(?=\b|\^)/gi,'$1-x')
    .replace(/(\d)\s*\*\s*x\b/gi,'$1x')
    .replace(/\s*\*\s*/g,'·')
    .replace(/\s*\+\s*/g,' + ').replace(/\s*-\s*/g,' − ')
    .replace(/\s*=\s*/g,' = ').replace(/\s+/g,' ').replace(/\^\s*−\s*(\d+)/g,'^-$1').replace(/\^\s*\(\s*−\s*(\d+)\s*\)/g,'^(-$1)').trim()
    .replace(/^−\s+/,'−');
 return s;
}
function superscript(s){return String(s).split('').map(c=>U[c]||c).join('');}
function plain(raw){return normalize(raw).replace(/\^\s*\(([^()]*)\)|\^\s*([-+\dxn]+)/gi,(_,a,b)=>superscript((a||b).replace(/\s+/g,'')));}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hasTopAdd(value){
 let depth=0;
 for(let i=0;i<value.length;i++){
  const c=value[i];if(c==='(')depth++;else if(c===')')depth--;
  else if((c==='+'||c==='−'||c==='-')&&depth===0&&i>0)return true;
 }return false;
}
function splitTopFraction(s){
 let depth=0;for(let i=0;i<s.length;i++){
  if(s[i]==='(')depth++;else if(s[i]===')')depth--;
  else if(s[i]==='/'&&depth===0&&s.slice(0,i).trim()&&s.slice(i+1).trim()){
   const a=s.slice(0,i).trim(),b=s.slice(i+1).trim();
   if(hasTopAdd(a)||hasTopAdd(b))continue;
   return [a,b];
  }
 }return null;
}
function markup(raw){
 let s=normalize(raw),eq=s.indexOf('=');
 let prefix=eq>=0?s.slice(0,eq+1)+' ':'';
 let body=eq>=0?s.slice(eq+1).trim():s;
 const fraction=splitTopFraction(body);
 function partial(value){
  let escaped=esc(value);
  return escaped.replace(/\^\s*\(([^()]*)\)|\^\s*([-+\dxn]+)/gi,(_,a,b)=>'<sup class="kingdom-exp">'+esc(a||b)+'</sup>');
 }
 if(fraction){const x=fraction.map(v=>v.trim().replace(/^\((.*)\)$/,'$1'));
  return esc(prefix)+'<span class="kingdom-fraction"><span>'+partial(x[0])+'</span><span>'+partial(x[1])+'</span></span>';
 }
 return partial(prefix+body);
}
function render(el,value){
 if(!el)return;const src=String(value==null?'':value),pretty=markup(src);
 if(el.innerHTML!==pretty)el.innerHTML=pretty;
 el.dataset.kingdomMathRendered='1';
}
function auto(){
 const targets=['#formulaLive','#approvedFunctionTitle .rhs-main','#functionPlugBadge','#v25GTitleStable .eq','#v34GTitle .eq','#v24GTitle .eq','.function-plaque>div'];
 for(const query of targets){
  const host=document.querySelector(query);if(!host)continue;
  let guard=false;
  function maybe(){
   const node=host.id==='formulaLive'?host.querySelector('span'):host;
   if(!node||guard||node.querySelector('.kingdom-exp,.kingdom-fraction'))return;
   const t=node.textContent||'';
   if(!t||(!/\^|\*|sqrt\(|cbrt\(|\//.test(t)&&!/1x|\+\s*-/.test(t)))return;
   guard=true;render(node,t);guard=false;
  }
  new MutationObserver(maybe).observe(host,{childList:true,characterData:true,subtree:true});
  maybe();
 }
}
const css=document.createElement('style');css.id='kingdom-math-presentation-style';css.textContent='.kingdom-exp{font-size:.65em;line-height:0;vertical-align:super;position:relative;top:-.06em}.kingdom-fraction{display:inline-flex;vertical-align:middle;flex-direction:column;align-items:center;justify-content:center;line-height:1.02;font-size:.78em}.kingdom-fraction>span:first-child{border-bottom:1.6px solid currentColor;padding:0 .17em .12em}.kingdom-fraction>span:last-child{padding:.12em .17em 0}';document.head.appendChild(css);
root.MamlachatMathDisplay=Object.freeze({normalize,plain,markup,render});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto,{once:true});else auto();
})(window);
