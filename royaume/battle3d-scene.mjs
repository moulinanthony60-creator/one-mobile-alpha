import * as THREE from './vendor/three.module.js';

const UP = new THREE.Vector3(0,1,0);
const color = new THREE.Color();
const local = new THREE.Object3D();
const composed = new THREE.Matrix4();
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const palette = {stone:'#d6cfaa', light:'#e8dfba', dark:'#87937c', roof:'#b95237', roofLight:'#df7c45', wood:'#76533a', gold:'#e5ba57'};

function matrix(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0) {
  local.position.set(x,y,z); local.scale.set(sx,sy,sz); local.rotation.set(rx,ry,rz); local.updateMatrix();
  return local.matrix.clone();
}
function parts() {
  const list=[];
  list.add=(shape,tint,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0) => {
    list.push({shape,tint,matrix:matrix(x,y,z,sx,sy,sz,rx,ry,rz)});
  };
  return list;
}

// Original, procedural scenery. No downloaded art, account or save access.
export function buildingParts(kind) {
  const p=parts(), a=p.add;
  const box=(c,x,y,z,sx,sy,sz) => a('box',c,x,y,z,sx,sy,sz);
  const roof=(x,y,z,sx,sy,sz) => a('roof',palette.roofLight,x,y,z,sx,sy,sz,0,Math.PI/4);
  const window=(x,y,z,sx=.15,sy=.25) => box('#33483c',x,y,z,sx,sy,.04);
  const turret=(x,z) => {
    a('cylinder',palette.light,x,1.23,z,.51,2.05,.51);
    a('cylinder',palette.stone,x,2.24,z,.62,.22,.62);
    a('cone',palette.roof,x,2.65,z,.74,.7,.74);
    window(x,1.7,z+.51,.16,.32);
  };
  if(kind==='wall') {
    box(palette.dark,0,.18,0,1.45,.35,.72);
    box(palette.stone,0,.65,0,1.25,.9,.56);
    for(const x of [-.47,0,.47]) box(palette.light,x,1.2,0,.28,.3,.65);
    for(const x of [-.34,.32]) box('#bbb99d',x,.5,.29,.5,.04,.015);
  } else if(kind==='castle') {
    box('#8f987b',0,.2,0,2.35,.4,2.12);
    box(palette.stone,0,1.1,0,1.85,1.8,1.7);
    roof(0,2.3,0,1.52,.85,1.45);
    box(palette.light,0,.65,.9,.78,1.05,.12);
    box('#4b4e36',0,.57,.99,.52,.86,.07);
    box(palette.wood,0,.5,1.04,.38,.75,.07);
    for(const x of [-.9,.9]) for(const z of [-.8,.8]) turret(x,z);
    box(palette.wood,0,3.02,0,.05,.8,.05);
    box('#e4ad49',.23,3.23,0,.44,.28,.03);
    for(const x of [-.5,.5]) window(x,1.45,.87);
  } else if(kind==='tower') {
    box(palette.dark,0,.18,0,1.2,.36,1.2);
    box(palette.stone,0,.95,0,.8,1.6,.8);
    window(0,1.2,.41,.17,.42);
    box(palette.wood,0,1.85,0,1.2,.17,1.2);
    for(const x of [-.48,.48]) for(const z of [-.48,.48]) box(palette.wood,x,2.17,z,.1,.6,.1);
    roof(0,2.65,0,.97,.7,.97);
    box('#af4b37',0,2.02,0,.33,.43,.3);
    a('sphere','#e9bf8a',0,2.35,0,.2,.2,.2);
  } else if(kind==='cannon') {
    box(palette.dark,0,.18,0,1.4,.35,1.4);
    a('cylinder',palette.stone,0,.45,0,.65,.35,.65);
    for(const x of [-.5,.5]) a('cylinder',palette.wood,x,.71,0,.35,.16,.35,0,0,Math.PI/2);
    box(palette.roof,0,.65,0,.75,.35,.7);
    // Barrel is rendered separately so it can aim at its current target.
  } else if(kind==='mine') {
    for(let i=0;i<6;i++) a('rock',i%2?'#929b83':'#bbc0a0',Math.cos(i)*.62,.52,Math.sin(i)*.5,.57,.72,.55);
    box('#3b4434',0,.42,.63,.58,.75,.13);
    box(palette.wood,-.37,.47,.73,.14,.9,.15);
    box(palette.wood,.37,.47,.73,.14,.9,.15);
    box(palette.wood,0,.94,.73,.91,.18,.15);
    a('rock',palette.gold,-.58,.19,1,.17,.18,.15);
    a('rock',palette.gold,-.32,.19,1.12,.13,.14,.13);
    for(const x of [-.2,.2]) box('#6b7569',x,.14,1.22,.04,.05,.7);
  } else {
    const mill=kind==='mill';
    box(palette.dark,0,.2,0,1.4,.3,1.2);
    box('#ead9ac',0,.72,0,1.15,1.05,.95);
    box(palette.wood,0,.35,.5,.31,.6,.08);
    roof(0,1.55,0,1.05,.75,.9);
    for(const x of [-.5,.5]) box(palette.wood,x,.75,.49,.08,1,.06);
    window(-.3,.86,.5,.17,.23); window(.3,.86,.5,.17,.23);
    if(mill) {
      a('cylinder','#dfcda3',0,1.18,-.3,.48,2,.48);
      a('cone',palette.roof,0,2.42,-.3,.7,.65,.7);
      a('sphere',palette.wood,0,1.8,.58,.18,.18,.16);
    } else {
      box(palette.stone,.38,1.7,-.15,.22,.65,.23);
      a('sphere','#8ba554',-.82,.3,.45,.3,.26,.3);
    }
  }
  return p;
}

