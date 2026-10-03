/* ONE private communications. Camera/microphone activate only after an explicit click. */
(()=>{'use strict';
const BASE='https://one-messages-api.moulinanthony60.workers.dev';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const btn=(text,fn)=>{const b=el('button','oneCommButton',text);b.type='button';b.onclick=fn;return b;};
const token=()=>window.oneAccountToken?.();
async function request(path,body,method){const r=await fetch(BASE+path,{method:method||(body===undefined?'GET':'POST'),headers:{Authorization:'Bearer '+token(),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(12000)});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Service indisponible.');return d;}
let config=null,retryAt=0;async function ready(){if(config)return config;if(Date.now()<retryAt)throw Error('Les vocaux et appels ne sont pas encore disponibles.');try{config=await request('/communications');return config;}catch(e){retryAt=Date.now()+30000;throw Error('Les vocaux et appels ne sont pas encore disponibles. Vérifie la mise à jour du service.');}} 
const alertError=e=>window.toast?.(e.name==='NotAllowedError'?'Autorise le micro ou la caméra dans ton navigateur.':e.message||'Connexion impossible.');
function sheet(title){const d=el('dialog','oneCommDialog');const h=el('h2','',title);d.append(h);document.body.append(d);d.showModal();return d;}
let recording=null,active=null,checking=false;
async function recordVoice(peer){
 if(recording||active)return;
 try{await ready();if(!window.MediaRecorder||!navigator.mediaDevices?.getUserMedia)throw Error('Enregistrement vocal indisponible sur ce navigateur.');
 const d=sheet('Message vocal');const status=el('p','','Préparation du micro…'),controls=el('div','oneCommControls');d.append(status,controls);
 const rec={dialog:d,stream:null,recorder:null,url:null,blob:null,canceled:false,timer:null};recording=rec;
 const cleanup=()=>{rec.canceled=true;clearInterval(rec.timer);if(rec.recorder?.state==='recording')rec.recorder.stop();rec.stream?.getTracks().forEach(t=>t.stop());if(rec.url)URL.revokeObjectURL(rec.url);d.close();d.remove();if(recording===rec)recording=null;};
 d.addEventListener('cancel',e=>{e.preventDefault();cleanup()});controls.append(btn('Annuler',cleanup));
 try{rec.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});if(rec.canceled){rec.stream.getTracks().forEach(t=>t.stop());return;}
 const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));rec.recorder=new MediaRecorder(rec.stream,mime?{mimeType:mime}:undefined);
 const chunks=[];rec.recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 rec.recorder.onerror=()=>{cleanup();alertError(Error('Enregistrement interrompu.'))};
 rec.recorder.onstop=()=>{clearInterval(rec.timer);rec.stream.getTracks().forEach(t=>t.stop());if(rec.canceled)return;rec.blob=new Blob(chunks,{type:rec.recorder.mimeType});if(!rec.blob.size){cleanup();return;}
 rec.url=URL.createObjectURL(rec.blob);const audio=el('audio');audio.controls=true;audio.src=rec.url;d.insertBefore(audio,controls);status.textContent='Écoute ton vocal avant de l’envoyer.';
 const clientId=crypto.randomUUID();const send=btn('Envoyer le vocal',async()=>{send.disabled=true;status.textContent='Envoi…';try{const r=await fetch(BASE+'/voice?'+new URLSearchParams({to:peer,clientId}),{method:'POST',headers:{Authorization:'Bearer '+token(),'Content-Type':rec.blob.type},body:rec.blob,signal:AbortSignal.timeout(30000)});const data=await r.json();if(!r.ok||!data.ok)throw Error(data.error||'Envoi impossible.');cleanup();window.toast?.('Vocal envoyé');refreshThread();}catch(e){status.textContent=e.message;send.disabled=false;}});
 controls.replaceChildren(btn('Annuler',cleanup),send);};
 let seconds=0;status.textContent='● Enregistrement · 0:00';rec.timer=setInterval(()=>{seconds++;status.textContent='● Enregistrement · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(seconds>=120&&rec.recorder.state==='recording')rec.recorder.stop();},1000);
 controls.append(btn('Terminer',()=>{if(rec.recorder.state==='recording')rec.recorder.stop()}));rec.recorder.start(500);
 }catch(e){cleanup();throw e;}
 }catch(e){alertError(e);}
}
const thread=()=>document.querySelector('dialog.oneThreadFullscreen[open]');
let mounted=null,peerMounted='',voiceBusy=false;const voiceURLs=new Set();
function releaseVoiceURLs(){for(const u of voiceURLs)URL.revokeObjectURL(u);voiceURLs.clear();}
async function refreshThread(){
 const d=thread(),peer=d?.dataset.oneV79Id;if(!d||!peer||peer.startsWith('group:')){if(mounted){releaseVoiceURLs();mounted=null;peerMounted=''}return;}
 const box=d.querySelector('.friends-content'),heading=d.querySelector('.hub-thread-heading');if(!box||!heading)return;
 if(mounted!==d||peerMounted!==peer){releaseVoiceURLs();mounted=d;peerMounted=peer;box.querySelector('.oneVoiceList')?.remove();heading.querySelector('.onePrivateActions')?.remove();}
 if(!heading.querySelector('.onePrivateActions')){const actions=el('div','onePrivateActions');actions.append(btn('Vocal',()=>recordVoice(peer)),btn('Appeler',()=>startCall(peer,false)),btn('Visio',()=>startCall(peer,true)));heading.append(actions);}
 if(voiceBusy)return;voiceBusy=true;
 try{await ready();const data=await request('/voice?peer='+encodeURIComponent(peer));if(thread()!==d||peerMounted!==peer)return;
 let list=box.querySelector('.oneVoiceList');if(!list){list=el('section','oneVoiceList');list.setAttribute('aria-label','Messages vocaux');const log=box.querySelector('.friend-message-log');if(!log)return;log.append(list);}
 for(const m of data.messages){if([...list.children].some(n=>n.dataset.voiceId===m.id))continue;const row=el('div','oneVoiceMessage');row.dataset.voiceId=m.id;row.append(el('span','',m.sender===peer?'Vocal reçu':'Vocal envoyé'),el('small','',new Date(m.created).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})));
 const play=btn('Écouter',async()=>{play.disabled=true;try{const r=await fetch(BASE+'/voice/'+encodeURIComponent(m.id),{headers:{Authorization:'Bearer '+token()},signal:AbortSignal.timeout(20000),cache:'no-store'});if(!r.ok)throw Error('Vocal indisponible.');const blob=await r.blob();if(!row.isConnected)return;const u=URL.createObjectURL(blob);voiceURLs.add(u);const audio=el('audio');audio.controls=true;audio.src=u;row.append(audio);play.remove();await audio.play().catch(()=>{});}catch(e){play.disabled=false;alertError(e);}});row.append(play);list.append(row);}
 }catch(e){/* Existing text/photo chat remains available before server installation. */}finally{voiceBusy=false;}
}
function closeCall(c){clearTimeout(c.poll);c.pc?.close();c.stream?.getTracks().forEach(t=>t.stop());c.dialog?.close();c.dialog?.remove();if(active===c)active=null;}
async function endCall(c){if(!c)return;c.canceled=true;const id=c.id;closeCall(c);if(id)await request('/calls/'+id+'/end',{}).catch(()=>{});}
function callUI(c){const d=sheet(c.video?'Appel vidéo':'Appel audio');c.dialog=d;c.status=el('p','','Connexion…');c.remote=el('video','oneRemoteVideo');c.remote.autoplay=true;c.remote.playsInline=true;c.remote.controls=true;c.remote.hidden=!c.video;c.local=el('video','oneLocalVideo');c.local.autoplay=true;c.local.playsInline=true;c.local.muted=true;c.local.hidden=!c.video;
 const controls=el('div','oneCommControls');controls.append(btn('Micro : actif',e=>{const t=c.stream?.getAudioTracks()[0];if(t){t.enabled=!t.enabled;e.currentTarget.textContent=t.enabled?'Micro : actif':'Micro : coupé'}}));if(c.video)controls.append(btn('Caméra : active',e=>{const t=c.stream?.getVideoTracks()[0];if(t){t.enabled=!t.enabled;e.currentTarget.textContent=t.enabled?'Caméra : active':'Caméra : coupée'}}));const end=btn('Raccrocher',()=>endCall(c));end.classList.add('oneEndCall');controls.append(end);d.append(c.status,c.remote,c.local,controls);d.addEventListener('cancel',e=>{e.preventDefault();endCall(c)});}
