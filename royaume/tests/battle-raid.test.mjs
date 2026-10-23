import test from 'node:test';
import assert from 'node:assert/strict';
import {createTraining,RAID_ARMY} from '../battle3d-sandbox.mjs';
import {VALDORIA_FIELD,createValdoriaFort} from '../battle-style-layout.mjs';
import {combatFocus} from '../battle-camera.mjs';

test('the forty-soldier raid completes with valid positions and resets to its own army',()=>{
 const t=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD,army:RAID_ARMY});
 assert.equal(RAID_ARMY.reduce((sum,u)=>sum+t.count(u.kind),0),40);
 let n=0;for(const troop of RAID_ARMY)while(t.count(troop.kind))t.deploy(troop.kind,15.4+(n++%12)*.8,28.4+(n%2)*.45);
 assert.equal(t.battle.units.length,40);
 for(let i=0;i<4501&&t.battle.phase==='active';i++){
  t.tick(1/30);
  if(i%30===0){
   const focus=combatFocus(t.battle);if(focus)assert.ok(Number.isFinite(focus.x)&&Number.isFinite(focus.z));
   for(const u of t.battle.units.filter(u=>u.hp>0))for(const b of t.battle.buildings.filter(b=>b.hp>0))assert.ok(Math.abs(u.x-b.x)>=b.collision.width/2-.05||Math.abs(u.y-b.y)>=b.collision.depth/2-.05);
  }
 }
 assert.equal(t.battle.phase,'finished');assert.equal(t.score.percent,100);
 t.reset();assert.equal(t.count('guardians'),20);assert.equal(t.count('archers'),14);assert.equal(t.count('mages'),6);assert.equal(t.battle.units.length,0);
 assert.equal(createTraining().count('guardians'),8);
});

test('combat focus ignores dead soldiers and isolated stragglers and looks toward the engaged target',()=>{
 const battle={units:[{x:10,y:20,hp:1,target:'b1'},{x:11,y:20,hp:1,target:'b1'},{x:10,y:21,hp:1,target:'b1'},{x:38,y:2,hp:1},{x:1,y:1,hp:0}],buildings:[{id:'b1',x:10,y:17,hp:1}]};
 const point=combatFocus(battle);assert.ok(point.x>=10&&point.x<12);assert.ok(point.z<20&&point.z>18);
 battle.units.forEach(u=>u.hp=0);assert.equal(combatFocus(battle),null);
});
