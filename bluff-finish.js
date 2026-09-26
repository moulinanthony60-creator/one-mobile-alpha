import * as T from './vendor/three.module.js';
// Materials are cloned per mounted scene; cached GLB sources stay immutable.
export function finishScene(scene,renderer){
 const originals=new Map(),owned=[];
 const shaderNoise=`
 varying vec3 vFinishPoint;
 float finishHash(vec3 p){p=fract(p*.3183099+vec3(.11,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float finishNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(finishHash(i),finishHash(i+vec3(1,0,0)),f.x),mix(finishHash(i+vec3(0,1,0)),finishHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(finishHash(i+vec3(0,0,1)),finishHash(i+vec3(1,0,1)),f.x),mix(finishHash(i+vec3(0,1,1)),finishHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 `;
 function material(source){
  if(!source?.isMeshStandardMaterial)return source;
  if(originals.has(source))return originals.get(source);
  const name=source.name||'',kind=/Peau|Visage|Fourrure/.test(name)?'skin':/Veste|Manche|Tissu|Coutur|Foulard/.test(name)?'cloth':/Acier|Armure|Laiton|Noyer/.test(name)?'metal':null;
  if(!kind)return source;
  const m=source.clone();originals.set(source,m);owned.push(m);
  if(kind==='skin'){m.roughness=.78;m.metalness=0;m.color.multiplyScalar(.90);}
  if(kind==='cloth'){m.roughness=.93;m.metalness=0;}
  if(kind==='metal'){m.roughness=/Noyer/.test(name)?.62:.40;m.envMapIntensity=.55;}
  m.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFinishPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nvFinishPoint=position;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+shaderNoise);
   const details=kind==='skin'?`float broad=finishNoise(vFinishPoint*24.);float pores=finishNoise(vFinishPoint*240.);diffuseColor.rgb*=mix(.82,1.08,broad)*mix(.94,1.035,pores);diffuseColor.rgb+=vec3(.014,-.005,-.008)*(1.-broad);`:
    kind==='cloth'?`float weave=.5+.5*sin(vFinishPoint.x*700.)*sin(vFinishPoint.z*700.);float folds=finishNoise(vFinishPoint*65.);diffuseColor.rgb*=mix(.82,1.05,weave)*mix(.9,1.04,folds);`:
    `float patina=finishNoise(vFinishPoint*48.);float scratch=finishNoise(vFinishPoint*vec3(650.,25.,650.));diffuseColor.rgb*=mix(.72,1.10,patina)*mix(.94,1.06,scratch);`;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+details);
  };m.customProgramCacheKey=()=>kind+'-one-1463';return m;
 }
 scene.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(material):material(o.material);o.receiveShadow=true;}});
 // Soft reflection panels give the metal a room to reflect, without external HDR files.
 const environment=new T.Scene();environment.background=new T.Color(0x18131b);
 const geo=new T.PlaneGeometry(4,3),warm=new T.MeshBasicMaterial({color:0xbba386,side:T.DoubleSide}),cool=new T.MeshBasicMaterial({color:0x788593,side:T.DoubleSide});
 const a=new T.Mesh(geo,warm);a.position.set(-4,3,3);a.lookAt(0,0,0);environment.add(a);const b=new T.Mesh(geo,cool);b.position.set(4,2,-2);b.lookAt(0,0,0);environment.add(b);
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(environment,.2,.1,30);scene.environment=target.texture;scene.environmentIntensity=.55;pmrem.dispose();geo.dispose();warm.dispose();cool.dispose();
 return()=>{owned.forEach(m=>m.dispose());target.dispose();scene.environment=null;};
}
