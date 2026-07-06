(function(){
'use strict';
function qs(s,r=document){return r.querySelector(s)}
function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
function setActiveNav(){const page=document.body.dataset.page||'home';qsa('[data-nav]').forEach(a=>a.setAttribute('aria-current',a.dataset.nav===page?'page':'false'))}
function initNav(){const bar=qs('[data-navbar]'),btn=qs('[data-nav-toggle]');if(!bar||!btn)return;btn.addEventListener('click',()=>{const open=bar.classList.toggle('nav-open');btn.setAttribute('aria-expanded',String(open))});qsa('.nav-link',bar).forEach(a=>a.addEventListener('click',()=>{bar.classList.remove('nav-open');btn.setAttribute('aria-expanded','false')}))}
function initCopyLinks(){qsa('[data-copy]').forEach(el=>el.addEventListener('click',async e=>{e.preventDefault();const value=el.getAttribute('data-copy')||el.textContent.trim();try{await navigator.clipboard.writeText(value);window.SpinAppStore?.toast('Contact copié avec succès.','success')}catch(_){window.SpinAppStore?.toast(value,'success')}}))}
function initYear(){qsa('[data-year]').forEach(el=>el.textContent='2026')}
function initRoute(){const page=document.body.dataset.page;if(page==='home')window.SpinAppStore?.renderHome();if(page==='catalog')window.SpinAppStore?.renderCatalog();if(page==='detail')window.SpinAppStore?.renderDetail()}
function refreshOnLocalUpdate(){window.addEventListener('spinapp:database-updated',()=>{const page=document.body.dataset.page;if(page==='home')window.SpinAppStore?.renderHome();if(page==='catalog')window.SpinAppStore?.renderCatalog();if(page==='detail')window.SpinAppStore?.renderDetail()})}
document.addEventListener('DOMContentLoaded',()=>{setActiveNav();initNav();initCopyLinks();initYear();initRoute();refreshOnLocalUpdate()});
})();
