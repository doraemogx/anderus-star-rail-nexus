/* Nexus Scan 3 — redesigned, mobile-first HoYoLab import and safe account save.
 * One place for both image layouts. Keeps the approved Anderus login/cloud sync.
 */
import {SLOTS,STATS,MAIN15,TOTAL_KEYS,blankRelics,analyzeCompleteness,detectLayout}
 from './nexus-scan-v3-core.js';
import {readHoYoLab,catalogue,makeRelicThumbnails} from './nexus-scan-v3-reader.js';
import {mergeRelicImport,normalizeRelics,toLegacy,pendingRelicFields}
 from './nexus-account-engine.js';

const ACCOUNT='anderus_nexus_v03',BACKUP='anderus_nexus_backup_before_scan_v3';
const src='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const e=s=>String(s??'').replace(/[&<>"']/g,x=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const fmt=n=>n==null?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
let current=null,catalog=null,requestNumber=0;
function readAccount(){
 const parsed=JSON.parse(localStorage.getItem(ACCOUNT)||'{"characters":{}}');
 if(!parsed||typeof parsed!=='object'||!parsed.characters||typeof parsed.characters!=='object')
  throw Error('Os dados atuais não puderam ser lidos. Nenhum registro foi alterado.');
 return parsed;
}
function dialog(){
 let dlg=document.getElementById('nexus-scan-v3');
 if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-scan-v3';
 dlg.setAttribute('aria-label','Nexus Scan · importar personagem da HoYoLab');
 dlg.innerHTML='<div class="ns3-shell"><header class="ns3-top">'+
 '<div><span class="ns3-kicker">ANDERUS · NEXUS SCAN 3</span>'+
 '<h2>Importar da HoYoLab</h2><p>Um print. Seu personagem e os seis equipamentos.</p></div>'+
 '<button type="button" class="ns3-close" data-action="close" aria-label="Fechar">×</button></header>'+
 '<div id="ns3-body"></div>'+
 '<div id="ns3-message" role="status" aria-live="polite"></div></div>';
 document.body.append(dlg);
 dlg.addEventListener('click',event=>{
  if(event.target===dlg)close();
  const target=event.target.closest('[data-action]');
  if(target)act(target.dataset.action,target);
 });
 dlg.addEventListener('change',event=>changed(event));
 dlg.addEventListener('input',event=>input(event));
 dlg.addEventListener('cancel',()=>{requestNumber++;current=null;});
 return dlg;
}
function close(){
 requestNumber++;current=null;
 const dlg=dialog();if(dlg.open)dlg.close();
}
function message(txt,warning=false){
 const out=dialog().querySelector('#ns3-message');
 out.textContent=txt||'';out.dataset.error=warning?'yes':'no';
}
function input(event){
 const el=event.target,key=el.dataset.field;
 if(!current?.report||!key)return;
 const report=current.report;
 if(key==='cone')report.cone=el.value;
 else if(key==='level'||key==='eidolon'||key==='superimposition')
  report[key]=el.value===''?null:Number(el.value);
 else if(TOTAL_KEYS.includes(key))report.totals[key]=el.value===''?null:Number(el.value);
 else if(key==='set'){
  const i=Number(el.dataset.index);
  report.relics[i].setId=el.value;
  report.relics[i].setName=catalog.relicSets?.[el.value]?.name||'';
  report.relics[i].setConfidence='manual';
 }else if(key==='reliclevel'){
  const i=Number(el.dataset.index);
  report.relics[i].level=el.value===''?null:Number(el.value);
 }else if(key==='relicstat'||key==='relicvalue'){
  const i=Number(el.dataset.index),j=Number(el.dataset.row);
  const row=j===0?report.relics[i].main:report.relics[i].subs[j-1];
  if(key==='relicstat')row.stat=el.value;
  else row.value=el.value===''?null:Number(el.value);
  row.confidence='manual';
 }
 report.completeness=analyzeCompleteness(report);
 const meter=dialog().querySelector('#ns3-progress-line');
 if(meter)meter.textContent=progressText(report);
}
function changed(event){
 const el=event.target;
 if(el.id==='ns3-file'&&el.files?.[0])scan(el.files[0]);
 if(!current?.report)return;
 if(el.id==='ns3-character'){
  current.report.characterId=el.value;
  current.report.characterName=catalog.chars?.[el.value]?.name||'';
  current.report.characterConfidence='manual';
  const meter=dialog().querySelector('#ns3-progress-line');
  if(meter)meter.textContent=progressText(current.report);
 }
}
function selectedChoice(items,selected,title){
 return '<option value="">'+e(title)+'</option>'+items.map(item=>
  '<option value="'+e(item.id)+'"'+(String(item.id)===String(selected)?' selected':'')+'>'+
   e(item.name)+'</option>').join('');
}
function statOptions(selected){
 return '<option value="">Escolher atributo</option>'+STATS.map(x=>
  '<option value="'+e(x)+'"'+(x===selected?' selected':'')+'>'+e(x)+'</option>').join('');
}
function progressText(report){
 const a=analyzeCompleteness(report);
 return a.totals+'/8 atributos · '+a.sets+'/6 conjuntos · '+a.relicValues+'/30 valores de relíquias';
}
function initial(){
 const body=dialog().querySelector('#ns3-body');
 body.innerHTML='<div class="ns3-intro"><div class="ns3-intro-graphic" aria-hidden="true">✦</div>'+
 '<h3>Seu registro de batalha, sem digitação desnecessária.</h3>'+
 '<p>Selecione o cartão completo em que aparecem os atributos, cone de luz, Eidolons e seis relíquias. Aceitamos os dois modelos da HoYoLab que você utiliza.</p>'+
 '<label class="ns3-pick" for="ns3-file">Escolher print da HoYoLab <span>PNG, JPG ou WEBP</span></label>'+
 '<input id="ns3-file" type="file" accept="image/png,image/jpeg,image/webp">'+
 '<p class="ns3-privacy">A imagem é analisada no seu aparelho. Nada será enviado ao ChatGPT. Os personagens atuais não serão apagados.</p>'+
 '<button type="button" class="ns3-undo" data-action="undo">Desfazer a última importação</button></div>';
 message('');
}
function loading(file){
 dialog().querySelector('#ns3-body').innerHTML=
  '<div class="ns3-loading"><div class="ns3-sigil" aria-hidden="true">✧</div>'+
  '<h3>Reconhecendo a ficha da HoYoLab…</h3>'+
  '<p id="ns3-loading-step">Preparando a imagem</p>'+
  '<progress id="ns3-loader" aria-label="Leitura da imagem"></progress>'+
  '<p>Você poderá conferir todos os campos antes de salvar.</p>'+
  '<button type="button" data-action="cancel">Cancelar leitura</button></div>';
 message('');
}
function selectCharacter(report){
 const rows=Object.values(catalog.chars||{}).filter(x=>x?.name&&x?.id&&x.name!=='{NICKNAME}')
  .map(c=>({id:String(c.id),name:c.name})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 if(!rows.some(x=>x.id==='8009'))rows.push({id:'8009',name:'Caelus · Euforia'});
 return '<label>Personagem <select id="ns3-character" required>'+
  selectedChoice(rows,report.characterId,'Escolha a personagem')+'</select></label>';
}
function numberField(name,title,value,step='1',min='0',max='99999'){
 return '<label>'+e(title)+'<input type="number" inputmode="decimal" step="'+step+
  '" min="'+min+'" max="'+max+'" data-field="'+name+'" value="'+e(value??'')+'"></label>';
}
function formatImage(img){return img?'<img src="'+e(img)+'" alt="Recorte do equipamento no print">':'';}
function relicCard(piece,index){
 const list=Object.entries(catalog.relicSets||{}).filter(([id])=>
  index<4?Number(id)<300:Number(id)>=300)
  .map(([id,entry])=>({id,name:entry.name})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const filled=Number(piece.main?.stat&&piece.main.value!=null)+piece.subs.filter(x=>x.stat&&x.value!=null).length;
 const label=piece.setName||catalog.relicSets?.[piece.setId]?.name||'Conjunto ainda não identificado';
 const suggestions=(piece.suggestions||[]).slice(0,3).map(s=>
  '<button type="button" data-action="suggest" data-index="'+index+'" data-set="'+e(s.setId)+'">'+
   '<img src="'+e(src+s.icon)+'" alt="">'+e(s.name)+'</button>').join('');
 const subs=[piece.main,...piece.subs].map((stat,j)=>
  '<div class="ns3-relic-row"><select data-field="relicstat" data-index="'+index+
  '" data-row="'+j+'" aria-label="'+(j?'Subatributo '+j:'Atributo principal')+'">'+
  statOptions(stat?.stat||'')+'</select><input data-field="relicvalue" data-index="'+index+
  '" data-row="'+j+'" type="number" step="any" inputmode="decimal" placeholder="Valor" value="'+
   e(stat?.value??'')+'" aria-label="Valor '+(j?'do subatributo '+j:'principal')+'"></div>').join('');
 return '<details class="ns3-piece" id="ns3-piece-'+index+'"><summary>'+
  '<span class="ns3-piece-no">'+(index+1)+'</span>'+
  '<span class="ns3-piece-image">'+formatImage(current.images?.[index])+'</span>'+
  '<span class="ns3-piece-title"><strong>'+e(SLOTS[index])+'</strong><small>'+
  e(label)+'</small></span><span class="ns3-piece-count">'+filled+'/5</span>'+
  '<span class="ns3-expander" aria-hidden="true">⌄</span></summary>'+
  '<div class="ns3-piece-detail">'+
  (suggestions?'<p class="ns3-label">Conferir pelo ícone</p><div class="ns3-suggestions">'+suggestions+'</div>':'')+
  '<label>Conjunto equipado<select data-field="set" data-index="'+index+'">'+
   selectedChoice(list,piece.setId,'Conjunto não identificado')+'</select></label>'+
  '<div class="ns3-piece-cols"><label>Nível da peça<input type="number" inputmode="numeric" min="0" max="15" step="1" data-field="reliclevel" data-index="'+index+'" value="'+e(piece.level??'')+'" placeholder="+15"></label>'+
  '<span class="ns3-piece-note">Confira o nome, o principal e os quatro subatributos. Seus dados anteriores são preservados.</span></div>'+
  '<p class="ns3-label">Principal e quatro subatributos</p>'+subs+'</div></details>';
}
function form(report){
 const data=report,totals=TOTAL_KEYS.map(key=>numberField(key,{
 pv:'PV',atk:'ATQ',def:'DEF',spd:'VEL',crit:'Chance CRIT (%)',
 cdmg:'Dano CRIT (%)',break:'Efeito de Quebra (%)',
 energy:'Regeneração de Energia (%)'}[key],data.totals[key],key==='pv'||key==='atk'||key==='def'||key==='spd'?'1':'0.1')).join('');
 const summary=progressText(report);
 const img=current.preview?'<img src="'+e(current.preview)+'" alt="Seu cartão da HoYoLab">':'';
 const title=report.characterName||'Personagem ainda não identificado';
 const dims=report.layout==='hoyolab-tall'?'Modelo vertical':'Modelo horizontal';
 return '<div class="ns3-review"><div class="ns3-overview">'+
  '<div class="ns3-card-image">'+img+'</div><div><span class="ns3-kicker">'+e(dims)+'</span>'+
  '<h3>'+e(title)+'</h3><p id="ns3-progress-line">'+e(summary)+'</p>'+
  '<button type="button" class="ns3-text-button" data-action="replace">Trocar imagem</button></div></div>'+
  '<section class="ns3-section"><h3>1. Identificação</h3><p>O nome, o cone e os atributos aparecem preenchidos quando reconhecidos. Corrija apenas o que estiver diferente.</p>'+
  '<div class="ns3-fields">'+selectCharacter(report)+
  numberField('level','Nível',report.level,'1','1','80')+
  numberField('eidolon','Eidolons E0–E6',report.eidolon,'1','0','6')+
  numberField('superimposition','Cone S1–S5',report.superimposition,'1','1','5')+
  '</div><label class="ns3-wide">Cone de luz<input type="text" data-field="cone" list="ns3-cones" value="'+e(report.cone)+'" placeholder="Nome do cone"></label>'+
  '<datalist id="ns3-cones">'+Object.values(catalog.cones||{}).filter(c=>c?.name).map(c=>
   '<option value="'+e(c.name)+'"></option>').join('')+'</datalist>'+
  '</section><section class="ns3-section"><h3>2. Atributos totais</h3><div class="ns3-fields">'+totals+'</div></section>'+
  '<section class="ns3-section"><div class="ns3-relics-head"><div><h3>3. As seis relíquias</h3>'+
  '<p>Abra qualquer peça para conferir ou corrigir. Os conjuntos são sugeridos pela arte dos equipamentos.</p></div></div>'+
  '<div class="ns3-relics">'+report.relics.map(relicCard).join('')+'</div></section>'+
  '<div class="ns3-save"><label><input type="checkbox" id="ns3-confirm"> Conferi os dados do personagem e sei que campos não reconhecidos permanecerão pendentes.</label>'+
  '<button type="button" data-action="save" class="ns3-save-button">Salvar e sincronizar minha build</button>'+
  '<p>O Nexus guarda uma cópia da conta antes de salvar. A sincronização com seus outros dispositivos continua ativa.</p></div></div>';
}
async function preview(file){
 const bmp=await createImageBitmap(file);
 try{
  const canvas=document.createElement('canvas');canvas.width=Math.min(550,bmp.width);
  canvas.height=Math.round(canvas.width*bmp.height/bmp.width);
  canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/webp',.62);
 }finally{bmp.close()}
}
function copySavedIntoReport(report,account){
 const id=report.characterId;if(!id)return;
 const old=account.characters?.[id];if(!old)return;
 for(const key of ['level','eidolon','superimposition']){
  if(report[key]==null){
   const saved=old[key==='eidolon'?'e':key==='superimposition'?'s':key];
   if(saved!=null)report[key]=saved;
  }
 }
 if(!report.cone)report.cone=old.cone||'';
 for(const k of TOTAL_KEYS)if(report.totals[k]==null&&old[k]!=null)report.totals[k]=old[k];
 const prior=normalizeRelics(account.v06RelicDetails?.[id]||[],old.relics||{},catalog.relicSets);
 report.relics=mergeRelicImport(report.relics,prior,old.relics||{},catalog.relicSets)
  .map((piece,i)=>({...piece,
   suggestions:report.relics[i]?.suggestions||[],
   setConfidence:report.relics[i]?.setConfidence||'saved'}));
}
async function scan(file){
 if(!file)return;
 const token=++requestNumber;
 const hintId=current?.hintId||'';
 current={hintId,file};
 loading(file);
 try{
  const progress=text=>{
   if(token!==requestNumber)return;
   const el=dialog().querySelector('#ns3-loading-step');
   if(el)el.textContent=text;
  };
  const [report,small]=await Promise.all([readHoYoLab(file,{hintId,progress}),preview(file)]);
  if(token!==requestNumber)return;
  catalog=await catalogue();
  const dims=detectLayout(report.width,report.height);
  const thumbnails=await makeRelicThumbnails(file,dims);
  if(token!==requestNumber)return;
  const before=readAccount();
  copySavedIntoReport(report,before);
  current={hintId,file,report,preview:small,images:thumbnails};
  report.completeness=analyzeCompleteness(report);
  dialog().querySelector('#ns3-body').innerHTML=form(report);
  const missing=30-report.completeness.relicValues;
  message(missing?'O leitor encontrou '+report.completeness.relicValues+
   '/30 números das relíquias. Abra apenas as peças incompletas para revisar.':
   'Trinta atributos das seis relíquias preenchidos. Confira antes de salvar.');
 }catch(err){
  if(token!==requestNumber)return;
  console.warn('Nexus Scan 3:',err);
  const reason=String(err.message||err);
  dialog().querySelector('#ns3-body').innerHTML=
   '<div class="ns3-error"><h3>A leitura não foi concluída</h3><p>'+e(reason)+'</p>'+
   '<button type="button" data-action="replace">Selecionar outro cartão</button></div>';
  message('Sua conta não foi alterada.',true);
 }
}
function backupDB(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(Error('IndexedDB indisponível'));
  const req=indexedDB.open('anderus-nexus-scan-backups',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('records');
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Backup não pôde ser aberto.'));
 });
}
async function recordBackup(value){
 const db=await backupDB();
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('records','readwrite');
   tx.objectStore('records').put(value,'last-safe-account');
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   tx.onabort=()=>reject(tx.error);
  });
 }finally{db.close();}
}
async function readBackup(){
 try{
  const db=await backupDB();
  try{return await new Promise((resolve,reject)=>{
   const req=db.transaction('records','readonly').objectStore('records').get('last-safe-account');
   req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
  });}finally{db.close();}
 }catch(_){return localStorage.getItem(BACKUP);}
}
async function immutableSnapshot(account){
 const str=JSON.stringify(account);
 // Save large accounts in IndexedDB; another copy in localStorage can exceed
 // browser quota for users with many character previews.
 try{
  await recordBackup(str);
  if(await readBackup()!==str)throw Error('Backup não verificado');
 }catch(error){
  // Fallback for old/private browsers without IndexedDB.
  try{
   localStorage.setItem(BACKUP,str);
   if(localStorage.getItem(BACKUP)!==str)throw Error('Backup incompleto');
  }catch(_){throw Error('Não foi possível garantir um backup. Exporte sua conta antes de importar.');}
 }
 return str;
}
async function undoLastScan(){
 const previous=await readBackup();
 if(!previous)return message('Nenhuma importação anterior encontrada neste aparelho.',true);
 if(!window.confirm('Restaurar a conta exatamente como estava antes da última importação?'))return;
 const active=localStorage.getItem(ACCOUNT);
 try{localStorage.setItem(ACCOUNT,previous);}
 catch(_){
  if(active!=null)try{localStorage.setItem(ACCOUNT,active)}catch(_){}
  return message('Sem espaço para restaurar o backup. Seus dados atuais foram mantidos.',true);
 }
 const dlg=dialog();if(dlg.open)dlg.close();
 requestNumber++;current=null;
 try{await window.NexusCloudSync?.sync?.()}catch(_){}
 location.reload();
}
async function save(){
 if(!current?.report)return;
 const report=current.report,checkbox=dialog().querySelector('#ns3-confirm');
 if(!checkbox?.checked)return message('Marque que conferiu os campos antes de salvar.',true);
 if(!report.characterId)return message('Escolha o personagem para evitar salvar uma build na ficha errada.',true);
 try{
  const account=readAccount(),id=String(report.characterId);
  const before=await immutableSnapshot(account);
  const previous=account.characters[id]||{};
  const build={...previous};
  for(const [name,value] of Object.entries({
   level:report.level,e:report.eidolon,s:report.superimposition,
   ...report.totals})){
   if(value!==null&&value!==undefined&&value!=='')build[name]=value;
  }
  if(report.cone?.trim())build.cone=report.cone.trim();
  const relics=mergeRelicImport(report.relics,account.v06RelicDetails?.[id]||[],
   previous.relics||{},catalog.relicSets||{});
  build.relics=toLegacy(relics,catalog.relicSets||{},previous.relics||{});
  build.importPending=[
   ...['level','e','s','pv','atk','def','spd','crit','cdmg','cone']
    .filter(k=>build[k]==null||build[k]==='').map(k=>'Atributo: '+k),
   ...pendingRelicFields(relics)
  ];
  if(!build.importPending.length)delete build.importPending;
  account.characters={...account.characters,[id]:build};
  account.v06RelicDetails={...(account.v06RelicDetails||{}),[id]:relics};
  if(current.preview)account.v06Screens={...(account.v06Screens||{}),[id]:current.preview};
  if(current.images?.length===6)
   account.v06Relics={...(account.v06Relics||{}),[id]:current.images};
  const serialized=JSON.stringify(account);
  try{
   localStorage.setItem(ACCOUNT,serialized);
   if(localStorage.getItem(ACCOUNT)!==serialized)throw Error('Gravação incompleta.');
  }catch(error){
   try{localStorage.setItem(ACCOUNT,before)}catch(_){}
   throw Error('Não consegui salvar sem risco de perder dados; a conta anterior foi mantida.');
  }
  message('Personagem salvo. Sincronizando a mesma conta com seus aparelhos…');
  const dlg=dialog();if(dlg.open)dlg.close();
  requestNumber++;current=null;
  try{await window.NexusCloudSync?.sync?.()}catch(error){
   console.warn('Nexus Scan: conta salva localmente, sincronização pendente:',error);
  }
  location.reload();
 }catch(err){
  message(String(err.message||err),true);
 }
}
async function act(action,element){
 if(action==='close'||action==='cancel'){close();return}
 if(action==='undo'){await undoLastScan();return}
 if(action==='replace'){initial();return}
 if(action==='suggest'&&current?.report){
  const i=Number(element.dataset.index),setId=element.dataset.set;
  const field=dialog().querySelector('.ns3-piece[data-index="'+i+'"] select[data-field="set"]')||
   dialog().querySelector('#ns3-piece-'+i+' select[data-field="set"]');
  if(!field)return;
  field.value=setId;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  return;
 }
 if(action==='save')await save();
}
export async function openScanner(hintId=''){
 const dlg=dialog();current={hintId:String(hintId||'')};
 if(!dlg.open)dlg.showModal();
 initial();
}
window.NexusScanV3={open:openScanner,undo:undoLastScan};
