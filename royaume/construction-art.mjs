// Short, perspective-aligned bays on the flanks keep the entrance visible.
export function paintScaffolding(ctx,o,f,project,t){
 const p=o.plot,wall=p.kind==='wall',height=wall?t*.42:Math.min(o.height*.32,t*1.55),bay=wall?.65:Math.min(f.w*.40,1.65),depth=wall?.28:.42;
 const faces=wall?[[p.x-.45,p.z+.6,1,0]]:[[p.x-.6,p.z+f.d-.35,1,0],[p.x+f.w-.35,p.z-.6,0,1]];
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const line=(a,b,w,color)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 const beam=(a,b,w=t*.052)=>{line(a,b,w+1,'#493321');line({x:a.x-.4,y:a.y-.6},{x:b.x-.4,y:b.y-.6},w,'#997147');line({x:a.x-.8,y:a.y-1},{x:b.x-.8,y:b.y-1},Math.max(.6,w*.2),'#d8b479');};
 for(const [x,z,dx,dz] of faces){
  const point=(u,v,h=0)=>{const q=project(x+dx*u+dz*v,z+dz*u+dx*v);return {x:q.x,y:q.y-h};};
  for(const v of [0,depth])for(const u of [0,bay])beam(point(u,v),point(u,v,height+t*.12));
  for(const h of [height*.43,height]){
   const corners=[point(-.08,-.06,h),point(bay+.08,-.06,h),point(bay+.08,depth+.06,h),point(-.08,depth+.06,h)];
   ctx.fillStyle='#c3975d';ctx.beginPath();corners.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();
   beam(corners[0],corners[1],t*.045);beam(corners[1],corners[2],t*.045);
   line(point(0,depth*.5,h),point(bay,depth*.5,h),Math.max(.6,t*.012),'#85603d');
  }
  beam(point(0,depth,height*.08),point(bay,depth,height*.43),t*.032);
  // Rope lashings on each upright.
  for(const u of [0,bay])for(const h of [height*.43,height]){const q=point(u,depth,h);line({x:q.x-t*.04,y:q.y+1},{x:q.x+t*.04,y:q.y-1},Math.max(1,t*.03),'#e4c695');}
  if(!wall){const a=point(bay*.2,depth+.32),b=point(bay*.2,depth,height),c=point(bay*.46,depth+.32),d=point(bay*.46,depth,height);beam(a,b,t*.032);beam(c,d,t*.032);for(let i=1;i<7;i++){const u=i/7;beam({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},{x:c.x+(d.x-c.x)*u,y:c.y+(d.y-c.y)*u},t*.026);}}
 }
 ctx.restore();
}
