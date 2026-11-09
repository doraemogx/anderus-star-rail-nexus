#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const aliases=read('data/search-aliases.json'),pt=read('data/live-game.json');
for(const [kind,key,minimum] of [['character','chars',90],['cone','cones',150],['set','relicSets',25],['item','relics',650]]){
 assert.ok(Object.keys(aliases[kind]).length>=minimum,'Alias catalogue incomplete: '+kind);
 for(const id of Object.keys(pt[key]||{})){
  assert.ok(aliases[kind][id]?.length,'Missing original English name '+kind+' #'+id);
 }
}
const window={};
const s=readFileSync(new URL('../nexus-search.js',import.meta.url),'utf8');
vm.runInNewContext(s,{window,document:{readyState:'loading',addEventListener(){}},String,Array,Object,Number,Map,Set,Math});
const search=window.NexusSearch;
const entries=search.entries({...pt,searchAliases:aliases});
const en=search.sortResults(entries,'Passerby of Wandering Cloud');
assert.ok(en.some(x=>x.id==='101'&&x.type==='set'),'English search must find the canonical PT-BR relic set');
const ptSearch=search.sortResults(entries,pt.relicSets['101'].name);
assert.ok(ptSearch.some(x=>x.id==='101'),'PT-BR results must not regress');
assert.ok(search.sortResults(entries,'March 7th').some(x=>x.id==='1001'));
console.log('PASS canonical PT-BR search via English aliases, IDs and material provenance');
