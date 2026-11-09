#!/usr/bin/env node
/* Local smoke checks, no external dependencies or private data. */
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=['v06.js','nexus-v07.js','nexus-v09.js','themes/aha.js','themes/aha-detail.js','sw.js'];
for(const f of js){new Function(read(f));console.log('PASS JavaScript',f);}
const relic=read('relic-auto.js').replace('export async function autoDetectRelics','async function autoDetectRelics');
new Function(relic);
const helper=new Function(relic+';return {inferStat,parseValue,cleanRow,extractRows,plausible};')();
const fixtures=[
 ['Chance de CRIT','3,9%','Chance de CRIT',3.9,false],
 ['Dano CRIT','19,4%','Dano CRIT',19.4,false],
 ['ATQ','5,8%','ATQ %',5.8,false],
 ['PV','12,5%','PV %',12.5,false],
 ['VEL','7','VEL',7,false],
 ['Bônus de Dano Quântico','38,8%','Bônus de Dano Quântico',38.8,true],
 ['ATQ','352','ATQ',352,true],
 ['PV','257','PV',257,false],
 ['PV','5,8','PV %',5.8,false]
];
for(const [name,raw,expected,n,main] of fixtures){
 const stat=helper.inferStat(name,raw),v=helper.parseValue(raw);
 assert.equal(stat,expected,name);assert.equal(v,n,name);
 assert.ok(helper.plausible(stat,v,main),name);
}
assert.ok(!helper.plausible('Chance de CRIT',900,false));
const lines=Array.from({length:30},(_,i)=>String(i+1).padStart(2,'0')+' Chance de CRIT 3,9%').join('\n');
const rows=helper.extractRows({data:{text:lines}});
assert.equal(rows.length,30);
assert.ok(rows.every(row=>row.name==='Chance de CRIT'&&row.value==='3,9%'));
console.log('PASS OCR relic suggestions and sanity bounds');
for(const f of ['v06.css','nexus-v07.css','nexus-v09.css','themes/aha.css','themes/aha-detail.css']){
 const css=read(f);let n=0;for(const c of css){if(c==='{')n++;if(c==='}')n--;assert.ok(n>=0,'brace order: '+f);}
 assert.equal(n,0,'CSS braces: '+f);
 console.log('PASS CSS structural check',f);
}
const arts=['assets/official/aha-4-7.webp','assets/official/aha-4-7-promo.jpg',...Array.from({length:6},(_,i)=>'assets/official/aha-e'+(i+1)+'.webp')];
for(const f of arts)assert.ok(existsSync(new URL('../'+f,import.meta.url)),'missing art '+f);
const app=read('nexus-v09.js'),loader=read('nexus-v07.js'),sw=read('sw.js');
for(const mode of ['moc:','pf:','sa:','aa:'])assert.ok(app.includes(mode),'missing mode '+mode);
for(const symbol of ['v09SetVisualMode','renderVariants','renderEndgame','enhanceEditorial','composition','rankFor'])assert.ok(app.includes(symbol));
assert.ok(loader.includes('anderus-aeon-aha-visual-mode'));
assert.ok(loader.includes('aha-detail.css'));
assert.ok(loader.includes('enhanceNexusV09();'));
assert.ok(sw.includes('anderus-shell-v12'));
assert.ok(read('v06.js').includes('repairOverviewEidolons'));
assert.ok(read('v06.js').includes('rankRecord(id,n)'));
assert.ok(read('v06.js').includes('relic-auto.js?v=3'));
assert.ok(read('relic-auto.js').includes('makeTextCrop'));
console.log('PASS resilient Eidolon icons, per-character rank metadata, and OCR retries');
const live=JSON.parse(read('data/live-game.json'));
const eidoSrc=read('v06.js'),start=eidoSrc.indexOf('  let eidolonCatalog=null'),end=eidoSrc.indexOf('  const eidoIcon=',start);
assert.ok(start>=0&&end>start,'Missing shared PT-BR Eidolon catalog loader');
const sample=eidoSrc.slice(start,end);
const resolveRank=new Function('gameData','dataset',sample+';eidolonCatalog=dataset;return rankRecord;')({chars:{},ranks:{}},live);
const present=Object.entries(live.chars);
assert.ok(present.length>=90,'Character catalog incomplete');
for(const [id,char] of present)for(let n=1;n<=6;n++){
 const rank=resolveRank(id,n);
 assert.ok(rank?.name&&rank?.desc,'Missing E'+n+' or effect for '+id+' · '+char.name);
}
assert.ok(eidoSrc.includes('loadEidolonCatalog().then('),'Modal not rehydrated after catalog fetch');
assert.ok(eidoSrc.includes('eidoArtwork(id,n)'),'Character-specific artwork preference missing');
assert.ok(eidoSrc.includes('Voltar à ficha'),'Modal back navigation missing');
assert.ok(eidoSrc.includes('v10-eido-navigation'),'Previous/next Eidolon buttons missing');
console.log('PASS all '+present.length+' characters × 6 PT-BR Eidolon descriptions and modal navigation');
const artwork=JSON.parse(read('data/eidolon-art.json'));
assert.equal(Object.keys(artwork.characters).length,present.length,'Art catalog does not match current roster');
let artCount=0;
for(const [id,char] of present){
 const pieces=artwork.characters[id]||[];
 assert.equal(pieces.length,6,'Not six artwork slots for '+id+' · '+char.name);
 for(let n=1;n<=6;n++){
  const art=pieces[n-1];
  assert.ok(typeof art==='string'&&art.startsWith('https://static.wikia.nocookie.net/houkai-star-rail/images/'),'Missing real image for '+id+' E'+n);
  assert.ok(art.includes('_Eidolon_'+n+'.png/'),'Mismatched image number for '+id+' E'+n);
  if(id==='1505')assert.ok(art.includes('Character_Evanescia_'),'Evanescia fragment mismatched');
  if(id==='1503')assert.ok(art.includes('Character_Pearl_'),'Pearl fragment mismatched');
  if(id==='8009')assert.ok(art.includes('Character_Trailblazer_Male_'),'Caelus art must not use Stelle');
  artCount++;
 }
}
assert.ok(eidoSrc.includes("fetchJSON('./data/eidolon-art.json')"),'Art catalog is not actually loaded');
assert.ok(eidoSrc.includes('updateEidolonArtInPage()'),'Existing overview icons are not upgraded');
assert.ok(eidoSrc.includes("img.nexus-eidolon-fragment"),'Character overview is not wired to fragments');
assert.ok(eidoSrc.includes('v10-eido-art'),'Eidolon detail artwork missing');
assert.ok(read('.github/workflows/sync-content.yml').includes('python scripts/sync_eidolon_art.py'),'Future Eidolon updates not automated');
console.log('PASS '+artCount+'/'+(present.length*6)+' verified original Eidolon art URLs across overview, detail and future sync');

assert.ok(!sw.includes("'./themes/aha.css'"));
console.log('PASS assets, all four endgames, variant isolation, lazy theme, PWA');
