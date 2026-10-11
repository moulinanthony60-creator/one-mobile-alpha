import * as THREE from './three.module.js';

// Original ONE gloves: connected wrists, articulated fingers and an opposed
// thumb. The right hand pinches the selected chip; the left rests by the table.
export function casinoHands(scene){
 const group=new THREE.Group(),resources=[],hands=[];
 group.name='Mains du joueur';scene.add(group);
 const keep=o=>(resources.push(o),o);
 const material=color=>keep(new THREE.MeshStandardMaterial({color,roughness:.92,depthTest:false,depthWrite:false}));
 const glove=material('#a4a8b0'),sleeve=material('#252b39'),cuff=material('#353c4d');
 function mesh(parent,geometry,mat,x=0,y=0,z=0){
  const m=new THREE.Mesh(keep(geometry),mat);m.position.set(x,y,z);m.renderOrder=1000;parent.add(m);return m;
 }
 function bone(parent,a,b,r,mat=glove){
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);
  const m=mesh(parent,new THREE.CapsuleGeometry(r,delta.length(),4,10),mat);
  m.position.copy(from.add(to).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
 }
 const digitLengths=[.065,.075,.068,.052];
 for(const sign of [-1,1]){
  const g=new THREE.Group();group.add(g);
  const palm=mesh(g,new THREE.SphereGeometry(1,20,14),glove);palm.scale.set(.059,.029,.070);
  bone(g,[0,-.005,.062],[0,-.018,.255],.043,sleeve);
  bone(g,[0,0,.055],[0,-.002,.090],.041,cuff);
  const digits=[];
  for(let j=0;j<4;j++){
   const finger=new THREE.Group();finger.position.set(sign*(j-1.5)*.028,0,-.052+(j===3?.013:0));g.add(finger);
   const length=digitLengths[j],r=j===3?.011:.013;
   bone(finger,[0,0,0],[0,0,-length*.52],r);
   const tip=new THREE.Group();tip.position.z=-length*.52;finger.add(tip);
   bone(tip,[0,0,0],[0,0,-length*.48],r*.91);
   digits.push({finger,tip});
  }
  const thumb=new THREE.Group();thumb.position.set(-sign*.043,-.006,-.022);g.add(thumb);
  bone(thumb,[0,0,0],[-sign*.012,-.008,-.034],.019);
  const thumbTip=new THREE.Group();thumbTip.position.set(-sign*.012,-.008,-.034);thumb.add(thumbTip);
  bone(thumbTip,[0,0,0],[sign*.020,.021,-.039],.016);
  hands.push({g,digits,thumb,thumbTip});
 }
 const token=mesh(hands[1].g,new THREE.CylinderGeometry(.038,.038,.010,32),cuff,-.033,.019,-.111);
 token.rotation.set(Math.PI/2,-.12,0);
 const cv=document.createElement('canvas');cv.width=cv.height=192;
 const ctx=cv.getContext('2d'),map=keep(new THREE.CanvasTexture(cv));map.colorSpace=THREE.SRGBColorSpace;
 const faceMat=keep(new THREE.MeshBasicMaterial({map,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
 const face=mesh(token,new THREE.PlaneGeometry(.075,.075),faceMat,0,.0055,0);face.rotation.x=-Math.PI/2;face.renderOrder=1001;
 let selected=0,pressed=-1000,target=null,last=null,moving=0,gestures=0;
 const local=new THREE.Vector3();
 function drawChip(stake){
  ctx.clearRect(0,0,192,192);ctx.fillStyle=({10:'#306f9e',25:'#a63855',50:'#487f55',100:'#8152a4'})[stake]||'#306f9e';
  ctx.beginPath();ctx.arc(96,96,94,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1d7';ctx.lineWidth=10;ctx.setLineDash([12,12]);
  ctx.beginPath();ctx.arc(96,96,82,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff1d7';ctx.font='900 58px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(stake),96,100);map.needsUpdate=true;
 }
 return {
  press(t,point){pressed=t;target=point?new THREE.Vector3(point.x,point.y,point.z):null;gestures++;},
  tick(t,camera,position,visible,stake,holding){
   group.visible=visible;if(!visible){last=null;return;}
   group.position.copy(camera.position);group.quaternion.copy(camera.quaternion);
   if(stake!==selected){selected=stake;drawChip(stake);}
   moving=last?Math.min(1,Math.hypot(position.x-last.x,position.z-last.z)*25):0;last={...position};
   const k=Math.max(0,Math.min(1,(t-pressed)/380)),reach=Math.sin(k*Math.PI),spread=Math.min(.28,.23*camera.aspect);
   hands.forEach(({g,digits,thumb,thumbTip},i)=>{
    const sign=i?1:-1,grip=i&&holding;
    const portraitOffset=Math.max(0,1-camera.aspect)*.10;
    g.position.set(sign*spread,-.35-portraitOffset+(i?.025:0)+Math.sin(t/190+i*2)*.007*moving,-.67);
    g.rotation.set(.22,sign*-.14,sign*-.15);
    if(i&&target&&reach>0){local.copy(target);camera.worldToLocal(local);local.clampLength(.6,1.15);g.position.lerp(local,reach*.48);}
    digits.forEach(({finger,tip},j)=>{
     finger.rotation.x=grip?(j===0?-.15:-.75-j*.10):-.24-j*.05;
     tip.rotation.x=grip?(j===0?-.50:-1.10):-.65;
     if(i&&reach>0&&j===0){finger.rotation.x*=1-reach;tip.rotation.x*=1-reach;}
    });
    thumb.rotation.set(grip?0:-.15,sign*(grip?0:-.12),sign*(grip?0:.08));
    thumbTip.rotation.x=grip?0:-.50;
   });
   token.visible=holding;group.updateMatrixWorld(true);
  },
  inspect:()=>({visible:group.visible,holding:group.visible&&token.visible,selected,gestures}),
  dispose(){scene.remove(group);for(const r of resources)r.dispose();}
 };
}
