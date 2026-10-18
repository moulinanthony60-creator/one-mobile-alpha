// Joints live in the terrain's coordinate system, before isometric projection.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>t*t*(3-2*t);
export function footCycle(phase){const u=((phase%1)+1)%1;if(u<.6)return {travel:1-u/.3,lift:0};const t=(u-.6)/.4;return {travel:-1+2*smooth(t),lift:Math.sin(Math.PI*t)**2};}
export function bipedPose(p,{stride=.48,scale=.70,width=.15,height=.43,length=.226}={}){
 const phase=(p.walkDistance||0)/stride,blend=clamp(p.motionBlend??(p.moving?1:0),0,1),norm=Math.hypot(p.dx??1,p.dz??0)||1,forward={x:(p.dx??1)/norm,z:(p.dz??0)/norm},right={x:forward.z,z:-forward.x};
 const spread=Math.max(Math.abs(footCycle(phase).travel),Math.abs(footCycle(phase+.5).travel));const bob=spread*spread*.043*blend;
 const project=a=>({x:(a.x-a.z)*.5/scale,y:(a.x+a.z)*.25/scale-a.h/scale});
 const legs=[-1,1].map((sign,i)=>{
  const f=blend>0?footCycle(phase+i*.5):{travel:0,lift:0},hip={x:right.x*sign*width*scale,z:right.z*sign*width*scale,h:(height-bob)*scale},travel=f.travel*stride*.3*blend;
  const foot={x:hip.x+forward.x*travel,z:hip.z+forward.z*travel,h:f.lift*.055*scale*blend};
  const planted=p.footContacts?.[i];if(planted?.planted&&f.lift===0&&p.moving&&blend>.9&&Number.isFinite(p.x)&&Math.hypot(planted.x-p.x,planted.z-p.z)<.34){foot.x=planted.x-p.x;foot.z=planted.z-p.z;}
  const vx=foot.x-hip.x,vz=foot.z-hip.z,vh=foot.h-hip.h,d=Math.hypot(vx,vz,vh),dot=(forward.x*vx+forward.z*vz)/(d*d);
  let bx=forward.x-vx*dot,bz=forward.z-vz*dot,bh=-vh*dot;const n=Math.hypot(bx,bz,bh)||1,bend=Math.sqrt(Math.max(0,(length*scale)**2-d*d/4));
  const knee={x:(hip.x+foot.x)/2+bx/n*bend,z:(hip.z+foot.z)/2+bz/n*bend,h:(hip.h+foot.h)/2+bh/n*bend};
  return {hip:project(hip),knee:project(knee),foot:project(foot),ground:foot,contact:f.lift===0,depth:hip.x+hip.z};
 });
 return {phase,blend,bob,legs,forward,right,far:legs[0].depth<legs[1].depth?0:1};
}
export function updateFootContacts(p,options){
 const pose=bipedPose(p,options);p.footContacts=pose.legs.map((l,i)=>{const previous=p.footContacts?.[i],planted=l.contact&&p.moving&&pose.blend>.9;if(planted&&previous?.planted&&Math.hypot(previous.x-p.x,previous.z-p.z)<.34)return previous;return {x:p.x+l.ground.x,z:p.z+l.ground.z,planted};});
}
