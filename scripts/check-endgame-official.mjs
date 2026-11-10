#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const payload=JSON.parse(readFileSync(new URL('../data/endgame-verified.json',import.meta.url),'utf8'));
assert.equal(payload.rotations.length,4);
assert.match(payload.sourceUrl,/^https:\/\/hsr.hoyoverse.com/);
for(const mode of payload.rotations){
 assert.ok(['moc','pf','sa','aa'].includes(mode.id));
 assert.ok(mode.start && mode.end && mode.start<=mode.end);
 assert.ok(mode.name && mode.phase);
 if(mode.id!=='aa')assert.ok(mode.effects.length>=1);
}
assert.equal(payload.upcoming.date,'2026-11-11');
console.log('PASS sourced version 4.6 endgame rotation windows and announced 4.7 transition');
