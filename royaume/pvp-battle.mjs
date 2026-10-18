import {ASSAULT_UNITS} from './expeditions.mjs?v=38';
import {TRAINING_UNITS} from './barracks.mjs?v=36';
import {footprint} from './village-state.mjs?v=38';
import {defenseStats} from './siege.mjs?v=38';
export const RAID_SECONDS=150;
export function raidField(village){
 const plots=village.structures.filter(p=>!p.pending),left=Math.min(...plots.map(p=>p.x))-4,top=Math.min(...plots.map(p=>p.z))-4;
 const buildings=plots.map(p=>{const f=footprint(p.kind,p.rotation),level=p.level||1,d=defenseStats({...p,level}),hp=(p.kind==='castle'?540:p.kind==='wall'?90:180)*(1+(level-1)*.22);return {id:p.id,kind:p.kind,level,x:p.x-left+f.w/2,y:p.z-top+f.d/2,w:f.w,h:f.d,hp,maxHp:hp,damage:d?d.damage*.65:0,range:d?.range||0,rate:d?.interval||1,splash:d?.splash||0,cooldown:0};});
 return {width:Math.max(...buildings.map(p=>p.x+p.w/2))+4,height:Math.max(...buildings.map(p=>p.y+p.h/2))+4,buildings};
}
export function newRaidBattle(village,army){return {...raidField(village),units:[],remaining:{...army},deployed:{},serial:0,elapsed:0,phase:'active',spells:2,effects:[]};}
export function raidScore(b){const targets=b.buildings.filter(p=>p.kind!=='wall'),destroyed=targets.filter(p=>p.hp<=0).length,percent=Math.floor(100*destroyed/Math.max(1,targets.length));return {percent,stars:Number(percent>=50)+Number(targets.some(p=>p.kind==='castle'&&p.hp<=0))+Number(percent===100)};}
const distance=(u,p)=>Math.hypot(Math.max(0,Math.abs(u.x-p.x)-(p.w||0)/2),Math.max(0,Math.abs(u.y-p.y)-(p.h||0)/2));
export function raidOrder(b,a){
 if(b.phase!=='active')throw Error('Cette attaque est terminée.');
 if(a.type==='retreat'){b.phase='finished';return;}
 const x=Number(a.x),y=Number(a.y);if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=b.width||y>=b.height)throw Error('Choisissez un point sur le terrain.');
 if(a.type==='deploy'){
  if(!(x<3||y<3||x>b.width-3||y>b.height-3))throw Error('Déployez sur la bordure bleue.');
  const spec=ASSAULT_UNITS[a.unit];if(!spec||!b.remaining[a.unit])throw Error('Cette troupe n’est plus disponible.');
  b.remaining[a.unit]--;b.deployed[a.unit]=(b.deployed[a.unit]||0)+1;
  b.units.push({id:++b.serial,kind:a.unit,x,y,hp:spec.hp,maxHp:spec.hp,cooldown:0});
 }else if(a.type==='spell'){
  if(!b.spells)throw Error('Vous avez utilisé vos deux frappes.');b.spells--;
  for(const p of b.buildings)if(distance({x,y},p)<2.6)p.hp=Math.max(0,p.hp-150);
  b.effects.push({x,y,kind:'spell',life:.7});
 }else throw Error('Ordre inconnu.');
 if(raidScore(b).percent===100)b.phase='finished';
}
export function stepRaid(b,dt=.25){
 if(b.phase!=='active')return;
 dt=Math.min(.25,Math.max(0,dt));b.elapsed+=dt;b.effects=b.effects.filter(e=>(e.life-=dt)>0);
 const live=b.buildings.filter(p=>p.hp>0);
 for(const u of b.units){
  if(u.hp<=0)continue;const spec=ASSAULT_UNITS[u.kind];u.cooldown-=dt;
  let target=null,best=Infinity;
  if(spec.heal){for(const v of b.units)if(v.hp>0&&v.hp<v.maxHp&&!ASSAULT_UNITS[v.kind].heal){const d=Math.hypot(v.x-u.x,v.y-u.y);if(d<best){best=d;target=v;}}}
  else {
   const defenses=spec.priority&&live.some(p=>p.damage>0);
   for(const p of live){if(p.hp<=0||p.kind==='wall'||defenses&&!p.damage)continue;const d=distance(u,p);if(d<best){best=d;target=p;}}
   if(!target)for(const p of live){const d=distance(u,p);if(p.hp>0&&d<best){best=d;target=p;}}
  }
  if(!target)continue;
  const range=spec.range*1.25;
  if(distance(u,target)>range){
   const d=Math.hypot(target.x-u.x,target.y-u.y),step=Math.min(d,spec.speed*1.25*dt),next={x:u.x+(target.x-u.x)/d*step,y:u.y+(target.y-u.y)/d*step};
   const block=live.find(p=>p.hp>0&&p!==target&&distance(next,p)<.18);
   if(block){if(!spec.heal)target=block;}else{u.x=next.x;u.y=next.y;}
  }
  if(distance(u,target)<=range+.2&&u.cooldown<=0){u.cooldown=spec.rate;if(spec.heal)target.hp=Math.min(target.maxHp,target.hp+spec.damage);else{target.hp=Math.max(0,target.hp-spec.damage);if(spec.splash)for(const p of live)if(p!==target&&distance(target,p)<spec.splash)p.hp=Math.max(0,p.hp-spec.damage*.5);}}
 }
 for(const p of live){if(p.hp<=0||!p.damage)continue;p.cooldown-=dt;if(p.cooldown>0)continue;let target=null,best=p.range;for(const u of b.units)if(u.hp>0){const d=distance(u,p);if(d<best){best=d;target=u;}}if(!target)continue;p.cooldown=p.rate;target.hp=Math.max(0,target.hp-p.damage*(ASSAULT_UNITS[target.kind].armor||1));if(p.splash)for(const u of b.units)if(u!==target&&u.hp>0&&Math.hypot(u.x-target.x,u.y-target.y)<p.splash)u.hp=Math.max(0,u.hp-p.damage*.6);}
 if(raidScore(b).percent===100||b.elapsed>=RAID_SECONDS||b.units.length&&!b.units.some(u=>u.hp>0&&!ASSAULT_UNITS[u.kind].heal)&&!TRAINING_UNITS.some(k=>b.remaining[k]&&!ASSAULT_UNITS[k].heal))b.phase='finished';
}
