/* Anderus 2.0 / Farm: only sourced character ascension requirements. */
(function(){
'use strict';
if(window.NexusFarmLab)return;
const BASE='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const steps=['Sem ascensão (até Nv. 20)','Ascensão 1 (até Nv. 30)','Ascensão 2 (até Nv. 40)','Ascensão 3 (até Nv. 50)','Ascensão 4 (até Nv. 60)','Ascensão 5 (até Nv. 70)','Ascensão 6 (até Nv. 80)'];
let dataPromise=null,character='',from=4,to=6;
function load(){
 return dataPromise||(dataPromise=Promise.all([
  fetch('./data/live-game.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo de personagens não disponível');return r.json();}),
  fetch('./data/ascension-materials.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo de materiais não disponível');return r.json();})
 ]).then(([game,materials])=>({game,materials})).catch(e=>{dataPromise=null;throw e}));
}
function compute(stages,fromStage,toStage){
 if(!Array.isArray(stages)||!Number.isInteger(fromStage)||!Number.isInteger(toStage)||fromStage<0||toStage>6||fromStage>toStage)throw Error('Etapas de ascensão inválidas.');
 const counts={};
 for(let index=fromStage;index<toStage;index++){
  const requirements=stages[index]||[];
  for(const row of requirements){
   const n=Number(row.num);
   if(!row.id||!Number.isFinite(n)||n<0)throw Error('Material inválido na fonte do jogo.');
   counts[String(row.id)]=(counts[String(row.id)]||0)+n;
  }
 }
 return counts;
}
function missing(counts,have){
 return Object.fromEntries(Object.entries(counts).map(([id,need])=>[id,Math.max(0,need-Number(have?.[id]||0))]));
}
function dialog(){
 let dlg=document.getElementById('nexus-farm-dialog');
 if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-farm-dialog';dlg.setAttribute('aria-label','Farm Planner — materiais de ascensão');
 dlg.innerHTML='<section class="nexus-farm-body"><header><div><span>ANDERUS / ASCENSÃO VERIFICADA</span><h2>Farm Planner 2.0</h2><p>Calcule o que falta para a ascensão, sem estimar drops desconhecidos.</p></div><button type="button" data-farm-close aria-label="Fechar">×</button></header>'+
 '<div class="nexus-farm-inputs"><label>Personagem<select id="nexus-farm-character"></select></label>'+
 '<label>Ascensão atual<select id="nexus-farm-from"></select></label><label>Ascensão desejada<select id="nexus-farm-to"></select></label></div>'+
 '<div id="nexus-farm-report" aria-live="polite"></div><p class="nexus-farm-source">Fonte: catálogo comunitário estruturado PT-BR de Honkai: Star Rail. XP, créditos para níveis, rastros, materiais semanais e taxas de drops não estão incluídos neste cálculo. Confirme seu estágio de ascensão antes de usar.</p></section>';
 document.body.append(dlg);
 dlg.querySelector('[data-farm-close]').onclick=()=>dlg.close();
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
 dlg.querySelector('#nexus-farm-character').addEventListener('change',e=>{character=e.target.value;render()});
 dlg.querySelector('#nexus-farm-from').addEventListener('change',e=>{from=Number(e.target.value);if(to<from)to=from;render()});
 dlg.querySelector('#nexus-farm-to').addEventListener('change',e=>{to=Number(e.target.value);if(to<from)from=to;render()});
 dlg.addEventListener('change',e=>{
  const input=e.target.closest('[data-farm-stock]');
  if(input){
   try{window.NexusFarmBridge?.put(input.dataset.farmStock,Number(input.value));render();}
   catch(error){dlg.querySelector('#nexus-farm-report').textContent=String(error.message||error);}
  }
 });
 return dlg;
}
async function render(){
 const dlg=dialog(),root=dlg.querySelector('#nexus-farm-report');
 try{
  const {game,materials}=await load();
  if(!dlg.open)return;
  const ids=Object.keys(materials.promotions||{}).filter(id=>game.chars?.[id]?.name);
  const owned=new Set((window.NexusFarmBridge?.roster()||[]).map(x=>x.id));
  ids.sort((a,b)=>(Number(owned.has(b))-Number(owned.has(a)))||game.chars[a].name.localeCompare(game.chars[b].name,'pt-BR'));
  if(!ids.includes(character))character=ids[0]||'';
  dlg.querySelector('#nexus-farm-character').innerHTML=ids.map(id=>'<option value="'+esc(id)+'">'+(owned.has(id)?'★ ':'')+esc(game.chars[id].name)+'</option>').join('');
  dlg.querySelector('#nexus-farm-character').value=character;
  for(const [id,value] of [['nexus-farm-from',from],['nexus-farm-to',to]]){
   const el=dlg.querySelector('#'+id);
   el.innerHTML=steps.map((txt,index)=>'<option value="'+index+'">'+esc(txt)+'</option>').join('');
   el.value=String(value);
  }
  const c=game.chars[character];if(!c){root.textContent='Personagem não encontrada.';return;}
  const counts=compute(materials.promotions[character],from,to);
  const inventory=window.NexusFarmBridge?.inventory()||{},gap=missing(counts,inventory);
  const rows=Object.entries(counts).sort((a,b)=>a[0]==='2'?-1:b[0]==='2'?1:0).map(([id,need])=>{
   const item=materials.items?.[id]||{},have=inventory[id]??0,required=gap[id]||0;
   return '<article class="nexus-farm-material">'+
    (item.icon?'<img src="'+esc(BASE+item.icon)+'" alt="" loading="lazy" onerror="this.hidden=true">':'')+
    '<div><h3>'+esc(item.name||'Material '+id)+'</h3><p>Necessário: <b>'+need.toLocaleString('pt-BR')+'</b> · Falta: <strong>'+required.toLocaleString('pt-BR')+'</strong></p>'+
     (item.come_from?.length?'<details><summary>Onde encontrar</summary><p>'+item.come_from.slice(0,4).map(esc).join(' · ')+'</p></details>':'')+
    '</div><label>Tenho<input inputmode="numeric" type="number" min="0" max="100000000" step="1" data-farm-stock="'+esc(id)+'" value="'+esc(have)+'"></label></article>';
  }).join('');
  const total=Object.values(gap).filter(n=>n>0).length;
  root.innerHTML='<div class="nexus-farm-total"><strong>'+total+' tipo(s) de material ainda necessários</strong><span>De '+esc(steps[from])+' até '+esc(steps[to])+'</span></div>'+
   (rows||'<p>Não há novas ascensões entre os estágios selecionados.</p>')+
   '<p class="nexus-farm-caveat">Os recursos informados são contados apenas uma vez neste planejamento. A conversão 3:1 depende da família de materiais; este painel não a aplica sem uma receita verificada.</p>';
 }catch(error){root.textContent='Não foi possível preparar a ascensão: '+String(error.message||error);}
}
async function open(id){
 const dlg=dialog();if(id)character=String(id);
 if(!dlg.open)dlg.showModal();
 const selected=(window.NexusFarmBridge?.roster()||[]).find(x=>x.id===character);
 if(selected?.level>=70)from=5;else if(selected?.level>=60)from=4;else if(selected?.level>=50)from=3;else if(selected?.level>=40)from=2;else if(selected?.level>=30)from=1;else from=0;
 to=6;await render();
}
function mount(){
 if(mount.done)return;mount.done=true;
 document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-nexus-farm-for]');
  if(btn)open(btn.dataset.nexusFarmFor);
 });
}
window.NexusFarmLab={open,load,compute,missing,mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();