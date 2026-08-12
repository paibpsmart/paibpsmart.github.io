const SITE = "https://paibpsmart.github.io";
const LEGACY_SITE = "https://sunarso29.github.io";
const ALLOWED_ORIGINS = new Set([SITE, LEGACY_SITE]);
const VERSION = "126-d1";
const READ_KEY = "b082937b2165453ba7d9f81ecac063b00310b339ec0643da";

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

function clean(value, max = 5000) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function boolValue(value, fallback = true) {
  if (value === false || String(value).toLowerCase() === "false" || value === 0 || value === "0") return false;
  if (value === true || String(value).toLowerCase() === "true" || value === 1 || value === "1") return true;
  return fallback;
}
function numberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function nowIso() { return new Date().toISOString(); }
function idOf(value = "") { return clean(value, 100) || crypto.randomUUID(); }
function validCallback(value) { return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(String(value || "")); }
function safeParse(value, fallback = null) {
  try { return JSON.parse(String(value)); } catch { return fallback; }
}
function encodeStoredValue(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? {});
}
function decodeStoredValue(value) {
  const parsed = safeParse(value, Symbol.for("invalid"));
  return parsed === Symbol.for("invalid") ? String(value ?? "") : parsed;
}
function normalizeAction(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  const map = {
    health:"health", ping:"health",
    public:"publicSnapshot", publicsnapshot:"publicSnapshot", stats:"publicSnapshot",
    activity:"activity", access:"activity", log:"activity", track:"activity", heartbeat:"activity", visit:"activity",
    activitybatch:"activityBatch", batchactivity:"activityBatch",
    activities:"activities", readactivities:"activities", recap:"activities",
    submission:"submission", studentwork:"submission", submitwork:"submission", savetask:"submission", savework:"submission",
    submissions:"submissions", readsubmissions:"submissions", submissiondetail:"submissionDetail",
    feedback:"feedback", rating:"feedback", comment:"feedback", feedbackmoderate:"feedbackModerate",
    news:"newsUpsert", gallery:"newsUpsert", savegallery:"newsUpsert", newsupsert:"newsUpsert", newsdelete:"newsDelete",
    content:"contentUpsert", homepage:"contentUpsert", savecontent:"contentUpsert", contentupsert:"contentUpsert",
    contentdelete:"contentDelete", contentget:"contentGet",
    editorsnapshot:"editorSnapshot", adminsnapshot:"editorSnapshot",
    setupinfo:"setupInfo", classlistv66:"classListV66",
    kvget:"kvGet", kvupsert:"kvUpsert", kvdelete:"kvDelete",
    clienterror:"clientError"
  };
  return map[key] || raw;
}
function json(body, status = 200, origin = "", extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type":"application/json; charset=utf-8", "X-PAIBP-Backend":VERSION, ...cors(origin), ...extra }
  });
}
function output(body, request, callback = "") {
  const origin = request.headers.get("Origin") || "";
  if (callback && validCallback(callback)) {
    const headers = new Headers(cors(origin));
    headers.set("Content-Type", "application/javascript; charset=utf-8");
    headers.set("X-PAIBP-Backend", VERSION);
    return new Response(`${callback}(${JSON.stringify(body)});`, { status:200, headers });
  }
  return json(body, 200, origin);
}
function requireAllowedOrigin(request, bodyOrigin = "") {
  const headerOrigin = request.headers.get("Origin") || "";
  if (headerOrigin && !ALLOWED_ORIGINS.has(headerOrigin)) throw new Error("Origin tidak diizinkan.");
  if (bodyOrigin && !ALLOWED_ORIGINS.has(bodyOrigin)) throw new Error("Origin tidak diizinkan.");
}
function requireReadKey(candidate) {
  if (String(candidate || "") !== READ_KEY) throw new Error("readKey tidak valid.");
}
async function bodyJson(request) {
  const raw = await request.text();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch {}
  const params = new URLSearchParams(raw);
  if (params.has("payload")) {
    try { return JSON.parse(params.get("payload")); } catch {}
  }
  return Object.fromEntries(params.entries());
}
async function ensureDb(env) {
  if (!env?.DB) throw new Error("Binding database D1 belum aktif.");
  return env.DB;
}

