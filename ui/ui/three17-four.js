import * as THREE from './three.module.js';
let active=null; const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function box(scene,x,y,z,w,h,d,color=0x242329){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.9}));m.position.set(x,y,z);scene.add(m);return m}
function open(){close();const shell=document.createElement('section');shell.className='three17-shell';shell.innerHTML=`<div class="three17-stage"><div class="three17-hud"><div class="three17-top"><div class="three17-clock">03:17</div><div class="three17-objective">🔒 SORTIE VERROUILLÉE<br><b>Éléments trouvés : <span data-count>0</span>/3</b><br><small data-floor>REZ-DE-CHAUSSÉE</small></div></div><button class="three17-exit" type="button">← Lobby</button><div class="three17-cross"></div><div class="three17-stick"><div class="three17-knob"></div></div><div class="three17-look"></div><div class="three17-actions"><button class="three17-btn flash" type="button">🔦</button><button class="three17-btn interact" type="button">AGIR</button></div><div class="three17-msg"></div></div><div class="three17-start"><div class="three17-card"><h1>3:17 FOUR</h1><div class="time">03:17</div><p>Explorez la maison, le sous-sol et l’étage.<br>Trouvez les 3 éléments.</p><button type="button">ENTRER DANS LA MAISON</button></div></div><div class="three17-win"><div><h1>VOUS ÊTES SORTI</h1><p>Prototype 3:17 FOUR · objectif terminé</p><button class="three17-btn" type="button">OK</button></div></div></div>`;document.body.append(shell);
 const stage=shell.querySelector('.three17-stage'),scene=new THREE.Scene();scene.background=new THREE.Color(0x0d0d12);scene.fog=new THREE.Fog(0x0d0d12,11,28);const camera=new THREE.PerspectiveCamera(68,1,.05,45);let yaw=Math.PI,pitch=0,px=0,pz=7.4,floorId=0; const floorY={0:0,1:3.35,'-1':-3.35},floorName={0:'REZ-DE-CHAUSSÉE',1:'ÉTAGE','-1':'SOUS-SOL'};
 const interactables=[],items=[],colliders=[];
 const WALL=0x25242a, FLOOR=0x2b292d;
 function slab(y,c=FLOOR){box(scene,0,y-.08,0,18,.16,20,c);box(scene,0,y+3.05,0,18,.12,20,0x17171c)}
 function addCollider(x,z,w,d,floor){colliders.push({x,z,w,d,floor})}
 function wallZ(x,z,w,y,floor,color=WALL){box(scene,x,y+1.5,z,w,3,.24,color);addCollider(x,z,w,.24,floor)}
 function wallX(x,z,d,y,floor,color=WALL){box(scene,x,y+1.5,z,.24,3,d,color);addCollider(x,z,.24,d,floor)}
 function outer(y,floor){wallZ(0,-10,18,y,floor);wallZ(0,10,18,y,floor);wallX(-9,0,20,y,floor);wallX(9,0,20,y,floor)}
 function door(x,y,z,rot=0,label='Porte',floor=0){const d=box(scene,x,y+1.25,z,rot? .16:2.0,2.5,rot?2.0:.16,0x4a342d);d.userData={type:'door',label,open:false,floor};interactables.push(d);return d}
 function item(x,y,z,label,color,floor){const g=box(scene,x,y+.42,z,.3,.3,.3,color);g.material.emissive=new THREE.Color(color);g.material.emissiveIntensity=1.25;g.userData={type:'item',label,taken:false,floor};items.push(g);interactables.push(g)}
 function stairRun(x,y0,z0,toY,dir,color=0x3b3940){const steps=12, dz=3.6/steps, rise=(toY-y0)/steps;for(let i=0;i<steps;i++){const z=z0+dir*(i+.5)*dz;const y=y0+(i+.5)*rise;box(scene,x,y,z,2.0,Math.max(.18,Math.abs(rise)),dz+.03,color)} }
 // --- PLAN V12 : chaque mur visible possède exactement le même collider. ---
 // RDC : entrée au sud, couloir central, salon/cuisine au nord, cage d'escalier séparée.
 slab(0);outer(0,0);
 // couloir central x [-2,2], portes réelles dans les cloisons
 wallX(-2,-4,8,0,0); wallX(2,-4,8,0,0);
 wallX(-2,5.9,4.2,0,0); wallX(2,5.9,4.2,0,0);
 // séparation nord avec ouverture de 2m au centre
 wallZ(-5,-1.0,6,0,0); wallZ(5,-1.0,6,0,0); door(0,0,-1.0,0,'Porte du salon',0);
 // pièces latérales, ouvertures à z=3
 wallZ(-5.5,3.0,3,0,0); wallZ(-8,3.0,2,0,0); door(-6.5,0,3.0,0,'Porte cuisine',0);
 wallZ(5.5,3.0,3,0,0); wallZ(8,3.0,2,0,0); door(6.5,0,3.0,0,'Porte salle à manger',0);
 // mobilier RDC
 box(scene,-6.1,.42,-5.9,3.8,.84,1.2,0x453b40); box(scene,-6.1,.28,-4.2,1.8,.56,1.0,0x55483d);
 box(scene,6.4,.48,-6.2,3.7,.96,1.0,0x49443c); box(scene,7.8,.9,-4.6,1.0,1.8,.7,0x34343a);
 box(scene,-6.6,.5,6.1,3.5,1,1.0,0x403832); box(scene,6.5,.42,6.2,3.4,.84,1.5,0x3d332e);
 const exitDoor=door(0,0,9.82,0,'Porte principale',0); exitDoor.userData.type='exit';
 // vraies cages d'escalier : gauche vers étage, droite vers sous-sol
 wallX(-7.0,6.8,5.2,0,0); wallX(-4.5,6.8,5.2,0,0); stairRun(-5.75,0,8.8,3.35,-1);
 wallX(4.5,6.8,5.2,0,0); wallX(7.0,6.8,5.2,0,0); stairRun(5.75,0,8.8,-3.35,-1,0x303138);
 // ÉTAGE : palier + long couloir et pièces alignées avec le RDC
 slab(3.35,0x27262b);outer(3.35,1);
 wallX(-2,0,20,3.35,1); wallX(2,0,20,3.35,1);
 // ouvertures de chambres depuis le couloir
 wallZ(-5,-4.8,6,3.35,1); door(-1.9,3.35,-4.8,Math.PI/2,'Chambre nord-ouest',1);
 wallZ(5,-4.8,6,3.35,1); door(1.9,3.35,-4.8,Math.PI/2,'Chambre nord-est',1);
 wallZ(-5,1.0,6,3.35,1); door(-1.9,3.35,1.0,Math.PI/2,'Chambre ouest',1);
 wallZ(5,1.0,6,3.35,1); door(1.9,3.35,1.0,Math.PI/2,'Salle de bain',1);
 box(scene,-6.1,3.72,-7.0,3.4,.72,3.5,0x413940); box(scene,6.1,3.72,-7.0,3.4,.72,3.5,0x3b353a);
 box(scene,-6.5,4.25,4.8,1.5,1.8,.7,0x302d31); box(scene,6.3,3.7,4.8,3.0,.7,1.3,0x686970);
 // SOUS-SOL : couloir béton et trois pièces, même logique collision/visuel
 slab(-3.35,0x202126);outer(-3.35,-1);
 wallX(-2,-1.5,17,-3.35,-1); wallX(2,-1.5,17,-3.35,-1);
 wallZ(-5,-4.2,6,-3.35,-1); door(-1.9,-3.35,-4.2,Math.PI/2,'Chaufferie',-1);
 wallZ(5,-4.2,6,-3.35,-1); door(1.9,-3.35,-4.2,Math.PI/2,'Stockage',-1);
 wallZ(-5,2.2,6,-3.35,-1); door(-1.9,-3.35,2.2,Math.PI/2,'Pièce condamnée',-1);
 box(scene,-6.1,-2.55,-6.5,2.2,1.6,1.4,0x37383b); box(scene,6.2,-2.75,-6.2,3.4,1.1,1.2,0x343238); box(scene,-6.2,-2.35,5.4,1.5,2,.8,0x2c2d30);
 item(-6.4,0,-6.2,'Clé ancienne',0xd6b34a,0); item(6.3,-3.35,-6.0,'Fusible',0x5db4ff,-1); item(-6.3,3.35,4.8,'Sceau',0xb36cff,1);
 scene.add(new THREE.HemisphereLight(0xaeb8d8,0x251d24,1.15));const moon=new THREE.DirectionalLight(0xb7c8ef,1.25);moon.position.set(2,6,3);scene.add(moon);const flashlight=new THREE.SpotLight(0xf3f6ff,65,18,.58,.55,1.15);const target=new THREE.Object3D();scene.add(flashlight,target);flashlight.target=target;const fillLight=new THREE.PointLight(0xdde8ff,3.5,5,1.7);scene.add(fillLight);let flashOn=true;
 const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.65;stage.prepend(renderer.domElement);
 const keys={x:0,y:0};let drag=null,look=null,lx=0,ly=0,last=performance.now(),raf=0,count=0,msgTimer=0,lastRender=0;const FRAME_MS=1000/45;const ray=new THREE.Raycaster();
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}const ro=new ResizeObserver(resize);ro.observe(stage);resize();
 function message(t){const m=shell.querySelector('.three17-msg');m.textContent=t;m.classList.add('show');clearTimeout(msgTimer);msgTimer=setTimeout(()=>m.classList.remove('show'),1500)}
 function onUpperStairs(x,z){return x>-6.95&&x<-4.55&&z>5.15&&z<8.95}
 function onLowerStairs(x,z){return x>4.55&&x<6.95&&z>5.15&&z<8.95}
 function currentY(){
   if(onUpperStairs(px,pz)){const t=clamp((8.8-pz)/3.6,0,1); if(t>.92)floorId=1; else if(t<.08)floorId=0; return t*3.35;}
   if(onLowerStairs(px,pz)){const t=clamp((8.8-pz)/3.6,0,1); if(t>.92)floorId=-1; else if(t<.08)floorId=0; return -t*3.35;}
   return floorY[floorId];
 }
 function blocked(nx,nz){
   if(nx<-8.55||nx>8.55||nz<-9.5||nz>9.5)return true;
   // Pendant un escalier, la cage elle-même guide le joueur; les murs de l'autre niveau ne bloquent pas.
   if(onUpperStairs(nx,nz)||onLowerStairs(nx,nz))return false;
   const r=.28;
   for(const c of colliders){if(c.floor!==floorId)continue;if(Math.abs(nx-c.x)<c.w/2+r&&Math.abs(nz-c.z)<c.d/2+r)return true;}
   for(const o of interactables){const u=o.userData;if(u.type!=='door'&&u.type!=='exit')continue;if(u.floor!==floorId||u.open)continue;const w=o.geometry.parameters.width,d=o.geometry.parameters.depth;if(Math.abs(nx-o.position.x)<w/2+r&&Math.abs(nz-o.position.z)<d/2+r)return true;}
   return false;
 }
 function nearestInteractable(){let best=null,bd=2.25;for(const o of interactables){if(o.userData.taken)continue;const u=o.userData;if(u.floor!==undefined&&u.floor!==floorId)continue;const d=Math.hypot(o.position.x-px,o.position.z-pz);if(d<bd){best=o;bd=d}}return best}
 function interact(){const o=nearestInteractable();if(!o){message('Rien à utiliser ici');return}const u=o.userData;if(u.type==='item'){u.taken=true;o.visible=false;count++;shell.querySelector('[data-count]').textContent=count;message('✓ '+u.label+' récupéré');return}if(u.type==='door'){u.open=!u.open;o.visible=!u.open;message(u.open?'Porte ouverte':'Porte fermée');return}if(u.type==='exit'){if(count<3)message(`Il manque ${3-count} élément${3-count>1?'s':''}`);else shell.querySelector('.three17-win').classList.add('show')}}
 function frame(now){raf=requestAnimationFrame(frame);if(document.hidden||now-lastRender<FRAME_MS)return;lastRender=now;const dt=Math.min(.05,(now-last)/1000);last=now;camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;/* Le joystick utilise directement les axes REELS de la camera. Ainsi haut/bas/gauche/droite restent synchronises avec le regard, quelle que soit la rotation. */const forwardInput=-keys.y,strafeInput=keys.x,spd=2.5;/* Même formule que le joystick du lobby 3D validé sur mobile. */const sin=Math.sin(yaw),cos=Math.cos(yaw);const moveX=(-sin*forwardInput+cos*strafeInput)*spd*dt;const moveZ=(-cos*forwardInput-sin*strafeInput)*spd*dt;const nx=px+moveX,nz=pz+moveZ;if(!blocked(nx,pz))px=nx;if(!blocked(px,nz))pz=nz;const fy=currentY();camera.position.set(px,fy+1.62,pz);const f=shell.querySelector('[data-floor]');if(f)f.textContent=floorName[floorId];flashlight.visible=flashOn;fillLight.visible=flashOn;flashlight.position.copy(camera.position);fillLight.position.copy(camera.position);const dir=new THREE.Vector3();camera.getWorldDirection(dir);target.position.copy(camera.position).add(dir.multiplyScalar(5));target.updateMatrixWorld();items.forEach(i=>{if(i.visible)i.rotation.y+=dt*1.6});renderer.render(scene,camera);}raf=requestAnimationFrame(frame);
 const stick=shell.querySelector('.three17-stick'),knob=shell.querySelector('.three17-knob');function sm(e){const b=stick.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2),d=Math.hypot(dx,dy)||1,m=Math.min(38,d),nx=dx/d,ny=dy/d;keys.x=nx*(m/38);keys.y=ny*(m/38);knob.style.transform=`translate(${nx*m}px,${ny*m}px)`}stick.addEventListener('pointerdown',e=>{drag=e.pointerId;stick.setPointerCapture(drag);sm(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===drag)sm(e)});function se(e){if(e.pointerId!==drag)return;drag=null;keys.x=keys.y=0;knob.style.transform=''}stick.addEventListener('pointerup',se);stick.addEventListener('pointercancel',se)
 const lookz=shell.querySelector('.three17-look');lookz.addEventListener('pointerdown',e=>{look=e.pointerId;lx=e.clientX;ly=e.clientY;lookz.setPointerCapture(look)});lookz.addEventListener('pointermove',e=>{if(e.pointerId!==look)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;yaw-=dx*.006;pitch=clamp(pitch-dy*.004,-.8,.7)});lookz.addEventListener('pointerup',e=>{if(e.pointerId===look)look=null});
 // V9 multitouch: actions fire on their OWN pointerdown, independently of joystick/camera pointers.
 const uiButtons=[...shell.querySelectorAll('button')];uiButtons.forEach(btn=>{btn.style.touchAction='manipulation';btn.addEventListener('pointerdown',e=>e.stopPropagation());btn.addEventListener('pointerup',e=>e.stopPropagation());});
 function press(el,fn){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn(e)},{passive:false})}
 press(shell.querySelector('.interact'),()=>interact());
 press(shell.querySelector('.flash'),()=>{flashOn=!flashOn;message(flashOn?'Lampe allumée':'Lampe éteinte')});
 press(shell.querySelector('.three17-exit'),()=>close());
 press(shell.querySelector('.three17-start button'),()=>shell.querySelector('.three17-start')?.remove());
 press(shell.querySelector('.three17-win button'),()=>close());active={shell,renderer,ro,raf};
}
function close(){if(!active)return;cancelAnimationFrame(active.raf);active.ro.disconnect();active.renderer.dispose();active.shell.remove();active=null}window.ONEThree17={open,close};window.addEventListener('pagehide',close);
