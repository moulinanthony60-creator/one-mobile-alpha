import {drawVillageSprite,villageSpriteSize} from './village-sprites.mjs?v=17';
import {paintBuilder} from './builder-art.mjs?v=34';
import {paintGarrison} from './garrison-art.mjs?v=17';
import {armyHousing} from './army-camps.mjs?v=34';
import {campResidents} from './camp-life.mjs?v=34';
import {CARTOON_FILES,createCartoonArtwork,paintCartoonActor} from './cartoon-art.mjs?v=34';
import {FOREST_DECOR,forestTrees} from './forest.mjs?v=34';
import {paintScaffolding} from './construction-art.mjs?v=34';
import {formatDuration} from './building-levels.mjs?v=34';
import {buildJobs} from './builders.mjs?v=34';
import {createWallArt,wallConnections} from './wall-art.mjs?v=34';
import {cutParts,paintPerson,paintAnimal} from './character-rig.mjs?v=34';
import {createEnemyParts,paintEnemyRig} from './enemy-rig.mjs?v=34';
import {createVillageLife,walkFrame} from './village-motion.mjs?v=34';
import {DEFENSES,defenseStats,ENEMIES} from './siege.mjs?v=34';
import {buildStreets} from './village-life.mjs?v=34';
import {footprint,GRID_MIN,GRID_MAX,GRID_SIZE} from './village-state.mjs?v=34';

