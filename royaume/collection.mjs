// The collection contains exactly 20 common, 10 rare, 5 epic, 3 legendary and 1 ultra unit.
export const MAX_UNIT_LEVEL=13;
export const RARITIES={
 common:{name:'Commune',plural:'Communes',color:'#9aada8',chance:55,count:20,gold:1,cards:[2,4,6,10,14,20,28,36,46,58,72,88]},
 rare:{name:'Rare',plural:'Rares',color:'#6bbbd7',chance:25,count:10,gold:1.2,cards:[1,2,3,4,6,8,10,13,16,20,24,30]},
 epic:{name:'Épique',plural:'Épiques',color:'#b790ed',chance:13,count:5,gold:1.5,cards:[1,1,2,2,3,4,5,6,8,10,12,15]},
 legendary:{name:'Légendaire',plural:'Légendaires',color:'#e4b557',chance:6,count:3,gold:1.9,cards:[1,1,1,2,2,3,3,4,5,6,7,8]},
 ultra:{name:'Ultra-légendaire',plural:'Ultra-légendaire',color:'#ed98a5',chance:1,count:1,gold:2.5,cards:[1,1,1,1,1,2,2,2,3,3,4,5]}
};
const GOLD_LEVELS=[100,180,300,480,720,1050,1500,2100,2900,3900,5200,6800];
const PROFILES={
 assault:{role:'Assaut',hp:260,attack:44,skill:'Frappe décisive',power:1.8},
 ranged:{role:'À distance',hp:195,attack:51,skill:'Tir de précision',power:1.9},
 guard:{role:'Défense',hp:325,attack:36,skill:'Garde de fer',power:1.4,shield:'self'},
 cavalry:{role:'Cavalerie',hp:280,attack:46,skill:'Charge',power:1.7},
 healer:{role:'Soutien',hp:220,attack:40,skill:'Souffle de vie',power:1.0,heal:.08},
 mage:{role:'Magie',hp:205,attack:48,skill:'Onde arcanique',power:.9,area:true}
};
function describe(p){return `Inflige ${Math.round(p.power*100)} % de dégâts ${p.area?'à tous les ennemis':'à un ennemi'}.`+(p.shield?' Réduit de 55 % le prochain coup reçu.':'')+(p.heal?` Rend ${Math.round(p.heal*100)} % des PV maximum aux alliés encore debout.`:'');}
const rows=[
 ['epeiste','Épéiste','assault'],['lancier','Lancier','assault'],['archer-bois','Archer des bois','ranged'],['eclaireuse','Éclaireuse','ranged'],['porte-bouclier','Porte-bouclier','guard'],['frondeur','Frondeur','ranged'],['piquier','Piquier','assault'],['arbaletrier','Arbalétrier','ranged'],['hacheur','Hacheur','assault'],['veilleur','Veilleur','guard'],
 ['ecuyere','Écuyère','guard'],['chasseur','Chasseur','ranged'],['gardienne','Gardienne','guard'],['pisteur','Pisteur','ranged'],['milicien','Milicien','assault'],['cavalier-leger','Cavalier léger','cavalry'],['messagere','Messagère','cavalry'],['patrouilleur','Patrouilleur','guard'],['fauconnier','Fauconnier','ranged'],['eclaireur-monte','Éclaireur monté','cavalry'],
 ['chevalier-acier','Chevalier d’acier','guard'],['ranger-sylvestre','Ranger sylvestre','ranged'],['maitre-arbaletrier','Maître arbalétrier','ranged'],['berserker','Berserker','assault'],['sentinelle-opale','Sentinelle d’opale','guard'],['amazone','Amazone','assault'],['lame-ombre','Lame d’ombre','assault'],['cavalier-runique','Cavalier runique','cavalry'],['alchimiste','Alchimiste','mage'],['pretresse-sources','Prêtresse des sources','healer']
];
const recruits=rows.map(([id,name,profile],i)=>{const rarityKey=i<20?'common':'rare',r=RARITIES[rarityKey],p=PROFILES[profile],boost=i<20?1:1.12;return {id,name,title:name,profile,role:p.role,rarityKey,rarity:r.name.toLocaleUpperCase('fr-FR'),color:r.color,portrait:6+i,atlas:i<10?'common-a':i<20?'common-b':'rare',cell:i%10,cols:5,rows:2,hp:Math.round((p.hp+i%5*5)*boost),attack:Math.round((p.attack+i%3)*boost),skill:p.skill,description:describe(p)};});
const FOUNDERS = [
  {id:'lyra',name:'Lyra',title:'La flèche d’émeraude',role:'Rôdeuse',rarity:'ÉPIQUE',color:'#6de0b5',portrait:0,hp:250,attack:57,skill:'Pluie de flèches',description:'Une attaque précise qui inflige 190 % de dégâts à un ennemi.'},
  {id:'cael',name:'Kael',title:'Le serment du soleil',role:'Gardien',rarity:'ÉPIQUE',color:'#edc77d',portrait:1,hp:370,attack:43,skill:'Lame solaire',description:'Inflige 160 % de dégâts et protège Kael jusqu’à la prochaine attaque ennemie.'},
  {id:'nyx',name:'Nyx',title:'L’éveilleuse des ombres',role:'Arcaniste',rarity:'LÉGENDAIRE',color:'#bf9aff',portrait:2,hp:235,attack:66,skill:'Éclipse',description:'Une vague d’éther qui frappe tous les ennemis à 115 % de puissance.'},
  {id:'doran',name:'Doran',title:'Le rempart de granit',role:'Protecteur',rarity:'ÉPIQUE',color:'#d8b48a',portrait:4,hp:430,attack:36,skill:'Rempart de pierre',description:'Frappe à 100 % de puissance et réduit de 55 % le prochain coup reçu par chaque allié encore debout.'},
  {id:'eira',name:'Eira',title:'La gardienne des sources',role:'Soigneuse',rarity:'LÉGENDAIRE',color:'#86d9de',portrait:5,hp:270,attack:45,skill:'Source de Valdoria',description:'Frappe un ennemi à 120 % de puissance et rend 15 % des PV maximum à chaque allié encore debout.'}
];

