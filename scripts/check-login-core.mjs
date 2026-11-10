#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base="data:text/javascript;base64,"+Buffer.from(read("nexus-sync-core.js")).toString("base64");
const core=await import(base);
const loginSource=read("nexus-login-core.js").replace('"./nexus-sync-core.js"',JSON.stringify(base));
const login=await import("data:text/javascript;base64,"+Buffer.from(loginSource).toString("base64"));
const pair=core.makePair();
const pass="MinhaSenhaSegura#2479";
assert.throws(()=>login.checkPassword("12345"),/12 caracteres/);
const registered=await login.registerPayload(pair,pass);
assert.equal(registered.payload.username,"Anderus");
assert.match(registered.recovery,/^[a-zA-Z0-9_-]{43}$/);
assert.match(registered.payload.salt,/^[a-zA-Z0-9_-]{22}$/);
const serverStatus={configured:true,username:"Anderus",iterations:480000,salt:registered.payload.salt};
const proof=await login.loginProof(pass,serverStatus);
assert.equal(proof.proof,registered.payload.verifier);
const decoded=await login.unlockPassword(pass,serverStatus,registered.payload.passwordVault);
assert.deepEqual(decoded,pair);
await assert.rejects(()=>login.unlockPassword("SenhaErrada!123",serverStatus,registered.payload.passwordVault),
 /Não foi possível desbloquear/);
const recovered=await login.unlockRecovery(registered.recovery,registered.payload.recoveryVault);
assert.deepEqual(recovered,pair);
await assert.rejects(()=>login.unlockRecovery("B".repeat(43),registered.payload.recoveryVault),
 /Não foi possível desbloquear/);
assert.ok(!JSON.stringify(registered.payload).includes(pair.secret),"Secret must stay encrypted");
assert.ok(!JSON.stringify(registered.payload).includes(pass),"Password cannot leave browser");
assert.ok(!JSON.stringify(registered.payload).includes(registered.recovery),"Recovery code cannot leave browser");
const reset=await login.registerPayload(pair,"SenhaNovaSuperSegura!11");
assert.notEqual(reset.recovery,registered.recovery);
const newStatus={...serverStatus,salt:reset.payload.salt};
assert.deepEqual(await login.unlockPassword("SenhaNovaSuperSegura!11",newStatus,reset.payload.passwordVault),pair);
console.log("PASS secured Anderus password setup, ciphertext vault, recovery and new-password rotation");
