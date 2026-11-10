#!/usr/bin/env node
/* HoYoLab 2000x2300 regression, derived from a user supplied Robin card.
 * No account IDs, screenshots, account links, or private credentials in Git.
 * Tests OCR normalization from the screenshot; image recognition itself
 * still needs a real-device acceptance check after publication.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../illustrated-showcase-import.js",import.meta.url),"utf8").replaceAll("export ","");
const api=new Function(code+";return {matchCharacter,inferStat,relicRowCoords,relicValueFromText,verifiedMainAt15,reconcileHoYoLabRelicRead};")();
const roster=[{id:"1309",name:"Robin"},{id:"1512",name:"Robin • Summeretto"}];
for(const text of ["Robin - Summeretto Nv. 80","R0bin - Summerett0 Nv.80","Robin — Summeretto","Robin - Summeretlo"]){
 assert.equal(api.matchCharacter(text,roster)?.id,"1512",text+" should identify the Summeretto version");
}
assert.equal(api.matchCharacter("Robin",roster)?.id,"1309","Standard Robin must remain distinct");
const rightAligned=api.relicRowCoords(5,0).value;
assert.ok(rightAligned[0]<=1845&&rightAligned[0]+rightAligned[2]>=1930,
 "The rope OCR crop must include the leftmost '1' in 19.4% on the HoYoLab 2000x2300 card");
assert.ok(rightAligned[0]>=1820,"The crop must exclude the enhancement badges");
assert.equal(api.relicValueFromText("3","PV",5,false),null,"An OCR-clipped PV 33 cannot become PV 3");
assert.equal(api.relicValueFromText("0,3%","Efeito de Quebra",5,false),null,"Break 10.3 cannot become 0.3");
assert.equal(api.relicValueFromText("2,4%","Regeneração de Energia",5,true),null);
const fixture=[
 [{stat:"PV",value:705},{stat:"PV %",value:8.6},{stat:"VEL",value:4},
  {stat:"Taxa de Acerto de Efeito",value:11.6},{stat:"ATQ %",value:3.4}],
 [{stat:"ATQ",value:352},{stat:"PV %",value:7.7},{stat:"ATQ %",value:12.9},
  {stat:"Chance de CRIT",value:2.5},{stat:"RES a Efeito",value:7.3}],
 [{stat:"Dano CRIT",value:64.8},{stat:"DEF",value:38},{stat:"PV %",value:14.6},
  {stat:"Efeito de Quebra",value:5.1},{stat:"Chance de CRIT",value:3.2}],
 [{stat:"VEL",value:25},{stat:"DEF",value:33},{stat:"PV %",value:8.2},
  {stat:"ATQ %",value:12},{stat:"Dano CRIT",value:12.3}],
 [{stat:"PV %",value:43.2},{stat:"ATQ",value:57},{stat:"Chance de CRIT",value:5.8},
  {stat:"RES a Efeito",value:7.3},{stat:"PV",value:42}],
 [{stat:"Regeneração de Energia",value:19.4},{stat:"PV",value:33},
  {stat:"DEF %",value:10.2},{stat:"Efeito de Quebra",value:10.3},
  {stat:"PV %",value:10.8}]
];
let checked=0;
for(let slot=0;slot<6;slot++){
 for(let row=0;row<5;row++){
  const r=fixture[slot][row],percent=/ %$|CRIT|Quebra|Efeito|Energia|RES a|^PV %$|^ATQ %$|^DEF %$/.test(r.stat);
  const value=String(r.value).replace(".",",")+(percent?"%":"");
  const answer=api.reconcileHoYoLabRelicRead({stat:r.stat,slot,level:15,main:row===0,
   readings:[value,value]});
  assert.equal(answer.value,r.value,"slot "+slot+" row "+row+" "+r.stat);
  checked++;
 }
}
const rope=fixture[5];
assert.equal(api.reconcileHoYoLabRelicRead({stat:rope[0].stat,slot:5,level:15,main:true,
 readings:["2,4%","19,4%","19,4%"]}).value,19.4);
assert.equal(api.reconcileHoYoLabRelicRead({stat:rope[1].stat,slot:5,level:15,main:false,
 readings:["3","33","33"]}).value,33);
assert.equal(api.reconcileHoYoLabRelicRead({stat:rope[3].stat,slot:5,level:15,main:false,
 readings:["0,3%","10,3%","10,3%"]}).value,10.3);
assert.equal(api.reconcileHoYoLabRelicRead({stat:rope[0].stat,slot:5,level:null,main:true,
 readings:["2,4%"]}).value,null,"Unknown level cannot unlock a theoretical +15 number");
assert.equal(checked,30);
console.log("PASS HoYoLab 2000x2300 Robin: name disambiguation, safe crops and 30/30 expected number checks");
