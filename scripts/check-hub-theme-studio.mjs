#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const js=read('nexus-visual-experience.js'),css=read('nexus-visual-experience.css');
const shell=read('v06.js'),sw=read('sw.js'),test=read('scripts/browser-hub-theme-studio.mjs');
for(const p of ['nexus-visual-experience.js','nexus-visual-experience.css']){
 assert.ok(shell.includes(p),'Missing entrypoint for '+p);
 assert.ok(sw.includes(p),'Offline precache is missing '+p);
}
for(const route of ['home','library','profile','endgame','farm','radar','tier','themes','nexia','settings']){
 assert.ok(css.includes('data-vex-scene='+route)||js.includes("'"+route+"'"),
   'Route visual identity missing '+route);
}
for(const component of ['nx-vex-intro','nx-vex-feature-grid','nx-vex-filter',
 'nx-vex-mock','nx-vex-scene-ornament','nx-vex-section-header']){
 assert.ok(js.includes(component)&&css.includes(component),'Missing component '+component);
}
for(const feature of ['Preview','preview','featured','owned','aria-pressed','role="status"']){
 assert.ok(js.includes(feature),'Missing studio function '+feature);
}
assert.ok(!js.includes('localStorage.setItem('),'Theme Studio visual enhancements must not write saved data');
assert.ok(!js.includes('state.theme='),'Theme Studio must use the existing confirmed apply action');
assert.ok(css.includes('prefers-reduced-motion'),'Reduced motion support missing');
assert.ok(test.includes('before')&&test.includes('account'),'Preview safety regression missing');
console.log('PASS entire visual experience: 10 route identities, Theme Studio preview, controls and safe PWA');
