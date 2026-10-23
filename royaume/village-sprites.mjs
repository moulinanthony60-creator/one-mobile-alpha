// Buildings are drawn directly from decoded image atlases. They are not kept
// in dozens of discardable Canvas backing stores on memory-constrained phones.
import {VILLAGE_ATLASES,VILLAGE_ATLAS_SIZES,VILLAGE_SPRITES,VILLAGE_MASKS} from './assets/village-v17/manifest.mjs';
import {BUILDER_FILES,createBuilderRigs} from './builder-art.mjs?v=34';
import {meadowTexture} from './battle-style-ground.mjs?v=14';
export function drawVillageSprite(ctx,sprite,x,y,w,h){
 if(sprite.crop)ctx.drawImage(sprite.image,...sprite.crop,x,y,w,h);
 else ctx.drawImage(sprite.image,x,y,w,h);
}
export const villageSpriteSize=s=>s.crop?{width:s.crop[2],height:s.crop[3]}:{width:s.image.width,height:s.image.height};
export function decodeVillageMask(hex){const mask=new Uint8ClampedArray(96*96*4);for(let i=0;i<hex.length;i++){const bits=parseInt(hex[i],16);for(let j=0;j<4;j++)mask[(i*4+j)*4+3]=bits&(1<<j)?255:0;}return mask;}
function imageAt(path){return new Promise((resolve,reject)=>{const image=new Image(),timer=setTimeout(()=>finish(Error('Le chargement des illustrations a pris trop de temps.')),15000);function finish(error){clearTimeout(timer);image.onload=image.onerror=null;if(error){image.src='';reject(error);}else resolve(image);}image.onload=()=>finish();image.onerror=()=>finish(Error('Illustration indisponible : '+path));image.src=new URL(path,import.meta.url).href;});}
export async function loadCompactVillageArt(makeCanvas){
 const pages=await Promise.all(VILLAGE_ATLASES.map(imageAt));
 if(pages.some((im,i)=>im.width!==VILLAGE_ATLAS_SIZES[i][0]||im.height!==VILLAGE_ATLAS_SIZES[i][1]))throw Error('Atlas du village incomplet.');
 const sprites=Object.fromEntries(Object.entries(VILLAGE_SPRITES).map(([key,s])=>[key,{image:pages[s.page],crop:s.crop,aspect:s.aspect,mask:decodeVillageMask(VILLAGE_MASKS[key])}]));
 const workerImages=Object.fromEntries(await Promise.all(Object.entries(BUILDER_FILES).map(async([key,path])=>[key,await imageAt(path)]))),workerRigs=createBuilderRigs(workerImages,makeCanvas);
 // Builders occupy only a few pixels on screen; keep their articulated parts
 // small and explicitly release the full-resolution crop surfaces.
 for(const rig of workerRigs)for(const key of ['heads','bodies','limbs'])rig[key]=rig[key].map(source=>{const k=Math.min(1,128/Math.max(source.width,source.height)),c=makeCanvas(Math.max(1,Math.round(source.width*k)),Math.max(1,Math.round(source.height*k))),ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,c.width,c.height);source.width=source.height=1;return c;});
 return {sprites,workerRigs,grass:meadowTexture(makeCanvas),stone:null,walks:[],peopleParts:null,animalParts:null,enemyParts:null,cartoon:true,makeCanvas,atlasDecodedBytes:pages.reduce((n,im)=>n+im.width*im.height*4,0)};
}
