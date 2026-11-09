/* Nexus PWA v15: predictable updates, offline account/catalogue support. */
const CACHE='anderus-shell-v16';
const CORE=[
 './','./v06.css','./v06.js','./nexus-v07.css','./nexus-v07.js',
 './nexus-v09.css','./nexus-v09.js','./nexus-account.css','./nexus-account-engine.js',
 './relic-inspector.js','./relic-auto.js','./illustrated-showcase-import.js',
 './illustrated-relic-matcher.js','./data/live-game.json',
 './data/relic-icon-signatures.json','./data/eidolon-art.json',
 './manifest.webmanifest','./assets/pwa/icon-192.png'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(e=>{
  console.warn('Nexus: partes do catálogo offline indisponíveis',e);
 }));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>k.startsWith('anderus-shell-')&&k!==CACHE).map(k=>caches.delete(k))
 )));
 self.clients.claim();
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
 const url=new URL(req.url),data=url.pathname.includes('/data/');
 const network=()=>fetch(req).then(response=>{
  if(response.ok){
   const copy=response.clone();
   caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
  }
  return response;
 });
 if(data){
  // Never return an HTML shell for a JSON request: a missing offline catalogue
  // must raise an error rather than silently break all the card parsers.
  event.respondWith(network().catch(()=>caches.match(req).then(c=>{
    if(c)return c;
    throw new Error('O catálogo ainda não foi salvo para uso offline');
  })));
  return;
 }
 if(req.mode==='navigate'){
  event.respondWith(network().catch(()=>caches.match(req).then(c=>c||caches.match('./'))));
  return;
 }
 // Script and style assets use the freshly versioned shell cache, then revalidate.
 event.respondWith(caches.match(req).then(cached=>cached||network()).catch(()=>network()));
});
