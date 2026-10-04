import {prepareScene} from './three17-r46-warmup.js?v=lobby-clean-casino-v78';
import {createGameScreen} from './one-lobby-r46-screen.js?v=lobby-clean-casino-v78';

import * as THREE from './three.module.js?v=lobby-clean-casino-v78';
import {buildRoom} from './one-lobby-r46-room.js?v=lobby-clean-casino-v78';
import {createAvatar,animateAvatar,orientAvatarCamera} from './three17-r44-avatar.js?v=lobby-clean-casino-v78';
import {createRenderBudget} from './three17-r46-render.js?v=lobby-clean-casino-v78';

import {lobbyState,subscribeLobby,joinLobby,leaveLobby,startRound,setLobbyReady,updateLobbyPose,lobbyPose} from './three17-r46-coop.js?v=lobby-clean-casino-v78';
let active=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
const lerp=(a,b,t)=>a+(b-a)*t;
function open(ctx={}){
 if(active){active.shell.focus();return;}
 const shell=document.createElement('section');shell.className='one3d-shell';shell.tabIndex=-1;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Lobby 3D partagé');
 shell.innerHTML=`<header class="one3d-top"><div><b>ONE · LOBBY 3D</b><small data-room></small></div><button type="button" data-close aria-label="Quitter le lobby 3D">Quitter</button></header><div class="one3d-stage"><div class="one3d-hud"><div class="one3d-players"></div><div class="one3d-game">3:17 · 2–4 JOUEURS</div></div><button class="one3d-screen-button" data-screen-open>✦ Choisir un jeu</button><div class="one3d-cross"></div><div class="one3d-stick" aria-label="Joystick de déplacement"><div class="one3d-knob"></div></div><div class="one3d-look" aria-label="Glisser pour regarder"></div><button class="one3d-run" type="button" data-run aria-pressed="false">COURIR</button><button class="one3d-fight-action" type="button" data-fight-action hidden>RAMASSER BATTE</button><div class="one3d-fight-hit" data-fight-hit hidden>TOUCHÉ !</div></div><footer class="one3d-bottom"><div class="one3d-session" data-collapsed="true"><button class="one3d-panel-toggle" type="button" data-panel-toggle aria-expanded="false" aria-label="Afficher les commandes du salon">+</button><span class="one3d-eyebrow">3:17 · FOUR</span><p data-status role="status">Connexion au salon…</p><div class="one3d-actions"><button type="button" data-ready disabled>Je suis prêt</button><button type="button" data-start disabled>Lancer 3:17</button></div><button type="button" data-reconnect>Réessayer la connexion</button></div></footer><p class="one3d-controls">ZQSD / WASD · flèches · glisser pour regarder · Maj courir · F bagarre · G casino</p>`;
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
 .one3d-casino-action{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(236px,calc(env(safe-area-inset-bottom) + 232px));z-index:18;min-width:146px;min-height:48px;padding:9px 16px;border:1px solid #efd67b;border-radius:16px;background:linear-gradient(135deg,#6f541e,#b88a2d);color:#fff9df;font:900 12px/1 system-ui;letter-spacing:.05em;box-shadow:0 10px 26px #0007,inset 0 1px #fff4;touch-action:manipulation;pointer-events:auto}.one3d-casino-action:active{transform:scale(.96)}.one3d-casino-action[hidden]{display:none!important}
 .one3d-casino-panel{position:absolute;inset:54px 10px 12px;z-index:40;display:grid;place-items:center;background:rgba(7,9,14,.76);backdrop-filter:blur(9px);pointer-events:auto}.one3d-casino-panel[hidden]{display:none!important}
 .one3d-casino-card,.one3d-table-card{width:min(760px,96vw);max-height:min(92vh,760px);overflow:auto;padding:18px 18px 16px;border:1px solid #cfb469;border-radius:22px;background:linear-gradient(180deg,#1e2230,#111520 72%);box-shadow:0 26px 70px #000c;color:#f8f2e5}
 .one3d-table-card{width:min(860px,96vw)}
 .one3d-casino-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}.one3d-casino-head b{color:#f4d87d;font-size:18px;letter-spacing:.06em}.one3d-casino-close{width:40px;height:40px;border:1px solid #73654a;border-radius:12px;background:#2b3040;color:#fff;font-size:24px}
 .one3d-casino-machine-name{text-align:center;font:900 22px system-ui;letter-spacing:.10em;color:#ffe49a;margin:6px 0}.one3d-casino-balance{display:block;text-align:center;color:#d9c79a;font:700 13px/1.35 system-ui;margin-bottom:10px}
 .one3d-casino-native{width:min(100%,560px);margin:10px auto 6px;color:#f8f2e5}.one3d-casino-native .oneSlotsMachine{width:100%}
 .one3d-casino-native .slotMarquee{margin:0 0 10px;padding:12px 8px;border-radius:18px 18px 6px 6px;color:#fff0a7;font:900 18px/1 system-ui;letter-spacing:2px;background:radial-gradient(ellipse,#5f2d5d,#17182f);text-shadow:0 2px #4c231b,0 0 14px #e6b942}
 .one3d-casino-native .oneSlotMeters{display:grid;grid-template-columns:1.2fr 1fr;gap:8px;margin-bottom:10px}.one3d-casino-native .oneSlotMeters>div{border:1px solid #caa85a;border-radius:10px;padding:8px 6px;background:linear-gradient(#1b2343,#090d18);box-shadow:inset 0 0 16px #2742a844}.one3d-casino-native .oneSlotMeters small{display:block;color:#e6c879;font-size:10px;letter-spacing:1px}.one3d-casino-native .oneSlotMeters strong{font:800 22px/1 Georgia;color:#fff0b8;text-shadow:0 0 10px #eaba4855}
 .one3d-casino-native .oneSlotsBoard{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;position:relative;margin:0 auto 10px;max-width:540px;padding:10px;background:#0f1118;border:2px solid #d7b86b;border-radius:16px;box-shadow:inset 0 4px 12px #000,0 3px 0 #f0d79655;overflow:hidden}.one3d-casino-native .oneSlotColumn{display:grid;grid-template-rows:repeat(3,1fr);overflow:hidden;border-radius:10px;background:#f7ead0;box-shadow:inset 3px 0 6px #5b431e66;position:relative;perspective:500px;container-type:inline-size}.one3d-casino-native .oneSlotCell{display:grid;place-items:center;aspect-ratio:1.08;font-size:clamp(26px,5vw,48px);color:#922342;font-weight:900;line-height:1;border-bottom:1px solid #967e5155;background:linear-gradient(110deg,#cfbd93,#fff6dc 35%,#f8ebc9 70%,#c4af84);text-shadow:0 2px 2px #0002;position:relative}.one3d-casino-native .oneSlotCell.isWinning{background:radial-gradient(circle,#fffceb,#ffe599);box-shadow:inset 0 0 0 2px #ffef99,inset 0 0 20px #f0ad37;animation:oneSlotWin .9s ease-out both}
 .one3d-casino-native .oneSlotDrum{position:absolute;left:0;right:0;top:50%;height:33.333%;margin-top:-16.666%;transform-style:preserve-3d;animation:oneCylinderSpin .55s linear infinite;z-index:2}.one3d-casino-native .oneSlotDrumFace{position:absolute;inset:0;display:grid;place-items:center;backface-visibility:hidden;font-size:clamp(26px,5vw,48px);font-weight:900;color:#a12845;background:linear-gradient(90deg,#c6b187,#fff2cf 40%,#d3be93);border:1px solid #ab956c;box-sizing:border-box;transform:rotateX(var(--face-angle)) translateZ(125cqw);text-shadow:0 3px 3px #0003}.one3d-casino-native .isSpinning .oneSlotColumn:not(.reelStopped) .oneSlotCell{visibility:hidden}.one3d-casino-native .isSpinning .oneSlotColumn.reelStopped .oneSlotCell{visibility:visible;animation:oneReelStopBounce .28s ease-out both}.one3d-casino-native .oneSlotColumn.reelStopped .oneSlotDrum{display:none}.one3d-casino-native .oneSlotDrum.isBraking{animation-duration:1.1s;filter:blur(.3px)}.one3d-casino-native .oneSlotColumn::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(#0005,transparent 24%,transparent 76%,#0005);z-index:3;border-radius:9px}
 .one3d-casino-native .oneSlotSpecial{display:grid;place-items:center;height:100%;width:100%;font:900 clamp(11px,2.7vw,22px) Georgia;background:radial-gradient(ellipse,#ebbd63,#ab5627 55%,#39131b);color:#fff4b4;box-shadow:inset 0 0 0 4px #bd9454,inset 0 0 0 6px #efdc9a}.one3d-casino-native .oneSlotSpecial.wild{background:radial-gradient(ellipse,#e768f4,#7133ab 60%,#1b173c);color:#fff1a1}.one3d-casino-native .oneSlotSpecial.bonus{border-radius:50%;width:90%;height:90%;margin:5%;font-size:clamp(10px,2.4vw,18px)}
 .one3d-casino-native .oneSlotArt{display:block;width:100%;height:100%;background-image:url('ui/one-slot-symbols-real.png?v=014117');background-size:300% 200%;background-repeat:no-repeat;filter:saturate(1.15) brightness(1.03)}
 .one3d-casino-native .oneSlotLines{position:absolute;inset:10px;width:calc(100% - 20px);height:calc(100% - 20px);pointer-events:none;overflow:visible}.one3d-casino-native .oneSlotLines polyline{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 3px #231028);stroke-dasharray:900;animation:oneSlotTrace 1s ease-out both}
 .one3d-casino-native .oneSlotDashboard{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:10px 0}.one3d-casino-native .oneSlotDashboard button{min-height:48px;border:1px solid #8d7241;border-radius:12px;background:linear-gradient(#3b4458,#1c2231);color:#fff;font:900 14px/1 system-ui;letter-spacing:.04em}
 .one3d-casino-controls{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}.one3d-casino-controls label{display:grid;gap:5px;color:#dbc798;font:800 13px/1.2 system-ui}.one3d-casino-controls select,.one3d-casino-controls button{min-height:46px;border:1px solid #8c7544;border-radius:12px;background:#171b24;color:#fff;padding:0 14px;font:900 14px/1 system-ui}.one3d-casino-controls button{background:linear-gradient(135deg,#6f541e,#b88a2d);color:#fff9df;min-width:220px}
 .one3d-casino-result,.one3d-table-status{margin:12px auto 0;padding:10px 12px;border:1px solid #63543b;border-radius:12px;background:#141924;color:#f7e7ba;text-align:center;font:800 13px/1.45 system-ui}.one3d-casino-note{display:block;margin-top:8px;text-align:center;color:#b8ac91;font-size:12px}
 .one3d-table-body{display:grid;gap:12px}.one3d-table-toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.one3d-table-toolbar label{display:grid;gap:5px;color:#dbc798;font:800 13px/1.2 system-ui}.one3d-table-toolbar select{min-height:44px;border:1px solid #8c7544;border-radius:12px;background:#171b24;color:#fff;padding:0 12px;font:900 14px/1 system-ui}
 .one3d-table-action{min-height:46px;padding:0 15px;border:1px solid #856d40;border-radius:12px;background:linear-gradient(#34425a,#212936);color:#fff;font:900 13px/1 system-ui}.one3d-table-action:disabled{opacity:.45}
 .one3d-blackjack-felt{display:grid;gap:12px;padding:14px;border:1px solid #4f7045;border-radius:18px;background:radial-gradient(circle at 50% 20%,#2a7a58,#164534 68%,#13372c)}.one3d-bj-side{display:grid;gap:8px}.one3d-bj-side strong{display:flex;justify-content:space-between;align-items:center;color:#f6ecbf;font-size:14px;letter-spacing:.03em}.one3d-bj-cards{display:flex;gap:10px;flex-wrap:wrap}.one3d-bj-card{display:grid;place-items:center;width:70px;height:96px;border-radius:12px;border:2px solid #d7d2ca;background:#f9f7f1;color:#111;font:900 28px/1 Georgia;box-shadow:0 8px 20px #0003}.one3d-bj-card.red{color:#be274a}.one3d-bj-card.back{background:linear-gradient(135deg,#33214f,#15172b);color:#ffea9f}
 .one3d-roulette-result{display:grid;place-items:center;min-width:66px;min-height:66px;padding:0 10px;border-radius:999px;border:2px solid #f4d888;color:#fff;font:900 26px/1 system-ui;box-shadow:0 8px 20px #0003}.one3d-roulette-result.red{background:#a02d44}.one3d-roulette-result.black{background:#1d2026}.one3d-roulette-result.green{background:#2e8859}
 .one3d-roulette-bets{display:grid;grid-template-columns:repeat(6,minmax(56px,1fr));gap:8px}.one3d-roulette-bets button{min-height:48px;padding:6px;border:1px solid #7e6e49;border-radius:12px;background:#232734;color:#fff;font:900 13px/1.05 system-ui}.one3d-roulette-bets button.red{background:#8f2940}.one3d-roulette-bets button.black{background:#17171d}.one3d-roulette-bets button.green{background:#267a50}.one3d-roulette-bets button.has-bet{box-shadow:inset 0 0 0 2px #f3d375,0 0 0 2px #f3d37555}.one3d-bet-summary{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;color:#ddcead;font-size:13px}
 .one3d-casino-world-status{position:absolute;left:50%;top:72px;transform:translateX(-50%);z-index:18;max-width:min(72%,520px);padding:8px 13px;border:1px solid #c8aa61;border-radius:12px;background:#121520e8;color:#f8e3a1;font:800 12px/1.25 system-ui;text-align:center;pointer-events:none}.one3d-casino-world-status[hidden]{display:none!important}
 @media (orientation:landscape) and (max-height:640px){.one3d-casino-panel{inset:48px 8px 8px}.one3d-casino-card,.one3d-table-card{max-height:88vh;padding:14px}.one3d-casino-native{max-width:520px}.one3d-bj-card{width:58px;height:82px;font-size:24px}.one3d-roulette-bets{grid-template-columns:repeat(8,minmax(48px,1fr));gap:6px}.one3d-casino-controls button{min-width:180px}}
 @media(max-width:640px){.one3d-casino-card,.one3d-table-card{padding:14px 12px}.one3d-casino-head b{font-size:16px}.one3d-casino-machine-name{font-size:18px}.one3d-bj-card{width:58px;height:82px;font-size:24px}.one3d-roulette-result{min-width:58px;min-height:58px;font-size:22px}.one3d-roulette-bets{grid-template-columns:repeat(4,minmax(0,1fr))}.one3d-casino-controls{display:grid;grid-template-columns:1fr;}.one3d-casino-controls button{width:100%}}
 `;shell.append(casinoStyle);
 const stage=shell.querySelector('.one3d-stage'),chips=shell.querySelector('.one3d-players');
 const fightAction=shell.querySelector('[data-fight-action]'),fightHit=shell.querySelector('[data-fight-hit]');
 const casinoAction=document.createElement('button');casinoAction.type='button';casinoAction.className='one3d-casino-action';casinoAction.hidden=true;casinoAction.textContent='JOUER';stage.append(casinoAction);
 const casinoWorldStatus=document.createElement('div');casinoWorldStatus.className='one3d-casino-world-status';casinoWorldStatus.hidden=true;stage.append(casinoWorldStatus);let casinoWorldStatusUntil=0;const showCasinoWorldStatus=(message,duration=1600)=>{casinoWorldStatus.textContent=message;casinoWorldStatus.hidden=false;casinoWorldStatusUntil=performance.now()+duration;};
 const casinoPanel=document.createElement('section');casinoPanel.className='one3d-casino-panel';casinoPanel.hidden=true;casinoPanel.setAttribute('role','dialog');casinoPanel.setAttribute('aria-label','Machine à sous ONE Casino');casinoPanel.innerHTML=`<div class="one3d-casino-card"><header class="one3d-casino-head"><b>ONE CASINO</b><button type="button" class="one3d-casino-close" data-casino-close aria-label="Fermer">×</button></header><div class="one3d-casino-machine-name" data-casino-name>GOLDEN ONE</div><small class="one3d-casino-balance" data-casino-balance>Chargement des Points ONE…</small><div class="one3d-casino-native" data-casino-native></div><p class="one3d-casino-result" data-casino-result>Interface casino refaite : choisis une mise puis joue.</p><div class="one3d-casino-controls"><label>Mise<select data-casino-stake><option value="10">10 Points</option><option value="25">25 Points</option><option value="50">50 Points</option><option value="100">100 Points</option></select></label><button type="button" class="one3d-casino-spin" data-casino-spin>LANCER LES ROULEAUX</button></div><small class="one3d-casino-note">Interface casino simple et lisible pour mobile.</small></div>`;stage.append(casinoPanel);
 const casinoName=casinoPanel.querySelector('[data-casino-name]'),casinoBalance=casinoPanel.querySelector('[data-casino-balance]'),casinoNative=casinoPanel.querySelector('[data-casino-native]'),casinoResult=casinoPanel.querySelector('[data-casino-result]'),casinoStake=casinoPanel.querySelector('[data-casino-stake]'),casinoSpin=casinoPanel.querySelector('[data-casino-spin]');
 const tableCasinoPanel=document.createElement('section');tableCasinoPanel.className='one3d-casino-panel';tableCasinoPanel.hidden=true;tableCasinoPanel.setAttribute('role','dialog');tableCasinoPanel.setAttribute('aria-label','Table ONE Casino');tableCasinoPanel.innerHTML=`<div class="one3d-table-card"><header class="one3d-casino-head"><b data-table-title>ONE CASINO</b><button type="button" class="one3d-casino-close" data-table-close aria-label="Fermer">×</button></header><small class="one3d-casino-balance" data-table-balance>Chargement des Points ONE…</small><div class="one3d-table-body" data-table-body></div><p class="one3d-table-status" data-table-status></p></div>`;stage.append(tableCasinoPanel);
 const tableTitle=tableCasinoPanel.querySelector('[data-table-title]'),tableBalance=tableCasinoPanel.querySelector('[data-table-balance]'),tableBody=tableCasinoPanel.querySelector('[data-table-body]'),tableStatus=tableCasinoPanel.querySelector('[data-table-status]');
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
     fight.holder.position.set(.44,.42,-.72);fight.holder.rotation.set(-1.66,-.08,.38);fight.bat.position.set(.02,.02,-.14);return;
   }
   // Rest pose: the handle is in the right hand while the barrel sits visibly over
   // the right shoulder. The pose is independent from the walk cycle.
   let armX=.72,armZ=-.12,px=.40,py=1.40,pz=-.82,rx=.60,ry=-.16,rz=-.24;
   if(fight.swingAt){
     const k=Math.min(1,(t-fight.swingAt)/500);
     if(k<.16){
       // Small wind-up from the shoulder.
       const w=smooth(k/.16);
       armX=lerp(.72,.92,w);armZ=lerp(-.12,-.03,w);
       px=lerp(.40,.44,w);py=lerp(1.40,1.50,w);pz=lerp(-.82,-.70,w);
       rx=lerp(.60,.40,w);ry=lerp(-.16,-.08,w);rz=lerp(-.24,-.44,w);
     }else if(k<.48){
       // One violent descending diagonal strike: shoulder -> chest -> down/front.
       const s=smooth((k-.16)/.32);
       armX=lerp(.92,.16,s);armZ=lerp(-.03,.46,s);
       px=lerp(.44,.24,s);py=lerp(1.50,1.03,s);pz=lerp(-.70,-.96,s);
       rx=lerp(.40,-1.90,s);ry=lerp(-.08,-.12,s);rz=lerp(-.44,.50,s);
     }else if(k<.60){
       armX=.16;armZ=.46;px=.24;py=1.03;pz=-.96;rx=-1.90;ry=-.12;rz=.50;
     }else{
       // Recover around the outside at low height, then return to the shoulder;
       // this cannot read as a second upward strike.
       const r=smooth((k-.60)/.40),arc=Math.sin(r*Math.PI);
       armX=lerp(.16,.72,r)-.12*arc;armZ=lerp(.46,-.12,r)+.08*arc;
       px=lerp(.24,.40,r)+.16*arc;py=lerp(1.03,1.40,r)-.18*arc;pz=lerp(-.96,-.82,r)-.10*arc;
       rx=lerp(-1.90,.60,r)-.12*arc;ry=lerp(-.12,-.16,r)+.03*arc;rz=lerp(.50,-.24,r)+.06*arc;
     }
     if(k>=1)fight.swingAt=0;
   }
   v.arms[1].rotation.x=armX;v.arms[1].rotation.z=armZ;
   fight.holder.position.set(px,py,pz);fight.holder.rotation.set(rx,ry,rz);
   fight.bat.position.set(.02,.02,-.14);
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
   const rouletteBlocked=x>-21.38&&x<-16.62&&z>-.82&&z<1.22;
   const blackjackBlocked=x>-16.90&&x<-13.60&&z>1.22&&z<3.02;
   const casinoBlocked=rouletteBlocked||blackjackBlocked||(z<-4.04&&x>-21.15&&x<-14.45);
   const inCasino=casinoBounds&&!casinoBlocked;
   const inFight=inFightArea(x,z);
   return inMain||inLeftPass||inRightPass||inCasino||inFight;
 };
 let heldBat=false,swingSeq=0,swingStarted=0,lastHitAt=0,hitUntil=0,lastFightPointerAt=0,hitsTaken=0,knockedUntil=0,knockStarted=0,npcHitSeq=0,npcHitTarget='',npcSwingProcessed=0;
 let casinoSecurityTarget='',casinoSecurityUntil=0,lastBouncerHitAt=0,casinoEjection=null;
 const remoteNpcSeq=new Map();
 const nearestBatDistance=()=>Math.min(...(roomVisual.fightBatSpots||[]).map(s=>Math.hypot(position.x-s.x,position.z-s.z)),99);
 const isKnocked=t=>t<knockedUntil;
 const setHeldBat=value=>{heldBat=!!value;localBat.visible=heldBat;if(!heldBat)swingStarted=0;};
 const publishPose=()=>updateLobbyPose({...position,yaw,pitch,bat:heldBat,swingSeq,down:isKnocked(performance.now()),npcHitSeq,npcHitTarget});
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
 const applyNpcHit=(target,t)=>{
   const npc=(roomVisual.casinoNpcs||[]).find(n=>n.id===target);if(!npc)return false;
   npc.hits=(npc.hits||0)+1;npc.hitAt=t;npc.hitUntil=t+430;
   if(npc.hits>=3){npc.hits=0;npc.downStarted=t;npc.downUntil=t+2400;}
   return true;
 };
 const tryLocalNpcHit=t=>{
   if(!heldBat||!swingStarted||npcSwingProcessed===swingSeq)return;
   const age=t-swingStarted;if(age<150)return;if(age>330){npcSwingProcessed=swingSeq;return;}
   let best=null,bestDist=99;const fx=-Math.sin(yaw),fz=-Math.cos(yaw);
   for(const npc of roomVisual.casinoNpcs||[]){const dx=npc.x-position.x,dz=npc.z-position.z,dist=Math.hypot(dx,dz);if(dist>.18&&dist<2.15){const dot=(dx/dist)*fx+(dz/dist)*fz;if(dot>.10&&dist<bestDist){best=npc;bestDist=dist;}}}
   if(!best)return;npcSwingProcessed=swingSeq;npcHitSeq++;npcHitTarget=best.id;applyNpcHit(best.id,t);casinoSecurityTarget=state.self||'self';casinoSecurityUntil=t+12000;publishPose();showFightMessage('CROUPIER TOUCHÉ !',280);showCasinoWorldStatus('⚠ LES VIDEURS ARRIVENT !',1400);
 };
 const syncRemoteNpcHit=(id,raw,t)=>{
   const seq=Number.isSafeInteger(raw?.npcHitSeq)?raw.npcHitSeq:0,prev=remoteNpcSeq.get(id);
   if(prev===undefined){remoteNpcSeq.set(id,seq);return;}if(seq<=prev)return;remoteNpcSeq.set(id,seq);
   if(raw?.npcHitTarget==='roulette'||raw?.npcHitTarget==='blackjack'){applyNpcHit(raw.npcHitTarget,t);casinoSecurityTarget=id;casinoSecurityUntil=t+12000;}
 };
 const animateCasinoNpcs=t=>{for(const npc of roomVisual.casinoNpcs||[]){const g=npc.group;if(!g)continue;if(t<(npc.downUntil||0)){const a=Math.min(1,(t-(npc.downStarted||t))/260),b=Math.min(1,((npc.downUntil||t)-t)/380),f=Math.min(a,b);g.rotation.z=-1.28*f;g.position.y=.03*f;}else if(t<(npc.hitUntil||0)){const q=Math.max(0,1-(t-(npc.hitAt||t))/430);g.rotation.z=Math.sin(q*Math.PI*2)*.16*q;g.position.y=0;}else{g.rotation.z*=.72;if(Math.abs(g.rotation.z)<.002)g.rotation.z=0;g.position.y=0;}}};
 const securityTargetPose=()=>{if(!casinoSecurityTarget)return null;if(casinoSecurityTarget==='self'||casinoSecurityTarget===state.self)return {x:position.x,z:position.z,local:true,down:isKnocked(performance.now())};const p=lobbyPose(casinoSecurityTarget);return p?{x:p.x,z:p.z,local:false,down:p.down===true}:null;};
 const animateCasinoSecurity=(t,dt)=>{
   const active=t<casinoSecurityUntil&&casinoSecurityTarget,target=active?securityTargetPose():null;
   for(const b of roomVisual.casinoBouncers||[]){const g=b.group;if(!g)continue;let tx=b.homeX,tz=b.homeZ,chasing=false;if(target){tx=target.x;tz=target.z;chasing=true;}const dx=tx-g.position.x,dz=tz-g.position.z,dist=Math.hypot(dx,dz)||1;if(dist>.08){const speed=chasing?2.75:1.7,step=Math.min(dist,speed*dt);g.position.x+=dx/dist*step;g.position.z+=dz/dist*step;g.rotation.y=Math.atan2(-dx,-dz);}if(chasing&&dist<1.18&&t-(b.swingAt||0)>820){b.swingAt=t;if(target.local&&t-lastBouncerHitAt>620&&!casinoEjection){lastBouncerHitAt=t;registerHit(t);showFightMessage('COUP DE VIDEUR !',300);if(isKnocked(t)){casinoEjection={start:t+520,end:t+1850,from:{x:position.x,z:position.z},to:{x:-11.15,z:0}};knockedUntil=Math.max(knockedUntil,t+1950);showCasinoWorldStatus('LES VIDEURS TE SORTENT DU CASINO',1900);}}}
     const age=t-(b.swingAt||0);if(age>=0&&age<430){const k=age/430,hit=k<.5?smooth(k/.5):smooth((1-k)/.5);if(b.arms?.[1])b.arms[1].rotation.x=-.18-1.15*hit;if(b.batHolder)b.batHolder.rotation.z=-.55+1.35*hit;}else{if(b.arms?.[1])b.arms[1].rotation.x+=( -.18-b.arms[1].rotation.x)*.22;if(b.batHolder)b.batHolder.rotation.z+=(-.55-b.batHolder.rotation.z)*.22;}
   }
   if(casinoEjection&&t>=casinoEjection.start){const q=clamp((t-casinoEjection.start)/(casinoEjection.end-casinoEjection.start),0,1),s=smooth(q);position.x=lerp(casinoEjection.from.x,casinoEjection.to.x,s);position.z=lerp(casinoEjection.from.z,casinoEjection.to.z,s);if(q>=1){knockedUntil=0;hitsTaken=0;casinoSecurityTarget='';casinoSecurityUntil=0;casinoEjection=null;publishPose();showCasinoWorldStatus('JETÉ DEHORS DU CASINO',1500);}}
 };
 // One physical press = one swing. Using pointerdown only avoids the delayed synthetic click
 // some mobile WebViews emit after pointerdown, which previously caused a second bat swing.
 fightAction.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();lastFightPointerAt=performance.now();useFightAction();});
 fightAction.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();});
 let casinoOpen=false,casinoBusy=false,casinoData=null,casinoMachineIndex=-1,casinoPending=null;
 const nearestCasinoMachine=()=>{
   let best={distance:99,spot:null};for(const spot of roomVisual.casinoMachineSpots||[]){const distance=Math.hypot(position.x-spot.x,position.z-spot.z);if(distance<best.distance)best={distance,spot};}return best;
 };
 const nearestCasinoTable=()=>{
   let best={distance:99,spot:null};for(const spot of roomVisual.casinoTableSpots||[]){const distance=Math.hypot(position.x-spot.x,position.z-spot.z);if(distance<best.distance)best={distance,spot};}return best;
 };
 const nearestCasinoInteraction=()=>{const machine=nearestCasinoMachine(),table=nearestCasinoTable();return table.distance<machine.distance?{...table,type:'table'}:{...machine,type:'machine'};};
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
 let tableCasinoBusy=false,tableCasinoData=null,tableCasinoKind='',tableStake=10,rouletteBets={},rouletteBetHistory=[];
 const tableEl=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const tableCardTotal=cards=>{let total=(cards||[]).filter(c=>c!==null).reduce((n,c)=>n+Math.min(c%13+1,10),0);for(const c of cards||[])if(c!==null&&c%13===0&&total+10<=21)total+=10;return total;};
 const tableCard=(c)=>{if(c===null)return tableEl('span','ONE','one3d-bj-card back');const rank=['A','2','3','4','5','6','7','8','9','10','V','D','R'][c%13],suit=['♠','♥','♦','♣'][Math.floor(c/13)],node=tableEl('span',rank+suit,'one3d-bj-card'+([1,2].includes(Math.floor(c/13))?' red':''));return node;};
 const tableButton=(label,fn,disabled=false,cls='one3d-table-action')=>{const b=tableEl('button',label,cls);b.type='button';b.disabled=disabled||tableCasinoBusy;b.addEventListener('click',fn);return b;};
 const currentTableRound=()=>tableCasinoData?.round?.kind===tableCasinoKind?tableCasinoData.round:null;
 const updateTableBalance=()=>{const b=Number(tableCasinoData?.balance);tableBalance.textContent=Number.isFinite(b)?b.toLocaleString('fr-FR')+' Points ONE':'Connexion aux Points ONE…';};
 function renderBlackjack(){
   tableBody.replaceChildren();const r=currentTableRound(),other=tableCasinoData?.round&&!tableCasinoData.round.settled&&tableCasinoData.round.kind!=='blackjack';
   const toolbar=tableEl('div',undefined,'one3d-table-toolbar'),label=tableEl('label','Mise'),select=tableEl('select');for(const n of [10,25,50,100]){const o=tableEl('option',n+' Points');o.value=n;select.append(o);}select.value=String(tableStake);select.disabled=tableCasinoBusy||!!(r&&!r.settled)||!!other;select.onchange=()=>{tableStake=Number(select.value)||10;renderTableCasino();};label.append(select);toolbar.append(label,tableEl('div','BLACKJACK','one3d-casino-machine-name'));tableBody.append(toolbar);
   const felt=tableEl('section',undefined,'one3d-blackjack-felt');
   const dealer=tableEl('div',undefined,'one3d-bj-side'),player=tableEl('div',undefined,'one3d-bj-side');
   dealer.append(tableEl('strong',r?'Croupier · '+tableCardTotal(r.dealer)+(r.settled?' points':' visibles'):'Croupier'));
   const dr=tableEl('div',undefined,'one3d-bj-cards');for(const c of r?.dealer||[null,null])dr.append(tableCard(c));dealer.append(dr);
   player.append(tableEl('strong',r?'Ta main · '+tableCardTotal(r.player)+' points':'Ta main'));
   const pr=tableEl('div',undefined,'one3d-bj-cards');for(const c of r?.player||[null,null])pr.append(tableCard(c));player.append(pr);
   felt.append(dealer,player);if(r?.settled)felt.append(tableEl('div',(r.result||'Manche terminée')+(r.payout?' · +'+r.payout+' Points ONE':''),'one3d-casino-result'));tableBody.append(felt);
   const actions=tableEl('div',undefined,'one3d-bet-summary');
   if(other){actions.append(tableEl('small','Termine d’abord ta partie '+String(tableCasinoData.round.kind).toUpperCase()+'.'));}
   else if(r&&!r.settled){actions.append(tableButton('CARTE',()=>playTableAction('hit')),tableButton('RESTER',()=>playTableAction('stand')));}
   else actions.append(tableButton('DISTRIBUER · '+tableStake+' PTS',()=>startTableRound('blackjack'),Number(tableCasinoData?.balance||0)<tableStake));
   tableBody.append(actions);
 }
 const rouletteRed=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
 const rouletteClass=n=>n===0?'green':rouletteRed.has(n)?'red':'black';
 function addRouletteBet(key){if(tableCasinoBusy||!tableCasinoData)return;const total=Object.values(rouletteBets).reduce((a,b)=>a+b,0);if(total+tableStake>Math.min(Number(tableCasinoData.balance||0),5000)){tableStatus.textContent='Le total dépasse ton solde ou 5 000 Points ONE.';return;}rouletteBets[key]=(rouletteBets[key]||0)+tableStake;rouletteBetHistory.push({key,amount:tableStake});renderTableCasino();}
 function renderRoulette(){
   tableBody.replaceChildren();const r=currentTableRound(),other=tableCasinoData?.round&&!tableCasinoData.round.settled&&tableCasinoData.round.kind!=='roulette';
   const toolbar=tableEl('div',undefined,'one3d-table-toolbar'),label=tableEl('label','Jeton'),select=tableEl('select');for(const n of [10,25,50,100]){const o=tableEl('option',n+' Points');o.value=n;select.append(o);}select.value=String(tableStake);select.disabled=tableCasinoBusy||!!other;select.onchange=()=>{tableStake=Number(select.value)||10;renderTableCasino();};label.append(select);toolbar.append(label,tableEl('div','ROULETTE','one3d-casino-machine-name'));if(r?.settled){const result=tableEl('div',String(r.number),'one3d-roulette-result '+(r.color||rouletteClass(Number(r.number))));toolbar.append(result);}tableBody.append(toolbar);
   const grid=tableEl('div',undefined,'one3d-roulette-bets');for(let n=0;n<=36;n++){const key='n:'+n,b=tableEl('button',String(n),rouletteClass(n)+(rouletteBets[key]?' has-bet':''));b.type='button';b.disabled=tableCasinoBusy||!!other;b.onclick=()=>addRouletteBet(key);grid.append(b);}for(const [key,label,cls] of [['red','ROUGE','red'],['black','NOIR','black'],['even','PAIR',''],['odd','IMPAIR',''],['low','1–18',''],['high','19–36','']]){const b=tableEl('button',label,(cls?cls+' ':'')+(rouletteBets[key]?'has-bet':''));b.type='button';b.disabled=tableCasinoBusy||!!other;b.onclick=()=>addRouletteBet(key);grid.append(b);}tableBody.append(grid);
   const total=Object.values(rouletteBets).reduce((a,b)=>a+b,0),summary=tableEl('div',undefined,'one3d-bet-summary');summary.append(tableEl('strong','Total : '+total+' pts'));summary.append(tableButton('ANNULER',()=>{const last=rouletteBetHistory.pop();if(last){rouletteBets[last.key]-=last.amount;if(rouletteBets[last.key]<=0)delete rouletteBets[last.key];renderTableCasino();}},!rouletteBetHistory.length||!!other));summary.append(tableButton('EFFACER',()=>{rouletteBets={};rouletteBetHistory=[];renderTableCasino();},!total||!!other));summary.append(tableButton(tableCasinoBusy?'ROUE EN COURS…':'LANCER LA ROULETTE',()=>startTableRound('roulette'),!total||!!other||Number(tableCasinoData?.balance||0)<total));tableBody.append(summary);if(r?.settled)tableBody.append(tableEl('div',(r.result||'Résultat : '+r.number)+(r.payout?' · +'+r.payout+' Points ONE':' · aucun gain'),'one3d-casino-result'));
 }
 function renderTableCasino(message=''){updateTableBalance();tableTitle.textContent='ONE CASINO · '+(tableCasinoKind==='blackjack'?'BLACKJACK':'ROULETTE');tableStatus.textContent=message||tableStatus.textContent||'';if(tableCasinoKind==='blackjack')renderBlackjack();else renderRoulette();}
 async function loadTableCasino(){const api=window.ONEUI?.api;if(!api){tableStatus.textContent='Le service Points ONE n’est pas chargé.';return;}tableCasinoBusy=true;tableStatus.textContent='Connexion à ONE Casino…';try{tableCasinoData=await api('/points/state');window.ONEUpdateBalance?.(tableCasinoData.balance);renderTableCasino('Prêt à jouer.');}catch(e){tableStatus.textContent=e?.message||'ONE Casino est momentanément indisponible.';}finally{tableCasinoBusy=false;renderTableCasino(tableStatus.textContent);}}
 async function openCasinoTable(spot){if(!spot||casinoOpen)return;casinoOpen=true;tableCasinoKind=spot.kind;tableCasinoPanel.hidden=false;keys.clear();stickInput.x=stickInput.y=0;tableBody.replaceChildren();tableStatus.textContent='Chargement…';await loadTableCasino();}
 const closeTableCasino=()=>{casinoOpen=false;tableCasinoPanel.hidden=true;tableBody.replaceChildren();keys.clear();stickInput.x=stickInput.y=0;};
 async function startTableRound(kind){if(tableCasinoBusy||!tableCasinoData)return;const api=window.ONEUI?.api;if(!api)return;tableCasinoBusy=true;renderTableCasino(kind==='roulette'?'La roue tourne…':'Distribution…');try{if(kind==='roulette'){const total=Object.values(rouletteBets).reduce((a,b)=>a+b,0),body={id:crypto.randomUUID(),kind:'roulette',stake:total,bets:Object.entries(rouletteBets).map(([key,amount])=>({key,amount}))};tableCasinoData=await api('/points/play','POST',body);rouletteBets={};rouletteBetHistory=[];}else tableCasinoData=await api('/points/play','POST',{id:crypto.randomUUID(),kind:'blackjack',stake:tableStake});window.ONEUpdateBalance?.(tableCasinoData.balance);renderTableCasino(kind==='roulette'?'La bille s’est arrêtée.':'À toi de jouer.');}catch(e){renderTableCasino(e?.message||'Action impossible.');}finally{tableCasinoBusy=false;renderTableCasino(tableStatus.textContent);}}
 async function playTableAction(action){const r=currentTableRound();if(tableCasinoBusy||!r||r.settled)return;const api=window.ONEUI?.api;if(!api)return;tableCasinoBusy=true;renderTableCasino(action==='hit'?'Carte…':'Le croupier termine la main…');try{tableCasinoData=await api('/points/blackjack','POST',{id:r.id,version:r.version,action});window.ONEUpdateBalance?.(tableCasinoData.balance);renderTableCasino(tableCasinoData.round?.settled?tableCasinoData.round.result:'À toi.');}catch(e){renderTableCasino(e?.message||'Action impossible.');}finally{tableCasinoBusy=false;renderTableCasino(tableStatus.textContent);}}
 tableCasinoPanel.querySelector('[data-table-close]').addEventListener('click',closeTableCasino);tableCasinoPanel.addEventListener('pointerdown',e=>e.stopPropagation());tableCasinoPanel.addEventListener('pointermove',e=>e.stopPropagation());
 casinoAction.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const near=nearestCasinoInteraction();if(near.distance>=1.55)return;if(near.type==='table')openCasinoTable(near.spot);else openCasinoMachine(near.spot);});casinoAction.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
 casinoPanel.querySelector('[data-casino-close]').addEventListener('click',closeCasino);casinoSpin.addEventListener('click',spinCasino);casinoPanel.addEventListener('pointerdown',e=>e.stopPropagation());casinoPanel.addEventListener('pointermove',e=>e.stopPropagation());

 // V75 — direct 3D casino controls. No modal is needed for slots, roulette or blackjack.
 const casinoStakes=[10,25,50,100],slotWorldStakes=[10,10,10,10];let casinoWorldBusy=false;
 const cycleStake=(value,dir)=>{let i=casinoStakes.indexOf(Number(value));if(i<0)i=0;return casinoStakes[(i+dir+casinoStakes.length)%casinoStakes.length];};
 const ensureCasinoWorldState=async()=>{if(casinoData||tableCasinoData){syncWorldCasinoVisuals();return casinoData||tableCasinoData;}const api=window.ONEUI?.api;if(!api)throw new Error('Points ONE indisponibles');const data=await api('/points/state');casinoData=data;tableCasinoData=data;window.ONEUpdateBalance?.(data.balance);syncWorldCasinoVisuals();return data;};
 const syncWorldCasinoVisuals=()=>{const data=casinoData||tableCasinoData||{},round=data.round||null;roomVisual.renderBlackjack3D?.(round?.kind==='blackjack'?round:null,tableStake,Number(data.balance||0));roomVisual.setRouletteBets?.(rouletteBets,tableStake);for(let i=0;i<4;i++){const sr=round?.kind==='slots'?round:null;roomVisual.updateSlotMachine?.(i,{grid:sr?.grid,stake:slotWorldStakes[i],payout:i===0?Number(sr?.payout||0):0,busy:false});}};
 const changeSlotWorldStake=(index,dir)=>{slotWorldStakes[index]=cycleStake(slotWorldStakes[index],dir);roomVisual.updateSlotMachine?.(index,{stake:slotWorldStakes[index],busy:false});showCasinoWorldStatus('Mise machine : '+slotWorldStakes[index]+' Points ONE',850);};
 const spinSlotWorld=async index=>{if(casinoWorldBusy)return;try{const data=await ensureCasinoWorldState(),bonus=data.slotBonus||{remaining:0,stake:10},free=Number(bonus.remaining)>0,stake=free?Number(bonus.stake||10):slotWorldStakes[index];casinoWorldBusy=true;roomVisual.startSlotSpin?.(index);showCasinoWorldStatus(free?'TOUR GRATUIT':'Machine lancée · '+stake+' pts',900);const started=performance.now(),next=await window.ONEUI.api('/points/play','POST',{id:crypto.randomUUID(),kind:'slots',stake});const wait=Math.max(0,1250-(performance.now()-started));if(wait)await new Promise(r=>setTimeout(r,wait));const round=next.round?.kind==='slots'?next.round:null;casinoData=tableCasinoData=next;window.ONEUpdateBalance?.(next.balance);roomVisual.stopSlotSpin?.(index,round,stake);showCasinoWorldStatus(round?.payout?'GAIN +'+round.payout+' Points ONE':'Aucun gain',1400);}catch(e){roomVisual.stopSlotSpin?.(index,null,slotWorldStakes[index]);showCasinoWorldStatus(e?.message||'Machine indisponible',1600);}finally{casinoWorldBusy=false;}};
 const changeTableWorldStake=dir=>{tableStake=cycleStake(tableStake,dir);roomVisual.renderBlackjack3D?.(currentTableRound()?.kind==='blackjack'?currentTableRound():null,tableStake,Number((tableCasinoData||casinoData)?.balance||0));roomVisual.setRouletteBets?.(rouletteBets,tableStake);showCasinoWorldStatus('Jeton : '+tableStake+' Points ONE',800);};
 const blackjackWorld=async action=>{if(casinoWorldBusy)return;try{const data=await ensureCasinoWorldState();casinoWorldBusy=true;if(action==='deal'){tableCasinoData=await window.ONEUI.api('/points/play','POST',{id:crypto.randomUUID(),kind:'blackjack',stake:tableStake});}else{const r=tableCasinoData?.round?.kind==='blackjack'?tableCasinoData.round:data.round?.kind==='blackjack'?data.round:null;if(!r||r.settled)throw new Error('Distribue d’abord les cartes');tableCasinoData=await window.ONEUI.api('/points/blackjack','POST',{id:r.id,version:r.version,action});}casinoData=tableCasinoData;window.ONEUpdateBalance?.(tableCasinoData.balance);roomVisual.renderBlackjack3D?.(tableCasinoData.round?.kind==='blackjack'?tableCasinoData.round:null,tableStake,Number(tableCasinoData.balance||0));const r=tableCasinoData.round;showCasinoWorldStatus(r?.settled?(r.result||'Manche terminée'):'À toi de jouer',1300);}catch(e){showCasinoWorldStatus(e?.message||'Blackjack indisponible',1500);}finally{casinoWorldBusy=false;}};
 const addRouletteWorldBet=async key=>{try{const data=await ensureCasinoWorldState(),total=Object.values(rouletteBets).reduce((a,b)=>a+b,0);if(total+tableStake>Math.min(Number(data.balance||0),5000))throw new Error('Mise trop élevée');rouletteBets[key]=(rouletteBets[key]||0)+tableStake;rouletteBetHistory.push({key,amount:tableStake});roomVisual.setRouletteBets?.(rouletteBets,tableStake);showCasinoWorldStatus('Jeton posé · '+tableStake+' pts',650);}catch(e){showCasinoWorldStatus(e?.message||'Impossible de miser',1100);}};
 const spinRouletteWorld=async()=>{if(casinoWorldBusy)return;const total=Object.values(rouletteBets).reduce((a,b)=>a+b,0);if(!total){showCasinoWorldStatus('Pose d’abord un jeton sur la table',1200);return;}try{await ensureCasinoWorldState();casinoWorldBusy=true;roomVisual.startRouletteSpin?.();showCasinoWorldStatus('LA ROULETTE TOURNE…',1100);const body={id:crypto.randomUUID(),kind:'roulette',stake:total,bets:Object.entries(rouletteBets).map(([key,amount])=>({key,amount}))},data=await window.ONEUI.api('/points/play','POST',body),round=data.round?.kind==='roulette'?data.round:null;casinoData=tableCasinoData=data;window.ONEUpdateBalance?.(data.balance);roomVisual.stopRouletteSpin?.(round?.number);rouletteBets={};rouletteBetHistory=[];roomVisual.setRouletteBets?.(rouletteBets,tableStake);showCasinoWorldStatus((round?.result||'Résultat '+round?.number)+(round?.payout?' · +'+round.payout+' pts':''),1800);}catch(e){roomVisual.stopRouletteSpin?.(undefined);showCasinoWorldStatus(e?.message||'Roulette indisponible',1500);}finally{casinoWorldBusy=false;}};
 const runCasinoWorldAction=data=>{switch(data.casinoAction){case 'slot-stake-minus':changeSlotWorldStake(data.machine,-1);break;case 'slot-stake-plus':changeSlotWorldStake(data.machine,1);break;case 'slot-spin':void spinSlotWorld(data.machine);break;case 'roulette-stake-minus':changeTableWorldStake(-1);break;case 'roulette-stake-plus':changeTableWorldStake(1);break;case 'roulette-bet':void addRouletteWorldBet(data.betKey);break;case 'roulette-clear':rouletteBets={};rouletteBetHistory=[];roomVisual.setRouletteBets?.(rouletteBets,tableStake);showCasinoWorldStatus('Jetons retirés',700);break;case 'roulette-spin':void spinRouletteWorld();break;case 'blackjack-stake-minus':changeTableWorldStake(-1);break;case 'blackjack-stake-plus':changeTableWorldStake(1);break;case 'blackjack-deal':void blackjackWorld('deal');break;case 'blackjack-hit':void blackjackWorld('hit');break;case 'blackjack-stand':void blackjackWorld('stand');break;default:return false;}return true;};
 function drawStatus(next){
   state=next;const key=JSON.stringify([next.room,next.self,next.host,next.notice,next.joined,next.ready,next.canStart,next.connecting,next.players]);if(key===statusKey)return;statusKey=key;
   shell.querySelector('[data-room]').textContent=next.room+' · '+next.players.length+'/4 · R74';
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
   casinoAction.hidden=true;runButton.disabled=controlsLocked;
   tryLocalNpcHit(t);animateCasinoNpcs(t);animateCasinoSecurity(t,dt);roomVisual.animateCasino?.(t);if(casinoWorldStatusUntil&&t>=casinoWorldStatusUntil){casinoWorldStatusUntil=0;casinoWorldStatus.hidden=true;}
   if(t-lastSend>100){updateLobbyPose({...position,yaw,pitch,bat:heldBat,swingSeq,down:knocked,npcHitSeq,npcHitTarget});lastSend=t;}
   for(const [id,v] of avatars){syncHeadCamera(id,v);const p=lobbyPose(id);if(!p)continue;tryRemoteHit(p,v,t);syncRemoteNpcHit(id,p,t);v.track.push(p,t);const pose=v.track.at(t);if(pose){animateAvatar(v,{...pose,dead:p.down===true},dt);if(p.down===true)v.cameraHead.position.set(1.62,.20,-.025);else v.cameraHead.position.set(0,1.72,-.025);orientAvatarCamera(v,{x:position.x,y:1.65,z:position.z});poseRemoteBat(v,p,t);}}
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
 function hitCasinoWorld(x,y){const list=roomVisual.casinoInteractives||[];if(!list.length)return false;const b=renderer.domElement.getBoundingClientRect();pointer.set((x-b.left)/b.width*2-1,-(y-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(list,false);if(!hits.length)return false;const world=new THREE.Vector3();for(const hit of hits){hit.object.getWorldPosition(world);if(Math.hypot(world.x-position.x,world.z-position.z)>2.65)continue;return runCasinoWorldAction(hit.object.userData||{});}return false;}
 function hitScreen(x,y){if(hitCasinoWorld(x,y))return;const b=renderer.domElement.getBoundingClientRect();pointer.set((x-b.left)/b.width*2-1,-(y-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);if(ray.intersectObject(roomVisual.screen).length)gameScreen.open();}
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
  listen(window,'keydown',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();setSprint(true);}else if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);}else if(e.code==='KeyF'&&!fightAction.hidden){e.preventDefault();if(!e.repeat)useFightAction();}else if(e.code==='KeyG'){e.preventDefault();if(!e.repeat)showCasinoWorldStatus('Approche une table ou une machine puis touche JOUER.',1400);}else if(e.code==='KeyE'){e.preventDefault();gameScreen.open();}else if(e.code==='Escape'){if(!tableCasinoPanel.hidden)closeTableCasino();else if(casinoOpen)closeCasino();else close();}});listen(window,'keyup',e=>{if(e.code==='ShiftLeft'||e.code==='ShiftRight')setSprint(false);else keys.delete(e.code);});listen(window,'blur',()=>{keys.clear();stopStick();look=null;setSprint(false);});listen(document,'visibilitychange',()=>{keys.clear();stopStick();setSprint(false);last=performance.now();budget.reset();});
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



