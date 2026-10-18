// Rendered turntable views share one world heading and a distance-driven gait.
// Mirroring the right-hand views gives eight directions without reversing feet.
export const WORKER_WALK_FILE='assets/v33-worker-walk.webp';
export function workerFrame(p){
 const sx=(p.dx??1)-(p.dz??0),sy=((p.dx??1)+(p.dz??0))*.5;
 const angle=Math.atan2(Math.abs(sx),sy),row=Math.min(4,Math.max(0,Math.round(angle/(Math.PI/4))));
 // One complete cycle covers .62 world cells. No time-driven walking in place.
 const column=p.moving?Math.floor((p.walkDistance||0)/.155)%4:1;
 return {row,column,flip:sx<0};
}
export function createWorkerFrames(image,makeCanvas){
 const probe=makeCanvas(image.width,image.height),ctx=probe.getContext('2d');ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,image.width,image.height).data,rows=[];
 // Measured gutters of this atlas: the illustrated rows are not equal height.
 const gutters=[0,272,547,822,1102,1402].map(y=>Math.round(y*image.height/1402));
 for(let row=0;row<5;row++){
  const frames=[];
  for(let col=0;col<4;col++){
   const x0=Math.round(col*image.width/4),x1=Math.round((col+1)*image.width/4),y0=gutters[row],y1=gutters[row+1];
   let left=x1,right=x0,top=y1,bottom=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*image.width+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<=left||bottom<=top)throw new Error('Animation d’ouvrier incomplète.');
   // Anchor on the torso, not on the forward foot, to prevent lateral jitter.
   let sum=0,count=0;
   for(let y=Math.round(top+(bottom-top)*.28);y<top+(bottom-top)*.51;y++)for(let x=left;x<=right;x++)if(data[(y*image.width+x)*4+3]>160){sum+=x;count++;}
   const center=count?sum/count:(left+right)/2;
   frames.push({sx:left,sy:top,sw:right-left+1,sh:bottom-top+1,anchor:(center-left)/(right-left+1)});
  }
  rows.push(frames);
 }
 return {image,rows};
}
export function paintWorker(ctx,atlas,p,x,y,size){
 if(!atlas||p.kind!=='worker')return false;
 const f=workerFrame(p),cell=atlas.rows[f.row][f.column],height=size*1.15,width=height*cell.sw/cell.sh;
 ctx.save();ctx.translate(x,y);if(f.flip)ctx.scale(-1,1);
 ctx.drawImage(atlas.image,cell.sx,cell.sy,cell.sw,cell.sh,-width*cell.anchor,-height,width,height);
 ctx.restore();return true;
}
