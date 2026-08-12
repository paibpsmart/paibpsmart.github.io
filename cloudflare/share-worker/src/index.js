const SITE = "https://paibpsmart.github.io/";
const SCHOOL = "SMP Negeri 1 Susukan";
const ALLOWED_ORIGIN = "https://paibpsmart.github.io";
const VERSION = "140-d1-direct";

function esc(v="") { return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function clean(v,max=400){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max)}
function cors(origin=""){return {"Access-Control-Allow-Origin":origin===ALLOWED_ORIGIN?origin:ALLOWED_ORIGIN,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Accept","Access-Control-Max-Age":"86400","Vary":"Origin"}}
function decode(v){try{return JSON.parse(String(v))}catch{return String(v??"")}}
function unwrap(v){let x=v;for(let i=0;i<8;i++){if(x&&typeof x==="object"&&Object.prototype.hasOwnProperty.call(x,"value")){x=x.value;continue}if(typeof x==="string"){const s=x.trim();if((s.startsWith("{")&&s.endsWith("}"))||(s.startsWith("[")&&s.endsWith("]"))){try{x=JSON.parse(s);continue}catch{}}}break}return x}
function metaReq(origin,id){return new Request(`${origin}/__share_meta/${encodeURIComponent(id)}`)}
function imgReq(origin,id){return new Request(`${origin}/__share_img/${encodeURIComponent(id)}`)}
function targetUrl(id){return `${SITE}index.html?news=${encodeURIComponent(id)}&from=share#kabar-spensus`}

function isHumanBrowserNavigation(request){
 const h=request.headers,ua=String(h.get("User-Agent")||"").toLowerCase();
 const mode=String(h.get("Sec-Fetch-Mode")||"").toLowerCase();
 const dest=String(h.get("Sec-Fetch-Dest")||"").toLowerCase();
 const user=String(h.get("Sec-Fetch-User")||"").toLowerCase();
 if(mode==="navigate"||dest==="document"||user==="?1")return true;
 const browserEngine=/mozilla\/5\.0/.test(ua)&&/(applewebkit|chrome|crios|firefox|fxios|edg|edga|edgios|opr|samsungbrowser|\bwv\b|version\/\d+.*safari)/.test(ua);
 const knownCrawler=/(facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|discordbot|slackbot|skypeuripreview|pinterestbot|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|crawler|spider|bot\b|whatsapp)/.test(ua);
 return browserEngine&&!knownCrawler;
}
function isPreviewCrawler(request){
 const ua=String(request.headers.get("User-Agent")||"").toLowerCase();
 if(!ua)return false;
 return /(facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|linkedinbot|discordbot|slackbot|skypeuripreview|pinterest|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|crawler|spider|bot\b|preview)/i.test(ua);
}
function parseDataUri(uri){const m=/^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(uri||""));if(!m)return null;const mime=m[1]||"application/octet-stream",raw=m[3]||"";if(m[2]){const bin=atob(raw),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return{mime,body:bytes}}return{mime,body:new TextEncoder().encode(decodeURIComponent(raw))}}

async function register(request){
 const origin=request.headers.get("Origin")||"";
 if(origin!==ALLOWED_ORIGIN)return new Response(JSON.stringify({ok:false,error:"Origin ditolak"}),{status:403,headers:{"Content-Type":"application/json",...cors(origin)}});
 let body={};try{body=await request.json()}catch{return new Response(JSON.stringify({ok:false,error:"JSON tidak valid"}),{status:400,headers:{"Content-Type":"application/json",...cors(origin)}})}
 const id=clean(body.id,160),title=clean(body.title,220),description=clean(body.description,320),image=String(body.image||"");
 if(!id||!title)return new Response(JSON.stringify({ok:false,error:"id/title wajib"}),{status:400,headers:{"Content-Type":"application/json",...cors(origin)}});
 const host=new URL(request.url).origin,cache=caches.default;let imageUrl="";
 if(image.startsWith("data:image/")&&image.length<1500000){const d=parseDataUri(image);if(d){await cache.put(imgReq(host,id),new Response(d.body,{headers:{"Content-Type":d.mime,"Cache-Control":"public,max-age=3600"}}));imageUrl=`${host}/image?id=${encodeURIComponent(id)}`}}
 else if(/^https:\/\//i.test(image)){imageUrl=image}
 const meta={id,title,description:description||"Kabar terbaru SMP Negeri 1 Susukan",imageUrl,registeredAt:new Date().toISOString()};
 await cache.put(metaReq(host,id),new Response(JSON.stringify(meta),{headers:{"Content-Type":"application/json","Cache-Control":"public,max-age=3600"}}));
 return new Response(JSON.stringify({ok:true,url:`${host}/?id=${encodeURIComponent(id)}`,imageUrl}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store",...cors(origin)}})
}
async function registered(request,id){const host=new URL(request.url).origin,r=await caches.default.match(metaReq(host,id));if(!r)return null;try{return await r.json()}catch{return null}}

async function directPost(env,id){
 if(!env?.DB)throw new Error("D1 binding tidak tersedia");
 const newsId=clean(id,100);if(!newsId)throw new Error("ID kosong");
 const row=await env.DB.prepare("SELECT id,title,summary,image_url,is_published FROM news WHERE id=? AND is_published=1 LIMIT 1").bind(newsId).first();
 if(!row)throw new Error("Berita publik tidak ditemukan");
 const mr=await env.DB.prepare("SELECT value_json FROM content WHERE key=? LIMIT 1").bind(`news:${newsId}`).first();
 const manifest=unwrap(mr?decode(mr.value_json):null)||{};
 const coverKey=clean(manifest?.coverKey||(Array.isArray(manifest?.photoKeys)?manifest.photoKeys[0]:""),180);
 let cover="";
 if(coverKey){const cr=await env.DB.prepare("SELECT value_json FROM content WHERE key=? LIMIT 1").bind(coverKey).first();const cv=unwrap(cr?decode(cr.value_json):null);cover=String(cv&&typeof cv==="object"?(cv.data||cv.src||cv.url||""):cv||"")}
 if(!cover)cover=String(manifest?.coverDataUrl||manifest?.coverUrl||row.image_url||"");
 return {id:newsId,title:clean(manifest?.title||row.title||"Berita SMP Negeri 1 Susukan",220),summary:clean(manifest?.summary||row.summary||"Kabar terbaru SMP Negeri 1 Susukan",320),cover,coverKey};
}

async function imageResponse(request,env,id){
 const host=new URL(request.url).origin;
 try{
  const p=await directPost(env,id),cover=p.cover;
  if(/^https?:\/\//i.test(cover)){const r=await fetch(cover,{headers:{Accept:"image/*"}});if(r.ok)return new Response(r.body,{headers:{"Content-Type":r.headers.get("Content-Type")||"image/jpeg","Cache-Control":"public,max-age=1800","Access-Control-Allow-Origin":"*"}})}
  const d=parseDataUri(cover);if(d)return new Response(d.body,{headers:{"Content-Type":d.mime,"Cache-Control":"public,max-age=1800","Access-Control-Allow-Origin":"*"}})
 }catch{}
 const cached=await caches.default.match(imgReq(host,id));if(cached){const h=new Headers(cached.headers);h.set("Access-Control-Allow-Origin","*");return new Response(cached.body,{status:200,headers:h})}
 const reg=await registered(request,id);if(reg?.imageUrl&&/^https:\/\//i.test(reg.imageUrl)&&!reg.imageUrl.includes(`${host}/image`)){try{const rr=await fetch(reg.imageUrl,{headers:{Accept:"image/*"}});if(rr.ok)return new Response(rr.body,{headers:{"Content-Type":rr.headers.get("Content-Type")||"image/jpeg","Cache-Control":"public,max-age=900","Access-Control-Allow-Origin":"*"}})}catch{}}
 return Response.redirect(`${SITE}gerbang.jpg`,302)
}

function htmlResponse(request,id,p){
 const host=new URL(request.url).origin,share=`${host}/?id=${encodeURIComponent(id)}`,image=`${host}/image?id=${encodeURIComponent(id)}`,title=clean(p?.title||"Berita SMP Negeri 1 Susukan",220),desc=clean(p?.description||p?.summary||"Kabar terbaru SMP Negeri 1 Susukan",320);
 const html=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — ${SCHOOL}</title><meta name="description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:locale" content="id_ID"><meta property="og:site_name" content="PAIBP SMART SMP"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(share)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:secure_url" content="${esc(image)}"><meta property="og:image:alt" content="Sampul ${esc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}"><link rel="canonical" href="${esc(share)}"></head><body><p>${esc(title)}</p></body></html>`;
 return new Response(html,{headers:{"Content-Type":"text/html;charset=utf-8","Cache-Control":"public,max-age=30,s-maxage=60","X-Robots-Tag":"index,follow"}})
}

export default{async fetch(request,env){
 const u=new URL(request.url),id=clean(u.searchParams.get("id"),160),origin=request.headers.get("Origin")||"";
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(u.pathname==="/health")return new Response(JSON.stringify({ok:true,service:"paibp-smart-share",version:VERSION,database:env?.DB?"Cloudflare D1":"unbound"}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
 if(u.pathname==="/register"&&request.method==="POST")return register(request);
 if(!id)return Response.redirect(`${SITE}#kabar-spensus`,302);
 if(u.pathname==="/image")return imageResponse(request,env,id);
 if(isHumanBrowserNavigation(request)||!isPreviewCrawler(request))return Response.redirect(targetUrl(id),302);
 try{const p=await directPost(env,id);return htmlResponse(request,id,p)}catch{}
 const reg=await registered(request,id);if(reg)return htmlResponse(request,id,reg);
 return htmlResponse(request,id,{title:"Berita SMP Negeri 1 Susukan",summary:"Kabar terbaru SMP Negeri 1 Susukan"});
}};
