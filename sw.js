/* Nexus PWA: stamped with deployment commit SHA; offline-first only on network failure. */
const CACHE='anderus-shell-dev';
const CORE=[
 './','./v06.css','./v06.js','./nexus-v07.css','./nexus-v07.js',
 './nexus-v09.css','./nexus-v09.js','./nexus-account.css','./nexus-account-engine.js',
 './relic-inspector.js','./relic-auto.js','./illustrated-showcase-import.js',
 './nexus-scan-layout.js','./nexus-scan-input.js','./nexus-scan-input.css',
 './nexus-pompom-chat.js','./nexus-pompom-chat.css',
 './illustrated-relic-matcher.js','./data/live-game.json',
 './data/relic-icon-signatures.json','./data/eidolon-art.json',
 './nexus-diagnostics.js','./nexus-diagnostics.css',
 './nexus-kit-lab.js','./nexus-kit-lab.css',
 './nexus-team-lab.js','./nexus-team-lab.css',
 './nexus-search.js','./nexus-search.css',
 './nexus-backup.js','./nexus-backup.css',
 './nexus-farm-lab.js','./nexus-farm-lab.css','./data/ascension-materials.json',
 './nexus-theme-bridge.js','./nexus-theme-overlays.css',
 './nexus-warp-math.js','./nexus-warp-advisor.js','./nexus-warp-advisor.css',
 './nexus-trace-planner.js','./nexus-trace-planner.css','./data/character-traces.json',
 './nexus-relic-optimizer.js','./nexus-relic-optimizer.css',
 './nexus-notifications.js','./nexus-notifications.css',
 './nexus-material-budget.js','./nexus-material-budget.css',
 './manifest.webmanifest','./assets/pwa/icon-192.png'
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const results=await Promise.allSettled(CORE.map(resource=>cache.add(resource)));
  const missing=results.flatMap((result,index)=>result.status==='rejected'?[CORE[index]]:[]);
  if(missing.length)console.warn('Nexus: arquivos não pré-carregados para offline:',missing);
  // Keep the previous Service Worker in control if essential resources are
  // unavailable. Optional missing files must not poison the whole precache.
  const mandatory=['./','./v06.js','./nexus-v07.js','./data/live-game.json'];
  for(const entry of mandatory)if(!(await cache.match(entry))){
   throw new Error('O shell offline está incompleto: '+entry);
  }
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('anderus-shell-')&&k!==CACHE)
   .map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
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
 // Network-first keeps desktop and Android aligned after a deployment.
 // Previously cache-first returned obsolete JS/CSS indefinitely until the SW
 // itself updated; use the old asset only if offline or the fetch fails.
 event.respondWith(network().catch(()=>caches.match(req).then(c=>{
  if(c)return c;
  throw new Error('Recurso indisponível offline');
 })));

});
