// Navigation for the private, extended training field. Campaigns use their
// historical rules. Reachable buildings always take precedence over walls.
import {turnTo,angleDelta} from './battle-aim.mjs?v=3';
const CELL=.5,RADIUS=.10,EPS=1e-7;
const maps=new WeakMap();
const directions=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];
const rect=b=>({left:b.x-(b.collision?.width||1)/2,right:b.x+(b.collision?.width||1)/2,top:b.y-(b.collision?.depth||1)/2,bottom:b.y+(b.collision?.depth||1)/2});
export function distanceToBuilding(p,b){const r=rect(b);return Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));}
function intersects(a,z,r,padding=RADIUS){
 let lo=0,hi=1;
 for(const [v,d,min,max] of [[a.x,z.x-a.x,r.left-padding,r.right+padding],[a.y,z.y-a.y,r.top-padding,r.bottom+padding]]){
  if(Math.abs(d)<EPS){if(v<=min+EPS||v>=max-EPS)return false;continue;}
  let t0=(min-v)/d,t1=(max-v)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>=hi-EPS)return false;
 }
 return hi>EPS&&lo<1-EPS;
}
export function clearSegment(a,z,buildings,ignore=null,padding=RADIUS){
 return !buildings.some(b=>b.hp>0&&b.id!==ignore&&intersects(a,z,rect(b),padding));
}
export function canStrike(u,b,spec,buildings){
 if(!b||b.hp<=0||distanceToBuilding(u,b)>spec.range+.015)return false;
 if(spec.range>2)return true; // Ranged units can fire over walls.
 const r=rect(b),aim={x:Math.max(r.left,Math.min(r.right,u.x)),y:Math.max(r.top,Math.min(r.bottom,u.y))};
 return clearSegment(u,aim,buildings,b.id,.015);
}
export function hasCombatRoom(battle,u){
 return !(battle.units||[]).some(v=>v!==u&&v.hp>0&&['aim','windup','recover'].includes(v.action)&&Math.hypot(u.x-v.x,u.y-v.y)<.62);
}
function gridFor(battle){
 const revision=battle.buildings.map(b=>b.hp>0?'1':'0').join('');let map=maps.get(battle);
 if(map?.revision===revision)return map;
 const width=Math.ceil(battle.field.width/CELL),height=Math.ceil(battle.field.height/CELL),solid=new Uint8Array(width*height),walls=Array.from({length:width*height},()=>[]),live=battle.buildings.filter(b=>b.hp>0),byId=new Map(live.map(b=>[b.id,b]));
 const point=n=>({x:(n%width+.5)*CELL,y:(Math.floor(n/width)+.5)*CELL});
 for(const b of live){const r=rect(b);
  for(let y=Math.max(0,Math.floor((r.top-RADIUS)/CELL));y<Math.min(height,Math.ceil((r.bottom+RADIUS)/CELL));y++)for(let x=Math.max(0,Math.floor((r.left-RADIUS)/CELL));x<Math.min(width,Math.ceil((r.right+RADIUS)/CELL));x++){
   const n=y*width+x,p=point(n);if(p.x<=r.left-RADIUS||p.x>=r.right+RADIUS||p.y<=r.top-RADIUS||p.y>=r.bottom+RADIUS)continue;
   if(b.kind==='wall')walls[n].push(b);else solid[n]=1;
  }
 }
 map={revision,width,height,solid,walls,live,byId,point,goals:new Map()};maps.set(battle,map);return map;
}
class Heap{
 constructor(){this.a=[];}
 push(n,cost){const v={n,cost};let i=this.a.length;this.a.push(v);while(i){const parent=(i-1)>>1;if(this.a[parent].cost<=cost)break;this.a[i]=this.a[parent];i=parent;}this.a[i]=v;}
 pop(){const root=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let child=i*2+1;if(child+1<this.a.length&&this.a[child+1].cost<this.a[child].cost)child++;if(this.a[child].cost>=last.cost)break;this.a[i]=this.a[child];i=child;}this.a[i]=last;}return root;}
}
function goalsFor(map,spec,target=null){
 const key=target?'wall:'+target.id+':'+spec.range:'buildings:'+spec.range+':'+Boolean(spec.priority);
 if(map.goals.has(key))return map.goals.get(key);
 const goals=new Map(),targets=target?[target]:map.live.filter(b=>b.kind!=='wall');
 for(const b of targets){const r=rect(b),reach=spec.range+.01;
  for(let y=Math.max(0,Math.floor((r.top-reach)/CELL));y<Math.min(map.height,Math.ceil((r.bottom+reach)/CELL));y++)for(let x=Math.max(0,Math.floor((r.left-reach)/CELL));x<Math.min(map.width,Math.ceil((r.right+reach)/CELL));x++){
   const n=y*map.width+x;if(map.solid[n]||map.walls[n].length)continue;
   const p=map.point(n);if(!canStrike(p,b,spec,map.live))continue;
   const old=goals.get(n);if(!old||Boolean(spec.priority&&b.damage)>Boolean(spec.priority&&old.damage)||distanceToBuilding(p,b)<distanceToBuilding(p,old))goals.set(n,b);
  }
 }
 map.goals.set(key,goals);return goals;
}
function search(u,map,goals,spec,breach=false){
 const sx=Math.max(0,Math.min(map.width-1,Math.floor(u.x/CELL))),sy=Math.max(0,Math.min(map.height-1,Math.floor(u.y/CELL))),start=sy*map.width+sx;
 const dist=new Float64Array(map.width*map.height);dist.fill(Infinity);dist[start]=0;
 const parents=new Int32Array(dist.length);parents.fill(-1);const queue=new Heap();queue.push(start,0);
 while(queue.a.length){const current=queue.pop(),n=current.n;if(current.cost>dist[n]+EPS)continue;
  // A goal at the starting cell must also be in range from the exact position.
  if(goals.has(n)&&(n!==start||canStrike(u,goals.get(n),spec,map.live))){
   const path=[];for(let at=n;at!==start&&at!==-1;at=parents[at])path.push(at);path.reverse();return {path,target:goals.get(n),cost:dist[n]};
  }
  const x=n%map.width,y=Math.floor(n/map.width);
  const blocked=k=>map.solid[k]||(!breach&&map.walls[k].length);
  for(const [dx,dy,length] of directions){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=map.width||ny>=map.height)continue;const next=ny*map.width+nx;if(blocked(next))continue;
   // Do not squeeze diagonally through the corner between two obstacles.
   if(dx&&dy&&(blocked(y*map.width+nx)||blocked(ny*map.width+x)))continue;
   if(n===start&&!clearSegment(u,map.point(next),breach?map.live.filter(b=>b.kind!=='wall'):map.live))continue;
   let cost=dist[n]+length*CELL;
   if(breach)for(const wall of map.walls[next])if(!map.walls[n].some(w=>w.id===wall.id))cost+=Math.ceil(wall.hp/spec.damage)*spec.rate*spec.speed+2;
   if(cost>=dist[next]-EPS)continue;dist[next]=cost;parents[next]=n;queue.push(next,cost);
  }
 }
 return null;
}
function smooth(u,points,live){
 const path=[];let from=u,index=0;
 while(index<points.length){let next=index;for(let j=index+1;j<points.length;j++){if(!clearSegment(from,points[j],live))break;next=j;}path.push(points[next]);from=points[next];index=next+1;}
 return path;
}
export function planTrainingAttack(battle,u,spec){
 const map=gridFor(battle),allGoals=goalsFor(map,spec);
 const reservations=(battle.units||[]).filter(v=>v!==u&&v.hp>0).map(v=>v.path?.at(-1)||v);
 const free=point=>!reservations.some(v=>Math.hypot(v.x-point.x,v.y-point.y)<.70);
 const filtered=new Map([...allGoals].filter(([cell])=>free(map.point(cell))));
 const goals=filtered.size?filtered:allGoals;
 const immediate=map.live.filter(b=>b.kind!=='wall'&&canStrike(u,b,spec,map.live)).sort((a,b)=>distanceToBuilding(u,a)-distanceToBuilding(u,b))[0];
 if(immediate&&free(u))return {target:immediate,objective:immediate.id,path:[],revision:map.revision};
 const open=search(u,map,goals,spec);
 if(open)return {target:open.target,objective:open.target.id,path:smooth(u,open.path.map(map.point),map.live),revision:map.revision};
 // Only when every building is unreachable, estimate the route through walls
 // and attack its first obstruction. Never choose an unrelated nearby wall.
 const blocked=search(u,map,goals,spec,true);
 if(blocked){for(const cell of blocked.path){const wall=map.walls[cell][0];if(!wall)continue;
   const approach=search(u,map,goalsFor(map,spec,wall),spec);
   if(approach)return {target:wall,objective:blocked.target.id,path:smooth(u,approach.path.map(map.point),map.live),revision:map.revision};
   break;
  }}
 return {target:null,objective:null,path:[],revision:map.revision};
}
export function advanceTrainingUnit(battle,u,spec,dt){
 const map=gridFor(battle);let target=map.byId.get(u.target);
 const room=hasCombatRoom(battle,u);
 const changed=u.navigationRevision!==map.revision;
 if(changed||!target||(!u.path?.length&&(!canStrike(u,target,spec,map.live)||!room))){
  const plan=planTrainingAttack(battle,u,spec);target=plan.target;u.target=target?.id||null;u.objective=plan.objective;u.path=plan.path;u.navigationRevision=plan.revision;u.repath=.9+(u.id%5)*.07;
 }
 if(!target||(room&&canStrike(u,target,spec,map.live))){u.speed=0;u.action=target?'aim':'idle';return target;}
 const waypoint=u.path?.[0];if(!waypoint)return target;
 const angle=Math.atan2(waypoint.y-u.y,waypoint.x-u.x);
 turnTo(u,angle,dt,5.5);
 if(Math.abs(angleDelta(angle,u.facing))>.32){u.speed=0;u.action='turn';return target;}
 // Acceleration and braking are part of the simulation, not a visual slide.
 const remainingRoute=Math.hypot(waypoint.x-u.x,waypoint.y-u.y)+(u.path.length>1?1:0);
 const desired=Math.min(spec.speed,Math.sqrt(Math.max(.03,2*7*remainingRoute)));
 u.speed=Math.min(desired,(u.speed||0)+7*dt);u.action='walk';
 let remaining=u.speed*dt;
 while(remaining>EPS&&u.path?.length){const next=u.path[0],distance=Math.hypot(next.x-u.x,next.y-u.y),step=Math.min(distance,remaining);
  if(distance<=EPS){u.path.shift();continue;}
  const end={x:u.x+(next.x-u.x)/distance*step,y:u.y+(next.y-u.y)/distance*step};
  if(!clearSegment(u,end,map.live)){u.repath=0;u.path=[];break;}
  u.x=end.x;u.y=end.y;remaining-=step;if(distance<=step+EPS)u.path.shift();
 }
 return target;
}

