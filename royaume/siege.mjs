import {turnToTravel} from './actor-facing.mjs?v=34';
import {updateFootContacts} from './locomotion.mjs?v=34';
import {walkable} from './village-motion.mjs?v=34';
import {footprint,GRID_MIN,GRID_MAX} from './village-state.mjs?v=34';
export const DEFENSES={
 bastion:{range:6,damage:70,interval:2,shot:'shell',name:'Tir du bastion'},
 firetower:{range:6,damage:28,interval:1.2,splash:2,shot:'mortar',name:'Flammes'},
 watchtower:{range:12,damage:18,interval:.8,shot:'arrow',name:'Flèches rapides'},
 tower:{range:7,damage:24,interval:1,shot:'arrow',name:'Flèches'},
 cannon:{range:7,damage:48,interval:1.7,shot:'shell',name:'Boulets'},
 mortar:{range:10,damage:42,interval:3,splash:2.2,shot:'mortar',name:'Explosion de zone'},
 ballista:{range:11,damage:82,interval:2.5,shot:'bolt',name:'Trait lourd'},
 arcane:{range:8,damage:28,interval:.65,shot:'ether',name:'Éclair d’éther'}
};
export const SIEGE_TIERS=[
 {name:'Aux portes du royaume',subtitle:'Trois vagues · éclaireurs et brutes',gold:650,wood:350,aether:30,multiplier:1},
 {name:'L’assaut de fer',subtitle:'Ennemis renforcés · défenses niveau 2 conseillées',gold:1000,wood:550,aether:50,multiplier:1.55},
 {name:'La dernière bannière',subtitle:'Assaut majeur · citadelle et défenses niveau 3 conseillées',gold:1600,wood:850,aether:80,multiplier:2.3}
];
export const ENEMIES={raider:{name:'Pillard',hp:115,damage:23,speed:1.6,interval:.9,span:.72},brute:{name:'Brute',hp:345,damage:55,speed:1,interval:1.25,span:1.15},wolf:{name:'Loup des brumes',hp:80,damage:14,speed:2.2,interval:.65,span:.9}};
const key=(x,z)=>x+','+z,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function defenseStats(plot){const d=DEFENSES[plot.kind];return d?{...d,damage:Math.round(d.damage*(1+(plot.level-1)*.28)),range:d.range+(plot.level-1)*.4}:null;}
export function createSiege(state,tier=0){
 if(!Number.isInteger(tier)||!SIEGE_TIERS[tier])throw new Error('Épreuve inconnue.');
 if(tier>0&&!state.siegeCleared?.includes(tier-1))throw new Error('Remportez d’abord l’épreuve précédente.');
 const castle=state.village.structures.find(p=>p.kind==='castle');if(!castle)throw new Error('La citadelle est introuvable.');
 const structures=state.village.structures.map(p=>{const level=p.essential?(state.buildings[p.id]||p.level):p.level,maxHp=p.kind==='castle'?1200+300*(level-1):p.kind==='wall'?230*level:400+140*(level-1);return {...p,level,maxHp,hp:maxHp,cooldown:0};});
 const enemies=[],mult=SIEGE_TIERS[tier].multiplier*(state.progressionVersion?.8:1);
 for(let wave=0;wave<3;wave++)for(let i=0;i<(state.progressionVersion?4+wave*2:9+wave*3)+tier*2;i++){
  const kind=i%5===4?'brute':i%3===1?'wolf':'raider',spec=ENEMIES[kind],side=(i+wave)%4,offset=(i%5-2)*1.1,cx=castle.x+1.5,cz=castle.z+1.5;
  const point=side===0?{x:cx+19,z:cz+offset}:side===1?{x:cx+offset,z:cz+19}:side===2?{x:cx-20,z:cz+offset}:{x:cx+offset,z:cz-19};
  enemies.push({id:enemies.length,kind,x:clamp(Math.round(point.x),GRID_MIN,GRID_MAX-1),z:clamp(Math.round(point.z),GRID_MIN,GRID_MAX-1),hp:Math.round(spec.hp*mult),maxHp:Math.round(spec.hp*mult),damage:spec.damage*mult,speed:spec.speed,interval:spec.interval,cooldown:0,spawn:wave*17+i*.65,wave:wave+1,heading:1});
 }
 return {version:1,phase:'active',tier,elapsed:0,wave:1,castleId:castle.id,structures,enemies,effects:[],charges:3,spellCooldown:0,target:null,kills:0,reward:null};
}
// Reverse Dijkstra: a wall has a traversal cost, so units prefer gates when nearby.
// Destroyed structures become open ground. The cached field never enters a save.
const paths=new WeakMap();
function field(s){
 const signature=s.structures.filter(p=>p.hp>0).map(p=>p.id).join('|');let cache=paths.get(s);if(cache?.signature===signature)return cache;
 const occupied=new Map();for(const p of s.structures.filter(p=>p.hp>0)){const f=footprint(p.kind,p.rotation);for(let x=p.x;x<p.x+f.w;x++)for(let z=p.z;z<p.z+f.d;z++)occupied.set(key(x,z),p);}
 const castle=s.structures.find(p=>p.id===s.castleId),goal={x:castle.x+1,z:castle.z+1},dist=new Map([[key(goal.x,goal.z),0]]),next=new Map(),heap=[];
 const push=n=>{heap.push(n);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(heap[parent].d<=n.d)break;heap[i]=heap[parent];i=parent;}heap[i]=n;};
 const pop=()=>{const top=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].d<heap[c].d)c++;if(heap[c].d>=tail.d)break;heap[i]=heap[c];i=c;}heap[i]=tail;}return top;};
 push({...goal,d:0});
 while(heap.length){const p=pop(),k=key(p.x,p.z);if(p.d!==dist.get(k))continue;const obstacle=occupied.get(k),cost=obstacle&&obstacle.id!==s.castleId?(obstacle.kind==='wall'?3:7):1;
  for(const [dx,dz]of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){if(dx&&dz&&(occupied.has(k)||occupied.has(key(p.x+dx,p.z))||occupied.has(key(p.x,p.z+dz))))continue;const x=p.x+dx,z=p.z+dz;if(x<GRID_MIN||x>=GRID_MAX||z<GRID_MIN||z>=GRID_MAX)continue;const nk=key(x,z),d=p.d+cost*(dx&&dz?Math.SQRT2:1);if(d<(dist.get(nk)??Infinity)){dist.set(nk,d);next.set(nk,{x:p.x,z:p.z});push({x,z,d});}}
 }
 cache={signature,occupied,next};paths.set(s,cache);return cache;
}
function hurt(s,e,damage,x=e.x,z=e.z){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-damage);if(e.hp===0)s.kills++;s.effects.push({kind:'hit',x,z,value:Math.round(damage),at:s.elapsed,duration:.55});}
export function siegeCommand(s,action){
 if(s?.phase!=='active')throw new Error('Aucune défense en cours.');
 if(action.type==='siege-target'){const target=s.enemies.find(e=>e.id===action.id&&e.hp>0&&e.spawn<=s.elapsed);if(!target)throw new Error('Choisissez un assaillant encore debout.');s.target=target.id;return;}
 if(action.type==='siege-spell'){
  if(s.charges<=0||s.spellCooldown>0)throw new Error('La frappe n’est pas disponible.');
  const enemies=s.enemies.filter(e=>e.hp>0&&e.spawn<=s.elapsed);if(!enemies.length)throw new Error('Attendez l’arrivée des assaillants.');
  const target=enemies.find(e=>e.id===s.target)||enemies.reduce((a,b)=>enemies.filter(e=>Math.hypot(e.x-b.x,e.z-b.z)<3).length>enemies.filter(e=>Math.hypot(e.x-a.x,e.z-a.z)<3).length?b:a);
  for(const e of enemies)if(Math.hypot(e.x-target.x,e.z-target.z)<=3)hurt(s,e,185);
  s.effects.push({kind:'spell',x:target.x,z:target.z,at:s.elapsed,duration:1.1,radius:3});s.charges--;s.spellCooldown=5;return;
 }
 throw new Error('Ordre inconnu.');
}
export function stepSiege(s,dt){
 if(s?.phase!=='active')return s;
 dt=clamp(Number(dt)||0,0,.25);s.elapsed+=dt;s.wave=Math.min(3,1+Math.floor(s.elapsed/17));s.spellCooldown=Math.max(0,s.spellCooldown-dt);s.effects=s.effects.filter(e=>s.elapsed-e.at<e.duration);
 const live=s.enemies.filter(e=>e.hp>0&&e.spawn<=s.elapsed),f=field(s);
 for(const p of s.structures){const d=defenseStats(p);if(!d||p.hp<=0)continue;p.cooldown=Math.max(0,p.cooldown-dt);if(p.cooldown>0)continue;const size=footprint(p.kind,p.rotation),x=p.x+(size.w-1)/2,z=p.z+(size.d-1)/2,range=live.filter(e=>e.hp>0&&Math.hypot(e.x-x,e.z-z)<=d.range);if(!range.length)continue;
  const target=range.find(e=>e.id===s.target)||range.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
  s.effects.push({kind:d.shot,fromX:x,fromZ:z,x:target.x,z:target.z,at:s.elapsed,duration:d.shot==='mortar'?.7:.28});
  for(const e of d.splash?live.filter(e=>e.hp>0&&Math.hypot(e.x-target.x,e.z-target.z)<=d.splash):[target])hurt(s,e,d.damage);
  if(d.splash)s.effects.push({kind:'blast',x:target.x,z:target.z,radius:d.splash,at:s.elapsed+.4,duration:.8});p.cooldown=d.interval;
 }
 for(const e of live){
  if(e.hp<=0)continue;e.cooldown=Math.max(0,e.cooldown-dt);e.moving=false;e.attacking=false;
  e.velocity=Math.min(e.speed,(e.velocity||0)+dt*e.speed*3);let budget=e.velocity*dt,travelled=0;const radius=e.kind==='brute'?.24:.18;
  // Consume the remaining distance at each waypoint: no one-frame stop at every tile.
  for(let hop=0;hop<5&&budget>1e-7;hop++){
   if(!e.next)e.next=f.next.get(key(Math.round(e.x),Math.round(e.z)));if(!e.next)break;
   const obstacle=f.occupied.get(key(e.next.x,e.next.z)),dx=e.next.x-e.x,dz=e.next.z-e.z,d=Math.hypot(dx,dz);

   if(obstacle&&obstacle.hp>0&&d<1.05){if(!turnToTravel(e,dx,dz,dt,7)){e.velocity=0;break;}e.attacking=true;if(e.attackTarget!==obstacle.id){e.attackTarget=obstacle.id;e.cooldown=Math.max(e.cooldown,.36);}e.velocity=0;if(!e.cooldown){obstacle.hp=Math.max(0,obstacle.hp-e.damage);e.cooldown=e.interval;s.effects.push({kind:'clash',x:e.next.x,z:e.next.z,at:s.elapsed,duration:.25});}break;}
   if(!e.waypoint){const lane=(e.id%3-1)*.18,candidate={x:e.next.x-(dz/(d||1))*lane,z:e.next.z+(dx/(d||1))*lane};e.waypoint=walkable(candidate,f.occupied,radius)?candidate:{...e.next};}
   const wx=e.waypoint.x-e.x,wz=e.waypoint.z-e.z,wd=Math.hypot(wx,wz);
   let move=Math.min(wd,budget);
   // Followers keep their distance; separate lanes give arriving groups some width.
   for(const other of live){if(other===e||other.hp<=0)continue;const rx=other.x-e.x,rz=other.z-e.z,ahead=(rx*wx+rz*wz)/(wd||1),side=Math.abs(rx*wz-rz*wx)/(wd||1);const spacing=radius+(other.kind==='brute'?.24:.18);if(ahead>0&&ahead<spacing+.32&&side<spacing*.85)move=Math.min(move,Math.max(0,ahead-spacing)*.9);}
   let candidate={x:e.x+wx/(wd||1)*move,z:e.z+wz/(wd||1)*move};
   const safe=q=>walkable(q,f.occupied,radius)&&live.every(o=>o===e||o.hp<=0||Math.hypot(q.x-o.x,q.z-o.z)>=Math.min(radius+(o.kind==='brute'?.24:.18),Math.hypot(e.x-o.x,e.z-o.z))-.000001);
   if(!safe(candidate)){move=0;candidate={x:e.x,z:e.z};}
   if(move<dt*.04&&!e.attacking){
    let best=null;for(const turn of [Math.PI/3,-Math.PI/3,Math.PI/2,-Math.PI/2]){const step=Math.min(budget,e.speed*dt*.55),q={x:e.x+(wx*Math.cos(turn)-wz*Math.sin(turn))/(wd||1)*step,z:e.z+(wx*Math.sin(turn)+wz*Math.cos(turn))/(wd||1)*step};if(!safe(q))continue;const clearance=live.reduce((v,o)=>v+(o!==e&&Math.hypot(e.x-o.x,e.z-o.z)<.9?Math.hypot(q.x-o.x,q.z-o.z)-Math.hypot(e.x-o.x,e.z-o.z):0),0),score=clearance*2+(wd-Math.hypot(q.x-e.waypoint.x,q.z-e.waypoint.z));if(!best||score>best.score)best={q,score};}if(best&&best.score>0){candidate=best.q;move=Math.hypot(candidate.x-e.x,candidate.z-e.z);}
   }
   if(move<1e-7){e.velocity=Math.max(0,e.velocity-dt*e.speed*4);break;}
   if(!turnToTravel(e,candidate.x-e.x,candidate.z-e.z,dt,7)){e.velocity=Math.min(e.velocity,e.speed*.2);break;}
   e.x=candidate.x;e.z=candidate.z;budget-=move;travelled+=move;
   if(Math.hypot(e.x-e.waypoint.x,e.z-e.waypoint.z)<1e-5){const cell=e.next;e.next=f.next.get(key(cell.x,cell.z));e.waypoint=null;}else break;
  }
  e.walkDistance=(e.walkDistance||0)+travelled;e.moving=travelled>1e-6;e.motionBlend=(e.motionBlend||0)+((e.moving?clamp(travelled/dt/(e.speed*.65),0,1):0)-(e.motionBlend||0))*(1-Math.exp(-dt*14));if(!e.attacking)e.attackTarget=null;if(e.kind!=='wolf')updateFootContacts(e,{stride:.65,scale:e.kind==='brute'?1.03:.76,width:e.kind==='brute'?.22:.18,length:.249});
 }

 const castle=s.structures.find(p=>p.id===s.castleId);
 if(castle.hp<=0||s.elapsed>=120)s.phase='lost';else if(s.enemies.every(e=>e.hp<=0))s.phase='won';
 if(s.target!==null&&!s.enemies.some(e=>e.id===s.target&&e.hp>0))s.target=null;
 return s;
}
export function settleSiege(state){
 const s=state.siege;if(s?.phase!=='won'||s.reward!==null)return;
 state.siegeCleared??=[];const first=!state.siegeCleared.includes(s.tier),tier=SIEGE_TIERS[s.tier];s.reward={gold:first?tier.gold:0,wood:first?tier.wood:0,aether:first?tier.aether:0};
 if(first){state.siegeCleared.push(s.tier);for(const [k,v]of Object.entries(s.reward))state[k]+=v;}
}
export function restoreSiege(raw,state){
 if(!raw||raw.version!==1||!['active','won','lost'].includes(raw.phase)||!SIEGE_TIERS[raw.tier]||!Number.isInteger(raw.tier)||!Number.isFinite(raw.elapsed)||raw.elapsed<0||raw.elapsed>121||!Array.isArray(raw.enemies)||!Array.isArray(raw.structures))return null;
 // Rebuild trusted stats from the village, accepting only bounded progress values.
 let s;try{s=createSiege({...state,siegeCleared:[0,1,2]},raw.tier);}catch{return null;}
 if(raw.enemies.length!==s.enemies.length||raw.structures.length!==s.structures.length)return null;
 const num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
 for(const p of s.structures){const r=raw.structures.find(q=>q.id===p.id);if(!r||r.kind!==p.kind||r.x!==p.x||r.z!==p.z||r.rotation!==p.rotation||!num(r.hp,0,p.maxHp)||!num(r.cooldown,0,4))return null;p.hp=r.hp;p.cooldown=r.cooldown;}
 for(const e of s.enemies){const r=raw.enemies.find(q=>q.id===e.id);if(!r||r.kind!==e.kind||!num(r.hp,0,e.maxHp)||!num(r.x,GRID_MIN,GRID_MAX)||!num(r.z,GRID_MIN,GRID_MAX)||!num(r.cooldown,0,2))return null;Object.assign(e,{x:r.x,z:r.z,hp:r.hp,cooldown:r.cooldown});if(r.next&&Number.isInteger(r.next.x)&&Number.isInteger(r.next.z)&&num(r.next.x,GRID_MIN,GRID_MAX-1)&&num(r.next.z,GRID_MIN,GRID_MAX-1)&&Math.hypot(r.next.x-r.x,r.next.z-r.z)<1.5)e.next={x:r.next.x,z:r.next.z};if(e.next&&r.waypoint&&num(r.waypoint.x,GRID_MIN,GRID_MAX)&&num(r.waypoint.z,GRID_MIN,GRID_MAX)&&Math.hypot(r.waypoint.x-e.next.x,r.waypoint.z-e.next.z)<=.2)e.waypoint={x:r.waypoint.x,z:r.waypoint.z};if(Number.isFinite(r.face)&&Math.abs(r.face)<1000){e.face=r.face;e.dx=Math.cos(r.face);e.dz=Math.sin(r.face);}e.walkDistance=num(r.walkDistance,0,1000)?r.walkDistance:0;}
 const castle=s.structures.find(p=>p.id===s.castleId);if(raw.phase==='won'&&s.enemies.some(e=>e.hp>0)||raw.phase==='active'&&(castle.hp<=0||s.enemies.every(e=>e.hp<=0)||raw.elapsed>=120))return null;
 Object.assign(s,{phase:raw.phase,elapsed:raw.elapsed,wave:Math.min(3,1+Math.floor(raw.elapsed/17)),charges:clamp(Math.floor(Number(raw.charges)||0),0,3),spellCooldown:clamp(Number(raw.spellCooldown)||0,0,5),kills:s.enemies.filter(e=>e.hp===0).length});
 // Loading a completed trial must never pay again, including malformed reward data.
 s.reward=raw.phase==='won'?{gold:0,wood:0,aether:0}:null;return s;
}