function newsObject(row) {
  const payload = safeParse(row.payload_json, {}) || {};
  for (const secretField of ["readKey","token","auth","authorization","apiKey","origin"]) delete payload[secretField];
  return {
    ...payload,
    id: row.id,
    updatedAt: row.updated_at,
    title: row.title,
    date: row.date,
    summary: row.summary,
    imageFileId: row.image_file_id,
    imageUrl: row.image_url,
    authorName: row.author_name,
    authorSchool: row.author_school,
    isPublished: !!row.is_published,
    sortOrder: row.sort_order
  };
}

async function publicSnapshot(env) {
  const db = await ensureDb(env);
  const [newsQ, contentQ, feedbackQ, statsQ, todayQ, onlineQ, teachersQ] = await Promise.all([
    db.prepare("SELECT * FROM news WHERE is_published=1 ORDER BY date DESC, updated_at DESC LIMIT 50").all(),
    db.prepare("SELECT key,value_json FROM content ORDER BY updated_at ASC").all(),
    db.prepare("SELECT id,timestamp,name,role,school,rating,comment FROM feedback WHERE is_approved=1 ORDER BY timestamp DESC LIMIT 30").all(),
    db.prepare("SELECT COUNT(*) AS totalActivities, COUNT(DISTINCT CASE WHEN lower(role) NOT IN ('editor','admin','pemilik') THEN session_id END) AS totalSessions FROM activities").first(),
    db.prepare("SELECT COUNT(DISTINCT session_id) AS todaySessions FROM activities WHERE lower(role) NOT IN ('editor','admin','pemilik') AND substr(timestamp,1,10)=substr(datetime('now'),1,10)").first(),
    db.prepare("SELECT COUNT(DISTINCT session_id) AS onlineNow FROM activities WHERE lower(role) NOT IN ('editor','admin','pemilik') AND timestamp >= datetime('now','-5 minutes')").first(),
    db.prepare("SELECT timestamp,user_name,school,teacher_name,teacher_school FROM activities WHERE lower(role) IN ('guru','teacher') ORDER BY timestamp DESC LIMIT 100").all()
  ]);

  const content = {};
  for (const row of contentQ.results || []) content[row.key] = decodeStoredValue(row.value_json);
  const seen = new Set();
  const latestTeachers = [];
  for (const row of teachersQ.results || []) {
    const name = clean(row.user_name || row.teacher_name, 160);
    const school = clean(row.school || row.teacher_school, 220);
    if (!name) continue;
    const k = `${name}|${school}`.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    latestTeachers.push({ name, school, lastSeen:row.timestamp });
    if (latestTeachers.length >= 12) break;
  }
  return {
    ok:true,
    app:"PAIBP SMART SMP",
    version:VERSION,
    database:"Cloudflare D1",
    generatedAt:nowIso(),
    stats:{
      totalSessions:Number(statsQ?.totalSessions || 0),
      todaySessions:Number(todayQ?.todaySessions || 0),
      onlineNow:Number(onlineQ?.onlineNow || 0),
      totalActivities:Number(statsQ?.totalActivities || 0)
    },
    latestTeachers,
    news:(newsQ.results || []).map(newsObject),
    feedback:feedbackQ.results || [],
    content
  };
}

