import {loadArtImage} from './battle-village-assets.mjs?v=7';
export const FORTRESS_ATLAS='assets/battle-style/fortress-kit.webp';
export const FORTRESS_KEYS=['castle4','tower','cannon','mortar','mine','vault','reservoir','barracks','arcane','cottage','forge','mill','oak','spruce','rocks','rubble'];
export async function loadFortressSprites(signal,makeCanvas){
 const image=await loadArtImage(new URL(FORTRESS_ATLAS,import.meta.url).href,signal);
 const tiles=new Map();
 for(let i=0;i<FORTRESS_KEYS.length;i++){
  const x0=Math.round(i%4*image.width/4),y0=Math.round(Math.floor(i/4)*image.height/4),cw=Math.round((i%4+1)*image.width/4)-x0,ch=Math.round((Math.floor(i/4)+1)*image.height/4)-y0;
  const cell=makeCanvas(cw,ch),ctx=cell.getContext('2d');ctx.drawImage(image,x0,y0,cw,ch,0,0,cw,ch);
  const data=ctx.getImageData(0,0,cw,ch).data;let l=cw,r=-1,t=ch,b=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[(y*cw+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  if(r<l)throw Error('Illustration du fort manquante : '+FORTRESS_KEYS[i]);
  const tile=makeCanvas(r-l+1,b-t+1);tile.getContext('2d').drawImage(cell,l,t,tile.width,tile.height,0,0,tile.width,tile.height);
  tiles.set(FORTRESS_KEYS[i],{image:tile,aspect:tile.height/tile.width});
 }
 tiles.set('camp',tiles.get('barracks'));tiles.set('castle3',tiles.get('castle4'));
 return tiles;
}
