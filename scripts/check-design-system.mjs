#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../nexus-design-system.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../nexus-design-system.js',import.meta.url),'utf8');
const shell=readFileSync(new URL('../v06.js',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const test=readFileSync(new URL('./browser-design-system.mjs',import.meta.url),'utf8');
for(const token of ['--nx-space-4','--nx-radius-md','--nx-focus','--nx-surface',
 '--nx-shadow','--nx-control-min','--nx-nav-height','--nx-ui']){
 assert.ok(css.includes(token),'Missing design token: '+token);
}
for(const bp of ['max-width:359px','min-width:360px','min-width:430px',
 'min-width:768px','min-width:1024px','min-width:1440px','min-width:1920px']){
 assert.ok(css.includes(bp),'Missing responsive breakpoint: '+bp);
}
for(const target of ['.v06-hero','.v06-tile-grid','.v06-profile .v06-tabs',
 '.v09-boss','.v06-theme-grid','#nexus-scan-v3','.bottom-nav','.desktop-sidebar']){
 assert.ok(css.includes(target),'Missing domain styling: '+target);
}
for(const a of ['.nx-skip','aria-current','aria-expanded','aria-haspopup',
 'Escape','aria-live','requestAnimationFrame','MutationObserver']){
 assert.ok(js.includes(a),'Missing UX affordance: '+a);
}
for(const ref of ['nexus-design-system.css','nexus-design-system.js']){
 assert.ok(shell.includes(ref),'Missing runtime link to '+ref);
 assert.ok(sw.includes(ref),'Missing offline precache for '+ref);
}
assert.ok(test.includes('[320,360,390,430,768,1024,1440,1920]'),'Incomplete screen width test');
for(const route of ['home','library','endgame','farm','radar','tier','themes','nexia','settings'])
 assert.ok(test.includes("'"+route+"'"),'Missing route coverage: '+route);
assert.ok(!js.includes('localStorage.setItem('),'UX layer must not write the account');
console.log('PASS Phase 4: design tokens, 8 widths, 9 routes, accessibility, PWA and no storage writes');
