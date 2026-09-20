(()=>{
 let state=null,clock=null,media=null,player=null,ready=false,armed=false,preparing=false,failed=false,generation=0,apiPromise=null,lastSeek=0,lastPlay=0,startedKey='',status=null,join=null;
 const key=g=>g.clip.id+':'+(g.clip.start||0)+':'+g.clip.seconds;
 const now=()=>clock?clock.server+(performance.now()-clock.at):Date.now();
 function api(){if(window.YT?.Player)return Promise.resolve();if(apiPromise)return apiPromise;apiPromise=new Promise((resolve,reject)=>{const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve();};let script=document.querySelector('script[src="https://www.youtube.com/iframe_api"]');if(!script){script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{apiPromise=null;reject(Error('Lecteur YouTube indisponible.'));};document.head.append(script);}setTimeout(()=>{if(!window.YT?.Player){apiPromise=null;reject(Error('YouTube ne répond pas. Réessaie ou choisis une autre vidéo.'));}},20000);});return apiPromise;}
 function destroy(){generation++;try{player?.destroy();}catch{}player=null;ready=false;armed=false;preparing=false;failed=false;media?.remove();media=null;startedKey='';window.ONEReactionScreen='';}
 function clear(){destroy();state=null;clock=null;document.getElementById('onePartyGame')?.classList.remove('reactionCinema');}
 function position(g,t){return (g.clip.start||0)+Math.min(g.clip.seconds,Math.max(0,(g.position||0)+(g.phase==='watch'?Math.max(0,t-g.started)/1000:0)));}
 // Pure timeline also used by the multi-client timing tests.
 window.ONEReactionPosition=position;
 function reconcile(force=false){
  const g=state;if(!g||!ready||!player||failed)return;
  const t=now(),target=position(g,t),running=g.phase==='watch'&&t>=g.started&&t<g.deadline;
  if(g.phase==='ready'&&!armed){status.textContent=preparing?'Préparation du lecteur… attends la fin des éventuelles publicités.':'Prépare ton lecteur avant le départ commun.';return;}
  if(!running){if(!preparing)player.pauseVideo();if(g.phase==='paused')status.textContent='Pause pour tout le salon.';else if(g.phase==='watch'&&t<g.started)status.textContent='Départ commun dans '+Math.ceil((g.started-t)/1000)+'…';else if(g.phase==='watch')status.textContent='Extrait terminé.';else if(armed)status.textContent='Lecteur prêt · en attente du départ.';return;}
  const stamp=g.id+':'+g.round+':'+g.started;
  const drift=Math.abs((player.getCurrentTime()||0)-target);
  if(force||stamp!==startedKey||(drift>1.1&&performance.now()-lastSeek>2500)){player.seekTo(target,true);lastSeek=performance.now();startedKey=stamp;}
  if(force||((player.getPlayerState()===2||player.getPlayerState()===5||player.getPlayerState()===-1)&&performance.now()-lastPlay>2500)){player.playVideo();lastPlay=performance.now();}
  status.textContent=player.getPlayerState()===1?'Lecture synchronisée avec le salon.':'Connexion au passage commun…';
 }
 window.ONEVideoSync={
  clear,
  render(g){
   if(window.oneSalonIsOpen?.()||!g||!['horror','laugh'].includes(g.kind)||g.status!=='playing'||!['ready','watch','paused'].includes(g.phase)){clear();return;}
   state=g;if(!clock||clock.id!==g.id)clock={id:g.id,server:g.serverNow,at:performance.now()};
   const panel=document.getElementById('onePartyGame');panel.classList.toggle('reactionCinema',['watch','paused'].includes(g.phase));
   const mediaKey=g.id+':'+g.round+':'+key(g);if(media?.dataset.key===mediaKey){reconcile();return;}
   destroy();state=g;const token=generation;media=document.createElement('section');media.id='oneReactionMedia';media.dataset.key=mediaKey;
   const title=document.createElement('h3');title.textContent=g.clip.title;const mount=document.createElement('div');mount.className='oneSyncMount';mount.id='oneSyncPlayer'+token;status=document.createElement('p');status.setAttribute('role','status');status.textContent='Chargement du lecteur…';
   join=document.createElement('button');join.type='button';join.textContent='Préparer mon lecteur';join.disabled=true;join.onclick=()=>{if(!ready)return;failed=false;if(state.phase==='ready'){preparing=true;player.unMute();player.seekTo(state.clip.start||0,true);player.playVideo();}else{player.unMute();reconcile(true);}};
   const credit=document.createElement('small');credit.textContent=g.clip.author;const fallback=document.createElement('a');fallback.href='https://www.youtube.com/watch?v='+g.clip.id+'&t='+(g.clip.start||0);fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent='Voir la source sur YouTube';
   media.append(title,mount,status,join,credit,fallback);panel.append(media);
   api().then(()=>{if(token!==generation)return;player=new YT.Player(mount.id,{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',videoId:g.clip.id,playerVars:{playsinline:1,origin:location.origin,start:g.clip.start||0,rel:0,fs:0},events:{
    onReady:e=>{if(token!==generation)return;ready=true;join.disabled=false;e.target.cueVideoById({videoId:g.clip.id,startSeconds:g.clip.start||0,endSeconds:(g.clip.start||0)+g.clip.seconds});const frame=e.target.getIframe();frame.title=g.clip.title;frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture');frame.referrerPolicy='strict-origin-when-cross-origin';reconcile(true);},
    onStateChange:e=>{if(token!==generation)return;if(e.data===1&&state?.phase==='ready'&&preparing){preparing=false;armed=true;window.ONEReactionScreen=key(state);e.target.pauseVideo();e.target.seekTo(state.clip.start||0,true);join.textContent='Lecteur prêt ✓';status.textContent='Lecteur prêt · en attente du départ.';}else if(e.data===1&&state?.phase==='watch'){join.textContent='Rejoindre / resynchroniser';reconcile();}},
    onAutoplayBlocked:()=>{if(token===generation){status.textContent='Ton navigateur demande un clic pour lancer la vidéo.';join.textContent='Autoriser la lecture et rejoindre';}},
    onError:e=>{if(token===generation){failed=true;preparing=false;armed=false;window.ONEReactionScreen='';status.textContent='YouTube ne peut pas lire cette vidéo (code '+e.data+'). Le créateur peut choisir un autre extrait.';join.textContent='Réessayer la lecture';}}
   }});}).catch(e=>{if(token===generation)status.textContent=e.message;});
  }
 };
 window.addEventListener('one-game-clock',e=>{const {game,receivedAt,rtt}=e.detail;if(!game||!['horror','laugh'].includes(game.kind)){clear();return;}state=game;clock={id:game.id,server:game.serverNow+Math.min(rtt/2,1000),at:receivedAt};if(media&&!['ready','watch','paused'].includes(game.phase))clear();else reconcile();});
 window.addEventListener('one-game-rendered',()=>{if(!document.querySelector('.pc-horror,.pc-laugh'))clear();});
 window.addEventListener('one-account-changed',clear);window.addEventListener('pagehide',clear);window.addEventListener('one-space-open',e=>{if(e.detail!=='party')clear();});window.addEventListener('one-party-state',e=>{if(!e.detail)clear();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconcile(true);});setInterval(()=>reconcile(),400);
})();
