import * as THREE from './three.core.js';

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
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,14),new THREE.MeshStandardMaterial({color:0x17131f,roughness:.78,metalness:.08}));floor.rotation.x=-Math.PI/2;scene.add(floor);
 const rug=new THREE.Mesh(new THREE.CircleGeometry(3.1,48),new THREE.MeshStandardMaterial({color:0x2a1744,roughness:.9}));rug.rotation.x=-Math.PI/2;rug.position.y=.012;scene.add(rug);
 const wallMat=new THREE.MeshStandardMaterial({color:0x111019,roughness:.88});
 for(const [sx,sy,sz,x,y,z] of [[18,4,.25,0,2,-7],[.25,4,14,-9,2,0],[.25,4,14,9,2,0]]){const w=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),wallMat);w.position.set(x,y,z);scene.add(w);}
 const screen=new THREE.Mesh(new THREE.BoxGeometry(5.4,2.5,.18),new THREE.MeshStandardMaterial({color:0x3d1a72,emissive:0x2a0d55,emissiveIntensity:1.2}));screen.position.set(0,2.25,-6.72);scene.add(screen);
 const logo=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture('ONE  •  JEUX','#b58cff')}));logo.scale.set(4.2,1.05,1);logo.position.set(0,2.3,-6.58);scene.add(logo);
 const couchMat=new THREE.MeshStandardMaterial({color:0x29232f,roughness:.9});
 for(const x of [-4.8,4.8]){const c=new THREE.Mesh(new THREE.BoxGeometry(2.7,.65,1.1),couchMat);c.position.set(x,.42,-2.8);scene.add(c);const b=new THREE.Mesh(new THREE.BoxGeometry(2.7,.9,.35),couchMat);b.position.set(x,1,-3.25);scene.add(b);}
 const table=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,.18,32),new THREE.MeshStandardMaterial({color:0x332943,metalness:.25,roughness:.45}));table.position.set(0,.58,0);scene.add(table);
 for(const p of [[-7,2,-5],[7,2,-5],[0,2,5]]){const l=new THREE.PointLight(0x8b5cff,18,7,2);l.position.set(...p);scene.add(l);}
 scene.add(new THREE.HemisphereLight(0x8b74ff,0x151018,1.35));
}
function open(ctx={}){
 close();const shell=document.createElement('section');shell.className='one3d-shell';shell.setAttribute('role','dialog');shell.setAttribute('aria-label','Lobby 3D ONE');
 const members=(ctx.data?.members||[]).slice(0,4);shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small>${ctx.room?.name||'Salon'} · ${members.length}/4 joueurs</small></div><button type="button" data-close>Quitter la 3D</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">${ctx.game?.name||'Choix du jeu'}</div></div><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Zone pour regarder"></div><div class="one3d-tip">Joystick gauche · glisse à droite pour regarder</div></div><footer class="one3d-bottom"><span>Prototype local · synchro réseau prochaine étape</span><button type="button" data-ready>${members.find(m=>m.isYou)?.ready?'✓ Prêt':'Je suis prêt'}</button></footer>`;
 document.body.append(shell);const stage=shell.querySelector('.one3d-stage'),players=shell.querySelector('.one3d-players');members.forEach(m=>{const e=document.createElement('span');e.className='one3d-player';e.dataset.ready=String(!!m.ready);e.textContent=(m.isYou?'● ':'')+m.name+(m.ready?' ✓':'');players.append(e);});
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x08070d);scene.fog=new THREE.Fog(0x08070d,8,22);buildRoom(scene);
 const camera=new THREE.PerspectiveCamera(65,1,.05,60);let yaw=0,pitch=-.08;const local=members.find(m=>m.isYou)||{name:'Toi',isYou:true};const colors=[0x7b5cff,0x49b6ff,0xff6b9e,0x58d68d];let me=null;members.forEach((m,i)=>{const a=[[-2.2,1.8],[2.2,1.8],[-2.2,-1.8],[2.2,-1.8]][i]||[0,0];const av=makeAvatar(scene,m.name,colors[i%4],a[0],a[1],m.isYou);if(m.isYou)me=av;});if(!me)me=makeAvatar(scene,local.name,colors[0],0,2,true);camera.position.set(me.position.x,1.65,me.position.z+2.8);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;stage.prepend(renderer.domElement);
 const keys={x:0,y:0};let raf=0,last=performance.now(),drag=null,look=null;
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();}
 const ro=new ResizeObserver(resize);ro.observe(stage);resize();
 function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;const speed=2.4;const f=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)),r=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));me.position.addScaledVector(f,-keys.y*speed*dt).addScaledVector(r,keys.x*speed*dt);me.position.x=clamp(me.position.x,-8.1,8.1);me.position.z=clamp(me.position.z,-6.1,6.1);camera.position.set(me.position.x,1.65,me.position.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;me.visible=false;renderer.render(scene,camera);me.visible=true;raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);
 const stick=shell.querySelector('.one3d-stick'),knob=shell.querySelector('.one3d-knob');function stickMove(e){const b=stick.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2),d=Math.hypot(dx,dy)||1,m=Math.min(38,d),nx=dx/d,ny=dy/d;keys.x=nx*(m/38);keys.y=ny*(m/38);knob.style.transform=`translate(${nx*m}px,${ny*m}px)`;}stick.addEventListener('pointerdown',e=>{drag=e.pointerId;stick.setPointerCapture(drag);stickMove(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===drag)stickMove(e)});const end=e=>{if(e.pointerId!==drag)return;drag=null;keys.x=keys.y=0;knob.style.transform='';};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
 const lookZone=shell.querySelector('.one3d-look');let lx=0,ly=0;lookZone.addEventListener('pointerdown',e=>{look=e.pointerId;lx=e.clientX;ly=e.clientY;lookZone.setPointerCapture(look)});lookZone.addEventListener('pointermove',e=>{if(e.pointerId!==look)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;yaw-=dx*.006;pitch=clamp(pitch-dy*.004,-.75,.65)});lookZone.addEventListener('pointerup',e=>{if(e.pointerId===look)look=null});
 shell.querySelector('[data-close]').onclick=close;shell.querySelector('[data-ready]').onclick=()=>{ctx.command?.('ready','&ready='+(local.ready?'0':'1')+'&stakeVersion='+(ctx.data?.wager?.version||0));close();};active={shell,renderer,scene,ro,raf};
}
function close(){if(!active)return;cancelAnimationFrame(active.raf);active.ro.disconnect();active.renderer.dispose();active.shell.remove();active=null;}
window.ONELobby3D={open,close};window.addEventListener('pagehide',close);
