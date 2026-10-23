import {weaponMount} from './battle-aim.mjs?v=3';
import {loadArtImage} from './battle-village-assets.mjs?v=7';
const add=(a,b,s=1)=>({x:a.x+b.x*s,y:a.y+b.y*s,h:a.h+b.h*s});
const scale=(v,s)=>({x:v.x*s,y:v.y*s,h:v.h*s});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.h*b.h;
const normal=v=>scale(v,1/(Math.hypot(v.x,v.y,v.h)||1));
function shade(hex,n){const light=normal({x:-.5,y:-.65,h:1}),half=normal({x:.2,y:.15,h:1.3}),factor=.40+Math.max(0,dot(n,light))*.78,spec=Math.pow(Math.max(0,dot(n,half)),24)*28,color=parseInt(hex.slice(1),16);return '#'+[color>>16,(color>>8)&255,color&255].map(v=>Math.min(255,Math.round(v*factor+spec)).toString(16).padStart(2,'0')).join('');}
function face(faces,points,color,n,normals=null){faces.push({points,color:shade(color,n),colors:normals?.map(v=>shade(color,v)),depth:points.reduce((s,p)=>s+p.x+p.y+p.h*.5,0)/points.length});}
function tube(faces,a,b,r0,r1,color,{segments=14,cap=true,open=false}={}){
 const axis=normal(add(b,a,-1)),side=normal(Math.abs(axis.h)>.99?{x:1,y:0,h:0}:{x:-axis.y,y:axis.x,h:0}),up={x:axis.y*side.h-axis.h*side.y,y:axis.h*side.x-axis.x*side.h,h:axis.x*side.y-axis.y*side.x};
 const ring=(center,r)=>Array.from({length:segments},(_,i)=>add(add(center,side,Math.cos(i*Math.PI*2/segments)*r),up,Math.sin(i*Math.PI*2/segments)*r));
 const first=ring(a,r0),last=ring(b,r1);
 for(let i=0;i<segments;i++){const j=(i+1)%segments,a=(i+.5)*Math.PI*2/segments,n=k=>add(scale(side,Math.cos(k*Math.PI*2/segments)),up,Math.sin(k*Math.PI*2/segments));face(faces,[first[i],first[j],last[j],last[i]],color,add(scale(side,Math.cos(a)),up,Math.sin(a)),[n(i),n(j),n(j),n(i)]);}
 if(cap){face(faces,first,color,scale(axis,-1));face(faces,last,open?'#121c25':color,axis);}
}
function box(faces,center,sx,sy,sz,angle,color){
 const c=Math.cos(angle),s=Math.sin(angle),v=(x,y,h)=>({x:center.x+x*c-y*s,y:center.y+x*s+y*c,h:center.h+h});
 const p=[v(-sx,-sy,0),v(sx,-sy,0),v(sx,sy,0),v(-sx,sy,0),v(-sx,-sy,sz),v(sx,-sy,sz),v(sx,sy,sz),v(-sx,sy,sz)];
 for(const [ids,n]of [[[0,1,5,4],{x:s,y:-c,h:0}],[[1,2,6,5],{x:c,y:s,h:0}],[[2,3,7,6],{x:-s,y:c,h:0}],[[3,0,4,7],{x:-c,y:-s,h:0}],[[4,5,6,7],{x:0,y:0,h:1}]])face(faces,ids.map(i=>p[i]),color,n);
}
export function defenseGeometry(kind,mount,kick=0,foundation=true){
 const faces=[],angle=mount.angle,c=Math.cos(angle),s=Math.sin(angle),local=(f,side,h)=>({x:c*f-s*side,y:s*f+c*side,h});
 if(foundation&&(kind==='cannon'||kind==='mortar')){
  tube(faces,{x:0,y:0,h:.02},{x:0,y:0,h:.15},1.02,1.02,'#899ba4',{segments:12});
  tube(faces,{x:0,y:0,h:.15},{x:0,y:0,h:.21},.84,.86,'#d6b061',{segments:12});
 }
 if(kind==='cannon'){
  box(faces,local(-.12,0,.23),.58,.48,.28,angle,'#345b86');
  for(const side of [-1,1]){
   const a=local(-.14,side*.45,.40),b=local(-.14,side*.68,.40);
   tube(faces,a,b,.35,.35,'#533d2b');tube(faces,add(a,{x:0,y:0,h:0}),b,.32,.32,'#a67836');
   tube(faces,local(-.14,side*.68,.40),local(-.14,side*.72,.40),.13,.13,'#e3bb62');
   for(let i=0;i<6;i++){const theta=i*Math.PI/3,A=local(-.14,side*.735,.40),B=local(-.14+Math.cos(theta)*.27,side*.735,.40+Math.sin(theta)*.27);tube(faces,A,B,.027,.027,'#e6bc6b',{segments:5});}
  }
 }else if(kind==='mortar'){
  tube(faces,{x:0,y:0,h:.21},{x:0,y:0,h:.44},.60,.48,'#31577d',{segments:12});
  for(const side of [-1,1])box(faces,local(0,side*.46,.23),.29,.13,.34,angle,'#b58c44');
 }else if(kind==='tower'){
  const pivot={x:0,y:0,h:mount.pivot.h};tube(faces,add(pivot,{x:0,y:0,h:-.18}),pivot,.22,.20,'#b88740',{segments:10});
  const rear=local(-.32,0,pivot.h),tip=add(pivot,mount.direction,mount.length);
  tube(faces,rear,tip,.055,.035,'#b37c3c',{segments:7});
  const L=local(.10,-.44,pivot.h+.02),R=local(.10,.44,pivot.h+.02),M=local(.36,0,pivot.h+.03);
  tube(faces,L,M,.045,.035,'#e0ba69',{segments:6});tube(faces,R,M,.045,.035,'#e0ba69',{segments:6});tube(faces,L,rear,.012,.012,'#e8e3b7',{segments:4});tube(faces,R,rear,.012,.012,'#e8e3b7',{segments:4});return faces;
 }else return faces;
 const pivot={x:0,y:0,h:mount.pivot.h},axis=mount.direction,origin=add(pivot,axis,-kick),radius=kind==='mortar'?.31:.235;
 // Split long barrel faces axially so rings cannot be painted behind a single
 // long polygon when the tube points away from the camera.
 for(let i=0;i<18;i++){const a=-.30+(mount.length+.30)*i/18,b=-.30+(mount.length+.30)*(i+1)/18;const r=v=>radius*(1.15-.15*(v+.30)/(mount.length+.30));tube(faces,add(origin,axis,a),add(origin,axis,b),r(a),r(b),'#38414a',{segments:20,cap:i===0});}
 for(const at of [-.28,.02,mount.length*.56,mount.length-.10])tube(faces,add(origin,axis,at),add(origin,axis,at+.075),radius*1.17,radius*1.17,'#e7ba5f');
 // Thick visible rim and dark bore, both projected on the actual barrel axis.
 const tip=add(origin,axis,mount.length+.001);tube(faces,tip,add(tip,axis,.008),radius*.83,radius*.83,'#101b26',{open:true});
 return faces;
}
function drawModel(ctx,faces){
 const W=192,image=ctx.createImageData(W,W),rgba=image.data,depth=new Float32Array(W*W).fill(-Infinity);
 for(const f of faces){const vertices=f.points.map((p,i)=>{const rgb=parseInt((f.colors?.[i]||f.color).slice(1),16);return{x:96+(p.x-p.y)*24,y:127.5+(p.x+p.y)*12-p.h*48,z:p.x+p.y+p.h*.5,r:rgb>>16,g:(rgb>>8)&255,b:rgb&255};});
  for(let i=1;i<vertices.length-1;i++){const a=vertices[0],b=vertices[i],c=vertices[i+1],area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<.001)continue;
   const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(W-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(W-1,Math.ceil(Math.max(a.y,b.y,c.y)));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/area,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/area,w=1-u-v;if(u<0||v<0||w<0)continue;const z=u*a.z+v*b.z+w*c.z,k=y*W+x;if(z<depth[k])continue;depth[k]=z;rgba[k*4]=u*a.r+v*b.r+w*c.r;rgba[k*4+1]=u*a.g+v*b.g+w*c.g;rgba[k*4+2]=u*a.b+v*b.b+w*c.b;rgba[k*4+3]=255;}
  }
 }ctx.putImageData(image,0,0);
}
export function createDefensePainter(makeCanvas){
 const images=new Map(),bases=new Map();
 return {
  setBases(tiles){for(const kind of ['cannon','mortar']){const art=tiles.get(kind+'-base');if(art)bases.set(kind,{image:art.image,anchor:{x:.5,y:.20}});}images.clear();},
  async load(signal){
   const image=await loadArtImage(new URL('assets/battle-style/defense-foundations.webp',import.meta.url).href,signal),probe=makeCanvas(image.width,image.height),context=probe.getContext('2d');context.drawImage(image,0,0);const rgba=context.getImageData(0,0,image.width,image.height).data;
   for(const [kind,a,b,anchorX,anchorY]of [['cannon',0,812,414,414],['mortar',812,1536,1172,445]]){
    const minX=Math.round(a*image.width/1536),maxX=Math.round(b*image.width/1536);let l=maxX,r=-1,top=image.height,bottom=-1;
    for(let y=0;y<image.height;y++)for(let x=minX;x<maxX;x++)if(rgba[(y*image.width+x)*4+3]>80){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(r<l)throw Error('Socle de défense vide');const tile=makeCanvas(r-l+1,bottom-top+1);tile.getContext('2d').drawImage(image,l,top,tile.width,tile.height,0,0,tile.width,tile.height);
    bases.set(kind,{image:tile,anchor:{x:(anchorX*image.width/1536-l)/tile.width,y:(anchorY*image.height/1024-top)/tile.width}});
   }
   probe.width=probe.height=1;images.clear();return true;
  },
  paint(ctx,building,at,t,elapsed,reduced=false){
   const base=bases.get(building.kind);
   if(base){const w=t*1.95;ctx.drawImage(base.image,at.x-base.anchor.x*w,at.y-t*.30-base.anchor.y*w,w,w*base.image.height/base.image.width);}
   const mount=weaponMount(building,building.aim),age=elapsed-(building.lastAttackAt??-10),kick=!reduced&&age>=0&&age<.24?Math.sin(age/.24*Math.PI)*.12:0;
   const key=[building.kind,mount.angle.toFixed(2),mount.pitch.toFixed(2),kick.toFixed(2)].join(':');let image=images.get(key);
   if(!image){image=makeCanvas(192,192);drawModel(image.getContext('2d'),defenseGeometry(building.kind,mount,kick,!base));images.set(key,image);if(images.size>40){const oldest=images.keys().next().value;images.get(oldest).width=images.get(oldest).height=1;images.delete(oldest);}}
   const scale=t/48;ctx.drawImage(image,at.x-96*scale,at.y-127.5*scale,192*scale,192*scale);
  },
  dispose(){for(const image of images.values())image.width=image.height=1;images.clear();for(const base of bases.values())base.image.width=base.image.height=1;bases.clear();},
  get count(){return images.size;}
 };
}
