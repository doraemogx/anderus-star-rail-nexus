/* Aha Grand Theatre visual symbols and scene titles. Drawn in SVG, not represented as HoYoverse art. */
(function(){
'use strict';
if(window.AnderusAhaDetail)return;
const shapes={
 home:'<path d="M16 3 19 12 28 16 19 20 16 29 13 20 4 16 13 12Z"/><path d="M8 8 11 11M24 8 21 11M8 24 11 21M24 24 21 21"/>',
 account:'<path d="M16 7c-5-3-9-2-12-1v20c4-2 8-2 12 1 4-3 8-3 12-1V6c-3-1-7-2-12 1Z"/><path d="M16 7v20M8 11h4M20 11h4M8 16h4M20 16h4"/>',
 build:'<path d="M16 2 27 9v14L16 30 5 23V9Z"/><path d="m16 6 7 4v12l-7 4-7-4V10Z"/><path d="m16 10-4 6 4 6 4-6Z"/>',
 endgame:'<path d="M9 3 15 15 4 27M23 3 17 15 28 27"/><path d="M4 9 23 28M28 9 9 28"/><path d="M12 24h8M12 28h8"/>',
 farm:'<path d="M16 3c7 4 11 8 11 14S22 27 16 29C10 27 5 23 5 17S9 7 16 3Z"/><path d="M16 9v14M11 13l5 5 5-5M10 21h12"/>',
 radar:'<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="4"/><path d="M16 2v7M16 23v7M2 16h7M23 16h7M16 16l7-7"/>',
 themes:'<path d="m16 3 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z"/><path d="M4 4l4 4M24 4l4 4M4 28l4-4M24 28l4-4"/>',
 beta:'<path d="M7 3h18v26H7Z"/><path d="M12 9h8M12 14h8M12 19h5"/><path d="m21 19 3 3-3 3"/>',
 profile:'<circle cx="16" cy="11" r="6"/><path d="M6 29c0-7 4-11 10-11s10 4 10 11"/><path d="m4 6 2 2m22-2-2 2"/>',
 diary:'<path d="M7 5h18v22H7c-3 0-4-2-4-4s1-4 4-4h18"/><path d="M12 10h8M12 15h6"/>',
 settings:'<circle cx="16" cy="16" r="5"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6M6 6l5 5M21 21l5 5M26 6l-5 5M11 21l-5 5"/>'
};
function glyph(key){
 const path=shapes[key]||shapes.home;
 return '<svg class="aha-glyph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+path+'</svg>';
}
const nav={inicio:'home',arquivo:'account',endgame:'endgame',radar:'radar',temas:'themes',farm:'farm',pompom:'diary',build:'build'};
function classify(text){
 const s=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/inicio|home/.test(s))return 'home';
 if(/arquivo|minha conta|personagen/.test(s))return 'account';
 if(/build|reliquia/.test(s))return 'build';
 if(/endgame|arbitragem/.test(s))return 'endgame';
 if(/farm|materia/.test(s))return 'farm';
 if(/radar|warp|banner/.test(s))return 'radar';
 if(/tema|theme/.test(s))return 'themes';
 if(/beta|kits/.test(s))return 'beta';
 if(/pom.pom|diario/.test(s))return 'diary';
 if(/config/.test(s))return 'settings';
 return 'home';
}
const pages={
 home:['ACT / 00','O palco é seu','O próximo destino do Expresso Astral','home'],
 library:['ACT / 02','Arquivo do Desbravador','Personagens, prints e builds da sua conta','account'],
 profile:['ACT / 03','Camarim dos Personagens','Kit, relíquias e registro da sua jornada','profile'],
 endgame:['ACT / 04','Arena da Euforia','Chefes, mecânicas e as equipes da sua conta','endgame'],
 farm:['ACT / 05','Oficina do Destino','Materiais, rastros e planejamento do farm','farm'],
 radar:['ACT / 06','Observatório das Estrelas','Banners, kits e versões do jogo','radar'],
 themes:['ACT / 07','Ateliê das Máscaras','Uma identidade para cada personagem','themes'],
 nexia:['ACT / 08','Diário do Pom-Pom','Conselhos do Expresso para sua conta','diary'],
 settings:['ACT / 09','Bastidores do Nexus','Ajustes e preferências do seu arquivo','settings'],
 default:['ANDERUS / GRAND THEATRE','Seu universo em cena','Arquivo e ferramentas de Honkai: Star Rail','home']
};
function sectionTitle(){
 const stage=document.getElementById('stage');
 if(!stage||stage.querySelector('.aha-view-ribbon'))return;
 let route='default';
 try{route=page;}catch(_){}
 if(route==='home'||stage.querySelector('.v06-home'))return;
 const x=pages[route]||pages.default;
 const bar=document.createElement('div');bar.className='aha-view-ribbon';
 bar.innerHTML='<span>'+glyph(x[3])+'</span><div><small>'+x[0]+'</small><b>'+x[1]+'</b><em>'+x[2]+'</em></div>';
 stage.insertBefore(bar,stage.firstChild);
}
function applyNav(){
 document.querySelectorAll('#bottomNav button,.bottom-nav button,#sidebarLinks button,#sidebarLinks a').forEach(button=>{
  if(button.dataset.ahaGlyph==='1')return;
  const holder=button.querySelector('.game-nav-icon');
  if(holder){holder.insertAdjacentHTML('beforeend',glyph(classify(button.textContent)));button.dataset.ahaGlyph='1';}
 });
 document.querySelectorAll('.v06-tile').forEach(button=>{
  const holder=button.querySelector('.v06-tile-deco');
  if(holder&&!holder.querySelector('.aha-glyph'))holder.insertAdjacentHTML('beforeend',glyph(classify(button.textContent)));
 });
}
let originalBarColor;
function paint(){
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta){if(originalBarColor===undefined)originalBarColor=meta.content;meta.setAttribute('content','#211025');}
 if(!document.querySelector('.app')?.classList.contains('aha-theatre'))return;
 document.documentElement.dataset.ahaGrande='1';
 sectionTitle();applyNav();
}
function cleanup(){
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta&&originalBarColor!==undefined)meta.setAttribute('content',originalBarColor);
 originalBarColor=undefined;
 delete document.documentElement.dataset.ahaGrande;
 document.querySelectorAll('.aha-view-ribbon,.aha-glyph').forEach(el=>el.remove());
 document.querySelectorAll('[data-aha-glyph]').forEach(el=>delete el.dataset.ahaGlyph);
}
window.AnderusAhaDetail={paint,cleanup};
paint();
})();