async function upsertContent(env, data) {
  const db = await ensureDb(env);
  const key = clean(data.key || data.contentKey || "homepage", 180);
  if (!key) throw new Error("Key konten wajib diisi.");
  const value = data.value != null ? data.value : (data.valueJson != null ? data.valueJson : data.content);
  const valueJson = encodeStoredValue(value);
  if (valueJson.length > 1800000) throw new Error("Konten terlalu besar untuk satu bagian. Gunakan chunk editor.");
  const updatedAt = nowIso();
  await db.prepare(`INSERT INTO content(key,value_json,updated_at,author_name,author_school)
    VALUES(?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at,author_name=excluded.author_name,author_school=excluded.author_school`)
    .bind(key,valueJson,updatedAt,clean(data.authorName || data.userName,160),clean(data.authorSchool || data.school,220)).run();
  return { key, updatedAt };
}
async function deleteContent(env, data) {
  const db = await ensureDb(env);
  const key = clean(data.key || data.contentKey, 180);
  if (!key) throw new Error("Key konten wajib diisi.");
  const result = await db.prepare("DELETE FROM content WHERE key=?").bind(key).run();
  return { key, deleted:Number(result.meta?.changes || 0) > 0 };
}
async function getContent(env, key) {
  const db = await ensureDb(env);
  const row = await db.prepare("SELECT key,value_json,updated_at,author_name,author_school FROM content WHERE key=?").bind(clean(key,180)).first();
  if (!row) return { ok:true, found:false, key:clean(key,180), value:null };
  return { ok:true, found:true, key:row.key, value:decodeStoredValue(row.value_json), updatedAt:row.updated_at, authorName:row.author_name, authorSchool:row.author_school };
}
async function upsertNews(env, data) {
  const db = await ensureDb(env);
  const id = idOf(data.id);
  const updatedAt = nowIso();
  const title = clean(data.title || "Kegiatan Spensus", 240);
  const date = clean(data.date || updatedAt.slice(0,10), 40);
  const summary = clean(data.summary || data.description, 5000);
  const imageFileId = clean(data.imageFileId, 160);
  const imageUrl = clean(data.imageUrl || data.image, 3000);
  const authorName = clean(data.authorName || data.userName,160);
  const authorSchool = clean(data.authorSchool || data.school,220);
  const isPublished = boolValue(data.isPublished,true) ? 1 : 0;
  const sortOrder = numberValue(data.sortOrder,0);
  const payloadJson = JSON.stringify({...data,id,updatedAt});
  await db.prepare(`INSERT INTO news(id,updated_at,title,date,summary,image_file_id,image_url,author_name,author_school,is_published,sort_order,payload_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at,title=excluded.title,date=excluded.date,summary=excluded.summary,image_file_id=excluded.image_file_id,image_url=excluded.image_url,author_name=excluded.author_name,author_school=excluded.author_school,is_published=excluded.is_published,sort_order=excluded.sort_order,payload_json=excluded.payload_json`)
    .bind(id,updatedAt,title,date,summary,imageFileId,imageUrl,authorName,authorSchool,isPublished,sortOrder,payloadJson).run();
  return { id, imageUrl, updatedAt };
}
async function deleteNews(env, data) {
  const db = await ensureDb(env);
  const id = clean(data.id || data.newsId,100);
  if (!id) throw new Error("ID berita tidak tersedia.");
  const result = await db.prepare("DELETE FROM news WHERE id=?").bind(id).run();
  return { id, deleted:Number(result.meta?.changes || 0) > 0 };
}

