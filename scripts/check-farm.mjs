#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={},ctx={window,document:{readyState:'loading',addEventListener(){}},Number,Object,Array,Math,String};
vm.runInNewContext(read('nexus-farm-lab.js'),ctx);
const lab=window.NexusFarmLab;
assert.equal(typeof lab?.compute,'function');
const payload=JSON.parse(read('data/ascension-materials.json'));
assert.ok(Object.keys(payload.promotions).length>=90);
const records=payload.promotions['1512'];
const counts=lab.compute(records,4,6);
assert.equal(counts['2'],240000);
assert.equal(counts['114003'],15);
assert.equal(counts['110435'],55);
const needed=lab.missing(counts,{'2':100000,'114003':17,'110435':14});
assert.equal(needed['2'],140000);
assert.equal(needed['114003'],0);
assert.equal(needed['110435'],41);
assert.equal(Object.keys(lab.compute(records,6,6)).length,0);
assert.throws(()=>lab.compute(records,6,4),/inválidas/);
for(const [id,stages] of Object.entries(payload.promotions)){
 assert.equal(stages.length,6,'Ascension stages incomplete for '+id);
 for(const stage of stages)for(const row of stage)assert.ok(payload.items[row.id]?.name,'Item missing from material index '+row.id);
}
console.log('PASS sourced promotion requirements, per-stage totals, registered stocks and no invented runs');
