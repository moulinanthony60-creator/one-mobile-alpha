import * as THREE from './three.module.js';

// Rounded reservoir, wide nozzle and visible paint tube distinguish the toy
// sprayer from the rifles used by the other games.
export function makePaintBlaster(){
 const g=new THREE.Group();g.userData.paintBlaster=true;
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.38,metalness:.08}));return mats.get(c);};
 const add=(geo,c,x,y,z)=>{const m=new THREE.Mesh(geo,mat(c));m.position.set(x,y,z);g.add(m);return m;};
 const box=(w,h,d,c,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),c,x,y,z),tube=(r,h,c,x,y,z)=>{const m=add(new THREE.CylinderGeometry(r,r,h,16),c,x,y,z);m.rotation.x=Math.PI/2;return m;};
 box(.19,.16,.29,'#b9e7e2',0,0,0);tube(.086,.21,'#693cc6',0,.005,-.23);tube(.11,.055,'#8dedde',0,.005,-.35);tube(.066,.06,'#342253',0,.005,-.377);
 const tank=add(new THREE.SphereGeometry(.135,16,10),'#b26bf2',0,.21,.035);tank.scale.set(.8,1.25,1);box(.11,.055,.1,'#fff0bd',0,.365,.035);box(.085,.025,.11,'#d5faf2',0,.075,-.04);
 const grip=box(.085,.18,.085,'#304758',0,-.145,.11);grip.rotation.x=-.2;box(.09,.035,.09,'#89e2ce',0,-.23,.135);box(.035,.09,.025,'#c390f0',0,-.11,-.025);
 for(const x of [-.101,.101])box(.015,.065,.16,'#754bca',x,.005,-.005);
 return g;
}

