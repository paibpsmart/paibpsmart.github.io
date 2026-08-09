(() => {
  "use strict";
  const channelName="spensus-news-v101";
  const key="paibp-spensus-news-refresh-v101";
  let channel=null;
  try{if("BroadcastChannel" in window)channel=new BroadcastChannel(channelName)}catch{}
  const refreshHome=()=>document.querySelector("[data-sn101-refresh]")?.click();
  channel?.addEventListener("message",e=>{if(e.data?.type==="published"||e.data?.type==="deleted")refreshHome()});
  window.addEventListener("storage",e=>{if(e.key===key)refreshHome()});
  const announce=type=>{
    try{channel?.postMessage({type,at:Date.now()})}catch{}
    try{localStorage.setItem(key,String(Date.now()))}catch{}
  };
  document.addEventListener("paibp:editor-news-published",()=>announce("published"));
  document.addEventListener("paibp:editor-news-deleted",()=>announce("deleted"));
})();