import {builderHutQuote} from './builder-huts.mjs?v=34';
import {wallMovePlan} from './wall-groups.mjs?v=34';
import {PLOTS,MAX_BUILDINGS,placementError,wallLine,wallPlan} from './village-state.mjs?v=34';
import {constructionError,buildingLimit} from './progression.mjs?v=34';
import {freeWorkers,jobFor,queuedWallFor} from './builders.mjs?v=34';

// The ghost and confirmation button reflect the same limits as the engine.
export function placementPreview(state,p){
 if(p.group)return wallMovePlan(state,p);
 if(p.batch){
  const cells=wallLine(p.start,{x:p.x,z:p.z},p.rotation%2),plan=wallPlan(state.village,cells);
  const remaining=Math.max(0,buildingLimit(state,'wall')-state.village.structures.filter(b=>b.kind==='wall').length);
  const gold=plan.gold||0,wood=plan.wood||0;
  return {cells,count:plan.cells.length,remaining,gold,wood,error:plan.error||constructionError(state,'wall',plan.cells.length)||(freeWorkers(state)<1?'Tous vos ouvriers sont occupés.':null)||(state.gold<gold||state.wood<wood?'Ressources insuffisantes.':null)};
 }
 let error=placementError(state.village,p.kind,p.x,p.z,p.rotation,p.id);
 if(p.id)error||=(jobFor(state,p.id)||queuedWallFor(state,p.id))?'Terminez le chantier avant de déplacer ce bâtiment.':null;
 else if(p.kind==='builderhut'){const q=builderHutQuote(state);return {gold:q.gold,wood:q.wood,error:error||q.error||(state.village.structures.length>=MAX_BUILDINGS?'Limite de constructions atteinte.':null)||(state.gold<q.gold||state.wood<q.wood?'Ressources insuffisantes.':null)};}
 else error||=constructionError(state,p.kind)||(freeWorkers(state)<1?'Tous vos ouvriers sont occupés.':null)||(state.village.structures.length>=MAX_BUILDINGS?'Limite de constructions atteinte.':null)||(state.gold<PLOTS[p.kind].gold||state.wood<PLOTS[p.kind].wood?'Ressources insuffisantes.':null);
 return {error};
}
