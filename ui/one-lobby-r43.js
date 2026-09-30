
import * as THREE from './three.module.js';

import {lobbyState,subscribeLobby,joinLobby,leaveLobby,startRound,setLobbyReady,updateLobbyPose} from './three17-r43-coop.js';
let active=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function labelTexture(text,accent='#9b7cff'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='rgba(8,7,13,.82)';x.roundRect(8,8,496,112,30);x.fill();x.strokeStyle=accent;x.lineWidth=5;x.stroke();x.fillStyle='#fff';x.font='700 42px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text.slice(0,20),256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function makeAvatar(scene,name,color,x,z,isYou){
 const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.05});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.82,6,12),mat);body.position.y=1.0;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.27,18,12),new THREE.MeshStandardMaterial({color:0xd8b39a,roughness:.8}));head.position.y=1.75;g.add(head);
 const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture((isYou?'● ':'')+name,isYou?'#8f6cff':'#555')}));spr.scale.set(1.75,.44,1);spr.position.y=2.35;g.add(spr);g.position.set(x,0,z);
 const limbs=[];for(const sign of [-1,1]){for(const [radius,length,y,x] of [[.10,.55,.35,.17],[.075,.55,1.06,.42]]){const limb=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,3,6),mat);limb.position.set(sign*x,y,0);g.add(limb);limbs.push(limb);}}g.userData.limbs=limbs;
 scene.add(g);return g;
}
function buildRoom(scene){
 scene.background=new THREE.Color(0x25212e);
 scene.fog=new THREE.Fog(0x25212e,18,42);
 const floorMat=new THREE.MeshStandardMaterial({color:0x262131,roughness:.72,metalness:.12});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,14),floorMat);floor.rotation.x=-Math.PI/2;scene.add(floor);
 const rug=new THREE.Mesh(new THREE.CircleGeometry(3.25,48),new THREE.MeshStandardMaterial({color:0x4a2774,roughness:.82,emissive:0x170827,emissiveIntensity:.7}));rug.rotation.x=-Math.PI/2;rug.position.y=.015;scene.add(rug);
 const wallMat=new THREE.MeshStandardMaterial({color:0x302b3d,roughness:.82});
 for(const [sx,sy,sz,x,y,z] of [[18,4,.25,0,2,-7],[.25,4,14,-9,2,0],[.25,4,14,9,2,0]]){const w=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),wallMat);w.position.set(x,y,z);scene.add(w);}
 const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(18,14),new THREE.MeshStandardMaterial({color:0x35303b,roughness:.9,side:THREE.DoubleSide}));ceiling.rotation.x=Math.PI/2;ceiling.position.y=4;scene.add(ceiling);
 const screen=new THREE.Mesh(new THREE.BoxGeometry(5.6,2.65,.18),new THREE.MeshStandardMaterial({color:0x5926a1,emissive:0x4c168f,emissiveIntensity:2.1,roughness:.35}));screen.position.set(0,2.3,-6.72);scene.add(screen);
 const logo=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture('3:17  •  FOUR','#d0b8ff')}));logo.scale.set(4.3,1.08,1);logo.position.set(0,2.32,-6.57);scene.add(logo);
 const couchMat=new THREE.MeshStandardMaterial({color:0x443850,roughness:.82});
 for(const x of [-4.8,4.8]){const c=new THREE.Mesh(new THREE.BoxGeometry(2.7,.65,1.1),couchMat);c.position.set(x,.42,-2.8);scene.add(c);const b=new THREE.Mesh(new THREE.BoxGeometry(2.7,.9,.35),couchMat);b.position.set(x,1,-3.25);scene.add(b);}
 const table=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,.18,32),new THREE.MeshStandardMaterial({color:0x5a4a70,metalness:.2,roughness:.4}));table.position.set(0,.58,0);scene.add(table);
 const neonMat=new THREE.MeshStandardMaterial({color:0xb995ff,emissive:0x7a42ff,emissiveIntensity:3});
 for(const x of [-6.8,6.8]){const n=new THREE.Mesh(new THREE.BoxGeometry(.08,2.8,.08),neonMat);n.position.set(x,2,-6.48);scene.add(n);}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.3,.045,10,64),neonMat);ring.rotation.x=Math.PI/2;ring.position.y=.04;scene.add(ring);
 scene.add(new THREE.HemisphereLight(0xe8e1ff,0x282036,1.6));
 const ambient=new THREE.AmbientLight(0xd6c7ef,.55);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xfff4e8,1.5);key.position.set(0,5,4);scene.add(key);
 for(const p of [[-6,2.5,-4],[6,2.5,-4],[-5,2.3,3],[5,2.3,3]]){const l=new THREE.PointLight(0x9f73ff,14,10,1.6);l.position.set(...p);scene.add(l);}
 const warm=new THREE.PointLight(0xffd7a0,10,8,1.8);warm.position.set(0,2.8,2.5);scene.add(warm);
}
function open(ctx={}){
 if(active){active.shell.focus();return;}
 const shell=document.createElement('section');shell.className='one3d-shell';shell.tabIndex=-1;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Lobby 3D partagé');
 shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small data-room></small></div><button type="button" data-close aria-label="Quitter le lobby 3D">Quitter</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">3:17 · 2–4 JOUEURS</div></div><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Glisser pour regarder"></div></div><footer class="one3d-bottom"><div class="one3d-session"><span class="one3d-eyebrow">3:17 · FOUR</span><p data-status role="status">Connexion au salon…</p><div class="one3d-actions"><button type="button" data-ready disabled>Je suis prêt</button><button type="button" data-start disabled>Lancer 3:17</button></div><button type="button" data-reconnect>Réessayer la connexion</button></div></footer><p class="one3d-controls">ZQSD / WASD · flèches · glisser pour regarder</p>`;
 document.body.append(shell);shell.focus();
 const stage=shell.querySelector('.one3d-stage'),chips=shell.querySelector('.one3d-players');
 const scene=new THREE.Scene();let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});}
 catch(error){shell.querySelector('[data-status]').textContent='La 3D ne démarre pas dans ce navigateur. Ferme les autres jeux, puis réessaie.';shell.querySelector('[data-close]').onclick=()=>shell.remove();shell.querySelector('[data-reconnect]').onclick=()=>{shell.remove();open(ctx);};return;}
 buildRoom(scene);
 const camera=new THREE.PerspectiveCamera(65,1,.05,60),position={x:0,z:4.8};let yaw=0,pitch=-.10,spawned=false;
 const colors=[0x9771f7,0x45bafa,0xf880a3,0x61d7aa],avatars=new Map();
 const spawns=[[0,4.8],[-2.2,1.8],[0,2.0],[2.2,1.8]];
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;stage.prepend(renderer.domElement);
 let state=lobbyState(),raf=0,last=performance.now(),lastRender=0,lastSend=0,stopped=false,drag=null,look=null,lx=0,ly=0;
 const keys=new Set(),stickInput={x:0,y:0},abort=new AbortController();
 const listen=(target,event,fn)=>target.addEventListener(event,fn,{signal:abort.signal});
 const canMove=(x,z)=>Math.abs(x)<8.1&&Math.abs(z)<6.1&&!(Math.hypot(x,z)<1.6)&&!([-4.8,4.8].some(cx=>Math.abs(x-cx)<1.65&&z>-3.8&&z<-1.95));
 function drawStatus(next){
   state=next;
   shell.querySelector('[data-room]').textContent=next.room+' · '+next.players.length+'/4 · R43';
   shell.querySelector('[data-status]').textContent=next.notice;
   const readyButton=shell.querySelector('button[data-ready]'),start=shell.querySelector('[data-start]');
   readyButton.disabled=!next.joined||!next.players.some(p=>p.id===next.self);readyButton.textContent=next.ready?'✓ Prêt':'Je suis prêt';readyButton.setAttribute('aria-pressed',String(next.ready));
   start.hidden=!next.isHost;start.disabled=!next.canStart;
   shell.querySelector('[data-reconnect]').disabled=next.connecting;
   chips.replaceChildren();
   next.players.forEach((p,i)=>{
     const chip=document.createElement('span');chip.className='one3d-player';chip.dataset.ready=String(p.ready);chip.textContent=p.name+(p.id===next.self?' · toi':'')+(p.id===next.host?' · hôte':'')+(p.ready?' ✓':'');chips.append(chip);
     if(p.id===next.self){if(!spawned){position.x=spawns[i][0];position.z=spawns[i][1];spawned=true;}return;}
     if(!avatars.has(p.id)){const group=makeAvatar(scene,p.name,colors[i],...spawns[i],false);avatars.set(p.id,{group,phase:0,last:{x:group.position.x,z:group.position.z}});}
   });
   for(const [id,v] of avatars)if(!next.players.some(p=>p.id===id)){scene.remove(v.group);disposeObject(v.group);avatars.delete(id);}
 }
 const off=subscribeLobby(drawStatus);
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();}
 const ro=new ResizeObserver(resize);ro.observe(stage);resize();
 function frame(t){
   if(stopped)return;raf=requestAnimationFrame(frame);if(document.hidden||t-lastRender<1000/45)return;
   lastRender=t;const dt=Math.min((t-last)/1000,.05);last=t;
   let forward=(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stickInput.y;
   let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')?1:0)+stickInput.x;
   const scale=Math.max(1,Math.hypot(forward,side));forward/=scale;side/=scale;
   const x=position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*2.4*dt,z=position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*2.4*dt;
   if(canMove(x,position.z))position.x=x;if(canMove(position.x,z))position.z=z;
   if(t-lastSend>100){updateLobbyPose({...position,yaw});lastSend=t;}
   const remote=lobbyState().poses;
   for(const [id,v] of avatars){const p=remote[id];if(!p)continue;v.group.position.x+=(p.x-v.group.position.x)*(1-Math.exp(-dt*12));v.group.position.z+=(p.z-v.group.position.z)*(1-Math.exp(-dt*12));v.group.rotation.y+=Math.atan2(Math.sin(p.yaw-v.group.rotation.y),Math.cos(p.yaw-v.group.rotation.y))*(1-Math.exp(-dt*12));
     const distance=Math.hypot(v.group.position.x-v.last.x,v.group.position.z-v.last.z);v.phase+=distance*5;v.group.userData.limbs?.forEach((l,i)=>l.rotation.x=distance>.001?Math.sin(v.phase+(i%2?Math.PI:0))*.38:0);v.last={x:v.group.position.x,z:v.group.position.z};
   }
   camera.position.set(position.x,1.65,position.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;renderer.render(scene,camera);
 }
 const stick=shell.querySelector('.one3d-stick'),knob=shell.querySelector('.one3d-knob');
 function stickMove(e){const b=stick.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,d=Math.hypot(dx,dy)||1,m=Math.min(32,d);stickInput.x=dx/d*m/32;stickInput.y=dy/d*m/32;knob.style.transform=`translate(${dx/d*m}px,${dy/d*m}px)`;}
 listen(stick,'pointerdown',e=>{drag=e.pointerId;stick.setPointerCapture(drag);stickMove(e);});listen(stick,'pointermove',e=>{if(drag===e.pointerId)stickMove(e);});
 function stopStick(){drag=null;stickInput.x=stickInput.y=0;knob.style.transform='';}
 listen(stick,'pointerup',stopStick);listen(stick,'pointercancel',stopStick);
 const zone=shell.querySelector('.one3d-look');listen(zone,'pointerdown',e=>{look=e.pointerId;lx=e.clientX;ly=e.clientY;zone.setPointerCapture(look);});listen(zone,'pointermove',e=>{if(look!==e.pointerId)return;yaw=Math.atan2(Math.sin(yaw-(e.clientX-lx)*.006),Math.cos(yaw-(e.clientX-lx)*.006));pitch=clamp(pitch-(e.clientY-ly)*.004,-.75,.65);lx=e.clientX;ly=e.clientY;});listen(zone,'pointerup',()=>look=null);listen(zone,'pointercancel',()=>look=null);
 const movement=['KeyW','KeyA','KeyS','KeyD','KeyZ','KeyQ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
 listen(window,'keydown',e=>{if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);}else if(e.code==='Escape')close();});listen(window,'keyup',e=>keys.delete(e.code));listen(window,'blur',()=>{keys.clear();stopStick();look=null;});listen(document,'visibilitychange',()=>{keys.clear();stopStick();last=performance.now();});
 shell.querySelector('[data-close]').onclick=()=>close();shell.querySelector('button[data-ready]').onclick=setLobbyReady;shell.querySelector('[data-start]').onclick=startRound;shell.querySelector('[data-reconnect]').onclick=()=>joinLobby(ctx,true);
 active={shell,renderer,scene,ro,stop(){stopped=true;cancelAnimationFrame(raf);abort.abort();off();},inspect:()=>({position:{...position},yaw,avatars:[...avatars].map(([id,v])=>({id,x:v.group.position.x,z:v.group.position.z})),state:lobbyState()})};
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
