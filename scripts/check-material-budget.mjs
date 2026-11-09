#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const window={};
vm.runInNewContext(readFileSync(new URL('../nexus-material-budget.js',import.meta.url),'utf8'),
 {window,document:{readyState:'loading',addEventListener(){}},String,Object,Number,Array,Math,Error,Intl});
const budget=window.NexusMaterialBudget;
const catalogue={a:read('data/ascension-materials.json'),t:read('data/character-traces.json')};
const plans={ascension:{'1512':{from:4,to:6}},traces:{'1512':{'1512001':{current:0,target:2}}}};
const result=budget.calculate(catalogue,plans,{'2':100000,'110251':1});
assert.equal(result.breakdown.length,2);
const credits=result.rows.find(x=>x.id==='2');
assert.equal(credits.required,243500,'Ascension + traces should aggregate actual costs');
assert.equal(credits.missing,143500,'Inventory subtracted once, not per module');
assert.equal(result.rows.find(x=>x.id==='110251')?.missing,1);
const traceOnly=budget.calculate(catalogue,{traces:{'1512':{'1512001':{current:null,target:2}}}},{});
assert.equal(traceOnly.rows.length,0,'Unknown current level must not generate costs');
assert.equal(traceOnly.pending.length,1);
const noGoals=budget.calculate(catalogue,{},{});
assert.equal(noGoals.rows.length,0);
console.log('PASS shared budget across goals, one stock deduction, pending trace levels, and empty state');
