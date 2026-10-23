// Sculpted, build-time character meshes. Phones only load the baked WebP atlas.
import * as THREE from '../vendor/three.module.js';
import {battleTroopPose} from '../battle-troop-rig.mjs';
const sphere=new THREE.SphereGeometry(1,16,12),cylinder=new THREE.CylinderGeometry(1,1,1,12),up=new THREE.Vector3(0,1,0);
const p=(s,h,f=0)=>({s,h,f}),vector=v=>new THREE.Vector3(v.s,v.h,v.f);
// Elliptical cross sections give a continuous jaw, muscle, boot or garment;
// unlike a stack of balls, the silhouette narrows deliberately at each joint.
function loft(rings,segments=16,power=1,fold=0){
 const positions=[],indices=[];
 for(let j=0;j<rings.length;j++){const [h,rx,rz,f=0,s=0]=rings[j];
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),z=Math.sin(a),pleat=1+fold*Math.cos(a*8);positions.push(s+Math.sign(c)*Math.abs(c)**power*rx*pleat,h,f+Math.sign(z)*Math.abs(z)**power*rz*pleat);}
 }
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*segments+i,b=j*segments+(i+1)%segments,c=a+segments,d=b+segments;indices.push(a,c,b,b,c,d);}
 for(const j of [0,rings.length-1]){const [h,,,f=0,s=0]=rings[j],center=positions.length/3;positions.push(s,h,f);for(let i=0;i<segments;i++)indices.push(center,j*segments+i,j*segments+(i+1)%segments);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function plaque(points,depth=.02,bevel=.008){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:!!bevel,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:8});g.translate(0,0,-depth/2);return g;}
