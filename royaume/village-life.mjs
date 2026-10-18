import {treeRadius} from './forest.mjs?v=34';
import {footprint,GRID_MIN,GRID_MAX} from './village-state.mjs?v=34';
const key=(x,z)=>x+','+z;
const directions=[[1,0],[0,1],[-1,0],[0,-1]];
const inside=(x,z)=>x>=GRID_MIN&&x<GRID_MAX&&z>=GRID_MIN&&z<GRID_MAX;
export function buildStreets(plots,trees=[]){
 const occupied=new Set();for(const t of trees){const r=treeRadius(t);for(let x=Math.ceil(t.x-r-.5);x<=Math.floor(t.x+r+.5);x++)for(let z=Math.ceil(t.z-r-.5);z<=Math.floor(t.z+r+.5);z++)occupied.add(key(x,z));}for(const p of plots){const f=footprint(p.kind,p.rotation);for(let x=p.x;x<p.x+f.w;x++)for(let z=p.z;z<p.z+f.d;z++)occupied.add(key(x,z));}
 const free=(x,z)=>inside(x,z)&&!occupied.has(key(x,z));
 function entrance(p){const f=footprint(p.kind,p.rotation),candidates=[];for(let x=p.x;x<p.x+f.w;x++)candidates.push({x,z:p.z+f.d});for(let z=p.z;z<p.z+f.d;z++)candidates.push({x:p.x+f.w,z});for(let x=p.x;x<p.x+f.w;x++)candidates.push({x,z:p.z-1});for(let z=p.z;z<p.z+f.d;z++)candidates.push({x:p.x-1,z});return candidates.find(q=>free(q.x,q.z));}
 const doors=plots.filter(p=>p.kind!=='wall').map(p=>{const q=entrance(p);const f=footprint(p.kind,p.rotation);return q?{...q,id:p.id,kind:p.kind,facing:{x:p.x+(f.w-1)/2,z:p.z+(f.d-1)/2}}:null;}).filter(Boolean);
 const remaining=[...doors].sort((a,b)=>(b.kind==='castle')-(a.kind==='castle')),tree=[],routes=[],tiles=new Map();if(remaining.length)tree.push(remaining.shift());
 function path(start,end){const queue=[start],previous=new Map([[key(start.x,start.z),null]]);let target=null;for(let head=0;head<queue.length;head++){const p=queue[head];if(p.x===end.x&&p.z===end.z){target=key(p.x,p.z);break;}const dirs=[...directions].sort((a,b)=>(Math.abs(p.x+a[0]-end.x)+Math.abs(p.z+a[1]-end.z))-(Math.abs(p.x+b[0]-end.x)+Math.abs(p.z+b[1]-end.z)));for(const [dx,dz]of dirs){const x=p.x+dx,z=p.z+dz,k=key(x,z);if(free(x,z)&&!previous.has(k)){previous.set(k,key(p.x,p.z));queue.push({x,z});}}}
  if(!target)return null;const out=[];while(target){const [x,z]=target.split(',').map(Number);out.push({x,z});target=previous.get(target);}return out.reverse();
 }
 // Bound work in very large player cities. All buildings remain fully interactive.
 while(remaining.length&&routes.length<90){let best=null;for(const p of remaining)for(const q of tree){const d=Math.abs(p.x-q.x)+Math.abs(p.z-q.z);if(!best||d<best.d)best={p,q,d};}remaining.splice(remaining.indexOf(best.p),1);const points=path(best.p,best.q);tree.push(best.p);if(!points||points.length<2)continue;routes.push({from:best.p.id,to:best.q.id,kind:best.p.kind,points});for(const p of points)tiles.set(key(p.x,p.z),p);}
 return {routes,tiles:[...tiles.values()],doors,occupied};
}
export function sampleWalk(points,time,phase=0,speed=.00055){
 const length=points.length-1;if(length<=0)return {...points[0],dx:1,dz:0};const cycle=(Math.max(0,time)*speed+phase)%(length*2),back=cycle>length,u=back?length*2-cycle:cycle,i=Math.min(length-1,Math.floor(u)),f=u-i,a=points[i],b=points[i+1];return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,dx:(b.x-a.x)*(back?-1:1),dz:(b.z-a.z)*(back?-1:1)};
}
export function villageResidents(state,streets,time){
 if(!streets.routes.length)return [];const people=[],roads=streets.routes;
 function add(kind,count,preferred,span){const relevant=roads.filter(r=>preferred.includes(r.kind)),pool=relevant.length?relevant:roads;for(let i=0;i<count;i++){const route=pool[i%pool.length],phase=i*5.17+kind.length*.71,p=sampleWalk(route.points,time,phase,kind==='rider'?.0008:.00055);people.push({...p,kind,span,phase});}}
 add('worker',Math.min(12,Math.max(4,Math.floor(streets.doors.length/2))),['mine','cottage','mill','forge'],.36);
 add('guardian',Math.min(6,Math.ceil(state.troops/4)),['camp','barracks','academy','tower'],.43);
 add('archer',Math.min(4,Math.ceil((state.army?.archers||0)/3))+(state.training?.unit==='archers'?1:0),['archery'],.39);
 add('rider',Math.min(3,Math.ceil((state.army?.cavalry||0)/2)),['stable'],.78);
 add('scholar',state.heroes?.nyx?2:1,['hall','shrine','academy'],.43);
 if(state.village.structures.some(p=>p.kind==='market'))add('merchant',2,['market','tavern'],.8);
 return people;
}

// Temporary walking access to active wall sites; it never paints permanent roads.
export function withWallWorksites(plots,jobs,roads,trees=[]){
 const walls=jobs.map(q=>q.mode==='clearing'?trees.find(t=>t.id===q.id):plots.find(p=>p.id===q.id&&p.kind==='wall')).filter(Boolean);if(!walls.length)return roads;
 const routes=[...roads.routes],doors=[...roads.doors],tiles=new Map(roads.tiles.map(p=>[key(p.x,p.z),p]));
 if(!tiles.size)for(const d of roads.doors)tiles.set(key(d.x,d.z),{x:d.x,z:d.z});
 for(const wall of walls){
  const candidates=(wall.clearable?[2,3,4]:[1]).flatMap(r=>directions.map(([dx,dz])=>({x:Math.round(wall.x)+dx*r,z:Math.round(wall.z)+dz*r}))).filter(q=>inside(q.x,q.z)&&!roads.occupied.has(key(q.x,q.z))),queue=[...candidates],previous=new Map(candidates.map(p=>[key(p.x,p.z),null]));let target=null;
  for(let i=0;i<queue.length;i++){const p=queue[i],k=key(p.x,p.z);if(tiles.has(k)){target=k;break;}for(const [dx,dz]of directions){const q={x:p.x+dx,z:p.z+dz},n=key(q.x,q.z);if(inside(q.x,q.z)&&!roads.occupied.has(n)&&!previous.has(n)){previous.set(n,k);queue.push(q);}}}
  if(!target)continue;const points=[];for(let k=target;k!==null;k=previous.get(k)){const [x,z]=k.split(',').map(Number);points.push({x,z});}
  const end=points.at(-1),door={...end,id:wall.id,kind:'wall',facing:{x:wall.x,z:wall.z}};doors.push(door);for(const p of points)tiles.set(key(p.x,p.z),p);if(points.length>1)routes.push({from:'work-access',to:wall.id,kind:'wall',points});
 }
 return {...roads,routes,doors,tiles:[...tiles.values()]};
}
