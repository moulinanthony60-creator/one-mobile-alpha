import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {createCastle,createCottage,createGuardian,animateGuardian,mergeStatic,createGarden,createDummy} from '../atelier/modeles.mjs';
function inspect(root){let triangles=0,draws=0;root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;draws++;const g=o.geometry;triangles+=(g.index?.count||g.attributes.position.count)/3;assert.ok([...o.matrixWorld.elements].every(Number.isFinite));for(const attribute of ['position','normal'])assert.ok([...g.attributes[attribute].array].every(Number.isFinite));g.computeBoundingSphere();assert.ok(Number.isFinite(g.boundingSphere.radius));});return {triangles,draws};}
test('models have valid geometry and a bounded mobile scene budget',()=>{
 const roots=[mergeStatic(createCastle().group),mergeStatic(createCottage().group),createGuardian().group,mergeStatic(createGarden()),mergeStatic(createDummy())];let triangles=0,draws=0;
 for(const root of roots){const result=inspect(root);triangles+=result.triangles;draws+=result.draws;}
 assert.ok(triangles<220000,`triangles: ${triangles}`);assert.ok(draws<=36,`draws: ${draws}`);
});
test('the guardian walks, strikes and recovers continuously without corrupting the rig',()=>{
 const rig=createGuardian();let impacts=0;const points=[];
 for(const mode of ['idle','walk','attack'])for(let frame=0;frame<=80;frame++){
  const state=animateGuardian(rig,frame/40,mode);rig.group.updateMatrixWorld(true);if(mode==='attack'&&state.impact)impacts++;
  rig.group.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
  const tip=rig.sword.localToWorld(new THREE.Vector3(0,1.2,0));assert.ok(tip.length()<4);if(mode==='attack')points.push(tip);
 }
 assert.ok(impacts>0);assert.ok(points.some(p=>p.distanceTo(points[0])>.8));
 animateGuardian(rig,1.65-1e-6,'attack');rig.group.updateMatrixWorld(true);const before=rig.sword.localToWorld(new THREE.Vector3(0,1.2,0));animateGuardian(rig,1.65+1e-6,'attack');rig.group.updateMatrixWorld(true);assert.ok(before.distanceTo(rig.sword.localToWorld(new THREE.Vector3(0,1.2,0)))<.002);
 animateGuardian(rig,0,'walk');const first=rig.legs[0].thigh.rotation.x;animateGuardian(rig,.2,'walk');assert.notEqual(rig.legs[0].thigh.rotation.x,first);
 animateGuardian(rig,3,'attack',true);assert.equal(rig.sword.rotation.x,0);assert.equal(rig.legs[0].thigh.rotation.x,0);
});
// Real scene graph, camera and animation code; WebGL is replaced. No GPU/FPS claim.
async function harness({fail=false,economy=false}={}){
 const saved=new Map(['document','window','ResizeObserver','requestAnimationFrame','cancelAnimationFrame','AtelierTestRenderer'].map(k=>[k,globalThis[k]]));let frame,observer,rendered,renderer;
 const gradient={addColorStop(){}};const ctx=new Proxy({createRadialGradient:()=>gradient},{get:(target,key)=>target[key]||(()=>{})});
 globalThis.document={hidden:false,createElement:()=>({width:0,height:0,getContext:()=>ctx})};globalThis.window={devicePixelRatio:3,matchMedia:()=>({matches:false})};globalThis.ResizeObserver=class{constructor(){observer=this;}observe(){}disconnect(){this.disconnected=true;}};globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{frame=null;};
 globalThis.AtelierTestRenderer=class{constructor(options){this.options=options;renderer=this;this.shadowMap={};this.info={render:{calls:0,triangles:0}};}setPixelRatio(n){this.ratio=n;}setSize(){}dispose(){this.disposed=true;}render(scene,camera){if(fail)throw Error('GPU failure');scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);assert.ok(camera.projectionMatrix.elements.every(Number.isFinite));assert.ok(camera.top>0);rendered={scene,camera};}};
 const url=new URL('../atelier/scene.mjs',import.meta.url);let source=readFileSync(url,'utf8').replace("import * as THREE from '../vendor/three.module.js';","import * as ActualTHREE from '../vendor/three.module.js';const THREE={...ActualTHREE,WebGLRenderer:globalThis.AtelierTestRenderer};").replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,url).href}'`);
 const {createAtelier}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')+'#'+Number(fail)+Number(economy));
 const canvas={width:393,height:470,getBoundingClientRect(){return {width:this.width,height:this.height};}};
 return {start:()=>createAtelier(canvas,{economy}),get renderer(){return renderer;},get observer(){return observer;},canvas,get rendered(){return rendered;},tick(t){frame?.(t);},restore(){for(const[k,v]of saved){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}
test('scene starts in eco before first frame, supports all controls and releases resources',async()=>{
 const h=await harness({economy:true});try{
  const view=h.start();assert.equal(h.renderer.options.antialias,false);assert.equal(h.renderer.ratio,1);assert.equal(h.renderer.shadowMap.enabled,false);
  for(const [width,height] of [[320,370],[393,470],[800,280]]){h.canvas.width=width;h.canvas.height=height;view.quality(true);for(const f of ['ensemble','chateau','maison','gardien']){view.focus(f);for(let i=0;i<30;i++)h.tick(i*33);}}
  for(const mode of ['walk','attack','idle']){view.motion(mode);for(let i=0;i<60;i++)h.tick(i*33);}
  view.orbit(35,20);view.zoom(1.2);view.pause(true);h.tick(2500);view.pause(false);view.home();view.quality(false);assert.equal(h.renderer.ratio,1.6);assert.equal(h.renderer.shadowMap.enabled,true);
  inspect(h.rendered.scene);view.dispose();view.dispose();assert.equal(h.renderer.disposed,true);assert.equal(h.observer.disconnected,true);
 }finally{h.restore();}
});
test('startup releases the renderer when the first render fails',async()=>{
 const h=await harness({fail:true});try{assert.throws(()=>h.start(),/GPU failure/);assert.equal(h.renderer.disposed,true);assert.equal(h.observer.disconnected,true);}finally{h.restore();}
});
test('the reference scene does not import village saves or the combat simulation',()=>{
 const seen=new Set();function visit(url){if(seen.has(url.pathname)||url.pathname.includes('/vendor/'))return;seen.add(url.pathname);const source=readFileSync(url,'utf8');assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|fetch\(/);for(const m of source.matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g))if(m[1].startsWith('.')){assert.doesNotMatch(m[1],/engine|sandbox|simulation/);visit(new URL(m[1],url));}}
 visit(new URL('../atelier/app.mjs',import.meta.url));
});
