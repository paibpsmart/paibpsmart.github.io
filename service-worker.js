const CACHE_NAME="paibp-smart-v112-tokenless-media-r1";
const CORE=[
  "./",
  "./index.html",
  "./logo-spensus.png",
  "./styles.css?v=37",
  "./v37-final.css?v=37",
  "./visual-v85.css?v=85",
  "./icon-guard-v84.css?v=109",
  "./icon-art-v85.js?v=111"
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

async function networkFirst(request,ms=1800){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetchWithTimeout(request,ms);
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }catch{return await cache.match(request)||await cache.match(request,{ignoreSearch:true})||fetch(request)}
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
  if(!hit){const fresh=await fetch(request,{cache:"no-store"});if(fresh&&fresh.ok)cache.put(request,fresh.clone());return fresh}
  try{const fresh=await fetchWithTimeout(request,650);if(fresh&&fresh.ok){cache.put(request,fresh.clone());return fresh}}catch{}
  return hit;
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME);
  const hit=await cache.match(request)||await cache.match(request,{ignoreSearch:true});
  if(hit)return hit;
  try{const response=await fetch(request,{cache:"no-store"});if(response&&response.ok)cache.put(request,response.clone());return response}catch{return Response.error()}
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  /* File video/audio tidak pernah masuk cache aplikasi; Range diteruskan langsung. */
  if(url.pathname.includes("/news-media/")||url.pathname.includes("/media-library/files/")||request.destination==="video"||request.destination==="audio"||request.headers.has("range"))return;

  if(request.mode==="navigate"||request.destination==="document"){
    if(url.pathname.endsWith("/editor-berita.html")||url.pathname.endsWith("/kendali-editor.html")){event.respondWith(networkFirst(request,1800));return}
    event.respondWith(navigationFast(request));return;
  }

  /* Editor media V112 selalu ambil versi jaringan agar kode V111/token lama tidak hidup lagi. */
  if(url.pathname.endsWith("/news-attachments-v112.js")||url.pathname.endsWith("/news-attachments-v112.css")||url.pathname.endsWith("/editor-berita.html")||url.pathname.endsWith("/icon-art-v85.js")||url.pathname.endsWith("/home-news-media-v111.js")){
    event.respondWith(networkFirst(request,1600));return;
  }

  /* V111 sengaja tidak diprioritaskan; editor baru tidak lagi memanggilnya. */
  if(request.destination==="style"||request.destination==="script"){event.respondWith(staleWhileRevalidate(request));return}
  if(request.destination==="image"||request.destination==="font"){event.respondWith(cacheFirst(request));return}
  event.respondWith(staleWhileRevalidate(request));
});
