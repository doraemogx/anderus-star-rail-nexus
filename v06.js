(function installNexusV06(){
  const base={
    home:home,library:library,profile:profile,profileOverview:profileOverview,
    profileEidolons:profileEidolons,profileKit:profileKit,profileRelics:profileRelics,
    endgame:endgame,radar:radar,themes:themes,settings:settings,render:render,
    applyTheme:applyTheme,showEido:showEido,showSkill:showSkill,showModal:showModal
  };
  // Reuse the artwork already embedded in v0.5; v0.6 has no broken relative asset paths.
  const _v06Old = document.createElement('div'); _v06Old.innerHTML = base.home();
  const _v06OriginalAssets = {};
  _v06OriginalAssets['caelus-concept'] = _v06Old.querySelector('.astral-character-art img')?.getAttribute('src') || '';
  _v06OriginalAssets['pompom'] = _v06Old.querySelector('.pom-guide img,.pompom-home .pom-guide img')?.getAttribute('src') || '';
  for (const k of ['account','build','endgame','farm','warp','beta']){
    const el = _v06Old.querySelector('.module-tile.tile-'+k+' .module-art');
    const css = el?.style.backgroundImage || '';
    const pos=css.indexOf('('),end=css.lastIndexOf(')');
    _v06OriginalAssets[k] = pos>=0 && end>pos ? css.slice(pos+1,end).replace(/^['\"]|['\"]$/g,'') : '';
  }
  const v06Asset=(key)=>_v06OriginalAssets[key] || '';
  const heroOfficial='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/image/character_portrait/8001.png';
  const ahaOfficial='https://i.gachabase.net/mZQZSbIAQyJXbDElL_RE2AwSR7C4X0pOBxgQ3ybCNnA/q:50/f:webp/plain/hsr/assets/f8b5630e85022ab8b2761e4e3f614b42.png';
  const safe=s=>esc(s);
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
  const ownerKeys=()=>Object.keys(state.characters||{}).filter(id=>!!state.characters[id]&&!!CATALOG.find(c=>c.id===id));
  const ownedCount=()=>ownerKeys().length;
  const colors=[
    ['#efbc78','#8c5caa','#0c1730'],['#f1a1c8','#894ca5','#21152f'],['#fc9275','#9a2928','#201017'],
    ['#6bd2d3','#3485ab','#0b2131'],['#c2b4fa','#6158b9','#14162e'],['#ffe5a5','#a97851','#261a20'],
    ['#7cdea2','#36928e','#0c2222'],['#f09aa5','#7c5377','#1e182b'],['#8db9f0','#536fbc','#121d36']
  ];
  function stableIndex(id){let n=0;for(const c of String(id))n=(n*31+c.charCodeAt(0))>>>0;return n;}
  const selectLook=(id)=>{
    const c=lookup(id),n=norm(c.name),idx=stableIndex(id);
    let group='astral',text='✦',font="'Marcellus', Georgia, serif",shape='orbit';
    if(/mortenax|blade|acheron|boothill|hysilens/.test(n)){group='forge';text='⚔';font="'Barlow Condensed', 'Arial Narrow', sans-serif";shape='blade';}
    else if(/evanescia|robin|cyrene|sparkle|ruan mei|vanessa|march|7 de marco/.test(n)){group='bloom';text='✿';font="'Marcellus',Georgia,serif";shape='petal';}
    else if(/pearl|hyacine|dan heng|jingliu|black swan/.test(n)){group='tide';text='❖';font="'Cinzel',Georgia,serif";shape='wave';}
    else if(/noite eterna|castorice|the herta|a herta/.test(n)){group='lunar';text='☾';font="'Cinzel',Georgia,serif";shape='moon';}
    else if(/loba prateada|silver wolf|sparxie/.test(n)){group='hacker';text='⌘';font="'Outfit',Arial,sans-serif";shape='pixel';}
    else if(/aha|nihilux/.test(n)){group='carnival';text='✧';font="'Marcellus',Georgia,serif";shape='theatre';}
    else if(/phainon|sunday|aventurino|jing yuan/.test(n)){group='solar';text='✷';font="'Cinzel',Georgia,serif";shape='sun';}
    // Every playable character gets a full visual archetype from their game element,
    // with a distinct portrait, accent variation, typography, crest and panel geometry.
    if(group==='astral' && !id.startsWith('800')){
      const element=gameData.chars?.[id]?.element||'';
      const path=gameData.chars?.[id]?.path||'';
      const target=({Fire:'forge',Ice:'lunar',Wind:'tide',Lightning:'hacker',Quantum:'carnival',Imaginary:'solar',Physical:'bloom'})[element]
        ||({Remembrance:'lunar',Elation:'carnival',Nihility:'hacker',Harmony:'bloom',Destruction:'forge',Abundance:'tide'})[path]||['tide','forge','bloom','solar','lunar','hacker','carnival'][idx%7];
      group=target;
      const m={forge:['⚔',"'Barlow Condensed', sans-serif",'blade'],lunar:['☾',"'Cinzel', serif",'moon'],tide:['❖',"'Cinzel', serif",'wave'],hacker:['⌘',"'Outfit', sans-serif",'pixel'],carnival:['✧',"'Marcellus', serif",'theatre'],solar:['✷',"'Cinzel', serif",'sun'],bloom:['✿',"'Marcellus', serif",'petal']};
      [text,font,shape]=m[group];
    }
    let color=colors[idx%colors.length];
    if(group==='forge')color=['#f4a38d','#992e39','#230d15'];
    if(group==='bloom')color=['#f9aed0','#9d6198','#211627'];
    if(group==='tide')color=['#a9d9e6','#477eb1','#0b202d'];
    if(group==='lunar')color=['#c4bcf7','#7165aa','#101327'];
    if(group==='hacker')color=['#9cebd8','#4774a8','#0a1725'];
    if(group==='carnival')color=['#fec3d0','#bb405d','#261125'];
    if(group==='solar')color=['#edc78b','#ac7339','#251b19'];
    if(id==='8001')color=['#efd0a0','#8aa9d3','#071b2c'];
    return {group,text,font,shape,color,art:id==='future-aha'?ahaOfficial:imgSrc(id,'portrait')||heroOfficial,name:c.name,id};
  };
  state.v06Art||={};state.v06AccountNotes||={};state.v06Goal||={id:'future-aha',target:'E0S1'};
  let uploader={file:null,preview:'',relImages:[],identifiedId:'',ocrText:'',eidolon:null,superimposition:null,cone:'',busy:false,sourceValid:false};
  const pathImage=(id)=>{const c=gameData.chars[id];const path=c?.path||'';return path?'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/path/'+path+'.png':'';};
  const genCard=(label,value,icon)=>'<div class="v06-metric"><span class="v06-metric-icon">'+icon+'</span><strong>'+safe(value)+'</strong><small>'+safe(label)+'</small></div>';
  const pomCard=(title,body,meta='CONSELHO DO EXPRESSO')=>'<aside class="v06-pom-tip"><img loading="lazy" src="'+v06Asset('pompom')+'" alt="Pom-Pom" onerror="this.src=\'assets/nexia.webp\'"><div><div class="v06-kicker">✦ '+safe(meta)+'</div><b>'+safe(title)+'</b><p>'+safe(body)+'</p></div></aside>';
  const subhead=(k,t,p)=>'<header class="v06-pagehead"><span class="v06-kicker">'+safe(k)+'</span><h1>'+safe(t)+'</h1><p>'+safe(p)+'</p></header>';
  const tile=(ico,title,caption,go,kind,index)=>{
    const art=v06Asset(['account','build','endgame','farm','warp','beta'][index]);
    return '<button class="v06-tile v06-tile-'+kind+'" onclick="'+go+'"><span class="v06-tile-glow"></span><span class="v06-tile-deco">'+(ico.startsWith('image:')?'<img src="'+ico.slice(6)+'" alt="">':ico)+'</span><span class="v06-tile-art" style="background-image:url(\''+art+'\')"></span><strong>'+safe(title)+'</strong><small>'+safe(caption)+'</small><span class="v06-tile-arrow">↗</span></button>';
  };
  function countAccount(){return ownerKeys().reduce((a,id)=>a+Number(state.characters[id]?.e||0),0);}
  function routeBuild(){libraryFilter='owned';route('library');}
  window.v06RouteBuild=routeBuild;
  function home06(){
    const look=selectLook(state.theme),isDefault=state.theme==='8001',n=ownedCount();
    const goal=state.v06Goal?.id||'future-aha',p=lookup(goal),planned=state.farm&&Object.values(state.farm).some(v=>Number(v.need)>0);
    const need=Object.values(state.farm||{}).reduce((a,v)=>a+(Number(v.need)||0),0);
    const have=Object.values(state.farm||{}).reduce((a,v)=>a+Math.min(Number(v.need)||0,Number(v.have)||0),0);
    const progress=need?Math.round(100*have/need):null;
    const heroArt=isDefault?v06Asset('caelus-concept'):(state.v06Art?.[state.theme]==='eidolon'&&EIDO_ART[state.theme]?.[5]?EIDO_ART[state.theme][5]:(state.v06Art?.[state.theme]==='preview'?imgSrc(state.theme,'preview'):look.art));
    const mod=[
      ['image:'+STR+'icon/path/Explore.png','Minha Conta','Personagens, prints e progresso',"libraryFilter='owned';route('library')",'account'],
      ['image:'+STR+'icon/path/Harmony.png','Build Lab','Relíquias, cones e ajustes','v06RouteBuild()','build'],
      ['image:'+STR+'icon/path/Destruction.png','Endgame','MOC, PF, AS e Arbitragem',"route('endgame')",'endgame'],
      ['image:'+STR+'icon/path/Abundance.png','Farm Planner','Materiais, rastros e ascensão',"route('farm')",'farm'],
      ['image:'+STR+'icon/path/Elation.png','Warp Advisor','Banners e prioridades',"route('radar')",'warp'],
      ['image:'+STR+'icon/path/Nihility.png','Beta & Kits','Novidades e multiplicadores',"v06OpenFuture()",'beta']
    ];
    return '<div class="v06-home">'+
      '<section class="v06-hero" aria-label="Jornada do Expresso Astral"><div class="v06-celestial"></div>'+
        '<div class="v06-hero-art" style="background-image:url(\''+safe(heroArt)+'\')"></div>'+
        '<div class="v06-hero-vignette"></div><div class="v06-hero-top"><span>✦ ARQUIVO DO DESBRAVADOR</span><span>ESTAÇÃO ASTRAL · v0.6</span></div>'+
        '<div class="v06-hero-copy"><span class="v06-hero-id">✦ '+safe(isDefault?'CAELUS · DESBRAVADOR':look.name.toUpperCase())+'</span>'+
        '<h1>Seu universo.<br><em>Seu próximo salto.</em></h1>'+
        '<p>Construa sua conta, domine as mecânicas e planeje sua próxima jornada.</p>'+
        '<div class="v06-hero-buttons"><button onclick="v06StartImport()">＋ Importar print</button><button class="ghost" onclick="libraryFilter=\'owned\';route(\'library\')">Minha conta ↗</button></div></div>'+
      '</section>'+
      '<div class="v06-divider"><span>✧</span></div>'+
      '<section class="v06-brief"><div class="v06-sectionline"><div><span class="v06-kicker">CENTRO DE COMANDO</span><h2>Escolha seu destino</h2></div><span>06 MÓDULOS</span></div>'+
        '<div class="v06-tile-grid">'+mod.map((t,i)=>tile(t[0],t[1],t[2],t[3],t[4],i)).join('')+'</div></section>'+
      '<section class="v06-snapshot"><div class="v06-sectionline"><div><span class="v06-kicker">SEU PROGRESSO</span><h2>Registro do Expresso</h2></div><button onclick="libraryFilter=\'owned\';route(\'library\')">Ver conta ↗</button></div>'+
         '<div class="v06-stats">'+genCard('Personagens',n,'♧')+genCard('Eidolons',countAccount(),'✦')+genCard('Nível 80',ownerKeys().filter(k=>state.characters[k]?.level>=80).length,'✧')+'</div></section>'+
      '<section class="v06-feature-panel v06-goal"><div class="v06-panel-heading"><span>◎ SEU PRÓXIMO OBJETIVO</span><button onclick="route(\'farm\')">Farm Planner ↗</button></div>'+
      '<div class="v06-feature-body"><img class="v06-aha-art" src="'+ahaOfficial+'" alt="Aeon Aha — arte de personagem da v4.7"><div class="v06-feature-text"><small class="v06-kicker">VERSÃO 4.7 · 11 NOV 2026</small><h3>AEON ★ AHA</h3><p>Nihilux / Rá · Euforia • Quântico</p><b>'+ (progress===null?'Estoque ainda não informado':progress+'% dos materiais cadastrados')+'</b><div class="v06-progress"><i style="width:'+(progress||0)+'%"></i></div><button onclick="v06OpenFuture()">Explorar kit & banner ↗</button></div></div></section>'+
      '<section class="v06-future"><div class="v06-sectionline"><div><span class="v06-kicker">SALA DE SALTOS</span><h2>Futuros banners</h2></div><button onclick="v06OpenFuture()">Ver detalhes ↗</button></div><button class="v06-banner-strip" onclick="v06OpenFuture()"><img src="'+ahaOfficial+'" alt="Aeon Aha"><div><span class="v06-kicker">CONFIRMADO · 11/11/2026</span><h3>Agora, Um Riso às Estrelas</h3><p>Aeon ★ Aha • estreia da versão 4.7</p><span>Ver habilidades, cones e análise ▸</span></div></button></section>'+
      pomCard('Uma dica antes de cada salto','Os seus personagens e equipamentos são analisados somente quando estiverem registrados. Para entender kits de personagens futuros, abra o Catálogo — ele é separado da sua conta.','DICAS DO POM-POM')+
      '<div class="v06-footnote">✧ ANDERUS STAR RAIL NEXUS · PROJETO INDEPENDENTE</div></div>';
  }
  home=home06;

  function lib06(){
    const count=ownedCount();
    return '<div class="v06-lib">'+subhead('ARQUIVO DO EXPRESSO','Sua conta & personagens','Cadastre seus personagens pelo print, acompanhe suas builds e consulte o catálogo completo.')+
      '<section class="v06-upload-banner"><div><span class="v06-kicker">IMPORTAÇÃO DE BUILDS</span><h2>De um print para o seu arquivo.</h2><p>Envie a captura com atributos, cone, rastros, relíquias e Eidolons. Confira os campos reconhecidos antes de salvar.</p><div class="v06-action-row"><button class="v06-primary" onclick="v06StartImport()">✦ Importar print</button><button class="v06-secondary" onclick="v06OpenQuickAdd()">＋ Adicionar manualmente</button></div></div><span class="v06-upload-icon">⇧</span></section>'+
      '<div class="v06-accountbar">'+genCard('Na conta',count,'♧')+genCard('Eidolons',countAccount(),'✦')+'</div>'+
      '<div class="v06-accountfilter"><button onclick="libraryFilter=\'owned\';refresh()" class="'+(libraryFilter==='owned'?'active':'')+'">Minha conta</button><button onclick="libraryFilter=\'all\';refresh()" class="'+(libraryFilter==='all'?'active':'')+'">Catálogo completo</button><button onclick="libraryFilter=\'favorites\';refresh()" class="'+(libraryFilter==='favorites'?'active':'')+'">Favoritos</button></div>'+
      '<label class="v06-search">⌕ <input placeholder="Buscar personagem, caminho ou versão…" value="'+safe(libSearch)+'" oninput="libSearch=this.value;v06RefreshCards()" type="search"></label>'+
      '<div id="v06-library-grid" class="v06-library-grid">'+v06CardList()+'</div>'+
      pomCard('Dois arquivos, funções diferentes','Minha Conta contém apenas personagens que você cadastrou. No Catálogo, você pode explorar todos os personagens e os kits futuros sem misturar dicas de investimento com a sua coleção.','SEU PROGRESSO')+'</div>';
  }
  function v06CardList(){
    let list=CATALOG.slice();
    if(libraryFilter==='owned')list=list.filter(c=>state.characters[c.id]);
    if(libraryFilter==='favorites')list=list.filter(c=>state.favorites?.includes(c.id));
    if(libSearch)list=list.filter(c=>norm(c.name).includes(norm(libSearch)));
    if(!list.length) return '<div class="v06-empty"><span>✧</span><strong>Nenhum personagem neste filtro.</strong><p>Importe seus primeiros prints ou abra o catálogo completo.</p><button onclick="v06StartImport()">Importar print ＋</button></div>';
    return list.map(c=>'<button class="v06-char-card" onclick="'+(c.id==='future-aha'?'v06OpenFuture()':'openProfile(\''+c.id+'\')')+'"><div class="v06-char-art"><img loading="lazy" src="'+safe(c.id==='future-aha'?ahaOfficial:(imgSrc(c.id,'preview')||imgSrc(c.id,'icon')))+'" alt="'+safe(c.name)+'" onerror="this.onerror=null;this.src=\''+safe(imgSrc(c.id,'icon'))+'\'"></div><div><small>'+ (state.characters[c.id]?'EM SUA CONTA':'CATÁLOGO') +'</small><strong>'+safe(c.name)+'</strong><span>'+(state.characters[c.id]?'Nv. '+fmt(state.characters[c.id].level||1)+' · E'+fmt(state.characters[c.id].e||0)+' S'+fmt(state.characters[c.id].s||1):'Ver kit, Eidolons e builds')+'</span></div><b>›</b></button>').join('');
  }
  window.v06RefreshCards=()=>{const el=document.getElementById('v06-library-grid');if(el)el.innerHTML=v06CardList()};
  library=lib06;

  function profile06(){
    const id=state.profile||'1503', c=lookup(id),b=state.characters[id],look=selectLook(id),pic=state.v06Art?.[id]==='preview'?imgSrc(id,'preview'):look.art;
    const active=tab||'overview';
    const switches=[['overview','Atributos'],['kit','Kit e rastros'],['eidolons','Eidolons'],['relics','Relíquias'],['teams','Equipes']];
    const body=active==='overview'?profileOverview(id,b):active==='kit'?profileKit(id):active==='eidolons'?profileEidolons(id,b):active==='relics'?profileRelics(id,b):profileTeams(id,b);
    const badge= b?'<span class="v06-ownership">NA SUA CONTA</span>':'<span class="v06-ownership muted">CATÁLOGO</span>';
    return '<div class="v06-profile"><section class="v06-char-hero"><div class="v06-char-hero-art" style="background-image:url(\''+safe(pic)+'\')"></div><div class="v06-hero-shade"></div>'+
    '<button class="v06-back" onclick="route(\'library\')">‹ Arquivo</button><div class="v06-character-info">'+badge+'<h1>'+safe(c.name)+'</h1><div class="v06-tags"><span>'+safe(b?'Nv. '+(b.level||1):'Não registrado')+'</span><span>E'+fmt(b?.e||0)+' · S'+fmt(b?.s||1)+'</span><span>✧ '+safe(look.group.toUpperCase())+'</span></div></div></section>'+
    '<div class="v06-profile-controls"><button class="v06-primary" onclick="'+(b?'editBuild(\''+id+'\')':'addOwned(\''+id+'\')')+'">'+(b?'Editar minha build':'＋ Adicionar à conta')+'</button><button class="v06-secondary" onclick="v06StartImport(\''+id+'\')">⇧ Importar print</button></div>'+
    '<nav class="v06-tabs">'+switches.map(([key,title])=>'<button class="'+(active===key?'active':'')+'" onclick="tab=\''+key+'\';refresh()">'+title+'</button>').join('')+'</nav>'+
    '<div class="v06-profile-body">'+body+'</div>'+((b&&state.v06Screens?.[id])?'<section class="v06-upload-reference"><h3>Seu print de referência</h3><img loading="lazy" src="'+state.v06Screens[id]+'" alt="Print importado por você"><button onclick="v06StartImport(\''+id+'\')">Atualizar print</button></section>':'')+
    '</div>';
  }
  profile=profile06;

  function verifiedGuide(id,subject){
    const c=lookup(id),owned=state.characters[id],name=c.name;
    if(!owned)return 'O Pom-Pom explica as condições do kit de '+name+' como parte do catálogo. Adicione o personagem à sua conta para receber orientação dos seus atributos e investimentos.';
    const stat=owned.spd?' • '+owned.spd+' VEL':'';
    return 'Na sua conta, '+name+' está no nível '+fmt(owned.level||1)+', E'+fmt(owned.e||0)+'S'+fmt(owned.s||1)+stat+'. Antes de ajustar a rotação, compare os outros três integrantes e os gatilhos do kit. A recomendação não pressupõe um cone ou relíquia que ainda não foi cadastrado.';
  }
  profileOverview=function(id,b){return '<div class="v06-overview-actions"><button onclick="v06StartImport(\''+id+'\')">⇧ Atualizar pelo print</button><button onclick="editBuild(\''+id+'\')">⚙ Editar atributos</button></div>'+base.profileOverview(id,b)+pomCard('O que avaliar nesta build',verifiedGuide(id),'FICHA · '+lookup(id).name);};
  profileEidolons=function(id,b){return '<div class="v06-eidolon-intro">'+pomCard('Cada fragmento tem sua própria história','Toque em E1 a E6 para abrir a arte individual disponível, os efeitos originais e o que mudou na rotação. Se a arte estiver indisponível, exibimos apenas o ícone no tamanho original — nunca um ícone borrado ampliado.','EIDOLONS')+'</div>'+base.profileEidolons(id,b);};
  profileKit=function(id){return base.profileKit(id)+pomCard('Como interpretar o kit','O texto do jogo e seus multiplicadores estão acima. Nas explicações práticas, observe gatilho, custo, duração, aliados elegíveis e a ordem das ações. Dados de beta são identificados separadamente.','KIT COMPLETO');};
  profileRelics=function(id,b){return base.profileRelics(id,b)+(state.v06Relics?.[id]?.length?'<section class="v06-relic-shots"><h3>Relíquias extraídas do seu print</h3><div>'+state.v06Relics[id].map((src,i)=>'<img loading="lazy" src="'+src+'" alt="Captura da relíquia '+(i+1)+'">').join('')+'</div><p>As imagens estão guardadas neste navegador. Confirme os atributos e o conjunto antes de comparar builds.</p></section>':'')+pomCard('Como priorizar seus subatributos','Um bom conjunto precisa de atributos úteis, velocidade efetiva e sincronização com a equipe. Sem as seis relíquias e os buffs de combate, não existe nota de build definitiva.','RELÍQUIAS');};

  const originalEidoModal=base.showEido;
  showEido=function(id,n){
    originalEidoModal(id,n);
    const modal=document.querySelector('#overlay .modal, #overlay .modal-card, .modal');
    if(modal){modal.classList.add('v06-eido-modal');modal.querySelectorAll('img.fragment-art').forEach(img=>{img.style.objectFit='contain';img.style.maxHeight='min(46vh,350px)';});}
  };
  function v06OpenFuture(){
    showModal('Aeon ★ Aha · 4.7','<div class="v06-future-detail"><div class="v06-banner-art"><img src="'+ahaOfficial+'" alt="Arte de Aeon Aha (Nihilux)"></div><div class="v06-kicker">OFICIAL · VERSÃO 4.7 · 11/11/2026</div><h2>AEON ★ AHA</h2><p>Identidade de Nihilux / Rá. Personagem 5★ de Euforia e elemento Quântico. A versão final do kit entra em vigor com a atualização de 11 de novembro.</p><h3>Mecânicas apresentadas oficialmente</h3><ul><li><strong>Potencialização da Euforia:</strong> fortalece aliados desse Caminho e suas habilidades especiais.</li><li><strong>Instante de Aha:</strong> elemento central das atuações de Euforia.</li><li><strong>Recursos de equipe:</strong> a equipe contribui para a realização de suas habilidades e efeitos especiais.</li><li><strong>Pressão sobre o PV máximo:</strong> efeitos voltados a reduzir os PV máximos dos inimigos.</li></ul><div class="v06-source-note">Resumo do material oficial divulgado em 04/11/2026. A prévia não publica todos os multiplicadores. Números de beta não devem ser tratados como valores finais.</div>'+pomCard('Devo investir?','Se você usa equipes de Euforia, Aha merece avaliação prioritária. Antes de decidir E1/E2 ou cone, compare os ganhos reais com seus recursos e os personagens que já possui.','PRÓXIMO SALTO')+'<button class="v06-primary" onclick="closeModal();route(\'farm\')">Planejar materiais ↗</button></div>');
  }
  window.v06OpenFuture=v06OpenFuture;
  nextBannerModal=v06OpenFuture;
  radar=function(){
    const x=base.radar();
    return '<section class="v06-radarhead">'+subhead('CENTRO DE OBSERVAÇÃO','Próximas versões','Kits, banners e histórico com fontes e níveis de confirmação.')+
      '<button class="v06-radar-banner" onclick="v06OpenFuture()"><img src="'+ahaOfficial+'" alt="Arte de Aeon Aha"><span><small>ESTREIA OFICIAL · 11 NOV</small><strong>AEON ★ AHA</strong><em>Nihilux · Euforia / Quântico</em><b>Explorar kit ↗</b></span></button></section>'+
      x.replace(/Evanescia E6S1 e Pearl E2S1/g,ownedCount()+' personagem(ns) cadastrados')+
      pomCard('Novos patches, novas decisões','O catálogo de personagens é sincronizado pelo GitHub. Estratégias de Endgame e recomendações de investimento só recebem selo de atualizadas depois de conferidas contra as regras e inimigos da rotação.','RADAR');
  };
  const mocBosses=[
    {name:'Muhtar da Guerra dos Borisins: Hoolay',weak:'Físico · Fogo · Vento',side:'Lado 1',desc:'Rocking Rebel e Sombra em Decadência antecedem Hoolay. Atenção às invocações, Fúria Lunar e frequência de ataques.',img:'https://patchwiki.biligame.com/images/sr/d/d3/oredae7oye1iaud47mjkt3p81tvmaf0.png',elements:['Physical','Fire','Wind']},
    {name:'Sangue do Deus Caído: Yabuli',weak:'Gelo · Quântico · Imaginário',side:'Lado 2',desc:'Pégaso ao Luar e Grifo do Meio-Dia precedem Yabuli. Planeje a quebra da barreira e a transição entre fases.',img:'https://www.gacha.gg/img/honkai-star-rail/dm/monster/mostericon-monster_5034010.webp',elements:['Ice','Quantum','Imaginary']}
  ];
  function bossTiles(){
    if(mode!=='moc'||String(floor)!=='12')return '';
    return '<div class="v06-sectionline"><h2>Chefes do andar 12</h2><small>2 NOV – 14 DEZ</small></div><div class="v06-boss-grid">'+mocBosses.map((boss,i)=>{
      const matches=ownerKeys().filter(id=>boss.elements.includes(gameData.chars?.[id]?.element)).slice(0,5);
      return '<button class="v06-boss-card" onclick="v06BossDetail('+i+')"><div class="v06-boss-art"><img loading="lazy" src="'+boss.img+'" alt="'+safe(boss.name)+'" onerror="this.style.opacity=0"></div><div><small>'+boss.side+'</small><strong>'+boss.name+'</strong><span>Fraquezas: '+boss.weak+'</span><em>'+(matches.length?'Da sua conta: '+matches.map(id=>lookup(id).name).join(', '):'Importe personagens para sugerir sua equipe')+'</em></div></button>';
    }).join('')+'</div>';
  }
  window.v06BossDetail=i=>{const b=mocBosses[i];if(!b)return;showModal(b.side+' · '+b.name,'<div class="v06-future-detail"><div class="v06-banner-art"><img src="'+b.img+'" alt="'+safe(b.name)+'"></div><h2>'+safe(b.name)+'</h2><p>'+safe(b.desc)+'</p><p>Fraquezas recomendadas: '+safe(b.weak)+'.</p>'+pomCard('Não basta uma tier list','Considere os buffs da rotação, os alvos secundários, o dano efetivo da build e a ordem de ação dos seus quatro integrantes.','COMBATE')+'</div>');};
  const modeKeys={moc:{period:'02/11–14/12/2026',summary:'Sobrevivência dos Mais Aptos',boss:'Inimigos e buffs variam por andar e metade.'},
    pf:{period:'19/10–30/11/2026',summary:'Palavras Imaginadas',boss:'Onda de inimigos e pontuação por eliminação.'},
    sa:{period:'05/10–16/11/2026',summary:'Dominação do Esquecimento',boss:'Avalie os chefes separadamente em cada lado.'},
    aa:{period:'4.6 · até a mudança de versão',summary:'Arbitragem de Anomalias',boss:'Três cavaleiros e o confronto final do Rei em Xeque.'}};
  endgame=function(){
    const m=modeKeys[mode]||modeKeys.moc,keys=ownerKeys();
    return '<section class="v06-endgame-lead">'+subhead('ARBITRAGEM & DESAFIOS','Endgame Intelligence','Cada andar, lado e chefe tem suas próprias condições. Escolha uma equipe da sua conta.')+
      '<div class="v06-endmode">'+Object.keys(MODE).map(k=>'<button class="'+(k===mode?'active':'')+'" onclick="mode=\''+k+'\';floor=\''+(k==='moc'?'12':'4')+'\';refresh()">'+MODE[k].short+'</button>').join('')+'</div>'+
      '<div class="v06-encounter"><small class="v06-kicker">'+safe(m.period)+'</small><h2>'+safe(m.summary)+'</h2><p>'+safe(m.boss)+'</p><span>'+keys.length+' personagens disponíveis na sua conta</span></div></section>'+
      bossTiles()+base.endgame()+
      pomCard('Como escolher as equipes','O Pom-Pom só utiliza o inventário que você cadastrou. Um personagem não enviado não entra automaticamente nas recomendações. Estimativas de 0 ou 1 ciclo exigem PV, ondas, buffs, relíquias e rotações mensuráveis.','ESTRATÉGIA DE COMBATE');
  };
  const originalThemes=base.themes;
  themes=function(){
    const look=selectLook(state.theme),c=lookup(state.theme),art=state.v06Art?.[state.theme]||'portrait';
    const imgs=[['portrait','Arte principal',look.art],['preview','Ícone ilustrado',imgSrc(state.theme,'preview')||look.art]];
    if(EIDO_ART[state.theme]?.[5])imgs.push(['eidolon','Fragmento E6',EIDO_ART[state.theme][5]]);
    return '<div class="v06-themes">'+subhead('ATELIÊ DO EXPRESSO','Theme Studio','Transforme o Nexus inteiro — ilustrações, navegação, molduras, ícones, fontes, ornamentos e movimento.')+
      '<div class="v06-theme-stage"><div class="v06-theme-stage-art"><img src="'+safe(art==='eidolon'&&EIDO_ART[state.theme]?.[5]?EIDO_ART[state.theme][5]:art==='preview'?(imgSrc(state.theme,'preview')||look.art):look.art)+'" alt="'+safe(c.name)+'"></div><div class="v06-theme-caption"><span class="v06-kicker">IDENTIDADE ATIVA</span><h2>'+safe(c.name)+'</h2><p>'+look.text+' '+safe(look.group.toUpperCase())+' · '+safe(look.shape)+'</p><span>INTERFACE PERSONALIZADA</span></div></div>'+
      '<div class="v06-theme-restore"><button onclick="setTheme(\'8001\')">✦ Restaurar tema padrão · Expresso Astral</button></div>'+
      '<div class="v06-theme-swatches"><span>TIPOGRAFIA</span><strong style="font-family:'+look.font+'">'+safe(c.name)+'</strong><span>PALETA</span><div class="v06-swatches">'+look.color.map(a=>'<i style="background:'+a+'"></i>').join('')+'</div><span>ÍCONE & MOLDURA</span><strong>'+look.text+' '+safe(look.shape)+'</strong></div>'+
      '<div class="v06-sectionline"><h2>Escolher arte do tema</h2><small>Variações disponíveis</small></div><div class="v06-art-picks">'+imgs.map(([k,label,url])=>'<button class="'+(art===k?'active':'')+'" onclick="v06SetArt(\''+k+'\')"><img src="'+safe(url)+'" loading="lazy" alt=""><span>'+safe(label)+'</span></button>').join('')+'</div>'+
      '<div class="v06-sectionline"><h2>Biblioteca de identidades</h2><small>'+CATALOG.length+' opções</small></div><label class="v06-search">⌕ <input type="search" placeholder="Buscar qualquer personagem…" value="'+safe(themeSearch)+'" oninput="themeSearch=this.value;v06ThemeCards()"></label>'+
      '<div id="v06-theme-grid" class="v06-theme-grid">'+v06ThemeItems()+'</div>'+
      pomCard('Uma transformação, não um filtro','Cada personagem utiliza uma composição visual própria, com ilustração, cor de destaque, identidade tipográfica, bordas, ornamentos e ritmo de animação. Quando faltar uma arte oficial alternativa, o Nexus não inventa que existe.','ATELIÊ')+'</div>';
  };
  function v06ThemeItems(){
    const matches=CATALOG.filter(c=>!themeSearch||norm(c.name).includes(norm(themeSearch)));
    return matches.map(c=>'<button class="'+(c.id===state.theme?'active':'')+'" onclick="setTheme(\''+c.id+'\')"><img src="'+safe(c.id==='future-aha'?ahaOfficial:imgSrc(c.id,'preview'))+'" loading="lazy" alt="'+safe(c.name)+'" onerror="this.style.display=\'none\'"><span>'+safe(c.name)+'</span></button>').join('');
  }
  window.v06ThemeCards=()=>{let e=document.getElementById('v06-theme-grid');if(e)e.innerHTML=v06ThemeItems()};
  window.v06SetArt=kind=>{state.v06Art||={};state.v06Art[state.theme]=kind;save();refresh();};
  const originalApply=applyTheme;
  applyTheme=function(){
    originalApply();
    const l=selectLook(state.theme),a=document.querySelector('.app');
    if(!a)return;
    a.dataset.v06Look=l.group;a.dataset.v06Shape=l.shape;
    a.style.setProperty('--v-color',l.color[0]);a.style.setProperty('--v-color2',l.color[1]);a.style.setProperty('--v-deep',l.color[2]);
    a.style.setProperty('--v-title-font',l.font);a.style.setProperty('--v-symbol','"'+l.text+'"');
    a.style.setProperty('--v-cover','url("'+(state.v06Art?.[state.theme]==='preview'?imgSrc(state.theme,'preview'):l.art)+'")');
    a.classList.add('v06-app');
  };
  function freshUI(){
    const legacyFab=document.getElementById('nexFab');if(legacyFab){legacyFab.style.display='none';legacyFab.setAttribute('aria-hidden','true');legacyFab.tabIndex=-1;}
    const brand=document.querySelector('.brand-title');if(brand)brand.innerHTML='ANDERUS<small>STAR RAIL NEXUS</small>';
    const open=document.querySelector('.mast-actions .i-btn[title="Buscar personagens"]');
    if(open)open.setAttribute('title','Arquivo de personagens');
    document.querySelectorAll('.module-tile img,.v06-tile img').forEach(x=>x.loading='lazy');
    const nav=document.getElementById('bottomNav');if(nav){nav.classList.add('v06-bottom');}
  }
  const prevRender=render;
  render=function(){
    const priorStage=document.getElementById('stage');
    if(priorStage)priorStage.classList.remove('v06-entering');
    prevRender();
    const stage=document.getElementById('stage');
    stage?.classList.add('v06-stage');
    if(stage){void stage.offsetWidth;stage.classList.add('v06-entering');}
    document.querySelector('.app')?.classList.toggle('v06-on-home',page==='home');
    freshUI();
  };

  window.v06OpenQuickAdd=function(){
    showModal('Adicionar personagem à conta','<div class="v06-add-modal"><p>Selecione um personagem do catálogo. Depois abra sua ficha para cadastrar nível, Eidolons, cone e atributos.</p><label class="v06-search">⌕ <input type="search" oninput="v06QuickFilter(this.value)" placeholder="Pesquisar personagem"></label><div id="v06-quick-list">'+quickList('')+'</div></div>');
  };
  function quickList(query){
    return CATALOG.filter(c=>c.id!=='future-aha'&&norm(c.name).includes(norm(query))).slice(0,100).map(c=>'<button onclick="closeModal();addOwned(\''+c.id+'\');openProfile(\''+c.id+'\')"><img src="'+safe(imgSrc(c.id,'icon'))+'" alt="" loading="lazy"><span>'+safe(c.name)+'</span> ＋</button>').join('');
  }
  window.v06QuickFilter=q=>{const e=document.getElementById('v06-quick-list');if(e)e.innerHTML=quickList(q)};

  function uploadPanel(){
    return '<div class="v06-import"><div class="v06-import-drop"><label for="v06-file">⇧<strong>Escolher print de build</strong><small>PNG, JPG ou WEBP · até 12 MB</small></label><input id="v06-file" type="file" accept="image/png,image/jpeg,image/webp" onchange="v06ReadPrint(this.files[0])"></div>'+
      '<div id="v06-import-preview" class="v06-import-preview"></div>'+
      '<p class="v06-source-note">O OCR lê somente o cabeçalho, os atributos totais e o cone. As seis relíquias ficam separadas. Confirme personagem, E0–E6, S1–S5 e cada valor antes de salvar; o processamento acontece no navegador.</p></div>';
  }
  window.v06StartImport=function(id){
    if(id)uploader.identifiedId=id;
    else uploader.identifiedId='';
    uploader.preview='';uploader.file=null;uploader.relImages=[];uploader.ocrText='';uploader.eidolon=null;uploader.superimposition=null;uploader.cone='';uploader.sourceValid=false;
    showModal('Importar build pelo print',uploadPanel());
  };
  window.v06ReadPrint=async function(file){
    if(!file)return;
    if(file.size>12*1024*1024){showToast('Escolha uma imagem de até 12 MB');return;}
    uploader.file=file;uploader.busy=true;uploader.identifiedId='';uploader.eidolon=null;uploader.superimposition=null;uploader.cone='';uploader.ocrText='';
    const reader=new FileReader();
    reader.onload=async()=>{
      const full=String(reader.result);
      const img=new Image();
      await new Promise(done=>{img.onload=done;img.onerror=done;img.src=full;});
      if(img.naturalWidth){
        const w=Math.min(960,img.naturalWidth),h=Math.round(w*img.naturalHeight/img.naturalWidth);
        const c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        uploader.preview=c.toDataURL('image/webp',.62);
      }else uploader.preview=full;
      uploader.busy=false;await cropRelics();v06ShowImportReview();
    };
    reader.readAsDataURL(file);
  };
  function showImportReview(){
    if(!CATALOG.some(c=>c.id==='8009') && gameData.chars?.['8009']) CATALOG.push({...gameData.chars['8009'],name:'Desbravador · Euforia (Caelus)'});
    const names=CATALOG.filter(c=>c.id!=='future-aha' && !/^80(?:02|04|06|08|10)$/.test(c.id));
    const choice='<option value="">Selecione o personagem correto</option>'+names.map(c=>'<option value="'+c.id+'" '+(c.id===uploader.identifiedId?'selected':'')+'>'+safe(c.id==='8009'?'Caelus · Desbravador da Euforia':c.name)+'</option>').join('');
    return '<div class="v06-import-form"><div class="v06-import-image"><img src="'+uploader.preview+'" alt="Print enviado"></div>'+
      '<div class="v06-action-row"><button class="v06-primary" onclick="v06AutoRead()">✧ Reconhecer dados do print</button><button class="v06-secondary" onclick="document.getElementById(\'v06-file\').click()">Trocar imagem</button></div>'+
      '<div class="v06-fieldgroup"><label>Personagem<select id="v06-id">'+choice+'</select></label>'+
      '<label>Nível<input id="v06-level" type="number" min="1" max="80" value="80"></label>'+
      '<label>Eidolons (confirme os seis ícones)<select id="v06-e"><option value="">Selecione E0–E6</option>'+Array.from({length:7},(_,i)=>'<option value="'+i+'" '+(i===uploader.eidolon?'selected':'')+'>E'+i+'</option>').join('')+'</select></label>'+
      '<label>Sobreposição do cone<select id="v06-s"><option value="">Selecione S1–S5</option>'+Array.from({length:5},(_,i)=>'<option value="'+(i+1)+'" '+(i+1===uploader.superimposition?'selected':'')+'>S'+(i+1)+'</option>').join('')+'</select></label>'+
      '<label>PV<input type="number" id="v06-pv" placeholder="PV total"></label><label>ATQ<input type="number" id="v06-atk" placeholder="ATQ total"></label>'+
      '<label>DEF<input type="number" id="v06-def" placeholder="DEF total"></label><label>VEL<input type="number" id="v06-spd" placeholder="VEL"></label>'+
      '<label>Chance CRIT %<input type="number" step=".1" id="v06-crit"></label><label>Dano CRIT %<input type="number" step=".1" id="v06-cdmg"></label>'+
      '<label>Quebra %<input type="number" step=".1" id="v06-break"></label><label>Recuperação de Energia %<input type="number" step=".1" id="v06-energy"></label></div>'+
      '<div class="v06-kicker">AS SEIS RELÍQUIAS DO PRINT</div><div class="v06-piece-grid">'+uploader.relImages.map((src,i)=>'<figure><img src="'+src+'" alt="Relíquia '+(i+1)+'"><figcaption>'+['Cabeça','Mãos','Corpo','Pés','Esfera','Corda'][i]+'</figcaption></figure>').join('')+'</div>'+
      '<div id="v06-import-status" class="v06-import-status" role="status">OCR ainda não executado. Preencha ou confira os atributos totais, nunca os valores das relíquias.</div>'+
      '<label style="display:flex;align-items:flex-start;gap:12px;padding:16px 4px;font-size:13px;line-height:1.45"><input type="checkbox" id="v06-confirm" style="width:22px;height:22px;flex-shrink:0"> Eu conferi personagem, Eidolons, cone e atributos totais no print. Sei que a leitura automática pode errar.</label>'+
      '<button class="v06-primary v06-save-import" onclick="v06SaveImport()">Confirmar e salvar build ✓</button></div>';
  }
  window.v06ShowImportReview=function(){
    const content=uploadPanel()+showImportReview();
    showModal('Importar build · revisar dados',content);
  };
  async function cropRelics(){
    if(!uploader.preview)return;
    const img=new Image();
    await new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;img.src=uploader.preview});
    if(!img.naturalWidth)return;
    const ratio=img.naturalWidth/img.naturalHeight;
    if(ratio<0.8 || ratio>1.6){uploader.relImages=[];return;}
    const regions=[
      [0.366,0.468,0.194,0.214],[0.57,0.468,0.194,0.214],[0.775,0.468,0.194,0.214],
      [0.366,0.683,0.194,0.214],[0.57,0.683,0.194,0.214],[0.775,0.683,0.194,0.214]
    ];
    uploader.relImages=regions.map(([x,y,w,h])=>{
      const canvas=document.createElement('canvas');canvas.width=145;canvas.height=164;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,Math.round(x*img.width),Math.round(y*img.height),Math.round(w*img.width),Math.round(h*img.height),0,0,145,164);
      return canvas.toDataURL('image/webp',.65);
    });
  }
  function getLang(){
    return new Promise((resolve,reject)=>{
      if(window.Tesseract)return resolve(window.Tesseract);
      const tag=document.createElement('script');tag.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';tag.onload=()=>resolve(window.Tesseract);tag.onerror=()=>reject(Error('A biblioteca OCR não carregou'));document.head.appendChild(tag);
    });
  }

  // Importação v0.6.8: lê apenas regiões conhecidas do layout do registro de batalha.
  // Abaixo dessas regiões ficam as seis relíquias, que NUNCA entram no OCR de atributos totais.
  function importNumber(raw){
    const parts=String(raw||'').replace(/[^0-9.,]/g,'').replace(',', '.');
    const m=parts.match(/\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  }
  function imageRegion(bitmap,x,y,w,h,mul=2){
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(bitmap.width*w*mul));
    c.height=Math.max(1,Math.round(bitmap.height*h*mul));
    c.getContext('2d').drawImage(bitmap,x*bitmap.width,y*bitmap.height,w*bitmap.width,h*bitmap.height,0,0,c.width,c.height);
    return c;
  }
  function makeTotalStatStrip(bitmap) {
    const rows=[['PV','pv',0,'L'],['ATQ','atk',1,'L'],['DEF','def',2,'L'],
      ['VEL','spd',3,'L'],['CRIT','crit',4,'L'],['DCRIT','cdmg',5,'L'],
      ['QUEBRA','break',0,'R'],['ENERGIA','energy',3,'R']];
    const out=document.createElement('canvas');out.width=475;out.height=rows.length*95;
    const ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);
    ctx.textBaseline='middle';ctx.fillStyle='#000';ctx.font='bold 23px Arial, sans-serif';
    for(let i=0;i<rows.length;i++){
      const [label,key,index,col]=rows[i],cy=.151+index*.03055;
      ctx.fillText(label,8,i*95+48);
      const x0=col==='L'?.618:.909,x1=col==='L'?.672:.976;
      const tile=document.createElement('canvas');
      tile.width=Math.max(1,Math.round(bitmap.width*(x1-x0)));
      tile.height=Math.max(1,Math.round(bitmap.height*.025));
      const t=tile.getContext('2d',{willReadFrequently:true});
      t.drawImage(bitmap,bitmap.width*x0,bitmap.height*(cy-.0125),bitmap.width*(x1-x0),bitmap.height*.025,0,0,tile.width,tile.height);
      const pix=t.getImageData(0,0,tile.width,tile.height);
      for(let p=0;p<pix.data.length;p+=4){
        const rgb=(pix.data[p]+pix.data[p+1]+pix.data[p+2])/3;
        const bw=rgb>123?0:255;
        pix.data[p]=bw;pix.data[p+1]=bw;pix.data[p+2]=bw;pix.data[p+3]=255;
      }
      t.putImageData(pix,0,0);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(tile,160,i*95+14,295,68);
    }
    return {canvas:out,rows};
  }
  function parseTotalStatLines(text,rows){
    const result={};
    const aliases={'PV':'pv','ATQ':'atk','DEF':'def','VEL':'spd','CRIT':'crit',
                   'DCRIT':'cdmg','QUEBRA':'break','ENERGIA':'energy'};
    const lines=String(text||'').split(/\n+/);
    for(const line of lines){
      const cleaned=line.trim().replace(/\s+/g,' ');
      const label=Object.keys(aliases).sort((a,b)=>b.length-a.length).find(a=>new RegExp('^'+a+'\\b','i').test(cleaned));
      if(!label)continue;
      const k=aliases[label];
      let value=importNumber(cleaned.slice(label.length));
      if(value===null)continue;
      // In the source: PV 3209, ATQ 2597, DEF 1357, VEL 137, 72.7% / 91.1%.
      const range={pv:[250,20000],atk:[100,10000],def:[100,10000],spd:[55,400],
        crit:[0,100],cdmg:[0,700],break:[0,600],energy:[50,300]}[k];
      if(value>=range[0]&&value<=range[1])result[k]=value;
    }
    return result;
  }
  window.v06AutoRead=async function(){
    const status=document.getElementById('v06-import-status');
    const update=s=>{if(status)status.textContent=s;};
    if(!uploader.file)return update('Escolha primeiro um print para analisar.');
    let worker=null, bitmap=null;
    try{
      update('Preparando a leitura isolada do personagem e dos atributos totais...');
      const ocr=await getLang();
      bitmap=await createImageBitmap(uploader.file);
      const ratio=bitmap.width/bitmap.height;
      if(ratio<.94||ratio>1.26)throw Error('Formato diferente do registro de batalha conhecido. Preencha os campos manualmente, sem confiar em OCR de outra tela.');
      worker=await ocr.createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text')update('Reconhecendo campos: '+Math.round(m.progress*100)+'%');}});
      await worker.setParameters({tessedit_pageseg_mode:'6'});
      const header=(await worker.recognize(imageRegion(bitmap,.018,.024,.34,.084,2.5))).data.text||'';
      const fullPanel=(await worker.recognize(imageRegion(bitmap,.367,.122,.61,.24,1.6))).data.text||'';
      const cone=(await worker.recognize(imageRegion(bitmap,.045,.602,.315,.146,2.2))).data.text||'';
      const valueStrip=makeTotalStatStrip(bitmap);
      const numeric=(await worker.recognize(valueStrip.canvas)).data.text||'';
      uploader.ocrText=['PERSONAGEM',header,'ATRIBUTOS',fullPanel,'CONE',cone,'NÚMEROS',numeric].join('\n');
      const h=norm(header), panel=norm(fullPanel);
      let identifiedId='';
      if(h.includes('desbrav')||h.includes('trailblaz')){
        if(panel.includes('raio')||panel.includes('lightning')||panel.includes('thunder'))identifiedId='8009';
      }else{
        const found=CATALOG.filter(c=>c.id!=='future-aha'&&c.name&&norm(c.name).length>=4)
          .sort((a,b)=>b.name.length-a.name.length).find(c=>h.includes(norm(c.name)));
        if(found)identifiedId=found.id;
      }
      if(identifiedId && !CATALOG.find(c=>c.id===identifiedId) && identifiedId==='8009' && gameData.chars?.['8009']){
        CATALOG.push({...gameData.chars['8009'],name:'Desbravador · Euforia (Caelus)'});
        const select=document.getElementById('v06-id');
        if(select)select.add(new Option('Caelus · Desbravador da Euforia','8009'));
      }
      if(identifiedId&&document.getElementById('v06-id')){
        uploader.identifiedId=identifiedId;document.getElementById('v06-id').value=identifiedId;
      }
      const totals=parseTotalStatLines(numeric,valueStrip.rows);
      for(const [key,value] of Object.entries(totals)){
        const field=document.getElementById('v06-'+key);
        if(field)field.value=String(value);
      }
      const levelMatch=header.match(/(?:Nv|Lv)\W{0,3}(\d{1,2})/i);
      if(levelMatch){const el=document.getElementById('v06-level');if(el)el.value=levelMatch[1];}
      const supMatch=cone.match(/(?:Nv|Lv)\W*([1-5])\s+de\s+(?:sobreposi|superimposi)/i)
                  || cone.match(/(?:sobreposi|superimposi)[^\n]{0,12}([1-5])/i);
      if(supMatch){uploader.superimposition=Number(supMatch[1]);const el=document.getElementById('v06-s');if(el)el.value=supMatch[1];}
      if(/euforia\s+repleta/i.test(cone))uploader.cone='Euforia Repleta de Bênçãos';
      const e=await suggestEidolons();
      if(e!==null){uploader.eidolon=e;const el=document.getElementById('v06-e');if(el)el.value=String(e);}
      const found=Object.keys(totals).length;
      const missing=['pv','atk','def','spd','crit','cdmg','break','energy'].filter(k=>!Object.hasOwn(totals,k));
      update('Identificação: '+(identifiedId==='8009'?'Caelus · Euforia':identifiedId?lookup(identifiedId).name:'não confirmada')+
        ' · '+found+'/8 atributos totais detectados.'+
        (e!==null?' Eidolons sugeridos: E'+e+'.':' Verifique manualmente os Eidolons.')+
        (supMatch?' Cone S'+supMatch[1]+'.':' Confira a sobreposição do cone.')+
        (missing.length?' Confira/preencha: '+missing.join(', ')+'.':'')+
        ' Confira todos os dados antes de salvar.');
    }catch(err){
      update('Reconhecimento indisponível: '+String(err.message||err)+'. Não preenchi valores de relíquias como atributos totais; confira os campos manualmente.');
    }finally{
      try{await worker?.terminate()}catch(_){}
      try{bitmap?.close()}catch(_){}
    }
  };
  async function suggestEidolons(){
    if(!uploader.preview)return null;
    const img=new Image();
    await new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;img.src=uploader.preview;});
    if(!img.naturalWidth)return null;
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const ratios=[];
    for(let i=0;i<6;i++){
      const cx=img.width*(.084+.0405*i),cy=img.height*.572,r=Math.max(7,Math.round(img.width*.012));
      const pix=ctx.getImageData(Math.max(0,Math.floor(cx-r)),Math.max(0,Math.floor(cy-r)),Math.round(r*2),Math.round(r*2)).data;
      let bright=0;
      for(let j=0;j<pix.length;j+=4)if((pix[j]+pix[j+1]+pix[j+2])/3>175)bright++;
      ratios.push(bright/(pix.length/4));
    }
    // Só sugere valores quando há seis símbolos claramente iluminados ou contraste forte.
    // Um E0 sugerido incorretamente é pior do que pedir confirmação manual.
    if(ratios.every(v=>v>.19))return 6;
    for(let n=1;n<=5;n++){
      const lit=ratios.slice(0,n),unlit=ratios.slice(n);
      if(Math.min(...lit)>.18 && Math.max(...unlit)<.095)return n;
    }
    return null;
  }

  window.v06SaveImport=function(){
    const id=document.getElementById('v06-id')?.value;
    if(!id){showToast('Escolha o personagem correto antes de salvar');return;}
    if(!document.getElementById('v06-confirm')?.checked){
      showToast('Confira os números e marque a confirmação antes de salvar');return;
    }
    const important=['pv','atk','def','spd','crit','cdmg'];
    if(important.some(k=>document.getElementById('v06-'+k)?.value==='')){
      showToast('Complete os seis atributos principais antes de salvar');return;
    }
    if(!document.getElementById('v06-e')?.value||!document.getElementById('v06-s')?.value){
      // E0 equivale à string '0', que é truthy.
      showToast('Selecione os Eidolons e a sobreposição do cone');return;
    }
    const prior=state.characters[id]||{level:1,e:0,s:1,cone:''};
    const read=k=>{const v=document.getElementById('v06-'+k)?.value;return v===''||v==null?null:Number(v);};
    const keys=['level','e','s','pv','atk','def','spd','crit','cdmg','break','energy'];
    for(const k of keys){const n=read(k);if(Number.isFinite(n))prior[k]=n;}
    if(uploader.cone)prior.cone=uploader.cone;
    state.characters[id]=prior;state.v06Screens||={};state.v06Relics||={};
    if(uploader.preview){const image=new Image();image.src=uploader.preview;state.v06Screens[id]=uploader.preview;}
    if(uploader.relImages.length)state.v06Relics[id]=uploader.relImages;
    state.profile=id;save();closeModal();tab='overview';route('profile');showToast('Print e personagem registrados na sua conta');
  };

  // Editorial guidance is contextual and only references characters explicitly in the account.
  let v06TipTab='owned';
  const groups=[['owned','Minha conta'],['kits','Como ler kits'],['endgame','Endgame'],['farm','Farm']];
  function contextualTip(id){
    const b=state.characters[id],n=lookup(id).name;
    if(!b)return '';
    if(id==='1503')return pomCard('Pearl E'+b.e+' · confira os alvos','A Suprema escolhe um Arquétipo Estético. Com E2, o avanço adicional alcança os outros aliados elegíveis de Euforia; rodada extra e duplicação dos recursos dependem das condições do kit.','CONSELHO DA PEARL');
    if(id==='1505')return pomCard('Evanescia E'+b.e+' · planeje os gatilhos','Controle Energia, Mandou Bem e as ativações de Euforia com os suportes que você tiver realmente cadastrado. Não trate um atributo de tela como desempenho final.','CONSELHO DA EVANESCIA');
    if(id==='1507')return pomCard('Mortenax Blade E'+b.e+' · alinhe as Supremas','O Campo, as Cargas e Supremas ofensivas da equipe definem o valor dos efeitos de Ataque Extra. Não conte Supremas somente de suporte como ataques.','CONSELHO DO MORTENAX');
    return pomCard(n+' · ajuste antes de investir','Personagem registrado no nível '+(b.level||1)+', E'+(b.e||0)+'S'+(b.s||1)+'. Revise o conjunto, o cone, a ordem de VEL e a função na equipe antes de novos investimentos.','LEITURA DA SUA CONTA');
  }
  function diary06(){
    const chars=ownerKeys();
    let blocks='';
    if(v06TipTab==='owned'){
      blocks=chars.length?chars.map(contextualTip).join(''):pomCard('Seu arquivo ainda está vazio','Importe um print em Minha Conta para receber dicas específicas dos personagens que você possui.','COMECE AQUI');
    } else if(v06TipTab==='kits'){
      blocks=pomCard('Primeiro: leia o gatilho','Em um kit, encontre a condição de ativação, a duração, os alvos elegíveis e o custo da habilidade. O multiplicador sozinho não indica a melhor rotação.','MECÂNICAS')+
        pomCard('Eidolons não são todos iguais','Um Eidolon pode mudar a rotação, desbloquear uma interação ou apenas subir níveis. O valor depende da equipe e do investimento já feito.','INVESTIMENTO');
    } else if(v06TipTab==='endgame'){
      blocks=pomCard('Não existe composição universal','Na Memória do Caos, leia os dois lados e os modificadores da rotação. Na Arbitragem, três equipes dos Cavaleiros não podem ser repetidas.','DESAFIOS')+
        pomCard('Previsão de ciclos exige dados','Apenas os nomes dos personagens não bastam para prever 0 ou 1 ciclo. Use as builds completas e registre resultados para comparar as estratégias.','ESTIMATIVAS');
    } else {
      blocks=pomCard('Calcule primeiro o que falta','No Farm Planner, desconte o estoque e considere as fusões 3:1 antes de estimar runs. Materiais semanais e créditos devem ser rastreados separadamente.','MATERIAIS');
    }
    return '<div class="v06-diary">'+subhead('GUIA DO CONDUTOR','Dicas do Pom-Pom','Nada de chat ou perguntas à IA. Conselhos do jogo, separados entre sua conta e o catálogo.')+
      '<div class="v06-diary-intro">'+pomCard('Pronto para a próxima parada?','Selecione um assunto. Os conselhos de sua conta só usam personagens realmente registrados; o restante são guias gerais.','POM-POM A BORDO')+'</div>'+
      '<div class="v06-accountfilter">'+groups.map(([k,v])=>'<button class="'+(k===v06TipTab?'active':'')+'" onclick="v06SelectTips(\''+k+'\')">'+v+'</button>').join('')+'</div>'+
      blocks+'<div class="v06-source-note">Kits e Eidolons são sincronizados a partir do catálogo comunitário. Conselhos de Endgame são editoriais e não recebem selo de validação automaticamente.</div></div>';
  }
  nexia=diary06;
  window.v06SelectTips=k=>{v06TipTab=k;refresh()};

  // Disable stale chat surface and floating mascot even if the 0.5 renderer recreates them.
  const oldChooseTheme=setTheme;
  setTheme=function(id){
    const app=document.querySelector('.app');
    if(app){app.classList.remove('v06-theme-changing');void app.offsetWidth;app.classList.add('v06-theme-changing');}
    oldChooseTheme(id);
    setTimeout(()=>document.querySelector('.app')?.classList.remove('v06-theme-changing'),550);
  };
  const originalMenu=renderMenu;
  renderMenu=function(){originalMenu();const menu=document.getElementById('floatMenu');if(menu)menu.innerHTML=menu.innerHTML.replace(/Diário do Pom-Pom/g,'Dicas do Pom-Pom');};
  if(window.history&&window.history.replaceState)document.documentElement.dataset.nexusVersion='0.6';
})();
