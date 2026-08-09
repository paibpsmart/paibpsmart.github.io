(() => {
  "use strict";
  const page=(location.pathname.split("/").pop()||"").toLowerCase();
  if(page!=="akses-guru.html") return;

  const ID_KEY="paibp-smart-teacher-identity-v1";
  const TOKEN_KEY="paibp-smart-owner-gateway-v30";
  const norm=v=>String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const read=()=>{try{return JSON.parse(localStorage.getItem(ID_KEY)||"{}")}catch{return {}}};
  const owner=()=>{
    const i=read();
    const name=norm(i.name||i.teacherName||i.fullName||i.nama);
    const unit=norm(i.workUnit||i.school||i.teacherSchool||i.unit||i.sekolah);
    return name.includes("sunarso") && (unit.includes("smp negeri 1 susukan")||unit.includes("spensus"));
  };
  const arm=()=>{try{sessionStorage.setItem(TOKEN_KEY,"yes")}catch{}};

  function link(label,href,cls=""){
    const a=document.createElement("a");
    a.href=href;
    a.className=cls;
    a.textContent=label;
    a.addEventListener("click",()=>{if(owner())arm()});
    return a;
  }

  function mount(){
    if(!owner()){
      document.querySelector("#owner-editor-hub-v98")?.remove();
      document.querySelectorAll("[data-owner-editor-v98]").forEach(n=>n.remove());
      document.body.dataset.teacherOwner="no";
      return false;
    }
    document.body.dataset.teacherOwner="yes";
    document.body.dataset.teacherTier="registered";

    const nav=document.querySelector("#primary-navigation");
    if(nav&&!nav.querySelector('[data-owner-editor-v98="nav"]')){
      const a=link("⚙ Kendali Editor","kendali-editor.html?v=98");
      a.dataset.ownerEditorV98="nav";
      a.style.cssText="background:linear-gradient(135deg,#0f6fff,#6d39d8);color:#fff!important;font-weight:950;border-radius:13px;padding:10px 14px";
      nav.append(a);
    }
    if(nav&&!nav.querySelector('[data-owner-editor-v98="news"]')){
      const a=link("📰 Editor Berita","editor-berita.html?v=98");
      a.dataset.ownerEditorV98="news";
      a.style.cssText="background:linear-gradient(135deg,#0d9676,#1677ff);color:#fff!important;font-weight:950;border-radius:13px;padding:10px 14px";
      nav.append(a);
    }

    const panel=document.querySelector("#panel-teacher");
    if(panel&&!document.querySelector("#owner-editor-hub-v98")){
      const hub=document.createElement("section");
      hub.id="owner-editor-hub-v98";
      hub.setAttribute("aria-label","Kendali Editor Sunarso");
      hub.style.cssText="margin:0 0 18px;padding:16px;border:1px solid #bfd9ef;border-radius:20px;background:linear-gradient(135deg,#eef8ff,#f6efff);box-shadow:0 12px 30px rgba(19,67,107,.08);color:#153b59";
      hub.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap"><div><span style="display:block;font-size:10px;font-weight:950;letter-spacing:.12em;color:#1269aa">AKSES PEMILIK PORTAL</span><strong style="display:block;margin-top:4px;font-size:20px;color:#113852">Menu Editor</strong><small style="display:block;margin-top:4px;color:#61788a">Kelola portal atau langsung tulis dan upload berita Spensus.</small></div><div id="owner-editor-actions-v98" style="display:flex;gap:9px;flex-wrap:wrap"></div></div>';
      const actions=hub.querySelector("#owner-editor-actions-v98");
      const control=link("⚙ Kendali Editor","kendali-editor.html?v=98");
      const news=link("📰 Editor Berita & Upload","editor-berita.html?v=98");
      for(const a of [control,news]) a.style.cssText="display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 15px;border-radius:13px;color:#fff;text-decoration:none;font-weight:950;background:linear-gradient(135deg,#126cf5,#7141d8);box-shadow:0 9px 22px rgba(48,77,174,.18)";
      news.style.background="linear-gradient(135deg,#078f70,#1277df)";
      actions.append(control,news);
      const heading=panel.querySelector(".panel-heading");
      if(heading) heading.insertAdjacentElement("afterend",hub); else panel.prepend(hub);
    }
    return true;
  }

  const schedule=()=>[0,180,500,1200,2500,5000].forEach(ms=>setTimeout(mount,ms));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true}); else schedule();
  document.querySelector("#teacher-access-form")?.addEventListener("submit",()=>setTimeout(schedule,120));
  window.addEventListener("storage",e=>{if(e.key===ID_KEY)schedule()});
  document.addEventListener("click",e=>{
    if(e.target.closest("#teacher-gateway-trigger")) setTimeout(schedule,180);
  },true);
})();
