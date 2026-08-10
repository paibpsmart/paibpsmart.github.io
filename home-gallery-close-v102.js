(() => {
  "use strict";
  if (window.__SPENSUS_GALLERY_CLOSE_V102__) return;
  window.__SPENSUS_GALLERY_CLOSE_V102__ = true;

  let returnScrollY = 0;

  function injectStyle() {
    if (document.querySelector("#spensus-gallery-fullscreen-v102")) return;
    const st = document.createElement("style");
    st.id = "spensus-gallery-fullscreen-v102";
    st.textContent = `
      #spensus-news-v102{overflow:visible!important;content-visibility:visible!important;contain:none!important}
      #spensus-news-v102 .sg-lightbox{
        position:fixed!important;
        inset:0!important;
        width:100vw!important;
        height:100vh!important;
        height:100dvh!important;
        max-width:none!important;
        max-height:none!important;
        z-index:2147483600!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:0!important;
        margin:0!important;
        overflow:hidden!important;
        background:rgba(2,10,16,.975)!important;
        backdrop-filter:none!important;
      }
      #spensus-news-v102 .sg-lightbox[hidden]{display:none!important}
      #spensus-news-v102 .sg-lightbox-stage{
        width:100vw!important;
        height:100vh!important;
        height:100dvh!important;
        min-width:0!important;
        max-width:none!important;
        max-height:none!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        gap:10px!important;
        padding:max(64px,calc(env(safe-area-inset-top) + 54px)) 72px max(28px,calc(env(safe-area-inset-bottom) + 18px))!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #spensus-news-v102 .sg-lightbox-stage img,
      #spensus-news-v102 [data-sg-lightbox-img]{
        display:block!important;
        width:auto!important;
        height:auto!important;
        max-width:calc(100vw - 150px)!important;
        max-height:calc(100dvh - 130px)!important;
        object-fit:contain!important;
        object-position:center!important;
        filter:none!important;
        transform:none!important;
        image-rendering:auto!important;
        border-radius:10px!important;
        box-shadow:0 18px 55px rgba(0,0,0,.38)!important;
      }
      #spensus-news-v102 .sg-lightbox-caption{
        flex:0 0 auto!important;
        max-width:min(900px,calc(100vw - 40px))!important;
        color:#edf7f4!important;
        font-size:12px!important;
        line-height:1.4!important;
        text-align:center!important;
        margin:0!important;
      }
      #spensus-news-v102 .sg-lightbox-prev,
      #spensus-news-v102 .sg-lightbox-next{
        position:fixed!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        z-index:2147483603!important;
        width:48px!important;
        height:48px!important;
        min-width:48px!important;
        padding:0!important;
        border:1px solid rgba(255,255,255,.24)!important;
        border-radius:50%!important;
        background:rgba(12,38,48,.86)!important;
        color:#fff!important;
        font-size:29px!important;
        line-height:1!important;
        display:grid!important;
        place-items:center!important;
        box-shadow:0 10px 25px rgba(0,0,0,.3)!important;
        cursor:pointer!important;
      }
      #spensus-news-v102 .sg-lightbox-prev{left:max(14px,env(safe-area-inset-left))!important}
      #spensus-news-v102 .sg-lightbox-next{right:max(14px,env(safe-area-inset-right))!important}
      #spensus-news-v102 .sg-lightbox-close{
        position:fixed!important;
        top:max(12px,env(safe-area-inset-top))!important;
        right:max(12px,env(safe-area-inset-right))!important;
        z-index:2147483605!important;
        width:auto!important;
        min-width:96px!important;
        height:44px!important;
        padding:0 16px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:6px!important;
        border:1px solid rgba(255,255,255,.24)!important;
        border-radius:999px!important;
        background:#d7354f!important;
        color:#fff!important;
        font-size:13px!important;
        font-weight:900!important;
        line-height:1!important;
        letter-spacing:.01em!important;
        box-shadow:0 12px 30px rgba(0,0,0,.38)!important;
        cursor:pointer!important;
        visibility:visible!important;
        opacity:1!important;
      }
      #spensus-news-v102 .sg-lightbox-close:hover{background:#ee405c!important}
      @media(max-width:640px){
        #spensus-news-v102 .sg-lightbox-stage{
          padding:max(64px,calc(env(safe-area-inset-top) + 54px)) 8px max(30px,calc(env(safe-area-inset-bottom) + 18px))!important;
        }
        #spensus-news-v102 .sg-lightbox-stage img,
        #spensus-news-v102 [data-sg-lightbox-img]{
          max-width:calc(100vw - 16px)!important;
          max-height:calc(100dvh - 128px)!important;
          border-radius:7px!important;
        }
        #spensus-news-v102 .sg-lightbox-prev,
        #spensus-news-v102 .sg-lightbox-next{
          top:auto!important;
          bottom:max(15px,env(safe-area-inset-bottom))!important;
          transform:none!important;
          width:44px!important;
          height:44px!important;
          min-width:44px!important;
          background:rgba(5,32,43,.94)!important;
        }
        #spensus-news-v102 .sg-lightbox-prev{left:max(14px,env(safe-area-inset-left))!important}
        #spensus-news-v102 .sg-lightbox-next{right:max(14px,env(safe-area-inset-right))!important}
        #spensus-news-v102 .sg-lightbox-close{
          min-width:88px!important;
          height:42px!important;
          padding:0 14px!important;
        }
        #spensus-news-v102 .sg-lightbox-caption{
          padding:0 54px!important;
          font-size:10px!important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  function forceClose() {
    const box = document.querySelector("[data-sg-lightbox]");
    if (!box) return;
    box.hidden = true;
    box.setAttribute("hidden", "");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    requestAnimationFrame(() => window.scrollTo({ top: returnScrollY, left: 0, behavior: "auto" }));
  }

  function apply() {
    injectStyle();
    const box = document.querySelector("[data-sg-lightbox]");
    if (!box) return false;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Galeri foto berita");

    const close = box.querySelector("[data-sg-close]");
    if (close) {
      close.textContent = "✕ Tutup";
      close.setAttribute("aria-label", "Tutup galeri dan kembali ke artikel");
      close.setAttribute("title", "Tutup galeri");
      if (!close.dataset.galleryCloseBound) {
        close.dataset.galleryCloseBound = "1";
        close.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          forceClose();
        });
      }
    }
    return true;
  }

  document.addEventListener("click", (e) => {
    const photo = e.target.closest?.("#spensus-news-v102 [data-photo]");
    if (photo) {
      returnScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      apply();
      requestAnimationFrame(apply);
      return;
    }
    const box = e.target.closest?.("[data-sg-lightbox]");
    if (box && e.target === box) forceClose();
  }, true);

  document.addEventListener("keydown", (e) => {
    const box = document.querySelector("[data-sg-lightbox]");
    if (e.key === "Escape" && box && !box.hidden) {
      e.preventDefault();
      forceClose();
    }
  }, true);

  const init = () => {
    injectStyle();
    [0, 80, 250, 700, 1500, 3000].forEach(ms => setTimeout(apply, ms));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();