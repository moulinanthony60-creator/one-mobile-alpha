import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {VILLAGE_ATLASES,VILLAGE_ATLAS_SIZES,VILLAGE_SPRITES,VILLAGE_MASKS} from '../assets/village-v17/manifest.mjs';
import {decodeVillageMask,drawVillageSprite} from '../village-sprites.mjs';
import {frameVillage,project,unproject} from '../village-art.mjs';
import {createState,act,advance,restoreState} from '../engine.mjs';
import {PLOTS,findFreePlot} from '../village-state.mjs';
import {troopScale} from '../battle-aim.mjs';

test('compact artwork covers the complete build catalog, preserves hit masks and fits its decoded budget',()=>{
 assert.ok(VILLAGE_ATLAS_SIZES.reduce((n,[w,h])=>n+w*h*4,0)<25*1024*1024);
 for(const file of VILLAGE_ATLASES)assert.ok(existsSync(new URL('../'+file,import.meta.url)));
 for(const kind of Object.keys(PLOTS).filter(k=>k!=='wall'))assert.ok(VILLAGE_SPRITES[kind==='tree'?'sawmill':kind],kind);
 for(const [key,s]of Object.entries(VILLAGE_SPRITES)){
  const [x,y,w,h]=s.crop,[pageW,pageH]=VILLAGE_ATLAS_SIZES[s.page];assert.ok(x>=0&&y>=0&&x+w<=pageW&&y+h<=pageH,key);assert.ok(w>0&&h>0&&s.aspect>0);
  const mask=decodeVillageMask(VILLAGE_MASKS[key]);assert.equal(mask.length,96*96*4);assert.ok(mask.some(v=>v===255),key);
 }
 const sprite={image:{},crop:[10,20,100,200]};let args;drawVillageSprite({drawImage(...a){args=a;}},sprite,1,2,30,60);assert.deepEqual(args,[sprite.image,10,20,100,200,1,2,30,60]);
});
test('construction, completion and reload preserve buildings; home framing and touch projection stay usable',()=>{
 let s=createState(1800000000000);s.gold=20000;s.wood=20000;s.workers=3;s.buildings.castle=4;s.village.structures[0].level=4;
 for(const kind of ['mine','tree','cottage','barracks','camp','forge','shrine','cannon']){
  const ids=s.village.structures.map(p=>p.id),p=findFreePlot(s.village,kind,0,{x:kind==='mine'?-7:5,z:3});assert.ok(p);
  s=act(s,{type:'place-building',kind,...p},s.lastTick);assert.ok(s.village.structures.at(-1).pending);
  for(const id of ids)assert.ok(s.village.structures.some(p=>p.id===id));advance(s,s.lastTick+9000);assert.ok(s.village.structures.every(p=>!p.pending));
  const restored=restoreState(JSON.parse(JSON.stringify(s)),s.lastTick);for(const p of s.village.structures){const q=restored.village.structures.find(q=>q.id===p.id);assert.ok(q,p.id);for(const key of ['kind','x','z','level'])assert.equal(q[key],p[key],p.id+':'+key);}s=restored;
 }
 for(const [width,height]of [[390,700],[844,390],[1024,640]]){
  const c=frameVillage(s.village.structures,width,height,24);assert.ok(c.zoom>=.85);const screen=project(2,3,c,width,height),world=unproject(screen.x,screen.y,c,width,height);assert.ok(Math.abs(world.x-2)<1e-8&&Math.abs(world.z-3)<1e-8);
 }
});
test('new village and combat entry points request the changed modules instead of old cached versions',()=>{
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8'),battle=readFileSync(new URL('../bataille-3d.html',import.meta.url),'utf8');
 const imports=html=>JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
 assert.equal(imports(index)['./village-art.mjs?v=34'],'./village-art.mjs?v=17');assert.equal(imports(index)['./village-hud.mjs?v=34'],'./village-hud.mjs?v=17');assert.equal(imports(battle)['./battle-aim.mjs?v=3'],'./battle-aim.mjs?v=17');
 assert.match(index,/app\.mjs\?v=53/);assert.match(battle,/V18/);
 for(const kind of ['guardians','archers','mages'])assert.ok(troopScale(kind)<.65&&troopScale(kind)>.55);
});
