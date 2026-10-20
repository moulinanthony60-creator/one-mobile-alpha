import {loadArtImage} from './battle-village-assets.mjs?v=7';
export const TROOP_SHEETS={guardians:'assets/battle-style/guardians-smooth.webp',archers:'assets/battle-style/archers-smooth.webp',mages:'assets/battle-style/mages-smooth.webp'};
export function troopFrame({dx,dz,moving,distance,reduced=false}){
 const rear=dx+dz<-.15,flip=dx-dz<0;
 const column=reduced||!moving?1:Math.floor(distance*4)%4;
 return {index:(rear?4:0)+column,flip};
}
export async function loadTroopSheets(signal,makeCanvas){
 const entries=await Promise.all(Object.entries(TROOP_SHEETS).map(async([kind,file])=>{
  const image=await loadArtImage(new URL(file,import.meta.url).href,signal),cw=image.width/4,ch=image.height/2,frames=[];
  for(let i=0;i<8;i++){
   const cell=makeCanvas(cw,ch),ctx=cell.getContext('2d');ctx.drawImage(image,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,cw,ch);
   const rgba=ctx.getImageData(0,0,cw,ch).data;let top=ch,bottom=-1;
   for(let y=0;y<ch;y++){let count=0;for(let x=0;x<cw;x++)if(rgba[(y*cw+x)*4+3]>50)count++;if(count>3){top=Math.min(top,y);bottom=y;}}
   if(bottom<top)throw Error('Pose de troupe vide : '+kind);
   // Register the torso, rather than centring the weapon's changing silhouette.
   const columns=new Float32Array(cw);let total=0;
   for(let y=Math.floor(top+(bottom-top)*.32);y<top+(bottom-top)*.66;y++)for(let x=0;x<cw;x++){const a=rgba[(y*cw+x)*4+3]/255;columns[x]+=a;total+=a;}
   let center=0,sum=0;for(;center<cw;center++){sum+=columns[center];if(sum>=total/2)break;}
   const normalized=makeCanvas(128,160),scale=138/(bottom-top);
   normalized.getContext('2d').drawImage(cell,64-center*scale,150-bottom*scale,cw*scale,ch*scale);
   frames.push({image:normalized,cw:128,ch:160,bottom:150});
  }
  frames.blended=[];
  for(let i=0;i<8;i++)for(let sub=0;sub<4;sub++){
   const canvas=makeCanvas(128,160),context=canvas.getContext('2d'),next=(i&4)+((i+1)%4);
   context.globalAlpha=1-sub/4;context.drawImage(frames[i].image,0,0);
   context.globalCompositeOperation='lighter';context.globalAlpha=sub/4;context.drawImage(frames[next].image,0,0);
   frames.blended.push(canvas);
  }
  return [kind,frames];
 }));
 return new Map(entries);
}
export function paintTroop(ctx,frames,pose,x,y,height){
 const {index,flip}=troopFrame(pose),scale=height/138;
 const step=pose.distance*4,blend=pose.moving&&!pose.reduced?step-Math.floor(step):0,next=(index&4)+((index+1)%4);
 const motion=pose.motion??Number(pose.moving),bob=!pose.reduced?Math.sin(pose.distance*Math.PI*4)*height*.015*motion:0;
 const strike=pose.reduced?0:pose.attack||0;
 ctx.save();ctx.translate(x+(flip?-1:1)*strike*height*.07,y-bob);ctx.scale(flip?-1:1,1);ctx.rotate(strike*.07);
 // Adjacent registered poses overlap during the transition, not a hard frame
 // swap. Body height and feet remain fixed; movement comes from the walk cycle.
 const image=frames.blended[index*4+Math.min(3,Math.floor(blend*4))];
 ctx.drawImage(image,-64*scale,-150*scale,128*scale,160*scale);
 ctx.restore();
}
