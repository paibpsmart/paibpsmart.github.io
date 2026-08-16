(()=>{
  "use strict";
  if(window.__YEAR_SIDEBAR_CONTROLS_V157__)return;
  window.__YEAR_SIDEBAR_CONTROLS_V157__=1;
  const ROOT="#spensus-news-v102";
  const YEARS=[2026,2025,2024,2023,2022,2021,2020,2019,2018,2017];
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let side=null;
  function prepare(){
    const root=$(ROOT);
    const next=$(".ig-side",root||document);
    if(!root||!next)return;
    side=next;
    YEARS.forEach(year=>{
      let section=$(`.ig-year:has(>button[data-year="${year}"])`,side);
      if(!section){
        section=document.createElement("section");
        section.className="ig-year ig-year-empty";
        section.innerHTML=`<button type="button" data-year="${year}" aria-expanded="false"><span class="ig-year-arrow" aria-hidden="true"></span><b>${year}</b><span class="ig-year-count zero">0 arsip</span></button><div class="ig-year-list" hidden><div class="ig-year-empty-message">Belum ada artikel yang tayang pada tahun ${year}.</div></div>`;
        side.appendChild(section);
      }
      const btn=$(":scope>button[data-year]",section);
      const list=$(":scope>.ig-year-list",section);
      if(!btn||!list)return;
      let arrow=$(":scope>.ig-year-arrow",btn);
      if(!arrow){
        arrow=document.createElement("span");
        arrow.className="ig-year-arrow";
        arrow.setAttribute("aria-hidden","true");
        btn.insertBefore(arrow,btn.firstChild);
      }
      arrow.textContent="";
      const count=$(":scope>.ig-year-count",btn);
      const real=$$(".ig-archive-item",list).length;
      if(count){count.textContent=`${real} arsip`;count.classList.toggle("zero",real===0)}
      section.classList.toggle("ig-year-empty",real===0);
      if(real===0&&!$(":scope>.ig-year-empty-message",list)){
        const msg=document.createElement("div");
        msg.className="ig-year-empty-message";
        msg.textContent=`Belum ada artikel yang tayang pada tahun ${year}.`;
        list.appendChild(msg);
      }
      btn.setAttribute("aria-expanded",String(!list.hidden));
    });
    if(!side.dataset.year157Bound){
      side.dataset.year157Bound="1";
      side.addEventListener("click",onClick,true);
    }
    refreshVisual();
  }
  function onClick(e){
    const btn=e.target.closest("button[data-year]");
    if(!btn||!side.contains(btn))return;
    e.preventDefault();
    e.stopPropagation();
    const section=btn.closest(".ig-year");
    const list=section&&$(":scope>.ig-year-list",section);
    if(!list)return;
    const wasOpen=!list.hidden;
    $$(".ig-year-list",side).forEach(x=>{if(x!==list)x.hidden=true});
    $$(".ig-year",side).forEach(x=>x.classList.remove("is-open"));
    list.hidden=wasOpen;
    section.classList.toggle("is-open",!wasOpen);
    btn.setAttribute("aria-expanded",String(!wasOpen));
    refreshVisual();
    try{localStorage.setItem("paibp-open-year",wasOpen?"":String(btn.dataset.year))}catch{}
  }
  function refreshVisual(){
    if(!side)return;
    $$(".ig-year",side).forEach(section=>{
      const btn=$(":scope>button[data-year]",section);
      const list=$(":scope>.ig-year-list",section);
      if(!btn||!list)return;
      btn.setAttribute("aria-expanded",String(!list.hidden));
      section.classList.toggle("is-open",!list.hidden);
    });
  }
  const style=document.createElement("style");
  style.id="year-sidebar-controls-v157-style";
  style.textContent=`
#spensus-news-v102 .ig-side .ig-year>button{display:grid!important;grid-template-columns:12px minmax(0,1fr) auto!important;align-items:center!important;column-gap:7px!important;width:100%!important}
#spensus-news-v102 .ig-side .ig-year>button>.ig-year-arrow{display:block!important;width:0!important;height:0!important;border-top:4px solid transparent!important;border-bottom:4px solid transparent!important;border-left:5px solid currentColor!important;color:#6d8492!important;font-size:0!important;line-height:0!important;transform:rotate(0deg)!important;transform-origin:50% 50%!important;margin-left:1px!important;padding:0!important}
#spensus-news-v102 .ig-side .ig-year.is-open>button>.ig-year-arrow{transform:rotate(90deg)!important;color:#0b6da8!important}
#spensus-news-v102 .ig-side .ig-year>button>b{grid-column:2!important}
#spensus-news-v102 .ig-side .ig-year>button>.ig-year-count{grid-column:3!important;white-space:nowrap!important}
#spensus-news-v102 .ig-side .ig-year-list[hidden]{display:none!important}
#spensus-news-v102 .ig-side .ig-year-empty-message{padding:10px 12px!important;font-size:9px!important;line-height:1.45!important;color:#718090!important}
`;
  document.head.appendChild(style);
  const observer=new MutationObserver(()=>{clearTimeout(window.__year157Timer);window.__year157Timer=setTimeout(prepare,60)});
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",prepare,{once:true});else prepare();
})();
