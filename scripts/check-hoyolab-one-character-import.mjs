#!/usr/bin/env node
/* A HoYoLab character-only JSON import updates Robin without erasing
 * other characters, equipped set IDs, saved trace notes or team setup.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../nexus-backup.js',import.meta.url),'utf8');
const data=new Map();
const localStorage={
 getItem:k=>data.has(k)?data.get(k):null,
 setItem:(k,v)=>data.set(k,String(v))
};
const window={};
vm.runInNewContext(source,{window,localStorage,structuredClone,JSON,String,Array,Object,Set,Map,Number});
const original={
 characters:{
  '1512':{level:80,e:0,s:1,cone:'Cone antigo',coneLevel:80,customNote:'Nota preservada',pv:6000},
  '1503':{level:80,e:2,s:1,cone:'Cone de outro personagem'}
 },
 v06RelicDetails:{'1512':[
  {setId:'127',setName:'Portador da Reconstrução do Mundo',level:15,
   main:{stat:'PV',value:705},subs:[{stat:'PV %',value:8.6},{stat:'VEL',value:4}]},
  ...Array.from({length:4},()=>({setId:'127',main:{stat:'',value:null},subs:[]})),
  {setId:'308',setName:'Vonwacq Vivaz',level:15,
   main:{stat:'Regeneração de Energia',value:19.4},subs:[{stat:'PV',value:33}]}
 ]},
 v06TracePlans:{'1512':{'1512001':{current:10,target:10}}},
 v06SavedTeams:[{id:'a',members:['1512','1503']}]
};
localStorage.setItem('anderus_nexus_v03',JSON.stringify(original));
const snapshot={
 kind:'anderus-account-backup',formatVersion:2,
 account:{
  characters:{'1512':{level:80,e:1,s:5,cone:'A Próxima Página da História',pv:6284}},
  v06RelicDetails:{'1512':[
   {setId:'',level:15,main:{stat:'PV',value:705},
    subs:[{stat:'PV %',value:8.6},{stat:'VEL',value:4},{stat:'Taxa de Acerto de Efeito',value:11.6},{stat:'ATQ %',value:3.4}]},
   ...Array.from({length:4},()=>({setId:'',main:{stat:'',value:null},subs:[]})),
   {setId:'',level:15,main:{stat:'Regeneração de Energia',value:19.4},
    subs:[{stat:'PV',value:33},{stat:'DEF %',value:10.2},{stat:'Efeito de Quebra',value:10.3},{stat:'PV %',value:10.8}]}
  ]}
 }
};
const result=window.NexusBackup.restore(snapshot,'merge');
assert.equal(result.characters,2);
const updated=JSON.parse(localStorage.getItem('anderus_nexus_v03'));
assert.equal(updated.characters['1512'].pv,6284);
assert.equal(updated.characters['1512'].e,1);
assert.equal(updated.characters['1512'].s,5);
assert.equal(updated.characters['1512'].coneLevel,80);
assert.equal(updated.characters['1512'].customNote,'Nota preservada');
assert.equal(updated.characters['1503'].e,2);
assert.equal(updated.v06RelicDetails['1512'][5].setId,'308','Existing set must survive a partial import');
assert.equal(updated.v06RelicDetails['1512'][5].subs[3].value,10.8);
assert.equal(updated.v06RelicDetails['1512'][0].subs[2].value,11.6);
assert.equal(updated.v06TracePlans['1512']['1512001'].current,10);
assert.equal(updated.v06SavedTeams[0].id,'a');
window.NexusBackup.rollback();
const after=JSON.parse(localStorage.getItem('anderus_nexus_v03'));
assert.equal(after.characters['1512'].e,0);
assert.equal(after.v06RelicDetails['1512'][5].subs[1],undefined);
console.log('PASS single-character HoYoLab import preserves other characters, relic sets, traces, notes and reversible backup');
