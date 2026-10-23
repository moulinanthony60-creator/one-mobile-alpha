// Training-only masonry. Connected arms share a footprint and the same light.
// A small sixteen-entry sprite cache avoids constructing paths every frame.
export function createBattleWallArt(makeCanvas){
 const cache=new Map();
 return function wall(mask=0){
  if(cache.has(mask))return cache.get(mask);
  const unit=128,image=makeCanvas(176,176),ctx=image.getContext('2d'),anchor={x:88,y:132};
  const p=(x,z,h=0)=>({x:anchor.x+(x-z)*unit*.5,y:anchor.y+(x+z)*unit*.25-h*unit});
  const polygon=(points,color)=>{ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
  const arms=mask||3,half=.34,xs=[-.52,-half,half,.52],zs=[-.52,-half,half,.52];
  const filled=(i,j)=>i===1&&j===1||j===1&&(i===0&&(arms&2)||i===2&&(arms&1))||i===1&&(j===0&&(arms&8)||j===2&&(arms&4));
  function face(a,b,low,high,shade){
   polygon([p(...a,low),p(...b,low),p(...b,high),p(...a,high)],shade?'#777d77':'#a5a99a');
   const A=p(...a,high),B=p(...b,high);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.strokeStyle=shade?'#aeb3a2':'#e6dfbd';ctx.lineWidth=2.4;ctx.stroke();
   const mid=(low+high)/2;for(const h of [mid]){const c=p(...a,h),d=p(...b,h);ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.strokeStyle='#515c566e';ctx.lineWidth=2;ctx.stroke();}
   for(const [u,lo,hi]of [[.33,low,mid],[.72,low,mid],[.50,mid,high]]){const x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u,c=p(x,z,lo),d=p(x,z,hi);ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.lineWidth=1.4;ctx.stroke();}
  }
  // Broad, opaque stone replaces the thin repeated decorative railings.
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(filled(i,j)){
   if(!filled(i+1,j))face([xs[i+1],zs[j]],[xs[i+1],zs[j+1]],.02,.52,true);
   if(!filled(i,j+1))face([xs[i],zs[j+1]],[xs[i+1],zs[j+1]],.02,.52,false);
  }
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(filled(i,j))polygon([p(xs[i],zs[j],.52),p(xs[i+1],zs[j],.52),p(xs[i+1],zs[j+1],.52),p(xs[i],zs[j+1],.52)],'#d5d2b7');
  const corner=Boolean((arms&3)&&(arms&12)),w=corner?.28:.23,h=corner?.76:.68;
  face([w,-w],[w,w],.52,h,true);face([-w,w],[w,w],.52,h,false);
  polygon([p(-w,-w,h),p(w,-w,h),p(w,w,h),p(-w,w,h)],'#eee4c7');
  const result={image,unit,anchor};cache.set(mask,result);return result;
 };
}
