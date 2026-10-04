import {prepareScene} from './three17-r46-warmup.js?v=lobby-fight-casino-v73';
import {createGameScreen} from './one-lobby-r46-screen.js?v=lobby-fight-casino-v73';

import * as THREE from './three.module.js?v=lobby-fight-casino-v73';
import {buildRoom} from './one-lobby-r46-room.js?v=lobby-fight-casino-v73';
import {createAvatar,animateAvatar,orientAvatarCamera} from './three17-r44-avatar.js?v=lobby-fight-casino-v73';
import {createRenderBudget} from './three17-r46-render.js?v=lobby-fight-casino-v73';

import {lobbyState,subscribeLobby,joinLobby,leaveLobby,startRound,setLobbyReady,updateLobbyPose,lobbyPose} from './three17-r46-coop.js?v=lobby-fight-casino-v73';
let active=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
const lerp=(a,b,t)=>a+(b-a)*t;
function open(ctx={}){
 if(active){active.shell.focus();return;}
 const shell=document.createElement('section');shell.className='one3d-shell';shell.tabIndex=-1;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Lobby 3D partagé');
 shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small data-room></small></div><button type="button" data-close aria-label="Quitter le lobby 3D">Quitter</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">3:17 · 2–4 JOUEURS</div></div><button class="one3d-screen-button" data-screen-open>✦ Choisir un jeu</button><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Glisser pour regarder"></div><button class="one3d-run" type="button" data-run aria-pressed="false">COURIR</button><button class="one3d-fight-action" type="button" data-fight-action hidden>RAMASSER BATTE</button><div class="one3d-fight-hit" data-fight-hit hidden>TOUCHÉ !</div></div><footer class="one3d-bottom"><div class="one3d-session" data-collapsed="true"><button class="one3d-panel-toggle" type="button" data-panel-toggle aria-expanded="false" aria-label="Afficher les commandes du salon">+</button><span class="one3d-eyebrow">3:17 · FOUR</span><p data-status role="status">Connexion au salon…</p><div class="one3d-actions"><button type="button" data-ready disabled>Je suis prêt</button><button type="button" data-start disabled>Lancer 3:17</button></div><button type="button" data-reconnect>Réessayer la connexion</button></div></footer><p class="one3d-controls">ZQSD / WASD · flèches · glisser pour regarder · Maj courir · F bagarre · G machine</p>`;
 document.body.append(shell);shell.focus();
 const fightStyle=document.createElement('style');fightStyle.textContent=`
 .one3d-fight-action{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(174px,calc(env(safe-area-inset-bottom) + 170px));z-index:18;min-width:150px;min-height:50px;padding:9px 16px;border:1px solid #ff91b5;border-radius:17px;background:linear-gradient(135deg,#6e274a,#a33d67);color:#fff7fb;font:850 12px/1 system-ui;letter-spacing:.045em;box-shadow:0 8px 22px #0006,inset 0 1px #fff3;touch-action:manipulation;pointer-events:auto;-webkit-tap-highlight-color:transparent}
 .one3d-fight-action[data-mode="pickup"]{border-color:#cab2ff;background:linear-gradient(135deg,#45306c,#7652a8)}
 .one3d-fight-action:active{transform:scale(.94)}
 .one3d-fight-hit{position:absolute;inset:0;z-index:16;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle,#ff406522 0 18%,#ff204411 38%,transparent 72%);box-shadow:inset 0 0 50px #ff325a99;color:#fff;font:900 clamp(25px,7vw,56px)/1 system-ui;text-shadow:0 4px 18px #28000b}
 .one3d-fight-hit[hidden],.one3d-fight-action[hidden]{display:none!important}
 @media(max-height:520px){.one3d-fight-action{bottom:max(166px,calc(env(safe-area-inset-bottom) + 162px));right:12px;min-height:44px;min-width:142px;font-size:11px}}
 `;shell.append(fightStyle);
 const casinoStyle=document.createElement('style');casinoStyle.textContent=`
 .one3d-casino-action{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(236px,calc(env(safe-area-inset-bottom) + 232px));z-index:18;min-width:154px;min-height:50px;padding:9px 16px;border:1px solid #f3d579;border-radius:17px;background:linear-gradient(135deg,#69501d,#aa832d);color:#fff9df;font:850 12px/1 system-ui;letter-spacing:.045em;box-shadow:0 8px 22px #0007,inset 0 1px #fff4;touch-action:manipulation;pointer-events:auto}
 .one3d-casino-action:active{transform:scale(.94)}.one3d-casino-action[hidden]{display:none!important}
 .one3d-casino-panel{position:absolute;inset:54px 12px 16px;z-index:40;display:grid;place-items:center;background:#080a12c9;backdrop-filter:blur(7px);pointer-events:auto;border-radius:20px}.one3d-casino-panel[hidden]{display:none!important}
 .one3d-casino-card{width:min(560px,94%);max-height:92%;overflow:auto;padding:18px;border:1px solid #c9ab61;border-radius:22px;background:linear-gradient(145deg,#232033,#10151f);box-shadow:0 22px 60px #000b;color:#f8f2e5}
 .one3d-casino-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.one3d-casino-head b{color:#f2d27a;font-size:18px}.one3d-casino-close{width:38px;height:38px;border:1px solid #756548;border-radius:12px;background:#302b37;color:#fff;font-size:22px}
 .one3d-casino-machine-name{text-align:center;font:900 19px system-ui;letter-spacing:.08em;color:#ffe49a;margin:8px 0 4px}
 .one3d-casino-native{width:min(100%,470px);margin:10px auto;text-align:center;color:#f8f2e5}.one3d-casino-native .oneSlotsMachine{width:100%}
 .one3d-casino-native .slotMarquee{margin:0 0 8px;padding:12px 4px;letter-spacing:3px;border-radius:20px 20px 4px 4px;color:#fff0a7;font-weight:bold;font-size:18px;background:radial-gradient(ellipse,#562753,#15152b);text-shadow:0 2px #4c231b,0 0 14px #e6b942}
 .one3d-casino-native .oneSlotMeters{display:grid;grid-template-columns:1.4fr 1fr;gap:7px;margin-bottom:10px}.one3d-casino-native .oneSlotMeters>div{border:2px ridge #ccaa62;border-radius:8px;padding:8px 2px;background:linear-gradient(#182043,#060915);box-shadow:inset 0 0 16px #3255c755}.one3d-casino-native .oneSlotMeters small{display:block;color:#e6c879;font-size:9px;letter-spacing:1px}.one3d-casino-native .oneSlotMeters strong{font:700 22px Georgia;color:#fff0b8;text-shadow:0 0 10px #eaba4855}
 .one3d-casino-native .oneSlotsBoard{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;position:relative;margin:0 auto 10px;max-width:460px;padding:7px;background:#100915;border:2px solid #d6b76d;border-radius:14px;box-shadow:inset 0 4px 10px #000,0 3px 0 #f0d79655;overflow:hidden}.one3d-casino-native .oneSlotColumn{display:grid;grid-template-rows:repeat(3,1fr);overflow:hidden;border-radius:8px;background:#f5e5bd;box-shadow:inset 3px 0 6px #5b431e99;position:relative;perspective:500px;container-type:inline-size}.one3d-casino-native .oneSlotCell{display:grid;place-items:center;aspect-ratio:1.2;font-size:clamp(21px,5vw,44px);color:#9c2340;font-weight:900;line-height:1;border-bottom:1px solid #967e5155;background:linear-gradient(110deg,#cebb8d,#fff3d4 35%,#f6e5b8 70%,#bfa878);text-shadow:0 3px 2px #0003;position:relative}.one3d-casino-native .oneSlotCell.isWinning{background:radial-gradient(circle,#fffceb,#ffe599);box-shadow:inset 0 0 0 2px #ffef99,inset 0 0 20px #f0ad37;animation:oneSlotWin .9s ease-out both}
 .one3d-casino-native .oneSlotDrum{position:absolute;left:0;right:0;top:50%;height:33.333%;margin-top:-16.666%;transform-style:preserve-3d;animation:oneCylinderSpin .55s linear infinite;z-index:2}.one3d-casino-native .oneSlotDrumFace{position:absolute;inset:0;display:grid;place-items:center;backface-visibility:hidden;font-size:clamp(22px,5vw,44px);font-weight:900;color:#a12845;background:linear-gradient(90deg,#c6b187,#fff2cf 40%,#d3be93);border:1px solid #ab956c;box-sizing:border-box;transform:rotateX(var(--face-angle)) translateZ(125cqw);text-shadow:0 3px 3px #0003}.one3d-casino-native .isSpinning .oneSlotColumn:not(.reelStopped) .oneSlotCell{visibility:hidden}.one3d-casino-native .isSpinning .oneSlotColumn.reelStopped .oneSlotCell{visibility:visible;animation:oneReelStopBounce .28s ease-out both}.one3d-casino-native .oneSlotColumn.reelStopped .oneSlotDrum{display:none}.one3d-casino-native .oneSlotDrum.isBraking{animation-duration:1.1s;filter:blur(.3px)}.one3d-casino-native .oneSlotColumn::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(#0006,transparent 24%,transparent 76%,#0006);z-index:3;border-radius:7px}
 .one3d-casino-native .oneSlotSpecial{display:grid;place-items:center;height:100%;width:100%;font:900 clamp(10px,2.7vw,22px) Georgia;letter-spacing:-1px;text-shadow:0 2px #491346;background:radial-gradient(ellipse,#ebbd63,#ab5627 55%,#39131b);color:#fff4b4;box-shadow:inset 0 0 0 4px #bd9454,inset 0 0 0 6px #efdc9a}.one3d-casino-native .oneSlotSpecial.wild{background:radial-gradient(ellipse,#e768f4,#7133ab 60%,#1b173c);color:#fff1a1}.one3d-casino-native .oneSlotSpecial.bonus{border-radius:50%;width:90%;height:90%;margin:5%;font-size:clamp(9px,2.5vw,18px)}
 .one3d-casino-native .oneSlotArt{display:block;width:100%;height:100%;background-image:url('ui/one-slot-symbols-real.png?v=014117');background-size:300% 200%;background-repeat:no-repeat;mix-blend-mode:screen;filter:saturate(1.35) brightness(1.12)}.one3d-casino-native .oneSlotCell.isWinning .oneSlotArt{filter:brightness(1.15) saturate(1.25)}
 .one3d-casino-native .oneSlotLines{position:absolute;inset:7px;width:calc(100% - 14px);height:calc(100% - 14px);pointer-events:none;overflow:visible}.one3d-casino-native .oneSlotLines polyline{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 3px #231028);stroke-dasharray:900;animation:oneSlotTrace 1s ease-out both}.one3d-casino-native .oneSlotDashboard{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.one3d-casino-native .oneSlotDashboard>div{border:1px solid #9e884e;border-radius:5px;background:#050709;padding:6px 2px}.one3d-casino-native .oneSlotDashboard small{display:block;font-size:9px;color:#c7c2ab}.one3d-casino-native .oneSlotDashboard strong{font:18px ui-monospace,monospace;color:#f4d889}.one3d-casino-native .oneSlotWins,.one3d-casino-native .oneSlotsRules{display:none}.one3d-casino-native .oneBonusBanner{margin:8px;padding:10px;border:2px solid #f0d27b;background:linear-gradient(90deg,#57325e,#302958);color:#fff1aa;font-weight:900;animation:oneBonusGlow 1.2s ease-in-out 3 alternate}
 .one3d-casino-native .oneJackpotCelebration{position:relative;overflow:hidden;padding:22px 8px;margin:12px 0;border:3px ridge #ffdd87;border-radius:14px;background:radial-gradient(ellipse at center,#644422,#221332 70%);color:#ffe9a5;text-align:center;box-shadow:0 0 25px #e7b54a66}.one3d-casino-native .oneJackpotCelebration small,.one3d-casino-native .oneJackpotCelebration strong,.one3d-casino-native .oneJackpotCelebration b{position:relative;display:block;z-index:2}.one3d-casino-native .oneJackpotCelebration i{display:none}
 @keyframes oneCylinderSpin{from{transform:rotateX(0deg)}to{transform:rotateX(-360deg)}}@keyframes oneReelStopBounce{0%{transform:translateY(-8px)}65%{transform:translateY(3px)}100%{transform:translateY(0)}}@keyframes oneSlotWin{from{filter:brightness(1.35)}to{filter:brightness(1)}}@keyframes oneSlotTrace{from{stroke-dashoffset:900}to{stroke-dashoffset:0}}@keyframes oneBonusGlow{to{box-shadow:0 0 22px #ebc168;filter:brightness(1.2)}}
 .one3d-casino-result{min-height:42px;text-align:center;color:#f4db8d;font-weight:800}.one3d-casino-controls{display:flex;align-items:end;gap:10px;flex-wrap:wrap}.one3d-casino-controls label{display:grid;gap:5px;font-size:11px;color:#c8c4d1}.one3d-casino-controls select{min-height:43px;border:1px solid #806d4e;border-radius:11px;background:#171925;color:#fff;padding:8px 12px;font-size:15px}.one3d-casino-spin{flex:1;min-height:46px;border:1px solid #f0cf76;border-radius:12px;background:linear-gradient(135deg,#8b6821,#d1a53d);color:#1e1820;font-weight:900}.one3d-casino-spin:disabled{opacity:.5}.one3d-casino-balance{display:block;margin:10px 0;color:#c8c6ce;text-align:center}.one3d-casino-note{display:block;margin-top:10px;color:#8f96a7;text-align:center;font-size:10px}
 @media(max-width:600px){.one3d-casino-panel{inset:50px 8px 10px}.one3d-casino-card{padding:14px}.one3d-casino-native .oneSlotMeters strong{font-size:17px}.one3d-casino-native .slotMarquee{font-size:15px}}
 `;shell.append(casinoStyle);
 const stage=shell.querySelector('.one3d-stage'),chips=shell.querySelector('.one3d-players');
 const fightAction=shell.querySelector('[data-fight-action]'),fightHit=shell.querySelector('[data-fight-hit]');
 const casinoAction=document.createElement('button');casinoAction.type='button';casinoAction.className='one3d-casino-action';casinoAction.hidden=true;casinoAction.textContent='JOUER MACHINE';stage.append(casinoAction);
 const casinoPanel=document.createElement('section');casinoPanel.className='one3d-casino-panel';casinoPanel.hidden=true;casinoPanel.setAttribute('role','dialog');casinoPanel.setAttribute('aria-label','Machine à sous ONE Casino');casinoPanel.innerHTML=`<div class="one3d-casino-card"><header class="one3d-casino-head"><b>ONE CASINO</b><button type="button" class="one3d-casino-close" data-casino-close aria-label="Fermer">×</button></header><div class="one3d-casino-machine-name" data-casino-name>GOLDEN ONE</div><small class="one3d-casino-balance" data-casino-balance>Chargement des Points ONE…</small><div class="one3d-casino-native" data-casino-native></div><p class="one3d-casino-result" data-casino-result>Approche une machine et lance les rouleaux.</p><div class="one3d-casino-controls"><label>Mise<select data-casino-stake><option value="10">10 Points</option><option value="25">25 Points</option><option value="50">50 Points</option><option value="100">100 Points</option></select></label><button type="button" class="one3d-casino-spin" data-casino-spin>LANCER LES ROULEAUX</button></div><small class="one3d-casino-note">Même machine Golden Dragon que dans Points ONE.</small></div>`;stage.append(casinoPanel);
 const casinoName=casinoPanel.querySelector('[data-casino-name]'),casinoBalance=casinoPanel.querySelector('[data-casino-balance]'),casinoNative=casinoPanel.querySelector('[data-casino-native]'),casinoResult=casinoPanel.querySelector('[data-casino-result]'),casinoStake=casinoPanel.querySelector('[data-casino-stake]'),casinoSpin=casinoPanel.querySelector('[data-casino-spin]');
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
     fight.holder.position.set(.46,.40,-.12);fight.holder.rotation.set(-1.70,.02,.44);fight.bat.position.set(.02,.02,-.04);return;
   }
   // Rest pose: the handle is in the right hand while the barrel sits visibly over
   // the right shoulder. The pose is independent from the walk cycle.
   let armX=.72,armZ=-.12,px=.38,py=1.38,pz=-.22,rx=.64,ry=-.10,rz=-.28;
   if(fight.swingAt){
     const k=Math.min(1,(t-fight.swingAt)/500);
     if(k<.16){
       // Small wind-up from the shoulder.
       const w=smooth(k/.16);
       armX=lerp(.72,.92,w);armZ=lerp(-.12,-.03,w);
       px=lerp(.38,.42,w);py=lerp(1.38,1.48,w);pz=lerp(-.22,-.12,w);
       rx=lerp(.64,.42,w);ry=lerp(-.10,-.02,w);rz=lerp(-.28,-.46,w);
     }else if(k<.48){
       // One violent descending diagonal strike: shoulder -> chest -> down/front.
       const s=smooth((k-.16)/.32);
       armX=lerp(.92,.16,s);armZ=lerp(-.03,.46,s);
       px=lerp(.42,.22,s);py=lerp(1.48,1.02,s);pz=lerp(-.12,-.50,s);
       rx=lerp(.42,-1.92,s);ry=lerp(-.02,-.08,s);rz=lerp(-.46,.52,s);
     }else if(k<.60){
       armX=.16;armZ=.46;px=.22;py=1.02;pz=-.50;rx=-1.92;ry=-.08;rz=.52;
     }else{
       // Recover around the outside at low height, then return to the shoulder;
       // this cannot read as a second upward strike.
       const r=smooth((k-.60)/.40),arc=Math.sin(r*Math.PI);
       armX=lerp(.16,.72,r)-.12*arc;armZ=lerp(.46,-.12,r)+.08*arc;
       px=lerp(.22,.38,r)+.18*arc;py=lerp(1.02,1.38,r)-.20*arc;pz=lerp(-.50,-.22,r)-.08*arc;
       rx=lerp(-1.92,.64,r)-.14*arc;ry=lerp(-.08,-.10,r)+.04*arc;rz=lerp(.52,-.28,r)+.08*arc;
     }
     if(k>=1)fight.swingAt=0;
   }
   v.arms[1].rotation.x=armX;v.arms[1].rotation.z=armZ;
   fight.holder.position.set(px,py,pz);fight.holder.rotation.set(rx,ry,rz);
   fight.bat.position.set(.02,.02,-.04);
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
 const canMove=(x,z)=>{
   const inMain=Math.abs(x)<8.1&&Math.abs(z)<6.1&&!(Math.hypot(x,z)<1.6)&&!([-4.8,4.8].some(cx=>Math.abs(x-cx)<1.65&&z>-3.8&&z<-1.95));
   // Passage and room bounds deliberately overlap so there is no invisible strip at either doorway.
   const inLeftPass=x>-13.45&&x<-8.05&&Math.abs(z)<2.16;
   const inRightPass=x<13.45&&x>8.05&&Math.abs(z)<2.16;
   const casinoBounds=x>-22.2&&x<-12.45&&Math.abs(z)<5.6;
   const casinoBlocked=(x>-19.8&&x<-15.8&&z>-1.7&&z<1.7)||(z<-4.04&&x>-21.15&&x<-14.45)||(z>4.28&&x>-20.5&&x<-15.1);
   const inCasino=casinoBounds&&!casinoBlocked;
   const inFight=inFightArea(x,z);
   return inMain||inLeftPass||inRightPass||inCasino||inFight;
 };
 let heldBat=false,swingSeq=0,swingStarted=0,lastHitAt=0,hitUntil=0,lastFightPointerAt=0,hitsTaken=0,knockedUntil=0,knockStarted=0;
 const nearestBatDistance=()=>Math.min(...(roomVisual.fightBatSpots||[]).map(s=>Math.hypot(position.x-s.x,position.z-s.z)),99);
 const isKnocked=t=>t<knockedUntil;
 const setHeldBat=value=>{heldBat=!!value;localBat.visible=heldBat;if(!heldBat)swingStarted=0;};
 const publishPose=()=>updateLobbyPose({...position,yaw,pitch,bat:heldBat,swingSeq,down:isKnocked(performance.now())});
 // Once a bat is picked up it stays with the player throughout the whole lobby.
 const swingBat=()=>{const now=performance.now();if(!heldBat||isKnocked(now)||now-swingStarted<440)return;swingSeq++;swingStarted=now;publishPose();};
 const useFightAction=()=>{if(heldBat){swingBat();return;}if(inFightArea(position.x,position.z)&&nearestBatDistance()<1.55){setHeldBat(true);publishPose();}};
 const showFightMessage=(text,duration=300)=>{fightHit.textContent=text;fightHit.hidden=false;hitUntil=performance.now()+duration;};
 const registerHit=t=>{
   if(isKnocked(t)||t-lastHitAt<480)return false;
   lastHitAt=t;hitsTaken++;
   if(hitsTaken>=3){hitsTaken=0;knockStarted=t;knockedUntil=t+2600;setSprint(false);showFightMessage('À TERRE !',620);publishPose();}
   else showFightMessage(`TOUCHÉ · ${hitsTaken}/3`,300);
   return true;
 };
 // One physical press = one swing. Using pointerdown only avoids the delayed synthetic click
 // some mobile WebViews emit after pointerdown, which previously caused a second bat swing.
 fightAction.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();lastFightPointerAt=performance.now();useFightAction();});
 fightAction.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();});
 let casinoOpen=false,casinoBusy=false,casinoData=null,casinoMachineIndex=-1,casinoPending=null;
 const nearestCasinoMachine=()=>{
   let best={distance:99,spot:null};for(const spot of roomVisual.casinoMachineSpots||[]){const distance=Math.hypot(position.x-spot.x,position.z-spot.z);if(distance<best.distance)best={distance,spot};}return best;
 };
 const renderNativeSlots=(round,busy=false,bonusOverride=null,balanceOverride=null)=>{
   casinoNative.replaceChildren();
   if(typeof window.ONECasinoSlots!=='function'){casinoNative.textContent='Machine ONE indisponible.';return null;}
   const bonus=bonusOverride||casinoData?.slotBonus||{remaining:0,stake:10};
   const stake=Number(bonus?.remaining)>0?Number(bonus.stake||10):Number(casinoStake.value||10);
   const balance=balanceOverride??Number(casinoData?.balance||0);
   const machine=window.ONECasinoSlots(round,stake,busy,bonus,balance);casinoNative.append(machine);return machine;
 };
 const renderCasinoState=(message='')=>{
   const balance=Number(casinoData?.balance);const bonus=casinoData?.slotBonus||{remaining:0,stake:10};const free=Number(bonus.remaining)>0;
   casinoBalance.textContent=Number.isFinite(balance)?balance.toLocaleString('fr-FR')+' Points ONE'+(free?' · '+bonus.remaining+' tour'+(bonus.remaining>1?'s':'')+' gratuit'+(bonus.remaining>1?'s':''):''):'Connexion aux Points ONE…';
   casinoStake.disabled=casinoBusy||free;if(free)casinoStake.value=String(bonus.stake||10);casinoSpin.disabled=casinoBusy||!casinoData;
   casinoSpin.textContent=casinoBusy?'ROULEAUX EN COURS…':casinoPending?'RETROUVER LE RÉSULTAT':free?'TOUR GRATUIT':'LANCER LES ROULEAUX';
   if(message)casinoResult.textContent=message;
 };
 const closeCasino=()=>{if(casinoBusy)return;casinoOpen=false;casinoPanel.hidden=true;keys.clear();stickInput.x=stickInput.y=0;};
 async function loadCasinoState(){
   const api=window.ONEUI?.api;if(!api){casinoResult.textContent='Le service Points ONE n’est pas chargé.';casinoSpin.disabled=true;return;}
   casinoBusy=true;casinoNative.textContent='Connexion à ONE Casino…';renderCasinoState('Connexion à ONE Casino…');
   try{casinoData=await api('/points/state');window.ONEUpdateBalance?.(casinoData.balance);renderNativeSlots(casinoData.round?.kind==='slots'?casinoData.round:null,false);renderCasinoState('Choisis ta mise puis lance les rouleaux.');}
   catch(e){casinoNative.replaceChildren();casinoResult.textContent=e?.message||'ONE Casino est momentanément indisponible.';casinoData=null;}
   finally{casinoBusy=false;renderCasinoState();}
 }
 async function openCasinoMachine(spot){
   if(!spot||casinoOpen)return;casinoOpen=true;casinoMachineIndex=spot.index??0;casinoPanel.hidden=false;casinoName.textContent=spot.name||'ONE MACHINE';keys.clear();stickInput.x=stickInput.y=0;casinoNative.replaceChildren();casinoResult.textContent='Chargement…';await loadCasinoState();
 }
 async function spinCasino(){
   if(casinoBusy||!casinoData)return;const api=window.ONEUI?.api;if(!api)return;
   const beforeBonus=casinoData.slotBonus||{remaining:0,stake:10},free=Number(beforeBonus.remaining)>0,stake=free?Number(beforeBonus.stake||10):Number(casinoStake.value||10),beforeBalance=Number(casinoData.balance||0);
   if(!casinoPending)casinoPending={id:crypto.randomUUID(),kind:'slots',stake};
   casinoBusy=true;const spinningMachine=renderNativeSlots(null,true,beforeBonus,beforeBalance);renderCasinoState('Les rouleaux tournent…');
   try{
     const data=await api('/points/play','POST',casinoPending);const round=data.round?.kind==='slots'?data.round:null;
     if(round&&spinningMachine&&typeof window.ONEStopSlotReels==='function')await window.ONEStopSlotReels(spinningMachine,round);else await new Promise(r=>setTimeout(r,900));
     casinoPending=null;casinoData=data;window.ONEUpdateBalance?.(data.balance);renderNativeSlots(round,false);
     const payout=Number(round?.payout||0),result=round?.result||'Tirage terminé';renderCasinoState(result+(payout?' · +'+payout.toLocaleString('fr-FR')+' Points ONE':' · aucun gain'));
   }catch(e){
     renderNativeSlots(casinoData.round?.kind==='slots'?casinoData.round:null,false);if(Number(e?.status)>=400&&Number(e?.status)<500)casinoPending=null;renderCasinoState((e?.message||'Impossible de confirmer le tirage.')+(casinoPending?' · Retouche pour retrouver le même résultat.':''));
   }finally{casinoBusy=false;renderCasinoState();}
 }
 casinoAction.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const near=nearestCasinoMachine();if(near.distance<1.45)openCasinoMachine(near.spot);});casinoAction.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
 casinoPanel.querySelector('[data-casino-close]').addEventListener('click',closeCasino);casinoSpin.addEventListener('click',spinCasino);casinoPanel.addEventListener('pointerdown',e=>e.stopPropagation());casinoPanel.addEventListener('pointermove',e=>e.stopPropagation());
 function drawStatus(next){
   state=next;const key=JSON.stringify([next.room,next.self,next.host,next.notice,next.joined,next.ready,next.canStart,next.connecting,next.players]);if(key===statusKey)return;statusKey=key;
   shell.querySelector('[data-room]').textContent=next.room+' · '+next.players.length+'/4 · R73';
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
 function frame(t){
   if(stopped)return;raf=requestAnimationFrame(frame);if(document.hidden||!assetsReady||graphicsLost||gameScreen.opened){last=t;return;}if(!budget.shouldRender(t,resizePending))return;const began=performance.now();applyResize();
   const dt=Math.min((t-last)/1000,.05);last=t;
   const knocked=isKnocked(t),controlsLocked=knocked||casinoOpen;
   let forward=controlsLocked?0:(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stickInput.y;
   let side=controlsLocked?0:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')?1:0)+stickInput.x;
   const scale=Math.max(1,Math.hypot(forward,side));forward/=scale;side/=scale;
   const speed=controlsLocked?0:(sprint?4.2:2.4);
   const x=position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,z=position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
   if(canMove(x,position.z))position.x=x;if(canMove(position.x,z))position.z=z;
   const fightHere=inFightArea(position.x,position.z);
   const nearBat=!heldBat&&!knocked&&fightHere&&nearestBatDistance()<1.55;fightAction.hidden=casinoOpen||knocked||(!heldBat&&!nearBat);fightAction.dataset.mode=heldBat?'swing':'pickup';fightAction.textContent=heldBat?'FRAPPER':'RAMASSER BATTE';
   const nearMachine=nearestCasinoMachine(),canUseCasino=!knocked&&!casinoOpen&&nearMachine.distance<1.45;casinoAction.hidden=!canUseCasino;if(canUseCasino)casinoAction.textContent='JOUER · '+(nearMachine.spot?.name||'MACHINE');runButton.disabled=controlsLocked;
   if(t-lastSend>100){updateLobbyPose({...position,yaw,pitch,bat:heldBat,swingSeq,down:knocked});lastSend=t;}
   for(const [id,v] of avatars){syncHeadCamera(id,v);const p=lobbyPose(id);if(!p)continue;tryRemoteHit(p,v,t);v.track.push(p,t);const pose=v.track.at(t);if(pose){animateAvatar(v,{...pose,dead:p.down===true},dt);if(p.down===true)v.cameraHead.position.set(1.62,.20,-.025);else v.cameraHead.position.set(0,1.72,-.025);orientAvatarCamera(v,{x:position.x,y:1.65,z:position.z});poseRemoteBat(v,p,t);}}
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
  listen(window,'keydown',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();setSprint(true);}else if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);}else if(e.code==='KeyF'&&!fightAction.hidden){e.preventDefault();if(!e.repeat)useFightAction();}else if(e.code==='KeyG'&&!casinoAction.hidden){e.preventDefault();if(!e.repeat){const near=nearestCasinoMachine();openCasinoMachine(near.spot);}}else if(e.code==='KeyE'){e.preventDefault();gameScreen.open();}else if(e.code==='Escape'){if(casinoOpen)closeCasino();else close();}});listen(window,'keyup',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight')setSprint(false);else keys.delete(e.code);});listen(window,'blur',()=>{keys.clear();stopStick();look=null;setSprint(false);});listen(document,'visibilitychange',()=>{keys.clear();stopStick();setSprint(false);last=performance.now();budget.reset();});
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



