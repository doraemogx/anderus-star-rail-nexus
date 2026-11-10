/* Anderus v0.7 — PWA, editorial Pom-Pom, immersive theme and beta dossiers. */
(function(){
'use strict';
const OFFICIAL_POMPOM='./assets/official/pompom-hoyoverse.jpg';
const AHA_ART='./assets/official/aha-4-7.webp';
const AHA_FALLBACK='./assets/official/aha-4-7-promo.jpg';
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let installPromptEvent=null;
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();installPromptEvent=event;
 const button=document.getElementById('v07-install-btn');if(button)button.textContent='Instalar aplicativo ↗';
});
window.v07Install=async function(){
 if(installPromptEvent){
   const prompt=installPromptEvent;installPromptEvent=null;
   prompt.prompt();
   try{await prompt.userChoice;}catch(_){}
   return;
 }
 const instructions='Para instalar o Nexus no Android, abra este endereço diretamente no Chrome (não na janela interna do ChatGPT), toque no menu ⋮ e selecione Instalar aplicativo ou Adicionar à tela inicial. Se a opção não aparecer, atualize a página.';
 if(typeof showModal==='function')showModal('Instalar o Nexus no celular','<div style="padding:20px;line-height:1.65">'+instructions+'</div>');
 else window.alert(instructions);
};
let betaCache;
const betaData=()=>betaCache||(betaCache=fetch('./data/beta-editorial.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo beta indisponível');return r.json();}));
function specialText(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n,changes=0;
 while((n=walker.nextNode())){
   const raw=n.nodeValue;
   if(!raw||!/Nexia|NEXIA|Assistente da Nexia|Diário do Pom-Pom/.test(raw))continue;
   const clean=raw.replace(/Nexia(?:\s*·\s*Assistente)?/gi,'Dicas do Pom-Pom').replace(/NEXIA/g,'POM-POM').replace(/Diário do Pom-Pom/g,'Dicas do Pom-Pom');
   if(raw!==clean){n.nodeValue=clean;changes++;}
 }
 return changes;
}

// Nexus 0.9 enhancements for endgame, screenshot review, and visual variants.
let v09Loading=false;
function enhanceNexusV09(){
 if(!document.getElementById('nexus-v09-css')){
  const link=document.createElement('link');link.id='nexus-v09-css';link.rel='stylesheet';link.href='./nexus-v09.css?v=2';
  document.head.appendChild(link);
 }
 if(window.NexusV09){window.NexusV09.enhance();return;}
 if(v09Loading)return;
 v09Loading=true;
 const script=document.createElement('script');script.src='./nexus-v09.js?v=2';script.async=true;
 script.onload=()=>{v09Loading=false;window.NexusV09?.enhance?.();};
 script.onerror=()=>{v09Loading=false;console.warn('Guia v0.9 indisponível; interface anterior preservada.');};
 document.head.appendChild(script);
}
// Exclusive optional Aha theme; the Original/ChatGPT setting is separate from account data.
let ahaModuleLoading=false,ahaDetailLoading=false;
function isAhaVisual(){
 if(typeof state==='undefined'||state.theme!=='future-aha')return false;
 try{return localStorage.getItem('anderus-aeon-aha-visual-mode')!=='original';}catch(_){return true;}
}
function ensureAhaDetail(){
 if(!document.getElementById('aha-detail-css')){
  const link=document.createElement('link');link.id='aha-detail-css';link.rel='stylesheet';
  link.href='./themes/aha-detail.css?v=2';link.onerror=()=>link.remove();
  document.head.appendChild(link);
 }
 if(window.AnderusAhaDetail){window.AnderusAhaDetail.paint();return;}
 if(ahaDetailLoading)return;ahaDetailLoading=true;
 const script=document.createElement('script');script.src='./themes/aha-detail.js?v=2';script.async=true;
 script.onload=()=>{ahaDetailLoading=false;if(isAhaVisual())window.AnderusAhaDetail?.paint?.();};
 script.onerror=()=>{ahaDetailLoading=false;console.warn('Ornamentos de Aha indisponíveis');};
 document.head.appendChild(script);
}
function enhanceAhaTheme(){
 const app=document.querySelector('.app');if(!app)return;
 const selected=isAhaVisual(),existing=document.getElementById('aha-theme-css');
 if(!selected){
  window.AnderusAhaDetail?.cleanup?.();
  window.AnderusAha?.cleanup?.();
  if(existing)existing.remove();
  document.getElementById('aha-detail-css')?.remove();
  return;
 }
 if(!existing){
  const link=document.createElement('link');link.id='aha-theme-css';link.rel='stylesheet';
  link.href='./themes/aha.css?v=2';
  link.onerror=()=>{link.remove();window.AnderusAha?.cleanup?.();};
  document.head.appendChild(link);
 }
 if(window.AnderusAha){window.AnderusAha.paint();ensureAhaDetail();return;}
 if(ahaModuleLoading)return;
 ahaModuleLoading=true;
 const script=document.createElement('script');script.src='./themes/aha.js?v=2';script.async=true;
 script.onload=()=>{ahaModuleLoading=false;if(isAhaVisual()){window.AnderusAha?.paint?.();ensureAhaDetail();}};
 script.onerror=()=>{ahaModuleLoading=false;document.getElementById('aha-theme-css')?.remove();app.classList.remove('aha-theatre');};
 document.head.appendChild(script);
}

