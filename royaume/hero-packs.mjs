// Guaranteed unlocks purchased with exactly one local game currency.
// ONE here is the saved demo balance; no external account is charged.
export const HERO_PACKS = {
 doran:{id:'doran',hero:'doran',name:'Le rempart de granit',level:3,onePoints:150,gems:90,tag:'PROTECTION',detail:'Doran protège toute l’escouade avec son rempart de pierre.'},
 nyx:{id:'nyx',hero:'nyx',name:'Le pacte des ombres',level:3,onePoints:200,gems:120,tag:'DÉGÂTS DE ZONE',detail:'Nyx frappe tous les ennemis avec sa magie d’éther.'},
 eira:{id:'eira',hero:'eira',name:'La source de Valdoria',level:4,onePoints:250,gems:150,tag:'SOIN D’ÉQUIPE',detail:'Eira soigne les alliés encore debout tout en frappant un ennemi.'}
};
export const HERO_CURRENCIES = {onePoints:'points ONE',gems:'gemmes'};
export const heroPackFor = id => Object.hasOwn(HERO_PACKS,id)?HERO_PACKS[id]:null;
export const hasHeroHall = s => s.village.structures.some(p=>p.kind==='hall'&&!p.pending);
export function heroPackGate(s,id){
 const p=heroPackFor(id);
 if(!p)return 'Ce pack de héros n’existe pas.';
 if(s.heroes[p.hero]>0)return 'Ce héros est déjà dans votre collection.';
 if(!hasHeroHall(s))return 'Terminez la construction du Hall des héros.';
 if(s.buildings.castle<p.level)return 'Disponible à la citadelle niveau '+p.level+'.';
 return null;
}
export function heroPackQuote(s,id,currency='onePoints'){
 const pack=heroPackFor(id),validCurrency=Object.hasOwn(HERO_CURRENCIES,currency);
 const price=pack&&validCurrency?pack[currency]:0,balance=validCurrency&&Number.isFinite(s[currency])?s[currency]:0;
 const error=heroPackGate(s,id)||(!validCurrency?'Choisissez les points ONE ou les gemmes.':null)||
  (balance<price?'Il manque '+Math.ceil(price-balance)+' '+HERO_CURRENCIES[currency]+'.':null);
 return {pack,currency,price,balance,remaining:balance-price,error};
}
export function restoreHeroPacks(raw,s){
 const seen=new Set();s.heroPackReceipts=[];
 for(const r of Array.isArray(raw.heroPackReceipts)?raw.heroPackReceipts:[]){
  const p=heroPackFor(r?.id);
  if(!p||seen.has(p.id)||!s.heroes[p.hero]||!Object.hasOwn(HERO_CURRENCIES,r.currency)||r.price!==p[r.currency]||!Number.isFinite(r.time)||r.time<0)continue;
  seen.add(p.id);s.heroPackReceipts.push({id:p.id,currency:r.currency,price:r.price,time:r.time});
 }
}
