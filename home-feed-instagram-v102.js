(() => {
  "use strict";
  if (window.__SPENSUS_INSTAGRAM_FEED_V102__) return;
  window.__SPENSUS_INSTAGRAM_FEED_V102__ = true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function injectStyle(){
    if($("#spensus-instagram-feed-v102"))return;
    const st=document.createElement("style");st.id="spensus-instagram-feed-v102";st.textContent=`
#spensus-news-v102 .sg-feature{padding:0!important;border-radius:20px!important;overflow:hidden!important;background:linear-gradient(160deg,#07372d,#092f3b 72%,#172e55)!important}
#spensus-news-v102 .sg-feature>.sg-meta,#spensus-news-v102 .sg-feature>.sg-title,#spensus-news-v102 .sg-feature>.sg-summary,#spensus-news-v102 .sg-feature>.sg-author{margin-left:clamp(17px,3vw,30px)!important;margin-right:clamp(17px,3vw,30px)!important}
#spensus-news-v102 .sg-feature>.sg-meta{padding-top:clamp(18px,3vw,30px)!important}
#spensus-news-v102 .sg-title{max-width:24ch!important;font-size:clamp(29px,4vw,49px)!important;line-height:1.06!important}
#spensus-news-v102 .sg-summary{font-size:14px!important;line-height:1.72!important;color:#dcece7!important}
#spensus-news-v102 .sg-feature.sg-feed-ready>.sg-summary{display:none!important}
#spensus-news-v102 .sg-feature.sg-feed-ready .sg-cover,#spensus-news-v102 .sg-feature.sg-feed-ready .sg-thumbs{display:none!important}
#spensus-news-v102 .sg-read{display:none!important}
#spensus-news-v102 .sg-expanded{display:block!important;margin:0!important;padding:clamp(18px,3vw,30px)!important;border-top:0!important;background:rgba(2,28,26,.42)!important}
#spensus-news-v102 .sg-body{max-width:78ch!important;font-size:15px!important;line-height:1.9!important;color:#eff8f5!important}
#spensus-news-v102 .sg-body p{margin:0 0 18px!important}
#spensus-news-v102 .sg-story-carousel{position:relative;margin:18px 0 0;background:#031b1c;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)}
#spensus-news-v102 .sg-story-track{display:flex;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
#spensus-news-v102 .sg-story-track::-webkit-scrollbar{display:none}
#spensus-news-v102 .sg-story-slide{position:relative;flex:0 0 100%;display:grid;place-items:center;min-width:0;scroll-snap-align:start;scroll-snap-stop:always;background:linear-gradient(145deg,#031c1d,#092b33);cursor:zoom-in;border:0;padding:0}
#spensus-news-v102 .sg-story-slide img{display:block;width:100%;height:auto;max-height:min(76vh,780px);object-fit:contain;object-position:center;background:#031b1c;filter:none!important;transform:none!important;image-rendering:auto}
#spensus-news-v102 .sg-story-count{position:absolute;right:12px;top:12px;z-index:3;padding:6px 9px;border-radius:999px;background:rgba(0,20,23,.78);color:#fff;font-size:10px;font-weight:900;backdrop-filter:blur(6px)}
#spensus-news-v102 .sg-story-dots{display:flex;justify-content:center;gap:5px;padding:9px;background:#042321}
#spensus-news-v102 .sg-story-dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.3);transition:transform .15s ease,background .15s ease}
#spensus-news-v102 .sg-story-dots i.is-active{background:#63e6bf;transform:scale(1.35)}
#spensus-news-v102 .sg-interact{margin-top:8px!important}
@media(max-width:720px){#spensus-news-v102 .sg-feature{border-radius:15px!important}#spensus-news-v102 .sg-feature>.sg-meta,#spensus-news-v102 .sg-feature>.sg-title,#spensus-news-v102 .sg-feature>.sg-summary,#spensus-news-v102 .sg-feature>.sg-author{margin-left:16px!important;margin-right:16px!important}#spensus-news-v102 .sg-feature>.sg-meta{padding-top:17px!important}#spensus-news-v102 .sg-title{font-size:28px!important;line-height:1.08!important}#spensus-news-v102 .sg-story-carousel{margin-top:14px!important}#spensus-news-v102 .sg-story-slide img{max-height:72vh}#spensus-news-v102 .sg-expanded{padding:18px 16px!important}#spensus-news-v102 .sg-body{font-size:14px!important;line-height:1.82!important}}
@media(max-width:390px){#spensus-news-v102 .sg-title{font-size:25px!important}#spensus-news-v102 .sg-summary{font-size:13px!important}.sg-story-count{font-size:9px!important}}
`;
    document.head.appendChild(st);
  }

  function ensureExpanded(root){
    const read=$("[data-read]",root);const expanded=$("[data-expanded]",root);
    if(read&&expanded?.hidden){read.click();return false}
    return !!expanded;
  }

  function buildCarousel(){
    const root=$("#spensus-news-v102");if(!root)return;
    const feature=$(".sg-feature",root);if(!feature)return;
    feature.classList.remove('sg-feed-ready');
    if(!ensureExpanded(feature)){setTimeout(buildCarousel,30);return}
    const old=$(".sg-story-carousel",feature);if(old)old.remove();
    const sources=[];
    const cover=$(".sg-cover img",feature);if(cover?.src)sources.push({src:cover.src,index:0});
    $$(".sg-thumb img",feature).forEach((img)=>{if(img.src&&!sources.some(x=>x.src===img.src))sources.push({src:img.src,index:sources.length})});
    if(!sources.length)return;
    const wrap=document.createElement("div");wrap.className="sg-story-carousel";wrap.innerHTML=`<div class="sg-story-track">${sources.map((x,i)=>`<button class="sg-story-slide" type="button" data-story-photo="${i}" aria-label="Buka foto ${i+1} dari ${sources.length}"><img src="${x.src.replace(/"/g,'&quot;')}" alt="Foto kegiatan ${i+1}" loading="${i===0?'eager':'lazy'}" decoding="async"><span class="sg-story-count">${i+1}/${sources.length}</span></button>`).join("")}</div>${sources.length>1?`<div class="sg-story-dots">${sources.map((_,i)=>`<i class="${i===0?'is-active':''}"></i>`).join("")}</div>`:""}`;
    const anchor=$(".sg-author",feature)||$(".sg-summary",feature);anchor?.insertAdjacentElement("afterend",wrap);
    if(!wrap.isConnected)return;
    feature.classList.add('sg-feed-ready');
    const track=$(".sg-story-track",wrap),dots=$$(".sg-story-dots i",wrap);
    let raf=0;track?.addEventListener("scroll",()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const w=track.clientWidth||1,idx=Math.max(0,Math.min(sources.length-1,Math.round(track.scrollLeft/w)));dots.forEach((d,i)=>d.classList.toggle("is-active",i===idx))})},{passive:true});
    $$('[data-story-photo]',wrap).forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.storyPhoto)||0;const target=$(`[data-photo="${i}"]`,feature)||$("[data-photo]",feature);target?.click()}));
  }

  function schedule(){[0,50,150,400,900].forEach(ms=>setTimeout(buildCarousel,ms))}
  document.addEventListener("click",e=>{if(e.target.closest?.("#spensus-news-v102 [data-archive-news],#spensus-news-v102 [data-archive-toggle]"))schedule()},true);
  try{const bc=new BroadcastChannel("spensus-news");bc.addEventListener("message",schedule)}catch{}
  const init=()=>{injectStyle();[90,260,720,1600].forEach(ms=>setTimeout(buildCarousel,ms))};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();