#!/usr/bin/env node
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base="data:text/javascript;base64,"+Buffer.from(read("nexus-sync-core.js")).toString("base64");
const core=await import(base);
const loginSource=read("nexus-login-core.js").replace('"./nexus-sync-core.js"',JSON.stringify(base));
const client=await import("data:text/javascript;base64,"+Buffer.from(loginSource).toString("base64"));
const file=read("worker/login-room.js")
 .replace(/^import .*\n/m,"").replace("export class NexusLoginRoom","class NexusLoginRoom");
class DurableObject{constructor(ctx,env){this.ctx=ctx;this.env=env}}
const klass=vm.runInNewContext(file+"\nNexusLoginRoom;",{
 DurableObject,Response,Request,TextEncoder,crypto:webcrypto,Date,URL,Number,String,Array,Object,RegExp,JSON
});
const store=new Map(),st={
 get:async k=>store.get(k),put:async(k,v)=>store.set(k,v),delete:async k=>store.delete(k),
 transaction:async fn=>fn(st)
};
const instance=new klass({storage:st},{});
const url="https://backend.example/api/login/v1/";
async function request(action,payload,headers={}){
 const method=payload?"POST":"GET";
 const req=new Request(url+action,{method,headers:{"Content-Type":"application/json",
  "X-Nexus-Client-Ip":"127.0.0.1",...headers},body:payload?JSON.stringify(payload):undefined});
 const res=await instance.fetch(req);
 return {status:res.status,body:await res.json()};
}
const pair=core.makePair(),password="SegredoBemForte#212",created=await client.registerPayload(pair,password);
let result=await request("status");
assert.equal(result.body.configured,false);
assert.equal((await request("setup",created.payload)).status,403,"Registration requires an existing cloud room");
assert.equal((await request("setup",created.payload,{"X-Nexus-Verified-Room":pair.id})).status,201);
assert.equal((await request("setup",created.payload,{"X-Nexus-Verified-Room":pair.id})).status,409);
result=await request("status");
assert.equal(result.body.configured,true);
assert.equal(result.body.username,"Anderus");
assert.equal(result.body.salt,created.payload.salt);
assert.equal((await request("login",{proof:"A".repeat(43)})).status,401);
const correct=await client.loginProof(password,result.body);
const signed=await request("login",{proof:correct.proof});
assert.equal(signed.status,200);
assert.deepEqual(signed.body.vault,created.payload.passwordVault);
const recovery=await client.recoveryProof(created.recovery);
assert.equal((await request("recover",{proof:recovery.proof})).status,200);
const rotated=await client.registerPayload(pair,"OutraSenhaSegura#54689");
assert.equal((await request("reset",{...rotated.payload,mode:"pair"})).status,403);
assert.equal((await request("reset",{...rotated.payload,mode:"pair"},{"X-Nexus-Verified-Room":pair.id})).status,200);
assert.equal((await request("login",{proof:correct.proof})).status,401);
const renewed=await client.loginProof("OutraSenhaSegura#54689",{...result.body,salt:rotated.payload.salt});
assert.equal((await request("login",{proof:renewed.proof})).status,200);
assert.equal((await request("recover",{proof:recovery.proof})).status,401,"Old recovery key must be invalidated");
const recovery2=await client.recoveryProof(rotated.recovery);
const rotatedAgain=await client.registerPayload(pair,"ApenasDepoisDoCodigo#26");
assert.equal((await request("reset",{...rotatedAgain.payload,mode:"recovery",proof:recovery2.proof})).status,200);
assert.equal((await request("recover",{proof:recovery2.proof})).status,401);
assert.equal((await request("login",{proof:renewed.proof})).status,401);
assert.equal((await request("login",{proof:(await client.loginProof("ApenasDepoisDoCodigo#26",
 {...result.body,salt:rotatedAgain.payload.salt})).proof})).status,200);
const config=JSON.parse(read("worker/wrangler.jsonc"));
assert.ok(config.durable_objects.bindings.some(x=>x.name==="LOGIN_AUTH"));
assert.ok(read("worker/index.js").includes('env.LOGIN_AUTH.idFromName("nexus-owner-anderus-v1")'));
console.log("PASS owner verification, password login, recovery, rotation and encrypted vault on server");