async function setup(c){const cfg=await ready();if(c.canceled)return;const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:c.video?{width:{ideal:640},height:{ideal:480},facingMode:'user'}:false});if(c.canceled){stream.getTracks().forEach(t=>t.stop());return;}c.stream=stream;c.local.srcObject=stream;
 c.pc=new RTCPeerConnection({iceServers:cfg.iceServers});c.pendingICE=[];c.remoteICE=[];c.after=0;for(const track of stream.getTracks())c.pc.addTrack(track,stream);
 c.pc.ontrack=e=>{c.remote.srcObject=e.streams[0]||new MediaStream([e.track]);c.remote.play().catch(()=>{c.status.textContent='Appuie sur Lecture pour entendre ton contact.'});};
 c.pc.onicecandidate=e=>{if(!e.candidate)return;const candidate=e.candidate.toJSON();if(c.id)request('/calls/'+c.id+'/ice',{candidate}).catch(()=>{});else c.pendingICE.push(candidate);};
 c.pc.onconnectionstatechange=()=>{if(c.canceled)return;if(c.pc.connectionState==='connected')c.status.textContent='Appel en cours';if(c.pc.connectionState==='failed'){alertError(Error('Connexion impossible. Un relais TURN peut être nécessaire sur ce réseau.'));endCall(c);}};
}
async function flushICE(c){for(const candidate of c.pendingICE.splice(0))await request('/calls/'+c.id+'/ice',{candidate});}
async function pollCall(c){if(active!==c||c.canceled)return;try{const d=await request('/calls/'+c.id+'?after='+c.after);if(active!==c||c.canceled)return;if(d.call.state==='ended'){closeCall(c);window.toast?.('Appel terminé');return;}
 if(d.call.answer&&!c.pc.remoteDescription)await c.pc.setRemoteDescription({type:'answer',sdp:d.call.answer});
 for(const row of d.ice){c.after=Math.max(c.after,row.seq);c.remoteICE.push(JSON.parse(row.candidate));}
 if(c.pc.remoteDescription)for(const candidate of c.remoteICE.splice(0))await c.pc.addIceCandidate(candidate);
 c.errors=0;
 }catch(e){if(++c.errors>=4){alertError(Error('L’appel a été interrompu.'));endCall(c);return;}}
 if(active===c)c.poll=setTimeout(()=>pollCall(c),1500);
}
async function startCall(peer,video){if(active||recording)return;const c={video,errors:0,canceled:false};active=c;callUI(c);try{await setup(c);if(c.canceled)return;const offer=await c.pc.createOffer();await c.pc.setLocalDescription(offer);const d=await request('/calls',{to:peer,video,offer:offer.sdp});c.id=d.id;if(c.canceled){await request('/calls/'+c.id+'/end',{});return;}await flushICE(c);c.status.textContent='En attente de réponse…';pollCall(c);}catch(e){endCall(c);alertError(e);}}
async function incoming(){if(checking||active||recording||!token()||document.hidden)return;checking=true;try{await ready();const {call}=await request('/calls/incoming');if(!call||active)return;const c={id:call.id,video:!!call.video,errors:0,canceled:false};active=c;const d=sheet(call.video?'Appel vidéo entrant':'Appel entrant');c.dialog=d;
 const row=[...document.querySelectorAll('[data-one-friend-id]')].find(n=>n.dataset.oneFriendId===call.caller);d.append(el('p','',row?.dataset.onePeerName||'Un ami ONE t’appelle'));
 const refuse=btn('Refuser',()=>endCall(c));const accept=btn('Accepter',async()=>{accept.disabled=true;clearTimeout(c.poll);d.close();d.remove();callUI(c);try{await setup(c);if(c.canceled)return;const data=await request('/calls/'+c.id);if(data.call.state!=='ringing')throw Error('L’appel est terminé.');await c.pc.setRemoteDescription({type:'offer',sdp:data.call.offer});const answer=await c.pc.createAnswer();await c.pc.setLocalDescription(answer);await request('/calls/'+c.id+'/answer',{answer:answer.sdp});await flushICE(c);pollCall(c);}catch(e){endCall(c);alertError(e);}});d.append(refuse,accept);d.addEventListener('cancel',e=>{e.preventDefault();endCall(c)});
 const watch=async()=>{if(active!==c||!accept.isConnected)return;try{const r=await request('/calls/'+c.id);if(r.call.state==='ended'){closeCall(c);return;}}catch{}if(active===c&&accept.isConnected)c.poll=setTimeout(watch,2000)};c.poll=setTimeout(watch,2000);
 }catch{}finally{checking=false;}}
setInterval(refreshThread,2500);setInterval(incoming,4000);window.addEventListener('one-account-changed',()=>{config=null;if(active)endCall(active);recording?.dialog?.dispatchEvent(new Event('cancel',{cancelable:true}));releaseVoiceURLs()});window.addEventListener('pagehide',()=>{if(active){const c=active;c.stream?.getTracks().forEach(t=>t.stop());c.pc?.close();if(c.id)fetch(BASE+'/calls/'+c.id+'/end',{method:'POST',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:'{}',keepalive:true}).catch(()=>{})}recording?.stream?.getTracks().forEach(t=>t.stop());releaseVoiceURLs()});
})();
