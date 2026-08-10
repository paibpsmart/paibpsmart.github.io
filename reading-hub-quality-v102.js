(() => {
  "use strict";
  if (window.__SPENSUS_READING_HUB_QUALITY_V102__) return;
  window.__SPENSUS_READING_HUB_QUALITY_V102__ = true;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const page=(location.pathname.split('/').pop()||'').toLowerCase();

  function disableLegacyVisuals(){
    $$('link[rel="stylesheet"]').forEach(l=>{
      const h=String(l.href||'');
      if(/visual-v83|visual-public-v83|visual-v84|visual-v85|icon-depth-v85|icon-guard-v84/i.test(h)) l.disabled=true;
    });
  }

  function cleanArticle(){
    const hero=$('.article-hero-v37');
    if(hero){
      const h1=$('h1',hero),p=$('p',hero),stage=$('.article-hero-art-v37 span',hero);
      if(h1)h1.textContent='Baca Artikel Spensus';
      if(p)p.textContent='Pilih bacaan, buka preview, lalu baca dengan nyaman di dalam portal.';
      if(stage)stage.textContent='SPENSUS READING HUB';
    }
    const live=$('#rh-live-catalog');
    if(live){
      const h2=$('.rh-live-head h2',live),p=$('.rh-live-head p',live),status=$('.rh-live-status',live),search=$('.rh-live-search input',live),btn=$('.rh-live-search button',live);
      if(h2)h2.textContent='Katalog Artikel';
      if(p)p.remove();
      if(status&&!status.dataset.cleaned){status.textContent='';status.dataset.cleaned='1';}
      if(search)search.placeholder='Cari topik, judul, atau kata kunci…';
      if(btn)btn.textContent='Cari';
    }
  }

  function cleanLiteracy(){
    const hero=$('.lit-hero-v35');
    if(hero){
      const h1=$('.lit-hero-copy-v35 h1',hero),p=$('.lit-hero-copy-v35 p',hero);
      if(h1)h1.textContent='Literasi Digital Spensus';
      if(p)p.textContent='Cari buku, buka preview, dan lanjutkan membaca dari katalog yang tersedia.';
    }
    const h2=$('.lit-catalog-head-v35 h2');if(h2)h2.textContent='Katalog Buku';
    $('.lit-catalog-head-v35 p')?.remove();
    $('.lit-source-section-v35')?.remove();
    $('.lit-legal-note-v35')?.remove();
    $('.lit-stat-section-v35')?.remove();
    const result=$('#lit-result-count');if(result&&!result.dataset.cleaned){result.textContent='';result.dataset.cleaned='1';}
  }

  function enhanceArticlePreview(){
    const m=$('#rh-preview');if(!m||m.hidden)return;
    const body=$('.rh-preview-body',m);if(!body||body.dataset.portalReader)return;
    body.dataset.portalReader='1';
    const links=$$('a',body);let pdf='';
    links.forEach(a=>{const href=a.href||'';if(/\.pdf(?:$|\?)/i.test(href)||/pdf/i.test(a.textContent||''))pdf=href;a.remove();});
    const oldActions=$('.rh-preview-actions',body);oldActions?.remove();
    const actions=document.createElement('div');actions.className='rq-preview-actions-clean';
    if(pdf){
      const preview=document.createElement('button');preview.type='button';preview.textContent='Baca PDF di sini';preview.onclick=()=>{
        let r=$('.rq-inline-reader',body);if(r){r.scrollIntoView({behavior:'smooth',block:'start'});return}
        r=document.createElement('div');r.className='rq-inline-reader';r.innerHTML=`<iframe src="${pdf.replace(/"/g,'&quot;')}#toolbar=1&navpanes=0" title="Preview artikel PDF"></iframe>`;body.appendChild(r);r.scrollIntoView({behavior:'smooth',block:'start'});
      };
      const dl=document.createElement('a');dl.className='is-download';dl.href=pdf;dl.download='';dl.textContent='Unduh PDF';
      actions.append(preview,dl);
    }
    if(actions.childNodes.length)body.appendChild(actions);
  }

  function enhanceLiteracyPreview(){
    const modal=$('#literasi-preview');if(!modal||modal.hidden)return;
    const body=$('#literasi-preview-body');if(!body||body.dataset.portalReader)return;
    body.dataset.portalReader='1';
    const actions=$('.lit-preview-actions-v35',body);if(!actions)return;
    const links=$$('a',actions);let archive='';
    links.forEach(a=>{const href=a.href||'';const m=href.match(/archive\.org\/(?:details|download)\/([^/?#]+)/i);if(m&&!archive)archive=decodeURIComponent(m[1]);});
    actions.remove();
    const clean=document.createElement('div');clean.className='rq-preview-actions-clean';
    if(archive){
      const btn=document.createElement('button');btn.type='button';btn.textContent='Baca di portal';btn.onclick=()=>{
        let r=$('.rq-inline-reader',body);if(r){r.scrollIntoView({behavior:'smooth',block:'start'});return}
        r=document.createElement('div');r.className='rq-inline-reader';r.innerHTML=`<iframe src="https://archive.org/embed/${encodeURIComponent(archive)}" title="Pembaca buku"></iframe>`;body.appendChild(r);r.scrollIntoView({behavior:'smooth',block:'start'});
      };
      clean.appendChild(btn);
    }
    body.appendChild(clean);
  }

  function interceptLiteracyExternal(e){
    const a=e.target.closest?.('#literasi-grid [data-book-read],#literasi-grid [data-book-download]');
    if(!a)return;
    e.preventDefault();e.stopImmediatePropagation();
    const card=a.closest('.lit-book-card-v35');const p=card?.querySelector('[data-book-preview]');p?.click();
  }

  function polish(){
    disableLegacyVisuals();
    if(page==='artikel-islam.html')cleanArticle();
    if(page==='literasi-digital.html')cleanLiteracy();
  }

  document.addEventListener('click',e=>{
    if(page==='literasi-digital.html')interceptLiteracyExternal(e);
    setTimeout(()=>{enhanceArticlePreview();enhanceLiteracyPreview();polish()},0);
  },true);

  const init=()=>{polish();[80,250,700,1500].forEach(ms=>setTimeout(()=>{polish();enhanceArticlePreview();enhanceLiteracyPreview()},ms));};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();