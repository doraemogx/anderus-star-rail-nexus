/* Nexus Scan 3 — one deterministic image geometry and validation layer.
 * Supports the user's two HoYoLab export formats, not arbitrary screenshots.
 * Pure module: no OCR, DOM, account, uploads or credentials.
 */
export const SLOTS=['Cabeça','Mãos','Corpo','Pés','Esfera Plana','Corda de Ligação'];
export const TYPES=['HEAD','HAND','BODY','FOOT','NECK','OBJECT'];
export const TOTAL_KEYS=['pv','atk','def','spd','crit','cdmg','break','energy'];
export const STATS=['PV','PV %','ATQ','ATQ %','DEF','DEF %','VEL','Chance de CRIT',
 'Dano CRIT','Efeito de Quebra','RES a Efeito','Taxa de Acerto de Efeito',
 'Regeneração de Energia','Bônus de Cura Realizada','Bônus de Dano Físico',
 'Bônus de Dano de Fogo','Bônus de Dano de Gelo','Bônus de Dano de Raio',
 'Bônus de Dano de Vento','Bônus de Dano Quântico','Bônus de Dano Imaginário'];
export const MAIN15={
 'PV':705,'ATQ':352,'PV %':43.2,'ATQ %':43.2,'DEF %':54,'VEL':25,
 'Chance de CRIT':32.4,'Dano CRIT':64.8,'Taxa de Acerto de Efeito':43.2,
 'Bônus de Cura Realizada':34.5,'Regeneração de Energia':19.4,'Efeito de Quebra':64.8,
 'Bônus de Dano Físico':38.8,'Bônus de Dano de Fogo':38.8,'Bônus de Dano de Gelo':38.8,
 'Bônus de Dano de Raio':38.8,'Bônus de Dano de Vento':38.8,'Bônus de Dano Quântico':38.8,
 'Bônus de Dano Imaginário':38.8
};
export const PERCENT=new Set(STATS.filter(x=>x.includes('%')||
 /CRIT|Quebra|Efeito|Energia|Cura|Bônus de Dano/.test(x)));
