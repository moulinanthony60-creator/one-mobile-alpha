import {forestTrees} from './forest.mjs?v=34';
import {withWallWorksites} from './village-life.mjs?v=34';
import {buildJobs,workerCount} from './builders.mjs?v=34';
import {turnToTravel} from './actor-facing.mjs?v=34';
import {updateFootContacts} from './locomotion.mjs?v=34';
// Continuous, footprint-aware pedestrian traffic. Distances are in world cells.
const key=(x,z)=>x+','+z;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function walkable(p,occupied,radius=.145){
 for(let x=Math.floor(p.x-radius+.5);x<=Math.floor(p.x+radius+.5);x++)for(let z=Math.floor(p.z-radius+.5);z<=Math.floor(p.z+radius+.5);z++)if(occupied.has(key(x,z)))return false;
 return Number.isFinite(p.x)&&Number.isFinite(p.z);
}
function clearSegment(a,b,occupied){const steps=Math.max(1,Math.ceil(distance(a,b)/.08));for(let i=0;i<=steps;i++)if(!walkable(mix(a,b,i/steps),occupied))return false;return true;}
export function smoothRoute(points,occupied=new Set(),lane=.21){
 if(points.length<2)return points.map(p=>({...p}));
 const center=[points[0]];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1],turn=(b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x);
  if(!turn){center.push(b);continue;}
  const start=mix(b,a,.28),end=mix(b,c,.28),curve=[];
  for(let j=0;j<=8;j++){const t=j/8;curve.push(mix(mix(start,b,t),mix(b,end,t),t));}
  if(curve.every(p=>walkable(p,occupied,.17)))center.push(...curve);else center.push(b);
 }
 center.push(points.at(-1));
 const result=center.map((p,i)=>{const a=center[Math.max(0,i-1)],b=center[Math.min(center.length-1,i+1)],d=distance(a,b)||1,offset={x:p.x-(b.z-a.z)/d*lane,z:p.z+(b.x-a.x)/d*lane};return walkable(offset,occupied)?offset:{...p};});
 // A tight corner next to masonry can need the centerline instead of its lane.
 for(let i=1;i<result.length;i++)if(!clearSegment(result[i-1],result[i],occupied)){result[i-1]={...center[i-1]};result[i]={...center[i]};}
 return result;
}
function population(state,streets){
 const result=[];function add(kind,count,preferred,span,speed){const relevant=streets.routes.filter(r=>preferred.includes(r.kind)),pool=relevant.length?relevant:streets.routes;if(!pool.length)return;for(let i=0;i<count;i++)result.push({id:kind+'-'+i,kind,span,preferred,route:pool[i%pool.length],index:result.length,speed:speed*(.91+(i*7%9)*.023)});}
 add('worker',state.progressionVersion?workerCount(state):Math.min(9,Math.max(1,Math.ceil((streets.doors.length-1)/2))),['mine','tree','cottage','mill','forge'],.30,.64);
 if(!state.village.structures.some(p=>p.kind==='camp'&&!p.pending)){
 add('guardian',Math.min(6,Math.ceil(state.troops/4)),['camp','barracks','academy','tower'],.48,.66);
 add('archer',Math.min(4,Math.ceil((state.army?.archers||0)/3))+(state.training?.unit==='archers'?1:0),['archery'],.43,.72);
 add('rider',Math.min(3,Math.ceil((state.army?.cavalry||0)/2)),['stable'],.8,1.25);
 }
 add('scholar',state.village.structures.some(p=>['hall','shrine','academy'].includes(p.kind))?(state.heroes?.nyx?2:1):0,['hall','shrine','academy'],.46,.64);
 if(state.village.structures.some(p=>p.kind==='market'))add('merchant',2,['market','tavern'],.8,.67);
 for(const p of result)if(p.kind==='worker'){const job=buildJobs(state).find(q=>q.worker===Number(p.id.split('-')[1]));p.jobId=job?.id||null;p.jobMode=job?.mode||null;}
 return result;
}
function advancePath(p,budget){let index=p.segment,x=p.x,z=p.z;for(let guard=0;guard<12&&index<p.path.length-1&&budget>1e-9;guard++){
 const target=p.path[index+1],d=Math.hypot(target.x-x,target.z-z);if(d<=budget){x=target.x;z=target.z;budget-=d;index++;}else{x+=(target.x-x)/d*budget;z+=(target.z-z)/d*budget;budget=0;}
 }return {x,z,segment:index};}
