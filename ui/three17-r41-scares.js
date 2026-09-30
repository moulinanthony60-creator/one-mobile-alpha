import * as THREE from './three.module.js';
import { clone } from './SkeletonUtils.js';

export function createScareEffects(shell,renderer,monster,audio,reducedMotion){
  const layer=document.createElement('div');layer.className='three17-scare';layer.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.alt='';layer.append(image);shell.append(layer);
  let ready=false,disposed=false,ended=false,timer=null,last=-100,count=0,opened=0;
  const used=new Set();let seed=(Date.now()^31741)>>>0;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  let nextOpening=2+Math.floor(random()*3);
  function prepare(){
    if(disposed||ready)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x040303);
    const copy=clone(monster);copy.position.set(0,0,0);copy.rotation.set(0,0,0);copy.visible=true;scene.add(copy);copy.updateMatrixWorld(true);
    const head=copy.getObjectByName('Head');if(!head)return;
    const center=head.getWorldPosition(new THREE.Vector3());center.y-=.04;
    const camera=new THREE.PerspectiveCamera(42,1,.02,10);camera.position.copy(center).add(new THREE.Vector3(.045,.035,-.75));camera.lookAt(center);
    scene.add(new THREE.HemisphereLight(0xa4b2bd,0x110c0a,.35));
    const lamp=new THREE.PointLight(0xffd5aa,7,3,2);lamp.position.copy(camera.position).add(new THREE.Vector3(-.22,-.14,-.15));scene.add(lamp);
    const rim=new THREE.PointLight(0x799496,3,2,2);rim.position.copy(center).add(new THREE.Vector3(.3,.3,.2));scene.add(rim);
    const size=512,target=new THREE.WebGLRenderTarget(size,size),previous=renderer.getRenderTarget();
    try{
      renderer.setRenderTarget(target);renderer.render(scene,camera);
      const rgba=new Uint8Array(size*size*4);renderer.readRenderTargetPixels(target,0,0,size,size,rgba);
      const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),frame=ctx.createImageData(size,size);
      for(let y=0;y<size;y++)frame.data.set(rgba.subarray((size-y-1)*size*4,(size-y)*size*4),y*size*4);
      ctx.putImageData(frame,0,0);image.src=canvas.toDataURL('image/jpeg',.88);ready=true;
    }finally{renderer.setRenderTarget(previous);target.dispose();copy.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});scene.clear();}
  }
  function show(){
    if(!ready||disposed||ended)return false;
    clearTimeout(timer);layer.classList.remove('show');void layer.offsetWidth;layer.classList.add('show');audio.scare();count++;
    timer=setTimeout(()=>layer.classList.remove('show'),reducedMotion?500:850);return true;
  }
  function furniture(id,seconds){
    if(used.has(id)||ended||disposed)return false;used.add(id);opened++;
    if(!ready||seconds<15||seconds-last<48||count>=3||opened<nextOpening)return false;
    last=seconds;nextOpening=opened+2+Math.floor(random()*4);return show();
  }
  return {prepare,furniture,finish(){ended=true;clearTimeout(timer);layer.classList.remove('show');},
    inspect:()=>({ready,count,opened,last}),
    ...(window.__ONE317_TEST__===true?{preview:show}:{}),
    dispose(){disposed=true;clearTimeout(timer);image.removeAttribute('src');layer.remove();}
  };
}
