import * as THREE from '../vendor/three.module.js';
const light=new THREE.Vector3(-.8,1.5,1).normalize(),view=new THREE.Vector3(1,.5,1).normalize(),half=light.clone().add(view).normalize();
const lightX=new THREE.Vector3(1,0,.8).normalize(),lightY=new THREE.Vector3().crossVectors(light,lightX).normalize();
const encode=v=>Math.round(Math.min(255,255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055)));
export function rasterVolume(meshes,angle,{width=256,height=300,tile=180,anchorX=width/2,anchorY=height-20}={}){
 const pixels=new Uint8ClampedArray(width*height*4),depth=new Float32Array(width*height).fill(-Infinity),normal=new THREE.Matrix3(),v=new THREE.Vector3(),n=new THREE.Vector3();
 const world=new THREE.Matrix4().makeRotationY(Math.PI/2-angle);world.premultiply(new THREE.Matrix4().makeScale(1.36,1,1.36));
 const draws=[],shadowSize=256,shadow=new Float32Array(shadowSize*shadowSize).fill(-Infinity),shadowScale=shadowSize/3;
 function triangles(vertices,idx,visit){for(let i=0;i<(idx?.count||vertices.length);i+=3)visit(vertices[idx?idx.getX(i):i],vertices[idx?idx.getX(i+1):i+1],vertices[idx?idx.getX(i+2):i+2]);}
 function triangle(a,b,c,w,h,visit){
  const area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<.001)return;
  const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/area,t=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/area,r=1-u-t;if(u>=0&&t>=0&&r>=0)visit(x,y,u,t,r);}
 }
 // A real light-space depth pass lets helmets shade faces, capes shade backs
 // and fingers shade palms. It is baked once, never calculated on a phone.
 for(const {geo,color,matrix,shine=0}of meshes){
  const transform=new THREE.Matrix4().multiplyMatrices(world,matrix);normal.getNormalMatrix(transform);
  const pos=geo.attributes.position,norm=geo.attributes.normal,vertices=[];
  for(let i=0;i<pos.count;i++){
   v.fromBufferAttribute(pos,i).applyMatrix4(transform);n.fromBufferAttribute(norm,i).applyNormalMatrix(normal);
   const direct=Math.max(0,n.dot(light))*.70,ambient=.31+Math.max(0,n.y)*.11,spec=Math.pow(Math.max(0,n.dot(half)),28)*shine*.30;
   vertices.push({x:anchorX+(v.x-v.z)*tile*.5,y:anchorY+(v.x+v.z)*tile*.25-v.y*tile,z:v.x+v.z+v.y*.5,direct,ambient,spec,sx:128+v.dot(lightX)*shadowScale,sy:128-v.dot(lightY)*shadowScale,sz:v.dot(light)});
  }
  const lightVertices=vertices.map(a=>({x:a.sx,y:a.sy,z:a.sz}));
  triangles(lightVertices,geo.index,(a,b,c)=>triangle(a,b,c,shadowSize,shadowSize,(x,y,u,t,r)=>{const k=y*shadowSize+x,d=u*a.z+t*b.z+r*c.z;if(d>shadow[k])shadow[k]=d;}));
  draws.push({vertices,idx:geo.index,rgb:new THREE.Color(color)});
 }
 for(const {vertices,idx,rgb}of draws)triangles(vertices,idx,(a,b,c)=>triangle(a,b,c,width,height,(x,y,u,t,r)=>{
  const d=u*a.z+t*b.z+r*c.z,k=y*width+x;if(d<depth[k])return;depth[k]=d;
  const sx=u*a.sx+t*b.sx+r*c.sx,sy=u*a.sy+t*b.sy+r*c.sy,sz=u*a.sz+t*b.sz+r*c.sz;
  const direct=u*a.direct+t*b.direct+r*c.direct,bias=.014+(1-direct/.70)*.035;
  let lit=0;for(const [ox,oy]of [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]]){const xx=Math.floor(sx+ox),yy=Math.floor(sy+oy);if(xx<0||yy<0||xx>=shadowSize||yy>=shadowSize||shadow[yy*shadowSize+xx]<=sz+bias)lit+=.25;}
  const visibility=.35+lit*.65,L=u*a.ambient+t*b.ambient+r*c.ambient+direct*visibility,s=(u*a.spec+t*b.spec+r*c.spec)*visibility;
  pixels[k*4]=encode(rgb.r*L+s);pixels[k*4+1]=encode(rgb.g*L+s*.91);pixels[k*4+2]=encode(rgb.b*L+s*.76);pixels[k*4+3]=255;
 }));
 // Restrained contact shading; the light pass supplies larger cast shadows.
 for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
  const k=y*width+x;if(!pixels[k*4+3])continue;let occlusion=0;
  for(const [dx,dy]of [[-2,0],[2,0],[0,-2],[0,2],[-2,-2],[2,2]]){const diff=depth[(y+dy)*width+x+dx]-depth[k];if(diff>.035&&diff<.32)occlusion+=.025;}
  for(let c=0;c<3;c++)pixels[k*4+c]*=1-occlusion;
 }
 return pixels;
}
