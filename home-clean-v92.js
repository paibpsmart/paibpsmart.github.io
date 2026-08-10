(() => {
  "use strict";
  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  if(page!=="index.html") return;

  const style=document.createElement("style");
  style.id="home-legacy-hard-hide-v102";
  style.textContent="#beranda-digital,#tanggapan,.home-rail,.developer-signature{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}";
  document.head.appendChild(style);

  function cleanLegacyHome(){
    document.querySelector("#beranda-digital")?.remove();
    document.querySelector("#tanggapan")?.remove();
    document.querySelectorAll(".home-rail,.developer-signature").forEach(el=>el.remove());
  }

  const run=()=>{cleanLegacyHome();[120,500,1400,3200].forEach(ms=>setTimeout(cleanLegacyHome,ms));};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
})();