#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../nexus-account-engine.js',import.meta.url),'utf8');
const {mergeRelicImport}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const old={setId:'127',level:15,main:{stat:'Dano CRIT',value:64.8},
 subs:[{stat:'VEL',value:8},{stat:'PV %',value:8.6},{stat:'Chance de CRIT',value:3.2},{stat:'ATQ %',value:4.3}]};
const blank=()=>({setId:'',level:null,main:{stat:'',value:null},subs:Array.from({length:4},()=>({stat:'',value:null}))});
let result=mergeRelicImport([blank()],[old]);
assert.deepEqual(result[0],old,'Empty OCR may not replace existing relic');
assert.notEqual(result[0],old,'Result must not mutate previous record');
result=mergeRelicImport([{setId:'127',level:null,main:{stat:'Dano CRIT',value:null},
 subs:[{stat:'VEL',value:9},...blank().subs.slice(1)]}],[old]);
assert.equal(result[0].main.value,64.8);
assert.equal(result[0].subs[0].value,9);
assert.equal(result[0].subs[1].value,8.6);
result=mergeRelicImport([{setId:'128',level:null,main:{stat:'PV %',value:43.2},subs:blank().subs}],[old]);
assert.equal(result[0].setId,'128');
assert.equal(result[0].subs[0].stat,'','New relic cannot inherit old stats');
result=mergeRelicImport([{setId:'',level:null,main:{stat:'VEL',value:25},subs:blank().subs}],[old]);
assert.equal(result[0].setId,'','Unknown set cannot inherit old equipment identity');
assert.equal(result.length,6,'Always return six slots');
console.log('PASS six-slot imports: no erased data, no cross-set mixing, no invented values');
