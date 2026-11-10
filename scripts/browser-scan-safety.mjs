#!/usr/bin/env node
/* Fase 3: real Chromium, unknown screenshot layout, always six relic controls.
 * No screenshot data or character records are sent to any third-party service.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const cases=[{width:390,height:844,isMobile:true,hasTouch:true},
 {width:1440,height:900,isMobile:false,hasTouch:false}];
const known={
 characters:{"1512":{level:80,e:2,s:1,pv:6284,atk:1500,def:1000,spd:138,
  crit:35,cdmg:160,cone:"A Próxima Página da História"}},
 v06RelicDetails:{"1512":[
  {setId:"127",level:15,main:{stat:"PV",value:705},
   subs:[{stat:"PV %",value:8.6},{stat:"VEL",value:4},{stat:"ATQ %",value:3.4},{stat:"RES a Efeito",value:7.3}]},
  {setId:"127",level:15,main:{stat:"ATQ",value:352},
   subs:[{stat:"PV %",value:7.7},{stat:"ATQ %",value:12.9},{stat:"Chance de CRIT",value:2.5},{stat:"RES a Efeito",value:7.3}]},
  {setId:"127",level:15,main:{stat:"Dano CRIT",value:64.8},
   subs:[{stat:"DEF",value:38},{stat:"PV %",value:14.6},{stat:"Efeito de Quebra",value:5.1},{stat:"Chance de CRIT",value:3.2}]},
  {setId:"127",level:15,main:{stat:"VEL",value:25},subs:[]},
  {setId:"308",level:15,main:{stat:"PV %",value:43.2},subs:[]},
  {setId:"308",level:15,main:{stat:"Regeneração de Energia",value:19.4},subs:[]}
 ]}
};
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage","--no-sandbox"]});
await mkdir("artifacts",{recursive:true});
try{
 for(const device of cases){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:device.isMobile,hasTouch:device.hasTouch});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(data=>{
   if(!localStorage.getItem("anderus_nexus_v03"))
    localStorage.setItem("anderus_nexus_v03",JSON.stringify(data));
   // A deliberately non-recognizable screenshot must fail safely without OCR network.
   window.Tesseract={createWorker:async()=>{throw Error("OCR disabled for synthetic fixture");}};
  },known);
  await context.route("https://nexia-ai-nexus.andrediascrm.workers.dev/api/**",route=>
   route.fulfill({status:503,headers:{"Access-Control-Allow-Origin":"http://127.0.0.1:8787"},
    body:'{"error":"Browser QA offline"}'}));
  await page.goto("http://127.0.0.1:8787/",{waitUntil:"domcontentloaded",timeout:45000});
  await page.waitForFunction(()=>typeof window.v06StartImport==="function",null,{timeout:20000});
  const image=await page.evaluate(()=>{
   const c=document.createElement("canvas");c.width=1200;c.height=500;
   const ctx=c.getContext("2d");ctx.fillStyle="#1b2033";ctx.fillRect(0,0,1200,500);
   ctx.fillStyle="#fff";ctx.font="40px Arial";ctx.fillText("Teste de layout não reconhecido",35,120);
   return c.toDataURL("image/png").split(",")[1];
  });
  const sample={name:"unknown-layout.png",mimeType:"image/png",buffer:Buffer.from(image,"base64")};
  await page.evaluate(()=>window.v06StartImport("1512"));
  await page.locator("#v06-file").setInputFiles(sample);
  await page.locator("#v06-r0-set").waitFor({timeout:20000});
  assert.equal(await page.locator(".v06-relcard").count(),6);
  assert.equal(await page.locator(".v06-rel-placeholder").count(),6,"Unknown layout must not yield fake relic crops");
  assert.equal(await page.locator("#v06-r0-lv").inputValue(),"","Unknown level must stay blank");
  assert.equal(await page.locator("#v06-level").inputValue(),"","Do not assume level 80");
  await page.locator("#v06-id").selectOption("1512");
  await page.locator("#v06-confirm").check();
  await page.screenshot({path:"artifacts/scan-safe-review-"+device.width+".png"});
  await page.locator(".v06-save-import").click();
  await page.waitForFunction(()=>{
   const a=JSON.parse(localStorage.getItem("anderus_nexus_v03")||"{}");
   return Array.isArray(a.characters?.["1512"]?.importPending);
  },null,{timeout:15000});
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem("anderus_nexus_v03")));
  assert.equal(result.characters["1512"].pv,6284);
  assert.equal(result.characters["1512"].e,2);
  assert.equal(result.v06RelicDetails["1512"][2].main.value,64.8,
   "An unknown screenshot cannot overwrite confirmed relic stats");
  assert.equal(result.v06RelicDetails["1512"][0].subs[0].value,8.6);
  assert.equal(result.v06RelicDetails["1512"].length,6);
  // Partial first-time registration must not fabricate Lv80, E0, S1 or +15.
  await page.evaluate(()=>window.v06StartImport());
  await page.locator("#v06-file").setInputFiles(sample);
  await page.locator("#v06-r0-set").waitFor({timeout:20000});
  await page.locator("#v06-id").selectOption("1505");
  await page.locator("#v06-confirm").check();
  await page.locator(".v06-save-import").click();
  await page.waitForFunction(()=>{
   const a=JSON.parse(localStorage.getItem("anderus_nexus_v03")||"{}");
   return !!a.characters?.["1505"]&&Array.isArray(a.v06RelicDetails?.["1505"]);
  },null,{timeout:15000});
  const newcomer=await page.evaluate(()=>JSON.parse(localStorage.getItem("anderus_nexus_v03")));
  assert.equal(newcomer.characters["1505"].level,null,"Unknown level must remain pending");
  assert.equal(newcomer.characters["1505"].e,null,"Unknown Eidolon must not become E0");
  assert.equal(newcomer.characters["1505"].s,null,"Unknown superimposition must not become S1");
  assert.equal(newcomer.v06RelicDetails["1505"].length,6);
  assert.equal(newcomer.v06RelicDetails["1505"][0].level,null);
  assert.ok(newcomer.characters["1505"].importPending.length>=6);
  await page.locator(".v06-import-pending").waitFor({timeout:15000});
  assert.equal(errors.length,0,errors.join(" | "));
  console.log("PASS Scan safe unknown layout, all six relics, and existing account intact at "+device.width+"px");
  await context.close();
 }
}finally{await browser.close()}
