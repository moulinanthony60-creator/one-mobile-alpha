import * as THREE from './vendor/three.module.js';
import {createArchitecture,createVillageProps,createForest} from './battle3d-models.mjs?v=2';
import {createVillageArt,VILLAGE_CAMERA} from './battle3d-village-art.mjs?v=4';
import {actorGeometries,drawTroop} from './battle3d-actors.mjs?v=2';

const UP=new THREE.Vector3(0,1,0),color=new THREE.Color(),local=new THREE.Object3D(),composed=new THREE.Matrix4();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class Batches {
  constructor(scene,geometries,material,capacity=2048){
    this.entries={};
    for(const [shape,geometry] of Object.entries(geometries)){
      const mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;
      scene.add(mesh);this.entries[shape]={mesh,count:0,capacity};
    }
  }
  begin(){for(const entry of Object.values(this.entries))entry.count=0;}
  put(shape,tint,m){const entry=this.entries[shape];if(entry.count>=entry.capacity)return;entry.mesh.setMatrixAt(entry.count,m);entry.mesh.setColorAt(entry.count,color.set(tint));entry.count++;}
  end(){for(const {mesh,count} of Object.values(this.entries)){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
}

export function createScene(canvas,battle){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#a4b99a');scene.fog=new THREE.Fog('#a4b99a',42,90);
  const camera=new THREE.OrthographicCamera(-15,15,15,-15,.1,140),target=new THREE.Vector3(0,.3,0),cameraOffset=new THREE.Vector3(14,27,28);
  const sunlight=new THREE.DirectionalLight('#fff0cb',3.1);sunlight.position.set(-13,22,11);sunlight.castShadow=true;
  sunlight.shadow.mapSize.set(1024,1024);Object.assign(sunlight.shadow.camera,{left:-20,right:20,top:18,bottom:-18,near:1,far:65});sunlight.shadow.bias=-.0007;sunlight.shadow.normalBias=.05;scene.add(sunlight);
  scene.add(new THREE.HemisphereLight('#d5ebff','#8e914d',1.35));
  const architectureMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:.035});
  const actorMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.63,metalness:.12});
  const geometry=actorGeometries(),dynamic=new Batches(scene,geometry,actorMaterial,2048);
  const glowMaterial=new THREE.MeshBasicMaterial({color:0xffffff}),glow=new Batches(scene,{sphere:geometry.sphere,rock:geometry.rock,torus:geometry.torus},glowMaterial,256);
  const templates=new Map(),architecture=new Map(),windmills=[],resources=[];
  const destroyed=new Map(),deadUnits=new Map(),directions=new Map(),positions=new Map(),seenEffects=new Set(),particles=[];
  const root=new THREE.Object3D(),ray=new THREE.Raycaster(),ground=new THREE.Plane(UP,0),intersection=new THREE.Vector3();
  let viewTime=0,zoom=1.12,disposed=false,economy=false,markerUntil=0,villageArt=null,villageMode=false;
  const artAbort=new AbortController();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function addMesh(g,mat,cast=false){const mesh=new THREE.Mesh(g,mat);mesh.receiveShadow=true;mesh.castShadow=cast;scene.add(mesh);resources.push(g);return mesh;}
  function texture(width,height,paint){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');paint(ctx,width,height);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());resources.push(t);return t;}
  let seed=17009;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const meadow=texture(256,256,(ctx,w,h)=>{
    ctx.fillStyle='#739c49';ctx.fillRect(0,0,w,h);
    for(let i=0;i<3200;i++){ctx.fillStyle=i%2?'#bed77a18':'#315f3316';ctx.fillRect(random()*w,random()*h,1+random()*7,1+random()*5);}
  });meadow.wrapS=meadow.wrapT=THREE.RepeatWrapping;meadow.repeat.set(16,16);
  const groundMaterial=new THREE.MeshStandardMaterial({map:meadow,roughness:1});
  const land=addMesh(new THREE.PlaneGeometry(100,100),groundMaterial);land.rotation.x=-Math.PI/2;land.position.y=-.025;
  const streets=texture(1024,820,(ctx,w,h)=>{
    ctx.fillStyle='#83bb45';ctx.fillRect(0,0,w,h);
    for(let i=0;i<2400;i++){ctx.fillStyle=i%3?'#b9cd6308':'#476d3606';ctx.beginPath();ctx.ellipse(random()*w,random()*h,2+random()*12,2+random()*9,0,0,Math.PI*2);ctx.fill();}
    const paths=[[[10,16],[10,12],[10,9.2]],[[3,8],[6.3,8],[8.3,8],[10,9.4],[13.5,8],[17,8]],[[6.7,4.6],[7.8,5.5],[10,5.6],[13.4,5.6]],[[13.6,8],[13.6,11.2],[10,12]],[[6.7,9.2],[6.7,11.8],[10,12]]];
    ctx.lineJoin=ctx.lineCap='round';
    for(const path of paths){
      for(const [width,tint] of [[.9,'#5e793a'],[.76,'#a08d57'],[.59,'#c4b17b']]){
        ctx.lineWidth=width*w/20;ctx.strokeStyle=tint;ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x*w/20,y*h/16):ctx.moveTo(x*w/20,y*h/16));ctx.stroke();
      }
      for(let segment=1;segment<path.length;segment++){
        const a=path[segment-1],b=path[segment],distance=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(distance/.22);
        for(let i=0;i<count;i++)for(const side of [-1,1]){
          const t=i/count,x=(a[0]+(b[0]-a[0])*t+side*.16*(b[1]-a[1])/distance)*w/20,y=(a[1]+(b[1]-a[1])*t-side*.16*(b[0]-a[0])/distance)*h/16;
          ctx.fillStyle=['#c9bd94','#d6c9a0','#b9ad84'][i%3];ctx.beginPath();ctx.roundRect(x-4,y-3,7+random()*4,6+random()*3,2);ctx.fill();
        }
      }
    }
    for(let i=0;i<420;i++){ctx.fillStyle=i%7?'#4b7d361e':'#d7d47c65';ctx.fillRect(random()*w,random()*h,2,3);}
  });
  const streetMaterial=new THREE.MeshStandardMaterial({map:streets,roughness:1});const road=addMesh(new THREE.PlaneGeometry(20,16),streetMaterial);road.rotation.x=-Math.PI/2;road.position.y=.015;
  const forest3d=addMesh(createForest(),architectureMaterial,true),props3d=addMesh(createVillageProps(),architectureMaterial,true);
  const villageGroundMaterial=new THREE.MeshBasicMaterial({color:'#83bb45',toneMapped:false,fog:false}),villageStreetMaterial=new THREE.MeshBasicMaterial({map:streets,toneMapped:false,fog:false});

  for(const kind of new Set(battle.buildings.map(b=>b.kind))){
    const model=createArchitecture(kind);templates.set(kind,model);resources.push(model.geometry,...model.animated.map(a=>a.geometry));
    const buildings=battle.buildings.filter(b=>b.kind===kind),mesh=new THREE.InstancedMesh(model.geometry,architectureMaterial,buildings.length);
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);architecture.set(kind,{mesh,buildings});
    for(const b of buildings)for(const part of model.animated){
      const pivot=new THREE.Group(),m=new THREE.Mesh(part.geometry,architectureMaterial);m.castShadow=false;m.receiveShadow=true;pivot.add(m);scene.add(pivot);windmills.push({building:b,part,pivot,mesh:m});
    }
  }
  const shadowTexture=texture(64,64,(ctx,w,h)=>{const gradient=ctx.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'rgba(22,40,23,.65)');gradient.addColorStop(1,'rgba(22,40,23,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);});
  const shadowGeometry=new THREE.PlaneGeometry(1,1),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.6});
  const contacts=new THREE.InstancedMesh(shadowGeometry,shadowMaterial,100);contacts.count=0;contacts.frustumCulled=false;contacts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(contacts);

  const border=new THREE.Shape();border.moveTo(-10,-8);border.lineTo(10,-8);border.lineTo(10,8);border.lineTo(-10,8);border.closePath();
  const hole=new THREE.Path();hole.moveTo(-7,-5);hole.lineTo(-7,5);hole.lineTo(7,5);hole.lineTo(7,-5);hole.closePath();border.holes.push(hole);
  const borderMesh=addMesh(new THREE.ShapeGeometry(border),new THREE.MeshBasicMaterial({color:'#76dbea',transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide}));borderMesh.rotation.x=-Math.PI/2;borderMesh.position.y=.035;
  const boundaryPoints=[];for(const [x,z,dx,dz,n] of [[-7,-5,1,0,14],[-7,5,1,0,14],[-7,-5,0,1,10],[7,-5,0,1,10]])for(let i=0;i<n;i++)boundaryPoints.push(new THREE.Vector3(x+dx*(i+.12),.045,z+dz*(i+.12)),new THREE.Vector3(x+dx*(i+.65),.045,z+dz*(i+.65)));
  const boundary=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(boundaryPoints),new THREE.LineBasicMaterial({color:'#c1eef2',transparent:true,opacity:.65}));scene.add(boundary);
  const marker=addMesh(new THREE.RingGeometry(.38,.44,32),new THREE.MeshBasicMaterial({color:'#bdf1ff',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.06;

  function parent(x,y,z,scale=1,ry=0,rx=0,rz=0){root.position.set(x,y,z);root.scale.setScalar(scale);root.rotation.set(rx,ry,rz);root.updateMatrix();return root.matrix;}
  function add(shape,tint,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,base=null,luminous=false){
    local.position.set(x,y,z);local.scale.set(sx,sy,sz);local.rotation.set(rx,ry,rz);local.updateMatrix();
    const batch=luminous?glow:dynamic;if(base){composed.multiplyMatrices(base,local.matrix);batch.put(shape,tint,composed);}else batch.put(shape,tint,local.matrix);
  }
  function updateArchitecture(){
    let changing=false;
    for(const [kind,{mesh,buildings}] of architecture){
      buildings.forEach((b,i)=>{
        const death=destroyed.get(b.id),age=death===undefined?0:viewTime-death,scale=death===undefined?1:Math.max(.001,1-age/.7);
        mesh.setMatrixAt(i,parent(b.x-10,death===undefined?0:-Math.min(age,.7)*.35,b.y-8,scale,kind==='cannon'?(directions.get(b.id)||Math.PI):b.rotation||0,death===undefined?0:age*.2));
        mesh.setColorAt(i,color.set(b.hp/b.maxHp<.3?'#c2b49e':'#ffffff'));
        if(death!==undefined&&age<.75)changing=true;
      });mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
    }
    for(const {building,part,pivot,mesh} of windmills){
      pivot.visible=!villageMode&&building.hp>0;pivot.matrixAutoUpdate=false;pivot.matrix.multiplyMatrices(parent(building.x-10,0,building.y-8),part.matrix);mesh.rotation.z=reduced?0:viewTime*.55;
    }
    if(changing)renderer.shadowMap.needsUpdate=true;
  }
  updateArchitecture();renderer.shadowMap.needsUpdate=true;
  function updateCamera(){camera.position.copy(target).add(cameraOffset);camera.lookAt(target);camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();}
  function resize(){
    if(disposed)return;const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);
    const aspect=width/height;camera.position.copy(cameraOffset);camera.lookAt(0,0,0);camera.updateMatrixWorld();let maxX=0,maxY=0;
    for(const x of [-10.3,10.3])for(const z of [-8.3,8.3])for(const y of [0,2]){const v=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}
    const halfHeight=Math.max(maxY,maxX/aspect)*1.02;camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;updateCamera();renderer.render(scene,camera);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function health(x,y,z,fraction,width){
    if(fraction>=.999||fraction<=0)return;root.position.set(x,y,z);root.quaternion.copy(camera.quaternion);root.scale.setScalar(1);root.updateMatrix();const base=root.matrix;
    add('round','#263c32',0,0,0,width,.075,.025,0,0,0,base);add('round',fraction>.4?'#a6d776':'#e69657',-width*(1-fraction)/2,0,.024,width*fraction,.045,.015,0,0,0,base);
  }
  function soldier(unit,b){
    let death=deadUnits.get(unit.id);if(unit.hp<=0&&death===undefined){death=viewTime;deadUnits.set(unit.id,death);}
    const age=death===undefined?0:viewTime-death;if(age>.6)return;
    const previous=positions.get(unit.id)||{x:unit.x,y:unit.y,angle:Math.PI,distance:0,movingUntil:0};
    const dx=unit.x-previous.x,dz=unit.y-previous.y,distance=Math.hypot(dx,dz),moved=distance>.001,movingUntil=moved?viewTime+.09:previous.movingUntil,moving=viewTime<movingUntil;
    const enemy=b.buildings.find(p=>p.id===unit.target&&p.hp>0);let angle=previous.angle;
    if(moved)angle=Math.atan2(dx,dz);else if(!moving&&enemy)angle=Math.atan2(enemy.x-unit.x,enemy.y-unit.y);
    const travel=previous.distance+distance;positions.set(unit.id,{x:unit.x,y:unit.y,angle,distance:travel,movingUntil});
    const walk=moving?Math.sin(travel*8):0,attack=!moving&&unit.cooldown>.4?Math.sin(unit.cooldown*6)*.7:0;
    const scale=death===undefined?.9:.9*Math.max(.01,1-age/.65);
    const base=parent(unit.x-10,.035+(moving?Math.abs(walk)*.025:0),unit.y-8,scale,angle,0,age*2).clone();
    drawTroop(unit.kind,viewTime,reduced?0:walk,reduced?0:attack,(shape,tint,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>add(shape,tint,x,y,z,sx,sy,sz,rx,ry,rz,base));
    health(unit.x-10,1.85,unit.y-8,unit.hp/unit.maxHp,.64);
  }
  function effects(b){
    for(const fx of b.effects){
      if(seenEffects.has(fx.visualId))continue;seenEffects.add(fx.visualId);
      if(fx.kind==='spell')particles.push({kind:'spell',x:fx.x,z:fx.y,born:viewTime,duration:.8});
      else{
        const source=b.units.find(u=>Math.abs(u.x-fx.fromX)<.06&&Math.abs(u.y-fx.fromY)<.06),defense=fx.kind==='enemy'?b.buildings.find(p=>p.x===fx.fromX&&p.y===fx.fromY):null;
        const destination=fx.kind==='enemy'?null:b.buildings.find(p=>p.x===fx.x&&p.y===fx.y);
        if(defense){directions.set(defense.id,Math.atan2(fx.x-defense.x,fx.y-defense.y));if(defense.kind==='cannon')renderer.shadowMap.needsUpdate=true;}
        particles.push({kind:'shot',x:fx.x,z:fx.y,fromX:fx.fromX,fromZ:fx.fromY,enemy:fx.kind==='enemy',magic:source?.kind==='mages',height:defense?.kind==='tower'?2.2:1.1,targetHeight:destination?templates.get(destination.kind).height*.45:.9,born:viewTime,duration:.32});
      }
    }
    if(seenEffects.size>600){const recent=[...seenEffects].slice(-160);seenEffects.clear();for(const id of recent)seenEffects.add(id);}
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i],t=(viewTime-p.born)/p.duration;if(t>=1){particles.splice(i,1);continue;}
      if(p.kind==='shot'){
        const x=p.fromX+(p.x-p.fromX)*t-10,z=p.fromZ+(p.z-p.fromZ)*t-8,y=p.height*(1-t)+p.targetHeight*t+Math.sin(t*Math.PI)*.4,size=p.magic?.12:p.enemy?.11:.055;
        add('sphere',p.magic?'#a886f4':p.enemy?'#3d4249':'#e7c675',x,y,z,size,size,size,0,0,0,null,p.magic);
        if(p.magic)for(let j=1;j<4;j++){const trail=Math.max(0,t-j*.06);add('sphere','#c9b0ff',p.fromX+(p.x-p.fromX)*trail-10,y,p.fromZ+(p.z-p.fromZ)*trail-8,size/(j+1),size/(j+1),size/(j+1),0,0,0,null,true);}
      }else{
        const spell=p.kind==='spell',spread=(.15+t)*(spell?2.5:1);
        for(let j=0;j<(economy?6:12);j++){const a=j*Math.PI/6,sz=(spell?.12:.24)*(1-t);add(spell?'rock':'sphere',spell?(j%2?'#dfbdff':'#a9eff0'):'#bfb591',p.x-10+Math.cos(a)*spread,.15+Math.sin(t*Math.PI)*(spell?2:1.1),p.z-8+Math.sin(a)*spread,sz,sz*1.3,sz,0,a,0,null,spell);}
        if(spell)add('torus','#c8a2ff',p.x-10,.09,p.z-8,Math.max(.05,t*2.5),Math.max(.05,t*2.5),.05,Math.PI/2,0,0,null,true);
      }
    }
  }
  function contactShadows(b){let index=0;const place=(x,z,w,d)=>{local.position.set(x,.04,z);local.rotation.set(-Math.PI/2,0,0);local.scale.set(w,d,1);local.updateMatrix();contacts.setMatrixAt(index++,local.matrix);};
    if(!villageMode)for(const building of b.buildings){const template=templates.get(building.kind);place(building.x-10,building.y-8,template.width*1.25,template.depth*1.25);}
    for(const unit of b.units)if(unit.hp>0)place(unit.x-10,unit.y-8,.7,.58);
    contacts.count=index;contacts.instanceMatrix.needsUpdate=true;
  }
  function frame(b,dt,animate=true){
    if(disposed)return;if(animate)viewTime+=Math.min(dt,.05);dynamic.begin();glow.begin();
    for(const building of b.buildings){
      if(building.hp<=0&&!destroyed.has(building.id)){destroyed.set(building.id,viewTime);particles.push({kind:'dust',x:building.x,z:building.y,born:viewTime,duration:.8});renderer.shadowMap.needsUpdate=true;}
      if(building.hp<=0){
        const {width,depth}=building.collision,wall=building.kind==='wall';
        add('round','#776b4a',building.x-10,.04,building.y-8,width*.8,.065,depth*.8);
        for(let j=0;j<(wall?6:15);j++){
          const noise=n=>{const a=Math.sin((Number(building.id.slice(1))+1)*71+j*13+n*29)*43758.5453;return a-Math.floor(a);};
          const x=(noise(1)-.5)*width*.7,z=(noise(2)-.5)*depth*.7,size=.12+noise(3)*.16;
          add(j%4?'rock':'round',j%5?'#baa887':'#b56c35',building.x-10+x,.10+noise(4)*.14,building.y-8+z,size,.10+noise(5)*.13,size*1.3,noise(6)*.5,noise(7)*6,noise(8)*.3);
        }
      }
      else if(building.kind!=='wall'){
        const p=villageMode?villageArt.healthPoint(building):new THREE.Vector3(building.x-10,templates.get(building.kind).height+.25,building.y-8);
        health(p.x,p.y,p.z,building.hp/building.maxHp,1.15);
      }
    }
    for(const unit of b.units)soldier(unit,b);effects(b);updateArchitecture();if(villageMode)villageArt.update(b,destroyed,viewTime);contactShadows(b);dynamic.end();glow.end();
    marker.material.opacity=Math.max(0,(markerUntil-viewTime)*1.4);marker.scale.setScalar(1+(1-Math.max(0,markerUntil-viewTime))*.5);
    renderer.render(scene,camera);
  }
  return {
    frame,
    resize,
    async loadVillage(){
      try{villageArt=await createVillageArt(scene,battle,{signal:artAbort.signal});if(disposed){villageArt.dispose();villageArt=null;return false;}return true;}
      catch(error){if(!disposed)console.warn('Illustrations du village :',error.message);return false;}
    },
    style(mode){
      if(disposed)return false;
      const illustrated=mode==='village';if(illustrated&&!villageArt)return false;
      villageMode=illustrated;if(villageArt)villageArt.group.visible=illustrated;
      forest3d.visible=props3d.visible=!illustrated;
      for(const {mesh} of architecture.values())mesh.visible=!illustrated;
      land.material=illustrated?villageGroundMaterial:groundMaterial;road.material=illustrated?villageStreetMaterial:streetMaterial;
      scene.background.set(illustrated?'#83bb45':'#a4b99a');scene.fog.color.copy(scene.background);
      cameraOffset.set(...(illustrated?VILLAGE_CAMERA:[14,27,28]));
      renderer.shadowMap.enabled=!economy&&!illustrated;renderer.shadowMap.needsUpdate=true;
      resize();return true;
    },
    point(clientX,clientY){const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);if(!ray.ray.intersectPlane(ground,intersection))return null;return {x:intersection.x+10,y:intersection.z+8};},
    mark(x,y,magic=false){marker.position.set(x-10,.06,y-8);marker.material.color.set(magic?'#dfb7ff':'#baf0ff');markerUntil=viewTime+.65;},
    pan(dx,dy){const r=canvas.getBoundingClientRect(),right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);target.addScaledVector(right,-dx*(camera.right-camera.left)/r.width/zoom).addScaledVector(up,dy*(camera.top-camera.bottom)/r.height/zoom);target.set(clamp(target.x,-7,7),.3,clamp(target.z,-6,6));updateCamera();},
    zoom(factor){zoom=clamp(zoom*factor,.9,3.2);updateCamera();},
    home(){zoom=1.12;target.set(0,.3,0);updateCamera();},
    quality(eco){economy=Boolean(eco);renderer.setPixelRatio(economy?1:Math.min(window.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=!economy&&!villageMode;renderer.shadowMap.needsUpdate=true;resize();},
    reset(b){for(const [kind,entry] of architecture)entry.buildings=b.buildings.filter(building=>building.kind===kind);for(const windmill of windmills)windmill.building=b.buildings.find(building=>building.id===windmill.building.id);viewTime=0;destroyed.clear();deadUnits.clear();positions.clear();directions.clear();seenEffects.clear();particles.length=0;markerUntil=0;updateArchitecture();renderer.shadowMap.needsUpdate=true;this.home();},
    get stats(){return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
    dispose(){disposed=true;artAbort.abort();villageArt?.dispose();observer.disconnect();scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const g of new Set([...resources,...Object.values(geometry),shadowGeometry,boundary.geometry]))g.dispose();for(const mat of [architectureMaterial,actorMaterial,glowMaterial,groundMaterial,streetMaterial,villageGroundMaterial,villageStreetMaterial,shadowMaterial,borderMesh.material,boundary.material,marker.material])mat.dispose();sunlight.shadow.dispose();renderer.dispose();}
  };
}
