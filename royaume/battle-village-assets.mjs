import {CARTOON_FILES,CARTOON_CELLS} from './cartoon-art.mjs?v=34';
// Use the village's source artwork, including its connected wall painter.
export const BATTLE_ATLASES=['toonCore','toonEvolution','toonMagic','toonNature','toonCivic','toonDefense','toonMilitary'];
export const VILLAGE_CAMERA=[24,Math.sqrt(384),24]; // 30° elevation, matching project() in village-art.
const SQRT2=Math.SQRT2;
const wanted=new Set(['castle3','castle4','vault','reservoir','mortar','arcane','camp','mine','mill','cottage','tower','cannon','forge','barracks','spruce','oak','garden','rocks','field','fountain','lantern']);
const makeCanvas=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;};

export function loadArtImage(url,signal,ImageClass=Image,timeout=12000){
  return new Promise((resolve,reject)=>{
    const image=new ImageClass();let timer;
    const finish=(error)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);image.onload=image.onerror=null;if(error){image.src='';reject(error);}else resolve(image);};
    const abort=()=>finish(new Error('Chargement du village annulé.'));
    if(signal?.aborted){abort();return;}
    image.onload=()=>finish();image.onerror=()=>finish(new Error('Illustrations du village indisponibles.'));
    signal?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>finish(new Error('Le chargement des illustrations a pris trop de temps.')),timeout);
    image.src=url;
  });
}

export function villageSpriteKey(building){
  if(building.art)return building.art;
  if(building.kind==='castle')return 'castle3';
  return building.kind;
}

// Sprite bottom meets the ground at the front of its footprint. This keeps the
// painted foundation above the ground plane while preserving the village anchor.
export function spritePlacement(building,aspect){
  const {width,depth}=building.collision;
  const span=(width+depth)*.5*(building.kind==='castle'?1.03:1.08);
  const w=span*SQRT2,h=w*aspect,bottom=(width+depth)*SQRT2/8;
  return {width:w,height:h,front:bottom*2};
}

export function villageScenery(){
  let seed=35091;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  const objects=[];
  for(let z=-23;z<=23;z+=2.2)for(let x=-25;x<=25;x+=2.2){
    const px=x+(random()-.5)*1.4,pz=z+(random()-.5)*1.4;
    // Keep the entire deployable field and its entrances clear, including crowns.
    if(Math.abs(px)<12.3&&Math.abs(pz)<10.6)continue;
    if(Math.abs(px)<2.2||Math.abs(pz)<1.7)continue;
    objects.push({key:random()<.72?'spruce':'oak',x:px,z:pz,width:2.4+random()*1.25,bottom:.14});
    if(random()<.2)objects.push({key:'garden',x:px+.8,z:pz+1,width:.65+random()*.35,bottom:.08});
  }
  for(const [key,x,z,width] of [['fountain',1.9,3.6,1.2],['field',5.1,-1.8,1.55],['garden',-2,-1.6,.65],['garden',2,-1.6,.65],['garden',-4.5,2.7,.6],['garden',4.6,3,.6],['lantern',-2.2,5.8,.45],['lantern',2.2,5.8,.45],['rocks',-9,-6.7,.9],['rocks',8.9,6.8,.85]])objects.push({key,x,z,width,bottom:.12});
  return objects;
}

export async function loadVillageSprites(signal){
  const images=await Promise.all(BATTLE_ATLASES.map(atlas=>loadArtImage(new URL(CARTOON_FILES[atlas],import.meta.url).href,signal)));
  if(signal?.aborted)throw new Error('Chargement annulé.');
  const sprites=new Map();
  images.forEach((image,index)=>{
    const probe=makeCanvas(image.width,image.height),ctx=probe.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height).data;
    CARTOON_CELLS[BATTLE_ATLASES[index]].forEach((key,i)=>{
      if(!wanted.has(key))return;
      const x0=Math.round(i%3*image.width/3),x1=Math.round((i%3+1)*image.width/3),y0=Math.round(Math.floor(i/3)*image.height/2),y1=Math.round((Math.floor(i/3)+1)*image.height/2);
      let l=x1,r=x0,t=y1,b=y0;
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*image.width+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
      if(l>r)throw new Error('Illustration vide : '+key);
      l=Math.max(x0,l-2);r=Math.min(x1-1,r+2);t=Math.max(y0,t-2);b=Math.min(y1-1,b+2);
      const tile=makeCanvas(r-l+1,b-t+1);tile.getContext('2d').drawImage(image,l,t,tile.width,tile.height,0,0,tile.width,tile.height);
      sprites.set(key,{image:tile,aspect:tile.height/tile.width});
    });
  });
  return sprites;
}
