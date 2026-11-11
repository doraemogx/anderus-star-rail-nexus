#!/usr/bin/env node
/* Regression guard: official display name and complete visual routes. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const index=read('index.html'),v06=read('v06.js'),theatre=read('themes/aha.js');
const beta=JSON.parse(read('data/beta-editorial.json'));
const css=read('nexus-design-system.css'),ahaCSS=read('themes/aha-detail.css');
const ux=read('nexus-design-system.js'),sw=read('sw.js'),v07=read('nexus-v07.js');
assert.ok(index.includes('"id":"future-aha","name":"Aha"'),
 'Catalog must present only official name Aha');
assert.equal(beta.entries.find(x=>x.id==='1511')?.name,'Aha');
for(const [file,body] of [['index.html',index],['v06.js',v06],['themes/aha.js',theatre]]){
 for(const bad of ['Nihilux','Nerilux','Nihilux / Rá','NIHILUX / RÁ','Aeon ★ Aha']){
  assert.ok(!body.includes(bad),'Deprecated Aha name in '+file+': '+bad);
 }
}
assert.ok(theatre.includes('Aha, Aeon da Euforia.'),'Missing Aha official character label');
for(const selector of ['.nx-scene','.nx-theme-preview','.v06-upload-banner',
 '.v06-char-card','.v11-relic-card','.v09-boss','.v06-theme-grid']){
 assert.ok(css.includes(selector),'Missing shared design visual '+selector);
}
for(const section of ['.v06-char-card','.v06-metric','.v09-boss','.v07-kit',
 '.v11-relic-card','.v06-theme-grid','.v06-pom-tip','.v06-upload-banner']){
 assert.ok(ahaCSS.includes(section),'Theatre design not applied to '+section);
}
for(const route of ['library','profile','endgame','farm','radar','tier','themes','nexia','settings'])
 assert.ok(ux.includes(route+':'),'Missing route scene '+route);
assert.ok(ux.includes('Compare antes de aplicar'));
assert.ok(ux.includes('dialog.showModal()'));
assert.ok(ux.includes('stopImmediatePropagation()'));
assert.ok(ux.includes('dialog.close()'));
assert.ok(!ux.includes("localStorage.setItem('anderus_nexus_v03'"),
 'Visual layer cannot overwrite account data');
for(const path of ['themes/aha.css','themes/aha.js','themes/aha-detail.css','themes/aha-detail.js',
 'assets/official/aha-4-7.webp',...Array.from({length:6},(_,i)=>'assets/official/aha-e'+(i+1)+'.webp')]){
 assert.ok(existsSync(new URL('../'+path,import.meta.url)),'Missing official asset '+path);
 assert.ok(sw.includes("'./"+path+"'"),'Offline asset not precached '+path);
}
for(const path of ['themes/aha.css','themes/aha.js','themes/aha-detail.css','themes/aha-detail.js']){
 assert.ok(v07.includes("'./"+path+"'"),'Visual loader must use offline-safe file path '+path);
}
console.log('PASS visual: official Aha title, 9 scene labels, card system, Grand Theatre, preview and offline assets');
