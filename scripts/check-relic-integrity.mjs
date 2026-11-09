// Regression guard: OCR values and manually entered values must never be guessed.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../nexus-account-engine.js',import.meta.url),'utf8');
const data='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const {normalizeRelics}=await import(data);
const sample=[{setId:'101',level:15,main:{stat:'Chance de CRIT',value:31.7},subs:[]}];
const [record]=normalizeRelics(sample,null,{});
assert.equal(record.main.value,31.7,'A detected level 15 value must not become 32.4');
const [missing]=normalizeRelics([{setId:'101',level:15,main:{stat:'Chance de CRIT',value:null}}],null,{});
assert.equal(missing.main.value,null,'An unobserved stat must remain unknown');
const [manual]=normalizeRelics([{level:15,main:{stat:'VEL',value:24.5}}],null,{});
assert.equal(manual.main.value,24.5);
console.log('Relic normalization regression: OK');
