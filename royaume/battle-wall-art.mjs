// Connected training masonry, with individual bevelled stone courses.
// Sixteen cached tiles retain the exact world footprint used by navigation.
export function createBattleWallArt(makeCanvas){
 const cache=new Map();
 return function wall(mask=0){
  if(cache.has(mask))return cache.get(mask);
  const unit=128,image=makeCanvas(176,176),ctx=image.getContext('2d'),anchor={x:88,y:132};
  const p=(x,z,h=0)=>({x:anchor.x+(x-z)*unit*.5,y:anchor.y+(x+z)*unit*.25-h*unit});
  const polygon=(points,color)=>{ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
  const stroke=(a,b,color,width=1)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  const arms=mask||3,half=.34,xs=[-.52,-half,half,.52],zs=[-.52,-half,half,.52];
  const filled=(i,j)=>i===1&&j===1||j===1&&(i===0&&(arms&2)||i===2&&(arms&1))||i===1&&(j===0&&(arms&8)||j===2&&(arms&4));
  function face(a,b,low,high,shade){
   const along=(u,h)=>p(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,h),span=Math.hypot(a[0]-b[0],a[1]-b[1]),rows=high-low>.3?3:1,columns=span>.5?2:1;
   polygon([along(0,low),along(1,low),along(1,high),along(0,high)],shade?'#566770':'#7d8c8b');
   for(let row=0;row<rows;row++)for(let col=-1;col<columns;col++){
    const offset=row%2?.5:0,u0=Math.max(0,(col+offset)/columns)+.009/span,u1=Math.min(1,(col+1+offset)/columns)-.009/span;if(u1<=u0)continue;
    const bottom=low+(high-low)*row/rows+.008,top=low+(high-low)*(row+1)/rows-.006;
    const A=along(u0,bottom),B=along(u1,bottom),C=along(u1,top),D=along(u0,top),gradient=ctx.createLinearGradient(0,D.y,0,A.y);
    gradient.addColorStop(0,shade?'#94a0a3':'#cccab4');gradient.addColorStop(.23,shade?'#7d8c94':'#aeb8ae');gradient.addColorStop(1,shade?'#647883':'#8c9e9d');polygon([A,B,C,D],gradient);
    stroke(D,C,shade?'#b4beb5':'#eae2c3',1.8);stroke(D,A,shade?'#9daea9':'#cbd0bb',1.2);stroke(A,B,'#465c6977',1.3);stroke(B,C,'#465c6955',1.2);
   }
  }
  // A thin footing grounds the wall; connected arms share their seam.
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(filled(i,j)){
   if(!filled(i+1,j))face([xs[i+1],zs[j]],[xs[i+1],zs[j+1]],.02,.52,true);
   if(!filled(i,j+1))face([xs[i],zs[j+1]],[xs[i+1],zs[j+1]],.02,.52,false);
  }
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(filled(i,j)){
   const points=[p(xs[i],zs[j],.52),p(xs[i+1],zs[j],.52),p(xs[i+1],zs[j+1],.52),p(xs[i],zs[j+1],.52)];polygon(points,'#c5c9af');stroke(points[1],points[2],'#eff0d0',1.8);stroke(points[2],points[3],'#f1e4bd',1.8);
  }
  const corner=Boolean((arms&3)&&(arms&12)),w=corner?.28:.23,h=corner?.76:.68,bevel=.045;
  face([w,-w],[w,w],.52,h-bevel,true);face([-w,w],[w,w],.52,h-bevel,false);
  const outer=[p(-w,-w,h-bevel),p(w,-w,h-bevel),p(w,w,h-bevel),p(-w,w,h-bevel)],inner=[p(-w+bevel,-w+bevel,h),p(w-bevel,-w+bevel,h),p(w-bevel,w-bevel,h),p(-w+bevel,w-bevel,h)];
  polygon(outer,'#aeb9aa');polygon([outer[1],outer[2],inner[2],inner[1]],'#cbd1b7');polygon([outer[2],outer[3],inner[3],inner[2]],'#e3daba');polygon(inner,'#eee6c8');
  const result={image,unit,anchor};cache.set(mask,result);return result;
 };
}
