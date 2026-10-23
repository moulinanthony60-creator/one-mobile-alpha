import test from 'node:test';
import assert from 'node:assert/strict';
import {volumeFrame,VOLUME_TILE,VOLUME_FILES,loadVolumeTroops} from '../battle-volume-atlas.mjs';
import {troopVisualDirection} from '../battle-aim.mjs';
test('full-body animation selects valid walk, wind-up and release poses in all sixteen directions',()=>{
 for(const kind of Object.keys(VOLUME_FILES))for(let i=0;i<360;i++){
  const angle=i*Math.PI/180,p={dx:Math.cos(angle),dz:Math.sin(angle),distance:i*.03,motion:1,attackAge:10},frame=volumeFrame(kind,p);
  assert.equal(frame.direction,troopVisualDirection(angle));assert.ok(frame.row>=1&&frame.row<=12);assert.ok(frame.next>=1&&frame.next<=12);assert.ok(frame.blend>=0&&frame.blend<=1);
  for(const windup of [0,.1,.33,.5,.66,.9,1]){const f=volumeFrame(kind,{...p,motion:0,windup});assert.ok(f.row>=0&&f.row<=15&&f.next<=15);}
  for(const attackAge of [0,.03,.08,.13,.23,.39]){const f=volumeFrame(kind,{...p,motion:0,attackAge});assert.ok(f.row>=16&&f.next<=21);}
  assert.equal(volumeFrame(kind,{...p,reduced:true}).row,0);
 }
});
test('sprite loading accepts complete atlases and rejects a partial image so the rig fallback can run',async()=>{
 const original=globalThis.Image;let valid=true;
 globalThis.Image=class {constructor(){this.width=VOLUME_TILE.width*16;this.height=VOLUME_TILE.height*22;}set src(value){if(value)queueMicrotask(()=>{if(!valid)this.height=1;this.onload?.();});}};
 try{const map=await loadVolumeTroops();assert.equal(map.size,3);assert.equal(map.volume,true);valid=false;await assert.rejects(loadVolumeTroops(),/incomplète/);}finally{globalThis.Image=original;}
});
