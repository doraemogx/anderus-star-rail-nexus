/* ANDERUS — visual finishing: canonical Aha display and consistent vector icons.
 * This module only modifies DOM presentation. Character IDs, game catalogue,
 * persisted builds, cloud records and Theme Studio state remain untouched.
 */
(function(){
 'use strict';
 if(window.NexusVisualFinish)return;
 const CANONICAL='Aha';
 const iconPaths={
  home:'<path d="m3 12 9-9 9 9"/><path d="M5 10v11h14V10M9 21v-7h6v7"/>',
  library:'<path d="M5 3h14v18H5zM9 7h6M9 11h6M9 15h4"/>',
  profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>',
  endgame:'<path d="m4 20 16-16M8 4l12 12M4 4l16 16"/><path d="M2 22h6M16 22h6"/>',
  farm:'<path d="M12 2 4 7v10l8 5 8-5V7zM4 7l8 5 8-5M12 12v10"/>',
  radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  themes:'<path d="m12 2 3.2 6.8L22 12l-6.8 3.2L12 22l-3.2-6.8L2 12l6.8-3.2z"/>',
  nexia:'<path d="M5 7c0-3 3-5 7-5s7 2 7 5v9c0 4-3 6-7 6s-7-2-7-6z"/><path d="M8 11h1m6 0h1M9 15q3 3 6 0"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3"/>',
  scan:'<path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5"/><circle cx="12" cy="12" r="4"/>',
  back:'<path d="m15 5-7 7 7 7"/>'
 };
 const navRoutes=['home','library','endgame','radar','themes'];
 function icon(type){
  const path=iconPaths[type]||iconPaths.home;
  return '<svg class="nx-vicon" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
 }
 const routeFromLabel=s=>{
  const x=String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(/inicio|home/.test(x))return 'home';
  if(/personagen|conta|arquivo/.test(x))return 'library';
  if(/endgame|desafio|arbitragem/.test(x))return 'endgame';
  if(/farm|materia/.test(x))return 'farm';
  if(/radar|beta|warp/.test(x))return 'radar';
  if(/theme|tema|atelie/.test(x))return 'themes';
  if(/pom|nexia|assistente/.test(x))return 'nexia';
  if(/config|ajuste/.test(x))return 'settings';
  return 'profile';
 };
 const legacyAha=/(?:\b(?:Nihilux|Nerilux)\b(?:\s*\/\s*R[aá])?|\bR[aá]\s*\(\s*(?:Nihilux|Nerilux)\s*\))/gi;
 const compounds=[
  /\bAha\s*\(\s*(?:Nihilux|Nerilux|R[aá])(?:\s*\/\s*(?:Nihilux|Nerilux|R[aá]))?\s*\)/gi,
  /\bAha\s*[\-–—/]\s*(?:Nihilux|Nerilux|R[aá])\b/gi,
  /\b(?:Nihilux|Nerilux|R[aá])\s*[\-–—/]\s*Aha\b/gi
 ];
 function canonicalize(s){
  if(!s||!/(?:nihilux|nerilux|\br[aá]\b)/i.test(s))return s;
  let v=s;
  for(const regex of compounds)v=v.replace(regex,CANONICAL);
  return v.replace(legacyAha,CANONICAL);
 }
 function canonicalizeAhaLabels(){
  const root=document.querySelector('.app');if(!root)return;
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
   acceptNode(node){
    const p=node.parentElement;
    if(!p||p.closest('script,style,textarea,pre,code,[contenteditable],input,select,option'))return NodeFilter.FILTER_REJECT;
    return /(?:nihilux|nerilux|\br[aá]\b)/i.test(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;
   }
  });
  const nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
  for(const node of nodes){
   const next=canonicalize(node.nodeValue);
   if(next!==node.nodeValue)node.nodeValue=next;
  }
  for(const el of root.querySelectorAll('[alt],[title],[aria-label]')){
   for(const attr of ['alt','title','aria-label']){
    if(!el.hasAttribute(attr))continue;
    const old=el.getAttribute(attr),next=canonicalize(old);
    if(old!==next)el.setAttribute(attr,next);
   }
  }
 }
 function decorateIcons(){
  const app=document.querySelector('.app');if(!app)return;
  const nav=document.querySelector('#bottomNav');
  if(nav){
   const buttons=[...nav.querySelectorAll('button')];
   buttons.forEach((btn,i)=>{
    const key=navRoutes[i]||routeFromLabel(btn.textContent);
    let target=btn.querySelector('.game-nav-icon');
    if(!target){
     target=document.createElement('span');target.className='game-nav-icon';
     btn.prepend(target);
    }
    if(!target.querySelector('.nx-vicon')){
     target.insertAdjacentHTML('beforeend',icon(key));
     target.classList.add('nx-has-vicon');
    }
   });
  }
  const side=document.querySelector('#sidebarLinks');
  if(side)for(const btn of side.querySelectorAll('button,.menu-link')){
   if(btn.querySelector('.nx-vicon'))continue;
   const key=routeFromLabel(btn.textContent);
   const slot=document.createElement('span');slot.className='nx-sidebar-icon';
   slot.innerHTML=icon(key);btn.prepend(slot);
  }
  for(const btn of document.querySelectorAll('.v06-tile')){
   if(btn.querySelector('.nx-vicon'))continue;
   const slot=btn.querySelector('.v06-tile-deco');
   if(slot)slot.insertAdjacentHTML('beforeend',icon(routeFromLabel(btn.textContent)));
  }
 }
 let scheduled=false;
 function refresh(){scheduled=false;canonicalizeAhaLabels();decorateIcons();}
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(refresh);}
 function start(){
  const app=document.querySelector('.app');if(!app)return;
  const observer=new MutationObserver(schedule);
  observer.observe(app,{subtree:true,childList:true,attributes:false});
  refresh();
 }
 window.NexusVisualFinish={version:'5.1',canonicalize,refresh:schedule};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();