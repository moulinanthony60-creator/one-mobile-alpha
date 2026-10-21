import test from 'node:test';
import assert from 'node:assert/strict';
import {createTraining} from '../battle3d-sandbox.mjs';
import {VALDORIA_FIELD,createValdoriaFort} from '../battle-style-layout.mjs';
import {renderPosition,createMotionTracks} from '../battle-motion.mjs';
import {createSceneryCache} from '../battle-scene-cache.mjs';

test('60 Hz presentation advances between 30 Hz combat steps and stays within the simulated segment',()=>{
 const t=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD});t.deploy('guardians',3.5,16.5);
 let last=null;const distances=[];
 for(let i=0;i<70;i++){
  t.tick(1/60);const u=t.battle.units[0],p=renderPosition(u,t.presentation),before=t.presentation.previous.get(u.id);
  if(before){assert.ok(p.x>=Math.min(before.x,u.x)-1e-9&&p.x<=Math.max(before.x,u.x)+1e-9);assert.ok(p.y>=Math.min(before.y,u.y)-1e-9&&p.y<=Math.max(before.y,u.y)+1e-9);}
  if(i>2)distances.push(Math.hypot(p.x-last.x,p.y-last.y));last=p;
 }
 assert.ok(distances.every(d=>d>.015),'no alternating frozen frames or waypoint stops');
 assert.ok(distances.every(d=>d<.03),'no catch-up jumps');
 t.pause(true);const fixed=renderPosition(t.battle.units[0],t.presentation);t.tick(2);assert.deepEqual(renderPosition(t.battle.units[0],t.presentation),fixed);
 t.pause(false);assert.deepEqual(renderPosition(t.battle.units[0],t.presentation),fixed);
 t.reset();assert.equal(t.presentation.previous.size,0);
});

test('turns and attacks are continuous presentation state and do not mutate combat units',()=>{
 const tracks=createMotionTracks(),u={id:1,x:0,y:0,cooldown:0},before=structuredClone(u);
 const first=tracks.sample(u,{x:0,y:0},{x:5,y:0},1/60);
 const second=tracks.sample(u,{x:.02,y:0},{x:5,y:0},1/60);
 assert.ok(second.distance>first.distance);assert.ok(second.motion>0&&second.motion<1);assert.deepEqual(u,before);
 u.cooldown=1;tracks.sample(u,{x:.02,y:0},{x:5,y:0},1/60);
 u.cooldown-=1/60;assert.ok(tracks.sample(u,{x:.02,y:0},{x:5,y:0},1/60).attack>0);
 tracks.clear();assert.equal(tracks.sample(u,{x:20,y:20},null,0).motion,0);
});

test('cached scenery preserves exact painter order around moving units and reuses unchanged runs',()=>{
 const makeCanvas=(width,height)=>{const canvas={width,height,drawn:[]};canvas.getContext=()=>({setTransform(){},record(id){canvas.drawn.push(id);}});return canvas;};
 const cache=createSceneryCache(makeCanvas),objects=Array.from({length:60},(_,id)=>({id:'b'+id,depth:id,bounds:{x:0,y:0,w:20,h:20}}));
 const paint=(o,context)=>context.record(o.id);cache.prepare('full',objects,100,100,1,paint);assert.equal(cache.stats.builds,1);
 cache.prepare('full',objects,100,100,1,paint);assert.equal(cache.stats.builds,1);
 const actors=[{id:'a',depth:3.5},{id:'b',depth:10},{id:'c',depth:44.2}],order=[];
 cache.draw({drawImage:image=>order.push(...image.drawn),record:id=>order.push(id)},actors,paint,a=>order.push(a.id));
 assert.deepEqual(order,[...objects,...actors].sort((a,b)=>a.depth-b.depth).map(o=>o.id));
 assert.ok(cache.stats.blits>0);assert.ok(cache.stats.individual<60);
 cache.prepare('destroyed',objects.filter(o=>o.id!=='b5'),100,100,1,paint);assert.equal(cache.stats.builds,2);
 cache.dispose();assert.equal(cache.stats.groups,0);
});

test('damage rebuilds only the affected scenery run instead of the whole village',()=>{
 let allocated=0;const makeCanvas=(width,height)=>{allocated++;return {width,height,getContext:()=>({setTransform(){}})};};
 const cache=createSceneryCache(makeCanvas),objects=Array.from({length:60},(_,id)=>({depth:id,revision:'whole',bounds:{x:0,y:0,w:20,h:20}}));
 cache.prepare('camera',objects,100,100,1,()=>{});assert.equal(allocated,6);
 objects[22]={...objects[22],revision:'destroyed'};cache.prepare('camera',objects,100,100,1,()=>{});assert.equal(allocated,7);
 cache.prepare('camera',objects,100,100,1,()=>{});assert.equal(allocated,7);cache.dispose();
});
