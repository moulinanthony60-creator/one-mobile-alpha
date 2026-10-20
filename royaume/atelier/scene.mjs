import * as THREE from '../vendor/three.module.js';
import {createCastle,createCottage,createGuardian,animateGuardian,createGarden,createDummy,mergeStatic} from './modeles.mjs?v=1';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createAtelier(canvas,{economy:initialEconomy=false}={}){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:!initialEconomy,alpha:false,powerPreference:'default'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.setPixelRatio(initialEconomy?1:Math.min(window.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=!initialEconomy;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),ownedTextures=[];let observer,frameId=0;
 function release(){observer?.disconnect();cancelAnimationFrame(frameId);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);if(o.isLight)o.shadow?.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of ownedTextures)t.dispose();renderer.dispose();}
 try{
 scene.background=new THREE.Color('#d5dfc4');scene.fog=new THREE.Fog('#d5dfc4',30,65);
 const camera=new THREE.OrthographicCamera(-7,7,7,-7,.1,100),target=new THREE.Vector3(0,1.5,.7),direction=new THREE.Vector3();
 const sun=new THREE.DirectionalLight('#fff0cd',3.2);sun.position.set(-7,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:32});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
 scene.add(new THREE.HemisphereLight('#e3f0ff','#759244',1.5));const fill=new THREE.DirectionalLight('#a8d4ee',.6);fill.position.set(6,6,-4);scene.add(fill);
 const castle=createCastle();castle.group.position.set(-1.8,0,-.85);castle.group.rotation.y=-.04;castle.group.updateMatrixWorld(true);
 const flags=castle.flags.map(flag=>{const transform=flag.matrixWorld.clone();flag.removeFromParent();flag.applyMatrix4(transform);flag.userData.rest=flag.geometry.attributes.position.array.slice();scene.add(flag);return flag;});
 const fort=mergeStatic(castle.group);scene.add(fort);
 const cottage=createCottage();cottage.group.position.set(2.0,0,-.4);cottage.group.rotation.y=-.20;cottage.group.updateMatrixWorld(true);const smokeOrigin=cottage.chimney.applyMatrix4(cottage.group.matrixWorld);const house=mergeStatic(cottage.group);scene.add(house);
 const garden=mergeStatic(createGarden());scene.add(garden);
 const hero=createGuardian(),heroBase=new THREE.Vector3(-.1,0,3.0);hero.group.position.copy(heroBase);hero.group.rotation.y=.9;animateGuardian(hero,1.65*.54,'attack');hero.group.updateMatrixWorld(true);
 const strike=hero.sword.localToWorld(new THREE.Vector3(0,1.15,0));const dummy=mergeStatic(createDummy());dummy.position.set(strike.x,0,strike.z);dummy.rotation.y=.9+Math.PI;scene.add(dummy);animateGuardian(hero,0,'idle');scene.add(hero.group);
 const focusBoxes={ensemble:new THREE.Box3().setFromObject(fort).union(new THREE.Box3().setFromObject(house)).union(new THREE.Box3().setFromObject(hero.group)).union(new THREE.Box3().setFromObject(dummy)),chateau:new THREE.Box3().setFromObject(fort),maison:new THREE.Box3().setFromObject(house),gardien:new THREE.Box3().setFromObject(hero.group)};
 // Fit the whole motion, including the target, before changing animation.
 hero.group.rotation.y=.35;animateGuardian(hero,0,'idle');
 const guardianFrames={idle:new THREE.Box3().setFromObject(hero.group),walk:new THREE.Box3(),attack:new THREE.Box3().setFromObject(dummy)};
 for(const motion of ['walk','attack'])for(let i=0;i<=40;i++){
  hero.group.rotation.y=motion==='attack'?.9:i/40*Math.PI*2;animateGuardian(hero,i/40*1.65,motion);guardianFrames[motion].union(new THREE.Box3().setFromObject(hero.group));
 }
 hero.group.rotation.y=.35;animateGuardian(hero,0,'idle');focusBoxes.gardien=guardianFrames.idle;
 let width=1,height=1,yaw=.58,elevation=.54,zoom=1,focus='ensemble',mode='idle',time=0,paused=false,disposed=false,economy=initialEconomy,lastImpact=false,impactTime=-10,last=0;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function canvasTexture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;ownedTextures.push(map);return map;}
 const grass=canvasTexture(256,(ctx,s)=>{ctx.fillStyle='#88ad49';ctx.fillRect(0,0,s,s);let seed=617;for(let i=0;i<1700;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed/4294967296*s;seed=(Math.imul(seed,1664525)+1013904223)>>>0;ctx.fillStyle=i%3?'#abc46522':'#4b792a17';ctx.fillRect(x,seed/4294967296*s,2+(i%6),2+(i%4));}});grass.wrapS=grass.wrapT=THREE.RepeatWrapping;grass.repeat.set(14,14);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(70,70),new THREE.MeshStandardMaterial({map:grass,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.035;floor.receiveShadow=true;scene.add(floor);
 const plazaTexture=canvasTexture(512,(ctx,s)=>{ctx.clearRect(0,0,s,s);const g=ctx.createRadialGradient(s/2,s/2,s*.12,s/2,s/2,s*.49);g.addColorStop(0,'#cfbc86');g.addColorStop(.60,'#c2ac73e8');g.addColorStop(1,'#c2ac7300');ctx.fillStyle=g;ctx.fillRect(0,0,s,s);for(let y=130;y<390;y+=26)for(let x=75;x<440;x+=33){ctx.fillStyle=['#e1d0a0','#bcaa7d','#dfc996'][(x+y)%3];ctx.beginPath();ctx.roundRect(x+(y%52?9:0),y,26,18,4);ctx.fill();}});
 const plaza=new THREE.Mesh(new THREE.PlaneGeometry(8.2,7.1),new THREE.MeshStandardMaterial({map:plazaTexture,transparent:true,roughness:1,depthWrite:false}));plaza.rotation.x=-Math.PI/2;plaza.position.set(.25,-.005,1.2);plaza.receiveShadow=true;scene.add(plaza);
 const contactTexture=canvasTexture(64,(ctx,s)=>{const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#24391d88');g.addColorStop(1,'#24391d00');ctx.fillStyle=g;ctx.fillRect(0,0,s,s);});
 const contactMaterial=new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,opacity:.7});
 for(const [x,z,w,d]of [[-1.8,-.8,4.8,4.0],[2,-.3,3.0,2.7],[heroBase.x,heroBase.z,1.2,.8]]){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),contactMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.012,z);scene.add(mesh);}
 const smoke=[];
 for(let i=0;i<5;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(1,10,6),new THREE.MeshBasicMaterial({color:'#f1ead9',transparent:true,opacity:.14,depthWrite:false}));puff.position.copy(smokeOrigin);scene.add(puff);smoke.push(puff);}
 const sparks=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.045,0),new THREE.MeshBasicMaterial({color:i%2?'#ffe5a2':'#d9c3a0'}));m.visible=false;scene.add(m);sparks.push(m);}
 function cameraPose(){
  const box=focusBoxes[focus],center=box.getCenter(new THREE.Vector3());if(focus==='gardien')center.add(hero.group.position.clone().sub(heroBase));target.lerp(center,.15);
  direction.set(Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation));camera.position.copy(target).addScaledVector(direction,22);camera.lookAt(target);camera.updateMatrixWorld();
  let extentX=0,extentY=0;const offset=focus==='gardien'?hero.group.position.clone().sub(heroBase):new THREE.Vector3();
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const v=new THREE.Vector3(x,y,z).add(offset).applyMatrix4(camera.matrixWorldInverse);extentX=Math.max(extentX,Math.abs(v.x));extentY=Math.max(extentY,Math.abs(v.y));}
  const half=Math.max(extentY,extentX/(width/height))*(focus==='ensemble'?1.12:1.24)/zoom;camera.left=-half*width/height;camera.right=half*width/height;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
 }
 function resize(){if(disposed)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;renderer.setSize(width,height,false);cameraPose();renderer.render(scene,camera);}
 function render(dt=0){
  if(disposed)return;if(!paused&&!document.hidden&&!reduced)time+=Math.min(dt,.05);
  hero.group.position.copy(heroBase);hero.group.rotation.y=mode==='attack'?.9:.35;
  if(mode==='walk'&&!reduced){hero.group.position.x+=Math.sin(time*.7)*.65;hero.group.position.z+=Math.cos(time*.7)*.3;hero.group.rotation.y=Math.atan2(Math.cos(time*.7)*.65,-Math.sin(time*.7)*.3);}
  const state=animateGuardian(hero,time,mode,reduced);
  if(state.impact&&!lastImpact)impactTime=time;lastImpact=state.impact;
  for(const flag of flags){const p=flag.geometry.attributes.position,rest=flag.userData.rest;for(let i=0;i<p.count;i++)p.setZ(i,rest[i*3+2]+Math.sin(time*3.7+rest[i*3]*8)*.06*Math.max(0,rest[i*3]));p.needsUpdate=true;flag.geometry.computeVertexNormals();}
  smoke.forEach((puff,i)=>{const age=(time*.33+i/5)%1;puff.visible=!economy;puff.position.copy(smokeOrigin).add(new THREE.Vector3(age*.4,age*1.8,Math.sin(age*4)*.1));puff.scale.setScalar(.08+age*.26);puff.material.opacity=(1-age)*.16;});
  const age=time-impactTime;dummy.rotation.z=age<.35?Math.sin(age*28)*.07*(1-age/.35):0;
  sparks.forEach((m,i)=>{m.visible=age<.38&&!reduced;if(m.visible){const a=i*2.4;m.position.copy(strike).add(new THREE.Vector3(Math.cos(a)*age*1.8,Math.sin(a)*age+age*.5-age*age*3,Math.sin(a)*age*1.4));m.scale.setScalar(1-age/.38);}});
  cameraPose();renderer.render(scene,camera);
 }
 function loop(now){const dt=last?(now-last)/1000:0;last=now;if(!document.hidden)render(dt);frameId=requestAnimationFrame(loop);}
 observer=new ResizeObserver(resize);observer.observe(canvas);resize();frameId=requestAnimationFrame(loop);
 return {
  focus(value){if(!focusBoxes[value])return;focus=value;zoom=1;yaw=focus==='gardien'?.38:.58;elevation=focus==='gardien'?.20:.54;render();},
  motion(value){if(!['idle','walk','attack'].includes(value))return;mode=value;focusBoxes.gardien=guardianFrames[mode];time=0;impactTime=-10;lastImpact=false;render();},
  orbit(dx,dy){yaw-=dx*.006;elevation=clamp(elevation+dy*.004,.12,1.1);render();},
  zoom(factor){zoom=clamp(zoom*factor,.65,1.9);render();},
  home(){yaw=.58;elevation=.54;zoom=1;focus='ensemble';render();},
  pause(value){paused=Boolean(value);last=0;},
  quality(value){economy=Boolean(value);renderer.setPixelRatio(economy?1:Math.min(window.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=!economy;resize();},
  get stats(){return {draws:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frameId);observer.disconnect();release();}
 };
 }catch(error){release();throw error;}
}
