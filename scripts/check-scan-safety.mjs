#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const code=read("nexus-account-engine.js").replaceAll("export ","");
const api=new Function(code+";return {normalizeRelics,mergeRelicImport,pendingRelicFields,examineRelics,toLegacy};")();
const catalog=JSON.parse(read("data/live-game.json")),sets=catalog.relicSets;
const known=[
 {setId:"127",level:15,main:{stat:"PV",value:705},
  subs:[{stat:"PV %",value:8.6},{stat:"VEL",value:4},{stat:"ATQ %",value:3.4},{stat:"RES a Efeito",value:7.3}]},
 {setId:"127",level:15,main:{stat:"ATQ",value:352},
  subs:[{stat:"PV %",value:7.7},{stat:"ATQ %",value:12.9},{stat:"Chance de CRIT",value:2.5},{stat:"RES a Efeito",value:7.3}]},
 {setId:"127",level:15,main:{stat:"Dano CRIT",value:64.8},subs:[{stat:"DEF",value:38}]},
 {setId:"127",level:15,main:{stat:"VEL",value:25},subs:[{stat:"DEF",value:33}]},
 {setId:"308",level:15,main:{stat:"PV %",value:43.2},subs:[{stat:"ATQ",value:57}]},
 {setId:"308",level:15,main:{stat:"Regeneração de Energia",value:19.4},subs:[{stat:"PV",value:33}]}
];
const empty=Array.from({length:6},()=>({
 setId:"",level:null,main:{stat:"",value:null},subs:Array.from({length:4},()=>({stat:"",value:null}))
}));
const noLoss=api.mergeRelicImport(empty,known,{},sets);
assert.deepEqual(noLoss,api.normalizeRelics(known,{},sets),"Blank OCR must not destroy any of six confirmed relics");
const partial=structuredClone(empty);
partial[0].subs[1]={stat:"VEL",value:6};
partial[2].main={stat:"Dano CRIT",value:null};
const applied=api.mergeRelicImport(partial,known,{},sets);
assert.equal(applied[0].subs[1].value,6,"A valid new stat must update only its field");
assert.equal(applied[0].subs[0].value,8.6,"Unchanged stats must remain");
assert.equal(applied[2].main.value,64.8,"Unknown OCR principal value must not erase saved value");
const swapped=structuredClone(empty);
swapped[2].setId="120";
const replaced=api.mergeRelicImport(swapped,known,{},sets);
assert.equal(replaced[2].setId,"120");
assert.equal(replaced[2].main.value,null,"Changing the relic set must not keep stats from the old piece");
assert.equal(replaced[2].subs[0].stat,"");
const unknown=api.mergeRelicImport(empty,[],{},sets);
assert.equal(unknown.length,6);
assert.equal(unknown[0].level,null,"Missing piece level must not become +0 or +15");
assert.equal(api.pendingRelicFields(unknown).length,6);
const questionable=api.normalizeRelics([{setId:"127",level:15,main:{stat:"Dano CRIT",value:4.8}}],{},sets);
assert.equal(questionable[0].main.value,4.8,"OCR should be preserved literally");
assert.ok(api.examineRelics(questionable).flags.some(s=>s.includes("referência +15")),
 "Implausible observed amount should be flagged rather than silently corrected");
assert.ok(read("relic-inspector.js").includes("const cards=SLOT.map("));
assert.ok(read("relic-inspector.js").includes("level:get('lv')===''?null:Number(get('lv'))"));
assert.ok(read("v06.js").includes("nexusAccount.mergeRelicImport("));
assert.ok(!read("v06.js").includes("Complete os seis atributos principais antes de salvar"));
console.log("PASS six relic slots, unknown values, no OCR overwrite, valid partial updates and wrong-set isolation");
