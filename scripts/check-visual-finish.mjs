import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const js=read('nexus-visual-finish.js'),css=read('nexus-visual-finish.css');
const app=read('v06.js'),sw=read('sw.js');
const index=read('index.html');
for(const x of ['nexus-visual-finish.css','nexus-visual-finish.js']){
 assert.ok(app.includes(x),'Loader missing '+x);
 assert.ok(sw.includes(x),'Offline cache missing '+x);
}
for(const x of ['home','library','endgame','farm','radar','themes','nexia','settings']){
 assert.ok(js.includes(x+':'),'Missing vector icon '+x);
}
assert.ok(js.includes('const CANONICAL=\'Aha\''),'Canonical Aha label missing');
assert.ok(!js.includes('localStorage.setItem('),'Visual finish must not persist account or themes');
assert.ok(index.includes('"id":"future-aha","name":"Aha"'),'Catalogue must retain official name Aha');
assert.ok(css.includes('prefers-reduced-motion'),'Missing motion accessibility');
console.log('PASS visual: official Aha, eight vector icons, no account writes, offline cache');
