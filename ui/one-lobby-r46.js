import {prepareScene} from './three17-r46-warmup.js';
import {createGameScreen} from './one-lobby-r46-screen.js';

import * as THREE from './three.module.js';
import {buildRoom} from './one-lobby-r46-room.js';
import {createAvatar,animateAvatar} from './three17-r44-avatar.js';
import {createRenderBudget} from './three17-r46-render.js';

import {lobbyState,subscribeLobby,joinLobby,leaveLobby,startRound,setLobbyReady,updateLobbyPose,lobbyPose} from './three17-r46-coop.js';
let active=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function open(ctx={}){
 if(active){active.shell.focus();return;}
 const shell=document.createElement('section');shell.className='one3d-shell';shell.tabIndex=-1;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Lobby 3D partagé');
 shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small data-room></small></div><button type="button" data-close aria-label="Quitter le lobby 3D">Quitter</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">3:17 · 2–4 JOUEURS</div></div><button class="one3d-screen-button" data-screen-open>✦ Choisir un jeu</button><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Glisser pour regarder"></div><button class="one3d-run" type="button" data-run aria-pressed="false">COURIR</button></div><footer class="one3d-bottom"><div class="one3d-session" data-collapsed="true"><button class="one3d-panel-toggle" type="button" data-panel-toggle aria-expanded="false" aria-label="Afficher les commandes du salon">+</button><span class="one3d-eyebrow">3:17 · FOUR</span><p data-status role="status">Connexion au salon…</p><div class="one3d-actions"><button type="button" data-ready disabled>Je suis prêt</button><button type="button" data-start disabled>Lancer 3:17</button></div><button type="button" data-reconnect>Réessayer la connexion</button></div></footer><p class="one3d-controls">ZQSD / WASD · flèches · glisser pour regarder · Maj pour courir</p>`;
 document.body.append(shell);shell.focus();
 const stage=shell.querySelector('.one3d-stage'),chips=shell.querySelector('.one3d-players');
 const scene=new THREE.Scene();let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:!(matchMedia('(pointer:coarse)').matches||innerWidth<700),powerPreference:'high-performance',alpha:false});}
 catch(error){shell.querySelector('[data-status]').textContent='La 3D ne démarre pas dans ce navigateur. Ferme les autres jeux, puis réessaie.';shell.querySelector('[data-close]').onclick=()=>shell.remove();shell.querySelector('[data-reconnect]').onclick=()=>{shell.remove();open(ctx);};return;}
 let alive=true;const roomVisual=buildRoom(scene,renderer,()=>alive,disposeObject);
 const camera=new THREE.PerspectiveCamera(65,1,.05,60),position={x:0,z:4.8};let yaw=0,pitch=-.055,spawned=false;
 const colors=[0x9572bf,0x57a9b8,0xc78395,0x6eac90],avatars=new Map();
 const spawns=[[0,4.8],[-2.2,1.8],[0,2.0],[2.2,1.8]];
 const syncHeadCamera=(id,v)=>{
   const element=window.ONEPartyMedia?.videoForMember?.(id)||null;
   if(element===v.videoElement)return;
   v.videoElement=element;
   if(v.videoTexture){v.videoTexture.dispose();v.videoTexture=null;}
   const material=v.cameraScreen?.material;
   if(!material)return;
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
 const canMove=(x,z)=>Math.abs(x)<8.1&&Math.abs(z)<6.1&&!(Math.hypot(x,z)<1.6)&&!([-4.8,4.8].some(cx=>Math.abs(x-cx)<1.65&&z>-3.8&&z<-1.95));
 function drawStatus(next){
   state=next;const key=JSON.stringify([next.room,next.self,next.host,next.notice,next.joined,next.ready,next.canStart,next.connecting,next.players]);if(key===statusKey)return;statusKey=key;
   shell.querySelector('[data-room]').textContent=next.room+' · '+next.players.length+'/4 · R46';
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
 function frame(t){
   if(stopped)return;raf=requestAnimationFrame(frame);if(document.hidden||!assetsReady||graphicsLost||gameScreen.opened){last=t;return;}if(!budget.shouldRender(t,resizePending))return;const began=performance.now();applyResize();
   const dt=Math.min((t-last)/1000,.05);last=t;
   let forward=(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stickInput.y;
   let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')?1:0)+stickInput.x;
   const scale=Math.max(1,Math.hypot(forward,side));forward/=scale;side/=scale;
    const speed=sprint?4.2:2.4;
    const x=position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,z=position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
   if(canMove(x,position.z))position.x=x;if(canMove(position.x,z))position.z=z;
   if(t-lastSend>100){updateLobbyPose({...position,yaw});lastSend=t;}
   for(const [id,v] of avatars){syncHeadCamera(id,v);const p=lobbyPose(id);if(!p)continue;v.track.push(p,t);const pose=v.track.at(t);if(pose)animateAvatar(v,pose,dt);}
   camera.position.set(position.x,1.65,position.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;renderer.render(scene,camera);if(assetsReady)budget.record(t,performance.now()-began);
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
  listen(window,'keydown',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();setSprint(true);}else if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);}else if(e.code==='KeyE'){e.preventDefault();gameScreen.open();}else if(e.code==='Escape')close();});listen(window,'keyup',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight')setSprint(false);else keys.delete(e.code);});listen(window,'blur',()=>{keys.clear();stopStick();look=null;setSprint(false);});listen(document,'visibilitychange',()=>{keys.clear();stopStick();setSprint(false);last=performance.now();budget.reset();});
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


