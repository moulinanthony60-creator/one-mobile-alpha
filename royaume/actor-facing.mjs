// All body parts share this world-space heading. No independent mirror state.
export function actorBasis(p){
 const n=Math.hypot(p.dx??1,p.dz??0)||1,fx=(p.dx??1)/n,fz=(p.dz??0)/n;
 return {fx,fz,rx:fz,rz:-fx,front:(fx+fz)/Math.SQRT2,side:(fx-fz)/Math.SQRT2};
}
export function bodyPoint(b,side,forward,height){return {x:b.rx*side+b.fx*forward,z:b.rz*side+b.fz*forward,h:height};}
export function projectJoint(p){return {x:(p.x-p.z)*.5,y:(p.x+p.z)*.25-p.h,depth:p.x+p.z};}
export function turnToTravel(p,dx,dz,dt,rate=6){
 if(Math.hypot(dx,dz)<1e-9)return true;
 const target=Math.atan2(dz,dx),start=p.face??target,delta=Math.atan2(Math.sin(target-start),Math.cos(target-start));
 p.face=start+Math.max(-rate*dt,Math.min(rate*dt,delta));p.dx=Math.cos(p.face);p.dz=Math.sin(p.face);p.heading=p.dx-p.dz;
 // Turn in place before a sharp change, rather than walking sideways during it.
 return Math.cos(target-p.face)>=Math.cos(.18);
}
export function upperBody(p,phase,blend,bob,{shoulder=.25,arm=.34,working=false,work=0,attack=0,windup=0}={}){
 const basis=actorBasis(p),point=(s,f,h)=>projectJoint(bodyPoint(basis,s,f,h));
 const arms=[-1,1].map((sign,i)=>{
  const swing=-Math.cos(phase*Math.PI*2+i*Math.PI)*.13*blend;
  const reach=i===1?work*.12+attack*.30:0,lift=i===1?work*.22+windup*.28:0;
  const shoulderJoint=point(sign*shoulder,0,.69-bob),hand=point(sign*(shoulder+.012),swing+reach,.69-arm-bob+lift),elbow=point(sign*(shoulder+.025),swing*.45-.035+reach*.5,.69-arm*.52-bob+lift*.5);
  return {shoulder:shoulderJoint,elbow,hand};
 });
 const frontness=Math.abs(basis.front),bodyWidth=Math.sqrt(frontness**2+(.48*basis.side)**2),headWidth=Math.sqrt(frontness**2+(.72*basis.side)**2);
 return {basis,arms,bodyWidth,headWidth,farArm:arms[0].shoulder.depth<arms[1].shoulder.depth?0:1,flip:basis.side<0,back:basis.front<0};
}
