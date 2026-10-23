// Portraits and a contact sheet from the actual continuously articulated renderer.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const {createCanvas,Image}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.Image=class extends Image{set src(value){super.src=value.startsWith?.('file:')?readFileSync(fileURLToPath(new URL(value))):value;}get src(){return super.src;}};
const {loadPaintedTroops,paintPaintedTroop}=await import('../battle-painted-troops.mjs');
const rigs=await loadPaintedTroops(null,createCanvas),sheet=createCanvas(1080,780),ctx=sheet.getContext('2d');
const background=ctx.createLinearGradient(0,0,1080,780);background.addColorStop(0,'#294046');background.addColorStop(1,'#101e28');ctx.fillStyle=background;ctx.fillRect(0,0,1080,780);
ctx.fillStyle='#e9cf96';ctx.font='bold 22px sans-serif';ctx.fillText('VALDORIA · TROUPES V16',40,42);ctx.fillStyle='#b8c5c6';ctx.font='14px sans-serif';ctx.fillText('Personnages utilisés en jeu — attente, préparation, frappe et marche de dos',40,70);
for(const [j,kind]of ['guardians','archers','mages'].entries()){
 const name=['guardian','archer','mage'][j],pose={dx:Math.SQRT1_2,dz:Math.SQRT1_2,distance:0,motion:0,attackAge:10,aiming:true};
 const portrait=createCanvas(432,522),c=portrait.getContext('2d');paintPaintedTroop(c,rigs.get(kind),rigs.equipment,kind,pose,216,790,720);
 const small=createCanvas(216,261),cx=small.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(portrait,0,0,216,261);writeFileSync(new URL('../assets/battle-style/'+name+'-portrait-v16.png',import.meta.url),small.toBuffer('image/png'));
 ctx.fillStyle=['#ecc49b','#bad89b','#adc9ef'][j];ctx.font='bold 16px sans-serif';ctx.fillText(['GARDIEN','ARCHÈRE','MAGE'][j],40,108+j*220);
 for(let i=0;i<4;i++){
  const state={...pose,...[{}, {windup:1},{attackAge:.12},{dx:-Math.SQRT1_2,dz:-Math.SQRT1_2,motion:1,distance:.25}][i]},x=148+i*256,y=302+j*220;
  ctx.fillStyle='#030b184d';ctx.beginPath();ctx.ellipse(x,y,38,9,0,0,Math.PI*2);ctx.fill();paintPaintedTroop(ctx,rigs.get(kind),rigs.equipment,kind,state,x,y,160);
 }
}
writeFileSync(new URL('../docs/troupes-v16.png',import.meta.url),sheet.toBuffer('image/png'));
console.log(JSON.stringify({painted:true,decodedBytes:rigs.decodedBytes,MiB:(rigs.decodedBytes/1024**2).toFixed(2)}));rigs.dispose();
