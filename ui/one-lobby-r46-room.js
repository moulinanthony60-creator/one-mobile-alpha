import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';

// This scenery fits the existing lobby collision footprints. No network or game state here.
export function buildRoom(scene,renderer,alive,dispose){
 const root=new THREE.Group();root.name='ONE-salon-r45';scene.add(root);
 const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;
 const base=new URL('../assets/lobby/r45/'+(mobile?'mobile/':''),import.meta.url),loader=new GLTFLoader();
 const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const cream=mat(0xf3eee6),lilac=mat(0xc9bae9),mint=mat(0xbde0d1),brass=mat(0xc7ad82,.4,.55);
 const cushionLilac=mat(0x9962c9,.95),cushionMint=mat(0x4aab99,.95);
 const floorMaterial=mat(0x45434d,.9),wallMaterial=mat(0xc2b6a4),fabric=mat(0x706d7b,.96);
 const mesh=(geo,material,x,y,z,parent=root)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;};
 const box=(w,h,d,material,x,y,z,parent=root)=>mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent);
 const plane=(w,h,material,x,y,z)=>mesh(new THREE.PlaneGeometry(w,h),material,x,y,z);
 scene.background=new THREE.Color(0xdcd8e8);scene.fog=new THREE.Fog(0xdcd8e8,23,45);
 const floor=plane(18,14,floorMaterial,0,0,0);floor.rotation.x=-Math.PI/2;
 const wallPanels=[];
 for(const [w,d,x,z] of [[18,.22,0,-7],[.22,14,-9,0],[.22,14,9,0],[18,.22,0,7]]){
  box(w,4,d,cream,x,2,z);wallPanels.push(box(w+.03,1.12,d+.03,wallMaterial,x,.61,z));box(w+.045,.07,d+.045,brass,x,1.20,z);box(w+.065,.11,d+.065,cream,x,.07,z);
 }
 plane(18,14,new THREE.MeshStandardMaterial({color:0xf2edf8,roughness:1,side:THREE.DoubleSide}),0,4,0).rotation.x=Math.PI/2;
 for(const x of [-5.6,5.6]){wallPanels.push(box(3.9,3.45,.12,wallMaterial,x,2,-6.82));box(4.05,.06,.14,brass,x,3.75,-6.8);}
 box(6.7,3.45,.13,lilac,0,2,-6.8);
 // The poster is a crisp code-drawn sign, with no image download or video loop.
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,1024,512);
 gradient.addColorStop(0,'#e9dbff');gradient.addColorStop(.5,'#f7e5de');gradient.addColorStop(1,'#caeee5');c.fillStyle=gradient;c.fillRect(0,0,1024,512);
 c.fillStyle='#aa83dc26';for(const [x,y,r] of [[100,50,190],[980,400,180],[840,0,100]]){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
 c.textAlign='center';c.fillStyle='#655074';c.font='600 23px system-ui';c.letterSpacing='4px';c.fillText('VOTRE ÉCRAN DE JEUX 3D',512,85);
 c.fillStyle='#62418b';c.font='800 186px system-ui';c.letterSpacing='5px';c.fillText('ONE',512,280);
 c.fillStyle='#735889';c.font='500 31px system-ui';c.letterSpacing='1px';c.fillText('Touchez pour choisir votre jeu',512,353);
 c.font='600 23px system-ui';c.letterSpacing='3px';c.fillText('3:17 · FOUR  —  2 À 4 JOUEURS',512,435);
 const poster=new THREE.CanvasTexture(canvas);poster.colorSpace=THREE.SRGBColorSpace;
 box(5.78,2.92,.18,cream,0,2.25,-6.64);const screen=plane(5.54,2.72,new THREE.MeshBasicMaterial({map:poster,toneMapped:false}),0,2.25,-6.54);
 // Neon tubes and soft local halos; four lights total and no dynamic shadow maps.
 const neon=new THREE.MeshBasicMaterial({color:0xa74bff,toneMapped:false}),halo=new THREE.MeshBasicMaterial({color:0xa650ff,transparent:true,opacity:.17,depthWrite:false,toneMapped:false});
 function tube(w,h,d,x,y,z){box(w,h,d,neon,x,y,z);box(w+.085,h+.085,d+.008,halo,x,y,z-.016);}
 for(const x of [-2.92,2.92])tube(.045,2.99,.045,x,2.25,-6.49);
 for(const y of [.755,3.745])tube(5.88,.045,.045,0,y,-6.49);
 for(const x of [-7.75,7.75]){tube(.05,2.65,.05,x,2.25,-6.72);tube(.045,.045,11.2,x,3.86,-.05);}
 for(const z of [-5.65,5.55])tube(15.55,.045,.045,0,3.86,z);
 for(const x of [-4.8,4.8])tube(3.2,.035,.035,x,.16,-3.52);
 // A soft lavender textile zone softens the dark rubber floor.
 const rugCanvas=document.createElement('canvas');rugCanvas.width=rugCanvas.height=512;const rc=rugCanvas.getContext('2d');rc.fillStyle='#beaad7';rc.fillRect(0,0,512,512);let seed=731;
 for(let i=0;i<22000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=(seed>>>16)%512;seed=(Math.imul(seed,1664525)+1013904223)>>>0;rc.fillStyle=i%2?'#ffffff12':'#5141630b';rc.fillRect(x,(seed>>>16)%512,1,1);}
 rc.strokeStyle='#eee5f2';rc.lineWidth=5;rc.beginPath();rc.arc(256,256,240,0,Math.PI*2);rc.stroke();rc.lineWidth=1;rc.beginPath();rc.arc(256,256,226,0,Math.PI*2);rc.stroke();
 const rugMap=new THREE.CanvasTexture(rugCanvas);rugMap.colorSpace=THREE.SRGBColorSpace;const rug=mesh(new THREE.CircleGeometry(3.12,80),new THREE.MeshStandardMaterial({map:rugMap,roughness:1}),0,.018,.2);rug.rotation.x=-Math.PI/2;
 const cc=document.createElement('canvas');cc.width=cc.height=64;const cx=cc.getContext('2d'),cg=cx.createRadialGradient(32,32,2,32,32,32);cg.addColorStop(0,'#20112b70');cg.addColorStop(1,'#20112b00');cx.fillStyle=cg;cx.fillRect(0,0,64,64);
 const shadow=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cc),transparent:true,depthWrite:false,toneMapped:false});
 for(const [x,z,w,d] of [[-4.8,-2.8,3.6,2],[4.8,-2.8,3.6,2],[0,0,2.6,2.6]]){const s=plane(w,d,shadow,x,.028,z);s.rotation.x=-Math.PI/2;}
 const sofaFallback=new THREE.Group();root.add(sofaFallback);
 for(const x of [-4.8,4.8]){box(2.7,.4,1.1,fabric,x,.4,-2.8,sofaFallback);box(2.7,.6,.25,fabric,x,.88,-3.24,sofaFallback);}
 const tableFallback=mesh(new THREE.CylinderGeometry(.83,.83,.09,48),cream,0,.59,0);
 // Plants sit outside the walkable boundary, so they never obstruct circulation.
 const leafMat=mat(0x559c6b,.92),stemMat=mat(0x426d48);
 for(const sign of [-1,1]){
  const x=sign*8.6,z=-5.6;mesh(new THREE.CylinderGeometry(.29,.22,.55,14),sign<0?mint:lilac,x,.275,z);
  mesh(new THREE.CylinderGeometry(.025,.045,1.3,6),stemMat,x,1.05,z);
  const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),leafMat,14),o=new THREE.Object3D();
  for(let i=0;i<14;i++){const a=i*2.4;o.position.set(x+Math.sin(a)*.15,.82+i*.069,z+Math.cos(a)*.15);o.rotation.set(Math.cos(a)*.8,a,Math.sin(a)*.6);o.scale.set(.12,.42,.055);o.updateMatrix();leaves.setMatrixAt(i,o.matrix);}root.add(leaves);
 }
 function fit(source,x,z,w,d,h){const g=source.clone(true);g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());g.scale.setScalar(Math.min(w/size.x,d/size.z,h/size.y));g.updateMatrixWorld(true);bounds.setFromObject(g);const center=bounds.getCenter(new THREE.Vector3());g.position.set(x-center.x,-bounds.min.y,z-center.z);return g;}
 function tune(m,rx,ry){const seen=new Set();for(const t of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap,m.aoMap])if(t&&!seen.has(t)){seen.add(t);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;}m.needsUpdate=true;}
 const ready=Promise.allSettled(['sofa_02.glb','coffee_table_round_01.glb','surfaces.glb'].map(n=>loader.loadAsync(new URL(n,base).href))).then(results=>{
  if(!alive()){for(const r of results)if(r.status==='fulfilled')dispose(r.value.scene);return {complete:false};}
  if(results[0].status==='fulfilled'){sofaFallback.visible=false;const cushion=new THREE.SphereGeometry(1,16,12);for(const x of [-4.8,4.8]){root.add(fit(results[0].value.scene,x,-2.8,2.9,1.22,1.15));for(const side of [-1,1]){const pillow=mesh(cushion,side<0?cushionLilac:cushionMint,x+side*.68,.64,-2.63);pillow.scale.set(.25,.23,.12);pillow.rotation.z=side*.12;}}}
  if(results[1].status==='fulfilled'){tableFallback.visible=false;root.add(fit(results[1].value.scene,0,0,2.15,2.15,.65));}
  if(results[2].status==='fulfilled'){
   const materials=new Map();results[2].value.scene.traverse(o=>{if(o.isMesh){materials.set(o.material.name,o.material);o.geometry.dispose();}});
   const f=materials.get('rubber_tiles'),w=materials.get('thatch_wall');
   if(f){tune(f,9,7);f.envMapIntensity=.22;floor.material=f;floorMaterial.dispose();}
   if(w){tune(w,2,1.7);w.normalScale.set(.38,.38);wallPanels.forEach(p=>p.material=w);wallMaterial.dispose();}
  }
  root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
  scene.userData.r45={assets:results.map((r,i)=>({name:['sofa_02','coffee_table_round_01','surfaces'][i],loaded:r.status==='fulfilled'}))};
  return {complete:results.every(r=>r.status==='fulfilled')};
 });
 scene.add(new THREE.HemisphereLight(0xeceaff,0xc3b49d,2.0));const sun=new THREE.DirectionalLight(0xfff3df,2.4);sun.position.set(-3,5,4);scene.add(sun);
 const violet=new THREE.PointLight(0xb571ff,28,13,2);violet.position.set(0,2.8,-5.2);scene.add(violet);
 const soft=new THREE.PointLight(0xfff3df,22,13,2);soft.position.set(0,3.6,1.5);scene.add(soft);
 const w=128,h=64,data=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const t=y/h;data.set([Math.round(155-60*t),Math.round(163-75*t),Math.round(182-102*t),255],(y*w+x)*4);}
 const environment=new THREE.DataTexture(data,w,h);environment.mapping=THREE.EquirectangularReflectionMapping;environment.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(environment);scene.environment=env.texture;scene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
 return {screen,ready,dispose(){scene.environment=null;env.dispose();}};
}

