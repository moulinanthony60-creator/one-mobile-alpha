import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
let modelPromise;
export function preload(){return modelPromise ||= new GLTFLoader().loadAsync(new URL('../assets/bluff/revolver.glb',import.meta.url).href);}
export async function mount(host,{eliminated,onImpact,onPhase=()=>{},getTargetRect,isCancelled}){
 const asset=await preload();if(isCancelled())return ()=>{};
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.domElement.setAttribute('aria-label','Revolver 3D animé');host.replaceChildren(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.01,30);camera.position.set(1.35,.65,1.5);camera.lookAt(0,.06,0);
 scene.add(new T.HemisphereLight(0xf7dba5,0x251444,2));const key=new T.DirectionalLight(0xffd69a,4);key.position.set(2,3,3);scene.add(key);const rim=new T.DirectionalLight(0xa453ff,5);rim.color.setHex(0x8ebaff);rim.intensity=3;rim.position.set(-2,1,-2);scene.add(rim);const soft=new T.DirectionalLight(0xffffff,2.5);soft.position.set(-1,3,3);scene.add(soft);
 const studio=new T.Scene();studio.background=new T.Color(0x272031);const studioGeometries=[],studioMaterials=[];
 for(const [x,y,z,w,h,color] of [[-3,2,1,2,5,0xc6b4ff],[3,3,2,3,5,0xffe2b0],[0,4,-2,5,2,0xffffff]]){const geo=new T.PlaneGeometry(w,h),mat=new T.MeshBasicMaterial({color,side:T.DoubleSide});studioGeometries.push(geo);studioMaterials.push(mat);const light=new T.Mesh(geo,mat);light.position.set(x,y,z);light.lookAt(0,0,0);studio.add(light);}
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.08);scene.environment=environment.texture;pmrem.dispose();studioGeometries.forEach(g=>g.dispose());studioMaterials.forEach(m=>m.dispose());
 const materials=[];
 const pivot=new T.Group(),gun=asset.scene.clone(true);
 gun.traverse(n=>{if(!n.isMesh)return;const tune=m=>{const copy=m.clone();materials.push(copy);const wood=/crosse|bois|grip/i.test(n.name+' '+m.name);copy.metalness=wood?.05:.88;copy.roughness=wood?.48:.2;copy.envMapIntensity=wood?.65:1.4;if(!wood)copy.color.setHex(/vis|couronne|bande/i.test(n.name)?0xa9956c:0x64707a);else copy.color.setHex(0x59331f);return copy;};n.material=Array.isArray(n.material)?n.material.map(tune):tune(n.material);});pivot.scale.setScalar(1.22);pivot.add(gun);scene.add(pivot);const bounds=new T.Box3().setFromObject(gun),center=bounds.getCenter(new T.Vector3());gun.position.sub(center);
 const cylinder=new T.Group();cylinder.position.set(0,.17,.015);gun.add(cylinder);gun.updateMatrixWorld(true);const rotating=[];gun.traverse(n=>{if(n.isMesh&&/Barillet|Face.chambre/i.test(n.name))rotating.push(n);});for(const n of rotating)cylinder.attach(n);
 const table=new T.Mesh(new T.CylinderGeometry(1.5,1.5,.08,64),new T.MeshStandardMaterial({color:0x241032,roughness:.9}));table.position.set(0,-.4,0);table.visible=false;scene.add(table);
 const rimGeo=new T.TorusGeometry(1.52,.055,12,72),rimMat=new T.MeshStandardMaterial({color:0xc29b50,metalness:.4,roughness:.4});const tableRim=new T.Mesh(rimGeo,rimMat);tableRim.rotation.x=Math.PI/2;tableRim.position.y=-.36;tableRim.visible=false;scene.add(tableRim);
 const flash=new T.PointLight(0xffc375,0,4);flash.position.set(.15,.1,.4);scene.add(flash);
 let frame=0,dead=false,impact=false,phase=-1;const started=performance.now();const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const side=new T.Quaternion(),aiming=new T.Quaternion(),axis=new T.Vector3(0,0,1);
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function draw(now){if(dead)return;if(isCancelled()){dispose();return;}const t=(now-started)/1000;
  const enter=smooth(t/.7),spin=smooth((t-.7)/1.35),aim=smooth((t-2.05)/.8);const next=t<.7?0:t<2.05?1:t<3.2?2:3;if(next!==phase){phase=next;onPhase(['Le revolver entre en jeu','Le revolver se lève...','Un instant de silence...','Le verdict'][phase]);}
  pivot.position.y=-.24*(1-enter)+spin*.06;pivot.rotation.set(.08+aim*.1,-.65+enter*.25+aim*.65,-.35*(1-enter));cylinder.rotation.z=0;
  camera.position.set(1.35-aim*.35,.65-aim*.3,1.5-aim*.18);camera.lookAt(0,.06,0);camera.updateMatrixWorld();
  side.copy(pivot.quaternion);
  // Aim the barrel's +Z axis at the portrait's screen position, above the stage.
  const rect=host.getBoundingClientRect(),targetRect=getTargetRect?.();const nx=targetRect?((targetRect.left+targetRect.width/2-rect.left)/rect.width)*2-1:0,ny=targetRect?1-((targetRect.top+targetRect.height/2-rect.top)/rect.height)*2:1.45;
  const ray=new T.Vector3(nx,ny,.5).unproject(camera).sub(camera.position).normalize();
  const target=camera.position.clone().addScaledVector(ray,2.2);
  aiming.setFromUnitVectors(axis,target.sub(pivot.position).normalize());pivot.quaternion.slerpQuaternions(side,aiming,aim);
  if(t>=3.2&&!impact){impact=true;onImpact();}
  const recoil=impact?Math.max(0,1-(t-3.2)/.25):0;pivot.rotation.x-=recoil*(eliminated?.2:.035);flash.intensity=eliminated&&t>=3.2&&t<3.28?7:0;
  renderer.render(scene,camera);frame=requestAnimationFrame(draw);
 }
 function dispose(){if(dead)return;dead=true;cancelAnimationFrame(frame);observer.disconnect();environment.dispose();materials.forEach(m=>m.dispose());table.geometry.dispose();table.material.dispose();rimGeo.dispose();rimMat.dispose();renderer.dispose();renderer.domElement.remove();}
 frame=requestAnimationFrame(draw);return dispose;
}
