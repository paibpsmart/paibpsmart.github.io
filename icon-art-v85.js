(() => {
  "use strict";
  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const hasScript=(name)=>[...document.scripts].some(s=>String(s.src||"").includes(name));
  const hasStyle=(name)=>[...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>String(l.href||"").includes(name));
  const addScript=(name,version)=>{if(hasScript(name))return;const s=document.createElement("script");s.src=new URL(`${name}?v=${version}`,document.baseURI).href;s.async=false;s.defer=true;document.head.append(s)};
  const addStyle=(name,version)=>{if(hasStyle(name))return;const l=document.createElement("link");l.rel="stylesheet";l.href=new URL(`${name}?v=${version}`,document.baseURI).href;document.head.append(l)};

  const criticalIcons={
    student:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5v-16Z"/>',
    islamic:'<path d="M19 15.2A7.9 7.9 0 0 1 8.8 5 7.9 7.9 0 1 0 19 15.2Z"/><path d="M16.5 5.2 17 6.4l1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2Z"/>',
    game:'<path d="M7 7h10a5 5 0 0 1 4.8 6.4l-1.1 3.7a2.6 2.6 0 0 1-4.4 1l-1.5-1.6H9.2l-1.5 1.6a2.6 2.6 0 0 1-4.4-1l-1.1-3.7A5 5 0 0 1 7 7Z"/><path d="M7 11v5M4.5 13.5h5M16 12.5h.1M19 15.5h.1"/>',
    mapel:'<rect x="3.5" y="4" width="7" height="7" rx="1.4"/><rect x="13.5" y="4" width="7" height="7" rx="1.4"/><rect x="3.5" y="14" width="7" height="6" rx="1.4"/><rect x="13.5" y="14" width="7" height="6" rx="1.4"/>',
    school:'<path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M6 12v5.5M18 12v5.5M4 20h16M12 14v6"/>',
    library:'<path d="M5 4h5v16H5zM10 6h5v14h-5M15.5 5.2l3-.8 3.8 14.9-3 .8z"/>',
    article:'<path d="m5 19 3.8-.8L19 8a2 2 0 0 0-3-3L5.8 15.2 5 19Z"/><path d="M4 21h16"/>',
    teacher:'<path d="M12 3 3 7.5 12 12l7-3.5V14h2V7.5L12 3Z"/><path d="M6 11.5v4.3c0 2.4 2.7 4.2 6 4.2s6-1.8 6-4.2v-4.3"/>'
  };
  const svg=body=>`<svg class="v102-critical-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  function featureType(a){const h=String(a?.getAttribute('href')||'').toLowerCase(),t=String(a?.textContent||'').toLowerCase();if(h.includes('#student')||t.includes('ruang murid'))return['student','#075e9d'];if(h.includes('#islamic')||t.includes('fitur islami'))return['islamic','#7136bb'];if(h.includes('#games')||t.includes('game'))return['game','#08785a'];if(h.includes('mapel-lain')||t.includes('mapel'))return['mapel','#b95308'];if(h.includes('about-spensus')||t.includes('profil sekolah'))return['school','#a52f67'];if(h.includes('literasi')||t.includes('literasi'))return['library','#3e4fb7'];if(h.includes('artikel')||t.includes('artikel'))return['article','#a52f67'];if(h.includes('akses-guru')||t.includes('portal guru'))return['teacher','#8c6500'];return['student','#075e9d']}
  function hardenSvg(holder,color){if(!holder)return;holder.style.setProperty('color',color,'important');holder.style.setProperty('-webkit-text-fill-color',color,'important');holder.style.setProperty('opacity','1','important');holder.style.setProperty('visibility','visible','important');holder.querySelectorAll('svg').forEach(s=>{s.style.setProperty('display','block','important');s.style.setProperty('width','27px','important');s.style.setProperty('height','27px','important');s.style.setProperty('color',color,'important');s.style.setProperty('opacity','1','important');s.querySelectorAll('*').forEach(n=>{n.style.setProperty('fill','none','important');n.style.setProperty('stroke','currentColor','important');n.style.setProperty('stroke-width','2.2','important');n.style.setProperty('stroke-linecap','round','important');n.style.setProperty('stroke-linejoin','round','important');n.style.setProperty('opacity','1','important')})})}
  function forceCriticalIcons(){
    document.querySelectorAll('.directory-feature-v25').forEach(a=>{const h=a.querySelector('.directory-feature-icon');if(!h)return;const [key,color]=featureType(a);if(h.dataset.v102Critical!==key){h.innerHTML=svg(criticalIcons[key]);h.dataset.v102Critical=key}hardenSvg(h,color)});
    document.querySelectorAll('.access-tile').forEach(a=>{const h=a.querySelector('.access-icon');if(!h)return;const [key,color]=featureType(a);if(!h.querySelector('svg'))h.innerHTML=svg(criticalIcons[key]);hardenSvg(h,color)});
    document.querySelectorAll('.hero-action-icon,.nav-svg,.orbit-item,.teacher-doc-menu button>span,.v86-icon-disc').forEach((h,i)=>hardenSvg(h,h.style.color||getComputedStyle(h).color||'#075e9d'));
  }

  addScript("portal-fastnav-v102.js","102");
  addScript("class-access-v102.js","102");
  addScript("ui-clean-v102.js","102");
  addScript("icon-art-v86.js","102");addStyle("visual-fix-v87.css","102");addStyle("visual-v89.css","102");
  addStyle("global-visual-v102.css","102");
  if(page==="index.html"){
    addScript("home-clean-v92.js","102");addStyle("home-ticker-v94.css","102");addScript("home-ticker-v93.js","102");
    addScript("home-news-v102.js","102");addScript("home-share-v102.js","102");
    addStyle("spensus-ai-v90.css","102");addScript("spensus-ai-shell-v90.js","102");
  }
  if(page==="akses-guru.html"){addScript("teacher-preview-fix-v87.js","102");addScript("owner-editor-v98.js","102")}
  if(page==="mapel-lain.html"){addStyle("multimapel-admin-v89.css","102");addStyle("mapel-premium-v102.css","102");addScript("multimapel-admin-v89.js","102")}
  if(page==="kendali-editor.html")addScript("news-editor-entry-v96.js","102");

  const start=()=>{forceCriticalIcons();[80,240,700,1500,3200].forEach(ms=>setTimeout(forceCriticalIcons,ms))};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-open-panel],.directory-feature-v25,.access-tile,.teacher-doc-menu button'))setTimeout(forceCriticalIcons,50)},{passive:true,capture:true});

  if("serviceWorker" in navigator&&location.protocol!=="file:"){const register=()=>navigator.serviceWorker.register("service-worker.js?v=102").then(r=>r.update()).catch(()=>null);if(document.readyState==="complete")register();else window.addEventListener("load",register,{once:true})}
})();