// A small, simultaneous local separation prevents a whole squad occupying the
// same waypoint. It never pushes a troop through a footprint or outside play.
export function spaceTrainingUnits(battle,dt){
 const units=battle.units.filter(u=>u.hp>0),push=new Map(units.map(u=>[u.id,{x:0,y:0}])),gap=.72;
 for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
  const a=units[i],b=units[j];let dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d>=gap)continue;
  if(d<.001){const angle=((a.id*37+b.id*19)%360)*Math.PI/180;dx=Math.cos(angle);dy=Math.sin(angle);d=1;}else{dx/=d;dy/=d;}
  const amount=(gap-Math.hypot(a.x-b.x,a.y-b.y))*.55,pa=push.get(a.id),pb=push.get(b.id);pa.x+=dx*amount;pa.y+=dy*amount;pb.x-=dx*amount;pb.y-=dy*amount;
 }
 for(const u of units){if(u.action&&u.action!=='walk')continue;const force=push.get(u.id),length=Math.hypot(force.x,force.y);if(length<1e-6)continue;const factor=Math.min(length,dt*.60)/length;
  const end={x:Math.max(.15,Math.min(battle.field.width-.15,u.x+force.x*factor)),y:Math.max(.15,Math.min(battle.field.height-.15,u.y+force.y*factor))};
  if(clearSegment(u,end,battle.buildings)){u.x=end.x;u.y=end.y;}
 }
}
