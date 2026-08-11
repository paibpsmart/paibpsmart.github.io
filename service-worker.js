const CACHE_NAME="paibp-smart-v107-icons-rebuild-r1";
const STATIC=[
  "./","./index.html","./fitur.html","./mapel-lain.html","./literasi-digital.html","./artikel-islam.html","./about-spensus.html","./contact.html","./akses-guru.html",
  "./logo-spensus.png","./gerbang.jpg","./assets/icons/icon-192.png",
  "./styles.css?v=37","./v28-ui.css?v=37","./v29-ui.css?v=37","./v30-ui.css?v=37","./v32-ui.css?v=37","./v33-multimapel.css?v=37","./v34-lite.css?v=37","./v37-final.css?v=37",
  "./visual-v84.css?v=84","./visual-v85.css?v=85","./icon-depth-v85.css?v=85","./icon-guard-v84.css?v=84",
  "./global-visual-v102.css?v=102","./portal-fastnav-v102.js?v=102","./class-access-v102.js?v=102","./ui-clean-v102.js?v=102","./icon-art-v85.js?v=107","./ui-final-v105.css?v=107","./ui-final-v105.js?v=107","./mapel-premium-v102.css?v=102","./mapel-card-icons-v102.js?v=102",
  "./visual-fix-v87.css?v=102","./visual-v89.css?v=102","./home-clean-v92.js?v=102","./home-ticker-v94.css?v=102","./home-ticker-v93.js?v=102","./home-news-v102.js?v=102","./home-share-v102.js?v=102",
  "./reading-portal-v102.css?v=102","./reading-mobile-fix-v102.css?v=102","./artikel-portal-v102.js?v=102","./literasi-portal-v102.js?v=102","./literasi-seeds-v102.js?v=102","./literasi-seed-guard-v102.js?v=102","./artikel-extra-v102.js?v=102","./artikel-enrichment-v102.js?v=102","./artikel-topics-v102.js?v=102","./docx-lazy-v102.js?v=102","./artikel-data.js?v=37",
  "./teacher-preview-fix-v87.js?v=102","./owner-editor-v98.js?v=102","./multimapel-admin-v89.css?v=102","./multimapel-admin-v89.js?v=102","./spensus-ai-v90.css?v=102","./spensus-ai-shell-v90.js?v=102","./news-editor-entry-v96.js?v=102","./news-editor-v99.css?v=102","./news-editor-chunked-v102.js?v=102"
];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>Promise.allSettled(STATIC.map(url=>cache.add(url)))))});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key!==CACHE_NAME&&!key.startsWith("paibp-quran-kemenag-")).map(key=>caches.delete(key)));
  await self.clients.claim();
  const clients=await self.clients.matchAll({type:"window"});
  for(const client of clients){try{const u=new URL(client.url);if(u.origin===self.location.origin&&u.searchParams.get("ui")!=="107"){u.searchParams.set("ui","107");await client.navigate(u.href)}}catch{}}
})())});
async function networkFirst(request){const cache=await caches.open(CACHE_NAME);try{const response=await fetch(request,{cache:"no-store"});if(response&&response.ok)cache.put(request,response.clone());return response}catch{return await cache.match(request)||await cache.match(request,{ignoreSearch:true})||Response.error()}}
async function cacheFirst(request){const cache=await caches.open(CACHE_NAME);const hit=await cache.match(request)||await cache.match(request,{ignoreSearch:true});if(hit)return hit;try{const response=await fetch(request,{cache:"no-store"});if(response&&response.ok)cache.put(request,response.clone());return response}catch{return Response.error()}}
async function staleWhileRevalidate(request){const cache=await caches.open(CACHE_NAME);const hit=await cache.match(request)||await cache.match(request,{ignoreSearch:true});const update=fetch(request,{cache:"no-store"}).then(response=>{if(response&&response.ok)cache.put(request,response.clone());return response}).catch(()=>null);return hit||await update||Response.error()}
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==="navigate"||request.destination==="document"){event.respondWith(networkFirst(request));return}
const critical=['/icon-depth-v85.css','/icon-guard-v84.css','/icon-art-v85.js','/ui-final-v105.js','/ui-final-v105.css','/service-worker.js'];if(critical.some(p=>url.pathname.endsWith(p))){event.respondWith(networkFirst(request));return}
const v=url.searchParams.get("v");if(v==="107"&&(request.destination==="script"||request.destination==="style")){event.respondWith(networkFirst(request));return}if(v==="102"&&(request.destination==="script"||request.destination==="style")){event.respondWith(staleWhileRevalidate(request));return}if(request.destination==="image"||request.destination==="font"){event.respondWith(cacheFirst(request));return}event.respondWith(networkFirst(request))});