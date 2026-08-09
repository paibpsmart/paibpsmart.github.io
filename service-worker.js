const CACHE_NAME="paibp-smart-v99-fast-static";
const STATIC=[
  "./logo-spensus.png",
  "./assets/icons/icon-192.png",
  "./visual-v86.css?v=86",
  "./icon-v86.css?v=86",
  "./icon-art-v86.js?v=99",
  "./visual-fix-v87.css?v=99",
  "./visual-v89.css?v=99",
  "./home-clean-v92.js?v=99",
  "./home-ticker-v94.css?v=99",
  "./home-ticker-v93.js?v=99",
  "./teacher-preview-fix-v87.js?v=99",
  "./owner-editor-v98.js?v=99",
  "./multimapel-admin-v89.css?v=99",
  "./multimapel-admin-v89.js?v=99",
  "./spensus-ai-v90.css?v=99",
  "./spensus-ai-shell-v90.js?v=99",
  "./news-editor-entry-v96.js?v=99",
  "./news-editor-v99.css?v=99",
  "./news-editor-v99.js?v=99"
];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>Promise.allSettled(STATIC.map(url=>cache.add(url)))));});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE_NAME&&!key.startsWith("paibp-quran-kemenag-")).map(key=>caches.delete(key)));await self.clients.claim();})());});
async function networkFirst(request){const cache=await caches.open(CACHE_NAME);try{const response=await fetch(request,{cache:"no-store"});if(response&&response.ok)cache.put(request,response.clone());return response;}catch{return await cache.match(request)||await cache.match(request,{ignoreSearch:true})||Response.error();}}
async function cacheFirst(request){const cache=await caches.open(CACHE_NAME);const hit=await cache.match(request);if(hit)return hit;try{const response=await fetch(request,{cache:"no-store"});if(response&&response.ok)cache.put(request,response.clone());return response;}catch{return Response.error();}}
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==="navigate"||request.destination==="document"){event.respondWith(networkFirst(request));return;}if(["86","87","88","89","90","92","93","94","95","96","97","98","99"].includes(url.searchParams.get("v"))&&(request.destination==="script"||request.destination==="style")){event.respondWith(cacheFirst(request));return;}if(request.destination==="image"||request.destination==="font"){event.respondWith(cacheFirst(request));return;}event.respondWith(networkFirst(request));});