const API = "https://paibp-smart-api.sunarso29.workers.dev";
const SITE = "https://sunarso29.github.io/paibp-smart/";
const SCHOOL = "SMP Negeri 1 Susukan";
const ALLOWED_ORIGIN = "https://sunarso29.github.io";

function esc(v="") { return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function clean(v,max=400){return String(v||"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max)}
function cors(origin=""){return {"Access-Control-Allow-Origin":origin===ALLOWED_ORIGIN?origin:ALLOWED_ORIGIN,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Accept","Access-Control-Max-Age":"86400","Vary":"Origin"}}
function unwrap(v){let x=v;for(let i=0;i<6;i++){if(x&&typeof x==="object"&&Object.prototype.hasOwnProperty.call(x,"value")){x=x.value;continue}if(typeof x==="string"){const s=x.trim();if((s.startsWith("{")&&s.endsWith("}"))||(s.startsWith("[")&&s.endsWith("]"))){try{x=JSON.parse(s);continue}catch{}}}break}return x}
function metaReq(origin,id){return new Request(`${origin}/__share_meta/${encodeURIComponent(id)}`)}
function imgReq(origin,id){return new Request(`${origin}/__share_img/${encodeURIComponent(id)}`)}
function targetUrl(id){return `${SITE}index.html?news=${encodeURIComponent(id)}&from=share#kabar-spensus`}

function isHumanBrowserNavigation(request){
 const h=request.headers,ua=String(h.get("User-Agent")||"").toLowerCase();
 const mode=String(h.get("Sec-Fetch-Mode")||"").toLowerCase();
 const dest=String(h.get("Sec-Fetch-Dest")||"").toLowerCase();
 const user=String(h.get("Sec-Fetch-User")||"").toLowerCase();
 // Browser modern, Custom Tab, dan WebView Android mengirim salah satu header navigasi ini.
 if(mode==="navigate"||dest==="document"||user==="?1")return true;
 // Fallback untuk browser/WebView lama. UA boleh memuat WhatsApp/Facebook karena itu bisa
 // merupakan browser dalam aplikasi; crawler sosial asli umumnya tidak memiliki mesin browser.
 const browserEngine=/mozilla\/5\.0/.test(ua)&&/(applewebkit|chrome|crios|firefox|fxios|edg|edga|edgios|opr|samsungbrowser|\bwv\b|version\/\d+.*safari)/.test(ua);
 const knownCrawler=/(facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|discordbot|slackbot|skypeuripreview|pinterestbot|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|crawler|spider|bot\b)/.test(ua);
 return browserEngine&&!knownCrawler;
}
function isPreviewCrawler(request){
 const ua=String(request.headers.get("User-Agent")||"").toLowerCase();
 if(!ua)return false;
 return /(facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|linkedinbot|discordbot|slackbot|skypeuripreview|pinterest|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|crawler|spider|bot\b|preview)/i.test(ua);
}
function parseDataUri(uri){const m=/^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(uri||""));if(!m)return null;const mime=m[1]||"application/octet-stream",raw=m[3]||"";if(m[2]){const bin=atob(raw),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return{mime,body:bytes}}return{mime,body:new TextEncoder().encode(decodeURIComponent(raw))}}

async function register(request){
 const origin=request.headers.get("Origin")||"";if(origin!==ALLOWED_ORIGIN)return new Response(JSON.stringify({ok:false,error:"Origin ditolak"}),{status:403,headers:{"Content-Type":"application/json",...cors(origin)}});
 let body={};try{body=await request.json()}catch{return new Response(JSON.stringify({ok:false,error:"JSON tidak valid"}),{status:400,headers:{"Content-Type":"application/json",...cors(origin)}})}
 const id=clean(body.id,160),title=clean(body.title,220),description=clean(body.description,320),image=String(body.image||"");if(!id||!title)return new Response(JSON.stringify({ok:false,error:"id/title wajib"}),{status:400,headers:{"Content-Type":"application/json",...cors(origin)}});
 const host=new URL(request.url).origin,cache=caches.default;let imageUrl="";
 if(image.startsWith("data:image/")&&image.length<1500000){const d=parseDataUri(image);if(d){await cache.put(imgReq(host,id),new Response(d.body,{headers:{"Content-Type":d.mime,"Cache-Control":"public,max-age=604800"}}));imageUrl=`${host}/image?id=${encodeURIComponent(id)}`}}
 else if(/^https:\/\//i.test(image)){imageUrl=image}
 const meta={id,title,description:description||"Kabar terbaru SMP Negeri 1 Susukan",imageUrl,registeredAt:new Date().toISOString()};
 await cache.put(metaReq(host,id),new Response(JSON.stringify(meta),{headers:{"Content-Type":"application/json","Cache-Control":"public,max-age=604800"}}));
 return new Response(JSON.stringify({ok:true,url:`${host}/?id=${encodeURIComponent(id)}`,imageUrl}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store",...cors(origin)}})
}
async function registered(request,id){const host=new URL(request.url).origin,r=await caches.default.match(metaReq(host,id));if(!r)return null;try{return await r.json()}catch{return null}}
async function snapshot(){const u=new URL(API);u.searchParams.set("action","publicSnapshot");u.searchParams.set("_",Date.now().toString());const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),3500);try{const r=await fetch(u.toString(),{signal:ctl.signal,cf:{cacheTtl:0},headers:{Accept:"application/json",Origin:ALLOWED_ORIGIN,Referer:`${SITE}`,"User-Agent":"PAIBP-SMART-Share/121"}});if(!r.ok)throw new Error(`snapshot ${r.status}`);return r.json()}finally{clearTimeout(tm)}}
function findPost(s,id){const row=(Array.isArray(s?.news)?s.news:[]).find(n=>String(n?.id||"")===String(id))||{},content=s?.content||{},manifest=unwrap(content[`news:${id}`])||{};const title=clean(manifest?.title||(!/^\d{4}-\d{2}-\d{2}/.test(String(row?.title||""))?row?.title:"")||"Berita SMP Negeri 1 Susukan",220),summary=clean(manifest?.summary||row?.summary||"Kabar terbaru SMP Negeri 1 Susukan",320);let cover="";if(manifest?.schema==="chunks-v102"){const key=manifest?.coverKey||(Array.isArray(manifest?.photoKeys)?manifest.photoKeys[0]:"");const cv=unwrap(content[key]);cover=String(cv?.data||cv?.src||cv||"")}if(!cover)cover=String(manifest?.coverDataUrl||manifest?.coverUrl||row?.imageUrl||row?.imageDataUrl||row?.imageFileId||"");return{row,manifest,title,summary,cover}}

async function imageResponse(request,id){
 const host=new URL(request.url).origin,cached=await caches.default.match(imgReq(host,id));if(cached){const h=new Headers(cached.headers);h.set("Access-Control-Allow-Origin","*");return new Response(cached.body,{status:200,headers:h})}
 const reg=await registered(request,id);if(reg?.imageUrl&&/^https:\/\//i.test(reg.imageUrl)&&!reg.imageUrl.includes(`${host}/image`)){const rr=await fetch(reg.imageUrl,{headers:{Accept:"image/*"}});if(rr.ok)return new Response(rr.body,{headers:{"Content-Type":rr.headers.get("Content-Type")||"image/jpeg","Cache-Control":"public,max-age=3600","Access-Control-Allow-Origin":"*"}})}
 try{const s=await snapshot(),p=findPost(s,id),cover=p.cover;if(/^https?:\/\//i.test(cover)){const r=await fetch(cover,{headers:{Accept:"image/*"}});if(r.ok)return new Response(r.body,{headers:{"Content-Type":r.headers.get("Content-Type")||"image/jpeg","Cache-Control":"public,max-age=1800","Access-Control-Allow-Origin":"*"}})}const d=parseDataUri(cover);if(d)return new Response(d.body,{headers:{"Content-Type":d.mime,"Cache-Control":"public,max-age=1800","Access-Control-Allow-Origin":"*"}})}catch{}
 return Response.redirect(`${SITE}gerbang.jpg`,302)
}
function htmlResponse(request,id,p){const host=new URL(request.url).origin,share=`${host}/?id=${encodeURIComponent(id)}`,image=p.imageUrl||`${host}/image?id=${encodeURIComponent(id)}`,title=clean(p.title||"Berita SMP Negeri 1 Susukan",220),desc=clean(p.description||p.summary||"Kabar terbaru SMP Negeri 1 Susukan",320);const html=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — ${SCHOOL}</title><meta name="description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:locale" content="id_ID"><meta property="og:site_name" content="PAIBP SMART SMP"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(share)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:alt" content="Sampul ${esc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}"><link rel="canonical" href="${esc(share)}"></head><body><p>${esc(title)}</p></body></html>`;return new Response(html,{headers:{"Content-Type":"text/html;charset=utf-8","Cache-Control":"public,max-age=30,s-maxage=60","X-Robots-Tag":"index,follow"}})}

export default{async fetch(request){const u=new URL(request.url),id=clean(u.searchParams.get("id"),160),origin=request.headers.get("Origin")||"";if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});if(u.pathname==="/health")return new Response(JSON.stringify({ok:true,service:"paibp-smart-share",version:"121"}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});if(u.pathname==="/register"&&request.method==="POST")return register(request);if(!id)return Response.redirect(`${SITE}#kabar-spensus`,302);if(u.pathname==="/image")return imageResponse(request,id);
 // Prioritas pertama adalah navigasi manusia. Ini mencegah WhatsApp/Facebook in-app browser
 // salah dikenali sebagai crawler dan berhenti di halaman Worker kosong/intermediat.
 if(isHumanBrowserNavigation(request)||!isPreviewCrawler(request))return Response.redirect(targetUrl(id),302);
 // Crawler preview tetap menerima Open Graph, bukan redirect.
 const reg=await registered(request,id);if(reg)return htmlResponse(request,id,reg);try{const s=await snapshot(),p=findPost(s,id);return htmlResponse(request,id,{title:p.title,description:p.summary,imageUrl:""})}catch{return htmlResponse(request,id,{title:"Berita SMP Negeri 1 Susukan",description:"Kabar terbaru SMP Negeri 1 Susukan",imageUrl:""})}}};
