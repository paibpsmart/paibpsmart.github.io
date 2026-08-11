(()=>{
"use strict";
if(window.__NEWS_ATTACHMENTS_V116__)return;window.__NEWS_ATTACHMENTS_V116__=1;
const WORKER="https://paibp-smart-api.sunarso29.workers.dev";
const KEY="b082937b2165453ba7d9f81ecac063b00310b339ec0643da";
const CFG=window.PAIBP_CLOUDINARY_MEDIA||{};
const CLOUD=String(CFG.cloudName||"k2mss5sn").trim();
const PRESET=String(CFG.uploadPreset||"paibp_media_free").trim();
const MAX_VIDEOS=Number(CFG.maxVideos||5),MAX_VIDEO_BYTES=Number(CFG.maxVideoBytes||100*1024*1024),MAX_AUDIO_BYTES=Number(CFG.maxAudioBytes||100*1024*1024),PARALLEL=5;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid=()=>crypto?.randomUUID?.()||`att-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const bytes=n=>{n=+n||0;if(n<1024)return`${n} B`;if(n<1048576)return`${(n/1024).toFixed(1)} KB`;return`${(n/1048576).toFixed(1)} MB`};
let queue=[],remote=[],loadingId="",bypassSubmit=false,dirty=false,activeUploads=0,waiters=[];

function newsId(){let id=$("#ne-id")?.value||"";if(!id){id=`news-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;if($("#ne-id"))$("#ne-id").value=id}return id}
function status(m,t=""){const e=$("#nea-status");if(e){e.textContent=m||"";e.dataset.tone=t}}
function progress(v){const e=$("#nea-progress span");if(e)e.style.width=`${Math.max(0,Math.min(100,+v||0))}%`}
function normalizedName(x){return String(x?.name||x?.file?.name||"").trim().toLowerCase().replace(/\s+/g," ")}
function identity(x){const type=String(x?.type||"");const name=normalizedName(x);return name?`${type}|${name}`:`${type}|${String(x?.publicId||x?.url||x?.id||"")}`}
function dedupe(list){const out=[],seen=new Set();let videos=0;for(const x of list||[]){if(!x||!x.type||!x.url)continue;const k=identity(x);if(!k||seen.has(k))continue;if(x.type==="video"&&videos>=MAX_VIDEOS)continue;seen.add(k);out.push(x);if(x.type==="video")videos++}return out}
function totalVideos(){return remote.filter(x=>x.type==="video").length+queue.filter(x=>x.type==="video"&&!x.cancelled).length}
function pendingCount(){return queue.filter(x=>!x.cancelled&&["queued","uploading"].includes(x.state)).length}
function posterFor(url){const s=String(url||"");if(!/res\.cloudinary\.com/i.test(s)||!/\/video\/upload\//.test(s))return"";return s.replace("/video/upload/","/video/upload/so_0,q_auto:low,f_jpg/").replace(/\.[a-z0-9]+(\?.*)?$/i,".jpg$1")}

async function workerPost(action,data){const r=await fetch(WORKER,{method:"POST",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},body:JSON.stringify({action,readKey:KEY,key:KEY,data:{...data,readKey:KEY},origin:location.origin})});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}if(!r.ok||j?.ok===false)throw new Error(j?.error||`Server HTTP ${r.status}`);return j}
const unwrap=v=>v&&typeof v==="object"&&Object.prototype.hasOwnProperty.call(v,"value")?v.value:v;
async function snapshot(){const u=new URL(WORKER);u.searchParams.set("action","publicSnapshot");u.searchParams.set("_",Date.now());const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("Media posting belum dapat dibaca.");return r.json()}
async function saveManifest(id){remote=dedupe(remote);const value={schema:"news-attachments-v116",newsId:id,updatedAt:new Date().toISOString(),storage:"cloudinary-free",items:remote.map((x,i)=>({...x,order:i+1}))};await workerPost("contentUpsert",{key:`news:${id}:attachments`,value,authorName:"Sunarso, S.Pd.I, Gr",authorSchool:"SMP Negeri 1 Susukan",updatedAt:new Date().toISOString()});dirty=false;return value}

