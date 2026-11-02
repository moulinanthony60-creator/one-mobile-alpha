// Run against the project served over HTTP. Uses two browsers' lobby transport
// endpoints in memory; physical-device / Internet WebRTC remains a separate check.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.ONE_TEST_URL||'http://127.0.0.1:8000';
const output=process.env.ONE_TEST_OUTPUT||'/tmp/one-kart-tests';
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.ONE_CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader',...(process.env.ONE_CHROMIUM_SINGLE_PROCESS?['--single-process','--no-zygote','--in-process-gpu','--use-gl=angle']:[])]});
 const pages=new Map(),errors=[],missing=[];
 try{
  for(const id of ['alice','bob']){
   const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();pages.set(id,page);
   page.on('pageerror',e=>errors.push(id+': '+e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+': '+r.status());});
   await page.route('**/__kart-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/ui/one-lobby-3d.css"></head><body></body></html>'}));
   await page.exposeBinding('__send',async(_source,to,packet)=>{const target=pages.get(to);if(target)await target.evaluate(({from,packet})=>window.__receive?.(from,packet),{from:id,packet}).catch(()=>{});});
   await page.goto(origin+'/__kart-test');
   await page.evaluate(async id=>{
    window.__ONE317_TEST__=true;window.__ONE198_TEST__=true;
    const listeners=new Set();window.__receive=(from,p)=>{for(const fn of listeners)fn(from,p);};
    window.oneSocialRoom=()=>({id:'kart-test-room',name:'Les pilotes',hostId:'alice',members:['alice','bob'].map(accountId=>({accountId,name:accountId==='alice'?'Alice':'Bob',isYou:accountId===id,isHost:accountId==='alice'}))});
    window.ONEPartyGameLink={subscribe:fn=>(listeners.add(fn),()=>listeners.delete(fn)),send:(to,p)=>{void window.__send(to,p);return true;},sendReliable:(to,p)=>{void window.__send(to,p);return true;},connect:async()=>{},reconnect:async()=>{},peers:()=>['alice','bob'].filter(x=>x!==id).map(accountId=>({accountId,connected:true}))};
    window.oneCloseSalon=()=>{};window.oneOpenSalon=()=>{};
    const mod=await import('/ui/one-3d-v234.js');window.ONEOpen3DLobby=()=>mod.open({room:window.oneSocialRoom()});window.ONEOpen3DLobby();
   },id);
  }
  const host=pages.get('alice'),guest=pages.get('bob');
  await host.waitForFunction(()=>window.ONEArcadeTest?.state().players.length===2);
  await host.locator('[data-screen-open]').click();await host.locator('.screen-card[data-game=kart]').click();
  await guest.waitForFunction(()=>window.ONEArcadeTest?.state().selection.game==='kart');
  await guest.locator('[data-screen-open]').click();await guest.locator('.one3d-game-screen [data-ready]').click();await host.locator('.one3d-game-screen [data-ready]').click();
  await host.waitForFunction(()=>window.ONEArcadeTest.state().canStart);await host.locator('.one3d-game-screen [data-start]').click();
  for(const p of pages.values()){await p.waitForSelector('.one-kart');await p.waitForFunction(()=>window.ONEArcadeTest.inspect()?.snapshot?.phase==='play');}
  assert.equal(await guest.evaluate(()=>window.ONEArcadeTest.inspect().snapshot.players.length),2);
  await host.screenshot({path:output+'/kart-desktop.png'});
  const before=await host.evaluate(()=>window.ONEArcadeTest.inspect().snapshot.players.find(p=>p.id==='alice'));
  await host.keyboard.down('ArrowUp');await host.waitForFunction(()=>window.ONEArcadeTest.inspect().snapshot.players.find(p=>p.id==='alice').speed>10);await host.keyboard.up('ArrowUp');
  const after=await host.evaluate(()=>window.ONEArcadeTest.inspect().snapshot.players.find(p=>p.id==='alice'));
  assert(Math.hypot(after.x-before.x,after.z-before.z)>3);
  await guest.waitForFunction(()=>window.ONEArcadeTest.inspect().snapshot.players.find(p=>p.id==='alice').speed>5);
  await host.evaluate(()=>{const a=window.ONEArcadeTest.inspect().snapshot.players.find(p=>p.id==='alice');window.ONEArcadeTest.place('bob',{x:a.x+Math.cos(a.yaw)*2.6,z:a.z-Math.sin(a.yaw)*2.6});});
  await host.keyboard.press('KeyF');await guest.waitForFunction(()=>window.ONEArcadeTest.inspect().snapshot.events.some(e=>e.hit==='bob'));
  await guest.screenshot({path:output+'/kart-bat-hit.png'});
  await host.setViewportSize({width:390,height:844});await host.screenshot({path:output+'/kart-mobile.png'});
  const controls=await host.locator('.kart-steer button,.kart-pedals button,[data-bat]').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,label:b.textContent};}));
  assert(controls.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=390&&r.y+r.h<=844&&r.h>=44));
  // Pointer cancellation must release acceleration, including after the finger
  // leaves the pedal while it owns pointer capture.
  const pedal=host.locator('[data-drive]'),rect=await pedal.boundingBox();await host.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await host.mouse.down();await pedal.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse'});await host.mouse.up();assert.equal(await pedal.getAttribute('data-held'),'false');
  await host.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await host.locator('[data-menu]').click();await host.locator('[data-resume]').click();
  await host.evaluate(()=>window.ONEArcadeTest.finish());await guest.waitForFunction(()=>window.ONEArcadeTest.inspect()?.snapshot?.finished);
  for(const p of pages.values())await p.locator('[data-replay]').click();
  await host.waitForFunction(()=>window.ONEArcadeTest.inspect()?.snapshot?.phase==='prepare');await guest.waitForFunction(()=>window.ONEArcadeTest.inspect()?.snapshot?.phase==='prepare');
  await host.locator('[data-menu]').click();await host.locator('[data-exit]').click();await host.waitForSelector('.one3d-shell');
  assert.equal(await host.locator('.one-kart').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  fs.writeFileSync(output+'/results.json',JSON.stringify({passed:true,checks:['lobby selection','two-player start','first-person render','driving replicated to guest','bat hit replicated','390px mobile controls','menu','rematch','return to lobby'],controls,errors,missing},null,2));
  console.log('Kart browser checks passed:',output);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
