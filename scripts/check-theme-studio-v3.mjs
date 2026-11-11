#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const src=read('nexus-theme-studio-v3.js'),css=read('nexus-theme-studio-v3.css');
const shell=read('v06.js'),sw=read('sw.js'),original=read('scripts/browser-visual-completion.mjs');
assert.ok(existsSync(new URL('../themes/generated/index.json',import.meta.url)));
const registry=JSON.parse(read('themes/generated/index.json'));
assert.equal(registry.schema,1);
assert.deepEqual(registry.themes,[],'Never pre-register a fake generated theme');
for(const p of ['nexus-theme-studio-v3.js','nexus-theme-studio-v3.css','themes/generated/index.json']){
 assert.ok(shell.includes(p)||p==='themes/generated/index.json','Missing entrypoint: '+p);
 assert.ok(sw.includes(p),'Missing PWA precache '+p);
}
for(const route of ['home','library','profile','endgame','farm','radar','tier','themes','nexia','settings']){
 assert.ok(src.includes(route),'Missing route '+route);
}
for(const label of ['theme.json','theme.css','schema:3','characterId','Eidolons','mobile',
 'Criar este tema no ChatGPT','Manifesto','Prévia','persist','previewMock']){
 assert.ok(src.toLowerCase().includes(label.toLowerCase()),'Creative Studio missing '+label);
}
assert.ok(src.includes('themes/generated/index.json'));
assert.ok(src.includes('nexus_theme_studio_generated_v3')||src.includes('anderus_theme_studio_generated_v3'));
assert.ok(!src.includes("localStorage.setItem('anderus_nexus_v03'"),'Must never overwrite the main account');
assert.ok(!src.includes('state.characters='),'Must not mutate owned character records');
assert.ok(!src.includes('eval('),'No dynamic eval');
assert.ok(css.includes('.nx3-studio~.v06-themes'));
assert.ok(css.includes('v10-eido-grid')&&css.includes('v11-relic-card'),'Original character artwork/relics must remain');
assert.ok(css.includes('prefers-reduced-motion'));
assert.ok(original.includes('aha-eidolon-grid'),'Previous six Eidolon image regression must remain');
console.log('PASS Theme Studio 3: generated-only workflow, full-route prompt, scoped skins, original artwork preserved');