const palm=loft([[-1,.64,.45],[-.65,.95,.63],[.55,1,.65],[1,.72,.50]],12,.55);
const head=loft([[-.15,.075,.075,.045],[-.12,.119,.106,.032],[-.055,.148,.128,.007],[.035,.151,.132],[.11,.130,.117],[.15,.085,.082]],24,.72);
const breast=loft([[0,.17,.10],[.07,.205,.13],[.19,.254,.14],[.28,.237,.115],[.32,.13,.085]],16,.72);
const shoe=loft([[0,.084,.14,.032],[.025,.091,.145,.036],[.075,.085,.127,.027],[.12,.065,.077,-.018]],16,.65);
const shield=plaque([[-.135,.18],[0,.207],[.135,.18],[.128,-.065],[.075,-.155],[0,-.205],[-.075,-.155],[-.128,-.065]],.026,.014);
const shieldFace=plaque([[-.108,.157],[0,.178],[.108,.157],[.101,-.057],[.06,-.13],[0,-.17],[-.06,-.13],[-.101,-.057]],.014,.004);
const leaf=plaque([[0,.07],[-.044,.025],[-.035,-.032],[0,-.085],[.036,-.028],[.044,.025]],.008,.003);
const motionTrail=q=>Math.sin(q.phase*Math.PI*2)*q.motion*.025;
export function volumeTroop(kind,state){
 const q=battleTroopPose(kind,{dx:1,dz:0,distance:0,motion:0,attackAge:10,...state}),meshes=[];
 const knight=kind==='guardians',archer=kind==='archers';
 const cloth=knight?'#244e8b':archer?'#35664b':'#44376c',bright=knight?'#467ec0':archer?'#76a65a':'#8162a9',skin=archer?'#edb38b':'#dba479',skinLight=archer?'#f4c49f':'#e7b38b',gold='#c99b4c',metal='#758b9e',leather='#5a362b';
 function mesh(geo,color,at,scale=[1,1,1],rotation=new THREE.Quaternion(),shine=0){meshes.push({geo,color,matrix:new THREE.Matrix4().compose(vector(at),rotation,new THREE.Vector3(...scale)),shine});}
 function orb(color,s,h,f,sx,sy=sx,sz=sx,shine=0){mesh(sphere,color,p(s,h,f),[sx,sy,sz],undefined,shine);}
 function link(color,a,b,r1,r2=r1,depth=1,shine=0){const v=vector(b).sub(vector(a)),length=v.length(),rot=new THREE.Quaternion().setFromUnitVectors(up,v.normalize());mesh(loft([[-.5,r1*.84,r1*depth*.84],[-.36,r1,r1*depth],[.05,(r1+r2)*.55,(r1+r2)*.55*depth],[.40,r2,r2*depth],[.5,r2*.85,r2*.85*depth]],12,.85),color,p((a.s+b.s)/2,(a.h+b.h)/2,(a.f+b.f)/2),[1,length,1],rot,shine);}
 function line(color,a,b,r=.008,shine=0){const v=vector(b).sub(vector(a)),length=v.length(),rot=new THREE.Quaternion().setFromUnitVectors(up,v.normalize());mesh(cylinder,color,p((a.s+b.s)/2,(a.h+b.h)/2,(a.f+b.f)/2),[r,length,r],rot,shine);}
 const {s:bs,f:bf,lean,h:bob}=q.body,hf=bf+lean,hh=.938+bob;
 // Thin soles, a shaped toe box and tapered leggings replace the round feet.
 for(const leg of q.legs){const {hip,knee,foot}=leg.world,H={...hip,h:hip.h+.065},K={...knee,h:knee.h+.026};
  link(knight?'#24354e':archer?'#394b39':'#342941',H,K,knight?.093:.071,.062,.86);
  link(leather,K,p(foot.s,foot.h+.09,foot.f-.02),.071,.055,.86);
  mesh(shoe,'#29252a',p(foot.s,foot.h+.012,foot.f),[1,.30,1]);mesh(shoe,leather,p(foot.s,foot.h+.029,foot.f),[.96,.91,.98]);
  link('#83563a',p(foot.s,foot.h+.12,foot.f-.02),p(K.s,K.h-.025,K.f),.061,.075,.87);
  line('#ad8055',p(foot.s-.062,foot.h+.116,foot.f+.025),p(foot.s+.062,foot.h+.116,foot.f+.025),.009);
  if(knight){mesh(plaque([[-.068,.05],[.068,.05],[.073,-.013],[0,-.068],[-.073,-.013]],.02,.011),metal,p(K.s,K.h,K.f+.057),[1,1,1],undefined,.16);link(metal,p(K.s,K.h-.045,K.f+.06),p(foot.s,foot.h+.10,foot.f+.06),.044,.034,.45,.18);}
 }
 // Moving cloth is a single rippled surface with a scalloped hem, never spheres.
 function cape(color,top,width,length,offset){const vertices=[],indices=[],rows=8,cols=14;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,u=i/cols*2-1,spread=width*(.62+t*.38),wave=Math.cos(u*Math.PI*3)*(.012+t*.022);vertices.push(bs+u*spread,top-t*length+(j===rows?Math.cos(u*Math.PI*3)*.019:0),bf+offset-t*(.05+q.motion*.045)-wave+Math.sin(q.phase*Math.PI*2+t*3)*q.motion*t*.018);}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;indices.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,color,p(0,0));
 }
 if(knight)cape('#1e355c',.77+bob,.255,.47,-.125);
 if(archer)cape('#244c3e',.78+bob,.21,.40,-.12-motionTrail(q));
 if(!knight&&!archer){
  mesh(loft([[.105,.235,.155,-.035],[.15,.247,.16,-.02],[.30,.207,.143],[.48,.165,.12],[.64,.18,.13],[.77,.195,.11]],32,1,.075),cloth,p(bs,bob,bf));
  // Long embroidered front panels follow the silhouette of the robe.
  for(const sign of [-1,1]){const points=[];for(let j=0;j<6;j++){const h=.16+j*.095,at=p(bs+sign*(.065+(.66-h)*.17),h+bob,bf+.143+Math.sin(j)*.005);if(j)line(gold,points.at(-1),at,.007);points.push(at);}}
  mesh(plaque([[-.065,.10],[.065,.10],[.055,-.22],[0,-.26],[-.055,-.22]],.009,.002),'#65508e',p(bs,.44+bob,bf+.15));
 }else{
  mesh(loft([[0,.17,.11],[.08,.175,.125],[.24,knight?.25:.196,.135],[.32,knight?.24:.185,.11],[.36,.12,.085]],24,.85),cloth,p(bs,.415+bob,bf),[1,1,1]);
  // Split leather tabard, visible between legs and below the breastplate.
  for(const sign of [-1,1])mesh(plaque([[0,.075],[sign*.17,.067],[sign*.19,-.072],[sign*.035,-.108]],.015,.004),knight?'#365c8e':'#5a4832',p(bs+sign*.009,.408+bob,bf+.105));
 }
 link(skin,p(bs,.76+bob,hf),p(bs,.855+bob,hf),.067,.061);
 mesh(loft([[-.026,.177,.12],[.026,.177,.12]],20,.8),leather,p(bs,.452+bob,bf));
 mesh(plaque([[-.03,.027],[.03,.027],[.03,-.027],[-.03,-.027]],.015,.005),gold,p(bs,.452+bob,bf+.129),[1,1,1],undefined,.18);
 mesh(plaque([[-.016,.014],[.016,.014],[.016,-.014],[-.016,-.014]],.01,.001),leather,p(bs,.452+bob,bf+.143));
 if(knight){
  mesh(breast,metal,p(bs,.48+bob,bf+lean*.55+.018),[1,1,1],undefined,.18);
  line('#c6d4d8',p(bs,.54+bob,bf+.166),p(bs,.755+bob,hf+.132),.009,.14);
  for(const side of [-1,1]){line(gold,p(bs+side*.19,.61+bob,bf+.123),p(bs+side*.115,.758+bob,hf+.098),.012,.18);mesh(plaque([[0,.07],[.035,.025],[.024,-.035],[0,-.057],[-.024,-.035],[-.035,.025]],.008,.002),gold,p(bs+side*.072,.674+bob,bf+.164),[.8,.65,1]);}
 }else{
  link(leather,p(bs-.155,.756+bob,hf+.105),p(bs+.13,.46+bob,bf+.133),.022,.019,.50);
  for(let i=0;i<3;i++)mesh(plaque([[-.018,.012],[.018,.012],[.018,-.012],[-.018,-.012]],.008,.002),gold,p(bs-.065+i*.058,.66-i*.058+bob,bf+.151));
 }
 // Sculpted upper arms, cloth cuffs and articulated palms; no ball hands.
 for(let i=0;i<2;i++){const {shoulder,elbow,hand}=q.arms[i].world,side=i?1:-1,S={...shoulder,h:shoulder.h+.045};
  if(knight)link(skin,S,elbow,.105,.078,.85);
  link(skin,elbow,hand,knight?.075:.049,knight?.051:.036,.84);
  const middle=p(elbow.s*.35+hand.s*.65,elbow.h*.35+hand.h*.65,elbow.f*.35+hand.f*.65);
  link(leather,middle,p(hand.s,hand.h+.008,hand.f),knight?.064:.047,knight?.052:.038,.8);
  line('#b58651',p(middle.s-.04,middle.h+.005,middle.f+.044),p(middle.s+.04,middle.h+.005,middle.f+.044),.007);
  mesh(palm,skinLight,hand,[knight?.059:.043,knight?.072:.057,knight?.066:.052]);
  orb(skin,hand.s-side*.040,hand.h+.018,hand.f+.016,.023,.035,.025);
  for(let finger=0;finger<3;finger++)line('#aa7050',p(hand.s-.031+finger*.024,hand.h-.035,hand.f+.044),p(hand.s-.030+finger*.024,hand.h-.005,hand.f+.044),.003);
  if(knight){
   const pauldron=loft([[-.07,.08,.084],[-.025,.134,.123],[.04,.125,.113],[.075,.07,.065]],16,.60);
   mesh(pauldron,'#977a48',p(S.s+side*.018,S.h+.012,S.f),[1,1,1],undefined,.13);mesh(pauldron,metal,p(S.s+side*.018,S.h+.032,S.f+.020),[.98,.86,1.02],undefined,.23);
   line('#d1d9d8',p(S.s+side*.095,S.h-.013,S.f-.06),p(S.s+side*.095,S.h+.027,S.f+.06),.006);
  }else if(archer){const cuff=p(S.s*.55+elbow.s*.45,S.h*.55+elbow.h*.45,S.f*.55+elbow.f*.45);link(bright,S,cuff,.085,.075,.8);link(cloth,cuff,elbow,.075,.057,.8);}
  else {link('#5b467f',S,elbow,.105,.09,.9);}
 }
 // A shaped jaw, restrained eyes and brow planes give each class an expression.
 const faceWidth=archer?.90:1;
 mesh(head,skin,p(bs,hh,hf+.015),[faceWidth,1,1]);
 for(const side of [-1,1]){
  orb(skin,bs+side*.146*faceWidth,hh-.018,hf+.004,.028,.045,.024);
  const ex=bs+side*.057*faceWidth;
  mesh(plaque([[-.034,.008],[-.017,.018],[.028,.011],[.035,-.007],[0,-.014],[-.028,-.009]],.006,.002),'#814d3d',p(ex,hh+.025,hf+.137),[1,1,1]);
  mesh(plaque([[-.027,.006],[.02,.008],[.027,-.005],[-.005,-.009]],.006,.001),'#eee6cc',p(ex,hh+.026,hf+.144));
  orb(archer?'#415c42':'#37414b',ex-side*.004,hh+.025,hf+.153,.009,.011,.005);orb('#fff4d7',ex-side*.007,hh+.030,hf+.158,.003,.003,.003);
  const brow=archer?'#552c3c':knight?'#5c3626':'#d0ccc0';
  line(brow,p(bs+side*.025,hh+.063,hf+.144),p(bs+side*.107,hh+.073,hf+.111),archer?.012:.018);
  // Planar cheekbone, small nose bridge and tapered chin avoid the bulb face.
  mesh(plaque([[-.035,.017],[.032,.012],[.023,-.018],[-.021,-.026]],.009,.007),skinLight,p(bs+side*.09*faceWidth,hh-.035,hf+.12),[.85,.65,1]);
 }
 mesh(loft([[-.047,.018,.022,.004],[-.029,.027,.032,.014],[.012,.018,.021],[.045,.012,.013,-.007]],12,.70),skinLight,p(bs,hh-.007,hf+.144),[archer?.80:1,1,1]);
 line('#904d3d',p(bs-.033,hh-.084,hf+.135),p(bs+.031,hh-.083,hf+.135),.006);
 if(knight){
  // Open steel helmet with angular brow and cheek guards, swept cloth crest.
  mesh(loft([[0,.168,.15],[.06,.173,.158],[.14,.14,.13],[.185,.065,.073],[.19,.01,.015]],24,.78),metal,p(bs,hh+.072,hf-.014),[1,1,1],undefined,.24);
  mesh(plaque([[-.164,0],[-.106,.024],[0,.006],[.106,.024],[.164,0],[.14,-.026],[.06,-.014],[0,-.023],[-.06,-.014],[-.14,-.026]],.014,.004),gold,p(bs,hh+.08,hf+.135),[1,1,1],undefined,.18);
  for(const side of [-1,1]){
   mesh(plaque([[-.029,.08],[.029,.08],[.038,-.065],[0,-.099],[-.025,-.06]],.03,.006),metal,p(bs+side*.157,hh-.008,hf+.005),[1,1,1],undefined,.18);
   mesh(plaque([[0,.01],[side*.067,.025],[side*.065,-.004],[side*.029,-.015],[0,-.007]],.018,.005),'#75402a',p(bs,hh-.064,hf+.157));
  }
  // A blade-shaped crest replaces the row of round beads.
  mesh(plaque([[-.11,.012],[-.13,.055],[-.075,.10],[.025,.10],[.095,.065],[.115,0]],.035,.006),'#bd4d38',p(bs,hh+.258,hf-.012),[1,1,1],new THREE.Quaternion().setFromAxisAngle(up,Math.PI/2));
  link('#203f6a',p(bs-.105,.804+bob,hf+.055),p(bs+.105,.804+bob,hf+.055),.046,.046,.65);
 }else if(archer){
  // Hair is overlapping tapered locks, with an asymmetric sweeping fringe.
  mesh(loft([[-.14,.15,.11,-.04],[-.02,.174,.141,-.025],[.12,.15,.13,-.025],[.19,.07,.075,-.035]],24,.85),'#6c2e4c',p(bs,hh,hf-.025));
  // The face is in front of the hair shell. Individual locks frame it.
  const locks=[[-.105,.09,-.04,.00],[-.06,.145,.045,.055],[.01,.155,.09,.064],[.085,.12,.135,-.06]];
  for(const [s,h,toS,toH]of locks)mesh(plaque([[s-.037,h],[s+.035,h+.008],[toS+.020,toH],[toS,toH-.038],[toS-.025,toH+.01]],.022,.009),'#a13d68',p(bs,hh,hf+.112));
  for(const side of [-1,1])mesh(plaque([[-.034,.085],[.032,.09],[.035,-.10],[0,-.17],[-.026,-.105]],.05,.012),'#8b3459',p(bs+side*.153,hh-.03,hf+.035));
  // Hood rests behind the hair and face, leaving a clear archer silhouette.
  cape('#396b48',1.04+bob,.18,.28,-.095);
  mesh(loft([[0,.165,.11],[.12,.16,.12],[.20,.125,.10],[.235,.025,.04]],20,.9),cloth,p(bs,hh+.045,hf-.065),[1,1,1]);
  link(leather,p(bs-.17,.48+bob,bf-.17),p(bs-.145,.78+bob,bf-.20),.064,.074,.83);
  for(let i=0;i<3;i++){const s=bs-.19+i*.044;line('#c2a26b',p(s,.66+bob,bf-.21),p(s,.96+bob,bf-.255),.006);mesh(leaf,'#c9ceba',p(s,.918+bob,bf-.255),[.35,.40,1]);}
 }else{
  // A deep open hood is built around the face, not as an egg behind it.
  mesh(loft([[0,.19,.165],[.13,.185,.16,-.015],[.25,.12,.115,-.025],[.30,.025,.03,-.06]],24,.75),cloth,p(bs,hh-.005,hf-.063),[1,1,1]);
  for(const side of [-1,1])mesh(plaque([[0,.15],[side*.09,.112],[side*.075,-.11],[side*.013,-.142],[side*.025,.06]],.045,.009),'#70528f',p(bs+side*.115,hh,hf+.015));
  // Layered, pointed beard planes with fine strands.
  mesh(plaque([[-.123,.043],[-.07,.06],[0,.018],[.07,.06],[.123,.043],[.09,-.06],[.018,-.18],[-.043,-.136],[-.09,-.075]],.04,.012),'#c8c9bb',p(bs,hh-.105,hf+.124));
  for(let i=-2;i<=2;i++){const s=i*.029;mesh(plaque([[-.021,.025],[.025,.03],[.012,-.086],[0,-.12],[-.013,-.07]],.016,.003),i%2?'#e6dfcb':'#dad8c4',p(bs+s,hh-.118+Math.abs(i)*.014,hf+.15),[1,1-Math.abs(i)*.17,1]);}
  for(const side of [-1,1])mesh(plaque([[0,.012],[side*.066,.025],[side*.076,-.002],[side*.036,-.014]],.022,.005),'#eee6d0',p(bs,hh-.068,hf+.161));
  mesh(plaque([[-.025,.029],[.025,.029],[.035,0],[0,-.042],[-.035,0]],.018,.005),gold,p(bs,.757+bob,hf+.13));orb('#65bbc3',bs,.76+bob,hf+.153,.018,.026,.009,.12);
 }
 // Equipment retains the exact release sockets used by simulated projectiles.
 const left=q.arms[0].world.hand,right=q.arms[1].world.hand;
 if(knight){
  mesh(shield,gold,p(left.s,left.h,left.f+.037),[1,1,1],undefined,.16);mesh(shieldFace,'#254e7f',p(left.s,left.h,left.f+.062));
  mesh(plaque([[0,.115],[.036,.061],[.024,.015],[.052,-.015],[.025,-.041],[0,-.100],[-.025,-.041],[-.052,-.015],[-.024,.015],[-.036,.061]],.012,.003),'#dfbc69',p(left.s,left.h,left.f+.08),[.9,.9,1]);
  line('#5185b2',p(left.s-.08,left.h+.13,left.f+.08),p(left.s-.075,left.h-.05,left.f+.08),.005);
  const tip=p(right.s,right.h+.39*(1-q.hit)-q.hit*.12,right.f+.08+q.hit*.48),v=vector(tip).sub(vector(right)),rot=new THREE.Quaternion().setFromUnitVectors(up,v.clone().normalize());
  const blade=plaque([[-.033,.035],[-.039,.29],[0,.39],[.039,.29],[.033,.035]],.014,.003);mesh(blade,'#c1d0d3',right,[1,v.length()/.39,1],rot,.30);
  line(gold,p(right.s-.088,right.h+.025,right.f),p(right.s+.088,right.h+.025,right.f),.015,.18);link(leather,p(right.s,right.h-.07,right.f),p(right.s,right.h+.015,right.f),.023,.025,.8);orb(gold,right.s,right.h-.075,right.f,.027,.02,.024,.15);
 }else if(archer){
  const ends=[];for(let i=0;i<=16;i++){const a=-Math.PI/2+i*Math.PI/16,at=p(left.s,left.h+Math.sin(a)*.25,left.f+Math.cos(a)*.19);if(i)line(i<3||i>13?'#c0a16b':'#8a582e',ends.at(-1),at,i===8||i===9?.019:.012);ends.push(at);}
  const draw=q.aiming?right:left;line('#ece1bf',ends[0],draw,.003);line('#ece1bf',draw,ends.at(-1),.003);
  if(q.draw>0){line('#cfb88a',draw,p(left.s,left.h,left.f+.27),.005);mesh(leaf,'#bfc5bc',p(left.s,left.h,left.f+.27),[.30,.35,.4],new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2));}
 }else{
  link('#6b472e',p(right.s,right.h-.33,right.f),p(right.s,right.h+.31,right.f),.019,.025,.90);line(gold,p(right.s-.004,right.h+.12,right.f+.019),p(right.s-.004,right.h+.29,right.f+.019),.004);
  for(const side of [-1,1])link(gold,p(right.s,right.h+.27,right.f),p(right.s+side*.052,right.h+.42,right.f),.015,.009,.8,.13);
  mesh(new THREE.OctahedronGeometry(1),'#69d6db',p(right.s,right.h+.40,right.f),[.052,.09,.052],undefined,.14);
 }
 return {meshes,pose:q};
}
