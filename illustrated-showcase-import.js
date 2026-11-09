/*
 * Anderus Nexus · screenshot classifier / HoYoLAB-style illustrated battle card.
 * Supports 2000×2300 three-column six-relic graphics; not a HoYoLAB API.
 * Runs entirely on the user's device, using the existing Tesseract worker.
 * Never infer account ownership, set bonuses or a numeric stat from character art.
 */
const BASE_W=2000,BASE_H=2300;
const STATS=[
 {key:'pv', box:[1232,233,107,69],min:200,max:30000,integer:true},
 {key:'atk',box:[1232,291,107,69],min:100,max:15000,integer:true},
 {key:'def',box:[1232,345,107,70],min:100,max:15000,integer:true},
 {key:'spd',box:[1232,403,107,70],min:50,max:400,integer:true},
 {key:'crit',box:[1232,459,107,72],min:0,max:100},
 {key:'cdmg',box:[1220,515,120,80],min:0,max:900},
 {key:'break',box:[1820,232,114,73],min:0,max:1000},
 {key:'energy',box:[1810,402,129,74],min:0,max:400}
];
const COL=[742,1146,1551],MAINS=[1447,1796],LINES_TOP=[1500,1551,1602,1654],LINES_BOTTOM=[1847,1898,1950,2001];
const NAMES=['PV','ATQ','DEF','VEL','Chance de CRIT','Dano CRIT','Efeito de Quebra','RES a Efeito','Taxa de Acerto de Efeito','Regeneração de Energia','Bônus de Cura Realizada'];
export function isIllustratedShowcase(bitmap){
 const ratio=bitmap?.width/bitmap?.height;
 return Number.isFinite(ratio)&&ratio>=.82&&ratio<=.95&&bitmap.width>=700&&bitmap.height>=900;
}
export function clean(s){
 return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[•·–—_-]/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}
