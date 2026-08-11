(()=>{
"use strict";
if(window.__NEWS_PUBLISH_DIRECT_V114__)return;window.__NEWS_PUBLISH_DIRECT_V114__=1;
const $=(s,r=document)=>r.querySelector(s);
const btn=$("#ne-publish-direct");
const formStatus=$("#ne-form-status");
const mediaStatus=$("#nea-status");
const mediaProgress=$("#nea-progress");
let redirecting=false,normalizing=false;

function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function isBusy(){return !!btn?.disabled}
function isVerifyText(t){return /verifikasi|memastikan/i.test(String(t||""))}
function isDoneRemote(){return isVerifyText(btn?.textContent)||isVerifyText(formStatus?.textContent)}

function normalizeUI(){
  if(normalizing||redirecting)return;
  normalizing=true;
  try{
    if(btn){
      if(!btn.disabled && !isVerifyText(btn.textContent)) setText(btn,"Posting");
      else if(btn.disabled && !isVerifyText(btn.textContent)) setText(btn,"Posting…");
    }
    if(isBusy()){
      if(mediaStatus && mediaStatus.textContent) setText(mediaStatus,"Mengirim posting…");
      if(formStatus && formStatus.textContent && !isVerifyText(formStatus.textContent)) setText(formStatus,"Mengirim posting…");
    }
  }finally{normalizing=false}
}

function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open("paibp-smart-news-editor-v96",1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function markLocalPublished(id){
  if(!id)return;
  try{
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction("posts","readwrite"),store=tx.objectStore("posts"),g=store.get(id);
      g.onsuccess=()=>{const x=g.result;if(x){x.status="published";x.publishedAt=new Date().toISOString();x.updatedAt=x.publishedAt;store.put(x)}};
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
  }catch{}
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function goHome(){
  if(redirecting)return;redirecting=true;
  const id=$("#ne-id")?.value||"";
  if(btn){btn.disabled=true;setText(btn,"Tayang ✓")}
  if(mediaProgress)mediaProgress.style.display="none";
  if(mediaStatus)setText(mediaStatus,"Berita berhasil dikirim.");
  if(formStatus)setText(formStatus,"Berita berhasil diterbitkan. Membuka beranda…");
  try{new BroadcastChannel("spensus-news").postMessage({type:"published",id,source:"direct-v114"})}catch{}
  await Promise.race([markLocalPublished(id),sleep(120)]);
  const u=new URL("index.html",document.baseURI);u.searchParams.set("published",id||"1");u.searchParams.set("v","114");
  location.replace(u.href);
}

const observer=new MutationObserver(()=>{
  if(isDoneRemote()){goHome();return}
  normalizeUI();
});
if(btn)observer.observe(btn,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["disabled"]});
if(formStatus)observer.observe(formStatus,{subtree:true,childList:true,characterData:true});
if(mediaStatus)observer.observe(mediaStatus,{subtree:true,childList:true,characterData:true});

document.addEventListener("submit",e=>{
  if(e.target?.id!=="ne-form")return;
  requestAnimationFrame(normalizeUI);
},{capture:true});

normalizeUI();
})();
