import * as THREE from './vendor/three.module.js';
import {createBuilding} from './village-models.mjs';
import {BUILDING_FOOTPRINTS} from './battle3d-layout.mjs?v=2';

// The village's existing architecture is reused, with the orange/blue palette
// of its current illustrated art. Materials in the original module are never changed.
const recolors=new Map();
for(const [from,to] of [[0x8d918f,0xc9bda5],[0xb5b5a9,0xf0e2c5],[0x4d5659,0x827d70],[0x383d40,0x555248],
  [0x67427e,0x286bc3],[0x9163a8,0x418ce3],[0x32273f,0x18385d],[0x694184,0x2769c5],[0x31263e,0x234568],
  [0x695765,0xb74c20],[0x797381,0xe67b2c],[0x444152,0xe2752b],[0xc89b43,0xe6b44d],[0x283640,0x26394c],[0x70858f,0xa5b7be]]) {
  for(const delta of [0,-.08,-.025,.025,.055,-.05,.1,-.035])
    recolors.set(new THREE.Color(from).offsetHSL(0,0,delta).getHex(),new THREE.Color(to).offsetHSL(0,0,delta));
}
const geometries=new Map(),materials=new Map();
const cached=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);};
const material=tint=>{if(!materials.has(tint))materials.set(tint,new THREE.MeshStandardMaterial({color:tint}));return materials.get(tint);};

export function roundedBoxGeometry() {
  return cached('round-box',()=>{
    const s=new THREE.Shape();s.moveTo(-.44,-.44);s.lineTo(.44,-.44);s.lineTo(.44,.44);s.lineTo(-.44,.44);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.88,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:1,steps:1,curveSegments:1});
    g.translate(0,0,-.44);return g;
  });
}
export function shieldGeometry() {
  return cached('shield',()=>{
    const s=new THREE.Shape();s.moveTo(-.45,.5);s.lineTo(.45,.5);s.lineTo(.4,-.12);s.lineTo(0,-.55);s.lineTo(-.4,-.12);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.1,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1});g.translate(0,0,-.05);return g;
  });
}
class Builder {
  constructor(){this.group=new THREE.Group();}
  mesh(geometry,tint,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geometry,material(tint));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);this.group.add(m);return m;}
  box(c,x,y,z,w,h,d,ry=0){return this.mesh(roundedBoxGeometry(),c,x,y,z,w,h,d,0,ry);}
  sphere(c,x,y,z,sx,sy=sx,sz=sx){return this.mesh(cached('sphere',()=>new THREE.SphereGeometry(1,12,8)),c,x,y,z,sx,sy,sz);}
  cylinder(c,x,y,z,r,h,top=r,n=16){return this.mesh(cached(`cyl-${top/r}-${n}`,()=>new THREE.CylinderGeometry(top/r,1,1,n)),c,x,y,z,r,h,r);}
  banner(x,y,z,w=.32,h=.75){this.mesh(shieldGeometry(),0xe7b84d,x,y,z,w,h,.5);this.mesh(shieldGeometry(),0x286cc9,x,y+.025,z+.045,w*.78,h*.85,.3);this.box(0xf3ce70,x,y+.07,z+.08,w*.14,h*.45,.025);}
  arch(c,x,y,z,w,h,depth=.08){
    const key=`arch-${w}-${h}-${depth}`;
    const geometry=cached(key,()=>{const s=new THREE.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI);s.lineTo(-r,0);return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:8});});
    return this.mesh(geometry,c,x,y,z);
  }
  roof(x,y,z,r,h,n=16){
    this.cylinder(0x86461e,x,y-.02,z,r*1.06,.12,r*1.06,n);
    for(let row=0;row<5;row++){
      const lower=r*(1-row/5),upper=r*(1-(row+1)/5);
      this.cylinder(row%2?0xea7a29:0xe16a24,x,y+h*(row+.5)/5,z,lower,h/5+.025,Math.max(.02,upper),n);
      for(let j=0;j<n;j+=2){const a=(j+(row%2))*Math.PI*2/n;
        this.box(0xf28c35,x+Math.sin(a)*lower*.93,y+h*row/5+.025,z+Math.cos(a)*lower*.93,.055,.055,.1,a);}
    }
    this.sphere(0xe9b64c,x,y+h+.035,z,.09);
  }
  flag(x,y,z,scale=.7){this.cylinder(0xc98d32,x,y+.4*scale,z,.025*scale,.8*scale);this.sphere(0xffd269,x,y+.82*scale,z,.055*scale);this.box(0x2868cf,x+.23*scale,y+.61*scale,z,.45*scale,.27*scale,.025);this.box(0x4c91e5,x+.2*scale,y+.72*scale,z+.015,.38*scale,.04*scale,.02);}
}

