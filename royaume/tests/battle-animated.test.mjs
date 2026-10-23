import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ANIMATED_TILE,ANIMATED_FILES,ANIMATED_RELEASE,animatedFrame,animatedPose,loadAnimatedTroops,paintAnimatedTroop} from '../battle-animated-troops.mjs';
import {troopStride,troopVisualDirection} from '../battle-aim.mjs';
import {battleTroopPose} from '../battle-troop-rig.mjs';
import {paintedWeaponSockets} from '../battle-painted-troops.mjs';

test('baked animation follows distance, windup and release for all sixteen directions without invalid cells',()=>{
 for(const kind of Object.keys(ANIMATED_FILES))for(let direction=0;direction<16;direction++){
  const a=direction*Math.PI/8,p={dx:Math.cos(a),dz:Math.sin(a)};
  for(let row=0;row<ANIMATED_TILE.rows;row++){
   const pose=animatedPose(kind,row),frame=animatedFrame(kind,{...pose,...p});
   assert.equal(frame.direction,direction);assert.ok(frame.row>=0&&frame.row<ANIMATED_TILE.rows);
   const q=battleTroopPose(kind,{...pose,...p});
   for(const joint of [...q.legs.flatMap(l=>[l.hip,l.knee,l.foot]),...q.arms.flatMap(l=>[l.shoulder,l.elbow,l.hand])])assert.ok(Number.isFinite(joint.x)&&Number.isFinite(joint.y));
  }
  for(let i=0;i<240;i++){
   const distance=i*.019,frame=animatedFrame(kind,{...p,distance,motion:1,attackAge:10});
   assert.ok(frame.row>=4&&frame.row<16);
   assert.deepEqual(frame,animatedFrame(kind,{...p,distance:distance+troopStride(kind),motion:1,attackAge:10}));
  }
  assert.equal(animatedFrame(kind,{...p,motion:1,distance:.2,windup:1,attackAge:.12,reduced:true}).row,0);
  // Release row zero and the prepared stance keep the same weapon origin.
  const ready=battleTroopPose(kind,{...p,...animatedPose(kind,20)}),release=battleTroopPose(kind,{...p,...animatedPose(kind,21)});
  const aSocket=paintedWeaponSockets(kind,ready).muzzle,bSocket=paintedWeaponSockets(kind,release).muzzle;
  assert.ok(Math.hypot(aSocket.x-bSocket.x,aSocket.y-bSocket.y)<1e-8);
 }
 assert.equal(ANIMATED_RELEASE.at(-1),.44);
});

test('complete troop atlases use one draw per soldier and fit a 36 MiB decoded budget',async()=>{
 for(const file of Object.values(ANIMATED_FILES))assert.ok(existsSync(new URL('../'+file,import.meta.url)));
 const previous=globalThis.Image,t=ANIMATED_TILE;let complete=true;
 globalThis.Image=class{width=t.width*16;get height(){return t.height*(complete?t.rows:1);}set src(v){if(v)queueMicrotask(()=>this.onload?.());}};
 try{
  const sprites=await loadAnimatedTroops();assert.equal(sprites.size,3);assert.ok(sprites.decodedBytes<36*1024**2);
  const calls=[],ctx={drawImage(...args){calls.push(args);}};
  for(const kind of sprites.keys())paintAnimatedTroop(ctx,sprites.get(kind),kind,{dx:1,dz:0,motion:1,distance:.1,attackAge:10},100,200,24);
  assert.equal(calls.length,3);assert.ok(calls.every(a=>a.length===9));sprites.dispose();assert.equal(sprites.size,0);
  complete=false;await assert.rejects(loadAnimatedTroops(),/incomplète/);
 }finally{globalThis.Image=previous;}
});
