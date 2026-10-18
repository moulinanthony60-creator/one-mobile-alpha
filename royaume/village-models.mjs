import * as THREE from './vendor/three.module.js';

// Original stylized fantasy architecture, built from reusable detailed meshes.
// Tile units; all materials and primitives are cached for scene instancing.
const materials = new Map(), geometry = new Map();
const P = {
  stone: 0x8d918f, stoneLight: 0xb5b5a9, stoneDark: 0x4d5659, mortar: 0x383d40,
  teal: 0x67427e, tealLight: 0x9163a8, tealDark: 0x32273f, gold: 0xc89b43,
  wood: 0x755033, woodLight: 0xb58042, woodDark: 0x392b23,
  roofRed: 0x695765, roofLight: 0x797381, purple: 0x694184, purpleDark: 0x31263e,
  iron: 0x283640, ironLight: 0x70858f, earth: 0x9e8050, grass: 0x638c32,
  blue: 0x5ab4e2, blueDark: 0x326f9b, pink: 0xf5a5bd, pinkDark: 0xe777a0,
};
function mat(color, options = {}) {
  const key = `${color}:${JSON.stringify(options)}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness:.78, metalness:.04, ...options}));
  return materials.get(key);
}
function geo(key, make) { if (!geometry.has(key)) geometry.set(key, make()); return geometry.get(key); }
function mesh(g,m,x=0,y=0,z=0) {
  const o=new THREE.Mesh(g,m); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; return o;
}
function add(parent,o){parent.add(o);return o;}
function box(parent,w,h,d,x,y,z,color,bevel=true){
  const g=bevel ? geo('bevelbox',()=>{
    const s=new THREE.Shape();s.moveTo(-.42,-.42);s.lineTo(.42,-.42);s.lineTo(.42,.42);s.lineTo(-.42,.42);s.closePath();
    const e=new THREE.ExtrudeGeometry(s,{depth:.84,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:2,steps:1,curveSegments:1});e.translate(0,0,-.42);return e;
  }) : geo('box',()=>new THREE.BoxGeometry(1,1,1));
  const o=mesh(g,mat(color),x,y,z);o.scale.set(w,h,d);return add(parent,o);
}
function cyl(parent,r,h,x,y,z,color,n=12,r2=r,options={}){
  if(n>=6)n=Math.max(12,n);
  const key=`cyl:${n}:${r2/r}`;
  const g=geo(key,()=>new THREE.CylinderGeometry(r2/r,1,1,n,1));
  const o=mesh(g,mat(color,options),x,y,z);o.scale.set(r,h,r);return add(parent,o);
}
function orb(parent,r,x,y,z,color,detail=0,scale=[1,1,1],options={}){
  const o=mesh(geo(`ico:${detail}`,()=>new THREE.IcosahedronGeometry(1,detail)),mat(color,{flatShading:true,...options}),x,y,z);
  o.scale.set(r*scale[0],r*scale[1],r*scale[2]);return add(parent,o);
}
function beam(parent,a,b,width,color,depth=width){
  const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
  const o=box(parent,width,v.length(),depth,...new THREE.Vector3(...a).addScaledVector(v,.5).toArray(),color);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;
}
function roofGeo(w,h,d){return geo(`roof:${w}:${h}:${d}`,()=>{
  const verts=[-w/2,0,-d/2,w/2,0,-d/2,w/2,0,d/2,-w/2,0,d/2,-w*.06,h,-d*.28,w*.06,h,-d*.28,w*.06,h,d*.28,-w*.06,h,d*.28];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex([0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,7,6,4,6,5,0,1,2,0,2,3]);g.computeVertexNormals();
  const flat=g.toNonIndexed();flat.computeVertexNormals();g.dispose();return flat;
});}
function tint(color, lightness=0){
  return new THREE.Color(color).offsetHSL(0,0,lightness).getHex();
}
function roof(parent,w,h,d,x,y,z,color,trim=P.woodDark){
  box(parent,w,.13,d,x,y,z,trim);
  add(parent,mesh(roofGeo(w,h,d),mat(tint(color,-.08),{flatShading:true,userData:{surface:'roof'}}),x,y+.02,z));
  // Individual overlapping shingles on both slopes: staggered joints, varied glaze.
  const angle=Math.atan2(h,w*.44),rows=4,cols=4;
  for(let row=0;row<rows;row++){
    const f=(row+.48)/rows,span=d*(1-.44*f),tileW=w*.44/rows/Math.cos(angle),tileD=span/cols;
    for(const side of [-1,1])for(let col=0;col<cols;col++){
      const c=tint(color,[-.025,.025,.055,-.05][(row*3+col+(side>0?1:0))%4]);
      const o=box(parent,tileW+.035,.055,tileD-.018,x+side*w*(.5-.44*f),y+h*f+.055,z-span/2+(col+.5)*tileD,c,false);
      o.rotation.z=-side*angle;
    }
  }
  box(parent,.18,.14,d*.61,x,y+h+.08,z,trim);
  for(const end of [-1,1])box(parent,w,.11,.10,x,y+.02,z+end*d*.49,trim);
  for(let i=0;i<5;i++)box(parent,.19,.07,d*.12,x,y+h+.17,z+(i-2)*d*.125,tint(color,.1));
}
function masonry(parent,w,h,d,x,y,z,{rows=4,cols=5,color=P.stone,sides=true}={}){
  const colors=[color,tint(color,.055),tint(color,-.035),tint(color,.025)];
  for(let row=0;row<rows;row++){
    const bh=h/rows-.035,cy=y-h/2+(row+.5)*h/rows;
    for(const front of [-1,1])for(let col=0;col<cols;col++){
      const bw=w/cols-.025;
      box(parent,bw,bh,.045,x-w/2+(col+.5)*w/cols,cy,z+front*(d/2+.019),colors[(row*3+col)%4],false);
    }
    if(sides)for(const side of [-1,1])for(let col=0;col<Math.max(2,cols-1);col++){
      const nc=Math.max(2,cols-1),bd=d/nc-.028;
      box(parent,.045,bh,bd,x+side*(w/2+.019),cy,z-d/2+(col+.5)*d/nc,colors[(row+col*3)%4],false);
    }
  }
}
function barrel(parent,x,y,z,r=.20,h=.44){
  cyl(parent,r,h,x,y+h/2,z,P.woodLight,10,r*.92);
  for(const f of [.14,.80])cyl(parent,r*1.015,.045,x,y+h*f,z,P.iron,10,r*1.015);
  cyl(parent,r*.82,.025,x,y+h+.012,z,P.wood,10);
  for(const xx of [-.4,.4])box(parent,.025,.025,r*1.38,x+xx*r,y+h+.03,z,P.woodDark,false);
}
function crate(parent,x,y,z,s=.39){
  box(parent,s,s,s,x,y+s/2,z,P.wood);
  for(const t of [-1,1]){
    box(parent,s,.055,.045,x,y+s/2+t*(s/2-.03),z+s/2+.012,P.woodLight,false);
    box(parent,.055,s,.045,x+t*(s/2-.03),y+s/2,z+s/2+.012,P.woodLight,false);
  }
  beam(parent,[x-s*.4,y+s*.1,z+s*.53],[x+s*.4,y+s*.9,z+s*.53],.046,P.woodLight,.025);
}
function shield(parent,x,y,z,color=P.teal,s=.35){
  const face=geo('shield',()=>{
    const shape=new THREE.Shape();shape.moveTo(-.45,.5);shape.lineTo(.45,.5);shape.lineTo(.40,-.12);shape.lineTo(0,-.54);shape.lineTo(-.4,-.12);shape.closePath();
    return new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1,steps:1});
  });
  const a=mesh(face,mat(P.gold,{metalness:.4}),x,y,z);a.scale.setScalar(s);add(parent,a);
  const b=mesh(face,mat(color),x,y+.015,z+s*.06);b.scale.set(s*.78,s*.78,s);add(parent,b);
  box(parent,.10*s,.62*s,.055*s,x,y+.03*s,z+s*.21,P.gold,false);
}
function rivets(parent,x,y,z,w,h){
  for(const a of [-1,1])for(const b of [-1,1])orb(parent,.026,x+a*w*.37,y+b*h*.30,z,P.gold,0);
}
function buttress(parent,x,z,h=1.5){
  box(parent,.24,h,.34,x,.25+h/2,z,P.stoneDark);
  for(let i=0;i<4;i++)box(parent,.28,.13,.37,x,.37+i*h/4,z,P.stoneLight);
}
function windowBox(parent,x,y,z,w=.28,h=.4){
  box(parent,w+.14,h+.13,.10,x,y,z,P.stoneDark);
  box(parent,w,h,.035,x,y,z+.063,P.blueDark,false);
  box(parent,.045,h,.055,x,y,z+.089,P.woodLight,false);
  box(parent,w,.045,.055,x,y,z+.09,P.woodLight,false);
  box(parent,w+.20,.075,.20,x,y-h/2-.08,z+.035,P.stoneLight);
  const glow=box(parent,w*.72,h*.72,.02,x,y,z+.072,0xffcc6b,false);glow.material=mat(0xe5b355,{emissive:0xd78b24,emissiveIntensity:.32,roughness:.6});
}
function door(parent,x,y,z,w=.58,h=.9){
  box(parent,w+.2,h+.15,.14,x,y,z,P.stoneDark);
  box(parent,w,h,.10,x,y-.02,z+.08,P.woodDark);
  for(const xx of [-.28,0,.28])box(parent,.025,h*.90,.035,x+xx*w,y-.02,z+.143,P.woodLight,false);
  box(parent,w*.9,.07,.07,x,y-h*.22,z+.15,P.gold);
  orb(parent,.046,x+w*.28,y,z+.2,P.gold,0);
  box(parent,w*.9,.055,.06,x,y+h*.26,z+.15,P.iron);
  rivets(parent,x,y,z+.185,w,h);
}
function flag(parent,x,y,z,color=P.teal,scale=1){
  cyl(parent,.038*scale,1.0*scale,x,y+.5*scale,z,P.woodLight,6);
  orb(parent,.075*scale,x,y+1.03*scale,z,P.gold);
  const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(.52,0);s.lineTo(.40,-.17);s.lineTo(.50,-.36);s.lineTo(0,-.36);s.closePath();
  const g=geo('flag',()=>new THREE.ShapeGeometry(s));
  const o=mesh(g,mat(color,{side:THREE.DoubleSide,userData:{surface:'cloth'}}),x+.04*scale,y+.90*scale,z);o.scale.setScalar(scale);add(parent,o);
  box(parent,.055*scale,.19*scale,.026*scale,x+.20*scale,y+.72*scale,z+.015,P.gold,false);
}
function foundation(parent,w,d){
  box(parent,w,.15,d,0,.075,0,P.stoneDark);
  box(parent,w*.97,.14,d*.97,0,.18,0,P.stone);
}
function crystal(parent,r,h,x,y,z,color){
  const o=cyl(parent,r,h,x,y+h/2,z,color,5,r*.7,{emissive:color,emissiveIntensity:.12,roughness:.32});
  cyl(parent,r*.7,h*.31,x,y+h+h*.155,z,color,5,0,{emissive:color,emissiveIntensity:.14,roughness:.3});
  return o;
}
// Architectural arches are real curved geometry, with recessed inner faces.
function archShape(w,h){
  const s=new THREE.Shape(),r=w/2,cy=h-r;
  s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,cy);
  s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);return s;
}
function archPanel(parent,w,h,depth,x,y,z,color,options={}){
  const g=geo(`arch:${w}:${h}:${depth}`,()=>{const g=new THREE.ExtrudeGeometry(archShape(w,h),{depth,bevelEnabled:false,curveSegments:10,steps:1});g.translate(0,0,-depth/2);return g;});
  return add(parent,mesh(g,mat(color,options),x,y,z));
}
function archFrame(parent,w,h,t,depth,x,y,z,color){
  const shape=archShape(w+t*2,h+t);const hole=archShape(w,h);
  shape.holes.push(hole);
  const g=geo(`archframe:${w}:${h}:${t}:${depth}`,()=>{const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1,curveSegments:9,steps:1});g.translate(0,0,-depth/2);return g;});
  return add(parent,mesh(g,mat(color),x,y,z));
}
function archWindow(parent,x,y,z,w=.24,h=.60){
  archPanel(parent,w+.08,h+.04,.035,x,y-.015,z,0x282831);
  archPanel(parent,w,h,.025,x,y,z+.024,0xd49a4d,{emissive:0xf29126,emissiveIntensity:.65,roughness:.7});
  archFrame(parent,w,h,.055,.10,x,y,z+.015,P.stoneLight);
  box(parent,.037,h*.83,.06,x,y+h*.42,z+.055,P.iron,false);
  box(parent,w,.033,.065,x,y+h*.49,z+.055,P.iron,false);
  box(parent,w+.19,.065,.18,x,y-.032,z+.03,P.stoneLight);
}
function banner(parent,x,y,z,w=.40,h=1.30,color=P.purple){
  const g=geo(`banner:${w}:${h}`,()=>{
    const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(w/2,-h);sh.lineTo(0,-h+.13);sh.lineTo(-w/2,-h);sh.closePath();
    return new THREE.ShapeGeometry(sh);
  });
  add(parent,mesh(g,mat(color,{side:THREE.DoubleSide,roughness:.95,userData:{surface:'cloth'}}),x,y,z));
  box(parent,w+.17,.055,.065,x,y+.025,z,P.gold);
  for(const side of [-1,1])box(parent,.023,h-.03,.015,x+side*(w/2-.025),y-h/2,z+.012,P.gold,false);
  box(parent,.052,h*.34,.025,x,y-h*.39,z+.02,P.gold,false);
  const a=box(parent,w*.32,.045,.027,x,y-h*.34,z+.025,P.gold,false);a.rotation.z=.30;
  box(parent,w,.075,.035,x,y-.10,z+.022,tint(color,.12),false);
}
function torch(parent,x,y,z,size=1){
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(size);parent.add(g);
  box(g,.085,.40,.10,0,0,0,P.iron);
  beam(g,[0,-.08,0],[0,.08,.19],.06,P.iron);
  cyl(g,.13,.15,0,.10,.18,P.iron,12,.18);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;box(g,.03,.19,.03,Math.cos(a)*.13,.21,.18+Math.sin(a)*.13,P.gold,false);}
  const fire=orb(g,.13,0,.30,.18,0xffbf51,1,[.7,1.65,.7],{emissive:0xff8a1c,emissiveIntensity:1.25,roughness:.5});fire.userData.spin='flame';
  orb(g,.065,0,.27,.19,0xffebad,1,[.7,1.4,.7],{emissive:0xffb735,emissiveIntensity:1.5});
}
function battlements(parent,w,d,x,y,z,color=P.stoneLight,count=4){
  box(parent,w,.16,d,x,y-.14,z,P.stoneDark);
  box(parent,w+.08,.13,d+.08,x,y-.025,z,color);
  for(let i=0;i<count;i++){
    const xx=-w/2+.12+i*(w-.24)/(count-1);
    for(const side of [-1,1])box(parent,w/count*.56,.32,.24,x+xx,y+.18,z+side*(d/2-.08),color);
  }
  for(let i=1;i<count-1;i++){
    const zz=-d/2+.12+i*(d-.24)/(count-1);
    for(const side of [-1,1])box(parent,.24,.32,d/count*.56,x+side*(w/2-.08),y+.18,z+zz,color);
  }
}
function squareTower(parent,x,z,h=3.9,width=.94,withBanner=true){
  box(parent,width+.12,.23,width+.12,x,.31,z,P.stoneDark);
  box(parent,width,h-.40,width,x,h/2+.20,z,P.stoneDark);
  masonry(parent,width,h-.50,width,x,h/2+.21,z,{rows:7,cols:2,color:P.stone,sides:true});
  for(const side of [-1,1])for(const front of [-1,1]){
    box(parent,.12,h-.27,.12,x+side*(width/2-.025),h/2+.18,z+front*(width/2-.025),P.stoneLight);
  }
  box(parent,width+.11,.11,width+.11,x,h-.61,z,P.stoneLight);
  for(const side of [-1,1])box(parent,.14,.33,width+.08,x+side*(width*.31),h-.24,z,P.stoneLight);
  battlements(parent,width+.22,width+.22,x,h+.04,z,P.stoneLight,3);
  archWindow(parent,x,h-1.43,z+width/2+.037,.16,.49);
  if(withBanner)banner(parent,x,h-.57,z+width/2+.09,.34,1.29);
  const right=new THREE.Group();right.position.set(x+width/2+.036,0,z);right.rotation.y=Math.PI/2;parent.add(right);
  archWindow(right,0,h-2.22,0,.16,.51);
  if(withBanner)banner(right,0,h-.56,.03,.34,1.12);
}
function castle(g,level=1){
  // A compact four-tower citadel around a tall square keep, not a roofed toy palace.
  foundation(g,3.97,3.94);
  box(g,3.68,.23,3.67,0,.33,0,P.stoneLight);
  for(const x of [-1.36,1.36])for(const z of [-1.34,1.34])squareTower(g,x,z,3.78+(z<0?.25:0),.90,true);
  // Recessed walkable stone galleries between the corner towers.
  for(const side of [-1,1]){
    box(g,.40,2.66,2.50,side*1.36,1.63,0,P.stoneDark);
    box(g,.44,.22,2.54,side*1.36,3.02,0,P.stoneLight);
    for(let i=0;i<5;i++)box(g,.30,.29,.27,side*1.49,3.28,-.90+i*.45,P.stoneLight);
    const face=new THREE.Group();face.position.set(side*1.57,0,0);face.rotation.y=side*Math.PI/2;g.add(face);
    for(const xx of [-.55,.55])archWindow(face,xx,1.46,0,.23,.63);
  }
  box(g,2.40,2.55,.40,0,1.60,-1.35,P.stoneDark);
  battlements(g,2.40,.54,0,3.02,-1.35,P.stoneLight,5);
  // The front gateway has a genuine open vaulted arch and a recessed portcullis.
  const gateShape=new THREE.Shape();gateShape.moveTo(-1.17,0);gateShape.lineTo(1.17,0);gateShape.lineTo(1.17,2.70);gateShape.lineTo(-1.17,2.70);gateShape.closePath();
  gateShape.holes.push(archShape(.91,1.86));
  const gateGeo=geo('citadel-gate',()=>{const a=new THREE.ExtrudeGeometry(gateShape,{depth:.38,bevelEnabled:false,curveSegments:10});a.translate(0,0,-.19);return a;});
  add(g,mesh(gateGeo,mat(P.stone),0,.36,1.27));
  archPanel(g,.91,1.86,.08,0,.36,1.11,0x201d23);
  archFrame(g,.91,1.86,.18,.22,0,.36,1.51,P.stoneLight);
  archPanel(g,.78,1.70,.07,0,.37,1.20,P.woodDark);
  for(let i=0;i<5;i++){const xx=(i-2)*.14,hh=1.52-Math.abs(i-2)*.08;box(g,.035,hh,.05,xx,.38+hh/2,1.30,P.iron,false);}
  for(const yy of [.78,1.30])box(g,.78,.07,.06,0,yy,1.32,P.ironLight);
  box(g,.10,.17,.08,0,1.04,1.39,P.gold);
  for(let i=0;i<3;i++)box(g,1.21-i*.11,.12,.21,0,.12+i*.12,1.82-i*.16,P.stoneLight);
  battlements(g,2.58,.65,0,3.08,1.29,P.stoneLight,5);
  shield(g,0,2.62,1.51,P.purple,.57);
  for(const x of [-.86,.86])torch(g,x,1.70,1.56,.72);
  // Tall central donjon with corner piers and two tiers of glowing lancet windows.
  box(g,1.82,4.80,1.80,0,2.78,-.17,P.stoneDark);
  masonry(g,1.82,4.70,1.80,0,2.77,-.17,{rows:9,cols:4,color:P.stone,sides:true});
  for(const x of [-.88,.88])for(const z of [-1.04,.70]){
    box(g,.19,4.88,.20,x,2.76,z,P.stoneLight);
    for(const y of [1.48,2.78,4.06])box(g,.25,.14,.26,x,y,z,P.stoneDark);
  }
  for(const y of [3.28,4.35])for(const x of [-.49,.49])archWindow(g,x,y,.762,.23,.65);
  for(const side of [-1,1]){
    const face=new THREE.Group();face.position.set(side*.944,0,-.17);face.rotation.y=side*Math.PI/2;g.add(face);
    for(const xx of [-.47,.47])archWindow(face,xx,4.29,0,.23,.68);
    banner(face,0,4.94,.05,.45,1.49,P.purple);
  }
  banner(g,0,4.98,.81,.38,1.33,P.purple);
  box(g,2.03,.17,2.02,0,5.16,-.17,P.stoneLight);
  for(const side of [-1,1])for(const x of [-.62,0,.62])box(g,.16,.28,.23,x,5.02,-.17+side*.93,P.stoneLight);
  battlements(g,2.15,2.12,0,5.39,-.17,P.stoneLight,5);
  box(g,1.59,.045,1.55,0,5.40,-.17,P.stoneDark);
  flag(g,.28,5.50,-.44,P.purple,.58);
  if(level>=2){for(const x of [-1.36,1.36])shield(g,x,2.09,1.85,P.purple,.37);}
  if(level>=3){for(const x of [-1.36,1.36])torch(g,x,3.97,-1.34,.58);box(g,2.17,.045,2.13,0,5.29,-.17,P.gold);}
  if(level>=4){for(const x of [-.65,.65])crystal(g,.12,.35,x,5.44,-.30,0x9272dd);}
  if(level>=5)shield(g,0,4.24,.83,P.purple,.34);
}
function mine(g,level=1){
  foundation(g,2.80,2.66);
  orb(g,1.17,0,1.02,-.23,0x858e91,1,[1.12,.98,.93]);
  for(const [x,z,s] of [[-1.02,.45,.53],[.93,.26,.63],[-.68,-.86,.54],[.63,-.85,.46]])orb(g,s,x,.34+s*.48,z,0xa5b1ac,0,[.9,1.1,1]);
  box(g,1.34,1.32,.18,0,.94,.83,P.woodDark);
  box(g,.95,1.04,.04,0,.78,.94,0x243b42,false);
  for(const x of [-.66,.66])box(g,.23,1.60,.35,x,.91,.89,P.woodLight);
  box(g,1.63,.29,.36,0,1.67,.89,P.woodLight);
  beam(g,[-.7,1.1,1.1],[-.23,1.7,1.1],.14,P.wood);
  beam(g,[.7,1.1,1.1],[.23,1.7,1.1],.14,P.wood);
  for(const x of [-.33,.33])box(g,.08,.07,1.33,x,.29,1.00,P.ironLight);
  for(const z of [.48,.83,1.18,1.5])box(g,.87,.065,.12,0,.26,z,P.woodDark);
  box(g,.58,.35,.50,.09,.50,1.32,P.wood);
  orb(g,.21,.08,.78,1.31,P.gold);orb(g,.14,-.07,.77,1.19,0xffd46b);
  crystal(g,.20,.52,-1.01,.45,.85,P.gold);crystal(g,.13,.40,-.76,.35,1.11,0xffd875);
  crystal(g,.21,.57,.54,1.63,-.50,P.gold);
  box(g,.21,2.35,.23,1.10,1.42,-.42,P.wood);
  beam(g,[1.08,2.25,-.42],[.26,2.66,-.42],.17,P.woodLight);
  box(g,1.3,.17,.21,.62,2.65,-.42,P.woodLight);
  cyl(g,.027,.92,.13,2.15,-.42,P.iron,6);
  box(g,.30,.25,.32,.13,1.65,-.42,P.woodDark);
  beam(g,[1.12,.35,-.48],[.29,2.58,-.48],.11,P.woodDark);
  beam(g,[1.12,.4,-.40],[1.12,2.49,.35],.1,P.woodLight);
  const pulley=cyl(g,.21,.10,.13,2.60,-.42,P.iron,12);pulley.rotation.x=Math.PI/2;
  const hub=cyl(g,.10,.13,.13,2.60,-.35,P.gold,8);hub.rotation.x=Math.PI/2;
  for(const x of [-.65,.65])rivets(g,x,1.34,1.085,.19,.65);
  for(const x of [-.21,.39])for(const z of [1.12,1.51]){
    const wheel=cyl(g,.115,.09,x,.37,z,P.iron,8);wheel.rotation.z=Math.PI/2;
  }
  for(let i=0;i<6;i++)box(g,.045,.29,.51,-.16+i*.10,.53,1.32,P.woodLight,false);
  for(const x of [-.23,.41])box(g,.045,.07,.54,x,.62,1.32,P.iron,false);
  for(let i=0;i<8;i++)orb(g,.10+(i%3)*.035,-.97+(i%3)*.18,.37+Math.floor(i/3)*.1,.61+(i%2)*.17,[P.gold,0xffd061,0xbe842b][i%3],0);
  barrel(g,1.01,.25,.85,.20,.48);
  crate(g,-.98,.25,-.72,.36);
  for(let i=0;i<5;i++)orb(g,.21,-.74+i*.34,1.52+Math.sin(i)*.21,-.31,0x5f6e73,0,[1,.7,.8]);
  if(level>=2)for(const x of [-.78,.78])box(g,.13,.21,.36,x,1.67,.89,P.iron);
  if(level>=3){crystal(g,.23,.63,-.64,1.79,-.23,0xffbd31);shield(g,0,1.64,1.10,P.woodDark,.25);}
}
function forge(g,level=1){
  foundation(g,2.84,1.93);
  box(g,2.43,1.33,1.50,0,.88,0,0xc4866c);
  for(const yy of [.46,.82,1.18])for(const xx of [-.98,-.45,.12,.72])box(g,.42,.18,.045,xx,yy,.76,yy===.82?0xb47762:0xdcaa82);
  roof(g,2.73,.78,1.77,0,1.54,0,P.roofRed,P.woodDark);
  box(g,.73,.93,.20,-.48,.80,.86,P.stoneDark);
  box(g,.48,.69,.10,-.48,.74,.99,0x4d3027);
  const glow=box(g,.36,.49,.035,-.48,.73,1.06,0xff9249);glow.material=mat(0xff954c,{emissive:0xff692d,emissiveIntensity:.9});
  for(const x of [-.65,-.48,-.31])box(g,.045,.73,.085,x,.75,1.09,P.iron);
  box(g,.62,2.24,.54,.75,1.41,-.21,0xaa7560);
  box(g,.78,.18,.67,.75,2.57,-.21,P.stoneDark);
  box(g,.39,.035,.30,.75,2.67,-.21,0x413c3c);
  box(g,.58,.12,.44,.82,.61,1.05,P.iron);
  box(g,.29,.35,.29,.82,.40,1.05,P.iron);
  const anvil=box(g,.74,.18,.31,.81,.77,1.05,P.ironLight);anvil.rotation.z=.035;
  box(g,.24,.12,.15,.46,.81,1.05,P.ironLight);
  beam(g,[1.17,.26,.62],[1.06,1.01,.62],.08,P.woodLight);box(g,.34,.15,.15,1.04,1.06,.62,P.iron);
  windowBox(g,.25,1.08,.77,.28,.30);
  masonry(g,.62,1.95,.54,.75,1.43,-.21,{rows:6,cols:2,color:0x975b43,sides:true});
  for(const x of [-1.15,1.15])buttress(g,x,.62,1.13);
  barrel(g,-1.0,.25,.91,.19,.43);
  crate(g,-1.0,.25,-.67,.35);
  for(let i=0;i<5;i++)orb(g,.095,.34+(i%3)*.16,.30+Math.floor(i/3)*.10,.97,0x272929,0);
  for(const x of [-.68,-.48,-.29])orb(g,.055,x,.45,1.08,0xffb136,0,[1,1.2,1],{emissive:0xff6b16,emissiveIntensity:.6});
  box(g,.73,.08,.63,.75,2.74,-.21,level>2?P.gold:P.iron);
  if(level>=2){box(g,.14,.35,.15,1.16,1.23,.68,P.gold);shield(g,-1.09,1.36,.82,P.roofRed,.3);}
}
function barracks(g,level=1){
  foundation(g,2.91,2.88);
  box(g,2.51,1.80,2.29,0,1.15,-.06,P.stoneDark);
  masonry(g,2.51,1.75,2.29,0,1.15,-.06,{rows:4,cols:4,color:P.stone,sides:true});
  roof(g,2.75,1.04,2.63,0,2.06,-.06,0x444152,P.stoneDark);
  for(const x of [-1.20,1.20]){buttress(g,x,.94,1.72);buttress(g,x,-1.08,1.72);}
  archPanel(g,.76,1.48,.09,0,.29,1.14,P.woodDark);
  archFrame(g,.76,1.48,.13,.22,0,.29,1.22,P.stoneLight);
  for(const xx of [-.25,0,.25])box(g,.035,1.21,.05,xx,.92,1.27,P.iron,false);
  for(const yy of [.68,1.33])box(g,.72,.065,.055,0,yy,1.30,P.ironLight);
  for(const x of [-.86,.86]){archWindow(g,x,1.24,1.13,.22,.52);banner(g,x,1.82,1.23,.30,.95);}
  shield(g,0,2.10,1.32,P.purple,.46);
  for(const x of [-.51,.51])torch(g,x,1.28,1.30,.54);
  for(const side of [-1,1]){const f=new THREE.Group();f.position.set(side*1.28,0,-.06);f.rotation.y=side*Math.PI/2;g.add(f);for(const x of [-.63,.63])archWindow(f,x,1.0,0,.22,.62);}
  box(g,.69,.68,.66,.65,2.82,-.48,P.stoneDark);
  masonry(g,.69,.57,.66,.65,2.84,-.48,{rows:2,cols:2,color:P.stone,sides:true});
  battlements(g,.81,.79,.65,3.20,-.48,P.stoneLight,3);
  flag(g,.64,3.31,-.48,P.purple,.64);
  crate(g,-1.10,.25,-1.14,.35);barrel(g,1.09,.25,-1.10,.18,.42);
  box(g,.65,.08,.13,-.7,.64,-1.29,P.wood);
  for(const x of [-.94,-.70,-.46]){cyl(g,.025,1.12,x,.87,-1.25,P.woodLight,6);cyl(g,.07,.20,x,1.52,-1.25,P.ironLight,4,0);}
  if(level>=2)box(g,2.63,.055,2.43,0,1.98,-.06,P.gold);
  if(level>=3){for(const x of [-1.20,1.20])shield(g,x,.83,1.18,P.purple,.29);}
}
function lifeTree(g){
  cyl(g,1.42,.20,0,.10,0,P.stoneDark,12);
  cyl(g,1.31,.11,0,.235,0,P.stoneLight,12);
  cyl(g,1.17,.06,0,.32,0,0x95b985,12);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;beam(g,[0,.43,0],[Math.cos(a)*.88,.33,Math.sin(a)*.88],.18,P.wood);}
  beam(g,[0,.34,0],[-.16,1.57,.04],.44,P.wood);
  beam(g,[-.16,1.36,.04],[.11,2.72,0],.28,P.woodLight);
  beam(g,[-.10,1.24,0],[-.81,2.33,.12],.22,P.wood);
  beam(g,[0,1.70,0],[.90,2.57,.17],.22,P.woodLight);
  beam(g,[-.1,1.54,0],[-.12,2.60,-.67],.21,P.wood);
  const clusters=[[-.75,2.56,.21,.48],[-.37,2.93,-.42,.53],[.37,3.14,-.22,.56],[.81,2.76,.25,.45],[.15,2.80,.55,.54],[-.48,3.04,.36,.48],[.10,3.53,.07,.43]];
  clusters.forEach(([x,y,z,r],i)=>{
    beam(g,[x*.57,y-.55,z*.5],[x,y,z],.075,P.woodLight);
    for(let j=0;j<4;j++){
      const a=j*2.4+i;
      orb(g,r*.68,x+Math.cos(a)*r*.45,y+Math.sin(a*.6)*r*.32,z+Math.sin(a)*r*.42,[0xcd4f88,0xe16ca0,0xf299ba,0xd97eaf][(i+j)%4],1,[1,.85,1]);
    }
  });
  for(let i=0;i<8;i++){const a=i*2.399;orb(g,.085,Math.cos(a)*(.5+i*.065),.38,Math.sin(a)*(.5+i*.065),0xffcbd7,0,[1,.40,1]);}
  for(const x of [-.78,.78])crystal(g,.13,.27,x,.35,.70,0x87dedc);
}
function shrine(g,level=1){
  cyl(g,.99,.16,0,.08,0,P.stoneDark,10);
  cyl(g,.88,.20,0,.25,0,P.stoneLight,10);
  cyl(g,.70,.07,0,.38,0,P.tealDark,10);
  cyl(g,.64,.04,0,.43,0,0x62d7ed,16,.64,{emissive:0x29b0d8,emissiveIntensity:.35,roughness:.2});
  cyl(g,.40,.18,0,.50,0,P.stone,8);
  cyl(g,.27,.28,0,.72,0,P.gold,6,.20);
  crystal(g,.36,1.30,0,.88,0,0x85e8f3);
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;const x=Math.cos(a)*.72,z=Math.sin(a)*.72;cyl(g,.17,.40,x,.53,z,P.stoneLight,6);crystal(g,.13,.37,x,.75,z,P.blue);}
  const ring=mesh(geo('magicring',()=>new THREE.TorusGeometry(.64,.038,5,24)),mat(P.gold),0,1.63,0);ring.rotation.x=Math.PI/2;ring.rotation.y=.19;g.add(ring);ring.userData.spin='shrine';
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.cos(a)*.88,z=Math.sin(a)*.88;
    const rune=box(g,.08,.10,.12,x,.29,z,i%2?P.gold:0x4be3e0,false);rune.rotation.y=-a;
    if(i%2===0){const strut=box(g,.15,.40,.16,x,.52,z,P.gold);strut.rotation.z=Math.cos(a)*.2;}
  }
  for(const x of [-.7,.7]){cyl(g,.18,.1,x,.32,.64,P.gold,8);crystal(g,.08,.22,x,.38,.64,0x53bcd6);}
  if(level>=3){const ring2=ring.clone();ring2.scale.setScalar(1.18);ring2.position.y=1.26;ring2.rotation.z=.35;g.add(ring2);}
}
function cottage(g,level=1){
  foundation(g,1.94,1.88);
  box(g,1.54,1.14,1.39,0,.83,0,P.stoneLight);
  for(const x of [-.72,.72])box(g,.12,1.17,1.41,x,.84,0,P.woodLight);
  roof(g,1.99,.89,1.87,0,1.42,0,P.roofLight,P.roofRed);
  door(g,-.35,.78,.73,.39,.78);windowBox(g,.43,.98,.73,.31,.32);
  box(g,.43,.16,.30,.42,.72,.90,P.wood);
  for(const x of [.29,.44,.57])orb(g,.09,x,.83,.90,0x8baf68,0);
  box(g,.26,.77,.28,.56,2.02,-.25,P.stone);box(g,.35,.12,.38,.56,2.45,-.25,P.stoneDark);
  box(g,.75,.11,.38,-.33,.30,.97,P.stoneLight);
  masonry(g,1.54,.38,1.39,0,.43,0,{rows:1,cols:3,color:0x9b9f8a,sides:true});
  for(const side of [-1,1]){
    beam(g,[side*.79,.52,-.62],[side*.79,1.30,.56],.085,P.wood);
    box(g,.10,.1,1.5,side*.79,1.30,0,P.woodLight);
  }
  box(g,.26,.07,.29,.56,2.14,-.25,P.stoneDark);
  box(g,.26,.06,.29,.56,2.34,-.25,P.stoneDark);
  box(g,.20,.02,.20,.56,2.53,-.25,0x263c41);
  for(const x of [.19,.66])box(g,.1,.35,.075,x,.98,.80,level>2?P.teal:P.woodLight,false);
  barrel(g,.72,.25,-.64,.16,.36);
  crate(g,-.65,.25,-.65,.30);
  if(level>=2)shield(g,0,1.59,.70,0x977137,.25);
  if(level>=3)box(g,1.93,.06,1.82,0,1.40,0,P.gold);
}
function mill(g,level=1){
  foundation(g,2.57,2.47);
  cyl(g,.81,1.89,0,1.16,0,P.stoneLight,8,.61);
  cyl(g,.84,.19,0,.41,0,P.stoneDark,8);
  cyl(g,.69,.14,0,1.98,0,P.woodLight,8);
  cyl(g,.91,.75,0,2.43,0,P.roofRed,8,.03);
  door(g,-.24,.83,.77,.48,.95);
  windowBox(g,.23,1.42,.71,.20,.29);
  const fan=new THREE.Group();fan.position.set(0,2.16,.91);fan.userData.spin='windmill';g.add(fan);
  const center=cyl(fan,.19,.25,0,0,0,P.woodDark,8);center.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){
    const blade=new THREE.Group();blade.rotation.z=i*Math.PI/2+.32;fan.add(blade);
    box(blade,.075,1.35,.075,0,.56,0,P.wood);
    box(blade,.33,.88,.08,.10,.72,.018,P.stoneLight);
    for(const yy of [.39,.64,.89,1.14])box(blade,.35,.035,.045,.10,yy,.08,P.woodLight,false);
    box(blade,.04,.90,.035,-.045,.73,.086,P.woodLight,false);
    box(blade,.04,.90,.035,.255,.73,.086,P.woodLight,false);
  }
  for(const [x,z] of [[.95,.65],[-.89,.37]])barrel(g,x,.22,z,.24,.52);
  for(let row=0;row<5;row++){
    const y=.55+row*.27,r=.8-row*.035;
    for(let i=0;i<8;i++){
      const a=(i+(row%2)*.5)*Math.PI/4,o=box(g,.34,.21,.045,Math.sin(a)*r,y,Math.cos(a)*r,[0x8d9997,0xaab1a3,0xbcc4b2][(i+row)%3],false);o.rotation.y=a;
    }
  }
  for(let i=0;i<3;i++)cyl(g,.87-i*.22,.055,0,2.07+i*.2,0,i%2?P.roofLight:P.roofRed,8,.84-i*.22);
  crate(g,-.90,.25,-.63,.42);
  for(let i=0;i<3;i++)orb(g,.20,.88-i*.16,.42,-.66-i*.13,0xc4ae74,1,[.8,1.4,.85]);
  if(level>=2)shield(g,.34,1.61,.74,P.teal,.28);
  if(level>=3)cyl(g,.69,.08,0,1.98,0,P.gold,8);
}
function tower(g,level=1){
  foundation(g,1.94,1.94);
  squareTower(g,0,0,3.71,1.42,false);
  for(const x of [-.62,.62])for(const z of [-.62,.62]){box(g,.24,1.25,.26,x,.90,z,P.stoneLight);box(g,.30,.16,.32,x,.32,z,P.stoneDark);}
  banner(g,0,3.13,.76,.48,1.45,P.purple);
  const face=new THREE.Group();face.position.set(.75,0,0);face.rotation.y=Math.PI/2;g.add(face);banner(face,0,3.13,.02,.48,1.45,P.purple);
  archPanel(g,.41,.90,.05,0,.29,.76,P.woodDark);archFrame(g,.41,.90,.07,.10,0,.29,.80,P.stoneLight);
  // A small ballista sits within the stone parapet.
  box(g,.20,.33,.31,0,3.96,0,P.woodDark);
  box(g,.065,.07,.74,0,4.17,.12,P.woodLight);
  beam(g,[-.43,4.20,.23],[0,4.09,.39],.065,P.wood);beam(g,[.43,4.20,.23],[0,4.09,.39],.065,P.wood);
  beam(g,[-.43,4.20,.23],[.43,4.20,.23],.018,P.iron);
  torch(g,-.51,2.12,.81,.47);torch(g,.51,2.12,.81,.47);
  if(level>=2)shield(g,0,2.62,.80,P.purple,.34);
  if(level>=3)flag(g,-.47,4.0,-.41,P.purple,.56);
}
function cannon(g,level=1){
  foundation(g,1.91,1.84);
  box(g,1.69,.31,1.59,0,.42,0,P.wood);
  for(const x of [-.64,.64])box(g,.20,.46,1.42,x,.50,0,P.woodLight);
  cyl(g,.53,.24,0,.66,0,P.iron,10);
  for(const x of [-.48,.48])box(g,.24,.64,.66,x,.93,-.01,P.woodLight);
  const barrel=new THREE.Group();barrel.position.set(0,1.15,-.02);barrel.rotation.x=Math.PI/2-.25;g.add(barrel);
  cyl(barrel,.29,1.27,0,0,0,P.iron,12,.33,{metalness:.45,roughness:.46});
  cyl(barrel,.37,.15,0,-.53,0,P.gold,12,.37,{metalness:.45,roughness:.4});
  cyl(barrel,.35,.13,0,.39,0,P.gold,12,.35,{metalness:.45,roughness:.4});
  cyl(barrel,.255,.02,0,-.614,0,0x152933,12,.255);
  orb(barrel,.31,0,.56,0,P.iron,1,[1,.60,1]);
  for(const x of [-.68,.68]){const hub=cyl(g,.25,.12,x,.92,0,P.gold,8);hub.rotation.z=Math.PI/2;}
  for(const [x,z] of [[.60,.64],[.85,.47],[.82,.79]])orb(g,.15,x,.72,z,P.iron,1);
  for(let i=0;i<6;i++)box(g,1.53,.035,.035,0,.59,-.65+i*.26,P.woodDark,false);
  for(const x of [-.64,.64])for(const z of [-.53,.53]){
    box(g,.24,.035,.14,x,.75,z,P.ironLight,false);orb(g,.055,x,.79,z,P.gold,0);
  }
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    orb(barrel,.04,Math.sin(a)*.368,-.54,Math.cos(a)*.368,P.ironLight,0);
  }
  const gear=cyl(g,.38,.10,.70,.91,0,P.iron,12);gear.rotation.z=Math.PI/2;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;box(g,.11,.10,.10,.78,.91+Math.sin(a)*.32,Math.cos(a)*.32,P.gold);}
  if(level>=2){cyl(barrel,.30,.22,0,-.13,0,P.gold,12,.30);}
  if(level>=3){shield(g,0,.57,.85,P.teal,.32);box(g,1.6,.07,1.48,0,.29,0,P.gold);}
}
function wall(g,level=1){
  box(g,.98,.18,.87,0,.09,0,P.stoneDark);
  box(g,.94,1.13,.54,0,.74,0,P.stoneDark);
  masonry(g,.94,1.07,.54,0,.74,0,{rows:3,cols:3,color:P.stone,sides:true});
  for(const x of [-.40,.40])box(g,.15,.91,.66,x,.63,0,P.stoneLight);
  box(g,.99,.14,.68,0,1.31,0,P.stoneLight);
  for(const x of [-.34,.34])box(g,.29,.36,.66,x,1.55,0,P.stoneLight);
  box(g,.96,.065,.59,0,1.04,0,P.stoneDark);
  if(level>=2)box(g,.98,.05,.70,0,1.39,0,P.iron);
  if(level>=3)banner(g,0,1.27,.365,.24,.63,P.purple);
  if(level>=4)box(g,.95,.04,.58,0,.98,0,P.gold);
}
function vault(g,level=1){
  foundation(g,2.91,2.88);
  box(g,2.47,.80,2.19,0,.65,0,P.stoneDark);
  masonry(g,2.47,.74,2.19,0,.65,0,{rows:2,cols:4,color:P.stone,sides:true});
  box(g,2.32,.17,2.06,0,1.12,0,P.gold);
  // Armored chest: curved lid made from seven reusable wooden segments.
  box(g,2.05,.76,1.73,0,1.60,0,0x785032);
  for(let i=0;i<7;i++){
    const z=-.78+i*.26,y=2.05+Math.sqrt(Math.max(0,1-(z/.96)**2))*.50;
    box(g,2.09,.17,.25,0,y,z,[0x9b632e,0xb98237,0x8b5528][i%3]);
  }
  for(const x of [-.80,0,.80]){
    box(g,.14,.90,1.80,x,1.62,0,P.iron);
    for(let i=0;i<7;i++){
      const z=-.78+i*.26,y=2.13+Math.sqrt(Math.max(0,1-(z/.96)**2))*.50;
      const b=box(g,.15,.10,.27,x,y,z,level>=3?P.gold:P.iron);b.rotation.x=Math.atan2(-z,.70)*.40;
    }
    for(const z of [-.94,.94])for(const y of [1.35,1.95])orb(g,.055,x,y,z,P.gold,0);
  }
  box(g,.58,.62,.15,0,1.55,.95,P.gold);
  box(g,.37,.39,.10,0,1.55,1.06,P.iron);
  cyl(g,.10,.11,0,1.55,1.14,P.gold,8).rotation.x=Math.PI/2;
  box(g,.055,.14,.04,0,1.48,1.19,0x17252c,false);
  for(const x of [-1.2,1.2]){
    box(g,.18,1.09,.22,x,.93,.99,P.stoneLight);
    cyl(g,.14,.10,x,1.52,.99,P.gold,8);
  }
  for(let i=0;i<9;i++){
    const x=-.96+(i%3)*.17,z=1.04+Math.floor(i/3)*.08;
    cyl(g,.10,.035,x,.31+Math.floor(i/3)*.037,z,P.gold,10);
  }
  barrel(g,1.08,.27,-.99,.17,.37);
  if(level>=2)shield(g,0,.70,1.15,P.teal,.44);
  if(level>=4){crystal(g,.16,.31,-.84,2.44,0,0xffdc62);crystal(g,.16,.31,.84,2.44,0,0xffdc62);}
}
function reservoir(g,level=1){
  foundation(g,2.94,2.94);
  cyl(g,1.33,.30,0,.40,0,P.stoneDark,12);
  cyl(g,1.20,.16,0,.63,0,P.gold,12);
  cyl(g,1.13,.80,0,1.07,0,0x254b62,12);
  cyl(g,1.20,.15,0,1.50,0,P.gold,12);
  // Opaque emissive liquid remains readable on mobile without glass sorting.
  cyl(g,1.075,.045,0,1.58,0,0x775ae8,32,1.075,{roughness:.27,metalness:.12,emissive:0x5c39ca,emissiveIntensity:.38});
  const surface=mesh(geo('reservoir-surface',()=>new THREE.TorusGeometry(.70,.022,4,32)),mat(0xa7a0ff,{emissive:0x8b64ff,emissiveIntensity:.4}),0,1.62,0);surface.rotation.x=Math.PI/2;g.add(surface);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.sin(a)*1.13,z=Math.cos(a)*1.13;
    const post=box(g,.17,.92,.18,x,1.06,z,P.ironLight);post.rotation.y=a;
    cyl(g,.13,.08,x,1.57,z,P.gold,8);
    orb(g,.055,x,1.65,z,P.gold,0);
    const panel=box(g,.52,.52,.052,Math.sin(a)*1.146,1.06,Math.cos(a)*1.146,0x285e73);panel.rotation.y=a;
    const line=box(g,.055,.35,.04,Math.sin(a)*1.19,1.07,Math.cos(a)*1.19,0x6bd1f1);line.rotation.y=a;
  }
  cyl(g,.22,.35,0,1.77,0,P.gold,8,.16);
  crystal(g,.30,.80,0,1.97,0,level>=3?0xd391ff:0x63d9f3);
  for(const x of [-1.05,1.05]){
    const pipe=cyl(g,.11,.94,x,.72,.86,P.ironLight,8);pipe.rotation.z=x>0?.28:-.28;
    cyl(g,.18,.10,x,.31,.86,P.gold,8);
  }
  box(g,.54,.48,.14,0,.97,1.24,P.iron);
  for(let i=0;i<4;i++)box(g,.34,.046,.045,0,.81+i*.11,1.33,i<level?0x93ddf0:0x386375,false);
  shield(g,0,.45,1.39,P.purple,.30);
  if(level>=2){for(const x of [-.81,.81])crystal(g,.10,.25,x,1.60,0,0xd497ff);}
  if(level>=4){const ring=mesh(geo('reservoir-ring',()=>new THREE.TorusGeometry(.54,.035,5,24)),mat(P.gold),0,2.46,0);ring.rotation.x=Math.PI/2;ring.userData.spin='shrine';g.add(ring);}
}
// Wrap the architecture so the exported group always has a centered footprint and
// sits on y=0, while animated subgroups retain their own local coordinate system.
function groundAndCenter(group,footprint){
  const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const fit=footprint?Math.min(1,footprint[0]/size.x,footprint[1]/size.z):1;
  const body=new THREE.Group();body.name='architecture';
  for(const child of [...group.children])body.add(child);
  body.scale.setScalar(fit);body.position.set(-center.x*fit,-bounds.min.y*fit,-center.z*fit);group.add(body);
  return group;
}
const constructors={castle,mine,forge,barracks,tree:lifeTree,shrine,cottage,mill,tower,cannon,wall,vault,reservoir};
const footprints={castle:[4,4],mine:[3,3],forge:[3,2],barracks:[3,3],tree:[3,3],shrine:[2,2],cottage:[2,2],mill:[3,3],tower:[2,2],cannon:[2,2],wall:[1,1],vault:[3,3],reservoir:[3,3]};
export function createBuilding(kind,level=1){
  const g=new THREE.Group();g.name=`building-${kind}`;g.userData.kind=kind;g.userData.level=level;
  level=Math.max(1,Math.min(5,Math.floor(Number(level)||1)));
  (constructors[kind] || cottage)(g,level);
  if(level>1){
    const extent=kind==='castle'?1.82:kind==='wall'?.39:kind==='cottage'||kind==='tower'||kind==='cannon'||kind==='shrine'?.82:1.24;
    for(let i=0;i<Math.min(3,level-1);i++)orb(g,.065,-.16+i*.16,.27,extent,P.gold,0);
    if(level>=4&&kind!=='wall'&&kind!=='tree'){
      for(const x of [-extent*.8,extent*.8]){cyl(g,.09,.19,x,.29,extent*.66,P.gold,6);}
    }
  }
  return groundAndCenter(g,footprints[kind] || footprints.cottage);
}
function rng(seed){let s=(Number(seed)||1)>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
export function createTree(seed=1){
  const random=rng(seed),g=new THREE.Group();g.name='landscape-tree';
  // Long, tapering spruce silhouettes with uneven drooping branch skirts.
  // Shared tier meshes allow the renderer to instance hundreds of forest trees.
  const variation=Math.floor(random()*4),h=2.45+random()*1.32,spread=.63+random()*.23;
  const leaf=[0x244c40,0x305c46,0x3f684e,0x486f50,0x35563d];
  cyl(g,.10,h*.76,0,h*.38,0,0x5c4935,12,.043);
  for(let layer=0;layer<7;layer++){
    const f=layer/7,y=.58+f*(h-.36),r=spread*(1-f*.87),hh=.68+(1-f)*.30;
    const tier=geo(`spruce-tier:${variation}:${layer%2}`,()=>{
      const vertices=[],normals=[],segments=12;
      for(let i=0;i<segments;i++){
        const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
        const edge=i%2?.88:1,edge2=(i+1)%2?.88:1;
        vertices.push(0,1,0,Math.cos(a)*edge,(i%3)*.025,Math.sin(a)*edge,Math.cos(b)*edge2,((i+1)%3)*.025,Math.sin(b)*edge2);
        vertices.push(0,.08,0,Math.cos(b)*edge2,((i+1)%3)*.025,Math.sin(b)*edge2,Math.cos(a)*edge,(i%3)*.025,Math.sin(a)*edge);
      }
      const t=new THREE.BufferGeometry();t.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));t.computeVertexNormals();return t;
    });
    const o=mesh(tier,mat(leaf[(variation+layer)%leaf.length],{roughness:.97}),0,y,0);o.scale.set(r,hh,r);o.rotation.y=layer*.38;g.add(o);
    if(layer<5)for(let k=0;k<3;k++){
      const a=k*Math.PI*2/3+layer*.85;
      const branch=mesh(tier,mat(leaf[(variation+layer+1)%leaf.length],{roughness:.97}),Math.cos(a)*r*.56,y+.02,Math.sin(a)*r*.56);
      branch.scale.set(r*.42,hh*.47,r*.42);branch.rotation.y=a;branch.rotation.z=Math.cos(a)*.15;g.add(branch);
    }
  }
  for(let i=0;i<3;i++){const a=i*2.1;beam(g,[0,.17,0],[Math.cos(a)*.23,.025,Math.sin(a)*.23],.075,0x64513b);}
  groundAndCenter(g);g.rotation.y=random()*Math.PI*2;g.scale.setScalar(.88+random()*.28);return g;
}
export function createRock(seed=1){
  const random=rng(seed),g=new THREE.Group();g.name='landscape-rock';
  const r=.3+random()*.27;
  const o=orb(g,r,0,r*.45,0,[0x778578,0x68736a,0xa4a78b][Math.floor(random()*3)],0,[1.2,.74,.95]);o.rotation.y=random()*6.28;
  orb(g,r*.40,r*.7,r*.12,r*.2,0x8b927b,0,[1,.66,1]);
  orb(g,r*.34,-r*.22,r*.67,r*.10,0x5e773c,0,[1,.20,.82]);return groundAndCenter(g);
}
export function createVillager(color=0xe2ba75){
  const g=new THREE.Group();g.name='villager';
  for(const x of [-.067,.067]){box(g,.10,.17,.13,x,.085,0,0x4d5a67);box(g,.11,.07,.17,x,.035,.034,P.woodDark);}
  cyl(g,.13,.23,0,.28,0,color,6,.12);
  orb(g,.115,0,.50,0,0xf4cba4,1,[.9,1,1]);
  cyl(g,.17,.07,0,.58,0,P.gold,8);cyl(g,.12,.08,0,.635,0,P.woodLight,8,.08);
  for(const x of [-.17,.17]){const a=box(g,.075,.19,.08,x,.30,0,color);a.rotation.z=x>0?.14:-.14;orb(g,.045,x,.19,.012,0xf4cba4);}
  return g;
}
