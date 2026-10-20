import {loadArtImage} from './battle-village-assets.mjs?v=6';
export const TROOP_SHEETS={guardians:'assets/battle-style/guardians.webp',archers:'assets/battle-style/archers.webp',mages:'assets/battle-style/mages.webp'};
export function troopFrame({dx,dz,moving,attacking,distance,reduced=false}){
 const rear=dx+dz<-.02,flip=dx-dz<0;
 const column=reduced?0:attacking?3:moving?[1,0,2,0][Math.floor(distance*3.7)%4]:0;
 return {index:(rear?4:0)+column,flip};
}
export async function loadTroopSheets(signal,makeCanvas){
 const entries=await Promise.all(Object.entries(TROOP_SHEETS).map(async([kind,file])=>{
  const image=await loadArtImage(new URL(file,import.meta.url).href,signal),cw=image.width/4,ch=image.height/2;
  const frames=[];
  for(let i=0;i<8;i++){
   const cell=makeCanvas(cw,ch),ctx=cell.getContext('2d');ctx.drawImage(image,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,cw,ch);
   const rgba=ctx.getImageData(0,0,cw,ch).data;let left=cw,right=-1,top=ch,bottom=-1;
   for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(rgba[(y*cw+x)*4+3]>35){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<left)throw Error('Pose de troupe vide : '+kind);
   frames.push({image:cell,left,right,top,bottom,cw,ch});
  }
  return [kind,frames];
 }));
 return new Map(entries);
}
export function paintTroop(ctx,frames,pose,x,y,height){
 const {index,flip}=troopFrame(pose),frame=frames[index],scale=height/(frame.ch*.88),bob=pose.moving&&!pose.reduced?Math.sin(pose.distance*12)*height*.025:0;
 ctx.save();ctx.translate(x,y-bob);ctx.scale(flip?-1:1,1);
 ctx.drawImage(frame.image,0,0,frame.cw,frame.ch,-frame.cw/2*scale,-frame.bottom*scale,frame.cw*scale,frame.ch*scale);
 ctx.restore();
}
