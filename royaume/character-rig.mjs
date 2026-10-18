import {upperBody,actorBasis,bodyPoint,projectJoint} from './actor-facing.mjs?v=34';
import {bipedPose,footCycle} from './locomotion.mjs?v=34';
export {footCycle} from './locomotion.mjs?v=34';
// Continuous joint animation. Ground contacts follow distance, not frame rate.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>t*t*(3-2*t);
export function cutParts(image,makeCanvas,columns,rows){
 const xs=columns.map(x=>Math.round(x*image.width/1536)),ys=rows.map(y=>Math.round(y*image.height/1024));
 return ys.slice(0,-1).map((y,row)=>xs.slice(0,-1).map((x,col)=>{
  const w=xs[col+1]-x,h=ys[row+1]-y,c=makeCanvas(w,h),ctx=c.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);const data=ctx.getImageData(0,0,w,h).data;let l=w,r=-1,t=h,b=-1;
  for(let py=0;py<h;py++)for(let px=0;px<w;px++)if(data[(py*w+px)*4+3]>100){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}
  if(r<l)throw new Error('Empty animation part '+row+':'+col);const out=makeCanvas(r-l+1,b-t+1);out.getContext('2d').drawImage(c,l,t,out.width,out.height,0,0,out.width,out.height);return out;
 }));
}
export function joint(a,b,l1,l2,bend=1){const dx=b.x-a.x,dy=b.y-a.y,d=clamp(Math.hypot(dx,dy),.015,l1+l2-.001),angle=Math.atan2(dy,dx)+bend*Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));return {x:a.x+Math.cos(angle)*l1,y:a.y+Math.sin(angle)*l1};}
export function limb(ctx,image,a,b,width,mirror=false){const d=Math.hypot(b.x-a.x,b.y-a.y);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);if(mirror)ctx.scale(-1,1);ctx.drawImage(image,-width/2,-.025,width,d+.05);ctx.restore();}
export function personPose(p){
 const gait=bipedPose(p,{scale:p.kind==='guardian'?.76:.70}),{phase,blend,bob}=gait;
 const working=p.kind==='worker'&&p.arrived===true&&p.workReady!==false&&p.pause>0&&(p.jobId||['mine','tree','forge'].includes(p.destination?.kind)),work=working?(Math.sin((p.activityTime||0)*3.6)+1)/2:0;
 return {...gait,...upperBody(p,phase,blend,bob,{working,work}),working,work};
}
export function paintPerson(ctx,parts,p,x,y,size){
 const q=personPose(p),soldier=['guardian','archer','rider'].includes(p.kind),row=(soldier?2:0)+(q.back?1:0),[legacyHead,legacyTorso,upper,fore,thigh,shin]=parts[row],view=Math.round(Math.atan2(Math.abs(q.basis.side),q.basis.front)/(Math.PI/4)),directional=parts.facing,head=directional?.[soldier?2:0][view]||legacyHead,torso=directional?.[soldier?3:1][view]||legacyTorso;ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const leg=i=>{const l=q.legs[i];limb(ctx,thigh,l.hip,l.knee,.135,q.flip);limb(ctx,shin,l.knee,l.foot,.12,q.flip);};
 const equipment=i=>{
  const hand=q.arms[i].hand,point=(s,f,h)=>{const a=projectJoint(bodyPoint(q.basis,s,f,h));return {x:hand.x+a.x,y:hand.y+a.y};},path=(points,fill,stroke,width=.013)=>{ctx.beginPath();points.map(v=>point(...v)).forEach((a,j)=>j?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y));if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}};
  if(p.kind==='guardian'&&i===1){path([[0,0,-.035],[0,.04,.34]],null,'#313646',.026);path([[0,0,0],[0,.04,.34]],null,'#dce5eb',.014);path([[-.07,0,.025],[.07,0,.025]],null,'#d2b16c',.025);}
  if(p.kind==='guardian'&&i===0){path([[-.13,.08,.16],[.13,.08,.16],[.12,.08,-.025],[0,.08,-.11],[-.12,.08,-.025]],'#584172','#d6b971');path([[0,.08,.10],[0,.08,-.045]],null,'#d6b971',.012);}
  if(p.kind==='archer'&&i===1){const a=point(0,0,.23),b=point(0,.23,0),c=point(0,0,-.18);ctx.strokeStyle='#b39159';ctx.lineWidth=.022;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(b.x,b.y,c.x,c.y);ctx.stroke();path([[0,0,.23],[0,0,-.18]],null,'#e9d9ad',.007);}
  if(q.working&&i===1){path([[0,0,-.03],[0,q.work*.20,.26]],null,'#8c633b',.026);if(p.jobMode==='clearing')path([[-.02,q.work*.20,.30],[.14,q.work*.20,.35],[.17,q.work*.20,.22],[-.02,q.work*.20,.23]],'#b8c6c6','#52646a',.012);else path([[-.10,q.work*.20,.26],[.13,q.work*.20,.26]],null,'#bec4bc',.043);}
  if(p.kind==='scholar'&&i===1)path([[-.10,.04,.10],[.10,.04,.10],[.10,.04,-.08],[-.10,.04,-.08]],'#65458b','#c7ae6e');
  if(p.kind==='merchant'&&i===1){ctx.fillStyle='#87633c';ctx.beginPath();ctx.ellipse(hand.x,hand.y+.03,.065,.10,0,0,Math.PI*2);ctx.fill();}
 };
 const arm=i=>{const a=q.arms[i];limb(ctx,upper,a.shoulder,a.elbow,.12,q.flip);limb(ctx,fore,a.elbow,a.hand,.10,q.flip);equipment(i);};
 leg(q.far);arm(q.farArm);leg(1-q.far);
 ctx.save();if(q.flip)ctx.scale(-1,1);const torsoWidth=directional?.[soldier?3:1]? .34*torso.width/directional[soldier?3:1][0].width:.34*q.bodyWidth,headWidth=directional?.[soldier?2:0]? .24*head.width/directional[soldier?2:0][0].width:.24*q.headWidth;ctx.drawImage(torso,-torsoWidth/2,-.76+q.bob,torsoWidth,.39);ctx.drawImage(head,-headWidth/2,-.99+q.bob,headWidth,.26);ctx.restore();arm(1-q.farArm);
 ctx.restore();return q;
}
export function animalPose(p){
 const horse=p.kind==='rider',stride=horse?1.12:.95,scale=horse?.98:.81,phase=(p.walkDistance||0)/stride,blend=p.motionBlend??(p.moving?1:0),bob=Math.sin(phase*Math.PI*4)*.006*blend,basis=actorBasis(p),legs=[];
 for(let i=0;i<4;i++){
  const front=i%2===0,side=i<2?-1:1,f=footCycle(phase+(front?0:.5)+(side<0?.5:0)),fore=front?.43:-.38,travel=f.travel*stride*.3/scale*blend;
  const hip=bodyPoint(basis,side*.13,fore,.40-bob),foot=bodyPoint(basis,side*.13,fore+travel,f.lift*.065*blend),knee=bodyPoint(basis,side*.13,fore+travel*.44+(front?-.065:.075),.20-bob*.5+f.lift*.035*blend);
  legs.push({hip:projectJoint(hip),foot:projectJoint(foot),knee:projectJoint(knee),front,depth:hip.x+hip.z,far:hip.x+hip.z<0});
 }
 return {phase,legs,bob,flip:basis.side<0,horse,blend,basis,bodyWidth:Math.sqrt(basis.side**2+.19*basis.front**2),headWidth:Math.sqrt(basis.side**2+.45*basis.front**2)};
}
export function paintAnimal(ctx,parts,people,p,x,y,size){
 const q=animalPose(p),[head,body,frontUpper,frontLower,rearUpper,rearLower,tail]=parts[q.horse?1:0];ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const leg=l=>{ctx.globalAlpha=l.far?.85:1;limb(ctx,l.front?frontUpper:rearUpper,l.hip,l.knee,q.horse?.13:.16,q.flip);limb(ctx,l.front?frontLower:rearLower,l.knee,l.foot,q.horse?.10:.12,q.flip);ctx.globalAlpha=1;};
 const drawHead=()=>{const bite=p.attacking?Math.max(0,1-(p.interval-p.cooldown)/.19):0,at=projectJoint(bodyPoint(q.basis,0,.53+bite*.08,.64-q.bob));ctx.save();ctx.translate(at.x,at.y);if(q.flip)ctx.scale(-1,1);ctx.drawImage(head,-.16*q.headWidth,-.23,(q.horse?.40:.38)*q.headWidth,q.horse?.51:.39);ctx.restore();};
 q.legs.filter(l=>l.far).sort((a,b)=>a.depth-b.depth).forEach(leg);
 const tailAt=projectJoint(bodyPoint(q.basis,0,-.43,.48-q.bob));ctx.save();ctx.translate(tailAt.x,tailAt.y);if(q.flip)ctx.scale(-1,1);ctx.rotate(Math.sin(q.phase*Math.PI*2)*.08*q.blend);ctx.drawImage(tail,-.10,-.06,.16,.39);ctx.restore();
 if(q.basis.front<0)drawHead();ctx.save();if(q.flip)ctx.scale(-1,1);ctx.drawImage(body,-.4*q.bodyWidth,-.65+q.bob,.8*q.bodyWidth,.37);ctx.restore();q.legs.filter(l=>!l.far).sort((a,b)=>a.depth-b.depth).forEach(leg);if(q.basis.front>=0)drawHead();
 if(q.horse&&people){
  const view=Math.round(Math.atan2(Math.abs(q.basis.side),q.basis.front)/(Math.PI/4)),old=people[q.basis.front<0?3:2],h=people.facing?.[2][view]||old[0],torso=people.facing?.[3][view]||old[1],tw=people.facing?.28*torso.width/people.facing[3][0].width:.28,hw=people.facing?.20*h.width/people.facing[2][0].width:.20;
  for(const side of [-1,1]){const hip=projectJoint(bodyPoint(q.basis,side*.11,0,.61-q.bob)),knee=projectJoint(bodyPoint(q.basis,side*.22,.10,.44-q.bob)),foot=projectJoint(bodyPoint(q.basis,side*.22,.08,.25-q.bob));limb(ctx,old[4],hip,knee,.10,q.flip);limb(ctx,old[5],knee,foot,.095,q.flip);}
  ctx.save();if(q.flip)ctx.scale(-1,1);ctx.drawImage(torso,-tw/2,-.94+q.bob,tw,.35);ctx.drawImage(h,-hw/2,-1.12+q.bob,hw,.22);ctx.restore();
  for(const side of [-1,1]){const shoulder=projectJoint(bodyPoint(q.basis,side*.18,0,.86-q.bob)),elbow=projectJoint(bodyPoint(q.basis,side*.17,.10,.73-q.bob)),hand=projectJoint(bodyPoint(q.basis,side*.13,.27,.74-q.bob)),bridle=projectJoint(bodyPoint(q.basis,0,.65,.57-q.bob));limb(ctx,old[2],shoulder,elbow,.09,q.flip);limb(ctx,old[3],elbow,hand,.08,q.flip);ctx.strokeStyle='#5e422b';ctx.lineWidth=.009;ctx.beginPath();ctx.moveTo(hand.x,hand.y);ctx.lineTo(bridle.x,bridle.y);ctx.stroke();}
 }
 ctx.restore();return q;
}