export function createVillageLife(){
 let people=[],streets=null,graph=new Map(),clock=null,accumulator=0,workBase=null,workSignature='',workRoads=null;
 function routeBetween(start,end){
  const queue=[{...start,cost:0}],previous=new Map([[key(start.x,start.z),null]]),costs=new Map([[key(start.x,start.z),0]]),target=key(end.x,end.z),roadKeys=new Set(streets.tiles.map(p=>key(p.x,p.z)));
  while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const p=queue.shift(),k=key(p.x,p.z);if(p.cost!==costs.get(k))continue;if(k===target){const out=[];for(let q=k;q;q=previous.get(q)){const [x,z]=q.split(',').map(Number);out.push({x,z});}return out.reverse();}for(const q of graph.get(k)||[]){const k2=key(q.x,q.z),crowd=people.filter(o=>distance(o,q)<.8).length,cost=p.cost+1+(roadKeys.has(k2)?0:1.4)+crowd*2.5;if(cost<(costs.get(k2)??Infinity)){costs.set(k2,cost);previous.set(k2,k);queue.push({...q,cost});}}}return null;
 }
 function nearest(p){const cells=[...graph.keys()].map(k=>{const [x,z]=k.split(',').map(Number);return {x,z};});return cells.reduce((a,b)=>distance(p,a)<distance(p,b)?a:b,cells[0]);}
 function setTrip(p,initial=false){
  const from=nearest(p);if(!from)return;const assigned=p.jobId&&streets.doors.find(d=>d.id===p.jobId);if(assigned&&distance(p,assigned)<.45){p.destination=assigned;p.arrived=true;p.pause=1;p.path=[{x:p.x,z:p.z}];p.segment=0;return;}const available=streets.doors.filter(d=>d.kind!=='wall'),preferred=available.filter(d=>p.preferred.includes(d.kind));const destinations=assigned?[assigned]:(p.trip%3===2?available:[...preferred,...available.filter(d=>!preferred.includes(d.kind))]);
  for(let i=0;i<destinations.length;i++){const door=destinations[(p.index*3+p.trip+i)%destinations.length];if(!assigned&&distance(from,door)<1.2)continue;const route=routeBetween(from,door);if(!route)continue;
   const path=smoothRoute(route,streets.occupied);while(path.length>2&&distance(p,path[1])<1.35&&clearSegment(p,path[1],streets.occupied))path.shift();if(clearSegment(p,path[0],streets.occupied))path.unshift({x:p.x,z:p.z});else continue;
   p.path=path;p.segment=0;p.arrived=false;p.workReady=false;p.destination=door;p.trip++;p.blocked=0;return;
  }
  p.arrived=false;p.pause=initial?.2:1;p.path=[{x:p.x,z:p.z}];p.segment=0;
 }
 function sync(state,roads){
  const signature=buildJobs(state).map(q=>q.id).join('|');if(workBase!==roads||workSignature!==signature){workBase=roads;workSignature=signature;workRoads=withWallWorksites(state.village.structures,buildJobs(state),roads,forestTrees(state.village));}roads=workRoads;
  if(streets!==roads){const layoutChanged=streets?.occupied!==roads.occupied;streets=roads;const cells=new Map(roads.tiles.map(p=>[key(p.x,p.z),p]));for(const p of roads.tiles)for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+dx,z:p.z+dz};if(q.x>=-40&&q.x<=40&&q.z>=-40&&q.z<=40&&!roads.occupied.has(key(q.x,q.z)))cells.set(key(q.x,q.z),q);}graph=new Map([...cells.keys()].map(k=>[k,[]]));for(const p of cells.values())for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+dx,z:p.z+dz};if(graph.has(key(q.x,q.z)))graph.get(key(p.x,p.z)).push(q);}for(const p of people){if(!walkable(p,roads.occupied)){const q=nearest(p);if(q){Object.assign(p,q);p.previousPose=null;}}if(layoutChanged)setTrip(p,true);}}
  const old=new Map(people.map(p=>[p.id,p])),spawned=[];people=population(state,roads).map(spec=>{
   const prior=old.get(spec.id);if(prior){if(prior.jobId!==spec.jobId){prior.jobId=spec.jobId;prior.pause=0;setTrip(prior);}spawned.push(prior);return Object.assign(prior,{speed:spec.speed,jobMode:spec.jobMode});}
   const path=smoothRoute(spec.route.points,roads.occupied);let start=path[0];
   for(let i=0;i<path.length;i++){const candidate=path[(spec.index*7+i)%path.length];if(spawned.every(p=>distance(p,candidate)>.4)){start=candidate;break;}}
   const p={...spec,...start,dx:1,dz:0,face:0,velocity:0,walkDistance:spec.index*.13,trip:spec.index,pause:.15*(spec.index%5),blocked:0,path:[],segment:0,moving:false,motionBlend:0,activityTime:spec.index*.47};setTrip(p,true);spawned.push(p);return p;
  });
 }
 function step(dt){
  for(const p of people){
   p.previousPose={x:p.x,z:p.z,face:p.face,walkDistance:p.walkDistance,motionBlend:p.motionBlend,activityTime:p.activityTime,workTime:p.workTime||0};
   p.workTime=p.arrived&&p.workReady&&!p.moving&&p.pause>0?(p.workTime||0)+dt:0;p.activityTime=(p.activityTime||0)+dt;p.motionBlend=(p.motionBlend||0)+((p.moving&&p.pause<=0?clamp((p.actualVelocity||0)/(p.speed*.65),0,1):0)-(p.motionBlend||0))*(1-Math.exp(-dt*12));
   if(p.pause>0){if(p.arrived&&p.destination?.facing){const target=p.destination.facing;p.workReady=turnToTravel(p,target.x-p.x,target.z-p.z,dt,3.5);updateFootContacts(p,{scale:p.kind==='guardian'?.76:.70});}p.pause=Math.max(0,p.pause-dt);p.velocity=0;p.moving=false;if(!p.pause)setTrip(p);continue;}
   if(p.segment>=p.path.length-1){p.arrived=!!p.destination&&distance(p,p.destination)<.45;p.pause=1.5+(p.index+p.trip)%5*.55;p.velocity=0;p.moving=false;continue;}
   const end=p.path.at(-1),remaining=distance(p,end),cruise=p.speed*Math.min(1,Math.sqrt(remaining/.7));
   // Right-hand lanes let opposing walkers pass; followers slow before they overlap.
   let wanted=cruise;const ahead=advancePath(p,.45),len=distance(p,ahead)||1,dx=(ahead.x-p.x)/len,dz=(ahead.z-p.z)/len;
   for(const q of people){if(p===q)continue;const rx=q.x-p.x,rz=q.z-p.z,forward=rx*dx+rz*dz,lateral=Math.abs(rx*dz-rz*dx);if(forward>0&&forward<.65&&lateral<.27)wanted=Math.min(wanted,cruise*clamp((forward-.29)/.36,0,1));}
   p.velocity+=clamp(wanted-p.velocity,-dt*2.9,dt*1.7);
   let next=advancePath(p,p.velocity*dt),budget=p.velocity*dt;
   for(let attempt=0;attempt<8;attempt++){
    const unsafe=!walkable(next,streets.occupied)||people.some(q=>q!==p&&distance(next,q)<.285&&distance(next,q)<distance(p,q)-.00001);
    if(!unsafe)break;budget*=.5;next=advancePath(p,budget);
   }
   // Make a continuous side-step when yielding alone cannot clear a crossing.
   if(!p.avoidance&&distance(p,next)<dt*.08&&p.blocked>.4){
    const target=p.path[p.segment+1],near=people.filter(q=>q!==p&&distance(p,q)<.85),safe=q=>walkable(q,streets.occupied)&&near.every(o=>distance(q,o)>=Math.min(.3,distance(p,o))-.000001);
    let best=null;for(const angle of [Math.PI/2,-Math.PI/2,Math.PI/4,-Math.PI/4,Math.PI*.75,-Math.PI*.75,Math.PI]){const q={x:p.x+(dx*Math.cos(angle)-dz*Math.sin(angle))*p.speed*dt*.65,z:p.z+(dx*Math.sin(angle)+dz*Math.cos(angle))*p.speed*dt*.65,segment:p.segment};if(!safe(q))continue;const score=(distance(p,target)-distance(q,target))*.35+near.reduce((sum,o)=>sum+(distance(q,o)-distance(p,o))/(distance(p,o)+.05),0);if(!best||score>best.score)best={q,score};}if(best&&best.score>0){next=best.q;const d=distance(p,next)||1;p.avoidance={x:p.x+(next.x-p.x)/d*.36,z:p.z+(next.z-p.z)/d*.36,until:p.activityTime+1.1};}
   }
   if(p.avoidance){const target=p.avoidance,d=distance(p,target),amount=Math.min(d,p.speed*dt*.65),q={x:p.x+(target.x-p.x)/(d||1)*amount,z:p.z+(target.z-p.z)/(d||1)*amount,segment:p.segment};if(d<.035||p.activityTime>target.until)p.avoidance=null;else if(walkable(q,streets.occupied)&&people.every(o=>o===p||distance(q,o)>=Math.min(.285,distance(p,o))-.000001))next=q;else p.avoidance=null;}
   const aligned=turnToTravel(p,next.x-p.x,next.z-p.z,dt);if(!aligned){next={x:p.x,z:p.z,segment:p.segment};p.velocity=Math.min(p.velocity,p.speed*.2);}
   const moved=distance(p,next);p.actualVelocity=moved/dt;p.moving=moved>1e-6;
   if(p.moving){p.walkDistance+=moved;if(moved>dt*.08)p.blocked=0;else p.blocked+=dt;}
   else{p.velocity=0;if(aligned)p.blocked+=dt;}
   Object.assign(p,next);updateFootContacts(p,{scale:p.kind==='guardian'?.76:.70});
   // A visitor gives way, then chooses another destination instead of remaining stuck.
   if(p.blocked>2.5){p.trip++;setTrip(p);p.pause=.25+(p.index%4)*.12;}
   if(remaining<.035){p.segment=p.path.length-1;}
  }
 }
 function sample(state,roads,time){sync(state,roads);if(clock===null||time<clock){clock=time;accumulator=0;}const elapsed=Math.min(.25,Math.max(0,(time-clock)/1000));clock=time;accumulator+=elapsed;while(accumulator>=1/60){step(1/60);accumulator-=1/60;}const alpha=accumulator*60;return people.map(p=>interpolateResident(p,alpha));}
 return {sample,step,sync,get people(){return people;}};
}
// Heading hysteresis prevents front/back flicker around a diagonal.
export function walkFrame(person){const forward=person.dx+person.dz;if(forward<-.15)person.back=true;else if(forward>.15)person.back=false;const horizontal=person.dx-person.dz;if(Math.abs(horizontal)>.15)person.flip=horizontal<0;return {row:(person.kind==='guardian'?2:0)+(person.back?1:0),column:person.moving?Math.floor(person.walkDistance/.19)%4:1,flip:!!person.flip};}

// Rendering interpolates fixed simulation steps, including the gait and facing.
// It never writes interpolated coordinates into pathfinding or foot contacts.
export function interpolateResident(p,alpha){
 const a=p.previousPose;if(!a)return p;const t=Math.max(0,Math.min(1,alpha)),mix=(x,y)=>x+(y-x)*t;
 const delta=Math.atan2(Math.sin(p.face-a.face),Math.cos(p.face-a.face)),face=a.face+delta*t;
 return {...p,x:mix(a.x,p.x),z:mix(a.z,p.z),face,dx:Math.cos(face),dz:Math.sin(face),walkDistance:mix(a.walkDistance,p.walkDistance),motionBlend:mix(a.motionBlend,p.motionBlend),activityTime:mix(a.activityTime,p.activityTime),workTime:mix(a.workTime||0,p.workTime||0)};
}
