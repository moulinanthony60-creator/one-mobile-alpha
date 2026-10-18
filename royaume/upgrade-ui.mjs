import {campCapacity} from './army-camps.mjs?v=34';
import {MAX_BUILDING_LEVEL} from './building-levels.mjs?v=34';
import {villageBonus} from './village-state.mjs?v=34';
import {defenseStats} from './siege.mjs?v=34';
const number=n=>Number(n.toFixed(1)).toLocaleString('fr-FR');
export function upgradePreview(kind,level,next=Math.min(MAX_BUILDING_LEVEL,level+1)){
 return `<div class="upgrade-preview"><div class="upgrade-stage current"><span>ACTUEL</span><div data-thumbnail="${kind}" data-level="${level}"></div><b>Niveau ${level}</b></div><span class="upgrade-arrow" aria-hidden="true">➜</span><div class="upgrade-stage next"><span>${next===level?'MAXIMUM':'APRÈS AMÉLIORATION'}</span><div data-thumbnail="${kind}" data-level="${next}"></div><b>Niveau ${next}</b></div></div>`;
}
export function upgradeBenefits(plot){
 const level=plot.level,next=Math.min(MAX_BUILDING_LEVEL,level+1),kind=plot.kind,rows=[];
 const hp=l=>kind==='castle'?1200+300*(l-1):kind==='wall'?230*l:400+140*(l-1);
 rows.push(['Solidité',hp(level),hp(next),'PV']);
 const defense=defenseStats(plot),after=defenseStats({...plot,level:next});
 if(defense)rows.push(['Dégâts',defense.damage,after.damage,''],['Portée',defense.range,after.range,'cases']);
 else if(kind==='mine')rows.push(['Production',45*level,45*next,'or/min'],['Capacité',800*level,800*next,'or']);
 else if(kind==='tree')rows.push(['Production',30*level,30*next,'bois/min'],['Capacité',700*level,700*next,'bois']);
 else if(kind==='shrine')rows.push(['Production',3*level,3*next,'éther/min']);
 else if(kind==='forge')rows.push(['Attaque des héros',(level-1)*8,(next-1)*8,'%']);
 else if(kind==='camp')rows.push(['Places d’armée',campCapacity(level),campCapacity(next),'places']);
 else if(kind==='castle')rows.push(['Niveau des bâtiments',level,next,'']);
 else {const a=villageBonus({structures:[plot]}),b=villageBonus({structures:[{...plot,level:next}]}),labels={gold:['Production','or/min'],wood:['Production','bois/min'],aether:['Production','éther/min'],goldStorage:['Stockage','or'],aetherStorage:['Stockage','éther'],attack:['Attaque','%'],hp:['Vitalité','%']};for(const [key,[label,unit]]of Object.entries(labels))if(b[key]>a[key])rows.push([label,a[key]*(unit==='%'?100:1),b[key]*(unit==='%'?100:1),unit]);}
 return `<div class="upgrade-benefits">${rows.slice(0,3).map(([label,a,b,unit])=>`<div class="upgrade-benefit"><div><span>${label}</span><strong>${number(a)} <em>+${number(b-a)}</em> <small>${unit}</small></strong></div><div class="upgrade-stat-track"><i style="width:${b?Math.max(0,a/b)*100:100}%"></i><b style="width:${b?Math.max(0,(b-a)/b)*100:0}%"></b></div></div>`).join('')}</div>`;
}
export function resourceArt(kind){const r={gold:'36 51 312 271',wood:'427 63 318 259',aether:'821 21 296 310',gems:'1224 38 269 285',worker:'813 359 332 291'}[kind];return `<svg class="upgrade-resource-art" viewBox="${r}" aria-hidden="true"><image href="assets/v8-hud.png" width="1536" height="1024"/></svg>`;}
export function upgradeCosts(cost,state){return `<div class="upgrade-costs">${['gold','wood'].map(key=>`<div class="upgrade-cost ${state[key]<cost[key]?'shortage':''}">${resourceArt(key)}<div><small>${key==='gold'?'OR':'BOIS'}</small><b>${number(cost[key])}</b><span>${state[key]<cost[key]?'Manque '+number(cost[key]-state[key]):'Disponible : '+number(state[key])}</span></div></div>`).join('')}</div>`;}
