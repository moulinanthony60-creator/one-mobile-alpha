const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const {build}=require(process.env.ONE_ESBUILD_PATH||'esbuild');
test('two lobby peers launch, drive, hit, replay and leave through the actual arcade session',async()=>{
 const root=path.resolve(__dirname,'..');
 const output=await build({absWorkingDir:root,entryPoints:['ui/one-arcade-r198-session.js'],write:false,bundle:true,format:'iife',platform:'browser',plugins:[{name:'test-transport-and-renderer',setup(b){
  b.onResolve({filter:/three17-r46-coop\.js/},()=>({path:'lobby',namespace:'test'}));
  b.onResolve({filter:/one-(kart-view|arcade-r198-view)\.js/},()=>({path:'view',namespace:'test'}));
  b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='lobby'?`export const lobbyState=()=>window.mockLobby();export const setLobbyGameActive=v=>window.mockPlaying=v;export const resetLobbyReady=()=>{};`:`export const prepareView=async()=>{};export function createView(options){window.mockView={options,input:{x:0,z:0}};return {getInput:()=>window.mockView.input,update:s=>window.mockView.snapshot=s,inspect:()=>({}),replay:r=>window.mockView.replay=r,connection:()=>{},interrupt:s=>window.mockView.interrupted=s,dispose:()=>window.disposed++};}`}));
  b.onResolve({filter:/^\.\.?\//},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));
 }}]});
 let time=10;const peers=new Map(),queue=[];const roster=['alice','bob'].map((id,i)=>({id,name:id,session:crypto.randomUUID(),connected:true,ready:false}));
 for(const id of ['alice','bob']){
  const callbacks=new Set(),intervals=[],window={__ONE198_TEST__:true,mockPlaying:false,disposed:0,reopened:0,addEventListener(){},oneCloseSalon(){},ONEOpen3DLobby(){this.reopened++;},ONELobby3D:{close(){}},mockLobby(){return {roomId:'room',room:'Test',self:id,host:'alice',joined:true,isHost:id==='alice',playing:this.mockPlaying,players:roster.map(p=>({...p})),notice:''};}};
  window.ONEPartyGameLink={subscribe:f=>(callbacks.add(f),()=>callbacks.delete(f)),send(to,p){queue.push({from:id,to,p:structuredClone(p)});return true;},sendReliable(to,p){return this.send(to,p);}};
  const context=vm.createContext({window,document:{hidden:false},console,crypto,performance:{now:()=>time},setInterval:f=>intervals.push(f),clearInterval(){},structuredClone});
  vm.runInContext(output.outputFiles[0].text,context);peers.set(id,{window,callbacks,intervals});
 }
 const host=peers.get('alice').window,guest=peers.get('bob').window;
 async function flush(){for(let n=0;n<20;n++){await Promise.resolve();while(queue.length){const msg=queue.shift();for(const f of peers.get(msg.to).callbacks)void f(msg.from,msg.p);}await new Promise(resolve=>setImmediate(resolve));if(!queue.length&&n>3)break;}}
 async function tick(count=1){for(let i=0;i<count;i++){time+=50;for(const p of peers.values())for(const f of p.intervals)f();await flush();}}
 await tick();assert(host.ONEArcadeTest.select('kart'));await tick(12);assert.equal(guest.ONEArcadeTest.state().selection.game,'kart');
 host.ONEArcadeTest.ready();guest.ONEArcadeTest.ready();await tick();assert(host.ONEArcadeTest.state().canStart);
 const started=host.ONEArcadeTest.start();await flush();assert(await started);await tick(65);
 assert.equal(host.ONEArcadeTest.inspect().snapshot.phase,'play');assert.equal(guest.ONEArcadeTest.inspect().snapshot.phase,'play');
 host.mockView.input={x:0,z:1};guest.mockView.input={x:0,z:1};await tick(22);
 assert(host.ONEArcadeTest.inspect().snapshot.players.every(p=>p.speed>10));assert(guest.ONEArcadeTest.inspect().snapshot.players.every(p=>p.speed>10));
 const a=host.ONEArcadeTest.inspect().snapshot.players.find(p=>p.id==='alice');host.ONEArcadeTest.place('bob',{x:a.x+Math.cos(a.yaw)*2.6,z:a.z-Math.sin(a.yaw)*2.6});
 host.mockView.options.onAction({type:'bat',side:1});await flush();assert(guest.mockView.snapshot.events.some(e=>e.from==='alice'&&e.hit==='bob'));
 const original=guest.mockView.snapshot;queue.push({from:'alice',to:'bob',p:{game:'317',v:1,kind:'arcade198',op:'state',room:'room',round:guest.ONEArcadeTest.inspect().config.id,revision:999999,state:{...original,players:[]}}});await flush();assert.equal(guest.mockView.snapshot,original,'invalid snapshot ignored without advancing revision');
 host.ONEArcadeTest.finish();await flush();assert(host.mockView.snapshot.finished);assert(guest.mockView.snapshot.finished);
 const previous=host.ONEArcadeTest.inspect().config.id;host.mockView.options.onReplay();guest.mockView.options.onReplay();await flush();await tick();
 assert.notEqual(host.ONEArcadeTest.inspect().config.id,previous);assert.equal(guest.ONEArcadeTest.inspect().config.id,host.ONEArcadeTest.inspect().config.id);assert.equal(host.mockView.snapshot.phase,'prepare');
 host.mockView.options.onLeave();await flush();assert.equal(host.ONEArcadeTest.inspect(),null);assert.equal(host.reopened,1);assert(guest.mockView.interrupted.includes('hôte'));assert(host.disposed>=2);
});
