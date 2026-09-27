/* Persistent shared player in the salon. Room redraws never replace its iframe. */
(()=>{
 'use strict';
 const {el,button,api}=ONEUI;
 const root=document.getElementById('oneSalonTogether');if(!root)return;
 root.className='ot-salon-session';root.setAttribute('aria-label','Lecture Together dans le salon');
 const heading=el('div',undefined,'ot-salon-heading'),title=el('h3'),badge=el('small','TOGETHER · ENSEMBLE');heading.append(badge,title);
 const player=el('div',undefined,'ot-player'),status=el('p',undefined,'ot-status'),actions=el('div',undefined,'ot-salon-actions');status.setAttribute('role','status');
 const sound=button('Activer le son',activate,'os-primary'),play=button('Lire ensemble',()=>command(data?.state.playing?'pause':'play')),browse=button('Choisir une vidéo',()=>{window.oneCloseSalon?.();window.oneShowSpace?.('together');window.ONETogether?.browse?.();});
 actions.append(sound,play,browse);root.append(heading,player,status,actions);
 let room=null,data=null,adapter=null,controller=null,clock=null,key='',muted=true,blocked=false,failed=false,ready=false,busy=false,pending=false,epoch=0,timer=null,lastPlay=-Infinity,lastSeek=-Infinity,lastEnd='';
 const visible=()=>!document.hidden&&!!window.oneSalonIsOpen?.()&&!!room?.together&&root.isConnected;
 const time=()=>clock?clock.server+performance.now()-clock.at:Date.now();
 const target=()=>Math.max(0,Math.min(86400,data.state.position+(data.state.playing?Math.max(0,time()-data.state.updatedAt)/1000:0)));
 function controls(){
  root.hidden=!visible();if(root.hidden)return;
  title.textContent=data?.state.media?.title||room.together.title;
  sound.textContent=failed?'Réessayer le lecteur':!ready?'Chargement…':blocked?'▶ Démarrer la vidéo':muted?'Activer le son':'Couper le son';
  sound.disabled=!failed&&!ready;sound.setAttribute('aria-pressed',String(!muted));
  play.hidden=!room.isHost;play.disabled=!data||busy;play.textContent=data?.state.playing?'Pause pour tous':'Lire ensemble';
  browse.textContent=room.isHost?'Choisir une vidéo':'Ouvrir Together';
 }
 function destroyPlayer(){controller?.abort();controller=null;adapter=null;ready=false;failed=false;blocked=false;key='';lastEnd='';lastPlay=lastSeek=-Infinity;player.replaceChildren();}
 function stop(){epoch++;clearTimeout(timer);timer=null;destroyPlayer();data=null;clock=null;pending=false;busy=false;muted=true;root.hidden=true;}
 function sync(){
  if(!visible()||!data?.state.media||!adapter||failed||blocked)return;
  if(!data.state.playing){adapter.pause();status.textContent=room.isHost?'Prêt à regarder · lance la lecture pour le salon.':'En pause · l’hôte pilote la séance.';return;}
  const duration=adapter.duration(),position=Math.min(target(),duration?Math.max(0,duration-.1):86400),now=performance.now();
  const seekable=adapter.canSeek?.();
  if(!data.state.media.live&&seekable!==null&&seekable!==false&&Math.abs(adapter.time()-position)>1.4&&now-lastSeek>2500){adapter.seek(position);lastSeek=now;}
  if(adapter.paused()&&now-lastPlay>2500){lastPlay=now;adapter.play();}
  status.textContent=adapter.paused()?'La vidéo démarre…':muted?'Lecture en cours · active le son quand tu veux.':'Lecture en cours avec le salon.';
 }
 async function mount(media){
  destroyPlayer();if(!media)return;
  key=media.key;const own=epoch,currentKey=key;controller=new AbortController();const signal=controller.signal;
  player.dataset.togetherProvider=media.source;const mount=el('div',undefined,'ot-mount');player.append(mount);status.textContent='Chargement de la vidéo…';controls();const tray=document.getElementById('oneSalonTray');if(tray)tray.scrollTop=0;
  const valid=()=>own===epoch&&key===currentKey&&!signal.aborted;
  const events={
   blocked(){if(!valid())return;blocked=true;status.textContent='Appuie sur « Démarrer la vidéo » ou sur ▶ dans le lecteur.';controls();},
   playing(){if(!valid())return;blocked=false;controls();},
   error(message){if(!valid())return;failed=true;status.textContent=message;controls();},
   ended(){if(!valid()||lastEnd===currentKey||!room?.isHost||!data?.state.playing)return;if(busy){setTimeout(events.ended,500);return;}lastEnd=currentKey;command(data.state.queue.length?'next':'pause');}
  };
  try{const result=await ONETogetherPlayer.create(mount,media,events,signal);if(!valid()){result?.destroy();return;}adapter=result;ready=!!adapter;adapter?.mute(muted);controls();sync();}catch(e){events.error(e.message);}
 }
 function apply(next,started){
  if(!visible()||next.roomId!==room.id||(data&&next.revision<data.revision))return;
  data=next;clock={server:next.serverNow+Math.min((performance.now()-started)/2,1000),at:performance.now()};
  if(!next.state.media){stop();window.oneRefreshSalonState?.(true);return;}
  if(next.state.media.key!==key)mount(next.state.media);
  controls();sync();
 }
 function schedule(){clearTimeout(timer);if(visible())timer=setTimeout(poll,data?.state.playing?3000:7000);}
 async function poll(){
  clearTimeout(timer);if(!visible()||pending)return;
  const own=epoch,id=room.id,start=performance.now();pending=true;
  try{const next=await api('/party/together/state?room='+encodeURIComponent(id));if(own===epoch)apply(next,start);}
  catch(e){if(own===epoch)status.textContent=e.message;}
  finally{if(own===epoch){pending=false;schedule();}}
 }
 async function command(action){
  if(!visible()||!room.isHost||!data||busy)return;
  const own=epoch,id=room.id,revision=data.revision,start=performance.now();busy=true;controls();
  try{const next=await api('/party/together/command?room='+encodeURIComponent(id),'POST',{action,revision});if(own!==epoch)return;apply(next,start);schedule();if(action==='next')window.oneRefreshSalonState?.(true);}
  catch(e){if(own===epoch){status.textContent=e.message;poll();}}
  finally{if(own===epoch){busy=false;controls();}}
 }
 function activate(){
  if(failed){mount(data?.state.media||room?.together);return;}
  muted=blocked?false:!muted;blocked=false;adapter?.mute(muted);
  if(data?.state.playing)adapter?.play();controls();sync();
 }
 function refresh(){
  const next=window.oneSocialRoom?.()||null,changed=next?.id!==room?.id;room=next;
  if(changed)stop();
  if(!visible()){if(key||pending)stop();else root.hidden=true;return;}
  controls();if(!data||data.state.media?.key!==room.together.key)poll();
 }
 window.addEventListener('one-party-state',refresh);window.addEventListener('one-salon-visibility',refresh);
 window.addEventListener('one-account-changed',()=>{room=null;stop();});window.addEventListener('pagehide',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);adapter?.pause();}else{refresh();poll();}});
 window.addEventListener('online',()=>{if(visible())poll();});setInterval(sync,500);refresh();
})();
