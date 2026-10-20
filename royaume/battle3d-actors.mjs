import * as THREE from './vendor/three.module.js';
import {roundedBoxGeometry,shieldGeometry} from './battle3d-models.mjs?v=2';

export function actorGeometries(){return {
  box:new THREE.BoxGeometry(1,1,1),round:roundedBoxGeometry(),shield:shieldGeometry(),
  cylinder:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,12),
  sphere:new THREE.SphereGeometry(1,12,8),rock:new THREE.IcosahedronGeometry(1,1),
  helmet:new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI*.48),
  torus:new THREE.TorusGeometry(1,.15,6,16),
  bow:new THREE.TorusGeometry(1,.055,5,14,Math.PI)
};}
const up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3(),quaternion=new THREE.Quaternion(),rotation=new THREE.Euler();

// Jointed silhouettes with modeled faces, equipment and clothing. All parts are
// emitted into shared instance batches, rather than separate meshes per soldier.
export function drawTroop(kind,time,walk,attack,put){
  const mage=kind==='mages',archer=kind==='archers',guardian=!mage&&!archer;
  const cloth=mage?'#7954b2':archer?'#42804a':'#2769be',light=mage?'#ae88db':archer?'#79a459':'#5b9cdd';
  const skin='#efbc8e',gold='#e8b75b',leather='#714b2d',steel='#a9bfcc';
  function orb(c,x,y,z,sx,sy=sx,sz=sx){put('sphere',c,x,y,z,sx,sy,sz);}
  function box(c,x,y,z,xs,ys,zs,rx=0,ry=0,rz=0){put('round',c,x,y,z,xs,ys,zs,rx,ry,rz);}
  function bone(c,a,b,r){
    direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const length=direction.length();
    quaternion.setFromUnitVectors(up,direction.normalize());rotation.setFromQuaternion(quaternion);
    put('cylinder',c,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,length,r,rotation.x,rotation.y,rotation.z);
  }
  const stride=walk*.48;
  for(const side of [-1,1]){
    const x=side*.135,swing=stride*side,hip=[x,.57,0],knee=[x,.32,swing*.12],foot=[x,.1,swing*.27];
    bone(mage?'#574065':leather,hip,knee,.095);orb(leather,...knee,.09);bone(guardian?steel:leather,knee,foot,.075);
    box('#4a3729',x,.095,foot[2]+.045,.2,.14,.3);box('#b18452',x,.22,foot[2],.19,.12,.17);
    if(guardian){box(gold,x,.33,knee[2]+.07,.13,.08,.04);box('#cad7dd',x,.25,foot[2]+.08,.11,.18,.03);}
  }
  // Cloak and tunic have rounded volume, a fitted belt and a readable emblem.
  put('cone',cloth,0,.57,-.07,.33,.48,.24,0,0,mage?0:Math.PI);
  box(cloth,0,.8,0,.47,.43,.3);orb(light,0,.87,-.14,.28,.29,.1);
  box(leather,0,.59,.025,.49,.1,.35);box(gold,0,.59,.21,.12,.1,.035);box('#55422b',0,.59,.235,.065,.05,.015);
  if(guardian){
    orb(steel,0,.86,.12,.235,.24,.14);box(gold,0,.88,.255,.055,.29,.025);
    for(const sign of [-1,1]){box('#d1dce0',sign*.115,.89,.235,.09,.26,.025,0,0,-sign*.1);orb(gold,sign*.27,.98,0,.15,.105,.17);orb(steel,sign*.28,1.015,.005,.13,.085,.15);}
    box('#347fd1',0,.99,.11,.42,.12,.2);box('#eac66b',.13,.99,.23,.07,.07,.03);
    put('shield',gold,0,.81,.27,.2,.23,.3);put('shield','#2869b6',0,.82,.3,.15,.17,.2);
  } else {
    bone(leather,[-.2,1,.16],[.19,.64,.19],.035);box(gold,0,.8,.22,.085,.075,.035);
    for(const sign of [-1,1])orb(light,sign*.25,.96,0,.13,.1,.17);
  }
  // Both arms bend at the elbow and move with the gait or the attack.
  const hands=[];
  for(const side of [-1,1]){
    const swing=side*stride*.8+(side===1?attack:attack*.3),shoulder=[side*.29,.96,0];
    const elbow=[side*.32,.96-.24*Math.cos(swing),.24*Math.sin(swing)];
    const bend=swing-.2,hand=[side*.34,elbow[1]-.23*Math.cos(bend),elbow[2]+.23*Math.sin(bend)];
    bone(cloth,shoulder,elbow,.09);orb(guardian?steel:skin,...elbow,.085);bone(guardian?steel:leather,elbow,hand,.075);orb(leather,...hand,.085,.09,.075);hands.push(hand);
    if(guardian)orb('#d7e0de',side*.32,elbow[1],elbow[2]+.07,.055,.07,.025);
  }
  orb(skin,0,1.1,0,.11,.12,.11);
  if(archer){orb('#3c753e',0,1.29,-.095,.28,.33,.24);orb('#8d4520',0,1.25,-.025,.24,.25,.23);}
  orb(skin,0,1.27,.025,.215,.245,.215);
  for(const side of [-1,1]){
    orb(skin,side*.214,1.27,.015,.055,.085,.045);
    orb('#fff9eb',side*.079,1.3,.218,.057,.065,.025);orb(archer?'#447044':'#3d464d',side*.075,1.295,.24,.024,.035,.015);
    orb('#ffffff',side*.075-.008,1.309,.251,.009,.011,.006);
    box(mage?'#e6dfc8':'#69442b',side*.078,1.374,.217,.107,.033,.029,0,0,-side*.12);
  }
  orb(skin,0,1.24,.251,.055,.064,.06);box('#8e5139',0,1.16,.218,.10,.018,.02);
  if(guardian){
    put('helmet','#a7bdcb',0,1.31,.015,.26,.27,.25);
    put('torus',gold,0,1.33,.015,.257,.257,.257,Math.PI/2);
    for(const s of [-1,1])box(steel,s*.225,1.23,-.005,.07,.21,.17,0,0,s*.1);
    for(let i=0;i<5;i++)orb(i%2?'#2b6dc3':'#4386d3',0,1.63-i*.025,-.03-i*.075,.09,.16-i*.014,.075);
    for(const s of [-1,1])orb('#6d482c',s*.065,1.185,.242,.08,.038,.025);
    const h=hands[0];put('shield',gold,h[0]-.06,h[1]+.05,h[2]+.12,.48,.61,.8,0,-.25,.1);put('shield','#2866b8',h[0]-.075,h[1]+.075,h[2]+.17,.38,.48,.55,0,-.25,.1);
    box(gold,h[0]-.075,h[1]+.1,h[2]+.22,.055,.25,.03);box(gold,h[0]-.075,h[1]+.14,h[2]+.22,.2,.055,.03);
    const hand=hands[1],swing=attack*.8;
    const weapon=(dy)=>[hand[0],hand[1]+Math.cos(swing)*dy,hand[2]-Math.sin(swing)*dy+.03];
    box(gold,...weapon(.1),.25,.055,.09,swing);put('round','#dbe9e9',...weapon(.4),.075,.53,.045,swing);
    put('cone','#e8f4ed',...weapon(.74),.055,.17,.035,swing);orb(gold,...weapon(-.08),.06);
  }else if(archer){
    for(let i=0;i<5;i++)orb('#ba6429',-.16+i*.075,1.455-Math.abs(i-2)*.018,.12,.085,.07,.09);
    put('cone','#60914b',0,1.53,-.07,.24,.24,.24,-.3);
    put('cylinder',leather,-.14,.84,-.25,.11,.48,.11,-.18,0,-.3);
    for(let i=0;i<3;i++){bone('#d9ba79',[-.16+i*.065,.86,-.28],[-.19+i*.065,1.28,-.34],.013);box('#ab4c31',-.19+i*.065,1.23,-.34,.045,.1,.025);}
    const h=hands[1];put('bow',gold,h[0]+.07,h[1]+.06,h[2]+.11,.27,.4,.27,0,0,-Math.PI/2);
    bone('#f4deb1',[h[0]+.07,h[1]-.34,h[2]+.11],[h[0]+.07,h[1]+.46,h[2]+.11],.008);
    bone('#b4915e',[h[0]+.07,h[1]+.06,h[2]-.22],[h[0]+.07,h[1]+.06,h[2]+.43],.013);
  }else{
    for(let i=0;i<8;i++){const a=i*Math.PI/4;orb(i%2?'#e7e3d4':'#f4eddb',Math.cos(a)*.19,1.43+(i%3)*.025,Math.sin(a)*.13-.06,.12,.13,.115);}
    for(const s of [-1,1]){put('torus',gold,s*.1,1.36,.215,.087,.087,.087);orb('#699caa',s*.1,1.36,.225,.066,.066,.022);orb('#b9e4dd',s*.1-.018,1.38,.245,.021,.024,.005);orb('#efe9d7',s*.06,1.18,.25,.08,.04,.03);}
    box(leather,0,1.4,.035,.47,.065,.37);box(gold,0,1.36,.24,.055,.025,.02);
    const h=hands[1];bone('#906431',[h[0]+.05,.09,h[2]],[h[0]+.05,1.58,h[2]],.028);
    put('torus',gold,h[0]+.05,1.57,h[2],.15,.15,.15,0,0,time*.5);
    put('rock','#ba91ed',h[0]+.05,1.58,h[2],.11,.19,.11,0,time);
    orb('#b8edf0',h[0]+.05,1.61,h[2]+.04,.055);
    const l=hands[0];box('#493764',l[0],l[1]+.01,l[2]+.06,.23,.26,.13,0,0,.1);box(gold,l[0],l[1]+.01,l[2]+.135,.14,.19,.015);
    orb('#c27cf3',.23,.62,.16,.07,.09,.06);put('cylinder',gold,.23,.73,.16,.035,.06,.035);
  }
}