export function terrainParts() {
  const p=parts(), a=p.add;
  a('box','#5e7054',0,-.85,0,28,1.4,24);
  a('box','#83a65b',0,-.05,0,28,.28,24);
  a('box','#b9b27a',0,.105,0,1.2,.03,12);
  a('box','#b9b27a',0,.11,0,12,.03,.85);
  let seed=72819;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<52;i++) {
    const side=i%4,along=random()*24-12;
    const x=side===0?-11.3-random()*1.5:side===1?11.3+random()*1.5:along;
    const z=side===2?-9.2-random()*1.7:side===3?9.2+random()*1.7:random()*18-9;
    const s=.65+random()*.7;
    a('cylinder',palette.wood,x,.35*s,z,.12*s,.8*s,.12*s);
    a('cone',i%3?'#3e7952':'#538a55',x,1.05*s,z,.85*s,1.6*s,.85*s);
    a('cone','#5b975d',x,1.6*s,z,.63*s,1.3*s,.63*s);
    a('cone','#78a260',x,2.03*s,z,.4*s,.94*s,.4*s);
  }
  for(let i=0;i<48;i++) {
    const x=random()*19-9.5,z=random()*15-7.5;
    if(Math.abs(x)<.8||Math.abs(z)<.6)continue;
    a('box',i%3?'#8cad60':'#99b96b',x,.105,z,.12+random()*.35,.025,.1+random()*.3,0,random()*3);
  }
  for(let i=0;i<24;i++) {
    const x=-13.2+(i%12)*2.4,z=i<12?-11.9:11.9;
    a('rock',i%2?'#71846a':'#889574',x,-.6,z,1.1,.6,.5);
  }
  return p;
}

class Batches {
  constructor(scene,geometries,material,capacity=2048) {
    this.entries={};
    for(const [shape,geometry] of Object.entries(geometries)) {
      const mesh=new THREE.InstancedMesh(geometry,material,capacity);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;
      scene.add(mesh);this.entries[shape]={mesh,count:0,capacity};
    }
  }
  begin() { for(const entry of Object.values(this.entries))entry.count=0; }
  put(shape,tint,m) {
    const entry=this.entries[shape];
    if(entry.count>=entry.capacity)return;
    entry.mesh.setMatrixAt(entry.count,m);entry.mesh.setColorAt(entry.count,color.set(tint));entry.count++;
  }
  parts(list,parent) {
    for(const p of list) {
      composed.multiplyMatrices(parent,p.matrix);
      this.put(p.shape,p.tint,composed);
    }
  }
  end() {
    for(const {mesh,count} of Object.values(this.entries)) {
      mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    }
  }
}

