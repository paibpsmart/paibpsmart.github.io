(()=>{"use strict";
if(window.__NEWS_UI_FAST_V150__)return;window.__NEWS_UI_FAST_V150__=1;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let scheduled=0;
function enhance(){scheduled=0;const root=$('#spensus-news-v102');if(!root)return;$$('.ig-year',root).forEach(section=>{const button=$(':scope>button[data-year]',section),list=$(':scope>.ig-year-list',section);if(!button||!list)return;const n=$$('.ig-archive-item',list).length;let badge=$('.ig-year-count',button);if(!badge){badge=document.createElement('span');badge.className='ig-year-count';const caret=[...button.children].find(x=>x.tagName==='SPAN');if(caret)button.insertBefore(badge,caret);else button.appendChild(badge)}const text=n+' Berita';if(badge.textContent!==text)badge.textContent=text})}
function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(enhance)}
const style=document.createElement('style');style.id='news-ui-fast-v150-style';style.textContent='#spensus-news-v102 .ig-year-count{margin-left:auto;display:inline-flex;min-width:62px;justify-content:center;padding:4px 8px;border-radius:999px;background:#e8f7f2;color:#087560;font-size:8px;font-weight:950}#spensus-news-v102 .ig-track{scroll-behavior:auto!important}#spensus-news-v102 .ig-slide img{display:block!important;visibility:visible!important;opacity:1!important}';document.head.appendChild(style);

document.addEventListener('click',e=>{
 const nav=e.target.closest?.('#spensus-news-v102 .ig-nav');
 if(nav){const carousel=nav.closest('.ig-carousel'),track=$('.ig-track',carousel);if(track){e.preventDefault();e.stopImmediatePropagation();const w=track.clientWidth||1,total=$$('.ig-slide',track).length||1,current=Math.round(track.scrollLeft/w),next=Math.max(0,Math.min(total-1,current+(nav.classList.contains('ig-prev')?-1:1)));track.scrollLeft=next*w;$$('.ig-dots i',carousel).forEach((d,i)=>d.classList.toggle('on',i===next))}return}
 if(e.target.closest?.('#spensus-news-v102 [data-news],#spensus-news-v102 [data-year]'))setTimeout(schedule,0);
},{capture:true});

// Observer dibatasi hanya untuk mendeteksi penggantian UI berita. Tidak memodifikasi DOM di callback,
// sehingga tidak dapat membentuk loop seperti V149.
const observer=new MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes){if(n.nodeType===1&&(n.id==='spensus-news-v102'||n.matches?.('.ig-year,.ig-year-list,.ig-archive-item')||n.querySelector?.('.ig-year,.ig-archive-item'))){schedule();return}}}});
observer.observe(document.body,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();