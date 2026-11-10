#!/usr/bin/env node
/* Regression: encrypted cloud never sees plaintext character data. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const core=await import("data:text/javascript;base64,"+Buffer.from(read("nexus-sync-core.js")).toString("base64"));
const phone={characters:{"1503":{level:80,e:2,cone:"Cone da Pearl"},"1413":{level:80,e:0}},
 v06RelicDetails:{"1503":[{setId:"127",main:{stat:"PV",value:705}}]},
 v06Screens:{"1503":"data:image/png;base64,abcdef"},
 theme:"original"};
const desktop={characters:{"1503":{level:80,e:1,cone:"Cone antigo"},"1505":{level:80,e:6}}};
const selected=core.syncable(phone);
assert.ok(selected.characters["1503"]);
assert.ok(selected.v06RelicDetails["1503"]);
assert.ok(!selected.v06Screens,"Raw screenshots must never be included in cloud payload");
assert.ok(!selected.theme,"Per-device UI theme remains private");
const pair=core.makePair();
assert.match(pair.id,/^[a-f0-9]{32}$/);
assert.equal(core.validatePair(pair.id+"."+pair.secret).id,pair.id);
const encrypted=await core.encryptAccount(selected,pair);
assert.equal(encrypted.v,1);
assert.ok(!JSON.stringify(encrypted).includes("Pearl"));
const decrypted=await core.decryptAccount(encrypted,pair);
assert.deepEqual(decrypted,selected);
await assert.rejects(()=>core.decryptAccount(encrypted,core.makePair()),/chave não corresponde|danificados/);
const firstJoin=core.mergeAccount({},desktop,phone,"cloud");
assert.equal(Object.keys(firstJoin.merged.characters).length,3,"Both devices' roster must be preserved");
assert.equal(firstJoin.merged.characters["1503"].e,2,"Initial trusted source wins duplicate character conflicts");
assert.equal(firstJoin.merged.characters["1505"].e,6,"Unique desktop character must not be removed");
const common={characters:{"1503":{e:2,level:80}}};
const updatedPhone={characters:{"1503":{e:2,level:81}}};
const updatedDesktop={characters:{"1503":{e:3,level:80}}};
const merged=core.mergeAccount(common,updatedPhone,updatedDesktop);
assert.equal(merged.conflicts.length,0);
assert.equal(merged.merged.characters["1503"].e,3);
assert.equal(merged.merged.characters["1503"].level,81);
const conflicts=core.mergeAccount(common,{characters:{"1503":{e:4,level:80}}},{characters:{"1503":{e:3,level:80}}});
assert.equal(conflicts.conflicts.length,1,"Divergent changes to the same field require user resolution");
assert.equal(conflicts.merged.characters["1503"].e,3);
assert.ok(core.pairingLink(pair,"https://doraemogx.github.io/anderus-star-rail-nexus/").includes("#nexus-sync="));
console.log("PASS E2E encryption, no plaintext, two-device roster union, conflict protection and deep field merge");
