// One exclusive rectangle per patch: floor and ceiling colours never overlap.
export function paintTiles(world){
 const xs=new Set([-world.width/2,world.width/2]),zs=new Set([-world.depth/2,world.depth/2]);
 for(const [x,z,w,d] of world.zones||[]){for(const v of [x-w/2,x+w/2])xs.add(Math.max(-world.width/2,Math.min(world.width/2,v)));for(const v of [z-d/2,z+d/2])zs.add(Math.max(-world.depth/2,Math.min(world.depth/2,v)));}
 const xx=[...xs].sort((a,b)=>a-b),zz=[...zs].sort((a,b)=>a-b),tiles=[];
 for(let i=1;i<xx.length;i++)for(let j=1;j<zz.length;j++){
  const x=(xx[i-1]+xx[i])/2,z=(zz[j-1]+zz[j])/2;let c=-1;
  for(const [cx,cz,w,d,color]of world.zones||[])if(Math.abs(x-cx)<w/2&&Math.abs(z-cz)<d/2)c=color;
  tiles.push({x,z,w:xx[i]-xx[i-1],d:zz[j]-zz[j-1],c});
 }
 return tiles;
}
export function wallPictures(world){
 const out=[];
 world.walls.forEach((w,wall)=>{
  // Side walls and both faces of long interior partitions. End walls keep windows.
  if(w.d<4||w.w>1)return;
  const normals=wall===0?[1]:wall===1?[-1]:[1,-1],count=Math.max(1,Math.floor((w.d-2)/6));
  for(const nx of normals)for(let i=0;i<count;i++)out.push({wall,nx,x:w.x+nx*(w.w/2+.014),z:w.z+(i-(count-1)/2)*6,y:1.65,w:2.35,h:1.55,design:(wall*3+i)%6});
 });
 return out;
}
// Paint hiders can use the visible gaps under and inside furniture. Keep the
// broad collision boxes of the other games unchanged.
export function paintPropBlocks(p,type){
 const boxes=[],add=(w,h,d,x,y,z)=>boxes.push({x:p.x+x,z:p.z+z,y,w,h,d,c:p.c,prop:p.id});
 const leg=(x,z,h)=>add(.085,h,.085,x,0,z);
 if(p.type==='table'||p.type==='bench'){
  const bench=p.type==='bench',d=bench?.7:1.08,y=bench?.52:.91;
  add(1.8,.13,d,0,y-.06,0);for(const x of [-.73,.73])for(const z of [-d*.35,d*.35])leg(x,z,y-.07);
  if(bench){for(const x of [-.73,.73])add(.08,.7,.08,x,.45,.28);for(const h of [.87,1.09])add(1.8,.15,.07,0,h-.075,.28);}
 }else if(p.type==='chair'||p.type==='stool'){
  const chair=p.type==='chair',r=chair?.65:.55,h=chair?.46:.62;
  add(r,.11,r,0,h-.055,0);for(const x of [-r*.36,r*.36])for(const z of [-r*.36,r*.36])leg(x,z,h-.04);
  if(chair){for(const x of [-.27,.27])add(.065,.62,.07,x,.42,.27);for(const y of [.75,.9,1.02])add(.54,.065,.09,0,y-.0325,.27);}
 }else if(p.type==='shelf'){
  for(const x of [-.75,.75])add(.1,2.3,.72,x,0,0);add(1.5,2.22,.045,0,.04,.32);
  for(const y of [.12,.78,1.46,2.22]){add(1.6,.065,.72,0,y-.0325,0);if(y<2)for(let j=0;j<4;j++){const h=.27+j%3*.09;add(.18,h,.38,-.56+j*.34,y+.045,0);}}
 }else add(type.w,type.h,type.d,0,0,0);
 return boxes;
}
