// Real Canvas renderer and simulation; this export does not include the HTML HUD.
// Set VALDORIA_CANVAS_MODULE to an installed @napi-rs/canvas module if necessary.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const {createCanvas,Image:NativeImage}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.Image=class extends NativeImage{set src(value){super.src=value.startsWith?.('file:')?readFileSync(fileURLToPath(new URL(value))):value;}get src(){return super.src;}};
globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:false})};
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const {createVillageScene}=await import('../battle-village-scene.mjs');
const {createTraining}=await import('../battle3d-sandbox.mjs');
const {createValdoriaFort,VALDORIA_FIELD}=await import('../battle-style-layout.mjs');
const out=process.env.VALDORIA_PREVIEW_DIR||fileURLToPath(new URL('../docs/',import.meta.url));mkdirSync(out,{recursive:true});
async function render(width,height,name,zoom=1){
 const training=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD}),canvas=createCanvas(width,height);canvas.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,width,height});
 const view=createVillageScene(canvas,training.battle);await view.loadVillage();
 if(!view.artStatus.terrain||!view.artStatus.volumeTroops)throw Error('Production assets did not load');
 view.zoom(zoom);view.frame(training.battle,0,false);writeFileSync(`${out}/${name}-overview.png`,canvas.toBuffer('image/png'));
 let n=0;for(const kind of ['guardians','archers','mages'])while(training.count(kind))training.deploy(kind,15.4+(n++%9)*.9,28.4+(n%2)*.35);
 const video=process.env.VALDORIA_RENDER_VIDEO==='1'&&width===1024;
 if(video)mkdirSync(`${out}/frames`,{recursive:true});
 for(let frame=0;frame<480;frame++){
  training.tick(1/30);view.frame(training.battle,1/30,true,training.presentation);
  if(video&&frame%2===0)writeFileSync(`${out}/frames/${String(frame/2).padStart(4,'0')}.png`,canvas.toBuffer('image/png'));
  if(frame===269)writeFileSync(`${out}/${name}.png`,canvas.toBuffer('image/png'));
 }
 const finishedScore=training.score;
 view.quality(true);view.frame(training.battle,1/30,true,training.presentation);
 view.reset(training.reset());view.frame(training.battle,0,false);view.dispose();
 console.log(JSON.stringify({name,loaded:true,width,height,score:finishedScore}));
}
await render(1024,576,'combat-v13',1);
await render(390,720,'combat-v13-portrait');
