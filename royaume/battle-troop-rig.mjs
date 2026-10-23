import {loadArtImage} from './battle-village-assets.mjs?v=7';
import {footCycle} from './locomotion.mjs?v=34';
import {troopScale,troopStride} from './battle-aim.mjs?v=3';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const RIG_FILES=['assets/battle-style/troop-rig-front.webp','assets/battle-style/troop-rig-back.webp'];
const kinds=['guardians','archers','mages'];
// Atlas cells have generous gutters; alpha trimming is performed once at load.
export async function loadBattleRigs(signal,makeCanvas){
 const images=await Promise.all(RIG_FILES.map(file=>loadArtImage(new URL(file,import.meta.url).href,signal)));
 const rigs=new Map(kinds.map(kind=>[kind,[]]));
 images.forEach((image,view)=>{
  const probe=makeCanvas(image.width,image.height),cx=probe.getContext('2d');cx.drawImage(image,0,0);const rgba=cx.getImageData(0,0,image.width,image.height).data;
  const xs=[0,300,590,815,1060,1300,1536].map(x=>Math.round(x*image.width/1536)),ys=[0,342,665,1024].map(y=>Math.round(y*image.height/1024));
  kinds.forEach((kind,row)=>{const parts=[];
   for(let col=0;col<6;col++){
    let l=xs[col+1],r=-1,top=ys[row+1],bottom=-1;
    for(let y=ys[row];y<ys[row+1];y++)for(let x=xs[col];x<xs[col+1];x++)if(rgba[(y*image.width+x)*4+3]>80){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(r<l)throw Error('Pièce de troupe vide : '+kind+'/'+view+'/'+col);
    const tile=makeCanvas(r-l+1,bottom-top+1);tile.getContext('2d').drawImage(image,l,top,tile.width,tile.height,0,0,tile.width,tile.height);parts.push(tile);
   }
   rigs.get(kind)[view]=parts;
  });probe.width=probe.height=1;
 });return rigs;
}

// Solve the knee/elbow in the character's 3D space before projecting. A
// screen-space bend made both knees point the same way when the soldier turned.
export function bendJoint(a,b,length,direction){
 const keys=['s','f','h'],delta=keys.map(k=>b[k]-a[k]),distance=Math.hypot(...delta),axis=delta.map(v=>v/(distance||1));
 const dot=keys.reduce((sum,k,i)=>sum+direction[k]*axis[i],0),bend=keys.map((k,i)=>direction[k]-dot*axis[i]),norm=Math.hypot(...bend)||1;
 const offset=Math.sqrt(Math.max(0,length*length-distance*distance/4));
 return Object.fromEntries(keys.map((k,i)=>[k,(a[k]+b[k])/2+bend[i]/norm*offset]));
}

// Joint motion follows distance travelled, with a planted foot and body weight
// shifting above it. The shooting hand stays on the shared muzzle at release.
export function battleTroopPose(kind,p){
 const norm=Math.hypot(p.dx,p.dz)||1,fx=p.dx/norm,fz=p.dz/norm,front=(fx+fz)/Math.SQRT2,side=(fx-fz)/Math.SQRT2;
 const motion=p.reduced?0:clamp(p.motion??0,0,1),stride=troopStride(kind),phase=(p.distance||0)/stride,bob=Math.cos(phase*Math.PI*4)*.023*motion;
 const age=p.attackAge??10,peak=kind==='guardians'?.12:kind==='archers'?.055:.08,ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},hit=p.reduced?0:age<peak?ease(age/peak):1-ease((age-peak)/.24),carry=kind==='guardians'?Math.max(0,1-age/.12):kind==='mages'?Math.max(0,1-age/.30):0,windup=p.reduced?0:Math.max(p.windup||0,carry);
 const point=(s,f,h)=>({x:((fz*s+fx*f)-(-fx*s+fz*f))*.68,y:((fz*s+fx*f)+(-fx*s+fz*f))*.34-h,depth:(fz-fx)*s+(fx+fz)*f});
 const shift=kind==='guardians'?hit*.06-windup*.045:kind==='mages'?hit*.035-windup*.025:0;
 const sway=Math.sin(phase*Math.PI*2)*.018*motion,lean=.055*motion+(kind==='guardians'?hit*.10-windup*.06:kind==='mages'?hit*.045-windup*.025:0);
 const draw=kind==='archers'&&!p.reduced?(age<.22?1-ease(age/.095):ease(p.windup||0)):0;
 const project=v=>point(v.s,v.f,v.h);
 const legs=[-1,1].map((sign,i)=>{const c=footCycle(phase+i*.5),travel=c.travel*(.6*stride/(4*.68*troopScale(kind)))*motion,lift=c.lift*.12*motion;
  const hip={s:sign*.13+sway,f:shift*.2,h:.37+bob},foot={s:sign*.13,f:travel,h:lift},locked=p.footOffsets?.[i];
  if(locked){const x=locked.x/.68,y=locked.y/.34,wx=(x+y)/2,wz=(y-x)/2;foot.s=fz*wx-fx*wz;foot.f=fx*wx+fz*wz;foot.h=0;}
  const knee=bendJoint(hip,foot,.235,{s:0,f:1,h:0});
  return {hip:project(hip),knee:project(knee),foot:project(foot),world:{hip,knee,foot},contact:motion===0||c.lift===0};});
 const arms=[-1,1].map((sign,i)=>{
  let forward=-Math.cos(phase*Math.PI*2+i*Math.PI)*.17*motion+shift,height=.39+bob,spread=sign*.28;
  if(kind==='guardians'&&i===1){forward+=hit*.14-windup*.12;height+=windup*.42+hit*.09;}
  if(kind==='guardians'&&i===0){forward+=windup*.12+hit*.08;height+=windup*.08;}
  if(kind==='archers'&&(p.aiming||hit||windup)){forward=i===0?.39:.35-draw*.38;height=.66+bob+(i===0?0:.02);spread=i===0?-.10:.12;}
  if(kind==='mages'){if(i===1){forward=.08+hit*.18;height=.43+bob+windup*.25+hit*.05;}else{forward+=hit*.30;height+=hit*.15;}}
  const shoulder={s:sign*.23+sway,f:shift+lean,h:.69+bob},hand={s:spread,f:forward,h:height};
  const elbow=bendJoint(shoulder,hand,.245,{s:sign*.7,f:-.4,h:-1});
  return {shoulder:project(shoulder),elbow:project(elbow),hand:project(hand),world:{shoulder,elbow,hand}};
 });
 const waist=point(sway,shift,.37+bob),neck=point(sway,shift+lean,.77+bob),tilt=Math.atan2(neck.x-waist.x,waist.y-neck.y);
 return {legs,arms,front,side,back:front<-.12,flip:side<0,point,bob,hit,windup,draw,phase,motion,age,waist,neck,tilt,body:{s:sway,f:shift,lean,h:bob},aiming:p.aiming,far:legs[0].hip.depth<legs[1].hip.depth?0:1,farArm:arms[0].shoulder.depth<arms[1].shoulder.depth?0:1};
}
function bone(ctx,image,a,b,width,flip){
 const length=Math.hypot(b.x-a.x,b.y-a.y);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);if(flip)ctx.scale(-1,1);ctx.drawImage(image,-width/2,-.035,width,length+.065);ctx.restore();
}
const line=(ctx,points,color,width)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
function gear(ctx,kind,q,i){
 const hand=q.arms[i].hand,at=(s,f,h)=>{const p=q.point(s,f,h);return {x:hand.x+p.x,y:hand.y+p.y};};
 if(kind==='guardians'&&i===1){
  const tip=at(0,.08+q.hit*.14,.39*(1-q.hit)-q.hit*.12),base=at(0,-.02,-.05),cross=at(0,.01,.045);
  const dx=tip.x-hand.x,dy=tip.y-hand.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*.035,ny=dx/d*.035;
  ctx.beginPath();ctx.moveTo(hand.x+nx,hand.y+ny);ctx.lineTo(tip.x,tip.y);ctx.lineTo(hand.x-nx,hand.y-ny);ctx.closePath();ctx.fillStyle='#c7d5df';ctx.fill();ctx.strokeStyle='#35475c';ctx.lineWidth=.013;ctx.stroke();line(ctx,[hand,tip],'#f3fbff',.012);line(ctx,[base,hand],'#815328',.045);
  line(ctx,[{x:cross.x-.08,y:cross.y},{x:cross.x+.08,y:cross.y}],'#ba8139',.044);line(ctx,[{x:cross.x-.075,y:cross.y-.008},{x:cross.x+.075,y:cross.y-.008}],'#ffe19a',.019);
 }
 if(kind==='guardians'&&i===0){
  ctx.save();ctx.translate(hand.x,hand.y);ctx.rotate(-q.side*.15);ctx.beginPath();ctx.ellipse(0,0,.14,.20,0,0,Math.PI*2);const metal=ctx.createLinearGradient(-.14,-.18,.14,.18);metal.addColorStop(0,'#6897ce');metal.addColorStop(.5,'#234c80');metal.addColorStop(1,'#112b52');ctx.fillStyle=metal;ctx.fill();ctx.strokeStyle='#e9bd61';ctx.lineWidth=.025;ctx.stroke();ctx.beginPath();for(let j=0;j<16;j++){const a=j*Math.PI/8,r=j%2?.034:.092;const px=Math.cos(a)*r,py=Math.sin(a)*r;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle='#f2ce75';ctx.fill();ctx.beginPath();ctx.arc(0,0,.035,0,Math.PI*2);ctx.fillStyle='#ffe5a4';ctx.fill();ctx.restore();
 }
 if(kind==='archers'&&i===0){
  const a=at(0,0,.23),b=at(0,.22,0),c=at(0,0,-.22),draw=q.aiming?q.arms[1].hand:hand;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(b.x,b.y,c.x,c.y);ctx.strokeStyle='#4b3020';ctx.lineWidth=.045;ctx.stroke();ctx.strokeStyle='#dfb363';ctx.lineWidth=.024;ctx.stroke();line(ctx,[a,draw,c],'#f4e7c4',.008);
  if(q.draw>0){const tip=at(0,.27,0);line(ctx,[draw,tip],'#f4e3af',.012);line(ctx,[tip,at(0,.23,.035)],'#f7f4db',.018);}
 }
 if(kind==='mages'&&i===1){
  const top=at(0,0,.40),bottom=at(0,0,-.33);line(ctx,[bottom,top],'#513024',.046);line(ctx,[bottom,top],'#dca75d',.024);
  ctx.beginPath();ctx.moveTo(top.x,top.y-.10);ctx.lineTo(top.x+.055,top.y);ctx.lineTo(top.x,top.y+.075);ctx.lineTo(top.x-.055,top.y);ctx.closePath();ctx.fillStyle=q.hit||q.windup?'#dcfbff':'#50d5dc';ctx.fill();ctx.strokeStyle='#efc776';ctx.lineWidth=.015;ctx.stroke();line(ctx,[{x:top.x,y:top.y-.08},{x:top.x,y:top.y+.055}],'#e5ffff',.012);
 }
}
export function paintBattleTroop(ctx,rig,kind,p,x,y,size){
 const q=battleTroopPose(kind,p),[head,torso,upper,fore,thigh,shin]=rig[q.back?1:0];
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const leg=i=>{const l=q.legs[i];bone(ctx,thigh,l.hip,l.knee,.17,q.flip);bone(ctx,shin,l.knee,l.foot,.175,q.flip);};
 const arm=i=>{const a=q.arms[i];bone(ctx,upper,a.shoulder,a.elbow,.18,q.flip);bone(ctx,fore,a.elbow,a.hand,.15,q.flip);gear(ctx,kind,q,i);};
 leg(q.far);arm(q.farArm);leg(1-q.far);
 const width=(kind==='guardians'?.45:.39)*(.81+.19*Math.abs(q.front));
 ctx.save();ctx.translate(q.waist.x,q.waist.y);ctx.rotate(q.tilt);if(q.flip)ctx.scale(-1,1);ctx.drawImage(torso,-width/2,-.40,width,.43);ctx.restore();
 // The large readable head follows the torso instead of stretching with limbs.
 ctx.save();ctx.translate(q.neck.x,q.neck.y);ctx.rotate(q.tilt*.45);if(q.flip)ctx.scale(-1,1);const headWidth=kind==='guardians'?.39:.38;ctx.drawImage(head,-headWidth/2,-.28,headWidth,.38);ctx.restore();arm(1-q.farArm);ctx.restore();return q;
}