export function createScene(canvas,battle) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-15,15,15,-15,.1,150);
  const target=new THREE.Vector3(0,0,0),cameraOffset=new THREE.Vector3(13,24,28);
  const light=new THREE.DirectionalLight('#fff2cf',2.2);light.position.set(-12,24,14);scene.add(light);
  scene.add(new THREE.HemisphereLight('#e6f2ff','#67744e',2.1));
  const material=new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true});
  const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,8),cone:new THREE.ConeGeometry(1,1,8),roof:new THREE.ConeGeometry(1,1,4),sphere:new THREE.SphereGeometry(1,8,6),rock:new THREE.IcosahedronGeometry(1,0)};
  const fixed=new Batches(scene,geometries,material),dynamic=new Batches(scene,geometries,material,1024);
  const terrain=terrainParts();
  const assets=new Map(battle.buildings.map(b=>[b.id,buildingParts(b.kind)]));
  const destroyed=new Map(),directions=new Map(),positions=new Map(),seenEffects=new Set(),particles=[];
  let viewTime=0,zoom=1,disposed=false;
  const identity=new THREE.Matrix4();
  const root=new THREE.Object3D();
  const ray=new THREE.Raycaster(),ground=new THREE.Plane(UP,0),intersection=new THREE.Vector3();

  const border=new THREE.Shape();
  border.moveTo(-10,-8);border.lineTo(10,-8);border.lineTo(10,8);border.lineTo(-10,8);border.closePath();
  const hole=new THREE.Path();hole.moveTo(-7,-5);hole.lineTo(-7,5);hole.lineTo(7,5);hole.lineTo(7,-5);hole.closePath();border.holes.push(hole);
  const borderMesh=new THREE.Mesh(new THREE.ShapeGeometry(border),new THREE.MeshBasicMaterial({color:'#56d7ee',transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}));
  borderMesh.rotation.x=-Math.PI/2;borderMesh.position.y=.14;scene.add(borderMesh);
  const boundaryPoints=[];
  for(const [x,z,dx,dz,n] of [[-7,-5,1,0,14],[-7,5,1,0,14],[-7,-5,0,1,10],[7,-5,0,1,10]])
    for(let i=0;i<n;i++)boundaryPoints.push(new THREE.Vector3(x+dx*(i+.12),.17,z+dz*(i+.12)),new THREE.Vector3(x+dx*(i+.65),.17,z+dz*(i+.65)));
  const boundary=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(boundaryPoints),new THREE.LineBasicMaterial({color:'#a1f4ff',transparent:true,opacity:.85}));scene.add(boundary);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.42,.52,24),new THREE.MeshBasicMaterial({color:'#d0f9ff',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.19;scene.add(marker);let markerUntil=0;

  function parent(x,y,z,scale=1,ry=0,rx=0,rz=0) {
    root.position.set(x,y,z);root.scale.setScalar(scale);root.rotation.set(rx,ry,rz);root.updateMatrix();return root.matrix;
  }
  function add(shape,tint,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,base=null) {
    local.position.set(x,y,z);local.scale.set(sx,sy,sz);local.rotation.set(rx,ry,rz);local.updateMatrix();
    if(base){composed.multiplyMatrices(base,local.matrix);dynamic.put(shape,tint,composed);}else dynamic.put(shape,tint,local.matrix);
  }
  function rebuildBuildings(b) {
    fixed.begin();fixed.parts(terrain,identity);
    let animating=false;
    for(const building of b.buildings) {
      const dead=destroyed.get(building.id),age=dead===undefined?0:viewTime-dead;
      if(dead!==undefined&&age>=.65) {
        for(let i=0;i<5;i++)fixed.put('rock',i%2?palette.stone:palette.roof,matrix(building.x-10+Math.cos(i*2)*.45,.23,building.y-8+Math.sin(i*2)*.42,.32,.18,.29,0,i));
      } else {
        const scale=dead===undefined?1:Math.max(.05,1-age/.7);
        fixed.parts(assets.get(building.id),parent(building.x-10,.12,building.y-8,scale,building.kind==='wall'&&(building.x===5||building.x===15)?Math.PI/2:0,dead===undefined?0:age*.45));
        animating ||= dead!==undefined;
      }
    }
    fixed.end();return animating;
  }
  let buildingAnimation=false;
  rebuildBuildings(battle);

  function updateCamera() {
    camera.position.copy(target).add(cameraOffset);camera.lookAt(target);camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function resize() {
    if(disposed)return;
    const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;
    renderer.setSize(width,height,false);
    const aspect=width/height;
    // Project all terrain corners; fit in portrait and landscape without hiding deployment edges.
    camera.position.copy(cameraOffset);camera.lookAt(0,0,0);camera.updateMatrixWorld();
    let maxX=0,maxY=0;
    for(const x of [-10.8,10.8])for(const z of [-8.8,8.8])for(const y of [0,2]) {
      const v=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));
    }
    const halfHeight=Math.max(maxY,maxX/aspect)*1.08;
    camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;
    updateCamera();
    renderer.render(scene,camera);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();

  function health(x,y,z,fraction,width) {
    if(fraction>=.999||fraction<=0)return;
    root.position.set(x,y,z);root.quaternion.copy(camera.quaternion);root.scale.setScalar(1);root.updateMatrix();
    const base=root.matrix;
    add('box','#344b3c',0,0,0,width,.075,.03,0,0,0,base);
    add('box',fraction>.4?'#a8dd76':'#e7a16b',-width*(1-fraction)/2,0,.025,width*fraction,.045,.025,0,0,0,base);
  }
  function soldier(unit,b,dt) {
    if(unit.hp<=0)return;
    const previous=positions.get(unit.id)||{x:unit.x,y:unit.y,angle:Math.PI,movingUntil:0};
    const dx=unit.x-previous.x,dz=unit.y-previous.y,moved=Math.hypot(dx,dz)>.001;
    const movingUntil=moved?viewTime+.09:previous.movingUntil,moving=viewTime<movingUntil;
    const enemy=b.buildings.find(p=>p.id===unit.target&&p.hp>0);
    let angle=previous.angle;
    if(moved)angle=Math.atan2(dx,dz);else if(!moving&&enemy)angle=Math.atan2(enemy.x-unit.x,enemy.y-unit.y);
    positions.set(unit.id,{x:unit.x,y:unit.y,angle,movingUntil});
    const walk=moving?Math.sin(viewTime*12+unit.id)*.42:0;
    const attack=!moving&&unit.cooldown>.5?Math.sin(unit.cooldown*10)*.35:0;
    const base=parent(unit.x-10,.15+(moving?Math.abs(walk)*.06:0),unit.y-8,1,angle).clone();
    const put=(shape,tint,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>add(shape,tint,x,y,z,sx,sy,sz,rx,ry,rz,base);
    const mage=unit.kind==='mages',archer=unit.kind==='archers';
    const tint=mage?'#a687df':archer?'#96bd61':'#65b7df';
    put('sphere','#668253',0,.01,0,.35,.025,.29);
    put('box','#5e5a48',-.12,.18,0,.14,.3,.18,walk);put('box','#5e5a48',.12,.18,0,.14,.3,.18,-walk);
    put(mage?'cone':'box',tint,0,.5,0,mage?.4:.43,.51,mage?.33:.29);
    put('box',palette.gold,0,.4,.16,.43,.07,.04);
    put('sphere','#efc49b',0,.91,.01,.24,.25,.23);
    put('box','#394d3b',-.08,.94,.22,.035,.04,.025);put('box','#394d3b',.08,.94,.22,.035,.04,.025);
    put('box',tint,-.29,.59,0,.15,.43,.17,-walk-attack,0,.13);put('box',tint,.29,.59,0,.15,.43,.17,walk+attack,0,-.13);
    if(mage) {
      put('cone','#bb98f1',0,1.3,0,.32,.51,.32);put('cylinder','#8a66bd',0,1.08,0,.36,.06,.36);
      put('cone','#e6ede2',0,.72,.2,.16,.3,.08,0,0,Math.PI);
      put('cylinder',palette.wood,.4,.64,.1,.035,1.18,.035,0,0,-.1+attack*.4);
      put('rock','#9af5ee',.45,1.3,.1,.14,.21,.14,0,viewTime*2);
    } else if(archer) {
      put('cone','#79a34e',0,1.13,-.02,.3,.43,.3);put('box','#9dcd6c',0,1.01,.2,.51,.08,.17);
      put('cylinder',palette.wood,-.13,.67,-.24,.12,.48,.12,-.25,0,-.3);
      for(const y of [-.25,0,.25])put('box',palette.gold,.4,.64+y,.23-Math.abs(y)*.4,.045,.27,.045,0,0,y*1.6);
      put('box','#eee5bf',.4,.64,.1,.015,.7,.015);
    } else {
      put('sphere','#bacbd1',0,1.03,-.04,.27,.2,.24);put('box','#e5e6c9',0,1.12,.03,.08,.19,.43);
      put('box','#537a93',-.38,.57,.1,.14,.48,.4,0,0,-.1);
      put('box',palette.gold,-.46,.57,.1,.035,.32,.24);
      put('box','#d8e8e5',.38,.72,.18,.08,.64,.06,attack);
      put('box',palette.gold,.38,.46,.18,.24,.06,.08);
    }
    health(unit.x-10,1.65,unit.y-8,unit.hp/unit.maxHp,.6);
  }
  function effects(b) {
    for(const fx of b.effects) {
      if(seenEffects.has(fx.visualId))continue;
      seenEffects.add(fx.visualId);
      if(fx.kind==='spell') {
        particles.push({kind:'spell',x:fx.x,z:fx.y,born:viewTime,duration:.7});
      } else {
        const source=b.units.find(u=>Math.abs(u.x-fx.fromX)<.05&&Math.abs(u.y-fx.fromY)<.05);
        const defense=fx.kind==='enemy'?b.buildings.find(p=>p.x===fx.fromX&&p.y===fx.fromY):null;
        if(defense)directions.set(defense.id,Math.atan2(fx.x-defense.x,fx.y-defense.y));
        particles.push({kind:'shot',x:fx.x,z:fx.y,fromX:fx.fromX,fromZ:fx.fromY,enemy:fx.kind==='enemy',magic:source?.kind==='mages',height:defense?.kind==='tower'?2.1:1,born:viewTime,duration:.32});
      }
    }
    // Effect ids are monotonic within one training; retain only a small recent window.
    if(seenEffects.size>600){const recent=[...seenEffects].slice(-160);seenEffects.clear();for(const id of recent)seenEffects.add(id);}
    for(let i=particles.length-1;i>=0;i--) {
      const p=particles[i],t=(viewTime-p.born)/p.duration;
      if(t>=1){particles.splice(i,1);continue;}
      if(p.kind==='shot') {
        const x=(p.fromX+(p.x-p.fromX)*t)-10,z=(p.fromZ+(p.z-p.fromZ)*t)-8;
        const y=p.height*(1-t)+.6*t+Math.sin(t*Math.PI)*.6;
        const size=p.magic?.16:p.enemy?.12:.08;
        add('sphere',p.magic?'#d8a5ff':p.enemy?'#513f31':'#ffe7a1',x,y,z,size,size,size);
        if(p.magic)add('sphere','#e8dcff',x,y,z,size*.55,size*.55,size*.55);
      } else {
        const spell=p.kind==='spell',size=spell?2.5:1;
        for(let j=0;j<10;j++) {
          const angle=j*Math.PI/5,spread=(.2+t)*size;
          add('rock',spell?(j%2?'#e1bbff':'#a7f0ed'):'#d7c397',p.x-10+Math.cos(angle)*spread,.2+Math.sin(t*Math.PI)*(spell?2:1),p.z-8+Math.sin(angle)*spread,.14*(1-t),.35*(1-t),.14*(1-t),0,angle);
        }
        if(spell)add('cone','#c6b5f5',p.x-10,1.3*(1-t),p.z-8,.2*(1-t),3*(1-t),.2*(1-t));
      }
    }
  }
  function frame(b,dt,animate=true) {
    if(disposed)return;
    if(animate)viewTime+=Math.min(dt,.05);
    let dirty=false;
    for(const building of b.buildings)if(building.hp<=0&&!destroyed.has(building.id)) {
      destroyed.set(building.id,viewTime);dirty=true;
      particles.push({kind:'dust',x:building.x,z:building.y,born:viewTime,duration:.7});
    }
    if(dirty||buildingAnimation)buildingAnimation=rebuildBuildings(b);
    dynamic.begin();
    for(const unit of b.units)soldier(unit,b,dt);
    for(const building of b.buildings) {
      if(building.hp<=0)continue;
      health(building.x-10,building.kind==='castle'?3.6:building.kind==='tower'?3.2:2.6,building.y-8,building.hp/building.maxHp,1.1);
      if(building.kind==='cannon') {
        const base=parent(building.x-10,.12,building.y-8,1,directions.get(building.id)||Math.PI).clone();
        const recoil=building.cooldown>.95?(building.cooldown-.95)*.4:0;
        add('cylinder','#3c5149',0,.81,.35-recoil,.26,.95,.26,Math.PI/2,0,0,base);
        add('cylinder','#263a36',0,.81,.84-recoil,.19,.035,.19,Math.PI/2,0,0,base);
        add('cylinder',palette.gold,0,.81,.65-recoil,.28,.12,.28,Math.PI/2,0,0,base);
      }
      if(building.kind==='mill') {
        const base=parent(building.x-10,1.92,building.y-8+.65,1,0,0,viewTime*.65).clone();
        add('box',palette.wood,0,0,0,.08,1.8,.08,0,0,0,base);
        add('box',palette.wood,0,0,0,1.8,.08,.08,0,0,0,base);
        for(const sign of [-1,1]) {
          add('box','#e9d9a5',.12,sign*.55,0,.23,.55,.04,0,0,0,base);
          add('box','#e9d9a5',sign*.55,.12,0,.55,.23,.04,0,0,0,base);
        }
      }
    }
    effects(b);dynamic.end();
    marker.material.opacity=Math.max(0,(markerUntil-viewTime)*1.5);
    marker.scale.setScalar(1+(1-Math.max(0,markerUntil-viewTime))*.7);
    renderer.render(scene,camera);
  }
  return {
    frame,
    point(clientX,clientY) {
      const rect=canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);
      if(!ray.ray.intersectPlane(ground,intersection))return null;
      return {x:intersection.x+10,y:intersection.z+8};
    },
    mark(x,y,magic=false) {marker.position.set(x-10,.19,y-8);marker.material.color.set(magic?'#e4b8ff':'#d0f9ff');markerUntil=viewTime+.65;},
    pan(dx,dy) {
      const rect=canvas.getBoundingClientRect(),right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
      target.addScaledVector(right,-dx*(camera.right-camera.left)/rect.width/zoom).addScaledVector(up,dy*(camera.top-camera.bottom)/rect.height/zoom);
      target.set(clamp(target.x,-7,7),0,clamp(target.z,-6,6));updateCamera();
    },
    zoom(factor) {zoom=clamp(zoom*factor,1,2.6);updateCamera();},
    home() {zoom=1;target.set(0,0,0);updateCamera();},
    reset(b) {viewTime=0;destroyed.clear();positions.clear();directions.clear();seenEffects.clear();particles.length=0;markerUntil=0;buildingAnimation=false;rebuildBuildings(b);this.home();},
    get stats() {return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
    dispose() {disposed=true;observer.disconnect();scene.traverse(object=>{if(object.isInstancedMesh)object.dispose();});for(const g of Object.values(geometries))g.dispose();material.dispose();for(const object of [borderMesh,boundary,marker]){object.geometry.dispose();object.material.dispose();}renderer.dispose();}
  };
}
