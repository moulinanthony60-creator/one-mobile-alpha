import { replaceR41Volume, addR41Furniture } from './three17-r41-furniture.js?v=appels-v52';
import * as THREE from './three.module.js?v=appels-v52';
import { GLTFLoader } from './GLTFLoader.js?v=appels-v52';
import { mergeGeometries } from './BufferGeometryUtils.js?v=appels-v52';

// This module only produces render objects. It never mutates house solids,
// doors, items, navigation, search targets or hiding spots.
const rootURL = new URL('../assets/317/', import.meta.url);
export const r40Mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
const replacements = new Set(['armoire','rdc-palier-armoire','upper-palier-armoire',
  'nursery-wardrobe','upper-master-wardrobe','upper-master-bed','nursery-bed',
  'rdc-palier-console','upper-palier-commode','rdc-palier-banc','baignoire-base','upper-bath-tub','wc-base']);
export function replaceR40Volume(v) {
  return replaceR41Volume(v) || replacements.has(v.id) || /^(table-basse-|table-repas-|upper-master-table-|upper-palier-table-|fenetre-)/.test(v.id);
}

export function applyR40Materials(materials) {
  const loader = new THREE.TextureLoader(), loads = [], cache = new Map();
  function map(name, channel) {
    const key=name+'_'+channel;
    if(cache.has(key))return cache.get(key);
    let resolve, reject;
    loads.push(new Promise((yes,no)=>{resolve=yes;reject=no;}));
    const t=loader.load(new URL('r40/'+(r40Mobile?'mobile/':'')+'materials/'+key+'_1k.jpg',rootURL).href,resolve,undefined,reject);
    t.colorSpace=channel==='diff'?THREE.SRGBColorSpace:THREE.NoColorSpace;
    t.wrapS=t.wrapT=THREE.RepeatWrapping;cache.set(key,t);return t;
  }
  function pbr(kind, name, tint, roughness, normal=.65) {
    const m=materials[kind];m.map?.dispose();
    m.map=map(name,'diff');m.normalMap=map(name,'nor_gl');
    m.roughnessMap=map(name,'arm');m.aoMap=m.roughnessMap;
    m.color.set(tint);m.roughness=roughness;m.metalness=0;m.aoMapIntensity=.65;
    m.normalScale.set(normal,normal);m.needsUpdate=true;
  }
  pbr('plaster','worn_plaster_wall',0xc1bcaf,.96,.58);
  pbr('ceiling','worn_plaster_wall',0x87847b,1,.35);
  pbr('wallBase','weathered_peeling_timber',0x646756,.93,.55);
  pbr('wood','weathered_peeling_timber',0x736451,.86,.45);
  pbr('trim','weathered_peeling_timber',0x655647,.87,.35);
  pbr('woodFloor','lacquered_cherry_wood',0xad9c88,.49,.35);
  pbr('hallFloor','lacquered_cherry_wood',0x92816d,.64,.38);
  pbr('kitchenFloor','worn_tile_floor',0xadb2a8,.85,.65);
  pbr('bathFloor','worn_tile_floor',0xaab6b3,.57,.70);
  pbr('stoneFloor','worn_plaster_wall',0x5e625a,.97,.9);
  pbr('cabinet','weathered_peeling_timber',0x919381,.83,.38);
  materials.bulb.emissive.set(0xffc47f);materials.bulb.emissiveIntensity=2;
  materials.metal.color.set(0x796746);materials.metal.metalness=.72;materials.metal.roughness=.43;
  return Promise.all(loads);
}

export function createR40Environment(scene,renderer) {
  const w=128,h=64,data=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let c=y<h/2?[42,43,46]:[17,14,11];
    if((x>22&&x<29||x>89&&x<96)&&y>20&&y<42)c=[115,139,162];
    if(x>58&&x<63&&y>12&&y<18)c=[205,147,81];
    const i=(y*w+x)*4;data.set([...c,255],i);
  }
  const texture=new THREE.DataTexture(data,w,h);texture.mapping=THREE.EquirectangularReflectionMapping;texture.needsUpdate=true;
  const generator=new THREE.PMREMGenerator(renderer),target=generator.fromEquirectangular(texture);
  scene.environment=target.texture;scene.environmentIntensity=.48;
  texture.dispose();generator.dispose();return ()=>{scene.environment=null;target.dispose();};
}

