// Shared world-space weapon geometry. Rendering, aiming and projectiles use
// these same points; a muzzle is never guessed from the centre of a sprite.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export function turnTo(actor,angle,dt,rate=5){
 if(!Number.isFinite(actor.facing))actor.facing=angle;
 actor.facing+=clamp(angleDelta(angle,actor.facing),-rate*dt,rate*dt);
 return Math.abs(angleDelta(angle,actor.facing))<.045;
}
export const troopScale=kind=>kind==='guardians'?1.28:1.23;
export const troopStride=kind=>kind==='guardians'?.96:kind==='archers'?.90:1.02;
export function weaponMount(source,aim){
 const kind=source.kind,angle=source.facing??Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle);
 const height={cannon:.72,mortar:.43,tower:1.68,arcane:1.42}[kind]??.72;
 const length={cannon:1.08,mortar:.80,tower:.58,arcane:.08}[kind]??.5;
 const pivot={x:source.x,y:source.y,h:height};
 const end=aim||{x:source.x+dx*4,y:source.y+dy*4,h:.62};
 const arc=kind==='mortar'?1.65:kind==='tower'?.28:0;
 let pitch=kind==='mortar'?1.05:0,muzzle;
 // Solve the ballistic initial tangent with the actual barrel tip as origin.
 for(let i=0;i<8;i++){
  muzzle={x:pivot.x+dx*Math.cos(pitch)*length,y:pivot.y+dy*Math.cos(pitch)*length,h:pivot.h+Math.sin(pitch)*length};
  const run=Math.max(.35,Math.hypot(end.x-muzzle.x,end.y-muzzle.y));
  pitch=clamp(Math.atan2((end.h??.62)-muzzle.h+4*arc,run),-.28,1.35);
 }
 muzzle={x:pivot.x+dx*Math.cos(pitch)*length,y:pivot.y+dy*Math.cos(pitch)*length,h:pivot.h+Math.sin(pitch)*length};
 return {pivot,muzzle,angle,pitch,length,arc,direction:{x:dx*Math.cos(pitch),y:dy*Math.cos(pitch),h:Math.sin(pitch)}};
}
export function troopMuzzle(unit){
 const scale=troopScale(unit.kind),angle=unit.facing??Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle),archer=unit.kind==='archers';
 const f=archer?.39:unit.kind==='mages'?.08:.40,s=archer?-.10:.28,h=archer?.66:unit.kind==='mages'?1.08:.47;
 return {x:unit.x+1.36*scale*(dx*f+dy*s),y:unit.y+1.36*scale*(dy*f-dx*s),h:h*scale};
}
export function nearestFace(unit,building){
 const w=(building.collision?.width||1)/2,d=(building.collision?.depth||1)/2;
 return {x:clamp(unit.x,building.x-w,building.x+w),y:clamp(unit.y,building.y-d,building.y+d),h:.38};
}
