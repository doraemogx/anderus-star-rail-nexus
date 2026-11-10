#!/usr/bin/env node
/* Regression: the Anderus login modal must not block applying cloud characters.
 * Two isolated browser profiles, mocked encrypted Cloudflare API, zero real account data.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";

const root="http://127.0.0.1:8787/";
const api="https://nexia-ai-nexus.andrediascrm.workers.dev/api/";
const cloud=new Map();
let registered=null, confirmCount=0;
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const contexts=[],errors=[];
await mkdir("artifacts",{recursive:true});

const response=(route,status,body)=>route.fulfill({status,headers:{
 "Access-Control-Allow-Origin":route.request().headers().origin||root.slice(0,-1),
 "Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS",
 "Access-Control-Allow-Headers":"content-type,authorization,if-match",
 "Content-Type":"application/json","Cache-Control":"no-store"
},body:status===204?"":JSON.stringify(body||{})});

async function syncRoute(route){
 const req=route.request(),method=req.method(),url=new URL(req.url());
 if(method==="OPTIONS")return response(route,204);
 if(url.pathname.endsWith("/status"))return response(route,200,{available:true,encrypted:true,version:1});
 const id=url.pathname.split("/").pop(),token=req.headers().authorization||"";
 if(!/^[a-f0-9]{32}$/.test(id)||!token.startsWith("Bearer "))return response(route,401,{error:"Autenticação"});
 const previous=cloud.get(id);
 if(method==="GET"){
  if(!previous)return response(route,404,{error:"Conta ainda não criada"});
  if(previous.token!==token)return response(route,403,{error:"Sem acesso"});
  return response(route,200,{revision:previous.revision,payload:previous.payload});
 }
 if(method==="PUT"){
  if(previous&&previous.token!==token)return response(route,403,{error:"Sem acesso"});
  const expected=Number(req.headers()["if-match"]);
  if(expected!==(previous?.revision||0))return response(route,409,{revision:previous?.revision||0});
  const payload=JSON.parse(req.postData());
  assert.ok(!JSON.stringify(payload).includes("characters"),"Cloud payload must remain encrypted");
  cloud.set(id,{token,payload,revision:expected+1});
  return response(route,200,{revision:expected+1});
 }
 return response(route,405);
}
async function loginRoute(route){
 const req=route.request(),action=new URL(req.url()).pathname.split("/").pop();
 if(req.method()==="OPTIONS")return response(route,204);
 if(action==="status")return response(route,200,{configured:true,username:"Anderus",
  salt:registered?.salt,iterations:480000});
 const body=JSON.parse(req.postData()||"{}");
 if(action==="login"&&body.proof===registered?.verifier)
  return response(route,200,{username:"Anderus",vault:registered.passwordVault});
 return response(route,401,{error:"Senha incorreta"});
}
async function device(account,width){
 const context=await browser.newContext({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
 await context.route(api+"sync/v1/**",syncRoute);
 await context.route(api+"login/v1/**",loginRoute);
 await context.addInitScript(x=>{
  if(!localStorage.getItem("anderus_nexus_v03"))
   localStorage.setItem("anderus_nexus_v03",JSON.stringify(x));
 },account);
 contexts.push(context);
 const page=await context.newPage();
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto(root,{waitUntil:"domcontentloaded",timeout:45000});
 await page.waitForFunction(()=>!!window.NexusCloudSync?.open&&!!window.NexusLogin?.open,null,{timeout:20000});
 return page;
}
try{
 const source=await device({characters:{
  "1413":{level:80,e:0},"1512":{level:80,e:1},"1503":{level:80,e:2}}},390);
 await source.locator("#nexus-sync-trigger").click();
 await source.locator('[data-sync-create]').click();
 await source.waitForFunction(()=>window.NexusCloudSync?.status()?.connected&&
  document.getElementById("nexus-sync-status")?.textContent?.includes("Conta conectada"),
  null,{timeout:20000});
 registered=await source.evaluate(async()=>{
  const m=await import("./nexus-login-core.js");
  const pair=JSON.parse(localStorage.getItem("anderus_nexus_sync_pair_v1"));
  const {payload}=await m.registerPayload(pair,"SenhaDeTesteNexus#2026");
  return payload;
 });
 const destination=await device({characters:{
  "1505":{level:80,e:6},"1503":{level:80,e:1}}},1440);
 await destination.locator("#nexus-sync-trigger").click();
 await destination.locator("[data-nexus-login-open]").click();
 await destination.locator('[data-login-form="signin"]').waitFor({timeout:20000});
 const before=await destination.evaluate(()=>JSON.parse(localStorage.getItem("anderus_nexus_v03")));
 assert.equal(Object.keys(before.characters).length,2);
 destination.once("dialog",d=>{
  confirmCount++;d.dismiss();
 });
 await destination.locator("#nexus-login-password").fill("SenhaDeTesteNexus#2026");
 await destination.locator('[data-login-form="signin"] button[type=submit]').click();
 await destination.locator("#nexus-login-alert").getByText(/Conexão cancelada/).waitFor({timeout:20000});
 assert.equal(await destination.evaluate(()=>localStorage.getItem("anderus_nexus_sync_pair_v1")),null);
 assert.equal(await destination.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem("anderus_nexus_v03")).characters).length),2);
 destination.once("dialog",d=>{
  confirmCount++;d.accept();
 });
 await destination.locator("#nexus-login-password").fill("SenhaDeTesteNexus#2026");
 await destination.locator('[data-login-form="signin"] button[type=submit]').click();
 await destination.waitForFunction(()=>{
  const a=JSON.parse(localStorage.getItem("anderus_nexus_v03")||"{}");
  const c=a.characters||{};
  return Object.keys(c).length===4&&c["1505"]?.e===6&&c["1503"]?.e===2&&!!c["1413"]&&!!c["1512"];
 },null,{timeout:30000});
 await destination.waitForFunction(()=>!!window.NexusCloudSync?.status()?.connected,null,{timeout:20000});
 assert.equal(confirmCount,2);
 assert.equal(errors.length,0,"Browser exception: "+errors.join(" | "));
 await destination.screenshot({path:"artifacts/login-success-joined-desktop.png"});
 console.log("PASS login cancellation keeps two local characters; confirmation joins four characters and reloads correctly");
}finally{
 for(const context of contexts)await context.close();
 await browser.close();
}
