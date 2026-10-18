import {upperBody,bodyPoint,projectJoint} from './actor-facing.mjs?v=34';
import {bipedPose} from './locomotion.mjs?v=34';
// Textured cutout skeleton: limb positions are continuous, not repeated whole-body poses.
export function createEnemyParts(image,makeCanvas){const out=[];
 const cols=[0,270,610,815,1030,1300,1536].map(v=>Math.round(v*image.width/1536)),rows=[0,250,487,746,1024].map(v=>Math.round(v*image.height/1024));
 for(let row=0;row<4;row++){const parts=[];for(let col=0;col<6;col++){const x0=cols[col],x1=cols[col+1],y0=rows[row],y1=rows[row+1],w=x1-x0,h=y1-y0,c=makeCanvas(w,h),cx=c.getContext('2d');cx.drawImage(image,x0,y0,w,h,0,0,w,h);const data=cx.getImageData(0,0,w,h).data;let left=w,right=0,top=h,bottom=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>110){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}const cropped=makeCanvas(right-left+1,bottom-top+1);cropped.getContext('2d').drawImage(c,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);parts.push(cropped);}out.push(parts);}return out;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function joint(a,b,l1,l2,bend=1){let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);d=clamp(d,.015,l1+l2-.001);const angle=Math.atan2(dy,dx),cos=clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1),turn=angle+bend*Math.acos(cos);return {x:a.x+Math.cos(turn)*l1,y:a.y+Math.sin(turn)*l1};}
export function enemyPose(e){
 const phase=(e.walkDistance||0)/.8*Math.PI*2,walk=e.motionBlend??(e.moving?1:0),brute=e.kind==='brute',age=e.interval-e.cooldown,hit=e.attacking?Math.max(0,1-age/.22):0,windup=e.attacking?clamp((.4-e.cooldown)/.24,0,1):0,release=e.attacking?clamp((.16-e.cooldown)/.16,0,1):0,gait=bipedPose(e,{stride:.65,scale:brute?1.03:.76,width:brute?.22:.18,length:.249}),bob=gait.bob;
 const legs=gait.legs;
 const upper=upperBody(e,gait.phase,walk,bob,{shoulder:brute?.36:.28,arm:.34,attack:Math.max(hit,release),windup:windup*(1-release)});
 return {phase,legs,...upper,far:gait.far,bob,hit,windup,release,brute};
}
function limb(ctx,image,a,b,width,mirror=false){const d=Math.hypot(b.x-a.x,b.y-a.y);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);if(mirror)ctx.scale(-1,1);ctx.drawImage(image,-width/2,-.025,width,d+.05);ctx.restore();}
export function paintEnemyRig(ctx,parts,e,x,y,size){const p=enemyPose(e),row=(p.brute?2:0)+(p.back?1:0),[head,body,upper,fore,thigh,shin]=parts[row];ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const leg=i=>{const l=p.legs[i];limb(ctx,thigh,l.hip,l.knee,p.brute?.235:.16,p.flip);limb(ctx,shin,l.knee,l.foot,p.brute?.21:.155,p.flip);};
 const weapon=()=>{const hand=p.arms[1].hand,tip=projectJoint(bodyPoint(p.basis,0,.04+Math.max(p.hit,p.release)*.24,.26-p.windup*.06)),grip=projectJoint(bodyPoint(p.basis,0,0,-.04));ctx.lineCap='round';ctx.strokeStyle='#473326';ctx.lineWidth=.034;ctx.beginPath();ctx.moveTo(hand.x+grip.x,hand.y+grip.y);ctx.lineTo(hand.x+tip.x,hand.y+tip.y);ctx.stroke();ctx.strokeStyle='#c5a16b';ctx.lineWidth=.013;ctx.stroke();ctx.fillStyle=p.brute?'#735a40':'#b8bfbd';ctx.strokeStyle='#3c4444';ctx.lineWidth=.01;const shape=[[-.03,0,.04],[.17,.015,.02],[.17,.015,-.09],[-.03,0,-.045]];ctx.beginPath();shape.forEach(([s,f,h],i)=>{const q=projectJoint(bodyPoint(p.basis,s,f,h));i?ctx.lineTo(hand.x+tip.x+q.x,hand.y+tip.y+q.y):ctx.moveTo(hand.x+tip.x+q.x,hand.y+tip.y+q.y);});ctx.closePath();ctx.fill();ctx.stroke();};
 const arm=i=>{const a=p.arms[i];limb(ctx,upper,a.shoulder,a.elbow,p.brute?.20:.14,p.flip);limb(ctx,fore,a.elbow,a.hand,p.brute?.18:.13,p.flip);if(i===1)weapon();};
 leg(p.far);arm(p.farArm);leg(1-p.far);
 ctx.save();if(p.flip)ctx.scale(-1,1);ctx.translate(p.hit*.015,p.bob);ctx.drawImage(body,(p.brute?-.285:-.215)*p.bodyWidth,-.77,(p.brute?.57:.43)*p.bodyWidth,.43);ctx.drawImage(head,(p.brute?-.16:-.14)*p.headWidth,-.99,(p.brute?.34:.30)*p.headWidth,.30);ctx.restore();arm(1-p.farArm);ctx.restore();
}
