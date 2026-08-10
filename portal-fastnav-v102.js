(()=>{
"use strict";
if(window.__PAIBP_FASTNAV_V102__)return;window.__PAIBP_FASTNAV_V102__=1;
const warmed=new Set();
function target(a){if(!a||a.target==='_blank'||a.hasAttribute('download'))return null;const raw=a.getAttribute('href')||'';if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:'))return null;try{const u=new URL(raw,location.href);if(u.origin!==location.origin)return null;u.hash='';return u.href}catch{return null}}
function warm(a){const u=target(a);if(!u||warmed.has(u))return;warmed.add(u);fetch(u,{method:'GET',cache:'force-cache',credentials:'same-origin'}).catch(()=>{})}
document.addEventListener('pointerover',e=>warm(e.target.closest?.('a[href]')),{passive:true,capture:true});
document.addEventListener('pointerdown',e=>warm(e.target.closest?.('a[href]')),{passive:true,capture:true});
document.addEventListener('touchstart',e=>warm(e.target.closest?.('a[href]')),{passive:true,capture:true});
if('serviceWorker'in navigator&&location.protocol!=='file:'){const reg=()=>navigator.serviceWorker.register('service-worker.js?v=102').then(r=>r.update()).catch(()=>null);if(document.readyState==='complete')reg();else addEventListener('load',reg,{once:true})}
})();