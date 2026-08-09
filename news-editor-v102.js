(() => {
  "use strict";
  if (window.__PAIBP_NEWS_EDITOR_CHUNKED_V102__) return;
  window.__PAIBP_NEWS_EDITOR_CHUNKED_V102__ = true;
  const s = document.createElement("script");
  s.src = new URL("news-editor-chunked-v102.js?v=102&hotfix=2", document.baseURI).href;
  s.defer = true;
  s.onerror = () => {
    const el = document.querySelector("#ne-form-status");
    if (el) {
      el.textContent = "Editor berita gagal dimuat. Muat ulang halaman sekali.";
      el.dataset.tone = "error";
    }
  };
  document.head.appendChild(s);
})();