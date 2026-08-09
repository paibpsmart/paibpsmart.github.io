(() => {
  "use strict";
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(page!=="index.html") return;

  const escapeHtml=(value)=>String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  function boot(){
    const bar=document.querySelector('.smart-ticker');
    const windowEl=document.querySelector('.ticker-window');
    const text=document.querySelector('#smart-ticker-text');
    if(!bar||!windowEl||!text) return;

    bar.hidden=false;
    bar.style.removeProperty('display');
    bar.dataset.v95Ticker='true';

    const school=window.PAIBP_SCHOOL?.school;
    const fallback=String(school?.tickerFallback||'').trim();
    const split=fallback.split(/\s+Misi\s*:\s*/i);
    const vision=(split[0]||'Visi: mewujudkan pendidikan berkualitas, berkarakter, berprestasi, berakhlak mulia, dan adaptif terhadap teknologi.').replace(/^Visi\s*:\s*/i,'').trim();
    const mission=(split[1]||'Menguatkan iman dan karakter; meningkatkan literasi, numerasi, kreativitas, serta prestasi; membangun pembelajaran aman, ramah, kolaboratif, peduli lingkungan, dan berwawasan global.').trim();
    const latest=document.querySelector('#news-gallery .news-card h4')?.textContent?.trim();
    const parts=[`VISI SPENSUS • ${vision}`,`MISI SPENSUS • ${mission}`];
    if(latest) parts.push(`SPENSUS TERKINI • ${latest}`);
    const sentence=parts.join('   ✦   ');
    const safe=escapeHtml(sentence);
    text.innerHTML=`<span class="ticker-copy-v95">${safe}</span><span class="ticker-copy-v95" aria-hidden="true">${safe}</span>`;
    text.setAttribute('aria-label',parts.join('. '));
    text.classList.add('ticker-run-v93','ticker-run-v95');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
