(() => {
  "use strict";
  /* Lightweight compatibility/bootstrap shim: no global MutationObserver, no full DOM rescans. */
  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const hasScript=(name)=>[...document.scripts].some(s=>String(s.src||"").includes(name));
  const hasStyle=(name)=>[...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>String(l.href||"").includes(name));
  const addScript=(name,version)=>{if(hasScript(name))return;const s=document.createElement("script");s.src=new URL(`${name}?v=${version}`,document.baseURI).href;s.defer=true;document.head.append(s)};
  const addStyle=(name,version)=>{if(hasStyle(name))return;const l=document.createElement("link");l.rel="stylesheet";l.href=new URL(`${name}?v=${version}`,document.baseURI).href;document.head.append(l)};

  addScript("icon-art-v86.js","101");
  addStyle("visual-fix-v87.css","101");
  addStyle("visual-v89.css","101");

  if(page==="index.html"){
    addScript("home-clean-v92.js","101");
    addStyle("home-ticker-v94.css","101");
    addScript("home-ticker-v93.js","101");
    addStyle("home-news-v101.css","101");
    addScript("home-news-v101.js","101");
    addScript("news-live-sync-v101.js","101");
    addStyle("spensus-ai-v90.css","101");
    addScript("spensus-ai-shell-v90.js","101");
  }
  if(page==="akses-guru.html"){
    addScript("teacher-preview-fix-v87.js","101");
    addScript("owner-editor-v98.js","101");
  }
  if(page==="mapel-lain.html"){
    addStyle("multimapel-admin-v89.css","101");
    addScript("multimapel-admin-v89.js","101");
  }
  if(page==="kendali-editor.html") addScript("news-editor-entry-v96.js","101");

  if("serviceWorker" in navigator&&location.protocol!=="file:"){
    const register=()=>navigator.serviceWorker.register("service-worker.js?v=101").then(r=>r.update()).catch(()=>null);
    if(document.readyState==="complete")register();else window.addEventListener("load",register,{once:true});
  }
})();