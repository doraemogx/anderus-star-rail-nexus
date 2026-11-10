/* Anderus Cloud Sync: one encrypted account across browsers, with device pairing.
   Not a second site. No HoYoverse UID, email or external identity is required. */
import {ACCOUNT_KEY,SYNC_FIELDS,syncable,mergeAccount,equal,makePair,validatePair,
 bearer,encryptAccount,decryptAccount,pairingLink} from "./nexus-sync-core.js";
const API="https://nexia-ai-nexus.andrediascrm.workers.dev/api/sync/v1";
const PAIR_KEY="anderus_nexus_sync_pair_v1";
const ESC=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let pair=null,pendingPair=null,working=null,pendingConflict=null,latestStatus="Aguardando conexão",lastRemote=0,observed="";
let databasePromise=null,initialized=false;
const keys={base:"last-synced-account",backup:"previous-account",backupAt:"backup-date"};
function database(){
 if(databasePromise)return databasePromise;
 databasePromise=new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(Error("Armazenamento seguro não disponível neste navegador."));return;}
  const r=indexedDB.open("anderus-nexus-sync",1);
  r.onupgradeneeded=()=>r.result.createObjectStore("records");
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error||Error("Falha ao abrir os backups locais."));
 }).catch(e=>{databasePromise=null;throw e});
 return databasePromise;
}
async function readRecord(key){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const t=db.transaction("records","readonly"),r=t.objectStore("records").get(key);
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error);
 });
}
async function writeRecord(key,value){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const t=db.transaction("records","readwrite");
  t.objectStore("records").put(value,key);
  t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);
 });
}
function localAccount(){
 try{const x=JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'{"characters":{}}');return x&&typeof x==="object"?x:{characters:{}};}
 catch(_){throw Error("Não foi possível ler seus personagens salvos neste aparelho.");}
}
function setPair(p){
 pair=validatePair(p);
 localStorage.setItem(PAIR_KEY,JSON.stringify(pair));
}
function status(message){
 latestStatus=message;
 const label=document.getElementById("nexus-sync-status");
 if(label)label.textContent=message;
 const button=document.getElementById("nexus-sync-trigger");
 if(button){button.dataset.syncState=pair?"linked":"local";button.title=pair?"Conta vinculada · "+message:"Conectar aparelhos";}
}
function notice(text){
 status(text);
 const root=document.getElementById("nexus-sync-result");
 if(root)root.textContent=text;
}
async function request(method,record,revision,p=pair){
 if(!p)throw Error("Conecte este aparelho primeiro.");
 const headers={"Authorization":"Bearer "+await bearer(p)};
 if(method==="PUT"){headers["Content-Type"]="application/json";headers["If-Match"]=String(revision);}
 const response=await fetch(API+"/"+p.id,{
  method,headers,body:method==="PUT"?JSON.stringify(record):undefined,cache:"no-store",mode:"cors"
 }).catch(()=>{throw Error("Não foi possível acessar a nuvem. Seus personagens continuam salvos neste aparelho.");});
 const body=await response.json().catch(()=>({}));
 if(response.status===404&&method==="GET")return null;
 if(response.status===409)return {conflict:true,revision:body.revision};
 if(!response.ok)throw Error(response.status===503?
  "O serviço de sincronização ainda não está ativado. A conta local permanece intacta.":
  body.error||"Falha de conexão com a nuvem ("+response.status+").");
 return body;
}
function busyEditing(){
 return !!document.querySelector('dialog[open]:not(#nexus-sync-dialog),.v06-import-form input:focus,.v11-edit-form input:focus');
}
async function applyRemote(data){
 const raw=localAccount(),current=syncable(raw);
 if(equal(current,data))return false;
 if(busyEditing())throw Error("Feche a edição aberta para aplicar alterações do outro aparelho.");
 await writeRecord(keys.backup,raw);
 await writeRecord(keys.backupAt,new Date().toISOString());
 const next={...raw};
 for(const key of SYNC_FIELDS){
  if(Object.prototype.hasOwnProperty.call(data,key))next[key]=data[key];
  else delete next[key];
 }
 try{localStorage.setItem(ACCOUNT_KEY,JSON.stringify(next));}
 catch(_){throw Error("O navegador não tem espaço para aplicar a conta; a cópia atual foi preservada.");}
 return true;
}
async function syncInternal({joining=false,resolution=null}={}){
 if(!pair)throw Error("Aparelho não vinculado.");
 if(!navigator.onLine)throw Error("Sem conexão. Suas edições continuam salvas aqui e serão enviadas quando a internet voltar.");
 await database();
 for(let attempt=0;attempt<4;attempt++){
  const snapshot=localAccount(),local=syncable(snapshot),base=(await readRecord(keys.base))||{};
  const server=await request("GET");
  if(!server){
   const fresh=await request("PUT",await encryptAccount(local,pair),0);
   if(fresh.conflict)continue;
   await writeRecord(keys.base,local);
   observed=JSON.stringify(local);
   lastRemote=Date.now();pendingConflict=null;
   notice("Conta conectada! "+Object.keys(local.characters).length+" personagem(ns) protegidos na nuvem.");
   return {updated:false,revision:fresh.revision};
  }
  const cloud=await decryptAccount(server.payload,pair);
  const {merged,conflicts}=mergeAccount(joining?{}:base,local,cloud,resolution||"cloud");
  if(conflicts.length&&!joining&&!resolution){
   pendingConflict={count:conflicts.length,paths:conflicts.slice(0,12)};
   showConflict();
   throw Error("Há "+conflicts.length+" alteração(ões) diferentes nos dois aparelhos. Nada foi sobrescrito; escolha qual versão manter.");
  }
  // A user may have saved a build while the server was being checked.
  if(!equal(syncable(localAccount()),local))continue;
  if(!equal(merged,cloud)){
   const saved=await request("PUT",await encryptAccount(merged,pair),server.revision);
   if(saved.conflict)continue;
  }
  const changed=await applyRemote(merged);
  await writeRecord(keys.base,merged);
  lastRemote=Date.now();observed=JSON.stringify(merged);pendingConflict=null;
  const count=Object.keys(merged.characters||{}).length;
  notice("Sincronizado: "+count+" personagem(ns) na mesma conta.");
  if(changed){
   // Core application state is in memory; reload only after persisting and saving a rollback.
   location.reload();
  }
  return {updated:changed,revision:server.revision};
 }
 throw Error("Os aparelhos editaram a conta ao mesmo tempo. Tente sincronizar novamente; não apagamos nada.");
}
function sync(opts){
 if(working)return working;
 working=syncInternal(opts).finally(()=>{working=null;});
 return working;
}
function showConflict(){
 const root=document.getElementById("nexus-sync-conflict");
 if(!root)return;
 root.hidden=!pendingConflict;
 if(!pendingConflict)return;
 root.innerHTML='<strong>Algumas informações foram modificadas nos dois aparelhos.</strong>'+
 '<p>Personagens diferentes serão mantidos. Para informações conflitantes sobre o mesmo personagem, qual alteração deve valer? A versão anterior será preservada para recuperação.</p>'+
 '<button type="button" data-sync-prefer="local">Usar alterações deste aparelho</button>'+
 '<button type="button" data-sync-prefer="cloud">Usar alterações do outro aparelho</button>';
}
function dialog(){
 let dlg=document.getElementById("nexus-sync-dialog");if(dlg)return dlg;
 dlg=document.createElement("dialog");dlg.id="nexus-sync-dialog";dlg.setAttribute("aria-label","Conectar personagens entre aparelhos");
 dlg.innerHTML='<section class="nexus-sync-inner"><header><div><small>ANDERUS · UMA ÚNICA CONTA</small><h2>Conectar meus aparelhos</h2><p>Os personagens ficam disponíveis no celular e no computador, com atualizações automáticas enquanto o Nexus estiver aberto e online.</p></div><button type="button" data-sync-close aria-label="Fechar">×</button></header>'+
 '<div class="nexus-sync-state"><span>Status</span><strong id="nexus-sync-status" aria-live="polite"></strong></div>'+
 '<div class="nexus-sync-intro"><strong>Uma conexão só.</strong><p>Os personagens dos dois aparelhos são reunidos, e cada aparelho guarda uma cópia. Fotografias originais dos prints permanecem apenas no dispositivo onde foram enviadas.</p></div>'+
 '<div id="nexus-sync-new"><button type="button" data-sync-create>Criar minha conta sincronizada</button>'+
 '<label for="nexus-sync-link">Ou cole o link recebido de outro aparelho</label>'+
 '<input id="nexus-sync-link" type="text" placeholder="Cole o link de conexão" autocomplete="off" spellcheck="false">'+
 '<button type="button" data-sync-join>Conectar a uma conta existente</button></div>'+
 '<div id="nexus-sync-existing" hidden><p>Envie este link privadamente para o outro aparelho. Ele dá acesso à sua conta; não publique nas redes sociais.</p>'+
 '<button type="button" data-sync-copy>Copiar link para conectar outro aparelho</button>'+
 '<button type="button" data-sync-now>Sincronizar agora</button>'+
 '<button type="button" data-sync-disconnect>Desconectar este aparelho</button></div>'+
 '<div id="nexus-sync-conflict" hidden></div>'+
 '<div id="nexus-sync-result" role="status" aria-live="polite"></div>'+
 '<div class="nexus-sync-recovery"><strong>Proteção dos personagens</strong><p>Antes de uma atualização recebida, fazemos uma cópia local. Você pode voltar à versão anterior.</p>'+
 '<button type="button" data-sync-undo>Desfazer última atualização recebida</button></div>'+
 '<p class="nexus-sync-disclaimer">Sincronização criptografada entre navegadores. Não solicita UID do jogo ou login da HoYoverse. Alterações offline aguardam a conexão. O link privado deve ser protegido como uma senha.</p></section>';
 document.body.append(dlg);
 dlg.querySelector("[data-sync-close]").onclick=()=>dlg.close();
 dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close();});
 dlg.querySelector("[data-sync-create]").onclick=async()=>{
  try{
   const p=makePair();
   await ensureAvailable();
   setPair(p);
   await sync();
   render();
  }catch(e){notice(String(e.message||e));}
 };
 dlg.querySelector("[data-sync-join]").onclick=async()=>{
  try{
   const input=dlg.querySelector("#nexus-sync-link").value.trim();
   const p=parseLink(input);
   await join(p);
  }catch(e){notice(String(e.message||e))}
 };
 dlg.querySelector("[data-sync-copy]").onclick=async()=>{
  try{
   const link=pairingLink(pair,location.href.split("#")[0]);
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(link);
   else{dlg.querySelector("#nexus-sync-link").value=link;dlg.querySelector("#nexus-sync-new").hidden=false;dlg.querySelector("#nexus-sync-link").select();}
   notice("Link preparado. Envie-o privadamente ao outro aparelho.");
  }catch(_){notice("Não consegui copiar o link. Use o navegador em modo seguro (HTTPS).");}
 };
 dlg.querySelector("[data-sync-now]").onclick=()=>sync().catch(e=>notice(String(e.message||e)));
 dlg.querySelector("[data-sync-disconnect]").onclick=()=>{
  if(!window.confirm("Desconectar apenas este aparelho? Seus personagens continuam salvos aqui e na nuvem."))return;
  localStorage.removeItem(PAIR_KEY);pair=null;pendingConflict=null;
  render();notice("Este aparelho foi desconectado. Seus personagens não foram apagados.");
 };
 dlg.querySelector("[data-sync-undo]").onclick=async()=>{
  try{
   const backup=await readRecord(keys.backup);
   if(!backup)throw Error("Nenhuma atualização anterior disponível para restaurar.");
   if(!window.confirm("Recuperar a conta anterior neste aparelho? Ela será sincronizada novamente depois da recuperação."))return;
   const current=localAccount();
   await writeRecord(keys.backup,current);
   await writeRecord(keys.base,{});
   localStorage.setItem(ACCOUNT_KEY,JSON.stringify(backup));
   location.reload();
  }catch(e){notice(String(e.message||e))}
 };
 dlg.querySelector("#nexus-sync-conflict").addEventListener("click",e=>{
  const button=e.target.closest("[data-sync-prefer]");
  if(button)sync({resolution:button.dataset.syncPrefer}).catch(e=>notice(String(e.message||e)));
 });
 return dlg;
}
async function ensureAvailable(){
 const r=await fetch(API+"/status",{mode:"cors",cache:"no-store"}).catch(()=>null);
 if(!r?.ok)throw Error("O serviço de sincronização ainda não foi ativado. Seus personagens estão seguros neste aparelho.");
 const info=await r.json();
 if(!info.available||!info.encrypted)throw Error("A conexão da nuvem não está pronta.");
}
function parseLink(input){
 const s=String(input||"").trim();
 const match=s.match(/(?:^|[#&])nexus-sync=([^&#]+)/);
 return validatePair(decodeURIComponent(match?match[1]:s.replace(/^.*\//,"")));
}
async function join(value){
 const candidate=validatePair(value);
 await ensureAvailable();
 const previous=pair;
 setPair(candidate);
 try{await sync({joining:true});render();}
 catch(error){
  if(previous)setPair(previous);
  else{pair=null;localStorage.removeItem(PAIR_KEY);}
  render();throw error;
 }
}
function render(){
 const dlg=dialog();
 dlg.querySelector("#nexus-sync-existing").hidden=!pair;
 dlg.querySelector("#nexus-sync-new").hidden=!!pair;
 dlg.querySelector("#nexus-sync-status").textContent=latestStatus;
 showConflict();
}
function open(){
 const dlg=dialog();render();if(!dlg.open)dlg.showModal();
}
function extractHash(){
 const hash=location.hash||"";
 if(!/^#nexus-sync=/.test(hash))return;
 history.replaceState(null,"",location.pathname+location.search);
 try{pendingPair=parseLink(hash);open();notice("Link recebido. Confirme para juntar os personagens deste aparelho.");}
 catch(e){open();notice(String(e.message||e));}
 if(pendingPair){
  const dlg=dialog();
  dlg.querySelector("#nexus-sync-link").value=hash;
 }
}
function mount(){
 if(initialized)return;initialized=true;
 try{pair=localStorage.getItem(PAIR_KEY)?validatePair(JSON.parse(localStorage.getItem(PAIR_KEY))):null;}
 catch(_){pair=null;localStorage.removeItem(PAIR_KEY);}
 const btn=document.createElement("button");btn.id="nexus-sync-trigger";btn.type="button";
 btn.setAttribute("aria-label","Sincronizar personagens entre aparelhos");btn.title="Conectar meus aparelhos";
 btn.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" stroke="currentColor" fill="none" stroke-width="1.8" aria-hidden="true"><path d="M7 16a4 4 0 1 1-.2-8A7 7 0 0 1 20 10a4 4 0 0 1-1 8H8"></path><path d="M9 12l3 3 3-3M12 15V8"></path></svg>';
 btn.onclick=open;
 (document.querySelector(".mast-actions")||document.querySelector(".masthead")||document.body).append(btn);
 status(pair?"Conta conectada":"Não conectado");
 extractHash();
 // A pairing link can also be opened in a tab where the Nexus is already running.
 window.addEventListener("hashchange",extractHash);
 if(pair){
  observed=JSON.stringify(syncable(localAccount()));
  sync().catch(e=>status(String(e.message||e)));
  setInterval(()=>{
   if(!pair||!navigator.onLine||document.visibilityState==="hidden"||working||pendingConflict||busyEditing())return;
   let now="";try{now=JSON.stringify(syncable(localAccount()))}catch(_){return}
   if(now!==observed||Date.now()-lastRemote>30000)sync().catch(e=>status(String(e.message||e)));
  },12000);
  window.addEventListener("online",()=>sync().catch(e=>status(String(e.message||e))));
  document.addEventListener("visibilitychange",()=>{
   if(document.visibilityState==="visible")sync().catch(e=>status(String(e.message||e)));
  });
 }
}
window.NexusCloudSync={open,sync:()=>sync(),status:()=>({connected:!!pair,message:latestStatus}),getPair:()=>pair?.id||null};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
else mount();
