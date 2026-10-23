import {stepTrainingCombat} from './battle-training-combat.mjs?v=14';
import {recordOnline} from './online-events.mjs?v=38';
import {TRAINING,TRAINING_UNITS} from './barracks.mjs?v=36';

export const FIELD={width:20,height:16,seconds:150};
export const ASSAULT_UNITS={
 guardians:{hp:145,damage:18,range:1.15,speed:1.7,rate:1,role:'Première ligne',color:'#69b9ed'},
 archers:{hp:78,damage:22,range:3.5,speed:1.9,rate:1.1,role:'Tir à distance',color:'#a4d877'},
 lancers:{hp:210,damage:32,range:1.6,speed:1.7,rate:1,role:'Allonge et résistance',color:'#d4dcf0'},
 cavalry:{hp:340,damage:46,range:1.2,speed:2.8,rate:.9,role:'Priorité aux défenses',priority:true,color:'#dfb975'},
 swordsmen:{hp:270,damage:46,range:1.15,speed:1.8,rate:.85,role:'Assaut rapproché',color:'#aac4de'},
 crossbows:{hp:155,damage:55,range:4.2,speed:1.6,rate:1.3,role:'Longue portée',color:'#df9565'},
 knights:{hp:650,damage:48,range:1.2,speed:1.5,rate:1.15,role:'Bouclier de l’armée',armor:.7,priority:true,color:'#ead59b'},
 berserkers:{hp:340,damage:83,range:1.2,speed:2.1,rate:.8,role:'Dégâts rapides',color:'#ed8c70'},
 mages:{hp:190,damage:72,range:3.1,speed:1.5,rate:1.5,role:'Explosion de zone',splash:1.8,color:'#c699ef'},
 healers:{hp:220,damage:36,range:3.2,speed:1.8,rate:1.1,role:'Soins aux alliés',heal:true,color:'#a1e7d1'}
};
const names=['Le guet des fougères','Les granges perdues','Le fort des ronces','La route de l’opale','Le comptoir oublié','La citadelle blanche','Les tours du givre','Le col des loups','La forteresse des vents','Les mines de braise','Le bastion noir','Le trône des cendres'];
const regions=['Forêt d’Émeraude','Terres d’Opale','Cimes éternelles','Couronne de cendres'];
export const MISSIONS=names.map((name,id)=>({id,name,region:regions[Math.floor(id/3)],level:Math.min(10,2+Math.floor(id*.7)),gold:350+id*190,wood:240+id*130,energy:4+Math.floor(id/4),bonus:180+id*100}));
export const armyCount=(s,k)=>Math.max(0,Math.floor(k==='guardians'?s.troops||0:s.army?.[k]||0));
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
export function missionUnlocked(s,id){return Number.isInteger(id)&&!!MISSIONS[id]&&(id===0||(s.conquests?.[id-1]||0)>0);}
export function enemyVillage(id){
 const strength=1+id*.22,buildings=[];
 const add=(kind,x,y,hp,damage=0,range=0)=>buildings.push({id:'b'+buildings.length,kind,x,y,hp:Math.round(hp*strength),maxHp:Math.round(hp*strength),damage:Math.round(damage*(1+id*.12)),range,cooldown:0});
 add('castle',10,8,300);add('mine',7,7,145);add('mill',13,9,145);add('cottage',10,11,105);add('cottage',10,5,105);
 add('tower',7,10,140,id===0?7:12,4.5);
 if(id>=1)add('cannon',13,6,155,17,4);
 if(id>=3)add('mortar',10,7,170,22,5.4);
 if(id>=6)add('tower',14,10,180,16,4.8);
 if(id>=9)add('arcane',6,5,210,26,4.8);
 if(id>=2){for(let x=6;x<=14;x+=2){add('wall',x,3,80);add('wall',x,13,80);}for(let y=5;y<=11;y+=2){if(y!==7){add('wall',5,y,80);add('wall',15,y,80);}}}
 return buildings;
}
export function attackScore(b){const targets=b.buildings.filter(p=>p.kind!=='wall'),destroyed=targets.filter(p=>p.hp<=0).length,percent=Math.floor(destroyed/targets.length*100),castle=targets.find(p=>p.kind==='castle');return {percent,stars:Number(percent>=50)+Number(castle.hp<=0)+Number(percent===100)};}
export function startAssault(s,id){
 check(missionUnlocked(s,id),'Remportez une étoile au village précédent.');
 check(s.buildings.castle>=2,'Améliorez votre citadelle au niveau 2.');
 check(s.assault?.phase!=='active'&&s.battle?.phase!=='active'&&s.siege?.phase!=='active','Terminez le combat en cours.');
 check(TRAINING_UNITS.some(k=>!ASSAULT_UNITS[k].heal&&armyCount(s,k)>0),'Formez des troupes de combat à la caserne.');
 const m=MISSIONS[id];check(s.energy>=m.energy,'Énergie insuffisante. Elle revient avec le temps.');s.energy-=m.energy;
 s.assault={mission:id,phase:'active',elapsed:0,buildings:enemyVillage(id),units:[],serial:0,spells:2,effects:[],deployed:{},settled:false};
}
export function assaultCommand(s,a){
 if(a.type==='assault-start'){startAssault(s,a.id);return;}
 const b=s.assault;check(b,'Aucune attaque en cours.');
 if(a.type==='assault-dismiss'){check(b.phase!=='active','Terminez l’attaque ou mettez-la en pause.');s.assault=null;return;}
 check(b.phase==='active','Cette attaque est terminée.');
 if(a.type==='assault-retreat'){b.phase='finished';settleAssault(s);return;}
 const field=b.field||FIELD,margin=field.margin||3;
 const x=Number(a.x),y=Number(a.y);check(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&y>=0&&x<field.width&&y<field.height,'Choisissez un point du terrain.');
 if(a.type==='assault-deploy'){
  const spec=ASSAULT_UNITS[a.unit];check(spec,'Troupe inconnue.');check(x<margin||x>field.width-margin||y<margin||y>field.height-margin,'Déployez à l’extérieur de la ligne bleue.');check(!b.buildings.some(p=>p.hp>0&&p.collision&&Math.abs(x-p.x)<p.collision.width/2&&Math.abs(y-p.y)<p.collision.depth/2),'Choisissez un point libre dans la bordure bleue.');check(armyCount(s,a.unit)>0,'Cette troupe n’est plus disponible.');check(b.units.length<160,'Limite de 160 troupes engagées dans cette attaque.');
  if(a.unit==='guardians')s.troops--;else s.army[a.unit]--;
  b.units.push({id:++b.serial,kind:a.unit,x,y,hp:spec.hp,maxHp:spec.hp,cooldown:0,path:[],target:null,repath:0});b.deployed[a.unit]=(b.deployed[a.unit]||0)+1;
 }else if(a.type==='assault-spell'){
  check(b.spells>0,'Les deux frappes ont été utilisées.');b.spells--;for(const p of b.buildings)if(Math.hypot(p.x-x,p.y-y)<2.6)p.hp=Math.max(0,p.hp-150);b.effects.push({kind:'spell',x,y,life:.65});
 }else throw new Error('Ordre inconnu.');
 if(attackScore(b).percent===100){b.phase='finished';settleAssault(s);}
}
// Optional footprints are used by the independent 3D training. Existing missions
// keep their original single-cell movement and center-based attack distances.
function targetRadius(target){const c=target?.collision;return c&&Number.isFinite(c.width)&&Number.isFinite(c.depth)?Math.max(0,Math.min(4,Math.max(c.width,c.depth)/2)):0;}
function blockedCells(buildings,width,height){
 const blocked=new Set();
 for(const p of buildings){if(p.hp<=0)continue;const c=p.collision;
  if(!c||!Number.isFinite(c.width)||!Number.isFinite(c.depth)||c.width<=0||c.depth<=0){blocked.add(Math.floor(p.y)*width+Math.floor(p.x));continue;}
  const w=Math.min(c.width,8),d=Math.min(c.depth,8);
  for(let y=Math.max(0,Math.floor(p.y-d/2));y<Math.min(height,Math.ceil(p.y+d/2));y++)for(let x=Math.max(0,Math.floor(p.x-w/2));x<Math.min(width,Math.ceil(p.x+w/2));x++)blocked.add(y*width+x);
 }
 return blocked;
}
function route(u,target,b,range){
 const {width,height}=b.field||FIELD,blocked=blockedCells(b.buildings,width,height),start=Math.floor(u.y)*width+Math.floor(u.x),queue=[start],parents=new Map([[start,null]]);let end=null;
 for(let i=0;i<queue.length;i++){const key=queue[i],x=key%width+.5,y=Math.floor(key/width)+.5;if(Math.hypot(target.x-x,target.y-y)<=range){end=key;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=Math.floor(x)+dx,ny=Math.floor(y)+dy,n=ny*width+nx;if(nx<0||ny<0||nx>=width||ny>=height||parents.has(n)||blocked.has(n))continue;parents.set(n,key);queue.push(n);}}
 if(end===null)return null;const path=[];while(end!==start&&end!==null){path.unshift({x:end%width+.5,y:Math.floor(end/width)+.5});end=parents.get(end);}return path;
}
function hurt(b,target,damage,source,kind='shot'){target.hp=Math.max(0,target.hp-damage);b.effects.push({kind,x:target.x,y:target.y,fromX:source.x,fromY:source.y,life:.25});}
export function stepAssault(s,dt){
 const b=s.assault;if(!b||b.phase!=='active'||s.cloud?.busy)return;dt=clamp(dt,0,.1);recordOnline(s,{kind:'tick',mode:'assault',dt,at:Date.now()});b.elapsed+=dt;b.effects=b.effects.map(e=>({...e,life:e.life-dt})).filter(e=>e.life>0).slice(-80);
 if(b.field)stepTrainingCombat(b,ASSAULT_UNITS,dt);else{
 for(const u of b.units){if(u.hp<=0)continue;const spec=ASSAULT_UNITS[u.kind];u.cooldown-=dt;u.repath-=dt;
  let target;
  if(spec.heal){target=b.units.filter(v=>v.hp>0&&v.id!==u.id&&!ASSAULT_UNITS[v.kind].heal).sort((a,c)=>(a.hp/a.maxHp-c.hp/c.maxHp)||Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];}
  else{const live=b.buildings.filter(p=>p.hp>0),priority=spec.priority&&live.some(p=>p.damage>0)?live.filter(p=>p.damage>0):live.filter(p=>p.kind!=='wall');target=(priority.length?priority:live).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];}
  if(!target)continue;
  if(Math.hypot(u.x-target.x,u.y-target.y)>spec.range+targetRadius(target)){
   if(u.repath<=0||u.target!==target.id||!u.path?.length){u.path=route(u,target,b,spec.range+targetRadius(target));u.repath=.6;u.target=target.id;
    if(u.path===null&&!spec.heal){const wall=b.buildings.filter(p=>p.hp>0&&p.kind==='wall').sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];if(wall){target=wall;u.path=route(u,wall,b,spec.range+targetRadius(wall));}}}
   const next=u.path?.[0];if(next){const distance=Math.hypot(next.x-u.x,next.y-u.y),step=Math.min(distance,spec.speed*dt);if(distance){u.x+=(next.x-u.x)/distance*step;u.y+=(next.y-u.y)/distance*step;}if(distance<.08)u.path.shift();}
  }
  if(Math.hypot(u.x-target.x,u.y-target.y)<=spec.range+targetRadius(target)+.1&&u.cooldown<=0){u.cooldown=spec.rate;if(spec.heal){target.hp=Math.min(target.maxHp,target.hp+spec.damage);b.effects.push({kind:'heal',x:target.x,y:target.y,life:.35});}else{hurt(b,target,spec.damage,u);if(spec.splash)for(const p of b.buildings)if(p!==target&&p.hp>0&&Math.hypot(p.x-target.x,p.y-target.y)<spec.splash)hurt(b,p,spec.damage*.5,u);}}
 }
 for(const p of b.buildings){if(p.hp<=0||!p.damage)continue;p.cooldown-=dt;if(p.cooldown>0)continue;const targets=b.units.filter(u=>u.hp>0&&Math.hypot(u.x-p.x,u.y-p.y)<=p.range).sort((a,c)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(c.x-p.x,c.y-p.y));const target=targets[0];if(!target)continue;p.cooldown=p.kind==='mortar'?2.5:1.2;hurt(b,target,p.damage*(ASSAULT_UNITS[target.kind].armor||1),p,'enemy');if(p.kind==='mortar')for(const u of targets)if(u!==target&&Math.hypot(u.x-target.x,u.y-target.y)<1.7)hurt(b,u,p.damage*.6,p,'enemy');}
 }
 if(attackScore(b).percent===100||b.elapsed>=FIELD.seconds||(!(b.impacts?.length)&&(b.units.length&&!b.units.some(u=>u.hp>0&&!ASSAULT_UNITS[u.kind].heal)&&!TRAINING_UNITS.some(k=>!ASSAULT_UNITS[k].heal&&armyCount(s,k)>0)))){b.phase='finished';settleAssault(s);}
}
export function settleAssault(s){
 const b=s.assault;if(!b||b.phase==='active'||b.settled)return;const m=MISSIONS[b.mission],score=attackScore(b);s.conquests??={};const first=score.stars>0&&!s.conquests[m.id],ratio=score.percent/100;
 b.reward={gold:Math.floor(m.gold*ratio)+(first?m.bonus:0),wood:Math.floor(m.wood*ratio)+(first?Math.floor(m.bonus*.65):0),xp:Math.floor((40+m.id*15)*ratio),gems:first?5:0};b.score=score;b.first=!!first;b.settled=true;
 for(const [k,v] of Object.entries(b.reward))s[k]=(s[k]||0)+v;s.conquests[m.id]=Math.max(s.conquests[m.id]||0,score.stars);if(score.stars)s.stats.raid++;
 s.journal.unshift({text:m.name+' : '+score.stars+' étoile(s), +'+b.reward.gold+' or et +'+b.reward.wood+' bois.',time:Date.now()});s.journal=s.journal.slice(0,30);
}
export function restoreAssault(s,raw){
 s.conquests=Object.fromEntries(MISSIONS.map(m=>[m.id,Math.floor(clamp(raw.conquests?.[m.id],0,3))]));s.assault=null;const b=raw.assault;
 if(!b||!Number.isInteger(b.mission)||!MISSIONS[b.mission]||!['active','finished'].includes(b.phase)||!Array.isArray(b.buildings)||!Array.isArray(b.units)||b.units.length>160)return;
 const template=enemyVillage(b.mission);if(b.buildings.length!==template.length||!template.every((p,i)=>b.buildings[i].id===p.id&&Number.isFinite(b.buildings[i].hp))||!b.units.every(u=>ASSAULT_UNITS[u.kind]&&Number.isInteger(u.id)&&Number.isFinite(u.hp)&&Number.isFinite(u.x)&&Number.isFinite(u.y))||new Set(b.units.map(u=>u.id)).size!==b.units.length)return;
 s.assault={mission:b.mission,phase:b.phase,elapsed:clamp(b.elapsed,0,FIELD.seconds),spells:Math.floor(clamp(b.spells,0,2)),serial:Math.max(0,...b.units.map(u=>u.id)),settled:b.phase==='finished',effects:[],deployed:Object.fromEntries(TRAINING_UNITS.map(k=>[k,b.units.filter(u=>u.kind===k).length])),buildings:template.map((p,i)=>({...p,hp:clamp(b.buildings[i].hp,0,p.maxHp),cooldown:clamp(b.buildings[i].cooldown,0,3)})),units:b.units.map(u=>({id:u.id,kind:u.kind,x:clamp(u.x,0,19.9),y:clamp(u.y,0,15.9),hp:clamp(u.hp,0,ASSAULT_UNITS[u.kind].hp),maxHp:ASSAULT_UNITS[u.kind].hp,cooldown:clamp(u.cooldown,0,2),repath:0,target:null,path:[]}))};
 if(b.phase==='finished'){s.assault.score=attackScore(s.assault);s.assault.reward=Object.fromEntries(['gold','wood','xp','gems'].map(k=>[k,Math.floor(clamp(b.reward?.[k],0,10000))]));s.assault.first=!!b.first;}
}
