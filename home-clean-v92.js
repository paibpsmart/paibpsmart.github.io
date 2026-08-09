(() => {
  "use strict";
  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  if(page!=="index.html") return;

  function cleanLegacyHomeShowcase(){
    const home=document.querySelector("#beranda-digital");
    if(!home) return false;
    const main=home.querySelector(".home-main-column");
    main?.querySelector(":scope > .section-heading-v24")?.remove();
    main?.querySelector(":scope > .feature-showcase-v25")?.remove();
    home.querySelector("#spensus-ai")?.remove();
    home.dataset.v92LegacyShowcaseRemoved="true";
    return true;
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",cleanLegacyHomeShowcase,{once:true});
  else cleanLegacyHomeShowcase();
})();
