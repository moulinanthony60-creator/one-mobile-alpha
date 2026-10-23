import test from 'node:test';
import assert from 'node:assert/strict';
import {battleTroopPose,bendJoint} from '../battle-troop-rig.mjs';
import {troopMuzzle,troopScale} from '../battle-aim.mjs';
import {troopFeedback} from '../battle-village-scene.mjs';
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
  const rest=battleTroopPose(kind,{...base,motion:0,aiming:true}),hit=battleTroopPose(kind,{...base,motion:0,aiming:true,attackAge:kind==='archers'?.055:.15});
  assert.deepEqual(hit.legs.map(l=>l.foot),rest.legs.map(l=>l.foot));assert.notDeepEqual(hit.arms,rest.arms);
  const reduced=battleTroopPose(kind,{...base,reduced:true,attackAge:.15,windup:1});assert.equal(reduced.hit,0);assert.equal(reduced.motion,0);
 }
});

test('knees preserve limb lengths in world space, with a bow draw and a planted striking stance',()=>{
 const hip={s:.13,f:0,h:.37},foot={s:.13,f:.1,h:0},knee=bendJoint(hip,foot,.235,{s:0,f:1,h:0});
 const distance=(a,b)=>Math.hypot(a.s-b.s,a.f-b.f,a.h-b.h);
 assert.ok(Math.abs(distance(hip,knee)-.235)<1e-9);assert.ok(Math.abs(distance(knee,foot)-.235)<1e-9);assert.ok(knee.f>foot.f);
 const p={dx:1,dz:0,distance:0,motion:0,attackAge:10,aiming:true};
 const nock=battleTroopPose('archers',{...p,windup:0}),draw=battleTroopPose('archers',{...p,windup:1}),release=battleTroopPose('archers',{...p,attackAge:.15});
 assert.deepEqual(nock.arms[0].hand,draw.arms[0].hand);assert.ok(draw.arms[1].hand.x<nock.arms[1].hand.x-.1);assert.ok(release.arms[1].hand.x>draw.arms[1].hand.x+.1);
 const ready=battleTroopPose('guardians',{...p,windup:1}),strike=battleTroopPose('guardians',{...p,attackAge:.12});
 assert.deepEqual(ready.legs.map(l=>l.foot),strike.legs.map(l=>l.foot));assert.notEqual(ready.tilt,strike.tilt);
});

test('rendered sword tip, bow and staff match the projectile origin at release in every direction',()=>{
 for(const kind of ['guardians','archers','mages'])for(let i=0;i<16;i++){
  const facing=i*Math.PI/8,u={kind,x:10,y:10,facing},q=battleTroopPose(kind,{dx:Math.cos(facing),dz:Math.sin(facing),distance:0,motion:0,attackAge:0,aiming:true}),size=troopScale(kind);
  const hand=q.arms[kind==='archers'?0:1].hand,offset=kind==='guardians'?q.point(0,.08,.39):kind==='mages'?q.point(0,0,.40):{x:0,y:0};
  const muzzle=troopMuzzle(u),x=((muzzle.x-u.x)-(muzzle.y-u.y))*.5,y=((muzzle.x-u.x)+(muzzle.y-u.y))*.25-muzzle.h;
  assert.ok(Math.hypot(x-(hand.x+offset.x)*size,y-(hand.y+offset.y)*size)<1e-8,kind+' direction '+i);
 }
});

test('hits give brief feedback and defeated troops fall then disappear; reduced motion suppresses the flash',()=>{
 const u={hp:20,lastHitAt:3};assert.ok(troopFeedback(u,3.05).hit>0);assert.equal(troopFeedback(u,3.3).hit,0);assert.equal(troopFeedback(u,3.05,true).hit,0);
 u.hp=0;u.diedAt=4;assert.equal(troopFeedback(u,4).visible,true);assert.ok(troopFeedback(u,4.2).fall>0);assert.ok(troopFeedback(u,4.2).opacity<1);assert.equal(troopFeedback(u,4.6).visible,false);
 assert.equal(troopFeedback(u,4.2,true).fall,0);
 const training=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD});training.deploy('guardians',20,29);
 const gun=training.battle.buildings.find(b=>b.kind==='cannon'),soldier=training.battle.units[0];soldier.x=gun.x;soldier.y=gun.y+2;soldier.hp=1;
 for(let i=0;i<120&&soldier.hp>0;i++)training.tick(1/30);
 assert.equal(soldier.hp,0);assert.ok(Number.isFinite(soldier.diedAt));assert.equal(troopFeedback(soldier,soldier.diedAt+.1).visible,true);
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
