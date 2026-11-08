(function(root){
'use strict';
function arrayValue(src,name){
 const m=new RegExp('\\b(?:const|let|var)\\s+'+name+'\\s*=\\s*\\[').exec(src);
 if(!m)return '';
 const start=m.index+m[0].length-1;let depth=0,quoted=false,escaped=false;
 for(let i=start;i<src.length;i++){const c=src[i];
  if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}
  else if(c==='"')quoted=true;
  else if(c==='[')depth++;
  else if(c===']'&&!--depth)return src.slice(start,i+1);
 }return '';
}
function clean(v,n=3000){return String(v==null?'':v).replace(/<\s*br\s*\/?\s*>/gi,' ')
 .replace(/<\s*\/\s*u\s*>/gi,'\uE001').replace(/<\s*u(?:\s[^>]*)?>/gi,'\uE000')
 .replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
 .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"')
 .replace(/&#39;|&apos;/gi,"'").replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,n)
 .replace(/\uE000/g,'<u>').replace(/\uE001/g,'</u>');}
function answers(v){const a=Array.isArray(v)?v.flat(Infinity):[v];
 return [...new Set(a.map(x=>clean(x,250)).filter(Boolean))].join(' | ');}
function sectionsToQuiz(secs){const questions=[],skipped=[];
 secs.forEach((sec,si)=>{const label=clean(sec.title||sec.short||'Phần '+(si+1),160);
  (Array.isArray(sec.items)?sec.items:[]).forEach((item,ii)=>{
   const prefix=label+' · Câu '+(item.num||ii+1)+': ';
   const e=clean(item.explain||item.exp||'',2200);
   if(sec.type==='mcq'){
    const o=Array.isArray(item.opts)?item.opts.map(x=>clean(x,500)):[];
    if(o.length<2||o.some(x=>!x)||!Number.isInteger(item.correct)||item.correct<0||item.correct>=o.length)
     {skipped.push(prefix+'thiếu đáp án');return;}
    questions.push({type:'mc',q:prefix+clean(item.text,1400),o,a:item.correct,e,s:label,passage:''});
   }else if(sec.type==='fill'){
    const parts=Array.isArray(item.parts)?item.parts.map(x=>clean(x,900)):[];
    const a=Array.isArray(item.ans)?item.ans:[];
    if(!a.length||parts.length!==a.length+1){skipped.push(prefix+'số ô trống không khớp đáp án');return;}
    const sentence=parts.map((p,i)=>p+(i<a.length?' ['+(i+1)+'] ______ ':'')).join('');
    a.forEach((v,j)=>{const ansText=answers(v);if(!ansText){skipped.push(prefix+'ô '+(j+1)+' thiếu đáp án');return;}
     questions.push({type:'text',q:prefix+sentence+(a.length>1?' (Điền ô '+(j+1)+'/'+a.length+')':''),
      o:[],a:0,ansText,e,s:label,passage:''});});
   }else if(sec.type==='write'){
    const ansText=answers(item.acc||item.show);
    if(!ansText){skipped.push(prefix+'thiếu đáp án viết');return;}
    questions.push({type:'text',q:prefix+clean(item.cue,1400)+(item.pre?' Bắt đầu: '+clean(item.pre,160):''),
     o:[],a:0,ansText,e,s:label,passage:''});
   }else if(sec.type==='errfix'){
    if(!Number.isInteger(item.correct)||item.correct<0||item.correct>3)
     {skipped.push(prefix+'thiếu vị trí lỗi');return;}
    questions.push({type:'mc',q:prefix+clean(item.text,1500).replace(/\s*Bấm chữ cái[^:]*:\s*/i,' ').trim()+' Chọn phần sai; xem cách sửa trong lời giải.',
     o:['A','B','C','D'],a:item.correct,e:(item.fix?'Sửa thành: '+answers(item.fix)+'. ':'')+e,s:label,passage:''});
   }else skipped.push(prefix+'dạng '+sec.type+' cần AI đọc');
  });
 });return {questions,skipped,complete:!skipped.length};
}
function compactSections(secs){return 'Dữ liệu đề gốc (giữ đáp án):\n'+JSON.stringify(secs.map(s=>({
 type:s.type,title:clean(s.title,160),desc:clean(s.desc,400),
 items:(s.items||[]).map(i=>({text:clean(i.text,1000),opts:i.opts,correct:i.correct,
  parts:i.parts,ans:i.ans,cue:clean(i.cue,1000),acc:i.acc,fix:i.fix}))
}))).slice(0,30000);}
function compactHtml(html,scripts){
 const visible=clean(html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/<(?:nav|header|footer)\b[^>]*>[\s\S]*?<\/(?:nav|header|footer)>/gi,''),7000);
 const candidates=scripts.map((script,index)=>{
  const terms=script.match(/\b(?:correct|answer|answers|opts|options|question|questions|quizData|SECS|QS|AII_DATA|mcq|fill|w20|w21)\b/gi)||[];
  const calls=script.match(/\b(?:mcq|w20|w21|fill)\s*\(/g)||[];
  const anchor=script.search(/\b(?:SECS|QS|QUESTIONS|quizData|AII_DATA)\s*=\s*\[|\b(?:mcq|w20|w21)\s*\(/);
  return {script,index,score:terms.length+calls.length*3,anchor:Math.max(0,anchor)};
 }).filter(x=>x.score>=3).sort((a,b)=>b.score-a.score);
 let data='';
 for(const item of candidates.slice(0,3)){
  const budget=23000-data.length;if(budget<1000)break;
  const start=Math.max(0,item.anchor-250);
  data+='\n[Script dữ liệu '+(item.index+1)+']\n'+item.script.slice(start,start+budget);
 }
 return 'Nội dung bài tập (không thực thi mã trang):\n'+visible+
  '\n\nDữ liệu câu hỏi và đáp án trong mã trang:\n'+data;
}

function jsArray(src,name){
 const re=new RegExp('\\b(?:const|let|var)\\s+'+name+'\\s*=\\s*\\[','g');
 let m;while((m=re.exec(src))){const start=m.index+m[0].length-1;let depth=0,quote='',esc=false,line=false,block=false;
 for(let i=start;i<src.length;i++){const c=src[i],n=src[i+1];
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
  if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote='';continue;}
  if(c==='/'&&n==='/'){line=true;i++;continue;}
  if(c==='/'&&n==='*'){block=true;i++;continue;}
  if(c==='"'||c==="'"||c.charCodeAt(0)===96){quote=c;continue;}
  if(c==='[')depth++;
  else if(c===']'&&!--depth){const value=src.slice(start,i+1);if(value.length>2)return value;re.lastIndex=i+1;break;}
 }}return '';
}
function objectParts(arrayText){
 const out=[];let start=-1,depth=0,quote='',esc=false,line=false,block=false;
 for(let i=1;i<arrayText.length-1;i++){const c=arrayText[i],n=arrayText[i+1];
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
  if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote='';continue;}
  if(c==='/'&&n==='/'){line=true;i++;continue;}
  if(c==='/'&&n==='*'){block=true;i++;continue;}
  if(c==='"'||c==="'"||c.charCodeAt(0)===96){quote=c;continue;}
  if(c==='{'){if(depth++===0)start=i;}
  else if(c==='}'&&--depth===0&&start>=0){out.push(arrayText.slice(start,i+1));start=-1;}
 }return out;
}
function quoted(src,pos){
 const quote=src[pos];if(quote!=='"'&&quote!=="'"&&quote.charCodeAt(0)!==96)return null;
 let value='',escaped=false;
 for(let i=pos+1;i<src.length;i++){const c=src[i];
  if(escaped){value+=c==='n'?'\n':c==='t'?'\t':c;escaped=false;}
  else if(c==='\\')escaped=true;
  else if(c===quote)return value;
  else value+=c;
 }return null;
}
function property(obj,key){
 const m=new RegExp('\\b'+key+'\\s*:\\s*').exec(obj);if(!m)return null;
 const pos=m.index+m[0].length,c=obj[pos];
 if(c==='"'||c==="'"||c.charCodeAt(0)===96)return quoted(obj,pos);
 if(c==='['){const end=jsArray('const X='+obj.slice(pos),'X');return end||null;}
 const n=/^-?\d+/.exec(obj.slice(pos));return n?Number(n[0]):null;
}
function stringList(src){
 if(typeof src!=='string'||src[0]!=='[')return [];
 const out=[];let i=1;
 while(i<src.length-1){while(/[\s,]/.test(src[i]||'')&&i<src.length-1)i++;
  if(src[i]==='"'||src[i]==="'"||src.charCodeAt(i)===96){
   const quote=src[i],start=i++,v=quoted(src,start);if(v===null)return [];
   out.push(v);let esc=false;
   for(;i<src.length;i++){if(esc)esc=false;else if(src[i]==='\\')esc=true;else if(src[i]===quote){i++;break;}}
  }else if(src[i]===']')break;
  else return [];
 }return out;
}
function passagesIn(html){
 if(typeof DOMParser==='undefined')return [];
 const doc=new DOMParser().parseFromString(html,'text/html');
 return [...doc.querySelectorAll('.pblk,.reading-text,.reading-passage,.passage')]
  .map(el=>clean((el.querySelector('.paragraph,.reading-content,.passage-text')||el).textContent,7000)).filter(x=>x.length>30);
}

function optList(src){
 if(typeof src!=='string'||src[0]!=='[')return null;
 const options=[];let correct=-1;
 const re=/\bOPT\s*\(/g;let m;
 while((m=re.exec(src))){let i=re.lastIndex,depth=1,quote='',esc=false;
  for(;i<src.length;i++){const c=src[i];
   if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote='';continue;}
   if(c==='"'||c==="'"||c.charCodeAt(0)===96){quote=c;continue;}
   if(c==='(')depth++;
   else if(c===')'&&!--depth)break;
  }
  if(depth)return null;
  const args=src.slice(re.lastIndex,i),pos=args.search(/\S/);
  if(pos<0)return null;
  const value=quoted(args,pos);if(value===null)return null;
  options.push(value);
  if(/,\s*1\s*$/.test(args)){if(correct>=0)return null;correct=options.length-1;}
  re.lastIndex=i+1;
 }
 return options.length>=2?{options,correct}:null;
}

function parseSimple(raw,html){
 const parts=objectParts(raw),passages=passagesIn(html),questions=[],skipped=[];
 parts.forEach((part,i)=>{
  const q=property(part,'qText')||property(part,'question')||property(part,'text')||property(part,'q');
  const opt=optList(property(part,'opts'));
  const o=opt?opt.options:stringList(property(part,'options'));
  const key=property(part,'correctText')??property(part,'correct')??property(part,'answer');
  let a=opt?opt.correct:(typeof key==='number'?key:-1);
  if(typeof key==='string'){
   a=o.findIndex(x=>clean(x).toLowerCase()===clean(key).toLowerCase());
   if(a<0&&/^[A-F]$/i.test(key))a=key.toUpperCase().charCodeAt(0)-65;
  }
  if(!q||o.length<2||a<0||a>=o.length){skipped.push('Câu '+(i+1)+' chưa có đáp án rõ ràng');return;}
  const partNo=property(part,'part');
  const passage=passages.length===1?passages[0]:(Number.isInteger(partNo)?passages[partNo-1]||'':'');
  const question=clean(q,1400);
  if(/passage\s*\d/i.test(question)&&!passage){skipped.push('Câu '+(i+1)+' thiếu đoạn đọc');return;}
  questions.push({type:'mc',q:question,o:o.map(x=>clean(x,500)),a,
   e:clean(property(part,'hint')||'',500),s:'',passage});
 });
 return {questions,skipped,complete:!!parts.length&&!skipped.length};
}

function parse(html){
 const tm=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html),title=clean(tm?tm[1]:'Bài tập tiếng Anh',180);
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
 for(const script of scripts){const raw=arrayValue(script,'SECS');if(!raw)continue;
  try{const secs=JSON.parse(raw);if(Array.isArray(secs)&&secs.length)
   return {title,...sectionsToQuiz(secs),aiInput:compactSections(secs),format:'SECS'};
  }catch(_){}}
 for(const script of scripts){for(const name of ['QS','QUESTIONS','quizData']){
  const raw=jsArray(script,name);if(!raw)continue;
  const result=parseSimple(raw,html);
  if(result.questions.length)return {title,...result,aiInput:compactHtml(html,scripts),format:name};
 }}
 return {title,questions:[],skipped:[],complete:false,aiInput:compactHtml(html,scripts),format:'other'};
}
root.GCLink={parse};
})(typeof window==='undefined'?globalThis:window);
