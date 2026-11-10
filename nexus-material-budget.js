/* ANDERUS NEXUS 2.0 — single shared material ledger for goals. */
(function(){
'use strict';
if(window.NexusMaterialBudget)return;
const ASSET='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=new Intl.NumberFormat('pt-BR');
let sources=null,loading=null;
function getSources(){
 return loading||(loading=Promise.all([
  fetch('./data/ascension-materials.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo de ascensão indisponível');return r.json();}),
  fetch('./data/character-traces.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo de rastros indisponível');return r.json();})
 ]).then(([a,t])=>sources={a,t}).catch(e=>{loading=null;throw e}));
}
const increment=(obj,key,amount)=>{
 const n=Number(amount);
 if(!Number.isFinite(n)||n<0)throw Error('Material com custo inválido: '+key);
 obj[String(key)]=(obj[String(key)]||0)+n;
};
function calculate(catalogue,plans={},inventory={}){
 const {a,t}=catalogue||{};
 if(!a?.promotions||!t?.trees)throw Error('Catálogos não foram carregados');
 const total={},breakdown=[],pending=[],ascent=plans.ascension||{},traces=plans.traces||{};
 for(const [id,plan] of Object.entries(ascent)){
  const steps=a.promotions[id],from=Number(plan?.from),to=Number(plan?.to);
  if(!steps){pending.push('Ascensão do personagem '+id+': catálogo indisponível');continue;}
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to>6||from>to){
   pending.push('Ascensão do personagem '+id+': etapa inválida');continue;
  }
  const sub={};
  for(let i=from;i<to;i++)for(const item of steps[i]||[])increment(sub,item.id,item.num);
  for(const [item,n] of Object.entries(sub))increment(total,item,n);
  breakdown.push({type:'ascension',character:id,needed:sub,steps:to-from});
 }
 for(const [id,plan] of Object.entries(traces)){
  const nodes=t.trees[id];
  if(!nodes){pending.push('Rastros do personagem '+id+': catálogo indisponível');continue;}
  const sub={};let incomplete=0;
  for(const node of nodes){
   const entry=plan?.[node.id];
   if(!entry)continue;
   const max=Math.max(1,Math.min(15,Number(node.maxLevel||1),node.levels?.length||1));
   const from=entry.current,to=entry.target??max;
   if(from===null||from===undefined||from===''){incomplete++;continue;}
   const start=Number(from),end=Number(to);
   if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>max||start>end){
    pending.push('Rastro '+node.id+': nível inválido');continue;
   }
   for(let i=start;i<end;i++)for(const item of node.levels?.[i]?.materials||[])increment(sub,item.id,item.num);
  }
  if(incomplete)pending.push('Personagem '+id+': '+incomplete+' rastro(s) com nível desconhecido');
  for(const [item,n] of Object.entries(sub))increment(total,item,n);
  breakdown.push({type:'traces',character:id,needed:sub,steps:Object.keys(plan||{}).length});
 }
 const rows=Object.entries(total).map(([id,required])=>{
  const have=Number(inventory?.[id]||0);
  if(!Number.isFinite(have)||have<0)throw Error('Estoque inválido do material '+id);
  return {id,required,have,missing:Math.max(0,required-have),
   remaining:Math.max(0,have-required)};
 }).sort((a,b)=>b.missing-a.missing||a.id.localeCompare(b.id));
 return {rows,breakdown,pending,materials:rows.length,
  outstanding:rows.filter(row=>row.missing>0).length};
}
function dialog(){
 let el=document.getElementById('nexus-material-budget');if(el)return el;
 el=document.createElement('dialog');el.id='nexus-material-budget';el.setAttribute('aria-label','Orçamento global de materiais');
 el.innerHTML='<section class="nexus-budget-inner"><header><div><span>ANDERUS · CONTA ÚNICA</span><h2>Orçamento global de materiais</h2><p>Somatório de metas de ascensão e rastros, descontando o estoque somente uma vez.</p></div><button type="button" data-budget-close aria-label="Fechar">×</button></header>'+
  '<div id="nexus-budget-results" aria-live="polite">Carregando orçamento…</div>'+
  '<p class="nexus-budget-explain">Os materiais são consumidos no cálculo, não na sua conta do jogo. Planos sem níveis informados permanecem parciais. Créditos, materiais semanais e itens de ascensão só entram quando a fonte registra suas quantidades. Não aplicamos conversões 3:1 sem receita verificada.</p></section>';
 document.body.append(el);
 el.querySelector('[data-budget-close]').onclick=()=>el.close();
 el.addEventListener('click',e=>{if(e.target===el)el.close()});
 return el;
}
async function render(){
 const el=dialog(),root=el.querySelector('#nexus-budget-results');
 root.textContent='Somando materiais dos seus planejamentos…';
 try{
  const data=await getSources(),bridge=window.NexusFarmBridge;
  if(!bridge){root.textContent='Abra Minha Conta para carregar o inventário antes de ver o orçamento.';return;}
  const goal=calculate(data,bridge.allPlans?.()||{},bridge.inventory?.()||{});
  const materials={...data.t.items,...data.a.items};
  const names=Object.fromEntries((bridge.roster?.()||[]).map(c=>[c.id,c.name]));
  root.innerHTML='<div class="nexus-budget-metrics"><div><small>TIPOS DE MATERIAL</small><strong>'+goal.materials+'</strong></div>'+
   '<div><small>AINDA FALTAM</small><strong>'+goal.outstanding+'</strong></div>'+
   '<div><small>METAS REGISTRADAS</small><strong>'+goal.breakdown.length+'</strong></div></div>'+
   (goal.pending.length?'<div class="nexus-budget-pending"><strong>Valores pendentes</strong><ul>'+goal.pending.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></div>':'')+
   '<div class="nexus-budget-breakdown"><h3>Planejamentos incluídos</h3>'+
   (goal.breakdown.length?goal.breakdown.map(x=>'<span>'+esc(names[x.character]||'Personagem '+x.character)+' · '+(x.type==='ascension'?'Ascensão':'Rastros')+'</span>').join(''):
   '<p>Registre uma meta de ascensão ou níveis de rastros para começar.</p>')+'</div>'+
   '<div class="nexus-budget-items"><h3>Estoque único e faltantes totais</h3>'+
   (goal.rows.length?goal.rows.map(row=>{
    const item=materials[row.id]||{};
    return '<article class="nexus-budget-item">'+
     (item.icon?'<img src="'+esc(ASSET+item.icon)+'" loading="lazy" alt="" onerror="this.hidden=true">':'')+
     '<div><strong>'+esc(item.name||'Material '+row.id)+'</strong>'+
      '<p>Necessário: '+nf.format(row.required)+' · Em estoque: '+nf.format(row.have)+'</p></div>'+
     '<span class="'+(row.missing?'missing':'complete')+'">'+(row.missing?'Faltam '+nf.format(row.missing):'Coberto')+'</span></article>';
   }).join(''):'<p>Não há custos calculáveis até que você registre os objetivos.</p>')+'</div>';
 }catch(error){root.textContent='Não foi possível calcular o orçamento: '+String(error.message||error);}
}
function open(){
 const el=dialog();if(!el.open)el.showModal();render();
}
function mount(){
 if(mount.done)return;mount.done=true;
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-material-budget]'))open();
 });
}
window.NexusMaterialBudget={open,calculate,getSources};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();