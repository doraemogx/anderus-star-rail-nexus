#!/usr/bin/env node
// Read-only validation of the published Worker, with the same Origin as the Nexus website.
const url="https://nexia-ai-nexus.andrediascrm.workers.dev/api/sync/v1/status";
try{
 const response=await fetch(url,{
  headers:{Origin:"https://doraemogx.github.io"},
  signal:AbortSignal.timeout(18000),
  cache:"no-store"
 });
 const text=await response.text();
 let data={};
 try{data=JSON.parse(text)}catch(_){}
 const allowedOrigin=response.headers.get("access-control-allow-origin")||"";
 if(response.ok&&data.available===true&&data.encrypted===true&&
    allowedOrigin==="https://doraemogx.github.io"){
  console.log("SYNC_BACKEND_READY: published Cloudflare Worker accepts the Nexus origin, HTTP",response.status);
 }else{
  console.error("SYNC_BACKEND_NOT_READY:",JSON.stringify({
   status:response.status,allowedOrigin,available:data.available,encrypted:data.encrypted,
   body:text.slice(0,160)
  }));
  process.exitCode=1;
 }
}catch(error){
 console.error("SYNC_BACKEND_UNREACHABLE:",String(error.message||error));
 process.exitCode=1;
}
