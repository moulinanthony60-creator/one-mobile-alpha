import {createDefensePainter} from './battle-defense-rig.mjs?v=3';
import {paintRuin,paintBuildingWear,ruinSprite} from './battle-building-details.mjs?v=1';
import {loadVillageSprites,spritePlacement,villageSpriteKey,villageScenery} from './battle-village-assets.mjs?v=6';
import {createWallArt,wallConnections} from './wall-art.mjs?v=34';
import {createBattleWallArt} from './battle-wall-art.mjs?v=14';
import {fitBattleCamera,combatFocus} from './battle-camera.mjs?v=14';
import {paintCartoonActor} from './cartoon-art.mjs?v=34';
import {loadBattleRigs,paintBattleTroop} from './battle-troop-rig.mjs?v=14';
import {loadVolumeTroops,paintVolumeTroop,VOLUME_TILE} from './battle-volume-atlas.mjs?v=15';
import {troopScale} from './battle-aim.mjs?v=3';
import {effectAge,paintCombatShot,paintDestruction,paintEmbers} from './battle-combat-fx.mjs?v=14';
import {loadFortressSprites} from './battle-fortress-art.mjs?v=14';
import {createSceneryCache} from './battle-scene-cache.mjs?v=3';
import {renderPosition,renderFacing,createMotionTracks} from './battle-motion.mjs?v=5';
import {meadowTexture,battlefieldScenery,paintGround} from './battle-style-ground.mjs?v=14';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function projectBattle(x,z,camera){const t=camera.tile*camera.zoom;return {x:camera.width/2+((x-camera.x)-(z-camera.z))*t/2,y:(camera.originY??camera.height*.43)+((x-camera.x)+(z-camera.z))*t/4};}
export function unprojectBattle(x,y,camera){const t=camera.tile*camera.zoom,a=(x-camera.width/2)*2/t,b=(y-(camera.originY??camera.height*.43))*4/t;return {x:camera.x+(a+b)/2,y:camera.z+(b-a)/2};}
export function troopFeedback(unit,elapsed,reduced=false){
 const death=Number.isFinite(unit.diedAt)?Math.max(0,elapsed-unit.diedAt):Infinity,hit=Number.isFinite(unit.lastHitAt)?elapsed-unit.lastHitAt:Infinity;
 return {visible:unit.hp>0||death<.55,fall:unit.hp>0||reduced?0:clamp(death/.35,0,1),opacity:unit.hp>0?1:Math.max(0,1-death/.55),hit:!reduced&&unit.hp>0&&hit>=0&&hit<.18?1-hit/.18:0};
}

