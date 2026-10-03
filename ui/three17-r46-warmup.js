import * as THREE from './three.module.js?v=appels-v52';
const breathe=()=>new Promise(resolve=>setTimeout(resolve,0));
// Upload a few maps per turn and compile all visible materials before enabling play.
export async function prepareScene(renderer,scene,camera,alive=()=>true){
 const textures=new Set();
 scene.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);});
 let n=0;
 for(const texture of textures){if(!alive())return;renderer.initTexture(texture);if(++n%3===0)await breathe();}
 if(!alive())return;
 if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
 await breathe();if(!alive())return;
 // First-use vertex uploads also happen here, including meshes behind closed doors.
 const culled=[],target=new THREE.WebGLRenderTarget(32,32),before=renderer.getRenderTarget();
 try{
  scene.traverse(o=>{if(o.isMesh){culled.push([o,o.frustumCulled]);o.frustumCulled=false;}});
  renderer.setRenderTarget(target);renderer.render(scene,camera);
 }finally{renderer.setRenderTarget(before);for(const [o,value] of culled)o.frustumCulled=value;target.dispose();}
}



