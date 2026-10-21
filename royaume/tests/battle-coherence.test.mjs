import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSAULT_UNITS} from '../expeditions.mjs';
import {stepTrainingCombat,practiceSpec} from '../battle-training-combat.mjs';
import {weaponMount,angleDelta} from '../battle-aim.mjs';
import {shotPosition} from '../battle-combat-fx.mjs';
import {createMotionTracks} from '../battle-motion.mjs';
import {createTraining,TROOPS} from '../battle3d-sandbox.mjs';
import {createValdoriaFort,VALDORIA_FIELD} from '../battle-style-layout.mjs';
import {bindBattleInput} from '../battle3d-input.mjs';
const dt=1/30;
const unit=(kind,x,y,id=1)=>({id,kind,x,y,hp:ASSAULT_UNITS[kind].hp,maxHp:ASSAULT_UNITS[kind].hp,cooldown:0,path:[],target:null,repath:0});
const building=(kind,x,y,id='b1')=>({id,kind,x,y,hp:10000,maxHp:10000,damage:8,range:6,cooldown:0,collision:{width:1.8,depth:1.8}});
const battle=(buildings,units)=>({field:{width:24,height:24},buildings,units,effects:[],elapsed:0});
const tick=(b,specs=ASSAULT_UNITS)=>{b.elapsed+=dt;stepTrainingCombat(b,specs,dt);};
const still={...ASSAULT_UNITS,guardians:{...ASSAULT_UNITS.guardians,speed:0,damage:0,range:.01}};
const project=(x,y)=>({x:(x-y)*32,y:(x+y)*16});

test('every defence turns toward its target before firing, and the projectile starts at its real muzzle in 12 directions',()=>{
 for(const kind of ['cannon','mortar','tower','arcane'])for(let i=0;i<12;i++){
  const angle=i*Math.PI/6,gun=building(kind,12,12),u=unit('guardians',12+Math.cos(angle)*4,12+Math.sin(angle)*4),b=battle([gun],[u]);gun.facing=angle+Math.PI;
  let shot;
  for(let step=0;step<120&&!shot;step++){tick(b,still);shot=b.effects.find(fx=>fx.sourceId===gun.id);if(!shot&&step===0)assert.equal(u.hp,u.maxHp);}
  assert.ok(shot,kind+' direction '+i);const mount=weaponMount(gun,gun.aim);
  assert.ok(Math.abs(angleDelta(Math.atan2(shot.y-gun.y,shot.x-gun.x),gun.facing))<.045);
  assert.ok(Math.hypot(shot.fromX-mount.muzzle.x,shot.fromY-mount.muzzle.y,shot.fromH-mount.muzzle.h)<1e-8);
  assert.equal(u.hp,u.maxHp,'damage must wait for impact');
  const start=shotPosition(shot,0,project,64),next=shotPosition(shot,.00001,project,64),axis=mount.direction,screen={x:(axis.x-axis.y)*32,y:(axis.x+axis.y)*16-axis.h*64},flight={x:next.x-start.x,y:next.y-start.y};
  const dot=(screen.x*flight.x+screen.y*flight.y)/(Math.hypot(screen.x,screen.y)*Math.hypot(flight.x,flight.y));
  assert.ok(dot>.995,kind+' projectile must leave along barrel axis, '+dot);
  while(b.elapsed<shot.firedAt+shot.flight-dt)tick(b,still);assert.equal(u.hp,u.maxHp);
  while(b.elapsed<shot.firedAt+shot.flight+dt)tick(b,still);assert.ok(u.hp<u.maxHp);
 }
});

test('all troop types stop, face, wind up and release before their target takes damage',()=>{
 for(const kind of ['guardians','archers','mages']){
  const target=building('cottage',12,12);target.damage=0;const u=unit(kind,6,12),b=battle([target],[u]),states=new Set();u.facing=Math.PI;
  let shot,windupPosition;
  for(let step=0;step<400&&!shot;step++){
   tick(b);states.add(u.action);
   if(u.action==='windup'){if(windupPosition)assert.deepEqual([u.x,u.y],windupPosition);windupPosition=[u.x,u.y];}
   shot=b.effects.find(fx=>fx.sourceId===u.id);assert.equal(target.hp,target.maxHp);
  }
  assert.ok(states.has('walk')&&states.has('windup')&&states.has('recover'));assert.ok(shot);
  assert.ok(Math.abs(angleDelta(Math.atan2(target.y-u.y,target.x-u.x),u.facing))<.045);
  const position=[u.x,u.y];for(let i=0;i<5;i++){tick(b);assert.deepEqual([u.x,u.y],position);}
  while(b.elapsed<shot.firedAt+shot.flight+dt)tick(b);assert.ok(target.hp<target.maxHp);
 }
});

