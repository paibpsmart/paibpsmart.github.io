(() => {
  "use strict";

  function restoreArchiveYears(){
    document.querySelectorAll("[data-year]").forEach((node)=>{
      const raw=String(node.getAttribute("data-year")||"").trim();
      if(/^20(?:1[6-9]|2[0-6])$/.test(raw)){
        node.textContent=raw;
        return;
      }
      if(/^(?:lawas|old|older|legacy|before-2016|<2016)$/i.test(raw)){
        node.textContent="Berita Lawas";
      }
    });
  }

  function loadIconCore(){
    if(document.querySelector('script[data-icon-art-core="v86"]')) return;
    const s=document.createElement("script");
    s.src="icon-art-core-v86.js?v=160";
    s.defer=true;
    s.dataset.iconArtCore="v86";
    document.head.appendChild(s);
  }

  let queued=false;
  function repair(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      restoreArchiveYears();
    });
  }

  function start(){
    loadIconCore();
    restoreArchiveYears();
    const observer=new MutationObserver(repair);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(restoreArchiveYears,120);
    setTimeout(restoreArchiveYears,500);
    setTimeout(restoreArchiveYears,1500);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
