const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function effectAge(fx,elapsed,presentation){return Math.max(0,elapsed-(presentation?(1-clamp(presentation.alpha??1,0,1))/30:0)-(fx.firedAt??elapsed));}
export function shotStyle(source){return {guardians:'slash',archers:'arrow',mages:'magic',tower:'arrow',cannon:'cannon',mortar:'mortar',arcane:'arcane'}[source.kind]||'arrow';}
export function shotTiming(style,distance){const flight=style==='slash'?.12:style==='mortar'?clamp(.48+distance*.055,.55,.92):style==='arcane'?.22:clamp(.18+distance*.04,.25,.48);return {flight,duration:flight+(style==='mortar'?.48:.30)};}
export function shotPosition(fx,age,project,tile){
 const from=project(fx.fromX,fx.fromY),to=project(fx.x,fx.y),progress=clamp(age/fx.flight,0,1);
 const sourceHeight=fx.kind==='enemy'?({tower:1.65,cannon:.65,mortar:.58,arcane:1.4}[fx.sourceKind]||.65):.68;
 const start={x:from.x,y:from.y-tile*sourceHeight},end={x:to.x,y:to.y-tile*(fx.kind==='enemy'?.48:.44)};
 const arc=fx.style==='mortar'?tile*2.2:fx.style==='arrow'?tile*.36:fx.style==='magic'?tile*.20:0;
 return {x:start.x+(end.x-start.x)*progress,y:start.y+(end.y-start.y)*progress-Math.sin(progress*Math.PI)*arc,start,end,progress};
}
const stroke=(ctx,a,b,color,width)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();};
const disk=(ctx,x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
export function paintCombatShot(ctx,fx,age,project,tile,{economy=false,reduced=false}={}){
 if(age>fx.duration||!fx.style)return;
 const s=shotPosition(fx,age,project,tile),scale=Math.max(.8,tile/26),heavy=fx.style==='cannon'||fx.style==='mortar';
 const color=fx.style==='arcane'?'#72f4ff':fx.style==='magic'?'#d1a1ff':heavy?'#ffd478':'#ffe6ac';
 ctx.save();
 // Muzzle flashes remain present in economy mode: they explain who is firing.
 if(age<.17&&fx.kind==='enemy'){
  const k=1-age/.17,r=(heavy?9:6)*scale*(.5+k*.5);
  disk(ctx,s.start.x,s.start.y,r,color);disk(ctx,s.start.x,s.start.y,r*.45,'#fff9d5');
  if(!reduced)for(let i=0;i<5;i++){const a=i*Math.PI*2/5;stroke(ctx,{x:s.start.x+Math.cos(a)*r*.8,y:s.start.y+Math.sin(a)*r*.8},{x:s.start.x+Math.cos(a)*r*1.6,y:s.start.y+Math.sin(a)*r*1.6},color,1.4*scale);}
 }
 if(age<fx.flight){
  if(fx.style==='slash'){
   const a=Math.atan2(s.end.y-s.start.y,s.end.x-s.start.x),r=tile*.44;
   ctx.beginPath();ctx.arc(s.end.x,s.end.y,r,a-Math.PI*.8+s.progress*.5,a+Math.PI*.15+s.progress*.5);ctx.strokeStyle='#fff0c9';ctx.lineWidth=3*scale;ctx.stroke();
  }else if(fx.style==='arcane'){
   ctx.globalAlpha=1-s.progress*.35;stroke(ctx,s.start,s.end,'#209fb9',5*scale);stroke(ctx,s.start,s.end,'#e5ffff',1.8*scale);
  }else{
   const tail=shotPosition(fx,Math.max(0,age-.06),project,tile),dx=s.x-tail.x,dy=s.y-tail.y,angle=Math.atan2(dy,dx);
   if(fx.style==='arrow'){
    const len=11*scale,a={x:s.x-Math.cos(angle)*len,y:s.y-Math.sin(angle)*len};stroke(ctx,a,s,'#4c311c',3*scale);stroke(ctx,a,s,'#ffe2a4',1.4*scale);
    stroke(ctx,s,{x:s.x-Math.cos(angle-.5)*4*scale,y:s.y-Math.sin(angle-.5)*4*scale},'#fff8de',1.3*scale);
   }else{
    stroke(ctx,tail,s,color,(heavy?4:5)*scale);disk(ctx,s.x,s.y,(heavy?4.7:4)*scale,heavy?'#293742':'#a884ff');disk(ctx,s.x-scale,s.y-scale,(heavy?1.7:2)*scale,heavy?'#d8a34e':'#f5e7ff');
   }
   if(fx.style==='mortar'&&!economy){const ground=project(fx.fromX+(fx.x-fx.fromX)*s.progress,fx.fromY+(fx.y-fx.fromY)*s.progress);ctx.fillStyle='#16312044';ctx.beginPath();ctx.ellipse(ground.x,ground.y,5*scale,2*scale,0,0,Math.PI*2);ctx.fill();}
  }
 }else{
  const impact=(age-fx.flight)/(fx.duration-fx.flight),spread=(heavy?19:11)*scale,at=s.end;
  ctx.globalAlpha=1-impact;disk(ctx,at.x,at.y,spread*(.15+impact*.45),color);disk(ctx,at.x,at.y,spread*(.08+impact*.18),'#fff8dc');
  ctx.beginPath();ctx.ellipse(at.x,at.y+3*scale,spread*(.3+impact),spread*(.16+impact*.4),0,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=2*scale;ctx.stroke();
  if(!economy&&!reduced)for(let i=0;i<(heavy?7:4);i++){const a=i*2.4+(fx.visualId||0),r=spread*impact;stroke(ctx,{x:at.x+Math.cos(a)*r*.6,y:at.y+Math.sin(a)*r*.6},{x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r+impact*impact*5},color,2*scale);}
 }
 ctx.restore();
}
