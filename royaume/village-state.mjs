import {forestTrees,treeOverlaps} from './forest.mjs?v=34';
import {MAX_BUILDING_LEVEL} from './building-levels.mjs?v=34';
export const GRID_MIN=-40,GRID_MAX=41,GRID_SIZE=81,MAX_BUILDINGS=600;
export const PLOTS={
 builderhut:{name:'Cabane d’ouvrier',w:2,d:2,gold:0,wood:0,group:'Cité',desc:'Une cabane accueille un ouvrier permanent. Trois cabanes se débloquent en jouant ; deux emplacements ONE supplémentaires sont réservés.'},
 mortar:{name:'Mortier royal',w:2,d:2,gold:580,wood:300,group:'Défenses',desc:'Bombarde les groupes d’assaillants. Dégâts de zone, longue portée et cadence lente.'},
 ballista:{name:'Baliste',w:3,d:2,gold:620,wood:450,group:'Défenses',desc:'Transperce les ennemis à longue distance. Excellente contre les brutes.'},
 arcane:{name:'Tour d’éther',w:2,d:2,gold:850,wood:520,group:'Défenses',desc:'Frappe rapidement les assaillants avec des éclairs d’éther.'},
 market:{name:'Marché royal',w:4,d:3,gold:540,wood:340,group:'Ressources',desc:'Les étals et leurs marchands produisent 24 or par minute et par niveau.'},
 academy:{name:'Académie de guerre',w:4,d:4,gold:780,wood:520,group:'Armée',desc:'Les instructeurs renforcent l’attaque de tous vos héros de 2 % par niveau. Accès aux formations.'},
 fountain:{name:'Fontaine de Valdoria',w:2,d:2,gold:260,wood:180,group:'Cité',desc:'Une place de repos au cœur de la cité. Renforce les PV de vos héros de 2 % par niveau.'},
 camp:{name:'Camp militaire',w:4,d:3,gold:320,wood:240,group:'Armée',desc:'Accueille 20 places d’armée au niveau 1, puis 4 de plus par niveau. Gardiens et archers occupent 1 place, les cavaliers 4. Permet aussi de former des gardiens.'},
 archery:{name:'Stand d’archers',w:4,d:3,gold:460,wood:320,group:'Armée',desc:'Forme 3 archers en 30 secondes. Jusqu’à 3 archers accompagnent chaque raid : +6 % d’attaque chacun.'},
 stable:{name:'Écuries',w:4,d:3,gold:650,wood:420,group:'Armée',desc:'Forme 2 cavaliers en 40 secondes. Jusqu’à 2 cavaliers accompagnent chaque raid : +5 % de PV et +3 % d’attaque chacun.'},
 hall:{name:'Hall des héros',unique:true,w:4,d:4,gold:520,wood:360,group:'Cité',desc:'Le lieu de rassemblement de vos champions. Entrez pour recruter, améliorer et composer votre escouade.'},
 tavern:{name:'Taverne des aventuriers',unique:true,w:3,d:3,gold:380,wood:280,group:'Cité',desc:'Retrouvez les quêtes du royaume et récupérez vos récompenses au comptoir.'},
 castle:{name:'Citadelle',unique:true,w:4,d:4,gold:0,wood:0,group:'Cité',desc:'Le cœur de votre royaume.'},
 mine:{name:'Mine d’or',w:3,d:3,gold:380,wood:220,group:'Ressources',desc:'Produit 30 or supplémentaires par minute.'},
 forge:{name:'Forge',w:3,d:2,gold:460,wood:320,group:'Armée',desc:'Renforce l’attaque des héros de 3 % par niveau.'},
 barracks:{name:'Caserne',w:3,d:3,gold:420,wood:280,group:'Armée',desc:'Renforce l’attaque des héros de 2 % par niveau.'},
 tree:{name:'Scierie',w:3,d:3,gold:300,wood:180,group:'Ressources',desc:'Les bûcherons produisent du bois pour construire et améliorer le village.'},
 shrine:{name:'Sanctuaire',w:2,d:2,gold:500,wood:300,group:'Ressources',desc:'Produit 2 éther supplémentaires par minute.'},
 cottage:{name:'Maison',w:2,d:2,gold:180,wood:140,group:'Cité',desc:'Les habitants produisent 8 or par minute et par niveau.'},
 mill:{name:'Moulin',w:3,d:3,gold:340,wood:260,group:'Ressources',desc:'Produit 25 bois par minute et par niveau.'},
 tower:{name:'Tour de garde',w:2,d:2,gold:350,wood:200,group:'Défenses',desc:'Tire des flèches sur les assaillants à portée. Renforce aussi les PV de votre escouade de 3 % par niveau.'},
 cannon:{name:'Canon',w:2,d:2,gold:480,wood:150,group:'Défenses',desc:'Tire des boulets sur les assaillants à portée. Renforce aussi l’attaque des héros de 3 % par niveau.'},
 vault:{name:'Trésorerie',w:3,d:3,gold:650,wood:420,group:'Ressources',desc:'Ajoute 1 200 places à la réserve d’or par niveau.'},
 reservoir:{name:'Réserve d’éther',w:3,d:3,gold:600,wood:380,group:'Ressources',desc:'Ajoute 240 places à la réserve d’éther par niveau.'},
 wall:{name:'Rempart',w:1,d:1,gold:35,wood:15,group:'Défenses',desc:'Tracez jusqu’à 32 segments d’un geste. Les murs ralentissent les assaillants et ajoutent 0,3 % de PV à votre escouade par niveau.'}
};
const essential=[['hall',-1,-10],['tavern',7,10],['castle',-2,-3],['mine',-8,-5],['forge',4,-5],['barracks',-7,2],['tree',4,4],['shrine',0,4]];
export function createStarterVillage(){return {structures:[{id:'castle',kind:'castle',x:-2,z:-2,rotation:0,level:1,essential:true}],nextId:100};}
export function createVillage(){
 const structures=essential.map(([kind,x,z])=>({id:kind,kind,x,z,rotation:0,level:1,essential:true}));
 for(const [kind,x,z,rotation]of [['camp',-12,-2,0],['archery',-12,2,0],['stable',-12,-8,0],['cottage',-9,7,0],['cottage',8,6,0],['mill',7,-1,0],['tower',3,-9,0],['cannon',-5,-9,0]])structures.push({id:'plot-'+structures.length,kind,x,z,rotation,level:1,essential:false});
 for(let x=-5;x<=5;x++)if(x!==0&&x!==1)structures.push({id:'plot-'+structures.length,kind:'wall',x,z:9,rotation:0,level:1,essential:false});
 for(let z=2;z<=7;z++)structures.push({id:'plot-'+structures.length,kind:'wall',x:10,z,rotation:1,level:1,essential:false});
 const village={structures,nextId:100};expandTown(village);fortifyTown(village);return village;
}
// Offered once. Existing structures are never moved; the walls leave gate openings.
export function fortifyTown(village){
 const anchor=village.structures.find(p=>p.kind==='castle')||{x:-2,z:-3},dx=anchor.x+2,dz=anchor.z+3;
 let added=0;
 function place(kind,x,z,rotation=0){x+=dx;z+=dz;if(village.structures.length>=MAX_BUILDINGS||placementError(village,kind,x,z,rotation))return;village.structures.push({id:'plot-'+village.nextId++,kind,x,z,rotation,level:1,essential:false});added++;}
 // Defenses go in before walls, so the free expansion cannot crowd them out.
 for(const [kind,x,z]of [['mortar',4,0],['ballista',-8,-12],['arcane',2,7],['cannon',-3,10],['tower',9,-9],['cannon',-14,7]]){
  if(village.structures.length>=MAX_BUILDINGS)break;const pos=findFreePlot(village,kind,0,{x:x+dx,z:z+dz});if(pos)place(kind,pos.x-dx,pos.z-dz);
 }
 for(let x=-15;x<=12;x++){if(x< -3||x>0)place('wall',x,-13,0);if(x< -2||x>1)place('wall',x,14,0);}
 for(let z=-12;z<14;z++){if(z< -1||z>1)place('wall',-15,z,1);if(z<3||z>5)place('wall',12,z,1);}
 for(let x=-4;x<=3;x++){if(x!==-1&&x!==0)place('wall',x,-5,0);if(x!==-1&&x!==0)place('wall',x,3,0);}
 for(let z=-4;z<=2;z++){if(z!==-1&&z!==0)place('wall',-4,z,1);if(z!==-1&&z!==0)place('wall',3,z,1);}
 for(let z=-11;z<8;z++)if(z!==-1&&z!==0&&z!==4)place('wall',-9,z,1);
 return added;
}
export function wallLine(start,end,verticalFirst=false){
 const out=[],x=Math.round(start.x),z=Math.round(start.z),ex=Math.round(end.x),ez=Math.round(end.z);
 if(![x,z,ex,ez].every(Number.isFinite))return out;
 let cx=x,cz=z;out.push({x:cx,z:cz,rotation:verticalFirst?1:0});
 for(const axis of verticalFirst?['z','x']:['x','z']){const target=axis==='x'?ex:ez;while((axis==='x'?cx:cz)!==target&&out.length<32){if(axis==='x')cx+=Math.sign(target-cx);else cz+=Math.sign(target-cz);out.push({x:cx,z:cz,rotation:axis==='x'?0:1});}}
 return out;
}
export function wallPlan(village,cells){
 if(!Array.isArray(cells)||!cells.length||cells.length>32)return {cells:[],error:'Tracez de 1 à 32 remparts.'};
 const fresh=[],seen=new Set();let previous=null;
 for(const c of cells){if(!c||![c.x,c.z,c.rotation].every(Number.isInteger)||c.rotation<0||c.rotation>3)return {cells:[],error:'Tracé invalide.'};const key=c.x+','+c.z;if(seen.has(key))return {cells:[],error:'Tracé invalide.'};seen.add(key);
  if(previous&&Math.abs(c.x-previous.x)+Math.abs(c.z-previous.z)!==1)return {cells:[],error:'Les remparts doivent se toucher.'};previous=c;
  if(village.structures.some(p=>p.kind==='wall'&&p.x===c.x&&p.z===c.z))continue;
  const error=placementError(village,'wall',c.x,c.z,c.rotation);if(error)return {cells:fresh,error};fresh.push({x:c.x,z:c.z,rotation:c.rotation});
 }
 if(!fresh.length)return {cells:[],error:'Ces remparts existent déjà.'};
 if(village.structures.length+fresh.length>MAX_BUILDINGS)return {cells:fresh,error:'Limite de constructions atteinte.'};
 return {cells:fresh,error:null,gold:fresh.length*PLOTS.wall.gold,wood:fresh.length*PLOTS.wall.wood};
}
// A one-time town expansion uses only free cells and never rearranges player buildings.
export function expandTown(village){
 const anchor=village.structures.find(p=>p.kind==='barracks')||{x:-7,z:2};
 const additions=[['market',6,3],['academy',-6,-3],['fountain',5,7],['cottage',-1,7],['cottage',-4,6],['tower',-10,4],['vault',8,-4]];
 let added=0;
 for(const [kind,dx,dz]of additions){if(village.structures.length>=MAX_BUILDINGS)break;if(['market','academy','fountain'].includes(kind)&&village.structures.some(p=>p.kind===kind))continue;
  const origin={x:anchor.x+dx,z:anchor.z+dz},pos=findFreePlot(village,kind,0,origin);if(!pos)continue;village.structures.push({id:'plot-'+village.nextId++,kind,...pos,rotation:0,level:1,essential:false});added++;
 }return added;
}
export function footprint(kind,rotation=0){const p=PLOTS[kind];return rotation%2?{w:p.d,d:p.w}:{w:p.w,d:p.d};}
export function placementError(village,kind,x,z,rotation=0,ignoreId=null){
 if(!PLOTS[kind]||!Number.isInteger(x)||!Number.isInteger(z)||!Number.isInteger(rotation)||rotation<0||rotation>3)return 'Emplacement invalide.';
 const f=footprint(kind,rotation);
 if(x<GRID_MIN||z<GRID_MIN||x+f.w>GRID_MAX||z+f.d>GRID_MAX)return 'Restez dans la zone constructible.';
 if(forestTrees(village).some(t=>treeOverlaps(t,{x,z,...f})))return 'Coupez d’abord les arbres sur cet emplacement.';
 for(const s of village.structures){if(s.id===ignoreId)continue;const b=footprint(s.kind,s.rotation);if(x<s.x+b.w&&x+f.w>s.x&&z<s.z+b.d&&z+f.d>s.z)return 'Cet emplacement est déjà occupé.';}
 return null;
}
const searchCells=[];for(let x=GRID_MIN;x<GRID_MAX;x++)for(let z=GRID_MIN;z<GRID_MAX;z++)searchCells.push({x,z});
const byDistance=(origin)=>(a,b)=>Math.abs(a.x-origin.x)+Math.abs(a.z-origin.z)-Math.abs(b.x-origin.x)-Math.abs(b.z-origin.z)||a.x-b.x||a.z-b.z;
const defaultSearch=[...searchCells].sort(byDistance({x:5,z:2}));
export function findFreePlot(village,kind,rotation=0,origin=null){
 const cells=origin?[...searchCells].sort(byDistance(origin)):defaultSearch;
 for(const {x,z} of cells)if(!placementError(village,kind,x,z,rotation))return {x,z};return null;
}
export function restoreVillage(raw,starter=false){
 const base=starter?createStarterVillage():createVillage();if(!raw||!Array.isArray(raw.structures))return base;
 const v={structures:[],nextId:100};
 for(const s of raw.structures.slice(0,MAX_BUILDINGS+2)){
  if(!s||!PLOTS[s.kind]||typeof s.id!=='string'||!/^([a-z]+|plot-\d+)$/.test(s.id)||v.structures.some(p=>p.id===s.id))continue;
  const essential=starter?s.id===s.kind&&['castle','mine','tree','shrine','forge','barracks'].includes(s.kind):base.structures.some(p=>p.essential&&p.id===s.id&&p.kind===s.kind);
  if(PLOTS[s.kind].unique&&!essential&&!(starter&&s.id===s.kind&&!v.structures.some(p=>p.kind===s.kind)))continue;
  if(!essential&&!/^plot-\d+$/.test(s.id)&&!(starter&&PLOTS[s.kind].unique&&s.id===s.kind))continue;
  if(placementError(v,s.kind,s.x,s.z,s.rotation))continue;
  v.structures.push({id:s.id,kind:s.kind,x:s.x,z:s.z,rotation:s.rotation,level:Math.max(1,Math.min(MAX_BUILDING_LEVEL,Math.floor(Number(s.level)||1))),essential});
 }
 for(const original of base.structures.filter(s=>s.essential))if(!v.structures.some(s=>s.id===original.id)){
  const pos=findFreePlot(v,original.kind);if(!pos)continue;v.structures.push({...original,...pos});
 }
 v.nextId=Math.max(100,...v.structures.filter(s=>s.id.startsWith('plot-')).map(s=>Number(s.id.slice(5))+1));return v;
}
export function villageBonus(v){
 const b={gold:0,wood:0,aether:0,attack:0,hp:0,goldStorage:0,aetherStorage:0};
 for(const p of v?.structures||[]){if(p.essential||p.pending)continue;const l=p.level;
  if(p.kind==='market')b.gold+=24*l;if(p.kind==='academy')b.attack+=.02*l;if(p.kind==='fountain')b.hp+=.02*l;
  if(p.kind==='vault')b.goldStorage+=1200*l;if(p.kind==='reservoir')b.aetherStorage+=240*l;
  if(p.kind==='mine')b.gold+=30*l;if(p.kind==='cottage')b.gold+=8*l;if(p.kind==='tree')b.wood+=20*l;if(p.kind==='mill')b.wood+=25*l;if(p.kind==='shrine')b.aether+=2*l;
  if(p.kind==='forge'||p.kind==='cannon')b.attack+=.03*l;if(p.kind==='barracks')b.attack+=.02*l;if(p.kind==='tower')b.hp+=.03*l;if(p.kind==='wall')b.hp+=.003*l;
 }return b;
}
