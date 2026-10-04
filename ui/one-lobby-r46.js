import {prepareScene} from './three17-r46-warmup.js?v=lobby-shoot-v86';
import {createGameScreen} from './one-lobby-r46-screen.js?v=lobby-shoot-v86';

import * as THREE from './three.module.js?v=lobby-shoot-v86';
import {buildRoom} from './one-lobby-r46-room.js?v=lobby-shoot-v86';
import {createAvatar,animateAvatar,orientAvatarCamera} from './three17-r44-avatar.js?v=lobby-shoot-v86';
import {createRenderBudget} from './three17-r46-render.js?v=lobby-shoot-v86';

import {lobbyState,subscribeLobby,joinLobby,leaveLobby,startRound,setLobbyReady,updateLobbyPose,lobbyPose} from './three17-r46-coop.js?v=lobby-shoot-v86';
let active=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
const lerp=(a,b,t)=>a+(b-a)*t;
function open(ctx={}){
 if(active){active.shell.focus();return;}
 const shell=document.createElement('section');shell.className='one3d-shell';shell.tabIndex=-1;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Lobby 3D partagé');
 shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small data-room></small></div><button type="button" data-close aria-label="Quitter le lobby 3D">Quitter</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">3:17 · 2–4 JOUEURS</div></div><button class="one3d-screen-button" data-screen-open>✦ Choisir un jeu</button><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Glisser pour regarder"></div><button class="one3d-run" type="button" data-run aria-pressed="false">COURIR</button><button class="one3d-fight-action" type="button" data-fight-action hidden>RAMASSER BATTE</button><div class="one3d-fight-hit" data-fight-hit hidden>TOUCHÉ !</div></div><footer class="one3d-bottom"><div class="one3d-session" data-collapsed="true"><button class="one3d-panel-toggle" type="button" data-panel-toggle aria-expanded="false" aria-label="Afficher les commandes du salon">+</button><span class="one3d-eyebrow">3:17 · FOUR</span><p data-status role="status">Connexion au salon…</p><div class="one3d-actions"><button type="button" data-ready disabled>Je suis prêt</button><button type="button" data-start disabled>Lancer 3:17</button></div><button type="button" data-reconnect>Réessayer la connexion</button></div></footer><p class="one3d-controls">ZQSD / WASD · flèches · glisser pour regarder · Maj courir · F action</p>`;
 document.body.append(shell);shell.focus();
 const fightStyle=document.createElement('style');fightStyle.textContent=`
 .one3d-fight-action{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(174px,calc(env(safe-area-inset-bottom) + 170px));z-index:18;min-width:150px;min-height:50px;padding:9px 16px;border:1px solid #ff91b5;border-radius:17px;background:linear-gradient(135deg,#6e274a,#a33d67);color:#fff7fb;font:850 12px/1 system-ui;letter-spacing:.045em;box-shadow:0 8px 22px #0006,inset 0 1px #fff3;touch-action:manipulation;pointer-events:auto;-webkit-tap-highlight-color:transparent}
 .one3d-fight-action[data-mode="pickup"]{border-color:#cab2ff;background:linear-gradient(135deg,#45306c,#7652a8)}
 .one3d-fight-action[data-mode="gun"]{border-color:#8ed9ff;background:linear-gradient(135deg,#215576,#2e88b8);color:#f3fbff}
 .one3d-cross.is-hit{opacity:1;filter:drop-shadow(0 0 5px #ff334f)}.one3d-cross.is-hit:before,.one3d-cross.is-hit:after{background:#ff334f!important;box-shadow:0 0 4px #ff334f}
 .one3d-fight-action:active{transform:scale(.94)}
 .one3d-fight-hit{position:absolute;inset:0;z-index:16;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle,#ff406522 0 18%,#ff204411 38%,transparent 72%);box-shadow:inset 0 0 50px #ff325a99;color:#fff;font:900 clamp(25px,7vw,56px)/1 system-ui;text-shadow:0 4px 18px #28000b}
 .one3d-fight-hit[hidden],.one3d-fight-action[hidden]{display:none!important}
 @media(max-height:520px){.one3d-fight-action{bottom:max(166px,calc(env(safe-area-inset-bottom) + 162px));right:12px;min-height:44px;min-width:142px;font-size:11px}}
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
   part(new THREE.CylinderGeometry(.075,.112,.82,14),batWood,.39);part(new THREE.CylinderGeometry(.042,.065,.52,12),batWood,-.28);part(new THREE.CylinderGeometry(.052,.052,.25,12),batGrip,-.60);part(new THREE.CylinderGeometry(.075,.052,.08,12),batGrip,-.76);return g;
 }
 const localBat=makeBat();localBat.visible=false;scene.add(localBat);
 const batOffset=new THREE.Vector3();
 const gunMetal=new THREE.MeshStandardMaterial({color:0x24282e,roughness:.30,metalness:.74}),gunFrame=new THREE.MeshStandardMaterial({color:0x11151a,roughness:.52,metalness:.20}),gunGrip=new THREE.MeshStandardMaterial({color:0x0a0d11,roughness:.88,metalness:.02}),gunAccent=new THREE.MeshStandardMaterial({color:0x454b52,roughness:.32,metalness:.56}),gunInset=new THREE.MeshStandardMaterial({color:0x05070a,roughness:.44,metalness:.48}),muzzleMat=new THREE.MeshBasicMaterial({color:0xffd66f,toneMapped:false});
 function gunProfile(points,thickness,material,bevel=.006){
   const shape=new THREE.Shape();points.forEach(([z,y],i)=>{const sx=-z;i?shape.lineTo(sx,y):shape.moveTo(sx,y);});shape.closePath();
   const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:1});
   const m=new THREE.Mesh(geo,material);m.rotation.y=Math.PI/2;m.position.x=-thickness/2;return m;
 }
 function makePistol(){
   const g=new THREE.Group();
   // Service-pistol silhouette based on the supplied reference: long low slide, compact frame and angled grip.
   const slide=new THREE.Group();g.add(slide);
   const slideBody=gunProfile([[-.535,.030],[-.505,.132],[-.445,.157],[.060,.157],[.098,.128],[.092,.034]],.176,gunMetal,.008);slide.add(slideBody);
   const slideTop=gunProfile([[-.470,.155],[-.430,.180],[.035,.180],[.064,.157]],.128,gunAccent,.004);slide.add(slideTop);
   const frame=gunProfile([[-.430,-.048],[-.365,.025],[.065,.030],[.100,-.105],[-.090,-.132],[-.350,-.105]],.160,gunFrame,.007);g.add(frame);
   const grip=gunProfile([[-.055,-.115],[.080,-.095],[.185,-.395],[.020,-.420],[-.095,-.170]],.150,gunGrip,.010);g.add(grip);
   const gripPanel=gunProfile([[-.030,-.155],[.058,-.145],[.128,-.352],[.010,-.370],[-.060,-.190]],.158,gunAccent,.004);gripPanel.scale.set(.76,1,.76);g.add(gripPanel);
   const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.355,18),gunInset);barrel.position.set(0,.072,-.365);barrel.rotation.x=Math.PI/2;g.add(barrel);
   const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.037,.037,.028,20),gunInset);muzzle.position.set(0,.072,-.546);muzzle.rotation.x=Math.PI/2;g.add(muzzle);
   const recoilGuide=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.026,14),gunAccent);recoilGuide.position.set(0,.025,-.545);recoilGuide.rotation.x=Math.PI/2;g.add(recoilGuide);
   const magBase=gunProfile([[.115,-.382],[.192,-.399],[.185,-.438],[.026,-.447],[-.002,-.414]],.165,gunMetal,.004);g.add(magBase);
   const guard=new THREE.Mesh(new THREE.TorusGeometry(.074,.011,8,26,Math.PI*1.72),gunFrame);guard.position.set(0,-.090,-.120);guard.rotation.set(0,Math.PI/2,.15);g.add(guard);
   const trigger=new THREE.Mesh(new THREE.BoxGeometry(.014,.070,.018),gunAccent);trigger.position.set(0,-.085,-.130);trigger.rotation.x=-.28;g.add(trigger);
   const port=new THREE.Mesh(new THREE.BoxGeometry(.112,.019,.082),gunInset);port.position.set(.045,.166,-.145);slide.add(port);
   for(let i=0;i<6;i++){const serr=new THREE.Mesh(new THREE.BoxGeometry(.010,.070,.018),gunInset);serr.position.set(0,.100,.030-i*.024);slide.add(serr);}
   const frontSight=new THREE.Mesh(new THREE.BoxGeometry(.020,.035,.034),gunInset);frontSight.position.set(0,.187,-.432);slide.add(frontSight);
   const rearSightL=new THREE.Mesh(new THREE.BoxGeometry(.024,.034,.040),gunInset);rearSightL.position.set(-.035,.187,.015);slide.add(rearSightL);const rearSightR=rearSightL.clone();rearSightR.position.x=.035;slide.add(rearSightR);
   // Slide stop / takedown detail on the left side.
   const stop=new THREE.Mesh(new THREE.BoxGeometry(.016,.034,.070),gunAccent);stop.position.set(.090,.015,-.035);g.add(stop);
   const flash=new THREE.Mesh(new THREE.SphereGeometry(.070,10,8),muzzleMat);flash.scale.set(.72,.72,1.75);flash.position.set(0,.072,-.579);flash.visible=false;g.add(flash);
   g.userData={flash,slide};return g;
 }
 const localGun=makePistol();localGun.scale.setScalar(1.16);localGun.visible=false;scene.add(localGun);const gunOffset=new THREE.Vector3();
 function ensureAvatarGun(v){if(v.fightGun)return v.fightGun;const holder=new THREE.Group();holder.position.set(.02,-.50,-.12);v.arms[1].add(holder);const gun=makePistol();gun.scale.setScalar(.82);gun.rotation.x=.02;holder.add(gun);holder.visible=false;v.fightGun={holder,gun,lastSeq:null,flashUntil:0,recoilUntil:0};return v.fightGun;}
 function poseRemoteGun(v,raw,t){const weapon=ensureAvatarGun(v),visible=raw.gun===true;weapon.holder.visible=visible;if(!visible)return;const recoil=t<weapon.recoilUntil?1-(weapon.recoilUntil-t)/120:0;v.arms[1].rotation.x=raw.down===true?.02:-1.23;v.arms[1].rotation.z=-.03;weapon.holder.rotation.set(-.03,0,0);weapon.holder.position.z=-.12+.055*Math.max(0,recoil);weapon.gun.userData.flash.visible=t<weapon.flashUntil;if(weapon.gun.userData.slide)weapon.gun.userData.slide.position.z=.070*Math.max(0,recoil);}

 function ensureAvatarBat(v){
   if(v.fightBat)return v.fightBat;
   // Keep the remote bat on the body rig. This prevents the walking arm swing from
   // dragging the bat behind the legs or hiding it inside the torso.
   const holder=new THREE.Group();v.rig.add(holder);
   const bat=makeBat();bat.scale.setScalar(.68);holder.add(bat);holder.visible=false;
   v.fightBat={holder,bat,lastSeq:null,swingAt:0};return v.fightBat;
 }
 function poseRemoteBat(v,raw,t){
   const fight=ensureAvatarBat(v),visible=raw.bat===true,down=raw.down===true;fight.holder.visible=visible;if(!visible)return;
   if(down){
     v.arms[1].rotation.x=.08;v.arms[1].rotation.z=-.10;
     fight.holder.position.set(.50,.36,.16);fight.holder.rotation.set(-1.72,.04,.54);fight.bat.position.set(0,0,0);return;
   }
   // Rest pose: the handle is in the right hand while the barrel sits visibly over
   // the right shoulder. The pose is independent from the walk cycle.
   let armX=.72,armZ=-.12,px=.44,py=1.38,pz=.18,rx=.70,ry=0,rz=-.35;
   if(fight.swingAt){
     const k=Math.min(1,(t-fight.swingAt)/500);
     if(k<.16){
       // Small wind-up from the shoulder.
       const w=smooth(k/.16);
       armX=lerp(.72,.92,w);armZ=lerp(-.12,-.03,w);
       px=lerp(.44,.48,w);py=lerp(1.38,1.50,w);pz=lerp(.18,.26,w);
       rx=lerp(.70,.48,w);ry=lerp(0,.08,w);rz=lerp(-.35,-.52,w);
     }else if(k<.48){
       // One violent descending diagonal strike: shoulder -> chest -> down/front.
       const s=smooth((k-.16)/.32);
       armX=lerp(.92,.16,s);armZ=lerp(-.03,.46,s);
       px=lerp(.48,.20,s);py=lerp(1.50,1.03,s);pz=lerp(.26,-.32,s);
       rx=lerp(.48,-2.05,s);ry=lerp(.08,0,s);rz=lerp(-.52,.58,s);
     }else if(k<.60){
       armX=.16;armZ=.46;px=.20;py=1.03;pz=-.32;rx=-2.05;ry=0;rz=.58;
     }else{
       // Recover around the outside at low height, then return to the shoulder;
       // this cannot read as a second upward strike.
       const r=smooth((k-.60)/.40),arc=Math.sin(r*Math.PI);
       armX=lerp(.16,.72,r)-.12*arc;armZ=lerp(.46,-.12,r)+.08*arc;
       px=lerp(.20,.44,r)+.24*arc;py=lerp(1.03,1.38,r)-.26*arc;pz=lerp(-.32,.18,r)+.12*arc;
       rx=lerp(-2.05,.70,r)-.18*arc;ry=.08*arc;rz=lerp(.58,-.35,r)+.12*arc;
     }
     if(k>=1)fight.swingAt=0;
   }
   v.arms[1].rotation.x=armX;v.arms[1].rotation.z=armZ;
   fight.holder.position.set(px,py,pz);fight.holder.rotation.set(rx,ry,rz);
   fight.bat.position.set(0,0,0);
 }
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
 const inShootArea=(x,z)=>x<-12.5&&x>-22.2&&Math.abs(z)<5.6;
 const canMove=(x,z)=>{
   const inMain=Math.abs(x)<8.1&&Math.abs(z)<6.1&&!(Math.hypot(x,z)<1.6)&&!([-4.8,4.8].some(cx=>Math.abs(x-cx)<1.65&&z>-3.8&&z<-1.95));
   const inLeftPass=x>-13.45&&x<-8.05&&Math.abs(z)<2.16;
   const inRightPass=x<13.45&&x>8.05&&Math.abs(z)<2.16;
   const inShoot=inShootArea(x,z),inFight=inFightArea(x,z);
   return inMain||inLeftPass||inRightPass||inShoot||inFight;
 };
 let heldBat=false,heldGun=false,swingSeq=0,shotSeq=0,swingStarted=0,shotStarted=0,lastShotTarget='',lastHitAt=0,hitUntil=0,hitsTaken=0,knockedUntil=0,knockStarted=0;
 const nearestBatDistance=()=>Math.min(...(roomVisual.fightBatSpots||[]).map(s=>Math.hypot(position.x-s.x,position.z-s.z)),99);
 const nearestGunDistance=()=>Math.min(...(roomVisual.gunSpots||[]).map(s=>Math.hypot(position.x-s.x,position.z-s.z)),99);
 const isKnocked=t=>t<knockedUntil;
 const setHeldGun=value=>{heldGun=!!value;localGun.visible=heldGun;if(!heldGun)shotStarted=0;if(heldGun){heldBat=false;localBat.visible=false;swingStarted=0;}};
 const setHeldBat=value=>{heldBat=!!value;localBat.visible=heldBat;if(!heldBat)swingStarted=0;if(heldBat){heldGun=false;localGun.visible=false;shotStarted=0;}};
 const publishPose=()=>updateLobbyPose({...position,yaw,pitch,bat:heldBat,gun:heldGun,swingSeq,shotSeq,shotTarget:lastShotTarget,down:isKnocked(performance.now())});
 const swingBat=()=>{const now=performance.now();if(!heldBat||isKnocked(now)||now-swingStarted<440)return;swingSeq++;swingStarted=now;publishPose();};
 const shotOrigin=new THREE.Vector3(),shotDir=new THREE.Vector3(),shotRel=new THREE.Vector3(),shotPoint=new THREE.Vector3(),gunRay=new THREE.Raycaster(),tracers=[];
 const spawnTracer=(origin,dir,length=14)=>{const end=origin.clone().addScaledVector(dir,length),geo=new THREE.BufferGeometry().setFromPoints([origin.clone(),end]),material=new THREE.LineBasicMaterial({color:0xffdf8a,transparent:true,opacity:.95,toneMapped:false}),line=new THREE.Line(geo,material);scene.add(line);tracers.push({line,end:performance.now()+115});};
 const spawnImpact=point=>{const material=new THREE.MeshBasicMaterial({color:0xffe7a2,transparent:true,opacity:1,toneMapped:false}),spark=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),material);spark.position.copy(point);scene.add(spark);tracers.push({line:spark,end:performance.now()+140,impact:true});};
 const crosshair=shell.querySelector('.one3d-cross');let crossHitUntil=0;
 const flashCrossHit=(duration=150)=>{crossHitUntil=performance.now()+duration;crosshair?.classList.add('is-hit');};
 const raySphereDistance=(center,radius)=>{shotRel.copy(center).sub(shotOrigin);const along=shotRel.dot(shotDir);if(along<.35||along>18)return null;const perpSq=shotRel.lengthSq()-along*along;if(perpSq>radius*radius)return null;return along-Math.sqrt(Math.max(0,radius*radius-perpSq));};
 const playerHitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,depthTest:false});playerHitMaterial.colorWrite=false;
 const ensureAvatarHitboxes=(id,v)=>{
   if(v.gunHitboxes)return v.gunHitboxes;
   const add=(geo,x,y,z,part)=>{const m=new THREE.Mesh(geo,playerHitMaterial);m.position.set(x,y,z);m.userData.playerId=id;m.userData.hitPart=part;m.renderOrder=-1000;v.group.add(m);return m;};
   // Hit volumes follow the rendered avatar itself (interpolated group transform), not the raw network pose.
   v.gunHitboxes=[
     add(new THREE.SphereGeometry(.165,10,8),0,1.72,-.01,'head'),
     add(new THREE.BoxGeometry(.36,.58,.28),0,1.18,0,'torso'),
     add(new THREE.BoxGeometry(.30,.28,.26),0,.78,0,'pelvis'),
     add(new THREE.BoxGeometry(.12,.48,.18),-.12,.47,0,'leg'),
     add(new THREE.BoxGeometry(.12,.48,.18), .12,.47,0,'leg')
   ];
   return v.gunHitboxes;
 };
 const aimGun=()=>{
   camera.getWorldDirection(shotDir).normalize();shotOrigin.copy(camera.position);let best=null,bestDistance=Infinity;
   gunRay.set(shotOrigin,shotDir);gunRay.far=18;
   const colliders=[];
   for(const [id,v] of avatars){const p=lobbyPose(id);if(!p||p.down===true)continue;ensureAvatarHitboxes(id,v);v.group.updateWorldMatrix(true,true);colliders.push(...v.gunHitboxes);}
   const playerHits=gunRay.intersectObjects(colliders,false);
   if(playerHits.length){const hit=playerHits[0];bestDistance=hit.distance;best={id:String(hit.object.userData.playerId||''),distance:hit.distance,point:hit.point.clone(),part:hit.object.userData.hitPart};}
   const targetHits=gunRay.intersectObjects(roomVisual.shootTargets||[],false);
   if(targetHits.length&&targetHits[0].distance<bestDistance)best={id:'',distance:targetHits[0].distance,point:targetHits[0].point.clone(),target:true};
   return best;
 };
 const shootGun=()=>{const now=performance.now();if(!heldGun||isKnocked(now)||now-shotStarted<300)return;const aimed=aimGun();lastShotTarget=aimed?.id||'';shotSeq++;shotStarted=now;localGun.userData.flash.visible=true;if(localGun.userData.slide)localGun.userData.slide.position.z=.085;spawnTracer(shotOrigin,shotDir,aimed?.distance||16);if(aimed?.point){spawnImpact(aimed.point);flashCrossHit(165);}publishPose();};
 const useFightAction=()=>{
   if(heldGun){shootGun();return;}if(heldBat){swingBat();return;}
   const gunNear=inShootArea(position.x,position.z)&&nearestGunDistance()<1.45,batNear=inFightArea(position.x,position.z)&&nearestBatDistance()<1.55;
   if(gunNear){setHeldGun(true);publishPose();return;}if(batNear){setHeldBat(true);publishPose();}
 };
 const showFightMessage=(text,duration=300)=>{fightHit.textContent=text;fightHit.hidden=false;hitUntil=performance.now()+duration;};
 const registerHit=(t,cooldown=480,silent=false)=>{if(isKnocked(t)||t-lastHitAt<cooldown)return false;lastHitAt=t;hitsTaken++;if(hitsTaken>=3){hitsTaken=0;knockStarted=t;knockedUntil=t+2600;setSprint(false);if(!silent)showFightMessage('À TERRE !',620);publishPose();}else if(!silent)showFightMessage(`TOUCHÉ · ${hitsTaken}/3`,300);return true;};
 fightAction.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();useFightAction();});fightAction.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();});
 function drawStatus(next){
   state=next;const key=JSON.stringify([next.room,next.self,next.host,next.notice,next.joined,next.ready,next.canStart,next.connecting,next.players]);if(key===statusKey)return;statusKey=key;
   shell.querySelector('[data-room]').textContent=next.room+' · '+next.players.length+'/4 · R86';
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
   if(!fight.holder.visible||isKnocked(t))return;
   const dx=position.x-raw.x,dz=position.z-raw.z,dist=Math.hypot(dx,dz);if(dist<.15||dist>2.05)return;
   const fx=-Math.sin(raw.yaw||0),fz=-Math.cos(raw.yaw||0),dot=(dx/dist)*fx+(dz/dist)*fz;if(dot<.12)return;
   if(!registerHit(t))return;
   const push=hitsTaken===0?.96:.62,nx=position.x+dx/dist*push,nz=position.z+dz/dist*push;if(canMove(nx,position.z))position.x=nx;if(canMove(position.x,nz))position.z=nz;
 }
 function tryRemoteShot(raw,v,t){
   const weapon=ensureAvatarGun(v),seq=Number.isSafeInteger(raw.shotSeq)?raw.shotSeq:0;weapon.holder.visible=raw.gun===true;
   if(weapon.lastSeq===null){weapon.lastSeq=seq;return;}if(seq<=weapon.lastSeq)return;weapon.lastSeq=seq;weapon.flashUntil=t+100;weapon.recoilUntil=t+120;
   if(!weapon.holder.visible)return;
   // The shooter is the only authority for gun hits. The receiver never reconstructs
   // the shot from its own delayed/interpolated view, which previously caused false hits.
   const cp=Math.cos(Number(raw.pitch)||0),dir=new THREE.Vector3(-Math.sin(raw.yaw||0)*cp,Math.sin(Number(raw.pitch)||0),-Math.cos(raw.yaw||0)*cp).normalize(),origin=new THREE.Vector3(raw.x,1.48,raw.z);
   const dx=position.x-raw.x,dz=position.z-raw.z,dist=Math.hypot(dx,dz);spawnTracer(origin,dir,Math.min(16,Math.max(5,dist||12)));
   const targetId=typeof raw.shotTarget==='string'?raw.shotTarget:'';
   if(!targetId||targetId!==state.self)return;
   if(dist<.35||dist>18)return;
   if(!registerHit(t,230,true))return;
   const push=.28,nx=position.x+dx/dist*push,nz=position.z+dz/dist*push;if(canMove(nx,position.z))position.x=nx;if(canMove(position.x,nz))position.z=nz;
 }
 function frame(t){
   if(stopped)return;raf=requestAnimationFrame(frame);if(document.hidden||!assetsReady||graphicsLost||gameScreen.opened){last=t;return;}if(!budget.shouldRender(t,resizePending))return;const began=performance.now();applyResize();
   const dt=Math.min((t-last)/1000,.05);last=t;
   const knocked=isKnocked(t),controlsLocked=knocked;
   let forward=controlsLocked?0:(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stickInput.y;
   let side=controlsLocked?0:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')?1:0)+stickInput.x;
   const scale=Math.max(1,Math.hypot(forward,side));forward/=scale;side/=scale;
   const speed=controlsLocked?0:(sprint?4.2:2.4);
   const x=position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,z=position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
   if(canMove(x,position.z))position.x=x;if(canMove(position.x,z))position.z=z;
   const fightHere=inFightArea(position.x,position.z),shootHere=inShootArea(position.x,position.z);
   const nearBat=!heldBat&&!heldGun&&!knocked&&fightHere&&nearestBatDistance()<1.55,nearGun=!heldBat&&!heldGun&&!knocked&&shootHere&&nearestGunDistance()<1.45;
   fightAction.hidden=knocked||(!heldBat&&!heldGun&&!nearBat&&!nearGun);fightAction.dataset.mode=heldGun?'gun':(heldBat?'swing':'pickup');fightAction.textContent=heldGun?'TIRER':heldBat?'FRAPPER':nearGun?'RAMASSER PISTOLET':'RAMASSER BATTE';runButton.disabled=controlsLocked;
   if(t-lastSend>100){updateLobbyPose({...position,yaw,pitch,bat:heldBat,gun:heldGun,swingSeq,shotSeq,shotTarget:lastShotTarget,down:knocked});lastSend=t;}
   for(const [id,v] of avatars){syncHeadCamera(id,v);const p=lobbyPose(id);if(!p)continue;tryRemoteHit(p,v,t);tryRemoteShot(p,v,t);v.track.push(p,t);const pose=v.track.at(t);if(pose){animateAvatar(v,{...pose,dead:p.down===true},dt);if(p.down===true)v.cameraHead.position.set(1.62,.20,-.025);else v.cameraHead.position.set(0,1.72,-.025);orientAvatarCamera(v,{x:position.x,y:1.65,z:position.z});poseRemoteBat(v,p,t);poseRemoteGun(v,p,t);}}
   const fallIn=knocked?clamp((t-knockStarted)/260,0,1):0,fallOut=knocked?clamp((knockedUntil-t)/430,0,1):0,fall=knocked?Math.min(fallIn,fallOut):0;
   camera.position.set(position.x,1.65-1.03*fall,position.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch+.12*fall;camera.rotation.z=-1.05*fall;
   if(localBat.visible){
     let ox=.52,oy=-.37,oz=-.72,rz=-.72,rx=.38,ry=.08;
     if(swingStarted){
       const k=Math.min(1,(t-swingStarted)/460);
       if(k<.16){
         const w=smooth(k/.16);ox=lerp(.52,.56,w);oy=lerp(-.37,-.34,w);oz=lerp(-.72,-.74,w);rz=lerp(-.72,-1.16,w);rx=lerp(.38,.52,w);ry=lerp(.08,.13,w);
       }else if(k<.50){
         const s=smooth((k-.16)/.34);ox=lerp(.56,.46,s);oy=lerp(-.34,-.42,s);oz=lerp(-.74,-.58,s);rz=lerp(-1.16,.86,s);rx=lerp(.52,-.50,s);ry=lerp(.13,-.14,s);
       }else if(k<.62){
         ox=.46;oy=-.42;oz=-.58;rz=.86;rx=-.50;ry=-.14;
       }else{
         // Drop the bat slightly out of view while resetting, so recovery is not a second hit.
         const r=smooth((k-.62)/.38),arc=Math.sin(r*Math.PI);
         ox=lerp(.46,.52,r)+.20*arc;oy=lerp(-.42,-.37,r)-.68*arc;oz=lerp(-.58,-.72,r)+.08*arc;
         rz=lerp(.86,-.72,r);rx=lerp(-.50,.38,r)+.18*arc;ry=lerp(-.14,.08,r)+.28*arc;
       }
       if(k>=1)swingStarted=0;
     }
     batOffset.set(ox,oy,oz).applyQuaternion(camera.quaternion);localBat.position.copy(camera.position).add(batOffset);localBat.quaternion.copy(camera.quaternion);localBat.rotateZ(rz);localBat.rotateX(rx);localBat.rotateY(ry);
   }
   if(localGun.visible){
     const recoil=shotStarted?Math.max(0,1-(t-shotStarted)/150):0;gunOffset.set(.36,-.29,-.69+.09*recoil).applyQuaternion(camera.quaternion);localGun.position.copy(camera.position).add(gunOffset);localGun.quaternion.copy(camera.quaternion);localGun.rotateY(-.025);localGun.rotateX(.015+.10*recoil);localGun.userData.flash.visible=!!shotStarted&&t-shotStarted<90;if(localGun.userData.slide)localGun.userData.slide.position.z=.085*recoil;if(shotStarted&&t-shotStarted>175){shotStarted=0;localGun.userData.flash.visible=false;if(localGun.userData.slide)localGun.userData.slide.position.z=0;}
   }
   for(let i=tracers.length-1;i>=0;i--){const item=tracers[i],left=(item.end-t)/140;if(item.line.material){item.line.material.opacity=clamp(left,0,1);if(item.impact)item.line.scale.setScalar(1+(1-left)*2);}if(t>=item.end){scene.remove(item.line);item.line.geometry?.dispose?.();item.line.material?.dispose?.();tracers.splice(i,1);}}
   if(crossHitUntil&&t>=crossHitUntil){crossHitUntil=0;crosshair?.classList.remove('is-hit');}
   if(hitUntil&&t>=hitUntil){hitUntil=0;fightHit.hidden=true;fightHit.textContent='TOUCHÉ !';}
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
  const setSprint=value=>{sprint=isKnocked(performance.now())?false:!!value;if(runButton){runButton.setAttribute('aria-pressed',String(sprint));runButton.setAttribute('aria-label',sprint?'Arrêter de courir':'Courir');runButton.textContent=sprint?'COURSE…':'COURIR';}};
  listen(runButton,'pointerdown',e=>{e.preventDefault();if(sprintToggle){setSprint(!sprint);return;}runButton.setPointerCapture?.(e.pointerId);});
  listen(runButton,'pointerup',()=>{if(!sprintToggle)setSprint(false);});
  listen(runButton,'pointercancel',()=>{if(!sprintToggle)setSprint(false);});
  listen(runButton,'lostpointercapture',()=>{if(!sprintToggle)setSprint(false);});
  const movement=['KeyW','KeyA','KeyS','KeyD','KeyZ','KeyQ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  listen(window,'keydown',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();setSprint(true);}else if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);}else if(e.code==='KeyF'&&!fightAction.hidden){e.preventDefault();if(!e.repeat)useFightAction();}else if(e.code==='KeyE'){e.preventDefault();gameScreen.open();}else if(e.code==='Escape')close();});listen(window,'keyup',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight')setSprint(false);else keys.delete(e.code);});listen(window,'blur',()=>{keys.clear();stopStick();look=null;setSprint(false);});listen(document,'visibilitychange',()=>{keys.clear();stopStick();setSprint(false);last=performance.now();budget.reset();});
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



