(()=>{
"use strict";
if(window.__NEWS_PUBLISH_DIRECT_V138__)return;window.__NEWS_PUBLISH_DIRECT_V138__=1;
const $=(s,r=document)=>r.querySelector(s);
const editorStatus=$("#ne-editor-status"),formStatus=$("#ne-form-status"),mediaStatus=$("#nea-status"),mediaProgress=$("#nea-progress");
let redirecting=false;
function serverConfirmed(){
  return String(editorStatus?.textContent||"").trim()==="Tayang" && /^Berhasil\./i.test(String(formStatus?.textContent||"").trim());
}
function goHome(){
  if(redirecting||!serverConfirmed())return;redirecting=true;
  const id=$("#ne-id")?.value||"";
  if(mediaProgress)mediaProgress.style.display="none";
  if(mediaStatus)mediaStatus.textContent="Berita telah dikonfirmasi server.";
  try{new BroadcastChannel("spensus-news").postMessage({type:"published",id,source:"server-confirmed-v138"})}catch{}
  const u=new URL("index.html",document.baseURI);u.searchParams.set("published",id||"1");u.searchParams.set("v","138");
  setTimeout(()=>location.replace(u.href),180);
}
const observer=new MutationObserver(goHome);
[editorStatus,formStatus].filter(Boolean).forEach(el=>observer.observe(el,{subtree:true,childList:true,characterData:true}));
goHome();
})();