function enhancePage(){
 const root=document.querySelector('.app');if(!root)return;
 document.getElementById('nexFab')?.remove();
 document.querySelectorAll('.v06-pom-tip img,.pom-guide img,.pom-tip img,.pom-portrait').forEach(el=>{
   if(el.dataset.officialPom)return;
   el.dataset.officialPom='yes';
   el.src=OFFICIAL_POMPOM;el.alt='Pom-Pom — guia do Expresso Astral';
   el.decoding='async';el.loading='lazy';
 });
 document.querySelectorAll('.v06-aha-art,.v06-radar-banner img,.v06-banner-strip img,.v06-banner-art img').forEach(el=>{
   if(el.dataset.ahaFixed)return;el.dataset.ahaFixed='1';
   el.onerror=()=>{if(el.dataset.ahaFallback)return;el.dataset.ahaFallback='1';el.src=AHA_FALLBACK;};
   el.src=AHA_ART;
 });
 // The art is hosted in the Nexus repository to avoid broken external hotlinks.
 document.querySelectorAll('.v06-pom-tip img,.pom-guide img,.pom-tip img').forEach(img=>{
   img.onerror=()=>{img.onerror=null;img.src='https://webstatic.hoyoverse.com/upload/op-public/2023/02/10/b6265906953e1c7d56fd495e714aee05_2995041360877409546.jpg';};
 });
 specialText(document.getElementById('sidebarLinks'));
 specialText(document.getElementById('floatMenu'));
 specialText(document.querySelector('#bottomNav'));
 specialText(document.querySelector('#stage'));
 const actions=document.querySelector('.v06-home .v06-hero-buttons');
 if(actions&&!document.getElementById('v07-install-btn')){
   const install=document.createElement('button');install.id='v07-install-btn';install.type='button';
   install.className='v07-install';install.textContent='Instalar Nexus ↗';
   install.addEventListener('click',window.v07Install);actions.appendChild(install);
 }
 const theme=document.querySelector('.v06-themes');
 if(theme&&!theme.querySelector('.v07-exclusive-card')){
   const card=document.createElement('section');card.className='v07-exclusive-card';
   card.innerHTML='<span class="v07-eyebrow">✦ CRIAÇÃO ASSISTIDA</span><h2>Theme Studio · Edição exclusiva</h2><p>Escolha o personagem acima e abra um briefing completo no ChatGPT. Ele incluirá pesquisa de artes oficiais, tipografia, símbolos, animações, desktop e celular — com plano para atualizar o repositório. A publicação depende de você autorizar a execução no GitHub conectado.</p><button type="button" onclick="v07ThemeDeepDive()">✧ Criar tema exclusivo no ChatGPT ↗</button><button type="button" class="v07-secondary" onclick="v07CopyThemePrompt()">Copiar briefing detalhado</button>';
   const stage=theme.querySelector('.v06-theme-stage');if(stage)stage.insertAdjacentElement('afterend',card);else theme.append(card);
 }
 const radar=document.querySelector('.v06-radarhead');
 if(radar&&!document.getElementById('v07-beta-dossier')){
   const box=document.createElement('div');box.id='v07-beta-dossier';box.className='v07-beta-intro';
   box.innerHTML='<span class="v07-eyebrow">BETA MONITOR · FONTES E DIFERENÇAS</span><h3>Kits completos em uma só tela</h3><p>Habilidades, multiplicadores, rastros, E1–E6 com fragmentos e mudanças identificadas entre fontes. Dados beta são separados dos anúncios oficiais.</p><button type="button" onclick="v07OpenFuture()">Abrir arquivo de Aha · 4.7 ↗</button>';
   radar.insertAdjacentElement('afterend',box);
   fetch('./data/beta-watch.json',{cache:'no-store'}).then(r=>r.json()).then(w=>{
      if(!document.getElementById('v07-beta-dossier'))return;
      const detail=document.createElement('div');detail.className='v07-latest-beta';
      const updates=Object.values(w.changes||{}).flat().slice(0,9);
      detail.innerHTML='<b>Última revisão detectada: '+escapeHTML(w.version)+' · '+escapeHTML(w.revision)+'</b>'+
        '<small>Monitoramento a cada três horas. Atualização de fonte não significa kit final verificado.</small>'+
        (updates.length?'<p>'+updates.map(x=>escapeHTML(x.name)+' ('+escapeHTML(x.type)+')').join(' · ')+'</p>':'<p>Sem alterações listadas nesta revisão.</p>');
      document.getElementById('v07-beta-dossier')?.appendChild(detail);
   }).catch(()=>{});

 }
 const app=document.querySelector('.app');
 if(app)app.classList.add('v07-shell');
 enhanceAhaTheme();
 enhanceNexusV09();
}
let lastPending=false;
const observer=new MutationObserver(()=>{
 if(lastPending)return;lastPending=true;
 requestAnimationFrame(()=>{lastPending=false;enhancePage();});
});
function start(){
 // Pom-Pom 2.0: local, explainable conversations grounded in the account.
 if(!document.getElementById('nexus-pompom-chat-css')){
  const css=document.createElement('link');css.id='nexus-pompom-chat-css';css.rel='stylesheet';css.href='./nexus-pompom-chat.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-pompom-chat-js')){
  const js=document.createElement('script');js.id='nexus-pompom-chat-js';js.src='./nexus-pompom-chat.js';js.defer=true;document.head.appendChild(js);
 }

 // User-provided screenshot handling; default file picker remains available.
 if(!document.getElementById('nexus-scan-input-css')){
  const link=document.createElement('link');link.id='nexus-scan-input-css';link.rel='stylesheet';link.href='./nexus-scan-input.css';document.head.appendChild(link);
 }
 if(!document.getElementById('nexus-scan-input-js')){
  const script=document.createElement('script');script.id='nexus-scan-input-js';script.src='./nexus-scan-input.js';script.defer=true;document.head.appendChild(script);
 }

 // Shared materials budget: one inventory for ascension and all trace goals.
 if(!document.getElementById('nexus-material-budget-css')){
  const css=document.createElement('link');css.id='nexus-material-budget-css';css.rel='stylesheet';css.href='./nexus-material-budget.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-material-budget-js')){
  const js=document.createElement('script');js.id='nexus-material-budget-js';js.src='./nexus-material-budget.js';js.defer=true;document.head.appendChild(js);
 }

 // Local factual inbox: beta revision and catalogue diff alerts, never fake push.
 if(!document.getElementById('nexus-notifications-css')){
  const style=document.createElement('link');style.id='nexus-notifications-css';style.rel='stylesheet';style.href='./nexus-notifications.css';document.head.appendChild(style);
 }
 if(!document.getElementById('nexus-notifications-js')){
  const script=document.createElement('script');script.id='nexus-notifications-js';script.src='./nexus-notifications.js';script.defer=true;document.head.appendChild(script);
 }

 // Relic Optimizer: source-backed, not a universal score.
 if(!document.getElementById('nexus-relic-opt-css')){
  const css=document.createElement('link');css.id='nexus-relic-opt-css';css.rel='stylesheet';css.href='./nexus-relic-optimizer.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-relic-opt-js')){
  const js=document.createElement('script');js.id='nexus-relic-opt-js';js.src='./nexus-relic-optimizer.js';js.defer=true;document.head.appendChild(js);
 }
 // Trace Planner uses shared account material inventory and optional levels.
 if(!document.getElementById('nexus-trace-plan-css')){
  const link=document.createElement('link');link.id='nexus-trace-plan-css';link.rel='stylesheet';link.href='./nexus-trace-planner.css';document.head.appendChild(link);
 }
 if(!document.getElementById('nexus-trace-plan-js')){
  const script=document.createElement('script');script.id='nexus-trace-plan-js';script.src='./nexus-trace-planner.js';script.defer=true;document.head.appendChild(script);
 }
 // Warp Math loads first; the planner uses the same sourced rules.
 if(!document.getElementById('nexus-warp-css')){
  const style=document.createElement('link');style.id='nexus-warp-css';style.rel='stylesheet';style.href='./nexus-warp-advisor.css';document.head.appendChild(style);
 }
 if(!document.getElementById('nexus-warp-math-js')){
  const math=document.createElement('script');math.id='nexus-warp-math-js';math.src='./nexus-warp-math.js';math.async=false;document.head.appendChild(math);
  const ui=document.createElement('script');ui.id='nexus-warp-advisor-js';ui.src='./nexus-warp-advisor.js';ui.async=false;document.head.appendChild(ui);
 }
 // Keep the cinematic Aha variant coherent even inside dialogs attached to body.
 if(!document.getElementById('nexus-theme-overlays-css')){
  const css=document.createElement('link');css.id='nexus-theme-overlays-css';css.rel='stylesheet';css.href='./nexus-theme-overlays.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-theme-bridge-js')){
  const script=document.createElement('script');script.id='nexus-theme-bridge-js';script.src='./nexus-theme-bridge.js';script.defer=true;document.head.appendChild(script);
 }
 // Farm Planner 2.0, real PT-BR ascension costs from a verified static snapshot.
 if(!document.getElementById('nexus-farm-css')){
  const link=document.createElement('link');link.id='nexus-farm-css';link.rel='stylesheet';link.href='./nexus-farm-lab.css';document.head.appendChild(link);
 }
 if(!document.getElementById('nexus-farm-js')){
  const script=document.createElement('script');script.id='nexus-farm-js';script.src='./nexus-farm-lab.js';script.defer=true;document.head.appendChild(script);
 }
 // Portable backup and verified transfer between devices.
 if(!document.getElementById('nexus-backup-css')){
  const css=document.createElement('link');css.id='nexus-backup-css';css.rel='stylesheet';css.href='./nexus-backup.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-backup-js')){
  const script=document.createElement('script');script.id='nexus-backup-js';script.src='./nexus-backup.js';script.defer=true;document.head.appendChild(script);
 }
 // Universal search in the existing header, with Ctrl/Cmd+K shortcut.
 if(!document.getElementById('nexus-search-css')){
  const css=document.createElement('link');css.id='nexus-search-css';css.rel='stylesheet';css.href='./nexus-search.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-search-js')){
  const script=document.createElement('script');script.id='nexus-search-js';script.src='./nexus-search.js';script.defer=true;document.head.appendChild(script);
 }
 // Team Lab 2.0: accountable four-character team builder.
 if(!document.getElementById('nexus-team-css')){
  const link=document.createElement('link');link.id='nexus-team-css';link.rel='stylesheet';link.href='./nexus-team-lab.css';document.head.appendChild(link);
 }
 if(!document.getElementById('nexus-team-js')){
  const script=document.createElement('script');script.id='nexus-team-js';script.src='./nexus-team-lab.js';script.defer=true;document.head.appendChild(script);
 }
 // Kit Lab 2.0: isolated data-driven character dossier expansion.
 if(!document.getElementById('nexus-kit-css')){
  const css=document.createElement('link');css.id='nexus-kit-css';css.rel='stylesheet';css.href='./nexus-kit-lab.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-kit-js')){
  const script=document.createElement('script');script.id='nexus-kit-js';script.src='./nexus-kit-lab.js';script.defer=true;document.head.appendChild(script);
 }
 // Load independent diagnostics without mutating account state.
 if(!document.getElementById('nexus-diagnostics-css')){
  const css=document.createElement('link');css.id='nexus-diagnostics-css';css.rel='stylesheet';css.href='./nexus-diagnostics.css';document.head.appendChild(css);
 }
 if(!document.getElementById('nexus-diagnostics-script')){
  const js=document.createElement('script');js.id='nexus-diagnostics-script';js.src='./nexus-diagnostics.js';js.defer=true;document.head.appendChild(js);
 }
 enhancePage();observer.observe(document.querySelector('.app')||document.documentElement,{childList:true,subtree:true});
 const trustedHost=location.protocol==='https:'||['127.0.0.1','localhost'].includes(location.hostname);
 if('serviceWorker' in navigator&&trustedHost){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('Anderus offline',e));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
