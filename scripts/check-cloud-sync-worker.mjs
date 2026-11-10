#!/usr/bin/env node
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=read("worker/sync-room.js")
 .replace(/^import .*\n/m,"").replace("export class NexusSyncRoom","class NexusSyncRoom");
const fake=class DurableObject{constructor(ctx,env){this.ctx=ctx;this.env=env}};
const klass=vm.runInNewContext(source+"\nNexusSyncRoom;",{
 DurableObject:fake,Response,Request,TextEncoder,crypto:webcrypto,
 Number,String,Array,Object,Uint8Array,Date
});
const cache=new Map();
const ctx={storage:{get:async key=>cache.get(key),put:async(k,v)=>cache.set(k,v),
 transaction:async fn=>fn({get:async k=>cache.get(k),put:async(k,v)=>cache.set(k,v)})}};
const obj=new klass(ctx,{});
const auth="A".repeat(43),wrong="B".repeat(43);
const headers={Authorization:"Bearer "+auth};
const url="https://backend.example/api/sync/v1/"+"1".repeat(32);
async function req(method,h={},body){
 return obj.fetch(new Request(url,{method,headers:{...headers,...h},body:body?JSON.stringify(body):undefined}));
}
const sample={v:1,zip:"none",iv:"a".repeat(16),data:"b".repeat(32)};
assert.equal((await req("GET")).status,404);
assert.equal((await req("GET",{Authorization:"Bearer short"})).status,401);
assert.equal((await req("PUT",{"If-Match":"0"},sample)).status,201);
const loaded=await req("GET");assert.equal(loaded.status,200);
assert.deepEqual((await loaded.json()).payload,sample);
assert.equal((await req("GET",{Authorization:"Bearer "+wrong})).status,403);
assert.equal((await req("PUT",{"If-Match":"0"},sample)).status,409,"Stale writers must not overwrite");
assert.equal((await req("PUT",{"If-Match":"1"},sample)).status,200);
assert.equal((await req("PUT",{},sample)).status,428,"Missing If-Match must be rejected");
assert.equal((await req("PUT",{"If-Match":"2"},{...sample,iv:"short"})).status,400);
const config=JSON.parse(read("worker/wrangler.jsonc"));
assert.equal(config.durable_objects.bindings[0].name,"ACCOUNT_SYNC");
assert.equal(config.exports.NexusSyncRoom.storage,"sqlite");
assert.ok(read("worker/index.js").includes('env.ACCOUNT_SYNC.idFromName(room[1])'));
console.log("PASS authenticated cloud updates, concurrency checks, encryption envelope and Durable Objects binding");
