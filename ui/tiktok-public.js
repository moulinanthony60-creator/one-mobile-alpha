/* Shared catalogue of public links. Personal backups stay in ONECatalogue. */
(()=>{
 'use strict';
 const API='https://one-comments-api.moulinanthony60.workers.dev/catalog/tiktok';
 const token=()=>localStorage.getItem('one_account_token_v06')||'';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,run)=>{const b=el('button',text);b.type='button';b.onclick=run;return b;};
 let entries=[],pending=null,loadedAt=0,error='',busy=false,dialog=null;
 const bar=el('section',undefined,'tt-public-bar');bar.hidden=true;bar.setAttribute('aria-label','Catalogue TikTok commun');
 const intro=el('div'),title=el('strong','TikTok · Le catalogue ONE'),status=el('p','Chargement du catalogue commun…');status.setAttribute('role','status');intro.append(title,status);
 const actions=el('div',undefined,'tt-public-actions'),addButton=button('＋ Ajouter une vidéo',()=>open()),retry=button('Actualiser',()=>refresh({force:true}).catch(()=>{}));actions.append(addButton,retry);bar.append(intro,actions);document.getElementById('feed')?.before(bar);
 function updateView(){bar.hidden=typeof state==='undefined'||state.filter!=='tiktok'||state.mode!==null;status.textContent=error||(pending?'Chargement du catalogue commun…':entries.length+' vidéos partagées · chacun peut contribuer');retry.disabled=!!pending;}
 const vfeed=document.getElementById('vfeed'),verticalAdd=button('＋ Ajouter',()=>open());verticalAdd.className='tt-public-vertical-add';verticalAdd.setAttribute('aria-label','Ajouter une vidéo au catalogue commun TikTok');verticalAdd.hidden=true;document.querySelector('.vfeedTop')?.append(verticalAdd);
 function verticalState(){const active=typeof verticalFeedMode!=='undefined'&&verticalFeedMode==='tiktok';verticalAdd.hidden=!active;if(vfeed&&vfeed.classList.contains('tt-public-feed')!==active)vfeed.classList.toggle('tt-public-feed',active);updateView();}
 if(vfeed)new MutationObserver(verticalState).observe(vfeed,{attributes:true,attributeFilter:['class']});
 function notify(){window.loadTikTokLocal?.();updateView();if(typeof render==='function')render();if(vfeed?.classList.contains('show')&&typeof verticalFeedMode!=='undefined'&&verticalFeedMode==='tiktok'&&!document.querySelector('#vfeedScroller .vslide')&&entries.length)renderVerticalFeed();window.dispatchEvent(new CustomEvent('one-tiktok-public-state'));}
 async function request(path='',options={}){
  let response;try{response=await fetch(API+path,{...options,signal:AbortSignal.timeout(15000),cache:'no-store'});}catch{throw Object.assign(Error('Catalogue commun indisponible. Vérifie ta connexion puis réessaie.'),{status:503});}
  let data;try{data=await response.json();}catch{throw Error('Le catalogue commun doit être activé sur le serveur ONE.');}
  if(!response.ok||!data.ok)throw Object.assign(Error(typeof data.error==='string'?data.error:'Catalogue commun indisponible. Réessaie.'),{status:response.status});return data;
 }
 async function refresh({force=false}={}){
  if(pending)return pending;if(!force&&loadedAt&&Date.now()-loadedAt<30000)return entries;
  error='';pending=(async()=>{let cursor='',all=[],pages=0;do{const data=await request(cursor?'?cursor='+encodeURIComponent(cursor):'');if(!Array.isArray(data.entries))throw Error('Réponse du catalogue invalide.');all.push(...data.entries);cursor=data.cursor||'';if(++pages>26)throw Error('Catalogue trop volumineux. Réessaie.');}while(cursor);
   entries=[...new Map(all.filter(v=>/^\d{8,24}$/.test(v.id)).map(v=>[v.id,v])).values()];loadedAt=Date.now();return entries;
  })().catch(e=>{error=e.message;throw e;}).finally(()=>{pending=null;notify();});updateView();return pending;
 }
 async function publish(url,captured=token()){
  if(!captured)throw Error('Connecte-toi à ton compte ONE pour ajouter une vidéo.');
  if(captured!==token())throw Error('Le compte a changé. Réouvre le catalogue depuis ton compte.');
  const data=await request('',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+captured},body:JSON.stringify({url})});
  entries=[data.entry,...entries.filter(v=>v.id!==data.entry.id)];return data;
 }
 function urls(text){return [...new Set((String(text).match(/https?:\/\/[^\s<>"']+/gi)||[]).map(x=>x.replace(/[.,;!?)\]}]+$/g,'')))];}
 async function open(){
  if(dialog){dialog.focus();return;}if(busy){window.toast?.('Le partage en cours se termine. Réessaie dans un instant.');return;}
  const d=el('dialog',undefined,'tt-public-dialog');dialog=d;d.setAttribute('aria-labelledby','tt-public-title');
  const head=el('header'),heading=el('h2','Enrichir le catalogue','');heading.id='tt-public-title';const close=button('×',()=>d.close());close.setAttribute('aria-label','Fermer');head.append(heading,close);
  const note=el('p','Ajoute une vidéo publique TikTok : elle sera visible par tous les utilisateurs ONE, y compris dans Together. Ton compte TikTok n’est pas nécessaire.'),form=el('form'),label=el('label','Liens des vidéos'),input=el('textarea'),submit=button('Partager dans le catalogue',()=>{}),result=el('p','', 'tt-public-result');
  input.id='tt-public-links';input.rows=3;input.placeholder='Colle un lien ou un texte de partage TikTok…';input.maxLength=40000;label.htmlFor=input.id;submit.type='submit';result.setAttribute('role','status');form.append(label,input,submit);
  const saved=el('section',undefined,'tt-public-saved'),share=button('Partager mes liens enregistrés',()=>{}),savedNote=el('p','Seuls les liens que tu avais ajoutés seront partagés. Tes favoris et tes connexions restent personnels.');share.hidden=true;saved.append(share,savedNote);
  const stop=button('Arrêter après cette vidéo',()=>{cancelled=true;stop.disabled=true;});stop.hidden=true;
  d.append(head,note,form,result,stop,saved);document.body.append(d);d.showModal();input.focus();
  let cancelled=false,legacy=[],captured=token();
  d.addEventListener('close',()=>{cancelled=true;dialog=null;d.remove();});
  async function run(list,fromInput){
   if(busy)return;if(!captured){result.textContent='Connecte-toi à ton compte ONE, puis réouvre cette fenêtre.';return;}
   busy=true;cancelled=false;submit.disabled=share.disabled=input.disabled=true;stop.hidden=false;stop.disabled=false;let count=0,duplicates=0;const failed=[],failures=[];
   try{for(let i=0;i<list.length;i++){
    if(cancelled||captured!==token()){failed.push(...list.slice(i));break;}
    result.textContent='Partage '+(i+1)+' / '+list.length+'…';
    try{const r=await publish(list[i],captured);r.added?count++:duplicates++;}catch(e){failed.push(list[i]);failures.push(e.message);if(e.status===401||e.status===429||e.status>=500){failed.push(...list.slice(i+1));break;}}
   }
   if(fromInput)input.value=failed.join('\n');
   result.textContent=count+' ajoutée(s) au catalogue commun · '+duplicates+' déjà présente(s)'+(failed.length?' · '+failed.length+' non partagée(s). '+[...new Set(failures)].join(' '):'. Disponibles pour tout le monde.');
   }finally{busy=false;submit.disabled=share.disabled=input.disabled=false;stop.hidden=true;notify();}
  }
  form.onsubmit=e=>{e.preventDefault();const list=urls(input.value);if(!list.length){result.textContent='Colle au moins un lien TikTok.';return;}if(list.length>20){result.textContent='Ajoute jusqu’à 20 liens à la fois.';return;}run(list,true);};
  share.onclick=()=>run(legacy,false);
  try{await window.ONECatalogue?.ready;const data=await window.ONECatalogue?.exportFile();if(!d.isConnected||captured!==token())return;legacy=[...new Set((data?.entries||[]).map(v=>v.url||'https://www.tiktok.com/@_/video/'+v.id))];share.hidden=!legacy.length;share.textContent=legacy.length===1?'Partager mon lien enregistré':'Partager mes '+legacy.length+' liens enregistrés';saved.hidden=!legacy.length;}catch{saved.hidden=true;}
 }
 async function addFromSettings(){const field=document.getElementById('tiktokExternalUrl');await open();if(dialog&&field?.value)dialog.querySelector('textarea').value=field.value;}
 window.ONETikTokPublic={get entries(){return entries;},get error(){return error;},get loading(){return !!pending;},refresh,publish,open,addFromSettings,updateView};
 window.addEventListener('one-account-changed',()=>{dialog?.close();});
 window.addEventListener('focus',()=>refresh().catch(()=>{}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(()=>{});});
 refresh().catch(()=>{});
})();
