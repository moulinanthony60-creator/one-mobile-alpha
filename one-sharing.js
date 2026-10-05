(()=>{'use strict';
const BASE='https://one-messages-api.moulinanthony60.workers.dev',PEOPLE='https://one-comments-api.moulinanthony60.workers.dev';
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const token=()=>window.oneAccountToken?.()||'';
async function api(base,path,options={}){const session=token();if(!session)throw Error('Connecte-toi à ONE pour continuer.');const r=await fetch(base+path,{...options,headers:{Authorization:'Bearer '+session,...options.headers},cache:'no-store',signal:options.signal||AbortSignal.timeout(15000)});const d=await r.json().catch(()=>({}));if(token()!==session)throw Error('Le compte a changé. Rouvre cet écran.');if(!r.ok)throw Error(d.error||(r.status===404?'Mets à jour le serveur ONE pour activer les publications.':'Service indisponible. Réessaie.'));return d;}
const ids=new WeakMap();
const onePostsCache={post:[],story:[]};
const oneLocalMedia=new Map();
const OWN_KEY='one_owned_publications_v106';
const FEED_MARK='\u2063ONEFEED\u2063';
const isFeedPost=x=>String(x?.caption||'').startsWith(FEED_MARK)||x?.channel==='feed'||x?.destination==='feed';
const cleanCaption=v=>String(v||'').replace(FEED_MARK,'');
const ownedLocal=()=>{try{const v=JSON.parse(localStorage.getItem(OWN_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const rememberOwned=(result,{clientId,mediaType,kind,caption})=>{try{const id=String(result?.post?.id||result?.publication?.id||result?.postId||result?.id||clientId||'');if(!id)return;const rows=ownedLocal().filter(x=>String(x.id)!==id);rows.unshift({id,mediaType,kind,caption:String(caption||''),created:Date.now()});localStorage.setItem(OWN_KEY,JSON.stringify(rows.slice(0,120)));}catch{}};
const ownedIds=()=>new Set(ownedLocal().map(x=>String(x.id)));
const accountLocal=()=>{try{return typeof oneAccountLocal==='function'?oneAccountLocal():JSON.parse(localStorage.getItem('one_account_v06')||'null')}catch{return null}};
const isOwnPost=x=>{
 if(x?.id&&ownedIds().has(String(x.id)))return true;
 const v=x?.mine;if(v===true||v===1||v==='1'||String(v??'').toLowerCase()==='true')return true;
 const a=accountLocal();if(!a)return false;
 const aid=String(a.id||a.userId||''),pid=String(x?.accountId||x?.account_id||x?.userId||x?.user_id||x?.authorId||x?.author_id||'');
 if(aid&&pid&&aid===pid)return true;
 const email=String(a.email||'').trim().toLowerCase(),pemail=String(x?.email||x?.authorEmail||x?.author_email||'').trim().toLowerCase();if(email&&pemail&&email===pemail)return true;
 const dn=String(a.displayName||'').trim().toLowerCase(),pn=String(x?.name||x?.displayName||x?.authorName||'').trim().toLowerCase();
 return !!(dn&&pn&&dn===pn);
};
function rememberPosts(kind,rows,reset=false){
 const key=kind==='story'?'story':'post',now=Date.now(),keepOptimistic=(onePostsCache[key]||[]).filter(x=>x?._optimistic&&now-(Number(x.created)||0)<15*60*1000),current=reset?keepOptimistic:[...(onePostsCache[key]||[])],by=new Map(current.map(x=>[String(x.id),x]));
 for(const x of rows||[])if(x?.id){const id=String(x.id),prev=by.get(id)||{};by.set(id,{...prev,...x,_optimistic:false});}
 onePostsCache[key]=[...by.values()].sort((a,b)=>(Number(b.created)||Date.parse(b.created||0)||0)-(Number(a.created)||Date.parse(a.created||0)||0));
 window.dispatchEvent(new CustomEvent('one-native-posts-loaded',{detail:{kind:key,posts:onePostsCache[key]}}));
}
async function listOwnPosts(kind='post',options={}){
 const key=kind==='story'?'story':'post',maxPages=Math.max(1,Math.min(80,Number(options.maxPages)||30)),limit=Math.max(1,Math.min(120,Number(options.limit)||100));
 const cached=(onePostsCache[key]||[]).filter(isOwnPost);
 const by=new Map(cached.map(x=>[String(x.id),x]));let cursor=null;
 for(let page=0;page<maxPages&&by.size<limit;page++){
  const params='?'+new URLSearchParams({kind:key,...(cursor?{before:cursor.created,cursor:cursor.id}:{})});
  const d=await api(BASE,'/posts'+params,{signal:options.signal});const rows=Array.isArray(d.posts)?d.posts:[];
  rememberPosts(key,rows,page===0);
  for(const x of rows)if(isOwnPost(x)&&x?.id)by.set(String(x.id),x);
  if(!d.more||!rows.length)break;cursor=rows.at(-1);
 }
 return [...by.values()].sort((a,b)=>(Number(b.created)||Date.parse(b.created||0)||0)-(Number(a.created)||Date.parse(a.created||0)||0));
}
async function listPosts(kind='post',options={}){
 const key=kind==='story'?'story':'post',maxPages=Math.max(1,Math.min(80,Number(options.maxPages)||20)),limit=Math.max(1,Math.min(240,Number(options.limit)||160));
 const by=new Map((onePostsCache[key]||[]).map(x=>[String(x.id),x]));let cursor=null;
 for(let page=0;page<maxPages&&by.size<limit;page++){
  const params='?'+new URLSearchParams({kind:key,...(cursor?{before:cursor.created,cursor:cursor.id}:{})});
  const d=await api(BASE,'/posts'+params,{signal:options.signal});const rows=Array.isArray(d.posts)?d.posts:[];rememberPosts(key,rows,page===0);
  for(const x of rows)if(x?.id)by.set(String(x.id),x);if(!d.more||!rows.length)break;cursor=rows.at(-1);
 }
 return [...by.values()].sort((a,b)=>(Number(b.created)||Date.parse(b.created||0)||0)-(Number(a.created)||Date.parse(a.created||0)||0));
}
window.ONESharing=Object.assign(window.ONESharing||{},{uiVersion:'121-one-feed-route',listOwnPosts,listPosts,isOwnPost,isFeedPost,cleanCaption,cached:(kind='post')=>[...(onePostsCache[kind==='story'?'story':'post']||[])],localMedia:id=>oneLocalMedia.get(String(id||''))||null});
function publish(file,caption,progress,kind,session=token(),mediaType='unknown',channel='social'){return new Promise((resolve,reject)=>{if(!session||token()!==session)return reject(Error('Ton compte a changé. Rouvre le partage.'));let keys=ids.get(file);if(!keys){keys={};ids.set(file,keys)}const slot=kind+':'+mediaType,id=keys[slot]||(keys[slot]=crypto.randomUUID());const storedCaption=kind==='post'&&channel==='feed'?FEED_MARK+String(caption||''):String(caption||'');const x=new XMLHttpRequest();x.open('POST',BASE+'/posts?'+new URLSearchParams({clientId:id,caption:storedCaption,kind,mediaType,channel}));x.timeout=120000;x.setRequestHeader('Authorization','Bearer '+session);x.setRequestHeader('Content-Type',file.type||(mediaType==='video'?'video/mp4':'image/jpeg'));x.upload.onprogress=e=>{if(e.lengthComputable)progress('Publication · '+Math.round(e.loaded/e.total*100)+' %');};x.onerror=()=>reject(Error('Connexion interrompue. Réessaie : la publication ne sera pas dupliquée.'));x.ontimeout=()=>reject(Error('Envoi trop long. Vérifie ta connexion puis réessaie.'));x.onload=()=>{let d;try{d=JSON.parse(x.responseText)}catch{return reject(Error('Réponse du serveur indisponible.'))}if(x.status<200||x.status>=300||!d.ok)return reject(Error(d.error||'Publication indisponible. Mets à jour le serveur ONE.'));rememberOwned(d,{clientId:id,mediaType,kind,caption:storedCaption});
 const account=accountLocal()||{},serverPost=d.post||d.publication||{},postId=String(serverPost.id||d.postId||d.id||id),created=Number(serverPost.created||serverPost.createdAt||Date.now())||Date.now();
 const optimistic={...serverPost,id:postId,caption:storedCaption||String(serverPost.caption||''),kind,mediaType,channel,mime:String(file.type||(mediaType==='video'?'video/mp4':'image/jpeg')),created,mine:true,name:serverPost.name||account.displayName||account.name||'Moi',_optimistic:true};
 oneLocalMedia.set(postId,file);oneLocalMedia.set(String(id),file);
 rememberPosts(kind,[optimistic],false);
 window.dispatchEvent(new CustomEvent('one-posts-updated',{detail:{kind,post:optimistic,mediaType}}));
 resolve(d)};x.send(file)});}
window.oneCameraShare=(original,dialog,options={})=>{
 dialog.oneShareCleanup?.();dialog.querySelector('.oneCaptureDestinations')?.remove();
 const panel=node('section','oneCaptureDestinations oneMultiShare');dialog.append(panel);
 const status=text=>{dialog.querySelector('[role=status]').textContent=text;};
 const session=token(),items=new Map();let file=original,editedURL=null,running=false,started=false,disposed=false,friendsLoaded=false;const initialType=String(original?.type||'').toLowerCase(),initialMedia=initialType.startsWith('video/')?'video':initialType.startsWith('image/')?'photo':'unknown';
 const button=(text,fn,cls='')=>{const b=node('button',cls,text);b.type='button';b.onclick=fn;return b;};
 const cleanup=()=>{disposed=true;if(editedURL)URL.revokeObjectURL(editedURL);dialog.removeEventListener('close',cleanup);};
 dialog.oneShareCleanup=cleanup;dialog.addEventListener('close',cleanup,{once:true});
 const title=node('h3','','Partager'),intro=node('p','oneMultiIntro','Choisis où publier ce contenu.');
 const edit=button('Aa · Ajouter du texte',async()=>{if(!window.oneEditCapture){status('L’éditeur se prépare. Réessaie.');return}dialog.querySelector('.oneCaptureView video')?.pause();const result=await window.oneEditCapture(options.source||original);if(!result||disposed)return;file=result;if(editedURL)URL.revokeObjectURL(editedURL);editedURL=URL.createObjectURL(file);const media=dialog.querySelector('.oneCaptureView img,.oneCaptureView video');media.src=editedURL;edit.textContent='Aa · Modifier le texte';status('Texte intégré au média. Choisis les destinations.');},'oneTextEdit');
 edit.hidden=!!options.preview;panel.append(edit,title,intro);
 function row(key,name,hint,kind,friend,accept='any'){
  const label=node('label','oneDestination'),input=node('input'),copy=node('span'),result=node('small','oneDestinationResult');label.dataset.kind=kind;label.dataset.accept=accept;input.type='checkbox';input.setAttribute('aria-label',name);const incompatible=accept!=='any'&&initialMedia!=='unknown'&&accept!==initialMedia;if(incompatible){label.dataset.incompatible='true';result.textContent=accept==='video'?'Réservé aux vidéos':'Réservé aux photos';}copy.append(node('b','',name),node('small','',hint),result);label.append(input,copy);const item={key,name,kind,friend,input,label,result,state:'pending',incompatible};items.set(key,item);input.onchange=()=>{if(input.checked&&kind==='post'){for(const other of items.values())if(other!==item&&other.kind==='post'&&other.input.checked)other.input.checked=false;}update();};return label;
 }
 panel.append(row('one-feed','Fil ONE','Visible dans le feed vidéo ONE','post',null,'video'),row('story','Ma story','Dans Moments · visible 24 heures','story'));
 const defaultDestination=items.get('one-feed');if(defaultDestination&&!defaultDestination.incompatible)defaultDestination.input.checked=true;
 const friendsBox=node('div','oneFriendChoices'),friendsToggle=button('Choisir mes amis',async()=>{friendsBox.hidden=!friendsBox.hidden;friendsToggle.setAttribute('aria-expanded',String(!friendsBox.hidden));if(!friendsBox.hidden&&!friendsLoaded)await loadFriends();},'oneFriendsToggle');friendsToggle.setAttribute('aria-expanded','false');friendsBox.hidden=true;panel.append(friendsToggle,friendsBox);
 async function loadFriends(){
  friendsBox.replaceChildren(node('p','','Chargement des amis…'));friendsToggle.disabled=true;
  try{if(token()!==session)throw Error('Ton compte a changé. Ferme puis rouvre le partage.');const d=await api(PEOPLE,'/friends/state');if(disposed||token()!==session)return;friendsBox.replaceChildren();const friends=(d.relationships||[]).filter(f=>f.status==='accepted');
   for(const f of friends){const friend={id:String(f.id),name:f.name||f.displayName||'Ami ONE'};if(!items.has('friend:'+friend.id))friendsBox.append(row('friend:'+friend.id,friend.name,'Message privé · média supprimé après ouverture','friend',friend));}
   if(!friends.length)friendsBox.append(node('p','','Aucun ami accepté pour le moment.'));friendsLoaded=true;
  }catch(e){if(!disposed)friendsBox.replaceChildren(node('p','',e.message),button('Réessayer',loadFriends));}finally{if(!disposed)friendsToggle.disabled=running;update();}
 }
 const captionLabel=node('label','oneMultiCaption','Légende (facultatif)'),caption=node('textarea');caption.rows=2;caption.maxLength=1000;caption.placeholder='Raconte ce moment…';captionLabel.append(caption);captionLabel.hidden=true;
 const summary=node('p','oneMultiSummary'),send=button('Choisis une destination',sendAll,'capturePrimary oneMultiSend'),done=button('Terminer',()=>dialog.close(),'oneMultiDone'),retake=button('Changer de photo ou vidéo',()=>window.oneRetakeCapture?.());done.hidden=true;
 panel.append(captionLabel,summary,send,done,retake);
 function update(){
  const selected=[...items.values()].filter(x=>x.input.checked),pending=selected.filter(x=>x.state!=='sent');
  captionLabel.hidden=!selected.some(x=>x.kind!=='friend');
  summary.textContent=selected.length?selected.length+' destination'+(selected.length>1?'s':'')+' sélectionnée'+(selected.length>1?'s':''):'';
  send.disabled=running||!pending.length;send.textContent=running?'Partage en cours…':!pending.length?(selected.length?'Partage terminé':'Choisis une destination'):(started?'Réessayer / partager':'Partager')+' · '+pending.length;
  for(const x of items.values()){if(x.incompatible)x.input.checked=false;x.input.disabled=x.incompatible||running||x.state==='sent';x.label.dataset.state=x.state;}
  edit.disabled=running||started;caption.disabled=running||started;retake.disabled=running;friendsToggle.disabled=running;
  done.disabled=running;done.hidden=![...items.values()].some(x=>x.state==='sent');
 }
 async function sendAll(){
  if(running)return;const queue=[...items.values()].filter(x=>x.input.checked&&x.state!=='sent');if(!queue.length)return;
  if(!session||token()!==session){status('Connecte-toi avec le même compte puis rouvre le partage.');return;}
  running=true;started=true;update();const block=e=>e.preventDefault();dialog.addEventListener('cancel',block);const close=dialog.querySelector('[data-close]');if(close)close.disabled=true;
  let sent=0;
  try{
   for(const item of queue){
    if(disposed)break;
    if(token()!==session){status('Ton compte a changé. Les envois restants ont été arrêtés.');break;}
    item.state='sending';item.result.textContent='En cours…';update();
    try{
     const progress=text=>{item.result.textContent=text;status(item.name+' · '+text);};
     if(item.kind==='friend'){
      if(!window.oneSendMediaToFriend)throw Error('La messagerie n’est pas encore prête. Réessaie.');
      const ok=await window.oneSendMediaToFriend(file,item.friend,{openConversation:false,throwOnError:true,onProgress:progress});if(!ok)throw Error('Envoi non confirmé. Réessaie.');
     }else await publish(file,caption.value,progress,item.kind,session,item.accept==='any'?(String(file.type||'').startsWith('video/')?'video':'photo'):item.accept,item.key==='one-feed'?'feed':'social');
     item.state='sent';item.result.textContent='✓ Envoyé';sent++;
    }catch(e){item.state='failed';item.result.textContent='Échec · '+e.message;}
    update();
   }
   const failures=queue.filter(x=>x.state!=='sent').length;
   if(token()===session)status(failures?'Certains envois ont échoué. Réessaie : les destinations déjà livrées ne seront pas renvoyées.':'Partagé sur toutes les destinations sélectionnées.');
   if(sent)window.dispatchEvent(new Event('one-posts-updated'));
  }finally{running=false;dialog.removeEventListener('cancel',block);if(close)close.disabled=false;update();}
 }
 status('Choisis où partager ton contenu.');update();
};

let currentCleanup,currentHost,currentRefresh;
window.oneMountNativeFeed=(host,kind='post',options={})=>{
 if(!host?.isConnected)return;currentCleanup?.();currentHost=host;host.replaceChildren();host.classList.add('oneNativeFeed');host.dataset.kind=kind;const wantedMedia=String(options?.mediaType||'').toLowerCase();const social=options?.social===true;const heading=node('header'),title=node('h2','',kind==='story'?'Stories':social?'Publications':'Le fil ONE'),create=node('button','','＋'),refresh=node('button','','Actualiser');create.setAttribute('aria-label','Créer une publication');create.onclick=()=>window.oneOpenCamera?.();heading.append(title,create,refresh);const intro=node('p','',kind==='story'?'Les stories des membres ONE · visibles 24 h.':'Les photos et vidéos partagées par les membres ONE.'),message=node('p'),list=node('div'),more=node('button','','Voir plus');message.setAttribute('role','status');more.dataset.more='';more.hidden=true;host.append(heading,intro,message,list,more);
 let stopped=false,busy=false,refreshAgain=false,cursor=null;const urls=new Set(),controller=new AbortController();const expiryTimer=setInterval(()=>{for(const item of list.children){if(Number(item.dataset.expires)>0&&Number(item.dataset.expires)<=Date.now()){item.querySelector('video')?.pause();item.remove();}}},15000);const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);loadMedia(e.target)}},{rootMargin:'150px'});
 currentCleanup=()=>{stopped=true;currentRefresh=null;clearInterval(expiryTimer);controller.abort();observer.disconnect();for(const u of urls)URL.revokeObjectURL(u);list.querySelectorAll('video').forEach(v=>v.pause());host.replaceChildren();};
 async function loadMedia(box){if(stopped||!box.isConnected)return;box.replaceChildren(node('p','','Chargement…'));try{let blob=oneLocalMedia.get(String(box.dataset.id||''));if(!blob){const r=await fetch(BASE+'/posts/'+box.dataset.id+'/media',{headers:{Authorization:'Bearer '+token()},signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error('Média indisponible.');blob=await r.blob();}if(stopped||!box.isConnected)return;const url=URL.createObjectURL(blob);urls.add(url);const hint=(box.dataset.mediaType+' '+box.dataset.mime+' '+String(blob.type||'')).toLowerCase(),isVideo=hint.includes('video');const media=node(isVideo?'video':'img');media.src=url;if(media.tagName==='VIDEO'){media.controls=true;media.playsInline=true;media.preload='metadata';media.addEventListener('play',()=>list.querySelectorAll('video').forEach(v=>{if(v!==media)v.pause()}))}else media.alt='Publication ONE';media.onerror=()=>{box.replaceChildren(node('p','','Ce format ne peut pas être affiché sur cet appareil.'))};box.replaceChildren(media);}catch(e){if(stopped)return;const retry=node('button','','Réessayer le chargement');retry.onclick=()=>loadMedia(box);box.replaceChildren(retry);}}
 function card(p){const article=node('article','oneNativePost'),head=node('header'),avatar=node('span','onePostAvatar',(p.name||'O').slice(0,1)),identity=node('div'),stamp=node('time','',new Date(p.created).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}));stamp.dateTime=new Date(p.created).toISOString();identity.append(node('b','',p.name||'Membre ONE'),stamp);head.append(avatar,identity);if(p.mine){const del=node('button','onePostDelete','Supprimer');del.onclick=async()=>{if(del.dataset.confirm!=='true'){del.dataset.confirm='true';del.textContent='Confirmer';setTimeout(()=>{del.dataset.confirm='false';del.textContent='Supprimer'},4000);return}del.disabled=true;try{await api(BASE,'/posts/'+p.id+'/delete',{method:'POST'});article.remove();if(!list.children.length)message.textContent='Aucune publication pour le moment.';}catch(e){message.textContent=e.message;del.disabled=false}};head.append(del)}article.dataset.expires=p.expires||0;const media=node('div','onePostMedia');media.dataset.id=p.id;media.dataset.mime=p.mime||'';media.dataset.mediaType=p.mediaType||p.media_type||'';article.append(head);if(cleanCaption(p.caption))article.append(node('p','',cleanCaption(p.caption)));article.append(media);if(social){const actions=node('div','oneNativePostActions');const like=node('button','','♥ J’aime'),comment=node('button','','💬 Commenter'),share=node('button','','↗ Partager');like.type=comment.type=share.type='button';like.onclick=()=>window.toast?.('J’aime ONE bientôt disponible sur les publications.');comment.onclick=()=>window.toast?.('Commentaires ONE bientôt disponibles sur les publications.');share.onclick=async()=>{try{if(navigator.share)await navigator.share({title:'ONE Social',text:p.caption||'Publication ONE'});else window.toast?.('Partage disponible depuis ONE.')}catch{}};actions.append(like,comment,share);article.append(actions)}list.append(article);observer.observe(media);}
 async function load(reset=false){if(stopped)return;if(busy){if(reset)refreshAgain=true;return;}busy=true;refresh.disabled=true;more.disabled=true;message.textContent='Chargement du fil…';try{const params='?'+new URLSearchParams({kind,...(cursor&&!reset?{before:cursor.created,cursor:cursor.id}:{})});const d=await api(BASE,'/posts'+params,{signal:controller.signal});if(stopped||!host.isConnected)return;if(reset){observer.disconnect();list.replaceChildren();for(const u of urls)URL.revokeObjectURL(u);urls.clear();cursor=null}rememberPosts(kind,d.posts||[],reset);const sourceRows=reset?[...(onePostsCache[kind==='story'?'story':'post']||[])]:[...(d.posts||[])];const rows=sourceRows.filter(p=>{if(social&&isFeedPost(p))return false;if(!social&&kind==='post'&&options?.feedOnly===true&&!isFeedPost(p))return false;if(!wantedMedia)return true;const mt=String(p.mediaType||p.media_type||p.mime||'').toLowerCase();if(wantedMedia==='photo')return !mt||mt.includes('image')||mt==='photo'||mt.includes('octet-stream');if(wantedMedia==='video')return mt.includes('video')||mt==='video';return true;});for(const p of rows)card(p);if(d.posts?.length)cursor=d.posts.at(-1);more.hidden=!d.more;message.textContent=list.children.length?'':wantedMedia==='photo'?'Aucune publication photo pour le moment.':'Aucune publication pour le moment. Partage la première !';}catch(e){if(!stopped)message.textContent=e.message;}finally{busy=false;refresh.disabled=false;more.disabled=false;if(refreshAgain&&!stopped){refreshAgain=false;void load(true);}}}
 currentRefresh=()=>load(true);window.oneRefreshNativeFeed=()=>currentRefresh?.();refresh.onclick=currentRefresh;more.onclick=()=>load();load(true);
};
window.addEventListener('one-posts-updated',()=>{if(currentHost?.isConnected)currentRefresh?.();});
window.addEventListener('one-account-changed',()=>{currentCleanup?.();currentCleanup=null;});window.addEventListener('one-space-open',()=>{setTimeout(()=>{if(currentHost&&!currentHost.isConnected){currentCleanup?.();currentCleanup=null;currentHost=null}mountStories()},0)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)currentHost?.querySelectorAll('video').forEach(v=>v.pause());});
function mountStories(){const moments=document.querySelector('.oneMomentsScreen');if(!moments||moments.querySelector('#oneStories'))return;const host=node('section');host.id='oneStories';host.setAttribute('aria-label','Stories ONE');moments.insertBefore(host,moments.querySelector('.oneMomentsTabs'));window.oneMountNativeFeed(host,'story');}
const shell=document.getElementById('oneFoundation');if(shell)new MutationObserver(()=>{mountStories()}).observe(shell,{childList:true,subtree:true});mountStories();
const waitingFeed=document.getElementById('oneNativeFeed');if(waitingFeed&&!waitingFeed.classList.contains('oneNativeFeed'))window.oneMountNativeFeed(waitingFeed);
})();



