import * as THREE from './three.module.js';
import {cartoonHandGeometry} from './one-casino-r216-hand-model.js';
import {cartoonHandGeometry as pistolGripGeometry} from './one-lobby-r218-grip-model.js';

// One continuous, rounded cartoon volume per hand. No separate finger
// balls or joint pieces. The two silhouettes are mirrored at the wrist.
export function casinoHands(){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),group=new THREE.Group(),resources=[];
 scene.add(group);
 scene.add(new THREE.HemisphereLight('#ffffff','#8390a6',2.0));
 const light=new THREE.DirectionalLight('#ffffff',2.1);light.position.set(-1,2,3);scene.add(light);
 const fill=new THREE.DirectionalLight('#b9d1ff',.6);fill.position.set(2,0,1);scene.add(fill);
 const keep=o=>(resources.push(o),o);
 const material=keep(new THREE.MeshStandardMaterial({color:'#e8ebef',roughness:.86,metalness:0}));
 const geometry=keep(cartoonHandGeometry());
 const hands=[-1,1].map(sign=>{
  const rig=new THREE.Group(),form=new THREE.Group();form.scale.x=sign===-1?1:-1;
  const mesh=new THREE.Mesh(geometry,material);form.add(mesh);rig.add(form);group.add(rig);return {rig,form};
 });
 const closedGeometry=keep(geometry.clone()),vertices=closedGeometry.attributes.position;
 for(let i=0;i<vertices.count;i++){let x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);if(y>-.025){const a=Math.min(Math.PI*.97,(y+.025)/.042);y=-.025+Math.sin(a)*.042+z*Math.sin(a);z=-.042*(1-Math.cos(a))+z*Math.cos(a);}if(x>.047)x=.047+(x-.047)*.55;vertices.setXYZ(i,x,y,z);}
 closedGeometry.computeVertexNormals();closedGeometry.computeBoundingSphere();
 let weapon='none';const grips=[];
 const tokenMaterial=keep(new THREE.MeshStandardMaterial({color:'#e5d4ae',roughness:.6}));
 const token=new THREE.Mesh(keep(new THREE.CylinderGeometry(.029,.029,.007,40)),tokenMaterial);
 token.rotation.x=Math.PI/2;token.position.set(-.062,.052,.035);hands[1].rig.add(token);
 const cv=document.createElement('canvas');cv.width=cv.height=192;const ctx=cv.getContext('2d'),map=keep(new THREE.CanvasTexture(cv));map.colorSpace=THREE.SRGBColorSpace;
 const faceMaterial=keep(new THREE.MeshBasicMaterial({map,transparent:true,toneMapped:false}));
 const faceGeometry=keep(new THREE.PlaneGeometry(.058,.058));
 for(const side of [-1,1]){const face=new THREE.Mesh(faceGeometry,faceMaterial);face.position.y=side*.0036;face.rotation.x=-side*Math.PI/2;token.add(face);}
 let selected=0,pressed=-1000,target=null,last=null,moving=0,gestures=0;
 const local=new THREE.Vector3();
 function drawChip(stake){
  ctx.clearRect(0,0,192,192);ctx.fillStyle=({10:'#306f9e',25:'#a63855',50:'#487f55',100:'#8152a4'})[stake]||'#306f9e';
  ctx.beginPath();ctx.arc(96,96,94,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1d7';ctx.lineWidth=10;ctx.setLineDash([12,12]);
  ctx.beginPath();ctx.arc(96,96,82,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff1d7';ctx.font='900 58px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(stake),96,100);map.needsUpdate=true;
 }
 return {
  attachWeapons(bat,gun){for(const [kind,parent]of [['bat',bat],['gun',gun]]){const hand=new THREE.Mesh(kind==='gun'?keep(pistolGripGeometry()):closedGeometry,material);if(kind==='bat'){hand.scale.set(-1.5,1.5,1.5);hand.position.set(0,-.55,.082);hand.rotation.x=-.08;}parent.add(hand);grips.push(hand);}},
  press(t,point){pressed=t;target=point?new THREE.Vector3(point.x,point.y,point.z):null;gestures++;},
  tick(t,worldCamera,position,visible,stake,holding,held='none'){
   weapon=held;hands[1].rig.visible=weapon==='none';for(const g of grips)g.visible=visible;group.visible=visible;if(!visible){last=null;return;}
   if(stake!==selected){selected=stake;drawChip(stake);}
   moving=last?Math.min(1,Math.hypot(position.x-last.x,position.z-last.z)*25):0;last={...position};
   const k=THREE.MathUtils.clamp((t-pressed)/380,0,1),reach=Math.sin(k*Math.PI);
   const portrait=THREE.MathUtils.clamp(1-worldCamera.aspect,0,1),spread=Math.min(.34,.29*worldCamera.aspect);
   hands.forEach(({rig},i)=>{
    const sign=i?1:-1;
    rig.position.set(sign*spread,-.36-portrait*.11+(i?.014:0)+Math.sin(t/190+i*2)*.006*moving,-.68);
    rig.rotation.set(-.28,sign*-.18,sign*.24);
    rig.scale.setScalar(1-portrait*.19);
    if(i&&target&&reach>0){
     local.copy(target);worldCamera.worldToLocal(local);local.clampLength(.6,1.2);
     rig.position.lerp(local,reach*.38);rig.rotation.x-=reach*.18;
    }
   });
   token.visible=holding&&weapon==='none';group.updateMatrixWorld(true);
  },
  render(renderer,worldCamera){
   if(!group.visible)return;
   // A separate depth buffer gives the one-piece hands correct self-occlusion
   // and stable white lighting while keeping them clear of world geometry.
   camera.projectionMatrix.copy(worldCamera.projectionMatrix);
   camera.projectionMatrixInverse.copy(worldCamera.projectionMatrixInverse);
   const clear=renderer.autoClear;renderer.autoClear=false;
   try{renderer.clearDepth();renderer.render(scene,camera);}finally{renderer.autoClear=clear;}
  },
  inspect:()=>({visible:group.visible,holding:group.visible&&token.visible,selected,gestures,weapon,gripping:group.visible&&weapon!=='none',style:'white-cartoon-v216',handMeshes:2}),
  dispose(){scene.clear();for(const r of resources)r.dispose();}
 };
}
