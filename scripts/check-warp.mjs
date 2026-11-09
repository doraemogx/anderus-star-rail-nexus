#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const window={},source=readFileSync(new URL('../nexus-warp-math.js',import.meta.url),'utf8');
vm.runInNewContext(source,{window,Number,Math,Error,Float64Array});
const w=window.NexusWarpMath;
assert.equal(w.maximum('character',1,0,false),180);
assert.equal(w.maximum('character',1,89,true),1);
assert.equal(w.maximum('character',1,89,false),91);
assert.equal(w.maximum('character',3,0,false),540);
assert.equal(w.maximum('cone',1,79,false),81);
assert.equal(w.maximum('cone',1,79,true),1);
assert.equal(w.chance('character',1,89,true,1),1);
assert.ok(Math.abs(w.chance('character',1,89,false,1)-.5)<1e-12);
assert.equal(w.chance('character',1,89,false,91),1);
assert.ok(Math.abs(w.chance('cone',1,79,false,1)-.75)<1e-12);
assert.equal(w.chance('cone',1,79,false,81),1);
assert.equal(w.chance('character',0,0,false,0),1);
assert.equal(w.chance('character',1,0,false,0),0);
for(const kind of ['character','cone']){
 const list=[0,1,5,20,50,90,160,300].map(n=>w.chance(kind,1,0,false,n));
 assert.ok(list.every((v,i)=>Number.isFinite(v)&&v>=0&&v<=1&&(i===0||v>=list[i-1])),'Probability must be monotonic');
}
assert.equal(w.resources(10,159,2,1),13);
assert.equal(w.resources(5,320,0,0),7);
assert.throws(()=>w.chance('character',1,90,false,1),/Pity/);
console.log('PASS featured pity, guarantee, probability lower-bound monotonicity and jade conversions');
