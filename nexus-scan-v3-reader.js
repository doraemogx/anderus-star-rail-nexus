/* Nexus Scan 3 — unified HoYoLab reader. Browser-local OCR and icon matching.
 * Reads two user-supplied official layouts with one pipeline and schema.
 * No screenshots, UIDs or credentials are uploaded to a server.
 */
import {detectLayout,scaledBox,relicCrop,relicImageBox,totalBox,normalize,
 numeric,inferStat,reasonable,chooseReading,blankRelics,recognizeCharacter,
 TOTAL_KEYS,analyzeCompleteness} from './nexus-scan-v3-core.js';

const SIGNATURE_URL='./data/relic-icon-signatures.json';
const GAME_URL='./data/live-game.json';
const RAW='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const TYPE=['HEAD','HAND','BODY','FOOT','NECK','OBJECT'];
let gameCache=null,signatureCache=null,tesseractPromise=null;
export async function catalogue(){
 if(!gameCache)gameCache=fetch(GAME_URL,{cache:'no-store'})
  .then(r=>r.ok?r.json():Promise.reject(Error('Catálogo de personagens indisponível')))
  .catch(e=>{gameCache=null;throw e});
 return gameCache;
}
async function signatures(){
 if(!signatureCache)signatureCache=fetch(SIGNATURE_URL,{cache:'force-cache'})
  .then(r=>r.ok?r.json():Promise.reject(Error('Ícones de relíquias indisponíveis')))
  .then(j=>(j.icons||[]).map(x=>({...x,
   pixels:Uint8Array.from(atob(x.rgba),c=>c.charCodeAt(0))})))
  .catch(e=>{signatureCache=null;throw e});
 return signatureCache;
}
async function library(){
 if(window.Tesseract)return window.Tesseract;
 if(tesseractPromise)return tesseractPromise;
 tesseractPromise=new Promise((resolve,reject)=>{
  const src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const existing=document.querySelector('script[data-nexus-scan-ocr]');
  if(existing){
   existing.addEventListener('load',()=>resolve(window.Tesseract),{once:true});
   existing.addEventListener('error',()=>reject(Error('OCR indisponível')),{once:true});
   return;
  }
  const el=document.createElement('script');el.src=src;el.async=true;el.dataset.nexusScanOcr='1';
  el.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('OCR não iniciou'));
  el.onerror=()=>reject(Error('Não foi possível carregar a biblioteca de leitura'));
  document.head.append(el);
 }).catch(e=>{tesseractPromise=null;throw e});
 return tesseractPromise;
}
function crop(bitmap,template,box,width=520,height=110,mode='binary'){
 const c=document.createElement('canvas');c.width=width;c.height=height;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 const [x,y,w,h]=scaledBox(box,bitmap,template);
 ctx.drawImage(bitmap,x,y,w,h,0,0,width,height);
 if(mode==='raw')return c;
 const im=ctx.getImageData(0,0,width,height);
 for(let i=0;i<im.data.length;i+=4){
  const r=im.data[i],g=im.data[i+1],b=im.data[i+2];
  const brightness=.29*r+.57*g+.14*b;
  // HoYoLab labels and numbers are white/gold on a blue/purple backdrop.
  const text=brightness>(mode==='strong'?164:129)||
   (r>156&&g>114&&b>62)||(b>166&&g>128);
  const v=text?0:255;
  im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
 }
 ctx.putImageData(im,0,0);
 return c;
}
async function ocr(worker,bitmap,template,box,options={}){
 const {mode='binary',width=520,height=100,psm=7,chars=''}=options;
 await worker.setParameters({tessedit_pageseg_mode:String(psm),
  tessedit_char_whitelist:chars});
 const result=await worker.recognize(crop(bitmap,template,box,width,height,mode));
 return String(result?.data?.text||'').trim();
}
async function allNumbers(worker,bitmap,template,box){
 const x=await ocr(worker,bitmap,template,box,
  {width:440,height:100,chars:'0123456789.,%+',mode:'binary'});
 const y=await ocr(worker,bitmap,template,box,
  {width:440,height:100,chars:'0123456789.,%+',mode:'strong'});
 return [x,y];
}
function selectNumeric(texts,min,max,integer=false){
 const values=texts.map(numeric).filter(v=>v!==null&&v>=min&&v<=max&&
  (!integer||Number.isInteger(v)));
 for(const value of values)if(values.filter(x=>Math.abs(x-value)<.1).length>=2)
  return {value,confidence:'checked'};
 if(values.length===1)return {value:values[0],confidence:'review'};
 return {value:null,confidence:'pending'};
}
function charList(data){
 return Object.values(data.chars||{}).filter(x=>x?.id&&x?.name&&x.name!=='{NICKNAME}');
}
function findCone(text,data){
 const raw=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
  .filter(x=>!/^(?:nv|lv|level)\b/i.test(x)&&!/sobrepos/i.test(x));
 const cleaned=normalize(raw.join(' '));
 if(!cleaned)return null;
 const candidates=Object.values(data.cones||{}).filter(x=>x?.name).map(x=>{
  const name=normalize(x.name);
  const a=cleaned===name?1:cleaned.includes(name)&&name.length>7?.98:
   name.includes(cleaned)&&cleaned.length>8?.85:0;
  return {id:String(x.id),name:x.name,score:a};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 if(candidates[0]&&(!candidates[1]||candidates[0].score-candidates[1].score>.08))
  return {...candidates[0],confidence:candidates[0].score>=.98?'exact':'review'};
 // Fuzzy matching allows small OCR errors in the long text of cone names.
 return null;
}
function levenshtein(a,b){
 const row=Array.from({length:b.length+1},(_,j)=>j);
 for(let i=1;i<=a.length;i++){
  let last=row[0];row[0]=i;
  for(let j=1;j<=b.length;j++){
   const hold=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,
    last+(a[i-1]===b[j-1]?0:1));last=hold;
  }
 }
 return row[b.length];
}
export function recognizeCone(text,data){
 const raw=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
  .filter(x=>!/^(?:nv|lv|level)\b/i.test(x)&&!/sobrepos/i.test(x));
 const source=normalize(raw.join(' '));
 if(source.length<5)return null;
 const all=Object.values(data.cones||{}).filter(x=>x?.name).map(x=>{
  const name=normalize(x.name);
  const ratio=levenshtein(source,name)/Math.max(source.length,name.length,1);
  const score=source===name?1:source.includes(name)&&name.length>=8?.99:
   name.includes(source)&&source.length>=9?.89:1-ratio;
  return {id:String(x.id),name:x.name,score};
 }).sort((a,b)=>b.score-a.score);
 if(all[0]?.score>=.79&&(!all[1]||all[0].score-all[1].score>=.045))
  return {...all[0],confidence:all[0].score>=.97?'exact':'review'};
 return null;
}
async function titleAndCone(worker,bitmap,template,data,hintId){
 const titleBoxes=[template.title,
  [template.title[0],template.title[1]-8,template.title[2],template.title[3]+16]];
 let title='',identity=null;
 for(const box of titleBoxes){
  const t=await ocr(worker,bitmap,template,box,{width:1100,height:150,psm:6,mode:'binary'});
  const id=recognizeCharacter(t,charList(data),hintId);
  if(id){title=t;identity=id;break}
  title=t;
 }
 if(!identity&&hintId&&data.chars?.[hintId]){
  const old=data.chars[hintId];identity={id:String(old.id),name:old.name,confidence:'profile'};
 }
 const levelMatch=String(title).match(/\b(?:nv|lv|level)\s*\.?\s*([1-8]\d)\b/i);
 const coneOCR=await ocr(worker,bitmap,template,template.cone,
  {width:1100,height:175,psm:6,mode:'binary'});
 const levelOCR=await ocr(worker,bitmap,template,template.coneLevel,
  {width:900,height:120,psm:6,mode:'binary'});
 const matchedCone=recognizeCone(coneOCR,data);
 const superMatch=String(levelOCR).match(/(?:nv|lv)\.?\s*([1-5])\s*de\s*sobrepos/i)
  ||String(coneOCR+' '+levelOCR).match(/(?:sobrepos\w*)\W{0,8}([1-5])/i)
  ||String(levelOCR).match(/nv\.\s*\d{1,2}\W+nv\.\s*([1-5])/i);
 return {title,identity,level:levelMatch?Number(levelMatch[1]):null,
  cone:matchedCone?.name||'',coneConfidence:matchedCone?.confidence||'pending',
  superimposition:superMatch?Number(superMatch[1]):null,
  coneText:coneOCR,coneLevelText:levelOCR};
}
async function totalStats(worker,bitmap,template,progress=()=>{}){
 const totals={},confidence={};
 const ranges={pv:[200,35000],atk:[100,20000],def:[100,15000],spd:[60,500],
  crit:[0,200],cdmg:[0,1000],break:[0,800],energy:[0,500]};
 for(let i=0;i<TOTAL_KEYS.length;i++){
  const key=TOTAL_KEYS[i],bounds=ranges[key];
  const texts=await allNumbers(worker,bitmap,template,totalBox(template,key));
  const result=selectNumeric(texts,bounds[0],bounds[1],i<4);
  if(result.value!==null)totals[key]=result.value;
  confidence[key]=result.confidence;
  if(i===3||i===7)progress('Conferindo atributos '+(i+1)+'/8');
 }
 return {totals,confidence};
}
function eidolons(bitmap,template){
 const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
 const scores=template.eidolonCenters.map(([px,py])=>{
  const sx=bitmap.width/template.width,sy=bitmap.height/template.height;
  const r=Math.max(8,Math.round(16*sx)),x=Math.round(px*sx),y=Math.round(py*sy);
  const box=ctx.getImageData(Math.max(0,x-r),Math.max(0,y-r),r*2,r*2).data;
  let bright=0;
  for(let i=0;i<box.length;i+=4)if(box[i]>158&&box[i+1]>155&&box[i+2]>155)bright++;
  return bright/(box.length/4);
 });
 if(scores.every(x=>x<.07))return {value:0,confidence:'review',scores};
 if(scores.every(x=>x>.17))return {value:6,confidence:'review',scores};
 let best=null;
 for(let e=1;e<6;e++){
  const active=scores.slice(0,e),inactive=scores.slice(e);
  const gap=Math.min(...active)-Math.max(...inactive);
  if(gap>.07&&Math.min(...active)>.09&&Math.max(...inactive)<.14 &&
   (!best||best.gap<gap))best={value:e,gap};
 }
 return {value:best?.value??null,confidence:best?'review':'pending',scores};
}
function comparePixels(data,pixels){
 let sum=0,weight=0;
 for(let i=0;i<400;i++){
  const p=i*4,a=pixels[p+3]/255;if(a<.55)continue;
  sum+=a*(.35*Math.abs(pixels[p]-data[p])+
   .40*Math.abs(pixels[p+1]-data[p+1])+
   .25*Math.abs(pixels[p+2]-data[p+2]));
  weight+=a;
 }
 return weight>50?sum/(weight*255):1;
}
function iconRanking(bitmap,template,index,refs){
 const c=document.createElement('canvas');c.width=20;c.height=20;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 const center=template.iconCenters[index],sx=bitmap.width/template.width,
  sy=bitmap.height/template.height;
 const samples=[];
 for(const size of [64,78,92])for(const dx of [-12,0,12])for(const dy of [-12,0,12]){
  ctx.clearRect(0,0,20,20);
  ctx.drawImage(bitmap,(center[0]-size/2+dx)*sx,(center[1]-size/2+dy)*sy,
   size*sx,size*sy,0,0,20,20);
  samples.push(ctx.getImageData(0,0,20,20).data);
 }
 return refs.filter(x=>x.type===TYPE[index]).map(r=>{
  let score=1;
  for(const sample of samples)score=Math.min(score,comparePixels(sample,r.pixels));
  return {setId:String(r.setId),icon:r.icon,score};
 }).sort((a,b)=>a.score-b.score).slice(0,4);
}
export function decideSets(all){
 const chosen=Array(6).fill(null);
 for(let i=0;i<6;i++){
  const [first,second]=all[i]||[];
  if(first?.score<=.235&&(!second||second.score-first.score>=.023))
   chosen[i]={...first,confidence:'checked'};
 }
 for(const group of [[0,1,2,3],[4,5]]){
  const counts={};
  for(const i of group)if(all[i]?.[0]?.score<=.25){
   const id=all[i][0].setId;counts[id]=(counts[id]||0)+1;
  }
  const ordered=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if(!ordered[0]||ordered[0][1]<(group.length===4?3:2)||
   ordered[0][1]===ordered[1]?.[1])continue;
  for(const i of group){
   if(chosen[i])continue;
   const match=(all[i]||[]).find(c=>c.setId===ordered[0][0]);
   if(match?.score<=.265&&match.score-(all[i][0]?.score??1)<=.028)
    chosen[i]={...match,confidence:'corroborated'};
  }
 }
 return chosen;
}
async function readSets(bitmap,template,data,progress){
 try{
  progress('Comparando os ícones dos seis equipamentos…');
  const refs=await signatures();
  if(refs.length<120)throw Error('Referências de ícones incompletas');
  const ranked=Array.from({length:6},(_,i)=>iconRanking(bitmap,template,i,refs));
  const chosen=decideSets(ranked);
  return {ranked:ranked.map(list=>list.map(v=>({...v,name:data.relicSets?.[v.setId]?.name||v.setId}))),
   chosen};
 }catch(error){
  console.warn('Nexus Scan: ícones indisponíveis',error);
  return {ranked:Array(6).fill([]),chosen:Array(6).fill(null),error:String(error.message||error)};
 }
}
function makeStrip(bitmap,template,part='all',mode='binary'){
 const height=30*100,width=part==='labels'?850:part==='numbers'?410:1200;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#000';ctx.font='bold 19px Arial';ctx.textBaseline='middle';
 for(let i=0;i<6;i++)for(let j=0;j<5;j++){
  const k=i*5+j,pos=relicCrop(template,i,j),y=k*100;
  ctx.fillText(String(k+1).padStart(2,'0'),6,y+54);
  if(part!=='numbers'){
   ctx.drawImage(crop(bitmap,template,pos.label,680,86,mode),48,y+7);
  }
  if(part!=='labels'){
   ctx.drawImage(crop(bitmap,template,pos.value,part==='numbers'?345:410,86,mode),
    part==='numbers'?45:772,y+7);
  }
 }
 return canvas;
}
function textRows(result,part){
 const rows=Array(30).fill('').map(()=>({label:'',value:''}));
 const lines=result?.data?.lines||[];
 for(const line of lines){
  const box=line.bbox||{},mid=(Number(box.y0)+Number(box.y1))/2;
  const i=Math.floor(mid/100);
  if(i<0||i>=30||!Number.isFinite(mid))continue;
  const words=line.words||[];
  if(words.length){
   for(const word of words){
    const x=word.bbox?.x0||0,text=word.text||'';
    if(x<(part==='numbers'?30:755))rows[i].label+=' '+text;
    else rows[i].value+=' '+text;
   }
  }else{
   if(part==='numbers')rows[i].value+=' '+line.text;
   else rows[i].label+=' '+line.text;
  }
 }
 return rows;
}
async function readRelics(worker,bitmap,template,chosen,ranked,data,progress){
 const pieces=blankRelics();
 for(let i=0;i<6;i++){
  const match=chosen?.[i];
  if(match){pieces[i].setId=String(match.setId);pieces[i].setName=data.relicSets?.[match.setId]?.name||'';
   pieces[i].setConfidence=match.confidence;}
  pieces[i].suggestions=(ranked?.[i]||[]).slice(0,3);
 }
 progress('Lendo as seis relíquias e seus 30 atributos…');
 // Two bulk OCR passes avoid 60 sequential calls on mobile.
 await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:''});
 const all=await worker.recognize(makeStrip(bitmap,template,'labels'));
 await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:'0123456789.,%+'});
 const digits=await worker.recognize(makeStrip(bitmap,template,'numbers'));
 const labels=textRows(all,'labels'),numbers=textRows(digits,'numbers');
 for(let i=0;i<6;i++){
  const header=relicCrop(template,i,0).header;
  const badge=await ocr(worker,bitmap,template,header,{width:450,height:90,
   chars:'0123456789+',mode:'binary'});
  const m=badge.match(/\+\s*(\d{1,2})\b/);
  pieces[i].level=m&&Number(m[1])<=15?Number(m[1]):null;
 }
 for(let i=0;i<6;i++)for(let j=0;j<5;j++){
  const k=i*5+j,entry=pieces[i],coords=relicCrop(template,i,j);
  let label=labels[k].label.replace(/^\s*\d{1,2}\W*/,''),valueText=numbers[k].value;
  let type=inferStat(label,valueText);
  if(!type){
   const alternate=await ocr(worker,bitmap,template,coords.label,
    {width:820,height:125,psm:i===5&&j===0?6:7,mode:'binary'});
   type=inferStat(alternate,valueText);if(type)label=alternate;
  }
  let numbersToCompare=[valueText];
  if(type){
   const r1=await ocr(worker,bitmap,template,coords.value,
    {width:500,height:113,chars:'0123456789.,%+',mode:'binary'});
   numbersToCompare.push(r1);
   let result=chooseReading({texts:numbersToCompare,stat:type,slot:i,main:j===0,level:entry.level});
   if(result.confidence==='pending'||result.confidence==='review'){
    const r2=await ocr(worker,bitmap,template,coords.wider,
     {width:520,height:125,chars:'0123456789.,%+',mode:'strong'});
    numbersToCompare.push(r2);
    result=chooseReading({texts:numbersToCompare,stat:type,slot:i,main:j===0,level:entry.level});
   }
   if(result.value!==null){
    const target={stat:type,value:result.value,confidence:result.confidence};
    if(j===0)entry.main=target;else entry.subs[j-1]=target;
   }else if(j===0)entry.main={stat:type,value:null,confidence:'pending'};
  }
  if(j===4)progress('Relíquias conferidas '+(i+1)+'/6');
 }
 return pieces;
}
export async function readHoYoLab(file,{hintId='',progress=()=>{}}={}){
 if(!file||!/^image\/(png|jpe?g|webp)$/i.test(file.type))
  throw Error('Selecione um cartão da HoYoLab em PNG, JPG ou WEBP.');
 if(file.size>14*1024*1024)throw Error('Imagem acima de 14 MB; exporte novamente pela HoYoLab.');
 const bitmap=await createImageBitmap(file);
 let worker=null;
 try{
  const template=detectLayout(bitmap.width,bitmap.height);
  if(!template)throw Error('Este print não corresponde aos formatos oficiais já calibrados. Use o cartão completo de atributos da HoYoLab.');
  progress('Reconhecido: '+template.label);
  const data=await catalogue();
  const lib=await library();
  progress('Preparando a leitura local dos dados…');
  try{worker=await lib.createWorker(['por','eng'],1);}
  catch(_){worker=await lib.createWorker('eng',1);}
  const basics=await titleAndCone(worker,bitmap,template,data,String(hintId||''));
  progress('Personagem: '+(basics.identity?.name||'nome pendente'));
  const totals=await totalStats(worker,bitmap,template,progress);
  const e=eidolons(bitmap,template);
  const iconMatches=await readSets(bitmap,template,data,progress);
  const relics=await readRelics(worker,bitmap,template,iconMatches.chosen,
   iconMatches.ranked,data,progress);
  const report={
   layout:template.id,width:bitmap.width,height:bitmap.height,
   characterId:basics.identity?.id||'',characterName:basics.identity?.name||'',
   characterConfidence:basics.identity?.confidence||'pending',
   level:basics.level,cone:basics.cone,coneConfidence:basics.coneConfidence,
   superimposition:basics.superimposition,
   eidolon:e.value,eidolonConfidence:e.confidence,
   totals:totals.totals,totalConfidence:totals.confidence,
   relics,iconError:iconMatches.error||'',
   diagnostics:{nameOCR:basics.title,coneOCR:basics.coneText}
  };
  report.completeness=analyzeCompleteness(report);
  return report;
 }finally{
  try{await worker?.terminate()}catch(_){}
  try{bitmap.close()}catch(_){}
 }
}
export function makeRelicThumbnails(file,template){
 return new Promise((resolve,reject)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{
   const result=Array.from({length:6},(_,i)=>{
    const center=template.iconCenters[i],top=i<3,
     x=template.lefts[i]-10,y=template.headers[top?0:1]-16;
    const box=[x,y,410,350],c=document.createElement('canvas');
    c.width=220;c.height=190;
    const t=c.getContext('2d');
    const sx=img.naturalWidth/template.width,sy=img.naturalHeight/template.height;
    t.drawImage(img,box[0]*sx,box[1]*sy,box[2]*sx,box[3]*sy,0,0,220,190);
    return c.toDataURL('image/webp',.7);
   });
   URL.revokeObjectURL(url);resolve(result);
  };
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Imagem não pôde ser carregada'));};
  img.src=url;
 });
}
