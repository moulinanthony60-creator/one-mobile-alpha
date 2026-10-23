import {footCycle} from './locomotion.mjs?v=34';
import {troopScale,troopStride,angleDelta} from './battle-aim.mjs?v=3';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Rendering between the last two fixed simulation steps adds at most 33 ms
// of latency. It never predicts through walls or modifies combat positions.
export function renderPosition(unit,presentation){
 const before=presentation?.previous.get(unit.id),a=clamp(presentation?.alpha??1,0,1);
 return before?{x:before.x+(unit.x-before.x)*a,y:before.y+(unit.y-before.y)*a}:{x:unit.x,y:unit.y};
}
export function renderFacing(actor,presentation,defense=false){
 const before=(defense?presentation?.previousBuildings:presentation?.previous)?.get(actor.id),alpha=clamp(presentation?.alpha??1,0,1);
 return Number.isFinite(before?.facing)&&Number.isFinite(actor.facing)?before.facing+angleDelta(actor.facing,before.facing)*alpha:actor.facing;
}

export function createMotionTracks(){
 const tracks=new Map();
 return {
  sample(unit,position,target,dt,reduced=false,elapsed=null){
   let old=tracks.get(unit.id);
   if(!old){old={x:position.x,y:position.y,distance:unit.id*.13,angle:unit.facing??Math.PI/4,motion:0,cooldown:unit.cooldown,attackAge:10,feet:[]};tracks.set(unit.id,old);}
   const stepX=position.x-old.x,stepZ=position.y-old.y,travel=Math.hypot(stepX,stepZ);
   const moving=travel>.00001,delta=clamp(dt,0,.1);
   const desired=moving?Math.atan2(stepZ,stepX):target?Math.atan2(target.y-position.y,target.x-position.x):old.angle;
   let turn=(desired-old.angle+Math.PI*3)%(Math.PI*2)-Math.PI;
   if(Number.isFinite(unit.facing))old.angle=unit.facing;else old.angle+=turn*(1-Math.exp(-delta*15));
   const walking=unit.action?unit.action==='walk'&&moving:moving;
   old.motion+=(Number(walking)-old.motion)*(1-Math.exp(-delta*24));
   if(unit.action&&unit.action!=='walk')old.motion=0;
   old.distance+=travel;
   if(unit.cooldown>old.cooldown+.15)old.attackAge=0;else old.attackAge+=delta;
   old.cooldown=unit.cooldown;old.x=position.x;old.y=position.y;
   if(elapsed!==null&&Number.isFinite(unit.lastAttackAt))old.attackAge=Math.max(0,elapsed-unit.lastAttackAt);
   const strike=old.attackAge<.32?Math.sin(old.attackAge/.32*Math.PI):0,dx=Math.cos(old.angle),dz=Math.sin(old.angle),size=troopScale(unit.kind),stride=troopStride(unit.kind);
   const footOffsets=[-1,1].map((sign,i)=>{
    const cycle=footCycle(old.distance/stride+i*.5);
    if(reduced||!walking||old.motion<.8||cycle.lift>0){old.feet[i]=null;return null;}
    if(!old.feet[i]){const side=sign*.13*size*1.36,travel=cycle.travel*stride*.30;old.feet[i]={x:position.x+dz*side+dx*travel,y:position.y-dx*side+dz*travel};}
    const foot=old.feet[i],x=foot.x-position.x,y=foot.y-position.y;
    if(Math.hypot(x,y)>.5){old.feet[i]=null;return null;}
    return {x:(x-y)*.5/size,y:(x+y)*.25/size,world:{...foot}};
   });
   return {dx,dz,distance:old.distance,moving:old.motion>.08,motion:old.motion,attack:strike,attacking:strike>.1,attackAge:old.attackAge,aiming:unit.action?['aim','windup','recover'].includes(unit.action):Boolean(target)&&old.motion<.25,windup:unit.action?(unit.action==='windup'?unit.windup||0:0):target&&old.motion<.25&&unit.cooldown>0&&unit.cooldown<.24?1-unit.cooldown/.24:0,footOffsets,reduced};
  },
  clear(){tracks.clear();}
 };
}
