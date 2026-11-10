/*
 * ANDERUS / image-based relic import for standardized 2000×1826 battle record.
 * Local processing: reference RGBA vectors from real game icons and OCR on six panels.
 * Fail closed when the image does not match confidently. Never invent a set.
 */
const TYPES=['HEAD','HAND','BODY','FOOT','NECK','OBJECT'];
const SLOT_NAMES=['Cabeça','Mãos','Corpo','Pés','Esfera Plana','Corda de Ligação'];
const CENTERS=[
 [1077,910],[1477,910],[1878,910],
 [1077,1257],[1477,1257],[1878,1257]
];
const LEFTS=[739,1142,1550,739,1142,1550];
const ROW_Y=[965,1028,1086,1143,1199,1326,1386,1442,1501,1555];
let signaturesPromise;
function signatures(){return signaturesPromise||(signaturesPromise=fetch('./data/relic-icon-signatures.json',{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw Error('Sem referências das relíquias');return r.json()})
  .then(j=>j.icons.map(x=>({...x,pixels:Uint8Array.from(atob(x.rgba),c=>c.charCodeAt(0))})))
);}
function matchColor(sample,template){
 let sum=0,weight=0;
 const target=template.pixels;
 for(let p=0;p<20*20;p++){
   const a=target[p*4+3]/255;
   if(a<.55)continue;
   const r=target[p*4],g=target[p*4+1],b=target[p*4+2];
   const sr=sample[p*4],sg=sample[p*4+1],sb=sample[p*4+2];
   // Denoise screenshots: contrast and illumination vary across the banner.
   const diff=.35*Math.abs(r-sr)+.40*Math.abs(g-sg)+.25*Math.abs(b-sb);
   sum+=a*diff;weight+=a;
 }
 return weight<55?1:sum/(weight*255);
}
function compareIcon(bitmap,refs,index){
 const canvas=document.createElement('canvas');canvas.width=20;canvas.height=20;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const sx=bitmap.width/2000,sy=bitmap.height/1826,[cx,cy]=CENTERS[index];
 const samples=[];
 for(const size of [65,78,90]){
   for(const dx of [-7,0,7])for(const dy of [-7,0,7]){
     ctx.clearRect(0,0,20,20);
     ctx.drawImage(bitmap,(cx-size/2+dx)*sx,(cy-size/2+dy)*sy,size*sx,size*sy,0,0,20,20);
     samples.push(ctx.getImageData(0,0,20,20).data);
   }
 }
 const scores=refs.filter(r=>r.type===TYPES[index]).map(r=>{
   let best=1;
   for(const sample of samples)best=Math.min(best,matchColor(sample,r));
   return {...r,score:best};
 }).sort((a,b)=>a.score-b.score);
 return scores.slice(0,4);
}
function normalized(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function inferStat(label,amount){
 const name=normalized(label).replace(/[^a-z0-9% ]/g,' ').replace(/\s+/g,' ').trim().replace(/\b(v1|ve1|veI)\b/g,'vel');
 const isPct=/%/.test(String(amount||'')+' '+String(label||'')) || /\d[.,]\d/.test(String(amount||'')); // flat PV/ATQ/DEF rolls are integers
 if(/energia|regenera/.test(name))return 'Regeneração de Energia';
 if(/cura|healing/.test(name))return 'Bônus de Cura Realizada';
 if(/chance|taxa.*crit|crit.*rate|crit chance|critico.*chance/.test(name))return 'Chance de CRIT';
 if(/dano.*crit|crit.*dmg|crit.*dano|dano critico/.test(name))return 'Dano CRIT';
 if(/quebra|break/.test(name))return 'Efeito de Quebra';
 if(/acerto.*efeito|effect.*hit/.test(name))return 'Taxa de Acerto de Efeito';
 if(/res.*efeito|effect.*res/.test(name))return 'RES a Efeito';
 if(/dano.*fisico/.test(name))return 'Bônus de Dano Físico';
 if(/dano.*gelo/.test(name))return 'Bônus de Dano de Gelo';
 if(/dano.*fogo/.test(name))return 'Bônus de Dano de Fogo';
 if(/dano.*raio/.test(name))return 'Bônus de Dano de Raio';
 if(/dano.*vento/.test(name))return 'Bônus de Dano de Vento';
 if(/dano.*quantico/.test(name))return 'Bônus de Dano Quântico';
 if(/dano.*imaginario/.test(name))return 'Bônus de Dano Imaginário';
 if(/\bvel\b|\bspd\b|speed/.test(name))return 'VEL';
 if(/\bdef\b|defesa/.test(name))return isPct?'DEF %':'DEF';
 if(/\batq\b|\batk\b|ataque/.test(name))return isPct?'ATQ %':'ATQ';
 if(/\bpv\b|\bhp\b|pontos.*vida/.test(name))return isPct?'PV %':'PV';
 return '';
}
function parseValue(text){
 const cleaned=String(text||'').replace(/[Oo]/g,'0').replace(/[lI]/g,'1').replace(/\s/g,'').replace(/(\d)\.(\d{3})(?=\D|$)/g,'$1$2');
 const m=cleaned.match(/\d{1,5}(?:[.,]\d{1,2})?/);
 return m?Number(m[0].replace(',','.')):null;
}

function makeTextCrop(bitmap,x,y,w,h,outWidth=520,outHeight=64){
 // These cards use bright small glyphs on dark coloured backgrounds. The OCR
 // must receive actual black characters on white, not raw UI art.
 const c=document.createElement('canvas');c.width=outWidth;c.height=outHeight;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 const sx=bitmap.width/2000,sy=bitmap.height/1826;
 ctx.drawImage(bitmap,x*sx,y*sy,w*sx,h*sy,0,0,outWidth,outHeight);
 const pixels=ctx.getImageData(0,0,outWidth,outHeight);
 for(let p=0;p<pixels.data.length;p+=4){
   const r=pixels.data[p],g=pixels.data[p+1],b=pixels.data[p+2];
   const light=.299*r+.587*g+.114*b;
   const foreground=light>142 || (r>154&&g>108&&b>68) || (b>175&&g>133);
   const v=foreground?0:255;
   pixels.data[p]=pixels.data[p+1]=pixels.data[p+2]=v;
   pixels.data[p+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 return c;
}
function makeRelicStrip(bitmap){
 const out=document.createElement('canvas');out.width=1100;out.height=30*72;
 const ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);
 ctx.fillStyle='#000';ctx.font='bold 19px Arial';ctx.textBaseline='middle';
 for(let i=0;i<6;i++)for(let j=0;j<5;j++){
   const idx=i*5+j,cy=ROW_Y[(i<3?0:5)+j],col=LEFTS[i],y=idx*72;
   const name=makeTextCrop(bitmap,col+33,cy-22,249,44,625,64);
   const value=makeTextCrop(bitmap,col+274,cy-22,124,44,345,64);
   ctx.fillStyle='#000';ctx.fillText(String(idx+1).padStart(2,'0'),6,y+35);
   ctx.drawImage(name,52,y+4);
   ctx.drawImage(value,729,y+4);
 }
 return out;
}

function cleanRow(text){
 const line=String(text||'').replace(/^\s*\d{1,2}[.):-]?\s*/,'').replace(/\s+/g,' ').trim();
 const m=line.match(/^(.*?)\s*([+−-]?\s*\d{1,5}(?:[.,]\d{1,2})?\s*%?)\s*$/);
 return m?{name:m[1].trim(),value:m[2].replace(/\s+/g,'')}:{name:line,value:''};
}
function lineNumber(text){
 const m=String(text||'').match(/^\s*(\d{1,2})[.):-]?\s+/);
 return m&&+m[1]>=1&&+m[1]<=30?+m[1]-1:-1;
}
function extractRows(ocr){
 const rows=Array.from({length:30},()=>({name:'',value:''}));
 const assign=(i,text,prefer=false)=>{
   if(i<0||i>29)return;
   const row=cleanRow(text);
   if(row.name && (prefer||!rows[i].name))rows[i].name=row.name;
   if(row.value && (prefer||!rows[i].value))rows[i].value=row.value;
 };
 const blocks=[...(ocr.data?.lines||[]),...(ocr.data?.blocks||[]).flatMap(b=>b.paragraphs?.flatMap(p=>p.lines||[])||[])];
 for(const line of blocks){
   const box=line.bbox||{},mid=(Number(box.y0)+Number(box.y1))/2;
   const i=Math.floor(mid/72);
   if(Number.isFinite(mid))assign(i,line.text);
 }
 const words=ocr.data?.words||[];
 for(const w of words){
   const box=w.bbox||{},mid=(Number(box.y0)+Number(box.y1))/2;
   if(!Number.isFinite(mid)||!w.text)continue;
   const i=Math.floor(mid/72);
   if(i<0||i>29)continue;
   if(Number(box.x0)<710)rows[i].name+=' '+w.text;
   else rows[i].value+=' '+w.text;
 }
 const lines=String(ocr.data?.text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const numbered=lines.filter(l=>lineNumber(l)>=0);
 if(numbered.length>=12)for(const line of numbered)assign(lineNumber(line),line,true);
 else if(lines.length===30)lines.forEach((line,i)=>assign(i,line,true));
 return rows.map(r=>{
   const n=cleanRow(r.name+' '+r.value),extra=cleanRow(r.name);
   return {name:(n.value?n.name:extra.value?extra.name:r.name).replace(/^\s*\d{1,2}\s*/,'').trim(),
      value:r.value.trim()||n.value||extra.value};
 });
}
function makeNumberStrip(bitmap){
 const c=document.createElement('canvas');c.width=480;c.height=30*72;
 const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
 ctx.fillStyle='#000';ctx.font='bold 18px Arial';
 for(let i=0;i<6;i++)for(let j=0;j<5;j++){
   const k=i*5+j,y=ROW_Y[(i<3?0:5)+j],col=LEFTS[i];
   ctx.fillText(String(k+1).padStart(2,'0'),7,k*72+39);
   ctx.drawImage(makeTextCrop(bitmap,col+268,y-23,132,46,380,64),75,k*72+4);
 }
 return c;
}
function parseNumberRows(ocr){
 const out=Array(30).fill('');
 const blocks=ocr.data?.lines||[];
 for(const l of blocks){
   const b=l.bbox||{},mid=(Number(b.y0)+Number(b.y1))/2,i=Math.floor(mid/72);
   if(i>=0&&i<30&&Number.isFinite(mid))out[i]=cleanRow(l.text).value||l.text;
 }
 for(const w of ocr.data?.words||[]){
   const b=w.bbox||{},mid=(Number(b.y0)+Number(b.y1))/2,i=Math.floor(mid/72);
   if(i>=0&&i<30&&Number.isFinite(mid)&&Number(b.x0)>55)out[i]+=' '+w.text;
 }
 const lines=String(ocr.data?.text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const numbered=lines.filter(l=>lineNumber(l)>=0);
 if(numbered.length>=12)for(const l of numbered)out[lineNumber(l)]=cleanRow(l).value||out[lineNumber(l)];
 else if(lines.length===30)lines.forEach((l,i)=>{if(!out[i])out[i]=cleanRow(l).value||l;});
 return out;
}
async function recognizeStats(bitmap,worker,progress=()=>{}){
 await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:''});
 const main=await worker.recognize(makeRelicStrip(bitmap));
 const rows=extractRows(main);
 // A separate numbers-only pass prevents a weak label reading from losing the value.
 await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:'0123456789.,%+'});
 const numbers=parseNumberRows(await worker.recognize(makeNumberStrip(bitmap)));
 for(let i=0;i<30;i++){
   if(!/\d/.test(rows[i].value)&&/\d/.test(numbers[i]))rows[i].value=numbers[i];
 }
 // If Tesseract coalesces or skips lines, retry individual cells with PSM 7;
 // alignment never depends on the number of OCR lines returned.
 for(let i=0;i<30;i++){
   const missingName=!inferStat(rows[i].name,rows[i].value);
   const missingValue=!Number.isFinite(parseValue(rows[i].value));
   if(!missingName&&!missingValue)continue;
   progress(i+1,30);
   const slot=Math.floor(i/5),j=i%5,col=LEFTS[slot];
   const cy=ROW_Y[(slot<3?0:5)+j];
   await worker.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:''});
   if(missingName){
     const name=await worker.recognize(makeTextCrop(bitmap,col+32,cy-23,257,46,700,90));
     const candidate=cleanRow(name.data?.text).name;
     if(inferStat(candidate,rows[i].value))rows[i].name=candidate;
   }
   if(missingValue){
     await worker.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789.,%+'});
     const amount=await worker.recognize(makeTextCrop(bitmap,col+265,cy-23,135,46,440,90));
     const found=String(amount.data?.text||'').trim();
     if(Number.isFinite(parseValue(found)))rows[i].value=found;
   }
 }
 return rows;
}

