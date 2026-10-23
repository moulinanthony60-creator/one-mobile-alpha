import {loadArtImage} from './battle-village-assets.mjs?v=7';
export const DETAIL_ATLAS='assets/battle-style/fortress-detail.webp';
export const DETAIL_KEYS=['castle4','tower','cannon','mortar','barracks','forge'];
export const RUIN_ATLAS='assets/battle-style/fortress-ruins-v12.webp';
const LEGACY_RUINS='assets/battle-style/fortress-ruins.webp';
const RUIN_BOUNDS=[[15,63,393,471],[424,73,758,453],[782,160,1141,459],[1170,156,1519,447],[14,535,393,910],[412,543,763,908],[782,562,1140,911],[1162,557,1522,908]];
export const RUIN_KEYS=['ruin-castle','ruin-tower','ruin-cannon','ruin-mortar','ruin-barracks','ruin-cottage','ruin-mine','ruin-crystal'];
export const FORTRESS_ATLAS='assets/battle-style/fortress-kit.webp';
export const FORTRESS_KEYS=['castle4','tower','cannon','mortar','mine','vault','reservoir','barracks','arcane','cottage','forge','mill','oak','spruce','rocks','rubble'];
export const VOLUME_ATLAS='assets/battle-style/fortress-v13.webp';
export const VOLUME_KEYS=['castle4','tower','mine','vault','reservoir','barracks','arcane','cottage','forge','mill','cannon-base','mortar-base','oak','spruce','rocks','rubble'];
// Production buildings use equal, padded cells; legacy ruin bounds remain explicit.
function crop(image,region,makeCanvas){
 const [x,y,w,h]=region.map(Math.round),cell=makeCanvas(w,h),ctx=cell.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);
 const data=ctx.getImageData(0,0,w,h).data;let l=w,r=-1,t=h,b=-1;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(data[(yy*w+xx)*4+3]>50){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);}
 if(r<l)throw Error('Illustration du fort manquante');
 const tile=makeCanvas(r-l+1,b-t+1);tile.getContext('2d').drawImage(cell,l,t,tile.width,tile.height,0,0,tile.width,tile.height);return {image:tile,aspect:tile.height/tile.width};
}
function grid(image,keys,columns,rows,tiles,makeCanvas){
 keys.forEach((key,i)=>{const x=Math.round(i%columns*image.width/columns),y=Math.round(Math.floor(i/columns)*image.height/rows),w=Math.round((i%columns+1)*image.width/columns)-x,h=Math.round((Math.floor(i/columns)+1)*image.height/rows)-y;tiles.set(key,crop(image,[x,y,w,h],makeCanvas));});
}
async function loadLegacyFortressSprites(signal,makeCanvas){
 const [base,detail,ruins]=await Promise.allSettled([FORTRESS_ATLAS,DETAIL_ATLAS,LEGACY_RUINS].map(file=>loadArtImage(new URL(file,import.meta.url).href,signal)));
 if(signal?.aborted)throw Error('Chargement annulé');if(base.status!=='fulfilled')throw base.reason;
 const tiles=new Map();grid(base.value,FORTRESS_KEYS,4,4,tiles,makeCanvas);tiles.detailReady=false;
 if(detail.status==='fulfilled'){
  const image=detail.value,regions=[[0,0,558,556],[558,0,468,556],[1026,0,510,556],[0,556,503,468],[503,556,515,468],[1018,556,518,468]];
  regions.forEach((r,i)=>tiles.set(DETAIL_KEYS[i],crop(image,r.map((v,index)=>v*(index%2?image.height/1024:image.width/1536)),makeCanvas)));tiles.detailReady=true;
 }
 if(ruins.status==='fulfilled')grid(ruins.value,RUIN_KEYS,4,2,tiles,makeCanvas);
 tiles.set('camp',tiles.get('barracks'));tiles.set('castle3',tiles.get('castle4'));return tiles;
}
export async function loadFortressSprites(signal,makeCanvas){
 const [base,ruins]=await Promise.allSettled([VOLUME_ATLAS,RUIN_ATLAS].map(file=>loadArtImage(new URL(file,import.meta.url).href,signal)));
 if(signal?.aborted)throw Error('Chargement annulé');if(base.status!=='fulfilled')return loadLegacyFortressSprites(signal,makeCanvas);
 const tiles=new Map(),image=base.value;
 grid(image,VOLUME_KEYS,4,4,tiles,makeCanvas);
 if(ruins.status==='fulfilled')RUIN_BOUNDS.forEach(([x,y,r,b],i)=>tiles.set(RUIN_KEYS[i],crop(ruins.value,[(x-2)*ruins.value.width/1536,(y-2)*ruins.value.height/1024,(r-x+4)*ruins.value.width/1536,(b-y+4)*ruins.value.height/1024],makeCanvas)));
 tiles.set('cannon',tiles.get('cannon-base'));tiles.set('mortar',tiles.get('mortar-base'));tiles.set('camp',tiles.get('barracks'));tiles.set('castle3',tiles.get('castle4'));tiles.detailReady=true;tiles.volumeReady=true;return tiles;
}
