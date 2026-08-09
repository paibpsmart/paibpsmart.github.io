(() => {
  "use strict";
  const GAS_ENDPOINT="https://script.google.com/macros/s/AKfycbyRxOw6oWDZUuQxwuqOMRO92KOwqOGF_9J6rPzSfxr9Dqy9kAQGJ9qZA6Tm_deUOgtjKg/exec";
  const READ_KEY="b082937b2165453ba7d9f81ecac063b00310b339ec0643da";
  const DB_NAME="paibp-smart-news-editor-v96";
  const STORE="posts";
  const MAX_PHOTOS=10;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const uid=()=>crypto?.randomUUID?.()||`news-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const slug=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90)||`berita-${Date.now()}`;
  let photos=[];
  let remote=[];
  let remoteContent={};
  let pendingPublish=null;

  function db(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:"id"})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
  async function allLocal(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,"readonly"),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
  async function putLocal(item){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,"readwrite");tx.objectStore(STORE).put(item);tx.oncomplete=()=>resolve(item);tx.onerror=()=>reject(tx.error)})}
  async function delLocal(id){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}

  function status(msg,tone=""){$("#ne-form-status").textContent=msg||"";$("#ne-form-status").dataset.tone=tone}
  function photoStatus(msg,tone=""){$("#ne-photo-info").textContent=msg||"";$("#ne-photo-info").dataset.tone=tone}
  function formatDate(v){if(!v)return"—";try{return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${v}T12:00:00`))}catch{return v}}
  function switchTab(name){$$('[data-ne-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.neTab===name));$$('[data-ne-panel]').forEach(p=>p.classList.toggle('is-active',p.dataset.nePanel===name));if(name!=="write")refreshLists()}
  $$('[data-ne-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.neTab)));

  async function compress(file,maxW=1440,quality=.78){
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,maxW/bitmap.width);
    const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d",{alpha:false}).drawImage(bitmap,0,0,w,h);bitmap.close?.();
    const blob=await new Promise(r=>c.toBlob(r,"image/webp",quality));
    return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(fr.error);fr.readAsDataURL(blob)});
  }

  async function addFiles(files){
    const room=MAX_PHOTOS-photos.length;if(room<=0){photoStatus("Maksimal 10 foto untuk satu berita.","error");return}
    const selected=[...files].slice(0,room);if(files.length>room)photoStatus(`Maksimal 10 foto. ${selected.length} foto pertama diproses.`,"error");
    for(let i=0;i<selected.length;i++){
      const f=selected[i];photoStatus(`Mengoptimalkan foto ${i+1} dari ${selected.length}…`);
      try{const full=await compress(f,1440,.78),thumb=await compress(f,560,.70);photos.push({id:uid(),name:f.name,full,thumb});renderPhotos();previewCard()}catch{photoStatus(`Foto ${f.name} gagal diproses.`,"error")}
    }
    photoStatus(`${photos.length} dari 10 foto siap. Foto pertama menjadi sampul.`);
  }

  function renderPhotos(){
    const root=$("#ne-media-grid"),count=$("#ne-photo-count");if(count)count.textContent=`${photos.length}/10 foto`;
    if(!photos.length){root.innerHTML='<div class="ne-media-empty"><div><strong>Belum ada foto</strong><br><small>Pilih hingga 10 foto. Foto pertama otomatis menjadi sampul.</small></div></div>';return}
    root.innerHTML=photos.map((p,i)=>`<article class="ne-photo-card ${i===0?'is-cover':''}"><span class="ne-photo-badge">${i===0?'SAMPUL':`FOTO ${i+1}`}</span><img src="${esc(p.thumb||p.full)}" alt="Pratinjau foto ${i+1}"><footer><span class="ne-photo-name">${esc(p.name||`Foto ${i+1}`)}</span><div class="ne-photo-actions"><button type="button" data-photo-left="${i}" aria-label="Geser ke kiri">←</button><button type="button" data-photo-right="${i}" aria-label="Geser ke kanan">→</button><button type="button" class="is-cover-btn" data-photo-cover="${i}">${i===0?'Sampul aktif':'Jadikan sampul'}</button><button type="button" class="is-danger" data-photo-remove="${i}" aria-label="Hapus foto">×</button></div></footer></article>`).join("");
    $$('[data-photo-left]',root).forEach(b=>b.onclick=()=>movePhoto(Number(b.dataset.photoLeft),-1));$$('[data-photo-right]',root).forEach(b=>b.onclick=()=>movePhoto(Number(b.dataset.photoRight),1));$$('[data-photo-cover]',root).forEach(b=>b.onclick=()=>makeCover(Number(b.dataset.photoCover)));$$('[data-photo-remove]',root).forEach(b=>b.onclick=()=>removePhoto(Number(b.dataset.photoRemove)));
  }
  function movePhoto(index,delta){const next=index+delta;if(next<0||next>=photos.length)return;[photos[index],photos[next]]=[photos[next],photos[index]];renderPhotos();previewCard()}
  function makeCover(index){if(index<=0||index>=photos.length)return;const[x]=photos.splice(index,1);photos.unshift(x);renderPhotos();previewCard()}
  function removePhoto(index){photos.splice(index,1);renderPhotos();previewCard();photoStatus(`${photos.length} dari 10 foto siap.`)}
  $("#ne-photo").addEventListener("change",async e=>{await addFiles(e.target.files||[]);e.target.value=""});

  function previewCard(){
    const title=$("#ne-title").value.trim()||"Judul berita akan tampil di sini",summary=$("#ne-summary").value.trim()||"Ringkasan berita akan muncul otomatis ketika Anda mengetik.",cat=$("#ne-category").value,date=$("#ne-date").value;
    $("#ne-preview-title").textContent=title;$("#ne-preview-summary").textContent=summary;$("#ne-preview-category").textContent=cat;$("#ne-preview-date").textContent=formatDate(date);
    const media=$("#ne-preview-media");media.style.backgroundImage=photos[0]?.thumb?`url(${photos[0].thumb})`:"";media.innerHTML=photos[0]?.thumb?"":"<span>SPENSUS</span>";
    const mini=$("#ne-mini-gallery");mini.innerHTML=photos.slice(1,5).map(p=>`<img src="${esc(p.thumb||p.full)}" alt="Foto tambahan">`).join("");mini.hidden=photos.length<2;
  }
  ["#ne-title","#ne-summary","#ne-category","#ne-date","#ne-content"].forEach(s=>$(s).addEventListener("input",previewCard));
  $("#ne-date").value=new Date().toISOString().slice(0,10);renderPhotos();previewCard();

  function formItem(statusName="draft"){
    const id=$("#ne-id").value||uid(),title=$("#ne-title").value.trim(),summary=$("#ne-summary").value.trim(),content=$("#ne-content").value.trim(),date=$("#ne-date").value,category=$("#ne-category").value;
    if(!title||!summary||!content||!date)throw new Error("Judul, tanggal, ringkasan, dan isi berita wajib diisi.");if(!photos.length)throw new Error("Tambahkan minimal satu foto sebelum pratinjau dan publikasi.");
    const now=new Date().toISOString();return{id,slug:slug(title),title,summary,content,date,category,year:Number(date.slice(0,4)),month:Number(date.slice(5,7)),thumbnail:photos[0].thumb||photos[0].full,media:photos.map((p,i)=>({src:p.full,thumbnail:p.thumb||p.full,name:p.name,order:i+1,cover:i===0})),status:statusName,author:"Sunarso, S.Pd.I, Gr",updatedAt:now,createdAt:now};
  }

  async function saveDraft(){try{const item=formItem("draft"),old=(await allLocal()).find(x=>x.id===item.id);if(old)item.createdAt=old.createdAt;await putLocal(item);$("#ne-id").value=item.id;$("#ne-editor-status").textContent="Draft tersimpan";status("Draft tersimpan aman di perangkat ini.","ok");refreshLists()}catch(e){status(e.message||"Draft gagal disimpan.","error")}}
  $("#ne-save-draft").addEventListener("click",saveDraft);

  function articleGalleryHtml(item){
    const list=item.media||[];if(!list.length)return"";const lead=list.slice(0,3),rest=list.slice(3),cls=list.length===1?"count-1":list.length===2?"count-2":list.length===3?"count-3":"count-many";
    return `<div class="ne-gallery-layout ${cls}">${lead.map((p,i)=>`<figure><img src="${esc(p.src||p.thumbnail)}" alt="${esc(item.title)} — foto ${i+1}"></figure>`).join("")}</div>${rest.length?`<div class="ne-gallery-rest">${rest.map((p,i)=>`<figure><img src="${esc(p.src||p.thumbnail)}" alt="${esc(item.title)} — foto ${i+4}"><span>${i+4}</span></figure>`).join("")}</div>`:""}`;
  }
  function contentHtml(text){return String(text||"").split(/\n\s*\n|\n/).map(x=>x.trim()).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join("")}
  function openPreview(){let item;try{item=formItem("preview")}catch(e){status(e.message,"error");return}pendingPublish=item;$("#ne-article-preview").innerHTML=`<article class="ne-article-preview"><header class="ne-article-hero"><div class="ne-article-meta"><span>${esc(item.category)}</span><time>${esc(formatDate(item.date))}</time><span>${item.media.length} foto</span></div><h1>${esc(item.title)}</h1><p class="ne-article-lead">${esc(item.summary)}</p></header><section class="ne-article-gallery">${articleGalleryHtml(item)}</section><section class="ne-article-content">${contentHtml(item.content)}</section></article>`;$("#ne-preview-modal").hidden=false;document.body.style.overflow="hidden";status("Pratinjau dibuka. Periksa isi dan seluruh foto sebelum menekan Terbitkan Sekarang.","ok")}
  function closePreview(){$("#ne-preview-modal").hidden=true;document.body.style.overflow="";pendingPublish=null}
  $("#ne-open-preview").addEventListener("click",openPreview);$("#ne-form").addEventListener("submit",e=>{e.preventDefault();openPreview()});$$('[data-ne-close-preview]').forEach(b=>b.addEventListener('click',closePreview));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$("#ne-preview-modal").hidden)closePreview()});

  async function gasPost(action,data,timeout=30000){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
    try{
      const r=await fetch(GAS_ENDPOINT,{method:"POST",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},body:JSON.stringify({app:"paibp-smart",version:"99",action,readKey:READ_KEY,key:READ_KEY,data:{...data,readKey:READ_KEY},origin:location.origin}),signal:ctl.signal});
      const text=await r.text();let j={};try{j=JSON.parse(text)}catch{throw new Error("Respons server berita tidak dapat dibaca.")}
      if(!r.ok||j.ok!==true)throw new Error(j.error||j.message||`Server HTTP ${r.status}`);return j;
    }catch(e){if(e?.name==='AbortError')throw new Error("Server berita tidak merespons dalam 30 detik.");throw e}finally{clearTimeout(timer)}
  }

  async function publishToGas(item,progress){
    const mediaUrls=new Array(item.media.length);const order=[...item.media.keys()].filter(i=>i!==0).concat(0);
    for(let step=0;step<order.length;step++){
      const i=order[step],p=item.media[i];progress(`Mengunggah foto ${step+1} dari ${order.length}…`);
      const r=await gasPost("newsUpsert",{id:item.id,title:item.title,date:item.date,summary:item.summary,imageDataUrl:p.src,authorName:item.author,authorSchool:"SMP Negeri 1 Susukan",isPublished:false,sortOrder:Date.now()});
      mediaUrls[i]=r?.result?.imageUrl||"";if(!mediaUrls[i])throw new Error(`URL foto ${i+1} tidak diterima dari server.`);
    }
    progress("Menyimpan naskah dan galeri…");
    await gasPost("contentUpsert",{key:`news:${item.id}`,value:{id:item.id,slug:item.slug,title:item.title,date:item.date,category:item.category,summary:item.summary,content:item.content,media:mediaUrls,coverUrl:mediaUrls[0],year:item.year,month:item.month,author:item.author},authorName:item.author,authorSchool:"SMP Negeri 1 Susukan"});
    progress("Finalisasi publikasi…");
    const final=await gasPost("newsUpsert",{id:item.id,title:item.title,date:item.date,summary:item.summary,imageUrl:mediaUrls[0],authorName:item.author,authorSchool:"SMP Negeri 1 Susukan",isPublished:true,sortOrder:Date.now()});
    return{...item,status:"published",publishedAt:final.time||new Date().toISOString(),serverId:item.id,publicUrl:"",thumbnail:mediaUrls[0],media:mediaUrls.map((url,i)=>({src:url,thumbnail:url,name:item.media[i]?.name||`Foto ${i+1}`,order:i+1,cover:i===0}))};
  }

  async function gasSnapshot(){
    try{const u=new URL(GAS_ENDPOINT);u.searchParams.set("action","publicSnapshot");u.searchParams.set("_",Date.now());const r=await fetch(u,{cache:"no-store"});const j=await r.json();if(j.ok!==true)return{items:[],content:{}};const content=j.content||{};const items=(j.news||[]).map(n=>{const extra=content[`news:${n.id}`]||{};const urls=Array.isArray(extra.media)&&extra.media.length?extra.media:(n.imageUrl?[n.imageUrl]:[]);return{id:n.id,slug:extra.slug||slug(n.title),title:n.title,date:n.date,summary:n.summary,content:extra.content||n.summary||"",category:extra.category||"Berita Sekolah",year:Number(extra.year||String(n.date||"").slice(0,4)),month:Number(extra.month||String(n.date||"").slice(5,7)),thumbnail:extra.coverUrl||n.imageUrl||urls[0]||"",media:urls.map((url,i)=>({src:url,thumbnail:url,name:`Foto ${i+1}`,order:i+1,cover:i===0})),status:"published",publishedAt:n.updatedAt||n.date,updatedAt:n.updatedAt||n.date,author:n.authorName||"Sunarso, S.Pd.I, Gr"}});return{items,content}}catch{return{items:[],content:{}}}
  }

  $("#ne-publish-confirm").addEventListener("click",async()=>{
    if(!pendingPublish)return;const button=$("#ne-publish-confirm");button.disabled=true;button.textContent="Menyiapkan…";let item={...pendingPublish,status:"pending"};
    try{const old=(await allLocal()).find(x=>x.id===item.id);if(old)item.createdAt=old.createdAt;await putLocal(item);const published=await publishToGas(item,msg=>{button.textContent=msg;status(msg)});await putLocal(published);$("#ne-id").value=published.id;$("#ne-editor-status").textContent="Tayang";status(`Berita tayang dengan ${published.media.length} foto dan tersimpan ke arsip ${published.year}.`,"ok");$("#ne-preview-modal").hidden=true;document.body.style.overflow="";pendingPublish=null;const snap=await gasSnapshot();remote=snap.items;remoteContent=snap.content;refreshLists()}
    catch(err){item.status="draft";await putLocal(item);$("#ne-editor-status").textContent="Draft";status(`Publikasi belum selesai: ${err.message||"Server bermasalah."} Draft tetap aman.`,"error");$("#ne-preview-modal").hidden=true;document.body.style.overflow="";pendingPublish=null}
    finally{button.disabled=false;button.textContent="Terbitkan Sekarang"}
  });

  function resetForm(){$("#ne-form").reset();$("#ne-id").value="";$("#ne-date").value=new Date().toISOString().slice(0,10);photos=[];renderPhotos();photoStatus("Belum ada foto dipilih. Maksimal 10 foto.");$("#ne-editor-status").textContent="Draft baru";status("");previewCard()}
  $("#ne-reset").addEventListener("click",resetForm);

  function normalizeStoredMedia(x){if(Array.isArray(x?.media)&&x.media.length)return x.media.slice(0,MAX_PHOTOS).map((m,i)=>({id:uid(),name:m.name||`Foto ${i+1}`,full:m.src||m.full||"",thumb:m.thumbnail||m.thumb||m.src||""})).filter(p=>p.full||p.thumb);if(x?.thumbnail)return[{id:uid(),name:"Foto sampul",full:x.thumbnail,thumb:x.thumbnail}];return[]}
  function mergeItems(local){const map=new Map();[...remote,...local].forEach(x=>{if(x?.id)map.set(x.id,{...map.get(x.id),...x})});return[...map.values()].sort((a,b)=>String(b.publishedAt||b.updatedAt||b.date).localeCompare(String(a.publishedAt||a.updatedAt||a.date)))}
  async function refreshLists(){const local=await allLocal();if(!remote.length){const snap=await gasSnapshot();remote=snap.items;remoteContent=snap.content}const items=mergeItems(local);renderFilters(items);renderPosts(items);renderArchive(items)}
  function renderFilters(items){const years=[...new Set(items.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a),cats=[...new Set(items.map(x=>x.category).filter(Boolean))].sort();const y=$("#ne-filter-year"),c=$("#ne-filter-category"),yv=y.value,cv=c.value;y.innerHTML='<option value="">Semua tahun</option>'+years.map(v=>`<option>${v}</option>`).join("");c.innerHTML='<option value="">Semua kategori</option>'+cats.map(v=>`<option>${esc(v)}</option>`).join("");y.value=yv;c.value=cv}
  function filtered(items){const q=$("#ne-search").value.toLowerCase().trim(),y=$("#ne-filter-year").value,c=$("#ne-filter-category").value;return items.filter(x=>(!q||String(x.title).toLowerCase().includes(q))&&(!y||String(x.year)===y)&&(!c||x.category===c))}
  function renderPosts(items){const list=$("#ne-post-list"),rows=filtered(items);if(!rows.length){list.innerHTML='<div class="ne-empty">Belum ada posting yang sesuai.</div>';return}list.innerHTML=rows.map(x=>`<article class="ne-post"><div class="ne-post-thumb"${x.thumbnail?` style="background-image:url('${esc(x.thumbnail)}')"`:""}></div><div><h3>${esc(x.title)}</h3><p>${esc(x.summary||"")}</p><div class="ne-post-meta"><span>${esc(x.category||"")}</span><span>${esc(formatDate(x.date))}</span><span>${x.status==="published"?"Tayang":x.status==="pending"?"Menunggu":"Draft"}</span><span>${Array.isArray(x.media)?x.media.length:0} foto</span></div></div><div class="ne-post-actions"><button class="ne-edit" data-edit="${esc(x.id)}">Edit</button><button class="ne-delete" data-delete="${esc(x.id)}">Hapus</button></div></article>`).join("");$$('[data-edit]',list).forEach(b=>b.onclick=()=>editItem(items.find(x=>x.id===b.dataset.edit)));$$('[data-delete]',list).forEach(b=>b.onclick=()=>deleteItem(items.find(x=>x.id===b.dataset.delete)))}
  function renderArchive(items){const root=$("#ne-archive"),years=[...new Set(items.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a);root.innerHTML=years.length?years.map(y=>{const arr=items.filter(x=>x.year===y),pub=arr.filter(x=>x.status==="published").length;return`<article class="ne-year"><strong>${y}</strong><span>${arr.length} berita/draft</span><b>${pub} tayang</b></article>`}).join(""):'<div class="ne-empty">Arsip akan terbentuk otomatis setelah ada berita.</div>'}
  async function editItem(x){if(!x)return;$("#ne-id").value=x.id;$("#ne-title").value=x.title||"";$("#ne-date").value=x.date||new Date().toISOString().slice(0,10);$("#ne-category").value=x.category||"Berita Sekolah";$("#ne-summary").value=x.summary||"";$("#ne-content").value=x.content||"";photos=normalizeStoredMedia(x);renderPhotos();photoStatus(`${photos.length} dari 10 foto dimuat.`);$("#ne-editor-status").textContent=x.status==="published"?"Tayang":"Draft";previewCard();switchTab("write");scrollTo({top:0,behavior:"smooth"})}
  async function deleteItem(x){if(!x||!confirm(`Hapus “${x.title}”?`))return;if(x.status==="published"){try{await gasPost("newsDelete",{id:x.id})}catch(e){alert(`Server belum mengonfirmasi penghapusan: ${e.message}`);return}}await delLocal(x.id);remote=remote.filter(r=>r.id!==x.id);refreshLists()}
  $("#ne-refresh").addEventListener("click",async()=>{const snap=await gasSnapshot();remote=snap.items;remoteContent=snap.content;refreshLists()});["#ne-search","#ne-filter-year","#ne-filter-category"].forEach(s=>$(s).addEventListener("input",refreshLists));
  refreshLists();
})();