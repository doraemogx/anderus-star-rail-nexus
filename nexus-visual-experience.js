/* ANDERUS — Visual Experience 2.0.
 * A UI-only composition layer for the entire Nexus and the Theme Studio.
 * No mutations to character records, build data, save(), or account storage.
 */
(function(){
 'use strict';
 if(window.NexusVisualExperience)return;
 const HIGHLIGHTS=[
  {id:'8001',label:'Original',eyebrow:'EXPRESSO ASTRAL',description:'Azul noturno, linhas estelares e leitura limpa.',kind:'astral'},
  {id:'future-aha',label:'Aha',eyebrow:'GRAND THEATRE',description:'Palco da Euforia, veludo e dourado teatral.',kind:'aha'},
  {match:/castorice/i,eyebrow:'MEMÓRIA',description:'Atmosfera delicada, tons frios e espaços contemplativos.',kind:'memory'},
  {match:/noite eterna|evernight/i,eyebrow:'NOITE ETERNA',description:'Contraste lunar e composição de arquivo.',kind:'night'}
 ];
 const PALETTE={
  Fire:'#f3a18b',Ice:'#a8e2f8',Lightning:'#c6adf1',Wind:'#8fd0b7',
  Quantum:'#d0abf7',Imaginary:'#edd3a0',Physical:'#d8dee7'
 };
 const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const characterList=()=>{try{return typeof CATALOG!=='undefined'?CATALOG:[];}catch(_){return [];}};
 const activeId=()=>{try{return String(state.theme||'8001');}catch(_){return '8001';}};
 const ownedIds=()=>{try{return new Set(Object.keys(state.characters||{}));}catch(_){return new Set();}};
 const findCharacter=entry=>entry.id?characterList().find(c=>String(c.id)===entry.id):
  characterList().find(c=>entry.match.test(String(c.name||'')));
 function source(c){
  if(!c)return '';
  if(c.id==='future-aha')return './assets/official/aha-4-7.webp';
  try{if(typeof imgSrc==='function')return imgSrc(c.id,'preview')||imgSrc(c.id,'icon')||'';}catch(_){}
  return '';
 }
 function previewBtn(id){
  const original=document.querySelector('#v06-theme-grid button[onclick]');
  const target=[...document.querySelectorAll('#v06-theme-grid button')].find(b=>
   (b.getAttribute('onclick')||'').includes("setTheme('"+id+"')"));
  if(target){target.click();return;}
  // A filtered catalogue should not prevent preview of a featured theme.
  const c=characterList().find(x=>String(x.id)===String(id));
  if(!c||!window.NexusVisualPreview?.open)return;
  const fake=document.createElement('button');
  const url=source(c);if(url){const img=document.createElement('img');img.src=url;fake.appendChild(img);}
  window.NexusVisualPreview.open(String(id),fake);
 }
 function themeStyle(c){
  if(!c)return 'astral';
  if(c.id==='future-aha')return 'aha';
  if(c.id==='8001')return 'astral';
  if(/castorice/i.test(c.name))return 'memory';
  if(/noite eterna|evernight/i.test(c.name))return 'night';
  return 'character';
 }
 function themeAccent(c){
  if(!c||c.id==='8001')return '#9fc8e8';
  if(c.id==='future-aha')return '#f0b3c8';
  if(/castorice/i.test(c.name))return '#d6b6ee';
  if(/noite eterna|evernight/i.test(c.name))return '#b1c3ed';
  try{
   const char=typeof gameData!=='undefined'?gameData.chars?.[c.id]:null;
   return PALETTE[char?.element||c.element]||'#dbc39b';
  }catch(_){return '#dbc39b';}
 }
 function previewLayout(themeName,variant){
  const accent=themeAccent({name:themeName,id:variant==='aha'?'future-aha':variant==='astral'?'8001':''});
  return '<div class="nx-vex-mock" data-vex-style="'+variant+'" style="--vex-accent:'+accent+'" aria-label="Exemplo visual da interface">'+
   '<div class="nx-vex-mock-head"><span class="nx-vex-mock-sigil">✦</span><span>ANDERUS<small>STAR RAIL NEXUS</small></span><span class="nx-vex-mock-dot"></span></div>'+
   '<div class="nx-vex-mock-main"><div class="nx-vex-mock-intro"><span>'+(variant==='aha'?'ATO I · EUFORIA':variant==='memory'?'MEMÓRIA · ARQUIVO':'EXPRESSO ASTRAL · ARQUIVO')+'</span><strong>Meu universo</strong><small>Personagens e progresso</small></div>'+
   '<div class="nx-vex-mock-metrics"><div><small>PERSONAGENS SALVOS</small><b>'+ownedIds().size+'</b></div><div><small>SEÇÕES</small><b>09</b></div></div>'+
   '<div class="nx-vex-mock-modules"><span>✧ Personagens</span><span>◈ Endgame</span><span>✦ Farm</span></div></div></div>';
 }
 function decoratePreview(){
  const dlg=document.getElementById('nx-theme-preview');
  if(!dlg?.open)return;
  const cards=[...dlg.querySelectorAll('.nx-theme-preview-card')];
  if(cards.length!==2)return;
  for(let i=0;i<2;i++){
   const card=cards[i];if(card.dataset.vexPreview==='1')continue;
   const name=card.querySelector('strong')?.textContent?.trim()||'Tema';
   const character=characterList().find(c=>c.name===name)||null;
   const variant=themeStyle(character);
   card.dataset.vexPreview='1';card.dataset.vexStyle=variant;
   card.style.setProperty('--vex-accent',themeAccent(character));
   card.insertAdjacentHTML('beforeend',previewLayout(name,variant));
  }
  const heading=dlg.querySelector('.nx-theme-compare header p');
  if(heading)heading.textContent='Compare as artes, os painéis e a navegação. Nada muda na sua conta até você aplicar.';
  const note=dlg.querySelector('.nx-preview-note');
  if(note)note.textContent='Prévia ilustrativa do estilo de interface. O tema aplicado mantém seus personagens, cones, relíquias e progresso.';
 }
 let currentFilter='all';
 function categoryText(filter){
  if(filter==='owned')return 'Temas de personagens da sua conta';
  if(filter==='featured')return 'Temas em destaque';
  return 'Todos os temas disponíveis';
 }
 function updateFilter(){
  const studio=document.querySelector('.v06-themes');
  if(!studio)return;
  const grid=studio.querySelector('#v06-theme-grid');
  if(!grid)return;
  const owned=ownedIds(),featured=new Set(HIGHLIGHTS.map(findCharacter).filter(Boolean).map(c=>String(c.id)));
  let visible=0;
  for(const btn of grid.querySelectorAll('button')){
   const match=(btn.getAttribute('onclick')||'').match(/setTheme\('([^']+)'\)/);
   if(!match)continue;
   const id=match[1];
   const show=currentFilter==='all'||currentFilter==='featured'&&featured.has(id)||
    currentFilter==='owned'&&(owned.has(id)||id===activeId());
   btn.hidden=!show;
   btn.setAttribute('aria-hidden',show?'false':'true');
   if(show)visible++;
  }
  for(const btn of studio.querySelectorAll('.nx-vex-filter')){
   btn.setAttribute('aria-pressed',String(btn.dataset.filter===currentFilter));
  }
  const result=studio.querySelector('.nx-vex-result');
  if(result){const msg=visible+' tema'+(visible===1?'':'s')+' · '+categoryText(currentFilter);if(result.textContent!==msg)result.textContent=msg;}
 }
 function previewCard(c,item){
  const selected=String(c.id)===activeId(),src=source(c),variant=themeStyle(c);
  return '<button type="button" class="nx-vex-feature '+(selected?'is-active':'')+'" data-vex-theme="'+escapeText(c.id)+'" data-vex-kind="'+variant+'" style="--vex-accent:'+themeAccent(c)+'" aria-label="Prévia do tema '+escapeText(item.label||c.name)+'">'+
   '<div class="nx-vex-feature-backdrop"></div>'+
   (src?'<img src="'+escapeText(src)+'" alt="" loading="lazy" decoding="async">':'')+
   '<span class="nx-vex-feature-meta">'+escapeText(item.eyebrow||'IDENTIDADE')+'</span>'+
   '<div class="nx-vex-feature-copy"><strong>'+escapeText(item.label||c.name)+'</strong><small>'+escapeText(item.description)+'</small><span>'+(selected?'TEMA ATIVO':'VISUALIZAR TEMA')+' <span aria-hidden="true">↗</span></span></div>'+
   '</button>';
 }
 function buildStudio(){
  const studio=document.querySelector('.v06-themes');
  if(!studio)return;
  const stage=studio.querySelector('.v06-theme-stage'),grid=studio.querySelector('#v06-theme-grid');
  if(!stage||!grid)return;
  if(!studio.querySelector('.nx-vex-intro')){
   const intro=document.createElement('section');
   intro.className='nx-vex-intro';
   intro.innerHTML='<div class="nx-vex-intro-copy"><span>ANDERUS / ATELIÊ DE IDENTIDADES</span><h2>Cada universo, uma nova cena.</h2><p>Experimente a identidade visual do seu personagem. Compare a interface antes de aplicar, escolha artes e volte ao tema anterior quando quiser.</p><div class="nx-vex-intro-points"><span>✦ Prévia segura</span><span>◈ Sua conta preservada</span><span>◇ Mobile e desktop</span></div></div><div class="nx-vex-intro-orbit" aria-hidden="true"><i></i><i></i><i></i><b>✧</b></div>';
   stage.parentNode.insertBefore(intro,stage);
  }
  if(!studio.querySelector('.nx-vex-showcase')){
   const found=HIGHLIGHTS.map(item=>({item,c:findCharacter(item)})).filter(x=>x.c);
   const section=document.createElement('section');
   section.className='nx-vex-showcase';
   section.innerHTML='<div class="nx-vex-label"><span>CURADORIA DO EXPRESSO</span><h2>Identidades em destaque</h2><p>Toque para comparar a aparência do Nexus, sem alterar sua conta.</p></div>'+
    '<div class="nx-vex-feature-grid">'+found.map(x=>previewCard(x.c,x.item)).join('')+'</div>';
   const gridTitle=grid.previousElementSibling;
   if(gridTitle&&gridTitle.classList.contains('v06-search'))gridTitle.insertAdjacentElement('beforebegin',section);
   else stage.insertAdjacentElement('afterend',section);
   section.addEventListener('click',event=>{
    const btn=event.target.closest('[data-vex-theme]');
    if(btn)previewBtn(btn.dataset.vexTheme);
   });
  }
  if(!studio.querySelector('.nx-vex-controls')){
   const controls=document.createElement('div');controls.className='nx-vex-controls';
   controls.innerHTML='<div class="nx-vex-filters" role="group" aria-label="Filtrar identidades">'+
    '<button type="button" class="nx-vex-filter" data-filter="all">Todos</button>'+
    '<button type="button" class="nx-vex-filter" data-filter="featured">Destaques</button>'+
    '<button type="button" class="nx-vex-filter" data-filter="owned">Minha conta</button></div>'+
    '<span class="nx-vex-result" role="status" aria-live="polite"></span>';
   grid.insertAdjacentElement('beforebegin',controls);
   controls.addEventListener('click',event=>{
    const btn=event.target.closest('[data-filter]');
    if(!btn)return;
    currentFilter=btn.dataset.filter;
    updateFilter();
   });
  }
  const active=studio.querySelector('.nx-vex-showcase .nx-vex-feature-grid');
  if(active){
   for(const button of active.querySelectorAll('button[data-vex-theme]')){
    const selected=button.dataset.vexTheme===activeId();
    button.classList.toggle('is-active',selected);
    const span=button.querySelector('.nx-vex-feature-copy>span');
    if(span&&span.dataset.vexState!==(selected?'active':'preview')){span.dataset.vexState=selected?'active':'preview';span.innerHTML=(selected?'TEMA ATIVO':'VISUALIZAR TEMA')+' <span aria-hidden="true">↗</span>';}
   }
  }
  updateFilter();
 }
 function decorateHub(){
  const app=document.querySelector('.app');if(!app)return;
  const sections=['home','library','profile','endgame','farm','radar','tier','themes','nexia','settings'];
  const route=app.dataset.nxRoute;
  if(sections.includes(route))app.dataset.vexScene=route;
  const stage=document.getElementById('stage');
  if(!stage)return;
  // Enhance the existing section masthead instead of inserting a competing one.
  const scene=stage.querySelector('.nx-scene');
  if(scene&&!scene.querySelector('.nx-vex-scene-ornament')){
   const decoration=document.createElement('span');decoration.className='nx-vex-scene-ornament';
   decoration.setAttribute('aria-hidden','true');decoration.innerHTML='<i></i><i></i><i></i>';
   scene.appendChild(decoration);
  }
  for(const item of stage.querySelectorAll('.v06-sectionline,.section-title')){
   item.classList.add('nx-vex-section-header');
  }
  for(const panel of stage.querySelectorAll('.v06-feature-panel,.v09-guide-title,.v11-cone-panel,.v09-boss,.v06-char-card,.v11-relic-card')){
   panel.classList.add('nx-vex-surface');
  }
 }
 let pending=false;
 function update(){pending=false;decorateHub();buildStudio();decoratePreview();}
 function queue(){if(pending)return;pending=true;requestAnimationFrame(update);}
 function start(){
  const app=document.querySelector('.app');if(!app)return;
  const observer=new MutationObserver(queue);
  observer.observe(app,{childList:true,subtree:true});
  const dlgObserver=new MutationObserver(queue);
  dlgObserver.observe(document.body,{childList:true,subtree:false});
  document.addEventListener('click',event=>{
   if(event.target.closest('#nx-theme-preview'))queue();
  },true);
  queue();
 }
 window.NexusVisualExperience={version:'2.0',refresh:queue,preview:previewBtn};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();