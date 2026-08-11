const ALLOWED_ORIGINS = new Set([
  "https://sunarso29.github.io",
  "http://localhost",
  "http://127.0.0.1"
]);

const LIMITS = {
  video: 95 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  photo: 15 * 1024 * 1024
};

function corsHeaders(request, extra = {}) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://sunarso29.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,HEAD,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Accept,Content-Type,X-PAIBP-Editor",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    ...extra
  };
}

function json(request, data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(request, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extra
    })
  });
}

function clean(value, fallback = "item") {
  const out = String(value || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return out || fallback;
}

function extension(name, mime) {
  const m = String(name || "").match(/\.([a-zA-Z0-9]{1,10})$/);
  if (m) return `.${m[1].toLowerCase()}`;
  const map = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
  };
  return map[String(mime || "").toLowerCase()] || "";
}

function validKind(kind, mime) {
  const m = String(mime || "").toLowerCase();
  if (kind === "video") return m.startsWith("video/");
  if (kind === "audio") return m.startsWith("audio/");
  if (kind === "photo") return m.startsWith("image/");
  return false;
}

function objectPath(kind, newsId, attachmentId, file) {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const ext = extension(file.name, file.type);
  return `news-media/${ym}/${clean(newsId, "news")}/${kind}/${clean(attachmentId, crypto.randomUUID())}${ext}`;
}

function parseRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(String(value || "").trim());
  if (!match) return null;
  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;
  if (start === null && end === null) return null;
  if (start === null) {
    const suffix = Math.min(Number(end), size);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = size - suffix;
    end = size - 1;
  } else {
    if (!Number.isFinite(start) || start < 0 || start >= size) return null;
    if (end === null || !Number.isFinite(end) || end >= size) end = size - 1;
    if (end < start) return null;
  }
  return { offset: start, length: end - start + 1, start, end };
}

async function upload(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { ok: false, error: "Origin tidak diizinkan." }, 403);

  let form;
  try { form = await request.formData(); }
  catch { return json(request, { ok: false, error: "Form upload tidak valid." }, 400); }

  const file = form.get("file");
  const kind = String(form.get("kind") || "").toLowerCase();
  const newsId = String(form.get("newsId") || form.get("postId") || "");
  const attachmentId = String(form.get("attachmentId") || form.get("slot") || crypto.randomUUID());
  const order = Number(form.get("order") || 0) || 0;

  if (!(file instanceof File)) return json(request, { ok: false, error: "File media tidak ditemukan." }, 400);
  if (!LIMITS[kind]) return json(request, { ok: false, error: "Jenis media tidak didukung." }, 400);
  if (!validKind(kind, file.type)) return json(request, { ok: false, error: `Tipe file ${file.type || "tidak dikenal"} tidak sesuai untuk ${kind}.` }, 415);
  if (file.size <= 0) return json(request, { ok: false, error: "File media kosong." }, 400);
  if (file.size > LIMITS[kind]) return json(request, { ok: false, error: `Ukuran ${kind} melebihi batas server.` }, 413);

  const key = objectPath(kind, newsId, attachmentId, file);
  await env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable"
    },
    customMetadata: {
      newsId: clean(newsId, "news"),
      attachmentId: clean(attachmentId),
      kind,
      originalName: String(file.name || "media").slice(0, 180),
      order: String(order)
    }
  });

  const base = new URL(request.url).origin;
  const item = {
    id: attachmentId,
    type: kind,
    name: file.name || `${kind}${extension("", file.type)}`,
    title: String(file.name || kind).replace(/\.[^.]+$/, ""),
    size: file.size,
    mime: file.type || "application/octet-stream",
    order,
    path: key,
    url: `${base}/media/files/${key}`,
    createdAt: new Date().toISOString()
  };
  return json(request, { ok: true, item }, 201);
}

async function remove(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { ok: false, error: "Origin tidak diizinkan." }, 403);
  let body = {};
  try { body = await request.json(); } catch {}
  const key = String(body.path || body.key || "");
  if (!key.startsWith("news-media/")) return json(request, { ok: false, error: "Path media tidak valid." }, 400);
  await env.MEDIA_BUCKET.delete(key);
  return json(request, { ok: true, path: key });
}

async function serve(request, env, key) {
  if (!key.startsWith("news-media/")) return json(request, { ok: false, error: "Path media tidak valid." }, 400);
  const head = await env.MEDIA_BUCKET.head(key);
  if (!head) return json(request, { ok: false, error: "Media tidak ditemukan." }, 404);

  const baseHeaders = corsHeaders(request, {
    "Content-Type": head.httpMetadata?.contentType || "application/octet-stream",
    "Cache-Control": head.httpMetadata?.cacheControl || "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "ETag": head.httpEtag || head.etag || ""
  });

  if (request.method === "HEAD") {
    baseHeaders["Content-Length"] = String(head.size);
    return new Response(null, { status: 200, headers: baseHeaders });
  }

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, head.size);
    if (!range) return new Response(null, { status: 416, headers: corsHeaders(request, { "Content-Range": `bytes */${head.size}` }) });
    const object = await env.MEDIA_BUCKET.get(key, { range: { offset: range.offset, length: range.length } });
    if (!object) return json(request, { ok: false, error: "Media tidak ditemukan." }, 404);
    baseHeaders["Content-Range"] = `bytes ${range.start}-${range.end}/${head.size}`;
    baseHeaders["Content-Length"] = String(range.length);
    return new Response(object.body, { status: 206, headers: baseHeaders });
  }

  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) return json(request, { ok: false, error: "Media tidak ditemukan." }, 404);
  baseHeaders["Content-Length"] = String(head.size);
  return new Response(object.body, { status: 200, headers: baseHeaders });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (url.pathname === "/health" && request.method === "GET") return json(request, { ok: true, service: "paibp-smart-media", storage: "r2", version: "113" });
    if (url.pathname === "/media/upload" && request.method === "POST") return upload(request, env);
    if (url.pathname === "/media/delete" && request.method === "DELETE") return remove(request, env);
    if (url.pathname.startsWith("/media/files/") && (request.method === "GET" || request.method === "HEAD")) {
      return serve(request, env, decodeURIComponent(url.pathname.slice("/media/files/".length)));
    }
    return json(request, { ok: false, error: "Endpoint tidak ditemukan." }, 404);
  }
};
