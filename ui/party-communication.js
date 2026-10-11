(()=>{
 if(window.ONEPartyGameLink?.release==='v200')return;
 const gameListeners=new Set();
 const API='https://one-comments-api.moulinanthony60.workers.dev';let room=null,call=null,joining=false,epoch=0,chatBusy=false,pending=null,mediaPending=false;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const btn=(text,fn)=>{const n=el('button',text);n.type='button';n.onclick=fn;return n;};
 const css=el('style');css.textContent='#onePartyChat{background:#15192b;border:1px solid #554265;border-radius:16px;padding:14px;margin:14px 0}#onePartyChat textarea{width:100%;box-sizing:border-box;background:#090d19;color:white;padding:10px;border-radius:10px;resize:vertical}#onePartyChat button,#oneCallBar button,.oneCamBubble button{background:#493068;border:1px solid #806495;border-radius:10px;color:white;padding:8px;margin:3px}#onePartyChatLog{max-height:240px;overflow:auto}#onePartyChatLog p{white-space:pre-wrap;overflow-wrap:anywhere}#onePartyChatLog article{border-top:1px solid #40314c;padding:8px}#oneCallBar{position:fixed;left:8px;right:8px;bottom:76px;z-index:180;background:#151326f5;border:1px solid #846497;border-radius:12px;padding:6px;font-size:12px;color:white}#oneCallBar[hidden]{display:none}.oneCamBubble{position:fixed;width:108px;height:142px;border:1px solid #b882ed;border-radius:20px;overflow:hidden;background:#211b32;z-index:179;color:white;box-shadow:0 4px 15px #0007}.oneCamBubble header{height:30px;touch-action:none;cursor:move;font-size:11px;overflow:hidden;padding:5px;box-sizing:border-box}.oneCamBubble video{width:108px;height:108px;object-fit:cover}.oneCamBubble .initial{position:absolute;top:54px;left:0;right:0;text-align:center;font-size:32px;pointer-events:none}.oneCamBubble button{position:absolute;bottom:0;left:0;font-size:10px}.oneCamBubble video.off{opacity:0}';
 /* 117AE: a docked camera is always bounded by its seat, including salon proposals. */
 css.textContent+=`.oneCamBubble.seated{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:100%!important;margin:0!important;border:0!important;border-radius:inherit!important;box-shadow:none;z-index:2;box-sizing:border-box}
 .oneCamBubble.seated>header{display:none!important}
 .oneCamBubble.seated>video{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:cover;border-radius:inherit}
 .oneCamBubble.seated>.initial{inset:0!important;display:grid;place-items:center;font-size:24px}
 .oneCamBubble.seated>.initial[hidden]{display:none!important}
 .oneCamBubble.seated>button{left:0;right:0;bottom:0;width:100%;margin:0;padding:3px;border-radius:0;font-size:9px;background:#181421dd}`;
 /* Spectator view follows the survivor in the 3:17 world. Keep the camera
    texture on the fallen avatar, but never let a DOM camera bubble cover the
    spectator's full game view. */
 css.textContent+=`body.one317-spectator .oneCamBubble{display:none!important}`;
 css.textContent+=`body.one317-spectator .oneCamBubble,
 .three17-shell[data-spectator="true"] .oneCamBubble,
 body.one317-spectator [data-camera-seat]>.oneCamBubble{display:none!important;visibility:hidden!important;pointer-events:none!important}`;
 document.head.append(css);
 const chat=el('section');chat.id='onePartyChat';chat.hidden=true;chat.append(el('h2','Discussion du salon'));const log=el('div');log.id='onePartyChatLog';const input=el('textarea');input.maxLength=1000;input.rows=2;input.placeholder='Ton message';input.setAttribute('aria-label','Message au salon');const status=el('p');status.setAttribute('role','status');const send=btn('Envoyer',sendChat),join=btn('Rejoindre le vocal',()=>{if(call)stopCall();else joinCall();});join.dataset.oldVoice='1';join.hidden=true;chat.append(log,input,send,status);

 window.addEventListener('one-salon-call-request',async(event)=>{if(!room||joining)return;const progress=detail=>window.dispatchEvent(new CustomEvent('one-salon-call-progress',{detail}));mount();progress({pending:true});let error='';try{if(!call)await joinCall(event.detail||{mic:false,camera:false});else{syncCallBar();}if(!call)throw Error(status.textContent||'Appel indisponible.');window.oneSalonOpenLounge?.();}catch(e){error=e?.message||'Impossible de rejoindre l’appel.';status.textContent=error;}finally{progress({pending:false,error});}});
 const gameVoice=btn('Rejoindre le vocal',async()=>{if(call)stopCall();else await joinCall({mic:false,camera:false});syncGameVoice();}),gameVoiceStatus=el('span');gameVoiceStatus.setAttribute('role','status');gameVoice.id='oneGameVoiceJoin';gameVoiceStatus.id='oneGameVoiceStatus';
 function syncGameVoice(){const game=document.getElementById('onePartyGame'),target=game?.querySelector('.cg-tools')||game;if(target&&room){if(gameVoice.parentNode!==target)target.append(gameVoice,gameVoiceStatus);gameVoice.textContent=joining?'Connexion…':call?'Quitter le vocal':'Rejoindre le vocal';gameVoice.disabled=joining;gameVoiceStatus.textContent=status.textContent||'';}else{gameVoice.remove();gameVoiceStatus.remove();}}
 new MutationObserver(syncGameVoice).observe(join,{attributes:true,childList:true,subtree:true});new MutationObserver(syncGameVoice).observe(status,{childList:true,subtree:true});window.addEventListener('one-game-rendered',()=>{syncGameVoice();mount();});window.addEventListener('one-party-state',()=>queueMicrotask(syncGameVoice));
 const bar=el('div');bar.id='oneCallBar';bar.hidden=true;const callStatus=el('span'),mic=btn('🎤',toggleMic),cam=btn('📷',toggleCam),leave=btn('📵',()=>stopCall());mic.dataset.loungeMic='1';cam.dataset.loungeCam='1';leave.dataset.loungeLeave='1';mic.title='Micro';cam.title='Caméra';leave.title='Raccrocher';mic.setAttribute('aria-label','Micro');cam.setAttribute('aria-label','Caméra');leave.setAttribute('aria-label','Quitter l’appel');const sound=btn('','');sound.type='button';sound.title='Son';sound.setAttribute('aria-label','Activer ou couper le son');sound.dataset.loungeSound='1';let soundMuted=false;sound.addEventListener('click',()=>{soundMuted=!soundMuted;for(const p of call?.peers?.values()||[])p.bubble.video.muted=soundMuted;sound.setAttribute('aria-pressed',String(soundMuted));sound.innerHTML=soundMuted?ONE_CALL_ICONS.volumeOff:ONE_CALL_ICONS.volume;});
const ONE_CALL_ICONS={mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></svg>',video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="15" height="14" rx="3"/><path d="m17 10 5-3v10l-5-3"/></svg>',volume:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12"/></svg>',volumeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5ZM17 9l5 6m0-6-5 6"/></svg>',hangup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14c5-5 13-5 18 0l-3 5-4-2v-3a15 15 0 0 0-4 0v3l-4 2-3-5Z"/></svg>'};
mic.innerHTML=ONE_CALL_ICONS.mic;cam.innerHTML=ONE_CALL_ICONS.video;sound.innerHTML=ONE_CALL_ICONS.volume;leave.innerHTML=ONE_CALL_ICONS.hangup;
callStatus.textContent='Appel en cours';bar.append(callStatus,mic,cam,sound,leave);document.body.append(bar);
 const floatPhone=document.createElement('button');floatPhone.type='button';floatPhone.id='oneCallFloatingPhone';floatPhone.textContent='📞';floatPhone.title='Ouvrir les commandes Lounge';floatPhone.setAttribute('aria-label','Ouvrir les commandes de l’appel');floatPhone.hidden=true;document.body.append(floatPhone);
 let dragStart=null,dragged=false;floatPhone.addEventListener('pointerdown',e=>{dragged=false;dragStart={x:e.clientX,y:e.clientY,left:floatPhone.getBoundingClientRect().left,top:floatPhone.getBoundingClientRect().top};floatPhone.setPointerCapture(e.pointerId)});floatPhone.addEventListener('pointermove',e=>{if(!dragStart)return;const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;if(Math.hypot(dx,dy)>7)dragged=true;if(dragged){floatPhone.style.left=Math.max(8,Math.min(innerWidth-60,dragStart.left+dx))+'px';floatPhone.style.top=Math.max(70,Math.min(innerHeight-150,dragStart.top+dy))+'px';floatPhone.style.right='auto';floatPhone.style.bottom='auto'}});floatPhone.addEventListener('pointerup',()=>{dragStart=null});floatPhone.addEventListener('pointercancel',()=>{dragStart=null});floatPhone.addEventListener('click',()=>{if(dragged){dragged=false;return}bar.classList.toggle('oneCallExpanded')});
 const callStateObserver=new MutationObserver(()=>{floatPhone.hidden=bar.hidden;if(bar.hidden)bar.classList.remove('oneCallExpanded')});callStateObserver.observe(bar,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('one-lounge-state',e=>{floatPhone.hidden=!e.detail?.active;if(!e.detail?.active)bar.classList.remove('oneCallExpanded')});
 document.addEventListener('click',e=>{if(!e.target.closest('#oneCallBar,#oneCallFloatingPhone,.sr168-lounge'))bar.classList.remove('oneCallExpanded')},true);

 async function request(path,method='GET',body,token=oneAccountToken()){window.ONEAPIBackoff?.check(method);const r=await fetch(API+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)}).catch(e=>{window.ONEAPIBackoff?.network(e);throw e;});const data=await r.json().catch(()=>({}));window.ONEAPIBackoff?.note(r,data);if(!r.ok||!data.ok)throw Object.assign(Error(data.error||'Communication momentanément indisponible.'),{status:r.status});if(token!==oneAccountToken())throw Error('Compte changé.');return data;}
 const chatPath=()=>'/party/chat?room='+encodeURIComponent(room.id);
 function mount(){if(!room)return;const messages=document.getElementById('oneSalonMessagesPage');if(messages&&window.oneSalonIsOpen?.()){if(chat.parentNode!==messages)messages.append(chat);chat.hidden=messages.hidden;if(!chat.hidden)void loadChat();return;}const dock=document.querySelector('#onePartyGame.isBluff .bluff-chat-dock');if(dock&&window.onePartyGameVisible?.()&&!window.oneSalonIsOpen?.()){chat.hidden=false;if(chat.parentNode!==dock)dock.append(chat);input.placeholder='Écris un message…';return;}if(window.oneSalonContainer){if(chat.parentNode!==window.oneSalonContainer){chat.hidden=true;window.oneSalonContainer.append(chat);}if(window.oneSalonIsOpen?.()&&!chat.isConnected){chat.hidden=true;window.oneSalonContainer.append(chat);}}}
 async function loadChat(){if(!room||chatBusy||document.hidden)return;const id=room.id;chatBusy=true;try{const data=await request(chatPath());if(room?.id!==id)return;const nearEnd=log.scrollHeight-log.scrollTop-log.clientHeight<50;const messages=ONEAudit.uniqueById(data.messages);const key=JSON.stringify(messages);if(log.dataset.messages!==key){log.dataset.messages=key;log.replaceChildren();for(const m of messages){const a=el('article');a.dataset.messageKey=String(m.id??'');a.className=m.isYou?'mine':'theirs';a.append(el('b',m.isYou?'Toi':m.author),el('p',m.text));log.append(a);}if(nearEnd)log.scrollTop=log.scrollHeight;}}catch(e){if(room?.id===id){status.textContent=e.message;if(e.status===403){room=null;chat.remove();stopCall();}}}finally{chatBusy=false;}}
 async function sendChat(){if(!room||send.disabled||!input.value.trim())return;const id=room.id;pending=pending||{id:crypto.randomUUID(),text:input.value.trim()};const message=pending;send.disabled=true;try{await request(chatPath(),'POST',message);if(room?.id!==id)return;if(pending===message){input.value='';pending=null;}status.textContent='';await loadChat();}catch(e){if(room?.id===id)status.textContent=e.message;}finally{send.disabled=false;}}
 input.oninput=()=>pending=null;
 function bubble(name,stream,local=false,accountId=""){const b=el('section');b.className='oneCamBubble';b.dataset.cameraOwner=local?'local':accountId;const head=el('header',name+(local?' · toi':'')),v=el('video'),initial=el('span',name.trim().slice(0,1).toUpperCase()||'?');initial.className='initial';v.autoplay=true;v.playsInline=true;v.muted=local||soundMuted;v.srcObject=stream;v.className='off';b.append(head,v,initial);const sound=btn('Activer le son',()=>v.play().then(()=>sound.remove()).catch(()=>{}));v.play().catch(()=>{if(!local)b.append(sound);});const count=document.querySelectorAll('.oneCamBubble').length;b.style.left=Math.max(0,innerWidth-118)+'px';b.style.top=Math.min(innerHeight-150,80+count*148)+'px';document.body.append(b);let drag=null;head.onpointerdown=e=>{if(b.classList.contains("seated"))return;const rect=b.getBoundingClientRect();drag={x:e.clientX-rect.left,y:e.clientY-rect.top};head.setPointerCapture(e.pointerId);};head.onpointermove=e=>{if(!drag)return;b.style.left=Math.max(0,Math.min(innerWidth-108,e.clientX-drag.x))+'px';b.style.top=Math.max(0,Math.min(innerHeight-142,e.clientY-drag.y))+'px';};head.onpointerup=head.onpointercancel=()=>drag=null;queueMicrotask(dockCameras);return {node:b,video:v,show(on,mic){if(mic!==undefined)b.dataset.mic=String(mic);v.classList.toggle('off',!on);initial.hidden=on;},remove(){v.srcObject=null;b.remove();}};}
 const path=(c,action)=>'/party/call/'+action+'?room='+encodeURIComponent(c.room)+'&session='+encodeURIComponent(c.id);
 function signal(c,to,payload){c.queue=c.queue.catch(()=>{}).then(()=>{if(call!==c)return;return request(path(c,'signal'),'POST',{to,payload},c.token);});return c.queue;}
 function media(c){return {type:'media',camera:!!c.video?.enabled,mic:!!c.audio?.enabled};}
 function announce(c){if(c.audio||c.video)c.dataOnly=false;window.dispatchEvent(new Event('one-media-state'));c.local.node.dataset.mic=String(!!c.audio?.enabled);for(const id of c.peers.keys())signal(c,id,media(c)).catch(()=>{});}
 function peer(c,id,name,initiator,accountId){let p=c.peers.get(id);if(p)return p;const pc=new RTCPeerConnection({iceServers:c.iceServers}),stream=new MediaStream();p={pc,stream,accountId,ice:[],bubble:bubble(name,stream,false,accountId),ready:false,data:null,reliable:null};c.peers.set(id,p);
  const attachData=dc=>{
   const reliable=dc.label==='one-game-reliable-v1';
   if(!reliable&&dc.label!=='one-game-v1'){dc.close();return;}
   if(reliable){if(p.reliable){dc.close();return;}p.reliable=dc;}else{if(p.data){dc.close();return;}p.data=dc;}
   const changed=()=>window.dispatchEvent(new Event('one-game-link-state'));
   dc.onopen=changed;dc.onclose=changed;dc.onerror=changed;
   dc.onmessage=e=>{if(call!==c||typeof e.data!=='string'||e.data.length>24000||!room?.members?.some(m=>m.accountId===accountId))return;
    let packet;try{packet=JSON.parse(e.data);}catch{return;}if(packet?.game!=='317'||packet.v!==1)return;
    for(const listener of gameListeners){try{listener(accountId,packet);}catch(error){console.warn('ONE game packet rejected',error);}}
   };
  };
  pc.ondatachannel=e=>attachData(e.channel);if(initiator){attachData(pc.createDataChannel('one-game-v1',{ordered:false,maxRetransmits:0}));attachData(pc.createDataChannel('one-game-reliable-v1',{ordered:true}));}
  pc.onicecandidate=e=>{if(e.candidate)signal(c,id,{type:'candidate',candidate:e.candidate.toJSON()}).catch(()=>{if(call===c)callStatus.textContent='Connexion interrompue. Quitte puis rejoins l’appel.';});};
  pc.ontrack=e=>{if(!stream.getTracks().some(t=>t.id===e.track.id))stream.addTrack(e.track);p.bubble.video.play().catch(()=>{});};
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected'){signal(c,id,media(c)).catch(()=>{});callStatus.textContent='Appel Party';}if(pc.connectionState==='failed')callStatus.textContent='Connexion impossible sur ce réseau. Un relais peut être nécessaire.';};
  if(initiator){pc.addTransceiver('audio',{direction:'sendrecv'});pc.addTransceiver('video',{direction:'sendrecv'});}return p;
 }
 async function tracks(c,p){for(const t of p.pc.getTransceivers()){t.direction='sendrecv';const track=t.receiver.track.kind==='audio'?c.audio:c.video||null;await t.sender.replaceTrack(track);if(track?.kind==='video'&&t.sender.getParameters){try{const params=t.sender.getParameters();params.encodings=params.encodings?.length?params.encodings:[{}];params.encodings[0].maxBitrate=120000;params.encodings[0].maxFramerate=10;await t.sender.setParameters(params);}catch{}}}}
 async function poll(c){if(call!==c)return;try{const d=await request(path(c,'poll')+'&after='+c.after,'GET',undefined,c.token);if(call!==c)return;c.last=Date.now();const ids=new Set(d.peers.map(p=>p.id));for(const [id,p]of c.peers){if(!ids.has(id)){p.pc.close();p.bubble.remove();c.peers.delete(id);}}
  for(const info of d.peers){if(c.id<info.id&&!c.peers.has(info.id)){const p=peer(c,info.id,info.name,true,info.accountId);await tracks(c,p);await p.pc.setLocalDescription(await p.pc.createOffer());await signal(c,info.id,{type:'offer',sdp:p.pc.localDescription.sdp});}}
  for(const msg of d.signals){if(call!==c)return;const info=d.peers.find(x=>x.id===msg.sender);if(!info){c.after=msg.seq;continue;}const data=JSON.parse(msg.payload);let p=c.peers.get(msg.sender);if(data.type==='offer'){if(p&&p.pc.signalingState!=='stable'){c.after=msg.seq;continue;}p=p||peer(c,msg.sender,info.name,false,info.accountId);await p.pc.setRemoteDescription({type:'offer',sdp:data.sdp});await tracks(c,p);for(const candidate of p.ice.splice(0))await p.pc.addIceCandidate(candidate);await p.pc.setLocalDescription(await p.pc.createAnswer());await signal(c,msg.sender,{type:'answer',sdp:p.pc.localDescription.sdp});}else if(data.type==='answer'&&p){await p.pc.setRemoteDescription({type:'answer',sdp:data.sdp});for(const candidate of p.ice.splice(0))await p.pc.addIceCandidate(candidate);}else if(data.type==='candidate'){p=p||peer(c,msg.sender,info.name,false,info.accountId);if(p.pc.remoteDescription)await p.pc.addIceCandidate(data.candidate);else p.ice.push(data.candidate);}else if(data.type==='media'&&p){p.bubble.show(data.camera,data.mic);window.dispatchEvent(new Event('one-media-state'));}c.after=msg.seq;}
 }catch(e){if(call===c){callStatus.textContent=e.message;if([401,403,409].includes(e.status)||Date.now()-c.last>30000){stopCall();status.textContent=e.message;}}}finally{window.dispatchEvent(new Event('one-media-state'));if(call===c)c.timer=setTimeout(()=>poll(c),200);}}
 function syncCallBar(){const visible=!!call&&!call.dataOnly;bar.hidden=!visible;bar.classList.toggle('sr168-call-active',visible);window.dispatchEvent(new CustomEvent('one-lounge-state',{detail:{active:visible}}));}
 window.addEventListener('one-media-state',syncCallBar);window.addEventListener('one-salon-visibility',syncCallBar);
 // The installed app and browser tabs share one account lock. Keep only the
 // transport identifier (never the account token) so an interrupted window
 // can release its own abandoned connection on the next opening.
 let joinTask=null,reconnectTask=null,closingTask=Promise.resolve(),lastJoinError=null;
 const savedSession=key=>{try{const value=JSON.parse(localStorage.getItem(key));return value&&/^[a-f0-9-]{36}$/i.test(value.id)&&typeof value.room==='string'&&value.room.length<200?value:null;}catch{return null;}};
 function rememberSession(c){if(c.storageKey)try{localStorage.setItem(c.storageKey,JSON.stringify({id:c.id,room:c.room}));}catch{}}
 function forgetSession(c){if(c.storageKey&&savedSession(c.storageKey)?.id===c.id)try{localStorage.removeItem(c.storageKey);}catch{}}
 function reserveSession(account){
  if(!navigator.locks?.request||!account)return Promise.resolve({release(){},key:null});
  const key='one_party_connection_v200:'+account;
  return new Promise((resolve,reject)=>{
   navigator.locks.request(key,{ifAvailable:true},lock=>{
    if(!lock){reject(Error('ONE est déjà connecté au salon dans une autre fenêtre de Chrome. Ferme cette autre fenêtre, puis réessaie ici.'));return;}
    return new Promise(release=>resolve({release,key}));
   }).catch(reject);
  });
 }
 async function releaseRemote(c){
  try{
   // Cleanup must still run during pagehide and when request backoff is active.
   const r=await fetch(API+path(c,'leave'),{method:'POST',headers:{Authorization:'Bearer '+c.token},keepalive:true,cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!r.ok&&![401,403,409].includes(r.status))return false;
   forgetSession(c);return true;
  }catch{return false;}
 }
 function disposeCall(c,keepTracks=false){clearTimeout(c.timer);if(!keepTracks){c.audio?.stop();c.video?.stop();}c.local?.remove();for(const p of c.peers.values()){p.pc.close();p.bubble.remove();}}
 function closeConnection(c,keepTracks=false){
  disposeCall(c,keepTracks);
  const done=releaseRemote(c).finally(()=>{c.releaseLock?.();c.releaseLock=null;});
  closingTask=Promise.allSettled([closingTask,done]).then(()=>undefined);return done;
 }
 function joinCall(requirements={mic:false,camera:false}){
  if(call)return Promise.resolve();if(joinTask)return joinTask;if(!room)return Promise.resolve();
  joining=true;status.textContent='Connexion au salon…';lastJoinError=null;join.disabled=true;
  const own=++epoch,id=room.id,token=oneAccountToken(),account=window.oneAccountLocal?.()?.id;
  const current=()=>own===epoch&&room?.id===id&&token===oneAccountToken();
  let stream=null,c=null,lease=null;
  const task=(async()=>{
   try{
    await closingTask;if(!current())return;
    if(((requirements.mic||requirements.camera)&&!navigator.mediaDevices?.getUserMedia)||!window.RTCPeerConnection)throw Error('Appels non pris en charge dans ce navigateur.');
    lease=await reserveSession(account);if(!current())return;
    const previous=lease.key&&savedSession(lease.key);
    if(previous){status.textContent='Reprise de la connexion du salon…';let released=false;for(let attempt=0;attempt<2&&current();attempt++){if(await releaseRemote({...previous,token,storageKey:lease.key})){released=true;break;}if(attempt===0)await new Promise(r=>setTimeout(r,200));}if(!released&&current())throw Error('La connexion précédente ne répond pas encore. Réessaie dans un instant.');}
    if(!current())return;
    stream=(!requirements.mic&&!requirements.camera)||requirements.data?new MediaStream():await navigator.mediaDevices.getUserMedia({audio:requirements.mic?{echoCancellation:true,noiseSuppression:true}:false,video:requirements.camera?{width:{ideal:240},height:{ideal:180},frameRate:{ideal:12,max:15},facingMode:'user'}:false});
    if(!current())return;
    c={id:crypto.randomUUID(),room:id,token,storageKey:lease.key,releaseLock:lease.release,dataOnly:!!requirements.data,audio:stream.getAudioTracks()[0]||null,video:stream.getVideoTracks()[0]||null,peers:new Map(),after:0,queue:Promise.resolve(),last:Date.now()};
    rememberSession(c);
    const d=await request(path(c,'join'),'POST',{session:c.id},c.token);
    if(!current())return;
    c.iceServers=[...(Array.isArray(d.iceServers)?d.iceServers:[]),{urls:['stun:stun.cloudflare.com:3478','stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}];
    c.local=bubble('Moi',new MediaStream(c.video?[c.video]:[]),true);c.local.show(!!c.video);call=c;
    status.textContent='';syncCallBar();callStatus.textContent=requirements.data?'Connexion au salon':'Appel rejoint';join.textContent='Quitter le vocal';mic.setAttribute('aria-pressed',String(!!c.audio));cam.setAttribute('aria-pressed',String(!!c.video));poll(c);
   }catch(e){if(current()){lastJoinError=e;status.textContent=e.name==='NotAllowedError'?(requirements.camera?'Autorise la caméra dans ton navigateur.':'Autorise le micro dans ton navigateur.'):e.message;}}
   finally{
    if(!c||call!==c){stream?.getTracks().forEach(t=>t.stop());if(c)await closeConnection(c);else lease?.release();}
    if(joinTask===task){joinTask=null;joining=false;join.disabled=false;window.dispatchEvent(new Event('one-media-state'));}
   }
  })();joinTask=task;return task;
 }
 function stopCall(options={}){
  epoch++;const c=call;call=null;join.textContent='Rejoindre le vocal';syncCallBar();window.dispatchEvent(new Event('one-media-state'));
  if(!c)return closingTask;return closeConnection(c,options.keepTracks===true);
 }
 function reconnectCall(){
  if(reconnectTask)return reconnectTask;
  const task=(async()=>{
   if(joinTask)await joinTask;
   room=window.oneSocialRoom?.()||room;if(!room)throw Error('Rejoins d’abord un salon ONE.');
   const old=call,media={audio:old?.audio?.readyState==='live'?old.audio:null,video:old?.video?.readyState==='live'?old.video:null};
   const token=oneAccountToken(),id=room.id;const closing=stopCall({keepTracks:true}),own=epoch;
   try{
    await closing;if(own!==epoch||token!==oneAccountToken()||room?.id!==id)throw Error('Connexion annulée.');
    await joinCall({data:old?old.dataOnly:true,mic:false});if(!call)throw lastJoinError||Error(status.textContent||'Connexion indisponible.');
    call.audio=media.audio;call.video=media.video;call.local.video.srcObject=new MediaStream(media.video?[media.video]:[]);call.local.show(!!media.video);
    for(const p of call.peers.values())await tracks(call,p);
    mic.setAttribute('aria-pressed',String(!!call.audio));mic.setAttribute('aria-label',call.audio?'Couper le micro':'Activer le micro');cam.setAttribute('aria-pressed',String(!!call.video));cam.setAttribute('aria-label',call.video?'Couper la caméra':'Activer la caméra');announce(call);
   }catch(e){media.audio?.stop();media.video?.stop();throw e;}
  })();reconnectTask=task;return task.finally(()=>{if(reconnectTask===task)reconnectTask=null;});
 }

 async function toggleMic(){const c=call;if(!c)return;if(c.audio?.readyState==='ended')c.audio=null;try{if(!c.audio){const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(call!==c){stream.getTracks().forEach(t=>t.stop());return;}c.audio=stream.getAudioTracks()[0];for(const p of c.peers.values())await tracks(c,p);}else{const old=c.audio;c.audio=null;old.stop();for(const p of c.peers.values())await tracks(c,p);}mic.setAttribute('aria-pressed',String(!!c.audio?.enabled));mic.setAttribute('aria-label',c.audio?.enabled?'Couper le micro':'Activer le micro');announce(c);}catch(e){callStatus.textContent='Micro non disponible : '+e.message;status.textContent=callStatus.textContent;window.dispatchEvent(new CustomEvent('one-party-action-error',{detail:status.textContent}));announce(c);}}

 async function toggleCam(){const c=call;if(!c||cam.disabled)return;cam.disabled=true;try{if(c.video){const old=c.video;c.video=null;old.stop();for(const p of c.peers.values())await tracks(c,p);c.local.video.srcObject=null;c.local.show(false);cam.setAttribute('aria-pressed','false');cam.setAttribute('aria-label','Activer la caméra');}else{const stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:240},height:{ideal:180},frameRate:{ideal:12,max:15},facingMode:'user'},audio:false});if(call!==c){stream.getTracks().forEach(t=>t.stop());return;}c.video=stream.getVideoTracks()[0];c.local.video.srcObject=stream;c.local.show(true);for(const p of c.peers.values())await tracks(c,p);cam.setAttribute('aria-pressed','true');cam.setAttribute('aria-label','Couper la caméra');}announce(c);}catch(e){if(c.video){c.video.stop();c.video=null;c.local.video.srcObject=null;c.local.show(false);announce(c);}cam.setAttribute('aria-pressed','false');cam.setAttribute('aria-label','Activer la caméra');callStatus.textContent=e.name==='NotAllowedError'?'Caméra non autorisée.':e.message;status.textContent=callStatus.textContent;window.dispatchEvent(new CustomEvent('one-party-action-error',{detail:status.textContent}));}finally{cam.disabled=false;}}

 window.ONEPartyGameLink={
  release:'v200',
  async connect(){if(reconnectTask)return reconnectTask;room=window.oneSocialRoom?.()||room;if(!room)throw Error('Rejoins d’abord un salon ONE.');await joinCall({data:true,mic:false});if(!call)throw lastJoinError||Error(status.textContent||'Connexion au salon indisponible.');},
  reconnect:reconnectCall,
  peers(){return call?[...call.peers.values()].filter(p=>p.accountId).map(p=>({accountId:p.accountId,connected:p.data?.readyState==='open',state:p.pc.connectionState})):[];},
  send(to,packet){if(!call||packet?.game!=='317'||packet.v!==1)return false;const data=JSON.stringify(packet);if(data.length>24000)return false;
   const p=[...call.peers.values()].find(p=>p.accountId===to&&p.data?.readyState==='open'&&p.data.bufferedAmount<=16384);if(!p)return false;try{p.data.send(data);return true;}catch{return false;}},
  sendReliable(to,packet){if(!call||packet?.game!=='317'||packet.v!==1)return false;const data=JSON.stringify(packet);if(data.length>24000)return false;
   const p=[...call.peers.values()].find(p=>p.accountId===to);if(!p)return false;const dc=p.reliable?.readyState==='open'?p.reliable:p.data?.readyState==='open'?p.data:null;if(!dc||dc.bufferedAmount>65536)return false;try{dc.send(data);return true;}catch{return false;}},
  subscribe(listener){gameListeners.add(listener);return()=>gameListeners.delete(listener);}
 };
 window.ONEPartyMedia={memberStatus:id=>{if(!call)return {};if(id==='local')return {connected:true,mic:!!call.audio?.enabled,camera:!!call.video?.enabled};const p=[...call.peers.values()].find(p=>p.bubble.node.dataset.cameraOwner===id);return p?{connected:p.pc.connectionState==='connected',mic:p.bubble.node.dataset.mic==='true'?true:p.bubble.node.dataset.mic==='false'?false:undefined}:{};},toggle:async kind=>{if(mediaPending||joining||!['mic','camera'].includes(kind))return;mediaPending=true;window.dispatchEvent(new Event('one-media-state'));try{if(!call){await joinCall({mic:kind==='mic',camera:kind==='camera'});if(!call)throw Error(status.textContent||'Appel indisponible.');return;}if(kind==='mic')await toggleMic();else await toggleCam();}finally{mediaPending=false;window.dispatchEvent(new Event('one-media-state'));}},
  status:()=>({busy:mediaPending||joining,camera:!!(call?.video?.enabled&&call.video.readyState==='live'&&!call.video.muted),mic:!!(call?.audio?.enabled&&call.audio.readyState==='live'&&!call.audio.muted)}),
  localVideo:()=>call?.local?.video,videoForMember:id=>{const bubble=[...document.querySelectorAll('.oneCamBubble')].find(b=>b.dataset.cameraOwner===id);if(!call)return bubble?.querySelector('video')||null;if(id==='local')return call.local?.video||bubble?.querySelector('video')||null;const peer=[...call.peers.values()].find(p=>p.accountId===id);return peer?.bubble?.video||bubble?.querySelector('video')||null},
  audioTrack:()=>call?.audio,
  enable:async requirements=>{if(!call)await joinCall(requirements);if(!call)throw Error(status.textContent||'Rejoins le vocal pour continuer.');if(requirements.mic&&(!call.audio?.enabled||call.audio.readyState==='ended'))await toggleMic();if(requirements.camera&&call.video?.readyState==='ended')call.video=null;if(requirements.camera&&!call.video)await toggleCam();}
 };
 // Keep the existing video/stream when a render replaces its previous seat.
 function cameraNodes(){return [...new Set([...document.querySelectorAll('.oneCamBubble'),call?.local?.node,...(call?[...call.peers.values()].map(p=>p.bubble?.node):[])].filter(Boolean))];}
 function parkCameras(){if(bar.parentNode!==document.body){document.body.append(bar);bar.classList.remove('gameDocked');}cameraNodes().forEach(b=>{if(b.classList.contains('seated')){b.classList.remove('seated');document.body.append(b);}});}
 function dockCameras(){
  const game=document.getElementById('onePartyGame');
  const active=game?.isConnected&&window.onePartyGameVisible?.();
  const dock=active?game.querySelector('#oneGameCallDock'):null;if(dock){if(bar.parentNode!==dock)dock.append(bar);bar.classList.add('gameDocked');}else if(bar.parentNode!==document.body){document.body.append(bar);bar.classList.remove('gameDocked');}
  const salonSeats=window.oneSalonIsOpen?.()?[...document.querySelectorAll('#oneSalonTray [data-camera-seat]')]:[];const seats=salonSeats.length?salonSeats:active?[...game.querySelectorAll('[data-camera-seat]')]:window.oneCurrentSpace?.()==='together'?[...document.querySelectorAll('#oneTogetherMembers [data-camera-seat]')]:[];
  cameraNodes().forEach(b=>{
   const seat=seats.find(s=>s.dataset.cameraSeat&&s.dataset.cameraSeat===b.dataset.cameraOwner);
   if(seat){if(b.parentNode!==seat)seat.append(b);b.classList.add('seated');}
   else if(b.classList.contains('seated')||!b.isConnected){b.classList.remove('seated');document.body.append(b);}
  });
 }
 window.addEventListener('one-salon-page-changed',mount);window.addEventListener('one-salon-before-render',parkCameras);window.addEventListener('one-salon-rendered',()=>{mount();dockCameras();});window.addEventListener('one-game-before-render',parkCameras);window.addEventListener('one-salon-visibility',()=>{mount();dockCameras();});
 window.addEventListener('one-game-rendered',dockCameras);
 window.addEventListener('one-space-open',()=>queueMicrotask(dockCameras));
 window.addEventListener('one-party-state',()=>queueMicrotask(dockCameras));
 new MutationObserver(dockCameras).observe(document.getElementById('oneFoundation'),{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('one-party-state',e=>{const next=e.detail;if(room?.id!==next?.id){stopCall();input.value='';pending=null;log.replaceChildren();delete log.dataset.messages;}room=next;if(room){mount();if(!chat.hidden&&chat.getClientRects().length)loadChat();}else chat.remove();});window.addEventListener('one-space-open',mount);window.addEventListener('one-account-changed',()=>{room=null;stopCall();chat.remove();input.value='';pending=null;log.replaceChildren();});window.addEventListener('pagehide',stopCall);setInterval(()=>{if(chat.isConnected&&!chat.hidden&&chat.getClientRects().length)loadChat();},4000);
})();