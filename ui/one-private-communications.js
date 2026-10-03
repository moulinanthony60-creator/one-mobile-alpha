/* ONE private communications. Camera/microphone activate only after an explicit click. */
(()=>{'use strict';
const BASE='https://one-messages-api.moulinanthony60.workers.dev';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const btn=(text,fn)=>{const b=el('button','oneCommButton',text);b.type='button';b.onclick=fn;return b;};
const token=()=>window.oneAccountToken?.();
async function request(path,body,method){const session=token();if(!session)throw Error('Connecte-toi à ONE pour continuer.');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(BASE+path,{method:method||(body===undefined?'GET':'POST'),headers:{Authorization:'Bearer '+session,...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:controller.signal});const d=await r.json().catch(()=>({}));if(token()!==session)throw Error('Le compte a changé. Rouvre la conversation.');if(!r.ok||!d.ok){const e=Error(r.status===404?'Le service d’appel est absent : le Worker doit être mis à jour.':r.status===401?'Reconnecte-toi à ONE pour appeler.':d.error||'Service indisponible ('+r.status+').');e.status=r.status;throw e;}return d;}catch(e){if(e.name==='AbortError')throw Error('Le serveur ne répond pas. Vérifie ta connexion puis réessaie.');throw e;}finally{clearTimeout(timer);}}
let config=null;async function ready(){if(!config)config=await request('/communications');return config;}
function errorText(e){return ({NotAllowedError:'Le micro ou la caméra est bloqué. Autorise son accès dans les réglages du site, puis réessaie.',NotFoundError:'Aucun micro ou aucune caméra disponible sur cet appareil.',NotReadableError:'Le micro ou la caméra est déjà utilisé par une autre application.',SecurityError:'Le navigateur bloque l’accès au micro ou à la caméra.'})[e.name]||e.message||'Connexion impossible.';}
const alertError=e=>window.toast?.(errorText(e));
function sheet(title){const d=el('dialog','oneCommDialog');const h=el('h2','',title);d.append(h);document.body.append(d);d.showModal();return d;}
let recording=null,active=null,checking=false,voiceStarting=false,ringtone=null,ringtoneSeq=0,notifiedCallId='';
async function recordVoice(peer){
 if(recording||active||voiceStarting)return;voiceStarting=true;const session=token(),person=contact(peer),d=sheet('Message vocal');d.classList.add('oneVoiceRecorder');d.dataset.phase='preparing';d.setAttribute('aria-label','Message vocal pour '+person.name);d.replaceChildren();
 const heading=el('header','oneVoiceHeader'),titles=el('div');titles.append(el('span','oneVoiceEyebrow','MESSAGE VOCAL'),el('h2','','Pour '+person.name));
 const rec={dialog:d,stream:null,recorder:null,url:null,blob:null,canceled:false,timer:null,sending:false,started:0};recording=rec;voiceStarting=false;
 const cleanup=()=>{if(rec.canceled)return;rec.canceled=true;clearInterval(rec.timer);if(rec.recorder?.state==='recording')rec.recorder.stop();rec.stream?.getTracks().forEach(t=>t.stop());d.querySelectorAll('audio').forEach(a=>a.pause());if(rec.url)URL.revokeObjectURL(rec.url);d.close();d.remove();if(recording===rec)recording=null;};
 const cancel=()=>{if(!rec.sending)cleanup();};rec.cleanup=cleanup;
 const close=iconButton('close','Fermer',cancel);heading.append(titles,close);
 const stage=el('div','oneVoiceStage'),mark=el('div','oneVoiceMark');mark.append(icon('mic'));const clock=el('div','oneVoiceClock','0:00'),bars=el('div','oneVoiceBars');bars.setAttribute('aria-hidden','true');for(let i=0;i<21;i++){const b=el('i');b.style.setProperty('--bar',String(10+(i*17)%31));b.style.setProperty('--delay',String(-(i%7)*.12)+'s');bars.append(b);}
 const status=el('p','oneVoiceStatus','Préparation du micro…');status.setAttribute('role','status');const hint=el('p','oneVoiceLimit','Jusqu’à 2 minutes · écoute avant d’envoyer'),controls=el('div','oneCommControls');stage.append(mark,clock,bars);d.append(heading,stage,status,hint,controls);d.addEventListener('cancel',e=>{e.preventDefault();cancel()});
 try{
  await ready();if(rec.canceled||token()!==session){cleanup();return;}if(!window.MediaRecorder||!navigator.mediaDevices?.getUserMedia)throw Error('Enregistrement vocal indisponible sur ce navigateur.');
  rec.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});if(rec.canceled||token()!==session){rec.stream.getTracks().forEach(t=>t.stop());cleanup();return;}
  const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));rec.recorder=new MediaRecorder(rec.stream,mime?{mimeType:mime}:undefined);const chunks=[];
  rec.recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  rec.recorder.onerror=()=>showError(Error('Enregistrement interrompu. Réessaie.'));
  rec.recorder.onstop=()=>{
   clearInterval(rec.timer);rec.stream.getTracks().forEach(t=>t.stop());if(rec.canceled||d.dataset.phase==='error')return;rec.blob=new Blob(chunks,{type:rec.recorder.mimeType});if(!rec.blob.size){showError(Error('Le vocal est vide. Réessaie.'));return;}
   d.dataset.phase='preview';rec.url=URL.createObjectURL(rec.blob);const audio=el('audio');audio.src=rec.url;const player=audioPlayer(audio,'Aperçu du vocal',(Date.now()-rec.started)/1000);d.insertBefore(player,controls);status.textContent='Ton vocal est prêt';hint.textContent='Écoute-le, recommence ou envoie-le.';
   const clientId=crypto.randomUUID();const send=iconButton('send','Envoyer le vocal',async()=>{
    if(rec.sending||rec.canceled)return;rec.sending=true;send.disabled=true;close.disabled=true;redo.disabled=true;audio.pause();d.dataset.phase='sending';status.textContent='Envoi du vocal…';
    try{if(token()!==session)throw Error('Le compte a changé. Rouvre la conversation.');const r=await fetch(BASE+'/voice?'+new URLSearchParams({to:peer,clientId}),{method:'POST',headers:{Authorization:'Bearer '+session,'Content-Type':rec.blob.type},body:rec.blob,signal:AbortSignal.timeout(30000)});const data=await r.json();if(!r.ok||!data.ok)throw Error(data.error||'Envoi impossible.');if(rec.canceled)return;cleanup();window.toast?.('Vocal envoyé');refreshThread();}
    catch(e){if(!rec.canceled){d.dataset.phase='preview';status.textContent=e.name==='TimeoutError'?'Envoi trop long. Réessaie.':errorText(e);status.setAttribute('role','alert');send.disabled=false;}}
    finally{rec.sending=false;close.disabled=false;redo.disabled=false;}
   },'oneVoiceSend');
   const redo=iconButton('retry','Recommencer',()=>{cleanup();recordVoice(peer);});controls.replaceChildren(redo,send);
  };
  const stop=iconButton('stop','Terminer',()=>{if(rec.recorder.state==='recording'){stop.disabled=true;rec.recorder.stop();}},'oneVoiceStop');controls.append(stop);rec.recorder.start(500);rec.started=Date.now();d.dataset.phase='recording';status.textContent='Enregistrement en cours';
  rec.timer=setInterval(()=>{const seconds=Math.floor((Date.now()-rec.started)/1000);clock.textContent=duration(seconds);if(seconds>=120&&rec.recorder.state==='recording')rec.recorder.stop();},250);
 }catch(e){if(!rec.canceled)showError(e);}finally{voiceStarting=false;}
 function showError(e){if(rec.canceled)return;clearInterval(rec.timer);d.dataset.phase='error';if(rec.recorder?.state==='recording')rec.recorder.stop();rec.stream?.getTracks().forEach(t=>t.stop());status.textContent=errorText(e);status.setAttribute('role','alert');hint.textContent='Ton vocal n’a pas été envoyé.';controls.replaceChildren(iconButton('retry','Réessayer',()=>{cleanup();config=null;recordVoice(peer);},'oneVoiceSend'));}
}

