import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createTraining,TROOPS} from '../battle3d-sandbox.mjs';
import {VALDORIA_FIELD,createValdoriaFort} from '../battle-style-layout.mjs';
import {troopFrame,TROOP_SHEETS} from '../battle-style-art.mjs';
import {BATTLE_ATLASES,villageSpriteKey} from '../battle-village-assets.mjs';
import {CARTOON_CELLS} from '../cartoon-art.mjs';
import {FORTRESS_KEYS} from '../battle-fortress-art.mjs';
const training=()=>createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD});
test('the new base has 35 separate targets, connected partitions and complete artwork',()=>{
 const b=training().battle,keys=new Set([...FORTRESS_KEYS,'camp']);
 assert.equal(b.buildings.filter(p=>p.kind!=='wall').length,35);assert.equal(new Set(b.buildings.map(p=>p.id)).size,b.buildings.length);
 for(const p of b.buildings){assert.ok(p.x>=6&&p.x<=34&&p.y>=6&&p.y<=26);assert.ok(p.collision.width>0&&p.collision.depth>0);if(p.kind!=='wall')assert.ok(keys.has(villageSpriteKey(p)),p.kind);}
 const walls=b.buildings.filter(p=>p.kind==='wall');assert.ok(walls.length>=150);assert.ok(walls.some(p=>p.x===15&&p.y===16));assert.ok(walls.some(p=>p.y===12&&p.x===20));
 for(const file of Object.values(TROOP_SHEETS))assert.ok(existsSync(new URL('../'+file,import.meta.url)));
});
test('the large training field accepts its real edges and rejects the village and occupied cells',()=>{
 const t=training();for(const [x,y]of [[20,16],[8,8],[-1,1],[40,2],[4,32],[NaN,1]])assert.throws(()=>t.deploy('guardians',x,y));
 for(const [x,y]of [[2,16],[38,16],[20,2],[20,29]])t.deploy('guardians',x,y);
 assert.equal(t.count('guardians'),4);assert.equal(t.battle.units.length,4);
 // Ordinary campaigns and the previous test keep their original 20 × 16 field.
 const original=createTraining();assert.throws(()=>original.deploy('guardians',20,29));assert.equal(original.battle.field,undefined);
});
test('the army can finish the fortified base, without entering surviving footprints, and replay resets it',()=>{
 const t=training();let index=0;for(const troop of TROOPS)for(let i=0;i<troop.count;i++)t.deploy(troop.kind,16.5+(index++%9)*.9,28.4);
 for(let step=0;step<4600&&t.battle.phase==='active';step++){
  t.tick(1/30);
  if(step%10===0)for(const u of t.battle.units.filter(u=>u.hp>0))for(const b of t.battle.buildings.filter(b=>b.hp>0))assert.ok(Math.abs(u.x-b.x)>=b.collision.width/2-.05||Math.abs(u.y-b.y)>=b.collision.depth/2-.05,`Troop ${u.id} inside ${b.id}`);
 }
 assert.deepEqual(t.score,{percent:100,stars:3});assert.ok(t.battle.elapsed<150);assert.equal(t.battle.settled,true);
 t.reset();assert.equal(t.battle.units.length,0);assert.equal(t.battle.field.width,40);assert.equal(t.count('guardians'),8);assert.ok(t.battle.buildings.every(p=>p.hp===p.maxHp));
});
test('sprites face their movement, use both walking steps and keep registered walk poses',()=>{
 assert.deepEqual(troopFrame({dx:1,dz:0,moving:false,attacking:false,distance:0}),{index:1,flip:false});
 assert.deepEqual(troopFrame({dx:0,dz:-1,moving:false,attacking:true,distance:0}),{index:5,flip:false});
 assert.equal(troopFrame({dx:-1,dz:0,moving:true,attacking:false,distance:0}).flip,true);
 const columns=new Set(Array.from({length:20},(_,i)=>troopFrame({dx:1,dz:0,moving:true,attacking:false,distance:i/10}).index));assert.ok(columns.has(1)&&columns.has(2));
 assert.equal(troopFrame({dx:1,dz:0,moving:true,attacking:true,distance:1,reduced:true}).index,1);
});

