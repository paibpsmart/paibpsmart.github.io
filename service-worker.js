const CACHE_NAME="paibp-smart-v110-fast-shell-r2";
const CORE=[
  "./",
  "./index.html",
  "./logo-spensus.png",
  "./styles.css?v=37",
  "./v37-final.css?v=37",
  "./visual-v85.css?v=85",
  "./icon-guard-v84.css?v=109",
  "./icon-art-v85.js?v=109"
];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>Promise.allSettled(CORE.map(url=>cache.add(url)))));
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME&&!key.startsWith("paibp-quran-kemenag-")).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function fetchWithTimeout(request,ms){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),ms);
  try{return await fetch(request,{cache:"no-store",signal:ctl.signal})}finally{clearTimeout(timer)}
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_NAME);
  const hit=await cache.match(request)||await cache.match(request,{ignoreSearch:true});
  const update=fetch(request,{cache:"no-store"}).then(response=>{
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return hit||await update||Response.error();
}

async function navigationFast(request){
  const cache=await caches.open(CACHE_NAME);
  const hit=await cache.match(request)||await cache.match(request,{ignoreSearch:true});
  if(!hit){
    const fresh=await fetch(request,{cache:"no-store"});
    if(fresh&&fresh.ok)cache.put(request,fresh.clone());
    return fresh;
  }
  try{
    const fresh=await fetchWithTimeout(request,650);
    if(fresh&&fresh.ok){cache.put(request,fresh.clone());return fresh}
  }catch{}
  return hit;
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME);
  const hit=await cache.match(request)||await cache.match(request,{ignoreSearch:true});
  if(hit)return hit;
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }catch{return Response.error()}
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);

  /* Media besar dan range request langsung ke CDN; tidak memenuhi cache shell. */
  if(url.origin!==self.location.origin)return;
  if(url.pathname.includes("/media-library/files/")||request.destination==="video"||request.destination==="audio")return;
  if(request.headers.has("range"))return;

  if(request.mode==="navigate"||request.destination==="document"){
    event.respondWith(navigationFast(request));
    return;
  }
  if(request.destination==="style"||request.destination==="script"){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if(request.destination==="image"||request.destination==="font"){
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
