(()=>{
 const {el,button,api}=ONEUI;
 let view=null,room=null,data=null,clock=null,adapter=null,abort=null,mediaKey='',armed=false,muted=false,failed=false,busy=false,polling=false,epoch=0,timer=null,lastPlay=0,lastSeek=0,endedKey='',membersKey='',queueKey='',errorCount=0;
 const current=()=>!!view?.root.isConnected&&window.oneCurrentSpace?.()==='together'&&!window.oneSalonIsOpen?.();
 const time=()=>clock?clock.server+performance.now()-clock.at:Date.now();
 const position=(s,now)=>Math.max(0,Math.min(86400,s.position+(s.playing?Math.max(0,now-s.updatedAt)/1000:0)));
 const format=n=>{n=Math.floor(n||0);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
 function note(text){if(current())view.feedback.textContent=text;}
 function destroyPlayer(){if(view?.player)window.ONETogetherFullscreen?.exit(view.player);abort?.abort();abort=null;adapter=null;mediaKey='';failed=false;endedKey='';lastSeek=-Infinity;lastPlay=-Infinity;}
 function clear(){epoch++;clearTimeout(timer);timer=null;destroyPlayer();view?.browser?.destroy();view=null;room=null;data=null;clock=null;armed=false;busy=false;polling=false;membersKey='';queueKey='';}
 function controls(){if(!current())return;const host=!!room?.isHost,media=data?.state.media;
  const selected=data?media:room?.together;
  view.session.hidden=!selected;
  view.browser.setMedia(selected?.key||'');
  if(selected&&view.session.nextElementSibling!==view.browser.root)view.root.insertBefore(view.session,view.browser.root);
  else if(!selected&&view.browser.root.nextElementSibling!==view.session)view.root.insertBefore(view.browser.root,view.session);
  view.root.dataset.host=String(host);view.root.dataset.revision=String(data?.revision??'');view.root.dataset.playing=String(!!data?.state.playing);view.root.dataset.live=String(!!media?.live);
  view.role.textContent=room?(host?'Tu pilotes la lecture du salon.':'Propose une vidéo à la file commune. L’hôte pilote la lecture.'):'Crée ou rejoins un salon pour regarder ensemble.';
  view.play.textContent=data?.state.playing?'Ⅱ Pause pour tous':'▶ Lire ensemble';
  for(const b of [view.play,view.back,view.forward,view.stop])b.disabled=!host||!media||busy;
  view.play.disabled=view.play.disabled||!adapter||failed;
  view.next.disabled=!host||!data?.state.queue.length||busy;
  view.select.hidden=!host;view.select.disabled=!host||!data||busy;view.enqueue.disabled=!room||!data||busy;
  view.seek.disabled=!host||!media||busy||!!media.live;view.back.disabled=view.forward.disabled=view.seek.disabled;
  view.join.hidden=!selected;view.join.disabled=(!adapter&&!failed)||busy;view.join.textContent=failed?'Réessayer le lecteur':!adapter?'Chargement du lecteur…':armed?'Me resynchroniser':'▶ Rejoindre la lecture';
  view.activationHint.textContent=failed?'Réessaie le lecteur ou ouvre la source.':!adapter?'La vidéo choisie par le salon se prépare.':armed?'Le son se règle sur ton appareil.':data?.state.playing?'Appuie ici pour démarrer la vidéo sur cet appareil.':host?'La séance est en pause. « Lire ensemble » lance la vidéo pour le salon.':'L’hôte a mis la séance en pause. Tu peux activer ton lecteur en attendant.';
  view.sound.disabled=!media||!adapter;view.sound.textContent=muted?'Activer le son':'Couper le son';view.sound.setAttribute('aria-pressed',String(!muted));
  view.full.disabled=!media;view.manual.hidden=!room;view.hostControls.hidden=!host;
  view.browser.update({host,ready:!!data,busy,roomId:room?.id});
 }
 function sync(){if(!current()||!data?.state.media||!adapter||failed)return;
  const s=data.state,duration=adapter.duration(),target=Math.min(position(s,time()),duration?Math.max(0,duration-.1):86400);
  if(document.activeElement!==view.seek){view.seek.max=String(duration||Math.max(600,target+60));view.seek.value=String(target);}
  view.elapsed.textContent=format(target)+(duration?' / '+format(duration):'');
  if(!armed){adapter.pause();view.status.textContent=s.playing?'Appuie sur « Rejoindre la lecture » au-dessus de la vidéo.':room?.isHost?'La séance est en pause. Appuie sur « Lire ensemble ».':'En attente du lancement de la lecture par l’hôte.';return;}
  const now=performance.now();
  if(!s.media.live&&adapter.canSeek?.()!==null&&Math.abs(adapter.time()-target)>(s.playing?1.4:.15)&&now-lastSeek>2500){if(adapter.canSeek?.()===false){view.status.textContent='Ce fichier ne permet pas de rejoindre le passage commun. Choisis un autre lien.';return;}adapter.seek(target);lastSeek=now;}
  if(s.playing){if(adapter.paused()&&now-lastPlay>2500){lastPlay=now;adapter.play();}view.status.textContent=adapter.paused()?'Chargement du passage commun…':(s.media.live?'Direct Twitch · le décalage peut varier selon l’appareil':'Lecture partagée · '+room.name);}
  else{adapter.pause();view.status.textContent='En pause pour tout le salon.';}
 }
 async function mountMedia(media){
  const wasArmed=armed;destroyPlayer();armed=wasArmed;view.player.replaceChildren();
  if(!media){view.player.append(el('span','▷','ot-empty-icon'),el('h2','Votre séance commence ici'),el('p',room?.isHost?'Choisis une vidéo dans les contenus ci-dessus, puis lance la lecture pour ton salon.':'Le contenu choisi par l’hôte apparaîtra ici.'));view.status.textContent='Aucun contenu en cours.';controls();return;}
  if(!armed){muted=true;armed=true;}
  view.player.dataset.togetherProvider=media.source;mediaKey=media.key;const own=epoch,key=mediaKey,controller=new AbortController();abort=controller;
  const mount=el('div',undefined,'ot-mount');view.player.append(mount);view.status.textContent='Chargement du lecteur…';
  const events={playing:()=>{if(own!==epoch||key!==mediaKey)return;armed=true;controls();},blocked:()=>{if(own!==epoch||key!==mediaKey)return;armed=false;note('Appuie sur « Rejoindre la lecture » ou sur ▶ dans la vidéo.');controls();},error:message=>{if(own!==epoch||key!==mediaKey)return;failed=true;note(message);view.status.textContent='Lecteur indisponible.';controls();},ended:()=>{if(own!==epoch||key!==mediaKey||endedKey===key)return;if(busy){setTimeout(events.ended,500);return;}endedKey=key;if(room?.isHost&&data?.state.playing)command(data.state.queue.length?'next':'pause');}};
  try{const player=await ONETogetherPlayer.create(mount,media,events,controller.signal);if(controller.signal.aborted||own!==epoch){player?.destroy();return;}adapter=player;adapter?.mute(muted);controls();sync();}catch(e){events.error(e.message);view.join.disabled=false;}
 }
 function apply(d,started){if(!current()||d.roomId!==room?.id)return;if(data&&d.revision<data.revision)return;
  data=d;clock={server:d.serverNow+Math.min((performance.now()-started)/2,1000),at:performance.now()};errorCount=0;
  const media=d.state.media;view.title.textContent=media?.title||'Together';view.source.textContent=media?(media.source==='youtube'?'YouTube':media.source==='audio'?'Musique':media.source==='one'?'ONE':media.source==='tiktok'?'TikTok':media.source.startsWith('twitch-')?'Twitch':'Vidéo')+' · salon privé':'Un écran, votre salon';
  view.link.hidden=!media;if(media)view.link.href=media.url;
  if((media?.key||'')!==mediaKey||!view.player.childNodes.length)mountMedia(media);
  const sig=JSON.stringify(d.state.queue);if(sig!==queueKey){queueKey=sig;view.queue.replaceChildren();view.queueCount.textContent='À suivre · '+d.state.queue.length;
   d.state.queue.forEach((m,i)=>{const li=el('li'),text=el('span',(i+1)+'. '+m.title+(m.proposedBy?.name?' · proposé par '+m.proposedBy.name:''));li.append(text);if(room.isHost){const actions=el('div',undefined,'ot-queue-actions');if(i===0)actions.append(button('Lire maintenant',()=>{armed=true;command('next');},'os-primary'));const remove=button('Retirer',()=>command('remove',{key:m.key}));remove.setAttribute('aria-label','Retirer '+m.title);actions.append(remove);li.append(actions);}view.queue.append(li);});
   if(!d.state.queue.length)view.queue.append(el('li','Ajoute les prochains contenus à votre file commune.','os-muted'));}
  controls();sync();
 }
 async function poll(){clearTimeout(timer);if(!current()||!room||document.hidden||polling)return;
  const own=epoch,id=room.id;polling=true;const start=performance.now();
  try{const d=await api('/party/together/state?room='+encodeURIComponent(id));if(own!==epoch)return;apply(d,start);if(view.feedback.dataset.network){note('Connexion rétablie.');delete view.feedback.dataset.network;}}
  catch(e){if(own!==epoch)return;errorCount++;note(e.status===404?'Together nécessite la mise à jour du serveur.':e.message);view.feedback.dataset.network='1';}
  finally{if(own===epoch){polling=false;schedule();}}
 }
 function schedule(){clearTimeout(timer);if(current()&&room&&!document.hidden)timer=setTimeout(poll,errorCount?Math.min(30000,5000*2**Math.min(errorCount,3)):data?.state.playing?3000:7000);}
 async function command(action,extra={}){if(!room||(!room.isHost&&action!=='enqueue')||!data||busy)return false;
  const own=epoch,id=room.id,revision=data.revision;busy=true;controls();note('');const start=performance.now();
  try{const d=await api('/party/together/command?room='+encodeURIComponent(id),'POST',{action,revision,...extra});if(own!==epoch)return false;apply(d,start);schedule();if(['select','stop','next'].includes(action))window.oneRefreshSalonState?.(true);return true;}
  catch(e){if(own===epoch){note(e.message);poll();}return false;}finally{if(own===epoch){busy=false;controls();}}
 }
 async function share(action,media){
  const ok=await command(action,{media});if(!ok)return false;
  if(action==='select'){armed=true;const started=await command('play');if(started)note('Vidéo partagée · lecture lancée dans le salon.');if(current()){view.manual.open=false;view.session.scrollIntoView({block:'start'});}}
  else note('Ajouté à la file du salon.');
  return true;
 }
 function updateRoom(next){if(!current())return;const changed=room?.id!==next?.id;room=next;
  if(changed){epoch++;clearTimeout(timer);destroyPlayer();data=null;armed=false;busy=false;polling=false;queueKey='';membersKey='';view.player.replaceChildren();view.queue.replaceChildren();view.queueCount.textContent='À suivre · 0';view.title.textContent='Together';view.source.textContent='Un écran, votre salon';view.link.hidden=true;view.elapsed.textContent='';note('');if(!next)mountMedia(null);}
  const sig=JSON.stringify(next?.members||[]);if(sig!==membersKey){membersKey=sig;window.dispatchEvent(new Event('one-salon-before-render'));view.members.replaceChildren();for(const m of next?.members||[])view.members.append(ONEUI.player(m));if(!next)view.members.append(button('Créer ou rejoindre un salon',()=>window.oneOpenSalon?.(),'os-primary'));window.dispatchEvent(new Event('one-salon-rendered'));}
  controls();if(changed&&next)poll();
 }
 function render(shell,localItem){clear();const root=el('section',undefined,'ot-together');root.id='oneTogether';shell.replaceChildren(root);
  const head=el('header',undefined,'ot-head'),titles=el('div'),source=el('span','Un écran, votre salon','os-eyebrow'),title=el('h1','Together');titles.append(source,title);head.append(titles,button('Voir le salon',()=>window.oneOpenSalon?.()));
  const player=el('section',undefined,'ot-player'),status=el('p','Connexion au salon…','ot-status'),role=el('p',undefined,'os-muted'),feedback=el('p',undefined,'ot-feedback');status.setAttribute('role','status');feedback.setAttribute('role','status');
  const local=el('div',undefined,'ot-local'),join=button('Rejoindre la lecture',()=>{if(failed){mountMedia(data.state.media);return;}armed=true;note('');adapter?.play();if(!data.state.playing)adapter?.pause();lastSeek=0;sync();controls();},'os-primary'),sound=button('Couper le son',()=>{muted=!muted;adapter?.mute(muted);controls();}),full=button('⛶ Plein écran',()=>window.ONETogetherFullscreen.toggle(player,full));
  const activation=el('div',undefined,'ot-activation'),activationHint=el('p',undefined,'ot-activation-hint');activation.append(join,activationHint);
  full.setAttribute('aria-label','Plein écran');full.setAttribute('aria-expanded','false');local.append(sound,full);const hostControls=el('div',undefined,'ot-host-controls'),play=button('▶ Lire ensemble',()=>{armed=true;if(!data.state.playing)adapter?.play();command(data.state.playing?'pause':'play');},'os-primary'),back=button('−10 s',()=>command('seek',{position:Math.max(0,position(data.state,time())-10)})),forward=button('+10 s',()=>command('seek',{position:Math.min(adapter?.duration()||86400,position(data.state,time())+10)})),next=button('Suivant',()=>command('next')),stop=button('Terminer',()=>command('stop'));
  hostControls.append(back,play,forward,next,stop);const timeline=el('label',undefined,'ot-timeline'),seek=el('input'),elapsed=el('span');seek.type='range';seek.min='0';seek.max='600';seek.step='1';seek.value='0';seek.setAttribute('aria-label','Position dans la vidéo');seek.onchange=()=>command('seek',{position:Number(seek.value)});timeline.append(seek,elapsed);
  let chosenSource='youtube';const platforms=el('nav',undefined,'ot-platforms');platforms.setAttribute('aria-label','Sources Together');const sourceHint=el('p',undefined,'os-muted');const sourceOptions=[['youtube','YouTube','Lien YouTube public'],['tiktok','TikTok','Lien complet tiktok.com/@pseudo/video/…'],['twitch','Twitch','Chaîne ou rediffusion Twitch'],['one','ONE','Lien public de ta vidéo ONE (MP4 ou WebM). Les créations locales du Feed ne sont pas encore publiées.'],['audio','Musique','Lien MP3, M4A, OGG ou vidéo musicale YouTube']];const editor=el('form',undefined,'ot-editor'),label=el('label','Lien du contenu'),url=el('input');for(const [id,text,hint]of sourceOptions){const b=button(text,()=>{chosenSource=id;for(const x of platforms.children)x.setAttribute('aria-pressed',String(x===b));sourceHint.textContent=hint;url.placeholder=id==='youtube'?'https://www.youtube.com/watch?v=…':id==='tiktok'?'https://www.tiktok.com/@pseudo/video/…':id==='twitch'?'https://www.twitch.tv/chaine':'https://…';});b.setAttribute('aria-pressed',String(id===chosenSource));platforms.append(b);}sourceHint.textContent=sourceOptions[0][2];url.type='url';url.required=true;url.placeholder='https://www.youtube.com/watch?v=…';url.setAttribute('aria-label','Lien du contenu');label.append(url);
  const titleLabel=el('label','Titre (facultatif)'),name=el('input');name.maxLength=120;name.placeholder='Notre séance';titleLabel.append(name);const actions=el('div',undefined,'ot-editor-actions'),select=button('Partager au salon',null,'os-primary'),enqueue=button('Ajouter à la file',null);select.type='submit';actions.append(select,enqueue);
  async function submit(action){if(!editor.reportValidity())return;const ok=await share(action,{url:url.value.trim(),title:name.value.trim(),source:chosenSource});if(ok){url.value='';name.value='';}}
  editor.onsubmit=e=>{e.preventDefault();submit(room?.isHost?'select':'enqueue');};enqueue.onclick=()=>submit('enqueue');editor.append(platforms,sourceHint,label,titleLabel,actions,el('small','Lecture via les lecteurs officiels. Le navigateur peut demander un clic pour démarrer le son.','os-muted'));
  const manual=el('details',undefined,'ot-manual');manual.append(el('summary','Autre contenu · ajouter un lien'),editor);
  const browser=ONETogetherBrowser.create({choose:share});
  const link=el('a','Ouvrir la source');link.target='_blank';link.rel='noopener noreferrer';link.className='ot-source-link';link.hidden=true;
  const members=el('div',undefined,'os-members os-together-members');members.id='oneTogetherMembers';const queue=el('ol',undefined,'ot-queue'),queueCount=el('h2','À suivre · 0');
  const tools=el('div',undefined,'os-room-tools');for(const [kind,label]of [['mic','Micro'],['camera','Caméra']]){const b=button(label,async()=>{try{await window.ONEPartyMedia.toggle(kind);}catch(e){note(e.message);}mediaButtons();});b.dataset.togetherMedia=kind;tools.append(b);}tools.append(button('Chat',()=>{window.oneOpenSalon?.();const chat=document.getElementById('onePartyChat');if(chat){chat.hidden=false;chat.scrollIntoView({block:'nearest'});}}));
  const session=el('section',undefined,'ot-session');session.setAttribute('aria-label','Vidéo du salon');session.append(activation,player,status,local,hostControls,timeline,link);
  root.append(head,browser.root,session,role,feedback,manual,el('h2','Dans votre salon'),members,tools,queueCount,queue);
  view={root,session,activationHint,player,status,feedback,role,title,source,link,local,join,sound,full,hostControls,play,back,forward,next,stop,seek,elapsed,editor,manual,browser,select,enqueue,members,queue,queueCount};
  updateRoom(window.oneSocialRoom?.()||null);if(!room)mountMedia(null);mediaButtons();
  if(localItem?.local)note('Cette création est un aperçu local. Pour la partager à distance, utilise un lien vidéo public.');
 }
 function mediaButtons(){if(!current())return;const s=window.ONEPartyMedia?.status?.()||{};for(const b of view.root.querySelectorAll('[data-together-media]')){const kind=b.dataset.togetherMedia;b.textContent=(kind==='mic'?'Micro':'Caméra')+(s[kind]?' · ON':' · OFF');b.setAttribute('aria-pressed',String(!!s[kind]));b.disabled=!!s.busy;}}
 window.ONETogether={render,clear,position,browse:()=>{if(current()){view.browser.root.open=true;view.browser.root.scrollIntoView({block:'start'});}}};
 window.addEventListener('one-party-state',e=>updateRoom(e.detail));window.addEventListener('one-media-state',mediaButtons);
 window.addEventListener('one-space-open',e=>{if(e.detail!=='together')clear();});window.addEventListener('one-account-changed',clear);window.addEventListener('pagehide',clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);adapter?.pause();}else if(current())poll();});
 window.addEventListener('online',()=>{if(current())poll();});setInterval(()=>{if(!document.hidden)sync();},500);
 window.addEventListener('one-salon-visibility',()=>{if(window.oneSalonIsOpen?.()){clearTimeout(timer);destroyPlayer();}else if(current())poll();});
})();
