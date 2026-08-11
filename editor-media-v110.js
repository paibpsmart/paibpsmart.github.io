(()=>{
"use strict";
const OWNER="Sunarso29",REPO="paibp-smart",BRANCH="main";
const API=`https://api.github.com/repos/${OWNER}/${REPO}/contents/`;
const PAGES="https://sunarso29.github.io/paibp-smart/";
const MANIFEST="media-library/index.json";
const TOKEN_KEY="paibp-smart-media-github-token-session-v110";
const MAX_VIDEOS=5,MAX_BYTES=95*1024*1024;
const VIDEO_EXT=new Set(["mp4","m4v","mov","webm","ogv","ogg","avi","mkv","3gp","3g2","mpeg","mpg","mpe","ts","mts","m2ts","flv","wmv","asf","vob","rm","rmvb","divx","f4v"]);
const AUDIO_EXT=new Set(["mp3","m4a","aac","wav","wave","ogg","oga","opus","flac","wma","aiff","aif","aifc","amr","mid","midi","weba","ac3","mka","caf","au","snd"]);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid=()=>crypto?.randomUUID?.()||`media-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const extOf=n=>String(n||"").split(".").pop().toLowerCase().replace(/[^a-z0-9]+/g,"");
const slug=s=>String(s||"media").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,72)||"media";
const fmtBytes=n=>{const v=Number(n||0);if(v<1024)return`${v} B`;if(v<1048576)return`${(v/1024).toFixed(1)} KB`;if(v<1073741824)return`${(v/1048576).toFixed(1)} MB`;return`${(v/1073741824).toFixed(2)} GB`};
const classify=f=>{const mime=String(f?.type||"").toLowerCase(),ext=extOf(f?.name);if(mime.startsWith("video/")||VIDEO_EXT.has(ext))return"video";if(mime.startsWith("audio/")||AUDIO_EXT.has(ext))return"audio";return""};
const pagesUrl=path=>PAGES+String(path).split("/").map(encodeURIComponent).join("/");
const rawUrl=path=>`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${String(path).split("/").map(encodeURIComponent).join("/")}`;
let queue=[],manifest={version:1,updatedAt:"",items:[]},manifestSha="";

function authHeaders(token=""){const h={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};if(token)h.Authorization=`Bearer ${token}`;return h}
async function apiGet(path,token=""){const r=await fetch(API+path.split("/").map(encodeURIComponent).join("/"),{headers:authHeaders(token),cache:"no-store"});if(r.status===404)return null;if(!r.ok){let m=`GitHub HTTP ${r.status}`;try{const j=await r.json();m=j.message||m}catch{}throw new Error(m)}return r.json()}
async function apiWrite(path,method,body,token){if(!token)throw new Error("Masukkan token GitHub untuk mengunggah atau menghapus media.");const r=await fetch(API+path.split("/").map(encodeURIComponent).join("/"),{method,headers:{...authHeaders(token),"Content-Type":"application/json"},body:JSON.stringify(body)});if(!r.ok){let m=`GitHub HTTP ${r.status}`;try{const j=await r.json();m=j.message||m}catch{}throw new Error(m)}return r.json()}
function b64ToText(v){const bin=atob(String(v||"").replace(/\s/g,""));const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u)}
function textToB64(v){const u=new TextEncoder().encode(String(v));let bin="";for(let i=0;i<u.length;i+=0x8000)bin+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(bin)}
function fileToB64(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const s=String(fr.result||"");res(s.slice(s.indexOf(",")+1))};fr.onerror=()=>rej(fr.error||new Error("File gagal dibaca"));fr.readAsDataURL(file)})}
function token(){return sessionStorage.getItem(TOKEN_KEY)||""}
function status(m,t=""){const e=$("#nem-status");if(e){e.textContent=m||"";e.dataset.tone=t}}
function progress(v){const e=$("#nem-progress span");if(e)e.style.width=`${Math.max(0,Math.min(100,Number(v)||0))}%`}
function currentVideos(){return (manifest.items||[]).filter(x=>x.type==="video").length}
function currentAudio(){return (manifest.items||[]).filter(x=>x.type==="audio").length}

async function loadManifest(){
  const t=token();
  try{
    const j=await apiGet(MANIFEST,t);
    if(j?.content){manifest=JSON.parse(b64ToText(j.content));manifestSha=j.sha||""}
    else{manifest={version:1,updatedAt:new Date().toISOString(),items:[]};manifestSha=""}
  }catch{
    try{const r=await fetch(`${rawUrl(MANIFEST)}?_=${Date.now()}`,{cache:"no-store"});if(r.ok)manifest=await r.json()}catch{}
  }
  if(!Array.isArray(manifest.items))manifest.items=[];
  render();
}

async function saveManifest(){
  manifest.updatedAt=new Date().toISOString();
  const body={message:"Update pustaka media dari Editor PAIBP SMART",content:textToB64(JSON.stringify(manifest,null,2)),branch:BRANCH};
  if(manifestSha)body.sha=manifestSha;
  const out=await apiWrite(MANIFEST,"PUT",body,token());
  manifestSha=out?.content?.sha||manifestSha;
}

function addFiles(files){
  const incoming=[];let v=currentVideos()+queue.filter(x=>x.type==="video").length;
  for(const f of [...files]){
    const type=classify(f);
    if(!type){status(`File “${f.name}” tidak dikenali sebagai audio/video.`,"error");continue}
    if(f.size>MAX_BYTES){status(`“${f.name}” melebihi 95 MB. Ukuran ini tidak aman untuk unggahan GitHub dari HP.`,"error");continue}
    if(type==="video"&&v>=MAX_VIDEOS){status("Batas 5 unggahan video sudah tercapai.","error");continue}
    if(type==="video")v++;
    incoming.push({id:uid(),file:f,type});
  }
  queue.push(...incoming);renderQueue();renderCounters();
  if(incoming.length)status(`${incoming.length} file siap diunggah. Media belum dikirim sebelum tombol Unggah ditekan.`);
}

function renderCounters(){const v=$("#nem-video-count"),a=$("#nem-audio-count");if(v)v.textContent=`${currentVideos()}/${MAX_VIDEOS}`;if(a)a.textContent=String(currentAudio())}
function renderQueue(){const root=$("#nem-queue");if(!root)return;if(!queue.length){root.innerHTML="";return}root.innerHTML=queue.map((q,i)=>`<div class="nem-file"><span class="nem-file-icon">${q.type==="video"?"▶":"♫"}</span><span><strong>${esc(q.file.name)}</strong><small>${q.type==="video"?"Video":"Audio"} • ${fmtBytes(q.file.size)} • ${esc(q.file.type||extOf(q.file.name).toUpperCase())}</small></span><button class="nem-btn is-soft" type="button" data-nem-remove="${i}">Hapus</button></div>`).join("");$$('[data-nem-remove]',root).forEach(b=>b.onclick=()=>{queue.splice(+b.dataset.nemRemove,1);renderQueue();renderCounters()})}

function renderLibrary(){const root=$("#nem-library");if(!root)return;const arr=[...(manifest.items||[])].sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));if(!arr.length){root.innerHTML='<div class="nem-empty">Belum ada media. Unggah video atau audio dari panel di atas.</div>';return}root.innerHTML=arr.map(x=>`<article class="nem-item"><div class="nem-item-top"><span class="nem-type ${x.type==="audio"?"audio":""}">${x.type==="video"?"VIDEO":"AUDIO"}</span><small>${fmtBytes(x.size)}</small></div><h5>${esc(x.title||x.name||"Media")}</h5><p>${esc(x.ext||"").toUpperCase()} • ${esc((x.createdAt||"").slice(0,10))}</p><div class="nem-item-actions"><a href="${esc(x.url||pagesUrl(x.path))}" target="_blank" rel="noopener">Buka</a><button type="button" data-nem-copy="${esc(x.url||pagesUrl(x.path))}">Salin link</button><button type="button" class="is-danger" data-nem-delete="${esc(x.id)}">Hapus</button></div></article>`).join("");$$('[data-nem-copy]',root).forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.nemCopy);status("Link media disalin.","ok")}catch{status("Browser tidak mengizinkan salin otomatis.","error")}});$$('[data-nem-delete]',root).forEach(b=>b.onclick=()=>removeItem(b.dataset.nemDelete))}
function render(){renderCounters();renderQueue();renderLibrary()}

async function uploadQueue(){
  if(!queue.length){status("Pilih file video/audio terlebih dahulu.","error");return}
  if(!token()){status("Masukkan token GitHub pada Penyimpanan Media. Token hanya disimpan selama tab browser ini terbuka.","error");$("#nem-token")?.focus();return}
  const btn=$("#nem-upload");btn.disabled=true;progress(2);
  try{
    let done=0,total=queue.length;
    while(queue.length){
      const q=queue[0],f=q.file,type=q.type,ext=extOf(f.name)||"bin",date=new Date().toISOString().slice(0,10),safe=slug(f.name.replace(/\.[^.]+$/,""));
      const path=`media-library/files/${type}/${date}/${Date.now()}-${safe}.${ext}`;
      status(`Menyiapkan ${f.name}…`);progress(Math.max(3,Math.round(done/total*100)));
      const content=await fileToB64(f);
      status(`Mengunggah ${f.name}… Jangan tutup tab sampai selesai.`);
      const out=await apiWrite(path,"PUT",{message:`Upload ${type} ${f.name}`,content,branch:BRANCH},token());
      const item={id:q.id,type,name:f.name,title:f.name.replace(/\.[^.]+$/,"")||f.name,path,url:pagesUrl(path),rawUrl:out?.content?.download_url||rawUrl(path),size:f.size,mime:f.type||"",ext,createdAt:new Date().toISOString()};
      manifest.items.push(item);
      await saveManifest();
      queue.shift();done++;progress(Math.round(done/total*100));render();
    }
    status("Unggahan selesai. Halaman publik tetap ringan karena file media tidak dimuat sebelum tombol putar dibuka.","ok");
  }catch(e){status(`Unggahan berhenti: ${e.message||e}`,"error")}
  finally{btn.disabled=false;setTimeout(()=>progress(0),800)}
}

async function removeItem(id){
  const item=(manifest.items||[]).find(x=>String(x.id)===String(id));if(!item)return;
  if(!token()){status("Masukkan token GitHub untuk menghapus media.","error");return}
  if(!confirm(`Hapus “${item.name||item.title}” dari pustaka media?`))return;
  try{
    status("Menghapus media…");
    if(item.path){const meta=await apiGet(item.path,token());if(meta?.sha)await apiWrite(item.path,"DELETE",{message:`Hapus media ${item.name||item.id}`,sha:meta.sha,branch:BRANCH},token())}
    manifest.items=manifest.items.filter(x=>String(x.id)!==String(id));await saveManifest();render();status("Media dihapus.","ok")
  }catch(e){status(`Gagal menghapus: ${e.message||e}`,"error")}
}

async function addUrl(){
  const input=$("#nem-url"),u=String(input?.value||"").trim();if(!u){status("Masukkan URL media terlebih dahulu.","error");return}
  let url;try{url=new URL(u)}catch{status("URL media tidak valid.","error");return}
  const fake={name:url.pathname.split("/").pop()||"media",type:""},type=classify(fake)||($("#nem-url-type")?.value||"audio");
  if(type==="video"&&currentVideos()>=MAX_VIDEOS){status("Batas 5 video sudah tercapai.","error");return}
  if(!token()){status("Masukkan token GitHub agar link media tersimpan permanen di pustaka.","error");return}
  const ext=extOf(fake.name);manifest.items.push({id:uid(),type,name:fake.name,title:fake.name.replace(/\.[^.]+$/,"")||fake.name,path:"",url:u,rawUrl:u,size:0,mime:"",ext,createdAt:new Date().toISOString(),external:true});
  try{await saveManifest();input.value="";render();status("Link media disimpan.","ok")}catch(e){manifest.items.pop();status(`Gagal menyimpan link: ${e.message||e}`,"error")}
}

function mount(){
  const root=$("#ne-media-app");if(!root)return;
  root.className="ne-media-app";
  root.innerHTML=`<section class="nem-hero"><div><span class="nem-kicker">PUSTAKA MEDIA • MOBILE FIRST</span><h3>Video & Audio</h3><p>Video dibatasi 5 unggahan. Audio/MP3 tidak dibatasi jumlahnya. File tidak dimuat di halaman publik sampai pengunjung memilih untuk memutar.</p></div><div class="nem-counters"><div class="nem-counter"><strong id="nem-video-count">0/5</strong><span>VIDEO</span></div><div class="nem-counter"><strong id="nem-audio-count">0</strong><span>AUDIO</span></div></div></section>
  <div class="nem-grid"><div class="nem-card"><h4>Unggah file</h4><p>Pilih video atau lagu dari HP/komputer. Semua ekstensi video/audio umum diterima; kemampuan memutar tetap mengikuti codec yang didukung browser.</p><label class="nem-drop" id="nem-drop"><input id="nem-file" type="file" multiple><span><b>＋ Pilih video / audio</b><small>Video maksimal 5 file total • audio tanpa batas jumlah • maksimal teknis 95 MB per file • media tidak dipreload</small></span></label><div class="nem-queue" id="nem-queue"></div><div class="nem-upload-actions"><button class="nem-btn is-soft" id="nem-clear" type="button">Kosongkan antrean</button><button class="nem-btn" id="nem-upload" type="button">Unggah media</button></div><div class="nem-progress" id="nem-progress"><span></span></div><div class="nem-status" id="nem-status" aria-live="polite"></div></div>
  <div class="nem-card"><h4>Penyimpanan media</h4><p>File disimpan ke repository PAIBP SMART sehingga memiliki URL publik tetap. Token tidak ditulis ke repository dan hanya disimpan pada sesi tab ini.</p><div class="nem-token"><input id="nem-token" type="password" autocomplete="off" spellcheck="false" placeholder="GitHub fine-grained token • Contents: Read and write"><button class="nem-btn" id="nem-connect" type="button">Hubungkan</button></div><small class="nem-token-note">Gunakan token khusus repository <b>paibp-smart</b>, izin Contents: Read and write. Tutup tab untuk menghapus token dari sessionStorage.</small><div class="nem-url-row"><input id="nem-url" type="url" inputmode="url" placeholder="Atau tempel URL media yang sudah dihosting"><select id="nem-url-type" aria-label="Jenis media"><option value="audio">Audio</option><option value="video">Video</option></select><button class="nem-btn is-soft" id="nem-add-url" type="button">Simpan link</button></div></div></div>
  <section class="nem-card"><div class="nem-library-head"><div><h4>Pustaka media</h4><p style="margin:3px 0 0;color:#74889a;font-size:10px">Player publik memakai load-on-demand agar beranda dan layar kecil tetap ringan.</p></div><a class="nem-public-link" href="media-library.html?v=110" target="_blank" rel="noopener">Buka Pustaka Publik →</a></div><div class="nem-library" id="nem-library"></div></section>`;
  const ti=$("#nem-token");if(ti)ti.value=token();
  $("#nem-connect").onclick=async()=>{const v=String(ti.value||"").trim();if(!v){sessionStorage.removeItem(TOKEN_KEY);status("Token sesi dihapus.");return}sessionStorage.setItem(TOKEN_KEY,v);status("Memeriksa akses repository…");try{const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`,{headers:authHeaders(v),cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);status("Penyimpanan GitHub terhubung untuk sesi ini.","ok");await loadManifest()}catch(e){sessionStorage.removeItem(TOKEN_KEY);status(`Token tidak dapat digunakan: ${e.message||e}`,"error")}};
  const inp=$("#nem-file"),drop=$("#nem-drop");inp.onchange=e=>{addFiles(e.target.files||[]);e.target.value=""};["dragenter","dragover"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add("is-drag")}));["dragleave","drop"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove("is-drag")}));drop.addEventListener("drop",e=>addFiles(e.dataTransfer?.files||[]));
  $("#nem-clear").onclick=()=>{queue=[];renderQueue();renderCounters();status("Antrean dikosongkan.")};$("#nem-upload").onclick=uploadQueue;$("#nem-add-url").onclick=addUrl;
  loadManifest();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
