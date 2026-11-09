/* ANDERUS account engine: one six-relic schema, light cone details, deterministic advice. */
export const SLOTS=['Cabeça','Mãos','Corpo','Pés','Esfera Plana','Corda de Ligação'];
export const TYPES=['HEAD','HAND','BODY','FOOT','NECK','OBJECT'];
export const STATS=['PV','PV %','ATQ','ATQ %','DEF','DEF %','VEL','Chance de CRIT','Dano CRIT','Efeito de Quebra','RES a Efeito','Taxa de Acerto de Efeito','Regeneração de Energia','Bônus de Dano Físico','Bônus de Dano de Fogo','Bônus de Dano de Gelo','Bônus de Dano de Raio','Bônus de Dano de Vento','Bônus de Dano Quântico','Bônus de Dano Imaginário','Bônus de Cura Realizada'];
export const MAIN15={'PV':705,'ATQ':352,'PV %':43.2,'ATQ %':43.2,'DEF %':54,'VEL':25,'Chance de CRIT':32.4,'Dano CRIT':64.8,'Taxa de Acerto de Efeito':43.2,'Bônus de Cura Realizada':34.5,'Regeneração de Energia':19.4,'Efeito de Quebra':64.8,'Bônus de Dano Físico':38.8,'Bônus de Dano de Gelo':38.8,'Bônus de Dano de Fogo':38.8,'Bônus de Dano de Raio':38.8,'Bônus de Dano de Vento':38.8,'Bônus de Dano Quântico':38.8,'Bônus de Dano Imaginário':38.8};
export const PATHS={Rogue:'Caça',Warrior:'Destruição',Mage:'Erudição',Shaman:'Harmonia',Knight:'Preservação',Warlock:'Inexistência',Priest:'Abundância',Memory:'Reminiscência',Elation:'Euforia'};
export const PERCENT=new Set(STATS.filter(x=>x.includes('%')||['Chance de CRIT','Dano CRIT','Efeito de Quebra','RES a Efeito','Taxa de Acerto de Efeito','Regeneração de Energia','Bônus de Cura Realizada'].includes(x)||x.startsWith('Bônus de Dano')));
export function clean(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[•·–—-]/g,' ').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
export function fmt(n){const x=Number(n);return Number.isFinite(x)?x.toLocaleString('pt-BR',{maximumFractionDigits:2}):'—'}
export function pretty(stat,value){return fmt(value)+(PERCENT.has(stat)?'%':'')}
export function matchCone(name,cones={}){const key=clean(name);return key?Object.values(cones).find(c=>clean(c.name)===key)||null:null}
export function coneEffect(rank,s=1){
 if(!rank?.desc)return '';
 const index=Math.max(0,Math.min(4,Number(s||1)-1)),params=rank.params?.[index]||rank.params?.[0]||[];
 return String(rank.desc).replace(/#(\d+)\[[^\]]+\](%?)/g,(match,n,percent)=>{
   const value=Number(params[Number(n)-1]);
   return Number.isFinite(value)?fmt(percent?value*100:value)+percent:match;
 });
}
export function numeric(v){
 if(v===null||v===undefined||v==='')return null;
 const x=Number(typeof v==='number'?v:String(v).trim().replace(/\s/g,'').replace(/%/g,'').replace(',','.'));
 return Number.isFinite(x)?x:null;
}
function legacySubs(value){
 if(Array.isArray(value))return value.map(v=>({stat:String(v?.stat||''),value:numeric(v?.value)}));
 return String(value||'').split(/\r?\n| · /).map(row=>{
   const stat=STATS.slice().sort((a,b)=>b.length-a.length).find(x=>clean(row).startsWith(clean(x)+' '));
   return stat?{stat,value:numeric(row.slice(stat.length))}:null;
 }).filter(Boolean);
}
function knownSet(obj,sets){
 if(obj?.setId)return String(obj.setId);
 const name=clean(obj?.set||obj?.setName);
 if(!name)return '';
 const match=Object.values(sets||{}).find(x=>clean(x.name)===name);
 return match?String(match.id):'';
}
export function normalizeRelics(details,legacy,sets={}){
 return SLOTS.map((slot,i)=>{
   const d=details?.[i]||{},old=legacy?.[i]||{};
   const detailed=Boolean(d.setId||d.main?.stat||(d.subs||[]).some(x=>x?.stat));
   const setId=knownSet(d,sets)||knownSet(old,sets);
   const mainStat=String(detailed?d.main?.stat||old.main?.stat||old.main||'':old.main?.stat||old.main||'');
   const mainValue=numeric(detailed?d.main?.value??old.main?.value??old.value:old.main?.value??old.value);
   const level=numeric(detailed?d.level??old.level:old.level);
   // Preserve observed OCR and manually entered values. Reference level-15 values
   // are not a substitute for evidence; missing fields remain explicitly null.
   const corrected=mainValue;
   const subs=(detailed&&Array.isArray(d.subs)?d.subs:legacySubs(old.subs)).slice(0,4)
      .map(x=>({stat:String(x?.stat||''),value:numeric(x?.value)}));
   while(subs.length<4)subs.push({stat:'',value:null});
   return {slot,type:TYPES[i],setId,setName:String(d.setName||old.setName||old.set||''),
      level,main:{stat:mainStat,value:corrected},subs};
 });
}
export function toLegacy(records,sets={},existing={}){
 const out={...existing};
 records.forEach((r,i)=>{
   const setName=sets[r.setId]?.name||r.setName||existing[i]?.set||'';
   out[i]={set:setName,setId:r.setId||'',main:r.main?.stat||'',value:r.main?.value==null?'':pretty(r.main.stat,r.main.value),
      level:r.level??'',subs:(r.subs||[]).filter(s=>s.stat&&s.value!==null).map(s=>s.stat+' '+pretty(s.stat,s.value)).join('\n')};
 });
 return out;
}
export function examineRelics(records){
 const r=normalizeRelics(records),counts={},flags=[];
 let registered=0,complete=0;
 r.forEach((p,i)=>{
   const label=SLOTS[i],present=Boolean(p.setId||p.main.stat);
   if(present)registered++;
   if(p.setId)counts[p.setId]=(counts[p.setId]||0)+1;
   const missing=p.subs.filter(s=>!s.stat||s.value===null).length;
   if(p.setId&&p.main.stat&&p.main.value!==null&&!missing)complete++;
   if(!p.setId)flags.push(label+': falta identificar o conjunto');
   if(!p.main.stat||p.main.value===null)flags.push(label+': atributo principal pendente');
   if(p.level===15&&p.main.stat&&p.main.value!==null&&Object.hasOwn(MAIN15,p.main.stat)&&Math.abs(p.main.value-MAIN15[p.main.stat])>0.06)
     flags.push(label+': valor principal '+fmt(p.main.value)+' diverge da referência de nível 15 ('+fmt(MAIN15[p.main.stat])+'); confirme no print antes de corrigir');
   if(missing)flags.push(label+': '+missing+' subatributo(s) pendente(s)');
   for(const sub of p.subs){
     const v=Number(sub.value);
     if(sub.stat&&sub.value!==null&&(
       (sub.stat==='Chance de CRIT'&&(v<2.5||v>25))||
       (sub.stat==='Dano CRIT'&&(v<5||v>50))||
       (sub.stat==='VEL'&&v>20)||
       (sub.stat==='ATQ'&&![[16,23],[32,46],[48,69],[64,92],[80,115],[96,138]].some(([lo,hi])=>v>=lo&&v<=hi))||
       (sub.stat==='Taxa de Acerto de Efeito'&&v>55)))
         flags.push(label+': verificar '+sub.stat+' '+fmt(v));
   }
 });
 return {registered,complete,counts,flags,records:r};
}
export function buildCoach(options={}){
 const {character={},build={},records=[],sets={},cone=null,coneRank=null,skills=[]}=options;
 const review=examineRelics(records),notes=[];
 const add=(title,body,kind='note')=>notes.push({title,body,kind});
 if(!build||!Object.keys(build).length){
   add('Cadastre a personagem','É preciso registrar seus atributos e equipamentos para analisar a conta.','action');
   return notes;
 }
 if(review.registered<6)add('Equipamentos incompletos',review.registered+'/6 peças cadastradas. Registre as peças restantes antes de avaliar bônus de conjunto.','action');
 else add('Estado da build',review.registered+'/6 peças registradas; '+review.complete+'/6 com os quatro subatributos. '+(review.flags.length?'Há pontos a revisar.':'Não há campos incompletos na ficha.'),review.flags.length?'warning':'good');
 if(review.flags.length)add('Primeira prioridade',review.flags.slice(0,3).join(' · ')+(review.flags.length>3?' · outros campos exigem revisão.':''),'warning');
 for(const [id,qty] of Object.entries(review.counts).sort((a,b)=>b[1]-a[1]).slice(0,2)){
   const set=sets[id]||{},name=set.name||review.records.find(r=>r.setId===id)?.setName||'Conjunto '+id;
   const planar=Number(id)>=300,activated=qty>=(planar?2:4)?(planar?2:4):qty>=2&&!planar?2:0;
   const effect=activated===4?set.desc?.[1]:set.desc?.[0];
   add(name,qty+' peça(s) · '+(activated?'bônus de '+activated+' peças ativo':'bônus ainda incompleto')+'. '+(effect?String(effect).slice(0,300):'Confira as condições do conjunto no jogo.'),activated?'good':'warning');
 }
 if(cone){
   const incompatible=character.path&&cone.path&&character.path!==cone.path;
   add('Cone equipado · S'+(build.s||1),cone.name+' · '+(PATHS[cone.path]||cone.path||'Caminho não informado')+'. '+
    (incompatible?'O cone é de outro Caminho: a habilidade passiva não é ativada. ':'')+
    (coneRank?.desc?coneEffect(coneRank,build.s).slice(0,310):'Abra a ficha do cone para conferir o efeito.'),
    incompatible?'warning':'note');
 }else add('Cone por verificar','O cone equipado não foi encontrado no catálogo pelo nome salvo. Confirme a grafia para ver arte, Caminho e efeito.','warning');
 const kit=(skills||[]).filter(s=>s?.desc&&(s.type_text==='ATQ Básico'||s.type_text==='Perícia'||s.type_text==='Perícia Suprema'||s.type_text==='Talento'));
 const kitText=clean(kit.map(s=>s.desc).join(' '));
 const memo=kit.some(s=>clean(s.desc).includes('memoespirito'));
 // Keep scaling checks within the same small phrase after "igual a".
 // Do not match an unrelated DEF mention hundreds of words later.
 const hpScale=kit.some(s=>/igual a.{0,100}\bpv maximos\b/.test(clean(s.desc)));
 const defScale=kit.some(s=>/igual a.{0,100}\bdef\b/.test(clean(s.desc)));
 const atkScale=kit.some(s=>/igual a.{0,100}\batq\b/.test(clean(s.desc)));
 if(memo){
   const skill=kit.find(s=>clean(s.desc).includes('memoespirito'));
   add('Mecânica do Memoespírito',
     'Seu kit utiliza um Memoespírito'+(skill?.name?' — confira "'+skill.name+'".':'')+
     ' Priorize a ativação e permanência dele no campo antes de avaliar bônus que exigem ataques ou habilidades da invocação.',
     'note');
   if(cone&&clean(coneRank?.desc).includes('memoespirito'))
     add('Sinergia entre cone e kit','O efeito de '+cone.name+' menciona ataques do Memoespírito. O kit de '+
       (character.name||'sua personagem')+' também usa essa mecânica. Confira se o ataque ocorre com a frequência necessária; o bônus não é permanente sem o gatilho.',
       'good');
 }
 const scaling=defScale?'DEF':hpScale?'PV máximos':atkScale?'ATQ':null;
 if(scaling){
   const statValue=scaling==='DEF'?build.def:scaling==='PV máximos'?build.pv:build.atk;
   add('Escalamento identificado no kit','As descrições de habilidades indicam '+scaling+
     ' como referência para pelo menos um efeito. '+(statValue?'Seu registro atual é '+fmt(statValue)+'. ':'')+
     'Confira os multiplicadores e condições específicos antes de trocar peças; esta leitura não substitui um cálculo de dano.',
     'note');
 }
 if(/mandou bem|piada|vibracoes|arquetipo estetico/.test(kitText)){
   const resources=[];
   for(const [word,label] of [['mandou bem','Mandou Bem'],['piada','Piada'],['vibracoes','Vibrações'],['arquetipo estetico','Arquétipo Estético']])
     if(kitText.includes(word))resources.push(label);
   add('Recursos da rotação',resources.join(' · ')+
      ' aparecem nas habilidades. Sincronize geração e gasto desses recursos com a equipe e verifique seus limites no Kit e rastros.',
      'note');
 }
 if(Number(build.spd)>0)add('Velocidade e rotação',fmt(build.spd)+' VEL fora de combate. '+
   (Number(build.spd)>=134?'Ultrapassa 134, mas ações por ciclo dependem dos buffs e da rotação.':'Ajuste a ordem de ações aos demais integrantes e às condições das habilidades.'),'note');
 if(build.crit!==undefined&&build.cdmg!==undefined)
   add('Atributos críticos',fmt(build.crit)+'% de Chance CRIT e '+fmt(build.cdmg)+'% de Dano CRIT registrados. A prioridade real depende do kit e dos efeitos ativos.','note');
 return notes.slice(0,11);
}
