(() => {
  "use strict";
  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const hasScript=(name)=>[...document.scripts].some(s=>String(s.src||"").includes(name));
  const hasStyle=(name)=>[...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>String(l.href||"").includes(name));
  const addScript=(name,version)=>{
    if(hasScript(name))return;
    const s=document.createElement("script");
    s.src=new URL(`${name}?v=${version}`,document.baseURI).href;
    s.async=false;
    document.head.append(s);
  };
  const addStyle=(name,version)=>{
    if(hasStyle(name))return;
    const l=document.createElement("link");
    l.rel="stylesheet";
    l.href=new URL(`${name}?v=${version}`,document.baseURI).href;
    document.head.append(l);
  };

  // Hanya lapisan final yang benar-benar dibutuhkan untuk tampilan awal.
  // Loader V85 sebelumnya meminta belasan CSS/JS sebelum event load sehingga indikator
  // browser terus berputar walaupun konten utama sudah terlihat.
  addStyle("menu-icons-v108.css","109");
  addStyle("ui-final-v105.css","109");
  addScript("ui-final-v105.js","109");

  const loadCommonDeferred=()=>{
    addScript("portal-fastnav-v102.js","102");
    addScript("class-access-v102.js","102");
    addScript("ui-clean-v102.js","102");
    addStyle("visual-fix-v87.css","102");
    addStyle("visual-v89.css","102");
    addStyle("global-visual-v102.css","102");
  };

  const loadPageDeferred=()=>{
    if(page==="index.html"){
      addScript("home-clean-v92.js","102");
      addStyle("home-ticker-v94.css","102");
      addScript("home-ticker-v93.js","102");
      addScript("home-news-v102.js","102");
      addScript("home-news-media-v111.js","118");
      addScript("home-share-v102.js","123");
      addStyle("spensus-ai-v90.css","102");
      addScript("spensus-ai-shell-v90.js","102");
    }
    if(page==="akses-guru.html"){
      addScript("teacher-preview-fix-v87.js","102");
      addScript("owner-editor-v98.js","102");
    }
    if(page==="mapel-lain.html"){
      addStyle("multimapel-admin-v89.css","102");
      addStyle("mapel-premium-v102.css","102");
      addScript("mapel-card-icons-v102.js","102");
      addScript("multimapel-admin-v89.js","102");
    }
    if(page==="kendali-editor.html")addScript("news-editor-entry-v96.js","102");
  };

  const afterLoad=()=>{
    const work=()=>{
      loadCommonDeferred();
      loadPageDeferred();
    };
    if("requestIdleCallback" in window)requestIdleCallback(work,{timeout:450});
    else setTimeout(work,80);

    // Registrasi SW dilakukan setelah load dan tanpa r.update() paksa.
    // Pembaruan tidak lagi membuat halaman baru saja dibuka memuat ulang sendiri.
    if("serviceWorker" in navigator&&location.protocol!=="file:"){
      navigator.serviceWorker.register("service-worker.js?v=123").catch(()=>null);
    }
  };

  if(document.readyState==="complete")afterLoad();
  else window.addEventListener("load",afterLoad,{once:true});
})();
