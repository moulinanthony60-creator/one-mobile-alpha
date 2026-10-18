import {HUD_ICONS} from './village-hud.mjs?v=34';

export const HARVEST_BUBBLE_MINIMUM=50;
const RESOURCES={mine:{key:'gold',name:'or',building:'Mine d’or'},tree:{key:'wood',name:'bois',building:'Scierie'},shrine:{key:'aether',name:'éther',building:'Sanctuaire'}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const intersects=(a,b,gap=5)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
export function harvestLayout(markers,state,{width,height,hidden=false,blocked=[]}={}){
 if(hidden||width<80||height<80)return [];
 const result=[];
 for(const m of markers){
  const type=RESOURCES[m.id],amount=Math.floor(state.stash?.[type?.key]||0);
  if(!type||!m.visible||amount<HARVEST_BUBBLE_MINIMUM||!Number.isFinite(m.x)||!Number.isFinite(m.y))continue;
  const w=46,h=55,ideal={x:m.x-w/2,y:m.y-h-7};
  // Keep bubbles close to their own roof, but clear of other bubbles and HUD controls.
  const offsets=[[0,0],[0,-16],[-52,0],[52,0],[-68,0],[68,0],[-52,-28],[52,-28],[0,-62]];
  const candidates=offsets.map(([dx,dy])=>({x:clamp(ideal.x+dx,7,width-w-7),y:clamp(ideal.y+dy,7,height-h-7),w,h}));
  const r=candidates.find(r=>Math.hypot(r.x+w/2-m.x,r.y+h-m.y)<110&&![...blocked,...result].some(b=>intersects(r,b)));
  if(r)result.push({...r,id:m.id,...type,amount,anchor:{x:m.x,y:m.y}});
 }
 return result;
}
export function paintResourceIcon(ctx,atlas,key,x,y,w,h){
 const crop=HUD_ICONS[key];if(!crop)return;
 const scale=Math.min(w/crop[2],h/crop[3]);ctx.drawImage(atlas,...crop,x+(w-crop[2]*scale)/2,y+(h-crop[3]*scale)/2,crop[2]*scale,crop[3]*scale);
}
const short=n=>n>=10000?(n/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+'k':n.toLocaleString('fr-FR');
export function paintHarvestBubble(ctx,r,atlas){
 const {x,y,w,h}=r,bottom=y+h-7,cx=x+w/2;
 ctx.save();
 if(Math.abs(cx-r.anchor.x)>8||Math.abs(y+h-r.anchor.y)>18){
  ctx.beginPath();ctx.moveTo(cx,y+h);ctx.lineTo(r.anchor.x,r.anchor.y);ctx.strokeStyle='#f6e5b29e';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.arc(r.anchor.x,r.anchor.y,2,0,Math.PI*2);ctx.fillStyle='#fff0bb';ctx.fill();
 }
 ctx.shadowColor='#15200c8c';ctx.shadowBlur=5;ctx.shadowOffsetY=3;
 ctx.beginPath();ctx.roundRect(x,y,w,h-7,9);
 const g=ctx.createLinearGradient(0,y,0,bottom);g.addColorStop(0,'#fff9da');g.addColorStop(.55,'#eee0ac');g.addColorStop(1,'#c2a76b');ctx.fillStyle=g;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#493c1b';ctx.stroke();
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 ctx.beginPath();ctx.moveTo(cx-7,bottom-1);ctx.lineTo(cx,bottom+6);ctx.lineTo(cx+7,bottom-1);ctx.fillStyle='#c4ab71';ctx.fill();ctx.strokeStyle='#493c1b';ctx.lineWidth=1.5;ctx.stroke();
 ctx.beginPath();ctx.roundRect(x+2.5,y+2.5,w-5,h-13,8);ctx.strokeStyle='#fffde6';ctx.lineWidth=1;ctx.stroke();
 paintResourceIcon(ctx,atlas,r.key,x+5,y+2,w-10,28);
 ctx.beginPath();ctx.roundRect(x+4,y+31,w-8,14,4);ctx.fillStyle='#315573';ctx.fill();
 ctx.fillStyle='#fff6d6';ctx.font='bold 11px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(short(r.amount),cx,y+38,w-8);
 ctx.restore();
}
export function createHarvestView(container,atlas){
 const canvas=document.createElement('canvas'),live=document.createElement('span');canvas.className='harvest-canvas';canvas.setAttribute('aria-hidden','true');live.className='harvest-status';live.setAttribute('role','status');container.replaceChildren(canvas,live);
 const ctx=canvas.getContext('2d'),nodes=new Map();let width=1,height=1,input={markers:[],state:{stash:{}},options:{}},layout=[],effects=[],frame=0,dead=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function paint(now=performance.now()){
  if(dead)return;const ratio=canvas.width/width;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  for(const r of layout)paintHarvestBubble(ctx,r,atlas);
  effects=effects.filter(e=>now-e.start<800);
  for(const e of effects){const t=clamp((now-e.start)/800,0,1),u=1-(1-t)**3,x=e.x+(e.to.x-e.x)*u,y=e.y+(e.to.y-e.y)*u-Math.sin(t*Math.PI)*24;
   ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*5);paintResourceIcon(ctx,atlas,e.key,x-15,y-15,30,30);ctx.restore();
   if(t<.65){ctx.save();ctx.globalAlpha=1-t/.65;ctx.font='bold 15px Arial,sans-serif';ctx.textAlign='center';ctx.strokeStyle='#20301c';ctx.lineWidth=3;const label='+'+short(e.amount);ctx.strokeText(label,e.x,e.y-24-t*22);ctx.fillStyle='#fff4bd';ctx.fillText(label,e.x,e.y-24-t*22);ctx.restore();}
  }
 }
 function animate(now){frame=0;paint(now);if(effects.length&&!dead)frame=requestAnimationFrame(animate);}
 function update(){
  layout=harvestLayout(input.markers,input.state,{...input.options,width,height});const ids=new Set(layout.map(r=>r.id));
  for(const [id,node]of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}
  for(const r of layout){let node=nodes.get(r.id);if(!node){node=document.createElement('button');node.type='button';node.className='harvest-hit';node.dataset.action='harvest-resource';node.dataset.id=r.key;node.dataset.marker=r.id;nodes.set(r.id,node);container.append(node);}const label=`Récolter ${r.amount.toLocaleString('fr-FR')} ${r.name} · ${r.building}`;node.setAttribute('aria-label',label);node.title=label;Object.assign(node.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});}
  paint();
 }
 function resize(){width=Math.max(1,container.clientWidth);height=Math.max(1,container.clientHeight);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);update();}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 return {sync(markers,state,options){input={markers,state,options};update();},origins:()=>layout.map(r=>({...r})),collect(values,origins,targets=[]){
  const labels=[];for(const [key,amount]of Object.entries(values)){if(amount<1)continue;const from=origins.find(r=>r.key===key),target=targets.find(r=>r.id==='res-'+key),type=Object.values(RESOURCES).find(r=>r.key===key);labels.push(amount+' '+type.name);
   if(from&&!reduced)effects.push({key,amount,x:from.x+from.w/2,y:from.y+22,to:target?{x:target.x+target.w-22,y:target.y+target.h/2}:{x:from.x+from.w/2,y:from.y-55},start:performance.now()});
  }live.textContent=labels.length?'Récolte : '+labels.join(', '):'';effects=effects.slice(-6);if(effects.length&&!frame)frame=requestAnimationFrame(animate);
 },dispose(){dead=true;cancelAnimationFrame(frame);observer.disconnect();container.replaceChildren();}};
}
