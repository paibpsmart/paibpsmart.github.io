(() => {
  "use strict";
  const API="https://paibp-smart-api.sunarso29.workers.dev";
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  let items=[],snapshotData={},activeYear="",activeArticle="",lightbox={item:null,index:0},loading=false;

  function injectStyle(){
    if(document.querySelector("#spensus-news-layout-v102"))return;
    const style=document.createElement("style");style.id="spensus-news-layout-v102";style.textContent=`
#spensus-news-v102{background:#f4f8fb;color:#17314c;padding:34px 0 56px;content-visibility:auto;contain-intrinsic-size:900px}
#spensus-news-v102 *{box-sizing:border-box}
.sn102-wrap{width:min(1210px,calc(100% - 34px));margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 326px;gap:22px;align-items:start}
.sn102-head{grid-column:1/-1;display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:2px}
.sn102-kicker{display:block;color:#008c73;font-size:11px;font-weight:900;letter-spacing:.14em;margin-bottom:7px}
.sn102-head h2{margin:0;color:#082e50;font-size:clamp(29px,3.2vw,47px);line-height:1.02;letter-spacing:-.035em}
.sn102-head p{margin:7px 0 0;color:#58728a;font-size:13px;line-height:1.5}
.sn102-refresh{border:0;border-radius:13px;background:#e7f0f5;color:#0a3e61;padding:13px 16px;font-weight:900;cursor:pointer;white-space:nowrap}
.sn102-main{min-width:0;display:grid;gap:14px}
.sn102-lead,.sn102-mini,.sn102-expanded,.sn102-sidecard{background:#fff;border:1px solid #d9e5ed;box-shadow:0 8px 24px rgba(19,59,84,.055)}
.sn102-lead{border-radius:22px;overflow:hidden;display:grid;grid-template-columns:minmax(280px,1.1fr) minmax(260px,.9fr)}
.sn102-lead-media{position:relative;min-height:330px;background:#e6eef3;overflow:hidden;cursor:pointer}
.sn102-lead-media img{width:100%;height:100%;display:block;object-fit:cover;image-rendering:auto;filter:none!important;transform:none!important}
.sn102-photo-count{position:absolute;left:14px;bottom:14px;background:rgba(5,37,60,.84);color:#fff;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;backdrop-filter:blur(5px)}
.sn102-lead-copy{padding:30px;display:flex;flex-direction:column;justify-content:center;min-width:0}
.sn102-meta{display:flex;flex-wrap:wrap;gap:7px;align-items:center;color:#60778c;font-size:11px;font-weight:800}.sn102-meta span{color:#007c69;background:#eaf9f5;padding:6px 9px;border-radius:999px}
.sn102-lead h3{font-size:clamp(25px,2.5vw,38px);line-height:1.05;letter-spacing:-.03em;color:#0a2f50;margin:13px 0 10px}.sn102-lead p{margin:0;color:#557087;font-size:14px;line-height:1.72}
.sn102-read{align-self:flex-start;margin-top:18px;border:0;background:linear-gradient(135deg,#126bd8,#6542d8);color:white;border-radius:12px;padding:11px 15px;font-weight:900;cursor:pointer}
.sn102-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.sn102-mini{border-radius:17px;overflow:hidden;display:grid;grid-template-columns:116px 1fr;min-height:112px;cursor:pointer;transition:transform .14s ease,border-color .14s ease}.sn102-mini:hover{transform:translateY(-1px);border-color:#b7cee0}
.sn102-mini img{width:116px;height:100%;min-height:112px;object-fit:cover;display:block;filter:none!important}.sn102-mini-copy{padding:13px 14px;min-width:0}.sn102-mini small{font-size:10px;color:#758b9d;font-weight:800}.sn102-mini h4{margin:5px 0 5px;font-size:15px;line-height:1.25;color:#0b3455}.sn102-mini p{margin:0;color:#6d8192;font-size:11px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sn102-expanded{border-radius:22px;padding:clamp(20px,3vw,36px);scroll-margin-top:90px}.sn102-expanded[hidden]{display:none}.sn102-expanded-top{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;border-bottom:1px solid #e4edf2;padding-bottom:20px;margin-bottom:22px}.sn102-expanded h1{margin:9px 0 0;color:#092f51;font-size:clamp(27px,3vw,42px);line-height:1.08;letter-spacing:-.028em}.sn102-collapse{border:0;border-radius:11px;background:#edf3f7;color:#234b67;padding:10px 12px;font-weight:900;cursor:pointer;white-space:nowrap}.sn102-lede{font-size:16px!important;line-height:1.75!important;color:#46667e!important;font-weight:650;margin:0 0 24px!important}.sn102-body{font-size:15px;line-height:1.86;color:#273f54}.sn102-body p{margin:0 0 17px}.sn102-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:0 0 26px}.sn102-gallery figure{margin:0;border-radius:14px;overflow:hidden;background:#e8eff3;aspect-ratio:4/3;cursor:zoom-in}.sn102-gallery figure:first-child:nth-last-child(1){grid-column:1/-1;aspect-ratio:16/9}.sn102-gallery img{display:block;width:100%;height:100%;object-fit:cover;filter:none!important;image-rendering:auto;transform:none!important}
.sn102-sidebar{display:grid;gap:13px;position:sticky;top:86px}.sn102-sidecard{border-radius:19px;padding:18px}.sn102-sidecard-title{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:14px}.sn102-sidecard-title span{font-size:10px;font-weight:900;letter-spacing:.12em;color:#00836e}.sn102-sidecard-title h3{margin:2px 0 0;font-size:19px;color:#0b3151}.sn102-identity{display:grid;grid-template-columns:70px 1fr;gap:12px;align-items:center}.sn102-identity img{width:70px;height:70px;object-fit:contain;border-radius:13px;background:#f6fafc;border:1px solid #dce7ee;padding:4px}.sn102-identity strong{display:block;color:#0a3355;font-size:17px;line-height:1.2}.sn102-identity small{display:block;color:#6b8294;margin-top:4px;line-height:1.45}.sn102-school-meta{display:grid;gap:7px;margin-top:14px}.sn102-school-meta div{display:flex;justify-content:space-between;gap:10px;background:#f5f9fb;border-radius:10px;padding:8px 10px;font-size:11px;color:#60798d}.sn102-school-meta b{color:#163f5d;text-align:right}
.sn102-teachers{display:grid;gap:8px}.sn102-teacher{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center;border-top:1px solid #edf2f5;padding-top:9px}.sn102-teacher:first-child{border-top:0;padding-top:0}.sn102-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#dff8f1,#e4ecff);color:#106f61;font-weight:900;font-size:12px}.sn102-teacher strong{display:block;font-size:12px;color:#173c58;line-height:1.25}.sn102-teacher small{display:block;font-size:10px;color:#7890a0;margin-top:2px;line-height:1.35}.sn102-empty-side{font-size:11px;color:#71899a;background:#f4f8fa;padding:11px;border-radius:10px}
.sn102-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sn102-stat{background:#f2f7fa;border-radius:13px;padding:12px}.sn102-stat b{display:block;font-size:21px;color:#0c3d60;line-height:1}.sn102-stat span{display:block;margin-top:6px;color:#718797;font-size:10px;line-height:1.3}
.sn102-archive{display:grid;gap:7px}.sn102-year{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;border-radius:11px;padding:10px 12px;background:#f1f6f9;color:#17435f;font-weight:850;cursor:pointer}.sn102-year[aria-pressed="true"]{background:#0a6c64;color:#fff}.sn102-year b{font-size:12px}.sn102-year span{font-size:10px;opacity:.82}.sn102-archive-reset{border:0;background:transparent;color:#147564;font-size:10px;font-weight:900;cursor:pointer;padding:4px 0}
.sn102-lightbox{position:fixed;inset:0;z-index:999999;background:rgba(3,16,28,.94);display:grid;grid-template-columns:64px minmax(0,1fr) 64px;align-items:center;padding:18px}.sn102-lightbox[hidden]{display:none}.sn102-lightbox-stage{height:min(86vh,900px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-width:0}.sn102-lightbox img{max-width:100%;max-height:calc(86vh - 52px);width:auto;height:auto;object-fit:contain;filter:none!important;image-rendering:auto}.sn102-lightbox-caption{color:#dfeaf2;font-size:12px;text-align:center}.sn102-lightbox button{border:0;background:rgba(255,255,255,.1);color:#fff;width:46px;height:46px;border-radius:50%;font-size:24px;cursor:pointer}.sn102-lightbox-close{position:absolute;right:20px;top:18px}.sn102-lightbox-prev{justify-self:start}.sn102-lightbox-next{justify-self:end}
@media(max-width:980px){.sn102-wrap{grid-template-columns:minmax(0,1fr) 285px}.sn102-lead{grid-template-columns:1fr}.sn102-lead-media{min-height:300px;aspect-ratio:16/9}.sn102-lead-copy{padding:23px}.sn102-list{grid-template-columns:1fr}.sn102-sidebar{top:76px}}
@media(max-width:760px){#spensus-news-v102{padding:23px 0 42px}.sn102-wrap{width:min(100% - 22px,650px);grid-template-columns:1fr;gap:14px}.sn102-head{align-items:flex-start}.sn102-head h2{font-size:31px}.sn102-head p{font-size:12px}.sn102-refresh{padding:10px 11px;font-size:11px}.sn102-lead{border-radius:17px}.sn102-lead-media{min-height:0;aspect-ratio:16/10}.sn102-lead-copy{padding:19px}.sn102-lead h3{font-size:27px}.sn102-sidebar{position:static;grid-template-columns:1fr 1fr;gap:10px}.sn102-sidecard{padding:15px;border-radius:16px}.sn102-sidecard.sn102-archive-card{grid-column:1/-1}.sn102-list{grid-template-columns:1fr}.sn102-mini{grid-template-columns:105px 1fr}.sn102-mini img{width:105px}.sn102-gallery{grid-template-columns:1fr 1fr;gap:6px}.sn102-expanded{padding:18px;border-radius:17px}.sn102-expanded-top{display:block}.sn102-collapse{margin-top:12px}.sn102-lightbox{grid-template-columns:44px minmax(0,1fr) 44px;padding:8px}.sn102-lightbox button{width:38px;height:38px;font-size:20px}.sn102-lightbox-close{right:10px;top:10px}}
@media(max-width:470px){.sn102-head{display:block}.sn102-refresh{margin-top:12px}.sn102-sidebar{grid-template-columns:1fr}.sn102-sidecard.sn102-archive-card{grid-column:auto}.sn102-gallery{grid-template-columns:1fr}.sn102-mini{grid-template-columns:92px 1fr}.sn102-mini img{width:92px}.sn102-identity{grid-template-columns:58px 1fr}.sn102-identity img{width:58px;height:58px}.sn102-lightbox{grid-template-columns:38px minmax(0,1fr) 38px}}
@media(prefers-reduced-motion:reduce){.sn102-mini{transition:none}}
`;
    document.head.appendChild(style);
  }

  function shell(){
    injectStyle();
    let root=$("#spensus-news-v102");
    if(!root){root=document.createElement("section");root.id="spensus-news-v102";const main=$("main#main")||$("main");(main||document.body).insertAdjacentElement(main?"afterend":"beforeend",root)}
    if(root.dataset.layout!=="portal-sidebar"){
      root.dataset.layout="portal-sidebar";
      root.innerHTML=`<div class="sn102-wrap">
        <header class="sn102-head"><div><span class="sn102-kicker">KABAR SPENSUS</span><h2>Berita terbaru SMP Negeri 1 Susukan</h2><p>Informasi kegiatan, prestasi, akademik, kesiswaan, keagamaan, dan agenda sekolah.</p></div><button class="sn102-refresh" type="button" data-sn-refresh>↻ Muat terbaru</button></header>
        <main class="sn102-main" data-sn-main><div class="sn102-empty-side">Memuat berita terbaru…</div></main>
        <aside class="sn102-sidebar" data-sn-sidebar></aside>
      </div>
      <div class="sn102-lightbox" data-sn-lightbox hidden><button class="sn102-lightbox-close" type="button" data-sn-lightbox-close aria-label="Tutup">×</button><button class="sn102-lightbox-prev" type="button" data-sn-prev aria-label="Foto sebelumnya">‹</button><div class="sn102-lightbox-stage"><img data-sn-lightbox-img alt="Preview foto kegiatan"><div class="sn102-lightbox-caption" data-sn-lightbox-caption></div></div><button class="sn102-lightbox-next" type="button" data-sn-next aria-label="Foto berikutnya">›</button></div>`;
      $("[data-sn-refresh]",root)?.addEventListener("click",load);
      $("[data-sn-lightbox-close]",root)?.addEventListener("click",closeLightbox);
      $("[data-sn-prev]",root)?.addEventListener("click",()=>stepLightbox(-1));
      $("[data-sn-next]",root)?.addEventListener("click",()=>stepLightbox(1));
      $("[data-sn-lightbox]",root)?.addEventListener("click",e=>{if(e.target===e.currentTarget)closeLightbox()});
    }
    return root;
  }

  async function fetchSnapshot(){
    const u=new URL(API);u.searchParams.set("action","publicSnapshot");u.searchParams.set("_",Date.now());
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
    try{const r=await fetch(u,{cache:"no-store",headers:{Accept:"application/json"},signal:ctl.signal});const text=await r.text();let j;try{j=JSON.parse(text)}catch{throw new Error("Respons server berita tidak valid.")}if(!r.ok)throw new Error(j?.error||`Server berita HTTP ${r.status}`);return j}finally{clearTimeout(timer)}
  }
  const valueData=v=>typeof v==="string"?v:(v?.data||"");
  const valueText=v=>typeof v==="string"?v:(v?.text||"");

  function normalize(snapshot){
    const content=snapshot?.content||{};
    return (Array.isArray(snapshot?.news)?snapshot.news:[]).filter(n=>n?.id&&n?.title&&!/^__MEDIA__/i.test(String(n.title))).map(n=>{
      const extra=content[`news:${n.id}`]||{};let media=[],body="",cover="";
      if(extra?.schema==="chunks-v102"){
        media=(extra.photoKeys||[]).map(k=>valueData(content[k])).filter(Boolean).slice(0,10);
        body=(extra.bodyKeys||[]).map(k=>valueText(content[k])).join("");
        cover=valueData(content[extra.coverKey])||media[0]||n.imageUrl||n.imageDataUrl||"";
      }else{
        media=(Array.isArray(extra.media)?extra.media:[]).map(x=>typeof x==="string"?x:x?.src).filter(Boolean).slice(0,10);
        body=String(extra.content||n.summary||"");cover=String(extra.coverDataUrl||extra.coverUrl||n.imageUrl||n.imageDataUrl||media[0]||"");if(!media.length&&cover)media.push(cover);
      }
      const date=String(extra.date||n.date||"").slice(0,10);
      return{id:String(n.id),title:String(extra.title||n.title||"Berita Spensus"),summary:String(extra.summary||n.summary||""),content:body,category:String(extra.category||"Berita Sekolah"),date,year:Number(extra.year||date.slice(0,4))||0,media,cover,updatedAt:String(n.updatedAt||date)};
    }).sort((a,b)=>String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt)));
  }

  function dateText(v){if(!v)return"";try{return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${v}T12:00:00`))}catch{return v}}
  function bodyHtml(v){return String(v||"").split(/\n\s*\n|\n/).map(x=>x.trim()).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join("")}
  function initials(v){return String(v||"G").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"G"}

  function renderMain(){
    const root=shell(),main=$("[data-sn-main]",root),list=activeYear?items.filter(x=>String(x.year)===String(activeYear)):items;
    if(!list.length){main.innerHTML='<div class="sn102-sidecard sn102-empty-side">Belum ada berita yang diterbitkan pada arsip ini.</div>';return}
    const lead=list[0],others=list.slice(1,7),expanded=items.find(x=>x.id===activeArticle);
    main.innerHTML=`
      <article class="sn102-lead">
        <div class="sn102-lead-media" ${lead.cover?`data-sn-photo="${esc(lead.id)}" data-sn-index="0"`:""}>${lead.cover?`<img src="${esc(lead.cover)}" alt="${esc(lead.title)}" loading="eager" decoding="async">`:""}${lead.media.length>1?`<span class="sn102-photo-count">${lead.media.length} foto • klik untuk preview</span>`:""}</div>
        <div class="sn102-lead-copy"><div class="sn102-meta"><span>${esc(lead.category)}</span><time>${esc(dateText(lead.date))}</time></div><h3>${esc(lead.title)}</h3><p>${esc(lead.summary)}</p><button class="sn102-read" type="button" data-sn-open="${esc(lead.id)}">Baca selengkapnya ↓</button></div>
      </article>
      ${others.length?`<div class="sn102-list">${others.map(x=>`<article class="sn102-mini" data-sn-open="${esc(x.id)}">${x.cover?`<img src="${esc(x.cover)}" alt="" loading="lazy" decoding="async">`:"<div></div>"}<div class="sn102-mini-copy"><small>${esc(x.category)} • ${esc(dateText(x.date))}</small><h4>${esc(x.title)}</h4><p>${esc(x.summary)}</p></div></article>`).join("")}</div>`:""}
      <article class="sn102-expanded" data-sn-expanded ${expanded?"":"hidden"}>${expanded?expandedHtml(expanded):""}</article>`;
    $$('[data-sn-open]',main).forEach(el=>el.addEventListener("click",()=>openArticle(el.dataset.snOpen)));
    $$('[data-sn-photo]',main).forEach(el=>el.addEventListener("click",()=>openLightbox(el.dataset.snPhoto,Number(el.dataset.snIndex||0))));
    $("[data-sn-collapse]",main)?.addEventListener("click",collapseArticle);
  }

  function expandedHtml(x){
    return `<div class="sn102-expanded-top"><div><div class="sn102-meta"><span>${esc(x.category)}</span><time>${esc(dateText(x.date))}</time>${x.media.length?`<em>${x.media.length} foto</em>`:""}</div><h1>${esc(x.title)}</h1></div><button class="sn102-collapse" type="button" data-sn-collapse>Tutup ↑</button></div><p class="sn102-lede">${esc(x.summary)}</p>${x.media.length?`<div class="sn102-gallery">${x.media.map((u,i)=>`<figure data-sn-photo="${esc(x.id)}" data-sn-index="${i}" title="Klik untuk memperbesar"><img src="${esc(u)}" alt="${esc(x.title)} — foto ${i+1}" loading="${i<2?'eager':'lazy'}" decoding="async"></figure>`).join("")}</div>`:""}<div class="sn102-body">${bodyHtml(x.content)}</div>`;
  }

  function renderSidebar(){
    const root=shell(),side=$("[data-sn-sidebar]",root),teachers=Array.isArray(snapshotData?.latestTeachers)?snapshotData.latestTeachers.slice(0,5):[],stats=snapshotData?.stats||{},years=[...new Set(items.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a);
    side.innerHTML=`
      <section class="sn102-sidecard"><div class="sn102-sidecard-title"><div><span>IDENTITAS SEKOLAH</span><h3>SMP Negeri 1 Susukan</h3></div></div><div class="sn102-identity"><img src="logo-spensus.png" alt="Logo SMP Negeri 1 Susukan"><div><strong>SPENSUS</strong><small>Panerusan Wetan, Susukan, Banjarnegara</small></div></div><div class="sn102-school-meta"><div><span>NPSN</span><b>20304047</b></div><div><span>Akreditasi</span><b>A</b></div></div></section>
      <section class="sn102-sidecard"><div class="sn102-sidecard-title"><div><span>JARINGAN GURU</span><h3>Kunjungan terkini</h3></div></div><div class="sn102-teachers">${teachers.length?teachers.map(t=>`<div class="sn102-teacher"><div class="sn102-avatar">${esc(initials(t.name))}</div><div><strong>${esc(t.name||"Guru")}</strong><small>${esc(t.school||"Instansi tidak dicantumkan")}</small></div></div>`).join(""):'<div class="sn102-empty-side">Belum ada kunjungan guru yang tercatat.</div>'}</div></section>
      <section class="sn102-sidecard"><div class="sn102-sidecard-title"><div><span>STATISTIK</span><h3>Aktivitas portal</h3></div></div><div class="sn102-stats"><div class="sn102-stat"><b>${Number(items.length||0)}</b><span>Berita tayang</span></div><div class="sn102-stat"><b>${Number(stats.todaySessions||0)}</b><span>Kunjungan hari ini</span></div><div class="sn102-stat"><b>${Number(stats.onlineNow||0)}</b><span>Sedang online</span></div><div class="sn102-stat"><b>${Number(stats.totalSessions||0)}</b><span>Total sesi</span></div></div></section>
      <section class="sn102-sidecard sn102-archive-card"><div class="sn102-sidecard-title"><div><span>ARSIP KEGIATAN</span><h3>Berita per tahun</h3></div></div><div class="sn102-archive">${years.length?years.map(y=>{const count=items.filter(x=>x.year===y).length;return`<button class="sn102-year" type="button" aria-pressed="${String(activeYear)===String(y)}" data-sn-year="${y}"><b>${y}</b><span>${count} berita</span></button>`}).join(""):'<div class="sn102-empty-side">Arsip akan muncul otomatis setelah ada berita.</div>'}${activeYear?'<button class="sn102-archive-reset" type="button" data-sn-year="">Tampilkan berita terbaru</button>':""}</div></section>`;
    $$('[data-sn-year]',side).forEach(b=>b.addEventListener("click",()=>{activeYear=b.dataset.snYear||"";activeArticle="";renderMain();renderSidebar();shell().scrollIntoView({behavior:"smooth",block:"start"})}));
  }

  function render(){renderMain();renderSidebar();removeAuthorBadge()}
  function openArticle(id){activeArticle=id;renderMain();const box=$("[data-sn-expanded]",shell());requestAnimationFrame(()=>box?.scrollIntoView({behavior:"smooth",block:"start"}))}
  function collapseArticle(){activeArticle="";renderMain();shell().scrollIntoView({behavior:"smooth",block:"start"})}

  function openLightbox(id,index){const item=items.find(x=>x.id===id);if(!item||!item.media.length)return;lightbox={item,index:Math.max(0,Math.min(index,item.media.length-1))};paintLightbox();$("[data-sn-lightbox]",shell()).hidden=false;document.body.style.overflow="hidden"}
  function paintLightbox(){if(!lightbox.item)return;const root=shell(),arr=lightbox.item.media;lightbox.index=(lightbox.index+arr.length)%arr.length;$("[data-sn-lightbox-img]",root).src=arr[lightbox.index];$("[data-sn-lightbox-caption]",root).textContent=`${lightbox.item.title} • Foto ${lightbox.index+1} dari ${arr.length}`;$("[data-sn-prev]",root).style.visibility=arr.length>1?"visible":"hidden";$("[data-sn-next]",root).style.visibility=arr.length>1?"visible":"hidden"}
  function stepLightbox(dir){if(!lightbox.item)return;lightbox.index+=dir;paintLightbox()}
  function closeLightbox(){const lb=$("[data-sn-lightbox]",shell());if(lb)lb.hidden=true;document.body.style.overflow="";lightbox={item:null,index:0}}
  document.addEventListener("keydown",e=>{const lb=$("[data-sn-lightbox]");if(!lb||lb.hidden)return;if(e.key==="Escape")closeLightbox();else if(e.key==="ArrowLeft")stepLightbox(-1);else if(e.key==="ArrowRight")stepLightbox(1)});

  function removeAuthorBadge(){
    const nodes=$$("footer *, [class*='footer'] *, [class*='credit'] *, [class*='author-badge'] *, [class*='profile-tab'] *");
    nodes.forEach(el=>{const t=String(el.textContent||"").replace(/\s+/g," ").trim();if(/^Sunarso,?\s*S\.?Pd\.?I/i.test(t)&&t.length<120){const target=el.closest("a,button,.badge,.chip,.pill,.tab")||el;target.style.display="none"}});
  }

  async function load(){
    if(loading)return;loading=true;const main=$("[data-sn-main]",shell());if(!items.length)main.innerHTML='<div class="sn102-sidecard sn102-empty-side">Memuat berita terbaru…</div>';
    try{const snap=await fetchSnapshot();if(snap?.ok!==true)throw new Error(snap?.error||"Server berita tidak tersedia.");snapshotData=snap;items=normalize(snap);window.PAIBP_SPENSUS_NEWS_V102=items;render()}catch(e){main.innerHTML=`<div class="sn102-sidecard sn102-empty-side">${esc(e.message||"Berita belum dapat dimuat.")}</div>`}finally{loading=false}
  }
  try{const bc=new BroadcastChannel("spensus-news");bc.addEventListener("message",e=>{if(e.data?.type==="published")setTimeout(load,250)})}catch{}
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(load,120)});
  const init=()=>{shell();removeAuthorBadge();setTimeout(load,60)};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();