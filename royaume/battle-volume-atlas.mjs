import {loadArtImage} from './battle-village-assets.mjs?v=7';
import {troopVisualDirection} from './battle-aim.mjs?v=3';
export const VOLUME_TILE={width:120,height:98,anchorX:60,anchorY:84,scale:55,directions:16};
export const VOLUME_RELEASE=[0,.055,.12,.20,.30,.44];
export const VOLUME_FILES={guardians:'assets/battle-style/guardian-volume-v15.webp',archers:'assets/battle-style/archer-volume-v15.webp',mages:'assets/battle-style/mage-volume-v15.webp'};
export function volumeFrame(kind,p){
 const direction=troopVisualDirection(Math.atan2(p.dz,p.dx));
 let row=0,next=0,blend=0;
 if(!p.reduced&&p.motion>.12){const stride=kind==='guardians'?.96:kind==='archers'?.90:1.02,phase=((p.distance/stride)%1+1)%1*12;row=1+Math.floor(phase);next=1+(Math.floor(phase)+1)%12;blend=phase-Math.floor(phase);}
 else if(!p.reduced&&p.attackAge>=0&&p.attackAge<.44){let i=0;while(i<VOLUME_RELEASE.length-2&&p.attackAge>VOLUME_RELEASE[i+1])i++;row=16+i;next=row+1;blend=(p.attackAge-VOLUME_RELEASE[i])/(VOLUME_RELEASE[i+1]-VOLUME_RELEASE[i]);}
 else if(!p.reduced&&p.windup>0){const f=Math.min(3,p.windup*3);row=f<1?0:12+Math.floor(f);next=f>=3?15:13+Math.floor(f);blend=f-Math.floor(f);}
 return {direction,row,next,blend};
}
export async function loadVolumeTroops(signal){const map=new Map(await Promise.all(Object.entries(VOLUME_FILES).map(async([kind,file])=>{const image=await loadArtImage(new URL(file,import.meta.url).href,signal);if(image.width!==VOLUME_TILE.width*16||image.height!==VOLUME_TILE.height*22)throw Error('Planche de troupe incomplète');return[kind,image];})));map.volume=true;return map;}
export function paintVolumeTroop(ctx,image,kind,pose,x,y,size,mix){
 const f=volumeFrame(kind,pose),t=VOLUME_TILE,scale=size/t.scale;
 // Complete bodies share a fixed foot anchor; small crossfades bridge sampled
 // poses without stretching any limb or morphing independently painted parts.
 const draw=(row,alpha)=>{ctx.globalAlpha=alpha;ctx.drawImage(image,f.direction*t.width,row*t.height,t.width,t.height,x-t.anchorX*scale,y-t.anchorY*scale,t.width*scale,t.height*scale);};
 const opacity=ctx.globalAlpha;ctx.save();
 if(mix&&f.blend>.03&&f.blend<.97&&f.row!==f.next){
  // Blend on transparent pixels, never add the second pose to the grass or
  // another soldier. Direct additive drawing made walking troops glow green.
  const m=mix.getContext('2d');m.clearRect(0,0,t.width,t.height);m.save();
  m.globalAlpha=1-f.blend;m.drawImage(image,f.direction*t.width,f.row*t.height,t.width,t.height,0,0,t.width,t.height);
  m.globalCompositeOperation='lighter';m.globalAlpha=f.blend;m.drawImage(image,f.direction*t.width,f.next*t.height,t.width,t.height,0,0,t.width,t.height);m.restore();
  ctx.drawImage(mix,x-t.anchorX*scale,y-t.anchorY*scale,t.width*scale,t.height*scale);
 }
 else draw(f.blend>=.97?f.next:f.row,opacity);ctx.restore();
}