function buildThemePrompt(){
 const selected=typeof state!=='undefined'?state.theme:'8001';
 let name='Caelus';
 try{if(typeof lookup==='function')name=lookup(selected)?.name||name;}catch(_){}
 const intro='Você é diretor de arte especializado em Honkai: Star Rail, UX mobile-first, frontend sênior, acessibilidade e QA. Trabalhe diretamente no repositório GitHub doraemogx/anderus-star-rail-nexus (site: https://doraemogx.github.io/anderus-star-rail-nexus/). Tema selecionado: '+name+' (ID '+selected+').';
 return [
 intro,
 '1. AUDITORIA OBRIGATÓRIA: consulte README, index.html, v06.js/css, nexus-v07.js/css, scripts de OCR, dados, PWA, módulos e Theme Studio. Mapeie a navegação real e descubra como o estado da conta fica salvo. Nenhuma sobrescrita destrutiva.',
 '2. PESQUISA VISUAL: use splash art, retratos, Eidolons, ícones de caminho/elemento, figurino, arma, cenários, texturas, regiões e trailer OFICIAIS e verificáveis. Separe materiais confirmados, data-mining e fanart; respeite licença/atribuição e nunca apresente arte gerada como oficial.',
 '3. DIREÇÃO DE ARTE ESPECÍFICA: extraia 6-10 códigos visuais realmente reconhecíveis do personagem. Construa um sistema completo de design — componentes, títulos, serifas/sans, geometria, iconografia vetorial, fundos por tela, molduras, transições, microinterações, botões, tabelas, formulários, menus e modais. Não se limite a trocar paleta. Evite dashboard genérico.',
 '4. TODAS AS TELAS: início/hero, Minha Conta, importação de prints, cards e ficha de personagens, Relíquias, Build Lab, Farm Planner, Endgame (MoC, PF, AS, AA), Radar, Beta & Kits, diário Pom-Pom, Theme Studio e configurações. Cada tela deve ter identidade própria porém coerente; mantenha legibilidade de atributos e dados.',
 '5. THEME STUDIO: mantenha opções reversíveis Original do Nexus versus Criação ChatGPT; outros personagens e Caelus não devem perder seu tema. Prefira arquivo CSS/JS isolado carregado apenas quando o personagem/variante correspondente estiver ativo.',
 '6. IMPORTAÇÃO: preserve o OCR local e a confirmação humana. Identifique os 6 equipamentos, conjunto, atributo principal e até 4 subatributos com valor; preencha apenas o que OCR consegue ler de modo plausível e marque dúvida com campo editável. Não fabrique números ou peças. Teste exemplos realistas.',
 '7. ENDGAME: documente a rotação vigente e sua validade, a regra específica de cada modo, bônus, todos os nós/chefes conhecidos, fraquezas, fases, imagens de referência verificadas e mecânicas. Construa equipes somente dos personagens registrados; não repita membros entre Cavaleiros; destaque times parciais e jamais prometa ciclos sem simulação.',
 '8. UX: projetar e verificar 390px (Android com barra inferior, recortes e safe-area) e 1440px; hierarquia visual, layout sem horizontal overflow, targets de toque >=44px, teclado, labels, contraste, fallback de fonte, loading, erro offline e preferências de animação reduzida. Imagens object-fit:contain, sem distorção.',
 '9. ENGENHARIA: sem API paga, tokens secretos, trackers novos, rotinas que zerem localStorage, alteração do inventário ou assets de procedência obscura. Prefira SVG/CSS próprios para ornamentos; créditos nas artes HoYoverse; fallbacks reais de imagens. Invalide o cache PWA quando necessário.',
 '10. QA E PUBLICAÇÃO: antes do commit faça diff revisado, sintaxe JS/CSS, smoke test da navegação e troca de temas, OCR e modais. Se possível faça screenshots de 390px e 1440px e confira visualmente. Com permissão, faça commit atômico e acompanhe o GitHub Pages até sucesso. Caso não possa testar algum item, diga explicitamente.',
 '11. ENTREGA: liste arquivos modificados, origem dos assets, diferenças de design por aba, limites técnicos, testes executados, SHA do commit, status do deploy e endereço publicado. NÃO substitua dados locais nem afirme publicação sem verificar.'
 ].join('\n\n');
}
window.v07ThemeDeepDive=function(){const p=buildThemePrompt();window.open('https://chatgpt.com/?q='+encodeURIComponent(p),'_blank','noopener,noreferrer');};
window.v07CopyThemePrompt=async function(){
 const text=buildThemePrompt();
 try{await navigator.clipboard.writeText(text);window.alert('Briefing do tema copiado!');}
 catch(e){window.prompt('Copie o briefing abaixo:',text);}
};
function sectionsHTML(list,cls,format){
 return '<div class="'+cls+'">'+list.map(format).join('')+'</div>';
}
window.v07OpenFuture=async function(){
 const loading='<div class="v07-loading">Lendo o arquivo beta e sua fonte…</div>';
 if(typeof showModal==='function')showModal('Aeon ★ Aha · Arquivo de beta',loading);
 const panel=document.querySelector('#overlay .modal');
 try{
 const doc=await betaData(),x=doc.entries[0];
 const stats=Object.entries(x.baseStats).map(([k,v])=>'<span><b>'+escapeHTML(k.toUpperCase())+'</b> '+v+'</span>').join('');
 const skill=sectionsHTML(x.skills,'v07-kit-list',o=>'<details class="v07-kit" '+(o.key==='skill'?'open':'')+'><summary><span>'+escapeHTML(o.name)+'</span><small>Nível '+(o.level||'—')+' ›</small></summary><p>'+escapeHTML(o.summary)+'</p><div class="v07-multipliers">'+o.multipliers.map(m=>'<span>'+escapeHTML(m)+'</span>').join('')+'</div><aside><b>✦ Pom-Pom explica</b><p>'+escapeHTML(o.pom)+'</p></aside></details>');
 const eido=sectionsHTML(x.eidolons,'v07-eido-list',o=>'<details class="v07-eido"><summary><img src="'+escapeHTML(o.art)+'" alt="Arte do Eidolon '+o.n+'" loading="lazy"><span><strong>E'+o.n+' · '+escapeHTML(o.name)+'</strong><small>Ver efeito e fragmento ›</small></span></summary><img class="v07-eido-full" src="'+escapeHTML(o.art)+'" alt="Fragmento oficial do E'+o.n+'" loading="lazy"><p>'+escapeHTML(o.summary)+'</p></details>');
 const changes=sectionsHTML(x.changeNotes,'v07-history',o=>'<article><b>'+escapeHTML(o.field)+'</b><div><small>ANTES</small><p>'+escapeHTML(o.before)+'</p></div><div><small>AGORA</small><p>'+escapeHTML(o.after)+'</p></div><em>'+escapeHTML(o.note)+'</em></article>');
 const traces=x.traces.map(o=>'<article><b>'+escapeHTML(o.name)+'</b><p>'+escapeHTML(o.summary)+'</p></article>').join('');
 const html='<div class="v07-beta-detail">'+
  '<div class="v07-beta-hero"><img src="'+escapeHTML(x.art)+'" alt="Aeon Aha arte do jogo" onerror="this.src=\''+AHA_FALLBACK+'\'"><div><span>BETA · '+escapeHTML(x.version)+'</span><h2>'+escapeHTML(x.name)+'</h2><p>'+escapeHTML(x.path)+' · '+escapeHTML(x.element)+' · 5★</p><div class="v07-base-stats">'+stats+'</div></div></div>'+
  '<p class="v07-caveat">A estreia em 11/11/2026 foi anunciada oficialmente, mas os números abaixo são da versão beta '+escapeHTML(x.version)+', não da versão final.</p>'+
  '<h3>Habilidades e multiplicadores</h3>'+skill+
  '<h3>Rastros e passivas</h3><div class="v07-traces">'+traces+'</div>'+
  '<h3>Eidolons · fragmentos reais</h3>'+eido+
  '<h3>Cone de Luz</h3><div class="v07-traces"><article><b>'+escapeHTML(x.lightCone.name)+'</b><p>'+escapeHTML(x.lightCone.effect)+'</p></article></div>'+
  '<h3>Antes × agora</h3>'+changes+
  '<div class="v07-sources"><strong>Fontes e rastreabilidade</strong><p>Versão e imagens: '+escapeHTML(x.version)+'. Informações de beta não equivalem à confirmação oficial.</p><a href="'+escapeHTML(x.source)+'" target="_blank" rel="noopener noreferrer">Ver fonte de beta ↗</a><a href="'+escapeHTML(doc.officialSource)+'" target="_blank" rel="noopener noreferrer">Comunicado oficial de lançamento ↗</a></div>'+
  '</div>';
 const dest=document.querySelector('#overlay .modal .modal-body')||document.querySelector('#overlay .modal .modal-content')||document.querySelector('#overlay .modal');
 if(dest){
  const h=dest.querySelector('.v07-loading');if(h)h.outerHTML=html;
  else dest.insertAdjacentHTML('beforeend',html);
 }
 }catch(e){
 const dest=document.querySelector('#overlay .v07-loading');if(dest)dest.textContent='Não consegui carregar os dados da versão beta. Confira sua conexão.';
 }
};
// All future banner / Aha buttons open the same detailed, sourced dossier.
window.v06OpenFuture=window.v07OpenFuture;
try{nextBannerModal=window.v07OpenFuture;}catch(_){}
window.nexusEnhance=enhancePage;
})();
