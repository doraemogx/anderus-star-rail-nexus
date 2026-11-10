#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../nexus-relic-optimizer.js',import.meta.url),'utf8');
const window={};
vm.runInNewContext(script,{window,document:{readyState:'loading',addEventListener(){}},String,Object,Array,Number,Math});
const opt=window.NexusRelicOptimizer;
const atk=opt.analyseKit([{desc:'Causa Dano Físico igual a #1[i]% do ATQ de Evanescia.'}]);
assert.equal(atk.atk,true);
assert.equal(atk.hp,false);
const hp=opt.analyseKit([{desc:'Causa Dano de Vento igual a #1[i]% dos PV máximos de Robin - Summeretto.'}]);
assert.equal(hp.hp,true);
assert.equal(hp.atk,false);
const record={setId:'127',level:15,main:{stat:'ATQ %',value:43.2},
 subs:[{stat:'ATQ %',value:8.6},{stat:'VEL',value:4},{stat:'Chance de CRIT',value:3.2},{stat:'DEF %',value:5.4}]};
const result=opt.assessPiece(record,atk);
assert.equal(result.completed,true);
assert.ok(result.reasons.some(x=>x.includes('ATQ %')),'ATQ should match factual kit scaling');
assert.equal(opt.assessPiece({...record,setId:''},atk).completed,false);
const undecided=opt.analyseKit([{desc:'Causa Dano a um inimigo.'}]);
assert.equal(undecided.atk,false);
assert.equal(undecided.hp,false);
console.log('PASS sourced kit stat signals, mixed stats, incomplete fields and no universal score');
