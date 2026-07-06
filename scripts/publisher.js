(function(){
'use strict';

const WORKER_URL='https://spinapp.erikaekepler.workers.dev';
const TARGET={owner:'keppler999',repo:'SpinApp-1',branch:'main',filePath:'data/apps.json',pagesUrl:'https://keppler999.github.io/SpinApp-1/'};
const $=(s,r=document)=>r.querySelector(s);

function toast(message,type='success'){
  if(window.SpinAppStore?.toast) window.SpinAppStore.toast(message,type);
  else alert(message);
}
function cleanWorkerUrl(){return WORKER_URL.replace(/\/+$/,'')}
function setStatus(message,type='info',extra=''){
  const el=$('#publishStatus');
  if(!el) return;
  el.className=`security-note publish-status publish-status-${type}`;
  el.innerHTML=message+(extra?`<br>${extra}`:'');
}
async function readJsonResponse(response){
  const text=await response.text();
  let data={};
  try{data=text?JSON.parse(text):{};}catch(_){data={raw:text};}
  if(!response.ok){throw new Error(data.error||data.message||`Erreur Worker HTTP ${response.status}`)}
  return data;
}
async function healthCheck(){
  setStatus('Test du Worker Cloudflare en cours…','info');
  const response=await fetch(`${cleanWorkerUrl()}/health`,{method:'GET',cache:'no-store'});
  const data=await readJsonResponse(response);
  setStatus(`Worker opérationnel : ${data.service||'spinapp-publisher'}.`,'success',`Dépôt cible : ${TARGET.owner}/${TARGET.repo} — branche ${TARGET.branch}.`);
  toast('Worker Cloudflare accessible.','success');
  return data;
}
async function publishNow(options={}){
  const secret=options.secret||$('#publishSecret')?.value?.trim();
  if(!secret) throw new Error('Entrez le secret de publication configuré dans Cloudflare.');
  const message=options.message||$('#commitMessage')?.value?.trim()||`chore(spinapp): publish apps catalog`;
  const database=window.SpinAppStore.normalizeDatabase(await window.SpinAppStore.loadDatabase());
  setStatus('Publication vers GitHub en cours…','info','Ne fermez pas cette page pendant la création du commit.');
  const response=await fetch(`${cleanWorkerUrl()}/publish`,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Publish-Secret':secret},
    body:JSON.stringify({database,message})
  });
  const data=await readJsonResponse(response);
  const link=data.commit?.html_url?`<a href="${data.commit.html_url}" target="_blank" rel="noopener">Voir le commit GitHub</a>`:'Commit créé.';
  setStatus(`Catalogue publié avec succès dans ${data.filePath||TARGET.filePath}.`,'success',link);
  const input=$('#publishSecret'); if(input) input.value='';
  toast('Publication GitHub terminée. GitHub Pages va se redéployer automatiquement.','success');
  return data;
}
function bind(){
  const workerUrl=$('#workerUrl'); if(workerUrl) workerUrl.textContent=cleanWorkerUrl();
  const target=$('#publishTarget'); if(target) target.textContent=`${TARGET.owner}/${TARGET.repo} → ${TARGET.filePath} (${TARGET.branch})`;
  $('#workerHealthBtn')?.addEventListener('click',async()=>{try{await healthCheck()}catch(err){setStatus(err.message,'error');toast(err.message,'error')}});
  $('#publishForm')?.addEventListener('submit',async e=>{e.preventDefault();const btn=$('#publishBtn');if(btn)btn.disabled=true;try{await publishNow()}catch(err){setStatus(err.message,'error');toast(err.message,'error')}finally{if(btn)btn.disabled=false}});
}

document.addEventListener('DOMContentLoaded',bind);
window.SpinAppPublisher={WORKER_URL:cleanWorkerUrl(),TARGET,healthCheck,publishNow};
})();
