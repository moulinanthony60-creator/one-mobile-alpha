import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBattleView} from '../battle-view.mjs';
import {projectBattle,unprojectBattle} from '../battle-village-scene.mjs';
import {createTraining} from '../battle3d-sandbox.mjs';

function surface(){const listeners=new Map();return {hidden:false,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),lose(){listeners.get('webglcontextlost')?.({preventDefault(){}});}};}
function renderer(){return {frames:0,disposed:false,async loadVillage(){return true;},frame(){this.frames++;},resize(){},quality(){},reset(){},dispose(){this.disposed=true;},point(x,y){return {x,y};},mark(){},pan(){},zoom(){},home(){}};}

test('opening and playing the Village never loads or constructs WebGL',async()=>{
  const training=createTraining(),before=structuredClone(training.battle),village=renderer();let loads=0;
  const a=surface(),b=surface(),view=createBattleView(a,b,training.battle,{createVillage:()=>village,load3D:()=>{loads++;throw Error('WebGL must stay optional');}});
  assert.equal(await view.loadVillage(),true);view.frame(training.battle,0,false);assert.equal(loads,0);assert.equal(view.mode,'village');assert.equal(a.hidden,false);assert.equal(b.hidden,true);assert.deepEqual(training.battle,before);
  training.deploy('guardians',10,14);training.tick(.1);view.frame(training.battle,.1);assert.equal(training.battle.units.length,1);assert.equal(loads,0);
  view.dispose();assert.equal(village.disposed,true);
});

test('module errors, renderer errors and lost contexts preserve the live battle in Village',async()=>{
  for(const failure of ['import','constructor','first-frame','runtime','context','timeout']){
    const training=createTraining();training.deploy('archers',10,14);training.tick(.1);const before=structuredClone(training.battle),village=renderer(),three=renderer(),a=surface(),b=surface();let fallback=0;
    const view=createBattleView(a,b,training.battle,{createVillage:()=>village,timeout:5,onFallback:()=>fallback++,load3D:async()=>{
      if(failure==='import')throw Error('Missing optional 3D module');
      if(failure==='timeout')return new Promise(()=>{});
      return {createScene(){if(failure==='constructor')throw Error('WebGL unavailable');if(failure==='first-frame')three.frame=()=>{throw Error('Renderer failed');};return three;}};
    }});
    const opened=await view.style('3d');
    if(failure==='context'){assert.equal(opened,true);b.lose();}else if(failure==='runtime'){assert.equal(opened,true);three.frame=()=>{throw Error('Failure during combat');};view.frame(training.battle,.03);}else assert.equal(opened,false);
    assert.equal(fallback,1,failure);assert.equal(view.mode,'village');assert.equal(view.canvas,a);assert.equal(a.hidden,false);assert.equal(b.hidden,true);assert.equal(village.disposed,false);assert.deepEqual(training.battle,before);
    view.frame(training.battle,.03);assert.equal(village.frames>0,true);view.dispose();
  }
});

test('leaving while optional 3D loads cannot resurrect a disposed renderer',async()=>{
  const village=renderer();let resolve,constructed=0;
  const view=createBattleView(surface(),surface(),createTraining().battle,{createVillage:()=>village,load3D:()=>new Promise(r=>{resolve=r;})});
  const pending=view.style('3d');view.dispose();resolve({createScene(){constructed++;return renderer();}});assert.equal(await pending,false);assert.equal(constructed,0);
});

test('village touch projection remains exact across phone sizes, pan and zoom',()=>{
  for(const width of [320,393,768])for(const zoom of [.9,1.12,3.2])for(const [x,z]of [[1,1],[10,14.4],[18,8]]){
    const camera={width,height:430,x:12,z:7,tile:width/19.2,zoom},p=projectBattle(x,z,camera),actual=unprojectBattle(p.x,p.y,camera);
    assert.ok(Math.abs(actual.x-x)<1e-10);assert.ok(Math.abs(actual.y-z)<1e-10);
  }
});

test('default startup has no static dependency on Three or the WebGL scene',()=>{
  const seen=new Set();
  function visit(url){if(seen.has(url.pathname))return;seen.add(url.pathname);assert.ok(!url.pathname.includes('/vendor/three'),url.pathname);assert.ok(!url.pathname.endsWith('/battle3d-scene.mjs'),url.pathname);
    const source=readFileSync(url,'utf8');for(const match of source.matchAll(/(?:import|export)\s+(?:[^;'"\n]+?\s+from\s+)?['"]([^'"]+)['"]/g))if(match[1].startsWith('.'))visit(new URL(match[1],url));
  }
  visit(new URL('../battle3d-app.mjs',import.meta.url));
});
