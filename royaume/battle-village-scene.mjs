import {loadVillageSprites,spritePlacement,villageSpriteKey,villageScenery} from './battle-village-assets.mjs?v=6';
import {createWallArt,wallConnections} from './wall-art.mjs?v=34';
import {paintCartoonActor} from './cartoon-art.mjs?v=34';
import {loadTroopSheets,paintTroop} from './battle-style-art.mjs?v=1';
import {meadowTexture,battlefieldScenery,paintGround} from './battle-style-ground.mjs?v=1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function projectBattle(x,z,camera){const t=camera.tile*camera.zoom;return {x:camera.width/2+((x-camera.x)-(z-camera.z))*t/2,y:camera.height*.43+((x-camera.x)+(z-camera.z))*t/4};}
export function unprojectBattle(x,y,camera){const t=camera.tile*camera.zoom,a=(x-camera.width/2)*2/t,b=(y-camera.height*.43)*4/t;return {x:camera.x+(a+b)/2,y:camera.z+(b-a)/2};}

// Independent illustrated objects: no screenshot background and no WebGL dependency.
export function createVillageScene(canvas,initialBattle){
 let ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Le navigateur ne peut pas ouvrir le terrain.');
 const field=initialBattle.field||{width:20,height:16,margin:3},wide=Boolean(initialBattle.field);
 const camera={x:field.width/2,z:field.height/2,tile:22,zoom:1,width:1,height:1};
 const abort=new AbortController(),scenery=wide?battlefieldScenery(field):villageScenery().map(o=>({...o,x:o.x+10,z:o.z+8}));
 const wallSprite=createWallArt(makeCanvas),poses=new Map(),destroyed=new Map(),grass=meadowTexture(makeCanvas);
 let sprites=new Map(),troops=new Map(),battle=initialBattle,time=0,disposed=false,economy=false,marker=null,backdropDirty=true,pixelRatio=1,artStatus={terrain:false,troops:false};
 const backdrop=makeCanvas(1,1),outside=scenery.filter(o=>o.x<0||o.x>field.width||o.z<0||o.z>field.height),inside=scenery.filter(o=>!outside.includes(o));
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){
  if(disposed)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  camera.width=r.width;camera.height=r.height;camera.tile=wide?Math.min(r.width/29.5,r.height/17.8):Math.min(r.width/19.2,r.height/12.8);
  const ratio=economy?1:Math.min(window.devicePixelRatio||1,1.6);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);pixelRatio=ratio;backdrop.width=canvas.width;backdrop.height=canvas.height;backdropDirty=true;paint();
 }
 const p=(x,z)=>projectBattle(x,z,camera);
 function health(x,y,width,ratio){if(ratio<=0||ratio>=.999)return;ctx.fillStyle='#17251eee';ctx.fillRect(x-width/2-1,y-1,width+2,5);ctx.fillStyle='#57382b';ctx.fillRect(x-width/2,y,width,3);ctx.fillStyle=ratio>.4?'#a9df4b':'#eb7953';ctx.fillRect(x-width/2,y,width*ratio,3);}
 function sprite(image,x,y,width,height){if(x+width<0||x>camera.width||y+height<0||y>camera.height)return;ctx.drawImage(image,x,y,width,height);}
 function rubble(b,t){
  const at=p(b.x,b.y),w=b.collision.width*t*.7,h=b.collision.depth*t*.26;
  ctx.fillStyle='#53483285';ctx.beginPath();ctx.ellipse(at.x,at.y,w*.64,h*.8,0,0,Math.PI*2);ctx.fill();
  for(let j=0;j<(b.kind==='wall'?5:17);j++){const n=k=>{const a=Math.sin((Number(b.id.slice(1))+1)*71+j*13+k*29)*43758.5453;return a-Math.floor(a);};const x=at.x+(n(1)-.5)*w,y=at.y+(n(2)-.5)*h,size=t*(.09+n(3)*.18);ctx.beginPath();ctx.moveTo(x,y-size*.7);ctx.lineTo(x+size*.9,y-size*.3);ctx.lineTo(x+size*.8,y+size*.3);ctx.lineTo(x-size*.3,y);ctx.closePath();ctx.fillStyle=j%4?'#c6b692':'#b96838';ctx.fill();ctx.strokeStyle='#65563b88';ctx.lineWidth=.6;ctx.stroke();}
 }
 function building(b,t,occupied){
  if(b.hp<=0){rubble(b,t);return;}
  const at=p(b.x,b.y);let image,w,h,left,top;
  if(b.kind==='wall'){
   const art=wallSprite(2,wallConnections({x:b.x,z:b.y},occupied));image=art.image;const scale=t/art.unit;w=image.width*scale;h=image.height*scale;left=at.x-art.anchor.x*scale;top=at.y-art.anchor.y*scale;
  }else{
   const art=sprites.get(villageSpriteKey(b));
   ctx.fillStyle='#24351632';ctx.beginPath();ctx.ellipse(at.x+t*.12,at.y+t*.08,(b.collision.width+b.collision.depth)*t*.23,(b.collision.width+b.collision.depth)*t*.075,0,0,Math.PI*2);ctx.fill();
   if(art){const placement=spritePlacement(b,art.aspect),scale=t/Math.SQRT2;image=art.image;w=placement.width*scale;h=placement.height*scale;left=at.x-w/2;top=at.y+(b.collision.width+b.collision.depth)*t/8-h;}
   else{w=b.collision.width*t;h=w*.8;left=at.x-w/2;top=at.y-h;ctx.fillStyle='#e1c58e';ctx.fillRect(left,top,w,h);ctx.fillStyle='#b96b36';ctx.beginPath();ctx.moveTo(left-3,top);ctx.lineTo(at.x,top-h*.4);ctx.lineTo(left+w+3,top);ctx.fill();}
  }
  if(image)sprite(image,left,top,w,h);
  if(b.kind!=='wall')health(at.x,top-5,t*.95,b.hp/b.maxHp);
 }
 function unit(u,t){
  if(u.hp<=0)return;
  const previous=poses.get(u.id)||{x:u.x,y:u.y,distance:0,dx:0,dz:1,movingUntil:0};
  const dx=u.x-previous.x,dz=u.y-previous.y,distance=Math.hypot(dx,dz),enemy=battle.buildings.find(b=>b.id===u.target&&b.hp>0),movingUntil=distance>.001?time+.12:previous.movingUntil;
  const moving=time<movingUntil,pose={kind:{guardians:'guardian',archers:'archer',mages:'scholar'}[u.kind],dx:distance>.001?dx:!moving&&enemy?enemy.x-u.x:previous.dx,dz:distance>.001?dz:!moving&&enemy?enemy.y-u.y:previous.dz,distance:previous.distance+distance,moving,attacking:!moving&&u.cooldown>.6,reduced};
  poses.set(u.id,{x:u.x,y:u.y,distance:pose.distance,dx:pose.dx,dz:pose.dz,movingUntil});
  const at=p(u.x,u.y),size=t*(u.kind==='guardians'?1.25:1.16);ctx.fillStyle='#172b2445';ctx.beginPath();ctx.ellipse(at.x,at.y,size*.23,size*.085,0,0,Math.PI*2);ctx.fill();
  const frames=troops.get(u.kind);
  if(frames)paintTroop(ctx,frames,pose,at.x,at.y,size);
  else paintCartoonActor(ctx,{...pose,walkDistance:pose.distance,motionBlend:!reduced&&moving?1:0,activityTime:time,cooldown:u.cooldown,interval:1},at.x,at.y,size*.8);
  health(at.x,at.y-size*1.04,size*.5,u.hp/u.maxHp);
 }
 function decoration(item,t){const art=sprites.get(item.key);if(!art)return;const at=p(item.x,item.z),w=item.width*t/Math.SQRT2,h=w*art.aspect;sprite(art.image,at.x-w/2,at.y+item.bottom*t/Math.SQRT2-h,w,h);}
 function paintEffects(t){
  for(const b of battle.buildings){if(b.hp<=0&&!destroyed.has(b.id))destroyed.set(b.id,time);const death=destroyed.get(b.id),age=time-death;if(!economy&&!reduced&&death!==undefined&&age<.85){const at=p(b.x,b.y);for(let i=0;i<4;i++){ctx.globalAlpha=(1-age/.85)*.25;ctx.fillStyle='#d8c6a0';ctx.beginPath();ctx.ellipse(at.x+Math.cos(i*2)*t*age*.3,at.y-t*age*.6-i*2,t*(age*.3+.12),t*(age*.2+.10),0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}}
  for(const fx of battle.effects){const at=p(fx.x,fx.y);
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
  if(backdropDirty){const surface=ctx;ctx=backdrop.getContext('2d');ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.imageSmoothingEnabled=true;
   if(wide)paintGround(ctx,camera,field,p,grass);else{ctx.fillStyle='#83bb45';ctx.fillRect(0,0,camera.width,camera.height);}
   for(const item of outside)decoration(item,t);ctx=surface;backdropDirty=false;
  }
  ctx.drawImage(backdrop,0,0,camera.width,camera.height);ctx.imageSmoothingEnabled=true;
  const occupied=new Set(battle.buildings.filter(b=>b.kind==='wall'&&b.hp>0).map(b=>b.x+','+b.y));
  const objects=[];
  for(const item of inside)objects.push({depth:item.x+item.z,draw:()=>decoration(item,t)});
  for(const b of battle.buildings)objects.push({depth:b.x+b.y+(b.kind==='wall'?.02:(b.collision.width+b.collision.depth)*.14),draw:()=>building(b,t,occupied)});
  for(const u of battle.units)objects.push({depth:u.x+u.y+.03,draw:()=>unit(u,t)});
  objects.sort((a,b)=>a.depth-b.depth);for(const o of objects)o.draw();paintEffects(t);
  if(marker&&time<marker.until){const at=p(marker.x,marker.y);ctx.strokeStyle=marker.magic?'#ebbbff':'#e4ffff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(at.x,at.y,t*.4,t*.2,0,0,Math.PI*2);ctx.stroke();}
 }
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return {
  get artStatus(){return {...artStatus};},
  async loadVillage(){const [terrain,actors]=await Promise.allSettled([loadVillageSprites(abort.signal),loadTroopSheets(abort.signal,makeCanvas)]);if(disposed)return false;if(terrain.status==='fulfilled'){sprites=terrain.value;artStatus.terrain=true;}if(actors.status==='fulfilled'){troops=actors.value;artStatus.troops=true;}backdropDirty=true;paint();return artStatus.terrain;},
  frame(b,dt,animate=true){battle=b;if(animate&&!reduced)time+=clamp(dt,0,.05);paint();},
  point(x,y){const r=canvas.getBoundingClientRect();return unprojectBattle(x-r.left,y-r.top,camera);},
  mark(x,y,magic=false){marker={x,y,magic,until:time+.65};},
  pan(dx,dy){const t=camera.tile*camera.zoom;camera.x=clamp(camera.x-dx/t-2*dy/t,2,field.width-2);camera.z=clamp(camera.z+dx/t-2*dy/t,2,field.height-2);backdropDirty=true;paint();},
  zoom(factor){camera.zoom=clamp(camera.zoom*factor,.75,3.2);backdropDirty=true;paint();},
  home(){camera.x=field.width/2;camera.z=field.height/2;camera.zoom=1;backdropDirty=true;paint();},
  quality(eco){economy=Boolean(eco);resize();},
  reset(b){battle=b;time=0;poses.clear();destroyed.clear();marker=null;this.home();},resize,
  dispose(){disposed=true;abort.abort();observer.disconnect();sprites.clear();troops.clear();poses.clear();destroyed.clear();backdrop.width=backdrop.height=grass.width=grass.height=1;}
 };
}
