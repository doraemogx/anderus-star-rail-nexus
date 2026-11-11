#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('nexus-theme-studio-v3.js'),css=read('nexus-theme-studio-v3.css');
const shell=read('v06.js'),sw=read('sw.js'),original=read('scripts/browser-visual-completion.mjs');
const registry=JSON.parse(read('themes/generated/index.json'));
const routes=['home','library','profile','endgame','farm','radar','tier','themes','nexia','settings'];
const hex=x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x);
assert.equal(registry.schema,1);
assert.ok(Array.isArray(registry.themes),'Published gallery must be an array');
assert.equal(new Set(registry.themes.map(t=>t.id)).size,registry.themes.length,'Duplicate identity');
for(const item of registry.themes){
 assert.match(item.id,/^[a-z0-9][a-z0-9-]{2,62}$/,'Slug unsafe');
 assert.equal(item.manifest,'./themes/generated/'+item.id+'/theme.json');
 const path='themes/generated/'+item.id+'/',manifest=JSON.parse(read(path+'theme.json')),skin=read(path+'theme.css');
 assert.equal(manifest.schema,3);assert.equal(manifest.id,item.id);
 assert.ok(manifest.name&&manifest.characterId&&manifest.version&&manifest.description);
 assert.equal(manifest.hasStyles,true,'Published themes must include audited CSS');
 assert.ok(['arc','petal','blade','sigil','crystal','theatre'].includes(manifest.shape));
 assert.ok(['Cinzel','Marcellus','Georgia','DM Sans','system-ui'].includes(manifest.font));
 assert.ok(!Number.isNaN(Date.parse(manifest.createdAt)),'Invalid ISO createdAt');
 for(const token of ['accent','second','background','surface','text','muted'])assert.ok(hex(manifest.tokens?.[token]),'Bad '+token);
 for(const route of routes){
  assert.ok(manifest.screens?.[route]?.eyebrow&&manifest.screens[route]?.headline&&manifest.screens[route]?.accent,'Missing '+route);
  assert.ok(src.includes(route),'Missing studio route '+route);
 }
 assert.ok(skin.includes('.app[data-nx3-theme="'+item.id+'"]'),'Unscoped generated CSS');
 assert.ok(skin.includes('prefers-reduced-motion'),'Reduced motion absent');
 assert.ok(!/javascript:/i.test(skin),'Disallow JavaScript URLs in CSS');
 assert.ok(sw.includes(path+'theme.json')&&sw.includes(path+'theme.css'),'Offline theme assets missing');
}
const pearl=JSON.parse(read('themes/generated/pearl-ocean-atlas/theme.json'));
assert.equal(pearl.characterId,'1503');
const eidolons=JSON.parse(read('data/eidolon-art.json')).characters?.['1503'];
assert.equal(eidolons?.length,6,'Never invent or replace Pearl E1–E6 artwork');
for(const url of eidolons)assert.match(url,/Character_Pearl_Eidolon_[1-6]\.png/);
for(const p of ['nexus-theme-studio-v3.js','nexus-theme-studio-v3.css','themes/generated/index.json']){
 assert.ok(shell.includes(p)||p==='themes/generated/index.json','Missing entrypoint '+p);
 assert.ok(sw.includes(p),'Missing PWA precache '+p);
}
for(const label of ['theme.json','theme.css','schema:3','characterId','Eidolons','mobile',
 'Criar este tema no ChatGPT','Manifesto','Prévia','persist','previewMock'])
 assert.ok(src.toLowerCase().includes(label.toLowerCase()),'Creative Studio missing '+label);
assert.ok(src.includes('themes/generated/index.json'));
assert.ok(src.includes('anderus_theme_studio_generated_v3'));
assert.ok(!src.includes("localStorage.setItem('anderus_nexus_v03'"),'Never overwrite the main account');
assert.ok(!src.includes('state.characters='),'Never mutate character records');
assert.ok(!src.includes('eval('),'No dynamic eval');
assert.ok(css.includes('.nx3-studio~.v06-themes'));
assert.ok(css.includes('v10-eido-grid')&&css.includes('v11-relic-card'));
assert.ok(css.includes('prefers-reduced-motion'));
assert.ok(original.includes('aha-eidolon-grid'),'Previous Eidolon regression must remain');
console.log('PASS: reviewed Theme Studio 3 manifests, Pearl E1–E6, scoped CSS and data safety');
