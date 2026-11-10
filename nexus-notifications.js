/* Anderus / notification inbox — sourced local snapshots only, never fake push. */
(function(){
'use strict';
if(window.NexusNotifications)return;
const KEY='anderus_nexus_seen_notices';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let notices=[],loading=false;
function seen(){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[];}
 catch(_){return [];}
}
function markAll(){
 try{localStorage.setItem(KEY,JSON.stringify([...new Set([...seen(),...notices.map(x=>x.id)])].slice(-150)));}
 catch(error){console.warn('Notificações: estado não persistido',error);}
 render();updateBadge();
}
async function fetchJSON(path){
 try{const r=await fetch(path,{cache:'no-store'});return r.ok?await r.json():null;}
 catch(_){return null;}
}
function parse(beta,history){
 const result=[];
 if(beta?.revision && beta?.changes){
  const detail=Object.values(beta.changes).flat().filter(x=>x?.name);
  result.push({id:'beta:'+String(beta.revision),type:'BETA · NÃO CONFIRMADO',
   title:'Nova revisão monitorada '+String(beta.version||''),at:beta.checkedAt,
   body:detail.length?detail.slice(0,12).map(x=>x.name).join(' · '):'Nenhum detalhe de alteração disponível.',
   url:beta.source||'',note:'Detecção de revisão não equivale a confirmação de kit final.'});
 }
 if(Array.isArray(history)){
  for(const item of history.slice(0,10)){
   const changes=Object.entries(item.changes||{}).filter(([,value])=>value?.new_or_changed||value?.removed);
   if(!changes.length)continue;
   const date=String(item.checkedAt||'');
   const summaries=changes.map(([name,value])=>name+' '+(value.new_or_changed||0)+' adicionados/alterados'+(value.removed?' · '+value.removed+' removidos':''));
   result.push({id:'catalog:'+date,type:'CATÁLOGO E KITS',
    title:'Snapshot de dados atualizado',at:item.checkedAt,
    body:summaries.join(' · '),url:'',note:'Sincronização de fonte comunitária; verifique notas oficiais para balanceamentos.'});
  }
 }
 return result.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,25);
}
async function load(){
 if(loading)return;
 loading=true;
 try{
  const [beta,history]=await Promise.all([
   fetchJSON('./data/beta-watch.json'),fetchJSON('./data/catalog-changelog.json')
  ]);
  notices=parse(beta,history);render();updateBadge();
 }finally{loading=false;}
}
function fmtDate(v){
 if(!v)return 'Data não informada';
 const d=new Date(v);
 return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR'):'Data não informada';
}
function dialog(){
 let dlg=document.getElementById('nexus-notice-dialog');if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-notice-dialog';dlg.setAttribute('aria-label','Notificações e atualizações do Nexus');
 dlg.innerHTML='<div class="nexus-notice-body"><header><div><span>BOLETINS DO EXPRESSO</span><h2>Atualizações verificáveis</h2><p>Somente alterações detectadas em fontes versionadas, nunca notificações simuladas.</p></div><button type="button" data-notice-close aria-label="Fechar notificações">×</button></header>'+
  '<div class="nexus-notice-tools"><button type="button" data-notice-refresh>Verificar novamente</button><button type="button" data-notice-read>Marcar como lidas</button></div>'+
  '<div id="nexus-notice-list" aria-live="polite"></div><p class="nexus-notice-caveat">Estas são notificações locais, exibidas ao abrir o aplicativo. Não são push e não monitoram o jogo continuamente fora do navegador.</p></div>';
 document.body.append(dlg);
 dlg.querySelector('[data-notice-close]').onclick=()=>dlg.close();
 dlg.querySelector('[data-notice-refresh]').onclick=load;
 dlg.querySelector('[data-notice-read]').onclick=markAll;
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
 return dlg;
}
function render(){
 const dlg=document.getElementById('nexus-notice-dialog');
 if(!dlg)return;
 const root=dlg.querySelector('#nexus-notice-list'),viewed=new Set(seen());
 root.innerHTML=notices.length?notices.map(n=>
  '<article class="nexus-notice-item '+(!viewed.has(n.id)?'nexus-notice-unread':'')+'">'+
    '<small>'+esc(n.type)+' · '+esc(fmtDate(n.at))+'</small><h3>'+esc(n.title)+'</h3>'+
    '<p>'+esc(n.body)+'</p><p class="nexus-notice-source">'+esc(n.note)+'</p>'+
    (n.url&&/^https:\/\//.test(n.url)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(n.url)+'">Consultar fonte</a>':'')+'</article>'
 ).join(''):'<p class="nexus-notice-empty">Nenhuma atualização rastreável neste snapshot. A ausência de notificações não comprova que o jogo não mudou.</p>';
}
function updateBadge(){
 const button=document.getElementById('nexus-notifications-button');
 if(!button)return;
 const count=notices.filter(n=>!seen().includes(n.id)).length;
 button.dataset.unread=count?String(count):'';
 button.setAttribute('aria-label',count?'Notificações · '+count+' não lidas':'Notificações do Nexus');
}
async function open(){
 const dlg=dialog();if(!dlg.open)dlg.showModal();
 await load();
}
function mount(){
 if(document.getElementById('nexus-notifications-button'))return;
 const header=document.querySelector('.mast-actions')||document.querySelector('.masthead');
 const buttons=[...(header?.querySelectorAll('button.i-btn')||[])];
 const native=buttons[1]||null;
 if(native){
  native.id='nexus-notifications-button';
  native.setAttribute('aria-label','Notificações do Nexus');
  native.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},true);
 }else{
  const btn=document.createElement('button');btn.id='nexus-notifications-button';btn.type='button';
  btn.setAttribute('aria-label','Notificações do Nexus');
  btn.innerHTML='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>';
  btn.addEventListener('click',open);
  (header||document.body).append(btn);
 }
 load();
}
window.NexusNotifications={open,load,parse,markAll};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();