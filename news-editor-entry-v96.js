(() => {
  "use strict";
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  if(page!=="kendali-editor.html")return;
  function mount(){
    if(document.getElementById('news-editor-entry-v96'))return;
    const panel=document.querySelector('#panel-editor')||document.querySelector('[data-panel="editor"]')||document.querySelector('main');
    if(!panel)return;
    const card=document.createElement('section');
    card.id='news-editor-entry-v96';
    card.className='editor-card';
    card.style.cssText='border:1px solid #cfe0eb;border-radius:20px;padding:20px;background:linear-gradient(135deg,#eef8ff,#f7f0ff);box-shadow:0 14px 34px rgba(16,55,82,.08)';
    card.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap"><div><span style="display:block;font-size:10px;font-weight:950;letter-spacing:.12em;color:#1767a8">BERITA SPENSUS</span><h4 style="margin:6px 0 5px;font-size:22px;color:#102f49">Editor Berita & Upload</h4><p style="margin:0;max-width:720px;color:#60798b;font-size:12px;line-height:1.6">Tulis berita, upload foto, pratinjau, simpan draft, terbitkan, edit/hapus, dan lihat arsip per tahun.</p></div><a href="editor-berita.html" style="display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 17px;border-radius:14px;background:linear-gradient(135deg,#177dff,#6841d9);color:#fff;text-decoration:none;font-weight:900;box-shadow:0 10px 24px rgba(54,91,220,.25)">Buka Editor Berita →</a></div>';
    const grid=panel.querySelector('.editor-grid');
    if(grid)grid.prepend(card);else panel.prepend(card);
    const nav=document.querySelector('#primary-navigation');
    if(nav&&!nav.querySelector('[href="editor-berita.html"]')){const a=document.createElement('a');a.href='editor-berita.html';a.textContent='Editor Berita';nav.append(a)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
