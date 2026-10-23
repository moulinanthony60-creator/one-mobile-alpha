// Production village renderer at phone and landscape sizes, including the HUD.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const {createCanvas,Image:NativeImage,loadImage}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.Image=class extends NativeImage{set src(value){super.src=value.startsWith?.('file:')?readFileSync(fileURLToPath(new URL(value))):value;}get src(){return super.src;}};
const {loadCompactVillageArt,drawVillageSprite}=await import('../village-sprites.mjs');
const {createVillagePainter,frameVillage,project}=await import('../village-art.mjs');
const {paintHud}=await import('../village-hud.mjs');
const {createState,act,advance}=await import('../engine.mjs');
const {findFreePlot}=await import('../village-state.mjs');
const out=process.env.VALDORIA_PREVIEW_DIR||fileURLToPath(new URL('../docs/',import.meta.url));mkdirSync(out,{recursive:true});
const art=await loadCompactVillageArt(createCanvas),hud=await loadImage(execFileSync('python',['-c',"from PIL import Image;import io,sys;Image.open(io.BytesIO(sys.stdin.buffer.read())).save(sys.stdout.buffer,format='PNG')"],{input:readFileSync(new URL('../assets/v8-hud.png',import.meta.url)),maxBuffer:16000000}));
const now=1800000000000;let state=createState(now);Object.assign(state,{gold:30000,wood:22000,aether:1021,gems:115,workers:3});state.buildings.castle=4;state.village.structures[0].level=4;
for(const [kind,x,z]of [['mine',-7,-3],['tree',3,-2],['cottage',-3,4],['barracks',-7,2],['camp',-5,-7],['forge',4,4],['shrine',2,-7],['cannon',6,0],['vault',-8,-8]]){
 const pos=findFreePlot(state.village,kind,0,{x,z});assert.ok(pos);state=act(state,{type:'place-building',kind,...pos,rotation:0},state.lastTick);advance(state,state.lastTick+9000);
}
const dimensions=[[390,700],[844,390],[1024,640]];
for(const [width,height]of dimensions){
 let groundAllocations=0;const originalMake=art.makeCanvas;art.makeCanvas=(w,h)=>{if(w===2048&&h===1152)groundAllocations++;return createCanvas(w,h);};const painter=createVillagePainter(art),canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),hudCanvas=createCanvas(width,height),tile=Math.max(21,Math.min(width/16.2,52)),camera=frameVillage(state.village.structures,width,height,tile,Object.fromEntries(Object.entries(art.sprites).map(([k,v])=>[k,v.aspect])));
 const paint=()=>{const frame=painter.paint(ctx,width,height,state,camera,{time:1000});paintHud(hudCanvas.getContext('2d'),width,height,state,{atlas:hud,castle:art.sprites.castle,castles:[null,...[1,2,3,4,5].map(l=>art.sprites['castle'+l])]});ctx.drawImage(hudCanvas,0,0);ctx.getImageData(0,0,1,1);return frame;};
 paint();writeFileSync(`${out}/village-v17-${width}.png`,canvas.toBuffer('image/png'));
 const before=JSON.stringify(camera),pos=findFreePlot(state.village,'cottage',0,{x:5,z:8});state=act(state,{type:'place-building',kind:'cottage',...pos,rotation:0},state.lastTick);paint();writeFileSync(`${out}/village-v17-construction-${width}.png`,canvas.toBuffer('image/png'));
 const castle=state.village.structures.find(p=>p.kind==='castle'),point=project(castle.x+1.5,castle.z+1.5,camera,width,height);
 const beforePixels=ctx.getImageData(Math.round(point.x-15),Math.round(point.y-45),30,30).data;
 advance(state,state.lastTick+9000);paint();assert.equal(JSON.stringify(camera),before);
 // Moving an existing cottage rebuilds the paths repeatedly. The terrain's
 // backing surface remains bounded and all building masks remain selectable.
 const cottage=state.village.structures.find(p=>p.kind==='cottage');for(let i=0;i<12;i++){cottage.rotation=i%2;paint();}
 const diag=painter.diagnostics();assert.equal(diag.groundWidth,2048);assert.equal(diag.groundHeight,1152);assert.ok(diag.groundBuilds>=12);assert.equal(groundAllocations,1);art.makeCanvas=originalMake;
 assert.ok(beforePixels.some((v,i)=>i%4!==3&&v>150));
 for(const key of ['castle4','mine','sawmill','barracks','cottage'])assert.ok(art.sprites[key].crop&&art.sprites[key].mask.some(v=>v===255));
 console.log(JSON.stringify({width,height,camera,atlasDecodedBytes:art.atlasDecodedBytes,terrainDecodedBytes:diag.groundWidth*diag.groundHeight*4,groundBuilds:diag.groundBuilds,buildings:state.village.structures.length,constructionComplete:true}));painter.dispose();assert.equal(painter.diagnostics().groundWidth,0);
 // Remove only the preview fixture's last cottage before rendering next size.
 state.village.structures.pop();
}
