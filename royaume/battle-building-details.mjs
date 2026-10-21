export function ruinSprite(b){const a=b.art||b.kind;return 'ruin-'+(b.kind==='castle'?'castle':['tower','cannon','mortar','cottage','mine'].includes(a)?a:['arcane','reservoir'].includes(a)?'crystal':['vault'].includes(a)?'mine':'barracks');}
const seedFor=b=>[...b.id].reduce((n,c)=>n*31+c.charCodeAt(0),17)>>>0;
export function ruinFamily(b){const art=b.art||b.kind;return ['cannon','mortar'].includes(art)?'iron':['arcane','reservoir'].includes(art)?'crystal':art==='castle4'||b.kind==='castle'?'stone':'timber';}
export function paintRuin(ctx,b,at,t){
 let seed=seedFor(b);const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const width=b.collision.width*t*.86,depth=b.collision.depth*t*.39,family=ruinFamily(b),blue=['castle','tower','barracks','forge'].includes(b.kind);
 ctx.save();ctx.translate(at.x,at.y);
 // A low, broken footprint keeps the building's size and material readable.
 ctx.fillStyle='#3b342750';ctx.beginPath();ctx.moveTo(-width*.5,0);ctx.lineTo(0,-depth*.5);ctx.lineTo(width*.5,0);ctx.lineTo(0,depth*.5);ctx.closePath();ctx.fill();
 for(let i=0;i<18;i++){const x=(random()-.5)*width,y=(random()-.5)*depth,r=t*(.055+random()*.10);ctx.fillStyle=i%4?'#b1aba0':blue?'#355471':'#9e6240';ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x-r*.2,y-r*.65);ctx.lineTo(x+r,y-r*.3);ctx.lineTo(x+r*.65,y+r*.5);ctx.lineTo(x-r*.4,y+r*.5);ctx.fill();ctx.strokeStyle='#49473880';ctx.lineWidth=.5;ctx.stroke();}
 if(family==='iron'){
  ctx.save();ctx.rotate((random()-.5)*.8);ctx.fillStyle='#242b2e';ctx.fillRect(-t*.3,-t*.14,t*.65,t*.18);ctx.fillStyle='#666d6c';ctx.beginPath();ctx.ellipse(t*.35,-t*.05,t*.12,t*.16,.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#171c1e';ctx.beginPath();ctx.ellipse(t*.36,-t*.06,t*.07,t*.10,.3,0,Math.PI*2);ctx.fill();ctx.restore();
 }else if(family==='crystal'){
  for(let i=0;i<4;i++){const x=(random()-.5)*width*.6,y=(random()-.5)*depth*.6;ctx.fillStyle=b.art==='reservoir'?'#ac6fc2':'#80c6d5';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+t*.07,y-t*(.11+random()*.16));ctx.lineTo(x+t*.17,y-t*.08);ctx.lineTo(x+t*.1,y+t*.05);ctx.fill();}
 }else{
  for(let i=0;i<(family==='stone'?2:4);i++){const x=(random()-.5)*width*.7,y=(random()-.5)*depth*.6;ctx.strokeStyle=family==='stone'?'#797c78':'#554133';ctx.lineWidth=t*.075;ctx.beginPath();ctx.moveTo(x-t*.17,y-t*.08);ctx.lineTo(x+t*.2,y+t*.07);ctx.stroke();}
 }
 ctx.restore();
}
export function paintBuildingWear(ctx,b,box){
 if(b.hp>b.maxHp*.65)return;
 const level=b.hp<b.maxHp*.3?2:1;
 ctx.save();ctx.strokeStyle='#332a20aa';ctx.lineWidth=Math.max(.8,box.w*.012);
 for(let i=0;i<level+1;i++){const x=box.x+box.w*(.28+i*.23),y=box.y+box.h*(.66+i%2*.12);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-box.w*.03,y+box.h*.06);ctx.lineTo(x+box.w*.015,y+box.h*.095);ctx.lineTo(x-box.w*.04,y+box.h*.13);ctx.stroke();}
 ctx.restore();
}
