import {prepareScene} from './three17-r46-warmup.js?v=lobby-fight-v64';
import {createGameScreen} from './one-lobby-r46-screen.js?v=lobby-fight-v64';

import * as THREE from './three.module.js?v=lobby-fight-v64';
import {buildRoom} from './one-lobby-r46-room.js?v=lobby-fight-v64';
import {createAvatar,animateAvatar,orientAvatarCamera} from './three17-r44-avatar.js?v=lobby-fight-v64';
import {createRenderBudget} from './three17-r46-render.js?v=lobby-fight-v64';

import {lobbyState,subscribeLobby,joinLobby,leaveLobby,startRound,setLobbyReady,updateLobbyPose,lobbyPose} from './three17-r46-coop.js?v=lobby-fight-v64';
let active=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function open(ctx={}){
 if(active){active.shell.focus();return;}
 const shell=document.createElement('section');shell.className='one3d-shell';shell.tabIndex=-1;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Lobby 3D partagé');
 shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small data-room></small></div><button type="button" data-close aria-label="Quitter le lobby 3D">Quitter</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">3:17 · 2–4 JOUEURS</div></div><button class="one3d-screen-button" data-screen-open>✦ Choisir un jeu</button><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Glisser pour regarder"></div><button class="one3d-run" type="button" data-run aria-pressed="false">COURIR</button><button class="one3d-fight-action" type="button" data-fight-action hidden>RAMASSER BATTE</button><div class="one3d-fight-hit" data-fight-hit hidden>TOUCHÉ !</div></div><footer class="one3d-bottom"><div class="one3d-session" data-collapsed="true"><button class="one3d-panel-toggle" type="button" data-panel-toggle aria-expanded="false" aria-label="Afficher les commandes du salon">+</button><span class="one3d-eyebrow">3:17 · FOUR</span><p data-status role="status">Connexion au salon…</p><div class="one3d-actions"><button type="button" data-ready disabled>Je suis prêt</button><button type="button" data-start disabled>Lancer 3:17</button></div><button type="button" data-reconnect>Réessayer la connexion</button></div></footer><p class="one3d-controls">ZQSD / WASD · flèches · glisser pour regarder · Maj courir · F bagarre</p>`;
 document.body.append(shell);shell.focus();
 const fightStyle=document.createElement('style');fightStyle.textContent=`
 .one3d-fight-action{position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(138px,calc(env(safe-area-inset-bottom) + 112px));z-index:18;min-width:154px;min-height:54px;padding:10px 18px;border:1px solid #ff91b5;border-radius:18px;background:linear-gradient(135deg,#6e274a,#a33d67);color:#fff7fb;font:800 13px/1 system-ui;letter-spacing:.04em;box-shadow:0 8px 22px #0006,inset 0 1px #fff3;touch-action:manipulation}
 .one3d-fight-action[data-mode="pickup"]{border-color:#cab2ff;background:linear-gradient(135deg,#45306c,#7652a8)}
 .one3d-fight-hit{position:absolute;inset:0;z-index:16;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle,#ff406522 0 18%,#ff204411 38%,transparent 72%);box-shadow:inset 0 0 50px #ff325a99;color:#fff;font:900 clamp(26px,7vw,58px)/1 system-ui;text-shadow:0 4px 18px #28000b}
 .one3d-fight-hit[hidden],.one3d-fight-action[hidden]{display:none!important}
 @media(max-height:520px){.one3d-fight-action{bottom:92px;right:14px;min-height:46px;min-width:138px;font-size:12px}}
 `;shell.append(fightStyle);
 const stage=shell.querySelector('.one3d-stage'),chips=shell.querySelector('.one3d-players');
 const fightAction=shell.querySelector('[data-fight-action]'),fightHit=shell.querySelector('[data-fight-hit]');
 const scene=new THREE.Scene();let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:!(matchMedia('(pointer:coarse)').matches||innerWidth<700),powerPreference:'high-performance',alpha:false});}
 catch(error){shell.querySelector('[data-status]').textContent='La 3D ne démarre pas dans ce navigateur. Ferme les autres jeux, puis réessaie.';shell.querySelector('[data-close]').onclick=()=>shell.remove();shell.querySelector('[data-reconnect]').onclick=()=>{shell.remove();open(ctx);};return;}
 let alive=true;const roomVisual=buildRoom(scene,renderer,()=>alive,disposeObject);
 const camera=new THREE.PerspectiveCamera(65,1,.05,60),position={x:0,z:4.8};let yaw=0,pitch=-.055,spawned=false;
 const colors=[0x9572bf,0x57a9b8,0xc78395,0x6eac90],avatars=new Map();
 const spawns=[[0,4.8],[-2.2,1.8],[0,2.0],[2.2,1.8]];
 const batWood=new THREE.MeshStandardMaterial({color:0xb77b45,roughness:.76,metalness:.03}),batGrip=new THREE.MeshStandardMaterial({color:0x252834,roughness:.82,metalness:.04});
 function makeBat(){
   const g=new THREE.Group(),part=(geo,material,y)=>{const m=new THREE.Mesh(geo,material);m.position.y=y;g.add(m);return m;};
   part(new THREE.CylinderGeometry(.065,.105,.78,12),batWood,.36);part(new THREE.CylinderGeometry(.04,.06,.5,10),batWood,-.25);part(new THREE.CylinderGeometry(.047,.047,.24,10),batGrip,-.57);part(new THREE.CylinderGeometry(.07,.05,.07,10),batGrip,-.72);return g;
 }
 const localBat=makeBat();localBat.visible=false;scene.add(localBat);
 const batOffset=new THREE.Vector3();
 function ensureAvatarBat(v){if(v.fightBat)return v.fightBat;const holder=new THREE.Group();holder.position.set(.02,-.52,-.08);holder.rotation.set(.2,0,-.34);v.arms[1].add(holder);const bat=makeBat();bat.scale.setScalar(.88);holder.add(bat);holder.visible=false;v.fightBat={holder,bat,lastSeq:null,swingAt:0};return v.fightBat;}
 const syncHeadCamera=(id,v)=>{
   const element=window.ONEPartyMedia?.videoForMember?.(id)||null;
   const ready=!!element&&element.readyState>=2&&element.videoWidth>0&&element.videoHeight>0;
   if(element===v.videoElement&&ready===v.videoReady)return;
   v.videoElement=element;v.videoReady=ready;
   if(v.videoTexture){v.videoTexture.dispose();v.videoTexture=null;}
   const material=v.cameraScreen?.material;
   if(!material)return;
   if(element&&!ready){material.map=null;material.color.set(0x11151d);material.needsUpdate=true;return;}
   if(element){
    try{
     element.muted=true;element.playsInline=true;element.play?.().catch?.(()=>{});
     v.videoTexture=new THREE.VideoTexture(element);
     v.videoTexture.colorSpace=THREE.SRGBColorSpace;
     v.videoTexture.minFilter=THREE.LinearFilter;
     v.videoTexture.magFilter=THREE.LinearFilter;
     material.map=v.videoTexture;material.color.set(0xffffff);
    }catch{material.map=null;material.color.set(0x11151d);}
   }else{material.map=null;material.color.set(0x11151d);}
   material.needsUpdate=true;
 };
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;stage.prepend(renderer.domElement);
 let state=lobbyState(),raf=0,last=performance.now(),lastSend=0,stopped=false,drag=null,look=null,lx=0,ly=0,statusKey='',assetsReady=false,sprint=false;
 const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;
 let resizePending=true,width=0,height=0,ratio=0;
 const budget=createRenderBudget({mobile,onChange:()=>resizePending=true});
 const loading=document.createElement('div');loading.className='one3d-loading';loading.innerHTML='<b>ONE</b><span>Préparation de votre salon…</span><progress aria-label="Chargement du salon"></progress>';stage.append(loading);
 let graphicsLost=false;
 const visualInfo=document.createElement('span');visualInfo.className='one3d-visual-status';visualInfo.textContent='Préparation du mobilier…';stage.append(visualInfo);
 roomVisual.ready.then(async result=>{
  if(stopped)return;loading.querySelector('span').textContent='Préparation de l’affichage…';
  await prepareScene(renderer,scene,camera,()=>alive&&!graphicsLost);if(stopped||graphicsLost)return;
  assetsReady=true;budget.reset();last=performance.now();loading.hidden=true;
  visualInfo.textContent=result.complete?'':'Certains meubles ne sont pas chargés. Rouvre le lobby pour réessayer.';visualInfo.hidden=result.complete;
 }).catch(()=>{if(stopped)return;loading.hidden=true;assetsReady=true;visualInfo.textContent='Affichage simplifié. Tu peux rester dans le salon ou réessayer.';});
 const keys=new Set(),stickInput={x:0,y:0},abort=new AbortController();
 const listen=(target,event,fn)=>target.addEventListener(event,fn,{signal:abort.signal});
 const gameScreen=createGameScreen({shell,lobbyState,setReady:setLobbyReady,startRound,reset(){keys.clear();stickInput.x=stickInput.y=0;look=null;}});
 const cameraRequest=window.ONEPartyMedia?.enable?.({camera:true});cameraRequest?.catch?.(()=>{});
 shell.querySelector('[data-screen-open]').onclick=()=>gameScreen.open();
 listen(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();graphicsLost=true;keys.clear();loading.hidden=false;loading.querySelector('span').textContent='Affichage interrompu. Ton salon reste connecté…';});
 listen(renderer.domElement,'webglcontextrestored',async()=>{if(stopped)return;graphicsLost=false;try{await prepareScene(renderer,scene,camera,()=>alive&&!graphicsLost);if(stopped)return;assetsReady=true;loading.hidden=true;resizePending=true;budget.reset();last=performance.now();}catch{loading.querySelector('span').textContent='Reviens au salon puis rouvre la 3D pour réessayer.';}});
 const inFightArea=(x,z)=>x>12.5&&x<22.2&&Math.abs(z)<5.6;
 const canMove=(x,z)=>{
   const inMain=Math.abs(x)<8.1&&Math.abs(z)<6.1&&!(Math.hypot(x,z)<1.6)&&!([-4.8,4.8].some(cx=>Math.abs(x-cx)<1.65&&z>-3.8&&z<-1.95));
   // Passage and room bounds deliberately overlap so there is no invisible strip at either doorway.
   const inLeftPass=x>-13.45&&x<-8.05&&Math.abs(z)<2.16;
   const inRightPass=x<13.45&&x>8.05&&Math.abs(z)<2.16;
   const inCasino=x>-22.2&&x<-12.45&&Math.abs(z)<5.6&&!(x>-19.8&&x<-15.8&&z>-1.7&&z<1.7);
   const inFight=inFightArea(x,z);
   return inMain||inLeftPass||inRightPass||inCasino||inFight;
 };
 let heldBat=false,swingSeq=0,swingStarted=0,lastHitAt=0,hitUntil=0,lastFightPointerAt=0;
 const nearestBatDistance=()=>Math.min(...(roomVisual.fightBatSpots||[]).map(s=>Math.hypot(position.x-s.x,position.z-s.z)),99);
 const setHeldBat=value=>{heldBat=!!value;localBat.visible=heldBat;if(!heldBat)swingStarted=0;};
 // Once a bat is picked up it stays with the player throughout the whole lobby.
 const swingBat=()=>{if(!heldBat||performance.now()-swingStarted<300)return;swingSeq++;swingStarted=performance.now();updateLobbyPose({...position,yaw,pitch,bat:true,swingSeq});};
 const useFightAction=()=>{if(heldBat){swingBat();return;}if(inFightArea(position.x,position.z)&&nearestBatDistance()<1.55){setHeldBat(true);updateLobbyPose({...position,yaw,pitch,bat:true,swingSeq});}};
 // Fire on pointer-down so a second finger can hit while the joystick finger keeps moving.
 fightAction.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();lastFightPointerAt=performance.now();useFightAction();});
 fightAction.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();if(performance.now()-lastFightPointerAt>450)useFightAction();});
 function drawStatus(next){
   state=next;const key=JSON.stringify([next.room,next.self,next.host,next.notice,next.joined,next.ready,next.canStart,next.connecting,next.players]);if(key===statusKey)return;statusKey=key;
   shell.querySelector('[data-room]').textContent=next.room+' · '+next.players.length+'/4 · R64';
   shell.querySelector('[data-status]').textContent=next.notice;
   const readyButton=shell.querySelector('button[data-ready]'),start=shell.querySelector('[data-start]');
   readyButton.disabled=!next.joined||!next.players.some(p=>p.id===next.self);readyButton.textContent=next.ready?'✓ Prêt':'Je suis prêt';readyButton.setAttribute('aria-pressed',String(next.ready));
   start.hidden=!next.isHost;start.disabled=!next.canStart;
   shell.querySelector('[data-reconnect]').disabled=next.connecting;
   chips.replaceChildren();
   next.players.forEach((p,i)=>{
     const chip=document.createElement('span');chip.className='one3d-player';chip.dataset.ready=String(p.ready);chip.textContent=p.name+(p.id===next.self?' · toi':'')+(p.id===next.host?' · hôte':'')+(p.ready?' ✓':'');chips.append(chip);
     if(p.id===next.self){if(!spawned){position.x=spawns[i][0];position.z=spawns[i][1];spawned=true;}return;}
     if(!avatars.has(p.id)){const v=createAvatar(scene,p.name,colors[i]);v.group.position.set(spawns[i][0],0,spawns[i][1]);v.glow.visible=false;avatars.set(p.id,v);}
   });
   for(const [id,v] of avatars)if(!next.players.some(p=>p.id===id)){scene.remove(v.group);disposeObject(v.group);avatars.delete(id);}
 }
 const off=subscribeLobby(drawStatus);
 function resize(){resizePending=true;}
 function applyResize(){if(!resizePending)return;const w=stage.clientWidth,h=stage.clientHeight;if(w<2||h<2)return;const r=Math.min(Math.min(devicePixelRatio||1,mobile?1:1.2)*budget.scale,Math.sqrt((mobile?620000:1150000)*budget.scale*budget.scale/(w*h)));if(w!==width||h!==height||r!==ratio){renderer.setDrawingBufferSize(w,h,r);camera.aspect=w/h;camera.updateProjectionMatrix();width=w;height=h;ratio=r;}resizePending=false;}
 const ro=new ResizeObserver(resize);ro.observe(stage);resize();
 function tryRemoteHit(raw,v,t){
   const fight=ensureAvatarBat(v),seq=Number.isSafeInteger(raw.swingSeq)?raw.swingSeq:0;fight.holder.visible=raw.bat===true;
   if(fight.lastSeq===null){fight.lastSeq=seq;return;}
   if(seq<=fight.lastSeq)return;fight.lastSeq=seq;fight.swingAt=t;
   if(!fight.holder.visible||t-lastHitAt<520)return;
   const dx=position.x-raw.x,dz=position.z-raw.z,dist=Math.hypot(dx,dz);if(dist<.15||dist>2.05)return;
   const fx=-Math.sin(raw.yaw||0),fz=-Math.cos(raw.yaw||0),dot=(dx/dist)*fx+(dz/dist)*fz;if(dot<.08)return;
   const push=.82,nx=position.x+dx/dist*push,nz=position.z+dz/dist*push;if(canMove(nx,position.z))position.x=nx;if(canMove(position.x,nz))position.z=nz;
   lastHitAt=t;hitUntil=t+280;fightHit.hidden=false;
 }
 function frame(t){
   if(stopped)return;raf=requestAnimationFrame(frame);if(document.hidden||!assetsReady||graphicsLost||gameScreen.opened){last=t;return;}if(!budget.shouldRender(t,resizePending))return;const began=performance.now();applyResize();
   const dt=Math.min((t-last)/1000,.05);last=t;
   let forward=(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stickInput.y;
   let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')?1:0)+stickInput.x;
   const scale=Math.max(1,Math.hypot(forward,side));forward/=scale;side/=scale;
    const speed=sprint?4.2:2.4;
    const x=position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,z=position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
   if(canMove(x,position.z))position.x=x;if(canMove(position.x,z))position.z=z;
   const fightHere=inFightArea(position.x,position.z);
   const nearBat=!heldBat&&fightHere&&nearestBatDistance()<1.55;fightAction.hidden=!heldBat&&!nearBat;fightAction.dataset.mode=heldBat?'swing':'pickup';fightAction.textContent=heldBat?'FRAPPER':'RAMASSER BATTE';
   if(t-lastSend>100){updateLobbyPose({...position,yaw,pitch,bat:heldBat,swingSeq});lastSend=t;}
   for(const [id,v] of avatars){syncHeadCamera(id,v);const p=lobbyPose(id);if(!p)continue;tryRemoteHit(p,v,t);v.track.push(p,t);const pose=v.track.at(t);if(pose){animateAvatar(v,pose,dt);orientAvatarCamera(v,{x:position.x,y:1.65,z:position.z});const fight=ensureAvatarBat(v);if(fight.swingAt){const k=Math.min(1,(t-fight.swingAt)/340),arc=Math.sin(k*Math.PI);fight.holder.rotation.x=.2-arc*1.25;fight.holder.rotation.z=-.34+arc*.88;if(k>=1){fight.swingAt=0;fight.holder.rotation.set(.2,0,-.34);}}}}
   camera.position.set(position.x,1.65,position.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
   if(localBat.visible){const k=swingStarted?Math.min(1,(t-swingStarted)/340):1,arc=swingStarted&&k<1?Math.sin(k*Math.PI):0;if(k>=1)swingStarted=0;batOffset.set(.48,-.42,-.78).applyQuaternion(camera.quaternion);localBat.position.copy(camera.position).add(batOffset);localBat.quaternion.copy(camera.quaternion);localBat.rotateZ(-.5+arc*1.45);localBat.rotateX(.32-arc*.52);}
   if(hitUntil&&t>=hitUntil){hitUntil=0;fightHit.hidden=true;}
   renderer.render(scene,camera);if(assetsReady)budget.record(t,performance.now()-began);
 }
 const stick=shell.querySelector('.one3d-stick'),knob=shell.querySelector('.one3d-knob');
 function stickMove(e){const b=stick.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,d=Math.hypot(dx,dy)||1,m=Math.min(32,d);stickInput.x=dx/d*m/32;stickInput.y=dy/d*m/32;knob.style.transform=`translate(${dx/d*m}px,${dy/d*m}px)`;}
 listen(stick,'pointerdown',e=>{drag=e.pointerId;stick.setPointerCapture(drag);stickMove(e);});listen(stick,'pointermove',e=>{if(drag===e.pointerId)stickMove(e);});
 function stopStick(){drag=null;stickInput.x=stickInput.y=0;knob.style.transform='';}
 listen(stick,'pointerup',stopStick);listen(stick,'pointercancel',stopStick);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let touchX=0,touchY=0,moved=false;
 function hitScreen(x,y){const b=renderer.domElement.getBoundingClientRect();pointer.set((x-b.left)/b.width*2-1,-(y-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);if(ray.intersectObject(roomVisual.screen).length)gameScreen.open();}
 const zone=shell.querySelector('.one3d-look');zone.style.width='100%';listen(zone,'pointerdown',e=>{look=e.pointerId;touchX=lx=e.clientX;touchY=ly=e.clientY;moved=false;zone.setPointerCapture(look);});listen(zone,'pointermove',e=>{if(look!==e.pointerId)return;if(Math.hypot(e.clientX-touchX,e.clientY-touchY)>7)moved=true;if(!moved)return;yaw=Math.atan2(Math.sin(yaw-(e.clientX-lx)*.006),Math.cos(yaw-(e.clientX-lx)*.006));pitch=clamp(pitch-(e.clientY-ly)*.004,-.75,.65);lx=e.clientX;ly=e.clientY;});listen(zone,'pointerup',e=>{if(look===e.pointerId&&!moved)hitScreen(e.clientX,e.clientY);look=null;});listen(zone,'pointercancel',()=>look=null);
  const sessionPanel=shell.querySelector('.one3d-session'),panelToggle=shell.querySelector('[data-panel-toggle]');
  const setPanelOpen=open=>{sessionPanel.dataset.collapsed=String(!open);panelToggle.setAttribute('aria-expanded',String(open));panelToggle.setAttribute('aria-label',open?'Réduire les commandes du salon':'Afficher les commandes du salon');panelToggle.textContent=open?'−':'+';};
  listen(panelToggle,'click',()=>setPanelOpen(sessionPanel.dataset.collapsed==='true'));
  const runButton=shell.querySelector('[data-run]'),sprintToggle=matchMedia('(pointer:coarse)').matches||innerWidth<700;
  const setSprint=value=>{sprint=!!value;if(runButton){runButton.setAttribute('aria-pressed',String(sprint));runButton.setAttribute('aria-label',sprint?'Arrêter de courir':'Courir');runButton.textContent=sprint?'COURSE…':'COURIR';}};
  listen(runButton,'pointerdown',e=>{e.preventDefault();if(sprintToggle){setSprint(!sprint);return;}runButton.setPointerCapture?.(e.pointerId);});
  listen(runButton,'pointerup',()=>{if(!sprintToggle)setSprint(false);});
  listen(runButton,'pointercancel',()=>{if(!sprintToggle)setSprint(false);});
  listen(runButton,'lostpointercapture',()=>{if(!sprintToggle)setSprint(false);});
  const movement=['KeyW','KeyA','KeyS','KeyD','KeyZ','KeyQ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  listen(window,'keydown',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();setSprint(true);}else if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);}else if(e.code==='KeyF'&&!fightAction.hidden){e.preventDefault();useFightAction();}else if(e.code==='KeyE'){e.preventDefault();gameScreen.open();}else if(e.code==='Escape')close();});listen(window,'keyup',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight')setSprint(false);else keys.delete(e.code);});listen(window,'blur',()=>{keys.clear();stopStick();look=null;setSprint(false);});listen(document,'visibilitychange',()=>{keys.clear();stopStick();setSprint(false);last=performance.now();budget.reset();});
 shell.querySelector('[data-close]').onclick=()=>close();shell.querySelector('button[data-ready]').onclick=setLobbyReady;shell.querySelector('[data-start]').onclick=startRound;shell.querySelector('[data-reconnect]').onclick=()=>joinLobby(ctx,true);
 active={shell,renderer,scene,ro,stop(){stopped=true;alive=false;gameScreen.dispose();roomVisual.dispose();for(const v of avatars.values()){v.videoTexture?.dispose?.();v.videoTexture=null;}cancelAnimationFrame(raf);abort.abort();off();},inspect:()=>({position:{...position},yaw,avatars:[...avatars].map(([id,v])=>({id,x:v.group.position.x,z:v.group.position.z})),state:lobbyState(),graphics:{...budget.inspect(),width,height,ratio,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,assetsReady,assets:scene.userData.r45?.assets}})};
 raf=requestAnimationFrame(frame);joinLobby(ctx);
}
function disposeObject(object){
 const geometries=new Set(),materials=new Set(),textures=new Set();object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m);});
 materials.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture)textures.add(v);});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
function close(options={}){
 if(!active)return;const a=active;active=null;a.stop();a.ro.disconnect();disposeObject(a.scene);a.renderer.dispose();a.renderer.forceContextLoss();a.scene.clear();a.shell.remove();
 if(!options.launch){leaveLobby();window.oneOpenSalon?.();}
}
window.ONELobby3D={open,close,...(window.__ONE317_TEST__===true?{inspect:()=>active?.inspect()}: {})};
window.addEventListener('pagehide',()=>close({launch:true}));
export {open,close};