export async function addR40Details(scene, house, parts, alive) {
  const decor=new THREE.Group();decor.name='R40-habillage';
  const mat=parts.materials;
  const brass=mat.metal,wood=mat.trim;
  const enamel=new THREE.MeshStandardMaterial({color:0xb5b4a4,roughness:.34,metalness:.04});
  const porcelain=new THREE.MeshStandardMaterial({color:0x7e847a,roughness:.4});
  const iron=new THREE.MeshStandardMaterial({color:0x1d2423,roughness:.62,metalness:.6});
  const dirt=new THREE.MeshStandardMaterial({color:0x363b2c,roughness:1});
  const bulb=new THREE.MeshStandardMaterial({color:0xffe0af,emissive:0xffb34c,emissiveIntensity:2.3});
  const unit=new THREE.BoxGeometry(1,1,1);
  const host=id=>house.volumes.find(v=>v.id===id);
  const records=[];
  addR41Furniture(decor,house,mat);
  function mesh(geometry,material,x,y,z,parent=decor){
    const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  function box(x,y,z,w,h,d,m=wood,parent=decor){const o=mesh(unit,m,x,y,z,parent);o.scale.set(w,h,d);return o;}
  function sphere(x,y,z,w,h,d,m=brass,parent=decor){const o=mesh(new THREE.SphereGeometry(1,12,8),m,x,y,z,parent);o.scale.set(w,h,d);return o;}
  function pipe(points,r=.018,m=brass,parent=decor){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,r,6,false),m,0,0,0,parent);}

  // Door ornament is attached to each original animated hinge.
  for(const d of house.doors){
    const parent=parts.doorMeshes.get(d.id);
    for(const s of [-1,1]){
      for(const y of [.24,1.14,1.96]){
        box(.02,y,s*.05,.06,.13,.035,brass,parent);
        sphere(.02,y,s*.064,.031,.055,.025,brass,parent);
      }
      box(d.width-.14,1.02,s*.065,.07,.24,.017,brass,parent);
      sphere(d.width-.14,.945,s*.079,.011,.017,.008,iron,parent);
      for(const y of [.56,1.55]) for(const xx of [.12,d.width-.12])
        box(xx,y,s*.065,.014,.69,.012,brass,parent);
    }
  }

  // Windows occupy existing decorative positions; solid exterior walls stay intact.
  const rainCanvas=document.createElement('canvas');rainCanvas.width=128;rainCanvas.height=256;
  const rain=rainCanvas.getContext('2d');
  rain.fillStyle='#101820';rain.fillRect(0,0,128,256);
  const sky=rain.createLinearGradient(0,0,0,256);sky.addColorStop(0,'#253849');sky.addColorStop(1,'#06090b');rain.fillStyle=sky;rain.fillRect(0,0,128,256);
  rain.strokeStyle='#050809';rain.lineWidth=5;
  for(let i=0;i<12;i++){rain.beginPath();rain.moveTo((i*47)%128,256);rain.lineTo((i*31+17)%128,28+i*7);rain.stroke();}
  rain.strokeStyle='#9eafb91c';rain.lineWidth=1;
  for(let i=0;i<45;i++){const x=i*37%128,y=i*59%256;rain.beginPath();rain.moveTo(x,y);rain.lineTo(x+2,y+20+i%16);rain.stroke();}
  const windowMap=new THREE.CanvasTexture(rainCanvas);windowMap.colorSpace=THREE.SRGBColorSpace;
  const night=new THREE.MeshStandardMaterial({map:windowMap,color:0x8194a3,emissive:0x263d54,emissiveMap:windowMap,emissiveIntensity:.4,roughness:.19,metalness:.2});
  const curtain=mat.fabric.clone();curtain.color.set(0x746757);curtain.side=THREE.DoubleSide;
  for(const v of house.volumes.filter(v=>v.id.startsWith('fenetre-cadre-'))){
    const s=v.x<0?1:-1, x=v.x+s*.085;
    box(x,1.94,v.z,.025,1.18,1.30,night);
    for(const z of [v.z-.73,v.z+.73])box(x+s*.06,1.96,z,.15,1.50,.11);
    for(const y of [1.23,2.68])box(x+s*.06,y,v.z,.15,.11,1.55);
    box(x+s*.1,1.22,v.z,.32,.11,1.73);
    box(x+s*.10,1.95,v.z,.065,1.38,.045);
    box(x+s*.10,1.95,v.z,.065,.045,1.45);
    for(const edge of [-1,1]){
      const g=new THREE.PlaneGeometry(.37,1.88,10,16),p=g.attributes.position;
      for(let i=0;i<p.count;i++)p.setZ(i,.045*Math.sin(p.getX(i)*95)+.015*Math.sin(p.getY(i)*11));g.computeVertexNormals();
      const cloth=mesh(g,curtain,x+s*.24,1.84,v.z+edge*.87);cloth.rotation.y=s*Math.PI/2;
    }
    const rod=mesh(new THREE.CylinderGeometry(.014,.014,2.04,8),brass,x+s*.23,2.81,v.z);rod.rotation.x=Math.PI/2;
  }

  // Sanitary ware: curved porcelain, hollow basins and visible taps.
  function bowl(v,w,d,y){
    const profile=[[0,.02],[.24,.02],[.38,.09],[.46,.23],[.49,.30],[.50,.31],[.47,.34],[.44,.31],[.40,.15],[.27,.08],[0,.08]].map(p=>new THREE.Vector2(...p));
    const b=mesh(new THREE.LatheGeometry(profile,32),enamel,v.x,y,v.z);b.scale.set(w,1,d);
    sphere(v.x,y+.075,v.z,.035,.003,.035,iron);
  }
  for(const id of ['baignoire-base','upper-bath-tub']){
    const v=host(id),floor=v.y-v.h/2;
    bowl(v,v.w*.94,v.d*.94,floor+.20);
    for(const dx of [-.38,.38])for(const dz of [-.72,.72])sphere(v.x+dx,floor+.13,v.z+dz,.08,.15,.06,brass);
    pipe([[v.x,floor+.35,v.z-v.d*.39],[v.x,floor+.78,v.z-v.d*.39],[v.x,floor+.79,v.z-v.d*.27],[v.x,floor+.67,v.z-v.d*.22]]);
    for(const dx of [-.12,.12])box(v.x+dx,floor+.55,v.z-v.d*.39,.11,.023,.04,brass);
  }
  for(const id of ['lavabo-meuble','upper-vanity','laundry-sink']){
    const v=host(id),y=v.y+v.h/2;
    bowl(v,.82,.51,y-.16);
    pipe([[v.x,y,v.z-.20],[v.x,y+.31,v.z-.20],[v.x,y+.32,v.z],[v.x,y+.23,v.z]]);
    for(const dx of [-.12,.12])box(v.x+dx,y+.025,v.z-.22,.085,.025,.035,brass);
    box(v.x,y-.25,v.z+v.d/2+.015,.19,.027,.035,brass);
  }
  {const v=host('wc-base'),f=v.y-v.h/2;
    sphere(v.x,f+.20,v.z,.19,.22,.24,porcelain);bowl(v,.49,.65,f+.20);
    box(v.x,f+.69,v.z+.26,.47,.47,.15,enamel);box(v.x,f+.935,v.z+.26,.49,.025,.18,enamel);
    sphere(v.x+.13,f+.85,v.z+.17,.037,.016,.02,brass);
  }
  const west=host('cuisine-plan-ouest'),north=host('cuisine-plan-nord');
  bowl({...west,z:west.z+.58},.69,.91,west.y-.13);
  pipe([[west.x-.28,1.0,west.z+.57],[west.x-.28,1.36,west.z+.57],[west.x+.03,1.38,west.z+.57],[west.x+.1,1.22,west.z+.57]],.022,brass);
  box(north.x+.5,1.023,north.z,.84,.024,.64,iron);
  for(const dx of [-.22,.22])for(const dz of [-.17,.17]){
    mesh(new THREE.CylinderGeometry(.12,.12,.015,18),iron,north.x+.5+dx,1.045,north.z+dz);
    const ring=mesh(new THREE.TorusGeometry(.086,.011,4,18),brass,north.x+.5+dx,1.057,north.z+dz);ring.rotation.x=Math.PI/2;
  }
  box(north.x+.5,.47,north.z+.46,.76,.48,.025,iron);
  box(north.x+.5,.76,north.z+.49,.62,.035,.08,brass);
  for(const dx of [-.25,-.08,.08,.25])sphere(north.x+.5+dx,.85,north.z+.49,.025,.025,.018,brass);
  const fridge=host('frigo');

  // Sparse, seeded marks: no random gameplay state is consumed.
  let seed=31740;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const stainCanvas=document.createElement('canvas');stainCanvas.width=stainCanvas.height=128;
  const ctx=stainCanvas.getContext('2d');
  for(let i=0;i<110;i++){const x=random()*128,y=random()*128,r=3+random()*16;ctx.fillStyle='rgba(23,29,17,.11)';ctx.beginPath();ctx.ellipse(x,y,r,r*.45,0,0,7);ctx.fill();}
  const stainMap=new THREE.CanvasTexture(stainCanvas);
  const stain=new THREE.MeshStandardMaterial({color:0x35351e,map:stainMap,transparent:true,opacity:.57,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,roughness:1});
  const blood=stain.clone();blood.color.set(0x460f0a);blood.opacity=.86;blood.roughness=.52;
  const fridgeGrime=mesh(new THREE.PlaneGeometry(.9,1.72),stain,fridge.x,.97,fridge.z+.591);fridgeGrime.castShadow=false;
  const washer=host('laundry-machine');
  const washerGrime=mesh(new THREE.PlaneGeometry(.89,.95),stain,washer.x,washer.y,washer.z+.456);washerGrime.castShadow=false;
  house.rooms.forEach((r,i)=>{
    const x=(r.x0+r.x1)/2,z=(r.z0+r.z1)/2;
    const spot=mesh(new THREE.PlaneGeometry(1.0+random(),.7+random()),i%5===0?blood:stain,x,r.floorY+.016,z);
    spot.rotation.x=-Math.PI/2;spot.rotation.z=random()*5;spot.castShadow=false;
    const wall=mesh(new THREE.PlaneGeometry(1.1,1.35),i%7===0?blood:stain,x,r.floorY+.86,r.z0+.136);wall.castShadow=false;
  });
  const threads=[];
  house.rooms.filter((r,i)=>i%2===0).forEach(r=>{
    const o=new THREE.Vector3(r.x0+.16,r.floorY+2.72,r.z0+.16);
    for(let ray=0;ray<7;ray++){
      const angle=ray/6*Math.PI/2,end=o.clone().add(new THREE.Vector3(Math.cos(angle)*.72,-Math.sin(angle)*.56,.015));threads.push(o.x,o.y,o.z,end.x,end.y,end.z);
    }
    for(let k=1;k<6;k++)for(let ray=0;ray<6;ray++){
      const a=ray/6*Math.PI/2,b=(ray+1)/6*Math.PI/2;
      threads.push(o.x+Math.cos(a)*k*.12,o.y-Math.sin(a)*k*.095,o.z+.015,o.x+Math.cos(b)*k*.12,o.y-Math.sin(b)*k*.095,o.z+.015);
    }
  });
  const webGeo=new THREE.BufferGeometry();webGeo.setAttribute('position',new THREE.Float32BufferAttribute(threads,3));
  const webs=new THREE.LineSegments(webGeo,new THREE.LineBasicMaterial({color:0x8d918a,transparent:true,opacity:.22,depthWrite:false}));decor.add(webs);

  // GLB assets are shared per session. Only two conversions load concurrently.
  const specs=[];
  function asset(file,id,w,h,d,yaw=0,offsetY=0){const v=host(id);specs.push({file,id,x:v.x,y:v.y-v.h/2+offsetY,z:v.z,w:w??v.w,h:h??v.h,d:d??v.d,yaw});}
  asset('gothic_coffee_table','table-basse-plateau',1.22,.49,1.62,Math.PI/2,-.38);
  asset('dining_table','table-repas-plateau',1.82,.79,1.32,0,-.68);
  asset('GothicCommode_01_2k.gltf','buffet',.70,.96,2.0,Math.PI/2);
  asset('GothicCommode_01_2k.gltf','meuble-tv',2.05,.62,.55,Math.PI);
  asset('GothicCommode_01_2k.gltf','office-cabinet',.80,1.10,.65,0);
  asset('GothicCabinet_01','laundry-cabinet',.80,2.0,1.2,Math.PI/2);
  asset('gallinera_table','office-desk-plateau',1.70,.76,.75,0,-.64);
  asset('chinese_tea_table','nursery-desk-plateau',1.10,.72,.60,0,-.60);
  asset('dining_table','ritual-table',1.60,.90,1.60,0);
  asset('gallinera_table','boiler-bench-plateau',1.80,.72,.70,0,-.60);
  for(const id of ['armoire','rdc-palier-armoire','upper-palier-armoire','upper-master-wardrobe'])asset('GothicCabinet_01',id,null,null,null,-Math.PI/2);
  asset('GothicCabinet_01','nursery-wardrobe',null,null,null,Math.PI/2);
  asset('gallinera_table','upper-palier-table-plateau',1.12,.66,.62,0,-.56);
  asset('chinese_tea_table','upper-master-table-plateau',1.08,.70,.68,0,-.60);
  asset('GothicCommode_01_2k.gltf','chevet',.64,.90,.66,Math.PI);
  asset('GothicCommode_01_2k.gltf','rdc-palier-console',1.52,.85,.50,0);
  asset('GothicCommode_01_2k.gltf','upper-palier-commode',1.72,.85,.50,0);
  asset('GothicBed_01_2k.gltf','lit-sommier',1.95,1.40,2.86,Math.PI);
  asset('GothicBed_01_2k.gltf','upper-master-bed',2.05,1.40,3.12,Math.PI);
  asset('GothicBed_01_2k.gltf','nursery-bed',1.56,1.15,2.55,Math.PI);
  asset('sofa_03_2k.gltf','canape-assise',1.18,1.18,2.75,Math.PI/2);
  // Extra furniture sits on existing solid furniture footprints, never in a path.
  for(const [file,x] of [['GreenChair_01',8.80],['Rockingchair_01',9.85]])
    specs.push({file,id:'siege-palier-'+file,x,y:0,z:-11.25,w:.92,h:1.16,d:.56,yaw:0});
  specs.push({file:'brass_candleholders',id:'bougeoirs',x:-4.4,y:.81,z:-.65,w:.55,h:.40,d:.40,yaw:0});
  specs.push({file:'small_plastic_torch',id:'lampe-posee',x:7.15,y:.87,z:-11.28,w:.24,h:.09,d:.12,yaw:.4});
  for(const [i,p] of parts.lampPositions.entries())specs.push({file:i%3===0?'Chandelier_03':'lantern_chandelier_01',id:'luminaire-'+i,x:p[0],y:p[1]-.30,z:p[2],w:.5,h:.48,d:.5,yaw:0});
  const files=[...new Set(specs.map(s=>s.file))],templates=new Map(),loader=new GLTFLoader();
  async function worker(){
    while(files.length){const f=files.shift();
      const path=f.endsWith('.gltf')?(r40Mobile?'r40/mobile/legacy/':'')+f:'r40/'+(r40Mobile?'mobile/':'')+'models/'+f+'.glb';
      const gltf=await loader.loadAsync(new URL(path,rootURL).href);templates.set(f,gltf.scene);
    }
  }
  try{
    const loaded=await Promise.allSettled([worker(),worker(),parts.pbrReady]);
    const failed=loaded.find(r=>r.status==='rejected');if(failed)throw failed.reason;
    if(!alive()){disposeObjects([...templates.values(),decor]);return;}
    for(const s of specs){
      const object=templates.get(s.file).clone(true);object.name='R40-'+s.id;object.rotation.y=s.yaw;
      object.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3());
      // Respect collision footprints. Height can vary naturally for decorative tops.
      const maxHeight=/bed|lit-|armoire|wardrobe|canape/.test(s.id)?2.7:s.h;
      object.scale.setScalar(Math.min(s.w/size.x,s.d/size.z,maxHeight/size.y));
      if(/armoire|wardrobe|laundry-cabinet/.test(s.id))object.scale.y*=Math.min(1.85,s.h*.96/(size.y*object.scale.y));
      object.updateMatrixWorld(true);
      bounds=new THREE.Box3().setFromObject(object);const center=bounds.getCenter(new THREE.Vector3());
      object.position.set(s.x-center.x,s.y-bounds.min.y,s.z-center.z);object.updateMatrixWorld(true);
      object.traverse(o=>{if(o.isMesh){o.castShadow=!s.id.startsWith('luminaire');o.receiveShadow=true;}});
      records.push({id:s.id,file:s.file,bounds:new THREE.Box3().setFromObject(object).min.toArray().concat(new THREE.Box3().setFromObject(object).max.toArray())});decor.add(object);
    }
    // Rounded visible bulbs independent of the model material names.
    for(const p of parts.lampPositions)sphere(p[0],p[1]-.27,p[2],.04,.07,.04,bulb);
    decor.updateMatrixWorld(true);mergeStatic(decor);
    for(const pivot of parts.doorMeshes.values())mergeStatic(pivot);
    decor.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});scene.add(decor);scene.userData.r40={ready:true,placements:records,assetCount:templates.size};
  }catch(error){disposeObjects([...templates.values(),decor]);throw error;}
}

