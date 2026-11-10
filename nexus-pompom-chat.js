/* ANDERUS NEXUS 2.0 — Pom-Pom local, contextual and source-backed.
 * No personal account data leaves this browser; no fictional DPS simulation.
 */
(function(){
'use strict';
if(window.NexusPomPom)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const turns=[];
const quick=[
 ['Como posso melhorar esta build?','Como melhorar a build do personagem selecionado?'],
 ['Minhas relíquias estão completas?','Quais relíquias do personagem selecionado estão pendentes?'],
 ['Qual cone está equipado?','Qual cone o personagem selecionado utiliza?'],
 ['Quem precisa de atenção primeiro?','Quem precisa de atenção primeiro na minha conta?'],
 ['Quais equipes eu tenho?','Quais equipes já estão salvas na minha conta?'],
 ['Como estão meus recursos?','Quanto falta farmar para minhas metas?']
];
let gamePromise=null,enginePromise=null,selected='';
const read=()=>{try{return JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}')}catch(_){return {}}};
function context(){
 const account=read(),chars=account.characters||{};
 return {account,owned:Object.keys(chars),build:chars[selected]||null};
}
function load(){
 if(!gamePromise)gamePromise=fetch('./data/live-game.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw Error('Catálogo PT-BR indisponível.');return r.json()})
  .catch(e=>{gamePromise=null;throw e;});
 if(!enginePromise)enginePromise=import('./nexus-account-engine.js').catch(e=>{enginePromise=null;throw e;});
 return Promise.all([gamePromise,enginePromise]);
}
function name(id,g){return g.chars?.[id]?.name||'Personagem '+id;}
function coachFor(id,a,g,engine){
 const character=g.chars?.[id],build=a.characters?.[id];
 if(!character||!build)return null;
 const records=engine.normalizeRelics(a.v06RelicDetails?.[id],build.relics,g.relicSets||{});
 const review=engine.examineRelics(records);
 const cone=engine.matchCone(build.cone,g.cones||{});
 const notes=engine.buildCoach({character,build,records,sets:g.relicSets||{},cone,
  coneRank:cone?g.coneRanks?.[cone.id]:null,
  skills:(character.skills||[]).map(s=>g.skills?.[s]).filter(Boolean)});
 return {character,build,review,cone,notes};
}
function answer(question,characterId,account,g,engine){
 const q=norm(question),owned=Object.keys(account.characters||{}).filter(id=>g.chars?.[id]),
   current=coachFor(characterId,account,g,engine);
 const reply=(title,body,points=[],actions=[],source='Dados locais do Nexus + catálogo PT-BR')=>
  ({title,body,points,actions,source});
 if(/\bdps\b|dano exato|\bciclos?\b|\b0[ -]?ciclo\b|pontuacao exata|simulacao exata/.test(q)){
  return reply('Simulação não validada',
   'Não consigo sustentar um número exato de DPS, turnos ou ciclos com os dados atuais. Um resultado confiável exige velocidade e ordem de ações, inimigos, resistências, buffs, rotação e kit completo.',
   ['Posso orientar sua build, verificar peças faltantes e mostrar as regras de Endgame registradas.',
    'Não vou inventar ciclos, pontuações ou dano numérico como se fossem medições reais.'],
   [{label:'Revisar build',action:'profile'},{label:'Abrir Endgame',action:'endgame'}],
   'Limites do motor analítico local — sem simulação de combate validada');
 }
 if(/pity|tiro|jade|salto|banner|garant|eidolon.*quanto/.test(q)){
  const plan=account.v06WarpPlan||{},passes=Number(plan.passes||0)+Number(plan.futurePasses||0),
   jades=Number(plan.jades||0)+Number(plan.futureJades||0);
  const total=passes+Math.floor(jades/160);
  return reply('Plano de saltos', 'Seu planejamento registrado soma '+total+' tiros, entre passes e jades informados. Os contadores de personagem e cone são independentes.',
   ['Pity personagem: '+(plan.charPity??'não informado')+' · garantia: '+(plan.charGuaranteed?'sim':'não confirmada'),
    'Pity cone: '+(plan.conePity??'não informado')+' · garantia: '+(plan.coneGuaranteed?'sim':'não confirmada'),
    'O pior cenário depende de quantas cópias você pretende obter. O modelo não inventa taxas de soft pity.'],
   [{label:'Abrir Warp Advisor',action:'warp'}],'Plano manual de banners salvo no navegador');
 }
 if(/farm|materia(?:l|is)|rastro|credito|recurso|cultiv|calice/.test(q)){
  const plans=window.NexusFarmBridge?.allPlans?.()||{},invent=window.NexusFarmBridge?.inventory?.()||{};
  const number=Object.keys(plans.ascension||{}).length+Object.keys(plans.traces||{}).length;
  return reply('Recursos da sua conta',
   'Há '+number+' planejamento(s) de ascensão ou rastros salvos e '+Object.keys(invent).length+' tipos de materiais com estoque informado.',
   ['O orçamento global soma todas as metas e desconta cada material em estoque somente uma vez.',
    'Para calcular runs faltantes, seria necessário confirmar a taxa média de drops; não vou estimá-la sem uma fonte verificável.'],
   [{label:'Abrir orçamento global',action:'materials'}],'Estoque e planejamentos registrados na conta local');
 }
 if(/time|equipe|composi|sinergia|endgame/.test(q)){
  const teams=account.v06SavedTeams||[];
  return reply('Suas equipes',
   teams.length?'Você possui '+teams.length+' equipe(s) registradas.':'Ainda não encontrei equipes salvas no Team Lab deste navegador.',
   teams.slice(0,5).map(t=>t.name+' · '+(t.members||[]).map(id=>name(id,g)).join(' / '))
    .concat(['Uma composição não é considerada ótima sem confrontar os kits, a build e as regras do desafio.']),
   [{label:'Abrir Team Lab',action:'teams'}],'Elenco e equipes locais, não um simulador de combate');
 }
 if(/quem|prioridade|primeiro|melhorar.*conta|minha conta|personagens/.test(q)&&!/rel[ií]quia|cone|kit/.test(q)){
  if(!owned.length)return reply('Seu elenco está vazio','Não há personagens registrados neste navegador. Para analisar sua conta, primeiro cadastre ou importe sua primeira personagem.',
   [],[{label:'Abrir Minha Conta',action:'account'}]);
  const ranking=owned.map(id=>{const c=coachFor(id,account,g,engine);return c?{id,c,missing:6-c.review.registered,flags:c.review.flags.length}:null})
   .filter(Boolean).sort((a,b)=>b.missing-a.missing||b.flags-a.flags).slice(0,5);
  return reply('Primeiras revisões da conta',
   'Encontrei '+owned.length+' personagens cadastrados. Esta ordem destaca registros incompletos, não um ranking de poder.',
   ranking.map((r,i)=>(i+1)+'. '+r.c.character.name+' — '+r.c.review.registered+'/6 relíquias cadastradas; '+r.flags+' ponto(s) pendente(s).'),
   [{label:'Abrir Minha Conta',action:'account'}],'Integridade dos registros locais; não é tier list');
 }
 if(!current){
  return reply('Escolha uma personagem cadastrada','Para comentar uma build individual, selecione uma personagem que já esteja registrada neste navegador.',
   owned.length?['Você tem '+owned.length+' personagem(ns) registrado(s).']:['Nenhum personagem cadastrado neste navegador.'],
   [{label:'Abrir Minha Conta',action:'account'}]);
 }
 const c=current;
 if(/cone|arma|sobreposi/.test(q)){
  return reply('Cone da '+c.character.name,
    c.cone?'Encontrei o cone '+c.cone.name+' no catálogo. Ele está registrado como S'+(c.build.s||1)+'.':
     'O cone salvo não pôde ser confirmado pelo nome no catálogo. Não vou atribuir uma passiva a um cone não identificado.',
    c.notes.filter(n=>/cone/i.test(n.title)).map(n=>n.body),
    [{label:'Abrir ficha',action:'profile'}],'Cone salvo + catálogo PT-BR');
 }
 if(/eidolon|e[0-6]|habilidad|suprema|talento|kit|pericia/.test(q)){
  return reply('Kit da '+c.character.name,
   'Sua ficha registra E'+(c.build.e??0)+'. O Kit Lab contém as descrições por nível e os seis Eidolons quando disponíveis no catálogo.',
   ['O efeito completo depende dos níveis, condições e interações especificados em cada habilidade.',
    'Não tenho uma simulação de rotação ou cálculo de DPS validado para afirmar o melhor combo.'],
   [{label:'Abrir Kit Lab completo',action:'kit'}],'Descrição estruturada das habilidades e Eidolons');
 }
 if(/reliquia|equipament|atribut|velocid|crit|def|pv|atk|build|melhorar|fraco/.test(q)){
  const note=c.notes.filter(n=>['action','warning'].includes(n.kind)).slice(0,4);
  const fallback=c.notes.filter(n=>n.kind==='good').slice(0,2);
  return reply('Análise de '+c.character.name,
   'A build está registrada como E'+(c.build.e??0)+'S'+(c.build.s||1)+
   ', com '+c.review.registered+'/6 peças identificadas e '+c.review.complete+'/6 com atributos completos.',
   (note.length?note:fallback).map(n=>n.title+': '+n.body),
   [{label:'Abrir Relic Optimizer',action:'relic'},{label:'Ver ficha completa',action:'profile'}],
   'Atributos, relíquias e cone da conta + verificações determinísticas');
 }
 return reply('O que consigo verificar',
  'Posso analisar suas relíquias, cones, Eidolons, equipamentos, equipes, farm e recursos que estejam registrados no Nexus.',
  ['Sua pergunta exige uma análise que não consigo sustentar com os dados disponíveis. Prefiro não inventar uma resposta.',
   'Experimente perguntar sobre a build escolhida ou abrir um dos módulos especializados.'],
  [{label:'Abrir Kit Lab',action:'kit'},{label:'Minha Conta',action:'account'}]);
}
function dialog(){
 let dlg=document.getElementById('nexus-pompom-dialog');if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-pompom-dialog';dlg.setAttribute('aria-label','Converse com Pom-Pom');
 dlg.innerHTML='<section class="nexus-pompom-inner"><header><div class="nexus-pompom-avatar"><img src="./assets/official/pompom-hoyoverse.jpg" alt="Pom-Pom"></div><div><span>ASSISTENTE DO EXPRESSO</span><h2>Pom-Pom</h2><p>Leitura contextual, sem inventar sua build.</p></div><button type="button" data-pompom-close aria-label="Fechar">×</button></header>'+
  '<label class="nexus-pompom-select">Personagem da sua conta<select id="nexus-pompom-character"></select></label>'+
  '<div class="nexus-pompom-examples" role="group" aria-label="Perguntas sugeridas"></div>'+
  '<div id="nexus-pompom-dialogue" role="log" aria-live="polite" aria-label="Conversa com Pom-Pom"></div>'+
  '<form id="nexus-pompom-form"><label for="nexus-pompom-question">Sua pergunta</label><div><input id="nexus-pompom-question" type="text" maxlength="300" autocomplete="off" placeholder="O que devo melhorar nesta build?"><button type="submit">Perguntar</button></div></form>'+
  '<p class="nexus-pompom-disclaimer">Modo local: consultas feitas com regras e dados presentes neste navegador. Não é IA generativa em tempo real. Nenhuma pergunta ou dado da sua conta é enviado a terceiros.</p></section>';
 document.body.append(dlg);
 dlg.querySelector('[data-pompom-close]').onclick=()=>dlg.close();
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
 dlg.querySelector('#nexus-pompom-character').addEventListener('change',e=>{selected=e.target.value});
 dlg.querySelector('#nexus-pompom-form').addEventListener('submit',e=>{
  e.preventDefault();const input=dlg.querySelector('#nexus-pompom-question');const value=input.value.trim();
  if(value){input.value='';ask(value);}
 });
 dlg.querySelector('.nexus-pompom-examples').addEventListener('click',e=>{
  const button=e.target.closest('[data-pompom-prompt]');
  if(button)ask(quick[Number(button.dataset.pompomPrompt)]?.[1]||'');
 });
 dlg.querySelector('#nexus-pompom-dialogue').addEventListener('click',e=>{
  const action=e.target.closest('[data-pompom-action]');
  if(!action)return;
  const act=action.dataset.pompomAction;dlg.close();
  if(act==='kit')window.NexusKitLab?.open(selected);
  if(act==='relic')window.NexusRelicOptimizer?.open(selected);
  if(act==='materials')window.NexusMaterialBudget?.open();
  if(act==='teams')window.NexusTeamLab?.open();
  if(act==='warp')window.NexusWarpAdvisor?.open();
  if(act==='profile')window.openProfile?.(selected);
  if(act==='account')window.route?.('library');
  if(act==='endgame')window.route?.('endgame');
 });
 return dlg;
}
function renderTurns(){
 const dlg=dialog();dlg.querySelector('#nexus-pompom-dialogue').innerHTML=turns.map(turn=>{
  if(turn.type==='question')return '<div class="nexus-pompom-turn question"><span>VOCÊ</span><p>'+esc(turn.text)+'</p></div>';
  const a=turn.result;
  return '<article class="nexus-pompom-turn reply"><span>POM-POM · '+esc(a.source)+'</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.body)+'</p>'+
   (a.points.length?'<ul>'+a.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+
   '<div class="nexus-pompom-actions">'+a.actions.map(x=>'<button type="button" data-pompom-action="'+esc(x.action)+'">'+esc(x.label)+'</button>').join('')+'</div>'+
   (a.sourceUrl&&/^https:\/\//.test(a.sourceUrl)?'<a class="nexus-pompom-source" href="'+esc(a.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Consultar fonte da mecânica</a>':'')+'</article>';
 }).join('');
 const log=dlg.querySelector('#nexus-pompom-dialogue');log.scrollTop=log.scrollHeight;
}
async function ask(value){
 if(!value)return;
 turns.push({type:'question',text:value});
 if(turns.length>20)turns.splice(0,2);
 renderTurns();
 try{
  const [g,engine]=await load(),a=read();
  const response=answer(value,selected,a,g,engine);
  turns.push({type:'reply',result:response});
 }catch(error){
  turns.push({type:'reply',result:{title:'Catálogo temporariamente indisponível',
   body:'Não consegui validar os dados locais agora. Tente novamente quando o catálogo carregar.',
   points:[String(error.message||error)],actions:[],source:'Falha de leitura, sem resposta inventada'}});
 }
 renderTurns();
}
async function open(characterId){
 const dlg=dialog();if(!dlg.open)dlg.showModal();
 const select=dlg.querySelector('#nexus-pompom-character'),a=read();
 try{
  const [g]=await load();
  const ids=Object.keys(a.characters||{}).filter(id=>g.chars?.[id]);
  if(characterId&&ids.includes(String(characterId)))selected=String(characterId);
  if(!ids.includes(selected))selected=ids[0]||'';
  select.innerHTML='<option value="">Visão geral da conta</option>'+
   ids.map(id=>'<option value="'+esc(id)+'">'+esc(g.chars[id].name)+'</option>').join('');
  select.value=selected;
 }catch(error){
  select.innerHTML='<option value="">Catálogo indisponível</option>';selected='';
 }
 dlg.querySelector('.nexus-pompom-examples').innerHTML=quick.map(([label],i)=>
  '<button type="button" data-pompom-prompt="'+i+'">'+esc(label)+'</button>').join('');
 if(!turns.length)dlg.querySelector('#nexus-pompom-dialogue').innerHTML=
   '<p class="nexus-pompom-welcome">Passageiro! Selecione um personagem da sua conta e me conte o que quer analisar. Vou usar somente os dados realmente cadastrados — sem adivinhações.</p>';
 else renderTurns();
 dlg.querySelector('#nexus-pompom-question').focus();
}
async function openBoss(mode,index){
 const context=window.NexusV09?.bossContext?.(mode,index);
 if(!context)return;
 await open('');
 const squad=context.team;
 const teamStatus=!squad?'Nenhuma equipe disponível: cadastre seus personagens primeiro.':
  squad.ready?'Quatro personagens cadastrados na composição sugerida.':
  'Sugestão parcial: '+squad.members.length+'/4 personagens registrados; faltam '+squad.missing.join(', ')+'.';
 const memberNames=squad?.members?.length?'Equipe considerada: '+squad.members.join(' · ')+'.':'Nenhum integrante disponível.';
 const points=[
  'Mecânica registrada: '+context.mechanics,
  'Fraquezas registradas: '+(context.weaknesses.join(' · ')||'não confirmadas'),
  memberNames,teamStatus,
  ...context.modifiers.slice(0,3),
  ...(mode==='aa'?['Arbitragem: os três Cavaleiros exigem equipes sem repetição de integrantes. Analise os três em conjunto antes de alocar personagens.']:[])
 ];
 turns.push({type:'question',text:'Como enfrentar '+context.name+' em '+context.modeName+'?'});
 turns.push({type:'reply',result:{
  title:context.name+' · '+context.phase,
  body:'Passageiro, veja as mecânicas e a cobertura disponível na sua conta. Esta é uma orientação editorial, não uma simulação de vitória.',
  points,source:'Guia editorial do Endgame e personagens registrados',
  sourceUrl:context.source,
  actions:[{label:'Abrir Team Lab',action:'teams'},{label:'Voltar ao Endgame',action:'endgame'}]
 }});
 if(turns.length>20)turns.splice(0,2);
 renderTurns();
}
function mount(){
 if(mount.done)return;mount.done=true;
 document.addEventListener('click',e=>{
  const boss=e.target.closest('[data-nexus-boss-mode][data-nexus-boss-index]');
  if(boss){openBoss(boss.dataset.nexusBossMode,Number(boss.dataset.nexusBossIndex));return;}
  const action=e.target.closest('[data-nexus-pompom-open]');
  if(action)open(action.dataset.nexusPompomOpen||'');
 });
}
window.NexusPomPom={open,openBoss,ask,answer,mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();