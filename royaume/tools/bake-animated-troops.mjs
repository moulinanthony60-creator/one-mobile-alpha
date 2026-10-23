// Bake the production articulated artwork at 2x, then downsample complete poses.
// No generated imagery or player data. Run from the repository root.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ANIMATED_TILE,animatedPose} from '../battle-animated-troops.mjs';
const {createCanvas,Image}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.Image=class extends Image{set src(v){super.src=v.startsWith?.('file:')?readFileSync(fileURLToPath(new URL(v))):v;}get src(){return super.src;}};
const {loadPaintedTroops,paintPaintedTroop}=await import('../battle-painted-troops.mjs');
const rigs=await loadPaintedTroops(null,createCanvas),t=ANIMATED_TILE,tile=createCanvas(t.width*2,t.height*2),c=tile.getContext('2d');
for(const [kind,file]of [['guardians','guardian'],['archers','archer'],['mages','mage']]){
 const atlas=createCanvas(t.width*t.directions,t.height*t.rows),ctx=atlas.getContext('2d');ctx.imageSmoothingQuality='high';
 for(let row=0;row<t.rows;row++)for(let col=0;col<t.directions;col++){
  c.clearRect(0,0,tile.width,tile.height);const angle=col*Math.PI*2/t.directions,p={...animatedPose(kind,row),dx:Math.cos(angle),dz:Math.sin(angle)};
  paintPaintedTroop(c,rigs.get(kind),rigs.equipment,kind,p,t.anchorX*2,t.anchorY*2,t.scale*2);
  const data=c.getImageData(0,0,tile.width,tile.height).data;
  for(let x=0;x<tile.width;x++)if(data[x*4+3]>8||data[((tile.height-1)*tile.width+x)*4+3]>8)throw Error(`Vertical crop ${kind}/${row}/${col}`);
  for(let y=0;y<tile.height;y++)if(data[(y*tile.width)*4+3]>8||data[(y*tile.width+tile.width-1)*4+3]>8)throw Error(`Horizontal crop ${kind}/${row}/${col}`);
  ctx.drawImage(tile,col*t.width,row*t.height,t.width,t.height);
 }
 writeFileSync(new URL(`../assets/battle-style/${file}-animated-v18.png`,import.meta.url),atlas.toBuffer('image/png'));
 console.log(JSON.stringify({kind,poses:t.rows*t.directions,width:atlas.width,height:atlas.height}));atlas.width=atlas.height=1;
}
tile.width=tile.height=1;rigs.dispose();
