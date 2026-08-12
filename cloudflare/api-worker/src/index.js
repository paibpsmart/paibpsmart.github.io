const GAS_URL = "https://script.google.com/macros/s/AKfycbyRxOw6oWDZUuQxwuqOMRO92KOwqOGF_9J6rPzSfxr9Dqy9kAQGJ9qZA6Tm_deUOgtjKg/exec";
const SITE = "https://paibpsmart.github.io";
const LEGACY_SITE = "https://sunarso29.github.io";
const ALLOWED_ORIGINS = new Set([SITE, LEGACY_SITE]);
const VERSION = "125-proxy";

function cors(origin = "") {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : SITE;
  return {
    "Access-Control-Allow-Origin": allowed,
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

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || SITE;
    const incoming = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (incoming.pathname === "/health") {
      return json({ ok: true, service: "paibp-smart-api", version: VERSION, site: SITE }, 200, cors(origin));
    }

    try {
      const callback = incoming.searchParams.get("callback") || incoming.searchParams.get("prefix") || "";
      let upstream;

      if (request.method === "POST") {
        upstream = await fetch(GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: await request.text(),
          redirect: "follow"
        });
      } else {
        const target = new URL(GAS_URL);
        for (const [key, value] of incoming.searchParams) {
          if (key !== "callback" && key !== "prefix") target.searchParams.set(key, value);
        }
        target.searchParams.set("_proxy", "125");
        upstream = await fetch(target.toString(), {
          method: "GET",
          redirect: "follow",
          headers: { "Accept": "application/json" }
        });
      }

      const raw = await upstream.text();
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {
          ok: false,
          version: VERSION,
          error: "Respons backend bukan JSON.",
          upstreamStatus: upstream.status
        };
      }

      const payload = JSON.stringify(parsed);
      const headers = new Headers(cors(origin));
      headers.set("X-PAIBP-Proxy", "125");

      if (callback && validCallback(callback)) {
        headers.set("Content-Type", "application/javascript; charset=utf-8");
        return new Response(`${callback}(${payload});`, { status: 200, headers });
      }

      headers.set("Content-Type", "application/json; charset=utf-8");
      return new Response(payload, { status: upstream.ok ? 200 : upstream.status, headers });
    } catch (error) {
      return json(
        { ok: false, version: VERSION, error: String(error?.message || error) },
        502,
        cors(origin)
      );
    }
  }
};
