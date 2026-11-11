/* Phase 4 · Accessible navigation semantics and keyboard support.
 * UI-only enhancement: does not change routes, save data or account state.
 */
(function installNexusDesignSystem(){
 'use strict';
 if(window.NexusDesignSystem)return;
 let scheduled=false,menuOpen=false;
 const routes={home:'Início',library:'Personagens',profile:'Personagem',
  endgame:'Endgame',farm:'Farm Planner',radar:'Radar',tier:'Meta',
  themes:'Theme Studio',nexia:'Pom-Pom',settings:'Configurações'};
 const set=(el,key,value)=>{
  if(el&&el.getAttribute(key)!==value)el.setAttribute(key,value);
 };
 const menuToggle=()=>document.querySelector('.mast-actions .i-btn[title="Abrir menu"]');
 function skipToContent(){
  const stage=document.getElementById('stage');
  if(!stage)return;
  set(stage,'tabindex','-1');
  if(!document.querySelector('.nx-skip')){
   const link=document.createElement('a');
   link.className='nx-skip';link.href='#stage';link.textContent='Ir para o conteúdo';
   link.addEventListener('click',event=>{
    event.preventDefault();stage.focus({preventScroll:true});
    stage.scrollIntoView({behavior:'auto',block:'start'});
   });
   document.body.insertBefore(link,document.body.firstChild);
  }
 }
 function decorateNav(){
  const nav=document.getElementById('bottomNav');
  if(nav){
   set(nav,'aria-label','Navegação principal');
   nav.querySelectorAll('button').forEach(btn=>{
    const active=btn.classList.contains('active');
    if(active)set(btn,'aria-current','page');
    else btn.removeAttribute('aria-current');
    if(!btn.hasAttribute('type'))btn.type='button';
   });
  }
  const sidebar=document.getElementById('sidebarLinks');
  if(sidebar){
   set(sidebar,'role','navigation');set(sidebar,'aria-label','Seções do Nexus');
   sidebar.querySelectorAll('button').forEach(btn=>{
    if(btn.classList.contains('active'))set(btn,'aria-current','page');
    else btn.removeAttribute('aria-current');
    if(!btn.hasAttribute('type'))btn.type='button';
   });
  }
  const tabs=document.querySelector('.v06-profile .v06-tabs');
  if(tabs){
   set(tabs,'aria-label','Seções da ficha do personagem');
   tabs.querySelectorAll('button').forEach(btn=>{
    if(btn.classList.contains('active'))set(btn,'aria-current','page');
    else btn.removeAttribute('aria-current');
   });
  }
  const toggle=menuToggle(),panel=document.querySelector('#floatMenu .floating-panel');
  if(toggle){
   set(toggle,'aria-controls','floatMenu');
   set(toggle,'aria-expanded',panel?'true':'false');
   set(toggle,'aria-haspopup','dialog');
  }
  if(panel){
   set(panel,'role','dialog');set(panel,'aria-modal','true');
   set(panel,'aria-label','Menu de seções');
  }
  if(panel&&!menuOpen){
   menuOpen=true;
   if(toggle===document.activeElement)panel.querySelector('button,a')?.focus();
  }else if(!panel){
   menuOpen=false;
  }
 }
 function decorateControls(){
  document.querySelectorAll('.mast-actions .i-btn').forEach(btn=>{
   if(!btn.hasAttribute('aria-label')&&btn.title)set(btn,'aria-label',btn.title);
  });
  const note=document.querySelector('.desktop-sidebar .note');
  if(note&&/v0\.5/.test(note.textContent||'')){
   note.textContent='Seu Expresso Astral · Anderus';
  }
  document.querySelectorAll('.toast').forEach(el=>{
   set(el,'role','status');set(el,'aria-live','polite');
  });
  const stage=document.getElementById('stage');
  const active=document.querySelector('#sidebarLinks .active')?.textContent?.trim();
  const mainTitle=stage?.querySelector('h1')?.textContent?.trim();
  const heading=(mainTitle||active||'Nexus').slice(0,90);
  const next=heading+' · Anderus Star Rail Nexus';
  if(document.title!==next)document.title=next;
 }

 const SCENES={
  library:['01 / ARQUIVO','Seu acervo','Identidades e registros'],
  profile:['02 / PERFIL','Ficha de personagem','Atributos e equipamentos'],
  endgame:['03 / DESAFIOS','Desafios do universo','Mecânicas e equipes'],
  farm:['04 / SUPRIMENTOS','Planejamento de recursos','Progresso de evolução'],
  radar:['05 / OBSERVATÓRIO','Radar de novidades','Fontes e atualizações'],
  tier:['06 / ANÁLISE','Laboratório de meta','Contexto e estratégias'],
  themes:['07 / ATELIÊ','Identidades do Nexus','Prévia antes de aplicar'],
  nexia:['08 / EXPRESSO','Pom-Pom','Orientação da sua jornada'],
  settings:['09 / CONTROLES','Preferências','Segurança e configurações']
 };
 const lastThemeKey='anderus_nexus_last_theme_v1';
 function pageRoute(){try{return typeof page==='string'?page:'home';}catch(_){return 'home';}}
 function decorateScenes(){
  const app=document.querySelector('.app'),stage=document.getElementById('stage');
  if(!app||!stage)return;
  const current=pageRoute(),meta=SCENES[current];
  app.dataset.nxRoute=current;
  if(!meta)return;
  if(!stage.querySelector('.nx-scene')){
   const el=document.createElement('div');el.className='nx-scene';
   el.innerHTML='<span class="nx-scene-star" aria-hidden="true">✦</span>'+
    '<div class="nx-scene-chapter"><span>'+meta[0]+'</span><strong>'+meta[1]+'</strong></div>'+
    '<span class="nx-scene-caption">'+meta[2]+'</span>'+
    '<span class="nx-scene-line" aria-hidden="true"></span>';
   stage.insertBefore(el,stage.firstChild);
  }
  for(const el of stage.querySelectorAll('.v06-empty,.v09-team-empty')){
   el.classList.add('nx-empty');el.setAttribute('role','status');
  }
  for(const el of stage.querySelectorAll('.v06-import-pending,.v11-relic-warning'))el.classList.add('nx-error');
  for(const el of stage.querySelectorAll('.v06-kicker,.v09-eyebrow,.v07-eyebrow'))el.classList.add('nx-eyebrow');
  for(const el of stage.querySelectorAll('.v06-theme-grid button')){
   if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label','Visualizar tema '+(el.textContent||'').trim());
   el.setAttribute('aria-haspopup','dialog');
  }
  if(current==='themes'&&typeof CATALOG!=='undefined'){
   const restore=stage.querySelector('.v06-theme-restore');
   if(restore&&!stage.querySelector('.nx-theme-undo')){
    let previous=null;
    try{previous=localStorage.getItem(lastThemeKey)}catch(_){}
    const target=CATALOG.find(c=>c.id===previous);
    if(target&&previous!==state.theme){
     const button=document.createElement('button');button.type='button';
     button.className='nx-theme-undo';
     button.textContent='↶ Voltar ao tema anterior: '+target.name;
     button.addEventListener('click',()=>{
      const active=state.theme;
      try{localStorage.setItem(lastThemeKey,active)}catch(_){}
      if(typeof setTheme==='function')setTheme(target.id);
     });
     restore.insertAdjacentElement('afterend',button);
    }
   }
  }
 }
 function decoratePictures(){
  for(const img of document.querySelectorAll(
   '.v06-char-card img,.v06-theme-grid img,.v06-art-picks img,.v09-boss img,.v11-relic-image img')){
   if(img.dataset.nxAssetChecked)return;
   img.dataset.nxAssetChecked='1';img.decoding='async';
   if(img.getAttribute('loading')!=='eager')img.loading='lazy';
   img.addEventListener('error',()=>{
    img.closest('.v06-char-art,.v06-theme-grid button,.v06-art-picks button,.v09-boss-image,.v11-relic-image')?.classList.add('nx-art-fallback');
   },{once:true});
  }
 }
 function escapeLabel(s){return String(s||'').replace(/[&<>"']/g,
  c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function previewTheme(id,button){
  if(typeof CATALOG==='undefined'||!CATALOG.some(c=>c.id===id))return;
  let dialog=document.getElementById('nx-theme-preview');
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='nx-theme-preview';
   dialog.className='nx-theme-preview';document.body.appendChild(dialog);
   dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  }
  const current=typeof state!=='undefined'?state.theme:'8001';
  const before=CATALOG.find(c=>c.id===current);
  const after=CATALOG.find(c=>c.id===id);
  const currentSrc=document.querySelector('.v06-theme-stage-art img')?.getAttribute('src')||'';
  const newSrc=button?.querySelector('img')?.getAttribute('src')||'';
  const card=(src,name,kind,selected)=>
   '<article class="nx-theme-preview-card '+(selected?'is-selected':'')+'">'+
   '<span>'+kind+'</span><div class="nx-theme-preview-art">'+
   (src?'<img src="'+escapeLabel(src)+'" alt="'+escapeLabel(name)+'">':'<div aria-hidden="true">✦</div>')+
   '</div><strong>'+escapeLabel(name)+'</strong></article>';
  dialog.innerHTML='<form method="dialog" class="nx-theme-compare">'+
   '<header><div><span class="nx-eyebrow">THEME STUDIO · PRÉVIA</span>'+
   '<h2>Compare antes de aplicar</h2>'+
   '<p>Veja a arte dos temas. A troca só acontece após confirmar.</p></div>'+
   '<button type="submit" class="nx-preview-close" aria-label="Fechar prévia">×</button></header>'+
   '<div class="nx-theme-preview-grid">'+
   card(currentSrc,before?.name||'Tema atual','AGORA',true)+
   card(newSrc,after.name,'NOVO TEMA',false)+'</div>'+
   '<p class="nx-preview-note">A identidade visual acompanha cada personagem. Seus equipamentos e personagens não são alterados.</p>'+
   '<footer><button type="submit" class="nx-preview-cancel">Manter tema atual</button>'+
   '<button type="button" class="nx-preview-apply">Aplicar '+escapeLabel(after.name)+'</button></footer></form>';
  dialog.querySelector('.nx-preview-apply').addEventListener('click',()=>{
   const old=typeof state!=='undefined'?state.theme:null;
   if(old&&old!==id)try{localStorage.setItem(lastThemeKey,old)}catch(_){}
   dialog.close();
   if(typeof setTheme==='function')setTheme(id);
  },{once:true});
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('.nx-preview-close')?.focus({preventScroll:true});
 }
 function interceptThemeChoice(event){
  const button=event.target?.closest?.('#v06-theme-grid button');
  if(!button)return;
  const source=button.getAttribute('onclick')||'';
  const id=source.match(/setTheme\('([^']+)'\)/)?.[1];
  if(!id)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  previewTheme(id,button);
 }
 document.addEventListener('click',interceptThemeChoice,true);
 window.NexusVisualPreview={open:previewTheme,version:'5.0'};

 function decorate(){
  scheduled=false;
  skipToContent();
  decorateNav();
  decorateControls();
  decorateScenes();
  decoratePictures();
 }
 function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(decorate);
 }
 document.addEventListener('keydown',event=>{
  const panel=document.querySelector('#floatMenu .floating-panel');
  if(!panel)return;
  if(event.key==='Escape'){
   event.preventDefault();
   if(typeof window.toggleMenu==='function')window.toggleMenu();
   menuToggle()?.focus({preventScroll:true});
   return;
  }
  if(event.key!=='Tab')return;
  const items=[...panel.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')]
   .filter(el=>el.getClientRects().length>0);
  if(!items.length)return;
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',start,{once:true});
 }else start();
 function start(){
  // The app's legacy scroll-behavior:smooth could leave mobile routes halfway
  // down the previous section after theme changes. Route changes must reset
  // immediately, without changing state or the URL.
  if(!window.NexusRouteScroll&&typeof window.route==='function'){
   const originalRoute=window.route;
   window.route=function(...args){
    const result=originalRoute.apply(this,args);
    try{window.scrollTo({top:0,left:0,behavior:'instant'});}
    catch(_){window.scrollTo(0,0);}
    return result;
   };
   window.NexusRouteScroll=true;
  }
  const root=document.querySelector('.app')||document.body;
  const observer=new MutationObserver(schedule);
  observer.observe(root,{subtree:true,childList:true});
  document.addEventListener('focusin',event=>{
   if(event.target?.matches?.('.v06-profile .v06-tabs button'))
    event.target.scrollIntoView({behavior:'auto',inline:'nearest',block:'nearest'});
  });
  decorate();
 }
 window.NexusDesignSystem={version:'4.0',recheck:schedule};
})();