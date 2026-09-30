import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {createR40Environment} from './three17-r44-visuals.js';

export function buildRoom(scene,renderer,alive,dispose){
 const root=new THREE.Group();scene.add(root);const pending=[];
 const loader=new THREE.TextureLoader(),base=new URL('../assets/317/r40/mobile/',import.meta.url);
 function texture(name,channel,rx,ry){let yes,no;pending.push(new Promise((a,b)=>{yes=a;no=b;}));const t=loader.load(new URL('materials/'+name+'_'+channel+'_1k.jpg',base).href,yes,undefined,no);t.colorSpace=channel==='diff'?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;}
 function pbr(name,color,roughness,rx,ry,normal=.4){const arm=texture(name,'arm',rx,ry);return new THREE.MeshStandardMaterial({color,roughness,map:texture(name,'diff',rx,ry),normalMap:texture(name,'nor_gl',rx,ry),normalScale:new THREE.Vector2(normal,normal),roughnessMap:arm,aoMap:arm,aoMapIntensity:.7});}
 const wood=pbr('lacquered_cherry_wood',0xb5a08b,.72,7,6,.3),plaster=pbr('worn_plaster_wall',0x666b76,.95,5,1.4,.45);
 wood.envMapIntensity=.18;wood.roughnessMap=null;wood.roughness=.68;
 const bronze=new THREE.MeshStandardMaterial({color:0x80715b,metalness:.72,roughness:.42}),panel=new THREE.MeshStandardMaterial({color:0x252a35,roughness:.82});
 const mesh=(geo,mat,x,y,z,parent=root)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);parent.add(o);return o;};
 const box=(w,h,d,mat,x,y,z,parent=root)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);
 const plane=(w,h,mat,x,y,z)=>mesh(new THREE.PlaneGeometry(w,h),mat,x,y,z);
 scene.background=new THREE.Color(0x15151e);scene.fog=new THREE.Fog(0x15151e,16,34);
 plane(18,14,wood,0,0,0).rotation.x=-Math.PI/2;
 for(const [w,d,x,z] of [[18,.22,0,-7],[.22,14,-9,0],[.22,14,9,0],[18,.22,0,7]]){
  box(w,4,d,plaster,x,2,z);box(w,.12,d+.035,bronze,x,.08,z);box(w,.16,d+.07,panel,x,3.83,z);
 }
 plane(18,14,new THREE.MeshStandardMaterial({color:0x242631,roughness:1,side:THREE.DoubleSide}),0,4,0).rotation.x=Math.PI/2;
 // Fluted central wall: instanced slats keep this architectural detail in one draw call.
 const slats=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,3.55,.11),panel,47),matrix=new THREE.Matrix4();
 for(let i=0;i<47;i++){matrix.makeTranslation(-3.45+i*.15,1.92,-6.8);slats.setMatrixAt(i,matrix);}root.add(slats);
 const rugCanvas=document.createElement('canvas');rugCanvas.width=rugCanvas.height=512;const rc=rugCanvas.getContext('2d');rc.fillStyle='#3b3036';rc.fillRect(0,0,512,512);let seed=731;
 for(let i=0;i<45000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%512;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%512;rc.fillStyle=i%2?'#ffffff08':'#00000014';rc.fillRect(x,y,1,1);}
 rc.strokeStyle='#766256';rc.lineWidth=3;rc.strokeRect(20,20,472,472);rc.lineWidth=1;rc.strokeRect(28,28,456,456);rc.strokeRect(42,42,428,428);
 rc.save();rc.translate(256,256);rc.scale(1,.78);rc.rotate(Math.PI/4);rc.strokeStyle='#655052';rc.lineWidth=2;rc.strokeRect(-107,-107,214,214);rc.strokeRect(-90,-90,180,180);rc.restore();
 const rugMap=new THREE.CanvasTexture(rugCanvas);rugMap.colorSpace=THREE.SRGBColorSpace;const rug=plane(7.1,5.3,new THREE.MeshStandardMaterial({map:rugMap,roughness:1}),0,.016,.3);rug.rotation.x=-Math.PI/2;
 const screenCanvas=document.createElement('canvas');screenCanvas.width=1024;screenCanvas.height=512;const c=screenCanvas.getContext('2d');const gr=c.createLinearGradient(0,0,1024,512);gr.addColorStop(0,'#121720');gr.addColorStop(.65,'#241a30');gr.addColorStop(1,'#502d36');c.fillStyle=gr;c.fillRect(0,0,1024,512);
 c.strokeStyle='#827160';c.lineWidth=2;c.strokeRect(26,26,972,460);c.fillStyle='#baaa90';c.textAlign='center';c.font='500 20px system-ui';c.letterSpacing='7px';c.fillText('UNE MAISON. QUATRE SURVIVANTS.',512,98);c.fillStyle='#f0e5cf';c.font='600 190px Georgia';c.letterSpacing='4px';c.fillText('3:17',512,306);c.fillStyle='#be9fb9';c.font='600 24px system-ui';c.letterSpacing='6px';c.fillText('FOUR',512,385);c.fillStyle='#9f969e';c.font='17px system-ui';c.letterSpacing='2px';c.fillText('NE FAITES PAS DE BRUIT.',512,450);
 const poster=new THREE.CanvasTexture(screenCanvas);poster.colorSpace=THREE.SRGBColorSpace;
 box(5.5,2.85,.16,bronze,0,2.23,-6.63);plane(5.34,2.67,new THREE.MeshBasicMaterial({map:poster,toneMapped:false}),0,2.23,-6.535);
 const neon=new THREE.MeshBasicMaterial({color:0xae8ae0}),warm=new THREE.MeshBasicMaterial({color:0xffd6a0});
 for(const x of [-7.4,7.4]){box(.055,2.5,.06,neon,x,2.1,-6.83);box(.40,.035,1.5,warm,x,3.97,-1.5);}
 for(const x of [-4.8,4.8]){box(3.4,.018,.025,neon,x,.032,-4);}
 const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=64;const sc=contactCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,4,32,32,32);sg.addColorStop(0,'#000a');sg.addColorStop(1,'#0000');sc.fillStyle=sg;sc.fillRect(0,0,64,64);const shadow=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(contactCanvas),transparent:true,depthWrite:false,toneMapped:false});
 for(const [x,z,w,d] of [[-4.8,-2.8,3.9,2],[4.8,-2.8,3.9,2],[0,0,3.5,2.5]]){const s=plane(w,d,shadow,x,.027,z);s.rotation.x=-Math.PI/2;}
 const fallback=new THREE.Group(),sofas=new THREE.Group();fallback.add(sofas);root.add(fallback);const upholstery=new THREE.MeshStandardMaterial({color:0x574953,roughness:.95});
 for(const x of [-4.8,4.8]){box(2.65,.4,1.05,upholstery,x,.36,-2.8,sofas);box(2.65,.68,.24,upholstery,x,.81,-3.24,sofas);for(const sign of [-1,1])box(.23,.63,1.1,upholstery,x+sign*1.24,.63,-2.8,sofas);}
 const table=box(2.3,.13,1.28,bronze,0,.58,0,fallback);
 const gltf=new GLTFLoader();
 function fit(source,x,z,w,d,h,yaw=0){const g=source.clone(true);g.rotation.y=yaw;g.updateMatrixWorld(true);const bound=new THREE.Box3().setFromObject(g),size=bound.getSize(new THREE.Vector3()),scale=Math.min(w/size.x,d/size.z,h/size.y);g.scale.setScalar(scale);g.updateMatrixWorld(true);bound.setFromObject(g);const center=bound.getCenter(new THREE.Vector3());g.position.set(x-center.x,-bound.min.y,z-center.z);return g;}
 const furniture=Promise.allSettled([gltf.loadAsync(new URL('legacy/sofa_03_2k.gltf',base).href),gltf.loadAsync(new URL('models/gothic_coffee_table.glb',base).href)]).then(results=>{
  if(!alive()){for(const r of results)if(r.status==='fulfilled')dispose(r.value.scene);return {complete:false};}
  if(results[0].status==='fulfilled'){sofas.visible=false;const s=results[0].value.scene;for(const x of [-4.8,4.8])root.add(fit(s,x,-2.8,2.9,1.22,1.2));}
  if(results[1].status==='fulfilled'){table.visible=false;root.add(fit(results[1].value.scene,0,0,2.55,1.6,.68));}
  root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});return {complete:results.every(r=>r.status==='fulfilled')};
 });
 scene.add(new THREE.HemisphereLight(0xc1cbdc,0x4c352b,1.05));const key=new THREE.DirectionalLight(0xffe1b7,2.3);key.position.set(-2,4,3);scene.add(key);
 const accent=new THREE.PointLight(0x9b75d7,17,12,2);accent.position.set(0,2.7,-5);scene.add(accent);const lamp=new THREE.PointLight(0xffd6a6,25,13,2);lamp.position.set(0,3.5,1);scene.add(lamp);
 const envDispose=createR40Environment(scene,renderer);scene.environmentIntensity=.7;
 return {dispose:envDispose,ready:Promise.allSettled(pending).then(async textures=>{const f=await furniture;return {complete:f.complete&&textures.every(t=>t.status==='fulfilled')};})};
}
