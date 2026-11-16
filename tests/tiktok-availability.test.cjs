const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const api=require('../ui/tiktok-availability.js');
const id='11111111';
function manifest(){const now=Date.now();return {version:2,withdrawalPolicy:'temporary-v1',generatedAt:new Date(now).toISOString(),entries:[{id,reason:'invalid_video',code:1001,confirmations:3,firstUnavailableAt:new Date(now-13*3600000).toISOString(),lastUnavailableAt:new Date(now-3600000).toISOString(),hiddenUntil:new Date(now+23*3600000).toISOString()}]};}
function evidence(entries=[]){const now=Date.now();return {ok:true,version:1,policy:'temporary-v1',generatedAt:new Date(now).toISOString(),startedAt:new Date(now-2*86400000).toISOString(),entries};}
function host(data=manifest(),health=evidence(),offline=false){const storage=new Map();return {localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},fetch:async url=>{if(offline)throw Error('offline');return {ok:true,json:async()=>url.endsWith('/health')?health:data};}};}
test('three spaced explicit errors authorize only a bounded temporary mask',()=>{
 assert.deepEqual([...api.validate(manifest()).keys()],[id]);
 for(const change of [{confirmations:2},{code:2001},{reason:'timeout'},{id:11111111},{hiddenUntil:new Date(Date.now()+7*86400000).toISOString()},{lastUnavailableAt:new Date().toISOString(),firstUnavailableAt:new Date().toISOString()}]){const data=manifest();Object.assign(data.entries[0],change);assert.throws(()=>api.validate(data));}
});
test('legacy, stale, malformed and future manifests cannot authorize masking',()=>{
 for(const change of [{version:1},{entries:{}},{generatedAt:'broken'},{generatedAt:new Date(Date.now()+3600000).toISOString()},{generatedAt:new Date(Date.now()-2*86400000).toISOString()}])assert.throws(()=>api.validate({...manifest(),...change}));
});
test('requires a fresh complete collection before hiding any video',async()=>{
 const h=host();const state=api.create(h);assert.equal(state.isHidden(id),false);await state.refresh();assert.equal(state.isHidden(id),true);assert.equal(state.isHidden('22222222'),false);
});
test('a shared real playback immediately overrides repeated bot failures',async()=>{
 const h=host(manifest(),evidence([{id,playedAt:new Date().toISOString()}]));const state=api.create(h);await state.refresh();assert.equal(state.isHidden(id),false);
});
test('a local real playback restores immediately and survives a reload',async()=>{
 const h=host();const state=api.create(h);await state.refresh();assert.equal(state.isHidden(id),true);state.notePlayback(id);assert.equal(state.isHidden(id),false);const again=api.create(h);await again.refresh();assert.equal(again.isHidden(id),false);
});
test('no collection, offline operation and corrupt evidence all fail open',async()=>{
 for(const h of [host(manifest(),evidence(),true),host(manifest(),{}),host(manifest(),evidence([{id,playedAt:'broken'}])),host({...manifest(),version:1})]){const state=api.create(h);await state.refresh();assert.equal(state.isHidden(id),false);}
});
test('pre-collection strikes and expired temporary masks cannot hide',async()=>{
 const health=evidence();health.startedAt=new Date().toISOString();let state=api.create(host(manifest(),health));await state.refresh();assert.equal(state.isHidden(id),false);
 const data=manifest();data.entries[0].firstUnavailableAt=new Date(Date.now()-40*3600000).toISOString();data.entries[0].lastUnavailableAt=new Date(Date.now()-25*3600000).toISOString();data.entries[0].hiddenUntil=new Date(Date.now()-3600000).toISOString();state=api.create(host(data));await state.refresh();assert.equal(state.isHidden(id),false);
});
test('a successful bot retest restores the link',async()=>{const data=manifest();data.entries=[];const state=api.create(host(data));await state.refresh();assert.equal(state.isHidden(id),false);});
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