// DOM wiring check. It executes the app and simulation, replacing only the
// drawing surface and DOM; browser layout and touchscreen behavior are separate.
test('the real battle page wires selection, deployment, spells, help, pause and replay',async()=>{
 class Element{constructor(){this.listeners=new Map();this.attributes={};this.dataset={};this.children=[];this.open=false;this.style={setProperty(){}};this.classList={toggle(){},add(){},remove(){}};}addEventListener(k,f){this.listeners.set(k,f);}removeEventListener(k){this.listeners.delete(k);}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}click(){if(!this.disabled)this.listeners.get('click')?.({});}focus(){}setPointerCapture(){}showModal(){this.open=true;}close(){this.open=false;}replaceChildren(...children){this.children=children;}}
 const html=readFileSync(new URL('../bataille-3d.html',import.meta.url),'utf8'),ids=new Map();
 for(const m of html.matchAll(/\bid="([^"]+)"/g)){assert.ok(!ids.has(m[1]),'duplicate ID');ids.set(m[1],new Element());}
 ids.get('stars').children=Array.from({length:3},()=>new Element());
 const controls=TROOPS.map(t=>{const e=new Element();e.dataset.unit=t.kind;return e;}),counts=new Map(TROOPS.map(t=>[t.kind,new Element()]));
 const doc=new Element();doc.documentElement=new Element();doc.hidden=false;doc.createElement=()=>new Element();doc.querySelectorAll=s=>s==='[data-unit]'?controls:[];
 doc.querySelector=s=>{if(s.startsWith('#')){if(s.includes(' '))return new Element();assert.ok(ids.has(s.slice(1)),`Missing ${s} in page`);return ids.get(s.slice(1));}if(s.startsWith('[data-count'))return counts.get(s.match(/"([^"]+)"/)[1]);if(s==='.art-note')return new Element();throw Error(s);};
 const win=new Element();win.innerHeight=393;win.visualViewport={height:393,scale:1,addEventListener(){},removeEventListener(){}};
 const globals=['document','window','requestAnimationFrame','cancelAnimationFrame','StyleTestView'],saved=globals.map(k=>[k,globalThis[k]]);let current,frame;
 globalThis.document=doc;globalThis.window=win;globalThis.requestAnimationFrame=f=>(frame=f,1);globalThis.cancelAnimationFrame=()=>{};
 globalThis.StyleTestView=(_canvas,battle)=>{current=battle;return {artStatus:{terrain:true,troops:true},loadVillage:async()=>true,frame(b){current=b;},reset(b){current=b;},point:(x,y)=>({x,y}),mark(){},pan(){},zoom(){},home(){},quality(){},dispose(){}};};
 try{
  const url=new URL('../battle3d-app.mjs',import.meta.url);let source=readFileSync(url,'utf8').replace("import {createVillageScene} from './battle-village-scene.mjs?v=9';",'const createVillageScene=globalThis.StyleTestView;');source=source.replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,url).href}'`);
  await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  assert.equal(ids.get('army-total').textContent,17);assert.equal(ids.get('targets-total').textContent,35);
  ids.get('deploy-south').click();assert.equal(current.units.length,1);assert.equal(current.units[0].y,28.4);assert.equal(ids.get('army-total').textContent,16);
  controls[1].click();ids.get('deploy-south').click();assert.equal(current.units[1].kind,'archers');
  ids.get('spell').click();const canvas=ids.get('battle-canvas');canvas.listeners.get('pointerdown')({button:0,pointerId:1,clientX:20,clientY:16});canvas.listeners.get('pointerup')({button:0,pointerId:1,clientX:20,clientY:16});assert.equal(current.spells,1);
  ids.get('pause').click();assert.equal(ids.get('pause-dialog').open,true);assert.equal(ids.get('deploy-south').disabled,true);ids.get('resume').click();assert.equal(ids.get('pause-dialog').open,false);
  ids.get('help').click();assert.equal(ids.get('intro').open,true);ids.get('start').click();assert.equal(ids.get('intro').open,false);
  ids.get('pause').click();ids.get('restart-pause').click();assert.equal(current.units.length,0);assert.equal(current.spells,2);assert.equal(ids.get('army-total').textContent,17);
  frame(1000);win.listeners.get('pagehide')({persisted:false});
 }finally{for(const[k,v]of saved){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
