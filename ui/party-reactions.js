(()=>{
 let current=null,pending=false,lastEquipment='',lastSent=0,consent=false,detector=null,lastSignal=0,lastGame=null;const forms=new Map();
 const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const action=(text,fn)=>{const b=make('button',text);b.type='button';b.onclick=fn;return b;};
 const requirementsText=r=>r.camera&&r.mic?'caméra et micro':r.camera?'caméra':'micro';
 function halt(){if(detector){detector.source?.disconnect();detector.context?.close().catch(()=>{});detector=null;}}
 function clear(){current=null;lastEquipment='';lastSent=0;consent=false;lastGame=null;forms.clear();halt();document.getElementById('oneReactionMedia')?.remove();}
 window.addEventListener('one-account-changed',clear);window.addEventListener('pagehide',clear);
 let roomId;window.addEventListener('one-party-state',e=>{if(roomId!==e.detail?.id){roomId=e.detail?.id;clear();}});
 window.addEventListener('one-space-open',e=>{if(e.detail!=='party')clear();});
 window.addEventListener('one-game-rendered',()=>{if(!document.querySelector('.pc-game'))clear();else if(!document.querySelector('.pc-horror,.pc-laugh')){document.getElementById('oneReactionMedia')?.remove();halt();}});
 window.renderONEEquipment=ctx=>{
  current=ctx;const {g,arena,active}=ctx;if(lastGame!==g.id){lastGame=g.id;lastSent=0;consent=false;halt();}if(!g.requirements||!active){halt();return;}
  const box=make('section');box.className='pc-equipment';const r=g.requirements;
  box.append(make('b',requirementsText(r)+' obligatoire'+(r.camera&&r.mic?'s':'')));
  const missing=(g.equipment||[]).filter(p=>!p.ready).map(p=>g.players.find(x=>x.accountId===p.id)?.name).filter(Boolean);
  box.append(make('p',missing.length?'En attente : '+missing.join(', '):'Tout le monde est équipé.'));
  const settings=make('details');settings.open=missing.length>0;settings.append(make('summary','Réglages des équipements'));box.append(settings);
  const reactive=['horror','laugh'].includes(g.kind),status=make('p');status.setAttribute('role','status');
  const enable=action('Activer '+requirementsText(r),async()=>{
   enable.disabled=true;try{if(!window.ONEPartyMedia)throw Error('Recharge la page pour accéder au vocal.');await window.ONEPartyMedia.enable(r);const s=window.ONEPartyMedia.status();if((r.camera&&!s.camera)||(r.mic&&!s.mic))throw Error('Autorise '+requirementsText(r)+' dans ton navigateur, puis réessaie.');status.textContent='Équipement activé.';lastSent=0;await tick();}catch(e){status.textContent=e.message;}finally{enable.disabled=false;}
  });settings.append(enable,status);
  if(reactive){box.append(make('small','Caméra facultative pour les tests.'));const detect=action('Activer la caméra et l’aide à la détection',async()=>{detect.disabled=true;try{await window.ONEPartyMedia.enable({camera:true,mic:true});const s=window.ONEPartyMedia.status();if(!s.camera||!s.mic)throw Error('Caméra et micro nécessaires pour cette aide facultative.');consent=true;status.textContent='Aide activée : mouvements brusques et sons forts.';lastSent=0;await tick();}catch(e){status.textContent=e.message;}finally{detect.disabled=false;}});settings.append(detect);}
  if(reactive){settings.append(make('small','Détection indicative sur ton appareil : mouvements brusques et sons forts, pas une reconnaissance fiable du rire. Aucun enregistrement. Le créateur confirme les réactions. Un casque évite de capter le son de la vidéo.'));const off=action('Désactiver l’aide à la détection',()=>{consent=false;halt();status.textContent='Aide désactivée. Tu peux toujours déclarer ta réaction.';});settings.append(off);}
  arena.append(box);
 };
 window.renderONEReaction=({g,arena,host,active,busy,play,button,countDown,nextButton})=>{
  const ready=(g.equipment||[]).length===g.players.length&&g.equipment.every(p=>p.ready);
  if(g.phase==='ready'){
   arena.append(make('h4','Choisissez votre vidéo'));
   const choices=make('div');choices.className='pc-video-choices';
   for(const clip of g.clips||[]){const b=action(clip.title,()=>play('video',{clip:clip.id}));b.append(make('small',clip.author));b.setAttribute('aria-pressed',String(g.clip?.id===clip.id));b.disabled=!host||busy||!active;choices.append(b);}arena.append(choices);
   if(host){const formKey=g.id+':'+g.round,form=forms.get(formKey)||{};forms.set(formKey,form);const custom=make('details');custom.open=!!form.open;custom.ontoggle=()=>form.open=custom.open;custom.append(make('summary','Utiliser un autre lien YouTube'));const url=make('input');url.type='url';url.value=form.url||'';url.dataset.pcField=formKey+':reactionUrl';url.oninput=()=>form.url=url.value;url.placeholder='https://www.youtube.com/watch?v=…';url.setAttribute('aria-label','Lien vidéo');const seconds=make('input');seconds.type='number';seconds.min=30;seconds.max=600;seconds.value=form.seconds||'180';seconds.dataset.pcField=formKey+':reactionSeconds';seconds.oninput=()=>form.seconds=seconds.value;seconds.setAttribute('aria-label','Durée de la manche en secondes');const label=make('label','Durée de la manche (30 à 600 secondes)');label.append(seconds);custom.append(url,label,action('Choisir ce lien',()=>play('video',{url:url.value,seconds:seconds.value})));arena.append(custom,button('Lancer la manche','begin',{},ready));}
   arena.append(make('p','Vidéo : '+(g.clip?.title||'À choisir')+' · Manche de '+(g.clip?.seconds||180)+' secondes.'));
  }
  if(['watch','paused'].includes(g.phase)){
   if(g.phase==='watch')arena.append(countDown(g.deadline));
   else {arena.append(make('p','Pause : réactivez les équipements manquants et mettez vos lecteurs en pause.'));if(host)arena.append(button('Reprendre la manche','begin',{},ready));}
   arena.append(button(g.kind==='horror'?'J’ai sursauté ou crié':'J’ai ri','out',{target:g.players.find(p=>p.isYou).accountId}));
   const alerts=make('div');alerts.className='pc-reaction-alerts';alerts.setAttribute('aria-live','polite');
   for(const id of [...new Set((g.reactions||[]).map(r=>r.id))]){const signal=g.reactions.filter(r=>r.id===id).at(-1),p=g.players.find(p=>p.accountId===id);const line=make('article');line.append(make('p',(p?.name||'Joueur')+' · '+(signal.kind==='motion'?'mouvement brusque':'son fort')+' repéré — à vérifier'));if(host)line.append(button('Confirmer la réaction de '+p.name,'out',{target:id}),button('Ignorer le signal de '+p.name,'dismiss-reaction',{target:id}));alerts.append(line);}arena.append(alerts);
   if(host){const moderation=make('details');moderation.append(make('summary','Confirmer manuellement qui a craqué'));for(const p of g.players)moderation.append(button(p.name,'out',{target:p.accountId}));arena.append(moderation);if(g.phase==='watch')arena.append(button('Temps écoulé · personne n’a craqué','draw-round'));}
  }
  if(g.phase==='result')nextButton();
  let media=document.getElementById('oneReactionMedia');
  if(!active||!['watch','paused'].includes(g.phase)){media?.remove();return;}
  if(!media){media=make('section');media.id='oneReactionMedia';document.getElementById('onePartyGame').append(media);}
  const key=g.id+':'+g.round+':'+g.clip.id;
  if(media.dataset.key!==key){const frame=make('iframe');frame.title=g.clip.title;frame.src='https://www.youtube-nocookie.com/embed/'+g.clip.id+'?playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin);frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';const link=make('a','Ouvrir la vidéo sur YouTube');link.href='https://www.youtube.com/watch?v='+g.clip.id;link.target='_blank';link.rel='noopener noreferrer';media.replaceChildren(make('h3',g.clip.title),frame,make('p',g.clip.author),make('p','Chacun lance la lecture sur son appareil au signal du créateur. La lecture n’est pas synchronisée automatiquement. Si YouTube bloque la vidéo, utilisez le lien ci-dessous.'),link);media.dataset.key=key;}
  if(g.phase==='paused')media.querySelector('iframe')?.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'https://www.youtube-nocookie.com');
 };
 async function send(action,params){if(!current||pending||current.busy)return false;pending=true;const c=current;try{return await c.play(action,params);}finally{pending=false;}}
 async function tick(){
  const c=current;if(!c||!c.active||!c.g.requirements||!document.querySelector('.pc-game')){halt();return;}
  const state=window.ONEPartyMedia?.status()||{camera:false,mic:false};const stamp=c.g.id+':'+Number(state.camera)+Number(state.mic);
  if(!pending&&!c.busy&&(stamp!==lastEquipment||Date.now()-lastSent>15000)){const ok=await send('equipment',{camera:state.camera?'1':'0',mic:state.mic?'1':'0'});if(ok){lastEquipment=stamp;lastSent=Date.now();}return;}
  if(!document.hidden&&consent&&['horror','laugh'].includes(c.g.kind)&&c.g.phase==='watch'&&state.camera&&state.mic){if(!detector)startDetector();sample();}else halt();
 }
 function startDetector(){
  const video=window.ONEPartyMedia?.localVideo(),track=window.ONEPartyMedia?.audioTrack();if(!video||!track)return;
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;const d={video,canvas,ctx:canvas.getContext('2d',{willReadFrequently:true}),previous:null,started:Date.now(),noise:0.02};
  try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){d.context=new AC();d.source=d.context.createMediaStreamSource(new MediaStream([track]));d.analyser=d.context.createAnalyser();d.analyser.fftSize=1024;d.source.connect(d.analyser);d.audio=new Float32Array(1024);d.context.resume().catch(()=>{});}}catch{}
  detector=d;
 }
 function sample(){
  const d=detector;if(!d)return;let motion=false,sound=false;
  if(d.video.readyState>=2){try{d.ctx.drawImage(d.video,0,0,64,48);const data=d.ctx.getImageData(0,0,64,48).data,gray=new Float32Array(3072);let mean=0;for(let i=0;i<gray.length;i++){gray[i]=(data[i*4]+data[i*4+1]+data[i*4+2])/3;mean+=gray[i];}mean/=gray.length;let changed=0;for(let i=0;i<gray.length;i++){gray[i]-=mean;if(d.previous&&Math.abs(gray[i]-d.previous[i])>28)changed++;}motion=changed/gray.length>0.22;d.previous=gray;}catch{d.previous=null;}}
  if(d.analyser&&d.context.state==='running'){d.analyser.getFloatTimeDomainData(d.audio);let sum=0;for(const x of d.audio)sum+=x*x;const rms=Math.sqrt(sum/d.audio.length);sound=rms>Math.max(0.14,d.noise*3.5);d.noise=d.noise*0.97+Math.min(rms,0.1)*0.03;}
  if(Date.now()-d.started>3500&&Date.now()-lastSignal>14000&&(motion||sound)&&!pending){lastSignal=Date.now();send('reaction',{signal:motion?'motion':'sound'});}
 }
 setInterval(tick,250);
})();
