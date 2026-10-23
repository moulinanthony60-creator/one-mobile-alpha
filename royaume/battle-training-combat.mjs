import {advanceTrainingUnit,canStrike,spaceTrainingUnits,hasCombatRoom} from './battle-navigation.mjs?v=5';
import {turnTo,weaponMount,troopMuzzle,nearestFace} from './battle-aim.mjs?v=3';
import {shotStyle,shotTiming} from './battle-combat-fx.mjs?v=2';

export const practiceSpec=spec=>spec.range<2?{...spec,range:Math.min(spec.range,.52)}:spec;
// Range is measured in world tiles. Walls do not block defensive targeting.
export function inDefenseRange(gun,unit){return gun.hp>0&&unit.hp>0&&gun.range>0&&Math.hypot(unit.x-gun.x,unit.y-gun.y)<=gun.range;}
const action=(actor,kind,now)=>{if(actor.action!==kind){actor.action=kind;actor.actionAt=now;}};
function release(b,source,target,spec,enemy=false){
 const style=shotStyle(source),end=enemy?source.aim:nearestFace(source,target),mount=enemy?weaponMount(source,end):null,origin=mount?.muzzle||troopMuzzle(source);
 const timing=shotTiming(style,Math.hypot(origin.x-end.x,origin.y-end.y));
 const shot={kind:enemy?'enemy':'shot',style,sourceKind:source.kind,sourceId:source.id,targetId:target.id,x:end.x,y:end.y,targetH:end.h,fromX:origin.x,fromY:origin.y,fromH:origin.h,arc:mount?.arc??(style==='arrow'?.24:style==='magic'?.20:0),firedAt:b.elapsed,...timing,life:timing.duration};
 b.effects.push(shot);b.impacts??=[];b.impacts.push({at:b.elapsed+timing.flight,enemy,targetId:target.id,x:end.x,y:end.y,damage:spec.damage,splash:spec.splash||0});
 source.lastAttackAt=b.elapsed;source.cooldown=spec.rate;source.windup=0;source.attackTarget=null;action(source,'recover',b.elapsed);
}
function impact(b,shot,specs){
 const candidates=shot.enemy?b.units:b.buildings,target=candidates.find(u=>u.id===shot.targetId),alive=candidates.filter(u=>u.hp>0);
 for(const victim of alive){
  const distance=Math.hypot(victim.x-shot.x,victim.y-shot.y);
  const direct=victim===target&&(!shot.enemy||distance<.85),splash=shot.splash>0&&distance<shot.splash;
  if(!direct&&!splash)continue;
  const armor=shot.enemy?(specs[victim.kind]?.armor||1):1;
  victim.hp=Math.max(0,victim.hp-shot.damage*(direct?1:.5)*armor);
  victim.lastHitAt=b.elapsed;
  if(victim.hp===0)victim.diedAt=b.elapsed;
 }
}
function aimAtMovingUnit(source,target){
 const duration=shotTiming(shotStyle(source),Math.hypot(target.x-source.x,target.y-source.y)).flight;
 return {x:target.x+(target.vx||0)*duration,y:target.y+(target.vy||0)*duration,h:.62};
}
export function stepTrainingCombat(b,specs,dt){
 const previous=new Map(b.units.map(u=>[u.id,{x:u.x,y:u.y}]));
 for(const u of b.units){
  if(u.hp<=0)continue;const spec=practiceSpec(specs[u.kind]);u.cooldown=Math.max(0,u.cooldown-dt);
  let target=b.buildings.find(p=>p.id===u.target&&p.hp>0);
  // Hold a firing stance through wind-up and recovery; neighbour avoidance
  // cannot rotate or move a soldier halfway through their attack.
  if(u.action==='recover'&&b.elapsed-u.lastAttackAt<.22){u.speed=0;continue;}
  const approaching=!u.action||['walk','turn','idle'].includes(u.action);
  if(!target||!canStrike(u,target,spec,b.buildings)||(approaching&&!hasCombatRoom(b,u))){
   u.windup=0;u.attackTarget=null;target=advanceTrainingUnit(b,u,spec,dt);
   if(!target||!canStrike(u,target,spec,b.buildings)||!hasCombatRoom(b,u))continue;
  }
  u.speed=0;const angle=Math.atan2(target.y-u.y,target.x-u.x);
  if(!turnTo(u,angle,dt,5.5)){u.windup=0;u.attackTarget=null;action(u,'turn',b.elapsed);continue;}
  if(u.cooldown>0){action(u,'aim',b.elapsed);continue;}
  const duration=u.kind==='guardians'?.24:u.kind==='archers'?.30:.34;
  if(u.attackTarget!==target.id){u.attackTarget=target.id;u.windup=0;u.windupDuration=duration;action(u,'windup',b.elapsed);}
  u.windup=Math.min(1,u.windup+dt/duration);
  if(u.windup>=1)release(b,u,target,spec);
 }
 spaceTrainingUnits(b,dt);
 for(const u of b.units){const before=previous.get(u.id);u.vx=(u.x-before.x)/dt;u.vy=(u.y-before.y)/dt;}
 for(const gun of b.buildings){
  if(gun.hp<=0||!gun.damage)continue;gun.cooldown=Math.max(0,gun.cooldown-dt);
  const inRange=u=>inDefenseRange(gun,u);
  let target=b.units.find(u=>u.id===gun.target&&inRange(u));
  if(!target)target=b.units.filter(inRange).sort((a,c)=>Math.hypot(a.x-gun.x,a.y-gun.y)-Math.hypot(c.x-gun.x,c.y-gun.y))[0];
  if(!target){gun.target=null;gun.windup=0;action(gun,'idle',b.elapsed);continue;}
  if(gun.target!==target.id){gun.windup=0;gun.target=target.id;}
  // Recoil recovers before reacquiring a new heading. Keep the fired aim still.
  if(Number.isFinite(gun.lastAttackAt)&&b.elapsed-gun.lastAttackAt<.16)continue;
  gun.aim=aimAtMovingUnit(gun,target);
  if(!Number.isFinite(gun.facing))gun.facing=Math.PI/4;
  const angle=Math.atan2(gun.aim.y-gun.y,gun.aim.x-gun.x);
  if(!turnTo(gun,angle,dt,gun.kind==='mortar'?2.5:3.5)){gun.windup=0;action(gun,'turn',b.elapsed);continue;}
  if(gun.cooldown>0){action(gun,'aim',b.elapsed);continue;}
  gun.windupDuration=.16;gun.windup=(gun.windup||0)+dt/.16;action(gun,'windup',b.elapsed);
  if(gun.windup>=1){const spec={damage:gun.damage,rate:gun.kind==='mortar'?2.5:1.2,splash:gun.kind==='mortar'?1.7:0};release(b,gun,target,spec,true);}
 }
 const pending=[];for(const shot of b.impacts||[])if(shot.at<=b.elapsed+1e-8)impact(b,shot,specs);else pending.push(shot);b.impacts=pending;
}
