/* ANDERUS / Grand Theatre for Aha. No local data changes. */
(function(){
'use strict';
if(window.AnderusAha)return;
const ART='./assets/official/aha-4-7.webp';
const FALLBACK='./assets/official/aha-4-7-promo.jpg';
const PATH_ICON='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/path/Elation.png';
const SOURCE='https://www.gamespress.com/pt/Honkai-Star-Rail-Version-47-Now-Lay-Laughter-to-All-St-wwwhoyoversecom';
function selected(){try{return typeof state!=='undefined'&&state.theme==='future-aha';}catch(_){return false;}}
function el(tag,cls,html){const node=document.createElement(tag);node.className=cls;node.innerHTML=html;return node;}
function renderHome(){
 const hero=document.querySelector('.v06-home .v06-hero');if(!hero)return;
 if(!hero.querySelector('.aha-show')){
  const art=el('div','aha-show',
   '<div class="aha-spotlight aha-light-one" aria-hidden="true"></div><div class="aha-spotlight aha-light-two" aria-hidden="true"></div>'+
   '<div class="aha-orbit" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div><div class="aha-curtain" aria-hidden="true"></div>'+
   '<div class="aha-show-inner">'+
    '<div class="aha-stage-label"><span class="aha-stage-seal" aria-hidden="true">✶</span><span>ANDERUS PRESENTS</span><i></i><span>ATO 01 · A GRANDE EUFORIA</span></div>'+
    '<div class="aha-portrait"><span class="aha-portrait-halo" aria-hidden="true"></span>'+
      '<img src="'+ART+'" alt="Aha — arte oficial de Honkai: Star Rail" decoding="async" fetchpriority="high">'+
      '<span class="aha-portrait-serial" aria-hidden="true">THE GRAND THEATRE / 4.7</span></div>'+
    '<div class="aha-intro">'+
      '<div class="aha-overline"><span class="aha-diamond" aria-hidden="true">◆</span> QUÂNTICO <span class="aha-sep"></span>'+
       '<img src="'+PATH_ICON+'" alt="" loading="lazy"> CAMINHO DA EUFORIA</div>'+
      '<p class="aha-chapter">O ÚLTIMO ATO DE PLANARCADIA</p>'+
      '<h1><span>O universo</span><em>é o palco.</em></h1>'+
      '<p class="aha-leading">Aha, Aeon da Euforia.<br>O espetáculo pode mudar. Sua jornada continua sendo sua.</p>'+
      '<div class="aha-hero-actions">'+
       '<button type="button" class="aha-main-action" onclick="v06StartImport()">✦ Importar meu print</button>'+
       '<button type="button" class="aha-quiet-action" onclick="route(\'library\')">Minha conta ↗</button>'+
       '<button type="button" class="aha-quiet-action aha-install" onclick="v07Install()">Instalar ↗</button>'+
      '</div></div>'+
    '<div class="aha-side-mark" aria-hidden="true">THE SHOW MUST GO ON ✦ 11.11.2026</div>'+
   '</div>');
  hero.appendChild(art);
  const pathIcon=art.querySelector('.aha-overline img');
  if(pathIcon)pathIcon.addEventListener('error',function(){this.replaceWith(document.createTextNode('✧'));});
  const img=art.querySelector('.aha-portrait img');
  img.addEventListener('error',function(){if(this.dataset.tried)return;this.dataset.tried='1';this.src=FALLBACK;});
 }
 if(!document.querySelector('.v06-home .aha-marquee')){
  hero.insertAdjacentElement('afterend',el('div','aha-marquee',
   '<span aria-hidden="true">✦</span><b>AHA</b><span>UMA JORNADA EM SEIS ATOS</span>'+
   '<span aria-hidden="true">◇</span><b>AEON DA EUFORIA</b><span>O PRÓXIMO SALTO É SEU</span><span aria-hidden="true">✦</span>'));
 }
 const grid=document.querySelector('.v06-home .v06-tile-grid');
 if(grid&&!document.querySelector('.v06-home .aha-actline')){
  grid.insertAdjacentElement('beforebegin',el('div','aha-actline',
    '<div><span class="aha-micro">ESCOLHA SEU PRÓXIMO ATO</span><h2>Os caminhos do espetáculo</h2></div>'+
    '<div class="aha-quicklinks" aria-label="Acessos rápidos">'+
    '<button type="button" onclick="route(\'farm\')">◇ Farm</button>'+
    '<button type="button" onclick="route(\'endgame\')">✶ Endgame</button>'+
    '<button type="button" onclick="route(\'themes\')">✧ Temas</button></div>'));
 }
 if(!document.querySelector('.v06-home .aha-credit')){
  const credit=el('p','aha-credit','Artes de personagem e Eidolons © HoYoverse. Tema independente de fã. '+
   '<a target="_blank" rel="noopener noreferrer" href="'+SOURCE+'">Referência oficial 4.7 ↗</a>');
  const foot=document.querySelector('.v06-home .v06-footnote');
  if(foot)foot.insertAdjacentElement('beforebegin',credit);
 }
}
function renderStudio(){
 const studio=document.querySelector('.v06-themes');
 if(!studio||studio.querySelector('.aha-gallery'))return;
 let items='';
 for(let n=1;n<=6;n++){
  const src='./assets/official/aha-e'+n+'.webp';
  items+='<a href="'+src+'" target="_blank" rel="noopener noreferrer" aria-label="Abrir a imagem do Eidolon E'+n+'">'+
   '<span class="aha-eidolon-mark">E'+n+'</span><img src="'+src+'" loading="lazy" decoding="async" alt="Imagem do Eidolon E'+n+' de Aha">'+
   '<span class="aha-eidolon-open">VER ARTE ↗</span></a>';
 }
 const gallery=el('section','aha-gallery',
  '<div class="aha-gallery-head"><div><span class="aha-micro">ARQUIVO DO ESPETÁCULO · E1–E6</span>'+
   '<h2>Fragmentos da Euforia</h2><p>Seis artes de Eidolons preservadas do acervo do jogo, sem recriações por IA.</p></div>'+
   '<span class="aha-gallery-crest" aria-hidden="true">✶</span></div>'+
   '<div class="aha-eidolon-grid">'+items+'</div>'+
   '<p class="aha-gallery-source">Artes © HoYoverse, arquivos locais espelhados da '+
   '<a href="https://hsr.gachabase.net/characters/1511/aeon-aha/beta" target="_blank" rel="noopener noreferrer">Gachabase</a>. '+
   'Descrições e valores do beta podem mudar no lançamento.</p>');
 const stage=studio.querySelector('.v06-theme-stage');
 if(stage)stage.insertAdjacentElement('afterend',gallery);else studio.appendChild(gallery);
}
function paint(){
 const app=document.querySelector('.app');if(!app||!selected())return;
 app.classList.add('aha-theatre');
 renderHome();renderStudio();
}
function cleanup(){
 document.querySelector('.app')?.classList.remove('aha-theatre');
 document.querySelectorAll('.aha-show,.aha-marquee,.aha-actline,.aha-gallery,.aha-credit').forEach(function(node){node.remove();});
}
window.AnderusAha={paint:paint,cleanup:cleanup,version:'2.0'};
paint();
})();