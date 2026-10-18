import * as THREE from './vendor/three.module.js';
import {paintMaterial} from './village-materials.mjs?v=4';
import {createTree,createRock} from './village-models.mjs?v=4';

const rand=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
export function instanceGroup(source,target,skip=()=>false){
 source.updateMatrixWorld(true);const batches=new Map();
 source.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||skip(o))return;const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,{geometry:o.geometry,material:o.material,matrices:[],shadow:o.castShadow,receive:o.receiveShadow});batches.get(key).matrices.push(o.matrixWorld.clone());});
 for(const b of batches.values()){const m=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.castShadow=b.shadow;m.receiveShadow=b.receive;target.add(m);}
}
export function createLandscape(){
 const root=new THREE.Group(),raw=new THREE.Group(),forest=new THREE.Group();root.add(forest);
 const textures=[],matCache=new Map(),geoCache=new Map();
 const mat=c=>{if(!matCache.has(c))matCache.set(c,new THREE.MeshStandardMaterial({color:c,roughness:1}));return matCache.get(c);};
 const box=(w,h,d,x,y,z,c)=>{if(!geoCache.has('box'))geoCache.set('box',new THREE.BoxGeometry(1,1,1));const m=new THREE.Mesh(geoCache.get('box'),mat(c));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;raw.add(m);return m;};
 const rockGeo=new THREE.IcosahedronGeometry(1,1);
 const rock=(x,y,z,s,c)=>{const m=new THREE.Mesh(rockGeo,mat(c));m.position.set(x,y,z);m.scale.set(s,s*.7,s*.85);m.rotation.set(rand(x)*.5,rand(z)*6,.15);m.castShadow=m.receiveShadow=true;raw.add(m);return m;};
 const hill=(x,z)=>{const border=Math.max(Math.abs(x),Math.abs(z));const edge=THREE.MathUtils.smoothstep(border,22,33);const h=edge*(.65+Math.sin(x*.17)*Math.cos(z*.14)*1.2+Math.sin(z*.34+x*.22)*.35),dist=Math.abs(x-(-31+Math.sin(z*.075)*3));return dist<6?THREE.MathUtils.lerp(-.6,h,THREE.MathUtils.smoothstep(dist,3.7,6)):h;};
 const groundCanvas=document.createElement('canvas');groundCanvas.width=groundCanvas.height=1536;const ctx=groundCanvas.getContext('2d'),pixels=ctx.createImageData(1536,1536);
 for(let y=0;y<1536;y++)for(let x=0;x<1536;x++){const i=(x+y*1536)*4;const noise=rand(x+y*1536),patch=Math.sin(x*.014)*Math.cos(y*.011)+Math.sin(x*.033+y*.019)*.35;
  pixels.data[i]=90+patch*9+noise*4;pixels.data[i+1]=118+patch*9+noise*5;pixels.data[i+2]=59+patch*6+noise*3;pixels.data[i+3]=255;
 }ctx.putImageData(pixels,0,0);
 for(let i=0;i<5000;i++){const x=rand(i+5)*1536,y=rand(i+17)*1536;ctx.strokeStyle=i%3?'#b4c28425':'#49623f20';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand(i)*2-1,y-1-rand(i+3)*3);ctx.stroke();}
 const coord=(v)=>(v+60)*1536/120;
 // Worn, curved footpaths are painted into the terrain, not a rigid cross of slabs.
 const paths=[[[0,-14],[-.2,-8],[1,0],[0,8],[0,18],[1,26]], [[-18,1],[-10,1],[-4,.5],[3,1],[11,1],[20,3]], [[-9,-6],[-8,-2],[-7,1]],[[7,1],[8,5],[9,11]]];
 for(const points of paths){ctx.lineJoin=ctx.lineCap='round';for(const [width,color]of [[22,'#a8a76835'],[16,'#bcaa7050'],[10,'#b9a06b85']]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(coord(x),coord(z)):ctx.moveTo(coord(x),coord(z)));ctx.stroke();}}
 for(let i=0;i<11000;i++){const x=rand(i+2)*1536,y=rand(i+190)*1536;ctx.fillStyle=i%2?'#d1c28a20':'#223c1715';ctx.fillRect(x,y,.5+rand(i+4)*2,.5+rand(i+8)*1.5);}
 const grassTexture=new THREE.CanvasTexture(groundCanvas);grassTexture.colorSpace=THREE.SRGBColorSpace;grassTexture.anisotropy=8;textures.push(grassTexture);
 const geometry=new THREE.PlaneGeometry(120,120,120,120);geometry.rotateX(-Math.PI/2);const attr=geometry.attributes.position;for(let i=0;i<attr.count;i++)attr.setY(i,hill(attr.getX(i),attr.getZ(i))-.025);geometry.computeVertexNormals();
 const ground=new THREE.Mesh(geometry,paintMaterial(new THREE.MeshStandardMaterial({map:grassTexture,roughness:1}),'grass'));ground.receiveShadow=true;root.add(ground);
 // A stream and its stony banks lie outside the enlarged building area.
 const riverX=z=>-31+Math.sin(z*.075)*3;
 function ribbon(width,y,color){const verts=[],indices=[];for(let i=0;i<=80;i++){const z=i*1.5-60,x=riverX(z);verts.push(x-width/2,y,z,x+width/2,y,z);if(i<80){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();const material=new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.1,side:THREE.DoubleSide});const m=new THREE.Mesh(g,material);root.add(m);return m;}
 ribbon(9,.18,0xa7a878);const river=ribbon(7.2,.24,0x3e9aab);
 for(let i=0;i<110;i++){const z=rand(i+801)*110-55,side=i%2?-1:1,x=riverX(z)+side*(3.8+rand(i+30)*1.1);rock(x,.35,z,.35+rand(i+19)*.7,[0x747f63,0x9d9c7c,0x535e4e][i%3]);}
 const ripples=new THREE.Group(),lineGeo=new THREE.PlaneGeometry(1.5,.045),lineMat=new THREE.MeshBasicMaterial({color:0xb5e4cf,transparent:true,opacity:.25,depthWrite:false});
 for(let i=0;i<35;i++){const z=rand(i+81)*100-50;const m=new THREE.Mesh(lineGeo,lineMat);m.rotation.x=-Math.PI/2;m.position.set(riverX(z)+rand(i+62)*5-2.5,.28,z);ripples.add(m);}root.add(ripples);
 // Continuous layered forest; the middle forty-one tiles remain completely buildable.
 for(let z=-48;z<=48;z+=3.7)for(let x=-48;x<=48;x+=3.7){const n=Math.round((x+50)*19+(z+50)*113),xx=x+(rand(n)-.5)*1.8,zz=z+(rand(n+1)-.5)*1.8;const edge=Math.max(Math.abs(xx),Math.abs(zz));if(edge<22.1+rand(n+4)*1.2||Math.abs(xx-riverX(zz))<5.1||rand(n+2)<.16)continue;const tree=createTree(n);const s=1.08+rand(n+3)*.65;tree.scale.multiplyScalar(s);tree.position.set(xx,hill(xx,zz),zz);raw.add(tree);}
 for(let i=0;i<65;i++){const a=i*2.399,r=23+rand(i+73)*16,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.max(Math.abs(x),Math.abs(z))<21.7||Math.abs(x-riverX(z))<4)continue;const m=createRock(i);m.scale.setScalar(.7+rand(i+70)*2.5);m.position.set(x,hill(x,z),z);raw.add(m);}
 // Pebbles, flowers and tufts on the free terrain, small enough to build over.
 const bladeGeo=new THREE.ConeGeometry(.035,.22,3),petalGeo=new THREE.IcosahedronGeometry(.042,0);
 for(let i=0;i<1600;i++){const x=rand(i*3+8000)*44-22,z=rand(i*3+8001)*44-22;if(Math.abs(x)<1.4||Math.abs(z-1)<1)continue;const m=new THREE.Mesh(i%9===0?petalGeo:bladeGeo,mat(i%9===0?[0xe1c56a,0xd4a6c0,0xd3d5ae][i%3]:[0x6f8e39,0x8e9f48,0x476e2d][i%3]));m.position.set(x,i%9===0?.095:.065,z);m.rotation.z=(rand(i)-.5)*.5;raw.add(m);}
 for(const [x,z]of [[-20.7,-20.7],[20.7,-20.7],[-20.7,20.7],[20.7,20.7]]){box(.25,1,.25,x,.5,z,0x6b4a2b);box(1.5,.12,.12,x,.68,z,0x977346);box(.12,.12,1.5,x,.68,z,0x977346);}
 // Road lanterns and a bridge give the expanded landscape a sense of scale.
 for(const z of [-12,-6,6,12,18])for(const x of [-1.7,1.7]){box(.10,1.15,.10,x,.58,z,0x604c30);box(.32,.3,.32,x,1.2,z,0x9a793d);box(.22,.2,.22,x,1.21,z,0xf6bd56);box(.42,.10,.42,x,1.40,z,0x3c4d3b);}
 for(let i=0;i<16;i++){box(.6,.22,2.6,-35.2+i*.6,.62,9,0x92734b);}for(const z of [7.7,10.3]){box(10,.12,.14,-30.7,1.2,z,0x61482d);for(let x=-35;x<-26;x+=1.8)box(.2,1.3,.2,x,.7,z,0x745537);}
 instanceGroup(raw,forest);raw.clear();
 return {root,textures,animate(t){ripples.children.forEach((o,i)=>{o.position.z+=(.0006+(i%3)*.00015);if(o.position.z>52)o.position.z=-52;o.position.x=riverX(o.position.z)+rand(i+62)*5-2.5;});river.material.color.setHSL(.53,.37,.43+Math.sin(t*.0006)*.01);}};
}
