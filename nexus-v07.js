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
}
let lastPending=false;
const observer=new MutationObserver(()=>{
 if(lastPending)return;lastPending=true;
 requestAnimationFrame(()=>{lastPending=false;enhancePage();});
});
function start(){
 enhancePage();observer.observe(document.querySelector('.app')||document.documentElement,{childList:true,subtree:true});
 if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('Anderus offline',e));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
function buildThemePrompt(){
 const selected=typeof state!=='undefined' ? state.theme : '8001';
 let char='Caelus';
 try{if(typeof lookup==='function')char=lookup(selected)?.name||char;}catch(e){}
 return 'Você vai transformar VISUALMENTE o meu site ANDERUS STAR RAIL NEXUS, hospedado em https://doraemogx.github.io/anderus-star-rail-nexus/ e mantido no GitHub em doraemogx/anderus-star-rail-nexus. Personagem do tema escolhido: '+char+' (ID '+selected+').\n\n'+
 'FUNÇÃO: aja como diretor de arte de Honkai: Star Rail e desenvolvedor frontend sênior. Pesquise antes de implementar: personagem, história visual, oficiais de splash art e Eidolons, paleta, ícones, símbolos do elemento/caminho, ambientes, roupas, materiais promocionais e fontes verificáveis. Priorize imagens OFICIAIS do jogo; nunca gere uma imagem alegando ser oficial. Não use fanart sem atribuição/licença e não invente imagens de Eidolons.\n\n'+
 'DIREÇÃO CRIATIVA: transformação estrutural real, não recolor. Crie identidade de '+char+' com novo hero cinematográfico, molduras, ícones, fundo, partículas, texturas, tipografia, ilustrações e animações, mantendo legibilidade de dados e UX. Faça versões mobile-first (390 px) e desktop 1440 px. Preserve navegação funcional, importação de prints, Pom-Pom editorial, farm, kits, beta, Endgame e a possibilidade de voltar ao tema Caelus.\n\n'+
 'TECNOLOGIA: inspecione o código existente primeiro. Crie tema isolado em arquivo próprio com fallback e carregamento sob demanda, sem modificar dados locais nem pedir API paga. Use assets externos com atribuição e fallback visual, prefira hospedar os assets autorizados no repositório. Evite imagens achatadas e fontes quebradas. Respeite acessibilidade, animação reduzida, performance de celular, caching da PWA e layouts responsivos. Faça commits no GitHub apenas após revisar o que será alterado e testar sintaxe, navegação e preview. Confirme o status do GitHub Pages. Se não tiver permissão de escrita, peça para conectar o GitHub, não finja publicar.\n\n'+
 'ENTREGA: pesquisa visual fundamentada, conceito específico do personagem, mudanças reais no código, testes, commit e link da versão publicada. Não substitua a conta do usuário, nem descarte os outros temas.';
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
window.nexusEnhance=enhancePage;
})();
