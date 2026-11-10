#!/usr/bin/env node
const endpoint="https://nexia-ai-nexus.andrediascrm.workers.dev/api/login/v1/status";
const origin="https://doraemogx.github.io";
try{
 const r=await fetch(endpoint,{headers:{Origin:origin},cache:"no-store",signal:AbortSignal.timeout(16000)});
 const data=await r.json().catch(()=>({}));
 const allowed=r.headers.get("Access-Control-Allow-Origin");
 if(!r.ok||data.username!=="Anderus"||typeof data.configured!=="boolean"||
    data.iterations!==480000||allowed!==origin){
  throw Error("Backend não está pronto: HTTP "+r.status+
   ", origem "+allowed+", usuário "+String(data.username));
 }
 console.log("LOGIN_BACKEND_READY: login Anderus publicado, proteção ativa, cadastro="+data.configured);
}catch(error){
 console.error("LOGIN_BACKEND_UNAVAILABLE:",String(error.message||error));
 process.exitCode=1;
}
