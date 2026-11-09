/* Nexus Scan 2.0 — generic OCR suggestions for individual relic photographs.
 * Never infers set IDs from text or makes confidence guarantees.
 * Suggestions are always reviewed; existing confirmed fields aren't overwritten.
 */
const NORMALIZE=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[+−]/g,'+').replace(/\s+/g,' ').trim();
const STAT_NAMES=[
 ['Regeneração de Energia',/regeneracao (?:de )?energia|energy regeneration/],
 ['Bônus de Cura Realizada',/bonus de cura|outgoing healing boost|healing boost/],
 ['Bônus de Dano Físico',/(?:bonus de )?dano fisico|physical dmg/],
 ['Bônus de Dano de Gelo',/(?:bonus de )?dano (?:de )?gelo|ice dmg/],
 ['Bônus de Dano de Fogo',/(?:bonus de )?dano (?:de )?fogo|fire dmg/],
 ['Bônus de Dano de Raio',/(?:bonus de )?dano (?:de )?raio|lightning dmg/],
 ['Bônus de Dano de Vento',/(?:bonus de )?dano (?:de )?vento|wind dmg/],
 ['Bônus de Dano Quântico',/(?:bonus de )?dano quantico|quantum dmg/],
 ['Bônus de Dano Imaginário',/(?:bonus de )?dano imaginario|imaginary dmg/],
 ['Chance de CRIT',/chance (?:de )?crit|crit rate|taxa (?:de )?crit/],
 ['Dano CRIT',/dano (?:de )?crit|crit dmg|crit damage/],
 ['Efeito de Quebra',/efeito de quebra|break effect/],
 ['Taxa de Acerto de Efeito',/taxa de acerto|effect hit rate/],
 ['RES a Efeito',/res (?:a )?efeito|effect res/],
 ['VEL',/\bvel\b|velocidade|\bspd\b|\bspeed\b/],
 ['PV',/\bpv\b|\bhp\b|pontos de vida|\bvida\b/],
 ['ATQ',/\batq\b|\batk\b|\bataque\b/],
 ['DEF',/\bdef\b|\bdefesa\b/]
];
function parseLine(raw){
 const line=NORMALIZE(raw).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,'');
 const m=line.match(/(?:^|\s)([+−-]?\s*\d{1,5}(?:[.,]\d{1,2})?\s*%?)\s*$/);
 if(!m)return null;
 const n=m[1].replace(/[−]/g,'-').replace(/\s/g,'');
 const number=Number(n.replace(/%/g,'').replace(',','.'));
 if(!Number.isFinite(number)||number<0||number>10000)return null;
 const prefix=line.slice(0,m.index+m[0].length-m[1].length).trim().replace(/[：:]+$/,'').trim();
 const label=STAT_NAMES.find(([,re])=>re.test(prefix));
 if(!label)return null;
 let stat=label[0];
 const percent=/%/.test(n);
 if(['PV','ATQ','DEF'].includes(stat)&&percent)stat+=' %';
 if(['Chance de CRIT','Dano CRIT','Efeito de Quebra','Regeneração de Energia','RES a Efeito','Taxa de Acerto de Efeito'].includes(stat)&&!percent&&number>100)return null;
 return {stat,value:number,raw:String(raw).trim()};
}
export function parseRelicText(text=''){
 const lines=String(text).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,90);
 const candidates=lines.map(parseLine).filter(Boolean);
 const levelLine=lines.find(x=>/(?:^|\s)(?:nível|nivel|level|lv\.?)[.:\s]*\+?\d{1,2}\b/i.test(x))
  ||lines.find(x=>/^\s*\+(?:[0-9]|1[0-5])\s*$/.test(x));
 let level=null;
 if(levelLine){
  const m=levelLine.match(/(?:nível|nivel|level|lv\.?)[.:\s]*\+?(\d{1,2})\b/i)||levelLine.match(/\+(\d{1,2})/);
  if(m&&Number(m[1])<=15)level=Number(m[1]);
 }
 const top=candidates.slice(0,5);
 // The main stat is a suggestion only when five distinct lines are present.
 // Fewer detected lines do not establish main/sub assignment safely.
 const hasStructure=top.length>=5;
 const main=hasStructure?top[0]:null;
 const subs=hasStructure?top.slice(1,5):[];
 const warnings=[];
 if(!candidates.length)warnings.push('O OCR não encontrou atributos e valores na mesma linha.');
 if(candidates.length>5)warnings.push('Foram reconhecidos mais de cinco atributos. Confira qual pertence à peça.');
 if(!hasStructure&&candidates.length)warnings.push('Menos de cinco linhas legíveis: a posição do principal não foi determinada.');
 if(level===null)warnings.push('Nível da peça não identificado.');
 return {level,main,subs,candidates,method:'ocr-text',confidence:'não calibrada',
  validation:'requires-review',warnings,sourceText:String(text||'').slice(0,1800)};
}
let loader=null;
async function tesseract(){
 if(typeof window==='undefined')throw Error('OCR disponível apenas no navegador.');
 if(window.Tesseract)return window.Tesseract;
 if(loader)return loader;
 loader=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  script.async=true;
  script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('Biblioteca OCR indisponível'));
  script.onerror=()=>reject(Error('Não foi possível carregar OCR. Você ainda pode preencher manualmente.'));
  document.head.appendChild(script);
 }).catch(e=>{loader=null;throw e});
 return loader;
}
export async function scanRelicPhoto(image,progress=()=>{}){
 const client=await tesseract();let worker;
 try{
  worker=await client.createWorker('eng',1,{logger:m=>{
   if(m.status==='recognizing text')progress(Math.round(Number(m.progress||0)*100));
  }});
  const recognized=await worker.recognize(image);
  return parseRelicText(recognized?.data?.text||'');
 }finally{try{await worker?.terminate();}catch(_){}}
}
