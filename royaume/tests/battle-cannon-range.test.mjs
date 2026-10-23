import test from 'node:test';
import assert from 'node:assert/strict';
import {stepTrainingCombat,inDefenseRange} from '../battle-training-combat.mjs';
import {ASSAULT_UNITS} from '../expeditions.mjs';
const specs={...ASSAULT_UNITS,guardians:{...ASSAULT_UNITS.guardians,speed:0,damage:1,range:.01}};
function setup(distance=4){
 const gun={id:'b0',kind:'cannon',x:6,y:6,hp:1000,maxHp:1000,range:4.5,damage:8,cooldown:0,facing:0,collision:{width:1.8,depth:1.8}};
 const wall={id:'b1',kind:'wall',x:8,y:6,hp:65,maxHp:65,collision:{width:.7,depth:4}};
 const u={id:1,kind:'guardians',x:6+distance,y:6,hp:145,maxHp:145,cooldown:0,path:[],target:null,repath:0};
 return {field:{width:20,height:20},buildings:[gun,wall],units:[u],effects:[],elapsed:0};
}
function tick(b,n=1){for(let i=0;i<n;i++){b.elapsed+=1/30;stepTrainingCombat(b,specs,1/30);}}
test('a cannon fires at an in-range soldier behind an intact wall and damage lands after travel',()=>{
 const b=setup();let shot;for(let i=0;i<100&&!shot;i++){tick(b);shot=b.effects.find(f=>f.style==='cannon');}
 assert.ok(shot);assert.equal(b.units[0].hp,145);assert.equal(b.buildings[1].hp,65);
 tick(b,30);assert.ok(b.units[0].hp<145);assert.equal(b.buildings[1].hp,65);
});
test('the actual circular firing zone includes its edge and excludes targets outside it in every direction',()=>{
 const b=setup(),gun=b.buildings[0];
 for(let i=0;i<32;i++){const a=i*Math.PI/16;assert.equal(inDefenseRange(gun,{hp:1,x:6+Math.cos(a)*4.49,y:6+Math.sin(a)*4.49}),true);assert.equal(inDefenseRange(gun,{hp:1,x:6+Math.cos(a)*4.51,y:6+Math.sin(a)*4.51}),false);}
 assert.equal(inDefenseRange(gun,{hp:1,x:10.5,y:6}),true);
 assert.equal(inDefenseRange(gun,{hp:0,x:10,y:6}),false);
 const outside=setup(4.6);tick(outside,120);assert.equal(outside.effects.length,0);assert.equal(outside.units[0].hp,145);
});
test('leaving the range cancels wind-up, and returning inside allows the cannon to reacquire',()=>{
 const b=setup();tick(b,2);assert.equal(b.buildings[0].action,'windup');
 b.units[0].x=11;tick(b,20);assert.equal(b.effects.length,0);assert.equal(b.buildings[0].target,null);
 b.units[0].x=10;tick(b,60);assert.ok(b.effects.some(f=>f.style==='cannon'));assert.ok(b.units[0].hp<145);
});
