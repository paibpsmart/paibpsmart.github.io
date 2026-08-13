(()=>{
"use strict";
if(window.__SPENSUS_NEWS_PERF_V148__)return;window.__SPENSUS_NEWS_PERF_V148__=1;

// V148: hilangkan animasi scroll yang membuat galeri/arsip terasa lambat.
const nativeScrollTo=Element.prototype.scrollTo;
Element.prototype.scrollTo=function(a,b){
  try{
    if(this.matches?.('#spensus-news-v102 .ig-track,.ig-track')){
      if(a&&typeof a==='object'){
        const x=Number(a.left)||0,y=Number(a.top)||0;
        this.scrollLeft=x;if(y)this.scrollTop=y;return;
      }
    }
  }catch{}
  return nativeScrollTo.apply(this,arguments);
};

const nativeIntoView=Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView=function(arg){
  try{
    if(this.closest?.('#spensus-news-v102')||this.id==='spensus-news-v102'){
      if(arg&&typeof arg==='object')return nativeIntoView.call(this,{...arg,behavior:'auto'});
    }
  }catch{}
  return nativeIntoView.apply(this,arguments);
};

// CSS runtime: tidak ada smooth scroll; touch swipe tetap native dan ringan.
const style=document.createElement('style');
style.id='news-performance-v148-style';
style.textContent=`
#spensus-news-v102 .ig-track{scroll-behavior:auto!important;overscroll-behavior-inline:contain;touch-action:pan-x pan-y}
#spensus-news-v102 .ig-slide{contain:layout paint style}
#spensus-news-v102 .ig-slide img{content-visibility:auto;transform:translateZ(0)}
#spensus-news-v102 .ig-post{content-visibility:auto;contain-intrinsic-size:720px}
`;
document.head.appendChild(style);

// Setelah kartu arsip diklik, prioritaskan render frame berikut tanpa animasi panjang.
document.addEventListener('click',e=>{
  const t=e.target.closest?.('#spensus-news-v102 [data-news],#spensus-news-v102 [data-post],#spensus-news-v102 .ig-archive a,#spensus-news-v102 .ig-archive button');
  if(!t)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const root=document.getElementById('spensus-news-v102');
    const active=root?.querySelector('.ig-post:not([hidden]),[data-post].active,[data-post][aria-current="true"]');
    if(active&&active.getBoundingClientRect().top<0)active.scrollIntoView({block:'start',behavior:'auto'});
  }));
},true);
})();
