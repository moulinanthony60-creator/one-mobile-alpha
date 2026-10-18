// One catalogue drives recruitment, housing and raid reinforcements.
// Levels are completed barracks levels, never the level of a pending upgrade.
export const TRAINING={
 guardians:{name:'Gardiens',singular:'gardien',level:1,kind:'barracks',legacyKind:'camp',portrait:'porte-bouclier',count:4,gold:120,wood:80,seconds:20,space:1,raid:0,attack:0,hp:0,actor:'guardian',desc:'3 gardiens sont nécessaires pour lancer un raid.'},
 archers:{name:'Archers',singular:'archer',level:2,kind:'barracks',legacyKind:'archery',portrait:'archer-bois',count:3,gold:180,wood:120,seconds:30,space:1,raid:3,attack:.06,hp:0,actor:'archer',desc:'Jusqu’à 3 par raid · +6 % d’attaque chacun.'},
 lancers:{name:'Lanciers',singular:'lancier',level:3,kind:'barracks',portrait:'lancier',count:3,gold:210,wood:140,seconds:35,space:2,raid:2,attack:.025,hp:.015,actor:'guardian',desc:'Jusqu’à 2 par raid · +2,5 % ATQ et +1,5 % PV chacun.'},
 cavalry:{name:'Cavaliers',singular:'cavalier',level:4,kind:'barracks',legacyKind:'stable',portrait:'cavalier-leger',count:2,gold:240,wood:160,seconds:40,space:4,raid:2,attack:.03,hp:.05,actor:'rider',desc:'Jusqu’à 2 par raid · +3 % ATQ et +5 % PV chacun.'},
 swordsmen:{name:'Épéistes',singular:'épéiste',level:5,kind:'barracks',portrait:'epeiste',count:3,gold:300,wood:190,seconds:48,space:2,raid:2,attack:.04,hp:0,actor:'guardian',desc:'Jusqu’à 2 par raid · +4 % d’attaque chacun.'},
 crossbows:{name:'Arbalétriers',singular:'arbalétrier',level:6,kind:'barracks',portrait:'arbaletrier',count:3,gold:360,wood:240,seconds:55,space:2,raid:2,attack:.045,hp:0,actor:'archer',desc:'Jusqu’à 2 par raid · +4,5 % d’attaque chacun.'},
 knights:{name:'Chevaliers',singular:'chevalier',level:7,kind:'barracks',portrait:'chevalier-acier',count:2,gold:420,wood:280,seconds:65,space:4,raid:1,attack:.02,hp:.08,actor:'guardian',desc:'1 par raid · +2 % d’attaque et +8 % de PV.'},
 berserkers:{name:'Berserkers',singular:'berserker',level:8,kind:'barracks',portrait:'berserker',count:2,gold:480,wood:320,seconds:75,space:4,raid:1,attack:.08,hp:0,actor:'guardian',desc:'1 par raid · +8 % d’attaque.'},
 mages:{name:'Mages',singular:'mage',level:9,kind:'barracks',portrait:'alchimiste',count:1,gold:540,wood:360,seconds:85,space:4,raid:1,attack:.10,hp:0,actor:'archer',desc:'1 par raid · +10 % d’attaque.'},
 healers:{name:'Soigneuses',singular:'soigneuse',level:10,kind:'barracks',portrait:'pretresse-sources',count:1,gold:600,wood:400,seconds:95,space:4,raid:1,attack:0,hp:.10,actor:'archer',desc:'1 par raid · +10 % de PV pour l’escouade.'}
};
export const TRAINING_UNITS=Object.keys(TRAINING);
export const plotLevel=(s,p)=>p?Math.max(0,Number(p.essential?s.buildings?.[p.id]??p.level:p.level)||0):0;
export function barracksLevel(s){return Math.max(0,...(s.village?.structures||[]).filter(p=>p.kind==='barracks'&&!p.pending).map(p=>plotLevel(s,p)));}
export const unlockedTraining=level=>Object.values(TRAINING).filter(t=>t.level<=level);
