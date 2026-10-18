import * as THREE from './vendor/three.module.js';
import {loadPaintedMaterials,paintMaterial} from './village-materials.mjs?v=4';
export {loadPaintedMaterials};
import {createBuilding,createVillager} from './village-models.mjs?v=4';
import {GRID_SIZE,footprint,placementError,findFreePlot} from './village-state.mjs?v=4';

import {createLandscape,instanceGroup} from './village-landscape.mjs?v=4';

export function createVillageView(container,initial,{onSelect=()=>{},onPlacement=()=>{},onError=()=>{},onReady=()=>{},onFrame=()=>{}}={}){
 let state=initial,dead=false,frame=0,signature='',selected=null,placement=null,ghost=null,showGrid=false,last=0;
 const mobile=matchMedia('(pointer:coarse)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?2:2));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 container.replaceChildren(renderer.domElement);renderer.domElement.setAttribute('aria-label','Village en 3D. Touchez un bâtiment pour le sélectionner, glissez pour déplacer la caméra.');renderer.domElement.tabIndex=0;
 const canvas=renderer.domElement,scene=new THREE.Scene();scene.background=new THREE.Color('#778d87');scene.fog=new THREE.Fog('#778d87',85,170);
 const camera=new THREE.OrthographicCamera(-25,25,20,-20,.1,200),center=new THREE.Vector3(-.8,1.2,1);let azimuth=Math.PI/4,zoom=1,viewSize=29;
 const ambient=new THREE.HemisphereLight(0xe4ebff,0x494640,1.7);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xffe8c2,2.15);sun.position.set(-12,42,23);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:110});sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;sun.shadow.radius=2.8;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xc6d8ff,.65);fill.position.set(20,14,-25);scene.add(fill);
 const buildings=new THREE.Group(),buildingRender=new THREE.Group(),effects=new THREE.Group(),animations=new THREE.Group();scene.add(buildingRender,effects,animations);
 const landscape=createLandscape();scene.add(landscape.root);
 const animated=[],smokes=[],flares=[];
 const stamp=document.createElement('canvas');stamp.width=stamp.height=128;const sc=stamp.getContext('2d'),gradient=sc.createRadialGradient(64,64,8,64,64,63);gradient.addColorStop(0,'rgba(27,26,35,.42)');gradient.addColorStop(.6,'rgba(27,26,35,.14)');gradient.addColorStop(1,'rgba(20,25,8,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);
 const contactTexture=new THREE.CanvasTexture(stamp),contactMat=new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),contactGeo=new THREE.PlaneGeometry(1,1);
 const baseGeo=new THREE.BoxGeometry(1,.04,1),baseMat=new THREE.MeshStandardMaterial({color:0x9c947f,roughness:1});
 function animatedParent(o){for(let p=o;p;p=p.parent)if(p.userData.spin)return true;return false;}
 function rebuildBatches(){
  for(const o of buildingRender.children)o.dispose?.();buildingRender.clear();animations.clear();effects.clear();animated.length=0;smokes.length=0;flares.length=0;
  buildings.updateMatrixWorld(true);
  const source=new THREE.Group();
  for(const m of buildings.children){if(m.userData.plotId===placement?.id)continue;
   m.traverse(o=>{if(!o.userData.spin)return;let parent=o.parent;while(parent){if(parent.userData.spin)return;parent=parent.parent;}const copy=o.clone(true);o.matrixWorld.decompose(copy.position,copy.quaternion,copy.scale);copy.userData.restRotation=copy.rotation.clone();copy.userData.restScale=copy.scale.clone();animations.add(copy);animated.push(copy);if(o.userData.spin==='flame'){const glow=new THREE.Sprite(glowWarm);glow.position.copy(copy.position);glow.scale.set(.7,.85,1);effects.add(glow);flares.push({glow,phase:copy.position.x*3});}});
   const plot=state.village.structures.find(p=>p.id===m.userData.plotId),f=footprint(plot.kind,plot.rotation);
   if(['shrine','reservoir'].includes(plot.kind)){const glow=new THREE.Sprite(glowCool);glow.position.set(m.position.x,plot.kind==='shrine'?1.7:1.5,m.position.z);glow.scale.set(1.9,2.3,1);effects.add(glow);}
   if(['castle','forge'].includes(plot.kind)){const light=new THREE.PointLight(0xffb958,4.5,5,2);light.position.set(m.position.x,1.8,m.position.z+f.d*.45);effects.add(light);}
   const shadow=new THREE.Mesh(contactGeo,contactMat);shadow.rotation.x=-Math.PI/2;shadow.position.set(m.position.x,.018,m.position.z);shadow.scale.set(f.w*1.5,f.d*1.5,1);source.add(shadow);
   if(plot.kind!=='wall'){const base=new THREE.Mesh(baseGeo,baseMat);base.position.set(m.position.x,.002,m.position.z);base.scale.set(f.w+.14,1,f.d+.14);base.receiveShadow=true;source.add(base);}
   if(['forge','cottage'].includes(plot.kind)){for(let i=0;i<4;i++){const puff=new THREE.Sprite(smokeMaterial);puff.position.set(m.position.x+.5,3+i*.35,m.position.z-.2);puff.scale.setScalar(.28+i*.08);effects.add(puff);smokes.push({puff,x:m.position.x+.5,z:m.position.z-.2,phase:i/4});}}
  }
  instanceGroup(buildings,buildingRender,o=>animatedParent(o)||(()=>{let p=o;while(p){if(placement?.id&&p.userData.plotId===placement.id)return true;p=p.parent;}return false;})());
  instanceGroup(source,buildingRender);source.clear();
 }
 const smokeCanvas=document.createElement('canvas');smokeCanvas.width=smokeCanvas.height=64;const smokeCtx=smokeCanvas.getContext('2d'),sg=smokeCtx.createRadialGradient(32,32,1,32,32,31);sg.addColorStop(0,'rgba(202,193,168,.5)');sg.addColorStop(1,'rgba(202,193,168,0)');smokeCtx.fillStyle=sg;smokeCtx.fillRect(0,0,64,64);const smokeTexture=new THREE.CanvasTexture(smokeCanvas),smokeMaterial=new THREE.SpriteMaterial({map:smokeTexture,transparent:true,depthWrite:false,opacity:.5});
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gc=glowCanvas.getContext('2d'),gl=gc.createRadialGradient(32,32,1,32,32,32);gl.addColorStop(0,'rgba(255,255,255,.7)');gl.addColorStop(.22,'rgba(255,255,255,.3)');gl.addColorStop(1,'rgba(255,255,255,0)');gc.fillStyle=gl;gc.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glowCanvas),glowWarm=new THREE.SpriteMaterial({map:glowTexture,color:0xff9d32,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.65}),glowCool=new THREE.SpriteMaterial({map:glowTexture,color:0x46c8ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.38});
 const grid=new THREE.GridHelper(GRID_SIZE,GRID_SIZE,0xe4f3ba,0xe4f3ba);grid.position.set(0,.055,0);grid.material.transparent=true;grid.material.opacity=.26;grid.visible=false;scene.add(grid);
 const outline=new THREE.Group();scene.add(outline);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),point=new THREE.Vector3();
 const movers=[];
 for(let i=0;i<12;i++){const person=createVillager([0xe8b474,0x67a9bb,0xba76b5,0xc2b26e,0x729dc3][i%5]);person.scale.setScalar(.72);scene.add(person);movers.push({person,phase:i*1.7});}
 function clearOutline(){const ms=new Set();for(const o of outline.children){o.geometry?.dispose();if(o.material)ms.add(o.material);}ms.forEach(m=>m.dispose());outline.clear();}
 function frameOutline(x,z,w,d,color,fill=false){clearOutline();const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthTest:true});for(const [bw,bd,bx,bz]of [[w,.09,0,-d/2],[w,.09,0,d/2],[.09,d,-w/2,0],[.09,d,w/2,0]]){const b=new THREE.Mesh(new THREE.BoxGeometry(bw,.045,bd),m);b.position.set(x+bx,.09,z+bz);outline.add(b);}if(fill){const f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.22,depthWrite:false}));f.rotation.x=-Math.PI/2;f.position.set(x,.07,z);outline.add(f);}}
 function paintBuilding(model){model.traverse(o=>{if(!o.isMesh||!o.material||Array.isArray(o.material))return;const m=o.material;if((m.emissive?.getHex()&&m.emissiveIntensity>.1)||m.metalness>.3)return;let family=m.userData.surface;const hsl={};m.color.getHSL(hsl);if(!family){if(hsl.s<.28&&hsl.l>.12&&hsl.l<.75)family='stone';else if(hsl.h>.035&&hsl.h<.13&&hsl.s>.23&&hsl.l<.48)family='wood';}paintMaterial(m,family);});}
 function levelOf(p){return p.essential?state.buildings[p.id]:p.level;}
 function makeModel(p){const model=createBuilding(p.kind,levelOf(p));paintBuilding(model);const f=footprint(p.kind,p.rotation);model.position.set(p.x+(f.w-1)/2,0,p.z+(f.d-1)/2);model.rotation.y=-p.rotation*Math.PI/2;model.userData.plotId=p.id;buildings.add(model);return model;}
 function sync(s){state=s;const key=JSON.stringify([state.village.structures,state.buildings,state.build?.id]);if(signature===key)return;signature=key;buildings.clear();for(const p of state.village.structures)makeModel(p);if(placement?.id){const model=buildings.children.find(c=>c.userData.plotId===placement.id);if(model)model.visible=false;}rebuildBatches();if(selected&&!placement)select(selected,false);}
 function resize(){if(dead)return;const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);viewSize=Math.max(23,24/(w/h));const aspect=w/h;camera.left=-viewSize*aspect/2;camera.right=viewSize*aspect/2;camera.top=viewSize/2;camera.bottom=-viewSize/2;camera.zoom=zoom;camera.updateProjectionMatrix();updateCamera();}
 function updateCamera(){camera.position.set(center.x+Math.sin(azimuth)*36,43,center.z+Math.cos(azimuth)*36);camera.lookAt(center);camera.updateMatrixWorld();}
 function ground(clientX,clientY){const r=canvas.getBoundingClientRect();pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.ray.intersectPlane(plane,point)?.clone()||null;}
 function pick(clientX,clientY){ground(clientX,clientY);const hits=ray.intersectObjects(buildings.children,true);for(const hit of hits){let obj=hit.object;while(obj&&!obj.userData.plotId)obj=obj.parent;if(obj?.userData.plotId&&obj.visible)return obj.userData.plotId;}return null;}
 function select(id,notify=true){selected=id;const p=state.village.structures.find(p=>p.id===id);if(p){const f=footprint(p.kind,p.rotation);frameOutline(p.x+(f.w-1)/2,p.z+(f.d-1)/2,f.w,f.d,'#fff0a5');if(notify)onSelect(p);}else{clearOutline();if(notify)onSelect(null);}}
 function clearGhost(){if(ghost){scene.remove(ghost);ghost.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});ghost=null;}for(const m of buildings.children)m.visible=true;}
 function updateGhost(){if(!placement)return;const {kind,x,z,rotation,id}=placement,f=footprint(kind,rotation);ghost.position.set(x+(f.w-1)/2,.02,z+(f.d-1)/2);ghost.rotation.y=-rotation*Math.PI/2;const error=placementError(state.village,kind,x,z,rotation,id);placement.error=error;frameOutline(ghost.position.x,ghost.position.z,f.w,f.d,error?'#ed785d':'#c3ff8b',true);onPlacement({...placement});}
 function begin(kind,id=null){cancel(false);const p=id?state.village.structures.find(p=>p.id===id):null;const rotation=p?.rotation||0,pos=p||findFreePlot(state.village,kind,rotation)||{x:0,z:0};placement={kind:p?.kind||kind,id,x:pos.x,z:pos.z,rotation,error:null};ghost=createBuilding(placement.kind,p?levelOf(p):1);paintBuilding(ghost);ghost.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of Array.isArray(o.material)?o.material:[o.material]){m.transparent=true;m.opacity=.68;if(m.userData.surface){m.userData.painted=false;paintMaterial(m,m.userData.surface);}}o.castShadow=false;}});scene.add(ghost);if(id){const model=buildings.children.find(m=>m.userData.plotId===id);if(model)model.visible=false;}rebuildBatches();grid.visible=true;updateGhost();}
 function cancel(notify=true){clearGhost();placement=null;rebuildBatches();grid.visible=showGrid;clearOutline();if(selected)select(selected,false);if(notify)onPlacement(null);}
 function rotatePlacement(){if(placement){placement.rotation=(placement.rotation+1)%4;updateGhost();}}
 function positionGhost(x,y){const hit=ground(x,y);if(!hit||!placement)return;const f=footprint(placement.kind,placement.rotation);placement.x=Math.round(hit.x-(f.w-1)/2);placement.z=Math.round(hit.z-(f.d-1)/2);updateGhost();}
 const pointers=new Map();let down=null,pinchDistance=0;
 function pointerDown(e){canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,button:e.button};if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);if(down)down.moved=true;}if(placement&&pointers.size===1)positionGhost(e.clientX,e.clientY);}
 function pointerMove(e){if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance)changeZoom(d/pinchDistance);pinchDistance=d;return;}if(!down)return;const dx=e.clientX-down.lastX,dy=e.clientY-down.lastY;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.moved=true;
  if(placement){positionGhost(e.clientX,e.clientY);}else if(down.moved){if(down.button===2){azimuth-=dx*.007;updateCamera();}else{const a=ground(down.lastX,down.lastY),b=ground(e.clientX,e.clientY);if(a&&b){center.add(a.sub(b));center.x=THREE.MathUtils.clamp(center.x,-23,23);center.z=THREE.MathUtils.clamp(center.z,-23,23);updateCamera();}}}down.lastX=e.clientX;down.lastY=e.clientY;
 }
 function pointerUp(e){pointers.delete(e.pointerId);if(pointers.size<2)pinchDistance=0;if(!down)return;if(!down.moved&&!placement&&e.button!==2)select(pick(e.clientX,e.clientY));if(!pointers.size)down=null;}
 function changeZoom(factor){zoom=THREE.MathUtils.clamp(zoom*factor,.55,2.8);camera.zoom=zoom;camera.updateProjectionMatrix();}
 function wheel(e){e.preventDefault();changeZoom(Math.exp(-e.deltaY*.001));}
 function key(e){if(e.key==='Escape')cancel();if(e.key==='r'||e.key==='R')rotatePlacement();if(e.key==='+'||e.key==='=')changeZoom(1.12);if(e.key==='-')changeZoom(1/1.12);}
 function context(e){e.preventDefault();}
 canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);canvas.addEventListener('contextmenu',context);
 function lost(e){e.preventDefault();onError('Le rendu 3D a été interrompu. Rechargez la page pour reprendre votre village.');}canvas.addEventListener('webglcontextlost',lost);
 const ro=new ResizeObserver(resize);ro.observe(container);sync(state);resize();
 const thumbnails=new Map(),thumbTarget=new THREE.WebGLRenderTarget(192,192);thumbTarget.texture.colorSpace=THREE.SRGBColorSpace;
 function thumbnail(kind,level=1){const key=kind+level;if(thumbnails.has(key))return thumbnails.get(key);const ts=new THREE.Scene(),m=createBuilding(kind,level);paintBuilding(m);ts.add(m);ts.add(new THREE.HemisphereLight(0xecf5ff,0x4b4527,2));const light=new THREE.DirectionalLight(0xffedce,3);light.position.set(-4,9,6);ts.add(light);const bounds=new THREE.Box3().setFromObject(m),size=bounds.getSize(new THREE.Vector3()),mid=bounds.getCenter(new THREE.Vector3()),span=Math.max(size.y,size.x,size.z)*1.65;const tc=new THREE.OrthographicCamera(-span/2,span/2,span/2,-span/2,.1,100);tc.position.set(8,7,10);tc.lookAt(mid);const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();renderer.setRenderTarget(thumbTarget);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(ts,tc);const pixels=new Uint8Array(192*192*4);renderer.readRenderTargetPixels(thumbTarget,0,0,192,192,pixels);renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);const c=document.createElement('canvas');c.width=c.height=192;const context=c.getContext('2d'),data=context.createImageData(192,192);for(let y=0;y<192;y++)data.data.set(pixels.subarray((191-y)*192*4,(192-y)*192*4),y*192*4);context.putImageData(data,0,0);const url=c.toDataURL();thumbnails.set(key,url);return url;}
 let lastOverlay=0;const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function draw(t){if(dead)return;frame=requestAnimationFrame(draw);if(document.hidden||t-last<(mobile?32:18))return;last=t;
  if(!reduceMotion){
   for(const o of animated){if(o.userData.spin==='windmill')o.rotation.z=o.userData.restRotation.z+t*.00055;else if(o.userData.spin==='shrine')o.rotation.y=o.userData.restRotation.y+t*.0003;else if(o.userData.spin==='flame')o.scale.y=o.userData.restScale.y*(1+Math.sin(t*.009+o.position.x)*.1);}
   for(const {person,phase} of movers){const time=t*.00011+phase;const side=Math.floor(phase)%2;person.position.set(side?Math.cos(time)*15:Math.sin(time)*.35,0,side?1+Math.sin(time)*.3:Math.cos(time)*14);person.rotation.y=side?(Math.sin(time)>0?-Math.PI/2:Math.PI/2):(Math.sin(time)>0?0:Math.PI);person.position.y=Math.abs(Math.sin(t*.004+phase))*.025;}
   for(const s of smokes){const age=(t*.00016+s.phase)%1;s.puff.position.set(s.x+age*.4,2.65+age*1.9,s.z+Math.sin(age*4)*.12);s.puff.scale.setScalar(.2+age*.8);}
   for(const f of flares){const pulse=1+Math.sin(t*.006+f.phase)*.08;f.glow.scale.set(.7*pulse,.85*pulse,1);}
   landscape.animate(t);
  }
  if(ghost)ghost.position.y=.035+(reduceMotion?0:Math.sin(t*.004)*.02);
  renderer.render(scene,camera);
  if(t-lastOverlay>110){lastOverlay=t;const markers=state.village.structures.filter(p=>['mine','tree','shrine'].includes(p.kind)&&p.essential).map(p=>{const model=buildings.children.find(m=>m.userData.plotId===p.id),v=new THREE.Vector3(model.position.x,p.kind==='tree'?4.6:3.4,model.position.z).project(camera);return {id:p.id,x:(v.x*.5+.5)*container.clientWidth,y:(-v.y*.5+.5)*container.clientHeight,visible:!placement&&v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1};});onFrame({markers,center:{x:center.x,z:center.z},zoom});}
 }
 renderer.render(scene,camera);onReady();frame=requestAnimationFrame(draw);
 return {thumbnail,sync,begin,cancel,rotatePlacement,getPlacement:()=>placement?{...placement}:null,select,
  zoom:(step)=>changeZoom(step>0?1.2:1/1.2),rotate:()=>{azimuth+=Math.PI/2;updateCamera();},home:()=>{center.set(-.8,1.2,1);zoom=1;azimuth=Math.PI/4;camera.zoom=zoom;camera.updateProjectionMatrix();updateCamera();},
  grid:()=>{showGrid=!showGrid;grid.visible=showGrid||!!placement;return showGrid;},
  dispose(){dead=true;cancelAnimationFrame(frame);ro.disconnect();canvas.removeEventListener('webglcontextlost',lost);const geos=new Set(),materials=new Set();buildings.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geos.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());landscape.textures.forEach(t=>t.dispose());contactTexture.dispose();smokeTexture.dispose();glowTexture.dispose();glowWarm.dispose();glowCool.dispose();smokeMaterial.dispose();contactMat.dispose();thumbTarget.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 };
}