function plausible(stat,value,main){
 if(!Number.isFinite(value)||value<=0)return false;
 const percent=/%/.test(stat)||/CRIT|Quebra|Energia|Cura|RES a|Acerto|Bônus de Dano/.test(stat);
 if(main){
  if(stat==='VEL')return value>=5&&value<=35;
  if(stat==='PV'||stat==='ATQ'||stat==='DEF')return value>=50&&value<=10000;
  if(percent)return value>=1&&value<=100;
  return value<15000;
 }
 if(stat==='VEL')return value>=1&&value<=30;
 if(stat==='PV')return value>=1&&value<=600;
 if(stat==='ATQ'||stat==='DEF')return value>=1&&value<=300;
 return value>=0.1&&value<=60;
}
export async function autoDetectRelics(bitmap,worker,progress=()=>{}){
 const report={recognized:0,sets:0,uncertain:[],suggestions:[],status:'análise não concluída'};
 let refs=[];
 try{refs=await signatures();}catch(e){report.uncertain.push('Catálogo de imagens de relíquias indisponível');}
 const editor=document.getElementById('v06-relic-editor');
 if(!editor)return report;
 const game=await fetch('./data/live-game.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>({relicSets:{}}));
 if(refs.length){
  for(let i=0;i<6;i++){
    const ranked=compareIcon(bitmap,refs,i);
    const first=ranked[0],second=ranked[1];
    if(!first)continue;
    const chosen=first.score<.235&&(second.score-first.score)>.025;
    const name=game.relicSets?.[first.setId]?.name||'Conjunto '+first.setId;
    const id='v06-r'+i+'-set',field=document.getElementById(id);
    if(chosen&&field&&[...field.options].some(x=>x.value===first.setId)&&
      (field.value===''||field.dataset.iconSuggestion==='1')){
      field.value=first.setId;field.dataset.iconSuggestion='1';report.sets++;
      field.title='Sugestão automática por comparação da arte: '+name+'; confira o ícone.';
      field.style.borderColor='#6ec4ae';
    }else{
      report.uncertain.push(SLOT_NAMES[i]+' (conjunto não confirmado)');
    }
    const options=ranked.slice(0,3).map(x=>({setId:x.setId,name:game.relicSets?.[x.setId]?.name||x.setId,score:x.score,icon:x.icon}));
    report.suggestions.push({slot:i,options,chosen:chosen?first.setId:null});
    const el=document.getElementById('v06-relmatch-'+i);
    if(el){
      el.innerHTML='<small>Reconhecimento visual: '+(chosen?'proposta: '+name:'confirme pelo ícone')+'</small>'+
         options.map(x=>'<button type="button" class="v07-rel-option" data-ridx="'+i+'" data-setid="'+x.setId+'" title="'+x.name.replace(/"/g,'')+'"><img src="https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/'+x.icon+'" alt="">'+x.name+'</button>').join('');
    }
  }
 }
 try{
  const rows=await recognizeStats(bitmap,worker,progress);
  for(let i=0;i<6;i++)for(let j=0;j<5;j++){
    const row=rows[i*5+j],stat=inferStat(row.name,row.value),value=parseValue(row.value);
    const statId=j===0?'main':'k'+(j-1),valId=j===0?'mainval':'v'+(j-1);
    const field=document.getElementById('v06-r'+i+'-'+statId);
    const valField=document.getElementById('v06-r'+i+'-'+valId);
    if(stat&&plausible(stat,value,j===0)&&field&&valField&&
      (field.value===''||field.dataset.ocrSuggestion==='1')&&
      (valField.value===''||valField.dataset.ocrSuggestion==='1')&&
      [...field.options].some(o=>o.value===stat)){
      field.value=stat;valField.value=String(value);
      field.style.borderColor='#e7bd74';valField.style.borderColor='#e7bd74';
      field.title='Sugerido por OCR — confirme no print antes de salvar';
      valField.title='Número extraído automaticamente — confira separador e porcentagem';
      field.dataset.ocrSuggestion='1';valField.dataset.ocrSuggestion='1';
      report.recognized++;
    }else{
      report.uncertain.push(SLOT_NAMES[i]+': '+(j===0?'principal':('secundário '+j)));
    }
  }
 }catch(e){report.uncertain.push('Leitura dos atributos secundários falhou: '+String(e.message||e));}
 document.querySelectorAll('.v07-rel-option').forEach(btn=>btn.addEventListener('click',()=>{
  const i=btn.dataset.ridx;const el=document.getElementById('v06-r'+i+'-set');
  if(el){el.value=btn.dataset.setid;el.style.borderColor='#78c5ac';}
 }));
 report.status=report.sets+' / 6 conjuntos sugeridos; '+report.recognized+' / 30 atributos de relíquias preenchidos pelo OCR. '+report.uncertain.length+' campos requerem revisão.';
 return report;
}
