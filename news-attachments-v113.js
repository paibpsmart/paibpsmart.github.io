(()=>{
"use strict";
if(window.__NEWS_ATTACHMENTS_V115__)return;window.__NEWS_ATTACHMENTS_V115__=1;
const WORKER="https://paibp-smart-api.sunarso29.workers.dev";
const KEY="b082937b2165453ba7d9f81ecac063b00310b339ec0643da";
const CFG=window.PAIBP_CLOUDINARY_MEDIA||{};
const CLOUD=String(CFG.cloudName||"k2mss5sn").trim();
const PRESET=String(CFG.uploadPreset||"paibp_media_free").trim();
const MAX_VIDEOS=Number(CFG.maxVideos||5),MAX_VIDEO_BYTES=Number(CFG.maxVideoBytes||100*1024*1024),MAX_AUDIO_BYTES=Number(CFG.maxAudioBytes||100*1024*1024);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid=()=>crypto?.randomUUID?.()||`att-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const bytes=n=>{n=+n||0;if(n<1024)return`${n} B`;if(n<1048576)return`${(n/1024).toFixed(1)} KB`;return`${(n/1048576).toFixed(1)} MB`};
let queue=[],remote=[],loadingId="",bypassSubmit=false,dirty=false,activeUploads=0,waiters=[];

function newsId(){let id=$("#ne-id")?.value||"";if(!id){id=`news-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;if($("#ne-id"))$("#ne-id").value=id}return id}
function status(m,t=""){const e=$("#nea-status");if(e){e.textContent=m||"";e.dataset.tone=t}}
function progress(v){const e=$("#nea-progress span");if(e)e.style.width=`${Math.max(0,Math.min(100,+v||0))}%`}
function fp(x){const name=String(x?.name||x?.file?.name||"").trim().toLowerCase(),size=Number(x?.size||x?.file?.size||0),type=String(x?.type||"");return`${type}|${name}|${size}`}
function dedupe(list){const out=[],seen=new Set(),videos=[];for(const x of list||[]){if(!x||!x.type||!x.url)continue;const k=String(x.publicId||x.url||fp(x));const f=fp(x);if(seen.has(k)||seen.has(f))continue;if(x.type==="video"&&videos.length>=MAX_VIDEOS)continue;seen.add(k);seen.add(f);out.push(x);if(x.type==="video")videos.push(x)}return out}
function totalVideos(){return remote.filter(x=>x.type==="video").length+queue.filter(x=>x.type==="video"&&!x.cancelled).length}
function totalQueued(){return queue.filter(x=>!x.cancelled&&x.state!=="done").length}

async function workerPost(action,data){const r=await fetch(WORKER,{method:"POST",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},body:JSON.stringify({action,readKey:KEY,key:KEY,data:{...data,readKey:KEY},origin:location.origin})});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}if(!r.ok||j?.ok===false)throw new Error(j?.error||`Server HTTP ${r.status}`);return j}
const unwrap=v=>v&&typeof v==="object"&&Object.prototype.hasOwnProperty.call(v,"value")?v.value:v;
async function snapshot(){const u=new URL(WORKER);u.searchParams.set("action","publicSnapshot");u.searchParams.set("_",Date.now());const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("Media posting belum dapat dibaca.");return r.json()}
async function saveManifest(id){remote=dedupe(remote);const value={schema:"news-attachments-v115",newsId:id,updatedAt:new Date().toISOString(),storage:"cloudinary-free",items:remote.map((x,i)=>({...x,order:i+1}))};await workerPost("contentUpsert",{key:`news:${id}:attachments`,value,authorName:"Sunarso, S.Pd.I, Gr",authorSchool:"SMP Negeri 1 Susukan",updatedAt:new Date().toISOString()});dirty=false;return value}

