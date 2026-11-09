#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const data=read('data/character-traces.json');
const game=read('data/live-game.json');
assert.ok(Object.keys(data.trees||{}).length>=90,'Missing trace trees');
let count=0,missing=0;
for(const [characterId,nodes] of Object.entries(data.trees)){
 assert.ok(Array.isArray(nodes),'Non-array trace list '+characterId);
 for(const trace of nodes){
  count++;
  assert.ok(trace.id,'Trace without ID');
  assert.ok(Array.isArray(trace.levels),'Missing level costs '+trace.id);
  for(const level of trace.levels)for(const material of level.materials||[]){
   assert.ok(Number.isFinite(material.num) && material.num>=0,'Invalid count '+trace.id);
   if(!data.items?.[material.id]?.name)missing++;
  }
 }
}
assert.ok(count>=1900,'Unexpected truncation of trace catalogue');
assert.equal(missing,0,'Incomplete item names for trace costs');
for(const c of Object.values(game.chars||{})){
 assert.ok((data.trees?.[c.id]||[]).length>=8,'Traces absent for '+c.name);
}
console.log('PASS',count,'trace records, item identity, character coverage and nonnegative costs');
