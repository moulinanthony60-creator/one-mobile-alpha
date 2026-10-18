import {treeById} from './forest.mjs?v=34';
import {MAX_BUILDING_LEVEL,upgradeSeconds} from './building-levels.mjs?v=34';
// Permanent workers and independent construction clocks. `build` remains a
// compatibility pointer for older saves; `builds` is the authoritative queue.
export const WORKER_NAMES=['Basile','Mila','Éloi'];
export const WORKER_OFFERS=[null,{level:2,gold:600,wood:400},{level:3,gold:1200,wood:800}];
export const workerCount=s=>Math.max(1,Math.min(3,Math.floor(s.workers)||1));
export const buildJobs=s=>Array.isArray(s.builds)?s.builds:s.build?[s.build]:[];
export const jobFor=(s,id)=>buildJobs(s).find(q=>q.id===id)||null;
export const freeWorkers=s=>Math.max(0,workerCount(s)-buildJobs(s).length);
export function syncBuilds(s){s.builds=buildJobs(s);s.build=s.builds[0]||null;}
export function startBuild(s,id,seconds,now,mode='upgrade'){
 if(jobFor(s,id))throw new Error('Ce bâtiment a déjà un chantier en cours.');
 if(!freeWorkers(s))throw new Error('Tous vos ouvriers sont occupés. Attendez un bâtisseur ou recrutez-en un.');
 const occupied=new Set(buildJobs(s).map(q=>q.worker));
 const worker=Array.from({length:workerCount(s)},(_,i)=>i).find(i=>!occupied.has(i));
 s.builds=[...buildJobs(s),{id,worker,mode,starts:now,ends:now+seconds*1000}];syncBuilds(s);
 return s.builds.at(-1);
}
export function restoreBuilders(raw,s,now){
 s.workers=Math.max(1,Math.min(3,Math.floor(Number(raw.workers))||1));s.builds=[];
 for(const q of (Array.isArray(raw.builds)?raw.builds:raw.build?[raw.build]:[]).slice(0,3)){
  const clearing=q?.mode==='clearing',p=clearing?treeById(s.village,q.id):s.village.structures.find(p=>p.id===q?.id);
  if(!p||jobFor(s,p.id)||!Number.isFinite(q.starts)||!Number.isFinite(q.ends)||q.starts>now||q.ends<=q.starts||q.ends-q.starts>(clearing?600:Math.max(40,upgradeSeconds(p.kind,p.level+1)))*1000||s.builds.length>=s.workers)continue;
  if(clearing&&!p.clearable)continue;
  const mode=clearing?'clearing':q.mode==='construction'&&p.kind!=='castle'?'construction':'upgrade';
  if(mode==='upgrade'&&p.level>=MAX_BUILDING_LEVEL)continue;
  let worker=Number.isInteger(q.worker)&&q.worker>=0&&q.worker<s.workers?q.worker:0;
  if(s.builds.some(j=>j.worker===worker))worker=Array.from({length:s.workers},(_,i)=>i).find(i=>!s.builds.some(j=>j.worker===i));
  s.builds.push({id:p.id,mode,worker,starts:q.starts,ends:q.ends});
  if(mode==='construction'){p.pending=true;if(p.essential)s.buildings[p.id]=0;}
 }
 syncBuilds(s);
}

export const wallQueue=s=>Array.isArray(s.wallUpgradeQueue)?s.wallUpgradeQueue:[];
export const queuedWallFor=(s,id)=>wallQueue(s).find(q=>q.id===id)||null;
