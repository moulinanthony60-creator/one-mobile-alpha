const seeded=start=>{let seed=start;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
export function meadowTexture(makeCanvas){
 const canvas=makeCanvas(384,384),ctx=canvas.getContext('2d'),rand=seeded(981);
 ctx.fillStyle='#749348';ctx.fillRect(0,0,384,384);
 for(let i=0;i<95;i++){const x=rand()*384,y=rand()*384,r=8+rand()*44,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3?'#c8c57b22':'#294b2928');g.addColorStop(1,'#8eac4500');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 for(let i=0;i<16000;i++){const x=rand()*384,y=rand()*384;ctx.fillStyle=i%3?'#d1ca7728':'#29492530';ctx.fillRect(x,y,.5+rand()*1.6,.5+rand()*1.8);}
 return canvas;
}
export function battlefieldScenery(field){
 const random=seeded(7951),out=[],{width,height}=field;
 for(let z=-15;z<height+13;z+=2.6)for(let x=-18;x<width+18;x+=2.6){
  const xx=x+(random()-.5)*1.5,zz=z+(random()-.5)*1.5;
  if(zz>height+1)continue;
  if(xx>-2.5&&xx<width+2.5&&zz>-3&&zz<height+2.5)continue;
  out.push({key:random()<.58?'oak':'spruce',x:xx,z:zz,width:5.2+random()*1.8,bottom:.10});
 }
 for(let i=0;i<28;i++){const x=-10+i*2.1,z=height+1.5+Math.sin(x*.32)*1.25+(random()-.5)*.6;out.push({key:'rocks',x,z,width:1.8+random()*1.0,bottom:.08});}
 for(let i=0;i<50;i++){const x=random()*width,z=random()*height;if(x>5&&x<width-5&&z>4&&z<height-4)continue;if(i%3===0)out.push({key:'rocks',x,z,width:.55+random()*.55,bottom:.06});}
 return out.sort((a,b)=>a.x+a.z-b.x-b.z);
}
export function paintGround(ctx,camera,field,project,texture){
 const tile=camera.tile*camera.zoom,{width,height}=field,p=project;
 const polygon=(points,fill,stroke=null,line=1)=>{ctx.beginPath();points.forEach(([x,z],i)=>{const q=p(x,z);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke();}};
 const anchor=p(0,0),pattern=ctx.createPattern(texture,'repeat');ctx.save();ctx.translate(anchor.x,anchor.y);const scale=tile/32;ctx.scale(scale,scale);ctx.fillStyle=pattern;ctx.fillRect(-4000,-4000,8000,8000);ctx.restore();
 // River beyond the deployment field, with a sandy bank and shallow water.
 const shore=[];for(let i=-20;i<=width+20;i+=2)shore.push([i,height+1.5+Math.sin(i*.32)*1.25]);
 const water=ctx.createLinearGradient(0,camera.height*.45,0,camera.height);water.addColorStop(0,'#487d86');water.addColorStop(1,'#244857');
 polygon([...shore,[width+30,height+60],[-40,height+60]],water,'#b9aa6b',tile*.48);
 for(let i=0;i<9;i++){const z=height+3+i*1.3;ctx.beginPath();for(let x=-20;x<width+20;x+=2){const q=p(x,z+Math.sin(x*.35+i)*.18);x===-20?ctx.moveTo(q.x,q.y):ctx.lineTo(q.x,q.y);}ctx.strokeStyle='#97d1c012';ctx.lineWidth=1.5;ctx.stroke();}
 // Low contrast isometric grass plots and narrow paths between compartments.
 for(let z=3;z<height-2;z++)for(let x=3;x<width-2;x++)polygon([[x,z],[x+1,z],[x+1,z+1],[x,z+1]],(x+z)%2?'#cfce8910':'#34531c0d');
 for(const x of [15,25])polygon([[x-.38,5],[x+.38,5],[x+.38,27],[x-.38,27]],'#bbac6b40');
 for(const z of [12,21])polygon([[6,z-.38],[34,z-.38],[34,z+.38],[6,z+.38]],'#bbac6b40');
 polygon([[19,26],[21,26],[21,height+1],[19,height+1]],'#b6a56d50');
 const m=field.margin||3;ctx.save();ctx.setLineDash([tile*.18,tile*.22]);ctx.lineWidth=1.25;ctx.strokeStyle='#b6ecf5aa';ctx.beginPath();[[m,m],[width-m,m],[width-m,height-m],[m,height-m],[m,m]].forEach(([x,z],i)=>{const q=p(x,z);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.stroke();ctx.restore();
}