function citadel() {
  const b=new Builder();
  b.box(0x867b67,0,.15,0,3.25,.3,2.95);b.box(0xddd0b4,0,.35,0,3.14,.22,2.83);
  b.box(0xbeb69e,0,1.28,0,2.43,1.7,2.1);
  for(let row=0;row<5;row++)for(let col=0;col<6;col++)for(const side of [-1,1])
    b.box([0xd5c8ae,0xe7d8b9,0xc7baa3][(row+col)%3],-1.03+col*.415,.56+row*.31,side*1.06,.39,.285,.055);
  // Broad gatehouse, real arch recess, timber leaves and metal fittings.
  b.arch(0x7e7463,0,.43,1.1,1.03,1.48,.13);b.arch(0xefdcbc,0,.43,1.24,.9,1.38,.12);
  b.arch(0x59351f,0,.43,1.37,.68,1.17,.05);
  for(const x of [-.23,-.11,.01,.13,.25])b.box(0x99632f,x,.87,1.43,.018,.83,.022);
  for(const y of [.75,1.13])b.box(0x454c4d,0,y,1.46,.65,.065,.04);
  b.sphere(0xf0c14e,.11,.99,1.5,.055);for(let i=0;i<3;i++)b.box(0xe0d2b5,0,.1+i*.105,1.73-i*.13,1.1-i*.09,.13,.28);
  b.banner(0,2.08,1.11,.44,.53);
  for(const x of [-1.16,1.16])for(const z of [-.97,.97]){
    const h=z<0?2.62:2.36;
    b.cylinder(0xbeb6a1,x,.52,z,.48,.28);b.cylinder(0xdcd1b7,x,(h+.64)/2,z,.42,h-.64);
    for(let row=0;row<5;row++)for(let j=0;j<10;j++){
      const a=(j+(row%2)*.5)*Math.PI/5;
      b.box((row+j)%3?0xe3d7ba:0xc9bda4,x+Math.sin(a)*.42,.78+row*.29,z+Math.cos(a)*.42,.24,.26,.045,a);
    }
    b.cylinder(0xebdbbb,x,h-.04,z,.52,.22);b.cylinder(0xb3a48c,x,h+.1,z,.48,.12);
    for(let j=0;j<8;j++){const a=j*Math.PI/4;b.box(0xf0e0bf,x+Math.sin(a)*.43,h+.25,z+Math.cos(a)*.43,.2,.27,.2,a);}
    b.roof(x,h+.19,z,.37,.65);b.flag(x,h+.84,z,.53);
    if(z>0){b.arch(0x3d4b4b,x,1.42,z+.427,.13,.34,.025);b.banner(x,1.13,z+.46,.24,.69);}
  }
  b.box(0xd5c7ac,0,2.45,-.32,1.33,1.05,1.27);
  for(const x of [-.4,.4]){b.arch(0x565a4e,x,2.3,.33,.18,.39,.03);b.arch(0xf2c879,x,2.33,.37,.12,.3,.02);}
  b.roof(0,3.02,-.32,1.05,.83,4);b.flag(0,3.9,-.32,.85);
  return b.group;
}

function watchtower() {
  const b=new Builder();b.box(0x918873,0,.13,0,1.32,.26,1.32);
  b.box(0xc8bca2,0,1,0,.93,1.7,.93);
  for(let row=0;row<5;row++)for(let col=0;col<3;col++)for(const side of [-1,1])
    b.box((row+col)%2?0xe2d2b1:0xd1c3a6,-.32+col*.32,.39+row*.28,side*.48,.29,.25,.06);
  b.arch(0x69452b,0,.26,.51,.3,.61,.04);b.banner(0,1.36,.54,.3,.62);
  b.box(0x6d4222,0,1.95,0,1.3,.15,1.3);
  for(const x of [-.49,.49])for(const z of [-.49,.49])b.box(0xb77b3b,x,2.29,z,.15,.72,.15);
  for(const sign of [-1,1]){b.box(0x9b602f,0,2.07,sign*.55,1.24,.17,.08);b.box(0x9b602f,sign*.55,2.07,0,.08,.17,1.24);}
  b.roof(0,2.65,0,1.05,.7,4);b.flag(0,3.37,0,.55);
  b.sphere(0xf2c097,0,2.52,0,.15,.18,.15);b.box(0x285fa8,0,2.23,0,.29,.36,.25);
  return b.group;
}

export function mergeModel(root,{exclude=new Set(),inverse=null}={}) {
  root.updateMatrixWorld(true);
  const positions=[],normals=[],colors=[],p=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3(),transform=new THREE.Matrix4();
  root.traverse(o=>{
    if(!o.isMesh||exclude.has(o))return;
    const geometry=o.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal,index=geometry.index;
    transform.copy(o.matrixWorld);if(inverse)transform.premultiply(inverse);normalMatrix.getNormalMatrix(transform);
    const source=o.material.color,tint=recolors.get(source.getHex())||source;
    for(let i=0;i<(index?.count||position.count);i++){
      const k=index?index.getX(i):i;p.fromBufferAttribute(position,k).applyMatrix4(transform);
      n.fromBufferAttribute(normal,k).applyNormalMatrix(normalMatrix);
      positions.push(p.x,p.y,p.z);normals.push(n.x,n.y,n.z);colors.push(tint.r,tint.g,tint.b);
    }
  });
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeBoundingBox();g.computeBoundingSphere();return g;
}

