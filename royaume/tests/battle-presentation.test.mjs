import test from 'node:test';
import assert from 'node:assert/strict';
import {fitBattleCamera} from '../battle-camera.mjs';
import {projectBattle,unprojectBattle} from '../battle-village-scene.mjs';
import {createCombatAudio} from '../battle-audio.mjs';
import {VOLUME_TILE,VOLUME_FILES} from '../battle-volume-atlas.mjs';
import {existsSync} from 'node:fs';
test('landscape framing keeps the fort clear of the timer and troop bar, with exact touch projection after pan and zoom',()=>{
 const field={width:40,height:32};
 for(const [width,height]of [[844,390],[1024,576],[1440,900],[390,720]]){
  const fit=fitBattleCamera(width,height,field),camera={...fit,width,height,zoom:1};
  assert.ok(Number.isFinite(camera.tile)&&camera.tile>0);
  if(width>height)for(const [x,z]of [[7,6],[33,6],[7,26],[33,26]]){const p=projectBattle(x,z,camera);assert.ok(p.x>0&&p.x<width);assert.ok(p.y>65&&p.y<height-86);}
  for(const zoom of [.75,1,3.2])for(const [x,z]of [[3,3],[20,16],[37,29]]){camera.zoom=zoom;camera.x=18.2;camera.z=19.7;const p=projectBattle(x,z,camera),q=unprojectBattle(p.x,p.y,camera);assert.ok(Math.abs(q.x-x)<1e-9&&Math.abs(q.y-z)<1e-9);}
 }
});
test('production troop atlases remain below 48 MiB decoded and all three roles have matching portraits',()=>{
 const decoded=VOLUME_TILE.width*16*VOLUME_TILE.height*22*4*Object.keys(VOLUME_FILES).length;
 assert.ok(decoded<48*1024*1024);
 for(const file of Object.values(VOLUME_FILES)){assert.ok(existsSync(new URL('../'+file,import.meta.url)));assert.ok(existsSync(new URL('../'+file.replace('-volume-','-portrait-'),import.meta.url)));}
});
test('audio is opt-in, deduplicates shots, suspends on pause and releases its context',async()=>{
 let made=0,played=0,closed=0;const previous=globalThis.AudioContext;
 class Audio{constructor(){made++;this.state='suspended';this.currentTime=0;this.destination={};}async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){closed++;this.state='closed';}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){played++;},stop(){this.onended();}};}}
 globalThis.AudioContext=Audio;
 try{const audio=createCombatAudio(),battle={effects:[{visualId:1,style:'cannon'}]};audio.sync(battle);assert.equal(made,0);await audio.toggle();assert.equal(made,1);audio.reset();audio.sync(battle);const count=played;audio.sync(battle);assert.equal(played,count);audio.suspend();audio.sync({effects:[{visualId:2,style:'arrow'}]});assert.equal(played,count);await audio.toggle();audio.dispose();assert.equal(closed,1);}finally{if(previous===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=previous;}
});
