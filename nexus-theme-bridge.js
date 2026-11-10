/* Nexus 2.0 theme bridge: modals live under <body>, outside .aha-theatre. */
(function(){
 'use strict';
 if(window.NexusThemeBridge)return;
 const key='nexus-theme-aeon';
 let observer=null;
 const apply=()=>{
  const app=document.querySelector('.app');
  const enabled=Boolean(app?.classList.contains('aha-theatre'));
  document.documentElement.classList.toggle(key,enabled);
  document.documentElement.dataset.nexusTheme=enabled?'aha-grand-theatre':'original';
 };
 function mount(){
  const app=document.querySelector('.app');
  if(!app)return;
  apply();
  if(observer)return;
  observer=new MutationObserver(apply);
  observer.observe(app,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',apply);
 }
 window.NexusThemeBridge={apply,mount};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
