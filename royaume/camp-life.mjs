import {TRAINING,TRAINING_UNITS} from './barracks.mjs?v=36';
import {armyHousing} from './army-camps.mjs?v=34';
import {footprint} from './village-state.mjs?v=34';
import {walkable} from './village-motion.mjs?v=34';

// Small groups occupy free ground. Resting sprites breathe in place rather
// than pretending to walk, so their feet never drift across the camp.
export function campResidents(state,roads,time=0){
 const result=[];
 for(const camp of armyHousing(state).camps){
  const p=camp.plot,f=footprint('camp',p.rotation),candidates=[];
  const fire={x:p.x+f.w+.8,z:p.z+f.d*.5},rack={x:p.x+f.w*.4,z:p.z+f.d+.8};
  for(const row of [0,1,2])for(let i=0;i<5;i++){
   const u=-.35+i*1.04+Math.sin(i*3.1+row)*.16;
   candidates.push({x:p.x+u,z:p.z+f.d+.85+row*1.08+Math.sin(i*1.7)*.22,zone:'yard'});
  }
  for(const a of [-1.2,-.3,.6,1.45,2.3,3.1,4])candidates.push({x:fire.x+Math.cos(a)*1.5,z:fire.z+Math.sin(a)*1.5,zone:'fire'});
  const safe=candidates.filter(q=>walkable(q,roads.occupied,.36)&&!roads.tiles.some(r=>Math.hypot(q.x-r.x,q.z-r.z)<.65)&&Math.hypot(q.x-fire.x,q.z-fire.z)>.95&&Math.hypot(q.x-rack.x,q.z-rack.z)>.75);
  const remaining={...camp.units},kinds=[],indices=Object.fromEntries(TRAINING_UNITS.map(k=>[k,0]));
  // Ten representatives maximum. The interface keeps exact totals.
  while(kinds.length<10&&Object.values(remaining).some(n=>n>0))for(const unit of TRAINING_UNITS)if(remaining[unit]>0&&kinds.length<10){kinds.push(unit);remaining[unit]--;}
  for(const [i,unit]of kinds.entries()){
   const mounted=TRAINING[unit].actor==='rider',choices=[...safe].sort((a,b)=>mounted?b.z-a.z:(i%3===1?Number(b.zone==='fire')-Number(a.zone==='fire'):0));
   const slot=choices.find(q=>result.every(r=>Math.hypot(q.x-r.x,q.z-r.z)>(mounted||r.kind==='rider'?1.35:1.0)));
   if(!slot)continue;safe.splice(safe.indexOf(slot),1);
   const index=indices[unit]++,direction=[0,Math.PI/2,Math.PI,0,-Math.PI/2][i%5];
   result.push({id:'garrison-'+p.id+'-'+unit+'-'+index,campId:p.id,kind:TRAINING[unit].actor,...slot,dx:Math.cos(direction),dz:Math.sin(direction),face:direction,moving:false,motionBlend:0,walkDistance:0,velocity:0,activityTime:time/1000+i*.83,idleSeed:i*.83,garrison:true});
  }
 }
 return result;
}
