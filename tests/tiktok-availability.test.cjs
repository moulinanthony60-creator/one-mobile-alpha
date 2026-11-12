const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const api=require('../ui/tiktok-availability.js');
const id='11111111';
function manifest(){const time=Date.now();return {version:1,generatedAt:new Date(time).toISOString(),entries:[{id,reason:'invalid_video',code:1001,confirmations:3,firstUnavailableAt:new Date(time-13*3600000).toISOString(),lastUnavailableAt:new Date(time-3600000).toISOString()}]};}
function host(cached,response){const storage=new Map(cached?[['one_tiktok_confirmed_withdrawals_v1',JSON.stringify(cached)]]:[]);return {localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},fetch:response};}
test('only three properly spaced confirmed unavailable results are accepted',()=>{
 assert.deepEqual([...api.validate(manifest())],[id]);
 for(const change of [{confirmations:2},{code:2001},{reason:'timeout'},{id:11111111},{lastUnavailableAt:new Date().toISOString(),firstUnavailableAt:new Date().toISOString()}]){
  const data=manifest();Object.assign(data.entries[0],change);assert.throws(()=>api.validate(data));
 }
});
test('old, malformed and future lists cannot hide videos',()=>{
 for(const change of [{version:2},{entries:{}},{generatedAt:'broken'},{generatedAt:new Date(Date.now()+3600000).toISOString()},{generatedAt:new Date(Date.now()-8*86400000).toISOString()}])assert.throws(()=>api.validate({...manifest(),...change}));
});
test('a network error retains the previous valid list and never adds an ID',async()=>{
 const state=api.create(host(manifest(),async()=>{throw Error('offline');}));await state.refresh();assert.equal(state.isHidden(id),true);assert.equal(state.isHidden('22222222'),false);
});
test('a successful later verification restores a withdrawn video',async()=>{
 const cleared={...manifest(),entries:[]};const state=api.create(host(manifest(),async()=>({ok:true,json:async()=>cleared})));await state.refresh();assert.equal(state.isHidden(id),false);
});
test('malformed remote data cannot replace the last valid list',async()=>{
 const state=api.create(host(manifest(),async()=>({ok:true,json:async()=>({version:1,entries:[{id:'22222222'}]})})));await state.refresh();assert.equal(state.isHidden(id),true);assert.equal(state.isHidden('22222222'),false);
});
test('a new installation remains usable if the history endpoint is absent',async()=>{
 const state=api.create(host(null,async()=>({ok:false})));await state.refresh();assert.equal(state.isHidden(id),false);
});
test('the real ONE pool excludes confirmed withdrawals from both shared and personal links',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const start=html.indexOf('function oneBuildTikTokPool('),end=html.indexOf('function loadTikTokLocal(',start);
 assert.ok(start>=0&&end>start);
 const ctx={window:{ONETikTokAvailability:{isHidden:x=>x===id}},tiktokExternalToItem:v=>({...v,tiktokId:v.id}),console};
 vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
 const pool=ctx.oneBuildTikTokPool({profile:{display_name:'Test'},videos:[{id}]},[{id},{id:'22222222'}]);
 assert.deepEqual(Array.from(pool.items,x=>x.tiktokId),['22222222']);
 ctx.window.ONETikTokAvailability.isHidden=()=>false;
 assert.equal(ctx.oneBuildTikTokPool(null,[{id}]).items.length,1);
});
