const seeded=start=>{let seed=start;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
export function meadowTexture(makeCanvas){
 const canvas=makeCanvas(512,512),ctx=canvas.getContext('2d'),rand=seeded(981);
 ctx.fillStyle='#78a844';ctx.fillRect(0,0,512,512);
 for(let i=0;i<180;i++){const x=rand()*512,y=rand()*512,r=12+rand()*55,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3?'#c9d87820':'#335d2926');g.addColorStop(1,'#84ae4600');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 for(let i=0;i<21000;i++){const x=rand()*512,y=rand()*512;ctx.fillStyle=i%3?'#dce39422':'#254b2529';ctx.fillRect(x,y,.5+rand()*1.4,.5+rand()*1.4);}
 for(let i=0;i<950;i++){const x=rand()*512,y=rand()*512;ctx.strokeStyle=i%2?'#b5ce6e60':'#486f3260';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-1,y-2);ctx.moveTo(x,y);ctx.lineTo(x+1.5,y-3);ctx.stroke();}
 return canvas;
}
export function battlefieldScenery(field){
 const random=seeded(7951),out=[],{width,height}=field;
 // Clumps frame the battlefield while keeping deployment edges visible.
 for(let z=-13;z<height+10;z+=2.5)for(let x=-15;x<width+15;x+=2.5){
  const xx=x+(random()-.5)*1.5,zz=z+(random()-.5)*1.5;
  if(zz>height+1||xx>-3&&xx<width+3&&zz>-4&&zz<height+3)continue;
  out.push({key:random()<.56?'oak':'spruce',x:xx,z:zz,width:3.6+random()*1.8,bottom:.10});
 }
 for(let i=0;i<29;i++){const x=-8+i*1.9,z=height+2+Math.sin(x*.25)*.9+(random()-.5)*.5;out.push({key:'rocks',x,z,width:1.4+random()*.9,bottom:.08});}
 for(let i=0;i<20;i++){const x=random()*width,z=random()*height;if(x>5&&x<width-5&&z>4&&z<height-4)continue;out.push({key:'rocks',x,z,width:.4+random()*.45,bottom:.05});}
 return out.sort((a,b)=>a.x+a.z-b.x-b.z);
}
export function paintGround(ctx,camera,field,project,texture,buildings=[]){
 const tile=camera.tile*camera.zoom,{width,height}=field,p=project;
 const polygon=(points,fill,stroke=null,line=1)=>{ctx.beginPath();points.forEach(([x,z],i)=>{const q=p(x,z);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke();}};
 const anchor=p(0,0),pattern=ctx.createPattern(texture,'repeat');ctx.save();ctx.translate(anchor.x,anchor.y);const scale=tile/28;ctx.scale(scale,scale);ctx.fillStyle=pattern;ctx.fillRect(-4000,-4000,8000,8000);ctx.restore();
 // Very soft diamond turf patches give a readable world scale, without a grid.
 const random=seeded(172);for(let z=-4;z<height+5;z+=2)for(let x=-4;x<width+5;x+=2){const tone=random();if(tone>.62)polygon([[x,z],[x+2,z],[x+2,z+2],[x,z+2]],tone>.87?'#c5cf7620':'#234f2010');}
 const shore=[];for(let i=-400;i<=400;i+=2)shore.push([i,height+2+Math.sin(i*.25)*.9]);
 polygon([...shore,[400,800],[-400,800]],'#afac70');
 const water=ctx.createLinearGradient(0,camera.height*.5,0,camera.height);water.addColorStop(0,'#4ca6a3');water.addColorStop(.35,'#398b96');water.addColorStop(1,'#26566f');
 polygon([...shore.map(([x,z])=>[x,z+.45]),[400,800],[-400,800]],water);
 for(let i=0;i<8;i++){const z=height+3+i*1.15;ctx.beginPath();for(let x=-20;x<width+20;x+=2){const q=p(x,z+Math.sin(x*.25+i)*.16);x===-20?ctx.moveTo(q.x,q.y):ctx.lineTo(q.x,q.y);}ctx.strokeStyle='#b8ede329';ctx.lineWidth=Math.max(.6,tile*.035);ctx.stroke();}
 // Worn earth follows actual structures instead of covering the whole village.
 for(const b of buildings){if(b.kind==='wall')continue;const {width:w,depth:d}=b.collision,at=p(b.x,b.y);ctx.save();ctx.translate(at.x,at.y);ctx.scale(1,.5);const radius=(w+d)*tile*.33,g=ctx.createRadialGradient(0,0,radius*.42,0,0,radius);g.addColorStop(0,'#ae9a5d88');g.addColorStop(.72,'#b3a36855');g.addColorStop(1,'#ae9a5d00');ctx.fillStyle=g;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore();}
 for(const [x,z,w,d]of [[19,26,2,6],[19,0,2,6],[7,11.6,26,.65],[7,20.6,26,.65]])polygon([[x,z],[x+w,z],[x+w,z+d],[x,z+d]],'#d6bb7830');
 const m=field.margin||3;ctx.save();ctx.setLineDash([tile*.30,tile*.12]);ctx.lineWidth=Math.max(1.25,tile*.055);ctx.strokeStyle='#ef695ae0';ctx.beginPath();[[m,m],[width-m,m],[width-m,height-m],[m,height-m],[m,m]].forEach(([x,z],i)=>{const q=p(x,z);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.stroke();ctx.restore();
 // A subtle perimeter vignette separates the bright play area from the forest.
 const light=ctx.createRadialGradient(camera.width*.5,camera.originY??camera.height*.43,camera.width*.20,camera.width*.5,camera.height*.45,camera.width*.70);light.addColorStop(0,'#102a1600');light.addColorStop(1,'#102a1640');ctx.fillStyle=light;ctx.fillRect(0,0,camera.width,camera.height);
}