export function createArchitecture(kind) {
  const root=kind==='castle'?citadel():kind==='tower'?watchtower():createBuilding(kind,kind==='wall'?1:2);
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),fit=BUILDING_FOOTPRINTS[kind]||BUILDING_FOOTPRINTS.cottage;
  const scale=Math.min(fit[0]/size.x,fit[1]/size.z);root.scale.setScalar(scale);
  if(kind==='wall')root.scale.y*=.68;
  root.updateMatrixWorld(true);
  const exclude=new Set(),animated=[];
  root.traverse(o=>{if(o.userData.spin==='windmill'){
    o.traverse(child=>exclude.add(child));
    animated.push({geometry:mergeModel(o,{inverse:o.matrixWorld.clone().invert()}),matrix:o.matrixWorld.clone(),axis:'z'});
  }});
  const geometry=mergeModel(root,{exclude});
  return {geometry,animated,height:geometry.boundingBox.max.y,width:fit[0],depth:fit[1]};
}

// Props share one geometry, so a village full of small details stays inexpensive.
export function createVillageProps() {
  const b=new Builder(),world=(x,y)=>[x-10,y-8];
  function barrel(x,z){b.cylinder(0x9b622f,x,.3,z,.18,.48,.16,12);for(const y of [.13,.44])b.cylinder(0x4e5554,x,y,z,.186,.055,.186,12);}
  function crate(x,z){b.box(0xb47b42,x,.23,z,.38,.38,.38);for(const xx of [-.13,.13])b.box(0x694624,x+xx,.23,z+.2,.05,.37,.025);}
  function lamp(x,z){b.box(0x76624b,x,.42,z,.06,.75,.06);b.box(0x405166,x,.87,z,.23,.28,.23);b.box(0xf8cb71,x,.87,z+.125,.16,.2,.02);b.roof(x,1.02,z,.2,.17,4);}
  for(const [x,y] of [[5.6,4.4],[7.8,5.1],[8.2,10.3],[12.4,11.6],[14.9,9.8],[12.3,4.1]]){const [wx,wz]=world(x,y);barrel(wx,wz);crate(wx+.39,wz-.18);}
  for(const [x,y] of [[9.15,12.2],[10.85,12.2],[9.2,5.7],[14.7,6.4]]){const [wx,wz]=world(x,y);lamp(wx,wz);}
  // Garden rows and split-rail fences beside the cottages.
  for(const [x,y] of [[5.6,10.9],[14.7,4.6]]){
    const [wx,wz]=world(x,y);b.box(0x8a6540,wx,.06,wz,.85,.12,1.4);
    for(let i=0;i<4;i++)for(let j=0;j<2;j++){const px=wx-.24+j*.45,pz=wz-.47+i*.31;b.sphere(0x639444,px,.18,pz,.14,.11,.14);b.sphere(0x87b650,px,.26,pz,.09);}
    for(const s of [-1,1]){b.box(0xb78a4e,wx+s*.55,.26,wz,.07,.45,1.65);for(const z of [-.72,.72])b.box(0x866034,wx+s*.55,.3,wz+z,.1,.6,.1);}
  }
  // A small well beside the southern lane.
  const [x,z]=world(11.9,11.7);b.cylinder(0xc7baa0,x,.25,z,.43,.5,.43,12);b.cylinder(0x375866,x,.51,z,.3,.015,.3,12);
  for(const s of [-1,1])b.box(0x976234,x+s*.38,.82,z,.09,.9,.1);
  b.roof(x,1.3,z,.68,.34,4);
  return mergeModel(b.group);
}

export function createForest() {
  const b=new Builder();let seed=92733;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<70;i++){
    const side=i%4,along=random()*31-15.5;
    const x=side===0?-11.5-random()*5:side===1?11.5+random()*5:along;
    const z=side===2?-9.5-random()*5:side===3?9.5+random()*5:random()*22-11;
    const s=(.7+random()*.55)*(z>9?.7:1);
    b.cylinder(0x80532f,x,.6*s,z,.16*s,1.2*s,.09*s,8);
    if(i%3){
      for(let j=0;j<7;j++){const a=j*2.4,spread=j===6?0:.48*s;b.sphere([0x3d743d,0x578c42,0x699e48,0x83b257][j%4],x+Math.cos(a)*spread,(1.25+j*.13)*s,z+Math.sin(a)*spread,.62*s,.61*s,.58*s);}
    } else for(let j=0;j<6;j++){
      const r=(.95-j*.13)*s;b.cylinder([0x356842,0x4f8344,0x679549][j%3],x,(.7+j*.35)*s,z,r,.85*s,.05*s,12);
    }
    for(let k=0;k<2;k++)b.sphere(0x598448,x+(random()-.5)*2,.15,z+(random()-.5)*2,.27,.16,.25);
  }
  return mergeModel(b.group);
}