function render(){
 const v=$("#nea-video-count"),a=$("#nea-audio-count");if(v)v.textContent=`${totalVideos()}/${MAX_VIDEOS} video`;if(a)a.textContent=`${remote.filter(x=>x.type==="audio").length+queue.filter(x=>x.type==="audio"&&!x.cancelled).length} audio`;
 const root=$("#nea-list");if(!root)return;
 const all=[...remote.map(x=>({...x,remote:true})),...queue.filter(x=>!x.cancelled).map(x=>({id:x.id,type:x.type,name:x.file.name,size:x.file.size,state:x.state,remote:false}))];
 root.innerHTML=all.map(x=>{const poster=x.remote&&x.type==="video"?posterFor(x.url):"";return`<article class="nea-item" data-type="${x.type}">${poster?`<img class="nea-thumb" src="${esc(poster)}" alt="">`:`<span class="nea-icon">${x.type==="video"?"▶":"♫"}</span>`}<span class="nea-copy"><strong>${esc(x.name||x.title||"Media")}</strong><small>${x.remote?"Tersimpan pada posting":x.state==="uploading"?"Mengunggah…":x.state==="error"?"Gagal — tekan hapus lalu pilih ulang":x.state==="done"?"Siap":"Menunggu • "+bytes(x.size)}</small></span><button class="nea-remove" type="button" data-nea-remove="${esc(x.id)}" data-remote="${x.remote?1:0}">Hapus</button></article>`}).join("");
 $$('[data-nea-remove]',root).forEach(b=>b.onclick=async()=>{
   const id=b.dataset.neaRemove;
   if(b.dataset.remote==="1"){
     const before=remote.length;remote=remote.filter(x=>String(x.id)!==String(id));if(remote.length===before)return;render();status("Menghapus media…");
     try{await saveManifest(newsId());status("Media dihapus dari posting.","ok");try{new BroadcastChannel("spensus-news").postMessage({type:"media-updated",id:newsId()})}catch{}}catch(e){status(`Gagal menghapus: ${e.message||e}`,"error")}
   }else{
     const q=queue.find(x=>String(x.id)===String(id));if(q){q.cancelled=true;q.controller?.abort();queue=queue.filter(x=>!x.cancelled);render();status("Media dibatalkan.")}
   }
 });
}

async function loadRemote(id,force=false){if(!id)return;if(id===loadingId&&!force)return;loadingId=id;try{const s=await snapshot(),c=s?.content||{},x=unwrap(c[`news:${id}:attachments`])||{},raw=Array.isArray(x.items)?x.items:[],clean=dedupe(raw);remote=clean;render();if(clean.length!==raw.length){status(`Merapikan ${raw.length-clean.length} duplikat media lama…`);await saveManifest(id);status("Duplikat media sudah dibersihkan.","ok");try{new BroadcastChannel("spensus-news").postMessage({type:"media-updated",id})}catch{}}}catch(e){remote=[];render();status(`Media lama belum terbaca: ${e.message||e}`,"error")}}

