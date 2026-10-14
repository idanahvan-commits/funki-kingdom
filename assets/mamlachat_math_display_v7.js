/* Mamlachat mathematical typography V7 (display-only). Never changes the engine expression.
 * One formatter for cylinder canvas and axes title HTML; no external font or CDN.
 */
(function(g){'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function norm(raw){
 let t=String(raw==null?'':raw).trim().replace(/[−–]/g,'-').replace(/[²³]/g,c=>c==='²'?'^2':'^3');
 t=t.replace(/\bpi\b/gi,'π').replace(/\*\*/g,'^')
   .replace(/\+\s*-/g,'-').replace(/-\s*-/g,'+').replace(/\+\s*\+/g,'+')
   .replace(/(^|[=+\-(/])\s*1\s*\*\s*(?=x(?:\b|\^))/g,'$1')
   .replace(/(^|[=+\-(/])\s*1\s*(?=x(?:\b|\^))/g,'$1');
 // Implicit multiplication for numerical coefficients is conventional; do not modify parser data.
 t=t.replace(/(\d)\s*\*\s*(?=x\b|x\^)/gi,'$1');
 t=t.replace(/\b0\*x(?:\^\d+)?\+/g,'');
 return t;
}
function balanced(s,at){let d=0;for(let j=at;j<s.length;j++){if(s[j]==='(')d++;if(s[j]===')'&&!--d)return j;}return -1}
function expAt(s,start){
 const c=s[start];if(c==='('){const end=balanced(s,start);if(end>=0)return{value:s.slice(start+1,end),end:end+1}}
 if(c==='{'){const end=s.indexOf('}',start+1);if(end>=0)return{value:s.slice(start+1,end),end:end+1}}
 const m=s.slice(start).match(/^([+\-]?(?:\d+(?:\.\d+)?|[a-zA-Z]))/);
 return m?{value:m[1],end:start+m[1].length}:null;
}
function fractionAt(s,i){
 // Stack only obvious fraction atoms; nested or ambiguous division remains clear with a / glyph.
 const sub=s.slice(i);const m=sub.match(/^((?:\d+(?:\.\d+)?|x|π|e))\s*\/\s*(\(([^()]*)\)|(?:\d+(?:\.\d+)?|x|π|e))(?=$|[^\w])/i);
 return m?{num:m[1],den:m[3]??m[2],end:i+m[0].length}:null;
}
function parse(s,depth=0){
 if(depth>12)return [{type:'text',value:s}];
 const nodes=[];let buf='';const flush=()=>{if(buf){nodes.push({type:'text',value:buf});buf=''}};
 for(let i=0;i<s.length;){
  const prefix=s.slice(i).match(/^(sqrt|abs)\s*\(/i);
  if(prefix){const open=i+prefix[0].length-1,end=balanced(s,open);
   if(end>=0){flush();nodes.push({type:prefix[1].toLowerCase()==='sqrt'?'root':'abs',children:parse(s.slice(open+1,end),depth+1)});i=end+1;continue}}
  if(s[i]==='^'){const e=expAt(s,i+1);if(e){flush();nodes.push({type:'sup',children:parse(e.value,depth+1)});i=e.end;continue}}
  const fr=fractionAt(s,i);if(fr){flush();nodes.push({type:'frac',num:parse(fr.num,depth+1),den:parse(fr.den,depth+1)});i=fr.end;continue}
  buf+=s[i++];
 }
 flush();return nodes;
}
function nodes(raw){return parse(norm(raw))}
function htmlNodes(parts){return parts.map(n=>{
 if(n.type==='text')return esc(n.value).replace(/\*/g,'<span class="mmd-mult">·</span>').replace(/-/g,'−');
 if(n.type==='sup')return '<sup class="mmd-exp">'+htmlNodes(n.children)+'</sup>';
 if(n.type==='root')return '<span class="mmd-root">√<span class="mmd-radicand">'+htmlNodes(n.children)+'</span></span>';
 if(n.type==='abs')return '|'+htmlNodes(n.children)+'|';
 if(n.type==='frac')return '<span class="mmd-frac"><span class="mmd-num">'+htmlNodes(n.num)+'</span><span class="mmd-den">'+htmlNodes(n.den)+'</span></span>';
 return '';
}).join('')}
function html(raw){return htmlNodes(nodes(raw))}
const css=`
.mmd-exp{font-size:.57em!important;line-height:0!important;vertical-align:baseline!important;position:relative!important;top:-.65em!important;font-weight:inherit!important;}
.mmd-frac{display:inline-flex;vertical-align:middle;flex-flow:column nowrap;align-items:center;justify-content:center;line-height:.93;font-size:.63em;margin:0 .10em;position:relative;top:-.07em;white-space:nowrap;}
.mmd-num,.mmd-den{display:block;padding:0 .12em;text-align:center;line-height:1.05;white-space:nowrap;}
.mmd-num{border-bottom:1.6px solid currentColor;padding-bottom:.09em;min-width:1.35em;}
.mmd-den{padding-top:.1em}
.mmd-root{display:inline-flex;align-items:baseline;white-space:nowrap;vertical-align:baseline;}
.mmd-radicand{display:inline-block;border-top:1.6px solid currentColor;padding:0 .07em .01em;margin-top:.09em;}
.mmd-mult{font-size:.8em;margin:0 .02em;vertical-align:middle}
`;
function attachCss(doc=document){if(doc.getElementById('mamlachat-math-display-style'))return;
 const style=doc.createElement('style');style.id='mamlachat-math-display-style';style.textContent=css;(doc.head||doc.documentElement).appendChild(style)}
function drawCanvas(ctx,raw,cx,cy,options={}){
 const f=options.font||'Georgia',weight=options.weight||'700',italic=options.italic||'italic';
 const target=options.fontSize||45,maxWidth=options.maxWidth||Infinity,maxHeight=options.maxHeight||Infinity;
 const parts=nodes(raw),hasSuper=JSON.stringify(parts).includes('"sup"'),special=hasSuper||JSON.stringify(parts).includes('"frac"')||JSON.stringify(parts).includes('"root"');
 const nodeMeasure=(p,fs)=>{
  const set=(sz)=>{ctx.font=`${italic} ${weight} ${Math.round(sz)}px ${f}`};
  const go=arr=>arr.reduce((w,n)=>{
    if(n.type==='text'){set(fs);return w+ctx.measureText(n.value.replace(/\*/g,'·').replace(/-/g,'−')).width}
    if(n.type==='sup'){set(fs*.55);return w+nodeMeasure(n.children,fs*.55)+fs*.02}
    if(n.type==='root'){set(fs);return w+ctx.measureText('√').width+nodeMeasure(n.children,fs*.83)+fs*.08}
    if(n.type==='abs'){set(fs);return w+2*ctx.measureText('|').width+nodeMeasure(n.children,fs)}
    if(n.type==='frac')return w+Math.max(nodeMeasure(n.num,fs*.59),nodeMeasure(n.den,fs*.59))+fs*.17;
    return w;},0);
  return go(p)
 };
 let fs=target;if(special)fs=Math.min(fs,maxHeight*.78);
 while(fs>14&&nodeMeasure(parts,fs)>maxWidth)fs-=2;
 const total=nodeMeasure(parts,fs);let at=cx-total/2;
 const print=(arr,size,y)=>{
  arr.forEach(n=>{
   const font=sz=>{ctx.font=`${italic} ${weight} ${Math.round(sz)}px ${f}`};
   if(n.type==='text'){font(size);const t=n.value.replace(/\*/g,'·').replace(/-/g,'−');ctx.fillText(t,at,y);at+=ctx.measureText(t).width;return}
   if(n.type==='sup'){at+=size*.01;print(n.children,size*.55,y-size*.43);at+=size*.01;return}
   if(n.type==='abs'){font(size);ctx.fillText('|',at,y);at+=ctx.measureText('|').width;print(n.children,size,y);ctx.fillText('|',at,y);at+=ctx.measureText('|').width;return}
   if(n.type==='root'){font(size);ctx.fillText('√',at,y);at+=ctx.measureText('√').width;const a=at;print(n.children,size*.83,y+size*.04);const b=at;ctx.save();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(1.5,size*.025);ctx.beginPath();ctx.moveTo(a,y-size*.47);ctx.lineTo(b+size*.04,y-size*.47);ctx.stroke();ctx.restore();at+=size*.08;return}
   if(n.type==='frac'){const w=Math.max(nodeMeasure(n.num,size*.59),nodeMeasure(n.den,size*.59))+size*.17,origin=at;
     at=origin+(w-nodeMeasure(n.num,size*.59))/2;print(n.num,size*.59,y-size*.25);
     at=origin+(w-nodeMeasure(n.den,size*.59))/2;print(n.den,size*.59,y+size*.29);
     ctx.save();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(1.5,size*.028);ctx.beginPath();ctx.moveTo(origin+size*.07,y);ctx.lineTo(origin+w-size*.07,y);ctx.stroke();ctx.restore();at=origin+w;return}
  });
 };
 ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.direction='ltr';print(parts,fs,cy);ctx.restore();
 return {fontSize:fs,width:total,text:norm(raw),superscript:hasSuper};
}
g.MamlachatMathV7=Object.freeze({version:'7.0',normalize:norm,html,canvas:drawCanvas,css,attachCss,nodes});
})(window);
