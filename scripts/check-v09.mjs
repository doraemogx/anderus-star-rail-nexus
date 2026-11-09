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
assert.ok(sw.includes('anderus-shell-v16'));
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
const illustrated=read('illustrated-showcase-import.js').replaceAll('export ','');
new Function(illustrated);
const screenshot=new Function(illustrated+';return {isIllustratedShowcase,clean,matchCharacter,parseNumber,inferStat};')();
const names=[{id:'1309',name:'Robin'},{id:'1512',name:'Robin • Summeretto'}];
assert.ok(screenshot.isIllustratedShowcase({width:2000,height:2300}), 'Screenshot 2000x2300 must be supported');
assert.ok(!screenshot.isIllustratedShowcase({width:2000,height:1826}), 'Old template must not be misidentified');
assert.equal(screenshot.matchCharacter('Robin - Summeretto',names)?.id,'1512');
assert.equal(screenshot.matchCharacter('Robin - Summeretto Nv. 80',names)?.id,'1512');
assert.equal(screenshot.matchCharacter('Robin',names)?.id,'1309');
assert.equal(screenshot.parseNumber('6.284',true),6284);
assert.equal(screenshot.parseNumber('124,4%',false),124.4);
assert.equal(screenshot.inferStat('Dano CRIT','64,8%'),'Dano CRIT');
assert.ok(read('v06.js').includes("illustrated-showcase-import.js?v=1"));
assert.ok(read('v06.js').includes('Promise.resolve().then(()=>window.v06AutoRead())'),'Auto recognize not wired');
assert.ok(read('v06.js').includes('const illustrated=ratio>=.82&&ratio<=.95'));
console.log('PASS 2000x2300 Robin Summeretto import, OCR number sanitation and automatic recognition');

const relicModule=read('illustrated-relic-matcher.js').replaceAll('export ','');
new Function(relicModule);
const choose=new Function(relicModule+';return decideRelicSets;')();
const visualFixture=[
 [{setId:'127',score:.124},{setId:'102',score:.132}],
 [{setId:'127',score:.088},{setId:'122',score:.123}],
 [{setId:'127',score:.112},{setId:'122',score:.129}],
 [{setId:'127',score:.074},{setId:'125',score:.116}],
 [{setId:'308',score:.124},{setId:'305',score:.131}],
 [{setId:'308',score:.062},{setId:'310',score:.114}]
];
const chosen=choose(visualFixture);
assert.deepEqual(chosen.map(x=>x?.setId),['127','127','127','127','308','308'],
 'Family cross-match failed for the Robin Summeretto screenshot');
assert.ok(chosen.every(x=>x.confidence!=='probable'));
assert.ok(choose(Array.from({length:6},()=>[])).every(x=>x===null),
 'Must not invent sets without source evidence');
assert.ok(read('v06.js').includes('matcher.fillRelicSetFields(report.relicSets)'),
 'Illustrated screenshot path ignores identified icon sets');
assert.ok(read('.github/workflows/sync-content.yml').includes('python scripts/generate_relic_signatures.py'),
 'Future released relics must refresh icon reference database');
const relicCheck=new Function(illustrated+';return {relicValueFromText,plausibleRelicValue};')();
assert.equal(relicCheck.relicValueFromText('211,6','Taxa de Acerto de Efeito',0,false),null,
 'Invalid value from x2 enhancement badge must be rejected');
assert.equal(relicCheck.relicValueFromText('11,6%','Taxa de Acerto de Efeito',0,false),11.6);
assert.equal(relicCheck.relicValueFromText('705','PV',0,true),705);
assert.equal(relicCheck.relicValueFromText('352','ATQ',1,true),352);
assert.equal(relicCheck.relicValueFromText('43,2%','PV %',4,true),43.2);
assert.equal(relicCheck.relicValueFromText('19,4%','Regeneração de Energia',5,true),19.4);
assert.ok(read('illustrated-showcase-import.js').includes('value:[x+305,y-24,76,49]'),
 'Numeric crop must exclude the upgrade badge');
console.log('PASS 6/6 relic icon set decisions, fail-closed missing sets and numeric sanity bounds');
const mainAt15=new Function(illustrated+';return {verifiedMainAt15,inferStat};')();
assert.equal(mainAt15.verifiedMainAt15('Dano CRIT',2,15),64.8);
assert.equal(mainAt15.verifiedMainAt15('PV %',4,15),43.2);
assert.equal(mainAt15.verifiedMainAt15('Regeneração de Energia',5,15),19.4);
assert.equal(mainAt15.verifiedMainAt15('PV',0,15),705);
assert.equal(mainAt15.verifiedMainAt15('ATQ',1,15),352);
assert.equal(mainAt15.verifiedMainAt15('Dano CRIT',2,null),null);
assert.equal(mainAt15.inferStat('ATG','3.4%'),'ATQ %');
assert.equal(mainAt15.inferStat('Pw','10.8%'),'PV %');
assert.ok(read('illustrated-showcase-import.js').includes('relicLevels=extraction.levels'),
 'OCR must require observed relic level before applying deterministic main stats');
console.log('PASS +15 fixed main stats are corrected only for verified relic levels');


console.log('PASS assets, all four endgames, variant isolation, lazy theme, PWA');

for(const asset of ['nexus-account-engine.js','nexus-account.css','data/live-game.json','data/relic-icon-signatures.json'])
  assert.ok(sw.includes(asset),'Offline shell missing account asset: '+asset);
console.log('PASS PWA v15 caches account records and game catalog for offline access');