function render(){
 const v=$("#nea-video-count"),a=$("#nea-audio-count");if(v)v.textContent=`${totalVideos()}/${MAX_VIDEOS} video`;if(a)a.textContent=`${remote.filter(x=>x.type==="audio").length+queue.filter(x=>x.type==="audio"&&!x.cancelled).length} audio`;
 const root=$("#nea-list");if(!root)return;
 const all=[...remote.map(x=>({...x,remote:true})),...queue.filter(x=>!x.cancelled).map(x=>({id:x.id,type:x.type,name:x.file.name,size:x.file.size,state:x.state,remote:false}))];
 root.innerHTML=all.map(x=>`<div class="nea-item" data-type="${x.type}"><span class="nea-icon">${x.type==="video"?"▶":"♫"}</span><span><strong>${esc(x.name||x.title||"Media")}</strong><small>${x.remote?"Tersimpan":x.state==="uploading"?"Mengunggah di latar…":x.state==="done"?"Siap":"Menunggu • "+bytes(x.size)}</small></span><button class="nea-remove" type="button" data-nea-remove="${esc(x.id)}" data-remote="${x.remote?1:0}">Hapus</button></div>`).join("");
 $$('[data-nea-remove]',root).forEach(b=>b.onclick=async()=>{
   const id=b.dataset.neaRemove;
   if(b.dataset.remote==="1"){
     const before=remote.length;remote=remote.filter(x=>String(x.id)!==String(id));if(remote.length===before)return;render();status("Menghapus media dari posting…");try{await saveManifest(newsId());status("Media sudah dihapus dari posting.","ok");try{new BroadcastChannel("spensus-news").postMessage({type:"media-updated",id:newsId()})}catch{}}catch(e){status(`Gagal menyimpan penghapusan: ${e.message||e}`,"error")}
   }else{
     const q=queue.find(x=>String(x.id)===String(id));if(q){q.cancelled=true;q.controller?.abort();queue=queue.filter(x=>!x.cancelled);render();status("Media dibatalkan.")}
   }
 });
}

async function loadRemote(id,force=false){if(!id)return;if(id===loadingId&&!force)return;loadingId=id;try{const s=await snapshot(),c=s?.content||{},x=unwrap(c[`news:${id}:attachments`])||{},raw=Array.isArray(x.items)?x.items:[],clean=dedupe(raw);remote=clean;render();if(clean.length!==raw.length){status("Duplikat media lama ditemukan dan dirapikan otomatis…");await saveManifest(id);status("Duplikat media sudah dibersihkan.","ok")}}catch{remote=[];render()}}

async function uploadEntry(q,id){
 if(q.cancelled||q.state==="done")return q.item||null;
 const existing=remote.find(x=>fp(x)===fp({type:q.type,name:q.file.name,size:q.file.size}));if(existing){q.state="done";q.item=existing;return existing}
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

function pumpUploads(){
 while(activeUploads<3){const q=queue.find(x=>!x.cancelled&&x.state==="queued");if(!q)break;activeUploads++;uploadEntry(q,newsId()).catch(e=>{q.error=e}).finally(()=>{activeUploads--;pumpUploads();notifyWaiters()})}
 notifyWaiters();
}
function notifyWaiters(){if(activeUploads===0&&!queue.some(x=>!x.cancelled&&["queued","uploading"].includes(x.state))){const a=waiters.splice(0);a.forEach(fn=>fn())}}
function waitUploads(){if(activeUploads===0&&!queue.some(x=>!x.cancelled&&["queued","uploading"].includes(x.state)))return Promise.resolve();return new Promise(r=>waiters.push(r))}

function add(kind,files){
 let added=0;for(const f of [...files]){
   if(!f||!f.size)continue;const limit=kind==="video"?MAX_VIDEO_BYTES:MAX_AUDIO_BYTES;if(f.size>limit){status(`“${f.name}” melebihi batas 100 MB.`,"error");continue}
   if(kind==="video"&&totalVideos()>=MAX_VIDEOS){status("Maksimal 5 video untuk satu posting.","error");break}
   const fingerprint=fp({type:kind,name:f.name,size:f.size});if(remote.some(x=>fp(x)===fingerprint)||queue.some(x=>!x.cancelled&&fp({type:x.type,name:x.file.name,size:x.file.size})===fingerprint))continue;
   queue.push({id:uid(),type:kind,file:f,state:"queued",cancelled:false,item:null,error:null,controller:null});added++
 }
 if(added){dirty=true;render();status(`${added} ${kind==="video"?"video":"audio"} ditambahkan. Upload berjalan otomatis di latar belakang.`);pumpUploads()}else render()
}

async function prepareAndContinue(){
 const id=newsId();if(totalVideos()>MAX_VIDEOS){status("Maksimal 5 video untuk satu posting.","error");return}
 const submit=$("#ne-publish-direct");if(submit){submit.disabled=true;submit.textContent="Posting…"}
 try{
   status(totalQueued()?"Menyelesaikan media…":"Mengirim posting…");progress(45);pumpUploads();await waitUploads();
   const failed=queue.find(x=>!x.cancelled&&x.state==="error");if(failed)throw failed.error||new Error("Ada media yang gagal diunggah.");
   remote=dedupe([...remote,...queue.filter(x=>!x.cancelled&&x.item).map(x=>x.item)]);queue=[];render();progress(82);
   if(dirty||remote.length)await saveManifest(id);progress(100);status("Media siap.","ok");
   bypassSubmit=true;requestAnimationFrame(()=>$("#ne-form")?.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})))
 }catch(e){status(`Media belum terkirim: ${e.message||e}`,"error");if(submit){submit.disabled=false;submit.textContent="Posting"}progress(0)}
}

