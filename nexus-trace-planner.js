/* Anderus / Trace Planner: sourced per-node upgrade requirements. */
(function(){
'use strict';
if(window.NexusTracePlanner)return;
const ART='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let promise=null,character='';
const num=n=>new Intl.NumberFormat('pt-BR').format(n);
const bridge=()=>window.NexusFarmBridge;
function load(){
 if(!promise)promise=Promise.all([
  fetch('./data/live-game.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo de personagens indisponível');return r.json();}),
  fetch('./data/character-traces.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo de rastros indisponível');return r.json();})
 ]).then(([game,trace])=>({game,trace})).catch(e=>{promise=null;throw e});
 return promise;
}
function maximum(node){return Math.max(1,Math.min(15,Math.min(Number(node.maxLevel||1),node.levels?.length||1)));}
function calculate(nodes,plan={}){
 const needed={},pending=[];
 let configured=0,upgrades=0;
 for(const node of nodes||[]){
  const entry=plan[node.id]||{};
  const current=entry.current;
  const max=maximum(node);
  const target=entry.target==null?max:Number(entry.target);
  if(current===null||current===undefined||current===''){pending.push(node.id);continue;}
  const start=Number(current);
  if(!Number.isInteger(start)||start<0||start>max||!Number.isInteger(target)||target<start||target>max)
   throw Error('Níveis inválidos no rastro '+node.id);
  configured++;
  upgrades+=target-start;
  for(let level=start;level<target;level++)for(const item of node.levels?.[level]?.materials||[]){
   const count=Number(item.num||0);
   if(!item.id||!Number.isFinite(count)||count<0)throw Error('Custo de material inválido: '+node.id);
   needed[item.id]=(needed[item.id]||0)+count;
  }
 }
 return {needed,pending,configured,upgrades};
}
function dialog(){
 let dlg=document.getElementById('nexus-traces-dialog');if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-traces-dialog';dlg.setAttribute('aria-label','Planejamento de rastros dos personagens');
 dlg.innerHTML='<div class="nexus-traces-shell"><header><div><span>ANDERUS · RASTROS E MATERIAIS</span><h2>Trace Planner</h2><p>Escolha os níveis atuais e as metas de cada rastro. O estoque é compartilhado com o Farm Planner.</p></div><button type="button" data-traces-close aria-label="Fechar">×</button></header>'+
 '<label class="nexus-traces-hero-select">Personagem<select id="nexus-traces-character"></select></label>'+
 '<div class="nexus-traces-toolbar"><button type="button" data-traces-zero>Estou começando com todos os rastros no nível 0</button><button type="button" data-traces-reset>Limpar níveis informados</button></div>'+
 '<section id="nexus-traces-nodes" aria-label="Rastros e metas"></section>'+
 '<section id="nexus-traces-report" aria-live="polite"></section>'+
 '<footer>Fonte: catálogo estruturado PT-BR do jogo, sem inferência de níveis da sua conta. O cálculo mostra somente custos de nós com níveis atuais informados; níveis ainda desconhecidos permanecem pendentes. Não inclui ganhos de eventos nem taxas de drops.</footer></div>';
 document.body.append(dlg);
 dlg.querySelector('[data-traces-close]').onclick=()=>dlg.close();
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
 dlg.querySelector('#nexus-traces-character').addEventListener('change',e=>{character=e.target.value;render()});
 dlg.addEventListener('change',event=>{
  const select=event.target.closest('[data-traces-node][data-traces-field]');
  if(!select)return;
  const id=select.dataset.tracesNode,key=select.dataset.tracesField,plan=bridge()?.traceRead(character)||{};
  plan[id]||={};
  plan[id][key]=select.value===''?null:Number(select.value);
  if(key==='current' && plan[id].current!=null && plan[id].target!=null && plan[id].target<plan[id].current)
   plan[id].target=plan[id].current;
  if(key==='target' && plan[id].current!=null && plan[id].target<plan[id].current)
   plan[id].current=plan[id].target;
  bridge()?.traceWrite(character,plan);
  render();
 });
 dlg.addEventListener('change',event=>{
  const input=event.target.closest('[data-trace-material]');
  if(!input)return;
  try{bridge()?.put(input.dataset.traceMaterial,Number(input.value));render();}
  catch(error){dlg.querySelector('#nexus-traces-report').textContent=String(error.message||error);}
 });
 dlg.querySelector('[data-traces-zero]').onclick=async()=>{
  if(!window.confirm('Preencher nível 0 em todos os rastros? Isso é uma declaração sua sobre a conta, não uma leitura automática.'))return;
  const {trace}=await load();
  const plan=bridge()?.traceRead(character)||{};
  for(const node of trace.trees?.[character]||[]){
   const max=maximum(node);
   plan[node.id]={current:0,target:plan[node.id]?.target??max};
  }
  bridge()?.traceWrite(character,plan);render();
 };
 dlg.querySelector('[data-traces-reset]').onclick=()=>{
  if(!window.confirm('Limpar os níveis informados deste personagem no planejador?'))return;
  bridge()?.traceWrite(character,{});render();
 };
 return dlg;
}
function renderNode(node,plan,game){
 const max=maximum(node),current=plan[node.id]?.current??null,target=plan[node.id]?.target??max;
 const skillId=node.levelUpSkills?.[0]?.id;
 const ability=game.skills?.[skillId]||{};
 const title=node.name||ability.name||'Rastro '+node.id;
 const type=skillId?'Habilidade':node.desc?'Rastro maior':'Atributo adicional';
 const options=(chosen,allowUnknown)=>(
  (allowUnknown?'<option value="" '+(chosen===null?'selected':'')+'>Não informado</option>':'')+
  Array.from({length:max+1},(_,n)=>'<option value="'+n+'" '+(n===Number(chosen)&&chosen!==null?'selected':'')+'>Nv. '+n+'</option>').join('')
 );
 return '<article class="nexus-trace-node"><div class="nexus-trace-name">'+
  (node.icon?'<img src="'+esc(ART+node.icon)+'" alt="" loading="lazy" onerror="this.hidden=true">':'')+
  '<div><small>'+esc(type)+' · ID '+esc(node.id)+'</small><h3>'+esc(title)+'</h3></div></div>'+
  '<div class="nexus-trace-levels"><label>Atual<select data-traces-node="'+esc(node.id)+'" data-traces-field="current">'+options(current,true)+'</select></label>'+
  '<label>Meta<select data-traces-node="'+esc(node.id)+'" data-traces-field="target">'+options(target,false)+'</select></label></div></article>';
}
async function render(){
 const dlg=dialog(),target=dlg.querySelector('#nexus-traces-nodes'),report=dlg.querySelector('#nexus-traces-report');
 try{
  const {game,trace}=await load();
  if(!dlg.open)return;
  const names=Object.keys(trace.trees||{}).filter(id=>game.chars?.[id]?.name);
  const owned=new Set((bridge()?.roster()||[]).map(x=>x.id));
  names.sort((a,b)=>(Number(owned.has(b))-Number(owned.has(a)))||game.chars[a].name.localeCompare(game.chars[b].name,'pt-BR'));
  if(!names.includes(character))character=names[0]||'';
  const select=dlg.querySelector('#nexus-traces-character');
  select.innerHTML=names.map(id=>'<option value="'+esc(id)+'">'+(owned.has(id)?'★ ':'')+esc(game.chars[id].name)+'</option>').join('');
  select.value=character;
  const nodes=trace.trees?.[character]||[],plan=bridge()?.traceRead(character)||{},stocks=bridge()?.inventory()||{};
  target.innerHTML=nodes.length?'<div class="nexus-traces-grid">'+nodes.map(node=>renderNode(node,plan,game)).join('')+'</div>':
   '<p>Este personagem não possui rastros sincronizados.</p>';
  const summary=calculate(nodes,plan);
  const rows=Object.entries(summary.needed).sort((a,b)=>a[0]==='2'?-1:b[0]==='2'?1:0).map(([id,need])=>{
   const item=trace.items?.[id]||{},have=Number(stocks[id]||0),missing=Math.max(0,need-have);
   return '<article class="nexus-trace-material">'+(item.icon?'<img src="'+esc(ART+item.icon)+'" alt="" loading="lazy" onerror="this.hidden=true">':'')+
    '<div><h4>'+esc(item.name||'Material '+id)+'</h4><p>Precisa: '+num(need)+' · Falta: <strong>'+num(missing)+'</strong></p></div>'+
    '<label>Tenho<input type="number" min="0" step="1" max="100000000" inputmode="numeric" data-trace-material="'+esc(id)+'" value="'+esc(have)+'"></label></article>';
  }).join('');
  report.innerHTML='<header class="nexus-trace-result-head"><div><span>'+summary.configured+'/'+nodes.length+' rastros configurados</span><h3>'+summary.upgrades+' níveis planejados</h3></div></header>'+
   (summary.pending.length?'<p role="status" class="nexus-trace-warning">'+summary.pending.length+' rastros ainda sem nível atual. Os custos exibidos são parciais; não interprete como total para maximizar o personagem.</p>':'<p class="nexus-trace-ready">Todos os níveis atuais foram informados. O estoque é descontado uma única vez por material.</p>')+
   '<div class="nexus-traces-materials">'+(rows||'<p>Selecione níveis atuais e metas para visualizar os materiais necessários.</p>')+'</div>';
 }catch(error){target.textContent='Não foi possível carregar rastros: '+String(error.message||error);report.textContent='';}
}
async function open(id){
 const dlg=dialog();
 if(id)character=String(id);
 if(!dlg.open)dlg.showModal();
 await render();
}
function mount(){
 if(mount.done)return;mount.done=true;
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-nexus-traces-for]');
  if(button)open(button.dataset.nexusTracesFor);
 });
}
window.NexusTracePlanner={open,mount,load,calculate,maximum};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();