const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {tracker,install}=require('../ui/tiktok-playback-health.js');
const time=value=>({type:'onCurrentTime',value:{currentTime:value}});
const playing={type:'onStateChange',value:1};
function prove(read){read(playing,0);read(time(0),0);read(time(1),1000);return read(time(2),2000);}
test('requires two seconds of actual progression, once per player',()=>{const read=tracker();assert.equal(prove(read),true);assert.equal(read(time(3),3000),false);});
test('ready, paused, seeking, repeated messages and nonnumeric times are not playback',()=>{
 for(const samples of [
  [[{type:'onPlayerReady'},0],[time(2),2000]],
  [[playing,0],[time(0),0],[time(60),2000]],
  [[playing,0],[time(0),0],[time(1),0],[time(2),0]],
  [[playing,0],[time(0),0],[{type:'onStateChange',value:2},1000],[time(2),2000]],
  [[playing,0],[time('0'),0],[time('2'),2000]],
  [[playing,0],[time(0),0],[time(1),1000],[{type:'onPlayerError'},1500],[time(2),2000]]
 ]){const read=tracker();for(const [d,at]of samples)assert.equal(read(d,at),false);}
});
function dom(){
 let now=0,token='one-session',hidden=false,active=true;const listeners={},calls=[],noted=[];
 const frame={src:'https://www.tiktok.com/player/v1/11111111',contentWindow:{}},slide={dataset:{},querySelector:()=>frame};
 const host={performance:{now:()=>now},oneAccountToken:()=>token,ONETikTokAvailability:{notePlayback:id=>noted.push(id)},
  document:{get hidden(){return hidden;},querySelector:()=>active?slide:null,querySelectorAll:()=>[frame],getElementById:()=>({classList:{contains:()=>true}}),addEventListener(){},removeEventListener(){}},
  addEventListener:(n,f)=>listeners[n]=f,removeEventListener(){},fetch:async(url,options)=>{calls.push({url,options});return {ok:true};}};
 install(host);
 const message=(data,source=frame.contentWindow,origin='https://www.tiktok.com')=>listeners.message({data:{'x-tiktok-player':true,...data},origin,source});
 const play=()=>{message(playing);message(time(0));now+=1000;message(time(1));now+=1000;message(time(2));};
 return {play,message,frame,calls,noted,hide:()=>hidden=true,inactive:()=>active=false,guest:()=>token=''};
}
test('accepts only the active visible TikTok iframe and authentic messages',()=>{
 const d=dom();d.message(playing,{},'https://evil.test');d.message(time(5),{});assert.equal(d.calls.length,0);
 d.play();assert.deepEqual(d.noted,['11111111']);assert.equal(d.calls.length,1);
 assert.deepEqual(JSON.parse(d.calls[0].options.body),{videoId:'11111111',seconds:2});
 assert.deepEqual(d.calls[0].options.headers,{'Content-Type':'application/json'});assert.equal(d.calls[0].options.credentials,'omit');
});
test('background and preload never report; guests report without any session credential',()=>{
 for(const mode of ['hide','inactive']){const d=dom();d[mode]();d.play();assert.equal(d.calls.length,0);assert.equal(d.noted.length,0);}
 const d=dom();d.guest();d.play();assert.deepEqual(d.noted,['11111111']);assert.equal(d.calls.length,1);assert.equal(d.calls[0].options.headers.Authorization,undefined);
});
// Exercise the production D1 SQL against real SQLite, including rate-limit atomicity.
const sqlite=String.raw`import json,sqlite3,sys
args=json.load(sys.stdin)
db=sqlite3.connect(args['file'])
db.row_factory=sqlite3.Row
with db:
 results=[]
 for op in args['ops']:
  c=db.execute(op['q'],op['args'])
  rows=[dict(r) for r in c.fetchall()] if c.description else []
  results.append({'results':rows,'meta':{'changes':c.rowcount}})
print(json.dumps(results))`;
function database(){
 const dir=fs.mkdtempSync(path.join(__dirname,'one-health-')),file=path.join(dir,'health.sqlite');
 const run=ops=>JSON.parse(execFileSync('python3',['-c',sqlite],{input:JSON.stringify({file,ops}),encoding:'utf8'}));
 const db={prepare(q){const statement={q,args:[],bind(...args){return {...statement,args,bind:statement.bind};},async first(){return run([this])[0].results[0]||null;},async all(){return run([this])[0];}};return statement;},async batch(ops){return run(ops);}};
 return {db,close:()=>fs.rmSync(dir,{recursive:true,force:true})};
}
async function service(){const worker=(await import('../SERVEUR/tiktok-health-worker.mjs')).default;const sql=database();return {sql,env:{HEALTH:sql.db},request:(url,options={})=>new Request('https://health.test'+url,options),worker};}
const post=videoId=>({method:'POST',headers:{Origin:'https://one-officiel.fr','Content-Type':'application/json'},body:JSON.stringify({videoId,seconds:2})});
test('worker stores only aggregate successful playback, with server timestamps',async()=>{
 const s=await service();try{
  let r=await s.worker.fetch(s.request('/playback',post('11111111')),s.env);assert.equal(r.status,200);
  r=await s.worker.fetch(s.request('/health'),s.env);const d=await r.json();assert.equal(d.ok,true);assert.equal(d.policy,'temporary-v1');assert.equal(d.entries.length,1);assert.equal(d.entries[0].id,'11111111');
  assert.deepEqual(Object.keys(d.entries[0]).sort(),['id','playedAt']);assert.ok(Date.parse(d.entries[0].playedAt)<=Date.parse(d.generatedAt));
  const tables=await s.sql.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();assert.equal(tables.results.length,3);
 }finally{s.sql.close();}
});
test('worker rejects credentials, wrong origins, invalid IDs, errors and oversized bodies',async()=>{
 const s=await service();try{
  for(const [options,status]of [
   [{...post('11111111'),headers:{...post('').headers,Authorization:'Bearer must-not-be-forwarded'}},400],
   [{...post('11111111'),headers:{...post('').headers,Origin:'https://evil.test'}},403],
   [post('not-an-id'),400],
   [{...post('11111111'),body:JSON.stringify({videoId:'11111111',seconds:0,status:'unavailable'})},400],
   [{...post('11111111'),body:'x'.repeat(2049)},413]
  ])assert.equal((await s.worker.fetch(s.request('/playback',options),s.env)).status,status);
  const d=await (await s.worker.fetch(s.request('/health'),s.env)).json();assert.deepEqual(d.entries,[]);
  assert.equal((await s.worker.fetch(s.request('/health'),{})).status,503);
 }finally{s.sql.close();}
});
test('collector never reads or forwards a ONE session, even when one exists',async()=>{
 const d=dom();d.play();assert.equal(d.calls.length,1);assert.equal(Object.keys(d.calls[0].options.headers).length,1);
 const s=await service();try{s.env.PROFILE={fetch:async()=>assert.fail('No authentication request allowed')};const r=await s.worker.fetch(s.request('/playback',post('11111111')),s.env);assert.equal(r.status,200);}finally{s.sql.close();}
});
test('global per-minute rate limit is atomic and does not store any user identifier',async()=>{
 const s=await service();try{
  await s.worker.fetch(s.request('/health'),s.env);
  await s.sql.db.batch([s.sql.db.prepare('INSERT INTO one_tiktok_health_limits VALUES(?,?,120)').bind('global',Math.floor(Date.now()/60000))]);
  assert.equal((await s.worker.fetch(s.request('/playback',post('11111111')),s.env)).status,429);
  assert.deepEqual((await(await s.worker.fetch(s.request('/health'),s.env)).json()).entries,[]);
 }finally{s.sql.close();}
});
