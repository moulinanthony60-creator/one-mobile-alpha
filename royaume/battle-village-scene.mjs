import {loadVillageSprites,spritePlacement,villageSpriteKey,villageScenery} from './battle-village-assets.mjs?v=4';
import {createWallArt,wallConnections} from './wall-art.mjs?v=34';
import {paintCartoonActor} from './cartoon-art.mjs?v=34';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function projectBattle(x,z,camera){const t=camera.tile*camera.zoom;return {x:camera.width/2+((x-camera.x)-(z-camera.z))*t/2,y:camera.height*.53+((x-camera.x)+(z-camera.z))*t/4};}
export function unprojectBattle(x,y,camera){const t=camera.tile*camera.zoom,a=(x-camera.width/2)*2/t,b=(y-camera.height*.53)*4/t;return {x:camera.x+(a+b)/2,y:camera.z+(b-a)/2};}

// Native Canvas 2D: opening the village never creates a WebGL context.
export function createVillageScene(canvas,initialBattle){
  let ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Le navigateur ne peut pas ouvrir le terrain.');
  const camera={x:10,z:8,tile:22,zoom:1.12,width:1,height:1};
  const abort=new AbortController(),scenery=villageScenery(),wallSprite=createWallArt(makeCanvas),poses=new Map(),destroyed=new Map();
  let sprites=new Map(),battle=initialBattle,time=0,disposed=false,economy=false,marker=null,backdropDirty=true,pixelRatio=1;
  const backdrop=makeCanvas(1,1),outside=scenery.filter(item=>Math.abs(item.x)>10||Math.abs(item.z)>8).sort((a,b)=>a.x+a.z-b.x-b.z),inside=scenery.filter(item=>!outside.includes(item));
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){
    if(disposed)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    camera.width=r.width;camera.height=r.height;camera.tile=Math.min(r.width/19.2,r.height/12.8);
    const ratio=economy?1:Math.min(window.devicePixelRatio||1,1.6);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);pixelRatio=ratio;backdrop.width=canvas.width;backdrop.height=canvas.height;backdropDirty=true;paint();
  }
  const p=(x,z)=>projectBattle(x,z,camera);
  function path(points,color,width){ctx.beginPath();points.forEach(([x,z],i)=>{const q=p(x,z);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap=ctx.lineJoin='round';ctx.stroke();}
  function health(x,y,width,ratio){if(ratio<=0||ratio>=.999)return;ctx.fillStyle='#17372a';ctx.fillRect(x-width/2,y,width,4);ctx.fillStyle=ratio>.4?'#b6e273':'#ed9c61';ctx.fillRect(x-width/2+1,y+1,(width-2)*ratio,2);}
  function sprite(image,x,y,width,height){if(x+width<0||x>camera.width||y+height<0||y>camera.height)return;ctx.drawImage(image,x,y,width,height);}
  function rubble(b,t){
    const at=p(b.x,b.y),w=b.collision.width*t*.55,h=b.collision.depth*t*.24;
    ctx.fillStyle='#786d4c';ctx.beginPath();ctx.ellipse(at.x,at.y,w*.7,h*.65,0,0,Math.PI*2);ctx.fill();
    for(let j=0;j<(b.kind==='wall'?5:12);j++){const n=k=>{const a=Math.sin((Number(b.id.slice(1))+1)*71+j*13+k*29)*43758.5453;return a-Math.floor(a);};const x=at.x+(n(1)-.5)*w,y=at.y+(n(2)-.5)*h,size=t*(.09+n(3)*.09);ctx.fillStyle=j%4?'#c4b58d':'#c4783e';ctx.fillRect(x,y-size*.4,size,size*.65);}
  }
  function building(b,t,occupied){
    if(b.hp<=0){rubble(b,t);return;}
    const at=p(b.x,b.y);let image,w,h,left,top;
    if(b.kind==='wall'){
      const art=wallSprite(2,wallConnections({x:b.x,z:b.y},occupied));image=art.image;const scale=t/art.unit;w=image.width*scale;h=image.height*scale;left=at.x-art.anchor.x*scale;top=at.y-art.anchor.y*scale;
    }else{
      const art=sprites.get(villageSpriteKey(b));
      if(art){const placement=spritePlacement(b,art.aspect),scale=t/Math.SQRT2;image=art.image;w=placement.width*scale;h=placement.height*scale;left=at.x-w/2;top=at.y+(b.collision.width+b.collision.depth)*t/8-h;}
      else{w=b.collision.width*t;h=w*.8;left=at.x-w/2;top=at.y-h;ctx.fillStyle='#e1c58e';ctx.fillRect(left,top,w,h);ctx.fillStyle='#b96b36';ctx.beginPath();ctx.moveTo(left-3,top);ctx.lineTo(at.x,top-h*.4);ctx.lineTo(left+w+3,top);ctx.fill();}
    }
    if(image)sprite(image,left,top,w,h);
    if(b.kind!=='wall')health(at.x,top-6,t*.85,b.hp/b.maxHp);
  }
  function unit(u,t){
    if(u.hp<=0)return;
    const previous=poses.get(u.id)||{x:u.x,y:u.y,distance:0,dx:0,dz:1,movingUntil:0};
    const dx=u.x-previous.x,dz=u.y-previous.y,distance=Math.hypot(dx,dz),enemy=battle.buildings.find(b=>b.id===u.target&&b.hp>0),movingUntil=distance>.001?time+.1:previous.movingUntil;
    const moving=time<movingUntil,pose={kind:{guardians:'guardian',archers:'archer',mages:'scholar'}[u.kind],dx:distance>.001?dx:!moving&&enemy?enemy.x-u.x:previous.dx,dz:distance>.001?dz:!moving&&enemy?enemy.y-u.y:previous.dz,walkDistance:previous.distance+distance,motionBlend:!reduced&&moving?1:0,activityTime:time,attacking:!reduced&&!moving&&u.cooldown>.4,cooldown:u.cooldown,interval:1};
    poses.set(u.id,{x:u.x,y:u.y,distance:pose.walkDistance,dx:pose.dx,dz:pose.dz,movingUntil});
    const at=p(u.x,u.y),size=t*.95;ctx.fillStyle='#1739233d';ctx.beginPath();ctx.ellipse(at.x,at.y,size*.24,size*.10,0,0,Math.PI*2);ctx.fill();
    paintCartoonActor(ctx,pose,at.x,at.y,size);health(at.x,at.y-size*1.2,size*.55,u.hp/u.maxHp);
  }
  function decoration(item,t){const art=sprites.get(item.key);if(!art)return;const at=p(item.x+10,item.z+8),w=item.width*t/Math.SQRT2,h=w*art.aspect;sprite(art.image,at.x-w/2,at.y+item.bottom*t/Math.SQRT2-h,w,h);}
  function paint(){
    if(disposed)return;const t=camera.tile*camera.zoom;
    if(backdropDirty){
      const surface=ctx;ctx=backdrop.getContext('2d');ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
      ctx.fillStyle='#83bb45';ctx.fillRect(0,0,camera.width,camera.height);ctx.imageSmoothingEnabled=true;
    const roads=[[[10,16],[10,12],[10,9.2]],[[3,8],[6.3,8],[8.3,8],[10,9.4],[13.5,8],[17,8]],[[6.7,4.6],[7.8,5.5],[10,5.6],[13.4,5.6]],[[13.6,8],[13.6,11.2],[10,12]],[[6.7,9.2],[6.7,11.8],[10,12]]];
    for(const road of roads){path(road,'#b1a469',t*.65);path(road,'#dfcea1',t*.48);}
    ctx.setLineDash([t*.3,t*.22]);path([[3,3],[17,3],[17,13],[3,13],[3,3]],'#c4f7ec',1.5);ctx.setLineDash([]);
      for(const item of outside)decoration(item,t);
      ctx=surface;backdropDirty=false;
    }
    ctx.drawImage(backdrop,0,0,camera.width,camera.height);
    const occupied=new Set(battle.buildings.filter(b=>b.kind==='wall'&&b.hp>0).map(b=>b.x+','+b.y));
    const objects=[];
    for(const item of inside)objects.push({depth:item.x+10+item.z+8,draw:()=>decoration(item,t)});
    for(const b of battle.buildings)objects.push({depth:b.x+b.y+(b.kind==='wall'?.02:(b.collision.width+b.collision.depth)*.14),draw:()=>building(b,t,occupied)});
    for(const u of battle.units)objects.push({depth:u.x+u.y+.03,draw:()=>unit(u,t)});
    objects.sort((a,b)=>a.depth-b.depth);for(const o of objects)o.draw();
    for(const b of battle.buildings){if(b.hp<=0&&!destroyed.has(b.id))destroyed.set(b.id,time);const death=destroyed.get(b.id),age=time-death;if(death!==undefined&&age<.65){const at=p(b.x,b.y);ctx.globalAlpha=(1-age/.65)*.5;ctx.fillStyle='#e6d2a6';ctx.beginPath();ctx.ellipse(at.x,at.y-t*age,t*(age+.15),t*(age*.6+.12),0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}}
    for(const fx of battle.effects){const at=p(fx.x,fx.y);if(fx.kind==='spell'){ctx.strokeStyle='#edc4ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(at.x,at.y,t*1.7,t*.85,0,0,Math.PI*2);ctx.stroke();}else if(Number.isFinite(fx.fromX)){const from=p(fx.fromX,fx.fromY);ctx.strokeStyle=fx.kind==='enemy'?'#f4a75b':'#f7e6a1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(from.x,from.y-t*.5);ctx.lineTo(at.x,at.y-t*.4);ctx.stroke();}}
    if(marker&&time<marker.until){const at=p(marker.x,marker.y);ctx.strokeStyle=marker.magic?'#f0baff':'#ccffff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(at.x,at.y,t*.4,t*.2,0,0,Math.PI*2);ctx.stroke();}
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  return {
    async loadVillage(){try{const loaded=await loadVillageSprites(abort.signal);if(disposed)return false;sprites=loaded;backdropDirty=true;paint();return true;}catch(error){if(!disposed)console.warn('Illustrations :',error.message);return false;}},
    frame(b,dt,animate=true){battle=b;if(animate)time+=Math.min(dt,.05);paint();},
    point(x,y){const r=canvas.getBoundingClientRect();return unprojectBattle(x-r.left,y-r.top,camera);},
    mark(x,y,magic=false){marker={x,y,magic,until:time+.65};},
    pan(dx,dy){const t=camera.tile*camera.zoom;camera.x=clamp(camera.x-dx/t-2*dy/t,3,17);camera.z=clamp(camera.z+dx/t-2*dy/t,2,14);backdropDirty=true;paint();},
    zoom(factor){camera.zoom=clamp(camera.zoom*factor,.9,3.2);backdropDirty=true;paint();},
    home(){camera.x=10;camera.z=8;camera.zoom=1.12;backdropDirty=true;paint();},
    quality(eco){economy=Boolean(eco);resize();},
    reset(b){battle=b;time=0;poses.clear();destroyed.clear();marker=null;this.home();},
    resize,
    dispose(){disposed=true;abort.abort();observer.disconnect();sprites.clear();poses.clear();destroyed.clear();backdrop.width=backdrop.height=1;}
  };
}
