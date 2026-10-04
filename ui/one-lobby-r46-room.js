import * as THREE from './three.module.js?v=lobby-casino-ui-v81';
import {GLTFLoader} from './GLTFLoader.js?v=lobby-casino-ui-v81';

// R74: expanded ONE lobby with playable slots, blackjack, roulette and hittable casino dealers.
export function buildRoom(scene,renderer,alive,dispose){
 const root=new THREE.Group();root.name='ONE-lobby-r62';scene.add(root);
 const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;
 const base=new URL('../assets/lobby/r45/'+(mobile?'mobile/':''),import.meta.url),loader=new GLTFLoader();
 const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const cream=mat(0xf3eee6),lilac=mat(0xc9bae9),mint=mat(0xbde0d1),brass=mat(0xc7ad82,.4,.55);
 const cushionLilac=mat(0x9962c9,.95),cushionMint=mat(0x4aab99,.95);
 const floorMaterial=mat(0x45434d,.9),wallMaterial=mat(0xc2b6a4),fabric=mat(0x706d7b,.96);
 const casinoFelt=mat(0x245e48,.92),fightBlue=mat(0x416cbc,.88),fightRed=mat(0xb84b63,.88),darkMetal=mat(0x2d2f39,.72,.1);
 const gold=mat(0xd5bc6f,.35,.45),glassMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.16,metalness:.06,transparent:true,opacity:.18});
 const mesh=(geo,material,x,y,z,parent=root)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;};
 const box=(w,h,d,material,x,y,z,parent=root)=>mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent);
 const plane=(w,h,material,x,y,z,parent=root)=>mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,parent);
 scene.background=new THREE.Color(0xdcd8e8);scene.fog=new THREE.Fog(0xdcd8e8,26,58);
 
 const wallPanels=[];
 const addWall=(w,h,d,x,y,z,color=cream,panel=true)=>{
  box(w,h,d,color,x,y,z);
  if(panel){wallPanels.push(box(w+.03,1.12,d+.03,wallMaterial,x,.61,z));box(w+.045,.07,d+.045,brass,x,1.20,z);box(w+.065,.11,d+.065,cream,x,.07,z);}
 };
 const tubeMaterial=new THREE.MeshBasicMaterial({color:0xa74bff,toneMapped:false});
 const haloMaterial=new THREE.MeshBasicMaterial({color:0xa650ff,transparent:true,opacity:.17,depthWrite:false,toneMapped:false});
 const tube=(w,h,d,x,y,z,parent=root)=>{box(w,h,d,tubeMaterial,x,y,z,parent);box(w+.085,h+.085,d+.008,haloMaterial,x,y,z-(d>.06?.016:0),parent);};
 
 // Floors and ceilings
 const floor=plane(18,14,floorMaterial,0,0,0);floor.rotation.x=-Math.PI/2;
 const leftPassFloor=plane(3.8,4.8,floorMaterial,-10.9,0,0);leftPassFloor.rotation.x=-Math.PI/2;
 const rightPassFloor=plane(3.8,4.8,floorMaterial,10.9,0,0);rightPassFloor.rotation.x=-Math.PI/2;
 const leftRoomFloor=plane(10,12,floorMaterial,-17.8,0,0);leftRoomFloor.rotation.x=-Math.PI/2;
 const rightRoomFloor=plane(10,12,floorMaterial,17.8,0,0);rightRoomFloor.rotation.x=-Math.PI/2;
 const ceilingMat=new THREE.MeshStandardMaterial({color:0xf2edf8,roughness:1,side:THREE.DoubleSide});
 for(const [w,h,x,z] of [[18,14,0,0],[3.8,4.8,-10.9,0],[3.8,4.8,10.9,0],[10,12,-17.8,0],[10,12,17.8,0]]){const c=plane(w,h,ceilingMat,x,4,z);c.rotation.x=Math.PI/2;}
 
 // Central room shell with big side openings.
 addWall(18,4,.22,0,2,-7);addWall(18,4,.22,0,2,7);
 for(const z of [-4.7,4.7]){addWall(.22,4,4.6,-9,2,z);addWall(.22,4,4.6,9,2,z);} // leaves wide opening in the middle
 
 // Passage shells
 for(const sign of [-1,1]){
  const px=sign*10.9;
  addWall(3.8,4,.22,px,2,-2.4);
  addWall(3.8,4,.22,px,2,2.4);
 }
 
 // Side rooms outer shells
 for(const sign of [-1,1]){
  const cx=sign*17.8;
  addWall(10,4,.22,cx,2,-6);
  addWall(10,4,.22,cx,2,6);
  addWall(.22,4,12,sign*22.8,2,0);
 }
 // Complete inner walls for both side rooms. Only the central passage (|z| < 2.35) stays open.
 // These long wall sections remove the visual holes that were left beside the Casino/Fight doorways.
 for(const z of [-4.2,4.2]){addWall(.22,4,3.6,-12.8,2,z);addWall(.22,4,3.6,12.8,2,z);}
 // Small doorway pillars give each large opening a clean finished edge without entering the walking lane.
 for(const sign of [-1,1]){for(const z of [-2.42,2.42])box(.34,4,.34,brass,sign*12.78,2,z);}
 
 // Wall accents and ceiling neon tracks
 box(6.7,3.45,.13,lilac,0,2,-6.8);
 for(const x of [-5.6,5.6]){wallPanels.push(box(3.9,3.45,.12,wallMaterial,x,2,-6.82));box(4.05,.06,.14,brass,x,3.75,-6.8);}
 // R64: passages remain completely clear — no neon tube crosses or frames the walking lane.
 for(const x of [-7.75,7.75]){tube(.05,2.65,.05,x,2.25,-6.72);tube(.045,.045,11.2,x,3.86,-.05);} 
 for(const z of [-5.65,5.55])tube(15.55,.045,.045,0,3.86,z);
 for(const x of [-17.8,17.8]){tube(9.4,.045,.045,x,3.86,-4.85);tube(9.4,.045,.045,x,3.86,4.85);} 
 for(const x of [-4.8,4.8])tube(3.2,.035,.035,x,.16,-3.52);
 
 // Poster / game screen in main room.
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,1024,512);
 gradient.addColorStop(0,'#e9dbff');gradient.addColorStop(.5,'#f7e5de');gradient.addColorStop(1,'#caeee5');c.fillStyle=gradient;c.fillRect(0,0,1024,512);
 c.fillStyle='#aa83dc26';for(const [x,y,r] of [[100,50,190],[980,400,180],[840,0,100]]){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
 c.textAlign='center';c.fillStyle='#655074';c.font='600 23px system-ui';c.fillText('VOTRE ÉCRAN DE JEUX 3D',512,85);
 c.fillStyle='#62418b';c.font='800 186px system-ui';c.fillText('ONE',512,280);
 c.fillStyle='#735889';c.font='500 31px system-ui';c.fillText('Touchez pour choisir votre jeu',512,353);
 c.font='600 23px system-ui';c.fillText('3:17 · FOUR  —  2 À 4 JOUEURS',512,435);
 const poster=new THREE.CanvasTexture(canvas);poster.colorSpace=THREE.SRGBColorSpace;
 box(5.78,2.92,.18,cream,0,2.25,-6.64);const screen=plane(5.54,2.72,new THREE.MeshBasicMaterial({map:poster,toneMapped:false}),0,2.25,-6.54);
 for(const x of [-2.92,2.92])tube(.045,2.99,.045,x,2.25,-6.49);
 for(const y of [.755,3.745])tube(5.88,.045,.045,0,y,-6.49);
 
 // Main lounge rug / shadows
 const rugCanvas=document.createElement('canvas');rugCanvas.width=rugCanvas.height=512;const rc=rugCanvas.getContext('2d');rc.fillStyle='#beaad7';rc.fillRect(0,0,512,512);let seed=731;
 for(let i=0;i<22000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=(seed>>>16)%512;seed=(Math.imul(seed,1664525)+1013904223)>>>0;rc.fillStyle=i%2?'#ffffff12':'#5141630b';rc.fillRect(x,(seed>>>16)%512,1,1);} 
 rc.strokeStyle='#eee5f2';rc.lineWidth=5;rc.beginPath();rc.arc(256,256,240,0,Math.PI*2);rc.stroke();rc.lineWidth=1;rc.beginPath();rc.arc(256,256,226,0,Math.PI*2);rc.stroke();
 const rugMap=new THREE.CanvasTexture(rugCanvas);rugMap.colorSpace=THREE.SRGBColorSpace;const rug=mesh(new THREE.CircleGeometry(3.12,80),new THREE.MeshStandardMaterial({map:rugMap,roughness:1}),0,.018,.2);rug.rotation.x=-Math.PI/2;
 const cc=document.createElement('canvas');cc.width=cc.height=64;const cx=cc.getContext('2d'),cg=cx.createRadialGradient(32,32,2,32,32,32);cg.addColorStop(0,'#20112b70');cg.addColorStop(1,'#20112b00');cx.fillStyle=cg;cx.fillRect(0,0,64,64);
 const shadow=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cc),transparent:true,depthWrite:false,toneMapped:false});
 for(const [x,z,w,d] of [[-4.8,-2.8,3.6,2],[4.8,-2.8,3.6,2],[0,0,2.6,2.6],[-17.8,0,7.4,7.4],[17.8,0,7.4,7.4]]){const s=plane(w,d,shadow,x,.028,z);s.rotation.x=-Math.PI/2;}
 
 // Central sofas and table
 const sofaFallback=new THREE.Group();root.add(sofaFallback);
 for(const x of [-4.8,4.8]){box(2.7,.4,1.1,fabric,x,.4,-2.8,sofaFallback);box(2.7,.6,.25,fabric,x,.88,-3.24,sofaFallback);} 
 const tableFallback=mesh(new THREE.CylinderGeometry(.83,.83,.09,48),cream,0,.59,0);
 
 // Plants in central room.
 const leafMat=mat(0x559c6b,.92),stemMat=mat(0x426d48);
 for(const sign of [-1,1]){
  const x=sign*8.6,z=-5.6;mesh(new THREE.CylinderGeometry(.29,.22,.55,14),sign<0?mint:lilac,x,.275,z);
  mesh(new THREE.CylinderGeometry(.025,.045,1.3,6),stemMat,x,1.05,z);
  const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),leafMat,14),o=new THREE.Object3D();
  for(let i=0;i<14;i++){const a=i*2.4;o.position.set(x+Math.sin(a)*.15,.82+i*.069,z+Math.cos(a)*.15);o.rotation.set(Math.cos(a)*.8,a,Math.sin(a)*.6);o.scale.set(.12,.42,.055);o.updateMatrix();leaves.setMatrixAt(i,o.matrix);}root.add(leaves);
 }
 
 // Neon wall signs beside each side passage (not inside the passage).
 function makeNeonWallSign(text,color,x,z,faceRight){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=300;const g=cv.getContext('2d');
  g.clearRect(0,0,1024,300);g.textAlign='center';g.textBaseline='middle';g.font='900 112px system-ui';
  g.shadowColor=color;g.shadowBlur=44;g.strokeStyle=color;g.lineWidth=18;g.strokeText(text,512,150);
  g.shadowBlur=24;g.lineWidth=9;g.strokeText(text,512,150);g.shadowBlur=12;g.fillStyle='#fff8ff';g.fillText(text,512,150);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const sign=plane(3.4,1.0,material,x,2.35,z);sign.rotation.y=faceRight?-Math.PI/2:Math.PI/2;sign.renderOrder=4;
  const glow=new THREE.PointLight(new THREE.Color(color),8,5,2);glow.position.set(x+(faceRight?-.2:.2),2.3,z);root.add(glow);
 }
 makeNeonWallSign('ONE CASINO','#f6d56f',-8.86,-4.25,false);
 makeNeonWallSign('ONE FIGHT','#ff6d9e',8.86,-4.25,true);
 
 // Casino room — V75: every game is played directly on the 3D furniture.
 const casinoRoot=new THREE.Group();root.add(casinoRoot);
 const casinoCarpet=mesh(new THREE.CylinderGeometry(3.3,3.3,.03,50),casinoFelt,-17.8,.02,0,casinoRoot);casinoCarpet.rotation.x=0;
 const casinoInteractives=[],casinoMachineSpots=[],casinoMachines=[],casinoNpcs=[],casinoBouncers=[];
 const slotSymbols=['🍒','🍋','🔔','⭐','💎','7','WILD','BONUS'];
 const rouletteRed=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
 const makeCanvasTexture=(text,bg='#171925',fg='#fff4ce',w=512,h=256,font='900 84px system-ui')=>{
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.fillStyle=fg;g.font=font;g.fillText(String(text??''),w/2,h/2);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;
 };
 const setPlaneText=(m,text,bg,fg,font)=>{const old=m.material.map;m.material.map=makeCanvasTexture(text,bg,fg,512,256,font);m.material.needsUpdate=true;old?.dispose?.();};
 const makeLabelPlane=(text,w,h,x,y,z,parent,bg='#171925',fg='#fff4ce',font='900 72px system-ui')=>{
  const m=plane(w,h,new THREE.MeshBasicMaterial({map:makeCanvasTexture(text,bg,fg,512,256,font),toneMapped:false,transparent:false}),x,y,z,parent);m.renderOrder=7;return m;
 };
 const makeTableButton=(label,w,d,x,z,parent,action,data={},color=0x382c48)=>{
  const b=box(w,.055,d,mat(color,.55,.12),x,.91,z,parent);b.userData={casinoAction:action,...data};casinoInteractives.push(b);
  const l=makeLabelPlane(label,w*.88,d*.74,x,.942,z,parent,'#1a1624','#fff2c4','900 50px system-ui');l.rotation.x=-Math.PI/2;return b;
 };

 // ROULETTE — real wheel on the left, betting cloth and chips on the right.
 const rouletteTable=new THREE.Group();casinoRoot.add(rouletteTable);rouletteTable.position.set(-19.0,0,-.15);rouletteTable.scale.setScalar(.74);
 box(4.45,.68,1.82,mat(0x3a271f,.78,.06),0,.34,0,rouletteTable);box(4.62,.10,1.98,gold,0,.72,0,rouletteTable);box(4.42,.07,1.78,casinoFelt,0,.81,0,rouletteTable);
 const wheelRotor=new THREE.Group();wheelRotor.position.set(-1.38,.90,.08);rouletteTable.add(wheelRotor);
 mesh(new THREE.CylinderGeometry(.64,.64,.09,48),darkMetal,0,0,0,wheelRotor);mesh(new THREE.TorusGeometry(.60,.045,12,48),gold,0,.055,0,wheelRotor).rotation.x=Math.PI/2;
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2,peg=box(.04,.05,.18,i%2?fightRed:darkMetal,Math.sin(a)*.45,.075,Math.cos(a)*.45,wheelRotor);peg.rotation.y=a;}
 const rouletteBall=mesh(new THREE.SphereGeometry(.045,12,8),cream,.48,.14,0,wheelRotor);
 const rouletteResult=makeLabelPlane('ROULETTE',.92,.24,-1.38,.91,-.58,rouletteTable,'#17151d','#f3d478','900 54px system-ui');rouletteResult.rotation.x=-Math.PI/2;
 const rouletteBetPositions=new Map(),rouletteChipLayer=new THREE.Group();rouletteTable.add(rouletteChipLayer);
 // Number board: 12 columns x 3 rows + 0.
 const zero=makeTableButton('0',.22,.78,-.48,.08,rouletteTable,'roulette-bet',{betKey:'n:0'},0x28734d);rouletteBetPositions.set('n:0',{x:-.48,z:.08});
 for(let col=0;col<12;col++)for(let row=0;row<3;row++){
  const n=col*3+(3-row),x=-.23+col*.185,z=-.55+row*.38,key='n:'+n,color=rouletteRed.has(n)?0x9f3149:0x20232c;
  makeTableButton(String(n),.17,.31,x,z,rouletteTable,'roulette-bet',{betKey:key},color);rouletteBetPositions.set(key,{x,z});
 }
 const outside=[['red','ROUGE',0x9f3149],['black','NOIR',0x20232c],['even','PAIR',0x564a38],['odd','IMPAIR',0x564a38],['low','1–18',0x355c54],['high','19–36',0x355c54]];
 outside.forEach(([key,label,color],i)=>{const x=-.10+(i%3)*.72,z=.58+Math.floor(i/3)*.26;makeTableButton(label,.64,.24,x,z,rouletteTable,'roulette-bet',{betKey:key},color);rouletteBetPositions.set(key,{x,z});});
 makeTableButton('MISE −',.52,.25,1.95,-.55,rouletteTable,'roulette-stake-minus',{},0x55472d);makeTableButton('MISE +',.52,.25,1.95,-.22,rouletteTable,'roulette-stake-plus',{},0x55472d);makeTableButton('EFFACER',.52,.25,1.95,.14,rouletteTable,'roulette-clear',{},0x59303d);makeTableButton('LANCER',.52,.50,1.95,.65,rouletteTable,'roulette-spin',{},0x7d6424);
 const rouletteStakeLabel=makeLabelPlane('JETON 10',.58,.22,1.95,.92,-.86,rouletteTable,'#18141d','#f5d878','900 46px system-ui');rouletteStakeLabel.rotation.x=-Math.PI/2;
 let rouletteSpinUntil=0,rouletteSpinStart=0,rouletteFinal=null;
 const setRouletteBets=(bets={},stake=10)=>{
  while(rouletteChipLayer.children.length){const o=rouletteChipLayer.children.pop();o.geometry?.dispose?.();o.material?.dispose?.();}
  for(const [key,amount] of Object.entries(bets)){const pos=rouletteBetPositions.get(key);if(!pos||!amount)continue;const count=Math.min(5,Math.max(1,Math.ceil(Number(amount)/Math.max(1,Number(stake)))));for(let i=0;i<count;i++){const chip=mesh(new THREE.CylinderGeometry(.065,.065,.026,18),mat(i%2?0xe7d18c:0x7f55a5,.38,.12),pos.x,.955+i*.026,pos.z,rouletteChipLayer);chip.userData.dynamic=true;}}
  setPlaneText(rouletteStakeLabel,'JETON '+stake,'#18141d','#f5d878','900 46px system-ui');
 };
 const startRouletteSpin=()=>{rouletteSpinStart=performance.now();rouletteSpinUntil=rouletteSpinStart+2600;rouletteFinal=null;setPlaneText(rouletteResult,'ROUE…','#17151d','#f3d478','900 54px system-ui');};
 const stopRouletteSpin=number=>{const n=Number(number);rouletteFinal=Number.isFinite(n)?n:null;rouletteSpinUntil=Math.max(rouletteSpinUntil,performance.now()+700);if(!Number.isFinite(n))setPlaneText(rouletteResult,'ARRÊT','#17151d','#f3d478','900 54px system-ui');};

 // BLACKJACK — cards and controls physically on the felt.
 const blackjackTable=new THREE.Group();casinoRoot.add(blackjackTable);blackjackTable.position.set(-15.45,0,2.15);blackjackTable.scale.setScalar(.82);
 box(3.08,.62,1.62,mat(0x3a271f,.78,.06),0,.31,0,blackjackTable);box(3.24,.13,1.78,gold,0,.68,0,blackjackTable);box(3.02,.08,1.59,casinoFelt,0,.79,0,blackjackTable);
 const bjMark=makeLabelPlane('BLACKJACK',1.30,.25,0,.845,.02,blackjackTable,'#255f48','#f4e8bc','900 58px Georgia');bjMark.rotation.x=-Math.PI/2;
 const blackjackCards={dealer:[],player:[]};
 const makeCard=(x,z,parent)=>{const c=makeLabelPlane('',.30,.42,x,.86,z,parent,'#eee7d9','#1b1d25','900 80px Georgia');c.rotation.x=-Math.PI/2;c.visible=false;return c;};
 for(let i=0;i<6;i++){blackjackCards.dealer.push(makeCard(-.92+i*.36,.37,blackjackTable));blackjackCards.player.push(makeCard(-.92+i*.36,-.25,blackjackTable));}
 makeTableButton('MISE −',.54,.28,-1.19,-.64,blackjackTable,'blackjack-stake-minus',{},0x55472d);makeTableButton('MISE +',.54,.28,-.58,-.64,blackjackTable,'blackjack-stake-plus',{},0x55472d);makeTableButton('DISTRIBUER',.72,.28,.12,-.64,blackjackTable,'blackjack-deal',{},0x756022);makeTableButton('CARTE',.52,.28,.84,-.64,blackjackTable,'blackjack-hit',{},0x355c54);makeTableButton('RESTER',.52,.28,1.39,-.64,blackjackTable,'blackjack-stand',{},0x62374b);
 const blackjackStatus=makeLabelPlane('MISE 10',1.25,.21,0,.92,.70,blackjackTable,'#183f35','#f4e8bc','900 44px system-ui');blackjackStatus.rotation.x=-Math.PI/2;
 const rankNames=['A','2','3','4','5','6','7','8','9','10','V','D','R'],suitNames=['♠','♥','♦','♣'];
 const cardText=c=>c===null?'ONE':rankNames[c%13]+suitNames[Math.floor(c/13)];
 const renderBlackjack3D=(round,stake=10,balance=0)=>{
  for(const side of ['dealer','player']){const cards=round?.[side]||[];blackjackCards[side].forEach((m,i)=>{const c=cards[i];m.visible=i<cards.length;if(m.visible){const red=c!==null&&[1,2].includes(Math.floor(c/13));setPlaneText(m,cardText(c),c===null?'#231933':'#f4efe5',red?'#a4223f':'#181c25','900 88px Georgia');}});}
  const result=round?.settled?(round.result||'TERMINÉ'):(round?'À TOI':'MISE '+stake);setPlaneText(blackjackStatus,result,'#183f35','#f4e8bc','900 42px system-ui');
 };

 const casinoTableSpots=[{kind:'roulette',name:'ROULETTE',x:-19.0,z:-1.48},{kind:'blackjack',name:'BLACKJACK',x:-15.45,z:.92}];

 // Dealers and security.
 const npcJacket=mat(0x252938,.82),npcShirt=mat(0xeee7da,.9),npcSkin=mat(0xbc9580,.88),npcHair=mat(0x2a211e,.98),bouncerJacket=mat(0x111722,.72,.08);
 function casinoNpc(id,name,x,z,yaw=0,{bouncer=false}={}){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;casinoRoot.add(g);const jacket=bouncer?bouncerJacket:npcJacket;
  const torso=mesh(new THREE.CapsuleGeometry(.22,.34,4,10),jacket,0,1.12,0,g);torso.scale.set(1.12,1,.72);box(.08,.42,.19,npcShirt,0,1.13,-.13,g);mesh(new THREE.SphereGeometry(.18,14,10),npcSkin,0,1.69,-.02,g);mesh(new THREE.SphereGeometry(.184,12,8,0,Math.PI*2,0,Math.PI*.52),npcHair,0,1.75,.01,g);
  const arms=[],legs=[];for(const s of [-1,1]){const arm=new THREE.Group();arm.position.set(s*.29,1.35,0);g.add(arm);arms.push(arm);mesh(new THREE.CapsuleGeometry(.075,.38,3,8),jacket,s*.02,-.24,0,arm);mesh(new THREE.SphereGeometry(.07,8,6),npcSkin,s*.02,-.5,0,arm);arm.rotation.x=-.18;}for(const s of [-1,1]){const leg=new THREE.Group();leg.position.set(s*.12,.82,0);g.add(leg);legs.push(leg);mesh(new THREE.CapsuleGeometry(.09,.5,3,8),darkMetal,0,-.31,0,leg);}
  let batHolder=null;if(bouncer){batHolder=new THREE.Group();batHolder.position.set(.02,-.48,-.06);arms[1].add(batHolder);const bw=mat(0xb77b45,.76,.03),bg=mat(0x252834,.82,.04);mesh(new THREE.CylinderGeometry(.07,.11,.82,12),bw,0,.37,0,batHolder);mesh(new THREE.CylinderGeometry(.04,.06,.48,10),bw,0,-.27,0,batHolder);mesh(new THREE.CylinderGeometry(.05,.05,.22,10),bg,0,-.58,0,batHolder);batHolder.rotation.set(-.55,.05,-.55);}
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=96;const lc=labelCanvas.getContext('2d');lc.fillStyle='#11131dde';lc.fillRect(4,4,504,88);lc.fillStyle=bouncer?'#f1c56d':'#f5e8c8';lc.font='700 30px system-ui';lc.textAlign='center';lc.fillText(name,256,60);const labelTex=new THREE.CanvasTexture(labelCanvas);labelTex.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex}));label.scale.set(1.35,.25,1);label.position.y=2.15;g.add(label);g.traverse(o=>{o.userData.dynamic=true;});
  const npc={id,name,group:g,arms,legs,batHolder,x,z,homeX:x,homeZ:z,hitAt:0,hitUntil:0,downStarted:0,downUntil:0,hits:0,swingAt:0,bouncer};(bouncer?casinoBouncers:casinoNpcs).push(npc);return npc;
 }
 casinoNpc('roulette','CROUPIER ROULETTE',-19.0,1.55,Math.PI);casinoNpc('blackjack','CROUPIER BLACKJACK',-15.45,3.25,Math.PI);
 casinoNpc('security-a','VIDEUR ONE',-13.65,-3.72,-Math.PI/2,{bouncer:true});casinoNpc('security-b','VIDEUR ONE',-13.65,3.72,-Math.PI/2,{bouncer:true});

 // SLOT MACHINES — 5x3 real symbols plus stake/spin buttons on the cabinet itself.
 const slotNames=['GOLDEN ONE','PURPLE 7','MINT JACKPOT','NIGHT ONE'],slotColors=[0xf0c95d,0xaa78f0,0x62d5ae,0x79a8ff],slotCells=[],slotStatus=[],slotRuntime=[];
 function slotTexture(title,color){const cv=document.createElement('canvas');cv.width=512;cv.height=256;const g=cv.getContext('2d');const grad=g.createLinearGradient(0,0,512,256);grad.addColorStop(0,'#10131c');grad.addColorStop(1,'#27213a');g.fillStyle=grad;g.fillRect(0,0,512,256);g.strokeStyle='#'+color.toString(16).padStart(6,'0');g.lineWidth=12;g.strokeRect(16,16,480,224);g.textAlign='center';g.fillStyle='#fff7e5';g.font='900 46px system-ui';g.fillText(title,256,70);g.font='900 55px system-ui';g.fillText('ONE CASINO',256,145);g.fillStyle='#e7d99b';g.font='700 25px system-ui';g.fillText('TOUCHE LES BOUTONS',256,210);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
 for(const [i,dx] of [-2.7,-1.6,1.6,2.7].entries()){
  const slot=new THREE.Group();casinoRoot.add(slot);slot.position.set(-17.8+dx,0,-4.72);slot.scale.setScalar(.82);casinoMachines.push(slot);const accent=mat(slotColors[i],.34,.46),body=mat(i===3?0x1d2232:0x302b35,.62,.18);box(1.02,2.12,.92,body,0,1.06,0,slot);box(1.08,.16,.98,accent,0,2.05,0,slot);box(1.06,.13,1.00,accent,0,.12,0,slot);const marquee=plane(.86,.36,new THREE.MeshBasicMaterial({map:slotTexture(slotNames[i],slotColors[i]),toneMapped:false}),0,1.78,.471,slot);marquee.renderOrder=2;
  const cells=[];for(let col=0;col<5;col++)for(let row=0;row<3;row++){const m=makeLabelPlane(slotSymbols[(col+row)%6],.135,.165,-.29+col*.145,1.46-row*.19,.515,slot,'#f5e5bd','#7f263e','900 70px system-ui');cells.push(m);}slotCells.push(cells);
  const status=makeLabelPlane('MISE 10',.70,.14,0,.87,.516,slot,'#10141b','#f4d77d','900 44px system-ui');slotStatus.push(status);
  const mkFront=(label,x,action,color)=>{const b=box(.22,.12,.07,mat(color,.40,.25),x,.72,.50,slot);b.userData={casinoAction:action,machine:i};casinoInteractives.push(b);const l=makeLabelPlane(label,.19,.09,x,.72,.538,slot,'#17151d','#fff3d1','900 40px system-ui');return b;};
  mkFront('−',-.25,'slot-stake-minus',0x66552e);mkFront('GO',0,'slot-spin',slotColors[i]);mkFront('+',.25,'slot-stake-plus',0x66552e);
  mesh(new THREE.CylinderGeometry(.035,.035,.52,12),darkMetal,.57,1.05,.05,slot).rotation.z=-.18;mesh(new THREE.SphereGeometry(.09,12,8),accent,.66,1.30,.05,slot);box(.78,.10,.30,gold,0,.42,.38,slot);box(.46,.05,.15,darkMetal,0,.39,.55,slot);casinoMachineSpots.push({x:-17.8+dx,z:-3.77,index:i,name:slotNames[i]});slotRuntime.push({spinning:false,lastTick:0,stake:10,grid:null});
 }
 const updateSlotMachine=(index,{grid,stake=10,payout=0,busy=false}={})=>{const cells=slotCells[index];if(!cells)return;const runtime=slotRuntime[index];runtime.stake=stake;runtime.spinning=!!busy;if(grid)runtime.grid=grid;const source=grid||runtime.grid||Array.from({length:5},(_,c)=>Array.from({length:3},(_,r)=>(c+r)%6));for(let c=0;c<5;c++)for(let r=0;r<3;r++){const m=cells[c*3+r],value=source?.[c]?.[r]??((c+r)%6);setPlaneText(m,slotSymbols[value]??String(value),'#f5e5bd',value>=6?'#6e2f91':'#8b2945',value>=6?'900 42px system-ui':'900 70px system-ui');}setPlaneText(slotStatus[index],busy?'ROULEAUX…':(payout?'GAIN '+payout:'MISE '+stake),'#10141b','#f4d77d','900 42px system-ui');};
 const startSlotSpin=index=>{const r=slotRuntime[index];if(r){r.spinning=true;r.lastTick=0;setPlaneText(slotStatus[index],'ROULEAUX…','#10141b','#f4d77d','900 42px system-ui');}};
 const stopSlotSpin=(index,round,stake=10)=>{const r=slotRuntime[index];if(r){r.spinning=false;if(round?.grid)r.grid=round.grid;}updateSlotMachine(index,{grid:round?.grid,stake,payout:Number(round?.payout||0),busy:false});};

 // No decorative bar/table behind the casino games anymore: the back wall stays clear.
 const chipsSign=(()=>{const cv=document.createElement('canvas');cv.width=768;cv.height=220;const g=cv.getContext('2d');g.fillStyle='#11171f';g.fillRect(0,0,768,220);g.fillStyle='#e7c878';g.font='800 84px system-ui';g.textAlign='center';g.fillText('CASINO',384,102);g.fillStyle='#d9e7ef';g.font='600 28px system-ui';g.fillText('BLACKJACK · ROULETTE · MACHINES',384,156);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;})();
 const casinoPoster=plane(4.2,1.18,new THREE.MeshBasicMaterial({map:chipsSign,toneMapped:false}),-17.8,2.35,-5.86);casinoPoster.rotation.y=Math.PI;

 const animateCasino=t=>{
  if(rouletteSpinUntil>t){const u=Math.max(0,Math.min(1,(t-rouletteSpinStart)/Math.max(1,rouletteSpinUntil-rouletteSpinStart))),ease=1-u*u;wheelRotor.rotation.y+=.18+.42*ease;const a=(t-rouletteSpinStart)*.014*(1.2+.8*ease);rouletteBall.position.set(Math.cos(a)*.50,.14,Math.sin(a)*.50);}else if(rouletteFinal!==null){setPlaneText(rouletteResult,String(rouletteFinal),'#17151d',rouletteFinal===0?'#65d692':rouletteRed.has(rouletteFinal)?'#ff8da2':'#f5e6ce','900 84px system-ui');rouletteFinal=null;}
  slotRuntime.forEach((r,i)=>{if(!r.spinning||t-r.lastTick<90)return;r.lastTick=t;const grid=Array.from({length:5},()=>Array.from({length:3},()=>Math.floor(Math.random()*8)));const cells=slotCells[i];for(let c=0;c<5;c++)for(let row=0;row<3;row++){const v=grid[c][row],m=cells[c*3+row];setPlaneText(m,slotSymbols[v],'#f5e5bd',v>=6?'#6e2f91':'#8b2945',v>=6?'900 42px system-ui':'900 70px system-ui');}});
 };
 // ONE FIGHT — open brawl room, no ring. Baseball bats can be picked up by players.
 const fightRoot=new THREE.Group();root.add(fightRoot);
 const fightFloorCanvas=document.createElement('canvas');fightFloorCanvas.width=fightFloorCanvas.height=1024;const fg=fightFloorCanvas.getContext('2d');
 fg.fillStyle='#262936';fg.fillRect(0,0,1024,1024);for(let i=-800;i<1800;i+=150){fg.strokeStyle=i%300===0?'#ff6d9e18':'#8aa6ff12';fg.lineWidth=18;fg.beginPath();fg.moveTo(i,1024);fg.lineTo(i+700,0);fg.stroke();}
 fg.textAlign='center';fg.textBaseline='middle';fg.font='900 150px system-ui';fg.fillStyle='#f6eef8';fg.fillText('ONE FIGHT',512,480);fg.font='700 44px system-ui';fg.fillStyle='#bfc8e8';fg.fillText('RAMASSE UNE BATTE · BAGARRE LIBRE',512,590);
 const fightFloorTex=new THREE.CanvasTexture(fightFloorCanvas);fightFloorTex.colorSpace=THREE.SRGBColorSpace;
 const fightMark=plane(7.7,8.3,new THREE.MeshStandardMaterial({map:fightFloorTex,roughness:.95}),17.8,.022,.25,fightRoot);fightMark.rotation.x=-Math.PI/2;
 // Low benches against the rear wall keep the middle of the room clear.
 for(const x of [15.2,20.4]){box(1.9,.38,.58,mat(0x4b4650,.9),x,.19,4.8,fightRoot);box(.12,.62,.12,darkMetal,x-.7,.31,4.8,fightRoot);box(.12,.62,.12,darkMetal,x+.7,.31,4.8,fightRoot);}
 // Baseball bat model used on the wall racks.
 const batWood=mat(0xb77b45,.76,.03),batGrip=mat(0x252834,.82,.04);
 function baseballBat(x,y,z,rotationZ=0,parent=fightRoot){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.z=rotationZ;parent.add(g);
  const barrel=mesh(new THREE.CylinderGeometry(.075,.12,.88,14),batWood,0,.46,0,g);barrel.rotation.z=0;
  mesh(new THREE.CylinderGeometry(.045,.065,.56,12),batWood,0,-.22,0,g);
  mesh(new THREE.CylinderGeometry(.052,.052,.27,12),batGrip,0,-.56,0,g);
  mesh(new THREE.CylinderGeometry(.075,.055,.08,12),batGrip,0,-.72,0,g);
  return g;
 }
 const fightBatSpots=[
  {x:15.1,z:-5.08},{x:16.25,z:-5.08},{x:17.4,z:-5.08},
  {x:18.55,z:-5.08},{x:19.7,z:-5.08},{x:20.85,z:-5.08}
 ];
 // Rack and six real bat props on the back wall.
 box(7.3,.16,.18,darkMetal,17.98,1.56,-5.62,fightRoot);box(7.3,.16,.18,darkMetal,17.98,.62,-5.62,fightRoot);
 for(const [i,s] of fightBatSpots.entries())baseballBat(s.x,1.05,s.z,(i%2?-.16:.16));
 const fightTitle=(()=>{const cv=document.createElement('canvas');cv.width=900;cv.height=240;const g=cv.getContext('2d');g.fillStyle='#171923';g.fillRect(0,0,900,240);g.textAlign='center';g.shadowColor='#ff5f95';g.shadowBlur=30;g.strokeStyle='#ff7ca8';g.lineWidth=8;g.font='900 88px system-ui';g.strokeText('ONE FIGHT',450,105);g.shadowBlur=10;g.fillStyle='#fff5fb';g.fillText('ONE FIGHT',450,105);g.shadowBlur=0;g.fillStyle='#cbd3ef';g.font='650 30px system-ui';g.fillText('Battes · esquive · bagarre libre',450,168);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;})();
 const fightPoster=plane(4.8,1.28,new THREE.MeshBasicMaterial({map:fightTitle,toneMapped:false}),17.8,2.45,-5.86);fightPoster.rotation.y=Math.PI;
 
 // Asset fit helpers for imported sofa/table and textured surfaces.
 function fit(source,x,z,w,d,h){const g=source.clone(true);g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());g.scale.setScalar(Math.min(w/size.x,d/size.z,h/size.y));g.updateMatrixWorld(true);bounds.setFromObject(g);const center=bounds.getCenter(new THREE.Vector3());g.position.set(x-center.x,-bounds.min.y,z-center.z);return g;}
 function tune(m,rx,ry){const seen=new Set();for(const t of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap,m.aoMap])if(t&&!seen.has(t)){seen.add(t);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;}m.needsUpdate=true;}
 const ready=Promise.allSettled(['sofa_02.glb','coffee_table_round_01.glb','surfaces.glb'].map(n=>loader.loadAsync(new URL(n,base).href))).then(results=>{
  if(!alive()){for(const r of results)if(r.status==='fulfilled')dispose(r.value.scene);return {complete:false};}
  if(results[0].status==='fulfilled'){
   sofaFallback.visible=false;
   const cushion=new THREE.SphereGeometry(1,16,12);
   for(const x of [-4.8,4.8]){root.add(fit(results[0].value.scene,x,-2.8,2.9,1.22,1.15));for(const side of [-1,1]){const pillow=mesh(cushion,side<0?cushionLilac:cushionMint,x+side*.68,.64,-2.63);pillow.scale.set(.25,.23,.12);pillow.rotation.z=side*.12;}}
  }
  if(results[1].status==='fulfilled'){tableFallback.visible=false;root.add(fit(results[1].value.scene,0,0,2.15,2.15,.65));}
  if(results[2].status==='fulfilled'){
   const materials=new Map();results[2].value.scene.traverse(o=>{if(o.isMesh){materials.set(o.material.name,o.material);o.geometry.dispose();}});
   const f=materials.get('rubber_tiles'),w=materials.get('thatch_wall');
   if(f){tune(f,16,9);f.envMapIntensity=.22;for(const surf of [floor,leftPassFloor,rightPassFloor,leftRoomFloor,rightRoomFloor])surf.material=f;floorMaterial.dispose();}
   if(w){tune(w,2.8,1.8);w.normalScale.set(.38,.38);wallPanels.forEach(p=>p.material=w);wallMaterial.dispose();}
  }
  root.traverse(o=>{if(o.userData?.dynamic)return;o.updateMatrix();o.matrixAutoUpdate=false;});
  scene.userData.r45={assets:results.map((r,i)=>({name:['sofa_02','coffee_table_round_01','surfaces'][i],loaded:r.status==='fulfilled'}))};
  return {complete:results.every(r=>r.status==='fulfilled')};
 });
 
 scene.add(new THREE.HemisphereLight(0xeceaff,0xc3b49d,2.0));
 const sun=new THREE.DirectionalLight(0xfff3df,2.4);sun.position.set(-3,5,4);scene.add(sun);
 const violet=new THREE.PointLight(0xb571ff,28,16,2);violet.position.set(0,2.8,-5.2);scene.add(violet);
 const soft=new THREE.PointLight(0xfff3df,22,14,2);soft.position.set(0,3.6,1.5);scene.add(soft);
 const casinoLight=new THREE.PointLight(0xe9d188,30,16,2);casinoLight.position.set(-17.8,3.1,.3);scene.add(casinoLight);const casinoFill=new THREE.PointLight(0xddeeff,12,10,2);casinoFill.position.set(-17.8,2.7,-3.7);scene.add(casinoFill);
 const fightLight=new THREE.PointLight(0xc6d4ff,21,13,2);fightLight.position.set(17.8,3.0,.5);scene.add(fightLight);
 const w=128,h=64,data=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const t=y/h;data.set([Math.round(155-60*t),Math.round(163-75*t),Math.round(182-102*t),255],(y*w+x)*4);}
 const environment=new THREE.DataTexture(data,w,h);environment.mapping=THREE.EquirectangularReflectionMapping;environment.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(environment);scene.environment=env.texture;scene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
 return {screen,ready,fightBatSpots,casinoMachineSpots,casinoMachines,casinoTableSpots,casinoNpcs,casinoBouncers,casinoInteractives,rouletteWheel:wheelRotor,setRouletteBets,startRouletteSpin,stopRouletteSpin,renderBlackjack3D,updateSlotMachine,startSlotSpin,stopSlotSpin,animateCasino,dispose(){scene.environment=null;env.dispose();}};
}
