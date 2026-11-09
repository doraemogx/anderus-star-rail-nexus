/* ANDERUS 2.0 | Kit Lab factual. No account writes or invented kit values. */
(function(){
'use strict';
if(window.NexusKitLab)return;
const ROOT='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={Rogue:'Caça',Warrior:'Destruição',Mage:'Erudição',Shaman:'Harmonia',Knight:'Preservação',Warlock:'Inexistência',Priest:'Abundância',Memory:'Reminiscência',Elation:'Euforia'};
const elements={Ice:'Gelo',Fire:'Fogo',Wind:'Vento',Quantum:'Quântico',Physical:'Físico',Imaginary:'Imaginário',Thunder:'Raio'};
let artPromise=null;
function loadArt(){return artPromise||(artPromise=fetch('./data/eidolon-art.json',{cache:'no-store'}).then(r=>r.ok?r.json():{characters:{}}).catch(()=>({characters:{}})));}
let gamePromise=null,selected='',showSummary=false,activeTab='skills';
const modalId='nexus-kit-dialog';
const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function load(){
 if(!gamePromise)gamePromise=fetch('./data/live-game.json',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw Error('Catálogo não disponível: '+r.status);return r.json();
 }).catch(e=>{gamePromise=null;throw e;});
 return gamePromise;
}
function image(path){return path?ROOT+String(path).replace(/^\/+/, ''):'';}
function rankText(value){return String(value??'').replace(/<[^>]*>/g,'').trim();}
function valueFormat(n,percent){
 if(typeof n!=='number'||!Number.isFinite(n))return null;
 const val=percent?n*100:n;
 return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(val)+(percent?'%':'');
}
function resolveEffect(effect,params,level){
 const desc=rankText(effect?.desc||'');
 if(!desc)return {html:'Descrição não disponível no catálogo.',missing:true};
 const table=Array.isArray(effect.params)?effect.params:[];
 const at=Array.isArray(table[level-1])?table[level-1]:null;
 const requested=level;
 const placeholders=[];
 const replaced=desc.replace(/#(\d+)\[([^\]]+)\](%?)/g,(token,n,_fmt,pct)=>{
  const pos=Number(n)-1,number=at?.[pos],formatted=valueFormat(number,Boolean(pct));
  if(formatted===null){placeholders.push(token);return '⟦valor não disponível⟧';}
  return formatted;
 });
 return {html:esc(replaced).replace(/\n/g,'<br>'),missing:placeholders.length>0,requested};
}
function getSkills(c,g){
 return [...new Set(c.skills||[])].map(id=>({...g.skills?.[id],id})).filter(s=>s.desc||s.name);
}
function getEidolons(c,g){
 return (c.ranks||[]).slice(0,6).map((id,index)=>({...g.ranks?.[id],id,n:index+1}));
}
function maxLevel(s){return Math.max(1,Math.min(15,Array.isArray(s.params)?s.params.length:1));}
function cardSkill(s,i){
 const max=maxLevel(s),level=Number(document.querySelector('#nexus-kit-level-'+i)?.value||Math.min(10,max));
 const effect=resolveEffect(s,s.params,Math.min(level,max));
 return '<article class="kit-skill" data-skill="'+i+'"><div class="kit-skill-title"><span class="kit-type">'+esc(s.type_text||s.type||'Habilidade')+'</span><h3>'+esc(s.name||'Habilidade '+(i+1))+'</h3></div>'+
  '<label for="nexus-kit-level-'+i+'">Nível <strong>'+level+'</strong> de '+max+'</label>'+
  '<input type="range" min="1" max="'+max+'" value="'+level+'" step="1" id="nexus-kit-level-'+i+'" data-skill-level="'+i+'">'+
  '<p class="kit-description">'+effect.html+'</p>'+
  (effect.missing?'<p class="kit-warning">Parte dos multiplicadores não está disponível nesse nível. Nenhum número foi estimado.</p>':'')+
  '<small>Fonte: catálogo estruturado PT-BR · ID '+esc(s.id)+'</small></article>';
}
function summary(c,g){
 const skills=getSkills(c,g),descs=skills.map(x=>clean(x.desc)).join(' ');
 const resource=descs.match(/memoesp[ií]rito|euforia|quebra|ataque extra|dano cont[ií]nuo|escudo|cura|vibra[cç][oõ]es|piada/gi)||[];
 const unique=[...new Set(resource.map(x=>x.toLowerCase()))].slice(0,5);
 const mechanic=unique.length?'No kit aparecem as mecânicas '+unique.join(', ')+'. Para entender os gatilhos e as condições, consulte a descrição integral de cada habilidade.':'A mecânica exata exige leitura das descrições completas das habilidades.';
 return '<section class="kit-summary"><div class="kit-pompom"><img src="./assets/official/pompom-hoyoverse.jpg" alt="Pom-Pom" loading="lazy"><div><span>RESUMO FACTUAL · POM-POM</span><h3>Passageiro, vamos entender '+esc(c.name)+'!</h3></div></div>'+
  '<p>Essa personagem pertence ao Caminho da <b>'+esc(paths[c.path]||c.path||'não informado')+'</b> e utiliza o elemento <b>'+esc(elements[c.element]||c.element||'não informado')+'</b>.</p>'+
  '<p>'+esc(mechanic)+'</p>'+
  '<p><b>Minha dica:</b> confira primeiro o Talento, depois a Perícia e a Suprema para identificar a ordem dos efeitos. Os Eidolons podem mudar essa leitura — examine cada um antes de investir.</p>'+
  '<p class="kit-warning">Este é um resumo determinístico do catálogo, não uma análise personalizada da sua conta. Sem dados completos de build e cálculos validados, não vou inventar rotação, metas de atributos nem a melhor equipe.</p>'+
  '<button type="button" data-kit-full>Ver habilidades completas</button></section>';
}
function compose(c,g){
 const skills=getSkills(c,g),ranks=getEidolons(c,g),sourceDate=g.checkedAt||'data não registrada';
 const left='<header class="kit-hero">'+
  (c.portrait?'<img class="kit-portrait" src="'+esc(image(c.portrait))+'" alt="" loading="lazy">':'')+
  '<div><span class="kit-eyebrow">CHARACTER DOSSIER / KIT LAB</span><h2>'+esc(c.name)+'</h2><p>'+esc(elements[c.element]||c.element||'')+' · '+esc(paths[c.path]||c.path||'')+' · '+esc(c.rarity)+'★</p><small>Catálogo atualizado em '+esc(sourceDate)+'</small></div></header>';
 const controls='<div class="kit-tabs" role="group" aria-label="Seções do kit">'+
  '<button type="button" data-kit-tab="skills" '+(activeTab==='skills'?'aria-pressed="true"':'')+'>Kit e rastros</button>'+
  '<button type="button" data-kit-tab="ranks" '+(activeTab==='ranks'?'aria-pressed="true"':'')+'>Eidolons E1–E6</button>'+
  '<button type="button" data-kit-summary '+(showSummary?'aria-pressed="true"':'')+'>Pom-Pom, me explica!</button></div>';
 let body='';
 if(showSummary)body=summary(c,g);
 else if(activeTab==='ranks')body='<div class="kit-ranks">'+ranks.map(e=>{
  const effect=resolveEffect(e,e.params,1);
  const art=g.eidolonArt?.[c.id]?.[e.n-1]||'';
  return '<article class="kit-rank">'+(art?'<img src="'+esc(/^https?:/.test(art)?art:image(art))+'" alt="Arte do Eidolon E'+e.n+'" loading="lazy" onerror="this.hidden=true">':'<span class="kit-rank-number">E'+e.n+'</span>')+
   '<div><span class="kit-type">EIDOLON '+e.n+'</span><h3>'+esc(e.name||'Sem título no catálogo')+'</h3><p>'+effect.html+'</p><small>ID '+esc(e.id)+'</small></div></article>';
 }).join('')+'</div>';
 else body='<div class="kit-skills">'+(skills.length?skills.map(cardSkill).join(''):'<div role="status" class="kit-warning">Nenhuma habilidade detalhada disponível para esta personagem no catálogo sincronizado.</div>')+'</div>';
 return left+controls+body+'<footer class="kit-foot">Dados: '+esc(g.source||'catálogo de jogo')+'. Valores e descrições têm origem no arquivo local versionado; podem não refletir mudanças ainda não sincronizadas. Conteúdo beta exige identificação separada.</footer>';
}
function setupUI(){
 let dlg=document.getElementById(modalId);
 if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id=modalId;dlg.setAttribute('aria-label','Kit Lab — kits completos de personagens');
 dlg.innerHTML='<div class="kit-shell"><div class="kit-topline"><div><span>ANDERUS · DADOS DO JOGO</span><h2>Kit Lab</h2></div><button type="button" class="kit-close" aria-label="Fechar Kit Lab">×</button></div>'+
  '<label for="nexus-kit-search">Pesquisar personagem</label><input type="search" id="nexus-kit-search" placeholder="Digite o nome em português"><label for="nexus-kit-select">Personagem selecionada</label>'+
  '<select id="nexus-kit-select"></select><div id="nexus-kit-content" aria-live="polite"></div></div>';
 dlg.querySelector('.kit-close').addEventListener('click',()=>dlg.close());
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
 dlg.querySelector('#nexus-kit-search').addEventListener('input',e=>fillSelect(e.target.value));
 dlg.querySelector('#nexus-kit-select').addEventListener('change',e=>{selected=e.target.value;showSummary=false;activeTab='skills';render();});
 dlg.addEventListener('input',e=>{
  if(e.target.matches('[data-skill-level]')){
   const old=document.activeElement?.id;render();document.getElementById(old)?.focus({preventScroll:true});
  }
 });
 dlg.addEventListener('click',e=>{
  const tab=e.target.closest('[data-kit-tab]');
  if(tab){activeTab=tab.dataset.kitTab;showSummary=false;render();return;}
  if(e.target.closest('[data-kit-summary]')){showSummary=!showSummary;render();return;}
  if(e.target.closest('[data-kit-full]')){showSummary=false;activeTab='skills';render();}
 });
 document.body.appendChild(dlg);return dlg;
}
async function fillSelect(filter=''){
 const select=document.getElementById('nexus-kit-select');if(!select)return;
 const g=await load(),chars=Object.values(g.chars||{}).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const list=chars.filter(c=>clean(c.name).includes(clean(filter)));
 select.replaceChildren();
 for(const c of list){const option=new Option(c.name,c.id);select.add(option);}
 if(!list.length){select.add(new Option('Nenhum personagem encontrado',''));selected='';}
 else if(!list.some(c=>c.id===selected))selected=list[0].id;
 select.value=selected;await render();
}
async function render(){
 const target=document.getElementById('nexus-kit-content');if(!target)return;
 try{
  const g=await load();const art=await loadArt();g.eidolonArt=art.characters||{};const c=g.chars?.[selected];
  if(!c){target.innerHTML='<p class="kit-warning">Selecione um personagem válido.</p>';return;}
  const levelCache={};
  target.querySelectorAll('[data-skill-level]').forEach(x=>levelCache[x.dataset.skillLevel]=x.value);
  target.innerHTML=compose(c,g);
  for(const [i,lvl] of Object.entries(levelCache)){
   const slider=target.querySelector('#nexus-kit-level-'+i);
   if(slider && Number(lvl)<=Number(slider.max))slider.value=lvl;
  }
  // Re-render descriptions to reflect preserved levels without changing inputs.
  if(!showSummary&&activeTab==='skills'){
   getSkills(c,g).forEach((skill,i)=>{
    const slider=target.querySelector('#nexus-kit-level-'+i),article=slider?.closest('.kit-skill');
    if(!article)return;
    const level=Number(slider.value),effect=resolveEffect(skill,skill.params,level);
    article.querySelector('label strong').textContent=String(level);
    article.querySelector('.kit-description').innerHTML=effect.html;
   });
  }
 }catch(error){
  target.textContent='Não foi possível abrir o catálogo: '+String(error.message||error);
 }
}
async function open(id){
 const dlg=setupUI();dlg.showModal();
 document.getElementById('nexus-kit-content').textContent='Carregando habilidades do catálogo…';
 if(id)selected=String(id);
 await fillSelect();
}
let mounted=false;
function mount(){
 if(mounted)return;mounted=true;
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-nexus-kit-for]');
  if(button)open(button.dataset.nexusKitFor);
 });
}
window.NexusKitLab={open,mount,resolveEffect,load};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();