(()=>{
"use strict";
if(window.__SPENSUS_ARCHIVE_V145__)return;window.__SPENSUS_ARCHIVE_V145__=1;
const months={januari:0,februari:1,maret:2,april:3,mei:4,juni:5,juli:6,agustus:7,september:8,oktober:9,november:10,desember:11};
function ts(v){const m=String(v||"").toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);return m&&months[m[2]]!==undefined?new Date(+m[3],months[m[2]],+m[1]).getTime():0}
function run(){document.querySelectorAll("#spensus-news-v102 .ig-year").forEach(section=>{const button=section.querySelector(":scope>button[data-year]"),list=section.querySelector(":scope>.ig-year-list");if(!button||!list)return;const rows=[...list.querySelectorAll(":scope>.ig-archive-item")];rows.sort((a,b)=>ts(b.querySelector("small")?.textContent)-ts(a.querySelector("small")?.textContent));rows.forEach(x=>list.appendChild(x));let badge=button.querySelector(".ig-year-count");if(!badge){badge=document.createElement("span");badge.className="ig-year-count";const caret=button.lastElementChild;button.insertBefore(badge,caret)}badge.textContent=rows.length+" Berita"})}
const style=document.createElement("style");style.textContent="#spensus-news-v102 .ig-year>button{gap:8px}#spensus-news-v102 .ig-year-count{margin-left:auto;padding:4px 8px;border-radius:999px;background:#e8f7f2;color:#087560;font-size:8px;font-weight:950;white-space:nowrap}";document.head.appendChild(style);
setInterval(run,700);run();
})();