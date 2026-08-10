(() => {
  "use strict";
  if (window.__SPENSUS_GALLERY_CLOSE_V102__) return;
  window.__SPENSUS_GALLERY_CLOSE_V102__ = true;

  function apply() {
    const box = document.querySelector("[data-sg-lightbox]");
    if (!box) return false;
    const close = box.querySelector("[data-sg-close]");
    if (close) {
      close.textContent = "✕ Tutup";
      close.setAttribute("aria-label", "Tutup galeri foto");
      close.setAttribute("title", "Tutup galeri");
      close.style.position = "fixed";
      close.style.top = "max(12px, env(safe-area-inset-top))";
      close.style.right = "max(12px, env(safe-area-inset-right))";
      close.style.zIndex = "1000001";
      close.style.width = "auto";
      close.style.minWidth = "92px";
      close.style.height = "42px";
      close.style.padding = "0 15px";
      close.style.borderRadius = "999px";
      close.style.background = "rgba(198,39,63,.95)";
      close.style.color = "#fff";
      close.style.fontSize = "13px";
      close.style.fontWeight = "900";
      close.style.letterSpacing = ".01em";
      close.style.boxShadow = "0 10px 28px rgba(0,0,0,.32)";
      close.style.backdropFilter = "blur(8px)";
      close.style.cursor = "pointer";
    }
    box.setAttribute("aria-label", "Galeri foto berita. Gunakan tombol Tutup untuk kembali ke artikel.");
    return true;
  }

  const init = () => {
    [0, 80, 250, 700, 1500, 3000].forEach(ms => setTimeout(apply, ms));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();