function mergeStatic(group){
  group.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
  const batches=new Map(),originalGeos=new Set(),old=[];
  group.traverse(o=>{
    if(!o.isMesh||Array.isArray(o.material))return;
    const attrs=Object.keys(o.geometry.attributes).sort().join(',');
    o.geometry.computeBoundingBox();
    const center=o.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(o.matrixWorld);
    const cell=group.name==='R40-habillage'?[Math.floor(center.x/6),Math.floor((center.y+.1)/3.25),Math.floor(center.z/6)].join(':'):'';
    const key=o.material.uuid+'|'+attrs+'|'+o.castShadow+'|'+cell;
    if(!batches.has(key))batches.set(key,{material:o.material,shadow:o.castShadow,geos:[]});
    const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
    if(!g.index){const indexes=Array.from({length:g.attributes.position.count},(_,i)=>i);g.setIndex(indexes);}
    batches.get(key).geos.push(g);originalGeos.add(o.geometry);old.push(o);
  });
  for(const o of old)o.removeFromParent();
  for(const batch of batches.values()){
    const geometry=mergeGeometries(batch.geos,false);
    if(!geometry)throw new Error('R40: fusion des décors impossible');
    geometry.computeBoundingSphere();const m=new THREE.Mesh(geometry,batch.material);m.castShadow=batch.shadow;m.receiveShadow=true;group.add(m);
    batch.geos.forEach(g=>g.dispose());
  }
  for(const g of originalGeos)g.dispose();
}
function disposeObjects(objects){
  const geos=new Set(),mats=new Set(),maps=new Set();
  for(const root of objects)root.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)mats.add(m);});
  for(const m of mats)for(const value of Object.values(m))if(value?.isTexture)maps.add(value);
  for(const t of maps){t.dispose();t.source?.data?.close?.();}for(const m of mats)m.dispose();for(const g of geos)g.dispose();
}
