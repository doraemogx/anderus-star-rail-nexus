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
let tracePromise=null;
function loadTraces(){
 if(!tracePromise)tracePromise=fetch('./data/character-traces.json',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw Error('Catálogo de rastros indisponível: '+r.status);return r.json();
 }).catch(e=>{tracePromise=null;throw e;});
 return tracePromise;
}
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
function renderTraces(c,g){
 const data=g.traceData||{},nodes=data.trees?.[c.id]||[],items=data.items||{};
 if(!nodes.length)return '<div class="kit-warning">Rastros não disponíveis neste catálogo. Nenhum requisito será estimado.</div>';
 const major=[],minor=[],skill=[];
 for(const node of nodes){
  const skillId=node.levelUpSkills?.[0]?.id;
  const ability=skillId?g.skills?.[skillId]:null;
  const title=node.name||ability?.name||'Rastro '+node.id;
  const isAbility=!!skillId;
  const isMajor=!isAbility&&node.desc;
  const effect=node.desc?resolveEffect(node,node.params,1):null;
  const properties=(node.levels||[]).flatMap(x=>x.properties||[]);
  const uniqueProp=properties.find(x=>x?.value!==undefined);
  const propertyText=uniqueProp?
    'Atributo: '+esc(node.name||uniqueProp.type||'Bônus')+' · '+esc(valueFormat(uniqueProp.value,/ratio|chance|rate|crit|break/i.test(uniqueProp.type||''))||String(uniqueProp.value)):
    '';
  const costs={};
  for(const level of node.levels||[])for(const row of level.materials||[]){
   costs[row.id]=(costs[row.id]||0)+Number(row.num||0);
  }
  const requirements=Object.entries(costs).map(([id,amount])=>{
   const item=items[id]||{};
   return '<li>'+(item.icon?'<img src="'+esc(image(item.icon))+'" alt="" loading="lazy" onerror="this.hidden=true">':'')+
     '<span>'+esc(item.name||'Material '+id)+'</span><strong>×'+amount.toLocaleString('pt-BR')+'</strong></li>';
  }).join('');
  const html='<article class="kit-trace"><div class="kit-trace-head">'+
   (node.icon?'<img src="'+esc(image(node.icon))+'" alt="" loading="lazy" onerror="this.hidden=true">':'')+
   '<div><span class="kit-type">'+(isAbility?'RASTRO DE HABILIDADE':isMajor?'RASTRO PRINCIPAL':'RASTRO MENOR')+'</span>'+
   '<h3>'+esc(title)+'</h3><small>Máximo: '+esc(node.maxLevel||1)+' nível(is) · ID '+esc(node.id)+'</small></div></div>'+
   (effect?'<p>'+effect.html+'</p>':propertyText?'<p>'+propertyText+'</p>':'<p>Esta ramificação aumenta o nível da habilidade indicada. Consulte o Kit para os valores exatos.</p>')+
   '<details><summary>Materiais para completar este rastro</summary>'+(requirements?'<ul class="kit-trace-costs">'+requirements+'</ul>':'<p>Sem custo de materiais listado nesta ramificação.</p>')+'</details></article>';
  (isAbility?skill:isMajor?major:minor).push(html);
 }
 return '<div class="kit-traces"><p class="kit-warning">Custos exibidos para completar cada rastro do nível inicial ao máximo, não o que falta na sua conta. Confirme quais rastros já foram desbloqueados.</p>'+
  '<h3>Rastros principais</h3>'+major.join('')+'<h3>Rastros menores</h3>'+minor.join('')+
  '<h3>Aprimoramentos de habilidades</h3>'+skill.join('')+'</div>';
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
function summary(c,g,advice){
 const skills=getSkills(c,g),descs=skills.map(x=>clean(x.desc)).join(' ');
 const resource=descs.match(/memoesp[ií]rito|euforia|quebra|ataque extra|dano cont[ií]nuo|escudo|cura|vibra[cç][oõ]es|piada/gi)||[];
 const unique=[...new Set(resource.map(x=>x.toLowerCase()))].slice(0,5);
 const mechanic=unique.length?'No kit aparecem as mecânicas '+unique.join(', ')+'. Para entender os gatilhos e as condições, consulte a descrição integral de cada habilidade.':'A mecânica exata exige leitura das descrições completas das habilidades.';
 return '<section class="kit-summary"><div class="kit-pompom"><img src="./assets/official/pompom-hoyoverse.jpg" alt="Pom-Pom" loading="lazy"><div><span>RESUMO FACTUAL · POM-POM</span><h3>Passageiro, vamos entender '+esc(c.name)+'!</h3></div></div>'+
  '<p>Essa personagem pertence ao Caminho da <b>'+esc(paths[c.path]||c.path||'não informado')+'</b> e utiliza o elemento <b>'+esc(elements[c.element]||c.element||'não informado')+'</b>.</p>'+
  '<p>'+esc(mechanic)+'</p>'+
  '<p><b>Minha dica:</b> confira primeiro o Talento, depois a Perícia e a Suprema para identificar a ordem dos efeitos. Os Eidolons podem mudar essa leitura — examine cada um antes de investir.</p>'+
  (advice?.owned?
    '<div class="kit-account-context"><h3>O Pom-Pom analisou a sua build</h3><p>Nível '+esc(advice.level)+' · E'+esc(advice.e)+'S'+esc(advice.s)+' · '+esc(advice.registered)+'/6 relíquias com dados registrados.</p>'+
     advice.notes.map(item=>'<article><b>'+esc(item.title)+'</b><p>'+esc(item.body)+'</p></article>').join('')+'</div>':
    '<p class="kit-warning">Esta personagem não está registrada no inventário deste navegador. Adicione-a à sua conta para obter alertas baseados nos seus atributos, cone e relíquias.</p>')+
  '<p class="kit-warning">As recomendações são calculadas por regras verificáveis, não simulam dano nem afirmam que uma composição é ótima sem validação.</p>'+
  '<button type="button" data-kit-full>Ver habilidades completas</button></section>';
}
function compose(c,g,advice){
 const skills=getSkills(c,g),ranks=getEidolons(c,g),sourceDate=g.checkedAt||'data não registrada';
 const left='<header class="kit-hero">'+
  (c.portrait?'<img class="kit-portrait" src="'+esc(image(c.portrait))+'" alt="" loading="lazy">':'')+
  '<div><span class="kit-eyebrow">CHARACTER DOSSIER / KIT LAB</span><h2>'+esc(c.name)+'</h2><p>'+esc(elements[c.element]||c.element||'')+' · '+esc(paths[c.path]||c.path||'')+' · '+esc(c.rarity)+'★</p><small>Catálogo atualizado em '+esc(sourceDate)+'</small></div></header>';
 const controls='<div class="kit-tabs" role="group" aria-label="Seções do kit">'+
  '<button type="button" data-kit-tab="skills" '+(activeTab==='skills'?'aria-pressed="true"':'')+'>Habilidades</button>'+
  '<button type="button" data-kit-tab="traces" '+(activeTab==='traces'?'aria-pressed="true"':'')+'>Rastros e materiais</button>'+
  '<button type="button" data-kit-tab="ranks" '+(activeTab==='ranks'?'aria-pressed="true"':'')+'>Eidolons E1–E6</button>'+
  '<button type="button" data-kit-summary '+(showSummary?'aria-pressed="true"':'')+'>Pom-Pom, me explica!</button></div>';
 let body='';
 if(showSummary)body=summary(c,g,advice);
 else if(activeTab==='traces')body=renderTraces(c,g);
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
  const g=await load();const art=await loadArt();g.eidolonArt=art.characters||{};
  if(activeTab==='traces')g.traceData=await loadTraces();
  const c=g.chars?.[selected];
  if(!c){target.innerHTML='<p class="kit-warning">Selecione um personagem válido.</p>';return;}
  const levelCache={};
  target.querySelectorAll('[data-skill-level]').forEach(x=>levelCache[x.dataset.skillLevel]=x.value);
  let advice=null;
  if(showSummary){
   try{
    const persisted=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}');
    const build=persisted?.characters?.[selected]||null;
    if(build){
     const engine=await import('./nexus-account-engine.js');
     const records=engine.normalizeRelics(persisted?.v06RelicDetails?.[selected],build.relics,g.relicSets||{});
     const cone=engine.matchCone(build.cone,g.cones||{});
     const notes=engine.buildCoach({character:c,build,records,sets:g.relicSets||{},cone,
      coneRank:cone?g.coneRanks?.[cone.id]:null,skills:getSkills(c,g)});
     advice={owned:true,level:build.level||'?',e:build.e||0,s:build.s||1,
       registered:engine.examineRelics(records).registered,
       notes:notes.filter(item=>item.kind==='warning'||item.kind==='action').slice(0,3)};
     if(!advice.notes.length)advice.notes=notes.slice(0,3);
    }else advice={owned:false};
   }catch(error){advice={owned:false};console.warn('Kit Lab: conta local indisponível para análise',error);}
  }
  target.innerHTML=compose(c,g,advice);
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