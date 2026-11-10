/* An encrypted cloud envelope per room. All account data is encrypted in the browser.
   Cloudflare stores only an AES-GCM ciphertext and an authentication verifier. */
import { DurableObject } from "cloudflare:workers";
const json=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const AUTH=/^[A-Za-z0-9_-]{43}$/;
const safeEqual=(a,b)=>{
 const x=String(a||""),y=String(b||"");
 if(x.length!==y.length)return false;
 let result=0;for(let i=0;i<x.length;i++)result|=x.charCodeAt(i)^y.charCodeAt(i);
 return result===0;
};
async function digest(s){
 const b=new TextEncoder().encode(s);
 const h=await crypto.subtle.digest("SHA-256",b);
 return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
export class NexusSyncRoom extends DurableObject {
 async fetch(request){
  if(!["GET","PUT"].includes(request.method))return json({error:"Método não permitido"},405);
  const token=(request.headers.get("Authorization")||"").replace(/^Bearer /,"");
  if(!AUTH.test(token))return json({error:"Chave de conexão inválida"},401);
  const verifier=await digest("anderus-sync-server-auth-v1:"+token);
  if(request.method==="GET"){
   const saved=await this.ctx.storage.get("record");
   if(!saved)return json({error:"Conta ainda não criada"},404);
   if(!safeEqual(saved.verifier,verifier))return json({error:"Conexão não autorizada"},403);
   return json({revision:saved.revision,updatedAt:saved.updatedAt,payload:saved.payload});
  }
  const expected=Number(request.headers.get("If-Match"));
  if(!Number.isSafeInteger(expected)||expected<0||expected>1_000_000_000
      ||!/^\d+$/.test(request.headers.get("If-Match")||""))return json({error:"Revisão de segurança ausente"},428);
  const raw=await request.text();
  if(raw.length>5_000_000)return json({error:"Dados muito grandes para sincronizar"},413);
  let body;
  try{body=JSON.parse(raw)}catch(_){return json({error:"Payload inválido"},400)}
  if(body?.v!==1||!["gzip","none"].includes(body.zip)
      ||typeof body.iv!=="string"||!/^[-_A-Za-z0-9]{16}$/.test(body.iv)
      ||typeof body.data!=="string"||!/^[-_A-Za-z0-9]{20,}$/.test(body.data))
   return json({error:"Envelope criptografado inválido"},400);
  const outcome=await this.ctx.storage.transaction(async txn=>{
   const previous=await txn.get("record");
   if(previous&&!safeEqual(previous.verifier,verifier))return {status:403,error:"Conexão não autorizada"};
   const revision=previous?.revision||0;
   if(expected!==revision)return {status:409,error:"Outra atualização chegou antes",revision};
   const next={verifier,revision:revision+1,payload:body,updatedAt:new Date().toISOString()};
   await txn.put("record",next);
   return {status:previous?200:201,revision:next.revision,updatedAt:next.updatedAt};
  });
  return json(outcome,outcome.status||200);
 }
}
