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
 function decorate(){
  scheduled=false;
  skipToContent();
  decorateNav();
  decorateControls();
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