/* Local text compositor: the text is burned into the exported pixels, not stored as display metadata. */
(() => {
'use strict';
const drafts=new WeakMap();
window.oneEditCapture = file => new Promise(resolve => {
 const isVideo=file.type.startsWith('video/'),d=document.createElement('dialog');d.className='oneTextEditor';d.setAttribute('aria-label','Texte sur le média');
 d.innerHTML='<header><button data-cancel>Annuler</button><h2>Texte</h2><button data-apply>Appliquer</button></header><div class="oneTextStage"><canvas aria-label="Aperçu : déplace le texte avec le doigt"></canvas></div><div class="oneTextTools"><label>Ton message<textarea maxlength="180" rows="2" placeholder="Écris sur ton moment…"></textarea></label><div class="oneTextOptions"><label>Couleur<input data-color type="color" value="#ffffff"></label><label>Taille<input data-size type="range" min="3" max="10" step="0.5" value="5"></label><button data-play>Lire la vidéo</button></div><p role="status">Déplace le texte avec le doigt sur l’image.</p></div>';
 const $=s=>d.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d'),media=document.createElement(isVideo?'video':'img'),url=URL.createObjectURL(file);
 const draft=drafts.get(file)||{text:'',color:'#ffffff',size:5,x:.5,y:.45};let state={...draft},raf,stream,recorder,audio,source,destination,aborted=false,finished=false,exporting=false,loaded=false,abortExport;
 const say=s=>$('[role=status]').textContent=s;
 $('textarea').value=state.text;$('[data-color]').value=state.color;$('[data-size]').value=state.size;$('[data-play]').hidden=!isVideo;$('[data-apply]').disabled=true;
 if(isVideo){media.playsInline=true;media.preload='auto';media.muted=true;media.className='oneTextSource';d.append(media);}
 function cleanup(){aborted=true;abortExport?.(Error('Préparation annulée.'));cancelAnimationFrame(raf);media.pause?.();if(recorder?.state==='recording'){recorder.onstop=null;recorder.stop()}stream?.getTracks().forEach(t=>t.stop());source?.disconnect();audio?.close().catch(()=>{});media.removeAttribute('src');media.load?.();URL.revokeObjectURL(url);document.removeEventListener('visibilitychange',hidden);d.remove();}
 function finish(result){if(finished)return;finished=true;drafts.set(file,{...state});d.close();cleanup();resolve(result);}
 function hidden(){if(exporting&&document.hidden)abortExport?.(Error('La préparation a été interrompue. Garde ONE ouvert puis réessaie.'));}
 document.addEventListener('visibilitychange',hidden);
 d.addEventListener('cancel',e=>{e.preventDefault();finish(null)});$('[data-cancel]').onclick=()=>finish(null);
 function lines(text,max){const result=[];for(const paragraph of text.split('\n')){let line='';for(const char of paragraph){if(line&&ctx.measureText(line+char).width>max){result.push(line);line=char}else line+=char}result.push(line)}return result;}
 function draw(){
  if(!loaded)return;const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.drawImage(media,0,0,w,h);
  if(!state.text.trim())return;
  const size=w*Number(state.size)/100;ctx.font='700 '+size+'px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  const rows=lines(state.text,w*.88),lineHeight=size*1.25,width=Math.max(...rows.map(t=>ctx.measureText(t).width));
  const height=rows.length*lineHeight,halfX=(width/2+size*.3)/w,halfY=(height/2+size*.3)/h;
  const x=Math.max(halfX,Math.min(1-halfX,state.x))*w,y=Math.max(halfY,Math.min(1-halfY,state.y))*h;
  ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(x-width/2-size*.3,y-height/2-size*.18,width+size*.6,height+size*.36);
  ctx.fillStyle=state.color;for(let i=0;i<rows.length;i++)ctx.fillText(rows[i],x,y+(i-(rows.length-1)/2)*lineHeight);
 }
 function loop(){if(aborted)return;draw();raf=requestAnimationFrame(loop)}
 function ready(){if(aborted||loaded)return;const w=isVideo?media.videoWidth:media.naturalWidth,h=isVideo?media.videoHeight:media.naturalHeight;if(!w||!h)return;const scale=Math.min(1,(isVideo?1920:2560)/Math.max(w,h));canvas.width=Math.max(2,Math.round(w*scale/2)*2);canvas.height=Math.max(2,Math.round(h*scale/2)*2);loaded=true;$('[data-apply]').disabled=false;loop();}
 media.addEventListener(isVideo?'loadeddata':'load',ready);media.addEventListener('error',()=>say('Ce média ne peut pas être lu ici. Annule pour garder l’original.'));media.src=url;
 const read=()=>{state.text=$('textarea').value;state.color=$('[data-color]').value;state.size=Number($('[data-size]').value);draw()};for(const i of d.querySelectorAll('textarea,input'))i.oninput=read;
 let drag=false;function position(e){const r=canvas.getBoundingClientRect();state.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));state.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));draw()}
 canvas.onpointerdown=e=>{if(exporting)return;drag=true;canvas.setPointerCapture(e.pointerId);position(e)};canvas.onpointermove=e=>{if(drag&&!exporting)position(e)};canvas.onpointerup=canvas.onpointercancel=()=>drag=false;
 $('[data-play]').onclick=async()=>{if(media.paused){if(media.ended)media.currentTime=0;try{await media.play();$('[data-play]').textContent='Pause'}catch{say('Lecture indisponible.')}}else{media.pause();$('[data-play]').textContent='Lire la vidéo'}};
 media.onended=()=>{$('[data-play]').textContent='Lire la vidéo'};
 async function exportVideo(){
  if(!canvas.captureStream||!window.MediaRecorder||!(window.AudioContext||window.webkitAudioContext))throw Error('L’ajout de texte vidéo est indisponible dans ce navigateur. L’original est conservé.');
  if(Number.isFinite(media.duration)&&media.duration>120)throw Error('Choisis une vidéo de moins de 2 minutes pour ajouter du texte.');
  media.pause();
  if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();source=audio.createMediaElementSource(media);destination=audio.createMediaStreamDestination();source.connect(destination)}
  await audio.resume();if(aborted)throw Error('Préparation annulée.');media.muted=false;media.volume=1; // Audio goes to the exported file only, not the speakers.
  if(media.currentTime!==0)await new Promise((res,rej)=>{const timeout=setTimeout(()=>{media.removeEventListener('seeked',done);rej(Error('Impossible de revenir au début de la vidéo.'))},5000);function done(){clearTimeout(timeout);res()}media.addEventListener('seeked',done,{once:true});media.currentTime=0});
  if(aborted)throw Error('Préparation annulée.');draw();stream=canvas.captureStream(30);destination.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
  const mime=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime)throw Error('Aucun format vidéo compatible pour intégrer le texte.');
  const r=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4500000,audioBitsPerSecond:128000});recorder=r;
  return await new Promise((res,rej)=>{
   const parts=[];let bytes=0,settled=false;const started=Date.now();
   const complete=error=>{if(settled)return;settled=true;clearInterval(progress);clearTimeout(timeout);media.removeEventListener('ended',ended);media.pause();abortExport=null;if(r.state==='recording'){r.onstop=null;r.stop()}stream.getVideoTracks().forEach(t=>t.stop());if(error)rej(error);else{const blob=new Blob(parts,{type:r.mimeType});if(!blob.size)rej(Error('La vidéo exportée est vide. Réessaie.'));else res(new File([blob],'ONE-texte-'+Date.now()+(r.mimeType.includes('mp4')?'.mp4':'.webm'),{type:r.mimeType}))}};
   abortExport=complete;
   const progress=setInterval(()=>{const percent=Number.isFinite(media.duration)?Math.min(99,Math.round(media.currentTime/media.duration*100))+' %':Math.floor((Date.now()-started)/1000)+' s';say('Intégration du texte · '+percent+' · garde ONE ouvert')},300);
   const timeout=setTimeout(()=>complete(Error('Préparation trop longue. Réessaie avec une vidéo plus courte.')),135000);
   const ended=()=>{draw();if(r.state==='recording')r.stop()};media.addEventListener('ended',ended,{once:true});
   r.ondataavailable=e=>{if(e.data.size){parts.push(e.data);bytes+=e.data.size;if(bytes>39*1024*1024)complete(Error('La vidéo dépasse 40 Mo après modification. Choisis une vidéo plus courte.'))}};
   r.onerror=()=>complete(Error('L’intégration du texte a échoué. L’original est conservé.'));
   r.onstop=()=>complete();r.start(250);media.play().catch(()=>complete(Error('Impossible de lire la vidéo pour intégrer le texte.')));
  });
 }
 $('[data-apply]').onclick=async()=>{
  if(exporting||!loaded)return;read();if(!state.text.trim()){finish(file);return}exporting=true;
  for(const control of d.querySelectorAll('input,textarea,button:not([data-cancel])'))control.disabled=true;
  try{let result;if(isVideo)result=await exportVideo();else{draw();const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.95));if(!blob)throw Error('Impossible de créer la photo.');result=new File([blob],'ONE-texte-'+Date.now()+'.jpg',{type:'image/jpeg'})}if(!aborted)finish(result)}catch(e){if(!aborted)say(e.message)}finally{if(!aborted){exporting=false;for(const control of d.querySelectorAll('input,textarea,button'))control.disabled=false}}
 };
 document.body.append(d);d.showModal();
});
})();
