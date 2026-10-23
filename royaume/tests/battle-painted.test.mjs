import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadPaintedTroops,paintPaintedTroop,paintedMip,paintedWeaponSockets,PAINTED_RIG_FILES,EQUIPMENT_FILE} from '../battle-painted-troops.mjs';
import {battleTroopPose} from '../battle-troop-rig.mjs';
import {troopMuzzle,troopScale} from '../battle-aim.mjs';

test('painted weapon attachments match released projectiles for every facing',()=>{
 for(const kind of ['guardians','archers','mages'])for(let i=0;i<16;i++){
  const angle=i*Math.PI/8,u={kind,x:10,y:10,facing:angle},q=battleTroopPose(kind,{dx:Math.cos(angle),dz:Math.sin(angle),distance:0,motion:0,attackAge:0,aiming:true}),socket=paintedWeaponSockets(kind,q).muzzle,m=troopMuzzle(u),scale=troopScale(kind);
  assert.ok(Math.hypot(socket.x*scale-((m.x-u.x)-(m.y-u.y))*.5,socket.y*scale-((m.x-u.x)+(m.y-u.y))*.25+m.h)<1e-8);
 }
});
test('painted troops use smaller filtered pieces at phone scale and release their canvases',async()=>{
 for(const file of [...PAINTED_RIG_FILES,EQUIPMENT_FILE])assert.ok(existsSync(new URL('../'+file,import.meta.url)));
 const original=globalThis.Image,canvases=[],draws=[];
 globalThis.Image=class{width=1536;height=1024;set src(v){if(v)queueMicrotask(()=>this.onload?.());}};
 const makeCanvas=(width,height)=>{const canvas={width,height,getContext:()=>({drawImage(...args){draws.push(args);},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(255)})})};canvases.push(canvas);return canvas;};
 let rigs;try{
  rigs=await loadPaintedTroops(null,makeCanvas);assert.equal(rigs.size,3);assert.equal(rigs.painted,true);assert.ok(rigs.decodedBytes<24*1024**2);
  const head=rigs.get('guardians')[0][0];assert.ok(paintedMip(head,.4,.37,40).width<paintedMip(head,.4,.37,80).width);
  const noop=()=>{},ctx={save:noop,restore:noop,translate:noop,scale:noop,rotate:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,drawImage(...args){draws.push(args);},getTransform:()=>({a:1.6,b:0})};
  draws.length=0;
  for(const kind of ['guardians','archers','mages'])paintPaintedTroop(ctx,rigs.get(kind),rigs.equipment,kind,{dx:1,dz:0,distance:.2,motion:1,attackAge:10},100,100,40);
  assert.ok(draws.length>30);assert.ok(draws.every(([source])=>source.width<160&&source.height<160),'pieces must be prefiltered before large minification');
 }finally{rigs?.dispose();globalThis.Image=original;}
 assert.ok(canvases.every(c=>c.width===1&&c.height===1));
});
