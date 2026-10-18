import * as THREE from './vendor/three.module.js';
let atlas=null,promise=null;
const settings={stone:{offset:[0,.5],scale:.23,amount:.50},wood:{offset:[.5,.5],scale:.47,amount:.38},roof:{offset:[0,0],scale:.42,amount:.40},grass:{offset:[.5,0],scale:.20,amount:.30}};
export function loadPaintedMaterials(){
 if(!promise)promise=new THREE.TextureLoader().loadAsync(new URL('./assets/materials-v4.png',import.meta.url).href).then(texture=>{atlas=texture;atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=8;atlas.generateMipmaps=true;return atlas;}).catch(()=>null);
 return promise;
}
export function paintMaterial(material,surface){
 const s=settings[surface];if(!s||!atlas||material.userData.painted)return material;
 material.userData.painted=true;material.userData.surface=surface;
 material.onBeforeCompile=shader=>{
  shader.uniforms.artAtlas={value:atlas};
  shader.vertexShader='varying vec3 vArtPosition;\nvarying vec3 vArtNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 artPosition=vec4(transformed,1.0);
   vec3 artNormal=objectNormal;
   #ifdef USE_INSTANCING
   artPosition=instanceMatrix*artPosition;
   artNormal=mat3(instanceMatrix)*artNormal;
   #endif
   vArtPosition=(modelMatrix*artPosition).xyz;
   vArtNormal=normalize(mat3(modelMatrix)*artNormal);
  `);
  shader.fragmentShader=`uniform sampler2D artAtlas;varying vec3 vArtPosition;varying vec3 vArtNormal;
   vec3 samplePaint(vec2 p){vec2 cell=fract(p*${s.scale.toFixed(3)});return texture2D(artAtlas,vec2(${s.offset[0].toFixed(3)},${s.offset[1].toFixed(3)})+vec2(.004)+cell*.492).rgb;}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 artWeight=pow(abs(normalize(vArtNormal)),vec3(5.0));artWeight/=max(.001,artWeight.x+artWeight.y+artWeight.z);
   vec3 artColor=samplePaint(vArtPosition.zy)*artWeight.x+samplePaint(vArtPosition.xz)*artWeight.y+samplePaint(vArtPosition.xy)*artWeight.z;
   float artLuma=dot(artColor,vec3(.2126,.7152,.0722));
   vec3 artDetail=clamp(mix(vec3(artLuma),artColor,.18)*2.8,vec3(.55),vec3(1.45));
   diffuseColor.rgb*=mix(vec3(1.0),artDetail,${s.amount.toFixed(3)});
  `);
 };
 material.customProgramCacheKey=()=>`paint-v4-${surface}`;material.needsUpdate=true;return material;
}