function mount(){
 const form=$("#ne-form");if(!form||$("#nea-section"))return;const actions=$(".ne-actions",form),sec=document.createElement("section");sec.className="ne-form-section nea-section";sec.id="nea-section";
 sec.innerHTML=`<div class="ne-form-section-head nea-head"><div><span class="ne-section-kicker">04 • VIDEO & AUDIO</span><strong>Media posting</strong><small>Pilih media. Upload berjalan otomatis di latar belakang agar tombol Posting lebih cepat.</small></div><div class="nea-counts"><span class="nea-badge" id="nea-video-count">0/5 video</span><span class="nea-badge audio" id="nea-audio-count">0 audio</span></div></div><div class="nea-upload-grid"><label class="nea-picker"><input id="nea-video" type="file" multiple><span><b>＋ Pilih video</b><small>Maksimal 5 video • 100 MB/file</small></span></label><label class="nea-picker audio"><input id="nea-audio" type="file" multiple><span><b>＋ Pilih MP3 / audio</b><small>Jumlah audio tidak dibatasi editor • 100 MB/file</small></span></label></div><div class="nea-list" id="nea-list"></div><div class="nea-progress" id="nea-progress"><span></span></div><div class="nea-status" id="nea-status" aria-live="polite"></div>`;
 actions?.before(sec);$("#nea-video").onchange=e=>{add("video",e.target.files||[]);e.target.value=""};$("#nea-audio").onchange=e=>{add("audio",e.target.files||[]);e.target.value=""};render()
}

mount();
document.addEventListener("submit",e=>{if(e.target?.id!=="ne-form")return;if(bypassSubmit){bypassSubmit=false;return}if(!queue.length&&!dirty)return;e.preventDefault();e.stopImmediatePropagation();prepareAndContinue()},{capture:true});
document.addEventListener("click",e=>{const edit=e.target.closest?.("[data-edit]");if(edit){loadingId="";[70,180,420].forEach(ms=>setTimeout(()=>{const id=$("#ne-id")?.value||edit.dataset.edit;if(id)loadRemote(id,true)},ms))}if(e.target.closest?.("#ne-reset")){queue.forEach(q=>{q.cancelled=true;q.controller?.abort()});queue=[];remote=[];loadingId="";dirty=false;render();status("");progress(0)}},true);
const initial=$("#ne-id")?.value;if(initial)loadRemote(initial,true);
})();