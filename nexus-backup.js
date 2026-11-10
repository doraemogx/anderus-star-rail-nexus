/* Nexus 2.0 — portable account backup and deliberate restore. */
(function(){
'use strict';
if(window.NexusBackup)return;
const KEY='anderus_nexus_v03', SAFETY='anderus_nexus_backup_before_restore';
let candidate=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Arquivo JSON inválido: objeto de conta esperado.');
 const data=value.kind==='anderus-account-backup'?value.account:value;
 if(!data||typeof data!=='object'||Array.isArray(data)||!data.characters||typeof data.characters!=='object'||Array.isArray(data.characters))
  throw Error('Arquivo incompatível com o Nexus: personagens não encontrados.');
 if(Object.keys(data.characters).length>1000)throw Error('Número inesperado de personagens: confira a origem do arquivo.');
 for(const [id,entry] of Object.entries(data.characters)){
  if(id.length>100||!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('Registro de personagem inválido no backup.');
  if(entry.level!=null&&(!Number.isFinite(Number(entry.level))||Number(entry.level)<1||Number(entry.level)>100))
   throw Error('Nível de personagem fora do intervalo esperado: '+id);
 }
 return data;
}
function snapshot(){const raw=localStorage.getItem(KEY);return raw?validate(JSON.parse(raw)):{characters:{}};}
function saveFile(text,filename){
 const blob=new Blob([text],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function exportBackup(){
 const account=snapshot();
 const payload={kind:'anderus-account-backup',formatVersion:2,exportedAt:new Date().toISOString(),account};
 const filename='anderus-nexus-backup-'+new Date().toISOString().slice(0,10)+'.json';
 saveFile(JSON.stringify(payload,null,2),filename);
 return {filename,characters:Object.keys(account.characters).length};
}
function mergeAccount(current,incoming){
 const output=structuredClone(current);
 for(const [key,value] of Object.entries(incoming)){
  if(key==='characters'||key==='v06RelicDetails'||key==='v06Relics'||key==='v06Screens'||key==='v06BuildHistory'||key==='v06MaterialInventory'||key==='v06AscensionPlans'){
   if(value&&typeof value==='object'&&!Array.isArray(value)){
    output[key]={...(output[key]||{}),...value};
   }
  }else if(key==='v06TracePlans'&&value&&typeof value==='object'&&!Array.isArray(value)){
   output.v06TracePlans||={};
   for(const [id,plan] of Object.entries(value)){
    if(!plan||typeof plan!=='object'||Array.isArray(plan))continue;
    output.v06TracePlans[id]={...(output.v06TracePlans[id]||{}),...plan};
   }
  }else if(key==='v06WarpPlan'&&value&&typeof value==='object'&&!Array.isArray(value)){
   output.v06WarpPlan={...(output.v06WarpPlan||{}),...value};
  }else if(key==='v06SavedTeams'&&Array.isArray(value)){
   const keyed=new Map((output.v06SavedTeams||[]).map(t=>[t.id,t]));
   for(const team of value)if(team&&typeof team.id==='string')keyed.set(team.id,team);
   output.v06SavedTeams=[...keyed.values()];
  }else if(!(key in output))output[key]=value;
 }
 return output;
}
function restore(data,mode){
 const incoming=validate(data),current=snapshot();
 const output=mode==='replace'?structuredClone(incoming):mergeAccount(current,incoming);
 validate(output);
 // Save the entire original account BEFORE making any changes. If localStorage
 // quota is insufficient, abort without touching the active account.
 localStorage.setItem(SAFETY,JSON.stringify(current));
 try{
  const json=JSON.stringify(output);
  localStorage.setItem(KEY,json);
  const check=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!check||JSON.stringify(check)!==json)throw Error('Verificação de gravação falhou.');
 }catch(error){
  try{localStorage.setItem(KEY,JSON.stringify(current))}catch(_){}
  throw error;
 }
 return {characters:Object.keys(output.characters).length,mode};
}
function rollback(){
 const previousRaw=localStorage.getItem(SAFETY);
 if(!previousRaw)throw Error('Não há restauração anterior para desfazer.');
 const previous=validate(JSON.parse(previousRaw));
 const active=snapshot();
 const next=JSON.stringify(previous);
 const backup=JSON.stringify(active);
 // Use a reversible swap: a second undo returns to the newer version.
 localStorage.setItem(SAFETY,backup);
 try{
  localStorage.setItem(KEY,next);
  if(localStorage.getItem(KEY)!==next)throw Error('A gravação não foi confirmada.');
 }catch(error){
  try{localStorage.setItem(SAFETY,previousRaw);localStorage.setItem(KEY,JSON.stringify(active));}catch(_){}
  throw error;
 }
 return {characters:Object.keys(previous.characters).length};
}
function dialog(){
 let dlg=document.getElementById('nexus-backup-dialog');if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-backup-dialog';dlg.setAttribute('aria-label','Backup e transferência da conta');
 dlg.innerHTML='<div class="nexus-backup-body"><header><div><span>ANDERUS / DADOS LOCAIS</span><h2>Backup da conta</h2></div><button type="button" data-backup-close aria-label="Fechar">×</button></header>'+
 '<p>Transfira sua conta entre celular e desktop usando um arquivo JSON. Seus dados permanecem locais e não são enviados ao Nexus.</p>'+
 '<div class="nexus-backup-grid"><section><h3>Exportar</h3><p>Salva personagens, equipamentos, equipes, histórico e preferências existentes.</p><button type="button" data-backup-export>Exportar JSON</button></section>'+
 '<section><h3>Restaurar</h3><label for="nexus-backup-file">Escolha seu arquivo de backup</label><input id="nexus-backup-file" type="file" accept=".json,application/json">'+
 '<label for="nexus-backup-mode">Como importar?</label><select id="nexus-backup-mode"><option value="merge">Mesclar com esta conta</option><option value="replace">Substituir esta conta</option></select>'+
 '<p class="nexus-backup-preview" role="status">Nenhum arquivo selecionado.</p><button type="button" data-backup-restore disabled>Confirmar restauração</button></section></div>'+
 '<section class="nexus-backup-undo"><h3>Recuperação</h3><p>Se a última importação substituir dados indevidamente, recupere a conta anterior salva automaticamente neste dispositivo.</p>'+
 '<button type="button" data-backup-undo '+(localStorage.getItem(SAFETY)?'':'disabled')+'>Desfazer última importação</button></section>'+
 '<p class="nexus-backup-warning">Antes de importar, exporte uma cópia da conta atual. Uma restauração confirmada recarregará o Nexus, mas não alterará os dados dentro do jogo.</p></div>';
 document.body.append(dlg);
 dlg.querySelector('[data-backup-close]').onclick=()=>dlg.close();
 dlg.querySelector('[data-backup-export]').onclick=()=>{
  try{const result=exportBackup();dlg.querySelector('.nexus-backup-preview').textContent='Exportado: '+result.filename+' · '+result.characters+' personagens';}
  catch(error){dlg.querySelector('.nexus-backup-preview').textContent=String(error.message||error);}
 };
 dlg.querySelector('#nexus-backup-file').addEventListener('change',async e=>{
  candidate=null;dlg.querySelector('[data-backup-restore]').disabled=true;
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>30*1024*1024)throw Error('Arquivo acima de 30 MB; verifique o backup.');
   const payload=JSON.parse(await file.text()),account=validate(payload);
   candidate=payload;
   dlg.querySelector('.nexus-backup-preview').textContent='Backup válido: '+Object.keys(account.characters).length+
    ' personagem(ns). Revise a opção de importação antes de confirmar.';
   dlg.querySelector('[data-backup-restore]').disabled=false;
  }catch(error){dlg.querySelector('.nexus-backup-preview').textContent='Arquivo recusado: '+String(error.message||error);}
 });
 dlg.querySelector('[data-backup-undo]').onclick=()=>{
  if(!window.confirm('Recuperar a versão da conta anterior à última importação? A versão atual ficará guardada como cópia de segurança.'))return;
  try{
   rollback();location.reload();
  }catch(error){
   dlg.querySelector('.nexus-backup-preview').textContent='Falha ao desfazer: '+String(error.message||error);
  }
 };
 dlg.querySelector('[data-backup-restore]').onclick=()=>{
  if(!candidate)return;
  const mode=dlg.querySelector('#nexus-backup-mode').value;
  if(!window.confirm(mode==='replace'?
    'Substituir a conta local por este backup? O Nexus salvará uma cópia de segurança antes da troca.':
    'Mesclar este backup com a conta local? Registros com o mesmo ID poderão ser atualizados.'))return;
  try{
   const result=restore(candidate,mode);
   dlg.querySelector('.nexus-backup-preview').textContent='Restauração confirmada: '+result.characters+' personagens. Recarregando…';
   location.reload();
  }catch(error){dlg.querySelector('.nexus-backup-preview').textContent='Não foi possível restaurar: '+String(error.message||error);}
 };
 return dlg;
}
function open(){const dlg=dialog();if(!dlg.open)dlg.showModal();}
window.NexusBackup={validate,snapshot,restore,rollback,mergeAccount,exportBackup,open};
})();