const HEAD=[141,224,303,383,464,544],SECOND=[144,215,288,360,432];
const OLD_Y=[965,1028,1086,1143,1199,1326,1386,1442,1501,1555];
const ART_Y=[1447,1500,1551,1602,1654,1796,1847,1898,1950,2001];
export const TEMPLATES={
 landscape:{id:'hoyolab-wide',width:2000,height:1826,label:'HoYoLab · cartão horizontal',
  title:[39,47,710,103],cone:[172,1159,572,128],coneLevel:[176,1230,560,63],
  iconCenters:[[1077,910],[1477,910],[1878,910],[1077,1257],[1477,1257],[1878,1257]],
  lefts:[739,1142,1550,739,1142,1550],
  rowY:OLD_Y,headers:[892,1251],
  eidolonCenters:[[170,1042],[251,1042],[332,1042],[413,1042],[494,1042],[575,1042]],
  tracesY:1470,traceXs:[126,248,369,492,614],
  cardTop:[.367,.467,.196,.215],cardBottom:[.367,.68,.196,.218]},
 portrait:{id:'hoyolab-tall',width:2000,height:2300,label:'HoYoLab · cartão vertical',
  title:[39,45,700,118],cone:[174,1168,575,125],coneLevel:[180,1230,555,65],
  iconCenters:[[1073,1384],[1474,1384],[1877,1384],[1073,1738],[1474,1738],[1877,1738]],
  lefts:[742,1146,1551,742,1146,1551],
  rowY:ART_Y,headers:[1371,1724],
  eidolonCenters:[[168,1036],[250,1036],[332,1036],[414,1036],[496,1036],[578,1036]],
  tracesY:1560,traceXs:[126,248,369,492,614],
  cardTop:[.369,.591,.195,.157],cardBottom:[.369,.745,.195,.157]}
};
export function detectLayout(width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<680||height<800)return null;
 const ratio=width/height;
 if(Math.abs(ratio-(2000/2300))<.045)return TEMPLATES.portrait;
 if(Math.abs(ratio-(2000/1826))<.047)return TEMPLATES.landscape;
 return null;
}
export function scaledBox(box,bitmap,template){
 const sx=bitmap.width/template.width,sy=bitmap.height/template.height;
 return [box[0]*sx,box[1]*sy,box[2]*sx,box[3]*sy];
}
export function relicCrop(template,index,row){
 if(index<0||index>5||row<0||row>4)throw Error('Relíquia fora do intervalo');
 const left=template.lefts[index],y=template.rowY[(index<3?0:5)+row];
 const rope=index===5&&row===0;
 return {
  label:[left+35,y-(rope?39:27),245,rope?76:51],
  value:[left+270,y-27,135,54],
  wider:[left+255,y-32,150,64],
  header:[left+98,template.headers[index<3?0:1]-20,115,61]
 };
}
export function relicImageBox(template,index){
 const top=index<3,center=template.iconCenters[index];
 return [center[0]-77,center[1]-75,154,150];
}
export function panelBox(template,index){
 const x=template.lefts[index],isTop=index<3;
 const start=template.headers[isTop?0:1]-24;
 return [x-5,start,398,isTop&&template===TEMPLATES.landscape?348:342];
}
export function totalBox(template,key){
 const idx=TOTAL_KEYS.indexOf(key);
 if(idx<0)throw Error('Atributo inexistente');
 if(template===TEMPLATES.portrait){
  const pos={
   pv:[1232,232,110,67],atk:[1232,287,110,67],def:[1232,344,110,67],
   spd:[1232,398,110,67],crit:[1232,457,110,69],cdmg:[1220,514,122,71],
   break:[1816,231,126,70],energy:[1805,398,142,76]};
  return pos[key];
 }
 const positions={
  pv:[1215,253,151,62],atk:[1215,311,151,62],def:[1215,369,151,62],
  spd:[1215,426,151,62],crit:[1210,483,155,62],cdmg:[1210,542,155,62],
  break:[1795,251,165,65],energy:[1789,423,170,66]};
 return positions[key];
}
export function normalize(text){
 return String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[•·–—_-]/g,' ').replace(/[^a-z0-9 ]/g,' ')
  .replace(/\s+/g,' ').trim();
}
export function distance(a,b){
 const p=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  let prev=p[0];p[0]=i;
  for(let j=1;j<=b.length;j++){
   const old=p[j];p[j]=Math.min(p[j]+1,p[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;
  }
 }
 return p[b.length];
}
export function recognizeCharacter(raw,catalog=[],hintId=''){
 const title=normalize(String(raw).replace(/(?:nv|lv|level)\s*\.?\s*\d{1,2}.*/i,''));
 const entries=Array.isArray(catalog)?catalog:Object.values(catalog||{});
 const map=entries.filter(x=>x?.name&&x?.id);
 // The HoYoLab name "Desbravador(a)" is generic; the owner's canonical
 // Caelus/Path Euphoria variant is 8009, but do not confuse other Paths.
 if(/^desbravador(?: a)?(?:\s|$)/.test(title)){
  const matching=map.find(x=>String(x.id)===String(hintId)&&/^800[13579]$/.test(String(hintId)));
  if(matching)return {id:String(matching.id),name:matching.name,confidence:'profile'};
  const caelus=map.find(x=>String(x.id)==='8009');
  return {id:'8009',name:caelus?.name||'Caelus · Euforia',confidence:'suggestion'};
 }
 const candidates=map.map(entry=>{
  const names=[entry.name,entry.alias].filter(Boolean).map(normalize);
  let score=0;
  for(const name of names){
   if(title===name)score=Math.max(score,1);
   else if(title.startsWith(name+' ')&&name.length>=5)score=Math.max(score,.89);
   else if(name.startsWith(title+' ')&&title.length>=9)score=Math.max(score,.82);
   else if(title.length>=6&&name.length>=6){
    const d=distance(title,name),ratio=d/Math.max(name.length,title.length);
    if(ratio<=.21)score=Math.max(score,1-ratio);
   }
  }
  return {id:String(entry.id),name:entry.name,score};
 }).filter(x=>x.score>=.79).sort((a,b)=>b.score-a.score||b.name.length-a.name.length);
 if(!candidates.length)return null;
 if(candidates[1]&&candidates[0].score-candidates[1].score<.048)return null;
 return {...candidates[0],confidence:candidates[0].score>=.96?'exact':'review'};
}
export function numeric(text){
 if(typeof text==='number')return Number.isFinite(text)?text:null;
 const str=String(text??'').replace(/[Oo]/g,'0').replace(/[lI|]/g,'1')
  .replace(/[Ss]/g,'5').trim();
 if(!str)return null;
 const match=str.match(/(?:\d{1,3}\.\d{3}|\d{1,5})(?:[.,]\d{1,2})?/);
 if(!match)return null;
 let value=match[0];
 if(/^\d{1,3}\.\d{3}$/.test(value))value=value.replace('.','');
 const n=Number(value.replace(',','.'));return Number.isFinite(n)?n:null;
}
export function inferStat(label,valueText=''){
 const s=normalize(label);
 const value=String(valueText||'');
 const pct=/%/.test(value)||/[0-9][.,][0-9]/.test(value);
 if(/regenera|energia/.test(s))return 'Regeneração de Energia';
 if(/bonus.*cura/.test(s))return 'Bônus de Cura Realizada';
 if(/chance.*crit|taxa.*crit|crit.*chance/.test(s))return 'Chance de CRIT';
 if(/dano.*crit|crit.*dano/.test(s))return 'Dano CRIT';
 if(/quebra|break/.test(s))return 'Efeito de Quebra';
 if(/acerto.*efeito/.test(s))return 'Taxa de Acerto de Efeito';
 if(/res.*efeito/.test(s))return 'RES a Efeito';
 const element=s.match(/(?:dano|bonus).*?(fisico|gelo|fogo|raio|vento|quantico|imaginario)/);
 if(element)return 'Bônus de Dano '+({fisico:'Físico',gelo:'Gelo',fogo:'Fogo',
  raio:'Raio',vento:'Vento',quantico:'Quântico',imaginario:'Imaginário'}[element[1]]);
 if(/\bvel\b|velocidade/.test(s))return 'VEL';
 if(/\bdef\b|defesa/.test(s))return pct?'DEF %':'DEF';
 if(/\batq\b|ataque|\batk\b/.test(s))return pct?'ATQ %':'ATQ';
 if(/\bpv\b|vida|\bhp\b/.test(s))return pct?'PV %':'PV';
 return '';
}
export function reasonable(stat,value,slot,main=false){
 if(!stat||!Number.isFinite(value)||value<=0)return false;
 if(main){
  if(slot===0)return stat==='PV'&&value>=100&&value<=2000;
  if(slot===1)return stat==='ATQ'&&value>=50&&value<=800;
  const allowed=[['PV %','ATQ %','DEF %','Chance de CRIT','Dano CRIT',
   'Taxa de Acerto de Efeito','Bônus de Cura Realizada'],
   ['PV %','ATQ %','DEF %','VEL'],
   ['PV %','ATQ %','DEF %','Bônus de Dano Físico','Bônus de Dano de Fogo',
    'Bônus de Dano de Gelo','Bônus de Dano de Vento','Bônus de Dano de Raio',
    'Bônus de Dano Quântico','Bônus de Dano Imaginário'],
   ['PV %','ATQ %','DEF %','Regeneração de Energia','Efeito de Quebra']][slot-2];
  return allowed?.includes(stat)&&value<=110&&(stat==='Regeneração de Energia'?value>=3:true);
 }
 const ranges={'PV':[30,650],'ATQ':[16,138],'DEF':[15,275],'VEL':[2,19],
  'PV %':[3.4,54],'ATQ %':[3.4,54],'DEF %':[4.3,54],
  'Chance de CRIT':[2.5,23],'Dano CRIT':[5.1,47],
  'Taxa de Acerto de Efeito':[3.4,55],'RES a Efeito':[3.4,55],
  'Efeito de Quebra':[5.1,70]};
 const [min,max]=ranges[stat]||[1,100];
 return value>=min&&value<=max;
}
export function chooseReading({texts=[],stat='',slot=0,main=false,level=null}){
 const valid=texts.map(t=>numeric(t)).filter(v=>reasonable(stat,v,slot,main));
 const unique=[...new Set(valid)];
 if(main&&level===15&&Object.hasOwn(MAIN15,stat)&&
    reasonable(stat,MAIN15[stat],slot,true)){
  return {value:MAIN15[stat],confidence:valid.some(v=>Math.abs(v-MAIN15[stat])<.1)?
   'checked':'derived-15'};
 }
 for(const n of unique)if(valid.filter(x=>Math.abs(x-n)<.11).length>=2)
  return {value:n,confidence:'checked'};
 if(unique.length===1)return {value:unique[0],confidence:'review'};
 return {value:null,confidence:'pending'};
}
export function blankRelics(){
 return SLOTS.map((slot,i)=>({slot,type:TYPES[i],setId:'',
  level:null,main:{stat:'',value:null},
  subs:Array.from({length:4},()=>({stat:'',value:null})),confidence:[]}));
}
export function analyzeCompleteness(record){
 const pieces=record.relics||[];
 const known=pieces.reduce((n,r)=>n+Number(Boolean(r.setId)),0);
 const values=pieces.reduce((n,r)=>n+Number(Boolean(r.main?.stat&&r.main.value!=null))+
  (r.subs||[]).filter(x=>x.stat&&x.value!=null).length,0);
 const total=TOTAL_KEYS.filter(k=>record.totals?.[k]!=null).length;
 return {sets:known,relicValues:values,totals:total,
  full:known===6&&values===30&&total===8&&Boolean(record.characterId)};
}
