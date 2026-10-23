import * as THREE from '../vendor/three.module.js';
const light=new THREE.Vector3(-.8,1.5,1).normalize(),view=new THREE.Vector3(1,.5,1).normalize(),half=light.clone().add(view).normalize();
const encode=v=>Math.round(Math.min(255,255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055)));
export function rasterVolume(meshes,angle,{width=256,height=300,tile=180,anchorX=width/2,anchorY=height-20}={}){
 const pixels=new Uint8ClampedArray(width*height*4),depth=new Float32Array(width*height).fill(-Infinity),normal=new THREE.Matrix3(),v=new THREE.Vector3(),n=new THREE.Vector3();
 const world=new THREE.Matrix4().makeRotationY(Math.PI/2-angle);world.premultiply(new THREE.Matrix4().makeScale(1.36,1,1.36));
 for(const {geo,color,matrix,shine=0}of meshes){
  const transform=new THREE.Matrix4().multiplyMatrices(world,matrix);normal.getNormalMatrix(transform);
  const pos=geo.attributes.position,norm=geo.attributes.normal,idx=geo.index,vertices=[],rgb=new THREE.Color(color);
  for(let i=0;i<pos.count;i++){
   v.fromBufferAttribute(pos,i).applyMatrix4(transform);n.fromBufferAttribute(norm,i).applyNormalMatrix(normal);
   const diffuse=.30+Math.max(0,n.dot(light))*.75+Math.max(0,n.y)*.12,spec=Math.pow(Math.max(0,n.dot(half)),22)*shine*.6;
   vertices.push({x:anchorX+(v.x-v.z)*tile*.5,y:anchorY+(v.x+v.z)*tile*.25-v.y*tile,z:v.x+v.z+v.y*.5,L:diffuse,spec});
  }
  for(let i=0;i<(idx?.count||pos.count);i+=3){
   const a=vertices[idx?idx.getX(i):i],b=vertices[idx?idx.getX(i+1):i+1],c=vertices[idx?idx.getX(i+2):i+2];
   const area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<.01)continue;
   const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
   for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){
    const u=((b.y-c.y)*(xx+.5-c.x)+(c.x-b.x)*(yy+.5-c.y))/area,w=((c.y-a.y)*(xx+.5-c.x)+(a.x-c.x)*(yy+.5-c.y))/area,t=1-u-w;if(u<0||w<0||t<0)continue;
    const d=u*a.z+w*b.z+t*c.z,k=yy*width+xx;if(d<depth[k])continue;depth[k]=d;
    const L=u*a.L+w*b.L+t*c.L,s=u*a.spec+w*b.spec+t*c.spec;
    pixels[k*4]=encode(rgb.r*L+s);pixels[k*4+1]=encode(rgb.g*L+s*.91);pixels[k*4+2]=encode(rgb.b*L+s*.76);pixels[k*4+3]=255;
   }
  }
 }
 // Short screen-space contact occlusion darkens intersections, without outlines.
 for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
  const k=y*width+x;if(!pixels[k*4+3])continue;let occlusion=0;
  for(const [dx,dy]of [[-2,0],[2,0],[0,-2],[0,2],[-2,-2],[2,2]]){const diff=depth[(y+dy)*width+x+dx]-depth[k];if(diff>.035&&diff<.32)occlusion+=.035;}
  for(let c=0;c<3;c++)pixels[k*4+c]*=1-occlusion;
 }
 return pixels;
}
