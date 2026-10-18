// Connected isometric masonry, with original geometry and thirteen material tiers.
const directions=[[1,0,1],[-1,0,2],[0,1,4],[0,-1,8]];
export function wallConnections(plot,plots){const occupied=plots instanceof Set?plots:new Set(plots.filter(p=>p.kind==='wall').map(p=>p.x+','+p.z));let mask=0;for(const [x,z,bit]of directions)if(occupied.has((plot.x+x)+','+(plot.z+z)))mask|=bit;return mask;}
const palettes=[
 [[215,197,144],'#fff1c6','#b58b4c'],[[224,204,155],'#fff3d0','#af8546'],[[218,217,190],'#fff6d7','#a9a071'],
 [[193,202,194],'#e9f0d9','#687f86'],[[189,201,207],'#e9f1df','#8b627c'],[[155,169,184],'#efe0b5','#d1a451'],
 [[130,149,169],'#e6d39d','#d6aa53'],[[106,133,157],'#c7e5ec','#d0ac62'],[[87,117,147],'#b4dfe9','#69c3df'],
 [[86,97,134],'#bfd3f1','#80bde0'],[[100,88,131],'#cabde5','#d0ac69'],[[104,79,126],'#ddc4ed','#e9c265'],
 [[74,63,108],'#efdbab','#f5cf70']
];
export function createWallArt(makeCanvas,material=null){
 const cache=new Map();
 return function wallSprite(level=1,mask=0,rotation=0){
  level=Math.max(1,Math.min(13,Math.floor(level)));const id=level+':'+mask+':'+(mask?0:rotation%2);if(cache.has(id))return cache.get(id);
  const unit=256,c=makeCanvas(304,350),ctx=c.getContext('2d'),origin={x:152,y:284},height=.34+level*.027,[stone,topColor,trim]=palettes[level-1],arms=mask||((rotation%2)?12:3),corner=!!((mask&3)&&(mask&12));
  const point=(x,z,h=0)=>({x:origin.x+(x-z)*unit*.5,y:origin.y+(x+z)*unit*.25-h*unit});
  const color=(rgb,k,offset=0)=>'rgb('+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*k+offset)))).join(',')+')';
  function polygon(points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  const noise=(x,z,n)=>{const a=Math.sin(x*53.27+z*89.31+n*13.7)*43758.5453;return a-Math.floor(a);};
  function face(a,b,lo,hi,shade,band=null){
   const length=Math.hypot(b.x-a.x,b.z-a.z),base=[point(a.x,a.z,lo),point(b.x,b.z,lo),point(b.x,b.z,hi),point(a.x,a.z,hi)];
   if(band){polygon(base,band,'#3c39494d',1);ctx.strokeStyle='#fff0c86b';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(base[2].x,base[2].y);ctx.lineTo(base[3].x,base[3].y);ctx.stroke();return;}
   polygon(base,color(stone,shade*.71));
   const rows=Math.max(1,Math.ceil((hi-lo)/.20));
   for(let row=0;row<rows;row++){
    const bottom=lo+(hi-lo)*row/rows,top=lo+(hi-lo)*(row+1)/rows,brick=.44,offset=row%2?-.22:0;
    for(let u=offset;u<length;u+=brick){const l=Math.max(0,u),r=Math.min(length,u+brick),inset=.005;if(r-l<.012)continue;const at=v=>({x:a.x+(b.x-a.x)*v/length,z:a.z+(b.z-a.z)*v/length}),pa=at(l+inset),pb=at(r-inset),n=noise(a.x+u,a.z,row),A=point(pa.x,pa.z,top-inset),B=point(pb.x,pb.z,top-inset),C=point(pa.x,pa.z,bottom+inset),D=point(pb.x,pb.z,bottom+inset);
     polygon([C,D,B,A],color(stone,shade,(n-.5)*6));
     if(material){ctx.save();ctx.transform(B.x-A.x,B.y-A.y,C.x-A.x,C.y-A.y,A.x,A.y);ctx.globalAlpha=.13;ctx.drawImage(material,material.width*.132,material.height*.014,material.width*.165,material.height*.067,0,0,1,1);ctx.restore();}
     // Broad bevels survive the small game camera; the texture never hides tier colours.
     ctx.strokeStyle=color(stone,Math.min(1.4,shade+.34));ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(C.x,C.y-1);ctx.lineTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.strokeStyle='#17203236';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(D.x,D.y);ctx.lineTo(C.x,C.y);ctx.stroke();
     if(false&&n>.8&&hi-lo>.1){const mid=point((pa.x+pb.x)/2,(pa.z+pb.z)/2,(top+bottom)/2);ctx.strokeStyle='#28333b35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mid.x,mid.y);ctx.lineTo(mid.x+3,mid.y+3);ctx.lineTo(mid.x+2,mid.y+6);ctx.stroke();}
    }
   }
  }
  function shape(width,lo,hi,top,band=null,topSurface=true){
   const half=width/2,xs=[-.5,-half,half,.5],zs=[-.5,-half,half,.5],filled=(i,j)=>i===1&&j===1||j===1&&(i===2&&(arms&1)||i===0&&(arms&2))||i===1&&(j===2&&(arms&4)||j===0&&(arms&8));
   for(let i=0;i<3;i++){let start=null;for(let j=0;j<=3;j++){const visible=j<3&&filled(i,j)&&!filled(i+1,j);if(visible&&start===null)start=j;if(!visible&&start!==null){face({x:xs[i+1],z:zs[start]},{x:xs[i+1],z:zs[j]},lo,hi,.65,band);start=null;}}}
   for(let j=0;j<3;j++){let start=null;for(let i=0;i<=3;i++){const visible=i<3&&filled(i,j)&&!filled(i,j+1);if(visible&&start===null)start=i;if(!visible&&start!==null){face({x:xs[start],z:zs[j+1]},{x:xs[i],z:zs[j+1]},lo,hi,.96,band);start=null;}}}
   if(topSurface)for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(filled(i,j))polygon([point(xs[i],zs[j],hi),point(xs[i+1],zs[j],hi),point(xs[i+1],zs[j+1],hi),point(xs[i],zs[j+1],hi)],top);
  }
  function box(x,z,w,d,lo,hi,band=null){face({x:x+w,z},{x:x+w,z:z+d},lo,hi,.65,band);face({x,z:z+d},{x:x+w,z:z+d},lo,hi,.96,band);polygon([point(x,z,hi),point(x+w,z,hi),point(x+w,z+d,hi),point(x,z+d,hi)],topColor,'#fff4d279',1.3);}
  // Ground contact and broad foundations anchor the wall without changing its footprint.
  ctx.fillStyle='#14242136';ctx.beginPath();ctx.ellipse(origin.x+14,origin.y+5,83,24,.13,0,Math.PI*2);ctx.fill();
  shape(.54,0,.06,color(stone,1.12));shape(.47,.06,.11,topColor);shape(.34,.11,height,color(stone,1.12));
  if(level>=3){box(-.105,.17,.21,.095,.08,height*.74);box(.17,-.105,.095,.21,.08,height*.74);}
  if(level>=5)shape(.36,height*.36,height*.36+.035,trim,trim,false);
  shape(.44,height,height+.055,topColor,level>=6?trim:null);
  const center=corner?.46:.32,merlons=[{x:-center/2,z:-center/2,w:center,d:center}];
  if(!corner){if(arms&2)merlons.push({x:-.5,z:-.22,w:.12,d:.44});if(arms&1)merlons.push({x:.38,z:-.22,w:.12,d:.44});if(arms&8)merlons.push({x:-.22,z:-.5,w:.44,d:.12});if(arms&4)merlons.push({x:-.22,z:.38,w:.44,d:.12});}
  merlons.sort((a,b)=>a.x+a.z-b.x-b.z);for(const m of merlons){const end=height+.17+(corner?.055:0);box(m.x,m.z,m.w,m.d,height+.055,end);if(level>=6)box(m.x-.008,m.z-.008,m.w+.016,m.d+.016,end-.01,end+.018,trim);}
  if(level>=3){const p=point(.22,.22,height*.82),w=corner?12:8,h=corner?37:26;
   polygon([{x:p.x-w,y:p.y},{x:p.x+w,y:p.y},{x:p.x+w*.78,y:p.y+h*.72},{x:p.x,y:p.y+h},{x:p.x-w*.78,y:p.y+h*.72}],level>=9?'#374b7d':'#377fc0',trim,2.4);
   ctx.strokeStyle=trim;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y+6);ctx.lineTo(p.x,p.y+h-7);ctx.moveTo(p.x-5,p.y+12);ctx.lineTo(p.x+5,p.y+12);ctx.stroke();
   if(level>=8){const g=point(.225,.225,height*.78),gem=level>=11?'#cf9aff':'#88ebff';polygon([{x:g.x,y:g.y+7},{x:g.x+4,y:g.y+13},{x:g.x,y:g.y+20},{x:g.x-4,y:g.y+13}],gem,'#e8e7ff',1);}
  }
  if(level>=11&&corner){const p=point(0,0,height+.24),gem=level===13?'#e0b4ff':'#9fe6fc';polygon([{x:p.x,y:p.y-23},{x:p.x+10,y:p.y-5},{x:p.x,y:p.y+7},{x:p.x-10,y:p.y-5}],gem,'#e9e4ff',1.5);polygon([{x:p.x,y:p.y-23},{x:p.x,y:p.y+7},{x:p.x-10,y:p.y-5}],'#794ca9');}
  const mc=makeCanvas(96,96).getContext('2d');mc.drawImage(c,0,0,96,96);const sprite={image:c,mask:mc.getImageData(0,0,96,96).data,aspect:c.height/c.width,unit,anchor:origin};cache.set(id,sprite);return sprite;
 };
}
