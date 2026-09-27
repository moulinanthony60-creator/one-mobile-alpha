(()=>{
 'use strict';
 const core=window.ONETikTokShareCore,pendingKey='one_tiktok_share_receipt_118c2',oldKey='one_pending_share_v119';
 const current=new URL(location.href),receipt=current.hash.match(/^#one-share=([a-f0-9-]{36})$/)?.[1];
 let id=receipt||sessionStorage.getItem(pendingKey)||'',busy=false,rerun=false,legacy='';
 // Old installed manifests used GET. Keep these links reviewable: opening an arbitrary URL must not publish.
 if(['share_title','share_text','share_url'].some(k=>current.searchParams.has(k))){
  legacy=['share_title','share_text','share_url'].map(k=>current.searchParams.get(k)||'').join('\n');
  sessionStorage.setItem(oldKey,legacy);
  for(const k of ['one_share','share_title','share_text','share_url'])current.searchParams.delete(k);
  history.replaceState(null,'',current.pathname+current.search+current.hash);
 }else legacy=sessionStorage.getItem(oldKey)||'';
 if(!id&&!legacy)return;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const panel=el('section'),heading=el('strong','Partage TikTok'),status=el('p'),actions=el('div');panel.id='oneTikTokShareStatus';panel.setAttribute('aria-label','Partage TikTok reçu');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 function button(text,run){const b=el('button',text);b.type='button';b.onclick=run;actions.append(b);return b;}
 const retry=button('Réessayer',run),login=button('Se connecter',()=>document.getElementById('accountBtn')?.click()),review=button('Partager dans le catalogue public',acceptLegacy),close=button('Fermer',()=>{panel.hidden=true;});
 const view=button('Voir le catalogue',()=>{panel.hidden=true;document.querySelector('#chips [data-filter="tiktok"]')?.click();});
 panel.append(heading,status,actions);document.body.append(panel);
 function show(text,kind){panel.hidden=false;status.textContent=text;retry.hidden=kind!=='error';login.hidden=kind!=='login';review.hidden=kind!=='legacy';view.hidden=kind!=='done';close.hidden=kind==='busy';}
 const account=()=>({id:window.oneAccountLocal?.()?.id||'',token:window.oneAccountToken?.()||''});
 function remember(){sessionStorage.setItem(pendingKey,id);const u=new URL(location.href);u.hash='one-share='+id;history.replaceState(null,'',u.pathname+u.search+u.hash);}
 async function acceptLegacy(){try{id=await core.receive(legacy);sessionStorage.removeItem(oldKey);legacy='';remember();run();}catch(e){show(e.message,'legacy');}}
 async function run(){
  if(busy||!id)return;busy=true;remember();show('Ajout au catalogue public ONE…','busy');
  try{
   if(!await core.get(id))throw Error('Ce partage n’est plus disponible. Partage à nouveau la vidéo depuis TikTok.');
   const result=await core.drain(id,{account,publish:(url,token)=>window.ONETikTokPublic.publish(url,token)});
   if(result.state==='login'){show('Connecte-toi à ONE : la vidéo sera ensuite ajoutée automatiquement au catalogue public.','login');return;}
   if(result.state==='account'){show('Le compte a changé. Reconnecte le compte qui a commencé ce partage. Le lien est conservé.','error');return;}
   show(result.added?'Vidéo ajoutée au catalogue public · disponible pour tout le monde.':'Cette vidéo est déjà dans le catalogue public. Aucun doublon ajouté.','done');
   sessionStorage.removeItem(pendingKey);const u=new URL(location.href);if(u.hash==='#one-share='+id){u.hash='';history.replaceState(null,'',u.pathname+u.search);}id='';
   window.ONETikTokPublic.refresh({force:true}).catch(()=>{});
  }catch(e){show(e.status===401?'Ta connexion ONE a expiré. Reconnecte-toi pour terminer l’ajout.':e.message+' Le lien reste enregistré pour réessayer.',e.status===401?'login':'error');}
  finally{busy=false;if(rerun){rerun=false;if(id)run();}}
 }
 window.addEventListener('one-account-changed',()=>{if(id){panel.hidden=false;if(busy)rerun=true;else run();}});
 window.addEventListener('online',()=>{if(id)run();});
 if(id)run();else show('Lien reçu. Cette ancienne installation demande encore une validation. Mets ONE à jour pour les prochains partages automatiques.','legacy');
})();
