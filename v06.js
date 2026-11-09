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
  const ahaOfficial='./assets/official/aha-4-7.webp';
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
  if(!document.getElementById('nexus-account-css')){
    const link=document.createElement('link');link.id='nexus-account-css';
    link.rel='stylesheet';link.href='./nexus-account.css?v=2';
    document.head.appendChild(link);
  }
  // Keep manually added characters across reloads until the catalogue gains them.
  state.v06CustomCharacters ||= {};
  for(const char of Object.values(state.v06CustomCharacters)){
    if(char?.id && char?.name && !CATALOG.some(c=>c.id===char.id)) CATALOG.push(char);
    if(char?.id && char?.name && !gameData.chars?.[char.id]){
      gameData.chars[char.id]={id:char.id,name:char.name,skills:[],ranks:[]};
    }
  }

  // Shared account source. The old UI stored relics in build.relics, while
  // imports stored them separately in v06RelicDetails. Merge without deletion.
  let nexusAccount=null,nexusAccountCatalog=null,nexusAccountPromise=null;
  function accountRecords(id){
    const detail=state.v06RelicDetails?.[id],legacy=state.characters?.[id]?.relics;
    if(nexusAccount)return nexusAccount.normalizeRelics(detail,legacy,nexusAccountCatalog?.relicSets||{});
    return Array.isArray(detail)?detail:[];
  }
  function accountSetName(piece){
    return nexusAccountCatalog?.relicSets?.[piece.setId]?.name||piece.setName||'Conjunto não identificado';
  }
  function accountCone(id){
    return nexusAccount?.matchCone(state.characters?.[id]?.cone,nexusAccountCatalog?.cones||{})||null;
  }
  let nexusStorageWarning=false;
  function verifiedAccountSave(id){
    // Capture the previously persisted build before replacing it. Snapshots
    // omit screenshot blobs and are capped, protecting browser storage space.
    try{
      const persisted=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'null');
      const previousBuild=persisted?.characters?.[id]||null;
      const previousRelics=persisted?.v06RelicDetails?.[id]||null;
      const latestBuild=state.characters?.[id]||null;
      const latestRelics=state.v06RelicDetails?.[id]||null;
      if(previousBuild && latestBuild && JSON.stringify({previousBuild,previousRelics})!==
        JSON.stringify({previousBuild:latestBuild,previousRelics:latestRelics})){
        state.v06BuildHistory||={};
        const entries=state.v06BuildHistory[id]||[];
        entries.unshift({recordedAt:new Date().toISOString(),build:JSON.parse(JSON.stringify(previousBuild)),
          relics:previousRelics?JSON.parse(JSON.stringify(previousRelics)):null});
        state.v06BuildHistory[id]=entries.slice(0,20);
      }
    }catch(error){console.warn('Não foi possível registrar o histórico anterior:',error);}
    save();
    try{
      const snapshot=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'null');
      if(!snapshot?.characters?.[id])throw Error('Personagem ausente na cópia persistente');
      if(JSON.stringify(snapshot.characters[id])!==JSON.stringify(state.characters[id]))
        throw Error('Dados do personagem não correspondem ao que foi gravado');
      if(state.v06RelicDetails?.[id]&&JSON.stringify(snapshot.v06RelicDetails?.[id])!==JSON.stringify(state.v06RelicDetails[id]))
        throw Error('As relíquias não foram gravadas corretamente');
      nexusStorageWarning=false;
      return true;
    }catch(error){
      nexusStorageWarning=true;
      console.warn('Falha na gravação da conta:',error);
      return false;
    }
  }
  function accountStorageNotice(){
    return nexusStorageWarning?'<div class="v11-storage-warning" role="alert"><strong>⚠ Alterações ainda não foram salvas no dispositivo</strong><p>O armazenamento do navegador pode estar cheio. Não feche a aba antes de exportar um backup nas Configurações.</p><button type="button" onclick="route(\'settings\')">Abrir configurações</button></div>':'';
  }
  function migrateAccountRelics(){
    if(!nexusAccount||!nexusAccountCatalog)return;
    let changed=false;
    state.v06RelicDetails||={};
    for(const [id,b] of Object.entries(state.characters||{})){
      if(!b)continue;
      const detail=state.v06RelicDetails[id],legacy=b.relics;
      if(!detail&&!legacy)continue;
      const records=nexusAccount.normalizeRelics(detail,legacy,nexusAccountCatalog.relicSets||{});
      const nextLegacy=nexusAccount.toLegacy(records,nexusAccountCatalog.relicSets||{},legacy||{});
      if(JSON.stringify(detail||null)!==JSON.stringify(records)){
        state.v06RelicDetails[id]=records;changed=true;
      }
      if(JSON.stringify(legacy||{})!==JSON.stringify(nextLegacy)){
        b.relics=nextLegacy;changed=true;
      }
    }
    if(changed)save();
  }
  function readyAccount(){
    if(nexusAccountPromise)return nexusAccountPromise;
    nexusAccountPromise=Promise.all([
      import('./nexus-account-engine.js?v=2'),
      fetch('./data/live-game.json',{cache:'no-store'}).then(r=>{
        if(!r.ok)throw Error('Catálogo do jogo indisponível: '+r.status);
        return r.json();
      })
    ]).then(([engine,game])=>{
      nexusAccount=engine;nexusAccountCatalog=game;
      migrateAccountRelics();
      if(page==='profile'||page==='nexia')refresh();
      return engine;
    }).catch(error=>{
      console.warn('Dados da conta indisponíveis:',error);
      nexusAccountPromise=null;
      return null;
    });
    return nexusAccountPromise;
  }
  readyAccount();
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
      ['image:'+STR+'icon/path/Elation.png','Warp Advisor','Pity, jades e garantias',"window.NexusWarpAdvisor?.open()",'warp'],
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

  function profileHistory(id,b){
    const entries=state.v06BuildHistory?.[id]||[];
    const columns=['pv','atk','def','spd','crit','cdmg','e','s'];
    const names={pv:'PV',atk:'ATQ',def:'DEF',spd:'VEL',crit:'Chance CRIT',cdmg:'Dano CRIT',e:'Eidolons',s:'Sobreposição'};
    const current=b||{};
    const records=entries.map((snapshot,i)=>{
      const old=snapshot.build||{},date=new Date(snapshot.recordedAt);
      const stamp=Number.isFinite(date.getTime())?date.toLocaleString('pt-BR'):'Data não informada';
      const diffs=columns.filter(key=>old[key]!==current[key]).map(key=>
        '<li><strong>'+safe(names[key])+'</strong><span>'+safe(old[key]??'—')+' → '+safe(current[key]??'—')+'</span></li>').join('');
      const oldRelics=(snapshot.relics||[]).filter(r=>r?.setId||r?.main?.stat).length;
      return '<article class="v11-history-entry"><header><span>Versão anterior · '+safe(stamp)+'</span><button type="button" data-restore-build="'+i+'" data-character="'+safe(id)+'">Restaurar</button></header>'+
        '<p>Relíquias registradas anteriormente: '+oldRelics+'/6 · Cone: '+safe(old.cone||'não informado')+'</p>'+
        '<ul>'+(diffs||'<li>Sem diferenças nos atributos gerais; equipamentos ou outros campos podem ter mudado.</li>')+'</ul></article>';
    }).join('');
    return '<section class="v11-history"><span class="v06-kicker">BUILD HISTORY · MINHA CONTA</span><h2>Histórico de builds</h2>'+
      '<p>As últimas 20 alterações importadas ou editadas são preservadas neste navegador, sem incluir imagens grandes. A restauração não modifica a conta do jogo.</p>'+
      (entries.length?records:'<p>Nenhuma versão anterior registrada. As próximas alterações da build ficarão disponíveis aqui.</p>')+'</section>';
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-restore-build][data-character]');
    if(button)window.v11RestoreBuildHistory?.(button.dataset.character,Number(button.dataset.restoreBuild));
  });
  window.v11RestoreBuildHistory=function(id,index){
    const entry=state.v06BuildHistory?.[id]?.[index];if(!entry)return;
    if(!window.confirm('Restaurar esta build anterior? A build atual será guardada no histórico antes da troca.'))return;
    state.characters[id]=JSON.parse(JSON.stringify(entry.build||{}));
    state.v06RelicDetails||={};
    if(entry.relics)state.v06RelicDetails[id]=JSON.parse(JSON.stringify(entry.relics));
    else delete state.v06RelicDetails[id];
    const persisted=verifiedAccountSave(id);
    tab='history';refresh();
    showToast(persisted?'Build anterior restaurada; versão substituída preservada no histórico.':'Não foi possível confirmar a gravação. Exporte um backup!');
  };

  // Persistent Team Lab bridge: all teams travel with the Nexus JSON backup.
  // Farm planner state shares the Nexus backup and does not invent item stocks.
  // The planner is an estimate and does not mutate real Warp history.
  window.NexusWarpBridge={
    read:()=>JSON.parse(JSON.stringify(state.v06WarpPlan||{})),
    save:plan=>{
      state.v06WarpPlan=JSON.parse(JSON.stringify(plan));
      save();
      return true;
    }
  };

  window.NexusFarmBridge={
    roster:()=>Object.entries(state.characters||{}).filter(([id,c])=>c&&gameData.chars?.[id])
      .map(([id,c])=>({id,name:lookup(id)?.name||gameData.chars[id].name,level:Number(c.level||1)})),
    inventory:()=>JSON.parse(JSON.stringify(state.v06MaterialInventory||{})),
    traceRead:(id)=>JSON.parse(JSON.stringify(state.v06TracePlans?.[id]||{})),
    traceWrite:(id,plan)=>{
      state.v06TracePlans||={};
      state.v06TracePlans[id]=JSON.parse(JSON.stringify(plan));
      save();return true;
    },
    put:(id,have)=>{
      const value=Number(have);
      if(!Number.isInteger(value)||value<0||value>100000000)throw Error('Estoque inválido.');
      state.v06MaterialInventory||={};
      state.v06MaterialInventory[String(id)]=value;save();
    }
  };

  window.NexusTeamLabBridge={
    roster:()=>Object.entries(state.characters||{}).filter(([id,data])=>data&&gameData.chars?.[id])
      .map(([id,data])=>({id,name:lookup(id)?.name||gameData.chars[id]?.name||id,
        path:gameData.chars[id]?.path||'',element:gameData.chars[id]?.element||'',
        level:Number(data.level||1),e:Number(data.e||0),s:Number(data.s||1)})),
    list:()=>JSON.parse(JSON.stringify(state.v06SavedTeams||[])),
    save:(team)=>{
      const ids=team?.members||[];
      if(ids.length!==4||new Set(ids).size!==4||!ids.every(id=>state.characters?.[id]))
        throw Error('A equipe precisa de quatro personagens diferentes cadastrados nesta conta.');
      state.v06SavedTeams||=[];
      const entry={id:String(team.id||'team-'+Date.now()),name:String(team.name||'Equipe').slice(0,70),
        purpose:String(team.purpose||'geral'),members:[...ids],
        updatedAt:new Date().toISOString()};
      const i=state.v06SavedTeams.findIndex(x=>x.id===entry.id);
      if(i<0)state.v06SavedTeams.push(entry);else state.v06SavedTeams[i]=entry;
      save();return entry;
    },
    delete:(id)=>{state.v06SavedTeams=(state.v06SavedTeams||[]).filter(x=>x.id!==id);save();}
  };

  function profile06(){
    const id=state.profile||'1503', c=lookup(id),b=state.characters[id],look=selectLook(id),pic=state.v06Art?.[id]==='preview'?imgSrc(id,'preview'):look.art;
    const active=tab||'overview';
    const switches=[['overview','Atributos'],['kit','Kit e rastros'],['kitlab','Kit Lab 2.0'],['eidolons','Eidolons'],['cone','Cone de Luz'],['relics','Relíquias'],['teams','Equipes'],['farm','Ascensão'],['history','Histórico']];
    const body=active==='overview'?profileOverview(id,b):active==='kit'?profileKit(id):active==='kitlab'?'<section class="v11-kitlab-panel"><span class="v06-kicker">KIT LAB · FONTE PT-BR</span><h2>Habilidades completas e explicação do Pom-Pom</h2><p>Consulte multiplicadores por nível, rastros e Eidolons E1–E6. Dados desconhecidos não são inventados.</p><button type="button" class="v06-primary" data-nexus-kit-for="'+safe(id)+'">Abrir Kit Lab completo</button></section>':active==='eidolons'?profileEidolons(id,b):active==='cone'?profileCone(id,b):active==='relics'?profileRelics(id,b):active==='farm'?'<section class="v11-team-lab-entry"><h3>Farm Planner 2.0 · Ascensão</h3><p>Veja quantidades reais para elevar esta personagem até a ascensão desejada, com estoque e materiais faltantes.</p><button type="button" data-nexus-farm-for="'+safe(id)+'">Planejar ascensão</button><button type="button" data-nexus-traces-for="'+safe(id)+'">Planejar rastros e materiais</button></section>':active==='history'?profileHistory(id,b):profileTeams(id,b)+'<section class="v11-team-lab-entry"><h3>Team Lab 2.0</h3><p>Monte e salve equipes com quatro personagens da sua conta; confira os papéis e as restrições.</p><button type="button" data-nexus-team-lab>Montar equipe</button></section>';
    const badge= b?'<span class="v06-ownership">NA SUA CONTA</span>':'<span class="v06-ownership muted">CATÁLOGO</span>';
    return '<div class="v06-profile"><section class="v06-char-hero"><div class="v06-char-hero-art" style="background-image:url(\''+safe(pic)+'\')"></div><div class="v06-hero-shade"></div>'+
    '<button class="v06-back" onclick="route(\'library\')">‹ Arquivo</button><div class="v06-character-info">'+badge+'<h1>'+safe(c.name)+'</h1><div class="v06-tags"><span>'+safe(b?'Nv. '+(b.level||1):'Não registrado')+'</span><span>E'+fmt(b?.e||0)+' · S'+fmt(b?.s||1)+'</span><span>✧ '+safe(look.group.toUpperCase())+'</span></div></div></section>'+
    '<div class="v06-profile-controls"><button class="v06-primary" onclick="'+(b?'editBuild(\''+id+'\')':'addOwned(\''+id+'\')')+'">'+(b?'Editar minha build':'＋ Adicionar à conta')+'</button><button class="v06-secondary" onclick="v06StartImport(\''+id+'\')">⇧ Importar print</button></div>'+
    '<nav class="v06-tabs">'+switches.map(([key,title])=>'<button class="'+(active===key?'active':'')+'" onclick="tab=\''+key+'\';refresh()">'+title+'</button>').join('')+'</nav>'+
    accountStorageNotice()+'<div class="v06-profile-body">'+body+'</div>'+((b&&state.v06Screens?.[id])?'<section class="v06-upload-reference"><h3>Seu print de referência</h3><img loading="lazy" src="'+state.v06Screens[id]+'" alt="Print importado por você"><button onclick="v06StartImport(\''+id+'\')">Atualizar print</button></section>':'')+
    '</div>';
  }
  profile=profile06;

  function verifiedGuide(id,subject){
    const c=lookup(id),owned=state.characters[id],name=c.name;
    if(!owned)return 'O Pom-Pom explica as condições do kit de '+name+' como parte do catálogo. Adicione o personagem à sua conta para receber orientação dos seus atributos e investimentos.';
    const stat=owned.spd?' • '+owned.spd+' VEL':'';
    return 'Na sua conta, '+name+' está no nível '+fmt(owned.level||1)+', E'+fmt(owned.e||0)+'S'+fmt(owned.s||1)+stat+'. Antes de ajustar a rotação, compare os outros três integrantes e os gatilhos do kit. A recomendação não pressupõe um cone ou relíquia que ainda não foi cadastrado.';
  }

  // Keep the six illustrated fragments in the overview synchronized with the modal.
  function repairOverviewEidolons(markup,id){
    const holder=document.createElement('div');holder.innerHTML=markup;
    const raw=[...holder.querySelectorAll('[onclick*="showEido"] img,img[onclick*="showEido"]')];
    const images=[...new Set(raw)];
    for(let i=0;i<Math.min(6,images.length);i++){
      const img=images[i],n=i+1,art=eidoArtwork(id,n);
      img.classList.add('nexus-eidolon-fragment');
      img.dataset.character=id;img.dataset.eidolon=String(n);
      img.alt='Fragmento ilustrado E'+n+' de '+lookup(id).name;
      img.setAttribute('onerror',"this.onerror=null;this.hidden=true;this.parentElement.classList.add('nexus-fragment-unavailable');");
      if(art)img.src=art;
    }
    return holder.innerHTML;
  }
  profileOverview=function(id,b){
    loadEidolonCatalog().catch(error=>console.warn('Artes dos Eidolons:',error.message));
    const wrapper=document.createElement('div');
    wrapper.innerHTML=repairOverviewEidolons(base.profileOverview(id,b),id);
    // The hero already has Edit and Import actions; do not repeat the buttons.
    const duplicate=wrapper.querySelector('.row.wrap.space-between button');
    if(duplicate)duplicate.remove();
    const cards=[...wrapper.querySelectorAll('.card.card-body')];
    const coneCard=cards.find(card=>b?.cone&&card.textContent.includes(b.cone));
    if(coneCard){
      const action=document.createElement('button');action.type='button';
      action.className='v11-cone-inline-action';
      action.textContent='Ver arte, Caminho e efeito do cone ›';
      action.setAttribute('onclick',"v11ProfileTab('cone')");
      coneCard.appendChild(action);
    }
    return wrapper.innerHTML+renderAccountCoach(id);
  };

  // Use the live character-rank catalog for every released and future character.
  // E3/E5 frequently reuse skill icons and their upstream filenames can vanish.
  // A local SVG fallback keeps these slots legible without inventing official art.
  const eidoFallback=n=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="21" fill="#1b2434"/><path d="M50 10 60 39 90 50 60 61 50 90 40 61 10 50 40 39Z" fill="none" stroke="#e2c0a0" stroke-width="4"/><text x="50" y="57" font-family="Arial" font-size="22" fill="#e2c0a0" text-anchor="middle">E'+n+'</text></svg>');

  // One PT-BR source of truth for all current AND future playable characters.
  // gameData.chars comes from the shell; rank descriptions live in the separate
  // synchronized data/live-game.json bundle, not necessarily in gameData.ranks.
  let eidolonCatalog=null,eidolonCatalogPromise=null,eidolonImages={};
  function rankRecord(id,n){
    const character=eidolonCatalog?.chars?.[id]||gameData.chars?.[id];
    const ids=character?.ranks||[];
    const keys=[ids[n-1],String(id)+'0'+n,String(id)+String(n).padStart(2,'0')].filter(Boolean);
    for(const key of keys){
      const record=eidolonCatalog?.ranks?.[key]||gameData.ranks?.[key];
      if(record?.name||record?.desc)return record;
    }
    return null;
  }
  const eidoIcon=(rank,n)=>rank?.icon?STR+rank.icon:eidoFallback(n);
  function eidoArtwork(id,n){
    return eidolonImages[String(id)]?.[n-1]||EIDO_ART?.[id]?.[n-1]||'';
  }
  function updateEidolonArtInPage(){
    document.querySelectorAll('img.nexus-eidolon-fragment[data-character][data-eidolon]').forEach(img=>{
      const art=eidoArtwork(img.dataset.character,Number(img.dataset.eidolon));
      if(art){
        img.hidden=false;img.parentElement?.classList.remove('nexus-fragment-unavailable');
        if(img.getAttribute('src')!==art)img.src=art;
      }
    });
    document.querySelectorAll('.v10-eido-tile[data-character][data-eidolon]').forEach(tile=>{
      const id=tile.dataset.character,n=Number(tile.dataset.eidolon),r=rankRecord(id,n);
      tile.title=r?.name||'E'+n;
      tile.setAttribute('aria-label','Abrir E'+n+': '+(r?.name||'Eidolon'));
      const title=tile.querySelector('small');if(title)title.textContent=r?.name||'Eidolon';
      const art=eidoArtwork(id,n);
      if(art){
        const old=tile.querySelector('img'),img=old||document.createElement('img');
        img.alt='Fragmento ilustrado E'+n;
        img.onerror=()=>{img.hidden=true;tile.classList.add('nexus-fragment-unavailable');};
        if(!old)tile.insertBefore(img,title);
        img.hidden=false;tile.classList.remove('nexus-fragment-unavailable');
        if(img.getAttribute('src')!==art)img.src=art;
        tile.querySelector('.nexus-fragment-loading')?.remove();
      }else{
        tile.querySelector('img')?.setAttribute('hidden','');
        tile.classList.add('nexus-fragment-unavailable');
        const pending=tile.querySelector('.nexus-fragment-loading');if(pending)pending.textContent='Arte indisponível';
      }
    });
  }
  function loadEidolonCatalog(){
    if(eidolonCatalog)return Promise.resolve(eidolonCatalog);
    if(!eidolonCatalogPromise){
      const fetchJSON=path=>fetch(path,{cache:'no-store'}).then(r=>{
        if(!r.ok)throw Error('catálogo indisponível: '+path+' ('+r.status+')');
        return r.json();
      });
      eidolonCatalogPromise=Promise.all([
        fetchJSON('./data/live-game.json'),
        fetchJSON('./data/eidolon-art.json').catch(error=>{
          console.warn('Catálogo ilustrado indisponível:',error.message);
          return {characters:{}};
        })
      ]).then(([game,art])=>{
        if(!game?.chars||!game?.ranks)throw Error('catálogo de Eidolons incompleto');
        eidolonCatalog=game;eidolonImages=art?.characters||{};
        updateEidolonArtInPage();
        return game;
      }).catch(error=>{eidolonCatalogPromise=null;throw error;});
    }
    return eidolonCatalogPromise;
  }
  function addEidoStyles(){
    if(document.getElementById('nexus-eido-repair-css'))return;
    const style=document.createElement('style');style.id='nexus-eido-repair-css';
    style.textContent='.v10-eido-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin:18px 0}.v10-eido-tile{min-width:0;border:1px solid rgba(226,192,160,.33);background:rgba(20,27,43,.7);border-radius:14px;padding:7px 3px 8px;color:inherit;display:flex;align-items:center;flex-direction:column;gap:5px;cursor:pointer;position:relative}.v10-eido-tile.owned{border-color:rgba(122,212,181,.7);background:rgba(17,44,45,.66)}.v10-eido-tile img{width:min(100%,64px);height:53px;object-fit:contain;display:block}.v10-eido-tile strong{font-size:12px}.v10-eido-tile small{display:block;font-size:10px;opacity:.78;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.v10-eido-modal{display:grid;grid-template-columns:minmax(90px,150px) 1fr;gap:17px;align-items:start}.v10-eido-modal img{width:100%;max-height:230px;object-fit:contain;background:rgba(14,22,39,.5);border:1px solid rgba(226,192,160,.2);border-radius:12px}.v10-eido-modal p{line-height:1.65;white-space:pre-line}.v10-eido-note{font-size:12px;opacity:.8;margin:6px 0 14px}@media(max-width:420px){.v10-eido-grid{gap:4px}.v10-eido-tile{border-radius:10px;padding:6px 1px}.v10-eido-tile img{height:41px}.v10-eido-tile small{display:none}.v10-eido-modal{grid-template-columns:86px 1fr;gap:10px}}';
    style.textContent += '.v10-eido-detail{display:flex;flex-direction:column;gap:18px;min-width:0}.v10-eido-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px}.v10-eido-toolbar button,.v10-eido-navigation button{border:1px solid rgba(226,192,160,.42);border-radius:12px;background:rgba(20,29,48,.68);color:#f4e2d3;padding:11px 14px;font:inherit;cursor:pointer;min-height:44px}.v10-eido-toolbar span{font-size:12px;letter-spacing:.1em;color:#d9bcae}.v10-eido-art{margin:0;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;min-height:160px}.v10-eido-art img{display:block;width:auto;max-width:100%;height:auto;max-height:min(42vh,390px);object-fit:contain;filter:drop-shadow(0 14px 25px rgba(0,0,0,.18))}.v10-eido-art figcaption{font-size:11px;text-align:center;color:#bcaec4}.v10-eido-content{min-width:0}.v10-eido-eyebrow{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#dbc6ba}.v10-eido-name{font-size:clamp(21px,5.4vw,30px);font-family:Georgia,serif;line-height:1.22;margin:11px 0 14px}.v10-eido-what{display:inline-block;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#c9b7dd}.v10-eido-effect{font-size:clamp(15px,3.8vw,18px);line-height:1.72;white-space:pre-line;overflow-wrap:anywhere;color:#f1e6ea;margin:10px 0 20px}.v10-eido-source{font-size:11px;line-height:1.6;color:#b8aabb}.v10-eido-navigation{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:7px;border-top:1px solid rgba(226,192,160,.22);padding-top:16px}.v10-eido-navigation button:first-child{justify-self:start}.v10-eido-navigation button:last-child{justify-self:end}.v10-eido-navigation .v10-eido-return{background:rgba(80,49,78,.65);font-size:13px}@media(max-width:420px){.v10-eido-detail{gap:14px}.v10-eido-art img{max-height:min(39vh,345px)}.v10-eido-navigation button{padding:10px 8px;font-size:12px}.v10-eido-navigation .v10-eido-return{font-size:11px}}';
    style.textContent += '.nexus-eidolon-fragment{object-fit:contain!important;filter:none!important}.v10-eido-tile img{width:100%;height:56px;object-fit:contain!important;filter:none!important}.v10-eido-tile .nexus-fragment-loading{min-height:56px;display:grid;place-items:center;text-align:center;font-size:10px;color:#d3bdc2}.nexus-fragment-unavailable{border-style:dashed!important}.v10-eido-art figcaption{letter-spacing:.02em}@media(max-width:420px){.v10-eido-tile img,.v10-eido-tile .nexus-fragment-loading{height:44px;min-height:44px}}';
    document.head.appendChild(style);
  }
  profileEidolons=function(id,b){
    addEidoStyles();
    loadEidolonCatalog().catch(error=>console.warn('Catálogo de Eidolons:',error.message));
    const character=gameData.chars?.[id]||{},owned=Number(b?.e||0);
    const tiles=Array.from({length:6},(_,i)=>{
      const n=i+1,r=rankRecord(id,n),icon=eidoArtwork(id,n);
      const label=r?.name||'Eidolon ainda não catalogado';
      return '<button type="button" class="v10-eido-tile '+(b&&n<=owned?'owned':'')+'" data-character="'+safe(id)+'" data-eidolon="'+n+'" title="'+safe(label)+'" onclick="showEido(\''+id+'\','+n+')" aria-label="Abrir E'+n+': '+safe(label)+'"><strong>E'+n+'</strong>'+(icon?'<img class="nexus-eidolon-fragment" loading="lazy" src="'+safe(icon)+'" alt="Fragmento ilustrado E'+n+'" onerror="this.hidden=true;this.parentElement.classList.add(\'nexus-fragment-unavailable\')">':'<span class="nexus-fragment-loading">Carregando arte…</span>')+'<small>'+safe(label)+'</small></button>';
    }).join('');
    return '<div class="v06-eidolon-intro">'+pomCard('Eidolons verificados por personagem','Os seis fragmentos E1–E6 são ilustrações individuais do personagem, como na ficha da Pearl. O catálogo visual é atualizado automaticamente com os lançamentos.','EIDOLONS')+'</div>'+
      '<div class="v10-eido-grid">'+tiles+'</div><p class="v10-eido-note">E'+owned+' registrado na sua conta. Toque em cada Eidolon para ver o efeito e a arte disponível.</p>';
  };

  profileKit=function(id){return base.profileKit(id)+pomCard('Como interpretar o kit','O texto do jogo e seus multiplicadores estão acima. Nas explicações práticas, observe gatilho, custo, duração, aliados elegíveis e a ordem das ações. Dados de beta são identificados separadamente.','KIT COMPLETO');};

  function accountStatOptions(current){
    const choices=['',...(nexusAccount?.STATS||[])];
    return choices.map(value=>'<option value="'+safe(value)+'" '+(current===value?'selected':'')+'>'+safe(value||'Selecione o atributo')+'</option>').join('');
  }
  function accountSetOptions(current,slot){
    const list=Object.values(nexusAccountCatalog?.relicSets||{}).filter(set=>
      slot<4?Number(set.id)<300:Number(set.id)>=300).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    if(current&&!list.some(x=>String(x.id)===String(current)))
      list.unshift({id:current,name:'Conjunto salvo · '+current});
    return '<option value="">Selecione o conjunto</option>'+
      list.map(set=>'<option value="'+safe(set.id)+'" '+(String(set.id)===String(current)?'selected':'')+'>'+safe(set.name)+'</option>').join('');
  }
  function renderAccountCoach(id){
    const b=state.characters?.[id]||{};
    if(!nexusAccount||!nexusAccountCatalog){
      readyAccount();
      return '<div class="v11-coach-loading" role="status">Conferindo a build, os conjuntos e o cone equipado…</div>';
    }
    const character=nexusAccountCatalog.chars?.[id]||lookup(id)||{};
    const cone=accountCone(id),rank=cone?nexusAccountCatalog.coneRanks?.[cone.id]:null;
    const notes=nexusAccount.buildCoach({
      character,build:b,records:accountRecords(id),sets:nexusAccountCatalog.relicSets||{},cone,coneRank:rank,
      skills:(nexusAccountCatalog.chars?.[id]?.skills||[]).map(k=>nexusAccountCatalog.skills?.[k]).filter(Boolean)
    });
    return '<section class="v11-coach" aria-label="Análise individual do Pom-Pom"><div class="v11-coach-head"><img src="'+v06Asset('pompom')+'" alt="Pom-Pom" loading="lazy"><div><span class="v06-kicker">LEITURA DA SUA CONTA</span><h3>Pom-Pom analisa sua build</h3><p>Dados registrados · recomendações e verificações, não uma nota genérica</p></div></div>'+
      '<div class="v11-coach-list">'+notes.map((item,i)=>i<3?
         '<article class="v11-coach-note '+safe(item.kind)+'"><span class="v11-note-number">'+String(i+1).padStart(2,'0')+'</span><div><strong>'+safe(item.title)+'</strong><p>'+safe(item.body)+'</p></div></article>':
         '<details class="v11-coach-note v11-coach-collapsed '+safe(item.kind)+'"><summary><span class="v11-note-number">'+String(i+1).padStart(2,'0')+'</span><strong>'+safe(item.title)+'</strong><span aria-hidden="true" class="v11-coach-expand">+</span></summary><p>'+safe(item.body)+'</p></details>').join('')+'</div>'+
      '<div class="v11-coach-actions"><button type="button" onclick="v11ProfileTab(\'relics\')">Conferir relíquias</button><button type="button" onclick="v11ProfileTab(\'cone\')">Ver cone equipado</button></div></section>';
  }
  window.v11ProfileTab=function(key){
    tab=key;refresh();
    requestAnimationFrame(()=>document.querySelector('.v06-tabs')?.scrollIntoView({block:'start',behavior:'smooth'}));
  };
  function profileCone(id,b){
    if(!nexusAccount||!nexusAccountCatalog){
      readyAccount();
      return '<section class="v11-cone-panel"><p role="status">Carregando a ficha do cone equipado…</p></section>';
    }
    const cone=accountCone(id);
    if(!b?.cone||!cone)return '<section class="v11-cone-panel"><span class="v06-kicker">CONE DE LUZ EQUIPADO</span><h2>'+safe(b?.cone||'Nenhum cone cadastrado')+'</h2><p>Este cone não foi identificado pelo nome salvo. Abra a edição da build para conferir a grafia.</p><button onclick="editBuild(\''+id+'\')">Editar equipamento</button></section>';
    const rank=nexusAccountCatalog.coneRanks?.[cone.id],effect=nexusAccount.coneEffect(rank,b?.s||1);
    const artwork=cone.portrait||cone.preview||cone.icon,src=artwork?STR+artwork:'';
    const compatible=(nexusAccountCatalog.chars?.[id]?.path||gameData.chars?.[id]?.path)===cone.path;
    const star='★'.repeat(Math.max(1,Math.min(5,Number(cone.rarity||5))));
    return '<section class="v11-cone-panel"><div class="v11-cone-top"><div class="v11-cone-art">'+(src?'<img loading="lazy" src="'+safe(src)+'" alt="Arte do cone '+safe(cone.name)+'" onerror="this.hidden=true;this.parentElement.classList.add(\'no-art\')">':'')+'</div>'+
      '<div class="v11-cone-copy"><span class="v06-kicker">CONE DE LUZ EQUIPADO · S'+Number(b?.s||1)+'</span><h2>'+safe(cone.name)+'</h2><p class="v11-cone-stars">'+star+'</p><p>Caminho: '+safe(nexusAccount.PATHS[cone.path]||cone.path||'Não informado')+'</p><p class="v11-cone-path '+(compatible?'good':'warning')+'">'+(compatible?'✓ Caminho compatível com a personagem':'⚠ Caminho diferente; o efeito passivo pode não ativar')+'</p></div></div>'+
      '<div class="v11-cone-effect"><small>HABILIDADE DO CONE · SOBREPOSIÇÃO S'+Number(b?.s||1)+'</small><h3>'+safe(rank?.skill||'Habilidade de cone')+'</h3><p>'+safe(effect||'A descrição do efeito ainda não está disponível no catálogo sincronizado.')+'</p></div>'+
      '<div class="v11-cone-foot"><button type="button" onclick="editBuild(\''+id+'\')">Alterar cone ou sobreposição</button><button type="button" onclick="v11ProfileTab(\'overview\')">← Voltar aos atributos</button></div>'+
      '<p class="v11-source">Fonte: catálogo PT-BR sincronizado do jogo. Os valores foram resolvidos para a sobreposição salva; alterações feitas no jogo precisam de nova importação.</p></section>';
  }
  function profileRelicCard(id,index,p,images){
    const real=nexusAccount,subs=p.subs||[],present=Boolean(p.setId||p.main?.stat),main=p.main?.stat||'Atributo principal pendente';
    const mainValue=p.main?.value===null||p.main?.value===undefined?'—':real.pretty(main,p.main.value);
    const warnings=(!p.setId?'Conjunto pendente. ':'')+(subs.filter(s=>!s.stat||s.value===null).length?'Confira os subatributos.':'');
    const src=images?.[index]||'';
    return '<article class="v11-relic-card '+(present?'is-saved':'is-pending')+'"><button type="button" class="v11-relic-open" onclick="v11EditRelic(\''+id+'\','+index+')" aria-label="Ver e editar '+safe(p.slot)+'">'+
      '<span class="v11-relic-image">'+(src?'<img loading="lazy" src="'+safe(src)+'" alt="Recorte da relíquia '+safe(p.slot)+'">':'<span>✦</span>')+'</span>'+
      '<span class="v11-relic-title"><small>0'+(index+1)+' · '+safe(p.slot)+' '+(p.level!==null?'+'+p.level:'')+'</small><strong>'+safe(p.setId?accountSetName(p):present?'Conjunto não identificado':'Não registrado')+'</strong><em>'+safe(main)+' · '+safe(mainValue)+'</em></span><span class="v11-open-arrow">›</span></button>'+
      '<div class="v11-relic-subs">'+subs.filter(s=>s.stat&&s.value!==null).map(s=>'<span>'+safe(s.stat)+' <b>'+safe(real.pretty(s.stat,s.value))+'</b></span>').join('')+'</div>'+
      (warnings?'<p class="v11-relic-warning">'+safe(warnings)+'</p>':'')+'</article>';
  }
  profileRelics=function(id,b){
    if(!nexusAccount){
      readyAccount();
      return '<section class="v11-relics"><p role="status">Carregando os equipamentos já salvos na sua conta…</p></section>';
    }
    const rows=accountRecords(id),analysis=nexusAccount.examineRelics(rows),images=state.v06Relics?.[id]||[];
    return '<section class="v11-relics"><div class="v11-section-lead"><span class="v06-kicker">EQUIPAMENTO · SUA CONTA</span><h2>Relíquias equipadas</h2><p>'+analysis.registered+'/6 peças registradas · '+analysis.complete+'/6 completas. Toque em uma peça para revisar conjunto, atributo principal e subatributos.</p></div>'+
      '<div class="v11-relic-grid">'+rows.map((piece,i)=>profileRelicCard(id,i,piece,images)).join('')+'</div>'+
      '<div class="v11-actions"><button type="button" onclick="v06StartImport(\''+id+'\')">⇧ Atualizar equipamentos pelo print</button><button type="button" onclick="v11ProfileTab(\'cone\')">Ver cone equipado</button></div></section>'+
      renderAccountCoach(id);
  };
  window.v11EditRelic=async function(id,index){
    await readyAccount();
    if(!nexusAccount||!state.characters?.[id])return showToast('Não foi possível abrir a edição. Verifique sua conexão.');
    const r=accountRecords(id)[index];if(!r)return;
    const main='<div class="v11-edit-row"><label>Principal<select name="main">'+accountStatOptions(r.main?.stat||'')+'</select></label><label>Valor<input name="mainval" inputmode="decimal" value="'+safe(r.main?.value??'')+'"></label></div>';
    const subs=(r.subs||[]).map((sub,n)=>'<div class="v11-edit-row"><label>Subatributo '+(n+1)+'<select name="sub'+n+'">'+accountStatOptions(sub.stat||'')+'</select></label><label>Valor<input inputmode="decimal" name="value'+n+'" value="'+safe(sub.value??'')+'"></label></div>').join('');
    const html='<form class="v11-edit-form" onsubmit="v11SaveRelic(event,\''+id+'\','+index+')">'+
      '<p>Os campos abaixo são os mesmos utilizados no resumo da build e nas dicas do Pom-Pom. Editar aqui atualiza todas as abas.</p>'+
      '<label>Conjunto equipado<select name="set">'+accountSetOptions(r.setId,index)+'</select></label>'+
      '<label>Nível da peça<input name="level" type="number" min="0" max="15" value="'+safe(r.level??'')+'"></label>'+
      main+'<h3>Quatro subatributos</h3>'+subs+
      '<button class="v06-primary" type="submit">Salvar esta relíquia</button><button type="button" class="v06-secondary" onclick="closeModal()">Cancelar</button></form>';
    showModal('Equipamento · '+nexusAccount.SLOTS[index],html);
  };
  window.v11SaveRelic=function(event,id,index){
    event.preventDefault();
    if(!nexusAccount||!state.characters?.[id])return;
    const fd=new FormData(event.target),num=k=>nexusAccount.numeric(fd.get(k));
    const records=accountRecords(id),r=records[index];
    const stat=String(fd.get('main')||''),value=num('mainval'),level=num('level');
    if(stat&&value===null){showToast('Preencha o valor do atributo principal.');return;}
    const setId=String(fd.get('set')||'');
    r.setId=setId;r.setName=nexusAccountCatalog?.relicSets?.[setId]?.name||r.setName||'';
    r.level=level;r.main={stat,value};
    r.subs=Array.from({length:4},(_,i)=>({stat:String(fd.get('sub'+i)||''),value:num('value'+i)}));
    if(r.subs.some(x=>x.stat&&x.value===null)){showToast('Confira os valores dos subatributos escolhidos.');return;}
    records[index]=r;
    const corrected=nexusAccount.normalizeRelics(records,null,nexusAccountCatalog?.relicSets||{});
    state.v06RelicDetails||={};state.v06RelicDetails[id]=corrected;
    state.characters[id].relics=nexusAccount.toLegacy(corrected,nexusAccountCatalog?.relicSets||{},state.characters[id].relics||{});
    const persisted=verifiedAccountSave(id);closeModal();tab='relics';refresh();showToast(persisted?'Relíquia atualizada e salva em todas as abas':'Relíquia atualizada nesta sessão, mas não persistiu. Exporte um backup!');
  };

  let eidoModalSequence=0;
  function eidoModalContent(id,n,rank,loading=false,error=''){
    const character=eidolonCatalog?.chars?.[id]||gameData.chars?.[id]||lookup(id)||{};
    const name=rank?.name||'Eidolon '+n;
    const description=rank?.desc||(loading?'Consultando os efeitos em português no catálogo atualizado…':
      error?'Não foi possível consultar os efeitos agora. Verifique sua conexão e tente novamente.':
      'Os efeitos de E'+n+' ainda não foram encontrados no catálogo sincronizado.');
    const art=eidoArtwork(id,n);
    const caption=art?'Arte original do Eidolon E'+n:'Aguardando a arte original no catálogo';
    const change=(n===3||n===5)?'Aprimoramento dos níveis de habilidades, conforme a descrição oficial.':'Efeito do Eidolon no jogo';
    const previous=n>1?'<button type="button" onclick="showEido(\''+id+'\','+(n-1)+')">← E'+(n-1)+'</button>':'<span></span>';
    const next=n<6?'<button type="button" onclick="showEido(\''+id+'\','+(n+1)+')">E'+(n+1)+' →</button>':'<span></span>';
    return '<section class="v10-eido-detail" data-eido-id="'+safe(id)+'" data-eido-level="'+n+'">'+
      '<div class="v10-eido-toolbar"><button type="button" onclick="closeModal()" aria-label="Voltar para a ficha do personagem">← Voltar à ficha</button><span>E'+n+' / E6</span></div>'+
      '<figure class="v10-eido-art">'+(art?'<img src="'+safe(art)+'" alt="Fragmento ilustrado E'+n+' de '+safe(character.name||lookup(id)?.name||'personagem')+'" onerror="this.hidden=true;this.nextElementSibling.textContent=\'Imagem temporariamente indisponível\'">':'')+'<figcaption>'+safe(caption)+'</figcaption></figure>'+
      '<div class="v10-eido-content"><span class="v10-eido-eyebrow">'+safe(character.name&&character.name!=='{NICKNAME}'?character.name:lookup(id)?.name||'Personagem')+' · E'+n+'</span>'+
      '<h3 class="v10-eido-name">'+safe(name)+'</h3><span class="v10-eido-what">'+safe(change)+'</span>'+
      '<p class="v10-eido-effect" '+(loading?'aria-live="polite"':'')+'>'+safe(description)+'</p>'+
      '<p class="v10-eido-source">'+(error?'Não foi possível sincronizar':'Fonte: dados do jogo · PT-BR · catálogo sincronizado')+'</p></div>'+
      '<nav class="v10-eido-navigation" aria-label="Navegação entre Eidolons">'+previous+
      '<button type="button" class="v10-eido-return" onclick="closeModal()">← Voltar à ficha</button>'+next+'</nav></section>';
  }
  showEido=function(id,n){
    n=Number(n);
    if(!id||!Number.isInteger(n)||n<1||n>6)return;
    addEidoStyles();
    const sequence=++eidoModalSequence,rank=rankRecord(id,n);
    showModal('E'+n+' · '+(rank?.name||'Eidolon'),eidoModalContent(id,n,rank,!rank?.desc));
    // The modal remains visible during sync. Never claim a published effect is
    // missing until the current PT-BR catalogue has actually been consulted.
    loadEidolonCatalog().then(()=>{
      if(sequence!==eidoModalSequence)return;
      const slot=document.querySelector('.v10-eido-detail[data-eido-id="'+id+'"][data-eido-level="'+n+'"]');
      if(!slot)return;
      const updated=rankRecord(id,n);
      const shell=document.createElement('div');shell.innerHTML=eidoModalContent(id,n,updated);
      slot.replaceWith(shell.firstElementChild);
    }).catch(error=>{
      if(sequence!==eidoModalSequence)return;
      const slot=document.querySelector('.v10-eido-detail[data-eido-id="'+id+'"][data-eido-level="'+n+'"]');
      if(!slot)return;
      const shell=document.createElement('div');shell.innerHTML=eidoModalContent(id,n,rank,false,String(error.message||error));
      slot.replaceWith(shell.firstElementChild);
    });
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
    // v0.5 still writes into #nexFab even though the modern shell no longer
    // renders the old chat mascot. Preserve the expected DOM target, hidden.
    if(!document.getElementById('nexFab')){
      const legacy=document.createElement('div');
      legacy.id='nexFab';legacy.hidden=true;legacy.setAttribute('aria-hidden','true');
      document.body.appendChild(legacy);
    }
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
    return '<div class="v06-import"><div class="v06-import-drop"><label for="v06-file">⇧<strong>Escolher print de build</strong><small>PNG, JPG ou WEBP · incluindo o cartão ilustrado 2000×2300</small></label><input id="v06-file" type="file" accept="image/png,image/jpeg,image/webp" onchange="v06ReadPrint(this.files[0])"></div>'+
      '<div id="v06-import-preview" class="v06-import-preview"></div>'+
      '<p class="v06-source-note">O OCR analisa o cabeçalho, atributos totais, cone e as seis relíquias (conjunto, atributo principal e subatributos). Valores incertos ficam editáveis. Confirme personagem, E0–E6, S1–S5 e cada valor antes de salvar; o processamento acontece no navegador.</p></div>';
  }
  window.v06StartImport=function(id){
    uploader.hintId=id||'';
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
      // Auto-start extraction; retain editable review and explicit save confirmation.
      Promise.resolve().then(()=>window.v06AutoRead()).catch(error=>console.warn('OCR automático:',error));
    };
    reader.readAsDataURL(file);
  };
  function showImportReview(){
    if(!CATALOG.some(c=>c.id==='8009') && gameData.chars?.['8009']) CATALOG.push({...gameData.chars['8009'],name:'Desbravador · Euforia (Caelus)'});
    const names=CATALOG.filter(c=>c.id!=='future-aha' && !/^80(?:02|04|06|08|10)$/.test(c.id));
    const choice='<option value="">Selecione o personagem correto</option>'+names.map(c=>'<option value="'+c.id+'" '+(c.id===uploader.identifiedId?'selected':'')+'>'+safe(c.id==='8009'?'Caelus · Desbravador da Euforia':c.name)+'</option>').join('')+
      '<option value="__custom__">Personagem não listado — cadastrar nome</option>';
    return '<div class="v06-import-form"><div class="v06-import-image"><img src="'+uploader.preview+'" alt="Print enviado"></div>'+
      '<div class="v06-action-row"><button class="v06-primary" onclick="v06AutoRead()">✧ Reconhecer dados do print</button><button class="v06-secondary" onclick="document.getElementById(\'v06-file\').click()">Trocar imagem</button></div>'+
      '<div class="v06-fieldgroup"><label>Personagem<select id="v06-id" onchange="document.getElementById(\'v06-custom-name-wrap\').style.display=this.value===\'__custom__\'?\'block\':\'none\'">'+choice+'</select></label>'+
      '<label id="v06-custom-name-wrap" style="display:none;grid-column:1/-1">Nome do personagem ainda não listado<input id="v06-custom-name" maxlength="80" placeholder="Nome como aparece no jogo"></label>'+
      '<label>Nível<input id="v06-level" type="number" min="1" max="80" value="80"></label>'+
      '<label>Eidolons (sugestão visual — confirme E0–E6)<select id="v06-e"><option value="">Selecione E0–E6</option>'+Array.from({length:7},(_,i)=>'<option value="'+i+'" '+(i===uploader.eidolon?'selected':'')+'>E'+i+'</option>').join('')+'</select></label>'+
      '<label>Sobreposição do cone<select id="v06-s"><option value="">Selecione S1–S5</option>'+Array.from({length:5},(_,i)=>'<option value="'+(i+1)+'" '+(i+1===uploader.superimposition?'selected':'')+'>S'+(i+1)+'</option>').join('')+'</select></label>'+
      '<label style="grid-column:1/-1">Nome do cone de luz<input id="v06-cone" value="'+safe(uploader.cone||'')+'" placeholder="Nome do cone de luz"></label>'+
      '<label>PV<input type="number" id="v06-pv" placeholder="PV total"></label><label>ATQ<input type="number" id="v06-atk" placeholder="ATQ total"></label>'+
      '<label>DEF<input type="number" id="v06-def" placeholder="DEF total"></label><label>VEL<input type="number" id="v06-spd" placeholder="VEL"></label>'+
      '<label>Chance CRIT %<input type="number" step=".1" id="v06-crit"></label><label>Dano CRIT %<input type="number" step=".1" id="v06-cdmg"></label>'+
      '<label>Quebra %<input type="number" step=".1" id="v06-break"></label><label>Recuperação de Energia %<input type="number" step=".1" id="v06-energy"></label></div>'+
      '<div class="v06-kicker">AS SEIS RELÍQUIAS DO PRINT</div><div class="v06-piece-grid">'+uploader.relImages.map((src,i)=>'<figure><img src="'+src+'" alt="Relíquia '+(i+1)+'"><figcaption>'+['Cabeça','Mãos','Corpo','Pés','Esfera','Corda'][i]+'</figcaption></figure>').join('')+'</div><div id="v06-relic-editor"></div>'+
      '<div id="v06-import-status" class="v06-import-status" role="status">OCR ainda não executado. Ao reconhecer, confira os atributos totais e os detalhes de cada relíquia.</div>'+
      '<label style="display:flex;align-items:flex-start;gap:12px;padding:16px 4px;font-size:13px;line-height:1.45"><input type="checkbox" id="v06-confirm" style="width:22px;height:22px;flex-shrink:0"> Eu conferi personagem, Eidolons, cone e atributos totais no print. Sei que a leitura automática pode errar.</label>'+
      '<button class="v06-primary v06-save-import" onclick="v06SaveImport()">Confirmar e salvar build ✓</button></div>';
  }
  window.v06ShowImportReview=function(){
    const content=uploadPanel()+showImportReview();
    showModal('Importar build · revisar dados',content);
    window.__nexusRelicInspectorPromise=import('./relic-inspector.js?v=3').then(mod=>{
      window.__nexusRelicInspector=mod;
      return mod.initializeRelics(uploader.relImages);
    }).catch(err=>console.warn('Detalhamento das relíquias indisponível',err));
  };
  async function cropRelics(){
    if(!uploader.preview)return;
    const img=new Image();
    await new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;img.src=uploader.preview});
    if(!img.naturalWidth)return;
    const ratio=img.naturalWidth/img.naturalHeight;
    if(ratio<0.8 || ratio>1.6){uploader.relImages=[];return;}
    const illustrated=ratio>=.82&&ratio<=.95;
    const regions=illustrated?[
      [.369,.591,.195,.157],[.571,.591,.195,.157],[.773,.591,.195,.157],
      [.369,.745,.195,.157],[.571,.745,.195,.157],[.773,.745,.195,.157]
    ]:[
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

  // Enka/StarRail screenshot template v0.6.9: consistent 2000x1826 composition.
  // We never run numeric OCR over the relic grid or its stat lines.
  function imageRegion(bitmap,x,y,w,h,mul=2){
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(bitmap.width*w*mul));
    c.height=Math.max(1,Math.round(bitmap.height*h*mul));
    c.getContext('2d').drawImage(bitmap,x*bitmap.width,y*bitmap.height,w*bitmap.width,h*bitmap.height,0,0,c.width,c.height);
    return c;
  }
  function titleMask(bitmap){
    const x=.027,y=.04,w=.338,h=.043;
    const src=imageRegion(bitmap,x,y,w,h,1);
    const ctx=src.getContext('2d',{willReadFrequently:true});
    const pix=ctx.getImageData(0,0,src.width,src.height);
    for(let p=0;p<pix.data.length;p+=4){
      const r=pix.data[p],g=pix.data[p+1],b=pix.data[p+2];
      const bright=(r+g+b)/3>190 && Math.max(r,g,b)-Math.min(r,g,b)<62;
      const v=bright?0:255;
      pix.data[p]=v;pix.data[p+1]=v;pix.data[p+2]=v;pix.data[p+3]=255;
    }
    ctx.putImageData(pix,0,0);
    const out=document.createElement('canvas');out.width=1250;out.height=160;
    const cc=out.getContext('2d');cc.imageSmoothingEnabled=false;
    cc.drawImage(src,0,0,out.width,out.height);
    return out;
  }
  function totalStatStrip(bitmap){
    const rows=[
      ['PV','pv',0,'L'],['ATQ','atk',1,'L'],['DEF','def',2,'L'],
      ['VEL','spd',3,'L'],['CRIT','crit',4,'L'],['DCRIT','cdmg',5,'L'],
      ['QUEBRA','break',0,'R'],['ENERGIA','energy',3,'R']
    ];
    const output=document.createElement('canvas');output.width=500;output.height=rows.length*105;
    const ctx=output.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,output.width,output.height);
    ctx.textBaseline='middle';ctx.fillStyle='#000';ctx.font='bold 23px Arial, sans-serif';
    rows.forEach(([label,key,index,col],i)=>{
      const cy=.1535+index*.0315;
      const x0=col==='L'?.61:.902,x1=col==='L'?.671:.978;
      const tile=document.createElement('canvas');tile.width=280;tile.height=70;
      const t=tile.getContext('2d',{willReadFrequently:true});
      t.drawImage(bitmap,bitmap.width*x0,bitmap.height*(cy-.015),
        bitmap.width*(x1-x0),bitmap.height*.029,0,0,280,70);
      const px=t.getImageData(0,0,280,70);
      for(let p=0;p<px.data.length;p+=4){
        const grey=(px.data[p]+px.data[p+1]+px.data[p+2])/3;
        const v=grey<117?255:0; // light glyphs become BLACK on white
        px.data[p]=v;px.data[p+1]=v;px.data[p+2]=v;px.data[p+3]=255;
      }
      t.putImageData(px,0,0);
      ctx.fillStyle='#000';ctx.fillText(label,10,i*105+47);
      ctx.drawImage(tile,150,i*105+12);
    });
    return {canvas:output,rows};
  }
  function parseTotalStatLines(result,rows){
    const bounds={
      pv:[200,30000],atk:[100,15000],def:[100,15000],spd:[50,400],
      crit:[5,100],cdmg:[50,1000],break:[0,1000],energy:[50,400]
    };
    const out={},rowH=105;
    function nval(raw){
      const clean=String(raw||'').replace(/[Oo]/g,'0').replace(/[lI]/g,'1');
      const m=clean.match(/\d{1,5}(?:[.,]\d{1,2})?/);
      return m?Number(m[0].replace(',','.')):null;
    }
    function add(i,str){
      if(i<0||i>=rows.length)return;
      const key=rows[i][1],value=nval(str),b=bounds[key];
      if(Number.isFinite(value)&&value>=b[0]&&value<=b[1])out[key]=value;
    }
    const lines=String(result?.data?.text||'').split(/\n+/).filter(l=>l.trim());
    if(lines.length===rows.length)lines.forEach((line,i)=>{
      // Parse only the numeric portion after the row label.
      const cleaned=line.replace(/^[^\d]*/,'');
      add(i,cleaned);
    });
    // OCR sometimes groups or drops lines; use token bounding positions in that case.
    for(const word of result?.data?.words||[]){
      const box=word.bbox||{},yy=Number(box.y0);
      const i=Math.floor((yy||0)/rowH);
      if(word.text && Number.isFinite(yy)&&yy>0 && !Object.prototype.hasOwnProperty.call(out,rows[i]?.[1]))add(i,word.text);
    }
    return out;
  }

  // Retest only missing attribute numbers, with a per-cell OCR pass.
  async function recoverMissingTotalStats(worker, bitmap, rows, totals) {
    const ranges={pv:[200,30000],atk:[100,15000],def:[100,15000],spd:[50,400],
      crit:[0,100],cdmg:[0,1000],break:[0,1000],energy:[0,400]};
    const missing=rows.filter(row=>!Object.prototype.hasOwnProperty.call(totals,row[1]));
    if(!missing.length)return totals;
    await worker.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789.,%'});
    const getNumber=str=>{
      const clean=String(str||'').replace(/[Oo]/g,'0').replace(/[lI]/g,'1').replace(/\s/g,'');
      const m=clean.match(/\d{1,5}(?:[.,]\d{1,2})?/);
      return m?Number(m[0].replace(',','.')):null;
    };
    for(const [label,key,index,col] of missing){
      const cy=.1535+index*.0315,x0=col==='L'?.61:.902,x1=col==='L'?.671:.978;
      const cropped=imageRegion(bitmap,x0,cy-.015,x1-x0,.029,4);
      let reading=await worker.recognize(cropped);
      let number=getNumber(reading.data?.text);
      const [low,high]=ranges[key];
      if(!(Number.isFinite(number)&&number>=low&&number<=high)){
        const ctx=cropped.getContext('2d',{willReadFrequently:true});
        const image=ctx.getImageData(0,0,cropped.width,cropped.height);
        for(let p=0;p<image.data.length;p+=4){
          const grey=(image.data[p]+image.data[p+1]+image.data[p+2])/3;
          const v=grey>122?0:255;
          image.data[p]=v;image.data[p+1]=v;image.data[p+2]=v;image.data[p+3]=255;
        }
        ctx.putImageData(image,0,0);
        reading=await worker.recognize(cropped);
        number=getNumber(reading.data?.text);
      }
      if(Number.isFinite(number)&&number>=low&&number<=high)totals[key]=number;
    }
    return totals;
  }

  function editDistance(a,b){
    if(a===b)return 0;
    const v=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      let before=v[0];v[0]=i;
      for(let j=1;j<=b.length;j++){
        const last=v[j];
        v[j]=Math.min(v[j]+1,v[j-1]+1,before+(a[i-1]===b[j-1]?0:1));
        before=last;
      }
    }
    return v[b.length];
  }
  function getIdFromTitle(title,damage){
    const name=norm(title).replace(/\bnv\s*\d{1,2}\b.*$/,'').trim();
    const el=norm(damage);
    if(/desbrav|trailblaz/.test(name)){
      if(/raio|thunder|lightning/.test(el))return '8009';
      if(/fisico|physical/.test(el))return '8001';
      if(/fogo|fire/.test(el))return '8003';
      if(/imaginario|imaginary/.test(el))return '8005';
      if(/gelo|ice/.test(el))return '8007';
      return '';
    }
    const candidates=CATALOG.filter(c=>c.id!=='future-aha'&&c.name&&norm(c.name).length>=4);
    for(const c of candidates){
      const n=norm(c.name);
      if(name===n||name.startsWith(n+' '))return c.id;
    }
    const ranked=candidates.map(c=>{
      const n=norm(c.name),piece=name.split(' ').slice(0,n.split(' ').length).join(' ');
      const d=editDistance(piece,n);
      const score=1-d/Math.max(n.length,piece.length);
      return {id:c.id,score,d,n};
    }).sort((a,b)=>b.score-a.score);
    return ranked[0]&&ranked[0].score>=.79&&ranked[0].d<=2?ranked[0].id:'';
  }
  function ensureTrailblazer(id){
    if(!/^800[13579]$/.test(id)||CATALOG.some(c=>c.id===id))return;
    const label={8001:'Físico',8003:'Preservação',8005:'Harmonia',8007:'Reminiscência',8009:'Euforia'}[id]||'';
    CATALOG.push({...gameData.chars?.[id],id,name:'Caelus · Desbravador da '+label,path:gameData.chars?.[id]?.path||'Elation'});
    const select=document.getElementById('v06-id');
    if(select)select.add(new Option('Caelus · '+label,id));
  }

  let coneCataloguePromise;
  async function getLightConeNames(){
    if(!coneCataloguePromise){
      coneCataloguePromise=fetch('data/live-game.json',{cache:'no-store'})
        .then(r=>{if(!r.ok)throw Error('cone catalog unavailable');return r.json()})
        .then(j=>Object.values(j.cones||{}).map(x=>x.name).filter(Boolean))
        .catch(()=>[]);
    }
    return coneCataloguePromise;
  }
  function coneName(raw,allNames=[]){
    const first=String(raw||'').split('\n').map(x=>x.trim())
      .find(x=>x.length>5&&!/^(Nv|Lv)/i.test(x))||'';
    const known=[...new Set([...allNames,'Euforia Repleta de Bênçãos',
      'Um Encontro na Próxima Primavera','Cores para o Amanhã'])];
    const cleaned=norm(first);
    const ranked=known.map(name=>{
      const value=norm(name),distance=editDistance(cleaned,value);
      return {name,score:1-distance/Math.max(cleaned.length,value.length,1)};
    }).sort((a,b)=>b.score-a.score);
    // Never silently assign a different light cone based on a weak fuzzy match.
    if(ranked[0]?.score>=.82 && (ranked[0].score-(ranked[1]?.score||0))>=.035)
      return ranked[0].name;
    return first.length>5&&first.length<75
      ?first.replace(/[^\p{L}\p{N} .,'’–-]/gu,'').trim():'';
  }

  async function suggestEidolons(bitmap){
    if(!bitmap||!bitmap.width)return null;
    const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
    const ratios=[];
    for(let i=0;i<6;i++){
      const cx=bitmap.width*(.084+.0405*i),cy=bitmap.height*.57;
      const r=Math.max(7,Math.round(bitmap.width*.012));
      const x=Math.max(0,Math.floor(cx-r)),y=Math.max(0,Math.floor(cy-r));
      const pixels=ctx.getImageData(x,y,Math.round(r*2),Math.round(r*2)).data;
      let bright=0;
      for(let p=0;p<pixels.length;p+=4)
        if((pixels[p]+pixels[p+1]+pixels[p+2])/3>175)bright++;
      ratios.push(bright/(pixels.length/4));
    }
    // Calibrated on the user's 3 same-format screenshots:
    // Pearl E2: [0.185,0.193,0.044,...]. Evanescia E6 minimum 0.161.
    // Caelus E6 minimum 0.233.
    // Active artwork differs by character, so require an ordered bright/dark
    // separation rather than relying on six fixed absolute thresholds.
    if(ratios.every(v=>v>=.125))return 6;
    if(ratios.every(v=>v<=.075))return 0;
    const candidates=[];
    for(let n=1;n<6;n++){
      const lit=ratios.slice(0,n),unlit=ratios.slice(n);
      const gap=Math.min(...lit)-Math.max(...unlit);
      if(gap>=.045&&Math.min(...lit)>.09&&Math.max(...unlit)<.12)
        candidates.push({n,gap});
    }
    candidates.sort((a,b)=>b.gap-a.gap);
    return candidates[0]?.n??null;
  }
  window.v06AutoRead=async function(){
    const status=document.getElementById('v06-import-status');
    const say=msg=>{if(status)status.textContent=msg;};
    if(!uploader.file)return say('Selecione um print.');
    let worker=null,bitmap=null;
    try{
      bitmap=await createImageBitmap(uploader.file);
      const ratio=bitmap.width/bitmap.height;
      const illustrated=ratio>=.82&&ratio<=.95&&bitmap.width>=700&&bitmap.height>=900;
      const standard=ratio>=1.02&&ratio<=1.18&&bitmap.width>=700&&bitmap.height>=600;
      if(!illustrated&&!standard){
        say('Formato ainda não suportado pelo reconhecimento automático ('+bitmap.width+' × '+bitmap.height+
          '). Você pode cadastrar o personagem e preencher as seis relíquias manualmente. Nenhum atributo foi alterado.');
        return;
      }
      say('Layout identificado: '+(illustrated?'cartão ilustrado':'registro de batalha')+
          ' · '+bitmap.width+' × '+bitmap.height+'. Lendo somente os campos visíveis…');
      // Avoid carrying previously OCR-filled fields over into a new screenshot.
      for(const key of ['pv','atk','def','spd','crit','cdmg','break','energy']){
        const el=document.getElementById('v06-'+key);
        if(el)el.value='';
      }
      uploader.identifiedId='';uploader.eidolon=null;uploader.superimposition=null;uploader.cone='';
      for(const key of ['id','e','s','cone']){
        const el=document.getElementById('v06-'+key);
        if(el)el.value='';
      }
      const ocr=await getLang();
      worker=await ocr.createWorker('eng',1,{logger:m=>{
        if(m.status==='recognizing text')say('Lendo o print: '+Math.round(m.progress*100)+'%');
      }});
      if(illustrated){
        const module=await import('./illustrated-showcase-import.js?v=1');
        say('Reconhecendo o cartão ilustrado e comparando com o catálogo de personagens…');
        const roster=[...CATALOG.map(c=>({id:c.id,name:c.name})),
          ...Object.values(gameData.chars||{}).filter(c=>c?.name&&c.name!=='{NICKNAME}').map(c=>({id:c.id,name:c.name}))];
        const report=await module.readIllustratedShowcase(bitmap,worker,{
          characters:roster,coneNames:await getLightConeNames(),
          progress:message=>say(message),includeRelics:true
        });
        await window.__nexusRelicInspectorPromise;
        const applied=module.applyShowcaseToForm(report);
        let setCount=0;
        if(report.relicSets){
          const matcher=await import('./illustrated-relic-matcher.js?v=1');
          const selected=matcher.fillRelicSetFields(report.relicSets);
          setCount=selected.selected;
        }else if(report.relicSetError){
          document.querySelectorAll('[id^="v06-relmatch-"]').forEach(el=>{
            el.textContent='Não foi possível acessar as referências visuais: '+report.relicSetError+'. Você pode escolher o conjunto manualmente.';
          });
        }
        if(!report.character&&uploader.hintId){
          const select=document.getElementById('v06-id');
          if(select&&[...select.options].some(o=>o.value===uploader.hintId))select.value=uploader.hintId;
          say('A identificação por texto ficou incerta. Mantive o personagem da ficha de origem apenas como sugestão — confira.');
        }
        uploader.identifiedId=report.character?.id||uploader.hintId||'';
        uploader.eidolon=report.eidolon;
        uploader.superimposition=report.superimposition;
        uploader.cone=report.cone;
        uploader.ocrText=JSON.stringify({title:report.title,totals:report.totals,diagnostics:report.diagnostics});
        const name=report.character?.name||'não identificado com segurança';
        say('Cartão ilustrado: '+name+' · '+applied.main+'/8 atributos principais · '+setCount+'/6 conjuntos e '+applied.relicStats+'/30 atributos das relíquias preenchidos.'+
            (report.eidolon!==null?' E'+report.eidolon+' sugerido.':' Confirme E0–E6.')+
            (report.superimposition!==null?' Cone S'+report.superimposition+'.':' Confirme a sobreposição do cone.')+
            ' Confira os campos antes de salvar.');
        return;
      }
      const mode=async num=>worker.setParameters({tessedit_pageseg_mode:String(num)});
      await mode(7);
      const title=(await worker.recognize(titleMask(bitmap))).data.text||'';
      const damage=(await worker.recognize(imageRegion(bitmap,.377,.327,.249,.031,3))).data.text||'';
      await mode(6);
      const cone=(await worker.recognize(imageRegion(bitmap,.095,.652,.267,.085,2.6))).data.text||'';
      const strip=totalStatStrip(bitmap);
      const parsed=await worker.recognize(strip.canvas);
      const totals=await recoverMissingTotalStats(worker,bitmap,strip.rows,parseTotalStatLines(parsed,strip.rows));
      let verification={confirmed:[],corrections:[],uncertain:['pv','atk','def','spd','crit','cdmg']};
      try{
        const module=await import('./digit-audit.js?v=2');
        verification=module.auditFixedTotals(bitmap,totals);
      }catch(error){
        console.warn('Conferência de dígitos indisponível',error);
      }
      uploader.ocrText=['Título: '+title,'Dano: '+damage,'Cone: '+cone,'Atributos:\n'+(parsed.data.text||'')].join('\n');
      const identifiedId=getIdFromTitle(title,damage);
      if(identifiedId)ensureTrailblazer(identifiedId);
      const select=document.getElementById('v06-id');
      if(select&&identifiedId){
        let choice=[...select.options].find(o=>o.value===identifiedId);
        if(!choice&&CATALOG.find(c=>c.id===identifiedId)){
          const c=CATALOG.find(c=>c.id===identifiedId);
          select.add(new Option(c.name,identifiedId));
        }
        select.value=identifiedId;uploader.identifiedId=identifiedId;
      }
      for(const [k,value] of Object.entries(totals)){
        const el=document.getElementById('v06-'+k);
        if(el)el.value=String(value);
      }
      const h=title.match(/(?:Nv|Lv)\W{0,3}(\d{1,2})/i);
      if(h&&document.getElementById('v06-level'))document.getElementById('v06-level').value=h[1];
      const sup=cone.match(/(?:Nv|Lv)\W*([1-5])\s+de\s+(?:sobreposi|superimposi)/i)
        ||cone.match(/(?:sobreposi|superimposi)[^\n]{0,16}([1-5])/i);
      if(sup&&document.getElementById('v06-s')){
        document.getElementById('v06-s').value=sup[1];uploader.superimposition=Number(sup[1]);
      }
      const recognizedCone=coneName(cone,await getLightConeNames());
      if(recognizedCone){
        uploader.cone=recognizedCone;
        const el=document.getElementById('v06-cone');if(el)el.value=recognizedCone;
      }
      const e=await suggestEidolons(bitmap);
      if(e!==null&&document.getElementById('v06-e')){
        document.getElementById('v06-e').value=String(e);uploader.eidolon=e;
      }
      const missing=strip.rows.map(x=>x[1]).filter(k=>!Object.hasOwn(totals,k));
      for(const key of ['pv','atk','def','spd','crit','cdmg']){
        const field=document.getElementById('v06-'+key);
        if(field){
          const uncertain=verification.uncertain.includes(key);
          field.title=uncertain?'Leitura automática sem confirmação independente: confira no print.':
            'Verificado comparando com os caracteres do print.';
          field.style.borderColor=uncertain?'#f4c67a':'#4b9a90';
        }
      }
      const cname=identifiedId?(identifiedId==='8009'?'Caelus · Euforia':lookup(identifiedId).name):'não confirmado';
      say('Personagem: '+cname+' | '+(strip.rows.length-missing.length)+'/8 valores lidos (confira antes de aceitar).'+
        (verification.corrections.length?' OCR divergente corrigido: '+
          verification.corrections.map(x=>x.key+' '+x.ocr+' → '+x.value).join(', ')+'.':'')+
        (verification.uncertain.length?' Sem dupla verificação: '+verification.uncertain.join(', ')+'.':'')+
        (e===null?' Confira os seis Eidolons.':' E'+e+' sugerido.')+
        (sup?' Cone S'+sup[1]+'.':' Confira S1–S5.')+
        (missing.length?' Pendentes: '+missing.join(', ')+'.':' Valores completos.')+
        ' Confirme tudo antes de salvar.');
      // Visual matching of the six equipped game relic icons + OCR on each fixed row.
      // Uses user-uploaded bitmap locally. Inconclusive fields remain editable.
      try{
        say('Atributos totais lidos. Identificando os ícones e os 30 atributos das relíquias…');
        await window.__nexusRelicInspectorPromise;
        const relicAuto=await import('./relic-auto.js?v=3');
        const report=await relicAuto.autoDetectRelics(bitmap,worker,(current,total)=>say('Conferindo as relíquias · campo '+current+'/'+total+' (segunda leitura)…'));
        say('Personagem '+cname+' · '+(strip.rows.length-missing.length)+'/8 atributos totais · '+report.status+
            ' Confirme os valores sinalizados antes de salvar.');
      }catch(relicError){
        say('Atributos totais lidos; leitura de relíquias incompleta: '+String(relicError.message||relicError)+'. Confira as seis peças manualmente.');
      }
    }catch(err){
      say('Não foi possível concluir a leitura: '+String(err.message||err)+'. Confira os campos manualmente.');
    }finally{
      try{await worker?.terminate()}catch(_){}
      try{bitmap?.close()}catch(_){}
    }
  };

  window.v06SaveImport=function(){
    let id=document.getElementById('v06-id')?.value;
    if(!id){showToast('Escolha o personagem correto antes de salvar');return;}
    let newCharacter=null;
    if(id==='__custom__'){
      const name=document.getElementById('v06-custom-name')?.value.trim().replace(/\s+/g,' ');
      if(!name||name.length<2){showToast('Digite o nome do personagem não listado');return;}
      id='custom-'+norm(name).replace(/\s+/g,'-').slice(0,70);
      newCharacter={id,name,rarity:5,element:'',path:'',icon:'',portrait:'',preview:'',skills:[],ranks:[]};
    }
    if(!document.getElementById('v06-confirm')?.checked){
      showToast('Confira os números e marque a confirmação antes de salvar');return;
    }
    // Nexus 2.0: never block a character because OCR missed a single stat.
    // A partial record must be saved and completed later. Blank fields do not
    // overwrite previously confirmed values; missing Eidolon/cone ranks keep
    // the old values or sensible E0/S1 defaults in the new account record.
    const important=['pv','atk','def','spd','crit','cdmg'];
    const pendingStats=important.filter(k=>document.getElementById('v06-'+k)?.value==='');
    const eField=document.getElementById('v06-e'),sField=document.getElementById('v06-s');
    if(eField?.value!==''&&eField?.value!=null&&!Number.isInteger(Number(eField.value))){
      showToast('Confira os Eidolons antes de salvar');return;
    }
    if(sField?.value!==''&&sField?.value!=null&&!Number.isInteger(Number(sField.value))){
      showToast('Confira a sobreposição do cone antes de salvar');return;
    }
    if(newCharacter){
      state.v06CustomCharacters ||= {};
      state.v06CustomCharacters[id]=newCharacter;
      if(!CATALOG.some(c=>c.id===id)) CATALOG.push(newCharacter);
      gameData.chars[id]={id,name:newCharacter.name,skills:[],ranks:[]};
    }
    const prior=state.characters[id]||{level:1,e:0,s:1,cone:''};
    const read=k=>{const v=document.getElementById('v06-'+k)?.value;return v===''||v==null?null:Number(v);};
    const keys=['level','e','s','pv','atk','def','spd','crit','cdmg','break','energy'];
    for(const k of keys){const n=read(k);if(Number.isFinite(n))prior[k]=n;}
    const coneField=document.getElementById('v06-cone')?.value.trim();
    if(coneField)prior.cone=coneField;
    state.characters[id]=prior;state.v06Screens||={};state.v06Relics||={};
    if(uploader.preview){const image=new Image();image.src=uploader.preview;state.v06Screens[id]=uploader.preview;}
    if(uploader.relImages.length)state.v06Relics[id]=uploader.relImages;
    const relicData=window.__nexusRelicInspector?.collectRelics?.();
    if(relicData){
      state.v06RelicDetails||={};
      // One canonical record for all import paths, with legacy adapter for
      // older character screens and manual edits. Do not erase prior values.
      const previous=state.v06RelicDetails[id]||[];
      const incoming=nexusAccount?nexusAccount.mergeRelicImport(relicData,previous):relicData;
      const unified=nexusAccount?nexusAccount.normalizeRelics(
        incoming,prior.relics||{},nexusAccountCatalog?.relicSets||{}):incoming;
      state.v06RelicDetails[id]=unified;
      if(nexusAccount)prior.relics=nexusAccount.toLegacy(
        unified,nexusAccountCatalog?.relicSets||{},prior.relics||{});
      else prior.relics=Object.fromEntries(relicData.map((r,i)=>[i,{
        set:r.setName||r.setId||'',setId:r.setId||'',
        main:r.main?.stat||'',value:r.main?.value??'',
        subs:(r.subs||[]).filter(x=>x.stat).map(x=>x.stat+' '+x.value).join('\n'),
        level:r.level
      }]));
    }
    state.profile=id;const persisted=verifiedAccountSave(id);closeModal();tab='overview';route('profile');showToast(persisted?(pendingStats.length?'Personagem salvo! '+pendingStats.length+' atributo(s) ficam pendentes para completar depois.':'Print e personagem registrados na sua conta'):'Build visível nesta sessão, mas não foi salva no dispositivo. Exporte um backup!');
  };

  // Editorial guidance is contextual and only references characters explicitly in the account.
  let v06TipTab='owned';
  const groups=[['owned','Minha conta'],['kits','Como ler kits'],['endgame','Endgame'],['farm','Farm']];
  function contextualTip(id){
    const b=state.characters[id],name=lookup(id).name;
    if(!b)return '';
    if(!nexusAccount||!nexusAccountCatalog){
      readyAccount();
      return '<p role="status">Conferindo as informações de '+safe(name)+'…</p>';
    }
    const character=nexusAccountCatalog.chars?.[id]||lookup(id);
    const cone=accountCone(id);
    const notes=nexusAccount.buildCoach({
      character,build:b,records:accountRecords(id),
      sets:nexusAccountCatalog.relicSets||{},cone,
      coneRank:cone?nexusAccountCatalog.coneRanks?.[cone.id]:null,
      skills:(nexusAccountCatalog.chars?.[id]?.skills||[]).map(k=>nexusAccountCatalog.skills?.[k]).filter(Boolean)
    });
    const warnings=notes.filter(item=>item.kind==='warning'||item.kind==='action');
    const highlight=warnings[0]||notes[0];
    return '<details class="v11-diary-person" '+(warnings.length?'data-priority="review"':'')+'><summary><span><strong>'+safe(name)+'</strong><small>Nv. '+(b.level||1)+' · E'+(b.e||0)+'S'+(b.s||1)+'</small></span><em>'+safe(highlight?.title||'Ver recomendações')+'</em><b>+</b></summary>'+
      '<div class="v11-diary-notes">'+notes.map(x=>'<article class="'+safe(x.kind)+'"><strong>'+safe(x.title)+'</strong><p>'+safe(x.body)+'</p></article>').join('')+
      '<button type="button" onclick="openProfile(\''+id+'\')">Abrir ficha e editar build ›</button></div></details>';
  }
  function diary06(){
    const chars=ownerKeys();
    let blocks='';
    if(v06TipTab==='owned'){
      blocks=chars.length?'<p class="v11-diary-summary">'+chars.length+' personagem(ns) na sua conta. Toque em cada um para ver verificações, prioridades e efeitos do cone e dos conjuntos realmente equipados.</p>'+chars.map(contextualTip).join(''):pomCard('Seu arquivo ainda está vazio','Importe um print em Minha Conta para receber dicas específicas dos personagens que você possui.','COMECE AQUI');
    } else if(v06TipTab==='kits'){
      blocks=pomCard('Primeiro: leia o gatilho','Em um kit, encontre a condição de ativação, a duração, os alvos elegíveis e o custo da habilidade. O multiplicador sozinho não indica a melhor rotação.','MECÂNICAS')+
        pomCard('Eidolons não são todos iguais','Um Eidolon pode mudar a rotação, desbloquear uma interação ou apenas subir níveis. O valor depende da equipe e do investimento já feito.','INVESTIMENTO');
    } else if(v06TipTab==='endgame'){
      blocks=pomCard('Não existe composição universal','Na Memória do Caos, leia os dois lados e os modificadores da rotação. Na Arbitragem, três equipes dos Cavaleiros não podem ser repetidas.','DESAFIOS')+
        pomCard('Previsão de ciclos exige dados','Apenas os nomes dos personagens não bastam para prever 0 ou 1 ciclo. Use as builds completas e registre resultados para comparar as estratégias.','ESTIMATIVAS');
    } else {
      blocks=pomCard('Calcule primeiro o que falta','No Farm Planner, desconte o estoque e considere as fusões 3:1 antes de estimar runs. Materiais semanais e créditos devem ser rastreados separadamente.','MATERIAIS');
    }
    return '<div class="v06-diary">'+subhead('GUIA DO CONDUTOR','Pom-Pom · Análise da sua conta','Leitura dos atributos, cones e equipamentos que você cadastrou, com pendências específicas por personagem.')+
      '<div class="v06-diary-intro">'+pomCard('O que precisa de atenção primeiro','Na guia Minha conta, abra cada personagem para conferir os alertas da sua build. Não invento notas, metas ou personagens que não constam no seu arquivo.','CONFERÊNCIA POR PERSONAGEM')+'</div>'+
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
