(() => {
  "use strict";
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(page!=="index.html") return;

  function boot(){
    const bar=document.querySelector('.smart-ticker');
    const windowEl=document.querySelector('.ticker-window');
    const text=document.querySelector('#smart-ticker-text');
    if(!bar||!windowEl||!text) return;

    bar.hidden=false;
    bar.style.removeProperty('display');
    bar.dataset.v93Ticker='true';

    const school=window.PAIBP_SCHOOL?.school;
    const fallback=String(school?.tickerFallback||'').trim();
    const split=fallback.split(/\s+Misi\s*:\s*/i);
    const vision=(split[0]||'Visi: mewujudkan pendidikan berkualitas, berkarakter, berprestasi, berakhlak mulia, dan adaptif terhadap teknologi.').replace(/^Visi\s*:\s*/i,'').trim();
    const mission=(split[1]||'Menguatkan iman dan karakter; meningkatkan literasi, numerasi, kreativitas, serta prestasi; membangun pembelajaran aman, ramah, kolaboratif, peduli lingkungan, dan berwawasan global.').trim();
    const latest=document.querySelector('#news-gallery .news-card h4')?.textContent?.trim();
    const parts=[`VISI SPENSUS • ${vision}`,`MISI SPENSUS • ${mission}`];
    if(latest) parts.push(`SPENSUS TERKINI • ${latest}`);
    text.textContent=parts.join('     ✦     ');
    text.setAttribute('aria-label',parts.join('. '));
    text.classList.add('ticker-run-v93');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
