import {findFreePlot,MAX_BUILDINGS} from './village-state.mjs?v=34';
// Three huts are earned in game. Premium slots remain unavailable until ONE
// provides server-verified payment and account entitlements; local balances
// and save-file flags never unlock the fourth or fifth worker.
export const FREE_BUILDER_HUTS=3, TOTAL_BUILDER_HUTS=5;
export const BUILDER_HUT_OFFERS=[{level:1,gold:0,wood:0},{level:2,gold:600,wood:400},{level:3,gold:1200,wood:800}];
export const builderHuts=s=>s.village.structures.filter(p=>p.kind==='builderhut');
export function builderHutQuote(s){
 const index=builderHuts(s).length,offer=BUILDER_HUT_OFFERS[index];
 if(!offer)return {index,level:3,gold:0,wood:0,error:'Les trois cabanes débloquées en jeu sont déjà construites. Les deux cabanes ONE ne sont pas encore disponibles.'};
 return {...offer,index,seconds:0,error:s.buildings.castle<offer.level?'Débloqué à la citadelle niveau '+offer.level+'.':null};
}
export function restoreBuilderHuts(raw,s,{includeFirst=false}={}){
 if(raw.siege?.phase==='active')return; // Finish a saved defense with its original map.
 const owned=Math.max(1,Math.min(3,Math.floor(Number(raw.workers))||1));
 // A previous purchase is retained as a physical hut. Never move existing plots.
 const desired=owned>1||includeFirst?owned:builderHuts(s).length;
 for(let i=builderHuts(s).length;i<Math.min(3,desired);i++){
  if(s.village.structures.length>=MAX_BUILDINGS)break;
  const castle=s.village.structures.find(p=>p.kind==='castle'),pos=findFreePlot(s.village,'builderhut',0,{x:(castle?.x||0)+5,z:(castle?.z||0)+4});
  if(!pos)break;
  s.village.structures.push({id:'plot-'+s.village.nextId++,kind:'builderhut',...pos,rotation:0,level:1,essential:false});
 }
 s.workerHutsVersion=1;
}