const thread=()=>document.querySelector('dialog.oneThreadFullscreen[open]');
let mounted=null,peerMounted='',voiceBusy=false;const voiceURLs=new Set();
function releaseVoiceURLs(){document.querySelectorAll('.oneVoiceList audio').forEach(a=>a.pause());for(const u of voiceURLs)URL.revokeObjectURL(u);voiceURLs.clear();}
async function refreshThread(){
 const d=thread(),peer=d?.dataset.oneV79Id;if(!d||!peer||/^(group|room):/.test(peer)){if(mounted){releaseVoiceURLs();mounted=null;peerMounted=''}return;}
 const box=d.querySelector('.friends-content'),heading=d.querySelector('.hub-thread-heading');if(!box||!heading)return;
 if(mounted!==d||peerMounted!==peer){releaseVoiceURLs();mounted=d;peerMounted=peer;box.querySelector('.oneVoiceList')?.remove();heading.querySelector('.onePrivateActions')?.remove();box.querySelector('.oneVoiceDock')?.remove();}
 if(!heading.querySelector('.onePrivateActions')){const actions=el('div','onePrivateActions');const audio=iconButton('phone','Appeler',()=>startCall(peer,false)),video=iconButton('video','Visio',()=>startCall(peer,true));audio.dataset.callKind='audio';video.dataset.callKind='video';actions.append(audio,video);heading.append(actions);}
 if(!box.querySelector('.oneVoiceDock')){const voice=iconButton('mic','Vocal',()=>recordVoice(peer));voice.classList.add('oneVoiceDock');voice.setAttribute('aria-label','Enregistrer un message vocal');box.append(voice);}
 if(voiceBusy)return;voiceBusy=true;
 try{await ready();const data=await request('/voice?peer='+encodeURIComponent(peer));if(thread()!==d||peerMounted!==peer)return;
 let list=box.querySelector('.oneVoiceList');if(!list){list=el('section','oneVoiceList');list.setAttribute('aria-label','Messages vocaux');const log=box.querySelector('.friend-message-log');if(!log)return;log.append(list);}
 for(const m of (Array.isArray(data.messages)?data.messages:[])){
  if([...list.children].some(n=>n.dataset.voiceId===m.id))continue;
  const row=el('div','oneVoiceMessage');row.dataset.voiceId=m.id;row.dataset.mine=String(!!m.mine);
  const meta=el('div','oneVoiceMeta'),label=m.mine?'Vocal envoyé':'Vocal reçu';meta.append(icon('mic'),el('span','',label),el('small','',new Date(m.created).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})));
  const hint=el('p','oneVoiceLoadHint');hint.setAttribute('role','status');
  const play=iconButton('play','Écouter',async()=>{
   play.disabled=true;hint.textContent='Chargement du vocal…';const session=token();
   try{const r=await fetch(BASE+'/voice/'+encodeURIComponent(m.id),{headers:{Authorization:'Bearer '+session},signal:AbortSignal.timeout(20000),cache:'no-store'});if(!r.ok)throw Error('Vocal indisponible. Réessaie.');const blob=await r.blob();if(!row.isConnected||thread()!==d||token()!==session)return;
    const u=URL.createObjectURL(blob);voiceURLs.add(u);const audio=el('audio');audio.src=u;row.append(audioPlayer(audio,label));play.remove();hint.remove();readAudioDuration(audio,blob);await audio.play().catch(()=>{});
   }catch(e){if(row.isConnected){play.disabled=false;hint.textContent=errorText(e);}}
  });play.classList.add('oneVoiceLoad');row.append(meta,play,hint);list.append(row);
 }

 }catch(e){/* Existing text/photo chat remains available before server installation. */}finally{voiceBusy=false;}
}
const ICONS={
 phone:'<path d="m7 3 3 5-2 2c1.5 3 3 4.5 6 6l2-2 5 3c0 3-2 4-4 4C10 20 4 14 3 7c0-2 1-4 4-4Z"/>',
 end:'<path d="M3 15v-4c5-5 13-5 18 0v4l-5-1v-3a12 12 0 0 0-8 0v3Z"/>',
 video:'<rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 10 6-3v10l-6-3"/>',
 mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3M9 21h6"/>',
 muted:'<path d="m3 3 18 18M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 1v5M6 11v1a6 6 0 0 0 10 4M18 11v1M12 18v3M9 21h6"/>',
 sound:'<path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>',
 speaker:'<path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14M21 2v4M19 4h4"/>',
 silent:'<path d="M3 9h4l5-4v14l-5-4H3ZM17 9l5 6M22 9l-5 6"/>',
 play:'<path d="m8 4 12 8-12 8Z"/>',pause:'<path d="M8 4v16M16 4v16"/>',
 stop:'<rect x="5" y="5" width="14" height="14" rx="3"/>',
 send:'<path d="m3 3 18 9-18 9 4-9ZM7 12h14"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 retry:'<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>',
 cameraOff:'<path d="m3 3 18 18M15 10l6-3v10l-3-2M11 6h1a3 3 0 0 1 3 3M15 15a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 2-3"/>'
};
function icon(name){const n=el('span','oneCommIcon');n.setAttribute('aria-hidden','true');n.innerHTML='<svg viewBox="0 0 24 24" focusable="false">'+(ICONS[name]||ICONS.phone)+'</svg>';return n;}
function paintButton(b,name,label,aria=label){b.replaceChildren(icon(name),el('span','oneCommLabel',label));b.setAttribute('aria-label',aria);}
function iconButton(name,label,fn,cls=''){const b=btn('',fn);b.classList.add('oneIconAction');if(cls)b.classList.add(cls);paintButton(b,name,label);return b;}
const duration=value=>{const s=Math.max(0,Math.floor(Number(value)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
async function setAudioOutput(target,speaker){
 if(!target||typeof target.setSinkId!=='function')return {ok:false,message:'La sortie audio est gérée automatiquement par le téléphone.'};
 let sink='default';
 if(speaker&&navigator.mediaDevices?.selectAudioOutput){
  try{const chosen=await navigator.mediaDevices.selectAudioOutput();if(chosen?.deviceId)sink=chosen.deviceId;}
  catch(e){if(e.name==='NotAllowedError')return {ok:false,message:'Autorise la sortie audio pour utiliser le haut-parleur.'};return {ok:false,message:'La sortie audio n’a pas pu être sélectionnée.'};}
 }
 try{await target.setSinkId(sink);return {ok:true};}
 catch{return {ok:false,message:'Le mode haut-parleur est indisponible sur ce navigateur.'};}
}
function audioOutputButton(target,status){
 const b=iconButton('sound','Normal',async()=>{
  if(b.disabled)return;
  const speaker=b.dataset.output!=='speaker';b.disabled=true;
  const result=await setAudioOutput(target,speaker);b.disabled=false;
  if(!result.ok){if(status)status.textContent=result.message;return;}
  b.dataset.output=speaker?'speaker':'normal';b.setAttribute('aria-pressed',String(speaker));b.title=speaker?'Sortie audio : haut-parleur':'Sortie audio : mode normal';
  paintButton(b,speaker?'speaker':'sound',speaker?'Haut-parleur':'Normal',speaker?'Revenir au mode normal':'Activer le haut-parleur');
  if(status)status.textContent=speaker?'Haut-parleur activé':'Mode normal activé';
 },'oneOutputMode');
 b.dataset.output='normal';b.setAttribute('aria-pressed','false');b.title='Sortie audio : mode normal';return b;
}
function contact(peer,account){const d=document.querySelector('dialog.oneThreadFullscreen[open]');const row=[...document.querySelectorAll('[data-one-friend-id]')].find(n=>account?n.dataset.oneAccountId===account:n.dataset.oneFriendId===peer);const name=(d&&d.dataset.oneV79Id===peer?d.dataset.oneV79Name:'')||row?.dataset.onePeerName||'Ami ONE';const photo=(d&&d.dataset.oneV79Id===peer?d.querySelector('.hub-avatar img'):row?.querySelector('.avatar img'))?.src;return {name,photo};}
function contactAvatar(person){const avatar=el('div','oneCallAvatar');avatar.setAttribute('aria-hidden','true');if(person.photo){const img=el('img');img.src=person.photo;img.alt='';avatar.append(img);img.onerror=()=>{avatar.textContent=person.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();};}else avatar.textContent=person.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();return avatar;}
function audioPlayer(audio,label,knownDuration=0){
 const box=el('div','oneAudioPlayer'),play=iconButton('play','Écouter',async()=>{try{if(audio.paused)await audio.play();else audio.pause();}catch{hint.textContent='Lecture indisponible. Réessaie.';}}),hint=el('span','oneAudioHint'),output=audioOutputButton(audio,hint),seek=el('input','oneAudioSeek'),time=el('span','oneAudioTime','0:00');
 seek.type='range';seek.min=0;seek.max=100;seek.value=0;seek.step=.1;seek.disabled=true;seek.setAttribute('aria-label','Position de lecture · '+label);time.setAttribute('aria-label','Durée du vocal');hint.setAttribute('role','status');audio.preload='metadata';audio.hidden=true;
 const length=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:Number(audio.dataset.duration)||knownDuration;
 const sync=()=>{const len=length();seek.disabled=!len;seek.value=len?String(audio.currentTime/len*100):'0';seek.style.setProperty('--played',seek.value+'%');time.textContent=len?duration(audio.currentTime)+' / '+duration(len):audio.currentTime>0?duration(audio.currentTime):'—';seek.setAttribute('aria-valuetext',duration(audio.currentTime)+(len?' sur '+duration(len):''));};
 audio.addEventListener('play',()=>{document.querySelectorAll('.oneAudioPlayer audio').forEach(other=>{if(other!==audio)other.pause()});paintButton(play,'pause','Pause');hint.textContent='';});
 const paused=()=>paintButton(play,'play','Écouter');audio.addEventListener('pause',paused);audio.addEventListener('ended',paused);audio.addEventListener('error',()=>{paused();hint.textContent='Ce vocal ne peut pas être lu sur cet appareil.';});
 for(const name of ['timeupdate','loadedmetadata','durationchange','ended'])audio.addEventListener(name,sync);
 seek.oninput=()=>{const len=length();if(len>0)audio.currentTime=Number(seek.value)/100*len;};
 box.append(play,output,seek,time,audio,hint);sync();return box;
}
async function readAudioDuration(audio,blob){
 if(Number.isFinite(audio.duration)&&audio.duration>0)return;
 const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;let context;
 try{context=new AudioContext();const decoded=await context.decodeAudioData(await blob.arrayBuffer());if(audio.isConnected){audio.dataset.duration=String(decoded.duration);audio.dispatchEvent(new Event('durationchange'));}}catch{/* Keep playback available for codecs the decoder cannot inspect. */}finally{await context?.close().catch(()=>{});}
}
function callState(c,state,text){if(c.canceled)return;c.dialog.dataset.state=state;c.status.textContent=text;}
function stopRingtone(){const r=ringtone;ringtone=null;ringtoneSeq++;if(!r)return;clearInterval(r.timer);clearInterval(r.vibrationTimer);try{navigator.vibrate?.(0)}catch{};try{r.ctx.close()}catch{}}
async function startRingtone(c){
 stopRingtone();const seq=ringtoneSeq;const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
 let ctx;try{ctx=new AudioContext();await ctx.resume().catch(()=>{});if(seq!==ringtoneSeq||c?.canceled||active!==c){try{ctx.close()}catch{};return}if(ctx.state==='closed')return;const gain=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(3200,ctx.currentTime);filter.Q.setValueAtTime(.35,ctx.currentTime);gain.gain.setValueAtTime(.16,ctx.currentTime);gain.connect(filter).connect(ctx.destination);const r={ctx,gain,timer:null,vibrationTimer:null};ringtone=r;
  const beep=()=>{if(ringtone!==r||ctx.state==='closed')return;const now=ctx.currentTime;const notes=[[523,0,.30,.58],[659,.23,.30,.48],[784,.46,.34,.42],[392,0,.34,.16],[523,.72,.34,.62],[659,.95,.34,.50],[988,1.18,.42,.44]];for(const [frequency,offset,duration,level] of notes){const osc=ctx.createOscillator(),volume=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(frequency,now+offset);volume.gain.setValueAtTime(.0001,now+offset);volume.gain.exponentialRampToValueAtTime(level,now+offset+.035);volume.gain.setValueAtTime(level,now+offset+Math.max(.04,duration-.12));volume.gain.exponentialRampToValueAtTime(.0001,now+offset+duration);osc.connect(volume).connect(gain);osc.start(now+offset);osc.stop(now+offset+duration+.05);}};
  const vibrate=()=>{try{navigator.vibrate?.([380,130,380,130,620])}catch{}};beep();vibrate();r.timer=setInterval(beep,3000);r.vibrationTimer=setInterval(vibrate,3000);
 }catch{try{ctx?.close()}catch{}}
}
async function showIncomingNotification(c){
 if(!c?.id||notifiedCallId===c.id)return;notifiedCallId=c.id;
 if(!('Notification' in window)||Notification.permission!=='granted')return;
 const title=c.video?'Visio entrante':'Appel audio entrant',body=(c.person?.name||'Un contact')+' t’appelle sur ONE';
 try{const registration=await navigator.serviceWorker?.ready;const options={body,tag:'one-call-'+c.id,renotify:true,requireInteraction:true,vibrate:[420,140,420,140,700],data:{url:location.href,callId:c.id}};if(registration?.showNotification)await registration.showNotification(title,options);else new Notification(title,options);}catch{}
}
async function enableCallNotifications(c){
 if(!('Notification' in window)){c.status.textContent='Les notifications ne sont pas disponibles sur ce navigateur.';return false;}
 try{const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;if(permission==='granted'){c.notify?.remove();c.status.textContent='Notifications d’appel activées';await showIncomingNotification(c);return true;}c.status.textContent='Notifications refusées dans les réglages du navigateur.';}catch{c.status.textContent='Impossible d’activer les notifications.'}return false;
}
function callUI(c,incomingCall=false){
 const d=sheet(c.video?'Appel vidéo':'Appel audio');d.replaceChildren();d.classList.add('oneCallDialog');d.dataset.video=String(c.video);d.dataset.state=incomingCall?'incoming':'preparing';d.setAttribute('aria-label',c.video?'Appel vidéo':'Appel audio');c.dialog=d;c.person=c.person||contact(c.peer);
 const head=el('header','oneCallHeader'),brand=el('span','oneCallBrand','ONE'),type=el('span','oneCallType',c.video?'Visio':'Appel audio');c.clock=el('span','oneCallTime');c.clock.hidden=true;head.append(brand,type,c.clock);
 const stage=el('div','oneCallStage'),identity=el('div','oneCallIdentity'),name=el('h2','',c.person.name);c.status=el('p','oneCallStatus',incomingCall?'Appel entrant…':'Préparation de l’appel…');c.status.setAttribute('role','status');identity.append(contactAvatar(c.person),name,c.status);
 c.remote=el(c.video?'video':'audio','oneRemoteVideo');c.remote.autoplay=true;c.remote.playsInline=true;c.remote.controls=false;if(!c.video)c.remote.hidden=true;
 c.local=el('video','oneLocalVideo');c.local.autoplay=true;c.local.playsInline=true;c.local.muted=true;c.local.hidden=true;c.local.setAttribute('aria-label','Aperçu de ta caméra');
 c.resume=iconButton('sound','Activer le son',async()=>{try{await c.remote.play();c.resume.hidden=true;}catch{c.status.textContent='La lecture reste bloquée. Réessaie.';}});c.resume.classList.add('oneResumeCall');c.resume.hidden=true;
  stage.append(c.remote,identity,c.local,c.resume);const footer=el('footer','oneCallFooter'),controls=el('div','oneCommControls');c.controls=controls;footer.append(controls);d.append(head,stage,footer);
  if(incomingCall&&'Notification' in window&&Notification.permission==='default'){const notify=btn('Activer les notifications',()=>enableCallNotifications(c));notify.classList.add('oneCallNotify');notify.setAttribute('aria-label','Activer les notifications d’appel');c.notify=notify;d.append(notify);}
 if(!incomingCall){
  c.mic=iconButton('mic','Micro',()=>{const tracks=c.stream?.getAudioTracks()||[];if(!tracks.length)return;const enabled=!tracks[0].enabled;tracks.forEach(t=>t.enabled=enabled);paintButton(c.mic,enabled?'mic':'muted',enabled?'Micro':'Micro coupé',enabled?'Couper le micro':'Activer le micro');c.mic.setAttribute('aria-pressed',String(!enabled));});c.mic.disabled=true;c.mic.setAttribute('aria-pressed','false');c.mic.setAttribute('aria-label','Couper le micro');controls.append(c.mic);
  c.sound=iconButton('sound','Son',()=>{c.remote.muted=!c.remote.muted;paintButton(c.sound,c.remote.muted?'silent':'sound',c.remote.muted?'Son coupé':'Son',c.remote.muted?'Activer le son du contact':'Couper le son du contact');c.sound.setAttribute('aria-pressed',String(c.remote.muted));});c.sound.setAttribute('aria-label','Couper le son du contact');c.sound.setAttribute('aria-pressed','false');controls.append(c.sound);
  c.output=audioOutputButton(c.remote,c.status);controls.append(c.output);
  if(c.video){c.camera=iconButton('video','Caméra',()=>{const tracks=c.stream?.getVideoTracks()||[];if(!tracks.length)return;const enabled=!tracks[0].enabled;tracks.forEach(t=>t.enabled=enabled);c.local.hidden=!enabled;paintButton(c.camera,enabled?'video':'cameraOff',enabled?'Caméra':'Caméra coupée',enabled?'Couper la caméra':'Activer la caméra');c.camera.setAttribute('aria-pressed',String(!enabled));});c.camera.disabled=true;c.camera.setAttribute('aria-pressed','false');c.camera.setAttribute('aria-label','Couper la caméra');controls.append(c.camera);}
  controls.append(iconButton('end','Raccrocher',()=>endCall(c),'oneEndCall'));
 }
 d.addEventListener('cancel',e=>{e.preventDefault();endCall(c)});
}
function releaseCall(c){clearTimeout(c.connectTimer);clearTimeout(c.poll);clearInterval(c.durationTimer);if(c.pc){c.pc.ontrack=null;c.pc.onconnectionstatechange=null;c.pc.onicecandidate=null;c.pc.close();}c.stream?.getTracks().forEach(t=>t.stop());if(c.remote){c.remote.pause();c.remote.srcObject=null;}if(c.local)c.local.srcObject=null;}
function closeCall(c){stopRingtone();if(notifiedCallId===c?.id)notifiedCallId='';c.canceled=true;releaseCall(c);c.dialog?.close();c.dialog?.remove();if(active===c)active=null;}
async function endCall(c){if(!c)return;const id=c.id;closeCall(c);if(id)await request('/calls/'+id+'/end',{}).catch(()=>{});}
function finishCall(c,message,error=false){if(c.canceled)return;stopRingtone();if(notifiedCallId===c?.id)notifiedCallId='';c.canceled=true;releaseCall(c);if(active===c)active=null;c.dialog.dataset.state=error?'error':'ended';c.status.textContent=message;c.status.setAttribute('role',error?'alert':'status');c.remote.hidden=true;c.local.hidden=true;c.resume.hidden=true;c.dialog.dataset.remote='false';c.controls.replaceChildren(iconButton('close','Fermer',()=>closeCall(c)));if(c.peer)c.controls.append(iconButton(error?'retry':'phone',error?'Réessayer':'Rappeler',()=>{closeCall(c);config=null;startCall(c.peer,c.video)},'oneAcceptCall'));}
function failCall(c,error){if(c.canceled)return;finishCall(c,errorText(error),true);if(c.id)request('/calls/'+c.id+'/end',{}).catch(()=>{});}

async function acquireMedia(c){if(!navigator.mediaDevices?.getUserMedia)throw Error('Micro/caméra non disponibles. Ouvre ONE dans un navigateur compatible avec HTTPS.');if(!window.RTCPeerConnection)throw Error('Ce navigateur ne prend pas en charge les appels.');let expired=false,timer;const pending=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:c.video?{width:{ideal:640},height:{ideal:480},facingMode:'user'}:false}).then(stream=>{if(expired||c.canceled){stream.getTracks().forEach(t=>t.stop());throw Error('Appel annulé.');}return stream;});try{return await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('Autorisation du micro ou de la caméra en attente. Vérifie la demande du navigateur puis réessaie.'));},25000)})]);}finally{clearTimeout(timer);}}
async function setup(c){const cfg=await ready();if(c.canceled)return;c.status.textContent=c.video?'Autorise le micro et la caméra dans ton navigateur…':'Autorise le micro dans ton navigateur…';const stream=await acquireMedia(c);if(c.canceled){stream.getTracks().forEach(t=>t.stop());return;}c.stream=stream;c.local.srcObject=stream;c.local.hidden=!c.video;c.mic.disabled=!stream.getAudioTracks().length;if(c.camera)c.camera.disabled=!stream.getVideoTracks().length;c.status.textContent='Préparation de l’appel…';
 c.pc=new RTCPeerConnection({iceServers:cfg.iceServers});c.pendingICE=[];c.remoteICE=[];c.after=0;for(const track of stream.getTracks())c.pc.addTrack(track,stream);
 c.pc.ontrack=e=>{if(c.canceled)return;const incomingStream=e.streams[0]||c.remote.srcObject||new MediaStream();if(!incomingStream.getTracks().includes(e.track))incomingStream.addTrack(e.track);c.dialog.dataset.remote=String(c.video&&incomingStream.getVideoTracks().length>0);if(c.remote.srcObject!==incomingStream){c.remote.srcObject=incomingStream;c.remote.play().then(()=>{c.resume.hidden=true;}).catch(e=>{if(!c.canceled&&e.name!=='AbortError')c.resume.hidden=false;});}};
 c.pc.onicecandidate=e=>{if(e.candidate)c.pendingICE.push(e.candidate.toJSON());};
 c.pc.onconnectionstatechange=()=>{if(c.canceled)return;if(c.pc.connectionState==='connected'){clearTimeout(c.connectTimer);c.connected=true;callState(c,'connected','Appel en cours');if(!c.started){c.started=Date.now();c.clock.hidden=false;c.clock.textContent='0:00';c.durationTimer=setInterval(()=>{c.clock.textContent=duration((Date.now()-c.started)/1000);},1000);}}if(c.pc.connectionState==='disconnected')callState(c,'reconnecting','Reconnexion…');if(c.pc.connectionState==='failed')failCall(c,Error('Impossible de relier les appareils sur ce réseau. Le service doit disposer d’un relais TURN.'));};
}
async function flushICE(c){while(c.pendingICE.length&&!c.canceled){await request('/calls/'+c.id+'/ice',{candidate:c.pendingICE[0]});c.pendingICE.shift();}}
async function pollCall(c){if(active!==c||c.canceled)return;try{await flushICE(c);const d=await request('/calls/'+c.id+'?after='+c.after);if(active!==c||c.canceled)return;if(d.call.state==='ended'){finishCall(c,c.connected?'Appel terminé':'Ton contact n’a pas répondu ou a refusé l’appel.');return;}
 if(d.call.answer&&!c.pc.remoteDescription)await c.pc.setRemoteDescription({type:'answer',sdp:d.call.answer});
 for(const row of d.ice){c.after=Math.max(c.after,row.seq);c.remoteICE.push(JSON.parse(row.candidate));}
 if(c.pc.remoteDescription){while(c.remoteICE.length){await c.pc.addIceCandidate(c.remoteICE[0]);c.remoteICE.shift();}if(!c.connectTimer&&!c.connected)c.connectTimer=setTimeout(()=>failCall(c,Error('La connexion entre les appareils n’aboutit pas. Vérifie la configuration TURN du serveur.')),30000);}
 c.errors=0;
 }catch(e){if(++c.errors>=3){failCall(c,e);return;}}
 if(active===c&&!c.canceled)c.poll=setTimeout(()=>pollCall(c),1000);
}
async function startCall(peer,video){if(active||recording||voiceStarting)return;const c={peer,video,errors:0,canceled:false};active=c;callUI(c);try{await setup(c);if(c.canceled)return;const offer=await c.pc.createOffer();await c.pc.setLocalDescription(offer);c.status.textContent='Envoi de l’appel…';const d=await request('/calls',{to:peer,video,offer:offer.sdp});c.id=d.id;if(c.canceled){await request('/calls/'+c.id+'/end',{});return;}callState(c,'ringing','En attente de réponse…');pollCall(c);}catch(e){failCall(c,e);}}
async function incoming(){
 if(checking||active||recording||voiceStarting||!token())return;checking=true;
 try{await ready();const {call}=await request('/calls/incoming');if(!call||active||recording||voiceStarting)return;
  const row=[...document.querySelectorAll('[data-one-friend-id]')].find(n=>n.dataset.oneAccountId===call.caller);
  const c={id:call.id,peer:row?.dataset.oneFriendId,video:!!call.video,person:contact(undefined,call.caller),errors:0,canceled:false};active=c;callUI(c,true);startRingtone(c);showIncomingNotification(c);
  const refuse=iconButton('end','Refuser',()=>endCall(c),'oneEndCall');
  const accept=iconButton(c.video?'video':'phone','Accepter',async()=>{
   accept.disabled=true;stopRingtone();clearTimeout(c.poll);c.dialog.close();c.dialog.remove();callUI(c);
   try{await setup(c);if(c.canceled)return;const data=await request('/calls/'+c.id);if(data.call.state!=='ringing')throw Error('L’appel est terminé.');await c.pc.setRemoteDescription({type:'offer',sdp:data.call.offer});const answer=await c.pc.createAnswer();await c.pc.setLocalDescription(answer);await request('/calls/'+c.id+'/answer',{answer:answer.sdp});await flushICE(c);callState(c,'connecting','Connexion avec ton contact…');pollCall(c);}catch(e){failCall(c,e);}
  },'oneAcceptCall');c.controls.append(refuse,accept);
  const watch=async()=>{if(active!==c||!accept.isConnected)return;try{const r=await request('/calls/'+c.id);if(active!==c||!accept.isConnected)return;if(r.call.state==='ended'){closeCall(c);return;}}catch{}if(active===c&&accept.isConnected)c.poll=setTimeout(watch,2000);};c.poll=setTimeout(watch,2000);
 }catch{}finally{checking=false;}
}

window.addEventListener('one-thread-ready',refreshThread);window.addEventListener('one-thread-closed',refreshThread);setInterval(refreshThread,1000);setInterval(incoming,1500);window.addEventListener('one-account-changed',()=>{config=null;if(active)endCall(active);stopRingtone();recording?.cleanup?.();releaseVoiceURLs()});window.addEventListener('pagehide',()=>{stopRingtone();if(active){const c=active,id=c.id;closeCall(c);if(id)fetch(BASE+'/calls/'+id+'/end',{method:'POST',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:'{}',keepalive:true}).catch(()=>{})}recording?.cleanup?.();releaseVoiceURLs()});

})();

