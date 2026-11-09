/* ANDERUS 2.0 / Relic Optimizer: explainable substat signals, not artificial ratings. */
(function(){
'use strict';
if(window.NexusRelicOptimizer)return;
const SLOT=['Cabeça','Mãos','Corpo','Pés','Esfera Plana','Corda de Ligação'];
const BASE='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let gamePromise=null,character='';
function load(){
 return gamePromise||(gamePromise=fetch('./data/live-game.json',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw Error('Catálogo de habilidades não disponível');return r.json();
 }).catch(e=>{gamePromise=null;throw e}));
}
function analyseKit(skills=[]){
 const text=skills.map(s=>clean(s?.desc||'')).join(' ');
 return {
  hp:/(?:dano|cura|escudo)[^.!?]{0,140}igual a[^.!?]{0,80}(?:dos?|da) pv maximos/.test(text),
  atk:/(?:dano|cura|escudo)[^.!?]{0,140}igual a[^.!?]{0,80}do atq/.test(text),
  def:/(?:dano|cura|escudo)[^.!?]{0,140}igual a[^.!?]{0,80}da def/.test(text),
  break:text.includes('efeito de quebra')||text.includes('dano de quebra'),
  debuff:text.includes('taxa de acerto de efeito')||text.includes('chance-base'),
  raw:text
 };
}
function assessPiece(piece,scale={}){
 const subs=(piece.subs||[]).filter(s=>s.stat&&s.value!==null&&s.value!==undefined);
 const reasons=[];
 const add=(stat,why)=>{if(subs.some(s=>s.stat===stat))reasons.push(why)};
 if(scale.hp){add('PV %','PV % coincide com escalamento de PV identificado');add('PV','PV plano aparece no kit como atributo de escalamento');}
 if(scale.atk){add('ATQ %','ATQ % coincide com escalamento de ATQ identificado');add('ATQ','ATQ plano aparece no kit como atributo de escalamento');}
 if(scale.def){add('DEF %','DEF % coincide com escalamento de DEF identificado');add('DEF','DEF plano aparece no kit como atributo de escalamento');}
 if(scale.break)add('Efeito de Quebra','Efeito de Quebra aparece no texto do kit');
 if(scale.debuff)add('Taxa de Acerto de Efeito','O kit menciona acerto de efeito ou condições de debuff');
 const missing=[];
 if(!piece.setId)missing.push('conjunto');
 if(!piece.main?.stat||piece.main?.value===null||piece.main?.value===undefined)missing.push('atributo principal');
 if(piece.level===null||piece.level===undefined)missing.push('nível da peça');
 if(subs.length<4)missing.push((4-subs.length)+' subatributos');
 return {reasons,missing,completed:missing.length===0,subs};
}
function dialog(){
 let dlg=document.getElementById('nexus-relic-optimizer');
 if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-relic-optimizer';
 dlg.setAttribute('aria-label','Relic Optimizer — leitura contextual das relíquias');
 dlg.innerHTML='<section class="nexus-relic-opt-body"><header><div><span>ANDERUS / EQUIPAMENTO VERIFICÁVEL</span><h2>Relic Optimizer</h2><p>Prioridades extraídas do texto das habilidades, sem uma nota artificial de 0 a 100.</p></div><button type="button" data-relic-opt-close aria-label="Fechar">×</button></header>'+
  '<div id="nexus-relic-opt-content" aria-live="polite"></div>'+
  '<footer>Esta análise examina somente equipamentos já cadastrados e padrões literais de escalamento do kit. Não conhece peças guardadas na mochila, buffs de combate, velocidade alvo, testes práticos ou o melhor conjunto da versão. Não recomenda trocar uma peça sem comparar esses fatores.</footer></section>';
 document.body.append(dlg);
 dlg.querySelector('[data-relic-opt-close]').onclick=()=>dlg.close();
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
 dlg.addEventListener('click',e=>{
  const button=e.target.closest('[data-relic-opt-edit]');
  if(!button)return;
  const i=Number(button.dataset.relicOptEdit);dlg.close();
  window.v11EditRelic?.(character,i);
 });
 return dlg;
}
async function render(){
 const dlg=dialog(),root=dlg.querySelector('#nexus-relic-opt-content');
 root.textContent='Lendo os seis equipamentos e as habilidades…';
 try{
  const game=await load(),engine=await import('./nexus-account-engine.js');
  const saved=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}');
  const build=saved.characters?.[character],c=game.chars?.[character];
  if(!build||!c){root.textContent='Adicione esta personagem à Minha Conta antes de avaliar equipamentos.';return;}
  const skills=(c.skills||[]).map(id=>game.skills?.[id]).filter(Boolean);
  const scale=analyseKit(skills);
  const records=engine.normalizeRelics(saved.v06RelicDetails?.[character],build.relics,game.relicSets);
  const ownImages=saved.v06Relics?.[character]||[];
  const scaling=[scale.hp?'PV':null,scale.atk?'ATQ':null,scale.def?'DEF':null,scale.break?'Efeito de Quebra':null,scale.debuff?'Acerto de Efeito':null].filter(Boolean);
  const rows=records.map((p,i)=>{
   const result=assessPiece(p,scale),set=game.relicSets?.[p.setId],name=set?.name||p.setName||'Conjunto pendente';
   const sub=result.subs.map(s=>'<li>'+esc(s.stat)+' · '+esc(engine.pretty(s.stat,s.value))+'</li>').join('');
   const img=ownImages[i]||'';
   return '<article class="nexus-relic-opt-row"><div class="nexus-relic-opt-title">'+
    (img?'<img src="'+esc(img)+'" alt="Recorte salvo da peça '+(i+1)+'" loading="lazy">':'<span aria-hidden="true">✦</span>')+
    '<div><small>0'+(i+1)+' · '+esc(SLOT[i])+' · '+(p.level==null?'NÍVEL NÃO INFORMADO':'+'+esc(p.level))+'</small>'+
     '<h3>'+esc(name)+'</h3><p>'+esc(p.main?.stat||'Principal pendente')+' · '+(p.main?.value==null?'—':esc(engine.pretty(p.main.stat,p.main.value)))+'</p></div></div>'+
    '<div class="nexus-relic-opt-signal">'+
      (result.reasons.length?'<strong>Alinhamentos encontrados</strong><ul>'+result.reasons.map(why=>'<li>'+esc(why)+'</li>').join('')+'</ul>':
       '<p>Sem alinhamento de escalamento confirmado nesta peça. Isso não significa que ela seja ruim.</p>')+
      (result.missing.length?'<p class="nexus-relic-opt-warning">Para completar: '+esc(result.missing.join(', '))+'</p>':'<p class="nexus-relic-opt-complete">Dados da peça completos.</p>')+
      '<details><summary>Ver subatributos registrados</summary><ul>'+(sub||'<li>Nenhum subatributo registrado</li>')+'</ul></details></div>'+
      '<button type="button" data-relic-opt-edit="'+i+'">Corrigir esta peça</button></article>';
  }).join('');
  root.innerHTML='<div class="nexus-relic-opt-overview"><strong>'+esc(c.name)+'</strong><span>Escalamentos textuais identificados: '+esc(scaling.join(' · ')||'não determinados com segurança')+'</span>'+
   '<p>O reconhecimento de escalamento é heurístico e pode omitir interações condicionais de rastros/Eidolons. VEL, crítico e bônus de conjunto precisam de análise de equipe, não de uma pontuação universal.</p></div>'+
   '<div class="nexus-relic-opt-list">'+rows+'</div>';
 }catch(error){root.textContent='Não foi possível analisar as relíquias: '+String(error.message||error);}
}
async function open(id){
 character=String(id||'');
 const dlg=dialog();if(!dlg.open)dlg.showModal();
 await render();
}
function mount(){
 if(mount.done)return;mount.done=true;
 document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-nexus-relic-optimizer]');
  if(btn)open(btn.dataset.nexusRelicOptimizer);
 });
}
window.NexusRelicOptimizer={open,mount,analyseKit,assessPiece};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();