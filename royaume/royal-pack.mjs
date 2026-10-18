import {UNITS,RARITIES,MAX_UNIT_LEVEL,unitById,collectionAccess} from './collection.mjs?v=34';
export const ROYAL_PACK={name:'Coffre de Valdoria',onePoints:100,gems:60,slots:5};
export const CARD_STACKS={common:5,rare:3,epic:2,legendary:1,ultra:1};
export const MAX_DUPLICATE_GOLD={common:50,rare:100,epic:250,legendary:600,ultra:1500};
export const EPIC_GUARANTEE=5;
export const isEpicPlus=id=>['epic','legendary','ultra'].includes(unitById(id)?.rarityKey);
export const guaranteeRemaining=s=>EPIC_GUARANTEE-Math.max(0,Math.min(4,s.royalPack?.epicDry||0));
export function newRoyalPack(now=Date.now()){
 const seed=(globalThis.crypto?.getRandomValues?.(new Uint32Array(1))[0]||((now>>>0)^Math.floor(Math.random()*0xffffffff)))>>>0;
 return {version:1,seed:seed||123456789,opened:0,epicDry:0,welcomeClaimed:false,pending:null,history:[]};
}
export function packResourceRange(s){const level=Math.max(1,Math.min(13,s.buildings.castle));return {gold:[250+level*80,400+level*120],wood:[180+level*60,300+level*90]};}
export function royalPackQuote(s,currency){
 const p=s.royalPack,free=currency==='free',valid=['free','onePoints','gems'].includes(currency),price=valid&&!free?ROYAL_PACK[currency]:0;
 const balance=free?0:s[currency]||0;
 const error=!collectionAccess(s)?'Terminez un camp de formation ou le Hall des héros.':p?.pending?'Terminez la révélation du coffre précédent.':!valid?'Choisissez les points ONE ou les gemmes.':free&&p?.welcomeClaimed?'Le coffre de bienvenue a déjà été ouvert.':!free&&!p?.welcomeClaimed?'Votre premier coffre est offert.':!free&&balance<price?'Il manque '+Math.ceil(price-balance)+' '+(currency==='gems'?'gemmes':'points ONE')+'.':null;
 return {currency,free,price,balance,remaining:balance-price,error};
}
export function rarityAt(value){let left=Math.max(0,Math.min(.999999999,value))*100;for(const [key,r] of Object.entries(RARITIES)){left-=r.chance;if(left<0)return key;}return 'ultra';}
function random(p){let x=p.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;p.seed=x>>>0||123456789;return p.seed/4294967296;}
export function rollTroop(p,guaranteed=false){const value=random(p),rarity=guaranteed?(value<.65?'epic':value<.95?'legendary':'ultra'):rarityAt(value),pool=UNITS.filter(h=>h.rarityKey===rarity);return {id:pool[Math.floor(random(p)*pool.length)].id,count:CARD_STACKS[rarity]};}
function grantCards(s,id,count){
 const h=unitById(id),fresh=!s.heroes[id];s.unitCards??={};let convertedGold=0,cardsAdded=0;
 if((s.heroes[id]||0)>=MAX_UNIT_LEVEL){convertedGold=MAX_DUPLICATE_GOLD[h.rarityKey]*count;s.gold+=convertedGold;}
 else{if(fresh){s.heroes[id]=1;if(id==='nyx')s.stats.recruit++;}cardsAdded=count-(fresh?1:0);s.unitCards[id]=(s.unitCards[id]||0)+cardsAdded;}
 return {kind:'troop',id,count,fresh,cardsAdded,convertedGold};
}
export function openRoyalPack(s,currency,expectedOpened,now){
 s.royalPack??=newRoyalPack(now);const p=s.royalPack,q=royalPackQuote(s,currency);
 if(q.error)throw new Error(q.error);
 if(expectedOpened!==p.opened)throw new Error('Ce coffre a déjà changé. Revenez à son aperçu.');
 if(!q.free)s[currency]-=q.price;
 const rewards=[];let guaranteeUsed=false;
 for(let i=0;i<2;i++){const guaranteed=i===1&&(p.epicDry||0)>=EPIC_GUARANTEE-1&&!isEpicPlus(rewards[0].id),pull=rollTroop(p,guaranteed);if(guaranteed)guaranteeUsed=true;rewards.push(grantCards(s,pull.id,pull.count));}
 p.epicDry=rewards.some(a=>isEpicPlus(a.id))?0:Math.min(4,(p.epicDry||0)+1);
 for(const [id,[min,max]]of Object.entries(packResourceRange(s))){const amount=min+Math.floor(random(p)*(max-min+1));s[id]+=amount;rewards.push({kind:'resource',id,amount,converted:false});}
 const pick=random(p);let id=pick<.5?'gems':pick<.8?'onePoints':'potions',amount=id==='gems'?5:id==='onePoints'?20:1,converted=false;
 if(id==='potions'&&s.potions>=20){id='gold';amount=100;converted=true;}
 s[id]=(s[id]||0)+amount;rewards.push({kind:'bonus',id,amount,converted});
 p.opened++;p.welcomeClaimed=true;p.pending={id:p.opened,time:now,currency,price:q.price,revealed:0,guaranteeUsed,rewards};
 p.history=[structuredClone(p.pending),...p.history].slice(0,10);
 return p.pending;
}
export function revealRoyalPack(s,id,all=false,expectedRevealed){const r=s.royalPack?.pending;if(!r||r.id!==id)throw new Error('Aucun coffre à révéler.');if(expectedRevealed!==undefined&&expectedRevealed!==r.revealed)throw new Error('Cette carte a déjà été révélée.');if(r.revealed>=5)throw new Error('Toutes les récompenses sont déjà révélées.');r.revealed=all?5:r.revealed+1;return r;}
export function finishRoyalPack(s,id){const r=s.royalPack?.pending;if(!r||r.id!==id)throw new Error('Ce coffre est déjà terminé.');if(r.revealed<5)throw new Error('Révélez les cinq récompenses avant de terminer.');s.royalPack.pending=null;}
function validReceipt(r){
 if(!r||!Number.isInteger(r.id)||r.id<1||!Number.isFinite(r.time)||r.time<0||!['free','onePoints','gems'].includes(r.currency)||r.price!==(r.currency==='free'?0:ROYAL_PACK[r.currency])||!Number.isInteger(r.revealed)||r.revealed<0||r.revealed>5||!Array.isArray(r.rewards)||r.rewards.length!==5)return null;
 const rewards=[];
 for(let i=0;i<5;i++){
  const a=r.rewards[i];if(!a)return null;
  if(i<2){const h=unitById(a.id);if(a.kind!=='troop'||!h||a.count!==CARD_STACKS[h.rarityKey]||!Number.isInteger(a.cardsAdded)||a.cardsAdded<0||a.cardsAdded>a.count||!Number.isInteger(a.convertedGold)||a.convertedGold<0||a.convertedGold>MAX_DUPLICATE_GOLD[h.rarityKey]*a.count)return null;rewards.push({kind:'troop',id:a.id,count:a.count,fresh:!!a.fresh,cardsAdded:a.cardsAdded,convertedGold:a.convertedGold});}
  else{if(a.kind!==(i===4?'bonus':'resource')||!(i===2?['gold']:i===3?['wood']:['gems','onePoints','potions','gold']).includes(a.id)||!Number.isInteger(a.amount)||a.amount<1||a.amount>100000)return null;rewards.push({kind:a.kind,id:a.id,amount:a.amount,converted:!!a.converted});}
 }
 return {id:r.id,time:r.time,currency:r.currency,price:r.price,revealed:r.revealed,guaranteeUsed:!!r.guaranteeUsed,rewards};
}
export function restoreRoyalPack(raw,s,now){
 const old=raw.royalPack,p=newRoyalPack(now);
 if(old?.version===1){p.seed=Number.isInteger(old.seed)?old.seed>>>0||123456789:p.seed;p.opened=Math.max(0,Math.min(1e8,Math.floor(Number(old.opened)||0)));p.welcomeClaimed=!!old.welcomeClaimed||p.opened>0;p.history=(Array.isArray(old.history)?old.history:[]).map(validReceipt).filter(Boolean).filter(r=>r.id<=p.opened).slice(0,10);const pending=validReceipt(old.pending);p.pending=pending&&pending.id===p.opened?pending:null;
  if(Number.isInteger(old.epicDry)&&old.epicDry>=0)p.epicDry=Math.min(4,old.epicDry);
  else for(const r of p.history){if(r.rewards.slice(0,2).some(a=>isEpicPlus(a.id)))break;p.epicDry=Math.min(4,p.epicDry+1);}
 }
 s.royalPack=p;
}
