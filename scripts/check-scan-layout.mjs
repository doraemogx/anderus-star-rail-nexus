#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../nexus-scan-layout.js',import.meta.url),'utf8');
const {validateScreenshot,classifyScreenshot,importField}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
for(const [width,height,kind] of [[2000,1826,'battle'],[2000,2300,'illustrated'],[390,844,'small'],[1280,720,'landscape'],[1000,1000,'other']]){
 const actual=classifyScreenshot({width,height});
 assert.equal(actual.kind,kind,width+'×'+height);
 assert.equal(actual.compatible,['battle','illustrated'].includes(kind));
 assert.equal(actual.review,true);
}
assert.equal(validateScreenshot({type:'image/jpeg',size:100000}).valid,true);
assert.equal(validateScreenshot({type:'image/svg+xml',size:10000}).valid,false);
assert.equal(validateScreenshot({type:'image/gif',size:10000}).valid,false);
assert.equal(validateScreenshot({type:'image/png',size:0}).valid,false);
assert.equal(validateScreenshot({type:'image/png',size:13*1024*1024}).valid,false);
assert.equal(importField(null).validation,'unrecognized');
assert.equal(importField('43,2%').validation,'requires-review');
assert.equal(importField('43,2%').confidence,'não calibrada');
console.log('PASS explicit screenshot compatibility, missing values and no fabricated OCR accuracy');
