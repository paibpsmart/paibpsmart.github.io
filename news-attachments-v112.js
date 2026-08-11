(()=>{
"use strict";
if(window.__NEWS_ATTACHMENTS_V112__)return;window.__NEWS_ATTACHMENTS_V112__=1;
const WORKER="https://paibp-smart-api.sunarso29.workers.dev";
const KEY="b082937b2165453ba7d9f81ecac063b00310b339ec0643da";
const MAX_VIDEOS=5,MAX_BYTES=95*1024*1024;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid=()=>crypto?.randomUUID?.()||`att-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const bytes=n=>{n=+n||0;if(n<1024)return`${n} B`;if(n<1048576)return`${(n/1024).toFixed(1)} KB`;return`${(n/1048576).toFixed(1)} MB`};
let videoQueue=[],audioQueue=[],remote=[],loadingId="",bypassSubmit=false,dirty=false;

async function workerPost(action,data){
  const r=await fetch(WORKER,{method:"POST",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},body:JSON.stringify({action,readKey:KEY,key:KEY,data:{...data,readKey:KEY},origin:location.origin})});
  const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}
  if(!r.ok||j?.ok===false)throw new Error(j?.error||`Server HTTP ${r.status}`);return j
}
const unwrap=v=>v&&typeof v==="object"&&Object.prototype.hasOwnProperty.call(v,"value")?v.value:v;
async function snapshot(){const u=new URL(WORKER);u.searchParams.set("action","publicSnapshot");u.searchParams.set("_",Date.now());const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("Lampiran belum dapat dibaca.");return r.json()}
function status(m,t=""){const e=$("#nea-status");if(e){e.textContent=m||"";e.dataset.tone=t}}
function progress(v){const e=$("#nea-progress span");if(e)e.style.width=`${Math.max(0,Math.min(100,+v||0))}%`}
function newsId(){let id=$("#ne-id")?.value||"";if(!id){id=`news-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;if($("#ne-id"))$("#ne-id").value=id}return id}
function totalVideos(){return remote.filter(x=>x.type==="video").length+videoQueue.length}

function add(kind,files){
  let added=0;
  for(const f of [...files]){
    if(f.size>MAX_BYTES){status(`“${f.name}” melebihi 95 MB. Pilih file yang lebih kecil agar unggahan dari HP tetap stabil.`,"error");continue}
    if(kind==="video"&&totalVideos()>=MAX_VIDEOS){status("Maksimal 5 video untuk satu posting.","error");break}
    (kind==="video"?videoQueue:audioQueue).push({id:uid(),file:f,type:kind});added++
  }
  if(added)dirty=true;render();
  if(added)status(`${added} ${kind==="video"?"video":"audio"} ditambahkan. File otomatis dikirim ke server saat tombol Terbitkan ditekan.`)
}
function render(){
  const v=$("#nea-video-count"),a=$("#nea-audio-count");if(v)v.textContent=`${totalVideos()}/${MAX_VIDEOS} video`;if(a)a.textContent=`${remote.filter(x=>x.type==="audio").length+audioQueue.length} audio`;
  const root=$("#nea-list");if(!root)return;
  const queued=[...videoQueue,...audioQueue],all=[...remote.map(x=>({...x,remote:true})),...queued.map(x=>({id:x.id,type:x.type,name:x.file.name,size:x.file.size,queued:true}))];
  if(!all.length){root.innerHTML="";return}
  root.innerHTML=all.map(x=>`<div class="nea-item" data-type="${x.type}"><span class="nea-icon">${x.type==="video"?"▶":"♫"}</span><span><strong>${esc(x.name||x.title||"Media")}</strong><small>${x.remote?"Tersimpan pada posting":`Siap dikirim • ${bytes(x.size)}`}</small></span><button class="nea-remove" type="button" data-nea-remove="${esc(x.id)}" data-remote="${x.remote?1:0}">${x.remote?"Lepas dari posting":"Hapus"}</button></div>`).join("");
  $$('[data-nea-remove]',root).forEach(b=>b.onclick=()=>{dirty=true;if(b.dataset.remote==="1"){remote=remote.filter(x=>String(x.id)!==String(b.dataset.neaRemove));status("Lampiran dilepas dari posting. Perubahan disimpan saat posting diterbitkan lagi.")}else{videoQueue=videoQueue.filter(x=>String(x.id)!==String(b.dataset.neaRemove));audioQueue=audioQueue.filter(x=>String(x.id)!==String(b.dataset.neaRemove))}render()})
}
async function loadRemote(id){if(!id||id===loadingId)return;loadingId=id;try{const s=await snapshot(),c=s?.content||{},x=unwrap(c[`news:${id}:attachments`])||{};remote=Array.isArray(x.items)?x.items:[]}catch{remote=[]}finally{dirty=false;render()}}

