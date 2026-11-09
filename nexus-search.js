/* Anderus Nexus 2.0 — canonical catalogue search, no fabricated results. */
(function(){
'use strict';
if(window.NexusSearch)return;
const BASE='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
let dataPromise=null,query='',category='all';
const categories={all:'Tudo',character:'Personagens',cone:'Cones de Luz',set:'Conjuntos de relíquias',item:'Relíquias'};
function load(){
 if(!dataPromise)dataPromise=fetch('./data/live-game.json',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw Error('Catálogo indisponível: '+r.status);return r.json();
 }).catch(e=>{dataPromise=null;throw e});
 return dataPromise;
}
function entries(data){
 const list=[];
 const groups=[['character',data.chars||{}],['cone',data.cones||{}],['set',data.relicSets||{}],['item',data.relics||{}]];
 for(const [type,group] of groups){
  for(const [id,row] of Object.entries(group)){
   if(!row?.name)continue;
   list.push({type,id,name:row.name,icon:row.icon||row.portrait||'',path:row.path||'',rarity:row.rarity||null,
    setId:row.set_id||null,haystack:norm(row.name+' '+id)});
  }
 }
 return list;
}
function sortResults(list,q){
 const key=norm(q);
 if(!key)return list.filter(x=>x.type==='character').slice(0,20);
 return list.filter(x=>x.haystack.includes(key)).map(x=>({...x,score:x.haystack===key?0:x.haystack.startsWith(key)?1:2}))
  .sort((a,b)=>a.score-b.score||a.name.localeCompare(b.name,'pt-BR')).slice(0,60);
}
function dialog(){
 let dlg=document.getElementById('nexus-search-dialog');
 if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-search-dialog';
 dlg.setAttribute('aria-label','Pesquisa universal do Nexus');
 dlg.innerHTML='<section class="nexus-search-body"><header><div><span>PESQUISA DO EXPRESSO ASTRAL</span><h2>Encontre no Nexus</h2></div><button type="button" data-search-close aria-label="Fechar pesquisa">×</button></header>'+
 '<label for="nexus-search-input">Pesquisar por nome ou ID</label><input type="search" id="nexus-search-input" placeholder="Personagem, cone, conjunto, equipamento…">'+
 '<div class="nexus-search-categories" role="group" aria-label="Categorias"></div>'+
 '<div id="nexus-search-results" aria-live="polite">Carregando catálogo…</div>'+
 '<p class="nexus-search-help">Resultados do catálogo local PT-BR, não de uma consulta em tempo real. Use Escape para fechar.</p></section>';
 document.body.append(dlg);
 dlg.querySelector('[data-search-close]').onclick=()=>dlg.close();
 dlg.querySelector('#nexus-search-input').addEventListener('input',e=>{query=e.target.value;render()});
 dlg.addEventListener('click',e=>{
  if(e.target===dlg){dlg.close();return;}
  const group=e.target.closest('[data-search-category]');
  if(group){category=group.dataset.searchCategory;render();return;}
  const hit=e.target.closest('[data-search-type][data-search-id]');
  if(hit)openResult(hit.dataset.searchType,hit.dataset.searchId);
 });
 return dlg;
}
async function render(){
 const dlg=dialog(),results=dlg.querySelector('#nexus-search-results');
 dlg.querySelector('.nexus-search-categories').innerHTML=Object.entries(categories).map(([id,label])=>
  '<button type="button" data-search-category="'+id+'" aria-pressed="'+(category===id)+'">'+esc(label)+'</button>').join('');
 try{
  const data=await load();if(!dlg.open)return;
  const items=sortResults(entries(data).filter(x=>category==='all'||x.type===category),query);
  results.innerHTML=items.length?'<div class="nexus-search-items">'+items.map(item=>{
   const desc=categories[item.type]||item.type;
   return '<button type="button" class="nexus-search-hit" data-search-type="'+item.type+'" data-search-id="'+esc(item.id)+'">'+
     (item.icon?'<img src="'+esc(BASE+item.icon)+'" alt="" loading="lazy" onerror="this.hidden=true">':'')+
     '<span><strong>'+esc(item.name)+'</strong><small>'+esc(desc)+' · ID '+esc(item.id)+'</small></span><span aria-hidden="true">›</span></button>';
  }).join('')+'</div>':'<p class="nexus-search-empty">Nenhum resultado encontrado neste catálogo. Experimente outro nome ou ID.</p>';
 }catch(e){results.textContent='Não foi possível ler o catálogo: '+String(e.message||e);}
}
function openResult(type,id){
 const dlg=dialog();dlg.close();
 if(type==='character'){
  if(typeof window.openProfile==='function')window.openProfile(id);
  else window.NexusKitLab?.open(id);
  return;
 }
 // For catalogue records without a full dossier, show their real structured data.
 load().then(g=>{
  const row=({cone:g.cones,set:g.relicSets,item:g.relics})[type]?.[id];
  if(!row)return;
  const out=document.createElement('dialog');out.className='nexus-search-detail';
  const safeObject=Object.entries(row).filter(([key])=>['name','rarity','path','type','desc','max_level','set_id'].includes(key));
  out.innerHTML='<header><h2>'+esc(row.name)+'</h2><button type="button" aria-label="Fechar">×</button></header>'+
   '<dl>'+safeObject.map(([key,value])=>'<dt>'+esc(key)+'</dt><dd>'+esc(Array.isArray(value)?value.join(' · '):String(value))+'</dd>').join('')+'</dl>'+
   '<p>Fonte: catálogo de dados PT-BR sincronizado. Não há ficha interativa completa desta categoria nesta versão.</p>';
  document.body.append(out);out.querySelector('button').onclick=()=>{out.close();out.remove()};
  out.addEventListener('close',()=>out.remove(),{once:true});out.showModal();
 }).catch(()=>{});
}
function open(){
 const dlg=dialog();if(!dlg.open)dlg.showModal();
 dlg.querySelector('#nexus-search-input').focus();render();
}
function mount(){
 if(document.getElementById('nexus-search-button'))return;
 const header=document.querySelector('.mast-actions')||document.querySelector('.masthead');
 // Reuse the existing header magnifier instead of introducing a duplicate.
 const existing=header?.querySelector('.i-btn[aria-label*="usca"],.i-btn[title*="usca"],.i-btn[onclick*="earch"]')
    ||header?.querySelector('.i-btn');
 if(existing){
  existing.id='nexus-search-button';
  existing.setAttribute('aria-label','Pesquisa universal do Nexus');
  existing.setAttribute('aria-keyshortcuts','Control+K Meta+K');
  existing.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open();},true);
 }else{
  const trigger=document.createElement('button');
  trigger.id='nexus-search-button';trigger.type='button';trigger.setAttribute('aria-label','Pesquisa universal do Nexus');
  trigger.innerHTML='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>';
  trigger.addEventListener('click',open);
  if(header)header.prepend(trigger);else document.body.append(trigger);
 }
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}
 });
}
window.NexusSearch={open,mount,load,entries,sortResults};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();