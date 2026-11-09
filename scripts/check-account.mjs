#!/usr/bin/env node
/* Regression suite for account normalization, cone details and Pom-Pom guidance. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=read('nexus-account-engine.js').replaceAll('export ','');
new Function(code);
const a=new Function(code+';return {SLOTS,STATS,normalizeRelics,toLegacy,examineRelics,matchCone,coneEffect,buildCoach,pretty};')();
const game=JSON.parse(read('data/live-game.json'));
assert.ok(Object.keys(game.cones||{}).length>=150);
assert.ok(Object.keys(game.coneRanks||{}).length>=150,'Light Cone S1–S5 catalogue must be synchronized');
for(const [id,c] of Object.entries(game.cones)){
 assert.ok(game.coneRanks[id]?.desc, 'Missing passive for Light Cone '+c.name);
 assert.ok(c.portrait||c.preview,'Missing illustration for Light Cone '+c.name);
 assert.ok(!a.coneEffect(game.coneRanks[id],5).includes('#1['),'Unresolved S5 effect for '+c.name);
}
const src=[
 {setId:'127',level:15,main:{stat:'PV',value:705},subs:[{stat:'PV %',value:8.6},{stat:'VEL',value:4},{stat:'Taxa de Acerto de Efeito',value:11.6},{stat:'ATQ %',value:3.4}]},
 {setId:'127',level:15,main:{stat:'ATQ',value:352},subs:[{stat:'PV %',value:7.7},{stat:'ATQ %',value:12.9},{stat:'Chance de CRIT',value:2.5},{stat:'RES a Efeito',value:7.3}]},
 {setId:'127',level:15,main:{stat:'Dano CRIT',value:4.8},subs:[{stat:'DEF',value:38},{stat:'PV %',value:14.6},{stat:'Efeito de Quebra',value:5.1},{stat:'Chance de CRIT',value:3.2}]},
 {setId:'127',level:15,main:{stat:'VEL',value:25},subs:[{stat:'DEF',value:33},{stat:'PV %',value:8.2},{stat:'ATQ %',value:12.0},{stat:'Dano CRIT',value:12.3}]},
 {setId:'308',level:15,main:{stat:'PV %',value:43.2},subs:[{stat:'ATQ',value:57},{stat:'Chance de CRIT',value:5.8},{stat:'RES a Efeito',value:7.3},{stat:'PV',value:42}]},
 {setId:'308',level:15,main:{stat:'Regeneração de Energia',value:19.4},subs:[{stat:'PV',value:33},{stat:'DEF %',value:10.2},{stat:'Efeito de Quebra',value:10.3},{stat:'PV %',value:10.8}]}
];
const records=a.normalizeRelics(src,{},game.relicSets);
assert.equal(records[2].main.value,64.8,'Old 4.8 OCR must become 64.8 for +15 body');
assert.equal(a.examineRelics(records).complete,6);
assert.deepEqual(a.examineRelics(records).counts,{'127':4,'308':2});
const migrated=a.toLegacy(records,game.relicSets,{});
assert.equal(migrated[2].main,'Dano CRIT');
assert.equal(migrated[2].value,'64,8%');
assert.equal(migrated[0].set,game.relicSets['127'].name);
const backward=a.normalizeRelics(null,migrated,game.relicSets);
assert.equal(backward[0].subs[2].value,11.6);
assert.equal(backward[3].subs[2].stat,'ATQ %');
assert.equal(backward[5].main.value,19.4);
assert.equal(a.examineRelics(backward).registered,6);
const cone=a.matchCone('A Proxima Pagina da Historia',game.cones);
assert.equal(cone?.id,'21054');
const passive=a.coneEffect(game.coneRanks[cone.id],5);
assert.match(passive,/32%/);
assert.match(passive,/24%/);
assert.ok(!passive.includes('#1['));
const advice=a.buildCoach({
 character:game.chars['1512'],build:{level:80,e:1,s:5,cone:cone.name,pv:6284,spd:138,crit:31.3,cdmg:127.1},
 records,sets:game.relicSets,cone,coneRank:game.coneRanks[cone.id]
});
const text=advice.map(x=>x.title+' '+x.body).join(' ');
assert.match(text,/Portador da Reconstrução do Mundo/);
assert.match(text,/Vonwacq Vivaz/);
assert.match(text,/S5/);
assert.match(text,/138 VEL/);
assert.ok(advice.some(x=>x.title.includes('Cone')));
const review=a.examineRelics(a.normalizeRelics([{setId:'127',main:{stat:'PV',value:705},subs:[{stat:'Taxa de Acerto de Efeito',value:211.6}]}]));
assert.ok(review.flags.some(x=>x.includes('211,6')),'Flag impossible old OCR substat');
const v06=read('v06.js');
for(const needed of ["accountRecords(id)","migrateAccountRelics()","state.v06RelicDetails[id]=corrected","state.characters[id].relics=nexusAccount.toLegacy","state.v06RelicDetails[id]=unified","function profileCone(id,b)","window.v11EditRelic=","window.v11SaveRelic=","renderAccountCoach(id)","function contextualTip(id)","'./nexus-account.css?v=1'"]){
 assert.ok(v06.includes(needed),'Missing UI/storage integration: '+needed);
}
assert.ok(v06.includes("['cone','Cone de Luz']"),'Cone tab missing');
const css=read('nexus-account.css');
assert.ok(css.includes('@media(max-width:360px)'));
assert.ok(css.includes('min-height:46px'));
console.log('PASS 170 S5 cone effects and artwork, reversible 6-piece migration, equipped cone viewer, 4+2 set analysis, accessibility and mobile styles');
