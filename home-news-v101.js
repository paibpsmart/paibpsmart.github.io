(() => {
  "use strict";
  const GAS="https://script.google.com/macros/s/AKfycbyRxOw6oWDZUuQxwuqOMRO92KOwqOGF_9J6rPzSfxr9Dqy9kAQGJ9qZA6Tm_deUOgtjKg/exec";
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  let items=[];
  let activeYear="";

  function jsonp(action,params={}){
    return new Promise((resolve,reject)=>{
      const cb=`__spensusNews${Date.now()}${Math.random().toString(36).slice(2)}`;
      const script=document.createElement("script");
      const timer=setTimeout(()=>done(new Error("Waktu memuat berita habis.")),9000);
      function done(error,data){clearTimeout(timer);try{delete window[cb]}catch{};script.remove();error?reject(error):resolve(data)}
      window[cb]=data=>done(null,data);
      const u=new URL(GAS);u.searchParams.set("action",action);u.searchParams.set("callback",cb);u.searchParams.set("_",Date.now());Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null)u.searchParams.set(k,String(v))});
      script.onerror=()=>done(new Error("Berita belum dapat dimuat."));script.src=u.href;document.head.append(script);
    });
  }

  function ensureShell(){
    let root=document.querySelector("#spensus-news-v101");
    if(root)return root;
    root=document.createElement("section");root.id="spensus-news-v101";root.className="spensus-news-v101";
    root.innerHTML=`<div class="sn101-wrap"><header class="sn101-head"><div><span class="sn101-kicker">KABAR SPENSUS</span><h2>Berita terbaru SMP Negeri 1 Susukan</h2><p>Informasi kegiatan, prestasi, akademik, kesiswaan, keagamaan, dan agenda sekolah.</p></div><button class="sn101-refresh" type="button" data-sn101-refresh>↻ Muat terbaru</button></header><div class="sn101-grid" data-sn101-grid><div class="sn101-empty">Memuat berita terbaru…</div></div><div class="sn101-archive" data-sn101-archive></div></div><div class="sn101-modal" data-sn101-modal hidden><section class="sn101-dialog" role="dialog" aria-modal="true" aria-label="Baca berita Spensus"><header class="sn101-dialog-head"><strong>SPENSUS TERKINI</strong><button class="sn101-close" type="button" data-sn101-close aria-label="Tutup">×</button></header><div data-sn101-article></div></section></div>`;
    const main=document.querySelector("main#main")||document.querySelector("main");
    if(main)main.insertAdjacentElement("afterend",root);else document.body.append(root);
    root.querySelector("[data-sn101-refresh]")?.addEventListener("click",load);
    root.querySelector("[data-sn101-close]")?.addEventListener("click",closeArticle);
    root.querySelector("[data-sn101-modal]")?.addEventListener("click",e=>{if(e.target===e.currentTarget)closeArticle()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")closeArticle()});
    return root;
  }

  function normalize(snapshot){
    const content=snapshot?.content||{};
    return (Array.isArray(snapshot?.news)?snapshot.news:[])
      .filter(n=>n?.id&&n?.title&&!/^__MEDIA__/i.test(String(n.title))&&!/^media-/i.test(String(n.id)))
      .map(n=>{
        const extra=content[`news:${n.id}`]||{};
        const media=Array.isArray(extra.media)&&extra.media.length?extra.media.filter(Boolean):(n.imageUrl?[n.imageUrl]:[]);
        const date=extra.date||n.date||"";
        return {id:String(n.id),title:String(extra.title||n.title||"Berita Spensus"),summary:String(extra.summary||n.summary||""),content:String(extra.content||n.summary||""),category:String(extra.category||"Berita Sekolah"),date,year:Number(extra.year||String(date).slice(0,4))||0,media,cover:String(extra.coverUrl||n.imageUrl||media[0]||""),updatedAt:String(n.updatedAt||date)};
      })
      .sort((a,b)=>String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt)));
  }

  function formatDate(v){if(!v)return"";try{return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${v}T12:00:00`))}catch{return v}}
  function textBody(v){return String(v||"").split(/\n\s*\n|\n/).map(x=>x.trim()).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join("")}

  function render(){
    const root=ensureShell(),grid=root.querySelector("[data-sn101-grid]"),archive=root.querySelector("[data-sn101-archive]");
    const filtered=activeYear?items.filter(x=>String(x.year)===String(activeYear)):items;
    if(!filtered.length){grid.innerHTML='<div class="sn101-empty">Belum ada berita pada arsip ini.</div>';}
    else{
      const lead=filtered[0],side=filtered.slice(1,6);
      grid.innerHTML=`<article class="sn101-lead"><div class="sn101-media">${lead.cover?`<img src="${esc(lead.cover)}" alt="${esc(lead.title)}" loading="eager" decoding="async">`:""}${lead.media.length>1?`<span class="sn101-count">${lead.media.length} foto</span>`:""}</div><div class="sn101-copy"><div class="sn101-meta"><span>${esc(lead.category)}</span><time>${esc(formatDate(lead.date))}</time></div><h3>${esc(lead.title)}</h3><p>${esc(lead.summary)}</p><button class="sn101-read" type="button" data-sn101-open="${esc(lead.id)}">Baca selengkapnya</button></div></article><div class="sn101-side">${side.map(x=>`<article class="sn101-card" data-sn101-open="${esc(x.id)}">${x.cover?`<img src="${esc(x.cover)}" alt="" loading="lazy" decoding="async">`:"<div></div>"}<div class="sn101-card-copy"><small>${esc(x.category)} • ${esc(formatDate(x.date))}</small><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p></div></article>`).join("")}</div>`;
      root.querySelectorAll("[data-sn101-open]").forEach(el=>el.addEventListener("click",()=>openArticle(el.dataset.sn101Open)));
    }
    const years=[...new Set(items.map(x=>x.year).filter(Boolean))].sort((a,b)=>b-a);
    archive.innerHTML=years.length?`<b>Arsip:</b><button class="sn101-year" aria-pressed="${!activeYear}" data-sn101-year="">Terbaru</button>${years.map(y=>`<button class="sn101-year" aria-pressed="${String(activeYear)===String(y)}" data-sn101-year="${y}">${y}</button>`).join("")}`:"";
    archive.querySelectorAll("[data-sn101-year]").forEach(b=>b.addEventListener("click",()=>{activeYear=b.dataset.sn101Year;render()}));
  }

  function openArticle(id){
    const root=ensureShell(),item=items.find(x=>x.id===id);if(!item)return;
    const gallery=item.media.slice(0,10);
    root.querySelector("[data-sn101-article]").innerHTML=`<article class="sn101-article"><div class="sn101-article-meta"><span>${esc(item.category)}</span><time>${esc(formatDate(item.date))}</time>${gallery.length?`<span>${gallery.length} foto</span>`:""}</div><h1>${esc(item.title)}</h1><p class="sn101-lede">${esc(item.summary)}</p>${gallery.length?`<div class="sn101-gallery">${gallery.map((url,i)=>`<figure><img src="${esc(url)}" alt="${esc(item.title)} — foto ${i+1}" loading="${i<2?'eager':'lazy'}" decoding="async"></figure>`).join("")}</div>`:""}<div class="sn101-body">${textBody(item.content)}</div></article>`;
    root.querySelector("[data-sn101-modal]").hidden=false;document.body.style.overflow="hidden";
  }
  function closeArticle(){const modal=document.querySelector("[data-sn101-modal]");if(modal&&!modal.hidden){modal.hidden=true;document.body.style.overflow=""}}

  async function load(){
    const root=ensureShell(),grid=root.querySelector("[data-sn101-grid]");
    if(!items.length)grid.innerHTML='<div class="sn101-empty">Memuat berita terbaru…</div>';
    try{const snapshot=await jsonp("publicSnapshot");if(snapshot?.ok!==true)throw new Error(snapshot?.error||"Data berita tidak tersedia.");items=normalize(snapshot);window.PAIBP_SPENSUS_NEWS_V101=items;render();document.dispatchEvent(new CustomEvent("paibp:news-ready",{detail:{items}}));}
    catch(e){if(!items.length)grid.innerHTML=`<div class="sn101-empty">${esc(e.message||"Berita belum dapat dimuat.")}</div>`;}
  }

  const init=()=>{ensureShell();setTimeout(load,80)};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();