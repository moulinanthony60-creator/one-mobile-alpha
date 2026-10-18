import {MAX_BUILDING_LEVEL,upgradeSeconds} from './building-levels.mjs?v=34';
import {PLOTS,MAX_BUILDINGS} from './village-state.mjs?v=34';
import {buildJobs,jobFor,freeWorkers,workerCount,startBuild,wallQueue,queuedWallFor} from './builders.mjs?v=34';
export function wallUpgradeCost(level){return {gold:Math.round(PLOTS.wall.gold*level*.8),wood:Math.round(PLOTS.wall.wood*level*.8)};}
export function wallQueueTiming(state,extra=[],now=Date.now()){
 const workers=Array.from({length:workerCount(state)},(_,i)=>Math.max(now,...buildJobs(state).filter(q=>q.worker===i).map(q=>q.ends)));
 const entries=[...wallQueue(state),...extra];let ends=now;
 for(const q of entries){const index=workers.indexOf(Math.min(...workers));workers[index]+=upgradeSeconds('wall',q.target)*1000;ends=Math.max(ends,workers[index]);}
 return {ends,seconds:Math.max(0,(ends-now)/1000)};
}
export function wallUpgradePlan(state,ids,now=Date.now()){
 const result={items:[],gold:0,wood:0,skipped:{busy:0,queued:0,maximum:0,citadel:0},error:null};
 const invalid=message=>({...result,error:message});
 if(!Array.isArray(ids)||!ids.length||ids.length>MAX_BUILDINGS||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'))return invalid('Sélectionnez des remparts à améliorer.');
 const byId=new Map(state.village.structures.map(p=>[p.id,p]));
 if(ids.some(id=>byId.get(id)?.kind!=='wall'))return invalid('Cette sélection contient un élément qui n’est pas un rempart.');
 for(const id of ids){const p=byId.get(id);if(p.pending||jobFor(state,id)){result.skipped.busy++;continue;}if(queuedWallFor(state,id)){result.skipped.queued++;continue;}if(p.level>=MAX_BUILDING_LEVEL){result.skipped.maximum++;continue;}if(state.progressionVersion&&p.level>=state.buildings.castle){result.skipped.citadel++;continue;}const cost=wallUpgradeCost(p.level);result.items.push({id,target:p.level+1,...cost});result.gold+=cost.gold;result.wood+=cost.wood;}
 result.count=result.items.length;result.starts=Math.min(result.count,freeWorkers(state));result.waiting=result.count-result.starts;
 result.seconds=wallQueueTiming(state,result.items,now).seconds;result.signature=result.items.map(q=>q.id+':'+q.target).join('|');
 if(state.siege?.phase==='active')result.error='Terminez la défense avant d’améliorer les remparts.';
 else if(!result.count)result.error=result.skipped.citadel?'Améliorez la citadelle pour renforcer ces remparts.':'Ces remparts sont déjà en travaux, en attente ou au niveau maximum.';
 else if(state.gold<result.gold||state.wood<result.wood)result.error='Ressources insuffisantes pour cette sélection.';
 return result;
}
export function startQueuedWalls(state,now){
 if(state.siege?.phase==='active')return;
 while(wallQueue(state).length&&freeWorkers(state)>0){const q=state.wallUpgradeQueue.shift(),p=state.village.structures.find(p=>p.id===q.id);if(!p||p.kind!=='wall'||p.level+1!==q.target||q.target>MAX_BUILDING_LEVEL||jobFor(state,p.id))continue;startBuild(state,p.id,upgradeSeconds('wall',q.target),now);}
}
export function restoreWallQueue(raw,state){
 state.wallUpgradeQueue=[];const seen=new Set();
 for(const q of (Array.isArray(raw.wallUpgradeQueue)?raw.wallUpgradeQueue:[]).slice(0,MAX_BUILDINGS)){
  const p=state.village.structures.find(p=>p.id===q?.id);
  if(!p||p.kind!=='wall'||seen.has(p.id)||p.pending||jobFor(state,p.id)||q.target!==p.level+1||q.target>MAX_BUILDING_LEVEL||state.progressionVersion&&q.target>state.buildings.castle)continue;
  const cost=wallUpgradeCost(p.level);if(q.gold!==cost.gold||q.wood!==cost.wood)continue;
  seen.add(p.id);state.wallUpgradeQueue.push({id:p.id,target:q.target,...cost});
 }
}
