(() => {
  "use strict";
  const WORKER="https://paibp-smart-api.sunarso29.workers.dev";
  const KEY="b082937b2165453ba7d9f81ecac063b00310b339ec0643da";
  const GAS="https://script.google.com/macros/s/AKfycbyRxOw6oWDZUuQxwuqOMRO92KOwqOGF_9J6rPzSfxr9Dqy9kAQGJ9qZA6Tm_deUOgtjKg/exec";
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  let items=[],activeYear="",loading=false;

  function shell(){
    let root=document.querySelector("#spensus-news-v102");
    if(root)return root;
    root=document.createElement("section");root.id="spensus-news-v102";root.className="spensus-news-v101";
    root.innerHTML=`<div class="sn101-wrap"><header class="sn101-head"><div><span class="sn101-kicker">KABAR SPENSUS</span><h2>Berita terbaru SMP Negeri 1 Susukan</h2><p>Informasi kegiatan, prestasi, akademik, kesiswaan, keagamaan, dan agenda sekolah.</p></div><button class="sn101-refresh" type="button" data-sn-refresh>↻ Muat terbaru</button></header><div class="sn101-grid" data-sn-grid><div class="sn101-empty">Memuat berita terbaru…</div></div><div class="sn101-archive" data-sn-archive></div></div><div class="sn101-modal" data-sn-modal hidden><section class="sn101-dialog" role="dialog" aria-modal="true" aria-label="Baca berita Spensus"><header class="sn101-dialog-head"><strong>SPENSUS TERKINI</strong><button class="sn101-close" type="button" data-sn-close aria-label="Tutup">×</button></header><div data-sn-article></div></section></div>`;
    const main=document.querySelector("main#main")||document.querySelector("main");
    (main||document.body).insertAdjacentElement(main?"afterend":"beforeend",root);
    root.querySelector("[data-sn-refresh]")?.addEventListener("click",load);
    root.querySelector("[data-sn-close]")?.addEventListener("click",closeArticle);
    root.querySelector("[data-sn-modal]")?.addEventListener("click",e=>{if(e.target===e.currentTarget)closeArticle()});
    return root;
  }

  function listFromWorker(j){
    const raw=j?.gallery||j?.items||j?.news||j?.result?.gallery||j?.result?.items||j?.result?.news||[];
    return Array.isArray(raw)?raw:[];
  }
  function normalizeWorker(raw){
    return raw.filter(x=>x?.id&&x?.title).map(x=>{
      const images=(Array.isArray(x.images)?x.images:Array.isArray(x.media)?x.media.map(m=>m?.src||m):[x.image||x.thumbnail]).filter(Boolean).slice(0,10);
      const date=String(x.date||x.publishedAt||x.updatedAt||"").slice(0,10);
      return{id:String(x.id),title:String(x.title||"Berita Spensus"),summary:String(x.summary||x.description||""),content:String(x.content||x.summary||x.description||""),category:String(x.category||"Berita Sekolah"),date,year:Number(x.year||date.slice(0,4))||0,media:images,cover:String(x.image||x.thumbnail||images[0]||""),updatedAt:String(x.updatedAt||x.publishedAt||date)};
    });
  }
  async function fromWorker(){
    const u=new URL(WORKER);u.searchParams.set("action","gallery");u.searchParams.set("key",KEY);u.searchParams.set("readKey",KEY);u.searchParams.set("limit","12");u.searchParams.set("_",Date.now());
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),7000);
    try{const r=await fetch(u,{cache:"no-store",signal:ctl.signal});if(!r.ok)throw new Error();const j=await r.json();return normalizeWorker(listFromWorker(j));}finally{clearTimeout(timer)}
  }

  function jsonp(){return new Promise((resolve,reject)=>{
    const cb=`__spensusNews102_${Date.now()}_${Math.random().toString(36).slice(2)}`;const s=document.createElement("script");const t=setTimeout(()=>done(new Error()),7000);
    function done(err,data){clearTimeout(t);try{delete window[cb]}catch{};s.remove();err?reject(err):resolve(data)}
    window[cb]=d=>done(null,d);s.onerror=()=>done(new Error());const u=new URL(GAS);u.searchParams.set("action","publicSnapshot");u.searchParams.set("callback",cb);u.searchParams.set("_",Date.now());s.src=u.href;document.head.append(s);
  })}
  async function fromGas(){
    const j=await jsonp();if(j?.ok!==true)return[];const content=j.content||{};
    return (Array.isArray(j.news)?j.news:[]).filter(n=>n?.id&&n?.title&&!/^__MEDIA__/i.test(String(n.title))).map(n=>{const extra=content[`news:${n.id}`]||{};const media=(Array.isArray(extra.media)?extra.media:[n.imageUrl]).filter(Boolean).slice(0,10);const date=String(extra.date||n.date||"").slice(0,10);return{id:String(n.id),title:String(extra.title||n.title),summary:String(extra.summary||n.summary||""),content:String(extra.content||n.summary||""),category:String(extra.category||"Berita Sekolah"),date,year:Number(extra.year||date.slice(0,4))||0,media,cover:String(extra.coverUrl||n.imageUrl||media[0]||""),updatedAt:String(n.updatedAt||date)}});
  }
  function unique(list){const m=new Map();list.forEach(x=>{if(x?.id)m.set(x.id,{...m.get(x.id),...x})});return[...m.values()].sort((a,b)=>String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt)))}
  function dateText(v){if(!v)return"";try{return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${v}T12:00:00`))}catch{return v}}
  function bodyHtml(v){return String(v||"").split(/\n\s*\n|\n/).map(x=>x.trim()).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join("")}

  function render(){
    const root=shell(),grid=root.querySelector("[data-sn-grid]"),archive=root.querySelector("[data-sn-archive]");const list=activeYear?items.filter(x=>String(x.year)===String(activeYear)):items;
    if(!list.length){grid.innerHTML='<div class="sn101-empty">Belum ada berita yang diterbitkan.</div>';}else{const lead=list[0],side=list.slice(1,6);grid.innerHTML=`<article class="sn101-lead"><div class="sn101-media">${lead.cover?`<img src="${esc(lead.cover)}" alt="${esc(lead.title)}" loading="eager" decoding="async">`:""}${lead.media.length>1?`<span class="sn101-count">${lead.media.length} foto</span>`:""}</div><div class="sn101-copy"><div class="sn101-meta"><span>${esc(lead.category)}</span><time>${esc(dateText(lead.date))}</time></div><h3>${esc(lead.title)}</h3><p>${esc(lead.summary)}</p><button class="sn101-read" type="button" data-sn-open="${esc(lead.id)}">Baca selengkapnya</button></div></article><div class="sn101-side">${side.map(x=>`<article class="sn101-card" data-sn-open="${esc(x.id)}">${x.cover?`<img src="${esc(x.cover)}" alt="" loading="lazy" decoding="async">`:"<div></div>"}<div class="sn101-card-copy"><small>${esc(x.category)} • ${esc(dateText(x.date))}</small><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p></div></article>`).join("")}</div>`;root.querySelectorAll("[data-sn-open]").forEach(el=>el.addEventListener("click",()=>openArticle(el.dataset.snOpen)))}
    const years=[...new Set(items.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a);archive.innerHTML=years.length?`<b>Arsip:</b><button class="sn101-year" aria-pressed="${!activeYear}" data-sn-year="">Terbaru</button>${years.map(y=>`<button class="sn101-year" aria-pressed="${String(activeYear)===String(y)}" data-sn-year="${y}">${y}</button>`).join("")}`:"";archive.querySelectorAll("[data-sn-year]").forEach(b=>b.addEventListener("click",()=>{activeYear=b.dataset.snYear;render()}));
  }
  function openArticle(id){const root=shell(),x=items.find(i=>i.id===id);if(!x)return;root.querySelector("[data-sn-article]").innerHTML=`<article class="sn101-article"><div class="sn101-article-meta"><span>${esc(x.category)}</span><time>${esc(dateText(x.date))}</time>${x.media.length?`<span>${x.media.length} foto</span>`:""}</div><h1>${esc(x.title)}</h1><p class="sn101-lede">${esc(x.summary)}</p>${x.media.length?`<div class="sn101-gallery">${x.media.map((u,i)=>`<figure><img src="${esc(u)}" alt="${esc(x.title)} — foto ${i+1}" loading="${i<2?'eager':'lazy'}" decoding="async"></figure>`).join("")}</div>`:""}<div class="sn101-body">${bodyHtml(x.content)}</div></article>`;root.querySelector("[data-sn-modal]").hidden=false;document.body.style.overflow="hidden"}
  function closeArticle(){const m=document.querySelector("[data-sn-modal]");if(m&&!m.hidden){m.hidden=true;document.body.style.overflow=""}}

  async function load(){if(loading)return;loading=true;const grid=shell().querySelector("[data-sn-grid]");if(!items.length)grid.innerHTML='<div class="sn101-empty">Memuat berita terbaru…</div>';try{let a=[];try{a=await fromWorker()}catch{}let b=[];if(!a.length){try{b=await fromGas()}catch{}}items=unique([...a,...b]);render()}catch{grid.innerHTML='<div class="sn101-empty">Belum ada berita yang dapat ditampilkan.</div>'}finally{loading=false}}
  try{const bc=new BroadcastChannel("spensus-news");bc.addEventListener("message",e=>{if(e.data?.type==="published")setTimeout(load,250)})}catch{}
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&items.length)setTimeout(load,100)});
  const init=()=>{shell();setTimeout(load,60)};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();