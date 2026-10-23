// Visual QA sheet built from the same meshes and poses as the production atlas.
import {volumeTroop} from './combat-volume-models.mjs';
import {rasterVolume} from './volume-raster.mjs';
import {writeFileSync} from 'node:fs';
const {createCanvas}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
const canvas=createCanvas(1080,780),ctx=canvas.getContext('2d');
const bg=ctx.createLinearGradient(0,0,0,780);bg.addColorStop(0,'#263c41');bg.addColorStop(1,'#101e28');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,780);
ctx.fillStyle='#e9cf96';ctx.font='bold 22px sans-serif';ctx.fillText('VALDORIA · TROUPES V15',40,42);
ctx.fillStyle='#b8c5c6';ctx.font='14px sans-serif';ctx.fillText('Modèles utilisés dans le combat — attente, attaque et vue de dos',40,70);
const poses=[{aiming:true},{aiming:true,windup:1},{aiming:true,attackAge:.12},{motion:1,distance:.2}];
for(const [j,kind]of ['guardians','archers','mages'].entries()){
 ctx.fillStyle=['#a8c8ef','#bad89b','#c4afdf'][j];ctx.font='bold 16px sans-serif';ctx.fillText(['GARDIEN','ARCHÈRE','MAGE'][j],40,108+j*220);
 for(let i=0;i<4;i++){
  const surface=createCanvas(248,240),c=surface.getContext('2d'),data=c.createImageData(248,240);
  data.data.set(rasterVolume(volumeTroop(kind,poses[i]).meshes,i===3?Math.PI*1.25:Math.PI/4-.32,{width:248,height:240,tile:147,anchorX:124,anchorY:226}));c.putImageData(data,0,0);
  ctx.fillStyle='#030b184d';ctx.beginPath();ctx.ellipse(148+i*256,302+j*220,42,10,0,0,Math.PI*2);ctx.fill();ctx.drawImage(surface,24+i*256,80+j*220);
 }
}
writeFileSync(new URL('../docs/troupes-v15.png',import.meta.url),canvas.toBuffer('image/png'));
