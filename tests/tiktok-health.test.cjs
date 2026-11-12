const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../ui/tiktok-health-core.js');
const event=(type,value)=>({'x-tiktok-player':true,type,value});
function rig(){
 const listeners=new Set(),timers=new Map();let next=0,frame;
 const host={addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn),setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)};
 const doc={createElement:()=>frame={messages:[],contentWindow:{postMessage:(data,origin)=>frame.messages.push({data,origin})},remove:()=>frame.removed=true}};
 const container={replaceChildren:el=>container.child=el};
 const controller=new AbortController();
 const result=core.inspect({id:'7703998251745266976'},{host,doc,container,signal:controller.signal});
 return {result,frame,listeners,timers,controller,send:(type,value,extra={})=>{for(const fn of [...listeners])fn({origin:'https://www.tiktok.com',source:frame.contentWindow,data:event(type,value),...extra});},expire:()=>{for(const fn of [...timers.values()])fn();}};
}
test('snapshot keeps every distinct entry and never rounds numeric IDs',()=>{
 const input=[{id:'7703998251745266976',title:'A'},{id:'7703998251745266976',title:'B'},{id:7703998251745266976},{id:'bad'}];
 const rows=core.snapshot(input);assert.equal(rows.length,3);assert.equal(rows[0].title,'A');assert.equal(rows[1].id,'');assert.equal(input[0].status,undefined);
 assert.throws(()=>core.snapshot({}));assert.throws(()=>core.snapshot([null]));
});
test('invalid IDs never create an iframe',async()=>{
 for(const id of ['bad','../bad','123','1'.repeat(25),7703998251745266976]){
  const r=await core.inspect({id},{doc:{createElement(){throw Error('should not run');}}});assert.equal(r.status,'invalid');
 }
});
test('player-ready and playing without advancing time are not success',async()=>{
 const r=rig();r.send('onPlayerReady');r.send('onStateChange',1);r.send('onCurrentTime',{currentTime:5});r.send('onCurrentTime',{currentTime:5});
 assert.equal(r.listeners.size,1);r.expire();assert.equal((await r.result).status,'unknown');assert.ok(r.frame.removed);
});
test('success requires playing plus at least two advancing timestamps',async()=>{
 const r=rig();r.send('onCurrentTime',{currentTime:0});r.send('onCurrentTime',{currentTime:2});assert.equal(r.listeners.size,1);
 r.send('onStateChange',1);r.send('onCurrentTime',{currentTime:3});r.send('onCurrentTime',{currentTime:3.5});assert.equal(r.listeners.size,1);
 r.send('onCurrentTime',{currentTime:4.1});assert.equal((await r.result).status,'played');assert.equal(r.listeners.size,0);assert.equal(r.timers.size,0);assert.ok(r.frame.removed);
 assert.equal(r.frame.messages.at(-1).data.type,'pause');
});
test('paused time and nonfinite or coerced values cannot pass',()=>{
 const read=core.evidence();read(event('onStateChange',1));
 for(const currentTime of [null,'4',NaN,Infinity,-1])assert.equal(read(event('onCurrentTime',{currentTime})),null);
 read(event('onCurrentTime',{currentTime:0}));read(event('onStateChange',2));assert.equal(read(event('onCurrentTime',{currentTime:2})),null);
 read(event('onStateChange',1));assert.equal(read(event('onCurrentTime',{currentTime:2})),null);
 assert.equal(read(event('onCurrentTime',{currentTime:3})).status,'played');
});
test('time resetting at a loop does not fake progression',()=>{
 const read=core.evidence();read(event('onStateChange',1));read(event('onCurrentTime',{currentTime:20}));
 assert.equal(read(event('onCurrentTime',{currentTime:0})),null);assert.equal(read(event('onCurrentTime',{currentTime:1})).status,'played');
});
test('only the exact frame and TikTok origin may supply evidence',async()=>{
 const r=rig();
 for(const extra of [{origin:'https://evil.example'},{origin:'https://www.tiktok.com.evil.example'},{source:{}}])r.send('onPlayerError',{errorCode:1001},extra);
 r.send('onPlayerError',{errorCode:1001},{data:{type:'onPlayerError',value:{errorCode:1001}}});assert.equal(r.listeners.size,1);
 r.send('onPlayerError',{errorCode:1001});assert.deepEqual(await r.result,{status:'unavailable',reason:'invalid_video',code:1001});
});
for(const [code,reason] of [[2001,'server_error'],[2005,'rate_limit'],[3001,'player_error'],[3002,'autoplay'],[9999,'player_error']])test('error '+code+' remains uncertain',async()=>{
 const r=rig();r.send('onPlayerError',{errorCode:code});if(code!==2005)r.expire();assert.deepEqual(await r.result,{status:'unknown',reason,code});
});
test('server confirmation can require two full seconds of actual progress',()=>{
 const read=core.evidence(2);read(event('onStateChange',1));read(event('onCurrentTime',{currentTime:0}));
 assert.equal(read(event('onCurrentTime',{currentTime:1.2})),null);
 assert.equal(read(event('onCurrentTime',{currentTime:2.1})).status,'played');
});
test('legacy errors and image posts remain uncertain',async()=>{
 for(const type of ['onError','onImageChange']){const r=rig();r.send(type,1);if(type==='onError')r.expire();assert.equal((await r.result).status,'unknown');}
});
test('an early legacy or transient error can recover within the same player',async()=>{
 for(const [type,value] of [['onError',2],['onPlayerError',{errorCode:2001}],['onPlayerError',{}]]){
  const r=rig();r.send(type,value);assert.equal(r.listeners.size,1);
  r.send('onPlayerReady');r.send('onStateChange',1);r.send('onCurrentTime',{currentTime:0});r.send('onCurrentTime',{currentTime:1.2});
  assert.equal((await r.result).status,'played');assert.equal(r.timers.size,0);
 }
});
test('a later definitive error replaces the provisional legacy error',async()=>{
 const r=rig();r.send('onError',2);r.send('onPlayerError',{errorCode:1001});
 assert.equal((await r.result).status,'unavailable');
});
test('rate limits remain immediate and are never retried',async()=>{
 const r=rig();r.send('onError',2);r.send('onPlayerError',{errorCode:2005});
 assert.equal((await r.result).reason,'rate_limit');assert.equal(r.timers.size,0);
});
test('abort cleans up playback and leaves the entry untested',async()=>{
 const r=rig();r.controller.abort();assert.equal((await r.result).status,'pending');assert.equal(r.listeners.size,0);assert.equal(r.timers.size,0);assert.ok(r.frame.removed);
 const c=new AbortController();c.abort();assert.equal((await core.inspect({id:'11111111'},{signal:c.signal})).status,'pending');
});
test('ready requests muted playback once with an exact target origin',async()=>{
 const r=rig();r.send('onPlayerReady');r.send('onPlayerReady');assert.deepEqual(r.frame.messages.map(m=>m.data.type),['mute','play']);
 assert.ok(r.frame.messages.every(m=>m.origin==='https://www.tiktok.com'));assert.match(r.frame.src,/force_muted=1/);assert.match(r.frame.src,/loop=0/);r.controller.abort();await r.result;
});
test('mounting failure resolves and removes resources',async()=>{
 const result=await core.inspect({id:'11111111'},{doc:{createElement:()=>({remove(){}})},host:{addEventListener(){},removeEventListener(){},setTimeout(){return 1;},clearTimeout(){}},container:{replaceChildren(){throw Error();}}});
 assert.equal(result.status,'unknown');
});
test('counts distinguish a complete check from partial or untested results',()=>{
 assert.deepEqual(core.counts([{status:'played'},{status:'unavailable'},{status:'unknown'},{status:'invalid'},{status:'pending'}]),{total:5,checked:4,played:1,unavailable:1,unknown:1,invalid:1,pending:1});
});