async function uploadEntry(q){
 if(q.cancelled||q.state==="done")return q.item||null;
 const existing=remote.find(x=>identity(x)===identity({type:q.type,name:q.file.name}));if(existing){q.state="done";q.item=existing;return existing}
 q.state="uploading";q.controller=new AbortController();render();
 const fd=new FormData();fd.append("file",q.file,q.file.name);fd.append("upload_preset",PRESET);
 try{
   const r=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD)}/video/upload`,{method:"POST",body:fd,signal:q.controller.signal});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}
   if(!r.ok||!j?.secure_url)throw new Error(j?.error?.message||`Cloudinary HTTP ${r.status}`);
   if(q.cancelled)return null;
   const item={id:q.id,type:q.type,name:q.file.name,title:q.file.name.replace(/\.[^.]+$/,"")||q.file.name,size:Number(j.bytes||q.file.size||0),mime:q.file.type||"",url:j.secure_url,publicId:j.public_id||"",resourceType:j.resource_type||"video",format:j.format||"",duration:Number(j.duration||0),width:Number(j.width||0),height:Number(j.height||0),createdAt:new Date().toISOString(),storage:"cloudinary-free"};
   q.state="done";q.item=item;remote=dedupe([...remote,item]);render();return item
 }catch(e){if(q.cancelled||e?.name==="AbortError")return null;q.state="error";q.error=e;render();throw e}
}
function pumpUploads(){while(activeUploads<PARALLEL){const q=queue.find(x=>!x.cancelled&&x.state==="queued");if(!q)break;activeUploads++;uploadEntry(q).catch(e=>{q.error=e}).finally(()=>{activeUploads--;pumpUploads();notifyWaiters()})}notifyWaiters()}
function notifyWaiters(){if(activeUploads===0&&!queue.some(x=>!x.cancelled&&["queued","uploading"].includes(x.state))){waiters.splice(0).forEach(fn=>fn())}}
function waitUploads(){if(activeUploads===0&&!queue.some(x=>!x.cancelled&&["queued","uploading"].includes(x.state)))return Promise.resolve();return new Promise(r=>waiters.push(r))}

function add(kind,files){let added=0;for(const f of [...files]){if(!f||!f.size)continue;const limit=kind==="video"?MAX_VIDEO_BYTES:MAX_AUDIO_BYTES;if(f.size>limit){status(`“${f.name}” melebihi batas 100 MB.`,"error");continue}if(kind==="video"&&totalVideos()>=MAX_VIDEOS){status("Maksimal 5 video untuk satu posting.","error");break}const k=identity({type:kind,name:f.name});if(remote.some(x=>identity(x)===k)||queue.some(x=>!x.cancelled&&identity({type:x.type,name:x.file.name})===k))continue;queue.push({id:uid(),type:kind,file:f,state:"queued",cancelled:false,item:null,error:null,controller:null});added++}if(added){dirty=true;render();status(`${added} ${kind==="video"?"video":"audio"} ditambahkan — upload langsung berjalan.`);pumpUploads()}else render()}

async function prepareAndContinue(){
 const id=newsId();if(totalVideos()>MAX_VIDEOS){status("Maksimal 5 video untuk satu posting.","error");return}
 const submit=$("#ne-publish-direct");if(submit){submit.disabled=true;submit.textContent="Posting…"}
 try{
   pumpUploads();if(pendingCount())status("Menyelesaikan upload media…");progress(55);await waitUploads();
   const failed=queue.find(x=>!x.cancelled&&x.state==="error");if(failed)throw failed.error||new Error("Ada media yang gagal diunggah.");
   remote=dedupe([...remote,...queue.filter(x=>!x.cancelled&&x.item).map(x=>x.item)]);queue=[];render();progress(90);
   if(dirty||remote.length)await saveManifest(id);progress(100);status("Media siap.","ok");
   bypassSubmit=true;requestAnimationFrame(()=>$("#ne-form")?.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})))
 }catch(e){status(`Media belum terkirim: ${e.message||e}`,"error");if(submit){submit.disabled=false;submit.textContent="Posting"}progress(0)}
}

function mount(){
 const form=$("#ne-form");if(!form||$("#nea-section"))return;const photoGrid=$("#ne-media-grid"),photoSection=photoGrid?.closest(".ne-form-section"),sec=document.createElement("div");sec.className="nea-section nea-inline-gallery";sec.id="nea-section";
 sec.innerHTML=`<div class="nea-head"><div><strong>Video & Audio</strong><small>Masuk ke galeri posting yang sama seperti Instagram.</small></div><div class="nea-counts"><span class="nea-badge" id="nea-video-count">0/5 video</span><span class="nea-badge audio" id="nea-audio-count">0 audio</span></div></div><div class="nea-upload-grid"><label class="nea-picker"><input id="nea-video" type="file" multiple><span><b>＋ Video</b><small>Maksimal 5 • upload otomatis</small></span></label><label class="nea-picker audio"><input id="nea-audio" type="file" multiple><span><b>＋ MP3 / audio</b><small>Upload otomatis</small></span></label></div><div class="nea-list" id="nea-list"></div><div class="nea-progress" id="nea-progress"><span></span></div><div class="nea-status" id="nea-status" aria-live="polite"></div>`;
 if(photoSection)photoSection.append(sec);else $(".ne-actions",form)?.before(sec);
 $("#nea-video").onchange=e=>{add("video",e.target.files||[]);e.target.value=""};$("#nea-audio").onchange=e=>{add("audio",e.target.files||[]);e.target.value=""};render()
}

mount();
document.addEventListener("submit",e=>{if(e.target?.id!=="ne-form")return;if(bypassSubmit){bypassSubmit=false;return}if(!queue.length&&!dirty)return;e.preventDefault();e.stopImmediatePropagation();prepareAndContinue()},{capture:true});
document.addEventListener("click",e=>{const edit=e.target.closest?.("[data-edit]");if(edit){loadingId="";const wanted=edit.dataset.edit;[80,220,500,900,1500].forEach(ms=>setTimeout(()=>{const id=$("#ne-id")?.value||wanted;if(id)loadRemote(id,true)},ms))}if(e.target.closest?.("#ne-reset")){queue.forEach(q=>{q.cancelled=true;q.controller?.abort()});queue=[];remote=[];loadingId="";dirty=false;render();status("");progress(0)}},true);
const editorState=$("#ne-editor-status");if(editorState)new MutationObserver(()=>{const id=$("#ne-id")?.value;if(id&&/tayang|draft|dimuat/i.test(editorState.textContent||"")){loadingId="";loadRemote(id,true)}}).observe(editorState,{childList:true,subtree:true,characterData:true});
const initial=$("#ne-id")?.value;if(initial)loadRemote(initial,true);
})();