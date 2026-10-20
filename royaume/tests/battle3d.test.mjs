import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTraining,TROOPS} from '../battle3d-sandbox.mjs';
import {createArchitecture,createForest,createVillageProps} from '../battle3d-models.mjs';
import {actorGeometries,drawTroop} from '../battle3d-actors.mjs';
import {startAssault,assaultCommand,stepAssault,attackScore} from '../expeditions.mjs';
import {bindBattleInput} from '../battle3d-input.mjs';

test('training starts with a private army and does not advance before deployment',()=>{
  const a=createTraining(),b=createTraining();
  assert.equal(TROOPS.reduce((sum,t)=>sum+a.count(t.kind),0),17);
  a.tick(30);assert.equal(a.battle.elapsed,0);
  a.deploy('guardians',10,14);
  assert.equal(a.count('guardians'),7);assert.equal(b.count('guardians'),8);
  assert.notEqual(a.battle,b.battle);assert.notEqual(a.battle.buildings[0],b.battle.buildings[0]);
});

test('invalid positions, unavailable units and exhausted reserves cannot spend troops',()=>{
  const t=createTraining();
  for(const [x,y] of [[10,8],[8,2.9],[-1,1],[20,1],[1,16],[NaN,1],[Infinity,1],['1',1],[null,1]])
    assert.throws(()=>t.deploy('guardians',x,y));
  assert.throws(()=>t.deploy('knights',1,1));
  assert.equal(t.count('guardians'),8);assert.equal(t.started,false);
  for(let i=0;i<8;i++)t.deploy('guardians',1,1+i);
  assert.throws(()=>t.deploy('guardians',1,1));assert.equal(t.count('guardians'),0);
  assert.equal(t.battle.units.length,8);
});

test('pause freezes combat and refuses actions; large frame deltas are bounded',()=>{
  const t=createTraining();t.deploy('guardians',10,14);t.tick(.1);
  t.pause(true);const before=JSON.stringify(t.battle);t.tick(60);
  assert.equal(JSON.stringify(t.battle),before);
  assert.throws(()=>t.deploy('archers',10,14));assert.throws(()=>t.spell(10,8));
  t.pause(false);const elapsed=t.battle.elapsed;t.tick(60);
  assert.ok(t.battle.elapsed-elapsed<=.100001);
  for(const invalid of [-1,NaN,Infinity])t.tick(invalid);
  assert.ok(Number.isFinite(t.battle.elapsed));
});

test('two spells damage only the private fort and cannot be reused',()=>{
  const t=createTraining(),other=createTraining();
  const castle=t.battle.buildings.find(b=>b.kind==='castle'),hp=castle.hp;
  t.spell(10,8);t.spell(10,8);
  assert.equal(castle.hp,hp-300);assert.equal(t.battle.spells,0);
  assert.equal(other.battle.buildings[0].hp,hp);
  assert.throws(()=>t.spell(10,8));assert.equal(castle.hp,hp-300);
  assert.equal(new Set(t.battle.effects.map(e=>e.visualId)).size,2);
});

test('a full army can win; settlement is stable; replay completely resets practice',()=>{
  const t=createTraining();let index=0;
  const army=TROOPS.flatMap(troop=>Array(troop.count).fill(troop.kind));
  let steps=0;
  while(t.battle.phase==='active'&&steps<5000){
    if(index<army.length&&steps%60===0){t.deploy(army[index],7.2+(index%9)*.7,14.4);index++;}
    t.tick(1/30);steps++;
    for(const unit of t.battle.units){
      assert.ok(Number.isFinite(unit.x)&&Number.isFinite(unit.y));assert.ok(unit.hp>=0&&unit.hp<=unit.maxHp);
      if(unit.hp>0)for(const b of t.battle.buildings)if(b.hp>0)
        assert.ok(Math.abs(unit.x-b.x)>=b.collision.width/2-.05||Math.abs(unit.y-b.y)>=b.collision.depth/2-.05,`Unit ${unit.id} entered ${b.id}`);
    }
  }
  assert.deepEqual(t.score,{percent:100,stars:3});assert.equal(t.battle.phase,'finished');
  assert.equal(t.battle.settled,true);assert.ok(t.battle.elapsed<150);
  const finished=JSON.stringify(t.battle);t.tick(1);assert.equal(JSON.stringify(t.battle),finished);
  assert.throws(()=>t.deploy('guardians',1,1));
  t.reset();assert.equal(t.started,false);assert.equal(t.paused,false);assert.equal(t.count('guardians'),8);
  assert.equal(t.battle.units.length,0);assert.equal(t.battle.effects.length,0);assert.equal(t.battle.spells,2);
  assert.deepEqual(t.score,{percent:0,stars:0});assert.ok(t.battle.buildings.every(b=>b.hp===b.maxHp));
});

test('timeout finishes a battle even with troops still in reserve',()=>{
  const t=createTraining();t.deploy('guardians',1,1);
  for(let i=0;i<4600&&t.battle.phase==='active';i++)t.tick(1/30);
  assert.equal(t.battle.phase,'finished');assert.equal(t.remaining,0);assert.equal(t.battle.settled,true);
});

test('practice imports cannot reach persistence or network code',()=>{
  // Audit the complete small simulation dependency graph, including transitive imports.
  const pending=[new URL('../battle3d-sandbox.mjs',import.meta.url)],seen=new Set();
  while(pending.length){
    const url=pending.pop();url.search='';if(seen.has(url.href))continue;seen.add(url.href);
    const source=readFileSync(url,'utf8');
    assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/);
    for(const match of source.matchAll(/\bimport\s+[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g)){
      assert.ok(match[1].startsWith('./'));pending.push(new URL(match[1],url));
    }
  }
  assert.equal(seen.size,5);
});