function splatMap(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#ffffff';x.beginPath();for(let i=0;i<40;i++){const a=i*Math.PI/20,r=30+(i%4===0?18:i%3===0?5:0);x.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}x.closePath();x.fill();for(const [a,r,s]of [[.4,56,5],[1.8,57,3],[3.9,55,4],[5.4,54,5]]){x.beginPath();x.arc(64+Math.cos(a)*r,64+Math.sin(a)*r,s,0,Math.PI*2);x.fill();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

// Bounded effects: reused geometries/materials, at most 40 surface marks.
// Intersect the displayed decor so paint sits on a picture, not behind it.
export function createPaintEffects(scene,decor){
 const root=new THREE.Group();root.name='paint-effects';scene.add(root);
 const ray=new THREE.Raycaster(),markGeo=new THREE.PlaneGeometry(1,1),dropGeo=new THREE.SphereGeometry(1,8,6),map=splatMap(),materials=new Map(),marks=[],flights=[],bursts=[];let total=0;
 const material=(color,mark=false)=>{const key=color+mark;if(!materials.has(key))materials.set(key,mark?new THREE.MeshStandardMaterial({color,map,transparent:true,alphaTest:.12,depthWrite:false,roughness:.68,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}):new THREE.MeshBasicMaterial({color}));return materials.get(key);};
 const remove=mesh=>{root.remove(mesh);};
 const vector=a=>new THREE.Vector3().fromArray(a);
 function impact(f,now){
  if(f.shot.surface){const hit=f.hit;if(hit){const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld),mesh=new THREE.Mesh(markGeo,material(f.shot.color,true));mesh.position.copy(hit.point).addScaledVector(normal,.002);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);mesh.rotateZ(f.spin);mesh.scale.setScalar(.42);root.add(mesh);marks.push({mesh,until:now+20000});while(marks.length>40)remove(marks.shift().mesh);}}
  const group=new THREE.Group();group.position.copy(f.end);root.add(group);const velocities=[];for(let i=0;i<7;i++){const m=new THREE.Mesh(dropGeo,material(f.shot.color));m.scale.setScalar(.025+(i%3)*.009);group.add(m);velocities.push(new THREE.Vector3(Math.sin(i*2.3+f.spin)*.65,.3+(i%4)*.14,Math.cos(i*2.3+f.spin)*.65));}bursts.push({mesh:group,at:now,velocities});while(bursts.length>16)remove(bursts.shift().mesh);
 }
 function shot(event,now=performance.now(),muzzle=null){if(!event.paint)return;total++;const data=event.paint,from=vector(data.from),end=vector(data.to),direction=end.clone().sub(from),length=direction.length();direction.normalize();let hit=null;if(data.surface&&length>.001){scene.updateMatrixWorld(true);ray.set(from,direction);ray.far=length+.08;hit=ray.intersectObjects([decor.stage,decor.furniture],true).find(h=>h.object.visible&&h.object.material?.visible!==false);if(hit)end.copy(hit.point);}
  const mesh=new THREE.Group();for(let i=0;i<5;i++){const drop=new THREE.Mesh(dropGeo,material(data.color));drop.scale.setScalar(.044-i*.006);mesh.add(drop);}root.add(mesh);const spin=[...event.id].reduce((n,c)=>n+c.charCodeAt(0),0)*.37;
  flights.push({mesh,shot:data,from:muzzle?.clone()||from,end,hit,at:now,duration:Math.max(80,Math.min(320,length/38*1000)),spin});while(flights.length>16){const old=flights.shift();impact(old,now);remove(old.mesh);}
 }
 function tick(now){for(let i=flights.length-1;i>=0;i--){const f=flights[i],t=(now-f.at)/f.duration;for(let j=0;j<f.mesh.children.length;j++)f.mesh.children[j].position.lerpVectors(f.from,f.end,Math.max(0,Math.min(1,t-j*.07)));if(t>=1){impact(f,now);remove(f.mesh);flights.splice(i,1);}}
  for(let i=bursts.length-1;i>=0;i--){const b=bursts[i],t=(now-b.at)/1000;for(let j=0;j<b.mesh.children.length;j++){const m=b.mesh.children[j];m.position.copy(b.velocities[j]).multiplyScalar(t);m.position.y-=t*t*1.5;m.scale.setScalar((.025+j%3*.009)*Math.max(0,1-t*2));}if(t>.5){remove(b.mesh);bursts.splice(i,1);}}
  for(let i=marks.length-1;i>=0;i--)if(now>marks[i].until){remove(marks[i].mesh);marks.splice(i,1);}
 }
 return {shot,tick,inspect:()=>({total,flights:flights.length,bursts:bursts.length,marks:marks.map(m=>({position:m.mesh.position.toArray(),color:'#'+m.mesh.material.color.getHexString()}))}),dispose(){scene.remove(root);root.clear();marks.length=flights.length=bursts.length=0;markGeo.dispose();dropGeo.dispose();map.dispose();for(const m of materials.values())m.dispose();materials.clear();}};
}

export function createStoneEffects(scene){
 const root=new THREE.Group();scene.add(root);const geo=new THREE.IcosahedronGeometry(.065,0),mat=new THREE.MeshStandardMaterial({color:'#a99d87',roughness:1,flatShading:true}),rocks=new Map(),bursts=[];let impacts=0;
 const remove=m=>root.remove(m);
 return {update(states=[]){const ids=new Set(states.map(s=>s.id));for(const [id,r]of rocks)if(!ids.has(id)){remove(r.mesh);rocks.delete(id);}for(const p of states){let r=rocks.get(p.id);if(!r){const mesh=new THREE.Mesh(geo,mat);mesh.position.set(p.x,p.y,p.z);root.add(mesh);r={mesh,to:new THREE.Vector3()};rocks.set(p.id,r);}r.to.set(p.x,p.y,p.z);}},impact(e){impacts++;const g=new THREE.Group();g.position.fromArray(e.stone.at);for(let i=0;i<5;i++){const m=new THREE.Mesh(geo,mat);m.scale.setScalar(.35);g.add(m);}root.add(g);bursts.push({mesh:g,at:performance.now()});while(bursts.length>12)remove(bursts.shift().mesh);},tick(t){for(const r of rocks.values()){r.mesh.position.lerp(r.to,.65);r.mesh.rotation.x+=.1;r.mesh.rotation.z+=.08;}for(let i=bursts.length-1;i>=0;i--){const b=bursts[i],age=(t-b.at)/1000;for(let n=0;n<5;n++){b.mesh.children[n].position.set(Math.sin(n*2.1)*age*.5,age*.4-age*age*2,Math.cos(n*2.1)*age*.5);b.mesh.children[n].scale.setScalar(Math.max(0,.35-age));}if(age>.35){remove(b.mesh);bursts.splice(i,1);}}},inspect:()=>({flying:rocks.size,impacts}),dispose(){scene.remove(root);root.clear();rocks.clear();bursts.length=0;geo.dispose();mat.dispose();}};
}

