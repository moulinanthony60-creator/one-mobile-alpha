import {loadArtImage} from './battle-village-assets.mjs?v=7';
import {troopVisualDirection,troopStride} from './battle-aim.mjs?v=3';

// Complete, supersampled poses. One image draw per soldier, with no per-frame
// canvas allocation, readback, articulated pieces or ghosting crossfade.
export const ANIMATED_TILE={width:80,height:80,anchorX:40,anchorY:68,scale:38,directions:16,rows:29};
export const ANIMATED_RELEASE=[0,.035,.07,.12,.18,.25,.34,.44];
export const ANIMATED_FILES={guardians:'assets/battle-style/guardian-animated-v18.webp',archers:'assets/battle-style/archer-animated-v18.webp',mages:'assets/battle-style/mage-animated-v18.webp'};
export function animatedPose(kind,row){
 if(row<4)return {time:row*Math.PI/2/2.8,idle:true,aiming:true,attackAge:10,motion:0};
 if(row<16)return {distance:(row-4)/12*troopStride(kind),motion:1,attackAge:10};
 if(row<21)return {windup:(row-15)/5,aiming:true,motion:0,attackAge:10};
 return {attackAge:ANIMATED_RELEASE[row-21],aiming:true,motion:0};
}
export function animatedFrame(kind,p){
 const direction=troopVisualDirection(Math.atan2(p.dz,p.dx));
 let row=0;
 if(!p.reduced&&p.attackAge>=0&&p.attackAge<.44){
  let i=0;while(i<ANIMATED_RELEASE.length-1&&p.attackAge>(ANIMATED_RELEASE[i]+ANIMATED_RELEASE[i+1])/2)i++;
  row=21+i;
 }else if(!p.reduced&&p.windup>0)row=15+Math.max(1,Math.min(5,Math.round(p.windup*5)));
 else if(!p.reduced&&p.motion>.12)row=4+Math.floor((((p.distance/troopStride(kind))%1)+1)%1*12+1e-8)%12;
 else if(!p.reduced)row=Math.floor((((p.time||0)*2.8/(Math.PI*2))%1+1)%1*4);
 return {direction,row};
}
export async function loadAnimatedTroops(signal){
 const t=ANIMATED_TILE,map=new Map(await Promise.all(Object.entries(ANIMATED_FILES).map(async([kind,file])=>{
  const image=await loadArtImage(new URL(file,import.meta.url).href,signal);
  if(image.width!==t.width*t.directions||image.height!==t.height*t.rows)throw Error('Animation de troupe incomplète : '+kind);
  return [kind,image];
 })));
 map.animated=true;map.decodedBytes=3*t.width*t.directions*t.height*t.rows*4;map.dispose=()=>map.clear();return map;
}
export function paintAnimatedTroop(ctx,image,kind,p,x,y,size){
 const f=animatedFrame(kind,p),t=ANIMATED_TILE,scale=size/t.scale;
 ctx.drawImage(image,f.direction*t.width,f.row*t.height,t.width,t.height,x-t.anchorX*scale,y-t.anchorY*scale,t.width*scale,t.height*scale);
}
