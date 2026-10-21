import test from 'node:test';
import assert from 'node:assert/strict';
import {battleTroopPose} from '../battle-troop-rig.mjs';
import {shotStyle,shotTiming,shotPosition,effectAge} from '../battle-combat-fx.mjs';
import {createTraining} from '../battle3d-sandbox.mjs';
import {createValdoriaFort,VALDORIA_FIELD} from '../battle-style-layout.mjs';
import {spaceTrainingUnits} from '../battle-navigation.mjs';
import {createSceneryCache} from '../battle-scene-cache.mjs';

test('articulated walk alternates ground contacts and attacks move arms independently of the legs',()=>{
 for(const kind of ['guardians','archers','mages']){
  const base={dx:1,dz:0,distance:0,motion:1,attackAge:10};
  const poses=Array.from({length:24},(_,i)=>battleTroopPose(kind,{...base,distance:i*.06}));
  for(const q of poses)for(const part of [...q.legs.flatMap(l=>[l.hip,l.knee,l.foot]),...q.arms.flatMap(a=>[a.shoulder,a.elbow,a.hand])])assert.ok(Number.isFinite(part.x)&&Number.isFinite(part.y));
  assert.ok(poses.some(p=>!p.legs[0].contact&&p.legs[1].contact));assert.ok(poses.some(p=>p.legs[0].contact&&!p.legs[1].contact));
  const rest=battleTroopPose(kind,{...base,motion:0,aiming:true}),hit=battleTroopPose(kind,{...base,motion:0,aiming:true,attackAge:.15});
  assert.deepEqual(hit.legs,rest.legs);assert.notDeepEqual(hit.arms,rest.arms);
  const reduced=battleTroopPose(kind,{...base,reduced:true,attackAge:.15,windup:1});assert.equal(reduced.hit,0);assert.equal(reduced.motion,0);
 }
});

test('defences retain their identity, show a real travel interval then an impact, and freeze when paused',()=>{
 const t=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD});t.deploy('guardians',20,29);
 const defender=t.battle.buildings.find(b=>b.kind==='cannon'),u=t.battle.units[0];u.x=defender.x;u.y=defender.y+3;
 for(let i=0;i<100&&!t.battle.effects.some(e=>e.sourceId===defender.id);i++)t.tick(1/30);const fx=t.battle.effects.find(e=>e.sourceId===defender.id);
 assert.ok(fx);assert.equal(fx.style,'cannon');assert.equal(fx.targetId,u.id);assert.ok(fx.duration>fx.flight);assert.ok(fx.flight>.25);
 const project=(x,y)=>({x:x*20,y:y*10});const start=shotPosition(fx,0,project,20),end=shotPosition(fx,fx.flight,project,20);
 assert.deepEqual({x:start.x,y:start.y},start.start);assert.deepEqual({x:end.x,y:end.y},end.end);
 t.pause(true);const before=effectAge(fx,t.battle.elapsed,t.presentation);t.tick(2);assert.equal(effectAge(fx,t.battle.elapsed,t.presentation),before);
 assert.equal(shotStyle({kind:'tower'}),'arrow');assert.equal(shotStyle({kind:'mortar'}),'mortar');assert.equal(shotStyle({kind:'arcane'}),'arcane');
 const mortar={...fx,style:'mortar',arc:2.2,...shotTiming('mortar',4)},mid=shotPosition(mortar,mortar.flight/2,project,20);assert.ok(mid.y<(mid.start.y+mid.end.y)/2-35);
 t.reset();assert.equal(t.battle.effects.length,0);
});

test('splash damage does not draw several simultaneous muzzle flashes from the same shot',()=>{
 const t=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD});t.deploy('guardians',20,29);t.deploy('guardians',20,29);
 const mortar=t.battle.buildings.find(b=>b.kind==='mortar');for(const [i,u]of t.battle.units.entries()){u.x=mortar.x+3;u.y=mortar.y+i*.2;}
 for(let i=0;i<100&&!t.battle.effects.some(e=>e.sourceId===mortar.id);i++)t.tick(1/30);assert.equal(t.battle.effects.filter(e=>e.sourceId===mortar.id).length,1);
 assert.ok(t.battle.impacts.some(e=>e.enemy&&e.splash>0));
});

test('overlapping troops separate gradually without entering a wall',()=>{
 const wall={id:'b1',kind:'wall',x:2,y:2,hp:20,collision:{width:1,depth:3}},units=[{id:1,x:1.3,y:2,hp:10},{id:2,x:1.3,y:2,hp:10}],b={field:{width:10,height:10},buildings:[wall],units};
 for(let i=0;i<60;i++){const before=units.map(u=>({...u}));spaceTrainingUnits(b,1/30);units.forEach((u,j)=>{assert.ok(Math.hypot(u.x-before[j].x,u.y-before[j].y)<.03);assert.ok(u.x<=1.4);});}
 assert.ok(Math.hypot(units[0].x-units[1].x,units[0].y-units[1].y)>.45);
});

test('firing defences animate at their correct depth without rebuilding scenery',()=>{
 let allocations=0;const canvas=(width,height)=>{allocations++;return {width,height,getContext:()=>({setTransform(){}})};};
 const cache=createSceneryCache(canvas),objects=Array.from({length:20},(_,id)=>({id,depth:id,bounds:{x:0,y:0,w:10,h:10}}));
 cache.prepare('same',objects,100,100,1,()=>{});const before=allocations,drawn=[];
 cache.draw({drawImage(){drawn.push('cached');}},[],o=>drawn.push(o.id),()=>{},o=>o.id===3);
 assert.deepEqual(drawn,[0,1,2,3,4,5,6,7,8,9,'cached']);assert.equal(allocations,before);cache.dispose();
});
