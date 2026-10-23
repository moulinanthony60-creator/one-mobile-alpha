// Build-time geometry only. The game consumes baked transparent sprites and
// does not import Three or construct these meshes on the phone.
import * as THREE from '../vendor/three.module.js';
import {battleTroopPose} from '../battle-troop-rig.mjs';
const sphere=new THREE.SphereGeometry(1,24,16),cylinder=new THREE.CylinderGeometry(1,1,1,20),cone=new THREE.ConeGeometry(1,1,24),helmet=new THREE.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI/2),torus=new THREE.TorusGeometry(1,.09,8,32);
const torso=new THREE.LatheGeometry([[.68,0],[.86,.08],[1,.26],[.94,.38],[.64,.44]].map(([x,y])=>new THREE.Vector2(x,y)),24);
const motionTrail=q=>Math.sin(q.phase*Math.PI*2)*q.motion*.025;
const Q=new THREE.Quaternion(),V=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
export function volumeTroop(kind,state){
 const q=battleTroopPose(kind,{dx:1,dz:0,distance:0,motion:0,attackAge:10,...state}),meshes=[];
 const knight=kind==='guardians',archer=kind==='archers',mage=kind==='mages';
 const cloth=knight?'#2254a1':archer?'#387340':'#61439b',clothLight=knight?'#467dd1':archer?'#79b84c':'#936cd0',skin='#f2b67c',gold='#ecb94b',metal='#a9bdcc',leather='#754529';
 const vector=v=>new THREE.Vector3(v.s,v.h,v.f),p=(s,h,f=0)=>({s,h,f});
 function mesh(geo,color,at,scale,rotation=new THREE.Quaternion(),shine=0){const matrix=new THREE.Matrix4().compose(vector(at),rotation,new THREE.Vector3(...scale));meshes.push({geo,color,matrix,shine});}
 function orb(color,s,h,f,sx,sy=sx,sz=sx,shine=0){mesh(sphere,color,p(s,h,f),[sx,sy,sz],undefined,shine);}
 function bone(color,a,b,r,r2=r,shine=0){V.subVectors(vector(b),vector(a));const length=V.length();Q.setFromUnitVectors(up,V.normalize());mesh(cylinder,color,p((a.s+b.s)/2,(a.h+b.h)/2,(a.f+b.f)/2),[r,length,r2],Q.clone(),shine);orb(color,a.s,a.h,a.f,r,r,r2,shine);orb(color,b.s,b.h,b.f,r,r,r2,shine);}
 function ring(color,s,h,f,r,thick=.025,rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2)){mesh(torus,color,p(s,h,f),[r,r,r*thick/.09],rotation,.6);}
 const body=q.body,bs=body.s,bf=body.f,lean=body.lean,bob=body.h;
 // Boots and knees remain solid, rounded volumes from every viewing angle.
 for(const leg of q.legs){const {hip,knee,foot}=leg.world;
  bone(knight?'#253d72':mage?'#583371':'#35472d',hip,knee,.105,.095);
  bone(leather,knee,p(foot.s,foot.h+.045,foot.f),.084,.085);
  orb(leather,foot.s,foot.h+.055,foot.f+.026,.105,.08,.145);
  orb('#493123',foot.s,foot.h+.022,foot.f+.029,.107,.028,.147);
  if(knight){orb(gold,knee.s,knee.h,knee.f+.055,.11,.095,.065,.6);orb(metal,knee.s,knee.h,knee.f+.088,.085,.072,.035,.6);bone(metal,p(knee.s,knee.h-.08,knee.f+.06),p(foot.s,foot.h+.10,foot.f+.08),.07,.035,.5);}
  else orb(clothLight,knee.s,knee.h,knee.f+.065,.09,.065,.035);
 }
 // Rounded jacket, wide belt, padded shoulders and a short split skirt.
 mesh(torso,cloth,p(bs,.39+bob,bf+lean*.5),[knight?.29:.23,1,.16]);
 // Cloth silhouettes distinguish the roles even when faces point away.
 if(mage){mesh(cone,cloth,p(bs,.34+bob,bf-.02),[.25,.45,.20]);orb(clothLight,bs,.57+bob,bf-.15,.205,.24,.08);}
 if(archer){mesh(cone,'#255a34',p(bs,.50+bob,bf-.16-motionTrail(q)),[.20,.43,.08]);}
 if(knight){orb('#173778',bs,.61+bob,bf-.15,.235,.20,.055);}
 if(!knight)orb(clothLight,bs,.65+bob,bf+lean*.55-.075,.20,.17,.09);
 orb(leather,bs,.425+bob,bf,.235,.05,.16);orb(gold,bs,.425+bob,bf+.16,.057,.042,.022,.7);
 if(knight){mesh(torso,metal,p(bs,.43+bob,bf+lean*.60+.035),[.278,.83,.16],undefined,.34);bone(gold,p(bs,.50+bob,bf+.184),p(bs,.735+bob,bf+lean+.15),.016,.012,.7);}
 else bone(leather,p(bs-.18,.74+bob,bf+lean+.13),p(bs+.16,.46+bob,bf+.14),.024,.014);
 for(let i=0;i<2;i++){const {shoulder,elbow,hand}=q.arms[i].world;
  bone(knight?skin:cloth,shoulder,elbow,knight?.112:.080,knight?.105:.075);orb(knight?gold:clothLight,shoulder.s,shoulder.h,shoulder.f,.13,.09,.12,.3);
  if(knight)orb(metal,shoulder.s,shoulder.h+.025,shoulder.f,.115,.08,.115,.7);
  bone(skin,elbow,hand,knight?.087:.057,knight?.080:.055,.10);
  orb(leather,(elbow.s+hand.s)/2,(elbow.h+hand.h)/2,(elbow.f+hand.f)/2,.077,.065,.067);
  orb(skin,hand.s,hand.h,hand.f,knight?.083:.066,knight?.078:.066,.07);
 }
 const hs=bs,hf=bf+lean,hh=.895+bob;
 // Faces are sculpted geometry, with eyes and nose sitting ahead of the hood.
 if(!knight){orb(cloth,hs,hh+.035,hf-.04,.222,.235,.21);}
 orb(skin,hs,hh,hf+.03,.184,.177,.161);orb(skin,hs,hh-.09,hf+.075,.145,.087,.115);
 for(const side of [-1,1]){
  orb(skin,hs+side*.176,hh-.02,hf+.015,.048,.072,.042);
  orb('#fff7de',hs+side*.067,hh+.025,hf+.176,.040,.027,.022);
  orb(archer?'#42673b':'#343c46',hs+side*.064,hh+.023,hf+.197,.015,.020,.012);
  orb('#ffffff',hs+side*.059,hh+.035,hf+.207,.005,.006,.004);
  bone(mage?'#f6e9cf':archer?'#8b421e':'#5c321d',p(hs+side*.025,hh+.078,hf+.183),p(hs+side*.111,hh+.067,hf+.172),.022,.018);
  orb(skin,hs+side*.086,hh-.052,hf+.151,.075,.058,.04);
 }
 orb(skin,hs,hh-.026,hf+.201,.038,.047,.033);
 bone('#944a33',p(hs-.04,hh-.103,hf+.161),p(hs+.04,hh-.103,hf+.161),.008,.008);
 if(knight){
  mesh(helmet,metal,p(hs,hh+.092,hf+.006),[.235,.209,.224],undefined,.8);ring(gold,hs,hh+.092,hf+.006,.219,.02);
  for(const side of [-1,1]){orb(metal,hs+side*.192,hh-.012,hf-.015,.048,.112,.095,.7);orb('#653c25',hs+side*.045,hh-.075,hf+.201,.064,.033,.028);}
  for(let i=0;i<5;i++)orb('#dc6547',hs,hh+.31-i*.009,hf-.10+i*.045,.055,.069,.056);
  orb(cloth,hs,.75+bob,hf,.205,.049,.157);orb(clothLight,hs+.055,.73+bob,hf+.15,.07,.10,.025);
 }else if(archer){
  for(let i=0;i<5;i++)orb('#b14b88',hs-.13+i*.052,hh+.145-Math.abs(i-2)*.012,hf+.10,.057,.066,.067);
  for(const side of [-1,1])for(let i=0;i<3;i++)orb('#913563',hs+side*(.16-i*.012),hh+.03-i*.067,hf+.045,.055,.060,.05);
  bone(leather,p(bs-.15,.48+bob,bf-.20),p(bs-.11,.77+bob,bf-.22),.085,.07);
  for(let i=0;i<3;i++)bone('#d4b06f',p(bs-.18+i*.045,.67+bob,bf-.22),p(bs-.18+i*.045,.95+bob,bf-.26),.009);
 }else{
  for(const side of [-1,1])orb('#f6eedb',hs+side*.054,hh-.070,hf+.195,.072,.04,.032);
  for(let j=0;j<4;j++)for(const side of [-1,1])orb(j%2?'#e5dcc7':'#f6eedb',hs+side*(.10-j*.024),hh-.12-j*.043,hf+.12+j*.007,.075-j*.009,.072,.052);
  ring(gold,hs,.75+bob,hf,.19,.012);orb('#5ed8e5',hs,.72+bob,hf+.157,.045,.048,.022,.9);
 }
 // Equipment follows the same release sockets as combat and its trajectories.
 const left=q.arms[0].world.hand,right=q.arms[1].world.hand;
 if(knight){
  orb(gold,left.s,left.h,left.f+.03,.165,.215,.040,.7);orb('#2458a5',left.s,left.h,left.f+.064,.143,.19,.022,.4);
  orb(gold,left.s,left.h,left.f+.09,.041,.041,.015,.8);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;bone(gold,p(left.s+Math.cos(a)*.05,left.h+Math.sin(a)*.05,left.f+.091),p(left.s+Math.cos(a)*.105,left.h+Math.sin(a)*.105,left.f+.089),.009);}
  const tip=p(right.s,right.h+.39*(1-q.hit)-q.hit*.12,right.f+.08+q.hit*.48);
  V.subVectors(vector(tip),vector(right));Q.setFromUnitVectors(up,V.clone().normalize());mesh(new THREE.CylinderGeometry(.018,.065,1,4),'#dce7ec',p((right.s+tip.s)/2,(right.h+tip.h)/2,(right.f+tip.f)/2),[1,V.length(),.55],Q.clone(),.85);bone(gold,p(right.s-.09,right.h+.03,right.f),p(right.s+.09,right.h+.03,right.f),.02,.018,.8);
 }else if(archer){
  const ends=[];for(let i=0;i<=12;i++){const a=-Math.PI/2+i*Math.PI/12,at=p(left.s,left.h+Math.sin(a)*.23,left.f+Math.cos(a)*.17);if(i)bone('#c99148',ends.at(-1),at,.016);ends.push(at);}
  const draw=q.aiming?right:left;bone('#f7e7c3',ends[0],draw,.004);bone('#f7e7c3',draw,ends.at(-1),.004);
  if(q.draw>0)bone('#ead19a',draw,p(left.s,left.h,left.f+.27),.006);
 }else{
  bone('#84512c',p(right.s,right.h-.33,right.f),p(right.s,right.h+.40,right.f),.018,.018);
  const geom=new THREE.OctahedronGeometry(1);mesh(geom,'#4fe5f0',p(right.s,right.h+.40,right.f),[.056,.10,.056],undefined,.9);
  ring(gold,right.s,right.h+.31,right.f,.044,.012);
 }
 return {meshes,pose:q};
}
