import test from 'node:test';
import assert from 'node:assert/strict';
import {loadArtImage,spritePlacement,villageSpriteKey,villageScenery,BATTLE_ATLASES,VILLAGE_CAMERA} from '../battle3d-village-art.mjs';
import {CARTOON_FILES,CARTOON_CELLS} from '../cartoon-art.mjs';
import {createTrainingFort} from '../battle3d-layout.mjs';
import {existsSync} from 'node:fs';

class FakeImage {
  static latest;
  constructor(){FakeImage.latest=this;}
  set src(value){this.url=value;}
}

test('artwork can load, fail, time out or be cancelled without a dangling image handler',async()=>{
  let pending=loadArtImage('village.webp',null,FakeImage,100);
  let image=FakeImage.latest;image.onload();assert.equal(await pending,image);assert.equal(image.onload,null);assert.equal(image.onerror,null);
  pending=loadArtImage('missing.webp',null,FakeImage,100);
  image=FakeImage.latest;const missing=assert.rejects(pending,/indisponibles/);image.onerror();await missing;assert.equal(image.url,'');assert.equal(image.onerror,null);
  pending=loadArtImage('slow.webp',null,FakeImage,5);
  image=FakeImage.latest;await assert.rejects(pending,/trop de temps/);assert.equal(image.onload,null);assert.equal(image.url,'');
  const controller=new AbortController();pending=loadArtImage('cancelled.webp',controller.signal,FakeImage,100);
  image=FakeImage.latest;const cancelled=assert.rejects(pending,/annulé/);controller.abort();await cancelled;assert.equal(image.onload,null);assert.equal(image.url,'');
  await assert.rejects(loadArtImage('already-cancelled.webp',controller.signal,FakeImage),/annulé/);
});

test('the original village atlases cover every fort building and keep deployment clear',()=>{
  const available=new Set(BATTLE_ATLASES.flatMap(atlas=>CARTOON_CELLS[atlas]));
  for(const atlas of BATTLE_ATLASES)assert.ok(existsSync(new URL('../'+CARTOON_FILES[atlas],import.meta.url)));
  for(const b of createTrainingFort().filter(b=>b.kind!=='wall')){
    assert.ok(available.has(villageSpriteKey(b)),b.kind);
    const placement=spritePlacement(b,1.2);assert.ok(Object.values(placement).every(v=>Number.isFinite(v)&&v>0));
    // Painted foundation follows exactly the village's isometric ground projection.
    const angle=Math.atan2(VILLAGE_CAMERA[1],Math.hypot(VILLAGE_CAMERA[0],VILLAGE_CAMERA[2]));
    assert.ok(Math.abs(placement.front*Math.sin(angle)-(b.collision.width+b.collision.depth)*Math.SQRT2/8)<1e-8);
  }
  for(const item of villageScenery()){
    assert.ok(available.has(item.key));assert.ok([item.x,item.z,item.width].every(Number.isFinite));
    if(item.key==='spruce'||item.key==='oak')assert.ok(Math.abs(item.x)>=12.3||Math.abs(item.z)>=10.6);
  }
});
