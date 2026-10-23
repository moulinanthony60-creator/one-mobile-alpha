// Run from the repository root. Install @napi-rs/canvas, or set
// VALDORIA_CANVAS_MODULE to its module path. No browser/WebGL is needed.
import {volumeTroop} from './combat-volume-models.mjs';
import {rasterVolume} from './volume-raster.mjs';
import {VOLUME_TILE,VOLUME_RELEASE} from '../battle-volume-atlas.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
const {createCanvas}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
const t=VOLUME_TILE,out=new URL('../assets/battle-style/',import.meta.url);mkdirSync(out,{recursive:true});
for(const [kind,file]of [['guardians','guardian'],['archers','archer'],['mages','mage']]){
 const atlas=createCanvas(t.width*16,t.height*22),context=atlas.getContext('2d'),stride=kind==='guardians'?.96:kind==='archers'?.90:1.02;
 for(let row=0;row<22;row++){
  const state=row===0?{aiming:true}:row<=12?{distance:(row-1)/12*stride,motion:1}:row<=15?{windup:(row-12)/3,aiming:true}:{attackAge:VOLUME_RELEASE[row-16],aiming:true};
  const {meshes}=volumeTroop(kind,state);
  for(let col=0;col<16;col++){
   const raster=rasterVolume(meshes,col*Math.PI*2/16,{width:t.width*2,height:t.height*2,tile:t.scale*2,anchorX:t.anchorX*2,anchorY:t.anchorY*2}),tile=createCanvas(t.width*2,t.height*2),c=tile.getContext('2d'),image=c.createImageData(tile.width,tile.height);
   for(let x=0;x<tile.width;x++)if(raster[x*4+3]||raster[((tile.height-1)*tile.width+x)*4+3])throw Error('Pose rognée verticalement');
   for(let y=0;y<tile.height;y++)if(raster[(y*tile.width)*4+3]||raster[(y*tile.width+tile.width-1)*4+3])throw Error('Pose rognée horizontalement');
   image.data.set(raster);c.putImageData(image,0,0);context.drawImage(tile,col*t.width,row*t.height,t.width,t.height);tile.width=tile.height=1;
  }
  if(row%6===0)console.log(kind,'pose',row+1,'/22');
 }
 writeFileSync(new URL(file+'-volume-v15.png',out),atlas.toBuffer('image/png'));atlas.width=atlas.height=1;
}
