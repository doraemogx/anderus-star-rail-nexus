#!/usr/bin/env node
/* Two independent Chromium contexts, real encrypted client, mock HTTP remote account.
   The test proves that union and later updates work without sharing localStorage. */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const root="http://127.0.0.1:8787/";
const remote=new Map();
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
await mkdir("artifacts",{recursive:true});
const contexts=[],errors=[];
function respond(route,status,body){
 const origin=route.request().headers()["origin"]||root.slice(0,-1);
 return route.fulfill({status,headers:{"Access-Control-Allow-Origin":origin,
  "Access-Control-Allow-Methods":"GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers":"authorization,content-type,if-match",
  "Cache-Control":"no-store","Content-Type":"application/json"},
  body:body?JSON.stringify(body):""});
}
async function worker(route){
 const req=route.request(),u=new URL(req.url()),method=req.method();
 if(method==="OPTIONS")return respond(route,204);
 if(u.pathname.endsWith("/status"))return respond(route,200,{available:true,encrypted:true,version:1});
 const id=u.pathname.split("/").pop(),token=req.headers()["authorization"]||"";
 if(!/^[a-f0-9]{32}$/.test(id)||!token.startsWith("Bearer "))return respond(route,401,{error:"Autenticação"});
 const existing=remote.get(id);
 if(method==="GET"){
  if(!existing)return respond(route,404,{error:"Vazio"});
  if(existing.token!==token)return respond(route,403,{error:"Sem acesso"});
  return respond(route,200,{revision:existing.revision,payload:existing.payload,updatedAt:existing.updatedAt});
 }
 if(method==="PUT"){
  const expected=Number(req.headers()["if-match"]);
  if(existing&&existing.token!==token)return respond(route,403,{error:"Sem acesso"});
  if(expected!==(existing?.revision||0))return respond(route,409,{revision:existing.revision});
  const payload=JSON.parse(req.postData());
  assert.ok(!JSON.stringify(payload).includes('"characters"'),"Account data must be encrypted in transit");
  const stored={token,revision:expected+1,payload,updatedAt:new Date().toISOString()};
  remote.set(id,stored);
  return respond(route,existing?200:201,{revision:stored.revision});
 }
 return respond(route,405,{error:"Método"});
}
async function device(account,width){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,
   hasTouch:width<500,deviceScaleFactor:1});
 await context.route("https://nexia-ai-nexus.andrediascrm.workers.dev/api/sync/v1/**",worker);
 await context.addInitScript(x=>{
  if(!localStorage.getItem("anderus_nexus_v03"))localStorage.setItem("anderus_nexus_v03",JSON.stringify(x));
 },account);
 contexts.push(context);
 const page=await context.newPage();
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(root,{waitUntil:"domcontentloaded",timeout:45000});
 await page.waitForFunction(()=>!!window.NexusCloudSync?.open,null,{timeout:20000});
 return page;
}
const phone=await device({characters:{"1503":{level:80,e:2},
 "1413":{level:80,e:0}},v06RelicDetails:{"1503":[{setId:"127",level:15}]}},390);
await phone.locator("#nexus-sync-trigger").click();
await phone.locator("#nexus-sync-dialog[open]").waitFor();
await phone.locator("[data-sync-create]").click();
await phone.waitForFunction(()=>document.getElementById("nexus-sync-status")?.textContent?.includes("Conta conectada"),null,{timeout:18000});
const link=await phone.evaluate(()=>{
 const pair=JSON.parse(localStorage.getItem("anderus_nexus_sync_pair_v1"));
 return location.href.split("#")[0]+"#nexus-sync="+encodeURIComponent(pair.id+"."+pair.secret);
});
await phone.screenshot({path:"artifacts/sync-phone-source.png"});
const desktop=await device({characters:{"1503":{level:80,e:1},
 "1505":{level:80,e:6}}},1440);
await desktop.goto(link,{waitUntil:"domcontentloaded",timeout:45000});
await desktop.locator("#nexus-sync-dialog[open]").waitFor({timeout:15000});
await desktop.locator("[data-sync-join]").click();
await desktop.waitForFunction(()=>{
 const chars=JSON.parse(localStorage.getItem("anderus_nexus_v03")||"{}").characters||{};
 return Object.keys(chars).length===3&&chars["1503"].e===2&&chars["1505"].e===6;
},null,{timeout:25000});
await desktop.screenshot({path:"artifacts/sync-desktop-joined.png"});
await phone.evaluate(()=>window.NexusCloudSync.sync()).catch(()=>{});
await phone.waitForFunction(()=>Object.keys(JSON.parse(localStorage.getItem("anderus_nexus_v03")).characters||{}).length===3,
 null,{timeout:25000});
await phone.evaluate(()=>{
 const a=JSON.parse(localStorage.getItem("anderus_nexus_v03"));
 a.characters["1001"]={level:80,e:0};
 localStorage.setItem("anderus_nexus_v03",JSON.stringify(a));
});
await phone.evaluate(()=>window.NexusCloudSync.sync()).catch(e=>console.log("PHONE_SYNC_RELOAD",e.message));
console.log("SYNC_PHONE_STATE",await phone.evaluate(()=>({status:window.NexusCloudSync?.status(),
 characters:Object.keys(JSON.parse(localStorage.getItem("anderus_nexus_v03")).characters)})));
console.log("SYNC_REMOTE_REVISIONS",Array.from(remote.values()).map(x=>x.revision));
await desktop.evaluate(()=>window.NexusCloudSync.sync()).catch(e=>console.log("DESKTOP_SYNC_RELOAD",e.message));
await desktop.waitForLoadState("domcontentloaded");
await desktop.waitForFunction(()=>!!JSON.parse(localStorage.getItem("anderus_nexus_v03")).characters["1001"],
 null,{timeout:25000});
await desktop.waitForFunction(()=>!!window.NexusCloudSync?.status,{timeout:15000});
console.log("SYNC_DESKTOP_STATE",await desktop.evaluate(()=>({status:window.NexusCloudSync?.status(),
 characters:Object.keys(JSON.parse(localStorage.getItem("anderus_nexus_v03")).characters)})));
assert.equal(errors.length,0,errors.join(" | "));
console.log("PASS real browser pairing, union of 2+2 rosters, shared source, remote updates and no plaintext cloud");
for(const ctx of contexts)await ctx.close();
await browser.close();
