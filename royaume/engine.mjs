import {assaultCommand,restoreAssault} from './expeditions.mjs?v=37';
import {TRAINING,TRAINING_UNITS,barracksLevel,plotLevel} from './barracks.mjs?v=36';
import {builderHutQuote,restoreBuilderHuts,builderHuts} from './builder-huts.mjs?v=34';
import {armyHousing,housingError,campRemovalError} from './army-camps.mjs?v=34';
import {newRoyalPack,openRoyalPack,revealRoyalPack,finishRoyalPack,restoreRoyalPack} from './royal-pack.mjs?v=34';
import {UNITS,UNIT_SKILLS,MAX_UNIT_LEVEL,unitUpgradeQuote,restoreCollection} from './collection.mjs?v=34';
import {heroPackQuote,restoreHeroPacks} from './hero-packs.mjs?v=34';
import {treeById,treeDetails,restoreForest,clearTree} from './forest.mjs?v=34';
import {footprint} from './village-state.mjs?v=34';
import {buildStreets} from './village-life.mjs?v=34';
import {wallUpgradePlan,startQueuedWalls,restoreWallQueue} from './wall-upgrades.mjs?v=34';
import {MAX_BUILDING_LEVEL,upgradeSeconds,speedupCost} from './building-levels.mjs?v=34';
import {wallMovePlan} from './wall-groups.mjs?v=34';
import {buildJobs,jobFor,queuedWallFor,wallQueue,freeWorkers,workerCount,WORKER_OFFERS,startBuild,syncBuilds,restoreBuilders} from './builders.mjs?v=34';
import {TROOP_PACKS,packError,restorePacks} from './troop-packs.mjs?v=34';
import {constructionError,upgradeError,awardMilestones} from './progression.mjs?v=34';
import {createSiege,stepSiege,settleSiege,siegeCommand,restoreSiege} from './siege.mjs?v=34';
import {PLOTS,MAX_BUILDINGS,createVillage,createStarterVillage,expandTown,fortifyTown,wallPlan,restoreVillage,findFreePlot,placementError,villageBonus} from './village-state.mjs?v=34';
export const VERSION = 1;
export {TRAINING};
export function troopCount(s,unit){return unit==='guardians'?s.troops:(s.army?.[unit]||0);}
export function trainingCamp(s,unit){const spec=TRAINING[unit];return spec?(s.village?.structures||[]).filter(p=>p.kind==='barracks'&&!p.pending&&plotLevel(s,p)>=spec.level).sort((a,b)=>Number(!!jobFor(s,a.id))-Number(!!jobFor(s,b.id))||plotLevel(s,b)-plotLevel(s,a))[0]||null:null;}
export function trainingError(s,unit){const spec=TRAINING[unit];if(!spec)return 'Choisissez une unité à former.';const camp=trainingCamp(s,unit);if(!camp)return barracksLevel(s)?'Caserne niveau '+spec.level+' nécessaire pour former les '+spec.name.toLowerCase()+'.':'Construisez d’abord une caserne (citadelle 2).';return jobFor(s,camp.id)?'La caserne est en travaux. Attendez la fin du chantier.':null;}
export function trainingSeconds(s,unit){const p=trainingCamp(s,unit);return p?Math.max(8,TRAINING[unit].seconds-(plotLevel(s,p)-1)*3):0;}
export const TRAINING_LIMIT=6;
export function trainingJobs(s){return [s.training,...(s.trainingQueue||[])].filter(Boolean);}
export function upgradeFunds(s,cost){const missing={gold:Math.max(0,cost.gold-s.gold),wood:Math.max(0,cost.wood-s.wood)};return {missing,affordable:!missing.gold&&!missing.wood,collectable:['gold','wood'].every(k=>s[k]+Math.floor(s.stash[k])>=cost[k])};}
function payUpgrade(s,cost,collect){
 if(collect){requireThat(upgradeFunds(s,cost).collectable,'La récolte ne suffit pas encore pour cette amélioration.');for(const k of ['gold','wood']){const value=Math.floor(s.stash[k]);s[k]+=value;s.stash[k]-=value;}s.stats.harvest++;}
 pay(s,{gold:cost.gold,wood:cost.wood});
}
export function raidReadiness(s,id){const r=REGIONS[id];if(!r)return [];
 return [
 {id:'chapter',label:'Chapitre accessible',met:id===0||s.cleared.includes(id-1)},
 {id:'hall',label:'Hall des héros construit',met:!s.progressionVersion||s.buildings.castle>=3&&s.village.structures.some(p=>p.kind==='hall'&&!p.pending),action:'prepare-building',kind:'hall'},
 {id:'team',label:'Héros dans l’escouade',met:s.team.length>0,action:'raid-team'},
 {id:'troops',label:Math.min(3,s.troops)+' / 3 gardiens prêts',met:s.troops>=3,action:'army'},
 {id:'energy',label:s.energy+' / '+r.energy+' énergie',met:s.energy>=r.energy},
 {id:'siege',label:'Cité disponible',met:s.siege?.phase!=='active'}
 ];
}
export function raidSupport(s){
 const units=Object.fromEntries(TRAINING_UNITS.filter(k=>k!=='guardians').map(k=>[k,Math.min(TRAINING[k].raid,troopCount(s,k))]));
 return {...units,units,attack:Object.entries(units).reduce((n,[k,count])=>n+count*TRAINING[k].attack,0),hp:Object.entries(units).reduce((n,[k,count])=>n+count*TRAINING[k].hp,0)};
}
export function raidSupportText(support){return Object.entries(support.units||{}).filter(([,n])=>n>0).map(([k,n])=>n+' '+(n===1?TRAINING[k].singular:TRAINING[k].name.toLowerCase())).join(', ');}


