(() => {
  "use strict";
  const SYNC_ENDPOINT="https://paibp-smart-api.sunarso29.workers.dev";
  const SYNC_KEY="b082937b2165453ba7d9f81ecac063b00310b339ec0643da";
  const DB_NAME="paibp-smart-news-editor-v96";
  const STORE="posts";
  const MAX_PHOTOS=10;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const uid=()=>crypto?.randomUUID?.()||`news-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const slug=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90)||`berita-${Date.now()}`;
  let photos=[];

  function db(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:"id"})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
  async function allLocal(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,"readonly"),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
  async function putLocal(item){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,"readwrite");tx.objectStore(STORE).put(item);tx.oncomplete=()=>resolve(item);tx.onerror=()=>reject(tx.error)})}
  async function delLocal(id){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}

  function status(msg,tone=""){$("#ne-form-status").textContent=msg||"";$("#ne-form-status").dataset.tone=tone}
  function photoStatus(msg,tone=""){$("#ne-photo-info").textContent=msg||"";$("#ne-photo-info").dataset.tone=tone}
  function formatDate(v){if(!v)return"—";try{return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${v}T12:00:00`))}catch{return v}}
  function switchTab(name){$$('[data-ne-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.neTab===name));$$('[data-ne-panel]').forEach(p=>p.classList.toggle('is-active',p.dataset.nePanel===name));if(name!=="write")refreshLists()}
  $$('[data-ne-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.neTab)));

  async function compress(file,maxW=1280,quality=.74){
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,maxW/bitmap.width),w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d",{alpha:false}).drawImage(bitmap,0,0,w,h);bitmap.close?.();
    const blob=await new Promise(r=>c.toBlob(r,"image/webp",quality));
    return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(fr.error);fr.readAsDataURL(blob)});
  }

  async function addFiles(files){
    const room=MAX_PHOTOS-photos.length;if(room<=0){photoStatus("Maksimal 10 foto untuk satu berita.","error");return}
    const selected=[...files].slice(0,room);
    for(let i=0;i<selected.length;i++){
      const f=selected[i];photoStatus(`Mengoptimalkan foto ${i+1} dari ${selected.length}…`);
      try{const full=await compress(f,1280,.74),thumb=await compress(f,480,.67);photos.push({id:uid(),name:f.name,full,thumb});renderPhotos();previewCard()}catch{photoStatus(`Foto ${f.name} gagal diproses.`,"error")}
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

  function formItem(state="draft"){
    const id=$("#ne-id").value||uid(),title=$("#ne-title").value.trim(),summary=$("#ne-summary").value.trim(),content=$("#ne-content").value.trim(),date=$("#ne-date").value,category=$("#ne-category").value;
    if(!title||!summary||!content||!date)throw new Error("Judul, tanggal, ringkasan, dan isi berita wajib diisi.");if(!photos.length)throw new Error("Tambahkan minimal satu foto.");
    const now=new Date().toISOString();return{id,slug:slug(title),title,summary,content,date,category,year:Number(date.slice(0,4)),month:Number(date.slice(5,7)),thumbnail:photos[0].thumb||photos[0].full,images:photos.map(p=>p.full),media:photos.map((p,i)=>({src:p.full,thumbnail:p.thumb||p.full,name:p.name,order:i+1,cover:i===0})),status:state,author:"Sunarso, S.Pd.I, Gr",updatedAt:now,createdAt:now};
  }

  async function saveDraft(){try{const item=formItem("draft"),old=(await allLocal()).find(x=>x.id===item.id);if(old)item.createdAt=old.createdAt;await putLocal(item);$("#ne-id").value=item.id;$("#ne-editor-status").textContent="Draft tersimpan";status("Draft tersimpan di perangkat.","ok");refreshLists()}catch(e){status(e.message||"Draft gagal disimpan.","error")}}
  $("#ne-save-draft").addEventListener("click",saveDraft);

  async function sendLegacyGallery(item){
    const body={type:"gallery",action:"save",key:SYNC_KEY,readKey:SYNC_KEY,item:{id:item.id,title:item.title,date:item.date,summary:item.summary,content:item.content,category:item.category,images:item.images.slice(0,10),image:item.images[0],authorName:item.author,authorSchool:"SMP Negeri 1 Susukan",isPublished:true,updatedAt:item.updatedAt},data:{id:item.id,title:item.title,date:item.date,summary:item.summary,content:item.content,category:item.category,images:item.images.slice(0,10),image:item.images[0],imageDataUrl:item.images[0],authorName:item.author,authorSchool:"SMP Negeri 1 Susukan",isPublished:true,updatedAt:item.updatedAt}};
    await fetch(SYNC_ENDPOINT,{method:"POST",mode:"no-cors",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(body)});
    return true;
  }

  async function verifyGallery(id){
    for(const delay of [450,900,1600]){
      await new Promise(r=>setTimeout(r,delay));
      try{const u=new URL(SYNC_ENDPOINT);u.searchParams.set("action","gallery");u.searchParams.set("key",SYNC_KEY);u.searchParams.set("_",Date.now());const r=await fetch(u,{cache:"no-store"});const j=await r.json();const list=j.gallery||j.items||j.news||j.result?.gallery||[];if(Array.isArray(list)&&list.some(x=>String(x.id)===String(id)))return true}catch{}
    }
    return false;
  }

  async function publishDirect(){
    let item;try{item=formItem("pending")}catch(e){status(e.message,"error");return}
    const button=$("#ne-publish-direct");button.disabled=true;button.textContent="Mengirim…";status("Mengirim berita dan foto…");
    try{
      const old=(await allLocal()).find(x=>x.id===item.id);if(old)item.createdAt=old.createdAt;await putLocal(item);await sendLegacyGallery(item);
      item.status="published";item.publishedAt=new Date().toISOString();await putLocal(item);$("#ne-id").value=item.id;$("#ne-editor-status").textContent="Terkirim";status(`Berita dan ${item.images.length} foto sudah dikirim.`,"ok");
      verifyGallery(item.id).then(async ok=>{if(ok){item.status="published";await putLocal(item);$("#ne-editor-status").textContent="Tayang";status(`Berita tayang dengan ${item.images.length} foto dan masuk arsip ${item.year}.`,"ok")}refreshLists()});
      refreshLists();
    }catch(e){item.status="draft";await putLocal(item);$("#ne-editor-status").textContent="Draft";status("Pengiriman belum berhasil. Draft tetap aman; coba Terbitkan lagi.","error")}
    finally{button.disabled=false;button.textContent="Terbitkan"}
  }
  $("#ne-publish-direct").addEventListener("click",publishDirect);$("#ne-form").addEventListener("submit",e=>{e.preventDefault();publishDirect()});

  function resetForm(){$("#ne-form").reset();$("#ne-id").value="";$("#ne-date").value=new Date().toISOString().slice(0,10);photos=[];renderPhotos();photoStatus("Belum ada foto dipilih. Maksimal 10 foto.");$("#ne-editor-status").textContent="Draft baru";status("");previewCard()}
  $("#ne-reset").addEventListener("click",resetForm);

  function normalizeMedia(x){if(Array.isArray(x?.media)&&x.media.length)return x.media.slice(0,10).map((m,i)=>({id:uid(),name:m.name||`Foto ${i+1}`,full:m.src||m.full||"",thumb:m.thumbnail||m.thumb||m.src||""})).filter(p=>p.full||p.thumb);if(Array.isArray(x?.images))return x.images.slice(0,10).map((src,i)=>({id:uid(),name:`Foto ${i+1}`,full:src,thumb:src}));if(x?.thumbnail)return[{id:uid(),name:"Foto sampul",full:x.thumbnail,thumb:x.thumbnail}];return[]}
  async function refreshLists(){const items=(await allLocal()).sort((a,b)=>String(b.publishedAt||b.updatedAt||b.date).localeCompare(String(a.publishedAt||a.updatedAt||a.date)));renderFilters(items);renderPosts(items);renderArchive(items)}
  function renderFilters(items){const years=[...new Set(items.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a),cats=[...new Set(items.map(x=>x.category).filter(Boolean))].sort();const y=$("#ne-filter-year"),c=$("#ne-filter-category"),yv=y.value,cv=c.value;y.innerHTML='<option value="">Semua tahun</option>'+years.map(v=>`<option>${v}</option>`).join("");c.innerHTML='<option value="">Semua kategori</option>'+cats.map(v=>`<option>${esc(v)}</option>`).join("");y.value=yv;c.value=cv}
  function filtered(items){const q=$("#ne-search").value.toLowerCase().trim(),y=$("#ne-filter-year").value,c=$("#ne-filter-category").value;return items.filter(x=>(!q||String(x.title).toLowerCase().includes(q))&&(!y||String(x.year)===y)&&(!c||x.category===c))}
  function renderPosts(items){const list=$("#ne-post-list"),rows=filtered(items);if(!rows.length){list.innerHTML='<div class="ne-empty">Belum ada posting yang sesuai.</div>';return}list.innerHTML=rows.map(x=>`<article class="ne-post"><div class="ne-post-thumb"${x.thumbnail?` style="background-image:url('${esc(x.thumbnail)}')"`:""}></div><div><h3>${esc(x.title)}</h3><p>${esc(x.summary||"")}</p><div class="ne-post-meta"><span>${esc(x.category||"")}</span><span>${esc(formatDate(x.date))}</span><span>${x.status==="published"?"Tayang/Terkirim":x.status==="pending"?"Mengirim":"Draft"}</span><span>${Array.isArray(x.images)?x.images.length:Array.isArray(x.media)?x.media.length:0} foto</span></div></div><div class="ne-post-actions"><button class="ne-edit" data-edit="${esc(x.id)}">Edit</button><button class="ne-delete" data-delete="${esc(x.id)}">Hapus</button></div></article>`).join("");$$('[data-edit]',list).forEach(b=>b.onclick=()=>editItem(items.find(x=>x.id===b.dataset.edit)));$$('[data-delete]',list).forEach(b=>b.onclick=()=>deleteItem(items.find(x=>x.id===b.dataset.delete)))}
  function renderArchive(items){const root=$("#ne-archive"),years=[...new Set(items.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a);root.innerHTML=years.length?years.map(y=>{const arr=items.filter(x=>x.year===y),pub=arr.filter(x=>x.status==="published").length;return`<article class="ne-year"><strong>${y}</strong><span>${arr.length} berita/draft</span><b>${pub} terbit</b></article>`}).join(""):'<div class="ne-empty">Arsip akan terbentuk otomatis setelah ada berita.</div>'}
  async function editItem(x){if(!x)return;$("#ne-id").value=x.id;$("#ne-title").value=x.title||"";$("#ne-date").value=x.date||new Date().toISOString().slice(0,10);$("#ne-category").value=x.category||"Berita Sekolah";$("#ne-summary").value=x.summary||"";$("#ne-content").value=x.content||"";photos=normalizeMedia(x);renderPhotos();photoStatus(`${photos.length} dari 10 foto dimuat.`);$("#ne-editor-status").textContent=x.status==="published"?"Tayang/Terkirim":"Draft";previewCard();switchTab("write");scrollTo({top:0,behavior:"smooth"})}
  async function deleteItem(x){if(!x||!confirm(`Hapus “${x.title}”?`))return;try{await fetch(SYNC_ENDPOINT,{method:"POST",mode:"no-cors",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({type:"gallery",action:"delete",key:SYNC_KEY,readKey:SYNC_KEY,item:{id:x.id},data:{id:x.id}})})}catch{}await delLocal(x.id);refreshLists()}
  $("#ne-refresh").addEventListener("click",refreshLists);["#ne-search","#ne-filter-year","#ne-filter-category"].forEach(s=>$(s).addEventListener("input",refreshLists));

  $("#ne-date").value=new Date().toISOString().slice(0,10);renderPhotos();previewCard();refreshLists();
})();