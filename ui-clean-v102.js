(()=>{
"use strict";
if(window.__PAIBP_UI_CLEAN_V102__)return;window.__PAIBP_UI_CLEAN_V102__=1;
const FILE=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const PRIVATE=FILE==='akses-guru.html'||FILE==='kendali-editor.html';
const $all=(s,r=document)=>[...(r.querySelectorAll?.(s)||[])];
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const connected=/(?:terhubung|tersambung)\s+(?:ke\s+)?kelas\s*[A-Z0-9 -]*|kelas\s*[A-Z0-9 -]+\s*(?:terhubung|tersambung)/i;
const internal=[/Setiap\s+bab\s+diperlakukan\s+setara\s+dengan\s+PAIBP\.?/i,/tanpa\s+membebani\s+halaman\s+dengan\s+ratusan\s+dokumen/i,/basis\s+data\s+web\s+agar\s+halaman\s+tetap\s+ringan/i,/dimuat\s+secara\s+lazy/i,/data\s+administrasi\s+tidak\s+dibebankan\s+ke\s+akses\s+murid/i];
function removeNode(n){if(!n||!n.isConnected)return;const box=n.closest?.('[class*="class-context"],[class*="connected-class"],[class*="kelas-terhubung"],[id*="class-context"],[id*="class-badge"]');(box||n).remove()}
function pass(){
 if(!PRIVATE){
  ['#v56-class-badge','#v56-class-context','#v59-class-context','#v60-class-context','#v61-class-context','#v63-class-context','[data-class-context]','[class*="connected-class"]','[class*="kelas-terhubung"]'].forEach(s=>$all(s).forEach(n=>n.remove()));
  $all('span,small,p,b,strong,em,div,aside,section').forEach(n=>{const t=clean(n.textContent);if(!t||t.length>220||n.children.length>8)return;if(connected.test(t))removeNode(n)});
 }
 $all('p,small,li,div').forEach(n=>{const t=clean(n.textContent);if(!t||t.length>420||n.children.length>5)return;if(internal.some(rx=>rx.test(t)))n.remove()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pass,{once:true});else pass();
[80,240,650,1400,2800].forEach(ms=>setTimeout(pass,ms));
})();