for(const h of FOUNDERS)h.rarityKey=['nyx','eira'].includes(h.id)?'legendary':'epic';
const specials=[
 {id:'sorciere-braises',name:'Sorcière des braises',title:'Le feu du crépuscule',role:'Magie',rarityKey:'epic',hp:240,attack:61,skill:'Déluge de braises',atlas:'epic',cell:1,cols:3,rows:2,power:1.05,area:true},
 {id:'griffonnier',name:'Griffonnier',title:'La lance du ciel',role:'Cavalerie',rarityKey:'epic',hp:340,attack:55,skill:'Piqué du griffon',atlas:'epic',cell:4,cols:3,rows:2,power:2.2},
 {id:'reine-tempetes',name:'Reine des tempêtes',title:'La souveraine des orages',role:'Magie',rarityKey:'legendary',hp:300,attack:65,skill:'Couronne d’éclairs',atlas:'legendary',cell:2,cols:3,rows:1,power:1.3,area:true},
 {id:'aurelion',name:'Aurelion',title:'Le dragon primordial',role:'Dragon',rarityKey:'ultra',hp:490,attack:74,skill:'Souffle primordial',atlas:'ultra',cell:0,cols:1,rows:1,power:1.45,area:true,shield:'self'}
].map((h,i)=>({...h,portrait:36+i,color:RARITIES[h.rarityKey].color,rarity:RARITIES[h.rarityKey].name.toLocaleUpperCase('fr-FR'),description:describe(h)}));
export const UNITS=[...recruits,...FOUNDERS.filter(h=>h.rarityKey==='epic'),...specials.filter(h=>h.rarityKey==='epic'),...FOUNDERS.filter(h=>h.rarityKey==='legendary'),...specials.filter(h=>h.rarityKey==='legendary'),specials.find(h=>h.rarityKey==='ultra')].map((u,i)=>({...u,atlas:i<15?'cartoon-a':i<30?'cartoon-b':'cartoon-c',cell:i<30?i%15:i-30,cols:i<30?5:3,rows:3}));
export const UNIT_SKILLS={...Object.fromEntries(recruits.map(h=>[h.id,PROFILES[h.profile]])),lyra:{power:1.9},cael:{power:1.6,shield:'self'},nyx:{power:1.15,area:true},doran:{power:1,shield:'team'},eira:{power:1.2,heal:.15},...Object.fromEntries(specials.map(h=>[h.id,{power:h.power,area:h.area,shield:h.shield}]))};
export const unitById=id=>UNITS.find(h=>h.id===id);
export const collectionAccess=s=>s.village.structures.some(p=>!p.pending&&['hall','camp','barracks'].includes(p.kind));
export function collectionSummary(s){const owned=UNITS.filter(u=>s.heroes[u.id]>0),ready=owned.filter(u=>!unitUpgradeQuote(s,u.id).error);return {owned:owned.length,ready:ready.length,favorites:(s.unitFavorites||[]).length,cards:Object.values(s.unitCards||{}).reduce((n,v)=>n+v,0)};}
export function unitRole(u){const profile=u.profile||({lyra:'ranged',cael:'guard',nyx:'mage',doran:'guard',eira:'healer','sorciere-braises':'mage',griffonnier:'cavalry','reine-tempetes':'mage',aurelion:'dragon'}[u.id]);return {key:profile,...({assault:{label:'Assaut',icon:'swords',hint:'Forte frappe sur une cible'},ranged:{label:'Tir',icon:'target',hint:'Attaque précise à distance'},guard:{label:'Défense',icon:'shield',hint:'Encaisse et protège'},cavalry:{label:'Cavalerie',icon:'swords',hint:'Charge à forte puissance'},healer:{label:'Soutien',icon:'heart',hint:'Soigne les alliés'},mage:{label:'Magie',icon:'spark',hint:'Frappe plusieurs ennemis'},dragon:{label:'Dragon',icon:'spark',hint:'Souffle de zone et protection'}}[profile])};}
export function unitUpgradeQuote(s,id){
 const h=unitById(id),level=s.heroes[id]||0,cards=s.unitCards?.[id]||0,max=level>=MAX_UNIT_LEVEL,need=h&&!max&&level?RARITIES[h.rarityKey].cards[level-1]:0;
 const gold=h&&level&&!max?Math.round(GOLD_LEVELS[level-1]*RARITIES[h.rarityKey].gold):0;
 const error=!h?'Troupe inconnue.':!level?'Débloquez cette troupe dans le coffre.':!collectionAccess(s)?'Construisez un camp ou le Hall des héros.':max?'Niveau maximum atteint.':cards<need?`${need-cards} carte${need-cards>1?'s':''} supplémentaire${need-cards>1?'s':''} nécessaire${need-cards>1?'s':''}.`:s.gold<gold?'Or insuffisant.':null;
 return {hero:h,level,cards,need,gold,max,error};
}
export function restoreCollection(raw,s){
 s.collectionVersion=1;s.unitCards=Object.fromEntries(UNITS.map(h=>[h.id,Math.max(0,Math.min(1e6,Math.floor(Number(raw.unitCards?.[h.id])||0)))]));
 s.unitFavorites=[...new Set((Array.isArray(raw.unitFavorites)?raw.unitFavorites:[]).filter(id=>unitById(id)))].slice(0,39);
}
