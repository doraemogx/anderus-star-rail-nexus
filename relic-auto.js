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
 const name=normalized(label);const isPct=/%/.test(amount);
 if(/energia|regenera/.test(name))return 'Regeneração de Energia';
 if(/cura|healing/.test(name))return 'Bônus de Cura Realizada';
 if(/chance|taxa.*crit|crit.*rate/.test(name))return 'Chance de CRIT';
 if(/dano.*crit|crit.*dmg/.test(name))return 'Dano CRIT';
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
function extractRows(ocr){
 const rows=Array.from({length:30},()=>({name:'',value:''}));
 const words=ocr.data?.words||[];
 if(words.length){
  for(const w of words){
    const box=w.bbox||{},idx=Math.floor((box.y0+box.y1)/2/60);
    if(idx<0||idx>=30||!w.text)continue;
    if(box.x0<650)rows[idx].name+=' '+w.text;
    else rows[idx].value+=' '+w.text;
  }
 }else{
  const lines=(ocr.data?.text||'').split(/\n+/);
  for(let i=0;i<Math.min(30,lines.length);i++){
    const text=lines[i].replace(/^\s*\d{2}\s*/,'');
    const parts=text.split(/\s{2,}/);
    rows[i]={name:parts[0]||'',value:parts.slice(1).join(' ')};
  }
 }
 return rows;
}
async function recognizeStats(bitmap,worker){
 const strips=makeRelicStrip(bitmap);
 await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:''});
 const ocr=await worker.recognize(strips);
 return extractRows(ocr);
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
    if(stat&&Number.isFinite(value)&&field&&[...field.options].some(o=>o.value===stat)){
      field.value=stat;valField.value=String(value);
      field.style.borderColor='#78c5ac';valField.style.borderColor='#78c5ac';report.recognized++;
    }else{
      report.uncertain.push(SLOT_NAMES[i]+': '+(j===0?'principal':('secundário '+j)));
    }
  }
 }catch(e){report.uncertain.push('Leitura dos atributos secundários falhou: '+String(e.message||e));}
 document.querySelectorAll('.v07-rel-option').forEach(btn=>btn.addEventListener('click',()=>{
  const i=btn.dataset.ridx;const el=document.getElementById('v06-r'+i+'-set');
  if(el){el.value=btn.dataset.setid;el.style.borderColor='#78c5ac';}
 }));
 report.status=report.sets+' / 6 conjuntos sugeridos; '+report.recognized+' / 30 atributos de relíquias extraídos. '+report.uncertain.length+' campos requerem revisão.';
 return report;
}
