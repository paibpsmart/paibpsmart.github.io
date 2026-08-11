/*
PAIBP SMART MEDIA WORKER V112
Tujuan: upload video/audio dari Editor Berita tanpa meminta GitHub token di browser.
Penyimpanan: Cloudinary via signed server-side upload.

Environment secrets yang dibutuhkan pada Worker ini:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Nama Worker yang direkomendasikan: paibp-smart-media
Endpoint hasil: https://paibp-smart-media.sunarso29.workers.dev
*/

const SITE_ORIGIN="https://sunarso29.github.io";
const MAX_BYTES=95*1024*1024;

export default{
  async fetch(request,env){
    const url=new URL(request.url),origin=request.headers.get("Origin")||"";
    const cors=corsHeaders(origin);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
    try{
      if(url.pathname==="/"||url.pathname==="/health"){
        return json({ok:true,service:"PAIBP SMART Media V112",storage:"Cloudinary",configured:Boolean(env.CLOUDINARY_CLOUD_NAME&&env.CLOUDINARY_API_KEY&&env.CLOUDINARY_API_SECRET),time:new Date().toISOString()},200,cors);
      }
      if(url.pathname==="/media/upload"&&request.method==="POST"){
        if(!isAllowedEditorRequest(request,origin))return json({ok:false,error:"Permintaan upload ditolak."},403,cors);
        return uploadMedia(request,env,cors);
      }
      if(url.pathname==="/media/delete"&&request.method==="POST"){
        if(!isAllowedEditorRequest(request,origin))return json({ok:false,error:"Permintaan hapus ditolak."},403,cors);
        return deleteMedia(request,env,cors);
      }
      return json({ok:false,error:"Endpoint tidak ditemukan."},404,cors);
    }catch(e){return json({ok:false,error:String(e?.message||e)},500,cors)}
  }
};

function corsHeaders(origin){
  const allowed=origin===SITE_ORIGIN||origin===""||origin.startsWith("http://localhost")||origin.startsWith("http://127.0.0.1");
  return{
    "Access-Control-Allow-Origin":allowed&&origin?origin:SITE_ORIGIN,
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Accept,Content-Type,X-PAIBP-Editor",
    "Access-Control-Max-Age":"86400",
    "Cache-Control":"no-store",
    "Vary":"Origin"
  };
}
function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...extra}})}
function isAllowedEditorRequest(request,origin){
  if(origin!==SITE_ORIGIN&&!origin.startsWith("http://localhost")&&!origin.startsWith("http://127.0.0.1"))return false;
  if(request.headers.get("X-PAIBP-Editor")!=="news-v112")return false;
  const ref=request.headers.get("Referer")||"";
  return !ref||ref.startsWith(`${SITE_ORIGIN}/paibp-smart/`);
}
async function sha1Hex(text){const buf=await crypto.subtle.digest("SHA-1",new TextEncoder().encode(text));return[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function signature(params,secret){const keys=Object.keys(params).filter(k=>params[k]!==undefined&&params[k]!==null&&params[k]!=="").sort();return sha1Hex(keys.map(k=>`${k}=${params[k]}`).join("&")+secret)}
function clean(v,max=160){return String(v??"").trim().replace(/[\u0000-\u001f\u007f]/g,"").slice(0,max)}
function safeFolderPart(v){return clean(v,100).replace(/[^A-Za-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"")||"news"}

async function uploadMedia(request,env,cors){
  if(!env.CLOUDINARY_CLOUD_NAME||!env.CLOUDINARY_API_KEY||!env.CLOUDINARY_API_SECRET)return json({ok:false,error:"Server media belum memiliki konfigurasi Cloudinary."},503,cors);
  const form=await request.formData(),file=form.get("file"),kind=clean(form.get("kind"),20)==="audio"?"audio":"video",newsId=safeFolderPart(form.get("newsId")),attachmentId=clean(form.get("attachmentId"),120)||crypto.randomUUID();
  if(!file||typeof file!=="object"||!("arrayBuffer" in file)||!file.size)return json({ok:false,error:"File media tidak ditemukan."},400,cors);
  if(file.size>MAX_BYTES)return json({ok:false,error:"Ukuran file maksimal 95 MB."},413,cors);
  const timestamp=Math.floor(Date.now()/1000),folder=`paibp-smart/news/${newsId}/${kind}`,public_id=crypto.randomUUID();
  const params={folder,public_id,timestamp},sig=await signature(params,env.CLOUDINARY_API_SECRET);
  const fd=new FormData();fd.append("file",file,file.name||`${kind}-${public_id}`);fd.append("api_key",env.CLOUDINARY_API_KEY);fd.append("timestamp",String(timestamp));fd.append("folder",folder);fd.append("public_id",public_id);fd.append("signature",sig);
  const endpoint=`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const r=await fetch(endpoint,{method:"POST",body:fd}),d=await r.json();
  if(!r.ok)throw new Error(d?.error?.message||"Upload media ke Cloudinary gagal.");
  const item={id:attachmentId,type:kind,name:clean(file.name,220)||`${kind}-${public_id}`,title:clean(String(file.name||"").replace(/\.[^.]+$/,"")||kind,220),url:d.secure_url||d.url||"",publicId:d.public_id||"",resourceType:d.resource_type||"",format:d.format||"",size:Number(d.bytes||file.size||0),mime:file.type||"",duration:Number(d.duration||0),width:Number(d.width||0),height:Number(d.height||0),createdAt:new Date().toISOString()};
  return json({ok:true,item},200,cors);
}

async function deleteMedia(request,env,cors){
  if(!env.CLOUDINARY_CLOUD_NAME||!env.CLOUDINARY_API_KEY||!env.CLOUDINARY_API_SECRET)return json({ok:false,error:"Server media belum memiliki konfigurasi Cloudinary."},503,cors);
  const body=await request.json().catch(()=>({})),publicId=clean(body.publicId,300),resourceType=clean(body.resourceType,30)||"video";
  if(!publicId)return json({ok:false,error:"publicId wajib ada."},400,cors);
  const timestamp=Math.floor(Date.now()/1000),params={public_id:publicId,timestamp},sig=await signature(params,env.CLOUDINARY_API_SECRET),fd=new FormData();
  fd.append("public_id",publicId);fd.append("api_key",env.CLOUDINARY_API_KEY);fd.append("timestamp",String(timestamp));fd.append("signature",sig);fd.append("invalidate","true");
  const rt=["image","video","raw"].includes(resourceType)?resourceType:"video",endpoint=`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${rt}/destroy`;
  const r=await fetch(endpoint,{method:"POST",body:fd}),d=await r.json();if(!r.ok)throw new Error(d?.error?.message||"Hapus media gagal.");return json({ok:true,result:d.result||"ok"},200,cors)
}
