import {builderHutQuote} from './builder-huts.mjs?v=34';
import {MAX_BUILDING_LEVEL} from './building-levels.mjs?v=34';
import {jobFor,queuedWallFor,freeWorkers} from './builders.mjs?v=34';
import {PLOTS,MAX_BUILDINGS} from './village-state.mjs?v=34';
export const UNLOCK_LEVEL={farm:3,warehouse:3,lumberyard:4,treasury:4,watchtower:5,mint:6,bastion:6,firetower:8,builderhut:1,castle:1,mine:1,tree:1,cottage:1,camp:2,tower:2,wall:2,vault:2,barracks:2,forge:3,archery:3,hall:3,shrine:3,tavern:3,cannon:4,mortar:4,market:4,stable:4,mill:4,fountain:4,reservoir:4,ballista:5,arcane:5,academy:5};
export const CITADEL_REQUIREMENTS={
 2:[['mine',1],['tree',1],['cottage',1]],
 3:[['camp',1],['tower',1],['mine',2],['tree',2]],
 4:[['hall',1],['shrine',1],['barracks',2],['mine',3],['tree',3]],
 5:[['cannon',2],['mortar',1],['forge',2],['mine',4],['tree',4]],
 ...Object.fromEntries(Array.from({length:8},(_,i)=>{const target=i+6;return [target,[['mine',target-1],['tree',target-1],['vault',target-2],['tower',target-2],['barracks',target-3]]];}))
};
export function levelOf(s,kind){return Math.max(0,...s.village.structures.filter(p=>p.kind===kind&&!p.pending).map(p=>p.essential?(s.buildings[p.id]||p.level):p.level));}
export function unlockedAt(kind){return UNLOCK_LEVEL[kind]||1;}
export function unlocksAt(level){return Object.keys(PLOTS).filter(k=>k!=='castle'&&unlockedAt(k)===level);}
export function buildingLimit(s,kind){if(kind==='builderhut')return Math.min(3,s.buildings.castle);if(!s.progressionVersion)return PLOTS[kind]?.unique?1:600;const l=s.buildings.castle;if(PLOTS[kind]?.unique)return 1;if(kind==='camp')return l>=10?4:l>=7?3:l>=4?2:1;if(kind==='wall')return [0,0,40,70,110,160,200,240,280,320,360,400,440,480][l];if(['mine','tree','shrine','forge','barracks','hall','tavern'].includes(kind))return 1;if(kind==='cottage')return l+1;if(['tower','cannon'].includes(kind))return Math.max(1,l);return l>=5?2:1;}
export function constructionError(s,kind,quantity=1){if(kind==='builderhut')return quantity!==1?'Placez une cabane à la fois.':builderHutQuote(s).error;if(!PLOTS[kind]||kind==='castle')return 'La citadelle existe déjà.';if(!s.progressionVersion)return PLOTS[kind].unique?'Ce bâtiment existe déjà.':null;const l=unlockedAt(kind);if(s.buildings.castle<l)return 'Débloqué à la citadelle niveau '+l+'.';const limit=buildingLimit(s,kind),count=s.village.structures.filter(p=>p.kind===kind).length;if(count+quantity>limit)return 'Limite atteinte : '+limit+' à ce niveau de citadelle.';return null;}
export function availableConstructionCount(s){const counts={};for(const p of s.village.structures)counts[p.kind]=(counts[p.kind]||0)+1;const remaining=Object.keys(PLOTS).reduce((total,kind)=>total+(constructionError(s,kind)?0:Math.max(0,buildingLimit(s,kind)-(counts[kind]||0))),0);return Math.min(remaining,Math.max(0,MAX_BUILDINGS-s.village.structures.length));}
export function citadelRequirements(s){const target=s.buildings.castle+1;return (CITADEL_REQUIREMENTS[target]||[]).map(([kind,level])=>({kind,level,met:levelOf(s,kind)>=level,label:PLOTS[kind].name+' niveau '+level}));}
export function upgradeError(s,plot){if(plot?.kind==='builderhut')return 'Les cabanes accueillent un ouvrier et ne nécessitent pas d’amélioration.';if(!plot)return 'Bâtiment introuvable.';const level=plot.essential&&s.buildings[plot.id]!==undefined?s.buildings[plot.id]:plot.level;if(level>=MAX_BUILDING_LEVEL)return 'Niveau maximum atteint.';if(queuedWallFor(s,plot.id))return 'Ce rempart est dans la file d’attente.';if(jobFor(s,plot.id))return 'Ce bâtiment a déjà un chantier en cours.';if(!freeWorkers(s))return 'Tous vos ouvriers sont occupés. Attendez un bâtisseur.';if([s.training,...(s.trainingQueue||[])].some(q=>q?.campId===plot.id))return 'Terminez ou annulez les formations de ce bâtiment avant de l’améliorer.';if(!s.progressionVersion)return null;if(plot.kind==='castle'){const missing=citadelRequirements(s).filter(r=>!r.met);if(missing.length)return 'Il reste à préparer : '+missing.map(r=>r.label).join(', ')+'.';}else if(level>=s.buildings.castle)return 'Passez la citadelle au niveau '+(level+1)+' pour améliorer ce bâtiment.';return null;}
export const MILESTONES=[
 {id:'mine-1',kind:'mine',level:1,gold:200,wood:100},
 {id:'tree-1',kind:'tree',level:1,gold:150,wood:200},
 {id:'cottage-1',kind:'cottage',level:1,gold:200,wood:100},
 {id:'castle-2',kind:'castle',level:2,gold:500,wood:350},
 {id:'camp-1',kind:'camp',level:1,gold:250,wood:150},
 {id:'tower-1',kind:'tower',level:1,gold:250,wood:150},
 {id:'castle-3',kind:'castle',level:3,gold:800,wood:650},
 {id:'castle-4',kind:'castle',level:4,gold:1000,wood:800},
 {id:'castle-5',kind:'castle',level:5,gold:1400,wood:1000},
 ...Array.from({length:8},(_,i)=>({id:'castle-'+(i+6),kind:'castle',level:i+6,gold:1800+i*400,wood:1400+i*300}))
];
export function awardMilestones(s){if(!s.progressionVersion)return [];s.progressClaims??=[];const earned=[];for(const m of MILESTONES)if(!s.progressClaims.includes(m.id)&&levelOf(s,m.kind)>=m.level){s.progressClaims.push(m.id);s.gold+=m.gold;s.wood+=m.wood;if(m.kind==='castle')s.onePoints=(s.onePoints||0)+100;earned.push(m);}return earned;}
export function guideGoal(s){
 if(!s.progressionVersion)return null;
 if(s.build){const p=s.village.structures.find(p=>p.id===s.build.id);return {id:'building-'+s.build.id,title:'Votre bâtisseur est au travail',detail:(p?PLOTS[p.kind].name:'Citadelle')+' : niveau supérieur en préparation.',action:'guide-building',plotId:s.build.id,label:'Voir le chantier'};}
 const req=citadelRequirements(s),missing=req.find(r=>!r.met);
 if(missing){const existing=s.village.structures.find(p=>p.kind===missing.kind),upgrade=!!existing,feminine=['mine','tree','cottage','tower','barracks','forge','stable','fountain','academy','ballista','arcane','reservoir','vault'].includes(missing.kind),article=upgrade?(feminine?'la ':'le '):(feminine?'une ':'un ');return {id:missing.kind+'-'+missing.level,title:(upgrade?'Améliorez ':'Construisez ')+article+PLOTS[missing.kind].name.toLowerCase(),detail:upgrade?'Atteignez le niveau '+missing.level+' pour préparer la citadelle '+(s.buildings.castle+1)+'.':missing.kind==='mine'?'Votre mine produira l’or nécessaire aux constructions.':missing.kind==='tree'?'La scierie fournira le bois pour agrandir votre village.':'Cette construction prépare le prochain niveau de citadelle.',action:upgrade?'guide-building':'guide-build',kind:missing.kind,plotId:existing?.id,label:upgrade?'Améliorer':'Construire',done:req.filter(r=>r.met).length,total:req.length+1};}
 if(s.buildings.castle<MAX_BUILDING_LEVEL)return {id:'citadel-'+(s.buildings.castle+1),title:'Citadelle niveau '+(s.buildings.castle+1),detail:unlocksAt(s.buildings.castle+1).length?'Tout est prêt ! Le prochain niveau débloque '+unlocksAt(s.buildings.castle+1).length+' types de bâtiments.':'Tout est prêt ! Augmentez les niveaux et les capacités de votre cité.',action:'guide-building',plotId:'castle',label:'Passer au niveau '+(s.buildings.castle+1),done:req.length,total:req.length+1};
 return {id:'complete',title:'Votre royaume a grandi',detail:'Toutes les familles de bâtiments sont débloquées. Renforcez vos défenses et votre armée.',action:'village-shop',label:'Développer la cité'};
}
