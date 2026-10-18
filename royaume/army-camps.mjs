import {TRAINING,TRAINING_UNITS} from './barracks.mjs?v=36';
// The army belongs to completed camps. Cards/heroes do not consume camp space.
export const UNIT_SPACE=Object.fromEntries(TRAINING_UNITS.map(k=>[k,TRAINING[k].space]));
export const TRAINED_BATCH=Object.fromEntries(TRAINING_UNITS.map(k=>[k,TRAINING[k].count]));
export const campCapacity=level=>20+4*(Math.max(1,Math.min(13,Math.floor(level)||1))-1);
export function armyCounts(s){return Object.fromEntries(TRAINING_UNITS.map(k=>[k,Math.max(0,Math.floor((k==='guardians'?s.troops:s.army?.[k])||0))]));}
export function armyHousing(s){
 const counts=armyCounts(s),left={...counts},camps=(s.village?.structures||[]).filter(p=>p.kind==='camp'&&!p.pending).map(p=>({id:p.id,plot:p,level:p.level||1,capacity:campCapacity(p.level),used:0,units:Object.fromEntries(TRAINING_UNITS.map(k=>[k,0]))}));
 // Largest units first avoids fragmented free space. Every camp capacity is a multiple of four.
 for(const unit of [...TRAINING_UNITS].sort((a,b)=>UNIT_SPACE[b]-UNIT_SPACE[a]))for(const camp of camps){const n=Math.min(left[unit],Math.floor((camp.capacity-camp.used)/UNIT_SPACE[unit]));camp.units[unit]=n;camp.used+=n*UNIT_SPACE[unit];left[unit]-=n;}
 const used=Object.keys(counts).reduce((n,k)=>n+counts[k]*UNIT_SPACE[k],0),capacity=camps.reduce((n,c)=>n+c.capacity,0),reserved=[s.training,...(s.trainingQueue||[])].filter(Boolean).reduce((sum,q)=>sum+(TRAINED_BATCH[q.unit]||0)*(UNIT_SPACE[q.unit]||0),0);
 return {camps,counts,used,capacity,reserved,free:Math.max(0,capacity-used-reserved),overflow:Math.max(0,used-capacity),unhoused:left};
}
export function housingError(s,unit,count=TRAINED_BATCH[unit]){
 if(!UNIT_SPACE[unit]||!Number.isInteger(count)||count<1)return 'Unité inconnue.';
 const h=armyHousing(s);if(!h.camps.length)return 'Construisez un camp militaire pour accueillir les unités formées.';
 const needed=UNIT_SPACE[unit]*count;if(h.free<needed)return 'Camps pleins : '+needed+' places nécessaires, '+h.free+' disponibles. Améliorez ou construisez un camp.';
 return null;
}
export function campRemovalError(s,id){const h=armyHousing(s),camp=h.camps.find(c=>c.id===id);return camp&&h.used+h.reserved>h.capacity-camp.capacity?'Ce camp abrite votre armée. Construisez ou agrandissez un autre camp avant de le démonter.':null;}
