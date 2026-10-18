import {housingError} from './army-camps.mjs?v=34';
// Guaranteed, one-time unlocks. These ONE points belong to this local demo;
// no external wallet, purchase or random draw is involved.
export const TROOP_PACKS={
 guardians:{name:'Serment des gardiens',unit:'Gardiens',level:2,points:0,count:4,kind:'camp',capacity:100,detail:'Une première ligne solide pour protéger vos héros.'},
 archers:{name:'Flèches d’émeraude',unit:'Archers',level:3,points:100,count:3,kind:'archery',capacity:60,detail:'Des renforts à distance qui augmentent l’attaque en raid.'},
 cavalry:{name:'Chevauchée de Valdoria',unit:'Cavaliers',level:4,points:150,count:2,kind:'stable',capacity:30,detail:'Des renforts montés qui améliorent attaque et résistance.'}
};
export const troopUnlocked=(s,unit)=>!s.packVersion||(s.unlockedTroops||[]).includes(unit);
export const hasRecruitmentCamp=s=>s.village.structures.some(p=>!p.pending&&['camp','barracks'].includes(p.kind));
export function packError(s,unit){
 const p=TROOP_PACKS[unit];if(!p)return 'Pack inconnu.';
 if(troopUnlocked(s,unit))return 'Cette troupe est déjà débloquée.';
 if(!hasRecruitmentCamp(s))return 'Construisez le camp de formation pour ouvrir des packs.';
 if(s.buildings.castle<p.level)return 'Disponible à la citadelle niveau '+p.level+'.';
 const spaceError=housingError(s,unit,p.count);if(spaceError)return spaceError;
 if((s.onePoints||0)<p.points)return 'Points ONE insuffisants. Le cadeau quotidien et les niveaux de citadelle en offrent.';
 return null;
}
export function restorePacks(raw,s){
 s.packVersion=1;
 s.onePoints=Number.isFinite(raw.onePoints)?Math.max(0,Math.min(1e8,Math.floor(raw.onePoints))):Math.max(0,s.buildings.castle-1)*100;
 s.unlockedTroops=raw.packVersion===1?[...new Set((Array.isArray(raw.unlockedTroops)?raw.unlockedTroops:[]).filter(k=>TROOP_PACKS[k]))]:Object.keys(TROOP_PACKS).filter(k=>!s.progressionVersion||s.village.structures.some(p=>!p.pending&&(p.kind===TROOP_PACKS[k].kind||k==='guardians'&&p.kind==='barracks'))||(k==='guardians'?s.troops:s.army[k])>0);
}
