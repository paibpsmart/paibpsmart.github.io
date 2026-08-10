(()=>{
"use strict";
if(window.__PAIBP_MAPEL_MARKS_V102__)return;window.__PAIBP_MAPEL_MARKS_V102__=1;
const marks=[
 [/bahasa indonesia/i,'BI'],[/matematika/i,'∑'],[/ilmu pengetahuan alam|\bipa\b/i,'IPA'],[/ilmu pengetahuan sosial|\bips\b/i,'IPS'],[/bahasa inggris/i,'EN'],[/pjok|pendidikan jasmani/i,'PJ'],[/informatika/i,'</>'],[/bimbingan|konseling|\bbk\b/i,'BK'],[/prakarya/i,'PK'],[/seni musik/i,'♫'],[/seni tari/i,'TARI'],[/koding|kecerdasan artifisial|\bai\b/i,'AI'],[/pancasila/i,'PP']
];
function markFor(text){for(const [rx,m] of marks)if(rx.test(text))return m;return'•'}
function apply(){document.querySelectorAll('.multi-module-card-v35').forEach(card=>{const text=String(card.querySelector('.multi-card-copy-v35>span')?.textContent||card.textContent||'');const h=card.querySelector('.multi-card-icon-v35');if(!h)return;const m=markFor(text);if(h.dataset.v102Mark===m)return;h.dataset.v102Mark=m;h.textContent=m;h.setAttribute('aria-hidden','true')})}
function queue(){apply();setTimeout(apply,80);setTimeout(apply,260)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{queue();setTimeout(apply,700)},{once:true});else{queue();setTimeout(apply,700)}
document.addEventListener('change',e=>{if(e.target.closest?.('[data-mm-subject],[data-mm-grade],[data-mm-semester]'))setTimeout(queue,40)},{passive:true});
document.addEventListener('input',e=>{if(e.target.closest?.('[data-mm-query]'))setTimeout(queue,90)},{passive:true});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-mm-open],.multi-card-actions-v35'))setTimeout(queue,60)},{passive:true});
})();