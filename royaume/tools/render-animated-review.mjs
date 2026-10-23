import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadAnimatedTroops,paintAnimatedTroop} from '../battle-animated-troops.mjs';
import {troopStride} from '../battle-aim.mjs';
const {createCanvas,Image}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.Image=class extends Image{set src(v){super.src=v.startsWith?.('file:')?readFileSync(fileURLToPath(new URL(v))):v;}get src(){return super.src;}};
const sprites=await loadAnimatedTroops(),canvas=createCanvas(960,540),ctx=canvas.getContext('2d'),out=new URL('../docs/troupes-v18-frames/',import.meta.url);mkdirSync(out,{recursive:true});
for(let frame=0;frame<144;frame++){
 const time=frame/24;ctx.fillStyle='#253b37';ctx.fillRect(0,0,960,540);ctx.fillStyle='#f1dbac';ctx.font='bold 23px sans-serif';ctx.fillText('VALDORIA · ANIMATIONS V18',32,40);ctx.font='14px sans-serif';ctx.fillStyle='#c5d4cb';ctx.fillText('Animation du jeu · marche / préparation / attaque / rotation',32,65);
 for(const [j,kind]of ['guardians','archers','mages'].entries())for(let i=0;i<4;i++){
  const age=time%1.2,angle=i===3?time/6*Math.PI*2:Math.PI/4;
  const pose={dx:Math.cos(angle),dz:Math.sin(angle),time,motion:0,distance:time*.75,attackAge:10,aiming:true,...(i===0?{motion:1,distance:time*troopStride(kind)*1.7}:i===1?{windup:Math.min(1,age/.7)}:i===2?{attackAge:age,windup:age>.8?(age-.8)/.4:0}:{motion:1})};
  const x=150+i*220,y=210+j*145;ctx.fillStyle='#0d1e2255';ctx.beginPath();ctx.ellipse(x,y,25,7,0,0,Math.PI*2);ctx.fill();paintAnimatedTroop(ctx,sprites.get(kind),kind,pose,x,y,100);
 }
 writeFileSync(new URL(`${String(frame).padStart(4,'0')}.png`,out),canvas.toBuffer('image/png'));
 if(frame===40)writeFileSync(new URL('../docs/troupes-v18.png',import.meta.url),canvas.toBuffer('image/png'));
}
sprites.dispose();