export const ART_FILES=CARTOON_FILES;
export function project(x,z,camera,width,height){const t=camera.tile*camera.zoom;return {x:width/2+((x-camera.x)-(z-camera.z))*t/2,y:height*camera.horizon+((x-camera.x)+(z-camera.z))*t/4};}
export function unproject(px,py,camera,width,height){const t=camera.tile*camera.zoom,a=(px-width/2)*2/t,b=(py-height*camera.horizon)*4/t;return {x:(a+b)/2+camera.x,z:(b-a)/2+camera.z};}
export function seeded(seed=73){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function viewInsets(width,height){return width>600&&height<=540?{left:100,right:54,top:65,bottom:62}:width<=600?{left:16,right:16,top:105,bottom:112}:{left:100,right:60,top:100,bottom:112};}
export function overviewZoom(tile,width,height,horizon=width>600?.57:.54){const insets=viewInsets(width,height),usableHeight=2*Math.min(height*horizon-insets.top,height-insets.bottom-height*horizon);return Math.max(.035,Math.min(.9,(width-insets.left-insets.right)/(GRID_SIZE*tile)*.92,usableHeight/(GRID_SIZE*tile*.5)*.92));}
export function frameVillage(plots,width,height,tile,aspects={}){
 const first=plots.find(p=>p.kind==='castle');if(first&&plots.length===1)return {x:first.x+1.5,z:first.z+2.5,tile,zoom:Math.min(1.5,Math.max(.9,width/(tile*12))),horizon:width>600?.46:.40};
 const insets=viewInsets(width,height),horizon=(insets.top+(height-insets.top-insets.bottom)/2)/height;
 const founders=plots.filter(p=>p.essential&&p.kind!=='castle'),centers=founders.map(p=>{const f=footprint(p.kind,p.rotation);return {x:p.x+(f.w-1)/2,z:p.z+(f.d-1)/2};});
 const median=(arr)=>arr.sort((a,b)=>a-b)[Math.floor(arr.length/2)]||0,cx=median(centers.map(p=>p.x)),cz=median(centers.map(p=>p.z));
 const local=plots.filter(p=>p.kind!=='wall'&&Math.hypot(p.x-cx,p.z-cz)<24),bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 for(const p of local.length?local:plots){const f=footprint(p.kind,p.rotation),x=p.x+(f.w-1)/2,z=p.z+(f.d-1)/2,sx=(x-z)*tile/2,sy=(x+z)*tile/4,span=(f.w+f.d)/2*(p.kind==='castle'?1.3:p.kind==='shrine'?1.17:1.08)*tile,base=sy+(f.w+f.d)*tile/8,h=span*(aspects[p.kind]||1);bounds.left=Math.min(bounds.left,sx-span/2);bounds.right=Math.max(bounds.right,sx+span/2);bounds.top=Math.min(bounds.top,base-h);bounds.bottom=Math.max(bounds.bottom,base);}
 // Camps include their gathering yards, so the army is not cut off on phones.
 const camps=local.filter(p=>p.kind==='camp'&&!p.pending);
 for(const p of camps){const f=footprint(p.kind,p.rotation);for(const [x,z]of [[p.x-1,p.z+f.d+3.8],[p.x+f.w+2.6,p.z+f.d+2]]){const sx=(x-z)*tile/2,sy=(x+z)*tile/4;bounds.left=Math.min(bounds.left,sx-tile*.45);bounds.right=Math.max(bounds.right,sx+tile*.45);bounds.bottom=Math.max(bounds.bottom,sy+tile*.2);}}
 const widthZoom=(width-insets.left-insets.right)/(bounds.right-bounds.left+24),heightZoom=(height-insets.top-insets.bottom)/(bounds.bottom-bounds.top+24);
 // Short landscape screens show a closer city slice; the domain button remains the full-map view.
 const zoom=clamp(camps.length?(width>600&&height<=540?Math.min(widthZoom,Math.max(.5,heightZoom),.82):Math.min(widthZoom,heightZoom,1.18)):plots.length<=5?Math.min(1.5,widthZoom,heightZoom):width>600&&height<=540?Math.min(widthZoom,Math.max(.5,heightZoom*1.7),.82):Math.min(Math.max(widthZoom,.97),Math.max(heightZoom,.86)),.85,plots.length<=5?1.5:1.35);
 const a=(bounds.left+bounds.right)/2,b=(bounds.top+bounds.bottom)/2,offset=(insets.left-insets.right)/2;
 const camera={x:a/tile+2*b/tile-offset/(tile*zoom),z:2*b/tile-a/tile+offset/(tile*zoom),tile,zoom,horizon};
 const castle=plots.find(p=>p.kind==='castle');if(!camps.length&&plots.length>5&&castle&&Math.hypot(castle.x-cx,castle.z-cz)<18){const q=project(castle.x+1.5,castle.z+1.5,camera,width,height),shift=(q.x-width*.56)/(tile*zoom);camera.x+=shift;camera.z-=shift;}return camera;
}
export function mapPoint(x,z){return {x:48+(x-z)*44/GRID_SIZE,y:32+(x+z-1)*22/GRID_SIZE};}
const WORLD_RADIUS=60,RIVER_X=GRID_MIN-5;

export function createArtwork(images,makeCanvas){
 if(images.toonCore)return createCartoonArtwork(images,makeCanvas);
 const sprites={};
 const entries={evolution:['castle1','castle2','castle3','castle4','castle5','sawmill'],fortress:['mortar','ballista','arcane','rampartX','rampartZ','bastion'],enemies:['raider','brute','wolf'],core:['castle','mine','barracks','forge','cottage','mill'],magic:['shrine','tree','tower','cannon','vault','reservoir'],nature:['spruce','oak','garden','wallZ','wallX','rocks'],military:['camp','archery','stable','campfire','rack','wagon'],civic:['hall','tavern'],districts:['market','academy','fountain','parterre','lantern','field'],people:['worker','guardian','archer','scholar','rider','merchant']};
 for(const [atlas,names] of Object.entries(entries)){
  const image=images[atlas],probe=makeCanvas(image.width,image.height),pc=probe.getContext('2d');pc.drawImage(image,0,0);const rgba=pc.getImageData(0,0,image.width,image.height).data;
  const cols=atlas==='civic'?[0,790,1536]:atlas==='magic'?[0,528,1055,1536]:[0,512,1024,1536],rows=['civic','enemies'].includes(atlas)?[0,1024]:atlas==='magic'?[0,541,1024]:[0,512,1024];
  for(let i=0;i<names.length;i++){
   const col=i%(cols.length-1),row=Math.floor(i/(cols.length-1));let x0=Math.round(cols[col]*image.width/1536),x1=Math.round(cols[col+1]*image.width/1536),y0=Math.round(rows[row]*image.height/1024),y1=Math.round(rows[row+1]*image.height/1024);
   if(atlas==='evolution'){const box=[[0,0,512,450],[512,0,1035,442],[1035,0,1536,500],[0,450,512,1024],[512,442,1055,1024],[1055,500,1536,1024]][i];[x0,y0,x1,y1]=box.map((n,j)=>Math.round(n*(j%2?image.height/1024:image.width/1536)));}
   if(atlas==='districts'){const box=[[0,0,552,522],[552,0,1055,570],[1055,0,1536,560],[0,522,590,1024],[590,570,1008,1024],[1008,560,1536,1024]][i];[x0,y0,x1,y1]=box.map((n,j)=>Math.round(n*(j%2?image.height/1024:image.width/1536)));}
   let left=x1,top=y1,right=x0,bottom=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(rgba[(y*image.width+x)*4+3]>36){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(left>right)throw new Error('Illustration vide : '+names[i]);
   left=Math.max(x0,left-2);top=Math.max(y0,top-2);right=Math.min(x1-1,right+2);bottom=Math.min(y1-1,bottom+2);
   const sprite=makeCanvas(right-left+1,bottom-top+1),sc=sprite.getContext('2d');sc.drawImage(image,left,top,sprite.width,sprite.height,0,0,sprite.width,sprite.height);
   const mask=makeCanvas(96,96),mc=mask.getContext('2d');mc.drawImage(sprite,0,0,96,96);
   sprites[names[i]]={image:sprite,aspect:sprite.height/sprite.width,mask:mc.getImageData(0,0,96,96).data};
  }
 }
 const grass=makeCanvas(160,160);grass.getContext('2d').drawImage(images.grass,images.grass.width/2,images.grass.height/2,images.grass.width/2,images.grass.height/2,0,0,160,160);
 const walks=[];
 if(images.walk){
  const image=images.walk,rows=[0,313,615,930,1254].map(y=>Math.round(y*image.height/1254));
  // The final atlas has slightly uneven gutters. Crop those explicit row bounds.
  for(let row=0;row<4;row++){const frames=[];for(let col=0;col<4;col++){
   const x0=Math.round(col*image.width/4),x1=Math.round((col+1)*image.width/4),cw=x1-x0,ch=rows[row+1]-rows[row],c=makeCanvas(cw,ch),cx=c.getContext('2d');cx.drawImage(image,x0,rows[row],cw,ch,0,0,cw,ch);const pixels=cx.getImageData(0,0,cw,ch).data;
   let top=ch,bottom=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(pixels[(y*cw+x)*4+3]>80){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   let headX=0,weight=0;for(let y=top;y<top+(bottom-top)*.17;y++)for(let x=0;x<cw;x++){const a=pixels[(y*cw+x)*4+3];if(a>80){headX+=x;weight++;}}
   frames.push({image:c,aspect:ch/cw,anchorX:(weight?headX/weight:cw/2)/cw,anchorY:(bottom+1)/ch,bodyHeight:(bottom-top+1)/ch});
  }walks.push(frames);}

 }
 const peopleParts=images.peopleParts?cutParts(images.peopleParts,makeCanvas,[0,270,530,780,1030,1290,1536],[0,260,510,755,1024]):null;
 if(peopleParts){
  // The legacy thigh cell depicts a pair of trousers. Isolate one leg before rigging it.
  for(const row of peopleParts){const pair=row[4],leg=makeCanvas(Math.round(pair.width*.49),Math.round(pair.height*.84));leg.getContext('2d').drawImage(pair,pair.width*.10,pair.height*.16,pair.width*.49,pair.height*.84,0,0,leg.width,leg.height);row[4]=leg;}
  if(images.facingParts)peopleParts.facing=cutParts(images.facingParts,makeCanvas,[0,307,614,922,1229,1536],[0,240,495,735,1024]);
 }
 return {sprites,grass,stone:images.grass,walks,peopleParts,animalParts:images.animalParts?cutParts(images.animalParts,makeCanvas,[0,290,630,795,960,1160,1340,1536],[0,510,1024]):null,enemyParts:images.enemyParts?createEnemyParts(images.enemyParts,makeCanvas):null,makeCanvas};
}

export function hitArtwork(objects,x,y){
 for(let i=objects.length-1;i>=0;i--){const o=objects[i];if((!o.plot&&!o.tree?.clearable&&!o.person?.garrison)||o.ghost||x<o.left||x>o.left+o.width||y<o.top||y>o.top+o.height)continue;
  let u=clamp(Math.floor((x-o.left)/o.width*96),0,95),v=clamp(Math.floor((y-o.top)/o.height*96),0,95);if(o.flip)u=95-u;
  if(o.sprite.mask[(v*96+u)*4+3]>45){if(o.memberCenters)return [...o.memberCenters].sort((a,b)=>Math.abs(x-a.x)-Math.abs(x-b.x))[0].id;return o.plot?.id||o.person?.campId||o.tree.id;}
 }
 return null;
}

export function createVillagePainter(art){
 const life=createVillageLife(),wallArt=createWallArt(art.makeCanvas,art.stone);let wallSet=new Set(),knownLevels=null,campGround=null,campToken='',campPeople=[],campOccupancy=new Map();const upgradeFlashes=new Map();
 const {sprites,makeCanvas}=art;let ground=null,groundBuilds=0,groundKey='',scenery=[],lastObjects=[],streets={routes:[],tiles:[],doors:[]};
 function nearPlot(x,z,plots,pad){return plots.some(p=>{const f=footprint(p.kind,p.rotation);return x>p.x-pad&&x<p.x+f.w+pad&&z>p.z-pad&&z<p.z+f.d+pad;});}
 function updateGround(state){
  const key=JSON.stringify([state.village.structures.map(p=>[p.id,p.x,p.z,p.rotation]),state.village.forest?.removed]);if(key===groundKey)return;groundKey=key;
  const plots=state.village.structures,castle=plots.find(p=>p.kind==='castle')||{x:0,z:0},cf=footprint('castle'),cx=castle.x+(cf.w-1)/2,cz=castle.z+(cf.d-1)/2;
  streets=buildStreets(plots,forestTrees(state.village));
  const nearRoad=(x,z,pad=1)=>streets.tiles.some(q=>Math.abs(q.x-x)<pad&&Math.abs(q.z-z)<pad);
  scenery=[...forestTrees(state.village),...FOREST_DECOR.filter(o=>(o.x>RIVER_X+3||o.x<RIVER_X-4)&&o.x<WORLD_RADIUS&&!nearPlot(o.x,o.z,plots,o.kind==='garden'?.6:2.6)&&!nearRoad(o.x,o.z,1.3))];
  // Small gardens occupy free ground and disappear automatically when a player builds there.
  for(const p of plots.filter(p=>p.kind!=='wall')){const f=footprint(p.kind,p.rotation);for(const side of [-1,1]){const x=p.x+(f.w-1)/2+side*(f.w*.5+.65),z=p.z+f.d*.7;if(!nearPlot(x,z,plots,.2)&&!nearRoad(x,z,.8))scenery.push({x,z,kind:'garden',span:.9,variant:.4});}}
  for(const p of plots.filter(p=>['camp','archery','stable','barracks','forge'].includes(p.kind))){const f=footprint(p.kind,p.rotation);for(const [kind,dx,dz,span]of [['campfire',f.w+.8,f.d*.5,1.2],['rack',f.w*.4,f.d+.8,.75],['wagon',-.9,-.6,1.1]]){const x=p.x+dx,z=p.z+dz;if(!nearPlot(x,z,plots,.35)&&!nearRoad(x,z,.6))scenery.push({x,z,kind,span,variant:.2});}}
  // Each district gets appropriate small props on genuinely free ground.
  for(const [i,p]of plots.filter(p=>p.kind!=='wall').entries()){const f=footprint(p.kind,p.rotation),props=[['lantern',-.9,f.d-.2,.85]];if(['cottage','mill'].includes(p.kind))props.push(['field',f.w+1.3,1,2.1]);if(['castle','hall','tavern','fountain','market'].includes(p.kind))props.push(['parterre',f.w+1.2,f.d*.6,1.05]);for(const [kind,dx,dz,span]of props){const x=p.x+dx,z=p.z+dz;if(!nearPlot(x,z,plots,kind==='lantern'?.25:.9)&&!nearRoad(x,z,kind==='lantern'?.65:1.3))scenery.push({x,z,kind,span,variant:i%2});}}
  const size=4096,gh=2304,unit=32;if(!ground){ground=makeCanvas(size/2,gh/2);ground.addEventListener?.('contextrestored',()=>{groundKey='';});}const ctx=ground.getContext('2d');ctx.setTransform(.5,0,0,.5,0,0);ctx.clearRect(0,0,size,gh);groundBuilds++;
  const wp=(x,z)=>({x:size/2+(x-z)*unit/2,y:gh/2+(x+z)*unit/4});
  ctx.fillStyle='#78a844';ctx.fillRect(0,0,size,gh);
  ctx.globalAlpha=1;ctx.fillStyle=ctx.createPattern(art.grass,'repeat');ctx.fillRect(0,0,size,gh);ctx.globalAlpha=1;
  const noise=seeded(342);
  for(let i=0;i<240;i++){const x=(noise()-.5)*150,z=(noise()-.5)*150,q=wp(x,z),r=(1.2+noise()*4)*unit,g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,noise()>.5?'#b4da6530':'#4c91331a');g.addColorStop(1,'#445d3300');ctx.save();ctx.translate(q.x,q.y);ctx.scale(1,.55);ctx.fillStyle=g;ctx.translate(-q.x,-q.y);ctx.fillRect(q.x-r,q.y-r,r*2,r*2);ctx.restore();}
  // River and worn banks stay outside the 81 x 81 building area.
  const river=[];for(let z=-65;z<=65;z+=1)river.push(wp(RIVER_X+Math.sin(z*.12)*1.4,z));
  function line(points,color,width){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  line(river,'#477c3455',123);line(river,'#decd88',100);line(river,'#208cbb',77);line(river,'#38c4df',61);line(river,'#8de9ed55',35);
  ctx.strokeStyle='#bae0cf50';ctx.lineWidth=1.5;for(let i=0;i<240;i++){const z=(noise()-.5)*105,x=RIVER_X+Math.sin(z*.12)*1.4+(noise()-.5)*1.8,p=wp(x,z);ctx.beginPath();ctx.ellipse(p.x,p.y,3+noise()*11,1,0,0,Math.PI);ctx.stroke();}
  // The street network follows free grid cells; paths never cut through a building.
  for(const route of streets.routes){const points=route.points.map(q=>wp(q.x,q.z));for(const [color,w]of [['#5b8a332b',27],['#c5a963',21],['#ebd59b',17],['#f4e1ae55',11]])line(points,color,w);}
  for(const q of streets.tiles){for(let i=0;i<3;i++){const a=wp(q.x+(noise()-.5)*.7,q.z+(noise()-.5)*.7);ctx.fillStyle=['#fff0c152','#af91442a','#ebd59b33'][i%3];ctx.beginPath();ctx.ellipse(a.x,a.y,1.5+noise(),.7+noise()*.4,0,0,Math.PI*2);ctx.fill();}}
  // Small pools add relief to unbuilt clearings. They disappear if the terrain is developed.
  for(const [px,pz]of [[-21,13],[19,-19]])if(!nearPlot(px,pz,plots,6)&&!nearRoad(px,pz,6)){const c=wp(px,pz);ctx.save();ctx.translate(c.x,c.y);ctx.scale(1,.53);for(const [rx,ry,color]of [[113,76,'#354d2d66'],[104,69,'#b6a677'],[96,61,'#305f55'],[89,55,'#3e9591'],[65,38,'#60b5a733']]){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,rx,ry,-.2,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='#cbefce50';ctx.lineWidth=2;for(let k=0;k<15;k++){const x=(noise()-.5)*140,y=(noise()-.5)*65;ctx.beginPath();ctx.ellipse(x,y,5+noise()*13,2,0,0,Math.PI);ctx.stroke();}ctx.restore();for(let i=0;i<12;i++){const angle=i*Math.PI/6;scenery.push({x:px+Math.cos(angle)*5,z:pz+Math.sin(angle)*3,kind:i%3?'garden':'rocks',span:1.3,variant:noise()});}}
  // Worn terraces tie every building to the meadow; military sites receive sandy yards.
  for(const p of plots.filter(p=>p.kind!=='wall')){const f=footprint(p.kind,p.rotation),military=['camp','archery','stable','barracks','academy'].includes(p.kind);ctx.save();const corners=[[p.x-.8,p.z-.8],[p.x+f.w+.5,p.z-.8],[p.x+f.w+.5,p.z+f.d+.8],[p.x-.8,p.z+f.d+.8]].map(([x,z])=>wp(x,z));ctx.beginPath();corners.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.clip();const c=wp(p.x+(f.w-1)/2,p.z+(f.d-1)/2),r=(f.w+f.d)*unit*.55,g=ctx.createRadialGradient(c.x,c.y,12,c.x,c.y,r);g.addColorStop(0,military?'#dfca8a66':'#d4d3a444');g.addColorStop(1,'#a0a47900');ctx.fillStyle=g;ctx.fillRect(c.x-r,c.y-r,r*2,r*2);for(let z=p.z-.6;z<p.z+f.d+.5;z+=.65)for(let x=p.x-.6;x<p.x+f.w+.5;x+=.65){if(noise()<.28)continue;const a=wp(x,z);ctx.fillStyle=military?['#c9b78555','#71674433'][Math.floor(noise()*2)]:['#ebd7a455','#9b9c6330','#ced5a333'][Math.floor(noise()*3)];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+4,a.y+2);ctx.lineTo(a.x,a.y+4);ctx.lineTo(a.x-4,a.y+2);ctx.fill();}ctx.restore();}
  // Broad pale flagstones read clearly at the same scale as the cartoon buildings.
  const pc=wp(cx+.6,cz+1.1);ctx.save();ctx.translate(pc.x,pc.y);ctx.scale(1,.5);
  const paving=ctx.createRadialGradient(0,0,18,0,0,118);paving.addColorStop(0,'#ead8aabb');paving.addColorStop(.70,'#dfcb9499');paving.addColorStop(1,'#c8bd8000');ctx.fillStyle=paving;ctx.fillRect(-120,-120,240,240);
  for(let y=-72;y<80;y+=20)for(let x=-83;x<90;x+=25){if(Math.hypot(x,y)>83||noise()<.35)continue;ctx.fillStyle=['#fff1c34d','#cbb57936','#efdca333'][Math.floor(noise()*3)];ctx.beginPath();ctx.roundRect(x+(Math.floor(y/20)%2)*8,y,17+noise()*3,12,3);ctx.fill();}ctx.restore();
  // Fine grasses, clover, stone chips and flower flecks, kept subdued at camera scale.
  for(let i=0;i<4500;i++){const x=noise()*size,y=noise()*gh;ctx.fillStyle=['#cce98122','#477e2618','#c5de7922','#dbe78a22'][i%4];ctx.fillRect(x,y,.6+noise()*1.8,.4+noise());}
  // Fade the cached surface into the repeating meadow at distant zoom levels.
  ctx.globalCompositeOperation='destination-in';for(const horizontal of [true,false]){const g=ctx.createLinearGradient(0,0,horizontal?size:0,horizontal?0:gh);g.addColorStop(0,'#0000');g.addColorStop(.08,'#000');g.addColorStop(.92,'#000');g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(0,0,size,gh);}ctx.globalCompositeOperation='source-over';
  for(let z=-65;z<65;z+=2.2)for(const bank of [RIVER_X+2.4,RIVER_X-3.3])scenery.push({x:bank+Math.sin(z*.12)*1.1,z,kind:'rocks',span:1.2+noise()*1.4,variant:noise()});
 }
 function spriteFor(p){if(p.kind==='wall')return wallArt(p.level||1,wallConnections(p,wallSet),p.rotation||0);if(p.kind==='castle')return sprites['castle'+Math.max(1,Math.min(5,p.level||1))];if(p.kind==='tree')return sprites.sawmill;return sprites[p.kind==='wall'?(p.rotation%2?'rampartZ':'rampartX'):p.kind];}
 function rectFor(p,camera,width,height){const f=footprint(p.kind,p.rotation),x=p.x+(f.w-1)/2,z=p.z+(f.d-1)/2,at=project(x,z,camera,width,height),sprite=spriteFor(p),t=camera.tile*camera.zoom;
  if(p.kind==='wall'){const scale=t/sprite.unit;return {plot:p,sprite,x,z,left:at.x-sprite.anchor.x*scale,top:at.y-sprite.anchor.y*scale,width:sprite.image.width*scale,height:sprite.image.height*scale,flip:false,depth:x+z+.02};}
  let span=(f.w+f.d)/2*(p.kind==='castle'?.85+.09*(Math.min(5,p.level||1)-1):p.kind==='shrine'?1.17:1.08);if(p.kind==='wall')span=1.04;
  const w=span*t,h=w*sprite.aspect*(p.kind==='wall'?1.18:1),bottom=at.y+(f.w+f.d)*t/8;
  return {plot:p,sprite,x,z,left:at.x-w/2,top:bottom-h,width:w,height:h,flip:!!(p.rotation%2),depth:x+z+(f.w+f.d)*.14};
 }
 function diamond(ctx,p,camera,width,height,color,fill){const f=footprint(p.kind,p.rotation);ctx.beginPath();for(const [i,x,z] of [[0,p.x-.5,p.z-.5],[1,p.x+f.w-.5,p.z-.5],[2,p.x+f.w-.5,p.z+f.d-.5],[3,p.x-.5,p.z+f.d-.5]]){const q=project(x,z,camera,width,height);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();}
 function paint(ctx,width,height,state,camera,{selected=null,selectedWalls=null,placement=null,grid=false,time=0}={}){
  if(knownLevels&&time>0)for(const p of state.village.structures)if(knownLevels.has(p.id)&&p.level>knownLevels.get(p.id))upgradeFlashes.set(p.id,time);knownLevels=new Map(state.village.structures.map(p=>[p.id,p.level]));
  updateGround(state);const brokenWalls=new Set(state.siege?.structures.filter(p=>p.kind==='wall'&&p.hp<=0).map(p=>p.id)||[]);const movingIds=new Set(placement?.group?placement.ids:[placement?.id]);const walls=state.village.structures.filter(p=>p.kind==='wall'&&!movingIds.has(p.id)&&!brokenWalls.has(p.id));if(placement?.kind==='wall')walls.push(...((placement.batch||placement.group)?placement.cells:[placement]).map(p=>({...p,kind:'wall'})));wallSet=new Set(walls.map(p=>p.x+','+p.z));const t=camera.tile*camera.zoom,origin=project(0,0,camera,width,height),scale=t/16;
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#78a844';ctx.fillRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.save();const left=origin.x-ground.width*scale/2,top=origin.y-ground.height*scale/2;ctx.translate(left,top);ctx.scale(scale/2,scale/2);ctx.globalAlpha=1;ctx.fillStyle=ctx.createPattern(art.grass,'repeat');ctx.fillRect(-left*2/scale,-top*2/scale,width*2/scale,height*2/scale);ctx.restore();ctx.drawImage(ground,origin.x-ground.width*scale/2,origin.y-ground.height*scale/2,ground.width*scale,ground.height*scale);
  if(camera.zoom<.38){ctx.beginPath();for(const [i,x,z] of [[0,GRID_MIN-.5,GRID_MIN-.5],[1,GRID_MAX-.5,GRID_MIN-.5],[2,GRID_MAX-.5,GRID_MAX-.5],[3,GRID_MIN-.5,GRID_MAX-.5]]){const p=project(x,z,camera,width,height);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.strokeStyle='#d3cd9b80';ctx.lineWidth=1.4;ctx.setLineDash([6,5]);ctx.stroke();ctx.setLineDash([]);}
  if(grid||placement){ctx.lineWidth=.7;ctx.strokeStyle='#e5d7a238';for(let n=GRID_MIN-.5;n<=GRID_MAX-.5;n++){for(const a of [[[n,GRID_MIN-.5],[n,GRID_MAX-.5]],[[GRID_MIN-.5,n],[GRID_MAX-.5,n]]]){const p=project(...a[0],camera,width,height),q=project(...a[1],camera,width,height);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}}
  if(selectedWalls&&!placement){for(const p of state.village.structures)if(selectedWalls.has(p.id))diamond(ctx,p,camera,width,height,'#ffe68d','#ffdf6566');}
  if(selected&&!placement){const p=state.village.structures.find(p=>p.id===selected);if(p)diamond(ctx,p,camera,width,height,'#e8cf8d','#e9d99b22');}
  if(selected&&!placement){const p=state.village.structures.find(p=>p.id===selected),d=p&&defenseStats(p);if(d){const f=footprint(p.kind,p.rotation),at=project(p.x+(f.w-1)/2,p.z+(f.d-1)/2,camera,width,height);ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle='#fff0aaa6';ctx.fillStyle='#e3c56a0b';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(at.x,at.y,d.range*t/Math.SQRT2,d.range*t/Math.sqrt(8),0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}}
  const all=[];
  for(const p of scenery){const at=project(p.x,p.z,camera,width,height),sprite=sprites[p.kind],w=p.span*t,h=w*sprite.aspect;all.push({sprite,left:at.x-w/2,top:at.y-h*.91,width:w,height:h,flip:p.variant>.5,depth:p.x+p.z-.6,scenery:true,tree:p.id?p:null});}
  const token=[state.troops,JSON.stringify(state.army),...state.village.structures.filter(p=>p.kind==='camp').map(p=>p.id+':'+p.level+':'+!!p.pending)].join('|');
  if(campGround!==groundKey||campToken!==token){campGround=groundKey;campToken=token;campPeople=campResidents(state,streets,time);campOccupancy=new Map(armyHousing(state).camps.map(c=>[c.id,c]));}
  for(const [i,p]of campPeople.entries())p.activityTime=time/1000+(p.idleSeed||0);
  const residents=[...life.sample(state,streets,time),...campPeople];
  if(camera.zoom>.27){for(const person of residents){
   const at=project(person.x,person.z,camera,width,height);walkFrame(person);
   const mounted=person.kind==='rider',garrison=person.garrison&&art.cartoon,size=t*(garrison?(mounted?1.05:person.kind==='guardian'?.84:.79):(mounted?.98:person.kind==='guardian'?.76:.70));
   const back=person.dx+person.dz<-.2,sprite=garrison?sprites['garrison-'+person.kind+(back?'-back':'')]:sprites[person.kind],h=garrison?size*(mounted?1.32:1.16):size*(mounted?1.2:1.02),w=garrison?h/sprite.aspect:size*(mounted?1.3:.7),flip=garrison?(back?person.dx-person.dz>0:person.dx-person.dz<0):false;
   all.push({sprite,personRig:true,mounted,rigSize:size,left:at.x-w/2,top:at.y-h,width:w,height:h,flip,depth:person.x+person.z+.18,person,feet:at,shadowWidth:mounted?t*.72:t*.28});
  }}
  const damage=new Map(state.siege?.structures.map(p=>[p.id,p])||[]);
  for(const p of state.village.structures){if(movingIds.has(p.id))continue;const o=rectFor({...p,level:p.essential?(state.buildings[p.id]||p.level):p.level},camera,width,height),d=damage.get(p.id);if(d){o.health=d.hp/d.maxHp;o.broken=d.hp<=0;}all.push(o);}
  if(state.siege){for(const e of state.siege.enemies){if(e.hp<=0||e.spawn>state.siege.elapsed)continue;const at=project(e.x,e.z,camera,width,height),sprite=sprites[e.kind],rig=e.kind!=='wolf'&&(art.cartoon||!!art.enemyParts),animalRig=e.kind==='wolf'&&(art.cartoon||!!art.animalParts),size=t*(e.kind==='brute'?1.03:e.kind==='wolf'?.81:.76),w=rig?size*.95:size*1.3,h=rig?size*1.06:size*.9,bob=e.moving?Math.sin((e.walkDistance||0)*Math.PI*4)*t*.016:0;all.push({sprite,enemy:e,rig,animalRig,rigSize:size,feet:at,left:at.x-w/2,top:at.y-h+(rig?0:bob),width:w,height:h,flip:e.heading<0,depth:e.x+e.z+.2,health:e.hp/e.maxHp});}}

  if(placement){for(const cell of (placement.batch||placement.group)?placement.cells:[placement]){const ghost={...cell,kind:placement.kind};diamond(ctx,ghost,camera,width,height,placement.error?'#ff8d7d':'#c8efb3',placement.error?'#ed765b55':'#aeea8b3a');all.push({...rectFor(ghost,camera,width,height),ghost:true});}}
  all.sort((a,b)=>a.depth-b.depth);lastObjects=[];
  for(const o of all){if(o.left>width+30||o.left+o.width<-30||o.top>height+30||o.top+o.height<-30)continue;
   if(o.tree?.id===selected){const q=project(o.tree.x,o.tree.z,camera,width,height);ctx.strokeStyle='#ffe89c';ctx.fillStyle='#ffde6c30';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,q.y,t*.95,t*.48,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
   if(o.person){ctx.fillStyle='#1a281d38';ctx.beginPath();ctx.ellipse(o.feet.x,o.feet.y,o.shadowWidth*.34,Math.max(1,o.shadowWidth*.12),0,0,Math.PI*2);ctx.fill();}
   if(o.enemy){ctx.fillStyle='#17251948';ctx.beginPath();ctx.ellipse(o.feet.x,o.feet.y,o.width*.31,o.width*.105,0,0,Math.PI*2);ctx.fill();}
   if(art.cartoon&&o.person&&paintBuilder(ctx,art.workerRigs,o.person,o.feet.x,o.feet.y,o.rigSize)){lastObjects.push(o);}else if(art.cartoon&&o.person?.garrison&&paintGarrison(ctx,sprites,o.person,o.feet.x,o.feet.y,o.rigSize)){lastObjects.push(o);}else if(art.cartoon&&(o.personRig||o.animalRig||o.rig)){paintCartoonActor(ctx,o.person||o.enemy,o.feet.x,o.feet.y,o.rigSize);lastObjects.push(o);}else if(o.personRig){if(o.mounted)paintAnimal(ctx,art.animalParts,art.peopleParts,o.person,o.feet.x,o.feet.y,o.rigSize);else paintPerson(ctx,art.peopleParts,o.person,o.feet.x,o.feet.y,o.rigSize);lastObjects.push(o);}else if(o.animalRig){paintAnimal(ctx,art.animalParts,art.peopleParts,o.enemy,o.feet.x,o.feet.y,o.rigSize);lastObjects.push(o);}else if(o.rig){paintEnemyRig(ctx,art.enemyParts,o.enemy,o.feet.x,o.feet.y,o.rigSize);lastObjects.push(o);}else{ctx.save();if(o.ghost)ctx.globalAlpha=.65;if(o.broken){ctx.globalAlpha=.28;ctx.filter='grayscale(1)';}ctx.translate(o.left+(o.flip?o.width:0),o.top);if(o.flip)ctx.scale(-1,1);if(o.enemy){const e=o.enemy,strike=e.attacking?Math.max(0,1-(e.interval-e.cooldown)/.22):0,swing=e.moving?Math.sin((e.walkDistance||0)*Math.PI*2)*.025:0;ctx.translate(o.width/2,o.height);ctx.rotate(swing+strike*.08);ctx.translate(-o.width/2,-o.height);}drawVillageSprite(ctx,o.sprite,0,0,o.width,o.height);ctx.restore();lastObjects.push(o);}
   if(o.plot&&!o.ghost&&buildJobs(state).some(q=>q.id===o.plot.id))paintScaffolding(ctx,o,footprint(o.plot.kind,o.plot.rotation),(x,z)=>project(x,z,camera,width,height),t);
   if(o.enemy||o.health!==undefined&&o.health<1&&!o.broken){const w=Math.max(16,o.width*.55),x=o.left+(o.width-w)/2,y=o.top-5;ctx.fillStyle='#122119';ctx.fillRect(x-1,y-1,w+2,5);ctx.fillStyle=o.enemy?'#f56c4c':'#9ddc61';ctx.fillRect(x,y,w*o.health,3);if(o.enemy?.id===state.siege?.target){ctx.strokeStyle='#ffdf76';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(o.left+o.width/2,o.top+o.height+1,o.width*.7,o.width*.28,0,0,Math.PI*2);ctx.stroke();}}
   if(o.plot&&selectedWalls?.has(o.plot.id)&&!placement){const x=o.left+o.width/2,y=o.top-5;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle='#ffe795';ctx.fill();ctx.strokeStyle='#55421a';ctx.lineWidth=1;ctx.stroke();}
   if(o.plot&&o.plot.level>1&&!o.ghost&&!o.plot.pending&&!['wall','camp'].includes(o.plot.kind)&&camera.zoom>.55){ctx.fillStyle='#287fb0';ctx.strokeStyle='#f7dc8b';ctx.lineWidth=1;const c=campOccupancy.get(o.plot.id),label=c?c.used+' / '+c.capacity:String(o.plot.level),w=c?48:22,x=o.left+o.width*.5,y=o.top+o.height-6;ctx.beginPath();ctx.roundRect(x-w/2,y-7,w,14,4);ctx.fill();ctx.stroke();ctx.fillStyle='#f7e5ae';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(label,x,y+4);}
   if(o.plot&&['shrine','forge','reservoir','hall','fountain','arcane'].includes(o.plot.kind)&&!o.ghost){const cyan=['shrine','reservoir','hall','fountain','arcane'].includes(o.plot.kind),x=o.left+o.width*.5,y=o.top+o.height*(cyan?.44:.65),radius=o.width*.20,pulse=.6+Math.sin(time*.002+o.depth)*.12;const glow=ctx.createRadialGradient(x,y,0,x,y,radius);glow.addColorStop(0,cyan?`rgba(98,225,255,${pulse*.20})`:`rgba(255,192,86,${pulse*.12})`);glow.addColorStop(1,'rgba(100,180,190,0)');ctx.fillStyle=glow;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);}
  }
  // Camp occupancy is drawn after the troops, so nobody covers the counter.
  if(camera.zoom>.55&&!placement)for(const o of lastObjects){const c=campOccupancy.get(o.plot?.id);if(!c||o.ghost||buildJobs(state).some(q=>q.id===c.id))continue;const x=o.left+o.width*.5,y=o.top-10;ctx.save();ctx.fillStyle='#295d83';ctx.strokeStyle='#f5db91';ctx.lineWidth=1.3;ctx.beginPath();ctx.roundRect(x-26,y-8,52,17,5);ctx.fill();ctx.stroke();ctx.fillStyle='#fff4cc';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.used+' / '+c.capacity,x,y-1);ctx.fillStyle='#163b58';ctx.fillRect(x-20,y+5,40,2);ctx.fillStyle=c.used>=c.capacity?'#ffcf61':'#a9d967';ctx.fillRect(x-20,y+5,40*Math.min(1,c.used/c.capacity),2);ctx.restore();}
  // Construction remains attached to its plot: a timber gantry and a quiet timer.
  const jobs=buildJobs(state),now=state.lastTick,wallJobs=jobs.filter(q=>state.village.structures.some(p=>p.id===q.id&&p.kind==='wall'));let wallLabelDrawn=false;
  for(const q of jobs){const o=lastObjects.find(o=>(o.plot?.id===q.id||o.tree?.id===q.id)&&!o.ghost);if(!o)continue;
   ctx.save();
   if(camera.zoom>.45){const progress=Math.max(0,Math.min(1,(now-q.starts)/(q.ends-q.starts))),wall=o.plot?.kind==='wall';
    if(wall){const bw=Math.max(16,Math.min(31,o.width*.55)),bx=o.left+o.width*.5-bw/2,by=o.top-6;ctx.fillStyle='#1a2c29';ctx.fillRect(bx-1,by-1,bw+2,5);ctx.fillStyle='#b6d95e';ctx.fillRect(bx,by,bw*progress,3);}
    if(!wall||selected===q.id||!wallLabelDrawn&&!jobs.some(q=>q.id===selected)){
     const group=wall&&wallJobs.length>1&&selected!==q.id,bw=group?112:76,bx=o.left+o.width*.5-bw/2,by=o.top-28,label=(q.mode==='clearing'?'Coupe · ':group?wallJobs.length+' murs · ':'')+formatDuration(((group?Math.min(...wallJobs.map(q=>q.ends)):q.ends)-now)/1000);if(wall)wallLabelDrawn=true;
     ctx.fillStyle='#20372fee';ctx.strokeStyle=selected===q.id?'#d2bd87':'#b7b38a99';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,20,6);ctx.fill();ctx.stroke();ctx.fillStyle='#70806a';ctx.fillRect(bx+6,by+16,bw-12,2);ctx.fillStyle='#c2cb92';ctx.fillRect(bx+6,by+16,(bw-12)*progress,2);ctx.fillStyle='#f4eddb';ctx.font='600 10px Arial';ctx.textAlign='center';ctx.fillText(label,bx+bw/2,by+11);
    }
   }
   ctx.restore();
  }
  // Brief local reward feedback replaces extra completion notifications.
  for(const [id,at] of upgradeFlashes){const u=(time-at)/1000;if(u>1||u<0){upgradeFlashes.delete(id);continue;}const o=lastObjects.find(o=>o.plot?.id===id&&!o.ghost);if(!o)continue;const x=o.left+o.width*.5,y=o.top+o.height*.8,r=t*(.3+u*.9);ctx.save();ctx.globalAlpha=(1-u)*.8;ctx.strokeStyle='#ffe39b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,r,r*.45,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillStyle=i%2?'#fff4cd':'#edc468';ctx.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r*.4-u*t,2,3);}ctx.restore();}
  // Subtle smoke and embers make the training district feel inhabited.
  for(const o of lastObjects.filter(o=>o.sprite===sprites.campfire||o.plot&&['forge','camp'].includes(o.plot.kind))){const x=o.left+o.width*.49,y=o.top+o.height*.55;for(let i=0;i<4;i++){const age=(time*.00012+i*.25)%1;ctx.fillStyle=`rgba(217,211,191,${(1-age)*.12})`;ctx.beginPath();ctx.ellipse(x+Math.sin(age*5+o.depth)*t*.06,y-age*t*.9,t*(.04+age*.10),t*(.07+age*.14),-.25,0,Math.PI*2);ctx.fill();}}
  // Warm fireflies near the magical tree, tiny floating motes near the shrine.
  for(const o of lastObjects.filter(o=>o.plot&&['shrine'].includes(o.plot.kind)&&!o.ghost)){for(let i=0;i<5;i++){const age=(time*.00018+i*.21)%1,x=o.left+o.width*(.25+i*.12)+Math.sin(time*.001+i)*2,y=o.top+o.height*(.7-age*.55);ctx.globalAlpha=Math.sin(age*Math.PI)*.7;ctx.fillStyle=o.plot.kind==='tree'?'#fff2b6':'#b8f2ff';ctx.beginPath();ctx.arc(x,y,Math.max(.7,t*.025),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
  // Fountain ripples, lantern glows and a warm moving canopy shadow.
  for(const o of lastObjects){if(o.plot?.kind==='fountain'){ctx.save();ctx.strokeStyle='#d3ffff9c';ctx.lineWidth=.8;for(let i=0;i<3;i++){const u=(time*.00045+i/3)%1;ctx.globalAlpha=(1-u)*.5;ctx.beginPath();ctx.ellipse(o.left+o.width*.5,o.top+o.height*.57,o.width*(.05+u*.22),o.width*(.02+u*.08),0,0,Math.PI*2);ctx.stroke();}ctx.restore();}if(o.sprite===sprites.lantern){const x=o.left+o.width*.2,y=o.top+o.height*.22,r=o.width*.2,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffe9a74d');g.addColorStop(1,'#ffd17400');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}}
  for(const effect of state.siege?.effects||[]){const age=state.siege.elapsed-effect.at;if(age<0)continue;const u=Math.min(1,age/effect.duration),end=project(effect.x,effect.z,camera,width,height);ctx.save();
   if(['arrow','bolt','shell','mortar','ether'].includes(effect.kind)){const start=project(effect.fromX,effect.fromZ,camera,width,height);start.y-=t*.65;const x=start.x+(end.x-start.x)*u,y=start.y+(end.y-start.y)*u-(effect.kind==='mortar'?Math.sin(u*Math.PI)*t*2:0);ctx.strokeStyle=effect.kind==='ether'?'#affaff':'#ffdc83';ctx.lineWidth=effect.kind==='ether'?2.2:1.8;ctx.beginPath();ctx.moveTo(x-(end.x-start.x)*.08,y-(end.y-start.y)*.08);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=effect.kind==='ether'?'#d3ffff':'#ffe3a0';ctx.beginPath();ctx.arc(x,y,effect.kind==='mortar'?3:1.8,0,Math.PI*2);ctx.fill();}
   else if(effect.kind==='hit'){ctx.globalAlpha=1-u;ctx.fillStyle='#ffe3a0';ctx.font=`900 ${Math.max(9,t*.23)}px Arial`;ctx.textAlign='center';ctx.strokeStyle='#291913';ctx.lineWidth=2;ctx.strokeText('−'+effect.value,end.x,end.y-t*(.9+u*.7));ctx.fillText('−'+effect.value,end.x,end.y-t*(.9+u*.7));}
   else{const radius=(effect.radius||.7)*t*.6*(.4+u);ctx.globalAlpha=(1-u)*.8;ctx.strokeStyle=effect.kind==='spell'?'#9ceeff':'#ffe498';ctx.lineWidth=3;ctx.fillStyle=effect.kind==='spell'?'#67aef633':'#ffd15f55';ctx.beginPath();ctx.ellipse(end.x,end.y,radius,radius*.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<8;i++){const angle=i*Math.PI/4;ctx.fillStyle=i%2?'#ffe3a6':'#fff7d9';ctx.fillRect(end.x+Math.cos(angle)*radius,end.y+Math.sin(angle)*radius*.5-u*t*.4,2,3);}if(effect.kind==='spell'){ctx.strokeStyle='#c9efff';ctx.lineWidth=(1-u)*4;ctx.beginPath();ctx.moveTo(end.x+t*.3,end.y-t*4);ctx.lineTo(end.x-t*.2,end.y-t*1.7);ctx.lineTo(end.x+t*.2,end.y-t*2);ctx.lineTo(end.x,end.y);ctx.stroke();}}
   ctx.restore();
  }
  const sunlight=ctx.createLinearGradient(0,0,width,height);sunlight.addColorStop(0,'#fff5b30b');sunlight.addColorStop(.5,'#fff5b300');sunlight.addColorStop(1,'#143c260c');ctx.fillStyle=sunlight;ctx.fillRect(0,0,width,height);
  // Ambient birds cross above the canopy, with reduced-motion frozen by the caller.
  if(time){const phase=(time*.000018)%1;ctx.strokeStyle='#24342690';ctx.lineWidth=1;for(let i=0;i<3;i++){const x=width*(phase*1.4-.2)-i*13,y=height*.16+Math.sin(phase*8)*12+i*8;ctx.beginPath();ctx.moveTo(x-4,y+Math.sin(time*.006)*2);ctx.quadraticCurveTo(x-1,y-2,x,y);ctx.quadraticCurveTo(x+2,y-3,x+5,y+Math.sin(time*.006)*2);ctx.stroke();}}
  const insets=viewInsets(width,height);
  const markers=state.village.structures.filter(p=>p.essential&&!p.pending&&['mine','tree','shrine'].includes(p.kind)).map(p=>{const o=rectFor(p,camera,width,height);return {id:p.id,x:o.left+o.width/2,y:o.top-3,visible:!placement&&!selectedWalls&&state.siege?.phase!=='active'&&o.left+o.width>0&&o.left<width&&o.top>insets.top&&o.top<height-insets.bottom};});
  const services=state.village.structures.filter(p=>['hall','tavern'].includes(p.kind)||(state.training&&p.id===state.training.campId)).map(p=>{const o=rectFor(p,camera,width,height);return {id:p.id,kind:p.kind,x:o.left+o.width/2,y:o.top-7,visible:!placement&&!selectedWalls&&state.siege?.phase!=='active'&&camera.zoom>.3&&o.left+o.width>0&&o.left<width&&o.top>70&&o.top<height-90};});
  return {markers,services,objects:lastObjects,streets,residents};
 }
 return {paint,diagnostics:()=>({groundBuilds,groundWidth:ground?.width||0,groundHeight:ground?.height||0}),dispose(){if(ground)ground.width=ground.height=1;ground=null;groundKey='';},pickPlacement:(x,y)=>lastObjects.some(o=>o.ghost&&x>=o.left&&x<=o.left+o.width&&y>=o.top&&y<=o.top+o.height),pickWall:(x,y)=>{const walls=lastObjects.filter(o=>o.plot?.kind==='wall'&&!o.ghost),exact=hitArtwork(walls,x,y);if(exact)return exact;const close=walls.filter(o=>x>=o.left-6&&x<=o.left+o.width+6&&y>=o.top-6&&y<=o.top+o.height+6).sort((a,b)=>Math.hypot(x-a.left-a.width/2,y-a.top-a.height/2)-Math.hypot(x-b.left-b.width/2,y-b.top-b.height/2));return close[0]?.plot.id||null;},pickEnemy:(x,y)=>{for(let i=lastObjects.length-1;i>=0;i--){const o=lastObjects[i];if(o.enemy&&x>=o.left-6&&x<=o.left+o.width+6&&y>=o.top-6&&y<=o.top+o.height+6)return o.enemy.id;}return null;},pick:(x,y)=>hitArtwork(lastObjects,x,y),thumbnail(kind,level=1){const sprite=spriteFor({kind,rotation:0,level}),c=makeCanvas(192,192),ctx=c.getContext('2d'),dims=villageSpriteSize(sprite),scale=Math.min(176/dims.width,176/dims.height);drawVillageSprite(ctx,sprite,(192-dims.width*scale)/2,(192-dims.height*scale)/2,dims.width*scale,dims.height*scale);const url=c.toDataURL('image/png');c.width=c.height=1;return url;}};
}