function activityRecord(data = {}) {
  return {
    id:idOf(data.id), timestamp:nowIso(), sessionId:clean(data.sessionId || data.session || "unknown",120),
    role:clean(data.role || data.userRole || "umum",40), userName:clean(data.userName || data.name || data.studentName || data.teacherName,160),
    school:clean(data.school || data.workUnit || data.studentSchool || data.teacherSchool,220), studentClass:clean(data.studentClass || data.className || data.class || data.grade,60),
    teacherName:clean(data.teacherName || data.contextTeacher,160), teacherSchool:clean(data.teacherSchool || data.contextSchool,220), teacherScope:clean(data.teacherScope || data.scope,100),
    action:clean(data.action || data.event || "view",100), space:clean(data.space || data.panel || data.room,100), chapter:clean(data.chapter || data.chapterId || data.material,180), section:clean(data.section || data.view || data.detail,180)
  };
}
async function writeActivity(env, data) {
  const db = await ensureDb(env); const r = activityRecord(data);
  await db.prepare(`INSERT OR REPLACE INTO activities(id,timestamp,session_id,role,user_name,school,student_class,teacher_name,teacher_school,teacher_scope,action,space,chapter,section,payload_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(r.id,r.timestamp,r.sessionId,r.role,r.userName,r.school,r.studentClass,r.teacherName,r.teacherSchool,r.teacherScope,r.action,r.space,r.chapter,r.section,JSON.stringify(data || {})).run();
  return {id:r.id,timestamp:r.timestamp};
}
async function writeActivityBatch(env, items) {
  const list = Array.isArray(items) ? items.slice(0,80) : [];
  for (const item of list) await writeActivity(env,item);
  return {count:list.length};
}
async function getActivities(env, params) {
  const db = await ensureDb(env); const limit=Math.max(1,Math.min(3000,numberValue(params.limit,500)));
  const q=await db.prepare("SELECT payload_json,id,timestamp,session_id,role,user_name,school,student_class,teacher_name,teacher_school,teacher_scope,action,space,chapter,section FROM activities ORDER BY timestamp DESC LIMIT ?").bind(limit).all();
  const rows=(q.results||[]).map(r=>({...safeParse(r.payload_json,{}) ,id:r.id,timestamp:r.timestamp,sessionId:r.session_id,role:r.role,userName:r.user_name,school:r.school,studentClass:r.student_class,teacherName:r.teacher_name,teacherSchool:r.teacher_school,teacherScope:r.teacher_scope,action:r.action,space:r.space,chapter:r.chapter,section:r.section}));
  return {ok:true,count:rows.length,activities:rows,records:rows};
}

async function writeFeedback(env,data={}) {
  const db=await ensureDb(env), id=idOf(data.id), timestamp=nowIso();
  const name=clean(data.name||data.userName||"Pengunjung",160), role=clean(data.role||"pengunjung",40), school=clean(data.school||data.workUnit,220), rating=numberValue(data.rating||data.stars,0), comment=clean(data.comment||data.message||data.text,3000), approved=boolValue(data.isApproved,true)?1:0, sessionId=clean(data.sessionId||data.session||"unknown",120), pageUrl=clean(data.pageUrl||data.url,1000);
  if(!comment&&!rating) throw new Error("Tanggapan kosong.");
  await db.prepare("INSERT OR REPLACE INTO feedback(id,timestamp,name,role,school,rating,comment,is_approved,session_id,page_url,payload_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(id,timestamp,name,role,school,rating,comment,approved,sessionId,pageUrl,JSON.stringify(data)).run();
  return {id,timestamp};
}
async function moderateFeedback(env,data={}) {
  const db=await ensureDb(env), id=clean(data.id,100), approved=boolValue(data.isApproved,false)?1:0;
  const result=await db.prepare("UPDATE feedback SET is_approved=? WHERE id=?").bind(approved,id).run();
  if(!Number(result.meta?.changes||0)) throw new Error("Tanggapan tidak ditemukan.");
  return {id,isApproved:!!approved};
}

async function writeSubmission(env,data={}) {
  const db=await ensureDb(env), id=idOf(data.id), timestamp=nowIso(), payload=data.payload||data.work||data.answers||data.bundle||data;
  await db.prepare(`INSERT OR REPLACE INTO submissions(id,timestamp,session_id,student_name,student_class,student_number,school,teacher_name,teacher_school,teacher_scope,chapter_id,chapter_title,exercise_score,status,payload_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id,timestamp,clean(data.sessionId||data.session||"unknown",120),clean(data.studentName||data.name,160),clean(data.studentClass||data.className||data.class||data.grade,60),clean(data.studentNumber||data.number||data.absen,40),clean(data.school||data.studentSchool,220),clean(data.teacherName||data.contextTeacher,160),clean(data.teacherSchool||data.contextSchool,220),clean(data.teacherScope||data.scope,100),clean(data.chapterId||data.chapter,100),clean(data.chapterTitle||data.title,220),clean(data.exerciseScore??data.score,60),clean(data.status||"terkirim",40),JSON.stringify(payload)).run();
  return {id,timestamp,payloadSize:JSON.stringify(payload).length,storedInDrive:false};
}
async function getSubmissions(env,params={}) {
  const db=await ensureDb(env), limit=Math.max(1,Math.min(1000,numberValue(params.limit,300))), includePayload=String(params.includePayload||"")==="1";
  const q=await db.prepare("SELECT * FROM submissions ORDER BY timestamp DESC LIMIT ?").bind(limit).all();
  const rows=(q.results||[]).map(r=>({id:r.id,timestamp:r.timestamp,sessionId:r.session_id,studentName:r.student_name,studentClass:r.student_class,studentNumber:r.student_number,school:r.school,teacherName:r.teacher_name,teacherSchool:r.teacher_school,teacherScope:r.teacher_scope,chapterId:r.chapter_id,chapterTitle:r.chapter_title,exerciseScore:r.exercise_score,status:r.status,...(includePayload?{payload:safeParse(r.payload_json,{})}:{})}));
  return {ok:true,count:rows.length,submissions:rows,records:rows};
}
async function getSubmissionDetail(env,id) {
  const db=await ensureDb(env); const row=await db.prepare("SELECT * FROM submissions WHERE id=?").bind(clean(id,100)).first();
  if(!row) throw new Error("Tugas tidak ditemukan.");
  return {ok:true,submission:{id:row.id,timestamp:row.timestamp,sessionId:row.session_id,studentName:row.student_name,studentClass:row.student_class,studentNumber:row.student_number,school:row.school,teacherName:row.teacher_name,teacherSchool:row.teacher_school,teacherScope:row.teacher_scope,chapterId:row.chapter_id,chapterTitle:row.chapter_title,exerciseScore:row.exercise_score,status:row.status,payload:safeParse(row.payload_json,{})}};
}

async function kvGet(env,namespace,key){const db=await ensureDb(env);const row=await db.prepare("SELECT value_json,updated_at FROM kv WHERE namespace=? AND key=?").bind(clean(namespace,80),clean(key,180)).first();return {ok:true,found:!!row,namespace:clean(namespace,80),key:clean(key,180),value:row?decodeStoredValue(row.value_json):null,updatedAt:row?.updated_at||""};}
async function kvUpsert(env,data={}){const db=await ensureDb(env),namespace=clean(data.namespace||"default",80),key=clean(data.key,180),updatedAt=nowIso();if(!key)throw new Error("Key wajib diisi.");await db.prepare("INSERT INTO kv(namespace,key,value_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(namespace,key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at").bind(namespace,key,encodeStoredValue(data.value),updatedAt).run();return{namespace,key,updatedAt};}
async function kvDelete(env,data={}){const db=await ensureDb(env),namespace=clean(data.namespace||"default",80),key=clean(data.key,180);const r=await db.prepare("DELETE FROM kv WHERE namespace=? AND key=?").bind(namespace,key).run();return{namespace,key,deleted:Number(r.meta?.changes||0)>0};}
async function classListV66(env){const db=await ensureDb(env);const q=await db.prepare("SELECT key,value_json,updated_at FROM kv WHERE namespace='class-v66' ORDER BY key").all();const classes=(q.results||[]).map(r=>({key:r.key,...(safeParse(r.value_json,{})||{}),updatedAt:r.updated_at}));return{ok:true,classes,records:classes};}

async function editorSnapshot(env){const pub=await publicSnapshot(env);const activities=await getActivities(env,{limit:1500});const submissions=await getSubmissions(env,{limit:500});const db=await ensureDb(env);const fq=await db.prepare("SELECT * FROM feedback ORDER BY timestamp DESC LIMIT 3000").all();return{ok:true,generatedAt:nowIso(),public:pub,activities:activities.activities,submissions:submissions.submissions,feedback:fq.results||[]};}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ok:false,error:"Origin tidak diizinkan."},403,origin);
      return new Response(null,{status:204,headers:cors(origin)});
    }
    try {
      requireAllowedOrigin(request);
      if (url.pathname === "/health") {
        const db = await ensureDb(env);
        const meta = await db.prepare("SELECT value FROM meta WHERE key='schema_version'").first();
        return json({ok:true,service:"paibp-smart-api",version:VERSION,database:"Cloudflare D1",schema:meta?.value||"unknown",site:SITE},200,origin);
      }
      const callback=url.searchParams.get("callback")||url.searchParams.get("prefix")||"";
      if (request.method === "GET") {
        const params=Object.fromEntries(url.searchParams.entries());
        const action=normalizeAction(params.action||params.type||"health");
        let result;
        if(action==="health") result={ok:true,service:"paibp-smart-api",version:VERSION,database:"Cloudflare D1",site:SITE,time:nowIso()};
        else if(action==="publicSnapshot") result=await publicSnapshot(env);
        else if(action==="contentGet") { requireReadKey(params.readKey||params.key||params.token); result=await getContent(env,params.contentKey||params.keyName||params.id||params.key); }
        else if(action==="activities") { requireReadKey(params.readKey||params.key||params.token); result=await getActivities(env,params); }
        else if(action==="submissions") { requireReadKey(params.readKey||params.key||params.token); result=await getSubmissions(env,params); }
        else if(action==="submissionDetail") { requireReadKey(params.readKey||params.key||params.token); result=await getSubmissionDetail(env,params.id); }
        else if(action==="editorSnapshot") { requireReadKey(params.readKey||params.key||params.token); result=await editorSnapshot(env); }
        else if(action==="setupInfo") result={ok:true,app:"PAIBP SMART SMP",version:VERSION,database:"Cloudflare D1",site:SITE,configured:true};
        else if(action==="classListV66") { requireReadKey(params.readKey||params.key||params.token); result=await classListV66(env); }
        else if(action==="kvGet") { requireReadKey(params.readKey||params.token); result=await kvGet(env,params.namespace,params.key); }
        else result={ok:false,error:`Aksi GET tidak dikenal: ${action}`,version:VERSION};
        return output(result,request,callback);
      }
      if(request.method!=="POST") return json({ok:false,error:"Metode tidak didukung."},405,origin);
      const body=await bodyJson(request), action=normalizeAction(body.action||body.type||body.eventType||""), data=body.data||body.payload||body.record||body;
      requireAllowedOrigin(request,clean(body.origin||data.origin,300));
      let result;
      if(action==="activity") result=await writeActivity(env,data);
      else if(action==="activityBatch") result=await writeActivityBatch(env,data.items||data.activities||data.records||[]);
      else if(action==="submission") result=await writeSubmission(env,data);
      else if(action==="feedback") result=await writeFeedback(env,data);
      else if(action==="clientError") result=await writeActivity(env,{...data,action:"client-error",role:data.role||"system"});
      else {
        requireReadKey(body.readKey||data.readKey||body.key);
        if(action==="newsUpsert") result=await upsertNews(env,data);
        else if(action==="newsDelete") result=await deleteNews(env,data);
        else if(action==="contentUpsert") result=await upsertContent(env,data);
        else if(action==="contentDelete") result=await deleteContent(env,data);
        else if(action==="feedbackModerate") result=await moderateFeedback(env,data);
        else if(action==="kvUpsert") result=await kvUpsert(env,data);
        else if(action==="kvDelete") result=await kvDelete(env,data);
        else throw new Error(`Aksi POST tidak dikenal: ${action}`);
      }
      return json({ok:true,result,time:nowIso(),version:VERSION},200,origin);
    } catch(error) {
      const message=String(error?.message||error);
      const status=/readKey|Origin/.test(message)?403:/Binding database/.test(message)?503:400;
      return json({ok:false,version:VERSION,error:message},status,origin);
    }
  }
};