async function uploadOne(q,id,index,total){
  const f=q.file,fd=new FormData();fd.append("file",f,f.name);fd.append("newsId",id);fd.append("kind",q.type);fd.append("attachmentId",q.id);fd.append("order",String(index));
  status(`Mengunggah ${q.type==="video"?"video":"audio"} ${index}/${total}: ${f.name}`);progress(Math.max(4,Math.round((index-1)/Math.max(total,1)*88)));
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),120000);
  try{
    const r=await fetch(`${WORKER}/media/upload`,{method:"POST",body:fd,cache:"no-store",headers:{"Accept":"application/json","X-PAIBP-Editor":"news-v112"},signal:ctl.signal});
    const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}
    if(!r.ok||j?.ok!==true||!j?.item?.url)throw new Error(j?.error||`Server media HTTP ${r.status}`);
    return{...j.item,id:q.id,type:q.type,name:j.item.name||f.name,title:j.item.title||f.name.replace(/\.[^.]+$/,"")||f.name,size:j.item.size||f.size,mime:j.item.mime||f.type||"",createdAt:j.item.createdAt||new Date().toISOString()}
  }catch(e){if(e?.name==="AbortError")throw new Error("Unggahan media melewati batas waktu. Coba file lebih kecil atau jaringan yang lebih stabil.");throw e}finally{clearTimeout(timer)}
}
async function saveAttachmentManifest(id){const value={schema:"news-attachments-v112",newsId:id,updatedAt:new Date().toISOString(),items:remote.map((x,i)=>({...x,order:i+1}))};await workerPost("contentUpsert",{key:`news:${id}:attachments`,value,authorName:"Sunarso, S.Pd.I, Gr",authorSchool:"SMP Negeri 1 Susukan",updatedAt:new Date().toISOString()})}

async function prepareAndContinue(){
  const id=newsId(),q=[...videoQueue,...audioQueue];if(totalVideos()>MAX_VIDEOS){status("Maksimal 5 video untuk satu posting.","error");return}
  const submit=$("#ne-publish-direct");if(submit){submit.disabled=true;submit.textContent="Mengunggah media…"}
  try{
    for(let i=0;i<q.length;i++){const item=await uploadOne(q[i],id,i+1,q.length);remote.push(item)}
    videoQueue=[];audioQueue=[];status("Menyimpan hubungan media dengan posting…");progress(94);await saveAttachmentManifest(id);dirty=false;progress(100);render();status("Video/audio siap. Melanjutkan penerbitan berita…","ok");
    bypassSubmit=true;requestAnimationFrame(()=>{$("#ne-form")?.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))})
  }catch(e){status(`Media belum terkirim: ${e.message||e}`,"error");if(submit){submit.disabled=false;submit.textContent="Terbitkan"}progress(0)}
}

function mount(){
  const form=$("#ne-form");if(!form||$("#nea-section"))return;const actions=$(".ne-actions",form);const sec=document.createElement("section");sec.className="ne-form-section nea-section";sec.id="nea-section";
  sec.innerHTML=`<div class="ne-form-section-head nea-head"><div><span class="ne-section-kicker">04 • VIDEO & AUDIO</span><strong>Lampiran multimedia posting</strong><small>Video dan audio ikut terbit pada berita yang sama. Tidak ada GitHub token di editor.</small></div><div class="nea-counts"><span class="nea-badge" id="nea-video-count">0/5 video</span><span class="nea-badge audio" id="nea-audio-count">0 audio</span></div></div><div class="nea-upload-grid"><label class="nea-picker"><input id="nea-video" type="file" multiple><span><b>＋ Unggah video</b><small>Maksimal 5 video per posting • ekstensi video dapat dipilih langsung dari perangkat</small></span></label><label class="nea-picker audio"><input id="nea-audio" type="file" multiple><span><b>＋ Unggah MP3 / audio</b><small>Jumlah audio tidak dibatasi editor • ekstensi audio dapat dipilih langsung dari perangkat</small></span></label></div><div class="nea-server-note"><b>Upload otomatis ke server media</b><span>Tidak perlu memasukkan token atau kredensial pada halaman editor.</span></div><div class="nea-list" id="nea-list"></div><div class="nea-progress" id="nea-progress"><span></span></div><div class="nea-status" id="nea-status" aria-live="polite"></div><p class="nea-note"><b>Ringan di HP:</b> video/audio tidak dipreload pada halaman berita. Sumber media baru dipasang setelah pengunjung menekan Putar.</p>`;
  actions?.before(sec);$("#nea-video").onchange=e=>{add("video",e.target.files||[]);e.target.value=""};$("#nea-audio").onchange=e=>{add("audio",e.target.files||[]);e.target.value=""};render()
}

mount();
document.addEventListener("submit",e=>{if(e.target?.id!=="ne-form")return;if(bypassSubmit){bypassSubmit=false;return}if(!videoQueue.length&&!audioQueue.length&&!remote.length&&!dirty)return;e.preventDefault();e.stopImmediatePropagation();prepareAndContinue()},{capture:true});
document.addEventListener("click",e=>{const edit=e.target.closest?.("[data-edit]");if(edit)setTimeout(()=>loadRemote($("#ne-id")?.value||edit.dataset.edit),80);if(e.target.closest?.("#ne-reset")){videoQueue=[];audioQueue=[];remote=[];loadingId="";dirty=false;render();status("");progress(0)}},true);
const initial=$("#ne-id")?.value;if(initial)loadRemote(initial);
})();
