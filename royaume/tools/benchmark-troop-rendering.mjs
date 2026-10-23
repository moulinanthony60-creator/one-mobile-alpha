// CPU Canvas comparison only; not a browser or Android frame-rate measurement.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const {createCanvas,Image}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.Image=class extends Image{set src(v){super.src=v.startsWith?.('file:')?readFileSync(fileURLToPath(new URL(v))):v;}get src(){return super.src;}};
const {loadPaintedTroops,paintPaintedTroop}=await import('../battle-painted-troops.mjs');
const {loadAnimatedTroops,paintAnimatedTroop}=await import('../battle-animated-troops.mjs');
const rigs=await loadPaintedTroops(null,createCanvas),sprites=await loadAnimatedTroops(),canvas=createCanvas(640,360),context=canvas.getContext('2d');
let draws=0;
const ctx=new Proxy(context,{get(o,k){const value=o[k];return typeof value==='function'?(...args)=>{if(k==='drawImage')draws++;return value.apply(o,args);}:value;},set(o,k,v){o[k]=v;return true;}});
for(const mode of ['articulated','animated']){
 draws=0;const start=performance.now();
 for(let frame=0;frame<60;frame++){
  ctx.clearRect(0,0,640,360);
  for(let i=0;i<40;i++){
   const kind=['guardians','archers','mages'][i%3],angle=i*Math.PI/8,p={dx:Math.cos(angle),dz:Math.sin(angle),distance:(frame+i)/60,motion:1,attackAge:10},x=40+i%10*58,y=70+Math.floor(i/10)*70;
   if(mode==='animated')paintAnimatedTroop(ctx,sprites.get(kind),kind,p,x,y,30);else paintPaintedTroop(ctx,rigs.get(kind),rigs.equipment,kind,p,x,y,30);
  }
  ctx.getImageData(0,0,1,1); // Flush deferred native rendering on both paths.
 }
 console.log(JSON.stringify({mode,frames:60,soldiers:40,imageDraws:draws,milliseconds:Math.round(performance.now()-start)}));
}
rigs.dispose();sprites.dispose();
