#!/usr/bin/env node
const url="https://nexia-ai-nexus.andrediascrm.workers.dev/api/sync/v1/status";
try{
 const response=await fetch(url,{headers:{Origin:"https://doraemogx.github.io"},signal:AbortSignal.timeout(12000)});
 const data=await response.json().catch(()=>({}));
 if(response.ok&&data.available===true&&data.encrypted===true){
  console.log("SYNC_BACKEND_READY: Cloudflare Durable Object accessible at existing Worker");
 }else{
  console.error("SYNC_BACKEND_NOT_DEPLOYED:",response.status,JSON.stringify(data).slice(0,250));
  process.exitCode=1;
 }
}catch(error){console.error("SYNC_BACKEND_UNREACHABLE:",String(error.message||error));process.exitCode=1;}
