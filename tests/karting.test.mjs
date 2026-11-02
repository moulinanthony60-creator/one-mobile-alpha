import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,KART_RULES,pointAt,projectTrack,advanceKart,createKartMatch,validKartSnapshot} from '../ui/one-kart-core.js';
import {createMatch,validMode} from '../ui/one-arcade-r198-core.js';
const players=[{id:'alice',name:'Alice'},{id:'bob',name:'Bob'}];
const make=()=>createKartMatch({id:'test',players});
const advance=(m,seconds)=>{for(let t=0;t<seconds;t+=.05)m.tick(.05);};
test('large closed track and solo / eight-player lobby formats',()=>{
 assert(TRACK.length>550);assert(TRACK.length<650);assert.deepEqual(pointAt(0),pointAt(TRACK.length));
 for(let d=0;d<TRACK.length;d+=2){const p=pointAt(d);assert(projectTrack(p.x,p.z).d2<.001);}
 assert(validMode('kart',1,1));assert(validMode('kart',1,8));assert(!validMode('kart',1,9));
 assert.equal(createMatch({game:'kart',players}).snapshot().game,'kart');
});
test('host validates driving input, speed, braking and circuit boundaries',()=>{
 const m=make(),p=m.state.players[0];assert(!m.input('alice',{x:NaN,z:1}));assert(!m.input('alice',{x:0,z:2}));assert(!m.input('unknown',{x:0,z:1}));
 advance(m,3.1);m.input('alice',{x:0,z:1});advance(m,1.5);assert(p.speed>10&&p.speed<=KART_RULES.maxSpeed);
 m.input('alice',{x:0,z:-1});advance(m,.4);assert(p.speed<10);
 for(let i=0;i<600;i++)advanceKart(p,{x:Math.sin(i/50),z:1},1/60);
 assert(projectTrack(p.x,p.z).d2<=(TRACK.width/2-.85)**2+.0001);
});
test('nearby bat hit slows the correct side and cannot replay or stun-lock',()=>{
 const m=make();advance(m,3.1);const [a,b]=m.state.players;
 Object.assign(a,pointAt(30),{speed:15});const right={x:Math.cos(a.yaw),z:-Math.sin(a.yaw)};Object.assign(b,{x:a.x+right.x*2.6,z:a.z+right.z*2.6,speed:18});
 assert(m.action(a.id,{type:'bat',side:1,seq:1}));assert.equal(b.speed,8.1);assert.equal(b.stun,.55);assert.equal(a.hits,1);
 assert(!m.action(a.id,{type:'bat',side:1,seq:1}));assert(!m.action(a.id,{type:'bat',side:1,seq:2}));assert.equal(a.hits,1);
 advance(m,1.02);Object.assign(b,{x:a.x+Math.cos(a.yaw)*2.6,z:a.z-Math.sin(a.yaw)*2.6});m.action(a.id,{type:'bat',side:1,seq:3});assert.equal(a.hits,1,'temporary shield blocks a second hit');
});
test('bat misses distant, opposite-side and disconnected opponents',()=>{
 for(const [offset,connected]of [[8,true],[-2.6,true],[2.6,false]]){const m=make();advance(m,3.1);const [a,b]=m.state.players;Object.assign(a,pointAt(30));Object.assign(b,{x:a.x+Math.cos(a.yaw)*offset,z:a.z-Math.sin(a.yaw)*offset,speed:18,connected});m.action(a.id,{type:'bat',side:1,seq:1});assert.equal(a.hits,0);assert.equal(b.speed,18);}
});
test('continuous driving completes three ordered laps; reversing earns no lap',()=>{
 const m=createKartMatch({players:[players[0]]});advance(m,3.1);const p=m.state.players[0];m.input(p.id,{x:0,z:-1});advance(m,2);assert.equal(p.lap,0);
 let iterations=0;
 while(!m.state.finished&&iterations++<7000){const target=pointAt(projectTrack(p.x,p.z).distance+7),desired=Math.atan2(-(target.x-p.x),-(target.z-p.z)),error=Math.atan2(Math.sin(desired-p.yaw),Math.cos(desired-p.yaw));m.input(p.id,{x:Math.max(-1,Math.min(1,-error*2.8)),z:p.speed<10.5?1:-.05});m.tick(.05);}
 assert.equal(p.lap,3);assert.equal(m.state.winner,p.id);assert(p.finishAt<303);assert.equal(m.state.phase,'finished');
});
test('snapshots reject corrupted positions, duplicate members and forged events',()=>{
 const m=make(),c={size:1,players};assert(validKartSnapshot(m.snapshot(),c,'alice'));
 const bad=m.snapshot();bad.players[0].x=1000;assert(!validKartSnapshot(bad,c,'alice'));
 const duplicate=m.snapshot();duplicate.players[1].id='alice';assert(!validKartSnapshot(duplicate,c,'alice'));
 const forged=m.snapshot();forged.events=[{id:'fake',from:'outsider',hit:'alice',side:1,at:0}];assert(!validKartSnapshot(forged,c,'alice'));
 m.remove('bob');assert.equal(m.snapshot().players[1].connected,false);
});
