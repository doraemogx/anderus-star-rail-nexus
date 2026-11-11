/* Standalone PWA scope: /anderus-star-rail-nexus/v2/ only.
 * Does not intercept or mutate the legacy application. */
const VERSION='nexus2-20261111-b';
const BASE=new URL('./',self.location);
const PRECACHE=['./','./index.html','./app.css','./core.js','./screens.js','./modules.js','./manifest.webmanifest',
 '../data/live-game.json','../assets/official/pompom-hoyoverse.jpg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(async cache=>{
  for(const path of PRECACHE){try{const r=await fetch(new URL(path,BASE));if(r.ok)await cache.put(new URL(path,BASE),r);}catch{}}
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('nexus2-')&&x!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const page=url.pathname.endsWith('/v2/')||url.pathname.endsWith('/v2/index.html');
 if(page){event.respondWith(fetch(request).then(response=>{const c=response.clone();caches.open(VERSION).then(cache=>cache.put(request,c)).catch(()=>{});return response}).catch(()=>caches.match(new URL('./index.html',BASE))));return;}
 if(/\.(?:js|css|webmanifest|json|png|jpg|webp)$/.test(url.pathname)){
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(VERSION).then(c=>c.put(request,copy)).catch(()=>{});}
    return response;
   }).catch(()=>caches.match(request)));
 }
});