(() => {
  "use strict";
  const BUILD="90";
  const launcher=document.getElementById("spensus-ai-launcher-v27");
  const drawer=document.getElementById("spensus-ai-drawer-v27");
  if(!launcher||!drawer)return;
  const POSITION_KEY="paibp-smart-spensus-ai-position-v90";
  let machinePromise=null;
  let dragging=false,moved=false,pointerId=null,startX=0,startY=0,startLeft=0,startTop=0,raf=0,nextLeft=0,nextTop=0,suppressClickUntil=0;

  const clamp=(value,min,max)=>Math.min(Math.max(value,min),Math.max(min,max));
  const loadScript=(name,version=BUILD)=>new Promise((resolve,reject)=>{
    if([...document.scripts].some(s=>String(s.src||"").includes(name))){resolve(true);return;}
    const s=document.createElement("script");
    s.src=new URL(`${name}?v=${version}`,document.baseURI).href;
    s.defer=true;
    s.onload=()=>resolve(true);
    s.onerror=()=>reject(new Error(`Gagal memuat ${name}`));
    document.head.append(s);
  });

  function safeRect(){return launcher.getBoundingClientRect();}
  function place(left,top,persist=false){
    const rect=safeRect();
    const margin=8;
    const maxLeft=Math.max(margin,window.innerWidth-rect.width-margin);
    const maxTop=Math.max(margin,window.innerHeight-rect.height-margin);
    left=clamp(left,margin,maxLeft);
    top=clamp(top,margin,maxTop);
    launcher.style.position="fixed";
    launcher.style.left=`${Math.round(left)}px`;
    launcher.style.top=`${Math.round(top)}px`;
    launcher.style.right="auto";
    launcher.style.bottom="auto";
    if(persist){try{localStorage.setItem(POSITION_KEY,JSON.stringify({left,top}));}catch{}}
  }
  function restore(){
    try{
      const saved=JSON.parse(localStorage.getItem(POSITION_KEY)||"null");
      if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top))requestAnimationFrame(()=>place(saved.left,saved.top,false));
    }catch{}
  }
  function schedulePlace(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;place(nextLeft,nextTop,false);});
  }

  async function ensureMachine(){
    if(machinePromise)return machinePromise;
    machinePromise=(async()=>{
      // Materi portal hanya dimuat ketika AI benar-benar dipakai, bukan pada startup beranda.
      await loadScript("content-data.js",BUILD);
      await loadScript("spensus-ai.js",BUILD);
      return true;
    })().catch(err=>{machinePromise=null;throw err;});
    return machinePromise;
  }

  function openDrawer(){
    drawer.hidden=false;
    document.body.classList.add("ai-drawer-open-v27");
    launcher.classList.add("is-open");
    launcher.setAttribute("aria-expanded","true");
    drawer.setAttribute("aria-busy","true");
    ensureMachine().then(()=>{
      drawer.removeAttribute("aria-busy");
      setTimeout(()=>drawer.querySelector("[data-ai-input]")?.focus({preventScroll:true}),60);
    }).catch(error=>{
      drawer.removeAttribute("aria-busy");
      const messages=drawer.querySelector("[data-ai-messages]");
      if(messages&&!messages.textContent.trim()) messages.innerHTML=`<article class="v48-ai-message assistant"><span>AI</span><div><section><p>Spensus AI belum dapat dimuat: ${String(error?.message||"kesalahan jaringan").replace(/[<>]/g,"")}. Coba lagi setelah koneksi stabil.</p></section></div></article>`;
    });
  }
  function closeDrawer(){
    drawer.hidden=true;
    document.body.classList.remove("ai-drawer-open-v27");
    launcher.classList.remove("is-open");
    launcher.setAttribute("aria-expanded","false");
    launcher.focus({preventScroll:true});
  }

  launcher.setAttribute("aria-expanded",String(!drawer.hidden));
  launcher.dataset.draggable="true";
  launcher.addEventListener("pointerdown",event=>{
    if(event.button!==0)return;
    const rect=safeRect();
    dragging=true;moved=false;pointerId=event.pointerId;
    startX=event.clientX;startY=event.clientY;startLeft=rect.left;startTop=rect.top;
    launcher.setPointerCapture?.(pointerId);
    launcher.classList.add("is-dragging");
  });
  launcher.addEventListener("pointermove",event=>{
    if(!dragging||event.pointerId!==pointerId)return;
    const dx=event.clientX-startX,dy=event.clientY-startY;
    if(!moved&&Math.hypot(dx,dy)<6)return;
    moved=true;
    nextLeft=startLeft+dx;nextTop=startTop+dy;schedulePlace();
    event.preventDefault();
  });
  const finishDrag=event=>{
    if(!dragging||event.pointerId!==pointerId)return;
    dragging=false;
    launcher.classList.remove("is-dragging");
    try{launcher.releasePointerCapture?.(pointerId);}catch{}
    pointerId=null;
    if(moved){
      const rect=safeRect();place(rect.left,rect.top,true);
      suppressClickUntil=performance.now()+350;
    }
  };
  launcher.addEventListener("pointerup",finishDrag);
  launcher.addEventListener("pointercancel",finishDrag);
  launcher.addEventListener("click",event=>{
    event.preventDefault();event.stopImmediatePropagation();
    if(performance.now()<suppressClickUntil)return;
    openDrawer();
  },true);
  drawer.querySelectorAll("[data-ai-close]").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();closeDrawer();}));
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!drawer.hidden)closeDrawer();});
  window.addEventListener("resize",()=>{
    const rect=safeRect();
    if(launcher.style.left)place(rect.left,rect.top,false);
  },{passive:true});
  restore();
  window.PAIBP_SPENSUS_AI_SHELL_V90=Object.freeze({build:BUILD,open:openDrawer,close:closeDrawer,resetPosition(){try{localStorage.removeItem(POSITION_KEY);}catch{} launcher.removeAttribute("style");}});
})();