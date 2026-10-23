// Frame the fortified village between the HUD and the army cards.
export function fitBattleCamera(width,height,field){
 const portrait=height>width,deck=portrait?148:height<440?86:height>=600?126:108;
 const top=portrait?122:72,bottom=Math.max(top+80,height-deck-12);
 const tile=Math.max(3,Math.min((width-20)/29.5,(bottom-top)/14.6));
 return {tile,originY:(top+bottom)/2,x:field.width/2,z:field.height/2};
}

// Keep the fighting group and its targets in view, with a dead zone so the
// terrain cache is not rebuilt for every footstep. Manual gestures stop follow.
export function combatFocus(battle){
 const alive=battle.units.filter(u=>u.hp>0);if(!alive.length)return null;
 const targets=new Map(battle.buildings.filter(b=>b.hp>0).map(b=>[b.id,b]));
 const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
 const x=median(alive.map(u=>u.x)),z=median(alive.map(u=>u.y));
 const near=alive.filter(u=>Math.hypot(u.x-x,u.y-z)<8);
 let sx=0,sz=0,weight=0;
 for(const u of near){sx+=u.x;sz+=u.y;weight++;const t=targets.get(u.target);if(t&&Math.hypot(t.x-u.x,t.y-u.y)<6){sx+=t.x*.35;sz+=t.y*.35;weight+=.35;}}
 const front={x:sx/weight,z:sz/weight},base=[...targets.values()].filter(b=>b.kind!=='wall');
 // Include the defended village above the front line, rather than centering
 // the whole screen on soldiers at the water's edge.
 if(!base.length)return front;
 const center={x:median(base.map(b=>b.x)),z:median(base.map(b=>b.y))};
 return {x:front.x*.25+center.x*.75,z:front.z*.25+center.z*.75};
}
