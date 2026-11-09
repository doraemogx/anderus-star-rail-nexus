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
 const name=normalized(label).replace(/[^a-z0-9% ]/g,' ').replace(/\s+/g,' ').trim();
 const isPct=/%/.test(String(amount||'')+' '+String(label||''));
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
 const cleaned=String(text||'').replace(/[Oo]/g,'0').replace(/[lI]/g,'1').replace(/\s/g,'');
 const m=cleaned.match(/\d{1,5}(?:[.,]\d{1,2})?/);
 return m?Number(m[0].replace(',','.')):null;
}
function makeRelicStrip(bitmap){
 const output=document.createElement('canvas');
 output.width=1050;output.height=1800;
 const ctx=output.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1050,1800);
 ctx.font='bold 16px Arial';ctx.fillStyle='#000';
 const sx=bitmap.width/2000,sy=bitmap.height/1826;
 for(let i=0;i<6;i++){
   const col=LEFTS[i],base=i<3?0:5;
   for(let j=0;j<5;j++){
     const cy=ROW_Y[base+j],line=i*5+j;
     // Omit the game HUD icons and tiny upgrade-count badges whenever possible.
     ctx.fillText(String(line+1).padStart(2,'0'),5,line*60+34);
     ctx.drawImage(bitmap,(col+34)*sx,(cy-22)*sy,248*sx,44*sy,50,line*60,605,56);
     ctx.drawImage(bitmap,(col+286)*sx,(cy-22)*sy,102*sx,44*sy,681,line*60,345,56);
   }
 }
 return output;
}
function cleanRow(text){
 let clean=String(text||'').replace(/^\s*\d{1,2}[\s.:)\-]*/,'').replace(/\s+/g,' ').trim();
 // Some OCR engines merge label and last numeric token. Split from the right.
 const match=clean.match(/^(.*?\D)\s*([+\-]?\d{1,5}(?:[.,]\d{1,2})?\s*%?)\s*$/);
 if(match)return {name:match[1].trim(),value:match[2].trim()};
 return {name:clean,value:''};
}
function extractRows(ocr){
 const rows=Array.from({length:30},()=>({name:'',value:''}));
 const words=ocr.data?.words||[];
 for(const w of words){
  const box=w.bbox||{},at=(Number(box.y0)+Number(box.y1))/2;
  if(!Number.isFinite(at))continue;
  const i=Math.floor(at/60);
  if(i<0||i>=30||!w.text)continue;
  if(Number(box.x0)<650)rows[i].name+=' '+w.text;
  else rows[i].value+=' '+w.text;
 }
 const textLines=String(ocr.data?.text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
 // Only trust line order when the OCR returned an exact row-per-line image.
 if(textLines.length===30){
  textLines.forEach((line,i)=>{
   const split=cleanRow(line);
   if(!rows[i].name.trim())rows[i].name=split.name;
   if(!rows[i].value.trim())rows[i].value=split.value;
  });
 }
 return rows.map(r=>{
  const both=cleanRow(r.name+' '+r.value);
  const separate=cleanRow(r.name);
  const value=r.value.trim()||both.value||separate.value;
  const name=(both.value?both.name:separate.value?separate.name:r.name).replace(/^\s*\d{1,2}\s*/, '').trim();
  return {name,value};
 });
}
function makeNumberStrip(bitmap){
 const canvas=document.createElement('canvas');canvas.width=560;canvas.height=30*60;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,560,1800);
 const sx=bitmap.width/2000,sy=bitmap.height/1826;
 for(let i=0;i<6;i++){
  const col=LEFTS[i],base=i<3?0:5;
  for(let j=0;j<5;j++){
   const y=ROW_Y[base+j],idx=i*5+j;
   // Digit-only rectangular crop, aligned to the corresponding fixed stat row.
   ctx.drawImage(bitmap,(col+271)*sx,(y-23)*sy,127*sx,46*sy,7,idx*60+1,540,58);
  }
 }
 return canvas;
}
function parseNumberRows(ocr){
 const values=Array(30).fill(null);
 const words=ocr.data?.words||[];
 for(const word of words){
  const bb=word.bbox||{},cy=(Number(bb.y0)+Number(bb.y1))/2;
  const idx=Math.floor(cy/60);
  if(idx<0||idx>29||!Number.isFinite(cy))continue;
  const str=String(word.text||'').replace(/\s/g,'');
  if(/\d/.test(str))values[idx]=(values[idx]||'')+str;
 }
 const lines=String(ocr.data?.text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
 if(lines.length===30)lines.forEach((line,i)=>{if(!values[i])values[i]=line;});
 return values;
}
async function recognizeStats(bitmap,worker){
 await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:''});
 const main=await worker.recognize(makeRelicStrip(bitmap));
 const rows=extractRows(main);
 // A second digit-focused pass rescues values lost by general OCR;
 // aligned by actual word coordinates, never guessed sequentially.
 const missing=rows.filter(x=>!/\d/.test(x.value)).length;
 if(missing){
  await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:'0123456789.,%+'});
  const numeric=await worker.recognize(makeNumberStrip(bitmap));
  const numbers=parseNumberRows(numeric);
  for(let i=0;i<30;i++)if(!/\d/.test(rows[i].value)&&numbers[i])rows[i].value=numbers[i];
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
 if(stat==='PV'||stat==='ATQ'||stat==='DEF')return value>=1&&value<=200;
 return value>=0.1&&value<=60;
}
export async function autoDetectRelics(bitmap,worker){
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
    if(chosen&&field&&[...field.options].some(x=>x.value===first.setId)){
      field.value=first.setId;report.sets++;
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
  const rows=await recognizeStats(bitmap,worker);
  for(let i=0;i<6;i++)for(let j=0;j<5;j++){
    const row=rows[i*5+j],stat=inferStat(row.name,row.value),value=parseValue(row.value);
    const statId=j===0?'main':'k'+(j-1),valId=j===0?'mainval':'v'+(j-1);
    const field=document.getElementById('v06-r'+i+'-'+statId);
    const valField=document.getElementById('v06-r'+i+'-'+valId);
    if(stat&&plausible(stat,value,j===0)&&field&&valField&&[...field.options].some(o=>o.value===stat)){
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
