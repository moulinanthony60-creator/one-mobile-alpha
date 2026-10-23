// High-resolution painted pieces follow a continuous articulated pose. No
// low-resolution full-body frame, frame blending or run-time image readback.
import {loadBattleRigs,battleTroopPose} from './battle-troop-rig.mjs?v=18';
import {loadArtImage} from './battle-village-assets.mjs?v=7';
export const PAINTED_RIG_FILES=['assets/battle-style/troop-sculpt-front-v16.webp','assets/battle-style/troop-sculpt-back-v16.webp'];
export const EQUIPMENT_FILE='assets/battle-style/equipment-v16.webp';
export const EQUIPMENT_CROPS={shield:[110,27,365,463],sword:[663,1,227,508],bow:[1190,1,220,523],quiver:[185,514,235,498],staff:[707,516,143,494],fire:[1090,555,375,457]};
export async function loadPaintedTroops(signal,makeCanvas){
 const [rigs,equipment]=await Promise.all([loadBattleRigs(signal,makeCanvas,PAINTED_RIG_FILES),loadArtImage(new URL(EQUIPMENT_FILE,import.meta.url).href,signal)]);
 if(equipment.width!==1536||equipment.height!==1024)throw Error('Équipement de troupe incomplet');
 const gear={};for(const [name,[x,y,w,h]]of Object.entries(EQUIPMENT_CROPS)){const c=makeCanvas(w,h);c.getContext('2d').drawImage(equipment,x,y,w,h,0,0,w,h);gear[name]=c;}
 // Small screen sprites need prefiltered levels: a single bilinear sample of
 // a 300 px painted piece made highlights sparkle when shrunk to 12 px.
 for(const source of [...Array.from(rigs.values()).flat(2),...Object.values(gear)]){
  source.mips=[source];let previous=source;
  while(previous.width>12||previous.height>12){const w=Math.max(1,Math.ceil(previous.width/2)),h=Math.max(1,Math.ceil(previous.height/2)),level=makeCanvas(w,h),cx=level.getContext('2d');cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';cx.drawImage(previous,0,0,w,h);source.mips.push(level);previous=level;}
 }
 rigs.painted=true;rigs.equipment=gear;
 rigs.decodedBytes=[...Array.from(rigs.values()).flat(2),...Object.values(gear)].flatMap(image=>image.mips).reduce((n,image)=>n+image.width*image.height*4,0);
 rigs.dispose=()=>{for(const source of [...Array.from(rigs.values()).flat(2),...Object.values(gear)])for(const image of source.mips)image.width=image.height=1;rigs.clear();};
 return rigs;
}
export function paintedMip(image,width,height,resolution=1){
 const scale=Math.max(Math.abs(width)*resolution/image.width,Math.abs(height)*resolution/image.height),level=Math.max(0,Math.floor(Math.log2(1/Math.max(.001,scale))));
 return image.mips?.[Math.min(level,image.mips.length-1)]||image;
}
function art(ctx,image,x,y,w,h,resolution){ctx.drawImage(paintedMip(image,w,h,resolution),x,y,w,h);}
const line=(ctx,a,b,color,width)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();};
function bone(ctx,image,a,b,width,flip,resolution){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);if(flip)ctx.scale(-1,1);
 // Place each joint inside the segment; tiny projected bones keep their volume.
 art(ctx,image,-width/2,-.035,width,Math.max(.085,length)+.065,resolution);ctx.restore();
}
export function paintedWeaponSockets(kind,q){
 const hand=q.arms[kind==='archers'?0:1].hand;
 const offset=kind==='guardians'?q.point(0,.08+q.hit*.48,.39*(1-q.hit)-q.hit*.12):kind==='mages'?q.point(0,0,.40):{x:0,y:0};
 return {hand,muzzle:{x:hand.x+offset.x,y:hand.y+offset.y}};
}
function weapon(ctx,image,hand,tip,width,resolution,grip=.79,tipY=0){
 const dx=tip.x-hand.x,dy=tip.y-hand.y,height=Math.hypot(dx,dy)/(grip-tipY);ctx.save();ctx.translate(hand.x,hand.y);ctx.rotate(Math.atan2(dy,dx)+Math.PI/2);art(ctx,image,-width/2,-height*grip,width,height,resolution);ctx.restore();
}
function equipment(ctx,gear,kind,q,i,resolution){
 const hand=q.arms[i].hand,at=(s,f,h)=>{const a=q.point(s,f,h);return {x:hand.x+a.x,y:hand.y+a.y};};
 if(kind==='guardians'&&i===1){const {muzzle}=paintedWeaponSockets(kind,q);weapon(ctx,gear.sword,hand,muzzle,.20,resolution);}
 if(kind==='guardians'&&i===0){
  const width=.32*(.52+.48*Math.abs(q.front));ctx.save();ctx.translate(hand.x,hand.y);ctx.rotate(-q.side*.12);if(q.flip)ctx.scale(-1,1);art(ctx,gear.shield,-width/2,-.19,width,.40,resolution);ctx.restore();
 }
 if(kind==='archers'&&i===0){
  const sign=q.side>=0?1:-1,width=.08+.15*Math.abs(q.side),height=.49,top=at(0,-.15,.245),bottom=at(0,-.15,-.245);
  // Grip sits in the bow hand. Tips curve back toward the nocking hand.
  ctx.save();ctx.translate(hand.x,hand.y);ctx.scale(sign,1);art(ctx,gear.bow,-width*.86,-height/2,width,height,resolution);ctx.restore();
  const draw=q.aiming?q.arms[1].hand:at(0,-.12,0),a={x:hand.x-sign*width*.78,y:top.y},b={x:hand.x-sign*width*.78,y:bottom.y};
  line(ctx,a,draw,'#f4e8c3',.006);line(ctx,draw,b,'#f4e8c3',.006);
  if(q.draw>.03){const tip=at(0,.27,0);line(ctx,draw,tip,'#dec28a',.010);line(ctx,tip,at(0,.22,.02),'#f4f0db',.016);}
 }
 if(kind==='mages'&&i===1){const {muzzle}=paintedWeaponSockets(kind,q);weapon(ctx,gear.staff,hand,muzzle,.17,resolution,.58,.10);}
}
// A trailing cloth silhouette bends independently of the solid torso.
function cloak(ctx,kind,q){
 if(kind==='guardians')return;
 const mage=kind==='mages',swing=Math.sin(q.phase*Math.PI*2-.7)*q.motion*.07,trail=q.motion*.12+q.hit*.09;
 const a=q.point(-.19,-.10,.68+q.bob),b=q.point(.19,-.10,.68+q.bob),c=q.point(.23+swing,-.17-trail,mage?.13:.31),d=q.point(-.23+swing,-.17-trail,mage?.13:.31);
 const gradient=ctx.createLinearGradient(a.x,a.y,c.x,c.y);gradient.addColorStop(0,mage?'#3469aa':'#477c3e');gradient.addColorStop(.55,mage?'#234c88':'#2f5b32');gradient.addColorStop(1,mage?'#142d5c':'#1d3e25');
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.quadraticCurveTo(c.x+.06,c.y-.10,c.x,c.y);ctx.quadraticCurveTo((c.x+d.x)/2,(c.y+d.y)/2+.025,d.x,d.y);ctx.quadraticCurveTo(d.x-.05,d.y-.12,a.x,a.y);ctx.fillStyle=gradient;ctx.fill();
 ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.quadraticCurveTo((c.x+d.x)/2,(c.y+d.y)/2+.025,c.x,c.y);ctx.lineWidth=.016;ctx.strokeStyle=mage?'#d4a456':'#91ab58';ctx.stroke();
}
export function paintPaintedTroop(ctx,rig,gear,kind,p,x,y,size){
 const q=battleTroopPose(kind,p),[head,torso,upper,fore,thigh,shin]=rig[q.back?1:0],knight=kind==='guardians';
 const transform=ctx.getTransform?.(),resolution=size*(transform?Math.hypot(transform.a,transform.b):1);
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 cloak(ctx,kind,q);
 const leg=i=>{const l=q.legs[i];bone(ctx,thigh,l.hip,l.knee,knight?.19:.17,q.flip,resolution);bone(ctx,shin,l.knee,l.foot,knight?.20:.175,q.flip,resolution);};
 const upperArm=i=>{const a=q.arms[i];
  line(ctx,a.shoulder,a.elbow,knight?'#be8754':kind==='archers'?'#c4946c':'#234a8c',.085);
  bone(ctx,upper,a.shoulder,a.elbow,knight?.21:.18,q.flip,resolution);
 };
 const forearm=i=>{const a=q.arms[i];
  line(ctx,a.elbow,a.hand,knight?'#b98250':kind==='archers'?'#b5865e':'#224784',.062);
  if(!(knight&&i===0))equipment(ctx,gear,kind,q,i,resolution);
  bone(ctx,fore,a.elbow,a.hand,knight?.16:.145,q.flip,resolution);
  if(knight&&i===0)equipment(ctx,gear,kind,q,i,resolution);
 };
 leg(q.far);
 if(kind==='archers'){const at=q.point(-.12,-.15,.53);ctx.save();ctx.translate(at.x,at.y);ctx.rotate(q.side*.14);if(q.flip)ctx.scale(-1,1);art(ctx,gear.quiver,-.085,-.39,.17,.47,resolution);ctx.restore();}
 upperArm(q.farArm);forearm(q.farArm);leg(1-q.far);upperArm(1-q.farArm);
 const width=(knight?.48:.40)*(.70+.30*Math.abs(q.front));
 ctx.save();ctx.translate(q.waist.x,q.waist.y);ctx.rotate(q.tilt+q.twist*.18);ctx.transform(1,0,q.side*.08+q.twist,1,0,0);if(q.flip)ctx.scale(-1,1);art(ctx,torso,-width/2,-.40,width,kind==='mages'?.54:.44,resolution);ctx.restore();
 ctx.save();ctx.translate(q.neck.x,q.neck.y);ctx.rotate(q.tilt*.45-q.twist*.25);if(q.flip)ctx.scale(-1,1);const headWidth=(knight?.385:.355)*(.84+.16*Math.abs(q.front));art(ctx,head,-headWidth/2,-.28,headWidth,.37,resolution);ctx.restore();
 forearm(1-q.farArm);
 if(kind==='mages'&&(q.windup>.05||q.hit>.05)){
  const at=paintedWeaponSockets(kind,q).muzzle,energy=Math.max(q.windup,q.hit),r=.08+energy*.07;
  ctx.save();ctx.globalAlpha=energy*.7;const glow=ctx.createRadialGradient(at.x,at.y,0,at.x,at.y,r);glow.addColorStop(0,'#fff5d0');glow.addColorStop(.25,'#ffc35d');glow.addColorStop(1,'#fa772000');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(at.x,at.y,r,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 ctx.restore();return q;
}
