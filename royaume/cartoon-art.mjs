import {BUILDER_FILES,createBuilderRigs} from './builder-art.mjs?v=34';
import {personPose,animalPose} from './character-rig.mjs?v=34';
import {enemyPose} from './enemy-rig.mjs?v=34';
import {bodyPoint,projectJoint} from './actor-facing.mjs?v=34';

export const CARTOON_FILES={...BUILDER_FILES,toonHut:'assets/v33-builder-hut.webp',toonTroops:'assets/v30-garrison.png',toonCore:'assets/v27-core.webp',toonEvolution:'assets/v27-evolution.webp',toonMilitary:'assets/v27-military.webp',toonCivic:'assets/v27-civic.webp',toonDefense:'assets/v27-defense.webp',toonNature:'assets/v27-nature.webp',toonMagic:'assets/v27-magic.webp'};
export const CARTOON_CELLS={toonTroops:['garrison-guardian','garrison-archer','garrison-rider','garrison-guardian-back','garrison-archer-back','garrison-rider-back'],toonCore:['castle1','mine','barracks','forge','cottage','mill'],toonEvolution:['castle2','castle3','castle4','castle5','sawmill','tower'],toonMilitary:['camp','archery','stable','campfire','rack','wagon'],toonCivic:['hall','tavern','market','academy','fountain','lantern'],toonDefense:['mortar','ballista','arcane','bastion','vault','reservoir'],toonNature:['spruce','oak','garden','rocks','field','parterre'],toonMagic:['shrine','tree','cannon','wallX','wallZ','bridge']};
function spriteFrom(image,makeCanvas){const c=makeCanvas(96,96),ctx=c.getContext('2d');ctx.drawImage(image,0,0,96,96);return {image,aspect:image.height/image.width,mask:ctx.getImageData(0,0,96,96).data};}
export function createCartoonArtwork(images,makeCanvas){
 const sprites={};
 for(const [atlas,names] of Object.entries(CARTOON_CELLS)){
  const image=images[atlas];if(!image)throw new Error('Atlas cartoon manquant : '+atlas);
  const probe=makeCanvas(image.width,image.height),ctx=probe.getContext('2d');ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,image.width,image.height).data;
  for(let i=0;i<names.length;i++){
   const x0=Math.round(i%3*image.width/3),x1=Math.round((i%3+1)*image.width/3),y0=Math.round(Math.floor(i/3)*image.height/2),y1=Math.round((Math.floor(i/3)+1)*image.height/2);let l=x1,r=x0,t=y1,b=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(rgba[(y*image.width+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   if(l>r)throw new Error('Case cartoon vide : '+names[i]);
   l=Math.max(x0,l-2);r=Math.min(x1-1,r+2);t=Math.max(y0,t-2);b=Math.min(y1-1,b+2);
   const tile=makeCanvas(r-l+1,b-t+1);tile.getContext('2d').drawImage(image,l,t,tile.width,tile.height,0,0,tile.width,tile.height);sprites[names[i]]=spriteFrom(tile,makeCanvas);
  }
 }
 sprites.builderhut=spriteFrom(images.toonHut,makeCanvas);
 sprites.castle=sprites.castle3;sprites.rampartX=sprites.wallX;sprites.rampartZ=sprites.wallZ;
 for(const kind of ['worker','guardian','archer','scholar','rider','merchant','raider','brute','wolf']){const c=makeCanvas(180,200);paintCartoonActor(c.getContext('2d'),{kind,dx:1,dz:0,walkDistance:0,motionBlend:0},90,180,145);sprites[kind]=spriteFrom(c,makeCanvas);}
 const grass=makeCanvas(192,192),ctx=grass.getContext('2d');ctx.fillStyle='#83bb45';ctx.fillRect(0,0,192,192);
 // Broad, low-contrast meadow patches remain clean when zoomed out.
 for(let y=0;y<192;y+=24)for(let x=0;x<192;x+=24){ctx.fillStyle=(x+y)%48?'#9bca5120':'#639d3610';ctx.fillRect(x,y,24,24);}
 return {workerRigs:createBuilderRigs(images,makeCanvas),sprites,grass,stone:null,walks:[],peopleParts:null,animalParts:null,enemyParts:null,cartoon:true,makeCanvas};
}
function shade(color,amount){const n=parseInt(color.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(c=>Math.max(0,Math.min(255,Math.round(c+amount))).toString(16).padStart(2,'0')).join('');}
function volume(ctx,color,x0,y0,x1,y1){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,shade(color,28));g.addColorStop(.42,color);g.addColorStop(1,shade(color,-28));return g;}
const ellipse=(ctx,x,y,rx,ry,color,stroke=null)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=stroke?volume(ctx,color,x-rx,y-ry,x+rx,y+ry):color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.013;ctx.stroke();}};
function capsule(ctx,a,b,width,color,light){ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#34352c';ctx.lineWidth=width+.022;ctx.stroke();ctx.strokeStyle=volume(ctx,color,a.x-width/2,a.y,b.x+width/2,b.y);ctx.lineWidth=width;ctx.stroke();if(light){ctx.beginPath();ctx.moveTo(a.x-width*.17,a.y);ctx.lineTo(b.x-width*.17,b.y);ctx.strokeStyle=light;ctx.lineWidth=width*.25;ctx.stroke();}}
function poly(ctx,points,color,outline='#364333'){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=volume(ctx,color,-.2,-.9,.3,-.4);ctx.fill();if(outline){ctx.strokeStyle=outline;ctx.lineWidth=.018;ctx.lineJoin='round';ctx.stroke();}}
function face(ctx,q,kind,headY,radius){
 const hostile=['raider','brute'].includes(kind),skin=hostile?kind==='brute'?'#d5a372':'#88bd4e':'#f5c18a',side=q.basis.side,back=q.basis.front<-.25,hw=radius*(.88+Math.abs(q.basis.front)*.12),hair=kind==='scholar'?'#e9d6a5':kind==='archer'?'#dc792a':'#764629';
 ellipse(ctx,0,headY,hw,radius,skin,'#675037');ellipse(ctx,-hw*.75,headY+.01,.05,.06,skin);ellipse(ctx,hw*.75,headY+.01,.05,.06,skin);
 if(['guardian','rider'].includes(kind)){ctx.beginPath();ctx.ellipse(0,headY-.03,hw+.015,radius*.88,0,Math.PI,Math.PI*2);ctx.lineTo(hw+.015,headY-.01);ctx.lineTo(-hw-.015,headY-.01);ctx.closePath();ctx.fillStyle='#9cc4dc';ctx.fill();ctx.strokeStyle='#35586c';ctx.lineWidth=.018;ctx.stroke();capsule(ctx,{x:0,y:headY-radius-.065},{x:.045,y:headY-radius+.045},.065,'#3b7bc5','#65a8e6');}
 else{ctx.beginPath();ctx.ellipse(0,headY-.045,hw,radius*.8,0,Math.PI,Math.PI*2);ctx.lineTo(hw,headY-.03);ctx.lineTo(-hw,headY-.03);ctx.fillStyle=hostile?'#6c4b2a':hair;ctx.fill();}
 if(back)return;
 const shift=side*.065,near=Math.abs(side)>.7;
 for(const eye of near?[side>0?.06:-.06]:[-.063,.063]){ellipse(ctx,eye+shift,headY+.005,.031,.036,'#fff9df');ellipse(ctx,eye+shift+side*.009,headY+.01,.013,.020,'#293736');}
 ellipse(ctx,shift+side*.065,headY+.065,.040,.031,skin);
 ctx.strokeStyle='#7d4f31';ctx.lineWidth=.013;ctx.beginPath();ctx.moveTo(shift-.040,headY+.10);ctx.quadraticCurveTo(shift,headY+.12,shift+.041,headY+.10);ctx.stroke();
}
export function paintCartoonActor(ctx,p,x,y,size){
 if(['rider','wolf'].includes(p.kind))return paintCartoonAnimal(ctx,p,x,y,size);
 const enemy=['raider','brute'].includes(p.kind),q=enemy?enemyPose(p):personPose(p),brute=p.kind==='brute',soldier=p.kind==='guardian',mage=p.kind==='scholar',color=enemy?'#944a30':soldier?'#438cce':p.kind==='archer'?'#58a85e':mage?'#9165ce':'#4296bc',skin=enemy?brute?'#d5a372':'#88bd4e':'#f5c18a',wide=brute?.27:.20;
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const leg=i=>{const l=q.legs[i];capsule(ctx,l.hip,l.knee,brute?.19:.14,enemy?'#724735':'#795133');capsule(ctx,l.knee,l.foot,brute?.17:.12,'#6a4229','#a17443');ellipse(ctx,l.foot.x+.013,l.foot.y-.018,brute?.12:.085,.046,'#523c2b','#3d3025');};
 const arm=i=>{const a=q.arms[i];capsule(ctx,a.shoulder,a.elbow,brute?.21:.145,color);capsule(ctx,a.elbow,a.hand,brute?.17:.115,skin);ellipse(ctx,a.hand.x,a.hand.y,.067,.067,skin,'#725638');
  if(i===1&&(soldier||enemy||q.working)){
   const a0=a.hand,tip={x:a0.x+.06*q.basis.side,y:a0.y-.31-(q.work||0)*.10};capsule(ctx,a0,tip,.032,'#885a2b','#e5b86b');
   if(soldier)poly(ctx,[[tip.x-.035,tip.y+.10],[tip.x-.025,tip.y-.16],[tip.x+.025,tip.y-.21],[tip.x+.04,tip.y+.10]],'#d5e6e9','#527383');
   else{ellipse(ctx,tip.x+.04,tip.y,enemy?.10:.075,enemy?.065:.043,enemy?'#a78a57':'#a8bec4','#5a604f');}
  }
  if(i===0&&soldier){const hx=a.hand.x,hy=a.hand.y;poly(ctx,[[hx-.13,hy-.15],[hx+.13,hy-.15],[hx+.11,hy+.025],[hx,hy+.12],[hx-.11,hy+.025]],'#387dc0','#f0cd68');}
  if(i===1&&p.kind==='archer'){ctx.strokeStyle='#c18a42';ctx.lineWidth=.029;ctx.beginPath();ctx.moveTo(a.hand.x,a.hand.y-.21);ctx.quadraticCurveTo(a.hand.x+.15,a.hand.y,a.hand.x,a.hand.y+.18);ctx.stroke();ctx.strokeStyle='#f3e1a9';ctx.lineWidth=.008;ctx.beginPath();ctx.moveTo(a.hand.x,a.hand.y-.21);ctx.lineTo(a.hand.x,a.hand.y+.18);ctx.stroke();}
 };
 leg(q.far);arm(q.farArm);leg(1-q.far);
 const w=wide*(.65+q.bodyWidth*.35);poly(ctx,[[-w,-.77+q.bob],[w,-.77+q.bob],[w*.88,-.39+q.bob],[-w*.88,-.39+q.bob]],color);capsule(ctx,{x:-w*.75,y:-.43+q.bob},{x:w*.75,y:-.43+q.bob},.055,'#79532c','#c89c50');
 if(!q.back){capsule(ctx,{x:0,y:-.73+q.bob},{x:0,y:-.49+q.bob},.030,soldier?'#e6c365':'#c4d9d7');ellipse(ctx,0,-.43+q.bob,.039,.035,'#edc761');}
 face(ctx,q,p.kind,-.90+q.bob,brute?.235:.195);arm(1-q.farArm);ctx.restore();return q;
}
export function paintCartoonAnimal(ctx,p,x,y,size){
 const q=animalPose(p),horse=p.kind==='rider',body=horse?'#b8814d':'#879bb0',dark=horse?'#6f4930':'#4c647b',point=(s,f,h)=>projectJoint(bodyPoint(q.basis,s,f,h));
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const leg=l=>{capsule(ctx,l.hip,l.knee,.105,body);capsule(ctx,l.knee,l.foot,.085,dark);ellipse(ctx,l.foot.x,l.foot.y-.015,.057,.035,dark);};q.legs.filter(l=>l.far).forEach(leg);
 const tail=point(0,-.43,.48-q.bob);capsule(ctx,tail,{x:tail.x-q.basis.side*.20,y:tail.y+.20},.075,dark);
 ellipse(ctx,0,-.48+q.bob,.40*q.bodyWidth+.05,.20,body,dark);q.legs.filter(l=>!l.far).forEach(leg);
 const h=point(0,.47,.64-q.bob);capsule(ctx,{x:h.x*.6,y:-.50},{x:h.x,y:h.y},.20,body);ellipse(ctx,h.x,h.y-.045,.165,.20,body,dark);
 for(const sign of [-1,1])poly(ctx,[[h.x+sign*.10-.035,h.y-.19],[h.x+sign*.10,h.y-.30],[h.x+sign*.10+.04,h.y-.18]],body,dark);
 const nose=point(0,.62,.61-q.bob);ellipse(ctx,nose.x,nose.y,.115,.08,horse?'#d9a876':'#c0cfda',dark);ellipse(ctx,nose.x+q.basis.side*.045,nose.y+.015,.045,.03,dark);
 if(q.basis.front>-.2){ellipse(ctx,h.x-.065+q.basis.side*.055,h.y-.085,.027,.033,'#fff');ellipse(ctx,h.x+.065+q.basis.side*.055,h.y-.085,.027,.033,'#fff');ellipse(ctx,h.x-.065+q.basis.side*.06,h.y-.08,.012,.019,'#243747');ellipse(ctx,h.x+.065+q.basis.side*.06,h.y-.08,.012,.019,'#243747');}
 if(horse){const dummy={...p,kind:'guardian',motionBlend:0,walkDistance:0};ctx.save();ctx.translate(0,-.43);ctx.scale(.62,.62);paintCartoonActor(ctx,dummy,0,0,1);ctx.restore();}
 ctx.restore();return q;
}
