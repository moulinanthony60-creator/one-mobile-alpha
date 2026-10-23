const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function effectAge(fx,elapsed,presentation){return elapsed-(presentation?(1-clamp(presentation.alpha??1,0,1))/30:0)-(fx.firedAt??elapsed);}
export function shotStyle(source){return {guardians:'slash',archers:'arrow',mages:'magic',tower:'arrow',cannon:'cannon',mortar:'mortar',arcane:'arcane'}[source.kind]||'arrow';}
export function shotTiming(style,distance){const flight=style==='slash'?.12:style==='mortar'?clamp(.48+distance*.055,.55,.92):style==='arcane'?.22:clamp(.18+distance*.04,.25,.48);return {flight,duration:flight+(style==='mortar'?.48:.30)};}
export function shotPosition(fx,age,project,tile){
 const from=project(fx.fromX,fx.fromY),to=project(fx.x,fx.y),progress=clamp(age/fx.flight,0,1);
 const sourceHeight=fx.kind==='enemy'?({tower:1.65,cannon:.65,mortar:.58,arcane:1.4}[fx.sourceKind]||.65):.68;
 const start={x:from.x,y:from.y-tile*(fx.fromH??sourceHeight)},end={x:to.x,y:to.y-tile*(fx.targetH??(fx.kind==='enemy'?.48:.44))};
 const arc=tile*(fx.arc??(fx.style==='mortar'?2.2:fx.style==='arrow'?.36:fx.style==='magic'?.20:0));
 return {x:start.x+(end.x-start.x)*progress,y:start.y+(end.y-start.y)*progress-4*progress*(1-progress)*arc,start,end,progress};
}
const stroke=(ctx,a,b,color,width)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();};
const disk=(ctx,x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
export function paintCombatShot(ctx,fx,age,project,tile,{economy=false,reduced=false}={}){
 if(age<0||age>fx.duration||!fx.style)return;
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

// Deterministic debris: no particles are stored or added to the simulation.
export function paintDestruction(ctx,b,age,at,tile,{economy=false,reduced=false}={}){
 if(age<0||age>1.15||reduced)return;
 const wall=b.kind==='wall',size=wall?.45:Math.min(2.6,(b.collision.width+b.collision.depth)*.45),life=1-age/1.15;
 ctx.save();
 for(let i=0;i<(economy?3:8);i++){
  const a=i*2.399+Number(b.id.slice(1)),spread=tile*size*age*(.3+(i%3)*.11),x=at.x+Math.cos(a)*spread,y=at.y+Math.sin(a)*spread*.5-tile*Math.sin(Math.min(1,age)*Math.PI)*(.22+i%3*.1);
  ctx.globalAlpha=life;ctx.fillStyle=i%3?'#c8bd98':'#666b61';ctx.save();ctx.translate(x,y);ctx.rotate(a+age*4);ctx.fillRect(-tile*.065,-tile*.035,tile*.13,tile*.09);ctx.restore();
 }
 for(let i=0;i<(economy?2:5);i++){
  const x=at.x+Math.cos(i*2.4)*tile*size*age*.46,y=at.y-tile*age*.38+Math.sin(i*2.4)*tile*.13;
  ctx.globalAlpha=life*.31;ctx.fillStyle=i%2?'#c5b78e':'#e1cf9d';ctx.beginPath();ctx.ellipse(x,y,tile*size*(.13+age*.36),tile*size*(.09+age*.24),0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
export function paintEmbers(ctx,b,time,at,tile,{economy=false,reduced=false}={}){
 if(b.hp<=0||reduced||economy)return;
 const damaged=b.hp<b.maxHp*.35;if(!damaged)return;
 ctx.save();
 for(let i=0;i<3;i++){const phase=(time*.7+i*.33+Number(b.id.slice(1))*.17)%1,x=at.x+Math.sin(i*2.3+time)*tile*.14,y=at.y-tile*(.3+phase*.9);ctx.globalAlpha=(1-phase)*.35;ctx.fillStyle='#514c41';ctx.beginPath();ctx.ellipse(x,y,tile*(.08+phase*.16),tile*(.09+phase*.18),0,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
