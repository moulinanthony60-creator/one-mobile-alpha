import {personPose,limb} from './character-rig.mjs?v=34';
import {bodyPoint,projectJoint} from './actor-facing.mjs?v=34';
import {BUILDER_CUTS} from './builder-cuts.mjs?v=34';

export const BUILDER_FILES={builderBasile:'assets/v34-basile-rig.webp',builderMila:'assets/v34-mila-rig.webp',builderEloi:'assets/v34-eloi-rig.webp'};
export const builderIdentity=p=>Math.max(0,Math.floor(Number(p.workerIndex??String(p.id||'worker-0').split('-').at(-1)))||0)%3;

function cutRig(image,makeCanvas,name){
 const parts=BUILDER_CUTS[name].map(([x,y,w,h])=>{const out=makeCanvas(w,h);out.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);return out;});
 return {heads:parts.slice(0,5),bodies:parts.slice(5,10),limbs:parts.slice(10)};
}
export function createBuilderRigs(images,makeCanvas){return Object.keys(BUILDER_FILES).map((key,i)=>cutRig(images[key],makeCanvas,['basile','mila','eloi'][i]));}
const smooth=t=>t*t*(3-2*t);
export function builderWork(p){
 const active=p.arrived===true&&p.workReady===true&&!p.moving&&p.pause>0&&!!(p.jobId||['mine','tree','forge'].includes(p.destination?.kind));
 if(!active)return {active:false,tool:null,phase:0,lift:0,impact:0};
 const tool=p.jobMode==='clearing'?'axe':p.jobId?'hammer':p.destination.kind==='mine'?'pickaxe':p.destination.kind==='tree'?'axe':'hammer';
 const phase=((p.workTime??p.activityTime??0)/1.55)%1;
 // Deliberate wind-up, quick strike, then a relaxed recovery; continuous endpoints.
 const lift=phase<.42?smooth(phase/.42):phase<.58?1-smooth((phase-.42)/.16):0;
 const impact=phase>=.58&&phase<.76?1-(phase-.58)/.18:0;
 return {active:true,tool,phase,lift,impact};
}
export function builderPose(p){
 const pose=personPose(p),identity=builderIdentity(p),work=builderWork(p),view=Math.min(4,Math.atan2(Math.abs(pose.basis.side),pose.basis.front)/(Math.PI/4));
 const q={...pose,identity,view,working:work.active,work:work.lift,action:work};
 if(work.active)q.bob=.007*(1-work.lift);else if(!p.moving)q.bob=Math.sin((p.activityTime||0)*1.8)*.003;
 if(work.active){
  const point=(s,f,h)=>projectJoint(bodyPoint(q.basis,s,f,h));
  // Feet remain planted while the tool arm winds up and strikes in front of the body.
  q.arms=q.arms.map((a,i)=>i===1?{shoulder:point(.25,.015,.70),elbow:point(.29,.12-work.lift*.10,.52+work.lift*.34),hand:point(.23,.40-work.lift*.48,.35+work.lift*.55)}:{shoulder:a.shoulder,elbow:point(-.27,.05,.52),hand:point(-.23,.18,.40)});
 }
 return q;
}
export function paintBuilder(ctx,rigs,p,x,y,size){
 if(!rigs||p.kind!=='worker')return false;
 const q=builderPose(p),rig=rigs[q.identity],[upper,fore,thigh,boot]=rig.limbs;
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const slender=q.identity===1,legWidth=slender?.17:.205,armWidth=slender?.14:.17;
 const leg=i=>{const l=q.legs[i];limb(ctx,thigh,l.hip,l.knee,legWidth,q.flip);limb(ctx,boot,l.knee,l.foot,legWidth*.84,q.flip);};
 const arm=i=>{const a=q.arms[i];limb(ctx,upper,a.shoulder,a.elbow,armWidth,q.flip);limb(ctx,fore,a.elbow,a.hand,armWidth*.92,q.flip);
  if(i===1&&q.working)paintTool(ctx,q,rigs);
 };
 leg(q.far);arm(q.farArm);leg(1-q.far);
 ctx.save();if(q.flip)ctx.scale(-1,1);
 // Blend neighboring directions during turns; the joints keep moving continuously.
 const lo=Math.floor(q.view),hi=Math.min(4,lo+1),f=q.view-lo;
 const layer=(index,alpha)=>{if(alpha<=0)return;const head=rig.heads[index],torso=rig.bodies[index],th=.46,tw=Math.min(slender?.53:.61,th*torso.width/torso.height),hh=slender?.51:.42,hw=Math.min(.58,hh*head.width/head.height);ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(torso,-tw/2,-.81+q.bob,tw,th);ctx.drawImage(head,-hw/2,(slender?-.65:-.78)-hh+q.bob,hw,hh);ctx.restore();};
 // Only crossfade close to the view boundary, avoiding a prolonged double face.
 const blend=smooth(Math.max(0,Math.min(1,(f-.36)/.28)));layer(lo,1-blend);layer(hi,blend);
 ctx.restore();arm(1-q.farArm);if(q.working)paintWorkImpact(ctx,q);ctx.restore();return true;
}

