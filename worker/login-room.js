/* Fase 2: one owner login "Anderus" and encrypted sync-link vault.
 * Password and recovery key remain in the user's browser.
 * The Worker stores only challenge verifier digests and encrypted vaults.
 */
import { DurableObject } from "cloudflare:workers";
const textEncoder=new TextEncoder();
const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const TOKEN=/^[a-zA-Z0-9_-]{43}$/;
const SALT=/^[a-zA-Z0-9_-]{22}$/;
const ROOM=/^[a-f0-9]{32}$/;
const ITERATIONS=480000;
const USERNAME="Anderus";
const utf8=async(value)=>{
 const bits=await crypto.subtle.digest("SHA-256",textEncoder.encode(value));
 return Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,"0")).join("");
};
function same(a,b){
 const x=String(a||""),y=String(b||"");
 if(x.length!==y.length)return false;
 let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^y.charCodeAt(i);
 return diff===0;
}
function vaultValid(v){
 return v&&v.v===1&&TOKEN.test(v.iv||"")===false &&
  /^[A-Za-z0-9_-]{16}$/.test(v.iv||"")&&
  typeof v.data==="string"&&/^[A-Za-z0-9_-]{36,2000}$/.test(v.data);
}
function dataValid(body){
 return body&&body.username===USERNAME&&
  SALT.test(body.salt||"")&&TOKEN.test(body.verifier||"")&&
  TOKEN.test(body.recoveryVerifier||"")&&
  vaultValid(body.passwordVault)&&vaultValid(body.recoveryVault);
}
export class NexusLoginRoom extends DurableObject {
 async fetch(request){
  const url=new URL(request.url),action=url.pathname.split("/").pop();
  if(action==="status"){
   if(request.method!=="GET")return reply({error:"Método inválido"},405);
   const record=await this.ctx.storage.get("login");
   return reply(record?{configured:true,username:USERNAME,salt:record.salt,iterations:ITERATIONS}:
    {configured:false,username:USERNAME,iterations:ITERATIONS});
  }
  if(request.method!=="POST")return reply({error:"Método inválido"},405);
  let body;
  try{const raw=await request.text();if(raw.length>11000)return reply({error:"Requisição muito grande"},413);body=JSON.parse(raw);}
  catch(_){return reply({error:"Dados inválidos"},400);}
  const previous=await this.ctx.storage.get("login");
  const verifiedRoom=request.headers.get("X-Nexus-Verified-Room")||"";
  if(action==="setup"){
   if(previous)return reply({error:"Login já configurado"},409);
   if(!dataValid(body)||!ROOM.test(body.roomId||"")||verifiedRoom!==body.roomId)
    return reply({error:"É necessário estar conectado à conta existente"},403);
   const record={username:USERNAME,roomId:body.roomId,salt:body.salt,
    verifier:await utf8("nexus-pass-v1:"+body.verifier),
    recoveryVerifier:await utf8("nexus-recovery-v1:"+body.recoveryVerifier),
    passwordVault:body.passwordVault,recoveryVault:body.recoveryVault,
    createdAt:new Date().toISOString()};
   const result=await this.ctx.storage.transaction(async txn=>{
    if(await txn.get("login"))return false;
    await txn.put("login",record);return true;
   });
   return result?reply({configured:true,username:USERNAME},201):reply({error:"Login já configurado"},409);
  }
  if(!previous)return reply({error:"Login ainda não cadastrado"},404);
  if(action==="login"||action==="recover"){
   const recovery=action==="recover";
   const proof=body?.proof||"";
   if(!TOKEN.test(proof))return reply({error:"Dados de acesso inválidos"},401);
   const ip=(request.headers.get("X-Nexus-Client-Ip")||"unknown").slice(0,90);
   const attemptKey="attempt:"+await utf8(ip+":"+action);
   const now=Date.now(),record=(await this.ctx.storage.get(attemptKey))||{failed:0,until:0};
   if(record.until>now)return reply({error:"Muitas tentativas. Tente novamente mais tarde."},429);
   const computed=await utf8((recovery?"nexus-recovery-v1:":"nexus-pass-v1:")+proof);
   const expected=recovery?previous.recoveryVerifier:previous.verifier;
   if(!same(computed,expected)){
    const failed=(record.failed||0)+1;
    await this.ctx.storage.put(attemptKey,{failed,until:failed>=8?now+15*60*1000:0});
    return reply({error:"Senha ou código de recuperação incorreto"},401);
   }
   await this.ctx.storage.delete(attemptKey);
   return reply({username:USERNAME,
    vault:recovery?previous.recoveryVault:previous.passwordVault});
  }
  if(action==="reset"){
   if(!dataValid(body))return reply({error:"Dados de proteção incompletos"},400);
   const usingPair=body.mode==="pair"&&ROOM.test(verifiedRoom)&&same(verifiedRoom,previous.roomId);
   const usingRecovery=body.mode==="recovery"&&TOKEN.test(body.proof||"")&&
     same(await utf8("nexus-recovery-v1:"+body.proof),previous.recoveryVerifier);
   if(!usingPair&&!usingRecovery)return reply({error:"Recuperação não autorizada"},403);
   const next={...previous,salt:body.salt,
    verifier:await utf8("nexus-pass-v1:"+body.verifier),
    recoveryVerifier:await utf8("nexus-recovery-v1:"+body.recoveryVerifier),
    passwordVault:body.passwordVault,recoveryVault:body.recoveryVault,
    changedAt:new Date().toISOString()};
   await this.ctx.storage.put("login",next);
   return reply({changed:true,username:USERNAME});
  }
  return reply({error:"Operação desconhecida"},404);
 }
}