test('a moving target is led and a defence keeps a live target instead of changing targets every frame',()=>{
 const gun=building('cannon',12,12),u=unit('guardians',16,12),other=unit('guardians',16.2,12.2,2),b=battle([gun],[u,other]);
 gun.facing=0;gun.target=u.id;
 for(let i=0;i<20;i++){tick(b);assert.equal(gun.target,u.id);}
 assert.ok(Math.hypot(u.vx,u.vy)>0);assert.ok((gun.aim.x-u.x)*u.vx+(gun.aim.y-u.y)*u.vy>0);
 u.hp=0;tick(b,still);assert.equal(gun.target,other.id);
});

test('destroying the target during wind-up cancels that attack and selects another living building',()=>{
 const a=building('cottage',10,10,'b1'),z=building('mine',15,10,'b2');a.damage=z.damage=0;
 const u=unit('archers',6.5,10),b=battle([a,z],[u]);
 for(let i=0;i<100&&u.action!=='windup';i++)tick(b);assert.equal(u.action,'windup');a.hp=0;
 for(let i=0;i<180&&!b.effects.length;i++)tick(b);
 assert.ok(b.effects.length>0);assert.ok(b.effects.every(fx=>fx.targetId==='b2'));
});

test('feet stay at their ground contact while the body advances during a planted step',()=>{
 const tracks=createMotionTracks(),u={id:2,kind:'guardians',facing:0,action:'walk',cooldown:0},contacts=[[],[]];
 for(let i=0;i<100;i++){const pose=tracks.sample(u,{x:i*1.7/60,y:0},{x:10,y:0},1/60,false,i/60);pose.footOffsets.forEach((foot,j)=>contacts[j].push(foot?.world||null));}
 for(const samples of contacts){let matches=0;for(let i=1;i<samples.length;i++)if(samples[i]&&samples[i-1]&&samples[i].x===samples[i-1].x&&samples[i].y===samples[i-1].y)matches++;assert.ok(matches>15);}
});

test('full armies deployed from every edge finish without entering buildings; pause and replay clear pending shots',()=>{
 for(const edge of ['north','south','west','east']){
  const t=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD});let n=0;
  for(const troop of TROOPS)for(let i=0;i<troop.count;i++){const k=n++%9;t.deploy(troop.kind,edge==='west'?2:edge==='east'?38:16+k*.9,edge==='north'?2:edge==='south'?29:12+k*.8);}
  for(let i=0;i<4501&&t.battle.phase==='active';i++){
   t.tick(dt);
   if(i===300){t.pause(true);const snapshot=JSON.stringify(t.battle);t.tick(5);assert.equal(JSON.stringify(t.battle),snapshot);t.pause(false);}
   if(i%20===0)for(const u of t.battle.units.filter(u=>u.hp>0)){
    assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.y));assert.ok(u.x>=0&&u.x<40&&u.y>=0&&u.y<32);
    for(const b of t.battle.buildings.filter(b=>b.hp>0))assert.ok(Math.abs(u.x-b.x)>=b.collision.width/2-.05||Math.abs(u.y-b.y)>=b.collision.depth/2-.05);
   }
  }
  assert.equal(t.score.percent,100,edge);t.reset();assert.equal(t.battle.effects.length,0);assert.equal(t.battle.impacts?.length||0,0);assert.equal(t.battle.units.length,0);
 }
});

test('holding deploys repeatedly, releasing does not add another troop, and dragging or pinching cancels it',()=>{
 const listeners=new Map(),timers=new Map(),deployed=[];let serial=0,allowed=true,selected='guardians';
 const surface={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),setPointerCapture(){}};
 const input=bindBattleInput(surface,{enabled:()=>allowed,tap:()=>deployed.push('tap'),pan(){},zoom(){},holdKey:()=>selected,hold:(_x,_y,key)=>{if(selected!==key)return false;deployed.push(key);return true;},schedule:fn=>{timers.set(++serial,fn);return serial;},cancelTimer:id=>timers.delete(id)});
 const event=(name,id,x,y)=>listeners.get(name)({pointerId:id,button:0,clientX:x,clientY:y});
 const run=()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());};
 event('pointerdown',1,10,10);run();run();event('pointerup',1,10,10);assert.deepEqual(deployed,['guardians','guardians']);assert.equal(timers.size,0);
 event('pointerdown',1,10,10);event('pointermove',1,30,10);run();event('pointerup',1,30,10);assert.equal(deployed.length,2);
 event('pointerdown',1,10,10);event('pointerdown',2,30,10);run();input.clear();assert.equal(deployed.length,2);
 event('pointerdown',1,10,10);selected='archers';run();assert.equal(deployed.length,2);input.clear();
 event('pointerdown',1,10,10);allowed=false;run();assert.equal(deployed.length,2);input.dispose();assert.equal(timers.size,0);
});
