import * as THREE from './three.module.js?v=lobby-fight-v63';
import {GLTFLoader} from './GLTFLoader.js?v=lobby-fight-v63';

// R63: expanded ONE lobby with clear side passages, casino room and open ONE FIGHT room.
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
 // inner room side walls, leaving open connection to passage
 for(const z of [-4.6,4.6]){addWall(.22,4,1.4,-12.8,2,z);addWall(.22,4,1.4,12.8,2,z);} // trims around large entries
 
 // Wall accents and ceiling neon tracks
 box(6.7,3.45,.13,lilac,0,2,-6.8);
 for(const x of [-5.6,5.6]){wallPanels.push(box(3.9,3.45,.12,wallMaterial,x,2,-6.82));box(4.05,.06,.14,brass,x,3.75,-6.8);}
 // R63: passages remain completely clear — no neon tube crosses or frames the walking lane.
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
 
 // Casino room
 const casinoRoot=new THREE.Group();root.add(casinoRoot);
 const casinoCarpet=mesh(new THREE.CylinderGeometry(3.3,3.3,.03,50),casinoFelt,-17.8,.02,0,casinoRoot);casinoCarpet.rotation.x=0;
 const rouletteTable=new THREE.Group();casinoRoot.add(rouletteTable);rouletteTable.position.set(-17.8,0,0);
 mesh(new THREE.CylinderGeometry(1.55,1.55,.14,40),gold,0,.74,0,rouletteTable);
 mesh(new THREE.CylinderGeometry(1.36,1.36,.06,40),casinoFelt,0,.84,0,rouletteTable);
 mesh(new THREE.CylinderGeometry(.24,.24,.44,18),darkMetal,0,.37,0,rouletteTable);
 const wheel=mesh(new THREE.CylinderGeometry(.42,.42,.08,28),darkMetal,0,.92,0,rouletteTable);
 mesh(new THREE.TorusGeometry(.44,.04,10,34),gold,0,.92,0,rouletteTable).rotation.x=Math.PI/2;
 for(const dx of [-2.7,-1.6,1.6,2.7]){
  const slot=new THREE.Group();casinoRoot.add(slot);slot.position.set(-17.8+dx,0,-4.65);
  box(.95,1.95,.85,darkMetal,0,.98,0,slot);box(.7,1.0,.06,glassMat,0,1.18,.44,slot);box(.74,.12,.2,gold,0,.38,.29,slot);
  for(let i=0;i<3;i++)box(.14,.14,.02,mat([0xe5536a,0xf0d067,0x53c89a][i],.5,.1),-.2+i*.2,1.18,.48,slot);
 }
 const bar=casinoRoot;
 box(4.8,1.02,.62,mat(0x432f2b,.8,.05),-17.8,.51,4.85,bar);box(5.1,.12,.86,gold,-17.8,1.05,4.86,bar);
 for(const dx of [-1.6,-.5,.6,1.7]){box(.34,.95,.34,darkMetal,-17.8+dx,.47,3.95,bar);mesh(new THREE.CylinderGeometry(.34,.34,.08,22),gold,-17.8+dx,.98,3.95,bar);}
 const chipsSign=(()=>{const cv=document.createElement('canvas');cv.width=768;cv.height=220;const g=cv.getContext('2d');g.fillStyle='#11171f';g.fillRect(0,0,768,220);g.fillStyle='#e7c878';g.font='800 84px system-ui';g.textAlign='center';g.fillText('CASINO',384,102);g.fillStyle='#d9e7ef';g.font='600 28px system-ui';g.fillText('BLACKJACK · ROULETTE · LOUNGE',384,156);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;})();
 const casinoPoster=plane(4.2,1.18,new THREE.MeshBasicMaterial({map:chipsSign,toneMapped:false}),-17.8,2.35,-5.86);casinoPoster.rotation.y=Math.PI;
 
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
   root.add(fit(results[0].value.scene,-17.8,3.5,3.4,1.3,1.18));
  }
  if(results[1].status==='fulfilled'){tableFallback.visible=false;root.add(fit(results[1].value.scene,0,0,2.15,2.15,.65));}
  if(results[2].status==='fulfilled'){
   const materials=new Map();results[2].value.scene.traverse(o=>{if(o.isMesh){materials.set(o.material.name,o.material);o.geometry.dispose();}});
   const f=materials.get('rubber_tiles'),w=materials.get('thatch_wall');
   if(f){tune(f,16,9);f.envMapIntensity=.22;for(const surf of [floor,leftPassFloor,rightPassFloor,leftRoomFloor,rightRoomFloor])surf.material=f;floorMaterial.dispose();}
   if(w){tune(w,2.8,1.8);w.normalScale.set(.38,.38);wallPanels.forEach(p=>p.material=w);wallMaterial.dispose();}
  }
  root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
  scene.userData.r45={assets:results.map((r,i)=>({name:['sofa_02','coffee_table_round_01','surfaces'][i],loaded:r.status==='fulfilled'}))};
  return {complete:results.every(r=>r.status==='fulfilled')};
 });
 
 scene.add(new THREE.HemisphereLight(0xeceaff,0xc3b49d,2.0));
 const sun=new THREE.DirectionalLight(0xfff3df,2.4);sun.position.set(-3,5,4);scene.add(sun);
 const violet=new THREE.PointLight(0xb571ff,28,16,2);violet.position.set(0,2.8,-5.2);scene.add(violet);
 const soft=new THREE.PointLight(0xfff3df,22,14,2);soft.position.set(0,3.6,1.5);scene.add(soft);
 const casinoLight=new THREE.PointLight(0xe0c676,22,13,2);casinoLight.position.set(-17.8,2.8,.5);scene.add(casinoLight);
 const fightLight=new THREE.PointLight(0xc6d4ff,21,13,2);fightLight.position.set(17.8,3.0,.5);scene.add(fightLight);
 const w=128,h=64,data=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const t=y/h;data.set([Math.round(155-60*t),Math.round(163-75*t),Math.round(182-102*t),255],(y*w+x)*4);}
 const environment=new THREE.DataTexture(data,w,h);environment.mapping=THREE.EquirectangularReflectionMapping;environment.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(environment);scene.environment=env.texture;scene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
 return {screen,ready,fightBatSpots,dispose(){scene.environment=null;env.dispose();}};
}
