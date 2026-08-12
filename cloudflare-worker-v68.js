const GAS_URL = "https://script.google.com/macros/s/AKfycbyRxOw6oWDZUuQxwuqOMRO92KOwqOGF_9J6rPzSfxr9Dqy9kAQGJ9qZA6Tm_deUOgtjKg/exec";
const SITE = "https://paibpsmart.github.io";

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin === SITE ? origin : SITE,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Vary": "Origin"
  };
}

function validCallback(value) {
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(String(value || ""));
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || SITE;
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:cors(origin)});
    try {
      const incoming = new URL(request.url);
      const callback = incoming.searchParams.get("callback") || incoming.searchParams.get("prefix") || "";
      let upstream;
      if (request.method === "POST") {
        upstream = await fetch(GAS_URL, {
          method:"POST",
          headers:{"Content-Type":"text/plain;charset=UTF-8"},
          body:await request.text(),
          redirect:"follow"
        });
      } else {
        const target = new URL(GAS_URL);
        for (const [k,v] of incoming.searchParams) {
          if (k !== "callback" && k !== "prefix") target.searchParams.set(k,v);
        }
        target.searchParams.set("_proxy","68");
        upstream = await fetch(target.toString(),{method:"GET",redirect:"follow",headers:{"Accept":"application/json"}});
      }
      const raw = await upstream.text();
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { parsed = {ok:false,version:"68-proxy",error:"Respons backend bukan JSON.",upstreamStatus:upstream.status}; }
      const json = JSON.stringify(parsed);
      const headers = new Headers(cors(origin));
      headers.set("X-PAIBP-Proxy","68");
      if (callback && validCallback(callback)) {
        headers.set("Content-Type","application/javascript; charset=utf-8");
        return new Response(`${callback}(${json});`,{status:200,headers});
      }
      headers.set("Content-Type","application/json; charset=utf-8");
      return new Response(json,{status:upstream.ok?200:upstream.status,headers});
    } catch (error) {
      const body = JSON.stringify({ok:false,version:"68-proxy",error:String(error?.message || error)});
      return new Response(body,{status:502,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8"}});
    }
  }
};