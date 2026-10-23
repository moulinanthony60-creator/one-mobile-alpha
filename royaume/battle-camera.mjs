// Frame the fortified village between the HUD and the army cards.
export function fitBattleCamera(width,height,field){
 const portrait=height>width,deck=portrait?148:height<440?86:height>=600?126:108;
 const top=portrait?122:72,bottom=Math.max(top+80,height-deck-12);
 const tile=Math.max(3,Math.min((width-20)/29.5,(bottom-top)/14.6));
 return {tile,originY:(top+bottom)/2,x:field.width/2,z:field.height/2};
}
