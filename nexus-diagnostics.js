/* Nexus 2.0 diagnostic center — no account mutation, no background telemetry. */
(function(){
'use strict';
if(window.NexusDiagnostics)return;
const PREFIX='./';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=v=>v?new Date(v).toLocaleString('pt-BR'):'não informado';
async function collect(){
 const result={checkedAt:new Date().toISOString(),online:navigator.onLine,
  appUrl:location.href,serviceWorker:{supported:'serviceWorker'in navigator},
  caches:[],catalog:{},backend:'não verificado',build:null,accountStorage:{count:0,keys:[]}};
 try{
  const response=await fetch(PREFIX+'build-meta.json',{cache:'no-store'});
  if(response.ok)result.build=await response.json();
  else result.buildError='Manifesto de build não publicado: '+response.status;
 }catch(e){result.buildError=String(e?.message||e);}
 if('serviceWorker'in navigator){
  try{
   const registration=await navigator.serviceWorker.getRegistration();
   result.serviceWorker={supported:true,controlled:!!navigator.serviceWorker.controller,
    active:registration?.active?.scriptURL||null,waiting:registration?.waiting?.scriptURL||null,
    installing:registration?.installing?.scriptURL||null};
  }catch(e){result.serviceWorker.error=String(e?.message||e);}
 }
 if('caches'in window)try{
  const keys=await caches.keys();result.caches=keys.filter(x=>x.startsWith('anderus-shell-'));
 }catch(e){result.cacheError=String(e?.message||e);}
 try{
  const response=await fetch(PREFIX+'data/live-game.json',{cache:'no-store'});
  result.catalog={ok:response.ok,status:response.status,bytes:response.headers.get('content-length')};
 }catch(e){result.catalog={ok:false,error:String(e?.message||e)};}
 try{
  const keys=Object.keys(localStorage).filter(k=>/anderus|nexus|v06/i.test(k));
  result.accountStorage={count:keys.length,keys};
 }catch(e){result.accountStorage={error:String(e?.message||e)};}
 return result;
}
async function inspect(){
 const output=document.getElementById('nexus-diag-report');
 if(!output)return;
 output.textContent='Consultando os componentes do Nexus…';
 const r=await collect();
 const build=r.build?escape(r.build.sha?.slice(0,12)||'indisponível'):'Não identificado';
 output.innerHTML='<dl>'+
  '<dt>Publicado</dt><dd>'+build+' · '+escape(stamp(r.build?.publishedAt))+'</dd>'+
  '<dt>Conexão</dt><dd>'+(r.online?'Online':'Offline')+'</dd>'+
  '<dt>Catálogo</dt><dd>'+(r.catalog.ok?'Disponível':'Indisponível')+'</dd>'+
  '<dt>Service Worker</dt><dd>'+(r.serviceWorker.controlled?'Controlando esta página':'Sem controle ativo nesta página')+'</dd>'+
  '<dt>Atualização pendente</dt><dd>'+(r.serviceWorker.waiting?'Sim':'Não detectada')+'</dd>'+
  '<dt>Caches Nexus</dt><dd>'+escape(r.caches.join(', ')||'nenhum')+'</dd>'+
  '<dt>Registros locais</dt><dd>'+r.accountStorage.count+' chaves relacionadas ao Nexus (não sincronizadas entre aparelhos)</dd>'+
  '</dl>';
 document.getElementById('nexus-diag-copy').onclick=()=>navigator.clipboard?.writeText(JSON.stringify(r,null,2)).catch(()=>{});
}
const LAST_BUILD_KEY='anderus-nexus-seen-build';
async function checkForUpdate(){
 if(!navigator.onLine)return;
 try{
  const response=await fetch(PREFIX+'build-meta.json?check='+Date.now(),{cache:'no-store'});
  if(!response.ok)return;
  const latest=await response.json(),sha=String(latest?.sha||'');
  if(!/^[a-f0-9]{40}$/i.test(sha))return;
  const previous=localStorage.getItem(LAST_BUILD_KEY);
  if(!previous){localStorage.setItem(LAST_BUILD_KEY,sha);return;}
  if(previous===sha||document.getElementById('nexus-update-banner'))return;
  const bar=document.createElement('aside');bar.id='nexus-update-banner';bar.setAttribute('role','status');
  bar.innerHTML='<span><strong>Nova versão do Nexus disponível</strong><small>Atualize o aplicativo sem alterar suas builds salvas.</small></span>'+
   '<button type="button" data-nexus-update>Atualizar agora</button><button type="button" data-nexus-update-later aria-label="Atualizar depois">×</button>';
  document.body.appendChild(bar);
  bar.querySelector('[data-nexus-update-later]').onclick=()=>bar.remove();
  bar.querySelector('[data-nexus-update]').onclick=async()=>{
   const editing=!!document.querySelector('.v06-import-form,.v11-edit-form,input[type=file]:focus,textarea:focus');
   if(editing&&!window.confirm('Há uma edição aberta. Atualizar a página pode descartar alterações ainda não salvas. Atualizar mesmo assim?'))return;
   try{if('serviceWorker'in navigator){const registration=await navigator.serviceWorker.getRegistration();await registration?.update();}}catch(error){console.warn('Atualização de Service Worker:',error);}
   localStorage.setItem(LAST_BUILD_KEY,sha);
   location.reload();
  };
 }catch(error){console.warn('Não foi possível verificar uma nova versão do Nexus',error);}
}
function mount(){
 if(!document.querySelector('.app')||document.getElementById('nexus-diagnostics-button'))return;
 const btn=document.createElement('button');
 btn.id='nexus-diagnostics-button';btn.type='button';
 btn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6"></path><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"></circle></svg>';
 btn.setAttribute('aria-label','Diagnóstico do Nexus');btn.title='Diagnóstico do Nexus';
 btn.setAttribute('aria-haspopup','dialog');
 btn.addEventListener('click',()=>{
  let dialog=document.getElementById('nexus-diagnostics-dialog');
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='nexus-diagnostics-dialog';
   dialog.setAttribute('aria-label','Diagnóstico do Nexus');
   dialog.innerHTML='<div class="nexus-diag-head"><h2>Diagnóstico do Nexus</h2><button type="button" id="nexus-diag-close" aria-label="Fechar diagnóstico">×</button></div>'+
     '<p>Verifique a versão publicada, o funcionamento offline e os dados locais. Nenhuma informação da sua conta é enviada.</p>'+
     '<div id="nexus-diag-report" aria-live="polite"></div>'+
     '<div class="nexus-diag-actions"><button type="button" id="nexus-diag-refresh">Verificar novamente</button><button type="button" id="nexus-diag-copy">Copiar relatório</button><button type="button" id="nexus-diag-backup">Transferir conta</button></div>'+
     '<p class="nexus-diag-note">Importante: atualizar o aplicativo não sincroniza personagens entre celular e desktop.</p>';
   document.body.appendChild(dialog);
   dialog.querySelector('#nexus-diag-close').onclick=()=>dialog.close();
   dialog.querySelector('#nexus-diag-refresh').onclick=inspect;
   dialog.querySelector('#nexus-diag-backup').onclick=()=>window.NexusBackup?.open();
  }
  dialog.showModal();inspect();
 });
 (document.querySelector('.mast-actions')||document.querySelector('.masthead')||document.body).appendChild(btn);
 checkForUpdate();
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkForUpdate();});
}
window.NexusDiagnostics={collect,checkForUpdate,open:()=>document.getElementById('nexus-diagnostics-button')?.click(),mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
