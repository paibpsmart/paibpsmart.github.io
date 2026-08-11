const API = "https://paibp-smart-api.sunarso29.workers.dev";
const SITE = "https://sunarso29.github.io/paibp-smart/";
const SCHOOL = "SMP Negeri 1 Susukan";

function esc(v="") {
  return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function unwrap(v) {
  let x = v;
  for (let i=0;i<6;i++) {
    if (x && typeof x === "object" && Object.prototype.hasOwnProperty.call(x,"value")) { x=x.value; continue; }
    if (typeof x === "string") {
      const s=x.trim();
      if ((s.startsWith("{")&&s.endsWith("}"))||(s.startsWith("[")&&s.endsWith("]"))) {
        try { x=JSON.parse(s); continue; } catch {}
      }
    }
    break;
  }
  return x;
}
async function snapshot() {
  const u = new URL(API);
  u.searchParams.set("action","publicSnapshot");
  u.searchParams.set("_",Date.now().toString());
  const r = await fetch(u.toString(), {
    cf:{cacheTtl:0},
    headers:{
      Accept:"application/json",
      Origin:"https://sunarso29.github.io",
      Referer:"https://sunarso29.github.io/paibp-smart/",
      "User-Agent":"PAIBP-SMART-Share/118"
    }
  });
  if (!r.ok) throw new Error(`snapshot ${r.status}`);
  return r.json();
}
function looksLikeDate(v){return /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(String(v||"").trim())}
function findPost(s,id) {
  const row=(Array.isArray(s?.news)?s.news:[]).find(n=>String(n?.id||"")===String(id))||{};
  const content=s?.content||{};
  const manifest=unwrap(content[`news:${id}`])||{};
  let title=String(manifest?.title||row?.title||"Berita SMP Negeri 1 Susukan").trim();
  if(looksLikeDate(title)&&manifest?.title) title=String(manifest.title).trim();
  if(looksLikeDate(title)) title="Berita SMP Negeri 1 Susukan";
  const summary=String(manifest?.summary||row?.summary||"Kabar terbaru SMP Negeri 1 Susukan").replace(/\s+/g," ").trim().slice(0,260);
  let cover="";
  if (manifest?.schema==="chunks-v102") {
    const key=manifest?.coverKey || (Array.isArray(manifest?.photoKeys)?manifest.photoKeys[0]:"");
    const cv=unwrap(content[key]);
    cover=String(cv?.data||cv?.src||cv||"");
  }
  if (!cover) cover=String(manifest?.coverDataUrl||manifest?.coverUrl||row?.imageUrl||row?.imageDataUrl||"");
  return {row,manifest,title,summary,cover};
}
function parseDataUri(uri) {
  const m=/^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(uri||""));
  if(!m) return null;
  const mime=m[1]||"application/octet-stream", raw=m[3]||"";
  if(m[2]) {
    const bin=atob(raw), bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return {mime,body:bytes};
  }
  return {mime,body:new TextEncoder().encode(decodeURIComponent(raw))};
}
async function imageResponse(req,id) {
  try {
    const s=await snapshot(), p=findPost(s,id), cover=p.cover;
    if(!cover) return Response.redirect(`${SITE}gerbang.jpg`,302);
    if(/^https?:\/\//i.test(cover)) {
      const r=await fetch(cover,{headers:{Accept:"image/*"}});
      if(!r.ok) return Response.redirect(`${SITE}gerbang.jpg`,302);
      const h=new Headers(r.headers);h.set("Cache-Control","public, max-age=1800, s-maxage=1800");h.set("Access-Control-Allow-Origin","*");
      return new Response(r.body,{status:200,headers:h});
    }
    const d=parseDataUri(cover);
    if(!d) return Response.redirect(`${SITE}gerbang.jpg`,302);
    return new Response(d.body,{status:200,headers:{"Content-Type":d.mime,"Cache-Control":"public, max-age=1800, s-maxage=1800","Access-Control-Allow-Origin":"*"}});
  } catch { return Response.redirect(`${SITE}gerbang.jpg`,302); }
}
function htmlResponse(req,id,p) {
  const origin=new URL(req.url).origin;
  const share=`${origin}/?id=${encodeURIComponent(id)}`;
  const image=`${origin}/image?id=${encodeURIComponent(id)}&v=${encodeURIComponent(String(p?.row?.updatedAt||Date.now()))}`;
  const target=`${SITE}index.html?news=${encodeURIComponent(id)}#kabar-spensus`;
  const title=p.title || "Berita SMP Negeri 1 Susukan";
  const desc=p.summary || "Kabar terbaru SMP Negeri 1 Susukan";
  const body=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — ${SCHOOL}</title><meta name="description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:locale" content="id_ID"><meta property="og:site_name" content="PAIBP SMART SMP"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(share)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:alt" content="Sampul ${esc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}"><link rel="canonical" href="${esc(share)}"><meta http-equiv="refresh" content="0;url=${esc(target)}"><style>body{font:16px system-ui;margin:32px;color:#173247}a{color:#087f68}</style></head><body><p>Membuka berita <strong>${esc(title)}</strong>…</p><p><a href="${esc(target)}">Buka berita</a></p><script>location.replace(${JSON.stringify(target)})<\/script></body></html>`;
  return new Response(body,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=30, s-maxage=60","X-Robots-Tag":"index, follow"}});
}

export default {
  async fetch(request) {
    const u=new URL(request.url);
    const id=String(u.searchParams.get("id")||"").trim();
    if(u.pathname==="/health") return new Response(JSON.stringify({ok:true,service:"paibp-smart-share",version:"118.1"}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
    if(!id) return Response.redirect(`${SITE}#kabar-spensus`,302);
    if(u.pathname==="/image") return imageResponse(request,id);
    try { const s=await snapshot(), p=findPost(s,id); return htmlResponse(request,id,p); }
    catch { return htmlResponse(request,id,{title:"Berita SMP Negeri 1 Susukan",summary:"Kabar terbaru SMP Negeri 1 Susukan",row:{}}); }
  }
};
