/* Nexus PWA — release SHA stamp; network-first for scripts and styles, offline fallback. */
const CACHE='anderus-shell-dev';
const CORE=[
 './','./v06.css','./v06.js','./nexus-v07.css','./nexus-v07.js',
 './nexus-v09.css','./nexus-v09.js','./nexus-account.css','./nexus-account-engine.js',
 './relic-inspector.js','./relic-auto.js','./illustrated-showcase-import.js',
 './illustrated-relic-matcher.js','./data/live-game.json',
 './data/relic-icon-signatures.json','./data/eidolon-art.json',
 './nexus-backup.js','./nexus-backup.css','./nexus-diagnostics.js','./nexus-diagnostics.css',
 './nexus-cloud-sync.js','./nexus-cloud-sync.css','./nexus-sync-core.js',
 './nexus-login.js','./nexus-login.css','./nexus-login-core.js',
 './nexus-scan-v3-core.js','./nexus-scan-v3-reader.js','./nexus-scan-v3-ui.js','./nexus-scan-v3.css',
 './nexus-design-system.css','./nexus-design-system.js',
 './nexus-visual-finish.css','./nexus-visual-finish.js',
 './nexus-visual-experience.css','./nexus-visual-experience.js',
 './nexus-theme-studio-v3.css','./nexus-theme-studio-v3.js',
 './themes/generated/index.json',
 './themes/aha.css','./themes/aha.js','./themes/aha-detail.css','./themes/aha-detail.js',
 './assets/official/aha-4-7.webp','./assets/official/aha-4-7-promo.jpg',
 './assets/official/aha-e1.webp','./assets/official/aha-e2.webp','./assets/official/aha-e3.webp',
 './assets/official/aha-e4.webp','./assets/official/aha-e5.webp','./assets/official/aha-e6.webp',
 './manifest.webmanifest','./assets/pwa/icon-192.png'
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const results=await Promise.allSettled(CORE.map(path=>cache.add(path)));
  const unavailable=results.flatMap((result,index)=>result.status==='rejected'?[CORE[index]]:[]);
  if(unavailable.length)console.warn('Nexus offline: arquivos não armazenados:',unavailable);
  for(const path of ['./','./v06.js','./nexus-v07.js','./data/live-game.json']){
   if(!(await cache.match(path)))throw Error('Shell offline obrigatório ausente: '+path);
  }
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const all=await caches.keys();
  await Promise.all(all.filter(key=>key.startsWith('anderus-shell-')&&key!==CACHE).map(key=>caches.delete(key)));
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
 // Keep JS and CSS synchronized across devices: online always checks the
 // deployed asset first, only use an old asset if the network is unavailable.
 event.respondWith(network().catch(()=>caches.match(req).then(cached=>{
  if(cached)return cached;
  throw Error('Recurso indisponível offline: '+url.pathname);
 })));
});