// Small vector tools stay crisp at every village zoom and share one grip/pivot.
function toolGeometry(q){
 const hand=q.arms[1].hand,forward=projectJoint(bodyPoint(q.basis,0,1,0));
 const tip={x:hand.x+forward.x*(.46-q.work*.51),y:hand.y+forward.y*(.46-q.work*.51)-.08-q.work*.25};
 return {hand,tip,angle:Math.atan2(tip.y-hand.y,tip.x-hand.x)};
}
function paintTool(ctx,q,rigs){
 const {hand,tip,angle}=toolGeometry(q);
 if(q.action.tool!=='axe'){
  const source=rigs[q.action.tool==='pickaxe'?2:q.identity===1?1:0].limbs[4],h=Math.hypot(tip.x-hand.x,tip.y-hand.y)/.72,w=h*source.width/source.height;
  ctx.save();ctx.translate(hand.x,hand.y);ctx.rotate(angle+Math.PI/2);ctx.drawImage(source,-w*.48,-h*.85,w,h);ctx.restore();return;
 }
 ctx.lineCap='round';ctx.strokeStyle='#62401e';ctx.lineWidth=.045;ctx.beginPath();ctx.moveTo(hand.x,hand.y+.035);ctx.lineTo(tip.x,tip.y);ctx.stroke();
 ctx.strokeStyle='#c68b42';ctx.lineWidth=.024;ctx.stroke();ctx.save();ctx.translate(tip.x,tip.y);ctx.rotate(angle);
 ctx.lineJoin='round';ctx.lineWidth=.013;ctx.strokeStyle='#4c5561';
 if(q.action.tool==='axe'){
  const metal=ctx.createLinearGradient(-.06,-.14,.10,.05);metal.addColorStop(0,'#647986');metal.addColorStop(.40,'#d7e4e5');metal.addColorStop(.65,'#9caeb5');metal.addColorStop(1,'#e9eff0');ctx.fillStyle=metal;ctx.beginPath();ctx.moveTo(-.06,-.035);ctx.lineTo(.01,-.16);ctx.quadraticCurveTo(.13,-.13,.12,.06);ctx.lineTo(.02,.04);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#f4f8ef';ctx.beginPath();ctx.moveTo(.01,-.15);ctx.quadraticCurveTo(.11,-.12,.11,.04);ctx.stroke();
 }else if(q.action.tool==='pickaxe'){
  ctx.strokeStyle='#4b535f';ctx.lineWidth=.052;ctx.beginPath();ctx.moveTo(-.025,-.17);ctx.quadraticCurveTo(.10,0,-.025,.17);ctx.stroke();ctx.strokeStyle='#cedbe0';ctx.lineWidth=.028;ctx.stroke();
 }else{
  ctx.fillStyle='#75818d';ctx.fillRect(-.065,-.105,.12,.21);ctx.strokeRect(-.065,-.105,.12,.21);ctx.fillStyle='#dbe2dc';ctx.fillRect(-.065,-.105,.035,.21);ctx.fillStyle='#e4bb64';ctx.fillRect(-.03,-.035,.085,.07);
 }
 ctx.restore();
}
function paintWorkImpact(ctx,q){
 const life=q.action.impact;if(!life)return;const {tip}=toolGeometry(q),age=1-life;
 ctx.save();ctx.globalAlpha*=life;
 for(let i=0;i<5;i++){const a=i*2.399+.3,x=tip.x+Math.cos(a)*age*.19,y=tip.y-Math.sin(a)*age*.14+age*age*.10;ctx.fillStyle=q.action.tool==='axe'?(i%2?'#cf9b56':'#f1c77d'):(i%2?'#ffeab0':'#d0d8d1');ctx.save();ctx.translate(x,y);ctx.rotate(a+age*2);ctx.fillRect(-.012,-.009,.024,.018);ctx.restore();}
 ctx.restore();
}
