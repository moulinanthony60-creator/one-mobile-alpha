// Presentation only: outcomes always come from the account service.
export const wheelOrder=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
export const TAU=Math.PI*2,mod=(x,n)=>((x%n)+n)%n;
export function visibleCardTotal(cards){const visible=cards.filter(c=>Number.isInteger(c)&&c>=0&&c<52);let total=visible.reduce((n,c)=>n+Math.min(c%13+1,10),0),soft=false;for(const c of visible)if(c%13===0&&total+10<=21){total+=10;soft=true;}return {total,hidden:cards.some(c=>c===null),visible:visible.length,soft,bust:total>21};}
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
// A Hermite curve keeps the incoming speed and reaches the target at rest.
function brake(a,b,v,seconds,u){u=clamp(u);return (2*u*u*u-3*u*u+1)*a+(u*u*u-2*u*u+u)*seconds*v+(-2*u*u*u+3*u*u)*b;}
function travel(seconds,speed,ramp=.28){const t=Math.max(0,seconds);return speed*(t<ramp?t*t/(2*ramp):t-ramp/2);}
const speed=14,stripLength=64;
export function slotMotion(){
 const reels=Array.from({length:5},(_,c)=>({position:0,base:0,strip:Array.from({length:stripLength},(_,i)=>(i+c)%8),plan:null,phase:'idle'}));
 let active=false,started=0,received=false;
 const cruise=(r,t)=>r.base-travel((t-started)/1000,speed);
 function sample(t){for(const r of reels){const p=r.plan;if(!active)continue;if(!p||t<p.at){r.position=cruise(r,t);r.phase=received?'spinning':'waiting';continue;}const u=(t-p.at)/p.duration;if(u<1){r.position=brake(p.from,p.to,-speed,p.duration/1000,u);r.phase='braking';}else if(u<1+180/p.duration){const k=(t-p.at-p.duration)/180;r.position=p.to-.055*Math.sin(k*Math.PI)*(1-k);r.phase='settling';}else{r.position=p.to;r.phase='stopped';}}
  if(active&&received&&reels.every(r=>r.phase==='stopped'))active=false;
  return {active,received,phase:active?(received?'braking':'waiting'):'idle',reels};
 }
 return {sample,start(t){sample(t);started=t;received=false;active=true;for(const r of reels){r.base=mod(r.position,stripLength);r.position=r.base;r.plan=null;r.phase='waiting';}},
  receive(grid,t){if(!active||received||!Array.isArray(grid)||grid.length!==5||grid.some(col=>!Array.isArray(col)||col.length!==3||col.some(n=>!Number.isInteger(n)||n<0||n>7)))return false;
   received=true;reels.forEach((r,c)=>{const at=Math.max(started+1050,t)+c*230,duration=1150+c*35,from=cruise(r,at),to=Math.floor(from-speed*(duration/1000)*.52);r.plan={at,duration,from,to};grid[c].forEach((n,row)=>r.strip[mod(to+row,stripLength)]=n);});return true;},
  restore(grid){active=false;received=false;reels.forEach((r,c)=>{r.position=r.base=0;r.plan=null;r.phase='idle';r.strip=Array.from({length:stripLength},(_,i)=>(i+c)%8);for(let row=0;row<3;row++)r.strip[row]=grid?.[c]?.[row]??(c+row)%8;});},
  symbols(){return reels.flatMap(r=>Array.from({length:3},(_,row)=>r.strip[mod(Math.round(r.position)+row,stripLength)]));}
 };
}
export function rouletteMotion(){
 let active=false,received=false,started=0,baseWheel=0,baseBall=0,plan=null;
 const value={wheel:0,ball:Math.PI/37-Math.PI/2,radius:.665,height:1.237,phase:'idle',active:false,received:false};
 const wheel=t=>baseWheel+travel((t-started)/1000,.95),ball=t=>baseBall-travel((t-started)/1000,7,.35);
 function sample(t){if(active){if(!plan||t<plan.at){value.wheel=wheel(t);value.ball=ball(t);const lift=smooth((t-started)/400);value.radius=.665+(.96-.665)*lift;value.height=1.237+.045*lift;value.phase=received?'orbiting':'waiting';}else{
   const u=clamp((t-plan.at)/plan.duration),fall=smooth((u-.42)/.58);
   value.wheel=brake(plan.wheelFrom,plan.wheelTo,.95,plan.duration/1000,u);
   value.ball=brake(plan.ballFrom,plan.ballTo,-7,plan.duration/1000,u);
   value.radius=.96-(.96-.665)*fall;
   value.height=1.282-.045*fall+Math.abs(Math.sin(fall*Math.PI*3))*.026*(1-fall);
   value.phase=u<.42?'orbiting':u<.87?'dropping':'settling';
   if(u===1){active=false;value.phase='idle';}
  }}value.active=active;value.received=received;return value;}
 return {sample,start(t){sample(t);baseWheel=mod(value.wheel,TAU);baseBall=mod(value.ball,TAU);value.wheel=baseWheel;value.ball=baseBall;started=t;active=true;received=false;plan=null;},
  receive(number,t){if(!active||received||!Number.isInteger(number)||number<0||number>36)return false;received=true;
   const at=Math.max(started+1400,t),duration=3400,wheelFrom=wheel(at),wheelTo=wheelFrom+.95*duration/2000,ballFrom=ball(at),target=wheelTo+(wheelOrder.indexOf(number)+.5)*TAU/37-Math.PI/2;
   const ballTo=target-Math.ceil((target-(ballFrom-9))/TAU)*TAU;plan={at,duration,wheelFrom,wheelTo,ballFrom,ballTo};return true;},
  restore(number=0){active=false;received=false;plan=null;value.wheel=0;value.ball=(wheelOrder.indexOf(number)+.5)*TAU/37-Math.PI/2;value.radius=.665;value.height=1.237;value.phase='idle';value.active=false;value.received=false;}
 };
}