function harness(){
  const listeners=new Map(),taps=[],pans=[],zooms=[];
  let active=true;
  const canvas={addEventListener:(name,callback)=>listeners.set(name,callback),removeEventListener:name=>listeners.delete(name),setPointerCapture(){}};
  const input=bindBattleInput(canvas,{enabled:()=>active,tap:(...p)=>taps.push(p),pan:(...p)=>pans.push(p),zoom:value=>zooms.push(value)});
  const event=(name,id,x,y)=>listeners.get(name)?.({pointerId:id,clientX:x,clientY:y,button:0});
  return {input,event,taps,pans,zooms,disable(){active=false;}};
}

test('a tap deploys once; a drag that returns to its start never deploys',()=>{
  const h=harness();h.event('pointerdown',1,20,20);h.event('pointerup',1,23,21);
  assert.deepEqual(h.taps,[[23,21]]);
  h.event('pointerdown',1,20,20);h.event('pointermove',1,50,20);h.event('pointermove',1,20,20);h.event('pointerup',1,20,20);
  assert.equal(h.taps.length,1);assert.equal(h.pans.length,2);
});

test('pinching, interrupted gestures and losing pointer capture never deploy',()=>{
  const h=harness();h.event('pointerdown',1,10,10);h.event('pointerdown',2,30,10);
  h.event('pointermove',2,50,10);h.event('pointerup',2,50,10);h.event('pointerup',1,10,10);
  assert.deepEqual(h.zooms,[2]);assert.equal(h.taps.length,0);
  for(const cancel of ['pointercancel','lostpointercapture']){
    h.event('pointerdown',1,10,10);h.event(cancel,1,10,10);h.event('pointerup',1,10,10);
  }
  h.event('pointerdown',1,10,10);h.input.clear();h.event('pointerup',1,10,10);
  h.event('pointerdown',1,10,10);h.disable();h.event('pointerup',1,10,10);
  assert.equal(h.taps.length,0);
});

test('detailed scenery has finite geometry and a bounded triangle budget',()=>{
  const t=createTraining();
  const meshes=[{geometry:createForest(),count:1},{geometry:createVillageProps(),count:1}];
  for(const kind of new Set(t.battle.buildings.map(b=>b.kind))){
    const model=createArchitecture(kind),count=t.battle.buildings.filter(b=>b.kind===kind).length;
    meshes.push({geometry:model.geometry,count},...model.animated.map(p=>({geometry:p.geometry,count})));
    assert.ok(model.height>0&&model.height<5);
    for(const part of model.animated)assert.ok(part.matrix.elements.every(Number.isFinite));
  }
  let triangles=0;
  for(const {geometry,count} of meshes){
    for(const key of ['position','normal','color'])assert.ok(geometry.attributes[key].array.every(Number.isFinite));
    triangles+=geometry.attributes.position.count/3*count;
  }
  assert.ok(triangles<200000,`${triangles} scenery triangles`);
});

test('all three articulated troops have valid transforms at rest, walking and attacking',()=>{
  const geometries=actorGeometries();let budget=0;
  for(const troop of TROOPS)for(const [walk,attack] of [[0,0],[1,.7],[-1,-.7]]){
    const counts={};let triangles=0;
    drawTroop(troop.kind,1.7,walk,attack,(shape,tint,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>{
      assert.ok(geometries[shape]);assert.match(tint,/^#[0-9a-f]{6}$/i);
      assert.ok([x,y,z,sx,sy,sz,rx,ry,rz].every(Number.isFinite));assert.ok(sx>0&&sy>0&&sz>0);
      counts[shape]=(counts[shape]||0)+1;triangles+=(geometries[shape].index?.count||geometries[shape].attributes.position.count)/3;
    });
    assert.ok(Object.values(counts).every(count=>count*17<2048));
    if(walk===0)budget+=triangles*troop.count;
  }
  assert.ok(budget<180000,`${budget} troop triangles`);
});

test('optional 3D collisions preserve the recorded outcomes of all 12 existing campaign missions',()=>{
  // Captured from the pre-change campaign engine, using the same fixed-step strategy.
  const expected=[[100,3,6.533,17,2184],[100,3,8.433,17,2115],[100,3,10.133,17,2069],[100,3,11,17,1944],[100,3,11.633,17,1897.8],[100,3,12.067,17,1670],[100,3,11.8,17,1664.2],[100,3,12.233,16,1669],[100,3,13.2,16,1608.2],[100,3,17.733,11,868.6],[100,3,19.9,8,699.6],[100,3,22.133,5,465]];
  for(let mission=0;mission<12;mission++){
    const state={buildings:{castle:10},energy:1000,troops:8,army:{archers:6,mages:3},conquests:Object.fromEntries(Array.from({length:12},(_,i)=>[i,3])),stats:{raid:0},journal:[]};
    startAssault(state,mission);let index=0;
    for(const troop of TROOPS)for(let i=0;i<troop.count;i++)assaultCommand(state,{type:'assault-deploy',unit:troop.kind,x:7.2+(index++%9)*.7,y:14.4});
    for(let i=0;i<5000&&state.assault.phase==='active';i++)stepAssault(state,1/30);
    const b=state.assault,score=attackScore(b);
    assert.deepEqual([score.percent,score.stars,+b.elapsed.toFixed(3),b.units.filter(u=>u.hp>0).length,+b.units.reduce((n,u)=>n+u.hp,0).toFixed(2)],expected[mission],`Mission ${mission}`);
  }
});