export const BUILDINGS = {
  castle: {name:'Citadelle', subtitle:'Le cœur de votre royaume', icon:'castle', x:47,y:34, gold:450,wood:320, description:'Renforce votre cité et permet aux autres bâtiments de gagner de nouveaux niveaux.'},
  mine: {name:'Mine d’or',subtitle:'La richesse sous la montagne',icon:'gold',x:21,y:32,gold:260,wood:180,description:'Produit de l’or, même pendant votre absence. Chaque niveau augmente la production et la capacité.'},
  forge: {name:'Forge',subtitle:'Le feu de votre armée',icon:'anvil',x:32,y:54,gold:350,wood:240,description:'Chaque niveau donne 8 % d’attaque supplémentaire à tous vos héros pendant les raids.'},
  barracks: {name:'Caserne',subtitle:'Des soldats prêts à vous suivre',icon:'swords',x:53,y:65,gold:320,wood:220,description:'Formez 10 types de troupes. Chaque niveau de 1 à 10 débloque une nouvelle unité ; les niveaux suivants accélèrent la formation.'},
  tree: {name:'Scierie',subtitle:'Une forêt généreuse',icon:'leaf',x:76,y:45,gold:240,wood:150,description:'Produit du bois et augmente les points de vie de vos héros de 5 % par niveau.'},
  shrine: {name:'Sanctuaire',subtitle:'L’écho d’une magie ancienne',icon:'crystal',x:71,y:66,gold:400,wood:280,description:'Produit de l’éther pour préparer des potions de soin.'}
};
export const HEROES=UNITS;
export const HERO_SKILLS=UNIT_SKILLS;
export const REGIONS = [
  {id:0,name:'Les Bois murmurants',short:'Bois murmurants',zone:'LA FORÊT D’ÉMERAUDE',desc:'Des sentinelles corrompues ont pris les anciennes routes. Rendez sa liberté à la forêt.',difficulty:'Accessible',power:280,energy:5,gold:550,wood:280,aether:24,xp:80,color:'#609e83',hp:120,attack:23,enemies:['Rôdeur des brumes','Racine corrompue','Gardien sylvestre']},
  {id:1,name:'Les Ruines d’Opale',short:'Ruines d’Opale',zone:'LES TERRES OUBLIÉES',desc:'Sous les pierres blanches, une magie oubliée attend vos champions.',difficulty:'Intermédiaire',power:520,energy:7,gold:800,wood:400,aether:40,xp:120,color:'#728abe',hp:200,attack:32,enemies:['Veilleur d’opale','Spectre ancien','Sentinelle des ruines']},
  {id:2,name:'Le Col des tempêtes',short:'Col des tempêtes',zone:'LES CIMES ÉTERNELLES',desc:'Traversez le col gelé et défiez les gardiens du ciel.',difficulty:'Difficile',power:850,energy:9,gold:1150,wood:550,aether:60,xp:180,color:'#79adb9',hp:280,attack:43,enemies:['Loup des cimes','Héraut de l’orage','Gardien du col']},
  {id:3,name:'La Couronne de cendres',short:'Couronne de cendres',zone:'LE ROYAUME BRISÉ',desc:'Varkos a réveillé les flammes. Votre royaume est le dernier rempart.',difficulty:'Boss final',power:1250,energy:12,gold:1800,wood:800,aether:100,xp:280,color:'#d58068',hp:370,attack:52,enemies:['Garde de braise','Garde de braise','Varkos, le Dévoreur']}
];
export const QUESTS = [
  {id:'harvest',title:'La première récolte',desc:'Récoltez les ressources de votre cité.',goal:1,gold:200,gems:10,icon:'leaf'},
  {id:'build',title:'Des fondations solides',desc:'Terminez une amélioration de bâtiment.',goal:1,gold:350,gems:15,icon:'castle'},
  {id:'raid',title:'Au-delà des remparts',desc:'Remportez votre premier raid.',goal:1,gold:400,gems:20,icon:'swords'},
  {id:'hero',title:'L’éveil des champions',desc:'Améliorez un héros.',goal:1,gold:300,gems:15,icon:'shield'},
  {id:'recruit',title:'Le cercle des trois',desc:'Recrutez Nyx au Hall des héros.',goal:1,gold:500,gems:30,icon:'spark'},
  {id:'conquer',title:'Un nouvel horizon',desc:'Libérez les quatre territoires.',goal:4,gold:1500,gems:100,icon:'flag'}
];
export function createLegacyState(now=Date.now()){
 return {version:VERSION,name:'Aventurier',gold:2400,wood:1500,aether:120,gems:80,energy:40,troops:12,army:{archers:0,cavalry:0},training:null,trainingQueue:[],trainingSerial:1,militaryIntroduced:true,townIntroduced:true,fortressIntroduced:true,siege:null,siegeCleared:[],potions:3,xp:0,
 buildings:Object.fromEntries(Object.keys(BUILDINGS).map(id=>[id,1])),heroes:Object.fromEntries(HEROES.map(h=>[h.id,['lyra','cael'].includes(h.id)?1:0])),collectionVersion:1,unitCards:{},team:['lyra','cael'],
 stash:{gold:240,wood:160,aether:18},stats:{harvest:0,build:0,raid:0,hero:0,recruit:0,conquer:0},claimed:[],cleared:[],workers:1,builds:[],wallUpgradeQueue:[],build:null,battle:null,packVersion:1,onePoints:0,heroPackReceipts:[],royalPack:newRoyalPack(now),unlockedTroops:Object.keys(TROOP_PACKS),
 village:prepareForest(createVillage()),lastTick:now,energyTick:now,daily:null,settings:{sound:false},journal:[{text:'Votre aventure commence au Bastion de Valdoria.',time:now}]};
}
export function createState(now=Date.now()){
 const s=createLegacyState(now);Object.assign(s,{progressionVersion:1,workerHutsVersion:1,progressClaims:[],unlockedTroops:[],gold:900,wood:750,aether:0,gems:0,troops:0,potions:0,village:prepareForest(createStarterVillage()),buildings:{castle:1,mine:0,tree:0,forge:0,barracks:0,shrine:0},heroes:Object.fromEntries(HEROES.map(h=>[h.id,0])),team:[],stash:{gold:0,wood:0,aether:0},journal:[{text:'Une citadelle, une vallée. Construisez votre premier village.',time:now}]});return s;
}
function prepareForest(village,raw=null){return restoreForest(village,raw,village.structures.map(p=>({...p,...footprint(p.kind,p.rotation)})),buildStreets(village.structures).tiles);}
const cap=(x,a,b)=>Math.min(b,Math.max(a,x));
function note(s,text,now){s.journal.unshift({text,time:now});s.journal=s.journal.slice(0,30);}
export function advance(s,now=Date.now()){
 now=Math.max(now,s.lastTick);syncBuilds(s);
 // Process every worker deadline, including queued walls, in chronological order.
 advanceStep(s,s.lastTick);
 while(s.lastTick<now){const ends=buildJobs(s).filter(q=>q.ends>s.lastTick).map(q=>q.ends);advanceStep(s,Math.min(now,...ends));}
 return s;
}
function advanceStep(s,now){
 while(s.training&&now>=s.training.ends){const q=s.training,spec=TRAINING[q.unit];if(spec){if(q.unit==='guardians')s.troops+=spec.count;else{s.army??={archers:0,cavalry:0};s.army[q.unit]=(s.army[q.unit]||0)+spec.count;}note(s,`${spec.count} ${spec.name.toLowerCase()} ont rejoint les camps.`,q.ends);}s.training=(s.trainingQueue||[]).shift()||null;}
 const dt=cap((now-s.lastTick)/60000,0,480),bonus=villageBonus(s.village);
 s.stash.gold=Math.min(800*s.buildings.mine+bonus.goldStorage,s.stash.gold+dt*(45*s.buildings.mine+bonus.gold));
 s.stash.wood=Math.min(700*s.buildings.tree,s.stash.wood+dt*(30*s.buildings.tree+bonus.wood));
 s.stash.aether=Math.min(160*s.buildings.shrine+bonus.aetherStorage,s.stash.aether+dt*(3*s.buildings.shrine+bonus.aether));
 s.lastTick=Math.max(s.lastTick,now);
 const ticks=Math.floor(Math.max(0,now-s.energyTick)/90000);
 if(ticks>0){s.energy=cap(s.energy+ticks,0,40);s.energyTick+=ticks*90000;}
 if(s.energy>=40)s.energyTick=now;
 for(const q of buildJobs(s).filter(q=>now>=q.ends)){
  if(q.mode==='clearing'){const tree=treeById(s.village,q.id);if(tree&&clearTree(s.village,q.id)){const spec=treeDetails(tree);s.wood+=spec.wood;note(s,spec.name+' coupé'+(tree.kind==='spruce'?'s':'')+' : +'+spec.wood+' bois.',now);}continue;}
  const p=s.village.structures.find(p=>p.id===q.id);if(!p)continue;
  if(q.mode==='construction'){delete p.pending;p.level=1;if(p.essential&&BUILDINGS[p.id])s.buildings[p.id]=1;
   if(p.kind==='hall'){for(const id of ['lyra','cael'])s.heroes[id]=Math.max(1,s.heroes[id]||0);if(!s.team.length)s.team=['lyra','cael'];}
  }else if(p.essential&&BUILDINGS[p.id]){s.buildings[p.id]++;p.level=s.buildings[p.id];}else p.level++;
  s.stats.build++;note(s,`${PLOTS[p.kind].name} : ${q.mode==='construction'?'construction terminée':'niveau '+p.level+'.'}`,now);
 }
 s.builds=buildJobs(s).filter(q=>now<q.ends);syncBuilds(s);startQueuedWalls(s,now);
 for(const m of awardMilestones(s))note(s,`Étape accomplie : +${m.gold} or, +${m.wood} bois.`,now);
 return s;
}
export function buildingCost(s,id){const b=BUILDINGS[id],l=s.buildings[id];return {gold:Math.floor(b.gold*l**1.5),wood:Math.floor(b.wood*l**1.4),seconds:upgradeSeconds(id,l+1)};}
export function heroStats(s,id){const h=HEROES.find(h=>h.id===id),level=s.heroes[id]||1,bonus=villageBonus(s.village);return {...h,level,maxHp:Math.round(h.hp*(1+(level-1)*.2)*(1+s.buildings.tree*.05+bonus.hp)),attack:Math.round(h.attack*(1+(level-1)*.23)*(1+Math.max(0,s.buildings.forge-1)*.08+bonus.attack))};}
export function suggestedTeam(s){
 const owned=HEROES.filter(h=>s.heroes[h.id]>0).sort((a,b)=>{const x=heroStats(s,a.id),y=heroStats(s,b.id);return (y.attack*2+y.maxHp*.3)-(x.attack*2+x.maxHp*.3);}),team=[];
 for(const predicate of [h=>!!HERO_SKILLS[h.id].shield,h=>!!HERO_SKILLS[h.id].heal,()=>true]){const h=owned.find(h=>!team.includes(h.id)&&predicate(h));if(h)team.push(h.id);}
 for(const h of owned)if(team.length<3&&!team.includes(h.id))team.push(h.id);return team;
}
export function power(s){return s.team.reduce((n,id)=>{const h=heroStats(s,id),r=raidSupport(s);return n+Math.round(h.attack*(1+r.attack)*2+h.maxHp*(1+r.hp)*.3)},0)+s.buildings.barracks*20;}
const requireThat=(ok,msg)=>{if(!ok)throw new Error(msg);};
function pay(s,cost){for(const [k,n] of Object.entries(cost))requireThat(s[k]>=n,'Ressources insuffisantes. Récoltez ou remportez un raid.');for(const [k,n]of Object.entries(cost))s[k]-=n;}
function rng(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296;}
function battleEnd(s,now){
 const b=s.battle,r=REGIONS[b.region];
 if(b.enemies.every(e=>e.hp<=0)){
  b.phase='won';const first=!s.cleared.includes(r.id);b.reward={gold:r.gold+(first?300:0),wood:r.wood,aether:r.aether,xp:r.xp,gems:first?25:0};
  for(const [k,v] of Object.entries(b.reward))s[k]+=v;
  if(first){s.cleared.push(r.id);s.stats.conquer=s.cleared.length;}s.stats.raid++;
  note(s,`${r.short} : victoire ! +${b.reward.gold} or.`,now);return true;
 }
 if(b.team.every(h=>h.hp<=0)){b.phase='lost';note(s,`Retraite à ${r.short}. Vos héros regagnent la cité.`,now);return true;}
 return false;
}
function enemyTurn(s,now){
 const b=s.battle;
 for(const e of b.enemies.filter(e=>e.hp>0)){
  const live=b.team.filter(h=>h.hp>0);if(!live.length)break;
  const target=live[Math.floor(rng(b)*live.length)];const amount=Math.max(1,Math.round(e.attack*(.9+rng(b)*.2)*(target.shield?.45:1)));
  target.hp=Math.max(0,target.hp-amount);target.shield=false;b.log.push(`${e.name} frappe ${target.name} : −${amount} PV.`);
 }
 if(battleEnd(s,now))return;
 b.round++;b.acted=[];for(const h of b.team)h.cooldown=Math.max(0,h.cooldown-1);
 b.actor=b.team.findIndex(h=>h.hp>0);b.log.push(`Tour ${b.round} · À vous de jouer.`);
}
export function act(s,action,now=Date.now()){
 // All actions run on a copy: a rejected operation cannot partially spend resources.
 now=Math.max(now,s.lastTick);const n=structuredClone(s);advance(n,now);
 if(n.siege?.phase==='active'&&['hire-worker','clear-tree','upgrade-walls','cancel-wall-queue','place-building','place-walls','move-walls','upgrade-plot','upgrade','speedup','demolish','raid'].includes(action.type))throw new Error('Terminez la défense avant de modifier la base ou de lancer un raid.');
 if(n.assault?.phase==='active'&&['raid','siege-start'].includes(action.type))throw new Error('Terminez votre attaque de village avant de lancer un autre combat.');
 switch(action.type){
 case 'assault-start':case 'assault-deploy':case 'assault-spell':case 'assault-retreat':case 'assault-dismiss':assaultCommand(n,action);break;
 case 'clear-tree':{const tree=treeById(n.village,action.id);requireThat(tree?.clearable,'Cet arbre est hors du domaine ou déjà coupé.');requireThat(!jobFor(n,tree.id),'Un ouvrier coupe déjà cet arbre.');requireThat(freeWorkers(n)>0,'Tous vos ouvriers sont occupés.');const spec=treeDetails(tree,n.village);pay(n,{gold:spec.gold});startBuild(n,tree.id,spec.seconds,now,'clearing');break;}
 case 'siege-start':requireThat(!n.progressionVersion||n.buildings.castle>=3,'La défense se débloque à la citadelle niveau 3.');requireThat(!n.siege||n.siege.phase!=='active','Une défense est déjà en cours.');requireThat(!n.battle||n.battle.phase!=='active','Terminez votre raid avant de défendre la cité.');requireThat(!buildJobs(n).length,'Attendez la fin des chantiers avant l’épreuve.');n.siege=createSiege(n,action.tier);break;
 case 'siege-target':case 'siege-spell':siegeCommand(n.siege,action);settleSiege(n);break;
 case 'siege-stop':requireThat(n.siege?.phase==='active','Aucune défense en cours.');n.siege.phase='lost';break;
 case 'siege-dismiss':requireThat(n.siege?.phase!=='active','La défense est encore en cours.');n.siege=null;restoreBuilderHuts(n,n);break;
 case 'upgrade-walls':{const plan=wallUpgradePlan(n,action.ids,now);requireThat(!plan.error,plan.error);requireThat(!action.signature||action.signature===plan.signature,'La sélection a changé. Vérifiez le nouveau coût avant de confirmer.');pay(n,{gold:plan.gold,wood:plan.wood});n.wallUpgradeQueue=[...wallQueue(n),...plan.items];startQueuedWalls(n,now);note(n,plan.count+' améliorations de remparts programmées.',now);break;}
 case 'cancel-wall-queue':{const waiting=wallQueue(n);requireThat(waiting.length>0,'Aucun rempart en attente.');for(const q of waiting){n.gold+=q.gold;n.wood+=q.wood;}n.wallUpgradeQueue=[];note(n,waiting.length+' améliorations en attente annulées et remboursées.',now);break;}
 case 'move-walls':{const plan=wallMovePlan(n,action);requireThat(!plan.error,plan.error);const moves=new Map(plan.cells.map(p=>[p.id,p]));for(const p of n.village.structures){const q=moves.get(p.id);if(q)Object.assign(p,{x:q.x,z:q.z,rotation:q.rotation});}note(n,plan.cells.length+' remparts déplacés.',now);break;}
 case 'place-walls':{const plan=wallPlan(n.village,action.cells);requireThat(!plan.error,plan.error);const locked=constructionError(n,'wall',plan.cells.length);requireThat(!locked,locked);requireThat(freeWorkers(n)>0,'Tous vos ouvriers sont occupés.');pay(n,{gold:plan.gold,wood:plan.wood});for(const c of plan.cells)n.village.structures.push({id:'plot-'+n.village.nextId++,kind:'wall',...c,level:1,essential:false});n.stats.build+=plan.cells.length;note(n,plan.cells.length+' remparts construits.',now);break;}
 case 'harvest': {
  requireThat(action.resource===undefined||['gold','wood','aether'].includes(action.resource),'Ressource inconnue.');
  const values=Object.fromEntries(Object.entries(n.stash).map(([k,v])=>[k,!action.resource||action.resource===k?Math.floor(v):0]));
  requireThat(Object.values(values).some(v=>v>0),'Vos bâtiments produisent. Revenez dans quelques instants.');
  for(const [k,v] of Object.entries(values)){n[k]+=v;n.stash[k]-=v;}n.stats.harvest++;note(n,`Récolte : ${values.gold} or, ${values.wood} bois et ${values.aether} éther.`,now);break;
 }
 case 'upgrade':{
  const id=action.id;requireThat(!!BUILDINGS[id]&&n.village.structures.some(p=>p.id===id),'Construisez d’abord ce bâtiment.');const locked=upgradeError(n,n.village.structures.find(p=>p.id===id));requireThat(!locked,locked);requireThat(freeWorkers(n)>0,'Tous vos ouvriers sont occupés. Attendez un bâtisseur.');
  requireThat(action.expectedLevel===undefined||action.expectedLevel===n.buildings[id],'Le niveau a changé. Ouvrez à nouveau la fiche.');requireThat(n.buildings[id]<MAX_BUILDING_LEVEL,'Ce bâtiment a atteint son niveau maximum.');
  requireThat(id==='castle'||n.buildings[id]<n.buildings.castle+1,'Améliorez d’abord la citadelle.');
  const cost=buildingCost(n,id);payUpgrade(n,cost,!!action.collect);startBuild(n,id,cost.seconds,now);note(n,`Amélioration de ${BUILDINGS[id].name.toLowerCase()} commencée.`,now);break;
 }
 case 'speedup':{const q=action.id?jobFor(n,action.id):buildJobs(n)[0];requireThat(!!q,'Aucune construction en cours.');pay(n,{gems:speedupCost(q,now)});q.ends=now;advance(n,now);break;}
 case 'hire-worker':{
  // Compatibility with older clients: the purchase now creates a real hut.
  const offer=WORKER_OFFERS[workerCount(n)];requireThat(!!offer,'Vos trois ouvriers sont déjà recrutés.');requireThat(n.buildings.castle>=offer.level,'Améliorez la citadelle au niveau '+offer.level+'.');
  restoreBuilderHuts(n,n,{includeFirst:true});const pos=findFreePlot(n.village,'builderhut');requireThat(!!pos,'Libérez un emplacement pour la cabane.');
  return act(n,{type:'place-building',kind:'builderhut',...pos},now);
 }
 case 'open-royal-pack':{openRoyalPack(n,action.currency,action.expectedOpened,now);note(n,'Coffre de Valdoria ouvert : 2 troupes, 2 ressources et 1 bonus.',now);break;}
 case 'reveal-royal-pack':revealRoyalPack(n,action.id,!!action.all,action.expectedRevealed);break;
 case 'finish-royal-pack':finishRoyalPack(n,action.id);break;
 case 'open-hero-pack':{const quote=heroPackQuote(n,action.id,action.currency);requireThat(!quote.error,quote.error);requireThat(action.currency!==undefined,'Choisissez les points ONE ou les gemmes.');pay(n,{[quote.currency]:quote.price});n.heroes[quote.pack.hero]=1;n.heroPackReceipts??=[];n.heroPackReceipts.push({id:quote.pack.id,currency:quote.currency,price:quote.price,time:now});if(quote.pack.hero==='nyx')n.stats.recruit++;note(n,HEROES.find(h=>h.id===quote.pack.hero).name+' a rejoint votre collection · '+quote.price+' '+(quote.currency==='gems'?'gemmes':'ONE')+'.',now);break;}
 case 'open-troop-pack':{const error=packError(n,action.unit);requireThat(!error,error);const p=TROOP_PACKS[action.unit];pay(n,{onePoints:p.points});n.unlockedTroops=[...(n.unlockedTroops||[]),action.unit];if(action.unit==='guardians')n.troops+=p.count;else n.army[action.unit]=(n.army[action.unit]||0)+p.count;note(n,p.unit+' débloqués : formation permanente et '+p.count+' renforts reçus.',now);break;}
 case 'train':return act(s,{type:'train-batch',unit:'guardians'},now);
 case 'train-batch':{
  const unit=action.unit,spec=TRAINING[unit];requireThat(!!spec,'Choisissez une unité à former.');requireThat(trainingJobs(n).length<TRAINING_LIMIT,'La file contient déjà 6 groupes.');
  const error=trainingError(n,unit);requireThat(!error,error);const camp=trainingCamp(n,unit);
  const spaceError=housingError(n,unit,spec.count);requireThat(!spaceError,spaceError);pay(n,{gold:spec.gold,wood:spec.wood});
  const starts=trainingJobs(n).at(-1)?.ends||now,job={id:'training-'+now+'-'+(n.trainingSerial++),unit,campId:camp.id,starts,ends:starts+trainingSeconds(n,unit)*1000};
  if(n.training)(n.trainingQueue??=[]).push(job);else n.training=job;
  note(n,`${spec.count} ${spec.name.toLowerCase()} ajoutés à la formation.`,now);break;
 }
 case 'cancel-training':{
  const index=(n.trainingQueue||[]).findIndex(q=>q.id===action.id);requireThat(index>=0,'Seuls les groupes encore en attente peuvent être annulés.');
  const [q]=n.trainingQueue.splice(index,1),spec=TRAINING[q.unit];n.gold+=spec.gold;n.wood+=spec.wood;
  let end=n.training.ends;for(const job of n.trainingQueue){const duration=job.ends-job.starts;job.starts=end;job.ends=end+duration;end=job.ends;}
  note(n,'Formation en attente annulée. Or et bois remboursés.',now);break;
 }
 case 'potion':requireThat(n.potions<20,'Votre réserve contient déjà 20 potions.');pay(n,{gold:100,aether:8});n.potions++;break;
 case 'favorite-unit':{requireThat(HEROES.some(h=>h.id===action.id),'Troupe inconnue.');n.unitFavorites??=[];n.unitFavorites=n.unitFavorites.includes(action.id)?n.unitFavorites.filter(id=>id!==action.id):[...n.unitFavorites,action.id];break;}
 case 'hero':case 'upgrade-unit':{
  const q=unitUpgradeQuote(n,action.id);requireThat(!q.error,q.error);requireThat(action.expectedLevel===undefined||action.expectedLevel===q.level,'Le niveau a changé. Vérifiez la fiche.');pay(n,{gold:q.gold});n.unitCards[action.id]-=q.need;n.heroes[action.id]++;n.stats.hero++;note(n,q.hero.name+' atteint le niveau '+n.heroes[action.id]+'.',now);break;
 }
 case 'recruit':requireThat(!n.progressionVersion,'Choisissez un pack au Hall des héros.');requireThat(!n.progressionVersion||n.village.structures.some(p=>p.kind==='hall'&&!p.pending),'Construisez d’abord le Hall des héros.');requireThat(!n.heroes.nyx,'Nyx a déjà rejoint votre royaume.');pay(n,{gold:1500,aether:100});n.heroes.nyx=1;if(n.team.length<3&&n.battle?.phase!=='active')n.team.push('nyx');n.stats.recruit++;note(n,'Nyx, l’éveilleuse des ombres, rejoint vos champions.',now);break;
 case 'suggest-team':requireThat(n.battle?.phase!=='active','Terminez le raid avant de modifier l’équipe.');requireThat(suggestedTeam(n).length>0,'Débloquez d’abord une troupe.');n.team=suggestedTeam(n);break;
 case 'team':requireThat(n.heroes[action.id]>0,'Ce héros n’est pas recruté.');requireThat(!n.battle||n.battle.phase!=='active','Terminez votre raid avant de modifier l’équipe.');if(n.team.includes(action.id)){requireThat(n.team.length>1,'Gardez au moins un héros dans votre équipe.');n.team=n.team.filter(id=>id!==action.id);}else{requireThat(n.team.length<3,'Votre escouade est complète. Choisissez un héros à remplacer.');n.team.push(action.id);}break;
 case 'replace-hero':requireThat(n.battle?.phase!=='active','Terminez votre raid avant de modifier l’équipe.');requireThat(HEROES.some(h=>h.id===action.id)&&n.heroes[action.id]>0,'Ce héros n’est pas recruté.');requireThat(!n.team.includes(action.id),'Ce héros est déjà dans l’escouade.');requireThat(n.team.includes(action.remove),'Le héros à remplacer ne fait plus partie de l’escouade.');n.team=n.team.map(id=>id===action.remove?action.id:id);break;
 case 'quest':{
  const q=QUESTS.find(q=>q.id===action.id);requireThat(!!q&&!n.claimed.includes(q.id)&&n.stats[q.id]>=q.goal,'Cette récompense n’est pas disponible.');n.gold+=q.gold;n.gems+=q.gems;n.claimed.push(q.id);note(n,`Quête accomplie : ${q.title}.`,now);break;
 }
 case 'daily':{
  const day=new Date(now).toISOString().slice(0,10);requireThat(n.daily!==day,'Votre cadeau a déjà été récupéré aujourd’hui.');n.daily=day;n.onePoints=(n.onePoints||0)+25;n.gold+=300;n.wood+=200;n.gems+=15;n.potions++;note(n,'Cadeau du jour : +300 or, +200 bois, +15 gemmes, +25 points ONE, +1 potion.',now);break;
 }
 case 'raid':{
  requireThat(!n.progressionVersion||(n.buildings.castle>=3&&n.village.structures.some(p=>p.kind==='hall'&&!p.pending)&&n.team.length>0),'Construisez le Hall des héros à la citadelle 3 avant de partir en campagne.');
  requireThat(n.team.length>0,'Choisissez vos héros avant de partir.');const r=REGIONS[action.id];requireThat(!!r,'Territoire inconnu.');requireThat(action.id===0||n.cleared.includes(action.id-1),'Libérez le territoire précédent pour ouvrir cette route.');
  requireThat(!n.battle||n.battle.phase!=='active','Un raid est déjà en cours.');pay(n,{energy:r.energy,troops:3});
  const support=raidSupport(n);n.army??={archers:0,cavalry:0};for(const [unit,count]of Object.entries(support.units))if(count)n.army[unit]=(n.army[unit]||0)-count;
  const team=n.team.map(id=>{const h=heroStats(n,id),maxHp=Math.round(h.maxHp*(1+support.hp));return {...h,attack:Math.round(h.attack*(1+support.attack)),maxHp,hp:maxHp,cooldown:0,shield:false};});
  n.battle={support,region:r.id,phase:'active',round:1,actor:0,acted:[],seed:now>>>0,team,enemies:r.enemies.map((name,i)=>({id:i,name,hp:Math.round(r.hp*(i===2?1.7:1)),maxHp:Math.round(r.hp*(i===2?1.7:1)),attack:Math.round(r.attack*(i===2?1.25:1))})),log:[`Renforts : 3 gardiens, ${raidSupportText(support)||'aucun renfort supplémentaire'}. +${Math.round(support.attack*100)} % ATQ, +${Math.round(support.hp*100)} % PV.`,`Votre escouade entre dans ${r.name.toLowerCase()}.`,`Tour 1 · ${team[0].name} ouvre le combat.`]};break;
 }
 case 'combat':{
  const b=n.battle;requireThat(b?.phase==='active','Aucun combat actif.');const h=b.team[b.actor];requireThat(h&&h.hp>0,'Ce héros ne peut pas agir.');
  const target=b.enemies[action.target];requireThat(['attack','skill','guard','heal'].includes(action.move),'Action inconnue.');
  if(action.move==='attack'||action.move==='skill'){
   requireThat(target&&target.hp>0,'Choisissez un ennemi encore debout.');if(action.move==='skill')requireThat(h.cooldown===0,'Cette compétence se recharge.');
   const skill=HERO_SKILLS[h.id],multi=action.move==='skill'?skill.power:1;
   const targets=action.move==='skill'&&skill.area?b.enemies.filter(e=>e.hp>0):[target];
   for(const t of targets){const critical=rng(b)<.14;const dmg=Math.round(h.attack*multi*(.94+rng(b)*.12)*(critical?1.5:1));t.hp=Math.max(0,t.hp-dmg);b.log.push(`${h.name} ${action.move==='skill'?'déclenche '+h.skill:'attaque'} : −${dmg} PV à ${t.name}${critical?' · CRITIQUE':''}.`);}
   if(action.move==='skill'){h.cooldown=3;const allies=b.team.filter(a=>a.hp>0);if(skill.shield==='self')h.shield=true;if(skill.shield==='team'){for(const ally of allies)ally.shield=true;b.log.push(h.name+' protège toute l’escouade.');}if(skill.heal)for(const ally of allies){const amount=Math.min(ally.maxHp-ally.hp,Math.round(ally.maxHp*skill.heal));ally.hp+=amount;if(amount)b.log.push(h.name+' soigne '+ally.name+' : +'+amount+' PV.');}}
  }else if(action.move==='guard'){h.shield=true;h.hp=Math.min(h.maxHp,h.hp+Math.round(h.maxHp*.12));b.log.push(`${h.name} se protège et reprend son souffle.`);}
  else{requireThat(n.potions>0,'Vous n’avez plus de potions.');n.potions--;h.hp=Math.min(h.maxHp,h.hp+Math.round(h.maxHp*.55));b.log.push(`${h.name} boit une potion et récupère des forces.`);}
  b.log=b.log.slice(-45);if(battleEnd(n,now))break;b.acted.push(h.id);const next=b.team.findIndex(h=>h.hp>0&&!b.acted.includes(h.id));
  if(next<0)enemyTurn(n,now);else b.actor=next;break;
 }
 case 'retreat':requireThat(n.battle?.phase==='active','Aucun raid à quitter.');n.battle.phase='retreated';note(n,'Votre escouade a regagné la cité. Les ressources engagées restent dépensées.',now);break;
 case 'dismiss':requireThat(!n.battle||n.battle.phase!=='active','Le combat est toujours actif.');n.battle=null;break;
 case 'place-building':{
  n.village??=createVillage();const v=n.village,{id,kind,x,z}=action,rotation=action.rotation||0;
  const existing=id?v.structures.find(p=>p.id===id):null;
  requireThat(!id||!!existing,'Bâtiment introuvable.');
  const type=existing?.kind||kind;
  requireThat(!!PLOTS[type]&&(existing||!PLOTS[type].unique||n.progressionVersion&&type!=='castle'),'Choisissez un bâtiment du catalogue.');
  const error=placementError(v,type,x,z,rotation,id);requireThat(!error,error);
  if(existing){requireThat(!jobFor(n,id)&&!queuedWallFor(n,id),'Terminez ou annulez le chantier avant de déplacer ce bâtiment.');existing.x=x;existing.z=z;existing.rotation=rotation;note(n,`${PLOTS[type].name} déplacé.`,now);}
  else if(type==='builderhut'){const quote=builderHutQuote(n);requireThat(!quote.error,quote.error);requireThat(v.structures.length<MAX_BUILDINGS,'Limite de constructions atteinte.');pay(n,{gold:quote.gold,wood:quote.wood});v.structures.push({id:'plot-'+v.nextId++,kind:type,x,z,rotation,level:1,essential:false});n.workers=Math.max(workerCount(n),builderHuts(n).length);n.workerHutsVersion=1;n.stats.build++;note(n,quote.index?'Une cabane et un nouvel ouvrier rejoignent le village.':'La cabane de Basile est installée.',now);}
  else{const locked=constructionError(n,type);requireThat(!locked,locked);requireThat(freeWorkers(n)>0,'Tous vos ouvriers sont occupés. Attendez un bâtisseur.');requireThat(v.structures.length<MAX_BUILDINGS,'Votre village accueille au maximum '+MAX_BUILDINGS+' constructions.');pay(n,{gold:PLOTS[type].gold,wood:PLOTS[type].wood});const foundation=!!n.progressionVersion&&!!BUILDINGS[type]&&!v.structures.some(p=>p.kind===type),id=foundation||PLOTS[type].unique?type:'plot-'+v.nextId++;v.structures.push({id,kind:type,x,z,rotation,level:1,essential:foundation});if(foundation)n.buildings[type]=n.progressionVersion?0:1;if(n.progressionVersion&&type!=='wall'){v.structures.at(-1).pending=true;startBuild(n,id,8,now,'construction');note(n,`${PLOTS[type].name} : chantier commencé.`,now);}else{n.stats.build++;note(n,`${PLOTS[type].name} construit dans votre village.`,now);}}break;
 }
 case 'upgrade-plot':{
  const p=n.village?.structures.find(p=>p.id===action.id);requireThat(p&&(!p.essential||!BUILDINGS[p.id]),'Ce bâtiment ne propose pas cette amélioration.');requireThat(action.expectedLevel===undefined||action.expectedLevel===p.level,'Le niveau a changé. Ouvrez à nouveau la fiche.');requireThat(p.level<MAX_BUILDING_LEVEL,'Niveau maximum atteint.');const locked=upgradeError(n,p);requireThat(!locked,locked);
  payUpgrade(n,{gold:Math.round(PLOTS[p.kind].gold*p.level*.8),wood:Math.round(PLOTS[p.kind].wood*p.level*.8)},!!action.collect);startBuild(n,p.id,upgradeSeconds(p.kind,p.level+1),now);note(n,`Amélioration de ${PLOTS[p.kind].name} commencée.`,now);break;
 }
 case 'demolish':{
  const p=n.village?.structures.find(p=>p.id===action.id);requireThat(p?.kind!=='builderhut','Une cabane d’ouvrier peut être déplacée, mais pas démontée.');requireThat(p&&!p.essential,'Les bâtiments fondateurs ne peuvent pas être détruits.');
  requireThat(!jobFor(n,p.id)&&!queuedWallFor(n,p.id),'Terminez ou annulez le chantier avant de démonter ce bâtiment.');requireThat(!trainingJobs(n).some(q=>q.campId===p.id),'Terminez ou annulez les formations avant de démonter ce camp.');const storageError=campRemovalError(n,p.id);requireThat(!storageError,storageError);
  n.gold+=Math.floor(PLOTS[p.kind].gold*.4);n.wood+=Math.floor(PLOTS[p.kind].wood*.4);n.village.structures=n.village.structures.filter(x=>x.id!==p.id);note(n,`${PLOTS[p.kind].name} démonté. 40 % du coût initial récupéré.`,now);break;
 }
 case 'name':n.name=String(action.value).trim().slice(0,24)||'Aventurier';break;
 case 'sound':n.settings.sound=!!action.value;break;
 case 'combat-settings':if(typeof action.auto==='boolean')n.settings.autoCombat=action.auto;if([1,2].includes(action.speed))n.settings.combatSpeed=action.speed;break;
 default:throw new Error('Action inconnue.');
 }
 startQueuedWalls(n,now);
 for(const m of awardMilestones(n))note(n,`Étape accomplie : +${m.gold} or, +${m.wood} bois.`,now);
 return n;
}
export function restoreState(raw,now=Date.now()){
 if(!raw||raw.version!==1)throw new Error('Sauvegarde incompatible.');
 const starter=raw.progressionVersion===1,s=starter?createState(now):createLegacyState(now);s.progressClaims=starter?Array.isArray(raw.progressClaims)?raw.progressClaims.filter(v=>typeof v==='string'):[]:[];s.progressionPromptSeen=!!raw.progressionPromptSeen;
 for(const k of ['gold','wood','aether','gems','energy','troops','potions','xp']){requireThat(Number.isFinite(raw[k])&&raw[k]>=0,'Sauvegarde invalide.');s[k]=Math.min(raw[k],1e8);}
 s.energy=Math.min(40,s.energy);s.troops=Math.min(100000,Math.floor(s.troops));s.potions=Math.min(20,s.potions);
 for(const id of Object.keys(BUILDINGS))s.buildings[id]=cap(Math.floor(Number(raw.buildings?.[id])||(starter&&id!=='castle'?0:1)),starter&&id!=='castle'?0:1,MAX_BUILDING_LEVEL);
 for(const h of HEROES)s.heroes[h.id]=cap(Math.floor(Number(raw.heroes?.[h.id])||0),!starter&&['lyra','cael'].includes(h.id)?1:0,MAX_UNIT_LEVEL);
 s.team=Array.isArray(raw.team)?[...new Set(raw.team)].filter(id=>HEROES.some(h=>h.id===id)&&s.heroes[id]>0).slice(0,3):['lyra','cael'].filter(id=>s.heroes[id]>0);if(!s.team.length&&!starter)s.team=['lyra'];
 for(const k of Object.keys(s.stash))s.stash[k]=cap(Number(raw.stash?.[k])||0,0,1e8);
 for(const k of Object.keys(s.stats))s.stats[k]=cap(Math.floor(Number(raw.stats?.[k])||0),0,1e6);
 s.claimed=Array.isArray(raw.claimed)?QUESTS.filter(q=>raw.claimed.includes(q.id)).map(q=>q.id):[];
 s.cleared=Array.isArray(raw.cleared)?REGIONS.filter(r=>raw.cleared.includes(r.id)).map(r=>r.id):[];s.stats.conquer=s.cleared.length;
 s.village=restoreVillage(raw.village,starter);if(starter)for(const id of Object.keys(BUILDINGS)){const p=s.village.structures.find(p=>p.id===id);s.buildings[id]=p?Math.min(s.buildings[id]||p.level,id==='castle'?MAX_BUILDING_LEVEL:s.buildings.castle):0;if(p)p.level=s.buildings[id];}
 for(const unit of TRAINING_UNITS.filter(k=>k!=='guardians')){const count=cap(Math.floor(Number(raw.army?.[unit])||0),0,100000);if(count||['archers','cavalry'].includes(unit))s.army[unit]=count;}
 prepareForest(s.village,raw.village?.forest);
 restoreBuilderHuts(raw,s);restoreBuilders(raw,s,now);restoreWallQueue(raw,s);restorePacks(raw,s);restoreHeroPacks(raw,s);restoreCollection(raw,s);restoreRoyalPack(raw,s,now);
 s.trainingSerial=Math.max(1,Math.min(1e9,Math.floor(raw.trainingSerial)||1));
 const restored=[],candidates=[raw.training,...(Array.isArray(raw.trainingQueue)?raw.trainingQueue.slice(0,TRAINING_LIMIT-1):[])];
 for(const q of candidates){const spec=TRAINING[q?.unit],previous=restored.at(-1);if(!spec||!Number.isFinite(q.starts)||!Number.isFinite(q.ends)||q.ends<=q.starts||q.ends-q.starts>spec.seconds*1000||q.ends-q.starts<8000||(!previous&&q.starts>now)||(previous&&q.starts!==previous.ends)||!s.village.structures.some(p=>!p.pending&&p.id===q.campId&&(p.kind==='barracks'&&plotLevel(s,p)>=spec.level||spec.legacyKind&&p.kind===spec.legacyKind)))break;
  const id=typeof q.id==='string'&&/^training-[\d-]+$/.test(q.id)&&q.id.length<80?q.id:'training-'+q.ends+'-'+s.trainingSerial++;
  if(restored.some(j=>j.id===id))break;restored.push({id,unit:q.unit,campId:q.campId,starts:q.starts,ends:q.ends});
 }
 s.training=restored.shift()||null;s.trainingQueue=restored;
 s.settings.autoCombat=!!raw.settings?.autoCombat;s.settings.combatSpeed=raw.settings?.combatSpeed===2?2:1;
 s.name=String(raw.name||'Aventurier').slice(0,24);s.daily=typeof raw.daily==='string'?raw.daily:null;s.settings.sound=!!raw.settings?.sound;
 s.lastTick=cap(Number(raw.lastTick)||now,0,now);s.energyTick=cap(Number(raw.energyTick)||now,0,now);

 s.journal=Array.isArray(raw.journal)?raw.journal.slice(0,30).filter(j=>typeof j?.text==='string'&&Number.isFinite(j.time)).map(j=>({text:j.text.slice(0,200),time:j.time})):s.journal;
 // A single welcome camp is placed only on free terrain in pre-military saves.
 if(!starter&&!raw.militaryIntroduced&&!s.village.structures.some(p=>p.kind==='camp')&&s.village.structures.length<MAX_BUILDINGS){const b=s.village.structures.find(p=>p.kind==='barracks'),pos=findFreePlot(s.village,'camp',0,b?{x:b.x-5,z:b.z}:{x:-12,z:0});if(pos){s.village.structures.push({id:'plot-'+s.village.nextId++,kind:'camp',...pos,rotation:0,level:1,essential:false});note(s,'Un camp de gardiens offert rejoint votre village. Les camps accueillent vos troupes ; la caserne les forme.',now);}}
 if(!starter&&!raw.townIntroduced){const added=expandTown(s.village);if(added)note(s,'La cité s’agrandit : '+added+' constructions offertes, dont le marché, l’académie et la fontaine. Vos bâtiments restent à leur place.',now);}
 if(!starter&&!raw.fortressIntroduced){const added=fortifyTown(s.village);if(added)note(s,'Votre base se fortifie : '+added+' défenses et remparts offerts sur des emplacements libres.',now);}
 s.siegeCleared=Array.isArray(raw.siegeCleared)?[0,1,2].filter(n=>raw.siegeCleared.includes(n)):[];
 s.siege=restoreSiege(raw.siege,s);
 // Battles are validated separately. A corrupted snapshot cannot grant rewards.
 const b=raw.battle;
 if(b&&REGIONS[b.region]&&['active','won','lost','retreated'].includes(b.phase)&&Array.isArray(b.team)&&b.team.length>0&&b.team.length<=3&&Array.isArray(b.enemies)&&b.enemies.length===3&&Number.isInteger(b.actor)&&b.actor>=0&&b.actor<b.team.length&&Number.isFinite(b.round)&&b.round>=1&&Array.isArray(b.acted)&&Array.isArray(b.log)){
  const validUnits=[...b.team,...b.enemies].every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.maxHp)&&u.maxHp>0&&u.hp>=0&&u.hp<=u.maxHp&&Number.isFinite(u.attack)&&u.attack>0);
  const validHeroes=b.team.every(h=>HEROES.some(x=>x.id===h.id)&&Number.isFinite(h.cooldown)&&h.cooldown>=0)&&new Set(b.team.map(h=>h.id)).size===b.team.length;
  if(Number.isInteger(b.region)&&validUnits&&validHeroes&&(b.phase!=='active'||(b.team[b.actor].hp>0&&b.enemies.some(e=>e.hp>0)))){
   s.battle=structuredClone(b);
   s.battle.team=s.battle.team.map(h=>({...h,...Object.fromEntries(['name','title','role','skill','description','portrait','color','rarity'].map(k=>[k,HEROES.find(x=>x.id===h.id)[k]])),shield:!!h.shield}));
   s.battle.enemies=s.battle.enemies.map((e,i)=>({...e,id:i,name:REGIONS[b.region].enemies[i]}));
   s.battle.log=s.battle.log.slice(-45).filter(l=>typeof l==='string').map(l=>l.slice(0,250));
   if(b.phase==='won')s.battle.reward=Object.fromEntries(['gold','wood','aether','xp','gems'].map(k=>[k,cap(Number(b.reward?.[k])||0,0,1e8)]));
  }
 }
 restoreAssault(s,raw);
 return advance(s,now);
}

// Explicit real-time advancement. Trials pause while the page is hidden or outside the village.
export function advanceDefense(s,dt){stepSiege(s.siege,dt);settleSiege(s);return s;}