export function matchCharacter(title,entries){
 const name=clean(String(title||'').replace(/\b(nv|lv|level)\s*\.?\s*\d{1,2}.*/i,''));
 if(name.length<3)return null;
 const matches=entries.map(row=>{
   const n=clean(row.name),alias=clean(row.alias||'');
   let score=0;
   if(n===name||alias===name)score=1;
   else if(n && name.startsWith(n+' '))score=.84+Math.min(.12,n.length/200);
   else if(alias && name.startsWith(alias+' '))score=.84+Math.min(.12,alias.length/200);
   else if(n && n.startsWith(name+' ')&&name.length>=8)score=.78;
   return {id:String(row.id),name:row.name,score};
 }).filter(x=>x.score>=.78).sort((a,b)=>b.score-a.score||b.name.length-a.name.length);
 if(!matches[0])return null;
 if(matches[1]&&matches[0].score===matches[1].score)return null;
 return matches[0].score>=.88||matches[0].score-(matches[1]?.score||0)>=.03?matches[0]:null;
}
export function inferStat(label,raw){
 const n=clean(label),v=String(raw||''),percent=/%/.test(v)||/\d[.,]\d/.test(v);
 if(/regenera|energia/.test(n))return 'Regeneração de Energia';
 if(/bonus.*cura/.test(n))return 'Bônus de Cura Realizada';
 if(/chance.*crit|taxa.*crit/.test(n))return 'Chance de CRIT';
 if(/(?:dano|nanon|nanno).*?(?:crit|cbit)/.test(n))return 'Dano CRIT';
 if(/efeito.*(?:quebra|ouebra)|(?:quebra|ouebra)/.test(n))return 'Efeito de Quebra';
 if(/acerto.*efeito/.test(n))return 'Taxa de Acerto de Efeito';
 if(/res.*efeito/.test(n))return 'RES a Efeito';
 if(/bonus.*dano.*fisico/.test(n))return 'Bônus de Dano Físico';
 if(/bonus.*dano.*gelo/.test(n))return 'Bônus de Dano de Gelo';
 if(/bonus.*dano.*fogo/.test(n))return 'Bônus de Dano de Fogo';
 if(/bonus.*dano.*raio/.test(n))return 'Bônus de Dano de Raio';
 if(/bonus.*dano.*vento/.test(n))return 'Bônus de Dano de Vento';
 if(/bonus.*dano.*quantico/.test(n))return 'Bônus de Dano Quântico';
 if(/bonus.*dano.*imaginario/.test(n))return 'Bônus de Dano Imaginário';
 if(/\bvel\b|velocidade/.test(n))return 'VEL';
 if(/\b(?:atq|atg|ato|at0|atk)\b|ataque/.test(n))return percent?'ATQ %':'ATQ';
 if(/\bdef\b|defesa/.test(n))return percent?'DEF %':'DEF';
 if(/\b(?:pv|pw)\b|vida/.test(n))return percent?'PV %':'PV';
 return '';
}
export function parseNumber(text,integer=false){
 let candidate=String(text||'').replace(/[Oo]/g,'0').replace(/[lI|]/g,'1').replace(/[Ss]/g,'5').trim();
 if(integer)candidate=candidate.replace(/(\d{1,2})\.(\d{3})(?!\d)/g,'$1$2');
 let match=candidate.match(/\d{1,5}(?:[.,]\d{1,2})?/);
 if(!match)return null;
 let value=match[0];
 if(integer){
   if(/^\d{1,2}\.\d{3}$/.test(value))value=value.replace('.','');
   if(/[.,]/.test(value))return null;
 }else value=value.replace(',','.');
 const n=Number(value);
 return Number.isFinite(n)?n:null;
}
export function classifyEidolons(bitmap){
 const c=document.createElement('canvas');
 c.width=bitmap.width;c.height=bitmap.height;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(bitmap,0,0);
 const sx=bitmap.width/BASE_W,sy=bitmap.height/BASE_H;
 const strengths=[];
 for(let i=0;i<6;i++){
   const x=Math.round((168+82*i)*sx),y=Math.round(1036*sy),r=Math.max(8,Math.round(21*sx));
   const box=ctx.getImageData(Math.max(0,x-r),Math.max(0,y-r),r*2,r*2).data;
   let bright=0;
   for(let p=0;p<box.length;p+=4)if(box[p]>175&&box[p+1]>173&&box[p+2]>173)bright++;
   strengths.push(bright/(box.length/4));
 }
 const active=strengths.map(v=>v>.20);
 let count=0;while(count<6&&active[count])count++;
 const clear=active.slice(count).every(v=>!v)&&(
    (count===0&&Math.max(...strengths)<.13)||
    (count===6&&Math.min(...strengths)>.20)||
    (count>0&&count<6&&Math.min(...strengths.slice(0,count))-
      Math.max(...strengths.slice(count))>.11));
 return {value:clear?count:null,brightRatios:strengths};
}
function crop(bitmap,box,outW=500,outH=88,mode='normal'){
 const cv=document.createElement('canvas');cv.width=outW;cv.height=outH;
 const ctx=cv.getContext('2d',{willReadFrequently:true});
 const [x,y,w,h]=box,sx=bitmap.width/BASE_W,sy=bitmap.height/BASE_H;
 ctx.drawImage(bitmap,x*sx,y*sy,w*sx,h*sy,0,0,outW,outH);
 if(mode==='normal')return cv;
 const pixels=ctx.getImageData(0,0,outW,outH);
 for(let p=0;p<pixels.data.length;p+=4){
   const [r,g,b]=pixels.data.slice(p,p+3),lum=.299*r+.587*g+.114*b;
   const ink=mode==='high'?lum>145:(lum>105);
   const v=ink?0:255;
   pixels.data[p]=pixels.data[p+1]=pixels.data[p+2]=v;
   pixels.data[p+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 return cv;
}
async function ocr(worker,bitmap,box,psm=7,variant='normal',whitelist=''){
 await worker.setParameters({tessedit_pageseg_mode:String(psm),tessedit_char_whitelist:whitelist});
 const image=crop(bitmap,box,Math.min(900,Math.max(420,box[2]*3)),Math.max(90,box[3]*3),variant);
 return (await worker.recognize(image)).data?.text?.trim()||'';
}
async function numberAt(worker,bitmap,stat){
 // Numeric cells are isolated from the base+bonus labels in the template.
 const options=[];
 for(const variant of ['normal','high','soft']){
   const text=await ocr(worker,bitmap,stat.box,7,variant,'0123456789.,%');
   const value=parseNumber(text,stat.integer);
   if(value!==null&&value>=stat.min&&value<=stat.max){
     if(!stat.integer&&/^\d{2,3}$/.test(text)&&stat.key!=='spd')continue;
     options.push({value,text});
     if(options.length>=2&&options[0].value===options[1].value)break;
   }
 }
 // Two independent preprocessing passes must agree when readings conflict.
 const unique=[...new Set(options.map(x=>x.value))];
 return unique.length===1?unique[0]:null;
}
function relicRowCoords(i,j){
 const x=COL[i%3],bottom=i>=3;
 const y=(j===0?MAINS[bottom?1:0]:(bottom?LINES_BOTTOM[j-1]:LINES_TOP[j-1]));
 // Leave the enhancement badges (×1, ×2, ×3) out of the numeric crop.
 // Old x+273 captured "×2 11,6%" as "211,6".
 // Begin after the small status pictogram, which previously polluted OCR text.
 // Rope's main energy-regeneration label wraps onto two physical lines.
 return {label:i===5&&j===0?[x+49,y-32,249,66]:[x+49,y-24,250,49],
   value:[x+305,y-24,76,49]};
}
export function plausibleRelicValue(stat,value,slot,main){
 if(!stat||!Number.isFinite(value)||value<=0)return false;
 if(main){
   if(slot===0)return stat==='PV'&&value>=100&&value<=2000;
   if(slot===1)return stat==='ATQ'&&value>=50&&value<=800;
   if(slot===2)return ['PV %','ATQ %','DEF %','Chance de CRIT','Dano CRIT',
     'Taxa de Acerto de Efeito','Bônus de Cura Realizada'].includes(stat)&&value<=110;
   if(slot===3)return ['PV %','ATQ %','DEF %','VEL'].includes(stat)&&value<=110;
   if(slot===4)return ['PV %','ATQ %','DEF %',
     'Bônus de Dano Físico','Bônus de Dano de Fogo','Bônus de Dano de Gelo',
     'Bônus de Dano de Vento','Bônus de Dano de Raio',
     'Bônus de Dano Quântico','Bônus de Dano Imaginário'].includes(stat)&&value<=110;
   return ['PV %','ATQ %','DEF %','Regeneração de Energia','Efeito de Quebra'].includes(stat)&&value<=110;
 }
 if(stat==='ATQ'){
  const rolls=[[16,23],[32,46],[48,69],[64,92],[80,115],[96,138]];
  if(!rolls.some(([low,high])=>value>=low&&value<=high))return false;
 }
 if(stat==='Chance de CRIT'&&value<2.5)return false;
 if(stat==='Dano CRIT'&&value<5)return false;
 const ranges={'PV':650,'ATQ':138,'DEF':275,'VEL':19,'Chance de CRIT':23,
  'Dano CRIT':47,'PV %':54,'ATQ %':54,'DEF %':54,
  'Taxa de Acerto de Efeito':55,'RES a Efeito':55,'Efeito de Quebra':70};
 return Object.hasOwn(ranges,stat)&&value<=ranges[stat];
}
// Fixed final 5★ relic main stats, verified against HSR stat tables.
// Use these only when a piece's visible +15 level is independently recognized.
// The screenshot's stat label must still be a valid main stat for that slot.
const MAXED_MAIN={'PV':705,'ATQ':352,'PV %':43.2,'ATQ %':43.2,'DEF %':54,
 'VEL':25,'Chance de CRIT':32.4,'Dano CRIT':64.8,
 'Taxa de Acerto de Efeito':43.2,'Bônus de Cura Realizada':34.5,
 'Regeneração de Energia':19.4,'Efeito de Quebra':64.8,
 'Bônus de Dano Físico':38.8,'Bônus de Dano de Gelo':38.8,
 'Bônus de Dano de Fogo':38.8,'Bônus de Dano de Raio':38.8,
 'Bônus de Dano de Vento':38.8,'Bônus de Dano Quântico':38.8,
 'Bônus de Dano Imaginário':38.8};
export function verifiedMainAt15(stat,slot,level){
 if(level!==15||!Object.hasOwn(MAXED_MAIN,stat))return null;
 const value=MAXED_MAIN[stat];
 return plausibleRelicValue(stat,value,slot,true)?value:null;
}
export function relicValueFromText(text,stat,slot,main=false){
 const raw=String(text||'').replace(/\s+/g,' ').trim();
 if(!raw)return null;
 const pct=stat.includes('%')||['Chance de CRIT','Dano CRIT','Efeito de Quebra','RES a Efeito',
  'Taxa de Acerto de Efeito','Regeneração de Energia','Bônus de Cura Realizada'].includes(stat)
  ||stat.startsWith('Bônus de Dano');
 if(!main&&pct&&!/%|\d[.,]\d/.test(raw))return null;
 const value=parseNumber(raw);
 return plausibleRelicValue(stat,value,slot,main)?value:null;
}
async function relicRows(worker,bitmap,progress){
 const found=[],levels=[];
 await worker.setParameters({tessedit_char_whitelist:''});
 // Complete rows are treated separately: this avoids mixing 3 columns together.
 for(let i=0;i<6;i++){
   const rows=[];
   const x=COL[i%3],headerY=i<3?1371:1724;
   const header=await ocr(worker,bitmap,[x+30,headerY,250,49],7,'normal');
   const levelMatch=header.match(/\+\s*(\d{1,2})\b/);
   const relicLevel=levelMatch&&Number(levelMatch[1])<=15?Number(levelMatch[1]):null;
   levels.push(relicLevel);
   for(let j=0;j<5;j++){
     if(j===0&&progress)progress('Lendo relíquia '+(i+1)+'/6…');
     const loc=relicRowCoords(i,j);
     let line=await ocr(worker,bitmap,loc.label,i===5&&j===0?6:7,'normal');
     let amount=await ocr(worker,bitmap,loc.value,7,'normal','0123456789.,%');
     let stat=inferStat(line,amount),value=relicValueFromText(amount,stat,i,j===0);
     if(!stat){
       const alternate=await ocr(worker,bitmap,loc.label,7,'high');
       const guess=inferStat(alternate,amount);
       if(guess){stat=guess;line=alternate;value=relicValueFromText(amount,stat,i,j===0);}
     }
     if(value===null&&stat){
       for(const variant of ['high','soft']){
         const retry=await ocr(worker,bitmap,loc.value,7,variant,'0123456789.,%');
         const revisedStat=inferStat(line,retry)||stat;
         const parsed=relicValueFromText(retry,revisedStat,i,j===0);
         if(parsed!==null){stat=revisedStat;amount=retry;value=parsed;break;}
       }
     }
     // Level +15 fixes main-stat OCR truncations (4.8% vs 64.8%, etc.).
     // If the label is not recognized, never guess the main stat except
     // the game-defined fixed HP/ATK slots.
     if(j===0&&relicLevel===15){
       if(i===0){stat='PV';value=705;}
       else if(i===1){stat='ATQ';value=352;}
       else if(stat){
         const fixed=verifiedMainAt15(stat,i,relicLevel);
         if(fixed!==null)value=fixed;
       }
     }
     rows.push({stat:stat&&value!==null?stat:'',value:stat&&value!==null?value:null,label:line,raw:amount});
   }
   found.push(rows);
 }
 return {rows:found,levels};
}
export async function readIllustratedShowcase(bitmap,worker,{characters=[],coneNames=[],progress=()=>{},includeRelics=true}={}){
 if(!isIllustratedShowcase(bitmap))throw Error('A captura não corresponde ao layout ilustrado.');
 progress('Identificando a personagem…');
 let title=await ocr(worker,bitmap,[40,65,520,88],7,'normal');
 const levelText=await ocr(worker,bitmap,[488,65,110,90],7,'normal','0123456789Nv.Lv ');
 let character=matchCharacter(title,characters);
 if(!character){
   const enhanced=await ocr(worker,bitmap,[40,65,520,88],7,'high');
   const alternate=matchCharacter(enhanced,characters);
   if(alternate){character=alternate;title=enhanced;}
 }
 progress('Conferindo os atributos totais…');
 const totals={};
 for(const stat of STATS){
   const value=await numberAt(worker,bitmap,stat);
   if(value!==null)totals[stat.key]=value;
 }
 progress('Lendo cone e Eidolons…');
 const rawCone=await ocr(worker,bitmap,[196,1193,505,95],6,'normal');
 const rawSuper=await ocr(worker,bitmap,[195,1246,525,64],7,'normal');
 const all=clean(rawCone);
 const ranked=coneNames.map(name=>({name,score:clean(name)===all?1:
    all.includes(clean(name))&&clean(name).length>=7?.95:0
 })).sort((a,b)=>b.score-a.score);
 const cone=ranked[0]?.score>=.95?ranked[0].name:
    rawCone.split('\n').map(s=>s.trim()).find(s=>s.length>6&&!/^nv\.?|lv\.?/i.test(s))||'';
 const nSuper=rawSuper.match(/(?:nv\.?\s*)?([1-5])\s*de\s*Sobrepos/i)||
    rawSuper.match(/sobreposi\D{0,8}([1-5])/i);
 const e=classifyEidolons(bitmap);
 const level=Number((levelText.match(/\b([1-8]\d)\b/)||[])[1])||80;
 let relics=null,relicSets=null,relicSetError='',relicLevels=null;
 if(includeRelics){
   try{
     const matcher=await import('./illustrated-relic-matcher.js?v=1');
     relicSets=await matcher.recognizeIllustratedRelicSets(bitmap,progress);
   }catch(error){
     relicSetError=String(error?.message||error);
     console.warn('Reconhecimento de conjuntos:',error);
   }
   try{
     const extraction=await relicRows(worker,bitmap,progress);
     relics=extraction.rows;relicLevels=extraction.levels;
   }catch(error){console.warn('Leitura das relíquias:',error);}
 }
 return {layout:'illustrated-2000x2300',title,character,level,cone,superimposition:nSuper?+nSuper[1]:null,
     eidolon:e.value,eidolonScores:e.brightRatios,totals,relics,relicLevels,relicSets,relicSetError,
     diagnostics:{rawCone,rawSuper,levelText}};
}
export function applyShowcaseToForm(report,root=document){
 const set=(id,value)=>{
   const el=root.getElementById(id);
   if(!el||value===null||value===undefined||value==='')return false;
   el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}));return true;
 };
 if(report.character){
   const select=root.getElementById('v06-id');
   if(select && ![...select.options].some(o=>o.value===report.character.id))
     select.add(new Option(report.character.name,report.character.id));
   set('v06-id',report.character.id);
 }
 set('v06-level',report.level);
 set('v06-e',report.eidolon);
 set('v06-s',report.superimposition);
 set('v06-cone',report.cone);
 for(const [key,value] of Object.entries(report.totals||{}))set('v06-'+key,value);
 let stats=0;
 for(let i=0;i<6;i++)for(let j=0;j<5;j++){
   if(j===0&&report.relicLevels?.[i]!==null&&report.relicLevels?.[i]!==undefined)
     set('v06-r'+i+'-lv',report.relicLevels[i]);
   const r=report.relics?.[i]?.[j];
   if(!r?.stat||r.value===null)continue;
   const statId='v06-r'+i+'-'+(j===0?'main':'k'+(j-1));
   const valId='v06-r'+i+'-'+(j===0?'mainval':'v'+(j-1));
   const field=root.getElementById(statId);
   if(field&&[...field.options].some(o=>o.value===r.stat)){
     if(set(statId,r.stat)&&set(valId,r.value)){
       stats++;field.dataset.ocrSuggestion='1';field.title='Lido da imagem; confira antes de salvar.';
     }
   }
 }
 return {main:Object.keys(report.totals||{}).length,relicStats:stats,character:Boolean(report.character)};
}
