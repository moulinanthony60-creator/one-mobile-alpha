import * as T from './vendor/three.module.js';
const point=o=>o.getWorldPosition(new T.Vector3());
export function createGrip(root,side='Left',firstPerson=false){
 const names=firstPerson?{Index:'index',Middle:'majeur',Ring:'annulaire',Pinky:'auriculaire',Thumb:'pouce'}:null;
 const get=(finger,n)=>root.getObjectByName(firstPerson?`${names[finger]}_${n}`:`mixamorig${side}Hand${finger}${n}`);
 const wrist=root.getObjectByName(firstPerson?'poignet':`mixamorig${side}Hand`);
 if(!wrist)return null;
 const chains={};for(const name of ['Index','Middle','Ring','Pinky','Thumb']){const bones=[1,2,3].map(n=>get(name,n)).filter(Boolean);if(!bones.length)continue;const last=bones.at(-1),end=get(name,4);const length=end?end.position.length():(bones.at(-1).position.length()||1)*.75;chains[name]={bones,rest:bones.map(b=>b.quaternion.clone()),last,end,length};}
 return {root,wrist,chains};
}
export function resetGrip(g){if(!g)return;for(const c of Object.values(g.chains))c.bones.forEach((b,i)=>b.quaternion.copy(c.rest[i]));g.root.updateMatrixWorld(true);}
export function palmFrame(g){
 const w=point(g.wrist),index=point(g.chains.Index.bones[0]),middle=point((g.chains.Middle||g.chains.Index).bones[0]),pinky=point((g.chains.Pinky||g.chains.Ring).bones[0]);
 const y=middle.clone().sub(w).normalize(),x=index.clone().sub(pinky).normalize(),z=new T.Vector3().crossVectors(x,y).normalize();x.crossVectors(y,z).normalize();
 return {origin:w.clone().lerp(middle,.68),knuckle:middle,x,y,z,rotation:new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z))};
}
function tip(c){return c.end?point(c.end):c.last.localToWorld(new T.Vector3(0,c.length,0));}
function solve(g,c,target){
 for(let pass=0;pass<7;pass++)for(let i=c.bones.length-1;i>=0;i--){const b=c.bones[i],origin=point(b),a=tip(c).sub(origin),d=target.clone().sub(origin);if(a.lengthSq()<1e-9||d.lengthSq()<1e-9)continue;const delta=new T.Quaternion().setFromUnitVectors(a.normalize(),d.normalize());const angle=2*Math.acos(Math.min(1,Math.abs(delta.w)));if(angle>.45)delta.slerp(new T.Quaternion(),1-.45/angle);const world=b.getWorldQuaternion(new T.Quaternion()),parent=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(parent.invert().multiply(delta.multiply(world)));b.updateWorldMatrix(false,true);}
}
export function pinchCards(g,frame){
 if(!g)return;const at=frame.knuckle.clone().addScaledVector(frame.y,.018);
 for(const [name,c] of Object.entries(g.chains)){const i=['Index','Middle','Ring','Pinky'].indexOf(name);const target=at.clone().addScaledVector(frame.x,name==='Thumb'?.006:-i*.016).addScaledVector(frame.z,name==='Thumb'?-.012:.012);solve(g,c,target);}
 return at;
}
export function graspHandle(g,origin,rotation,scale=1){
 if(!g)return;const x=new T.Vector3(1,0,0).applyQuaternion(rotation),y=new T.Vector3(0,1,0).applyQuaternion(rotation),z=new T.Vector3(0,0,1).applyQuaternion(rotation);
 for(const [name,c] of Object.entries(g.chains)){const i=['Index','Middle','Ring','Pinky'].indexOf(name);const target=origin.clone().addScaledVector(y,(name==='Thumb'?.025:.055-i*.038)*scale).addScaledVector(x,(name==='Thumb'?-.043:.043)*scale).addScaledVector(z,-.018*scale);solve(g,c,target);}
}
