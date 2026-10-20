import * as THREE from '../vendor/three.module.js';

export const PALETTE={stone:0xe6cf9e,stoneLight:0xffe7b7,stoneShade:0xbea77a,plaster:0xf2deb3,wood:0x714126,woodLight:0xad703a,roof:0xd95b20,roofLight:0xf58b32,roofDark:0xa83b17,blue:0x2564b5,blueLight:0x428ddb,gold:0xe6b647,steel:0xa7bdce,steelLight:0xd9e7e9,skin:0xe9ae78,dark:0x293b47};
const cached=new Map();
const geo=(key,fn)=>{if(!cached.has(key))cached.set(key,fn());return cached.get(key);};
function bevel(){return geo('bevel',()=>{const s=new THREE.Shape();s.moveTo(-.42,-.42);s.lineTo(.42,-.42);s.lineTo(.42,.42);s.lineTo(-.42,.42);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.84,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:2,steps:1,curveSegments:1});g.translate(0,0,-.42);return g;});}
function arch(w,h,d){return geo(`arch-${w}-${h}-${d}`,()=>{const s=new THREE.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI);s.lineTo(-r,0);return new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:2,curveSegments:10});});}
function shield(){return geo('shield',()=>{const s=new THREE.Shape();s.moveTo(-.43,.47);s.quadraticCurveTo(0,.57,.43,.47);s.lineTo(.39,-.12);s.quadraticCurveTo(.32,-.4,0,-.57);s.quadraticCurveTo(-.32,-.4,-.39,-.12);s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.1,bevelEnabled:true,bevelSize:.03,bevelThickness:.025,bevelSegments:2,curveSegments:8});});}
const mats=new Map();
function mat(color,type='stone'){
 const key=color+':'+type;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:type==='metal'?.38:.86,metalness:type==='metal'?.48:0}));return mats.get(key);
}
class Sculpt {
 constructor(group=new THREE.Group()){this.group=group;}
 mesh(g,c,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,type='stone'){const m=new THREE.Mesh(g,mat(c,type));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;this.group.add(m);return m;}
 box(c,x,y,z,w,h,d,rx=0,ry=0,rz=0,type='stone'){return this.mesh(bevel(),c,x,y,z,w,h,d,rx,ry,rz,type);}
 orb(c,x,y,z,w,h=w,d=w,type='stone'){return this.mesh(geo('orb',()=>new THREE.SphereGeometry(1,20,12)),c,x,y,z,w,h,d,0,0,0,type);}
 cyl(c,x,y,z,r,h,top=r,n=20,rx=0,ry=0,rz=0,type='stone'){return this.mesh(geo(`cyl-${top/r}-${n}`,()=>new THREE.CylinderGeometry(top/r,1,1,n)),c,x,y,z,r,h,r,rx,ry,rz,type);}
 arch(c,x,y,z,w,h,d){return this.mesh(arch(w,h,d),c,x,y,z);}
 beam(c,a,b,r){const m=this.cyl(c,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize());return m;}
}
function trimDoor(b,x,y,z,w=1,h=1.5){
 b.arch(0x372b25,x,y,z,w+.18,h+.12,.08);b.arch(PALETTE.wood,x,y+.02,z+.08,w,h,.075);
 const r=w/2;
 for(let i=0;i<7;i++){const xx=-r+(i+.5)*w/7,hh=h-r+Math.sqrt(Math.max(0,r*r-xx*xx));b.box(i%2?0x89512b:0xa16b37,x+xx,y+hh/2,z+.18,w/7-.016,hh-.035,.035);}
 for(const level of [.30,.72]){b.box(0x36404a,x,y+h*level,z+.21,w*.92,.07,.055);for(const side of [-.34,.34])b.orb(PALETTE.gold,x+w*side,y+h*level,z+.245,.024,.024,.018);}
 for(const side of [-1,1])for(let j=0;j<4;j++)b.box(j%2?PALETTE.stone:PALETTE.stoneLight,x+side*(w/2+.12),y+(j+.5)*(h-r)/4,z+.12,.20,(h-r)/4-.018,.25);
 const cy=y+h-r;
 for(let j=0;j<9;j++){const a=j*Math.PI/9+.025,aa=(j+1)*Math.PI/9-.025,s=new THREE.Shape();s.absarc(0,0,r+.25,a,aa);s.absarc(0,0,r+.025,aa,a,true);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.25,bevelEnabled:true,bevelSize:.014,bevelThickness:.015,bevelSegments:1,curveSegments:2});b.mesh(g,j%2?PALETTE.stoneLight:PALETTE.stone,x,cy,z+.035);}
 b.mesh(geo('knocker',()=>new THREE.TorusGeometry(.065,.018,8,20)),PALETTE.gold,x+.13,y+h*.49,z+.26,1,1,1,0,0,0,'metal');
}
function windowFrame(b,x,y,z,w=.38,h=.6){b.arch(PALETTE.wood,x,y,z,w+.12,h+.1,.08);b.arch(0x244959,x,y+.05,z+.09,w,h,.035);b.arch(0xf9ca67,x,y+.08,z+.13,w*.79,h*.83,.012);b.box(PALETTE.wood,x,y+h*.46,z+.17,.045,h*.81,.035);b.box(PALETTE.wood,x,y+h*.47,z+.18,w*.84,.04,.035);b.box(PALETTE.stoneLight,x,y-.02,z+.1,w+.26,.1,.22);}
function roof(b,x,y,z,w,d,rise){
 const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(0,rise);s.lineTo(w/2,0);s.lineTo(w/2,-.13);s.lineTo(-w/2,-.13);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:1});g.translate(0,0,-d/2);b.mesh(g,PALETTE.roofDark,x,y,z);
 const slope=rise/(w/2),rows=7,cols=Math.ceil(d/.32),tileWidth=w/2/rows;
 for(const side of [-1,1])for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const xx=(row+.5)*tileWidth,yy=rise-slope*xx+.05;
   b.box([0xe46b24,0xf0822d,0xd9591b,0xec7428][(row*3+col)%4],x+side*xx,y+yy,z-d/2+(col+.5)*d/cols,tileWidth*Math.sqrt(1+slope*slope)*1.12,.075,d/cols*.97,0,0,-side*Math.atan(slope));
 }
 for(let j=0;j<Math.ceil(d/.28);j++)b.cyl(PALETTE.roofLight,x,y+rise+.04,z-d/2+(j+.5)*d/Math.ceil(d/.28),.095,d/Math.ceil(d/.28)*.96,.095,12,Math.PI/2);
 for(const side of [-1,1]){b.box(PALETTE.wood,x+side*w/2,y-.06,z,.13,.19,d+.08);b.beam(PALETTE.wood,[x,y+rise-.10,z+d/2+.04],[x+side*w/2,y-.06,z+d/2+.04],.075);}
}
function coneRoof(b,x,y,z,r,h){
 for(let j=0;j<7;j++){const t=j/7,u=(j+1)/7,lower=r*Math.pow(1-t,.77),upper=r*Math.pow(1-u,.77);b.cyl(j%2?PALETTE.roof:0xed7929,x,y+(t+u)*h/2,z,lower+.025,(u-t)*h+.028,Math.max(.015,upper),24);}
 b.cyl(PALETTE.wood,x,y-.06,z,r*1.04,.13,r*1.04,24);b.orb(PALETTE.gold,x,y+h+.045,z,.09,.1,.09,'metal');
}
function banner(b,x,y,z,w=.4,h=.66){b.mesh(shield(),PALETTE.gold,x,y,z,w,h,.32);b.mesh(shield(),PALETTE.blue,x,y+.012,z+.045,w*.83,h*.85,.23);b.box(PALETTE.gold,x,y+.07,z+.09,w*.11,h*.47,.025);b.box(PALETTE.gold,x,y+.14,z+.09,w*.40,.04,.025);}
function tower(b,x,z,height=2.85,r=.57){
 b.cyl(PALETTE.stoneShade,x,.16,z,r*1.20,.32,r*1.16);b.cyl(PALETTE.stone,x,.42,z,r*1.08,.20,r*1.08);b.cyl(PALETTE.stoneShade,x,(height+.5)/2,z,r,height-.5,r,24);
 for(let row=0;row<7;row++)for(let col=0;col<12;col++){
  const a=(col+(row%2)*.5)*Math.PI/6,step=Math.PI/6-.035,s=new THREE.Shape();s.absarc(0,0,r+.018,a,a+step);s.absarc(0,0,r-.06,a+step,a,true);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:(height-.65)/7-.018,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,curveSegments:3});g.rotateX(Math.PI/2);b.mesh(g,[PALETTE.stone,0xddc591,0xf1d9a7][(row+col)%3],x,.57+(row+1)*(height-.65)/7,z);
 }
 b.cyl(PALETTE.stoneLight,x,height,z,r*1.17,.18,r*1.17);b.cyl(PALETTE.stoneShade,x,height+.13,z,r*1.08,.11,r*1.08);
 coneRoof(b,x,height+.19,z,r*1.13,.95);
 b.arch(PALETTE.dark,x,1.45,z+r+.015,.18,.43,.02);banner(b,x,1.10,z+r+.05,.33,.57);
}
function flag(x,y,z){const g=new THREE.Group(),b=new Sculpt(g);b.cyl(PALETTE.gold,0,.40,0,.025,.8,.025,10);b.orb(PALETTE.gold,0,.83,0,.05);const geom=new THREE.PlaneGeometry(.65,.34,8,4);geom.translate(.34,.59,0);const cloth=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:PALETTE.blue,roughness:.85,side:THREE.DoubleSide}));g.add(cloth);g.position.set(x,y,z);return {group:g,cloth};}
export function createCastle(){
 const b=new Sculpt();b.box(0x9f936e,0,.12,0,3.8,.24,3.05);b.box(PALETTE.stoneLight,0,.29,0,3.62,.16,2.92);b.box(PALETTE.stoneShade,0,1.55,-.08,2.6,2.5,2.32);
 for(let row=0;row<7;row++)for(let col=0;col<6;col++)for(const side of [-1,1])b.box([PALETTE.stone,PALETTE.stoneLight,0xd8bf91][(row+col)%3],-1.07+col*.43,.55+row*.33,side*1.11-.08,.408,.308,.105);
 for(const x of [-1.32,1.32])b.box(PALETTE.stoneLight,x,1.55,-.08,.14,2.50,2.35);
 roof(b,0,2.8,-.08,2.95,2.65,.95);
 for(const x of [-1.47,1.47])for(const z of [-1.03,1.03])tower(b,x,z,z<0?3.10:2.64,.51);
 trimDoor(b,0,.38,1.18,.91,1.42);banner(b,0,2.23,1.22,.55,.57);
 for(let j=0;j<3;j++)b.box(PALETTE.stoneLight,0,.07+j*.105,1.73-j*.17,1.28-j*.1,.13,.37);
 b.box(PALETTE.stone,0,3.25,-.45,1.1,.83,1.03);windowFrame(b,0,3.03,.08,.34,.43);roof(b,0,3.69,-.45,1.36,1.25,.61);
 const pennant=flag(0,4.31,-.45);b.group.add(pennant.group);
 for(const side of [-1,1]){b.box(PALETTE.dark,side*.72,1.21,1.22,.08,.2,.1);b.orb(0xffca67,side*.72,1.37,1.28,.08,.13,.08);}
 return {group:b.group,flags:[pennant.cloth]};
}
export function createCottage(){
 const b=new Sculpt();b.box(PALETTE.stoneShade,0,.13,0,2.38,.26,1.93);b.box(PALETTE.plaster,0,1.02,0,2.10,1.62,1.67);
 for(let col=0;col<6;col++)b.box(col%2?PALETTE.stoneLight:PALETTE.stone,-.9+col*.36,.38,.86,.34,.28,.17);
 for(const x of [-1.03,1.03])for(const z of [-.84,.84])b.box(PALETTE.wood,x,1.02,z,.14,1.64,.14);
 b.box(PALETTE.wood,0,.62,.88,2.15,.14,.13);b.box(PALETTE.wood,0,1.66,.88,2.15,.13,.14);
 roof(b,0,1.84,0,2.64,2.24,.87);
 trimDoor(b,-.43,.37,.87,.55,1.1);windowFrame(b,.55,.90,.91,.40,.53);
 b.box(PALETTE.woodLight,.56,.88,1.04,.64,.19,.26);b.box(0x54472c,.56,.98,1.04,.53,.04,.20);
 for(let i=0;i<5;i++){const x=.34+i*.11;b.orb(0x5f9d3c,x,1.04,1.06,.10,.06,.09);b.orb(i%2?0xe96785:0xf5c863,x,1.11,1.09,.045,.045,.035);}
 b.box(PALETTE.stone,.69,2.53,-.55,.38,.96,.41);for(let j=0;j<4;j++)b.box(j%2?PALETTE.stoneLight:PALETTE.stoneShade,.69,2.17+j*.20,-.32,.39,.035,.04);b.box(PALETTE.stoneLight,.69,3.02,-.55,.52,.13,.54);b.box(PALETTE.dark,.69,3.10,-.55,.32,.025,.31);
 b.box(PALETTE.wood,0,2.20,1.14,.11,.62,.12);b.box(PALETTE.wood,0,2.05,1.14,1.17,.10,.12);
 for(const x of [-.78,.78])b.beam(PALETTE.wood,[x,1.81,1.14],[0,2.55,1.14],.045);
 b.box(PALETTE.stoneLight,-.43,.16,1.23,.77,.2,.37);
 const barrel=new Sculpt();barrel.cyl(PALETTE.woodLight,0,.31,0,.23,.56,.20,14);for(const y of [.11,.48])barrel.cyl(PALETTE.dark,0,y,0,.235,.065,.235,14);barrel.group.position.set(1.35,0,.58);b.group.add(barrel.group);
 const sideWall=new Sculpt();windowFrame(sideWall,0,.93,0,.52,.58);sideWall.group.rotation.y=Math.PI/2;sideWall.group.position.set(1.06,0,0);b.group.add(sideWall.group);
 b.box(PALETTE.wood,1.06,.62,0,.12,.14,1.68);b.box(PALETTE.wood,1.06,1.66,0,.12,.14,1.68);
 return {group:b.group,chimney:new THREE.Vector3(.69,3.15,-.55)};
}
function blade(){const s=new THREE.Shape();s.moveTo(-.095,0);s.lineTo(.095,0);s.lineTo(.085,.77);s.lineTo(0,.98);s.lineTo(-.085,.77);s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:1,steps:1});}
export function createGuardian(){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);const b=new Sculpt(body),legs=[],arms=[];
 b.orb(PALETTE.blue,0,.91,-.04,.43,.40,.28);b.box(PALETTE.blueLight,0,.75,.04,.70,.33,.45);
 b.orb(PALETTE.steel,0,1.13,.16,.38,.33,.21,'metal');b.orb(PALETTE.steelLight,0,1.20,.26,.28,.18,.10,'metal');
 b.box(PALETTE.wood,0,.80,.04,.79,.12,.51);b.box(PALETTE.gold,0,.80,.32,.19,.16,.07,0,0,0,'metal');b.box(PALETTE.dark,0,.80,.37,.095,.075,.015);
 banner(b,0,1.13,.36,.26,.29);
 for(const side of [-1,1]){
   const thigh=new THREE.Group();thigh.position.set(side*.22,.69,0);root.add(thigh);const t=new Sculpt(thigh);t.orb(0x664330,0,-.15,0,.15,.22,.15);const knee=new THREE.Group();knee.position.y=-.25;thigh.add(knee);const k=new Sculpt(knee);k.orb(PALETTE.steel,0,-.08,.025,.155,.20,.16,'metal');k.orb(PALETTE.gold,0,.015,.14,.095,.08,.035,'metal');const foot=new THREE.Group();foot.position.y=-.30;knee.add(foot);const f=new Sculpt(foot);f.box(0x453a32,0,-.035,.08,.34,.22,.48);f.orb(PALETTE.steelLight,0,.02,.22,.16,.10,.16,'metal');legs.push({thigh,knee,foot});
   const shoulder=new THREE.Group();shoulder.position.set(side*.46,1.33,0);body.add(shoulder);const a=new Sculpt(shoulder);a.orb(PALETTE.gold,0,-.015,0,.235,.18,.235,'metal');a.orb(PALETTE.steel,0,.025,.015,.22,.16,.22,'metal');a.cyl(PALETTE.blue,0,-.20,0,.125,.29,.15,16);
   const elbow=new THREE.Group();elbow.position.y=-.33;shoulder.add(elbow);const e=new Sculpt(elbow);e.orb(PALETTE.steelLight,0,-.02,.045,.14,.12,.14,'metal');e.box(PALETTE.steel,0,-.15,.025,.25,.27,.26,0,0,0,'metal');e.orb(0x69452c,0,-.29,.03,.14,.14,.13);const hand=new THREE.Group();hand.position.set(0,-.30,.03);elbow.add(hand);arms.push({shoulder,elbow,hand});
 }
 const left=new Sculpt(arms[0].hand);left.mesh(shield(),PALETTE.gold,-.03,0,.13,.78,.87,.8,0,-.13,0,'metal');left.mesh(shield(),PALETTE.blue,-.03,.01,.24,.65,.73,.45,0,-.13);left.box(PALETTE.gold,-.03,.05,.31,.075,.41,.04);left.box(PALETTE.gold,-.03,.15,.31,.33,.07,.04);
 const sword=new THREE.Group();arms[1].hand.add(sword);const sw=new Sculpt(sword);sw.cyl(PALETTE.wood,0,.04,0,.065,.26,.065,12);sw.orb(PALETTE.gold,0,-.12,0,.085,.085,.085,'metal');sw.box(PALETTE.gold,0,.18,0,.40,.08,.13,0,0,-.07,'metal');sw.mesh(geo('blade',blade),PALETTE.steelLight,0,.22,-.025,1,1,1,0,0,0,'metal');sw.box(0xf4f8e9,0,.59,.035,.025,.69,.012,0,0,0,'metal');
 const head=new THREE.Group();head.position.set(0,1.63,.015);body.add(head);const h=new Sculpt(head);
 h.orb(PALETTE.skin,0,0,.025,.32,.35,.29);h.orb(0xf1bf8b,0,-.10,.20,.27,.20,.17);
 for(const side of [-1,1]){
  h.orb(PALETTE.skin,side*.31,-.025,.02,.075,.115,.065);h.orb(0xf9e5c9,side*.12,.055,.273,.079,.086,.04);h.orb(0x376170,side*.12,.045,.309,.038,.05,.021);h.orb(0x142e37,side*.12,.042,.325,.020,.03,.012);h.orb(0xffffff,side*.113,.064,.337,.012,.015,.008);
  h.box(0x593821,side*.12,.155,.29,.18,.063,.045,0,0,-side*.13);h.orb(0x6d4024,side*.089,-.13,.32,.112,.052,.055);h.orb(0x8b512c,side*.135,-.123,.305,.065,.047,.045);
 }
 h.orb(0xf0b982,0,-.025,.325,.09,.105,.105);h.box(0x70422d,0,-.205,.267,.11,.022,.025);h.box(0xffe6bf,0,-.192,.285,.065,.016,.012);
 const helmet=geo('helmet',()=>new THREE.SphereGeometry(1,24,14,0,Math.PI*2,0,Math.PI*.49));h.mesh(helmet,PALETTE.steel,0,.075,-.035,.38,.36,.35,0,0,0,'metal');h.mesh(geo('helmet-rim',()=>new THREE.TorusGeometry(1,.07,8,28)),PALETTE.gold,0,.086,-.035,.376,.346,.35,Math.PI/2,0,0,'metal');
 for(const side of [-1,1])h.box(PALETTE.steel,side*.327,-.06,-.005,.105,.29,.23,0,0,-side*.1,'metal');
 for(let i=0;i<6;i++)h.orb(i%2?PALETTE.blue:PALETTE.blueLight,0,.43-i*.025,-.055-i*.077,.105,.19-i*.014,.095);
 // A real cloth mesh, animated at its free edge.
 const capeGeometry=new THREE.PlaneGeometry(.74,.80,6,7),cape=new THREE.Mesh(capeGeometry,new THREE.MeshStandardMaterial({color:PALETTE.blue,roughness:.92,side:THREE.DoubleSide}));cape.position.set(0,1.04,-.29);cape.rotation.x=-.17;cape.castShadow=true;cape.receiveShadow=true;body.add(cape);
 // Bake the decorations within each joint, retaining the articulated hierarchy.
 const joints=[];root.traverse(o=>{if(o.isGroup)joints.push(o);});
 for(const joint of joints){const parts=joint.children.filter(o=>o.isMesh&&o!==cape);if(parts.length<2)continue;const temporary=new THREE.Group();for(const part of parts)temporary.add(part);joint.add(mergeStatic(temporary));}
 return {group:root,body,head,legs,arms,sword,cape,capeRest:capeGeometry.attributes.position.array.slice()};
}
export function animateGuardian(rig,time,mode='idle',reduced=false){
 const t=reduced?0:time,walk=mode==='walk'&&!reduced?1:0,phase=t*7.4,stride=Math.sin(phase),attack=mode==='attack'&&!reduced;
 const cycle=(t%1.65)/1.65,wind=attack?Math.sin(Math.min(1,cycle/.42)*Math.PI/2):0,hit=attack?Math.max(0,1-Math.abs(cycle-.54)/.18):0;
 rig.body.position.y=walk?Math.abs(Math.cos(phase))*.035:Math.sin(t*2.2)*.012;rig.body.rotation.y=walk?stride*.05:attack?-.16*wind+.26*hit:Math.sin(t*.8)*.025;
 rig.head.rotation.y=attack?.13:Math.sin(t*.65)*.09;rig.head.rotation.x=walk?-.035:0;
 rig.legs.forEach((leg,i)=>{const swing=Math.sin(phase+i*Math.PI);leg.thigh.rotation.x=swing*.56*walk;leg.knee.rotation.x=Math.max(0,-swing)*.88*walk;leg.foot.rotation.x=-leg.thigh.rotation.x-leg.knee.rotation.x*.6;});
 rig.arms.forEach((arm,i)=>{arm.shoulder.rotation.x=walk?-Math.sin(phase+i*Math.PI)*.48:-.11;arm.shoulder.rotation.z=i===0?.11:-.09;arm.elbow.rotation.x=-.18;arm.hand.rotation.x=0;});
 rig.sword.rotation.x=0;
 if(attack){
  // Anticipation, strike, follow-through and recovery; poses join continuously.
  const keys=[[0,-.12,-.18,-.30,0],[.34,-1.85,-.60,-.55,-.16],[.54,-1.37,.06,1.70,.10],[.67,-1.20,.04,1.90,.08],[1,-.12,-.18,-.30,0]];
  let i=0;while(i<keys.length-2&&cycle>keys[i+1][0])i++;
  const a=keys[i],b=keys[i+1],u=(cycle-a[0])/(b[0]-a[0]),ease=u*u*(3-2*u),pose=a.map((x,j)=>x+(b[j]-x)*ease);
  rig.arms[0].shoulder.rotation.x=-.11-Math.sin(cycle*Math.PI)*.34;rig.arms[1].shoulder.rotation.x=pose[1];rig.arms[1].elbow.rotation.x=pose[2];rig.sword.rotation.x=pose[3]-pose[1]-pose[2];rig.body.rotation.y=pose[4];
 }
 const p=rig.cape.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=rig.capeRest[i*3+1],free=(.4-y)/.8;p.setZ(i,Math.sin(t*4+i*.3)*.045*free-.09*free*walk);}p.needsUpdate=true;rig.cape.geometry.computeVertexNormals();
 return {impact:hit>.94,phase:cycle};
}
export function mergeStatic(root){
 root.updateMatrixWorld(true);const groups=new Map(),p=new THREE.Vector3(),n=new THREE.Vector3();
 root.traverse(o=>{if(!o.isMesh)return;const metal=o.material.metalness>.1,key=metal?'metal':'matte';if(!groups.has(key))groups.set(key,{p:[],n:[],c:[]});const data=groups.get(key),g=o.geometry,normal=new THREE.Matrix3().getNormalMatrix(o.matrixWorld),index=g.index;
  for(let i=0;i<(index?.count||g.attributes.position.count);i++){const k=index?index.getX(i):i;p.fromBufferAttribute(g.attributes.position,k).applyMatrix4(o.matrixWorld);n.fromBufferAttribute(g.attributes.normal,k).applyNormalMatrix(normal);const ao=.88+.12*Math.max(0,n.y);data.p.push(p.x,p.y,p.z);data.n.push(n.x,n.y,n.z);data.c.push(o.material.color.r*ao,o.material.color.g*ao,o.material.color.b*ao);}
 });
 const result=new THREE.Group();for(const [key,data] of groups){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(data.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(data.c,3));g.computeBoundingSphere();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:key==='metal'?.4:.86,metalness:key==='metal'?.4:0}));mesh.castShadow=mesh.receiveShadow=true;result.add(mesh);}return result;
}
export function createGarden(){
 const b=new Sculpt();let seed=892;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const [x,z,s] of [[-5,-3,1.1],[4.9,-3.7,.95],[-5.5,2.4,.8],[5.1,.1,.75]]){
   b.cyl(PALETTE.wood,x,.75*s,z,.22*s,1.5*s,.12*s,12);
   for(let i=0;i<9;i++){const a=i*2.4,r=i===8?0:.65*s;b.orb([0x57962c,0x7eaf31,0x95bd39,0x3b7d2e][i%4],x+Math.cos(a)*r,(1.5+(i%3)*.38)*s,z+Math.sin(a)*r,.77*s,.72*s,.73*s);}
 }
 for(let i=0;i<120;i++){const a=random()*Math.PI*2,r=5.4+random()*1.7,x=Math.cos(a)*r,z=Math.sin(a)*r*.8;if(z>3&&Math.abs(x)<3)continue;const size=.15+random()*.23;b.orb([0x598d2f,0x79aa38,0x91ba45][i%3],x,.10,z,size,.12,size);if(i%4===0){b.orb(i%8?0xeb8c87:0xf3cb55,x,.23,z,.065,.055,.065);}}
 for(let i=0;i<23;i++){const x=(random()-.5)*10,z=4+random()*1.2;b.orb([0x8d927b,0xb7b399,0xd2c7a4][i%3],x,.09,z,.13+random()*.1,.10,.13);}
 return b.group;
}
export function createDummy(){const b=new Sculpt();b.cyl(PALETTE.wood,0,.58,0,.085,1.16,.085,12);b.box(PALETTE.wood,0,.06,0,.70,.12,.62);b.cyl(0xb6894e,0,1.12,0,.33,.25,.33,20,Math.PI/2);for(const side of [-1,1])for(const [r,c] of [[.28,0xe5c894],[.20,0xb94c35],[.11,0xf1d9a1],[.045,0xb94c35]])b.cyl(c,0,1.12,side*(.14+(.28-r)*.05),r,.014,r,24,Math.PI/2);return b.group;}
