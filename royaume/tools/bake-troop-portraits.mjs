// High-resolution portraits use the exact production model, not an enlarged tile.
import {volumeTroop} from './combat-volume-models.mjs';
import {rasterVolume} from './volume-raster.mjs';
import {writeFileSync} from 'node:fs';
const {createCanvas}=await import(process.env.VALDORIA_CANVAS_MODULE||'@napi-rs/canvas');
for(const [kind,file]of [['guardians','guardian'],['archers','archer'],['mages','mage']]){
 const source=createCanvas(432,522),ctx=source.getContext('2d');
 const {meshes}=volumeTroop(kind,{aiming:true});
 const pixels=rasterVolume(meshes,Math.PI/4,{width:432,height:522,tile:340,anchorX:216,anchorY:470}),data=ctx.createImageData(432,522);data.data.set(pixels);ctx.putImageData(data,0,0);
 const portrait=createCanvas(216,261);portrait.getContext('2d').drawImage(source,0,0,216,261);
 writeFileSync(new URL('../assets/battle-style/'+file+'-portrait-v13.png',import.meta.url),portrait.toBuffer('image/png'));
}
