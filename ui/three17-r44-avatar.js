import * as THREE from './three.module.js';
import {createPoseTrack} from './three17-r44-render.js';

export function createAvatar(scene,name,color){
 const group=new THREE.Group(),rig=new THREE.Group();group.add(rig);
 const jacket=new THREE.MeshStandardMaterial({color,roughness:.91}),dark=new THREE.MeshStandardMaterial({color:0x20252b,roughness:.88});
 const skin=new THREE.MeshStandardMaterial({color:0xbc9580,roughness:.87}),hair=new THREE.MeshStandardMaterial({color:0x231e1c,roughness:1});
 const mesh=(geo,mat,x,y,z,parent=rig)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
 const torso=mesh(new THREE.CapsuleGeometry(.22,.34,4,10),jacket,0,1.12,0);torso.scale.set(1.16,1,.68);
 mesh(new THREE.BoxGeometry(.03,.5,.015),dark,0,1.14,-.155);
 mesh(new THREE.CapsuleGeometry(.105,.06,3,8),skin,0,1.51,0);
 const head=mesh(new THREE.SphereGeometry(.18,12,10),skin,0,1.71,-.008);head.scale.set(.88,1.12,.93);head.visible=false;
 const cap=mesh(new THREE.SphereGeometry(.184,12,8,0,Math.PI*2,0,Math.PI*.52),hair,0,1.735,.012);cap.scale.set(.91,1.1,1);cap.visible=false;
 const cameraHead=new THREE.Group();cameraHead.position.set(0,1.72,-.01);rig.add(cameraHead);
 // Tête caméra ronde : le flux est affiché sur une face circulaire, sans rectangle.
 const cameraBody=new THREE.Mesh(new THREE.SphereGeometry(.216,28,20),dark);cameraBody.scale.set(.98,1.04,.92);cameraBody.position.z=.01;cameraHead.add(cameraBody);
 const cameraScreen=new THREE.Mesh(new THREE.CircleGeometry(.184,36),new THREE.MeshBasicMaterial({color:0x11151d,transparent:true,opacity:.98,side:THREE.DoubleSide,depthTest:false}));cameraScreen.position.set(0,.008,-.195);cameraScreen.renderOrder=8;cameraHead.add(cameraScreen);
 const cameraRing=new THREE.Mesh(new THREE.RingGeometry(.185,.211,36),new THREE.MeshStandardMaterial({color:0x080b11,roughness:.28,metalness:.52,side:THREE.DoubleSide}));cameraRing.position.set(0,.008,-.197);cameraRing.renderOrder=7;cameraHead.add(cameraRing);
 const cameraLens=new THREE.Mesh(new THREE.CircleGeometry(.033,22),new THREE.MeshBasicMaterial({color:0x05070a,transparent:true,opacity:.72,side:THREE.DoubleSide}));cameraLens.position.set(.105,.103,-.2);cameraLens.renderOrder=9;cameraHead.add(cameraLens);
 const face=mesh(new THREE.BoxGeometry(.05,.065,.04),skin,0,1.70,-.162);face.visible=false;
 const legs=[],arms=[];
 for(const sign of [-1,1]){
  const leg=new THREE.Group();leg.position.set(sign*.125,.82,0);rig.add(leg);legs.push(leg);
  mesh(new THREE.CapsuleGeometry(.092,.52,3,8),dark,0,-.32,0,leg);
  mesh(new THREE.BoxGeometry(.18,.14,.29),dark,0,-.73,-.055,leg);
  const arm=new THREE.Group();arm.position.set(sign*.285,1.35,0);rig.add(arm);arms.push(arm);
  mesh(new THREE.CapsuleGeometry(.074,.39,3,8),jacket,sign*.02,-.24,0,arm);
  mesh(new THREE.SphereGeometry(.071,8,6),skin,sign*.02,-.51,0,arm);
 }
 const torch=mesh(new THREE.CylinderGeometry(.035,.045,.16,8),dark,.02,-.49,-.075,arms[1]);torch.rotation.x=Math.PI/2;
 const glow=mesh(new THREE.SphereGeometry(.032,8,6),new THREE.MeshBasicMaterial({color:0xffdb94}),.02,-.49,-.16,arms[1]);
 const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#11131dd9';ctx.beginPath();ctx.roundRect(4,4,504,88,22);ctx.fill();ctx.fillStyle='#f4f0e9';ctx.font='600 32px system-ui';ctx.textAlign='center';ctx.fillText(String(name).slice(0,22),256,60);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));label.scale.set(1.5,.28,1);label.position.y=2.2;group.add(label);
 scene.add(group);return {group,rig,legs,arms,glow,head,cap,face,cameraHead,cameraBody,cameraScreen,cameraRing,cameraLens,track:createPoseTrack(),phase:0,last:null,swing:0,videoTexture:null,videoElement:null};
}
export function animateAvatar(v,p,elapsed){
 const dt=Math.min(.1,Math.max(.001,elapsed));const distance=v.last?Math.hypot(p.x-v.last.x,p.z-v.last.z):0;
 const dead=!!p.dead;
 if(dead){
  v.group.position.set(p.x,p.y||0,p.z);v.group.rotation.y=p.yaw||0;v.cameraHead.rotation.x=Number.isFinite(p.pitch)?p.pitch:0;
  v.rig.position.y=.08;v.rig.rotation.z=-Math.PI/2;
  v.legs[0].rotation.x=v.legs[1].rotation.x=0;v.arms[0].rotation.x=v.arms[1].rotation.x=0;
  v.swing=0;v.last={x:p.x,z:p.z};return;
 }
 const speed=distance>3?0:Math.min(3,distance/dt);v.phase+=distance<3?distance*6:0;
 v.swing+=(Math.min(1,speed/1.8)-v.swing)*(1-Math.exp(-dt*14));
 v.group.position.set(p.x,p.y||0,p.z);v.group.rotation.y=p.yaw;v.cameraHead.rotation.x=Number.isFinite(p.pitch)?p.pitch:0;
 const stride=Math.sin(v.phase)*v.swing;v.legs[0].rotation.x=stride*.40;v.legs[1].rotation.x=-stride*.40;
 v.arms[0].rotation.x=-stride*.24;v.arms[1].rotation.x=stride*.18-.14;
 v.rig.position.y=Math.abs(Math.sin(v.phase))*v.swing*.022;v.rig.rotation.z=stride*.016;
 if(!v.last)v.last={x:p.x,z:p.z};else{v.last.x=p.x;v.last.z=p.z;}
}



