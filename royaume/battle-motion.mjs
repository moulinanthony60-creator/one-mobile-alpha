const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Rendering between the last two fixed simulation steps adds at most 33 ms
// of latency. It never predicts through walls or modifies combat positions.
export function renderPosition(unit,presentation){
 const before=presentation?.previous.get(unit.id),a=clamp(presentation?.alpha??1,0,1);
 return before?{x:before.x+(unit.x-before.x)*a,y:before.y+(unit.y-before.y)*a}:{x:unit.x,y:unit.y};
}

export function createMotionTracks(){
 const tracks=new Map();
 return {
  sample(unit,position,target,dt,reduced=false){
   let old=tracks.get(unit.id);
   if(!old){old={x:position.x,y:position.y,distance:unit.id*.13,angle:Math.PI/4,motion:0,cooldown:unit.cooldown,attackAge:1};tracks.set(unit.id,old);}
   const dx=position.x-old.x,dz=position.y-old.y,travel=Math.hypot(dx,dz);
   const moving=travel>.00001,delta=clamp(dt,0,.1);
   const desired=moving?Math.atan2(dz,dx):target?Math.atan2(target.y-position.y,target.x-position.x):old.angle;
   let turn=(desired-old.angle+Math.PI*3)%(Math.PI*2)-Math.PI;
   old.angle+=turn*(1-Math.exp(-delta*15));
   old.motion+=(Number(moving)-old.motion)*(1-Math.exp(-delta*20));
   old.distance+=travel;
   if(unit.cooldown>old.cooldown+.15)old.attackAge=0;else old.attackAge+=delta;
   old.cooldown=unit.cooldown;old.x=position.x;old.y=position.y;
   const strike=old.attackAge<.32?Math.sin(old.attackAge/.32*Math.PI):0;
   return {dx:Math.cos(old.angle),dz:Math.sin(old.angle),distance:old.distance,moving:old.motion>.08,motion:old.motion,attack:strike,attacking:strike>.1,reduced};
  },
  clear(){tracks.clear();}
 };
}