export function createGrenadeEffects(scene){
 const root=new THREE.Group();root.name='grenade-effects';scene.add(root);
 const shellGeo=new THREE.SphereGeometry(.105,12,8),capGeo=new THREE.BoxGeometry(.055,.07,.055),puffGeo=new THREE.IcosahedronGeometry(1,1),ringGeo=new THREE.RingGeometry(.92,1,32),bodyMat=new THREE.MeshStandardMaterial({color:'#496e51',roughness:.5,metalness:.2}),capMat=new THREE.MeshStandardMaterial({color:'#ffc267',emissive:'#cf5818',emissiveIntensity:.65}),rocks=new Map(),bursts=[];let impacts=0;
 const removeBurst=b=>{root.remove(b.group);b.smoke.dispose();b.ring.dispose();};
 return {update(states=[]){const ids=new Set(states.map(s=>s.id));for(const [id,r]of rocks)if(!ids.has(id)){root.remove(r.mesh);rocks.delete(id);}for(const p of states){let r=rocks.get(p.id);if(!r){const mesh=new THREE.Group(),body=new THREE.Mesh(shellGeo,bodyMat),cap=new THREE.Mesh(capGeo,capMat);body.scale.y=1.2;cap.position.y=.12;mesh.add(body,cap);mesh.position.set(p.x,p.y,p.z);root.add(mesh);r={mesh,to:new THREE.Vector3()};rocks.set(p.id,r);}r.to.set(p.x,p.y,p.z);}},
  impact(e){impacts++;const group=new THREE.Group(),smoke=new THREE.MeshBasicMaterial({color:'#efcb91',transparent:true,opacity:.6,depthWrite:false}),ring=new THREE.MeshBasicMaterial({color:'#ffc35d',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false});group.position.fromArray(e.grenade.at);for(let n=0;n<10;n++){const puff=new THREE.Mesh(puffGeo,smoke);group.add(puff);}const wave=new THREE.Mesh(ringGeo,ring);wave.rotation.x=-Math.PI/2;group.add(wave);root.add(group);bursts.push({group,smoke,ring,wave,at:performance.now(),radius:e.grenade.radius});while(bursts.length>8)removeBurst(bursts.shift());},
  tick(t){for(const r of rocks.values()){r.mesh.position.lerp(r.to,.65);r.mesh.rotation.x+=.08;r.mesh.rotation.z+=.045;}for(let i=bursts.length-1;i>=0;i--){const b=bursts[i],age=(t-b.at)/1000,spread=Math.min(1,age*3),fade=Math.max(0,1-age/.75);for(let n=0;n<10;n++){const p=b.group.children[n],a=n*2.4;p.position.set(Math.sin(a)*spread*(.25+n%3*.25),spread*(.25+n%4*.2),Math.cos(a)*spread*(.25+n%3*.25));p.scale.setScalar((.12+spread*.6)*fade);}b.wave.scale.setScalar(Math.max(.01,b.radius*Math.min(1,age*4)));b.smoke.opacity=fade*.6;b.ring.opacity=fade*.65;if(age>.75){removeBurst(b);bursts.splice(i,1);}}},
  inspect:()=>({flying:rocks.size,impacts,bursts:bursts.length}),dispose(){scene.remove(root);root.clear();rocks.clear();for(const b of bursts){b.smoke.dispose();b.ring.dispose();}bursts.length=0;for(const geo of [shellGeo,capGeo,puffGeo,ringGeo])geo.dispose();bodyMat.dispose();capMat.dispose();}};
}
