/* Anderus login: one username, one password, optional offline recovery code.
 * Compatible with already-paired devices; it NEVER changes the existing cloud room.
 */
import {USERNAME,registerPayload,loginProof,unlockPassword,recoveryProof,unlockRecovery}
 from "./nexus-login-core.js";
import {bearer,validatePair} from "./nexus-sync-core.js";
const API="https://nexia-ai-nexus.andrediascrm.workers.dev/api/login/v1";
const PAIR_KEY="anderus_nexus_sync_pair_v1";
let statusCache=null,loading=false,shownRecovery="",pendingRecoveredPair=null,bound=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const localPair=()=>{
 try{const stored=localStorage.getItem(PAIR_KEY);return stored?validatePair(JSON.parse(stored)):null;}
 catch(_){return null;}
};
async function request(action,payload=null,pair=null){
 const headers={"Content-Type":"application/json"};
 if(pair)headers.Authorization="Bearer "+await bearer(pair);
 let response;
 try{response=await fetch(API+"/"+action,{method:payload?"POST":"GET",mode:"cors",
  cache:"no-store",headers,body:payload?JSON.stringify(payload):undefined});}
 catch(_){throw Error("Não consegui conectar ao serviço de login. Seus personagens continuam seguros neste aparelho.");}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||"Falha ao acessar a conta. Tente novamente.");
 return data;
}
async function state(){return request("status")}
function dialog(){
 let dlg=document.getElementById("nexus-login-dialog");
 if(dlg)return dlg;
 dlg=document.createElement("dialog");dlg.id="nexus-login-dialog";
 dlg.setAttribute("aria-label","Acesso à conta Anderus");
 dlg.innerHTML='<div class="nexus-login-inner">'+
  '<header><div><span>EXPRESSO ASTRAL · SUA CONTA</span><h2>Entrar no Nexus</h2>'+
  '<p>Use sua conta Anderus em qualquer computador ou celular.</p></div>'+
  '<button type="button" data-login-close aria-label="Fechar">×</button></header>'+
  '<section class="nexus-login-info"><label for="nexus-login-username">Usuário</label>'+
  '<input id="nexus-login-username" type="text" value="Anderus" readonly autocomplete="username" aria-readonly="true">'+
  '<p>Seu usuário já está definido. A senha é cadastrada por você, diretamente aqui.</p></section>'+
  '<div class="nexus-login-content" id="nexus-login-content" aria-live="polite"></div>'+
  '<p class="nexus-login-alert" id="nexus-login-alert" role="status" aria-live="polite"></p>'+
  '<footer>Sua senha e o código de recuperação não são enviados ao ChatGPT. A chave dos personagens fica protegida por criptografia.</footer></div>';
 document.body.append(dlg);
 dlg.querySelector("[data-login-close]").onclick=()=>dlg.close();
 dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close();});
 dlg.querySelector("#nexus-login-content").addEventListener("submit",submit);
 dlg.querySelector("#nexus-login-content").addEventListener("click",click);
 return dlg;
}
function alert(text){const area=dialog().querySelector("#nexus-login-alert");area.textContent=text||"";}
function field(name,label,autocomplete,placeholder=""){
 return '<label for="nexus-login-'+name+'">'+label+'</label>'+
  '<input id="nexus-login-'+name+'" name="'+name+'" type="password" required minlength="12" maxlength="128" autocomplete="'+autocomplete+'" placeholder="'+esc(placeholder)+'">';
}
function registerForm(){
 return '<div class="nexus-login-state"><strong>Proteja sua conta sincronizada</strong>'+
  '<p>Seus personagens já estão conectados neste aparelho. Cadastre uma senha para entrar em outros dispositivos sem usar o link privado.</p></div>'+
  '<form data-login-form="register">'+field("password","Crie sua senha","new-password","No mínimo 12 caracteres")+
  field("repeat","Repita sua senha","new-password")+
  '<button type="submit">Cadastrar senha do Anderus</button></form>';
}
function signinForm(){
 return '<div class="nexus-login-state"><strong>Bem-vindo de volta, Anderus!</strong>'+
  '<p>Informe sua senha para carregar os mesmos personagens da sua conta sincronizada.</p></div>'+
  '<form data-login-form="signin">'+field("password","Senha","current-password")+
  '<button type="submit">Entrar e carregar meus personagens</button></form>'+
  '<button type="button" class="nexus-login-link" data-login-action="recover">Esqueci minha senha</button>';
}
function resetForm(mode){
 return '<div class="nexus-login-state"><strong>'+(mode==="device"?"Trocar sua senha":"Recuperar acesso")+'</strong>'+
  '<p>'+(mode==="device"?
   "Este aparelho já está conectado. Você pode definir uma nova senha sem perder seus personagens.":
   "Utilize o código de recuperação que você salvou quando cadastrou sua senha. Ele substitui a recuperação por mensagens de chat.")+'</p></div>'+
  '<form data-login-form="'+(mode==="device"?"change":"recover")+'">'+
  (mode==="device"?'':field("recovery","Código de recuperação","one-time-code","Cole seu código de segurança"))+
  field("password","Nova senha","new-password","No mínimo 12 caracteres")+
  field("repeat","Repita a nova senha","new-password")+
  '<button type="submit">'+(mode==="device"?"Atualizar senha":"Recuperar e entrar")+'</button></form>'+
  '<button type="button" class="nexus-login-link" data-login-action="back">Voltar ao login</button>';
}
function connectedForm(){
 return '<div class="nexus-login-state"><strong>Sua conta já está conectada</strong>'+
  '<p>O usuário Anderus está ativo neste aparelho. Não é necessário digitar sua senha novamente enquanto o dispositivo permanecer conectado.</p></div>'+
  '<button type="button" data-login-action="change">Alterar minha senha</button>'+
  '<button type="button" data-login-action="instructions">Como entrar em outro aparelho?</button>'+
  '<button type="button" class="nexus-login-signout" data-login-action="signout">Sair deste dispositivo com segurança</button>';
}
function recoveryResult(recovery){
 shownRecovery=recovery;
 return '<div class="nexus-login-recovery-result"><strong>Sua chave de recuperação</strong>'+
  '<p>Salve este código agora. Se esquecer a senha e perder seus aparelhos conectados, será necessário este código para recuperar o acesso.</p>'+
  '<code id="nexus-login-recovery-code">'+esc(recovery)+'</code>'+
  '<div class="nexus-login-recovery-actions"><button type="button" data-login-action="copy">Copiar código</button>'+
  '<button type="button" data-login-action="download">Salvar arquivo de recuperação</button></div>'+
  '<p>Não publique o código e não o envie ao ChatGPT.</p>'+
  '<button type="button" data-login-action="done">Já salvei meu código</button></div>';
}
async function render(){
 const root=dialog().querySelector("#nexus-login-content");
 if(loading)return;
 root.innerHTML='<p>Verificando sua conta…</p>';
 try{
  statusCache=await state();
  const pair=localPair();
  if(!statusCache.configured)root.innerHTML=pair?registerForm():
   '<div class="nexus-login-state"><strong>Primeiro acesso</strong><p>Antes de cadastrar a senha, abra o Nexus no celular ou computador que já tem seus personagens sincronizados.</p></div>';
  else root.innerHTML=pair?connectedForm():signinForm();
  alert("");
 }catch(e){
  root.innerHTML='<p>Não foi possível carregar o login.</p><button type="button" data-login-action="retry">Tentar novamente</button>';
  alert(e.message);
 }
}
function next(mode){dialog().querySelector("#nexus-login-content").innerHTML=mode==="recover"?resetForm("recovery"):mode==="change"?resetForm("device"):mode==="signin"?signinForm():mode==="connected"?connectedForm():"";alert("");}
async function copy(code){
 if(!navigator.clipboard?.writeText)throw Error("Não foi possível copiar automaticamente. Selecione o código e copie manualmente.");
 await navigator.clipboard.writeText(code);
}
function download(text){
 const blob=new Blob(["ANDERUS STAR RAIL NEXUS — CÓDIGO DE RECUPERAÇÃO\n\n"+text+
  "\n\nGuarde este arquivo com segurança. Não compartilhe este código.\n"],
  {type:"text/plain;charset=utf-8"});
 const link=document.createElement("a"),url=URL.createObjectURL(blob);
 link.href=url;link.download="anderus-nexus-recuperacao.txt";document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function click(e){
 const act=e.target.closest("[data-login-action]")?.dataset.loginAction;
 if(!act)return;
 if(act==="recover"||act==="change"){next(act);return}
 if(act==="back"||act==="retry"){await render();return}
 if(act==="copy"){try{await copy(shownRecovery);alert("Código copiado.");}catch(err){alert(err.message)}return}
 if(act==="signout"){
  if(!window.confirm("Sair deste dispositivo? Os personagens sincronizados continuarão na nuvem, mas os dados e backups locais do Nexus serão apagados neste aparelho."))return;
  const dlg=document.getElementById("nexus-login-dialog");
  if(dlg?.open)dlg.close();
  try{await window.NexusCloudSync?.signOut?.();}
  catch(error){
   if(dlg&&!dlg.open)dlg.showModal();
   alert(error.message||"Não foi possível sair com segurança.");
  }
  return;
 }
 if(act==="download"){download(shownRecovery);alert("Arquivo de recuperação salvo.");return}
 if(act==="done"){
  shownRecovery="";
  if(pendingRecoveredPair){
   const pair=pendingRecoveredPair;pendingRecoveredPair=null;
   try{await connect(pair);}catch(error){alert(error.message||"Não foi possível conectar neste aparelho.");}
  }else await render();
  return
 }
 if(act==="instructions"){alert("No outro aparelho, abra o mesmo Nexus, toque em Conectar aparelhos e selecione Entrar como Anderus.");}
}
async function connect(pair){
 const existing=JSON.parse(localStorage.getItem("anderus_nexus_v03")||'{"characters":{}}');
 const amount=Object.keys(existing.characters||{}).length;
 if(amount>0&&!localPair()){
  if(!window.confirm("Este dispositivo tem "+amount+" personagem(ns) salvos. Deseja juntá-los à conta Anderus, sem apagar os personagens exclusivos?"))return;
 }
 const connector=window.NexusCloudSync?.connectWithPair;
 if(typeof connector!=="function")throw Error("Atualize a página para carregar o recurso de sincronização.");
 await connector(pair);
}
async function submit(e){
 const form=e.target.closest("form[data-login-form]");
 if(!form)return;
 e.preventDefault();
 if(loading)return;
 loading=true;alert("Protegendo sua conta…");
 const kind=form.dataset.loginForm,pass=form.elements.password?.value||"",repeat=form.elements.repeat?.value||"";
 try{
  if(kind!=="signin"&&pass!==repeat)throw Error("As duas senhas precisam ser iguais.");
  if(kind==="register"){
   const pair=localPair();
   if(!pair)throw Error("Abra um aparelho já conectado para criar sua senha.");
   const item=await registerPayload(pair,pass);
   await request("setup",item.payload,pair);
   dialog().querySelector("#nexus-login-content").innerHTML=recoveryResult(item.recovery);
   alert("Senha cadastrada! Salve o código de recuperação antes de sair.");
  }else if(kind==="signin"){
   const status=statusCache||await state();
   const derived=await loginProof(pass,status);
   const response=await request("login",{proof:derived.proof});
   const pair=await unlockPassword(pass,status,response.vault);
   form.reset();await connect(pair);
   alert("Sua conta Anderus foi conectada com segurança.");
  }else if(kind==="change"){
   const pair=localPair();
   if(!pair)throw Error("Não há uma conta conectada neste aparelho.");
   const item=await registerPayload(pair,pass);
   await request("reset",{...item.payload,mode:"pair"},pair);
   dialog().querySelector("#nexus-login-content").innerHTML=recoveryResult(item.recovery);
   alert("Sua senha foi alterada. O código antigo foi invalidado; salve o novo.");
  }else if(kind==="recover"){
   const code=form.elements.recovery.value.trim().replace(/\s/g,"");
   const proof=await recoveryProof(code);
   const vault=await request("recover",{proof:proof.proof});
   const pair=await unlockRecovery(code,vault.vault);
   const item=await registerPayload(pair,pass);
   await request("reset",{...item.payload,mode:"recovery",proof:proof.proof});
   dialog().querySelector("#nexus-login-content").innerHTML=recoveryResult(item.recovery);
   alert("Acesso recuperado. Salve o novo código antes de entrar.");
   // Do not reload during recovery: first let the user copy or save the NEW code.
   pendingRecoveredPair=pair;
  }
 }catch(err){alert(err.message||"Não foi possível acessar a conta.");}
 finally{
  for(const x of form.querySelectorAll('input[type="password"]'))x.value="";
  loading=false;
 }
}
export async function open(){
 const sync=document.getElementById("nexus-sync-dialog");
 if(sync?.open)sync.close();
 const dlg=dialog();if(!dlg.open)dlg.showModal();
 await render();
}
function mount(){
 if(bound)return;bound=true;
 document.addEventListener("click",e=>{
  if(e.target.closest("[data-nexus-login-open]"))open();
 });
}
window.NexusLogin={open};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
