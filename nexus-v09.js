/* ANDERUS 0.9: Endgame intelligence, Theme Studio variants and UI guidance. */
(function(){
'use strict';
if(window.NexusV09)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const PREF='anderus-aeon-aha-visual-mode';
const OFFICIAL='https://hsr.hoyoverse.com/pt-pt/news/166468';
const AA_GUIDE='https://hsrtierlist.net/anomaly-arbitration/4-6';
const SOURCE_PF='https://allthings.how/honkai-star-rail-4-6-pure-fiction-best-teams-for-imagined-words/';
const SOURCE_SA='https://allthings.how/honkai-star-rail-4-6-apocalyptic-shadow-best-teams-for-dominance-of-oblivion/';
const IMG={
 hoolay:'https://static.beebom.com/wp-content/uploads/2024/09/Borisin-Warhead-Hoolay-Boss-Fight-Guide-HSR.jpg?quality=75&w=1250',
 yabuli:'https://www.gacha.gg/img/honkai-star-rail/dm/monster/mostericon-monster_5034010.webp',
 kafka:'https://upload-os-bbs.hoyolab.com/upload/2024/03/24/357278821/e141cf2781ac8a05bfd1e3beb63bf0de_759272262841531299.jpg',
 judge:'https://upload-os-bbs.hoyolab.com/upload/2025/09/25/52505ac786fd0a1bd73d93ec8c7f139e_6849739519401370956.jpg',
 pomp:'https://static.allthings.how/content/images/2026/03/image-2494-1.png',
 pollux:'https://upload-os-bbs.hoyolab.com/upload/2025/04/10/920418141cb6f35f70ca9a237e3e4594_1561981020813865952.jpg',
 swarm:'https://upload-os-bbs.hoyolab.com/upload/2025/12/18/4377e65d32ba3964e401f007ec5f52ae_2641200412638594850.jpg',
 flame:'https://static.beebom.com/wp-content/uploads/2025/02/Flame-Reaver-of-the-deepest-dark-enhanced-attack-HSR-boss-guide.jpg?quality=75&w=1250',
 argenti:'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/image/character_portrait/1302.png'
};
const modes={
 moc:{
 label:'Memória do Caos',period:'02 NOV – 14 DEZ · 4.6',banner:'Sobrevivência dos Mais Aptos',
 intro:'Elimine elites e chefes consumindo o menor número de ciclos. Cada metade tem uma equipe própria; no Modo Estelar há um confronto adicional.',
 highlights:[['Ciclos','O relógio avança por ciclos; priorize ações decisivas antes da virada.'],['Turbulência 4.6','Cada Perícia Suprema concede 5 Piadas. No início do ciclo, Aha recebe uma ação extra considerando 20 Piadas, sem consumi-las.'],['Planejamento','Use cobertura de fraqueza, controle da energia e DPS adequado para cada metade. Não há estimativa de 0 ciclos sem rotação real.']],
 arenas:[
 {name:'Hoolay · Muhtar dos Borisins',label:'Andar 12 · Lado 1',img:'hoolay',weak:['Physical','Fire','Wind'],detail:'Fúria Lunar, velocidade elevada e invocações: segure a sobrevivência da equipe durante a sequência de ações e priorize janelas de dano.',teams:['follow','elation','himeko']},
 {name:'Yabuli · Sangue do Deus Caído',label:'Andar 12 · Lado 2',img:'yabuli',weak:['Ice','Quantum','Imaginary'],detail:'Observe os alvos secundários, a barreira e as mudanças de fase; dano de Euforia pode ser especialmente útil quando a rotação favorece Piadas.',teams:['elation','memory','follow']},
 {name:'Juiz do Esquecimento',label:'Modo Estelar · Nó 3',img:'judge',weak:['Physical'],detail:'Serpente Alada e Enviado Espectral antecedem o Juiz do Esquecimento. Priorize o controle de suas invocações e mantenha um DPS Físico para a janela decisiva.',teams:['follow','himeko','break']}
 ],url:OFFICIAL
 },
 pf:{
 label:'Pura Ficção',period:'19 OUT – 30 NOV · 4.6',banner:'Palavras Imaginadas',
 intro:'Ondas de inimigos continuamente renovadas. A pontuação depende da quantidade derrotada e da eficiência em área; a meta é acumular pontos, não somente vencer o chefe.',
 highlights:[['Bravura','Acumule valor de Bravura; na janela de Bravura Crescente, limpe ondas rapidamente.'],['Buff 4.6','Cada penalidade aplicada acumula 1 Bravura extra, até 10 vezes por inimigo.'],['Cacofonia','Toccata beneficia Supremas/ATA extras; Cadência Eufórica favorece Euforia; Fugato favorece Dano Contínuo. Confira as opções da luta.']],
 arenas:[
 {name:'Ceifador das Chamas',label:'Etapa 4 · Nó 1',img:'flame',weak:['Ice','Imaginary'],detail:'Foque dano em área e controle do ritmo das ondas, evitando gastar todas as Supremas antes da próxima reposição.',teams:['memory','himeko','follow']},
 {name:'Mechatron: Rei Pom-Pom',label:'Etapa 4 · Nó 2',img:'pomp',weak:['Fire','Imaginary'],detail:'Distribua dano entre os alvos para maximizar eliminações por ação. Observe a sequência de ataques do chefe e os reforços.',teams:['himeko','break','follow']},
 {name:'Argenti',label:'Modo Estelar · Nó 3',img:'argenti',weak:['Physical','Ice'],detail:'Priorize dano em área e destruição eficiente das invocações para manter a pontuação. Retrato do personagem utilizado como identificação visual.',teams:['memory','himeko','follow']}
 ],url:SOURCE_PF
 },
 sa:{
 label:'Sombra Apocalíptica',period:'05 OUT – 16 NOV · 4.6',banner:'Dominação do Esquecimento',
 intro:'Confrontos com chefes e pontuação ligada à rapidez. Quebrar a barra de Tenacidade no momento correto abre a janela para causar dano elevado.',
 highlights:[['Salvaguarda Firme','Chefes protegidos recebem dano reduzido até a Quebra de Fraqueza.'],['Buff 4.6','A Quebra elimina efeitos de controle dos aliados, avança suas ações e concede a Aha uma ação com 10 Piadas fixas.'],['Dano potencializado','Inimigos recebem +25% de dano de Suprema e +15% de dano de Euforia nesta rotação. Escolha a bênção de cada nó.']],
 arenas:[
 {name:'Kafka · Soberana Espiritual',label:'Nó 1',img:'kafka',weak:['Imaginary','Fire','Wind','Physical'],detail:'Elimine os inimigos auxiliares para restaurar fraquezas de Kafka. Controle a sugestão psicológica e use limpeza ou quebra de Tenacidade.',teams:['elation','follow','himeko']},
 {name:'Juiz do Esquecimento',label:'Nó 2',img:'judge',weak:['Fire','Lightning','Imaginary','Physical'],detail:'Aparecem fragmentos/invocações; elimine-os em área para reduzir a Tenacidade do chefe. Escudos podem ajudar em interações específicas.',teams:['follow','himeko','break']},
 {name:'Hoolay',label:'Modo Estelar · Nó 3',img:'hoolay',weak:['Quantum','Physical','Fire','Wind'],detail:'Administre as sequências de ataques do chefe e concentre recursos na janela pós-quebra.',teams:['elation','follow','break']}
 ],url:SOURCE_SA
 },
 aa:{
 label:'Arbitragem de Anomalias',period:'VERSÃO 4.6 · RENOVA EM 4.7',banner:'Retorno às Origens',
 intro:'Três Cavaleiros com efeitos próprios e equipes sem personagens repetidos. Depois, desafie o Rei em Xeque; o modo de Aflição aumenta o risco.',
 highlights:[['Cavaleiros','Cada um exige um grupo de quatro personagens exclusivo; a seleção não se repete entre os três Cavaleiros.'],['Rei em Xeque','O Rei concentra penalidades e disponibiliza bônus de quadrante para lidar com as mecânicas.'],['Aflição','Versão agravada: perda de PV, dano contra escudos e proteção adicional do chefe. Evite copiar uma equipe sem conferir a regra.']],
 arenas:[
 {name:'Mechatron: Rei Pom-Pom',label:'Cavaleiro I',img:'pomp',weak:['Fire','Imaginary'],detail:'Hemovoria: cada aliado perde 500 PV no começo do turno, podendo morrer. Corrosão 3: o inimigo revive parcialmente até o PV máximo ser reduzido o suficiente.',teams:['elation','follow','himeko']},
 {name:'Pollux · Barqueiro das Almas',label:'Cavaleiro II',img:'pollux',weak:['Quantum'],detail:'Confinamento+ aplica 2 acúmulos que reduzem o dano dos aliados em 20% por acúmulo; cada Suprema remove um. As Supremas também aceleram temporariamente inimigos.',teams:['memory','elation']},
 {name:'Arauto da Morte · Pesadelo do Enxame',label:'Cavaleiro III',img:'swarm',weak:['Fire','Wind'],detail:'Confinamento de ataques: a cada seis ataques, o aliado pode ser Aprisionado e perder 30 de Energia. Escalone os golpes e use limpeza/mitigação.',teams:['himeko','break','follow']},
 {name:'Yabuli · Sangue do Deus Caído',label:'Rei em Xeque',img:'yabuli',weak:['Quantum','Imaginary'],detail:'Hemovoria: perda de 500 PV por turno. Perfuração: inimigos causam +200% de dano contra aliados escudados; evite escudo automático. Barreiras devem ser removidas com dano de Euforia ou cargas dos germes.',teams:['elation','follow','memory']},
 {name:'Yabuli · Aflição',label:'Rei em Xeque · Aflição',img:'yabuli',weak:['Quantum','Imaginary'],detail:'Hemovoria+ provoca 1000 PV de perda por turno; Perfuração+ aumenta em 400% o dano a alvos com escudo; cada ataque ao inimigo gera escudo de 1% do PV Máximo. Exige boa sobrevivência e rotação.',teams:['elation','follow','memory']}
 ],url:AA_GUIDE
 }
};
// Verified editorial team archetypes. Only truly saved characters are treated as owned.
const teams=[
 {id:'elation',name:'Euforia — Loba 999',roles:['loba prateada.*999|silver wolf.*999','sparxie','yao guang','pearl'],note:'Euforia consistente, Piadas e suporte de equipe.'},
 {id:'elation2',name:'Euforia — Evanescia',roles:['evanescia|vanessa','yao guang','desbravador da euforia|elation trailblazer|caelus.*euforia','pearl'],note:'Frequência de ações de Euforia; mantenha o Emissário certo.'},
 {id:'follow',name:'Ataque Extra',roles:['mortenax blade|mortnax blade','ashveil','aventurino.*veraneio|aventurine.*waveflair','hyacine|riacine'],note:'Ações extras e pressão contra alvos prioritários.'},
 {id:'memory',name:'Reminiscência',roles:['evernight|noite eterna','cyrene|sirene','hyacine|riacine','robin.*summeretto|robin.*veraneio|castorice'],note:'Invocações, dano quântico e manutenção de efeitos.'},
 {id:'himeko',name:'Himeko Nova',roles:['himeko.*nova','sparkle','dan heng.*perman|dan heng.*terrae','tribbie|robin'],note:'Dano em área e gestão de recursos.'},
 {id:'break',name:'Superquebra',roles:['vaga lume|firefly','dalia|dahlia','fugue|ruan mei','lingsha|gallagher'],note:'Quebra de Tenacidade e dano após a quebra.'}
];
function roster(){
 let chars={};try{chars=state.characters||{};}catch(_){}
 const items=[];
 for(const [id,data] of Object.entries(chars)){
  if(!data)continue;let name=id,element='';
  try{name=lookup(id)?.name||gameData.chars?.[id]?.name||id;element=gameData.chars?.[id]?.element||'';}catch(_){}
  items.push({id,name,flat:plain(name),element,level:Number(data.level||0),e:Number(data.e||0),s:Number(data.s||1)});
 }
 return items;
}
function resolveTeam(t,owned){
 const selected=[],missing=[];
 for(const role of t.roles){
  const rx=new RegExp(role,'i');
  const found=owned.find(x=>!selected.includes(x.id)&&rx.test(x.flat));
  if(found)selected.push(found.id);else missing.push(role.split('|')[0]);
 }
 return {id:t.id,name:t.name,selected,missing,count:selected.length,note:t.note,members:selected.map(id=>owned.find(c=>c.id===id))};
}
function rankFor(arena,owned,used=new Set()){
 return teams.map(t=>resolveTeam(t,owned)).map(t=>{
  const overlap=t.selected.filter(id=>used.has(id));
  const effective=t.selected.filter(id=>!used.has(id));
  const coverage=arena.weak.length?effective.filter(id=>arena.weak.includes(owned.find(x=>x.id===id)?.element)).length:0;
  const preference=arena.teams.indexOf(t.id);
  return {...t,overlap,effective,coverage,score:effective.length*10+coverage*2+(preference<0?-8:(3-preference)*2)};
 }).sort((a,b)=>b.score-a.score);
}
function portrait(ch){try{return imgSrc(ch.id,'icon')||imgSrc(ch.id,'preview')||'';}catch(_){return '';}}
function composition(arena,owned,used){
 if(!owned.length)return '<div class="v09-team-empty">Nenhum personagem cadastrado. <button type="button" onclick="v06StartImport()">Importar print ↗</button></div>';
 const ranked=rankFor(arena,owned,used),best=ranked[0];
 if(!best)return '<p>Sem dados suficientes para avaliar a conta.</p>';
 const ready=best.effective.length===4&&best.overlap.length===0;
 const memberHtml=best.effective.map(id=>{
   const c=owned.find(x=>x.id===id),pic=portrait(c);
   return '<span class="v09-member">'+(pic?'<img src="'+esc(pic)+'" loading="lazy" alt="">':'<i>✦</i>')+
      '<span>'+esc(c.name)+'<small>Nv. '+c.level+' · E'+c.e+'S'+c.s+'</small></span></span>';
 }).join('');
 const rest=best.missing.map(name=>'<span class="v09-missing">'+esc(name)+' · não cadastrado</span>').join('')+
  best.overlap.map(id=>'<span class="v09-missing">'+esc(owned.find(x=>x.id===id)?.name)+' · já alocado</span>').join('');
 for(const id of best.effective)used.add(id);
 return '<div class="v09-team">'+
   '<div class="v09-team-head"><b>'+esc(best.name)+'</b><span class="'+(ready?'v09-complete':'')+'">'+
      (ready?'4/4 da conta':best.effective.length+'/4 da conta — sugestão parcial')+'</span></div>'+
   '<div class="v09-team-members">'+memberHtml+rest+'</div>'+
   '<p>'+esc(best.note)+' '+(best.coverage?'Cobertura de fraqueza por '+best.coverage+' personagem(ns).':'Confira a cobertura de fraqueza.')+'</p></div>';
}
function modeKey(){
 try{return typeof mode!=='undefined' && modes[mode]?mode:'moc';}catch(_){return 'moc';}
}
function renderEndgame(){
 const root=document.querySelector('.v06-endgame-lead');if(!root||root.parentElement?.querySelector('.v09-endgame'))return;
 const key=modeKey(),data=modes[key],owned=roster(),used=new Set(),restrained=key==='aa',cards=[];
 for(let i=0;i<data.arenas.length;i++){
  const b=data.arenas[i],localUsed=restrained&&i<3?used:new Set();
  const profile=composition(b,owned,localUsed);
  const source=b.img?IMG[b.img]:null;
  const art=source?'<img loading="lazy" decoding="async" src="'+esc(source)+'" alt="Arte de referência: '+esc(b.name)+'" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="v09-boss-placeholder" hidden aria-label="Imagem indisponível">✦</div>':
       '<div class="v09-boss-placeholder" aria-label="Chefe ainda não verificado">?</div>';
  cards.push('<article class="v09-boss"><div class="v09-boss-image">'+art+'<small>'+esc(b.label)+'</small></div>'+
   '<div class="v09-boss-info"><h4>'+esc(b.name)+'</h4>'+
   '<p class="v09-weak">Fraquezas: '+(b.weak.length?b.weak.map(esc).join(' · '):'confira no jogo')+'</p>'+
   '<p>'+esc(b.detail)+'</p><details class="v09-team-reveal" '+(i===0?'open':'')+'><summary>Composição baseada na minha conta</summary>'+profile+'</details>'+
   '<button type="button" class="v09-boss-ask" data-nexus-boss-mode="'+esc(key)+'" data-nexus-boss-index="'+i+'">Pom-Pom · Como enfrentar este chefe?</button></div></article>');
 }
 const html='<section class="v09-endgame" aria-label="Guia de mecânicas e equipes">'+
  '<header class="v09-guide-title"><span>STRATEGY DOSSIER · '+esc(data.period)+'</span><h2>'+esc(data.label)+'</h2>'+
  '<h3>'+esc(data.banner)+'</h3><p>'+esc(data.intro)+'</p></header>'+
  '<div class="v09-mechanics">'+data.highlights.map((t,i)=>
   '<article><span>0'+(i+1)+'</span><h4>'+esc(t[0])+'</h4><p>'+esc(t[1])+'</p></article>').join('')+'</div>'+
  '<div class="v09-guide-title v09-small"><span>ENCONTROS VERIFICADOS · '+data.arenas.length+' ETAPAS</span><h3>Chefes e mecânicas</h3>'+
    '<p>As sugestões usam exclusivamente o inventário salvo neste navegador. Times parciais não são tratados como equipes completas. No Modo Estelar, confira as mecânicas do terceiro chefe no jogo.</p></div>'+
  '<div class="v09-bosses">'+cards.join('')+'</div>'+
  '<div class="v09-source">Fontes · <a target="_blank" rel="noopener noreferrer" href="'+esc(data.url)+'">Referência da rotação ↗</a> · '+
  '<a target="_blank" rel="noopener noreferrer" href="'+OFFICIAL+'">Mecânicas oficiais da 4.6 ↗</a>'+
  '<p>Recomendações editoriais por sinergia/cobertura; não representam cálculo de dano, velocidade, probabilidade de vitória ou tempo previsto. Imagens provenientes do jogo/HoYoLAB e guias com atribuição; direitos pertencem à HoYoverse.</p></div></section>';
 root.insertAdjacentHTML('afterend',html);
}
function bossContext(key,index){
 const chosen=modes[key]?.arenas?.[Number(index)];
 if(!chosen)return null;
 const owned=roster(),best=owned.length?rankFor(chosen,owned,new Set())[0]:null;
 const real=best?.effective||[];
 const confirmed=real.length===4&&!(best.overlap||[]).length;
 return {
  mode:key,modeName:modes[key].label,phase:chosen.label,
  name:chosen.name,weaknesses:chosen.weak||[],
  mechanics:chosen.detail,modifiers:(modes[key].highlights||[]).map(x=>x[0]+': '+x[1]),
  team:best?{name:best.name,ready:confirmed,
   members:real.map(id=>owned.find(x=>x.id===id)?.name).filter(Boolean),
   missing:best.missing||[],overlap:best.overlap||[],note:best.note,
   coverage:best.coverage||0}:null,
  source:modes[key].url,
  provenance:'Estratégia editorial; confira a rotação e os modificadores reais no jogo.'
 };
}
function visualMode(){try{return localStorage.getItem(PREF)==='original'?'original':'chat';}catch(_){return 'chat';}}
window.v09SetVisualMode=function(value){
 if(value!=='original'&&value!=='chat')return;
 try{localStorage.setItem(PREF,value);}catch(_){}
 document.querySelector('.v09-variants')?.remove();
 window.nexusEnhance?.();
 window.NexusV09?.enhance?.();
};
function renderVariants(){
 const studio=document.querySelector('.v06-themes'),onAha=typeof state!=='undefined'&&state.theme==='future-aha';
 if(!studio||!onAha||studio.querySelector('.v09-variants'))return;
 const selected=visualMode();
 const html='<section class="v09-variants" aria-label="Escolha a versão visual do tema">'+
  '<span class="v09-eyebrow">THEME STUDIO · DUAS VERSÕES SALVAS</span><h2>Escolha sua direção de arte</h2>'+
  '<p>As duas versões usam Aeon ★ Aha. A troca afeta apenas a aparência: sua conta, relíquias e progresso permanecem salvos.</p>'+
  '<div class="v09-variant-options" role="group" aria-label="Variantes visuais de Aha">'+
   '<button type="button" class="'+(selected==='original'?'selected':'')+'" aria-pressed="'+(selected==='original')+'" onclick="v09SetVisualMode(\'original\')"><span class="v09-variant-art original">✧</span><strong>Original do Nexus</strong><small>Identidade carnaval da versão base, sem a transformação editorial.</small></button>'+
   '<button type="button" class="'+(selected==='chat'?'selected':'')+'" aria-pressed="'+(selected==='chat')+'" onclick="v09SetVisualMode(\'chat\')"><span class="v09-variant-art custom"><img src="./assets/official/aha-4-7.webp" loading="lazy" alt=""></span><strong>Grand Theatre · ChatGPT</strong><small>Palco cinematográfico e telas estilizadas em toda a plataforma.</small></button>'+
  '</div><span class="v09-variant-hint">Versão ativa: '+(selected==='chat'?'Grand Theatre · ChatGPT':'Original do Nexus')+'</span></section>';
 const stage=studio.querySelector('.v06-theme-stage');
 if(stage)stage.insertAdjacentHTML('afterend',html);else studio.insertAdjacentHTML('afterbegin',html);
}
function renderOcrTip(){
 const form=document.querySelector('.v06-import-form');
 if(!form||form.querySelector('.v09-import-info'))return;
 const status=form.querySelector('#v06-import-status');
 const el=document.createElement('div');el.className='v09-import-info';
 el.innerHTML='<strong>Leitura de relíquias · OCR local</strong><p>Depois de reconhecer, abra cada peça. A ferramenta tenta preencher atributo principal, quatro subatributos e valores. Campos não confiáveis permanecem vazios ou sinalizados. Confirme tudo no print antes de salvar.</p>';
 if(status)status.insertAdjacentElement('afterend',el);
}
function enhanceEditorial(){
 if(!document.querySelector('.app')?.classList.contains('aha-theatre'))return;
 const owned=roster();
 function add(container,className,html,position='afterbegin'){
  if(!container||container.querySelector('.'+className))return;
  container.insertAdjacentHTML(position,'<section class="'+className+' v09-intel">'+html+'</section>');
 }
 const lib=document.querySelector('.v06-lib');
 add(lib,'v09-intel-library',
  '<span class="v09-eyebrow">ARQUIVO PESSOAL · '+owned.length+' PERSONAGENS</span>'+
  '<h3>Seu elenco entra em cena</h3><p>O catálogo não é sua conta. Apenas personagens importados ou adicionados entram nos cálculos e nas equipes.</p>'+
  '<button type="button" onclick="v06StartImport()">✦ Importar uma build pelo print</button>');
 const profile=document.querySelector('.v06-profile');
 if(profile){
  let id='',data={},records=[];try{id=state.profile;data=state.characters?.[id]||{};records=state.v06RelicDetails?.[id]||[];}catch(_){}
  const valid=records.filter(x=>x?.setId&&x.main?.stat&&x.main?.value!==null).length;
  const named=id?(()=>{try{return lookup(id)?.name||id}catch(_){return id}})():'Personagem selecionado';
  const note=(data.level?'Nv. '+Number(data.level||0)+' · E'+Number(data.e||0)+'S'+Number(data.s||1):'Sem build cadastrada');
  const metrics=[['PV',data.pv],['ATQ',data.atk],['VEL',data.spd],['CRIT',data.crit],['D.CRIT',data.cdmg]].filter(x=>Number.isFinite(Number(x[1]))&&x[1]!==undefined&&x[1]!==null);
  add(profile,'v09-intel-profile',
    '<span class="v09-eyebrow">RELATÓRIO DA BUILD · '+esc(note)+'</span><h3>'+esc(named)+'</h3>'+
    '<div class="v09-intel-metrics">'+metrics.map(([k,v])=>'<span><b>'+esc(k)+'</b><strong>'+esc(v)+'</strong></span>').join('')+
    '<span><b>RELÍQUIAS PRINCIPAIS</b><strong>'+valid+'/6</strong></span></div>'+
    '<p>Leituras incompletas não contam como equipamento confirmado. Revise atributos e subatributos antes de comparar builds.</p>'+
    '<button type="button" onclick="v06StartImport(\''+esc(id).replace(/'/g,'')+'\')">↗ Atualizar pelo print</button>');
 }
 const farmPage=document.querySelector('.v06-farm,.farm-planner,.farm-page');
 let route='';try{route=page;}catch(_){}
 if(route==='farm'){
  const stage=document.getElementById('stage');
  let items=[],need=0,have=0;
  try{items=Object.values(state.farm||{});for(const x of items){const n=Math.max(0,Number(x.need)||0);need+=n;have+=Math.min(n,Number(x.have)||0);}}catch(_){}
  add(stage,'v09-intel-farm',
   '<span class="v09-eyebrow">FARM PLANNER · ESTOQUE LOCAL</span><h3>Da intenção ao inventário</h3>'+
   '<div class="v09-intel-metrics"><span><b>NECESSIDADE REGISTRADA</b><strong>'+need.toLocaleString('pt-BR')+'</strong></span>'+
   '<span><b>EM ESTOQUE</b><strong>'+have.toLocaleString('pt-BR')+'</strong></span>'+
   '<span><b>COBERTURA</b><strong>'+(need?Math.round(100*have/need)+'%':'—')+'</strong></span></div>'+
   '<p>O progresso usa apenas as quantidades salvas no Farm. Revise fusões 3:1 e não confunda materiais gerais com rastros específicos.</p>');
 }
 const radar=document.querySelector('.v06-radarhead');
 add(radar,'v09-intel-radar','<span class="v09-eyebrow">OFICIAL VS. BETA</span><h3>O que já está confirmado?</h3>'+
  '<p>A versão 4.7 estreia em 11/11/2026 com Aeon ★ Aha. As mecânicas e números do dossiê beta são pré-lançamento, não valores finais.</p>'+
  '<button type="button" onclick="v07OpenFuture()">✦ Abrir habilidades e Eidolons</button>'+
  '<a href="https://www.gamespress.com/pt/Honkai-Star-Rail-Version-47-Now-Lay-Laughter-to-All-St-wwwhoyoversecom" target="_blank" rel="noopener noreferrer">Comunicado HoYoverse ↗</a>');
 const diary=document.querySelector('.v06-diary');
 add(diary,'v09-intel-diary',
  '<span class="v09-eyebrow">POM-POM · CONTEXTO DA SUA CONTA</span><h3>'+owned.length+' registros a bordo</h3>'+
  '<p>As dicas sobre personagens usam exclusivamente seu elenco cadastrado. Os guias gerais de mecânica ficam separados da avaliação da sua build.</p>');
}

let verifiedEndgame=null,endgameLoad=null;
function renderVerifiedEndgame(){
 const root=document.querySelector('.v09-endgame');
 if(!root||root.querySelector('.v20-official-rotation'))return;
 if(!verifiedEndgame){
  if(!endgameLoad)endgameLoad=fetch('./data/endgame-verified.json',{cache:'no-store'})
   .then(r=>{if(!r.ok)throw Error('Rotação não disponível');return r.json()})
   .then(data=>{verifiedEndgame=data;endgameLoad=null;renderVerifiedEndgame()})
   .catch(e=>{endgameLoad=null;console.warn('Rotação oficial',e)});
  return;
 }
 let key='moc';try{key=modeKey()}catch(_){}
 const period=verifiedEndgame.rotations?.find(x=>x.id===key);if(!period)return;
 const date=verifiedEndgame.verifiedAt;
 const today=new Date().toISOString().slice(0,10);
 const expired=period.end&&today>period.end;
 const badge=expired?'REVISÃO NECESSÁRIA':period.verification==='confirmed'?'ROTAÇÃO OFICIAL CONFIRMADA':'REGRAS A VERIFICAR';
 const panel=document.createElement('section');panel.className='v20-official-rotation';
 panel.innerHTML='<div class="v20-rotation-head"><span>'+esc(badge)+' · '+esc(verifiedEndgame.version)+'</span><small>Referência '+esc(date)+'</small></div>'+
  '<h3>'+esc(period.name)+' · '+esc(period.phase)+'</h3>'+
  '<p>Vigência informada: '+esc(period.start)+' a '+esc(period.end)+' (horário do servidor).'+(expired?' Este registro expirou; confirme a rotação vigente no jogo.':'')+'</p>'+
  (period.effects?.length?'<ul>'+period.effects.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':
   '<p>'+esc(period.note||'Bônus específicos ainda não validados no snapshot; confira as mecânicas de cada chefe no jogo.')+'</p>')+
  '<a href="'+esc(period.sourceUrl||verifiedEndgame.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+(period.verification==='confirmed'?'Comunicado oficial da HoYoverse':'Referência editorial; não é confirmação oficial')+'</a>';
 root.prepend(panel);
}
function enhance(){
 if(!document.querySelector('.app')?.classList.contains('aha-theatre')){
  document.querySelectorAll('.v09-intel').forEach(node=>node.remove());
 }
 renderVariants();renderEndgame();renderVerifiedEndgame();renderOcrTip();enhanceEditorial();
}
window.NexusV09={enhance:enhance,visualMode:visualMode,bossContext:bossContext,version:'0.9'};
enhance();
})();