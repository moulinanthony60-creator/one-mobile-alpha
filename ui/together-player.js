/* Provider adapters. Room commands live in together.js, never in player callbacks. */
(()=>{
 let youtubePromise,twitchPromise;
 function twitch(){if(window.Twitch?.Player)return Promise.resolve();if(twitchPromise)return twitchPromise;twitchPromise=new Promise((resolve,reject)=>{const s=document.createElement('script'),timer=setTimeout(()=>{twitchPromise=null;reject(Error('Twitch ne répond pas. Réessaie.'));},20000);s.src='https://player.twitch.tv/js/embed/v1.js';s.onload=()=>{clearTimeout(timer);if(window.Twitch?.Player)resolve();else{twitchPromise=null;reject(Error('Lecteur Twitch indisponible.'));}};s.onerror=()=>{clearTimeout(timer);twitchPromise=null;s.remove();reject(Error('Lecteur Twitch indisponible.'));};document.head.append(s);});return twitchPromise;}
 function youtube(){
  if(window.YT?.Player)return Promise.resolve();
  if(youtubePromise)return youtubePromise;
  youtubePromise=new Promise((resolve,reject)=>{
   const previous=window.onYouTubeIframeAPIReady;
   let timer;window.onYouTubeIframeAPIReady=()=>{previous?.();clearTimeout(timer);resolve();};
   const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
   script.onerror=()=>{clearTimeout(timer);youtubePromise=null;script.remove();reject(Error('YouTube ne répond pas. Réessaie dans un instant.'));};
   timer=setTimeout(()=>{youtubePromise=null;reject(Error('Le lecteur YouTube tarde à répondre. Réessaie.'));},20000);document.head.append(script);
  });return youtubePromise;
 }
 async function create(mount,media,events,signal){
  if(media.source==='tiktok')return new Promise((resolve,reject)=>{
   const frame=document.createElement('iframe');frame.src='https://www.tiktok.com/player/v1/'+media.id+'?controls=1&progress_bar=0&play_button=1&volume_control=1&autoplay=0&loop=0&description=1&rel=0';frame.title=media.title;frame.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';frame.setAttribute('allowfullscreen','');frame.referrerPolicy='strict-origin-when-cross-origin';mount.append(frame);
   let t=0,d=0,paused=true,ready=false,at=performance.now();const send=(type,value)=>frame.contentWindow?.postMessage({type,value,'x-tiktok-player':true},'https://www.tiktok.com');
   const timer=setTimeout(()=>{cleanup();reject(Error('TikTok ne répond pas. Réessaie ou choisis une autre vidéo.'));},20000);
   function cleanup(){clearTimeout(timer);window.removeEventListener('message',listen);frame.remove();}
   function listen(e){if(e.origin!=='https://www.tiktok.com'||e.source!==frame.contentWindow||!e.data?.['x-tiktok-player']||signal.aborted)return;
    const {type,value}=e.data;
    if(type==='onPlayerReady'){ready=true;clearTimeout(timer);resolve({play:()=>send('play'),pause:()=>{if(!paused)send('pause');},seek:v=>send('seekTo',v),time:()=>t+(paused?0:(performance.now()-at)/1000),duration:()=>d,paused:()=>paused,mute:v=>send(v?'mute':'unMute'),destroy:cleanup});}
    if(type==='onCurrentTime'&&Number.isFinite(value?.currentTime)){t=value.currentTime;d=Number.isFinite(value.duration)?value.duration:0;at=performance.now();}
    if(type==='onStateChange'){paused=value!==1;at=performance.now();if(value===1)events.playing?.();if(value===0)events.ended();}
    if(type==='onPlayerError'){if(value?.errorCode===3002)events.blocked();else events.error('Cette vidéo TikTok ne peut pas être lue ici. Choisis un autre lien ou ouvre la source.');}
   }window.addEventListener('message',listen);signal.addEventListener('abort',()=>{cleanup();if(!ready)resolve(null);},{once:true});
  });
  if(media.source.startsWith('twitch-')){
   await twitch();if(signal.aborted)return null;
   return new Promise((resolve,reject)=>{mount.id='oneTwitch'+crypto.randomUUID();let ready=false;const p=new Twitch.Player(mount.id,{width:'100%',height:'100%',parent:[location.hostname],autoplay:false,muted:false,...(media.live?{channel:media.id}:{video:'v'+media.id})});
    const timer=setTimeout(()=>{mount.replaceChildren();reject(Error('Twitch ne répond pas. Réessaie.'));},20000);
    p.addEventListener(Twitch.Player.READY,()=>{if(signal.aborted)return;ready=true;clearTimeout(timer);resolve({play:()=>p.play(),pause:()=>{if(!p.isPaused())p.pause();},seek:v=>{if(!media.live)p.seek(v);},time:()=>media.live?0:p.getCurrentTime()||0,duration:()=>media.live?0:p.getDuration()||0,paused:()=>p.isPaused(),mute:v=>p.setMuted(v),destroy:()=>mount.replaceChildren()});});
    p.addEventListener(Twitch.Player.PLAYBACK_BLOCKED,()=>{if(!signal.aborted)events.blocked();});p.addEventListener(Twitch.Player.ENDED,()=>{if(!signal.aborted)events.ended();});p.addEventListener(Twitch.Player.OFFLINE,()=>{if(!signal.aborted)events.error('Cette chaîne Twitch est hors ligne.');});
    if(Twitch.Player.PLAY)p.addEventListener(Twitch.Player.PLAY,()=>{if(!signal.aborted)events.playing?.();});
    signal.addEventListener('abort',()=>{clearTimeout(timer);mount.replaceChildren();if(!ready)resolve(null);},{once:true});
   });
  }
  if(media.source==='youtube'){
   await youtube();if(signal.aborted)return null;
   return new Promise((resolve,reject)=>{
    let settled=false;const timer=setTimeout(()=>{if(!settled){player.destroy();reject(Error('Impossible de charger cette vidéo YouTube.'));}},20000);
    const player=new YT.Player(mount,{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',videoId:media.id,
     playerVars:{playsinline:1,origin:location.origin,controls:1,rel:0,fs:1},events:{
      onReady:e=>{settled=true;clearTimeout(timer);if(signal.aborted){e.target.destroy();resolve(null);return;}
       const frame=e.target.getIframe();frame.title=media.title;frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');frame.setAttribute('allowfullscreen','');frame.referrerPolicy='strict-origin-when-cross-origin';
       resolve({play:()=>player.playVideo(),pause:()=>player.pauseVideo(),seek:v=>player.seekTo(v,true),time:()=>player.getCurrentTime()||0,duration:()=>player.getDuration()||0,paused:()=>player.getPlayerState()!==1,mute:v=>v?player.mute():player.unMute(),destroy:()=>player.destroy()});},
      onStateChange:e=>{if(!signal.aborted&&e.data===1)events.playing?.();if(!signal.aborted&&e.data===0)events.ended();},
      onAutoplayBlocked:()=>{if(!signal.aborted)events.blocked();},
      onError:e=>{if(!signal.aborted)events.error('Cette vidéo YouTube ne peut pas être intégrée (code '+e.data+'). L’hôte peut choisir un autre lien.');}
     }});
    signal.addEventListener('abort',()=>{clearTimeout(timer);player.destroy();if(!settled)resolve(null);},{once:true});
   });
  }
  const video=document.createElement(media.source==='audio'?'audio':'video');
  video.src=media.url;video.preload='metadata';video.playsInline=true;video.setAttribute('aria-label',media.title);mount.replaceChildren(video);
  if(media.source==='audio'){const art=document.createElement('span');art.className='ot-audio-art';art.setAttribute('aria-hidden','true');mount.prepend(art);}
  video.addEventListener('ended',events.ended);video.addEventListener('error',()=>events.error('Ce fichier ne peut pas être lu. Vérifie que son lien est public et compatible avec ton navigateur.'));
  video.addEventListener('playing',()=>{if(!signal.aborted)events.playing?.();});
  const adapter={canSeek:()=>video.readyState<2?null:!!video.seekable.length&&video.seekable.end(video.seekable.length-1)>0,play:()=>video.play().catch(e=>{if(e.name==='NotAllowedError')events.blocked();else if(e.name!=='AbortError')events.error('La lecture a échoué. Réessaie.');}),pause:()=>video.pause(),seek:v=>{if(video.readyState)video.currentTime=v;},time:()=>video.currentTime||0,duration:()=>Number.isFinite(video.duration)?video.duration:0,paused:()=>video.paused,mute:v=>{video.muted=v;},destroy:()=>{video.pause();video.removeAttribute('src');video.load();video.remove();}};
  signal.addEventListener('abort',()=>adapter.destroy(),{once:true});return adapter;
 }
 window.ONETogetherPlayer={create};
})();
