// Render scheduling only: simulation and network authority keep their own elapsed time.
export function createRenderBudget({mobile=false,onChange=()=>{}}={}){
 let target=60,scale=1,lastDraw=0,previous=0,start=0,frames=0,cost=0,good=0,bad=0,fps=0,meanCost=0,changes=0;
 function reset(now=0){previous=0;start=now;frames=0;cost=0;lastDraw=0;good=0;bad=0;}
 function change(nextScale,nextTarget){scale=Math.max(.65,Math.min(1,nextScale));target=nextTarget;changes++;good=bad=0;onChange();}
 return {
  get scale(){return scale;},get targetFPS(){return target;},
  shouldRender(now,force=false){const ms=1000/target,elapsed=now-lastDraw;if(!force&&elapsed<ms-.6)return false;lastDraw=now-(elapsed>ms?elapsed%ms:0);return true;},
  record(now,renderCost){
   // Loading, switching tabs and context restoration must not lower quality.
   if(!previous||now-previous>250){reset(now);previous=now;return;}
   previous=now;frames++;cost+=Math.max(0,renderCost);
   if(now-start<2400)return;
   fps=frames*1000/(now-start);meanCost=cost/frames;start=now;frames=0;cost=0;
   if(fps<target*.80){bad++;good=0;if(scale>.651)change(scale-.12,target);else if(target===60&&bad>=2)change(scale,30);}
   else if(fps>target*.94&&meanCost<(target===60?11:9)){good++;bad=0;if(good>=6){if(target===30)change(scale,60);else if(scale<1)change(scale+.06,target);}}
   else {good=0;bad=0;}
  },
  reset,
  inspect:()=>({targetFPS:target,scale:+scale.toFixed(2),fps:+fps.toFixed(1),renderMs:+meanCost.toFixed(2),changes,mobile})
 };
}

// A short buffer smooths the 10 Hz network updates, without moving the real player.
export function createPoseTrack(delay=40){
 let samples=[],identity=null;
 const result={x:0,y:0,z:0,yaw:0};
 return {
  push(p,time,source=p){if(source===identity)return;identity=source;const next={x:p.x,y:p.y||0,z:p.z,yaw:p.yaw||0,t:time},last=samples.at(-1);
   if(last&&Math.hypot(next.x-last.x,next.y-last.y,next.z-last.z)>3)samples=[];
   samples.push(next);if(samples.length>24)samples.shift();},
  at(time){if(!samples.length)return null;const t=time-delay;while(samples.length>2&&samples[1].t<=t)samples.shift();const a=samples[0],b=samples[1]||a;
   const latest=samples.at(-1);if(samples.length>1&&t>latest.t){const prev=samples.at(-2),span=Math.max(1,latest.t-prev.t),ahead=Math.min(120,t-latest.t),k=ahead/span;result.x=latest.x+(latest.x-prev.x)*k;result.y=latest.y+(latest.y-prev.y)*k;result.z=latest.z+(latest.z-prev.z)*k;result.yaw=latest.yaw+Math.atan2(Math.sin(latest.yaw-prev.yaw),Math.cos(latest.yaw-prev.yaw))*k;return result;}
   const k=Math.max(0,Math.min(1,(t-a.t)/Math.max(1,b.t-a.t)));
   result.x=a.x+(b.x-a.x)*k;result.y=a.y+(b.y-a.y)*k;result.z=a.z+(b.z-a.z)*k;
   result.yaw=a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*k;return result;},
  clear(){samples=[];identity=null;}
 };
}