// Independent illustrated objects: no screenshot background and no WebGL dependency.
export function createVillageScene(canvas,initialBattle){
 let ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Le navigateur ne peut pas ouvrir le terrain.');
 const field=initialBattle.field||{width:20,height:16,margin:3},wide=Boolean(initialBattle.field);
 const camera={x:field.width/2,z:field.height/2,tile:22,zoom:1,width:1,height:1};
 const abort=new AbortController(),scenery=wide?battlefieldScenery(field):villageScenery().map(o=>({...o,x:o.x+10,z:o.z+8}));
 const wallSprite=createWallArt(makeCanvas),battleWall=createBattleWallArt(makeCanvas),defense=createDefensePainter(makeCanvas),motion=createMotionTracks(),cache=createSceneryCache(makeCanvas),destroyed=new Map(),grass=meadowTexture(makeCanvas);
 let presentation=null,recoil=new Map(),following=false,followClock=0,selectedDefense=null,showRanges=false;
 let recordsKey='',visualUnits=[],staticObjects=[],sprites=new Map(),troops=new Map(),battle=initialBattle,time=0,disposed=false,economy=false,marker=null,backdropDirty=true,pixelRatio=1,artStatus={terrain:false,troops:false};
 const volumeMix=makeCanvas(VOLUME_TILE.width,VOLUME_TILE.height),backdrop=makeCanvas(1,1),outside=scenery.filter(o=>o.x<0||o.x>field.width||o.z<0||o.z>field.height),inside=scenery.filter(o=>!outside.includes(o));
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){
  if(disposed)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  camera.width=r.width;camera.height=r.height;const framing=wide?fitBattleCamera(r.width,r.height,field):null;camera.tile=framing?.tile??Math.min(r.width/19.2,r.height/12.8);camera.originY=framing?.originY??r.height*.43;
  const ratio=economy?1:Math.min(window.devicePixelRatio||1,1.6);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);pixelRatio=ratio;backdrop.width=canvas.width;backdrop.height=canvas.height;backdropDirty=true;cache.invalidate();paint();
 }
 const p=(x,z)=>projectBattle(x,z,camera);
 function health(x,y,width,ratio,enemy=false){if(ratio<=0||ratio>=.999)return;ctx.fillStyle='#17251eee';ctx.fillRect(x-width/2-1,y-1,width+2,5);ctx.fillStyle='#57382b';ctx.fillRect(x-width/2,y,width,3);ctx.fillStyle=enemy?'#f07e60':ratio>.4?'#a9df4b':'#eb7953';ctx.fillRect(x-width/2,y,width*ratio,3);}
 function sprite(image,x,y,width,height){if(x+width<0||x>camera.width||y+height<0||y>camera.height)return;ctx.drawImage(image,x,y,width,height);}
 function rubble(b,t){
  const at=p(b.x,b.y);if(b.kind!=='wall'){const art=sprites.get(ruinSprite(b))||sprites.get('rubble');if(art){const w=(b.collision.width+b.collision.depth)*t*.43,h=w*art.aspect*.60;ctx.drawImage(art.image,at.x-w/2,at.y-h*.75,w,h);}else paintRuin(ctx,b,at,t);return;}
  // Broken masonry follows the wall footprint; no repeated brown oval stamps.
  for(let j=0;j<5;j++){const n=k=>{const a=Math.sin((Number(b.id.slice(1))+1)*71+j*13+k*29)*43758.5453;return a-Math.floor(a);},x=at.x+(n(1)-.5)*t*.8,y=at.y+(n(2)-.5)*t*.3,size=t*(.06+n(3)*.12);ctx.fillStyle=j%3?'#7b8d96':'#c9a75a';ctx.beginPath();ctx.moveTo(x,y-size*.6);ctx.lineTo(x+size,y);ctx.lineTo(x,y+size*.35);ctx.lineTo(x-size*.7,y);ctx.fill();}
 }
 function buildingBox(b,t,occupied){
  const at=p(b.x,b.y);
  if(['cannon','mortar'].includes(b.kind))return {x:at.x-t*2,y:at.y-t*2.7,w:t*4,h:t*4};
  if(b.kind==='wall'){
   const mask=wallConnections({x:b.x,z:b.y},occupied),art=wide?battleWall(mask||(b.rotation?12:3)):wallSprite(2,mask),scale=t/art.unit;
   return {image:art.image,x:at.x-art.anchor.x*scale,y:at.y-art.anchor.y*scale,w:art.image.width*scale,h:art.image.height*scale};
  }
  const art=sprites.get(villageSpriteKey(b));
  if(art){const placement=spritePlacement(b,art.aspect),scale=t/Math.SQRT2*(wide?1.13:1),w=placement.width*scale,h=placement.height*scale;return {image:art.image,x:at.x-w/2,y:at.y+(b.collision.width+b.collision.depth)*t/8-h,w,h};}
  const w=b.collision.width*t;return {x:at.x-w/2,y:at.y-w,w,h:w};
 }
 function collapse(b,t,occupied){
  const age=time-destroyed.get(b.id);if(reduced||age<0||age>.48)return;
  const box=buildingBox(b,t,occupied);if(!box.image)return;
  const at=p(b.x,b.y),q=age/.48,tilt=(Number(b.id.slice(1))%2?1:-1)*q*q*.11;
  ctx.save();ctx.globalAlpha=(1-q)*(1-q);ctx.translate(at.x,at.y);ctx.rotate(tilt);ctx.scale(1+q*.08,1-q*.68);ctx.translate(-at.x,-at.y);
  sprite(box.image,box.x,box.y,box.w,box.h);ctx.restore();
 }
 function building(b,t,occupied){
  if(b.hp<=0){rubble(b,t);return;}
  const at=p(b.x,b.y),box=buildingBox(b,t,occupied);
  if(b.kind!=='wall'){
   // Offset directional contact shadow: the same upper-left light as the atlas.
   const w=(b.collision.width+b.collision.depth)*t*.25;
   ctx.fillStyle='#1826194d';ctx.beginPath();ctx.moveTo(at.x-w*.85,at.y);ctx.lineTo(at.x,at.y-w*.43);ctx.lineTo(at.x+w*1.35,at.y+w*.16);ctx.lineTo(at.x+w*.2,at.y+w*.65);ctx.closePath();ctx.fill();
  }
  if(['cannon','mortar'].includes(b.kind)){defense.paint(ctx,{...b,facing:renderFacing(b,presentation,true)},at,t,battle.elapsed-(presentation?(1-presentation.alpha)/30:0),reduced);return;}
  if(box.image){
   const kick=recoil.get(b.id);ctx.save();
   if(kick&&(b.kind==='cannon'||b.kind==='mortar')){const from=p(kick.fx.fromX,kick.fx.fromY),aim=p(kick.fx.x,kick.fx.y),d=Math.hypot(aim.x-from.x,aim.y-from.y)||1,amount=Math.sin(kick.age/.24*Math.PI)*t*.08;ctx.translate(-(aim.x-from.x)/d*amount,-(aim.y-from.y)/d*amount);}
   sprite(box.image,box.x,box.y,box.w,box.h);if(b.kind!=='wall')paintBuildingWear(ctx,b,box);ctx.restore();
  }
  else{ctx.fillStyle='#d5bc87';ctx.fillRect(box.x,box.y,box.w,box.h);}
  if(b.kind==='tower')defense.paint(ctx,{...b,facing:renderFacing(b,presentation,true)},at,t,battle.elapsed-(presentation?(1-presentation.alpha)/30:0),reduced);
 }
 function unit(visual,t){
  const {unit:u,position,pose}=visual,feedback=troopFeedback(u,battle.elapsed-(presentation?(1-presentation.alpha)/30:0),reduced);if(!feedback.visible)return;
  const at=p(position.x,position.y),size=t*troopScale(u.kind);
  if(!economy&&!reduced&&pose.motion>.6){ctx.save();ctx.globalAlpha=.11;ctx.fillStyle='#e9d4a1';ctx.beginPath();ctx.ellipse(at.x-pose.dx*t*.16,at.y+1,t*.12,t*.05,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.save();ctx.globalAlpha=feedback.opacity;
  ctx.fillStyle='#14211655';ctx.beginPath();ctx.ellipse(at.x+2,at.y+1,size*.23,size*.09,0,0,Math.PI*2);ctx.fill();
  if(feedback.hit){ctx.strokeStyle=`rgba(255,211,153,${feedback.hit*.85})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(at.x,at.y-size*.42,size*.25,size*.39,0,0,Math.PI*2);ctx.stroke();}
  if(feedback.fall){ctx.translate(at.x,at.y);ctx.rotate((pose.dx-pose.dz>=0?1:-1)*feedback.fall*1.28);ctx.scale(1,1-feedback.fall*.28);ctx.translate(-at.x,-at.y);}
  const rig=troops.get(u.kind);
  if(rig&&troops.volume)paintVolumeTroop(ctx,rig,u.kind,pose,at.x,at.y,size,volumeMix);
  else if(rig)paintBattleTroop(ctx,rig,u.kind,pose,at.x,at.y,size);
  else paintCartoonActor(ctx,{...pose,kind:{guardians:'guardian',archers:'archer',mages:'scholar'}[u.kind],walkDistance:pose.distance,motionBlend:!reduced&&pose.moving?1:0,activityTime:time,cooldown:u.cooldown,interval:1},at.x,at.y,size*.8);
  ctx.restore();
  health(at.x,at.y-size*1.26,size*.5,u.hp/u.maxHp);
 }
 function decoration(item,t){const art=sprites.get(item.key);if(!art)return;const at=p(item.x,item.z),w=item.width*t/Math.SQRT2,h=w*art.aspect;sprite(art.image,at.x-w/2,at.y+item.bottom*t/Math.SQRT2-h,w,h);}
 function paintEffects(t){
  for(const b of battle.buildings){
   if(b.hp<=0&&!destroyed.has(b.id))destroyed.set(b.id,time);
   const death=destroyed.get(b.id),at=p(b.x,b.y);
   if(death!==undefined)paintDestruction(ctx,b,time-death,at,t,{economy,reduced});
   else if(b.kind!=='wall')paintEmbers(ctx,b,time,at,t,{economy,reduced});
  }
  for(const fx of battle.effects){const at=p(fx.x,fx.y);
   if(fx.style){paintCombatShot(ctx,fx,effectAge(fx,battle.elapsed,presentation),p,t,{economy,reduced});continue;}
   if(fx.kind==='spell'){
    ctx.save();const progress=1-fx.life/.65;ctx.globalAlpha=Math.min(1,fx.life*3);ctx.strokeStyle='#dac9ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(at.x,at.y,t*2.6*progress,t*1.3*progress,0,0,Math.PI*2);ctx.stroke();
    if(!economy){const g=ctx.createRadialGradient(at.x,at.y,0,at.x,at.y,t*2);g.addColorStop(0,'#bda4ff88');g.addColorStop(1,'#846aff00');ctx.fillStyle=g;ctx.fillRect(at.x-t*2,at.y-t*2,t*4,t*4);}
    ctx.beginPath();ctx.moveTo(at.x-8,at.y-t*3);ctx.lineTo(at.x+9,at.y-t*1.6);ctx.lineTo(at.x-4,at.y-t*1.3);ctx.lineTo(at.x,at.y);ctx.strokeStyle='#e6eeff';ctx.lineWidth=3;ctx.stroke();ctx.restore();
   }else if(Number.isFinite(fx.fromX)){
    const from=p(fx.fromX,fx.fromY),travel=clamp(1-fx.life/.25,0,1),enemy=fx.kind==='enemy',caster=!enemy&&battle.units.find(u=>u.kind==='mages'&&Math.hypot(u.x-fx.fromX,u.y-fx.fromY)<.4),color=enemy?'#ffd174':caster?'#b8caff':'#fff1bd';
    const x=from.x+(at.x-from.x)*travel,y=from.y+(at.y-from.y)*travel-t*.55-Math.sin(travel*Math.PI)*t*.35;
    ctx.strokeStyle=color;ctx.lineWidth=caster?2.5:1.5;ctx.beginPath();ctx.moveTo(x-(at.x-from.x)*.12,y-(at.y-from.y)*.12);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,enemy?2.2:caster?3:1.5,0,Math.PI*2);ctx.fill();
   }
  }
 }
 function paint(){
  if(disposed)return;const t=camera.tile*camera.zoom;
  for(const b of battle.buildings)if(b.hp<=0&&!destroyed.has(b.id))destroyed.set(b.id,time);
  if(backdropDirty){const surface=ctx;ctx=backdrop.getContext('2d');ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.imageSmoothingEnabled=true;
   if(wide)paintGround(ctx,camera,field,p,grass,battle.buildings);else{ctx.fillStyle='#83bb45';ctx.fillRect(0,0,camera.width,camera.height);}
   for(const item of outside)decoration(item,t);ctx=surface;backdropDirty=false;
  }
  ctx.drawImage(backdrop,0,0,camera.width,camera.height);ctx.imageSmoothingEnabled=true;
  // Painted before buildings/actors: the range belongs on the ground and uses
  // exactly the radius used by combat, never an approximate screen circle.
  for(const b of battle.buildings)if(b.hp>0&&b.damage>0&&(b.id===selectedDefense||showRanges&&b.kind==='cannon')){
   const active=b.id===selectedDefense;
   ctx.save();ctx.beginPath();for(let i=0;i<=64;i++){const angle=i*Math.PI/32,q=p(b.x+Math.cos(angle)*b.range,b.y+Math.sin(angle)*b.range);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.closePath();
   ctx.fillStyle=active?'#f66b422d':'#f66b4218';ctx.fill();ctx.strokeStyle=active?'#fff4bd':'#ffdc8b';ctx.lineWidth=active?2.5:1.5;ctx.setLineDash(active?[]:[7,5]);ctx.stroke();
   const at=p(b.x,b.y);ctx.fillStyle='#fff2b0';ctx.beginPath();ctx.ellipse(at.x,at.y,t*.55,t*.27,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  const occupied=new Set(battle.buildings.filter(b=>b.kind==='wall'&&b.hp>0).map(b=>b.x+','+b.y));
  const topology=battle.buildings.map(b=>b.hp<=0?'0':b.hp<b.maxHp*.3?'1':b.hp<b.maxHp*.65?'2':'3').join('');
  const key=[camera.x,camera.z,t,camera.width,camera.height,pixelRatio,sprites.size].join('|');
  recoil=new Map(battle.effects.filter(fx=>fx.kind==='enemy'&&fx.sourceId&&effectAge(fx,battle.elapsed,presentation)>=0&&effectAge(fx,battle.elapsed,presentation)<.24).map(fx=>[fx.sourceId,{fx,age:effectAge(fx,battle.elapsed,presentation)}]));
  const paintStatic=(o,surface)=>{const old=ctx,live=surface===ctx;ctx=surface;ctx.save();const hit=o.building?battle.elapsed-o.building.lastHitAt:Infinity;if(live&&!reduced&&hit>=0&&hit<.18)ctx.translate(Math.sin(hit*70)*t*.035*(1-hit/.18),0);if(o.building){building(o.building,t,occupied);if(live&&o.building.hp<=0)collapse(o.building,t,occupied);}else decoration(o.item,t);ctx.restore();ctx=old;};
  if(recordsKey!==key+topology){recordsKey=key+topology;staticObjects=[];
  for(const item of inside){const art=sprites.get(item.key);if(!art)continue;const at=p(item.x,item.z),w=item.width*t/Math.SQRT2,h=w*art.aspect;staticObjects.push({depth:item.x+item.z,item,bounds:{x:at.x-w/2-2,y:at.y+item.bottom*t/Math.SQRT2-h-2,w:w+4,h:h+4}});}
  for(const b of battle.buildings){const box=buildingBox(b,t,occupied),at=p(b.x,b.y),span=(b.collision.width+b.collision.depth)*t*.45;
   staticObjects.push({depth:b.x+b.y+(b.kind==='wall'?.02:(b.collision.width+b.collision.depth)*.14),building:b,revision:b.hp<=0?'dead':b.kind==='wall'?'wall'+wallConnections({x:b.x,z:b.y},occupied):b.hp<b.maxHp*.3?'broken':b.hp<b.maxHp*.65?'damaged':'whole',bounds:{x:Math.min(box.x,at.x-span)-3,y:Math.min(box.y,at.y-span*.6)-3,w:Math.max(box.x+box.w,at.x+span)-Math.min(box.x,at.x-span)+6,h:Math.max(box.y+box.h,at.y+span*.5)-Math.min(box.y,at.y-span*.6)+6}});
  }
  staticObjects.sort((a,b)=>a.depth-b.depth);}
  const activeRecoil=recoil;recoil=new Map();cache.prepare(key,staticObjects,camera.width,camera.height,pixelRatio,paintStatic);recoil=activeRecoil;
  const actors=visualUnits.filter(v=>troopFeedback(v.unit,battle.elapsed-(presentation?(1-presentation.alpha)/30:0),reduced).visible).map(v=>({...v,depth:v.position.x+v.position.y+.03})).sort((a,b)=>a.depth-b.depth);
  cache.draw(ctx,actors,paintStatic,v=>unit(v,t),o=>(o.building?.hp<=0&&!reduced&&time-destroyed.get(o.building.id)<.48)||o.building?.hp>0&&(['cannon','mortar','tower'].includes(o.building.kind)||recoil.has(o.building.id)||(battle.elapsed-o.building.lastHitAt>=0&&battle.elapsed-o.building.lastHitAt<.18)));
  for(const b of battle.buildings)if(b.kind!=='wall'&&b.hp>0&&b.hp<b.maxHp){const at=p(b.x,b.y),box=buildingBox(b,t,occupied);health(at.x,box.y-5,t*.95,b.hp/b.maxHp,true);}
  paintEffects(t);
  // The perimeter stays legible across tall roofs; only the translucent fill
  // is underneath the structures. A selected defence uses a solid boundary.
  for(const b of battle.buildings)if(b.hp>0&&b.damage>0&&(b.id===selectedDefense||showRanges&&b.kind==='cannon')){
   ctx.save();ctx.beginPath();for(let i=0;i<=64;i++){const a=i*Math.PI/32,q=p(b.x+Math.cos(a)*b.range,b.y+Math.sin(a)*b.range);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.closePath();ctx.setLineDash(b.id===selectedDefense?[]:[9,5]);ctx.lineWidth=4;ctx.strokeStyle='#493b2377';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff8d3ee';ctx.stroke();ctx.restore();
  }
  if(marker&&time<marker.until){const at=p(marker.x,marker.y);ctx.strokeStyle=marker.invalid?'#ff775f':marker.magic?'#ebbbff':'#e4ffff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(at.x,at.y,t*.4,t*.2,0,0,Math.PI*2);ctx.stroke();}
 }
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return {
  get artStatus(){return {...artStatus};},
  get renderStats(){return cache.stats;},
  async loadVillage(){const [terrain,actors]=await Promise.allSettled([wide?loadFortressSprites(abort.signal,makeCanvas):loadVillageSprites(abort.signal),loadVolumeTroops(abort.signal).catch(()=>loadBattleRigs(abort.signal,makeCanvas))]);if(disposed)return false;if(terrain.status==='fulfilled'){sprites=terrain.value;artStatus.terrain=true;artStatus.details=terrain.value.detailReady!==false;}if(actors.status==='fulfilled'){troops=actors.value;artStatus.troops=true;artStatus.volumeTroops=Boolean(troops.volume);}if(sprites.volumeReady){defense.setBases(sprites);artStatus.defenses=true;}else{try{await defense.load(abort.signal);artStatus.defenses=true;}catch{artStatus.defenses=false;}}if(disposed)return false;backdropDirty=true;cache.invalidate();paint();return artStatus.terrain;},
  frame(b,dt,animate=true,interpolation=null){battle=b;presentation=interpolation;const delta=animate?clamp(dt,0,.1):0;time+=delta;
   if(following&&animate&&(followClock-=delta)<=0){followClock=.4;const focus=combatFocus(battle);if(focus){const at=p(focus.x,focus.z),limitX=camera.width*.17,limitY=camera.height*.10;if(Math.abs(at.x-camera.width/2)>limitX||Math.abs(at.y-camera.originY)>limitY){camera.x=focus.x;camera.z=focus.z;backdropDirty=true;}}}
   const targets=new Map(b.buildings.map(o=>[o.id,o]));
   visualUnits=b.units.map(u=>{const position=renderPosition(u,presentation),target=targets.get(u.target);return {unit:u,position,pose:motion.sample({...u,action:u.hp>0?u.action:'dead',facing:renderFacing(u,presentation)},position,target?.hp>0?target:null,delta,reduced,b.elapsed-(presentation?(1-presentation.alpha)/30:0))};});paint();},
  get following(){return following;},
  get ranges(){return showRanges;},
  rangesVisible(value){showRanges=Boolean(value);selectedDefense=null;paint();},
  inspect(x,y){const r=canvas.getBoundingClientRect(),sx=x-r.left,sy=y-r.top,t=camera.tile*camera.zoom;
   const hit=battle.buildings.filter(b=>b.hp>0&&b.damage>0).map(b=>{const at=p(b.x,b.y),height=b.kind==='tower'?1.6:b.kind==='arcane'?1.4:.65;return {b,d:Math.hypot((sx-at.x)/(t*.90),(sy-(at.y-t*height))/(t*.80))};}).filter(o=>o.d<=1).sort((a,b)=>a.d-b.d)[0]?.b;
   selectedDefense=hit?.id||null;if(hit)showRanges=false;paint();return hit||null;
  },
  follow(enabled=true){following=Boolean(enabled);followClock=0;if(following){const focus=combatFocus(battle);if(focus){camera.x=focus.x;camera.z=focus.z;camera.zoom=clamp(42/camera.tile,1.4,3.2);backdropDirty=true;paint();}}},
  point(x,y){const r=canvas.getBoundingClientRect();return unprojectBattle(x-r.left,y-r.top,camera);},
  mark(x,y,magic=false,invalid=false){marker={x,y,magic,invalid,until:time+.65};},
  pan(dx,dy){following=false;const t=camera.tile*camera.zoom;camera.x=clamp(camera.x-dx/t-2*dy/t,2,field.width-2);camera.z=clamp(camera.z+dx/t-2*dy/t,2,field.height-2);backdropDirty=true;paint();},
  zoom(factor){following=false;camera.zoom=clamp(camera.zoom*factor,.75,3.2);backdropDirty=true;paint();},
  home(){following=false;camera.x=field.width/2;camera.z=field.height/2;camera.zoom=1;backdropDirty=true;paint();},
  quality(eco){economy=Boolean(eco);resize();},
  reset(b){battle=b;time=0;recordsKey='';visualUnits=[];motion.clear();cache.invalidate();destroyed.clear();selectedDefense=null;showRanges=false;marker=null;this.home();},resize,
  dispose(){disposed=true;abort.abort();observer.disconnect();sprites.clear();troops.clear();motion.clear();defense.dispose();cache.dispose();destroyed.clear();volumeMix.width=volumeMix.height=backdrop.width=backdrop.height=grass.width=grass.height=1;}
 };
}
