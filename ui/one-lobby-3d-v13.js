import * as THREE from './three.module.js';

let active=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function labelTexture(text,accent='#9b7cff'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='rgba(8,7,13,.82)';x.roundRect(8,8,496,112,30);x.fill();x.strokeStyle=accent;x.lineWidth=5;x.stroke();x.fillStyle='#fff';x.font='700 42px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text.slice(0,20),256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function makeAvatar(scene,name,color,x,z,isYou){
 const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.05});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.82,6,12),mat);body.position.y=1.0;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.27,18,12),new THREE.MeshStandardMaterial({color:0xd8b39a,roughness:.8}));head.position.y=1.75;g.add(head);
 const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture((isYou?'● ':'')+name,isYou?'#8f6cff':'#555')}));spr.scale.set(1.75,.44,1);spr.position.y=2.35;g.add(spr);g.position.set(x,0,z);scene.add(g);return g;
}
function buildRoom(scene){
 scene.background=new THREE.Color(0x25212e);
 scene.fog=new THREE.Fog(0x25212e,18,42);
 const floorMat=new THREE.MeshStandardMaterial({color:0x4b4355,roughness:.72,metalness:.12});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,14),floorMat);floor.rotation.x=-Math.PI/2;scene.add(floor);
 const rug=new THREE.Mesh(new THREE.CircleGeometry(3.25,48),new THREE.MeshStandardMaterial({color:0x4a2774,roughness:.82,emissive:0x170827,emissiveIntensity:.7}));rug.rotation.x=-Math.PI/2;rug.position.y=.015;scene.add(rug);
 const wallMat=new THREE.MeshStandardMaterial({color:0x4a4450,roughness:.82});
 for(const [sx,sy,sz,x,y,z] of [[18,4,.25,0,2,-7],[.25,4,14,-9,2,0],[.25,4,14,9,2,0]]){const w=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),wallMat);w.position.set(x,y,z);scene.add(w);}
 const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(18,14),new THREE.MeshStandardMaterial({color:0x35303b,roughness:.9,side:THREE.DoubleSide}));ceiling.rotation.x=Math.PI/2;ceiling.position.y=4;scene.add(ceiling);
 const screen=new THREE.Mesh(new THREE.BoxGeometry(5.6,2.65,.18),new THREE.MeshStandardMaterial({color:0x5926a1,emissive:0x4c168f,emissiveIntensity:2.1,roughness:.35}));screen.position.set(0,2.3,-6.72);scene.add(screen);
 const logo=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture('ONE  •  JEUX','#d0b8ff')}));logo.scale.set(4.3,1.08,1);logo.position.set(0,2.32,-6.57);scene.add(logo);
 const couchMat=new THREE.MeshStandardMaterial({color:0x716979,roughness:.82});
 for(const x of [-4.8,4.8]){const c=new THREE.Mesh(new THREE.BoxGeometry(2.7,.65,1.1),couchMat);c.position.set(x,.42,-2.8);scene.add(c);const b=new THREE.Mesh(new THREE.BoxGeometry(2.7,.9,.35),couchMat);b.position.set(x,1,-3.25);scene.add(b);}
 const table=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,.18,32),new THREE.MeshStandardMaterial({color:0x5a4a70,metalness:.2,roughness:.4}));table.position.set(0,.58,0);scene.add(table);
 const neonMat=new THREE.MeshStandardMaterial({color:0xb995ff,emissive:0x7a42ff,emissiveIntensity:3});
 for(const x of [-6.8,6.8]){const n=new THREE.Mesh(new THREE.BoxGeometry(.08,2.8,.08),neonMat);n.position.set(x,2,-6.48);scene.add(n);}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.3,.045,10,64),neonMat);ring.rotation.x=Math.PI/2;ring.position.y=.04;scene.add(ring);
 scene.add(new THREE.HemisphereLight(0xe8e1ff,0x5b4d67,4.6));
 const ambient=new THREE.AmbientLight(0xffffff,2.1);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xfff4e8,3.4);key.position.set(0,5,4);scene.add(key);
 for(const p of [[-6,2.5,-4],[6,2.5,-4],[-5,2.3,3],[5,2.3,3]]){const l=new THREE.PointLight(0x9f73ff,28,10,1.6);l.position.set(...p);scene.add(l);}
 const warm=new THREE.PointLight(0xffd7a0,20,8,1.8);warm.position.set(0,2.8,2.5);scene.add(warm);
}
function open(ctx={}){
 close();const shell=document.createElement('section');shell.className='one3d-shell';shell.setAttribute('role','dialog');shell.setAttribute('aria-label','Lobby 3D ONE');
 const members=(ctx.data?.members||[]).slice(0,4);shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small>${ctx.room?.name||'Salon'} · ${members.length}/4 joueurs</small></div><button type="button" data-close>Quitter la 3D</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">${ctx.game?.name||'Choix du jeu'}</div></div><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Zone pour regarder"></div><div class="one3d-tip">Joystick gauche · glisse à droite pour regarder</div></div><footer class="one3d-bottom"><button type="button" data-317>3:17 FOUR</button><button type="button" data-ready>${members.find(m=>m.isYou)?.ready?'✓ Prêt':'Je suis prêt'}</button></footer>`;
 document.body.append(shell);try{screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}const stage=shell.querySelector('.one3d-stage'),players=shell.querySelector('.one3d-players');members.forEach(m=>{const e=document.createElement('span');e.className='one3d-player';e.dataset.ready=String(!!m.ready);e.textContent=(m.isYou?'● ':'')+m.name+(m.ready?' ✓':'');players.append(e);});
 const scene=new THREE.Scene();buildRoom(scene);
 const camera=new THREE.PerspectiveCamera(65,1,.05,60);let yaw=0,pitch=-.08;const local=members.find(m=>m.isYou)||{name:'Toi',isYou:true};const colors=[0x7b5cff,0x49b6ff,0xff6b9e,0x58d68d];let me=null;members.forEach((m,i)=>{const a=[[-2.2,1.8],[2.2,1.8],[-2.2,-1.8],[2.2,-1.8]][i]||[0,0];const av=makeAvatar(scene,m.name,colors[i%4],a[0],a[1],m.isYou);if(m.isYou)me=av;});if(!me)me=makeAvatar(scene,local.name,colors[0],0,2,true);me.position.set(0,0,4.8);camera.position.set(0,1.65,4.8);yaw=0;pitch=-.10;
 const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=2.15;stage.prepend(renderer.domElement);
 const keys={x:0,y:0};let raf=0,last=performance.now(),drag=null,look=null,lastRender=0;const FRAME_MS=1000/45;
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();}
 const ro=new ResizeObserver(resize);ro.observe(stage);resize();
 function frame(now){raf=requestAnimationFrame(frame);if(document.hidden||now-lastRender<FRAME_MS)return;lastRender=now;const dt=Math.min((now-last)/1000,.05);last=now;const speed=2.4;/* FPS mobile: le corps suit la rotation horizontale de la caméra et le joystick reste toujours relatif au regard. */me.rotation.y=yaw;const forwardInput=-keys.y;const strafeInput=keys.x;/* Déplacement FPS calculé directement depuis le yaw courant : haut = direction regardée, gauche/droite = strafe. */const sin=Math.sin(yaw),cos=Math.cos(yaw);const moveX=(-sin*forwardInput+cos*strafeInput)*speed*dt;const moveZ=(-cos*forwardInput-sin*strafeInput)*speed*dt;me.position.x+=moveX;me.position.z+=moveZ;me.position.x=clamp(me.position.x,-8.1,8.1);me.position.z=clamp(me.position.z,-6.1,6.1);camera.position.set(me.position.x,1.65,me.position.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;me.visible=false;renderer.render(scene,camera);me.visible=true;}raf=requestAnimationFrame(frame);
 const stick=shell.querySelector('.one3d-stick'),knob=shell.querySelector('.one3d-knob');function stickMove(e){const b=stick.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2),d=Math.hypot(dx,dy)||1,m=Math.min(38,d),nx=dx/d,ny=dy/d;keys.x=nx*(m/38);keys.y=ny*(m/38);knob.style.transform=`translate(${nx*m}px,${ny*m}px)`;}stick.addEventListener('pointerdown',e=>{drag=e.pointerId;stick.setPointerCapture(drag);stickMove(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===drag)stickMove(e)});const end=e=>{if(e.pointerId!==drag)return;drag=null;keys.x=keys.y=0;knob.style.transform='';};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
 const lookZone=shell.querySelector('.one3d-look');let lx=0,ly=0;lookZone.addEventListener('pointerdown',e=>{look=e.pointerId;lx=e.clientX;ly=e.clientY;lookZone.setPointerCapture(look)});lookZone.addEventListener('pointermove',e=>{if(e.pointerId!==look)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;yaw-=dx*.006;pitch=clamp(pitch-dy*.004,-.75,.65)});lookZone.addEventListener('pointerup',e=>{if(e.pointerId===look)look=null});
 shell.querySelector('[data-close]').onclick=close;shell.querySelector('[data-317]').onclick=()=>{close();window.ONEThree17?.open?.();};shell.querySelector('[data-ready]').onclick=()=>{ctx.command?.('ready','&ready='+(local.ready?'0':'1')+'&stakeVersion='+(ctx.data?.wager?.version||0));close();};active={shell,renderer,scene,ro,raf};
}
function close(){if(!active)return;cancelAnimationFrame(active.raf);active.ro.disconnect();active.renderer.dispose();active.shell.remove();active=null;}
window.ONELobby3D={open,close};window.addEventListener('pagehide',close);
