#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const index=read('data/boss-index.json');
const all=Object.values(index.bosses||{});
assert.equal(all.length,14,'Endgame search index must cover 14 existing encounters');
for(const mode of ['moc','pf','sa','aa'])assert.ok(all.filter(x=>x.mode===mode).length>=3,'Missing mode '+mode);
for(const boss of all){
 assert.ok(boss.name&&boss.stage&&boss.detail&&Array.isArray(boss.weak));
 assert.equal(boss.sourceType,'editorial','Do not claim these encounter descriptions are official');
}
const window={};
const s=readFileSync(new URL('../nexus-search.js',import.meta.url),'utf8');
vm.runInNewContext(s,{window,document:{readyState:'loading',addEventListener(){}},Array,Object,String,Number,Math});
const list=window.NexusSearch.entries({bosses:index.bosses});
assert.ok(window.NexusSearch.sortResults(list,'Hoolay').some(x=>x.type==='boss'));
assert.ok(window.NexusSearch.sortResults(list,'Hemovoria').some(x=>x.type==='boss'&&x.id.startsWith('aa-')));
console.log('PASS boss names, endgame categories, mechanics and editorial provenance');
