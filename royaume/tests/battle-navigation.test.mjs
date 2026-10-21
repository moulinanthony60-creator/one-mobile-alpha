import test from 'node:test';
import assert from 'node:assert/strict';
import {planTrainingAttack,advanceTrainingUnit,clearSegment,canStrike} from '../battle-navigation.mjs';
const soldier={hp:145,damage:18,range:1.15,rate:1,speed:1.7};
const unit=()=>({id:1,x:2,y:6,hp:145,cooldown:0,path:[],target:null,repath:0});
const building=(id,kind,x,y,w=1,d=1)=>({id,kind,x,y,hp:200,maxHp:200,collision:{width:w,depth:d}});
const world=buildings=>({field:{width:14,height:12},buildings});
const barrier=gap=>Array.from({length:12},(_,i)=>building('wall'+i,'wall',5,i+.5,.7,1)).filter(b=>b.id!=='wall'+gap);

test('a reachable building is chosen even when a closer building is behind a closed wall',()=>{
 const u=unit(),close=building('closed','cottage',7,6),open=building('open','mine',2,11),b=world([close,open,...barrier(-1)]);
 const plan=planTrainingAttack(b,u,soldier);assert.equal(plan.target.id,'open');assert.equal(plan.objective,'open');
});
test('an opening is used instead of damaging the adjacent wall, with collision-free shortcuts',()=>{
 const u=unit(),b=world([building('castle','castle',9,6,2,2),...barrier(9)]),plan=planTrainingAttack(b,u,soldier);
 assert.equal(plan.target.id,'castle');assert.ok(plan.path.some(p=>p.y>9));assert.ok(plan.path.length<8,'no staircase through every grid cell');
 let previous=u;for(const p of plan.path){assert.ok(clearSegment(previous,p,b.buildings));previous=p;}
 for(let i=0;i<400;i++){u.repath-=1/30;const target=advanceTrainingUnit(b,u,soldier,1/30);assert.equal(target.id,'castle');assert.ok(clearSegment(u,u,b.buildings));}
 assert.ok(canStrike(u,b.buildings[0],soldier,b.buildings));assert.ok(b.buildings.every(b=>b.hp===b.maxHp));
});
test('a sealed village selects a wall on the route to a building, never an unrelated nearby wall',()=>{
 const u=unit(),irrelevant=building('irrelevant','wall',1,5,.7,1),b=world([building('castle','castle',9,6,2,2),irrelevant,...barrier(-1)]);
 const plan=planTrainingAttack(b,u,soldier);assert.equal(plan.target.kind,'wall');assert.equal(plan.target.x,5);assert.equal(plan.objective,'castle');assert.notEqual(plan.target.id,'irrelevant');
 plan.target.hp=0;
 const open=planTrainingAttack(b,u,soldier);assert.equal(open.target.id,'castle');
});
test('archers shoot buildings over walls and units leave walls as soon as a breach opens',()=>{
 const u={...unit(),x:4},castle=building('castle','castle',7.5,6,2,2),b=world([castle,...barrier(-1)]),archer={...soldier,range:3.5};
 assert.equal(planTrainingAttack(b,u,archer).target.id,'castle');
 const melee=unit();advanceTrainingUnit(b,melee,soldier,1/30);assert.equal(b.buildings.find(b=>b.id===melee.target).kind,'wall');
 const wall=b.buildings.find(b=>b.id===melee.target);wall.hp=0;
 advanceTrainingUnit(b,melee,soldier,1/30);assert.equal(melee.target,'castle');
});
test('no building left means no attack on remaining walls; routes stay stable between topology changes',()=>{
 const u=unit(),castle=building('castle','castle',10,10),b=world([castle,building('stray','wall',1,1)]);
 advanceTrainingUnit(b,u,soldier,1/30);const goal=u.path.at(-1);
 for(let i=0;i<40;i++){u.repath-=1/30;advanceTrainingUnit(b,u,soldier,1/30);assert.deepEqual(u.path.at(-1),goal);}
 castle.hp=0;assert.equal(planTrainingAttack(b,u,soldier).target,null);
});
