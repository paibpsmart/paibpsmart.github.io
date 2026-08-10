(() => {
  "use strict";
  if (window.__SPENSUS_HOME_NEWS_POLISH_V102__) return;
  window.__SPENSUS_HOME_NEWS_POLISH_V102__ = true;

  const compact = (v) => String(v || "").replace(/\s+/g, " ").trim();
  const legacyLabels = [
    /^Suara pengunjung$/i,
    /^Kegiatan terbaru$/i,
    /^Jejak pengunjung$/i,
    /^Kunjungan terkini$/i,
    /^Identitas sekolah$/i,
    /^Arsip berita$/i
  ];

  function bestLegacyContainer(el) {
    let node = el;
    let best = null;
    for (let i = 0; node && node !== document.body && i < 7; i += 1, node = node.parentElement) {
      if (node.closest?.("#spensus-news-v102")) return null;
      const text = compact(node.textContent);
      if (!text || text.length > 2400) break;
      const structural = node.matches?.("article,section,aside,[class*='card'],[class*='panel'],[class*='rail'],[class*='widget'],[class*='sidebar']");
      if (structural || text.length < 900) best = node;
    }
    return best || el.parentElement;
  }

  function removeLegacyPanels() {
    document.querySelector("#tanggapan")?.remove();
    document.querySelectorAll(".home-rail,.developer-signature").forEach((el) => el.remove());

    const textNodes = document.querySelectorAll("h1,h2,h3,h4,h5,strong,b,span,p,small");
    textNodes.forEach((el) => {
      if (el.closest("#spensus-news-v102")) return;
      const text = compact(el.textContent);
      if (!legacyLabels.some((rx) => rx.test(text))) return;
      const card = bestLegacyContainer(el);
      if (card && !card.closest?.("#spensus-news-v102")) card.remove();
    });

    document.querySelectorAll("div,section,article,aside").forEach((el) => {
      if (el.closest("#spensus-news-v102")) return;
      const text = compact(el.textContent);
      if (!/Sunarso,?\s*S\.Pd\.I\.?[,]?\s*Gr/i.test(text)) return;
      if (!/Pengembang|Guru\s+PAIBP/i.test(text)) return;
      if (text.length > 500) return;
      const card = bestLegacyContainer(el) || el;
      if (card && !card.closest?.("#spensus-news-v102")) card.remove();
    });

    document.querySelectorAll("aside,[class*='rail'],[class*='sidebar']").forEach((el) => {
      if (el.closest("#spensus-news-v102")) return;
      if (!compact(el.textContent) && !el.querySelector("img,button,input,textarea,select")) el.remove();
    });
  }

  function injectPolish() {
    if (document.querySelector("#spensus-home-polish-v102")) return;
    const st = document.createElement("style");
    st.id = "spensus-home-polish-v102";
    st.textContent = `
      #tanggapan,.home-rail,.developer-signature{display:none!important}
      #spensus-news-v102 .sg-feature{isolation:isolate}
      #spensus-news-v102 .sg-cover{background:linear-gradient(145deg,#082e29,#102d43)!important;aspect-ratio:16/9!important}
      #spensus-news-v102 .sg-cover img{object-fit:contain!important;object-position:center!important;background:#082923!important;filter:none!important;image-rendering:auto!important}
      #spensus-news-v102 .sg-thumbs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;overflow:visible!important;padding:10px 0 0!important;scroll-snap-type:none!important}
      #spensus-news-v102 .sg-thumb{width:auto!important;height:auto!important;min-width:0!important;flex:none!important;aspect-ratio:4/3!important;border-radius:12px!important;background:#092d29!important}
      #spensus-news-v102 .sg-thumb:first-child{display:none!important}
      #spensus-news-v102 .sg-thumb img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;filter:none!important}
      #spensus-news-v102 .sg-year-panel{backdrop-filter:none!important}
      #spensus-news-v102 .sg-year-toggle{font-family:inherit!important}
      #spensus-news-v102 .sg-archive-item strong{font-size:12px!important;line-height:1.4!important}
      #spensus-news-v102 .sg-archive-item small{font-size:10px!important}
      #spensus-news-v102 .sg-body{max-width:76ch!important}
      #spensus-news-v102 .sg-title{max-width:20ch}
      @media(max-width:720px){
        #spensus-news-v102 .sg-layout{grid-template-columns:1fr!important}
        #spensus-news-v102 .sg-main{order:1!important}
        #spensus-news-v102 .sg-side{order:2!important;position:static!important}
        #spensus-news-v102 .sg-thumbs{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
        #spensus-news-v102 .sg-cover{aspect-ratio:4/3!important}
        #spensus-news-v102 .sg-cover img{object-fit:contain!important}
        #spensus-news-v102 .sg-feature{box-shadow:0 12px 30px rgba(0,0,0,.16)!important}
      }
      @media(max-width:390px){
        #spensus-news-v102 .sg-thumbs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #spensus-news-v102 .sg-title{font-size:26px!important;line-height:1.08!important}
        #spensus-news-v102 .sg-summary{font-size:13px!important;line-height:1.7!important}
      }
    `;
    document.head.appendChild(st);
  }

  function init() {
    injectPolish();
    [0, 80, 250, 700, 1600, 3200, 5200].forEach((ms) => setTimeout(removeLegacyPanels, ms));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();