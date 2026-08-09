(() => {
  "use strict";
  const GAS="https://script.google.com/macros/s/AKfycbyRxOw6oWDZUuQxwuqOMRO92KOwqOGF_9J6rPzSfxr9Dqy9kAQGJ9qZA6Tm_deUOgtjKg/exec";
  const PROXY="https://paibp-smart-api.sunarso29.workers.dev";
  const KEY="b082937b2165453ba7d9f81ecac063b00310b339ec0643da";
  const DB_NAME="paibp-smart-news-editor-v96", STORE="posts", MAX_PHOTOS=10;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const uid=()=>crypto?.randomUUID?.()||`news-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let photos=[];

  function db(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:"id"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function allLocal(){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(STORE,"readonly"),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
  async function putLocal(x){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(STORE,"readwrite");tx.objectStore(STORE).put(x);tx.oncomplete=()=>res(x);tx.onerror=()=>rej(tx.error)})}
  async function delLocal(id){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}

  function status(m,t=""){const e=$("#ne-form-status");if(e){e.textContent=m||"";e.dataset.tone=t}}
  function photoStatus(m,t=""){const e=$("#ne-photo-info");if(e){e.textContent=m||"";e.dataset.tone=t}}
  function dateText(v){if(!v)return"—";try{return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${v}T12:00:00`))}catch{return v}}

  function jsonpSnapshot(){return new Promise((resolve,reject)=>{
    const cb=`__news102_${Date.now()}_${Math.random().toString(36).slice(2)}`,s=document.createElement("script");let done=false;
    const timer=setTimeout(()=>finish(new Error("Server berita belum merespons.")),12000);
    function finish(err,data){if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch{};s.remove();err?reject(err):resolve(data)}
    window[cb]=d=>finish(null,d);s.onerror=()=>finish(new Error("Koneksi ke server berita gagal."));
    const u=new URL(GAS);u.searchParams.set("action","publicSnapshot");u.searchParams.set("callback",cb);u.searchParams.set("_",Date.now());s.src=u.href;document.head.append(s);
  })}

  async function post(action,data){
    const body=JSON.stringify({action,readKey:KEY,key:KEY,data:{...data,readKey:KEY},origin:location.origin});
    try{
      const r=await fetch(PROXY,{method:"POST",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"},body});
      const text=await r.text();let j={};try{j=JSON.parse(text)}catch{}
      if(r.ok&&j?.ok===true)return j;
      if(j?.error)throw new Error(j.error);
    }catch(proxyError){
      try{await fetch(GAS,{method:"POST",mode:"no-cors",cache:"no-store",headers:{"Content-Type":"text/plain;charset=UTF-8"},body});return{ok:true,opaque:true}}catch{throw proxyError}
    }
    throw new Error("Server menolak penyimpanan berita.");
  }

  async function verify(id){
    for(const ms of [500,900,1400,2200,3500,5000,7000,9000]){
      await sleep(ms);
      try{const j=await jsonpSnapshot();const row=(j?.news||[]).find(n=>String(n.id)===String(id));const manifest=j?.content?.[`news:${id}`];if(j?.ok===true&&row&&manifest)return{snapshot:j,row,manifest}}catch{}
    }
    return null;
  }

  async function compress(file,maxW=1280,q=.72){const b=await createImageBitmap(file),s=Math.min(1,maxW/b.width),w=Math.max(1,Math.round(b.width*s)),h=Math.max(1,Math.round(b.height*s)),c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d",{alpha:false}).drawImage(b,0,0,w,h);b.close?.();const blob=await new Promise(r=>c.toBlob(r,"image/webp",q));return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(fr.error);fr.readAsDataURL(blob)})}

  async function publicPhoto(data){
    const blob=await (await fetch(data)).blob(),b=await createImageBitmap(blob);let best=data;
    for(const w0 of [640,560,480,420,360,320]){
      const s=Math.min(1,w0/b.width),w=Math.max(1,Math.round(b.width*s)),h=Math.max(1,Math.round(b.height*s));
      for(const q of [.62,.54,.46,.38,.32]){
        const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d",{alpha:false}).drawImage(b,0,0,w,h);
        const out=await new Promise(r=>c.toBlob(r,"image/webp",q));const u=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(fr.error);fr.readAsDataURL(out)});best=u;
        if(u.length<=28000){b.close?.();return u}
      }
    }
    b.close?.();return best.slice(0,46000);
  }

  async function addFiles(files){const room=MAX_PHOTOS-photos.length,arr=[...files].slice(0,room);if(room<=0){photoStatus("Maksimal 10 foto.","error");return}for(let i=0;i<arr.length;i++){photoStatus(`Mengoptimalkan foto ${i+1} dari ${arr.length}…`);try{const full=await compress(arr[i],1280,.72),thumb=await compress(arr[i],480,.64);photos.push({id:uid(),name:arr[i].name,full,thumb});renderPhotos();preview()}catch{photoStatus(`Foto ${arr[i].name} gagal diproses.`,"error")}}photoStatus(`${photos.length} dari 10 foto siap. Foto pertama menjadi sampul.`)}

  function renderPhotos(){const root=$("#ne-media-grid"),count=$("#ne-photo-count");if(count)count.textContent=`${photos.length}/10 foto`;if(!photos.length){root.innerHTML='<div class="ne-media-empty"><div><strong>Belum ada foto</strong><br><small>Pilih hingga 10 foto.</small></div></div>';return}root.innerHTML=photos.map((p,i)=>`<article class="ne-photo-card ${i===0?'is-cover':''}"><span class="ne-photo-badge">${i===0?'SAMPUL':`FOTO ${i+1}`}</span><img src="${esc(p.thumb||p.full)}" alt="Foto ${i+1}"><footer><span class="ne-photo-name">${esc(p.name||`Foto ${i+1}`)}</span><div class="ne-photo-actions"><button type="button" data-left="${i}">←</button><button type="button" data-right="${i}">→</button><button type="button" class="is-cover-btn" data-cover="${i}">${i===0?'Sampul aktif':'Jadikan sampul'}</button><button type="button" class="is-danger" data-remove="${i}">×</button></div></footer></article>`).join("");$$('[data-left]',root).forEach(b=>b.onclick=()=>move(+b.dataset.left,-1));$$('[data-right]',root).forEach(b=>b.onclick=()=>move(+b.dataset.right,1));$$('[data-cover]',root).forEach(b=>b.onclick=()=>cover(+b.dataset.cover));$$('[data-remove]',root).forEach(b=>b.onclick=()=>{photos.splice(+b.dataset.remove,1);renderPhotos();preview()})}
  function move(i,d){const n=i+d;if(n<0||n>=photos.length)return;[photos[i],photos[n]]=[photos[n],photos[i]];renderPhotos();preview()}
  function cover(i){if(i<=0||i>=photos.length)return;const[x]=photos.splice(i,1);photos.unshift(x);renderPhotos();preview()}
  $("#ne-photo")?.addEventListener("change",async e=>{await addFiles(e.target.files||[]);e.target.value=""});

  function preview(){const title=$("#ne-title").value.trim()||"Judul berita akan tampil di sini",sum=$("#ne-summary").value.trim()||"Ringkasan berita akan muncul otomatis ketika Anda mengetik.",cat=$("#ne-category").value,date=$("#ne-date").value;$("#ne-preview-title").textContent=title;$("#ne-preview-summary").textContent=sum;$("#ne-preview-category").textContent=cat;$("#ne-preview-date").textContent=dateText(date);const media=$("#ne-preview-media");media.style.backgroundImage=photos[0]?.thumb?`url(${photos[0].thumb})`:"";media.innerHTML=photos[0]?.thumb?"":"<span>SPENSUS</span>";const mini=$("#ne-mini-gallery");mini.innerHTML=photos.slice(1,5).map(p=>`<img src="${esc(p.thumb||p.full)}" alt="Foto tambahan">`).join("");mini.hidden=photos.length<2}
  ["#ne-title","#ne-summary","#ne-category","#ne-date","#ne-content"].forEach(s=>$(s)?.addEventListener("input",preview));

  function item(state="draft",requirePhoto=true){const id=$("#ne-id").value||uid(),title=$("#ne-title").value.trim(),date=$("#ne-date").value,category=$("#ne-category").value,summary=$("#ne-summary").value.trim(),content=$("#ne-content").value.trim();if(!title||!date||!summary||!content)throw new Error("Judul, tanggal, ringkasan, dan isi berita wajib diisi.");if(requirePhoto&&!photos.length)throw new Error("Tambahkan minimal satu foto.");const now=new Date().toISOString();return{id,title,date,category,summary,content,year:Number(date.slice(0,4)),month:Number(date.slice(5,7)),images:photos.map(p=>p.full),thumbnail:photos[0]?.thumb||photos[0]?.full||"",media:photos.map((p,i)=>({src:p.full,thumbnail:p.thumb||p.full,name:p.name,order:i+1,cover:i===0})),author:"Sunarso, S.Pd.I, Gr",status:state,updatedAt:now,createdAt:now}}

  function splitText(text,size=24000){const out=[];for(let i=0;i<text.length;i+=size)out.push(text.slice(i,i+size));return out.length?out:[""]}

  async function saveDraft(){try{const x=item("draft",false),old=(await allLocal()).find(v=>v.id===x.id);if(old)x.createdAt=old.createdAt;await putLocal(x);$("#ne-id").value=x.id;$("#ne-editor-status").textContent="Draft tersimpan";status("Draft tersimpan. Tulisan tidak hilang.","ok");refreshLists()}catch(e){status(e.message,"error")}}
  $("#ne-save-draft")?.addEventListener("click",saveDraft);

  async function publish(){
    let x;try{x=item("pending",true)}catch(e){status(e.message,"error");return}
    const b=$("#ne-publish-direct");b.disabled=true;b.textContent="Menyiapkan…";
    try{
      const old=(await allLocal()).find(v=>v.id===x.id);if(old)x.createdAt=old.createdAt;await putLocal(x);
      const photoKeys=[];
      for(let i=0;i<photos.length;i++){
        b.textContent=`Foto ${i+1}/${photos.length}`;status(`Menyimpan foto ${i+1} dari ${photos.length}…`);
        const data=await publicPhoto(photos[i].full),key=`news:${x.id}:photo:${i+1}`;
        await post("contentUpsert",{key,value:{kind:"photo",data,name:photos[i].name||`Foto ${i+1}`},authorName:x.author,authorSchool:"SMP Negeri 1 Susukan",updatedAt:new Date().toISOString()});photoKeys.push(key);
      }
      const bodyKeys=[],parts=splitText(x.content,24000);
      for(let i=0;i<parts.length;i++){
        b.textContent=`Naskah ${i+1}/${parts.length}`;status(`Menyimpan naskah bagian ${i+1} dari ${parts.length}…`);
        const key=`news:${x.id}:body:${i+1}`;await post("contentUpsert",{key,value:{kind:"body",text:parts[i]},authorName:x.author,authorSchool:"SMP Negeri 1 Susukan",updatedAt:new Date().toISOString()});bodyKeys.push(key);
      }
      const cover=await publicPhoto(photos[0].full);
      b.textContent="Menerbitkan…";status("Menerbitkan berita…");
      await post("newsUpsert",{id:x.id,title:x.title,date:x.date,summary:x.summary,imageDataUrl:cover,imageUrl:"",authorName:x.author,authorSchool:"SMP Negeri 1 Susukan",isPublished:true,sortOrder:-Date.now()});
      const manifest={schema:"chunks-v102",id:x.id,title:x.title,date:x.date,category:x.category,summary:x.summary,photoKeys,bodyKeys,coverKey:photoKeys[0]||"",year:x.year,month:x.month,author:x.author};
      await post("contentUpsert",{key:`news:${x.id}`,value:manifest,authorName:x.author,authorSchool:"SMP Negeri 1 Susukan",updatedAt:new Date().toISOString()});
      b.textContent="Verifikasi…";status("Memastikan berita sudah benar-benar tayang…");
      const verified=await verify(x.id);if(!verified)throw new Error("Server belum mengembalikan berita setelah penyimpanan selesai.");
      x.status="published";x.publishedAt=new Date().toISOString();await putLocal(x);$("#ne-id").value=x.id;$("#ne-editor-status").textContent="Tayang";status(`Berhasil. Berita tayang dengan ${photos.length} foto tanpa memotong naskah.`,"ok");try{new BroadcastChannel("spensus-news").postMessage({type:"published",id:x.id})}catch{}refreshLists();
    }catch(e){x.status="draft";await putLocal(x);$("#ne-editor-status").textContent="Draft";status(`Belum tayang: ${e.message||"server belum mengonfirmasi"}. Tulisan tetap aman sebagai Draft.`,"error")}
    finally{b.disabled=false;b.textContent="Terbitkan"}
  }
  $("#ne-form")?.addEventListener("submit",e=>{e.preventDefault();publish()});

  function loadMedia(x){if(Array.isArray(x.media)&&x.media.length)return x.media.slice(0,10).map((m,i)=>({id:uid(),name:m.name||`Foto ${i+1}`,full:m.src||m.full||"",thumb:m.thumbnail||m.thumb||m.src||m.full||""})).filter(p=>p.full);if(Array.isArray(x.images))return x.images.slice(0,10).map((u,i)=>({id:uid(),name:`Foto ${i+1}`,full:u,thumb:u}));return[]}
  async function refreshLists(){const arr=(await allLocal()).sort((a,b)=>String(b.publishedAt||b.updatedAt||b.date).localeCompare(String(a.publishedAt||a.updatedAt||a.date)));const years=[...new Set(arr.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a),cats=[...new Set(arr.map(x=>x.category).filter(Boolean))].sort(),fy=$("#ne-filter-year"),fc=$("#ne-filter-category"),yv=fy.value,cv=fc.value;fy.innerHTML='<option value="">Semua tahun</option>'+years.map(y=>`<option>${y}</option>`).join("");fc.innerHTML='<option value="">Semua kategori</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join("");fy.value=yv;fc.value=cv;const q=$("#ne-search").value.toLowerCase().trim(),filtered=arr.filter(x=>(!q||String(x.title).toLowerCase().includes(q))&&(!fy.value||String(x.year)===fy.value)&&(!fc.value||x.category===fc.value));const list=$("#ne-post-list");list.innerHTML=filtered.length?filtered.map(x=>`<article class="ne-post"><div class="ne-post-thumb"${x.thumbnail?` style="background-image:url('${esc(x.thumbnail)}')"`:""}></div><div><h3>${esc(x.title)}</h3><p>${esc(x.summary||"")}</p><div class="ne-post-meta"><span>${esc(x.category||"")}</span><span>${esc(dateText(x.date))}</span><span>${x.status==="published"?"Tayang":"Draft"}</span></div></div><div class="ne-post-actions"><button class="ne-edit" data-edit="${esc(x.id)}">Edit</button><button class="ne-delete" data-delete="${esc(x.id)}">Hapus</button></div></article>`).join(""):'<div class="ne-empty">Belum ada posting yang sesuai.</div>';$$('[data-edit]',list).forEach(b=>b.onclick=()=>edit(arr.find(x=>x.id===b.dataset.edit)));$$('[data-delete]',list).forEach(b=>b.onclick=async()=>{if(confirm("Hapus draft/posting lokal ini?")){await delLocal(b.dataset.delete);refreshLists()}});$("#ne-archive").innerHTML=years.length?years.map(y=>{const a=arr.filter(x=>x.year===y);return`<article class="ne-year"><strong>${y}</strong><span>${a.length} berita/draft</span><b>${a.filter(x=>x.status==="published").length} tayang</b></article>`}).join(""):'<div class="ne-empty">Arsip akan terbentuk otomatis.</div>'}
  function edit(x){if(!x)return;$("#ne-id").value=x.id;$("#ne-title").value=x.title||"";$("#ne-date").value=x.date||new Date().toISOString().slice(0,10);$("#ne-category").value=x.category||"Berita Sekolah";$("#ne-summary").value=x.summary||"";$("#ne-content").value=x.content||"";photos=loadMedia(x);renderPhotos();preview();switchTab("write");status("Draft dimuat kembali. Tidak perlu mengetik ulang.","ok")}
  function switchTab(name){$$('[data-ne-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.neTab===name));$$('[data-ne-panel]').forEach(p=>p.classList.toggle('is-active',p.dataset.nePanel===name));if(name!=="write")refreshLists()}
  $$('[data-ne-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.neTab));["#ne-search","#ne-filter-year","#ne-filter-category"].forEach(s=>$(s)?.addEventListener("input",refreshLists));$("#ne-refresh")?.addEventListener("click",refreshLists);$("#ne-reset")?.addEventListener("click",()=>{$("#ne-form").reset();$("#ne-id").value="";$("#ne-date").value=new Date().toISOString().slice(0,10);photos=[];renderPhotos();preview();status("");photoStatus("Belum ada foto dipilih. Maksimal 10 foto.")});
  $("#ne-date").value=$("#ne-date").value||new Date().toISOString().slice(0,10);renderPhotos();preview();refreshLists();
})();