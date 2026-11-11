/* ANDERUS / Creative Theme Studio 3
 * Preserves the original Honkai character sheets, Eidolon fragments, relic
 * inspector and account state. Generated themes are explicit repository
 * artifacts, never fabricated from a palette or a character tile.
 */
(function(){
'use strict';
if(window.NexusThemeStudio3)return;
const STORE='anderus_theme_studio_generated_v3';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeText=(s,max=160)=>String(s??'').replace(/[\u0000-\u001f]/g,' ').slice(0,max);
const hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const fonts=['Cinzel','Marcellus','Georgia','DM Sans','system-ui'];
const shapes=['arc','petal','blade','sigil','crystal','theatre'];
const routes=['home','library','profile','endgame','farm','radar','tier','themes','nexia','settings'];
const routeNames={home:'Início',library:'Minha Conta',profile:'Ficha e Eidolons',endgame:'Endgame',farm:'Farm',radar:'Radar',tier:'Meta',themes:'Theme Studio',nexia:'Pom-Pom',settings:'Ajustes'};
const palette={accent:'#eccaa4',second:'#acb7db',background:'#0b1828',surface:'#18283e',text:'#f8f1e7',muted:'#b9c9d9'};
const defaults={active:null,previous:null,custom:[]};
const parsed=(()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null');}catch{return null}})();
const saved=Object.assign({},defaults,parsed?.schema===3?parsed:{});
saved.custom=Array.isArray(saved.custom)?saved.custom.slice(0,25):[];
let verifiedEidolons={};
let registry=[],tab='create',filter='owned',search='',selection='',direction='cinematic',motion='balanced',detail='complete',intent='',previewId=null,previewScreen='home',previewDevice='mobile',toastTimer=0,loading=false,root=null,scheduled=false,initialized=false;
const catalog=()=>{try{return typeof CATALOG!=='undefined'?CATALOG:[]}catch{return []}};
const character=id=>catalog().find(c=>String(c.id)===String(id))||null;
const currentTheme=()=>{try{return String(state.theme||'8001')}catch{return '8001'}};
const owned=()=>{try{return new Set(Object.keys(state.characters||{}))}catch{return new Set()}};
const chars=()=>{
 const all=catalog().filter(c=>c?.id&&c?.name);
 const featured=['future-aha',currentTheme(),...owned()];
 const unique=new Map(all.map(c=>[String(c.id),c]));
 return [...new Set(featured)].map(id=>unique.get(String(id))).filter(Boolean)
  .concat(all.filter(c=>!featured.map(String).includes(String(c.id))));
};
const characterArt=(id,kind='preview')=>{
 if(id==='future-aha')return './assets/official/aha-4-7.webp';
 try{const p=imgSrc(id,kind);return typeof p==='string'?p:''}catch{return ''}
};
const eidolons=id=>{
 // Aha's six verified in-repository fragments are reliable even offline.
 if(id==='future-aha'||id==='1511')return Array.from({length:6},(_,i)=>'./assets/official/aha-e'+(i+1)+'.webp');
 try{
  const arts=EIDO_ART[id];
  if(Array.isArray(arts)&&arts.some(Boolean))return arts.filter(Boolean).slice(0,6);
  if(arts&&typeof arts==='object')return Object.values(arts).filter(Boolean).slice(0,6);
 }catch{}
 const key=id==='future-aha'?'1511':String(id);
 return Array.isArray(verifiedEidolons[key])?verifiedEidolons[key].filter(Boolean).slice(0,6):[];
};
function readableMetadata(c){
 const item=(()=>{try{return gameData?.chars?.[c.id==='future-aha'?'1511':c.id]}catch{return null}})();
 const aha=c.id==='future-aha';
 return {name:c.name,id:String(c.id),path:item?.path||c.path||(aha?'Euforia':'A verificar'),
  element:item?.element||c.element||(aha?'Quântico':'A verificar')};
}
function normalizeTheme(v,source='custom'){
 if(!v||typeof v!=='object')return null;
 const id=String(v.id||'');
 if(!/^[a-z0-9][a-z0-9-]{2,62}$/.test(id))return null;
 const title=safeText(v.name,80),ch=String(v.characterId||'');
 const colors=v.tokens||v.colors||{};
 if(!title||!character(ch)||!['accent','second','background','surface','text','muted'].every(k=>hex(colors[k])))return null;
 const shape=shapes.includes(v.shape)?v.shape:'sigil';
 const font=fonts.includes(v.font)?v.font:'Cinzel';
 const screens={};
 for(const r of routes){
  const entry=v.screens?.[r]||{};
  screens[r]={eyebrow:safeText(entry.eyebrow||routeNames[r],75),
   headline:safeText(entry.headline||routeNames[r],100),
   accent:safeText(entry.accent||'',150)};
 }
 return {schema:3,id,name:title,characterId:ch,character:character(ch).name,
  version:safeText(v.version||'1.0',24),description:safeText(v.description,240),
  shape,font,tokens:Object.fromEntries(Object.keys(palette).map(k=>[k,colors[k]])),
  screens,source,
  hasStyles:source==='registry'&&v.hasStyles===true,
  createdAt:safeText(v.createdAt||new Date().toISOString(),40)};
}
const themes=()=>{
 const map=new Map();
 registry.forEach(t=>map.set(t.id,t));
 saved.custom.forEach(t=>{if(!map.has(t.id))map.set(t.id,t)});
 return [...map.values()];
};
const theme=id=>themes().find(t=>t.id===id);
function persist(){
 try{localStorage.setItem(STORE,JSON.stringify({schema:3,active:saved.active,previous:saved.previous,custom:saved.custom}));return true}
 catch(e){notify('Sem espaço para salvar o estúdio. Exporte um backup.','error');return false}
}
function notify(message,type='ok'){
 let el=document.getElementById('nx3-toast');
 if(!el){el=document.createElement('div');el.id='nx3-toast';el.setAttribute('role','status');document.body.appendChild(el);}
 el.textContent=message;el.dataset.type=type;el.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4500);
}
function artTag(c,klass=''){
 const src=characterArt(c.id);
 return src?'<img src="'+esc(src)+'" alt="" loading="lazy" class="'+esc(klass)+'" onerror="this.style.opacity=.12">':'<span aria-hidden="true" class="nx3-no-art">✦</span>';
}
const portraitTitle=()=>character(selection)?.name||'Escolha seu personagem';
function selectedCharacter(){
 if(!character(selection))selection=(character(currentTheme())?currentTheme():chars()[0]?.id)||'';
 return character(selection);
}
function generatedCard(t){
 const c=character(t.characterId),active=saved.active===t.id,src=c?characterArt(c.id):'';
 return '<article class="nx3-library-card" data-generated="'+esc(t.id)+'" style="--nx3-card-accent:'+t.tokens.accent+';--nx3-card-bg:'+t.tokens.background+'">'+
  '<div class="nx3-library-art">'+(src?'<img alt="" src="'+esc(src)+'" loading="lazy">':'<span>✧</span>')+'</div>'+
  '<div class="nx3-library-content"><span class="nx3-eyebrow">'+(t.source==='registry'?'TEMA PUBLICADO':'IDENTIDADE IMPORTADA')+' · v'+esc(t.version)+'</span>'+
  '<strong>'+esc(t.name)+'</strong><p>'+esc(t.description||t.character)+'</p>'+
  '<div class="nx3-theme-chips"><span>'+esc(t.shape.toUpperCase())+'</span>'+
  '<span>'+(t.hasStyles?'TRANSFORMAÇÃO COMPLETA':'TOKENS VISUAIS')+'</span>'+
  (active?'<span class="nx3-chip-active">ATIVO</span>':'')+'</div>'+
  '<div class="nx3-library-actions"><button data-action="preview" data-id="'+esc(t.id)+'">Prévia completa</button>'+
  (active?'<button data-action="deactivate" class="subtle">Desativar</button>':
   '<button data-action="apply" data-id="'+esc(t.id)+'" class="primary">Ativar</button>')+'</div></div></article>';
}
function renderGallery(){
 const list=themes();
 return '<div class="nx3-library-heading"><div><span class="nx3-eyebrow">IDENTIDADES CRIADAS PELO GPT</span>'+
 '<h2>Meu acervo</h2><p>Somente temas que foram gerados e registrados. Nenhuma aparência automática é apresentada como criação.</p></div>'+
 '<button type="button" data-action="reload">Atualizar biblioteca</button></div>'+
 (list.length?'<div class="nx3-library-grid">'+list.map(generatedCard).join('')+'</div>':
 '<div class="nx3-empty"><span>✧</span><h3>Seu primeiro universo ainda não foi criado</h3>'+
 '<p>Escolha um personagem na aba Criar. O GPT produzirá arquivos próprios para transformar todas as áreas do Nexus. Eles aparecerão aqui após a publicação.</p>'+
 '<button type="button" data-action="tab" data-id="create" class="primary">Criar identidade</button></div>')+
 '<div class="nx3-import"><div><span class="nx3-eyebrow">IMPORTAÇÃO SEGURA</span><h3>Já recebeu o manifesto do GPT?</h3>'+
 '<p>É possível importar um manifesto JSON de identidade. Para uma transformação completa com estilos exclusivos, o GPT publica os arquivos no repositório conectado; o estúdio detecta o tema no catálogo.</p></div>'+
 '<label class="nx3-upload">Importar manifesto JSON<input type="file" accept=".json,application/json" data-action="import" hidden></label></div>';
}
function renderCharacterCards(){
 const q=search.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const ownedSet=owned(),feats=new Set(['future-aha',currentTheme(),...ownedSet]);
 const list=chars().filter(c=>(filter==='all'||filter==='owned'&&ownedSet.has(String(c.id))||filter==='featured'&&feats.has(String(c.id)))&&
  (!q||c.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)));
 const displayed=list.slice(0,60);
 return (displayed.length?displayed.map(c=>
  '<button type="button" class="nx3-character '+(selection===String(c.id)?'selected':'')+'" data-action="choose" data-id="'+esc(c.id)+'" aria-pressed="'+(selection===String(c.id))+'">'+
  '<div class="nx3-portrait">'+artTag(c)+'</div><strong>'+esc(c.name)+'</strong>'+
  (ownedSet.has(String(c.id))?'<em>NA MINHA CONTA</em>':'<em>CATÁLOGO</em>')+'</button>').join(''):
 '<div class="nx3-search-empty">Nenhum personagem encontrado. Altere o filtro ou a busca.</div>')+
 (list.length>displayed.length?'<p class="nx3-hint">'+(list.length-displayed.length)+' outras opções. Refine a busca pelo nome.</p>':'');
}
function renderEidolons(){
 const arts=eidolons(selection);
 if(!arts.length)return '<p class="nx3-hint">Os fragmentos de Eidolon aparecem quando há arquivos individuais verificados disponíveis. Não usamos imagens substitutas inventadas.</p>';
 return '<div class="nx3-fragments">'+arts.map((src,i)=>
  '<div class="nx3-fragment"><img src="'+esc(src)+'" loading="lazy" alt="Fragmento de Eidolon '+(i+1)+'" onerror="this.style.opacity=0"><span>E'+(i+1)+'</span></div>').join('')+'</div>';
}
function renderCreator(){
 const c=selectedCharacter();
 const data=c?readableMetadata(c):null;
 return '<div class="nx3-step"><div class="nx3-step-heading"><span class="nx3-step-no">01</span>'+
 '<div><span class="nx3-eyebrow">A ORIGEM DA IDENTIDADE</span><h2>Escolha o personagem</h2>'+
 '<p>O estúdio começa pelo design canônico, não por um filtro de cor genérico.</p></div></div>'+
 '<div class="nx3-tools"><div class="nx3-filters" role="group" aria-label="Filtrar personagens">'+
 [['owned','Minha conta'],['featured','Destaques'],['all','Todo o catálogo']].map(([key,label])=>
 '<button type="button" data-action="filter" data-id="'+key+'" aria-pressed="'+(filter===key)+'">'+label+'</button>').join('')+'</div>'+
 '<label class="nx3-search-label"><span>Buscar personagem</span><input id="nx3-search" type="search" value="'+esc(search)+'" placeholder="Nome do personagem…" autocomplete="off" aria-label="Buscar personagem"></label></div>'+
 '<div class="nx3-character-scroll"><div class="nx3-characters" id="nx3-character-list">'+renderCharacterCards()+'</div></div></div>'+
 '<div class="nx3-identity">'+
 '<div class="nx3-identity-art">'+(c?artTag(c):'')+'<span>ARTE DA PERSONAGEM</span></div>'+
 '<div class="nx3-identity-body"><span class="nx3-eyebrow">PERSONAGEM SELECIONADO</span><h2>'+esc(c?.name||'Selecione no catálogo')+'</h2>'+
 (data?'<p>'+esc(data.path)+' · '+esc(data.element)+' · ID '+esc(data.id)+'</p>':'')+
 '<p>Uma criação própria precisa respeitar silhueta, figurino, cenário, símbolos e o tom narrativo deste personagem. Os detalhes específicos serão pesquisados pelo GPT em fontes verificáveis.</p>'+
 '<div class="nx3-fragment-heading">GALERIA DE EIDOLONS · REFERÊNCIAS EXISTENTES</div>'+renderEidolons()+'</div></div>'+
 '<div class="nx3-step"><div class="nx3-step-heading"><span class="nx3-step-no">02</span><div><span class="nx3-eyebrow">DIREÇÃO DE ARTE</span><h2>O que o GPT deve criar?</h2>'+
 '<p>Essas escolhas orientam a pesquisa e a composição. Não são modelos pré-fabricados.</p></div></div>'+
 '<div class="nx3-options"><div><span class="nx3-field-title">Linguagem visual</span><div class="nx3-choice-grid">'+
 [['cinematic','Cinematográfica','Composição narrativa e artes oficiais'],['elegant','Elegante','Hierarquia refinada e poucos ruídos'],['expressive','Expressiva','Ornamentos e identidade marcantes']].map(([id,title,desc])=>
 '<button data-action="direction" data-id="'+id+'" aria-pressed="'+(direction===id)+'"><strong>'+title+'</strong><small>'+desc+'</small></button>').join('')+
 '</div></div><div><span class="nx3-field-title">Movimento e efeitos</span><div class="nx3-choice-grid">'+
 [['quiet','Discretos','Foco total na leitura'],['balanced','Equilibrados','Microinterações contextuais'],['theatrical','Teatrais','Animações marcantes sem prejudicar o uso']].map(([id,title,desc])=>
 '<button data-action="motion" data-id="'+id+'" aria-pressed="'+(motion===id)+'"><strong>'+title+'</strong><small>'+desc+'</small></button>').join('')+'</div></div></div>'+
 '<label class="nx3-field-title" for="nx3-intent">Observações para o GPT (opcional)</label>'+
 '<textarea id="nx3-intent" rows="3" maxlength="700" placeholder="Ex.: fundo com forma cósmica, textura do figurino, ícones inspirados na arma e uma entrada cinematográfica…">'+esc(intent)+'</textarea></div>'+
 '<div class="nx3-step nx3-generation"><div class="nx3-step-heading"><span class="nx3-step-no">03</span>'+
 '<div><span class="nx3-eyebrow">GERAR E PUBLICAR</span><h2>Criação exclusiva com o GPT</h2>'+
 '<p>Briefing técnico + direção de arte para todas as áreas do Nexus. Nada muda no site antes da publicação e dos testes.</p></div></div>'+
 '<div class="nx3-deliverables"><span>Identidade original para o personagem</span><span>10 áreas completas</span>'+
 '<span>Eidolons preservados</span><span>Mobile e desktop</span><span>Testes + versões reversíveis</span></div>'+
 '<div class="nx3-brief-head"><strong>Seu briefing completo</strong><button data-action="copy">Copiar</button></div>'+
 '<pre class="nx3-brief" id="nx3-brief"></pre>'+
 '<div class="nx3-generation-actions"><button type="button" class="nx3-primary" data-action="chatgpt">✦ Criar este tema no ChatGPT</button>'+
 '<button type="button" data-action="download">Salvar briefing</button></div>'+
 '<p class="nx3-hint">Ao tocar em Criar, o briefing é copiado e o ChatGPT é aberto. Cole a mensagem na conversa com o GitHub conectado. O site não se passa por uma integração automática que ainda não existe.</p></div>';
}
function promptText(){
 const c=selectedCharacter();if(!c)return '';
 const info=readableMetadata(c);
 const directionMap={cinematic:'cinematográfica com atmosfera canônica',elegant:'sofisticada, contida e editorial',expressive:'dramática, expressiva, com iconografia própria'};
 const motionMap={quiet:'mínimo',balanced:'moderado e contextual',theatrical:'cinematográfico com alternativa reduzida'};
 const frames=eidolons(c.id).length;
 return [
 'ANDERUS STAR RAIL NEXUS — CRIAÇÃO EXCLUSIVA DE THEME STUDIO',
 'PERSONAGEM: '+info.name+' (ID '+info.id+')',
 'ELEMENTO/CAMINHO: '+info.element+' / '+info.path+' (validar na fonte oficial)',
 'DIREÇÃO: '+directionMap[direction]+'. MOVIMENTO: '+motionMap[motion]+'.',
 intent?'OBSERVAÇÕES DO PROPRIETÁRIO: '+intent:'',
 '',
 'OBJETIVO: desenvolver e publicar UMA IDENTIDADE VISUAL REALMENTE NOVA para o personagem no Nexus ORIGINAL, NÃO no /v2/.',
 'O objetivo não é trocar cor de fundo nem adicionar uma arte solta. O tema precisa transformar toda a experiência, com identidade única e consistência.',
 '',
 'PESQUISA OBRIGATÓRIA: consulte imagens oficiais do personagem, splash art, figurino, caminho, elemento, ornamentos, cenários, lore, formas alternativas, trailers e fragmentos E1–E6 existentes.',
 'Não invente personagens ou artes oficiais. Não altere nomes canônicos e não trate rumor/beta como oficial.',
 'O repositório está em doraemogx/anderus-star-rail-nexus. Inspecione a arquitetura original, classes CSS e elementos existentes. Preserve todos os comportamentos e a conta.',
 '',
 'SISTEMA DE DESIGN SOB MEDIDA:',
 '- Defina uma direção de arte documentada, símbolos originais baseados em referências verificadas, paleta, tipografia, títulos e microtipografia, geometria de molduras, superfícies e iconografia.',
 '- Crie ornamentos vetoriais/CSS e fundos por página, com presença real do personagem. Sem UI roxo/dourado genérica.',
 '- Utilize artes oficiais e fragmentos E1–E6 existentes, com object-fit adequado. Preserve as galerias de Eidolons, retratos, cones e relíquias.',
 '- Crie animações e transições adequadas ao personagem; respeite reduced-motion e performance em celulares.',
 '- Inclua estados hover, active, disabled, loading, erro, vazio, alertas, menus, modais, formulários e tabelas.',
 '',
 'COBERTURA COMPLETA: Home, Minha Conta, ficha do personagem, kit, Eidolons, seis relíquias, importação HoYoLAB/OCR, Farm Planner, Endgame e chefes, Radar, Meta, Pom-Pom, Theme Studio e Configurações.',
 'Crie componentes e composições por tela, NÃO apenas tokens globais. Implementação MOBILE FIRST com prioridade à experiência de toque e navegação com uma mão. Teste 320, 360, 390, 430, 768, 1024, 1440 e 1920 px.',
 '',
 'PADRÃO DE ENTREGA PARA O NOVO THEME STUDIO:',
 '1. Crie themes/generated/<slug>/theme.json no schema 3; id slug alfanumérico com hífen; name; characterId; version; description;',
 '   tokens: accent, second, background, surface, text, muted (todas cores HEX #RRGGBB); shape: arc|petal|blade|sigil|crystal|theatre; font: Cinzel|Marcellus|Georgia|DM Sans|system-ui;',
 '   screens: para home,library,profile,endgame,farm,radar,tier,themes,nexia,settings: eyebrow, headline e accent;',
 '   hasStyles: true e createdAt em ISO.',
 '2. Implemente themes/generated/<slug>/theme.css com TODAS as transformações reais, escopadas por .app[data-nx3-theme="<slug>"], para não afetar outros temas.',
 '3. Registre o tema em themes/generated/index.json com o caminho do manifest e o slug (não liste temas que não existem).',
 '4. Capture telas reais, faça auditoria visual por rota e verifique overflow/contraste; Preserve export/import e dados da conta.',
 '5. Rode os testes no Chromium, crie uma PR e só publique após aprovação técnica; informe o endereço final. Não delegue GitHub ao proprietário.',
 '',
 'SEGURANÇA: não execute CSS/JS arbitrário de JSON do usuário. O tema CSS é arquivo revisado no repositório; o manifesto passa por validação de schema.',
 'A seleção, a prévia e o cancelamento devem deixar personagens, builds, histórico, relíquias, cones e dados sincronizados intocados.',
 'Não ofereça opção Original vs ChatGPT. Este Theme Studio lista apenas as criações efetivamente publicadas ou manifestos importados.',
 'Se o tema de '+info.name+' tiver '+frames+' fragmentos E1–E6 já disponíveis, PRESERVE-OS e melhore apenas a apresentação.',
 'REVISÃO FINAL: entregue o site original visualmente melhor, sem quebrar aquilo que já funciona.'
 ].filter(Boolean).join('\n');
}
function previewMock(t){
 const c=character(t.characterId),img=c?characterArt(c.id):'';
 const route=t.screens?.[previewScreen]||{};
 const stats=['PV','ATQ','DEF','VEL'],screens={
  home:'Acesso rápido • Meu universo',profile:'Ficha de personagem • Eidolons',endgame:'Chefes • Mecânicas • Equipes',farm:'Rotas de farm • Objetivos',themes:'Criatividade • Temas publicados'
 };
 const art=img?'<img alt="" src="'+esc(img)+'">':'';
 return '<div class="nx3-mock '+(previewDevice==='desktop'?'wide':'narrow')+'" data-shape="'+esc(t.shape)+'" style="--nx3-mock-accent:'+t.tokens.accent+';--nx3-mock-surface:'+t.tokens.surface+';--nx3-mock-bg:'+t.tokens.background+';--nx3-mock-text:'+t.tokens.text+';--nx3-mock-second:'+t.tokens.second+'">'+
 '<div class="nx3-mock-header"><span>✦</span><strong>ANDERUS<small>STAR RAIL NEXUS</small></strong><span>☷</span></div>'+
 '<div class="nx3-mock-hero"><div><small>'+esc(route.eyebrow||routeNames[previewScreen])+'</small>'+
 '<h3>'+esc(route.headline||t.character)+'</h3><p>'+esc(route.accent||screens[previewScreen]||'Seu universo, sua jornada.')+'</p></div>'+art+'</div>'+
 (previewScreen==='profile'?'<div class="nx3-mock-eido">'+[1,2,3,4,5,6].map(i=>'<span>E'+i+'</span>').join('')+'</div>':
 '<div class="nx3-mock-panels"><span>'+esc(previewScreen==='endgame'?'Equipe A':previewScreen==='farm'?'Recursos':'Personagens')+'</span><span>'+esc(previewScreen==='endgame'?'Equipe B':previewScreen==='farm'?'Meta':'Progresso')+'</span></div>')+
 '<div class="nx3-mock-tabs"><span>✦ Início</span><span>◈ Minha Conta</span><span>✧ Endgame</span></div></div>';
}
function renderLab(){
 const t=theme(previewId)||theme(saved.active)||themes()[0];
 if(!t)return '<div class="nx3-lab-top"><span class="nx3-eyebrow">LABORATÓRIO DE EXPERIÊNCIA</span><h2>Experimente um tema de verdade</h2>'+
 '<p>A prévia só fica disponível depois que o GPT publicar uma identidade. Não mostramos layouts inventados como se fossem temas prontos.</p></div>'+
 '<div class="nx3-empty"><span>◇</span><h3>Nenhuma criação disponível</h3>'+
 '<p>Comece pela aba Criar e gere a primeira identidade.</p><button class="primary" data-action="tab" data-id="create">Criar agora</button></div>';
 const chooser=themes().map(x=>'<option value="'+esc(x.id)+'" '+(x.id===t.id?'selected':'')+'>'+esc(x.name)+'</option>').join('');
 return '<div class="nx3-lab-top"><div><span class="nx3-eyebrow">LABORATÓRIO DE EXPERIÊNCIA</span><h2>Compare por tela</h2>'+
 '<p>Prévia de composição e identidade; o teste imersivo permite navegar no Nexus real antes de aplicar.</p></div>'+
 '<select id="nx3-preview-choose" aria-label="Selecionar tema gerado">'+chooser+'</select></div>'+
 '<div class="nx3-lab-toolbar"><div class="nx3-scene-tabs" role="tablist" aria-label="Páginas para simular">'+
 [['home','Início'],['profile','Personagem'],['endgame','Endgame'],['farm','Farm'],['themes','Temas']].map(([r,name])=>
 '<button type="button" data-action="screen" data-id="'+r+'" role="tab" aria-selected="'+(previewScreen===r)+'">'+name+'</button>').join('')+
 '</div><div class="nx3-device-switch" role="group" aria-label="Formato da prévia">'+
 '<button data-action="device" data-id="mobile" aria-pressed="'+(previewDevice==='mobile')+'">Celular</button>'+
 '<button data-action="device" data-id="desktop" aria-pressed="'+(previewDevice==='desktop')+'">Desktop</button></div></div>'+
 '<div class="nx3-lab-stage">'+previewMock(t)+'</div>'+
 '<div class="nx3-lab-footer"><div><strong>'+esc(t.name)+'</strong><p>'+esc(t.description||t.character)+
 (t.hasStyles?' · Estilos completos publicados':' · Manifesto de tokens: ainda não é uma transformação completa')+'</p></div>'+
 '<div class="nx3-lab-actions"><button data-action="immersive" data-id="'+esc(t.id)+'">Testar no hub</button>'+
 '<button class="primary" data-action="apply" data-id="'+esc(t.id)+'">Aplicar identidade</button></div></div>';
}
function render(){
 return '<div class="nx3-heading">'+
 '<div class="nx3-hero-copy"><span class="nx3-kicker">ANDERUS / CREATIVE LAB</span>'+
 '<h1>Theme <em>Studio</em></h1>'+
 '<p>Uma identidade nascida da história do seu personagem. Arte, navegação, molduras e movimento criados pelo GPT — sem abandonar a experiência que você já ama.</p>'+
 '<div class="nx3-hero-facts"><span>PERSONAGENS OFICIAIS</span><span>10 ÁREAS DO HUB</span><span>100% MOBILE-FIRST</span></div></div>'+
 '<div class="nx3-hero-visual">'+artTag(selectedCharacter()||{id:'8001'})+'<div class="nx3-orbit" aria-hidden="true">✦</div></div></div>'+
 '<nav class="nx3-nav" aria-label="Etapas do Theme Studio">'+
 [['create','01 · Criar'],['library','02 · Meu acervo'],['lab','03 · Laboratório']].map(([key,label])=>
 '<button type="button" data-action="tab" data-id="'+key+'" aria-current="'+(tab===key?'page':'false')+'">'+label+'</button>').join('')+
 '</nav><div class="nx3-body">'+
 (tab==='create'?renderCreator():tab==='library'?renderGallery():renderLab())+
 '</div><footer class="nx3-footer"><span>✧ A criação usa materiais oficiais verificados e respeita a identidade de Honkai: Star Rail.</span>'+
 '<span>As alterações visuais ficam separadas de personagens, Eidolons, relíquias e builds.</span></footer>';
}
function refresh(){
 const target=document.querySelector('#stage .v06-themes');
 if(!target){root=null;return;}
 if(!root||!root.isConnected||root.parentElement!==target.parentElement){
  root=document.createElement('div');root.className='nx3-studio';root.setAttribute('aria-label','Theme Studio GPT');
  target.insertAdjacentElement('beforebegin',root);
  root.addEventListener('click',onClick);
  root.addEventListener('input',onInput);
  root.addEventListener('change',onChange);
 }
 root.innerHTML=render();
 const pre=root.querySelector('#nx3-brief');if(pre)pre.textContent=promptText();
}
function resetHorizontal(){
 requestAnimationFrame(()=>{
  const scrollers=[document.scrollingElement,document.getElementById('stage'),root?.parentElement,
   root?.parentElement?.parentElement];
  for(const el of scrollers)if(el?.scrollLeft)el.scrollLeft=0;
 });
}
function update(){
 if(root?.isConnected)refresh();
 resetHorizontal();
}
function onInput(event){
 if(event.target.id==='nx3-search'){
  const el=event.target;const pos=el.selectionStart;
  search=el.value;const list=root.querySelector('#nx3-character-list');
  if(list)list.innerHTML=renderCharacterCards();
 }else if(event.target.id==='nx3-intent'){intent=event.target.value;const pre=root.querySelector('#nx3-brief');if(pre)pre.textContent=promptText();}
}
function onChange(event){
 if(event.target.id==='nx3-preview-choose'){previewId=event.target.value;update();return;}
 if(event.target.matches('input[type=file][data-action=import]'))importFile(event.target);
}
function onClick(event){
 const btn=event.target.closest('button[data-action]');if(!btn||!root?.contains(btn))return;
 const action=btn.dataset.action,id=btn.dataset.id;
 if(action==='tab'){tab=id;refresh();root.scrollIntoView({block:'start',behavior:'instant'});}
 else if(action==='filter'){filter=id;update();}
 else if(action==='choose'){selection=id;update();}
 else if(action==='direction'){direction=id;update();}
 else if(action==='motion'){motion=id;update();}
 else if(action==='screen'){previewScreen=id;update();}
 else if(action==='device'){previewDevice=id;update();}
 else if(action==='copy')copyPrompt();
 else if(action==='download')downloadPrompt();
 else if(action==='chatgpt')openGPT();
 else if(action==='reload')reload();
 else if(action==='preview'){previewId=id;tab='lab';update();}
 else if(action==='apply')activate(id,true);
 else if(action==='deactivate')activate(null,true);
 else if(action==='immersive')immersive(id);
}
async function copyPrompt(){
 const content=promptText();if(!content)return;
 try{await navigator.clipboard.writeText(content);notify('Briefing do personagem copiado.');}
 catch{downloadPrompt();notify('Copiar não foi permitido. O briefing foi salvo em um arquivo.');}
}
function downloadPrompt(){
 const content=promptText();if(!content)return;
 const blob=new Blob([content],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.download='anderus-tema-'+String(selection||'personagem')+'.txt';a.href=url;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function openGPT(){
 const win=window.open('https://chatgpt.com/','_blank','noopener,noreferrer');
 copyPrompt();
 if(!win)notify('Briefing copiado. Abra o ChatGPT e cole na conversa.');
 else notify('ChatGPT aberto. Cole o briefing copiado para iniciar a criação.');
}
async function importFile(input){
 const file=input.files?.[0];if(!file)return;
 try{
  if(file.size>45000)throw Error('Manifesto excede 45 KB');
  const raw=JSON.parse(await file.text()),t=normalizeTheme(raw,'custom');
  if(!t)throw Error('Manifesto incompatível. Peça ao GPT o schema 3 documentado.');
  saved.custom=saved.custom.filter(x=>x.id!==t.id).concat(t).slice(-25);
  if(persist()){notify('Manifesto importado. Você já pode conferir no Laboratório.');tab='library';refresh();}
 }catch(e){notify('Não foi possível importar: '+e.message,'error')}
 input.value='';
}
async function reload(){
 await loadRegistry();notify(registry.length+' identidade(s) publicada(s) identificada(s).');refresh();
}
async function loadRegistry(){
 try{
  const response=await fetch('./themes/generated/index.json',{cache:'no-store'});
  if(!response.ok)throw Error('Catálogo indisponível');
  const data=await response.json(),items=Array.isArray(data?.themes)?data.themes:[];
  const filtered=items.filter(x=>x&&/^[a-z0-9][a-z0-9-]{2,62}$/.test(String(x.id||''))).slice(0,40);
  const result=await Promise.all(filtered.map(async x=>{
   try{
    const path='./themes/generated/'+x.id+'/theme.json';
    const r=await fetch(path,{cache:'no-store'});if(!r.ok)return null;
    const t=normalizeTheme(await r.json(),'registry');
    return t?.id===x.id?t:null;
   }catch{return null;}
  }));
  registry=result.filter(Boolean);
  if(saved.active&&!theme(saved.active)){saved.active=null;persist();}
 }catch(e){registry=[];}
}
function activate(id,persistChange){
 if(id!==null&&!theme(id)){notify('O tema não está disponível no catálogo.','error');return;}
 const current=saved.active;
 if(persistChange){
  if(current!==id){saved.previous=current;saved.active=id;if(!persist()){saved.active=current;return;}}
 }
 applyTheme(id);
 if(root?.isConnected)refresh();
 if(persistChange)notify(id?'Tema aplicado. Fichas e equipamentos preservados.':'Identidade desativada. Visual anterior do Nexus preservado.');
}
let loadedStyle='';
function applyTheme(id){
 const app=document.querySelector('.app');if(!app)return;
 const skin=theme(id);
 const sheet=document.getElementById('nx3-generated-theme-css');
 if(sheet)sheet.remove();
 app.removeAttribute('data-nx3-theme');app.removeAttribute('data-nx3-shape');app.classList.remove('nx3-skin');
 for(const k of Object.keys(palette))app.style.removeProperty('--nx3-'+k);
 app.style.removeProperty('--nx3-art');app.style.removeProperty('--nx3-font');
 if(!skin)return;
 app.dataset.nx3Theme=skin.id;app.dataset.nx3Shape=skin.shape;app.classList.add('nx3-skin');
 for(const [k,v]of Object.entries(skin.tokens))app.style.setProperty('--nx3-'+k,v);
 const src=characterArt(skin.characterId);
 if(src&&/^https?:\/\//.test(src)||src?.startsWith('./'))app.style.setProperty('--nx3-art','url("'+src.replace(/["\\]/g,'')+'")');
 app.style.setProperty('--nx3-font',skin.font);
 if(skin.hasStyles){
  const link=document.createElement('link');link.id='nx3-generated-theme-css';link.rel='stylesheet';
  link.href='./themes/generated/'+skin.id+'/theme.css';document.head.appendChild(link);
 }
}
function immersive(id){
 if(!theme(id))return;
 if(document.getElementById('nx3-trybar'))return;
 const from=saved.active;
 previewId=id;applyTheme(id);
 const bar=document.createElement('div');bar.id='nx3-trybar';bar.setAttribute('role','region');bar.setAttribute('aria-label','Prévia do tema');
 bar.innerHTML='<span><strong>PRÉVIA · '+esc(theme(id).name)+'</strong><small>Nenhum dado foi alterado</small></span>'+
 '<button type="button" class="nx3-try-cancel">Cancelar</button><button type="button" class="nx3-try-apply">Aplicar</button>';
 document.body.appendChild(bar);
 const close=applied=>{if(applied){saved.previous=from;saved.active=id;if(!persist()){saved.active=from;applyTheme(from);}}else applyTheme(from);
  bar.remove();if(root?.isConnected)refresh();};
 bar.querySelector('.nx3-try-cancel').addEventListener('click',()=>close(false));
 bar.querySelector('.nx3-try-apply').addEventListener('click',()=>close(true));
 if(typeof route==='function')route('home');
}
let previouslyApplied;
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{
  scheduled=false;const studio=document.querySelector('#stage .v06-themes');
  if(studio&&(!root||!root.isConnected))refresh();
  const current=document.querySelector('.app');
  if(current&&saved.active!==previouslyApplied){previouslyApplied=saved.active;applyTheme(saved.active);}
 });
}
function boot(){
 if(initialized)return;initialized=true;
 selectedCharacter();
 const observe=new MutationObserver(schedule);
 const app=document.querySelector('.app')||document.body;
 observe.observe(app,{childList:true,subtree:true});
 schedule();
 fetch('./data/eidolon-art.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null)
  .then(data=>{if(data?.characters&&typeof data.characters==='object'){verifiedEidolons=data.characters;if(root?.isConnected&&tab==='create')refresh();}})
  .catch(()=>{});
 loadRegistry().then(()=>{applyTheme(saved.active);schedule();if(root?.isConnected)refresh()});
}
window.NexusThemeStudio3={version:'3.0',refresh:schedule,generated:themes,
 getPrompt:promptText,active:()=>saved.active,preview:immersive,apply:id=>activate(id,true)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();