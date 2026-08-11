(()=>{
"use strict";
/* Compatibility shim: V111 tidak lagi mengunggah media ke GitHub dan tidak pernah meminta GitHub token. */
if(window.__NEWS_ATTACHMENTS_V111_SHIM__)return;window.__NEWS_ATTACHMENTS_V111_SHIM__=1;
const addStyle=()=>{if(document.querySelector('link[href*="news-attachments-v112.css"]'))return;const l=document.createElement("link");l.rel="stylesheet";l.href=new URL("news-attachments-v112.css?v=112",document.baseURI).href;document.head.appendChild(l)};
const addScript=()=>{if(window.__NEWS_ATTACHMENTS_V112__||document.querySelector('script[src*="news-attachments-v112.js"]'))return;const s=document.createElement("script");s.src=new URL("news-attachments-v112.js?v=112",document.baseURI).href;s.async=false;document.head.appendChild(s)};
addStyle();addScript();
})();
