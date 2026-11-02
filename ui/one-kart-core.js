// Shared circuit and host-authoritative kart physics. No browser dependencies.
export const KART_RULES = Object.freeze({laps:3, width:12, maxSpeed:27, reverseSpeed:5, batRange:3.6, batCooldown:1, duration:300});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const anchors=[[-35,62],[15,62],[60,58],[87,32],[85,-15],[62,-48],[15,-62],[-30,-62],[-68,-43],[-84,-10],[-62,14],[-30,10],[-15,28],[-38,40],[-65,40],[-62,61]];
const spline=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
export const TRACK=(()=>{
 const points=[];
 for(let i=0;i<anchors.length;i++)for(let j=0;j<24;j++){
  const a=anchors[(i+anchors.length-1)%anchors.length],b=anchors[i],c=anchors[(i+1)%anchors.length],d=anchors[(i+2)%anchors.length],t=j/24;
  points.push({x:spline(a[0],b[0],c[0],d[0],t),z:spline(a[1],b[1],c[1],d[1],t)});
 }
 let length=0;
 const segments=points.map((a,i)=>{const b=points[(i+1)%points.length],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),s={a,b,dx,dz,len,start:length,nx:-dz/len,nz:dx/len};length+=len;return s;});
 return {points,segments,length,width:KART_RULES.width};
})();
export function pointAt(distance,offset=0){
 const d=((distance%TRACK.length)+TRACK.length)%TRACK.length,s=TRACK.segments.find(s=>s.start+s.len>=d)||TRACK.segments.at(-1),t=(d-s.start)/s.len;
 return {x:s.a.x+s.dx*t+s.nx*offset,z:s.a.z+s.dz*t+s.nz*offset,yaw:Math.atan2(-s.dx,-s.dz),distance:d};
}
export function projectTrack(x,z){
 let best=null;
 for(const s of TRACK.segments){const t=clamp(((x-s.a.x)*s.dx+(z-s.a.z)*s.dz)/(s.len*s.len),0,1),px=s.a.x+s.dx*t,pz=s.a.z+s.dz*t,d2=(x-px)**2+(z-pz)**2;
  if(!best||d2<best.d2)best={x:px,z:pz,d2,distance:s.start+t*s.len,nx:s.nx,nz:s.nz,yaw:Math.atan2(-s.dx,-s.dz)};
 }
 return best;
}
export function advanceKart(p,input,dt){
 const steer=clamp(input.x||0,-1,1),throttle=clamp(input.z||0,-1,1);
 const stunned=p.stun>0;p.stun=Math.max(0,(p.stun||0)-dt);p.shield=Math.max(0,(p.shield||0)-dt);
 let acceleration=throttle>0?13*throttle:throttle<0?(p.speed>0?25:8)*throttle:-Math.sign(p.speed)*2.8;
 if(stunned)acceleration=-Math.sign(p.speed)*9;
 const previous=p.speed;p.speed=clamp(p.speed+acceleration*dt,-KART_RULES.reverseSpeed,KART_RULES.maxSpeed);
 if(!throttle&&previous*p.speed<0)p.speed=0;
 const turning=1.65/(1+Math.abs(p.speed)*.032)*Math.min(1,Math.abs(p.speed)/3);
 p.yaw=wrap(p.yaw-steer*turning*dt*Math.sign(p.speed)*(stunned?.45:1));
 p.x-=Math.sin(p.yaw)*p.speed*dt;p.z-=Math.cos(p.yaw)*p.speed*dt;
 constrainKart(p,true);
}
function constrainKart(p,slow=false){
 const q=projectTrack(p.x,p.z),d=Math.sqrt(q.d2),limit=TRACK.width/2-.85;
 if(d>limit){p.x=q.x+(p.x-q.x)/d*limit;p.z=q.z+(p.z-q.z)/d*limit;if(slow)p.speed*=.82;}
}
export function batTarget(attacker,players,side=1){
 const forward={x:-Math.sin(attacker.yaw),z:-Math.cos(attacker.yaw)},right={x:Math.cos(attacker.yaw),z:-Math.sin(attacker.yaw)};
 let target=null,best=KART_RULES.batRange;
 for(const p of players){if(p.id===attacker.id||!p.connected||p.finished||p.shield>0)continue;
  const dx=p.x-attacker.x,dz=p.z-attacker.z,d=Math.hypot(dx,dz);
  if(d<.1||d>best||(dx*forward.x+dz*forward.z)/d<-.35||(dx*right.x+dz*right.z)*side/d<.05)continue;
  target=p;best=d;
 }
 return target;
}
export function createKartMatch({id='practice',size=1,players}){
 const state={id,game:'kart',size,elapsed:0,until:KART_RULES.duration+3,phase:'prepare',finished:false,winner:'',reason:'',events:[],players:players.map((p,i)=>{
  const progress=-10-Math.floor(i/2)*3.8,spawn=pointAt(progress,(i%2?1:-1)*1.3);
  return {id:p.id,name:String(p.name||'Pilote').slice(0,40),...spawn,speed:0,progress,lastDistance:spawn.distance,checkpoint:0,lap:0,connected:true,finished:false,finishAt:0,stun:0,shield:0,batAt:-10,batSide:1,swings:0,hits:0,actionSeq:0,input:{x:0,z:0}};
 })};
 let serial=0;
 const player=id=>state.players.find(p=>p.id===id);
 function ranking(){return [...state.players].sort((a,b)=>a.finished&&b.finished?a.finishAt-b.finishAt:a.finished?-1:b.finished?1:Number(b.connected)-Number(a.connected)||b.progress-a.progress);}
 function finish(reason){state.finished=true;state.phase='finished';state.winner=ranking().find(p=>p.connected||p.finished)?.id||'';state.reason=reason;for(const p of state.players)p.speed=0;}
 function input(id,value){const p=player(id);if(!p||!p.connected||!value||![value.x,value.z].every(Number.isFinite)||Math.abs(value.x)>1||Math.abs(value.z)>1)return false;p.input={x:value.x,z:value.z};return true;}
 function action(id,a){
  const p=player(id);if(!p||!p.connected||p.finished||state.phase!=='play'||!a||a.type!=='bat'||!Number.isSafeInteger(a.seq)||a.seq<=p.actionSeq||a.seq>1e9||![-1,1].includes(a.side))return false;
  p.actionSeq=a.seq;if(p.stun>0||state.elapsed-p.batAt<KART_RULES.batCooldown)return false;
  p.batAt=state.elapsed;p.batSide=a.side;p.swings++;
  const target=batTarget(p,state.players,a.side);
  if(target){target.speed*=.45;target.stun=.55;target.shield=1.4;target.yaw=wrap(target.yaw-a.side*.14);p.hits++;}
  state.events.push({id:state.id+':'+(++serial),from:id,hit:target?.id||null,side:a.side,at:state.elapsed});state.events=state.events.slice(-12);return true;
 }
 function step(dt){
  state.elapsed+=dt;state.events=state.events.filter(e=>state.elapsed-e.at<1.5);
  if(state.phase==='prepare'){if(state.elapsed>=3)state.phase='play';return;}
  for(const p of state.players){if(!p.connected||p.finished)continue;advanceKart(p,p.input,dt);}
  // Resolve contact on the host so two karts cannot occupy the same space.
  for(let i=0;i<state.players.length;i++)for(let j=i+1;j<state.players.length;j++){
   const a=state.players[i],b=state.players[j];if(!a.connected||!b.connected||a.finished||b.finished)continue;
   let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>=1.8)continue;if(d<.001){dx=1;dz=0;d=1;}
   const push=(1.8-d)/2;a.x-=dx/d*push;a.z-=dz/d*push;b.x+=dx/d*push;b.z+=dz/d*push;constrainKart(a);constrainKart(b);
   if(Math.abs(a.speed-b.speed)>3){const average=(a.speed+b.speed)/2;a.speed=average;b.speed=average;}
  }
  for(const p of state.players){if(!p.connected||p.finished)continue;
   const q=projectTrack(p.x,p.z);let delta=q.distance-p.lastDistance;
   if(delta>TRACK.length/2)delta-=TRACK.length;if(delta<-TRACK.length/2)delta+=TRACK.length;
   // Reject discontinuities; only continuous forward progress crosses checkpoints.
   if(Math.abs(delta)<KART_RULES.maxSpeed*dt+2)p.progress+=delta;p.lastDistance=q.distance;
   const gate=TRACK.length/12;
   if(p.progress>=(p.checkpoint+1)*gate&&p.progress<(p.checkpoint+2)*gate)p.checkpoint++;
   p.lap=Math.min(KART_RULES.laps,Math.floor(p.checkpoint/12));
   if(p.lap>=KART_RULES.laps){p.finished=true;p.finishAt=state.elapsed;p.speed=0;}
  }
  if(state.players.every(p=>!p.connected||p.finished))finish('Course terminée');
  else if(state.elapsed>=state.until)finish('Temps écoulé');
 }
 function tick(dt){if(!Number.isFinite(dt)||dt<=0||state.finished)return;let left=Math.min(dt,.25);while(left>1e-7&&!state.finished){const stepSize=Math.min(left,1/60);step(stepSize);left-=stepSize;}}
 function snapshot(){const ranks=ranking();return {game:'kart',size:state.size,phase:state.phase,elapsed:state.elapsed,remaining:Math.max(0,state.phase==='prepare'?3-state.elapsed:state.until-state.elapsed),finished:state.finished,winner:state.winner,reason:state.reason,trackLength:TRACK.length,laps:KART_RULES.laps,events:state.events.map(e=>({...e})),players:state.players.map(p=>({id:p.id,name:p.name,x:p.x,z:p.z,yaw:p.yaw,speed:p.speed,progress:p.progress,lap:p.lap,connected:p.connected,finished:p.finished,finishAt:p.finishAt,stun:p.stun,shield:p.shield,swings:p.swings,batSide:p.batSide,batAge:Math.min(10,state.elapsed-p.batAt),hits:p.hits,rank:ranks.findIndex(r=>r.id===p.id)+1}))};}
 return {state,input,action,tick,snapshot,remove(id){const p=player(id);if(p){p.connected=false;p.speed=0;p.input={x:0,z:0};}}};
}
export function validKartSnapshot(s,config,self){
 const finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,ids=config.players.map(p=>p.id);
 return !!s&&s.game==='kart'&&s.size===config.size&&['prepare','play','finished'].includes(s.phase)&&typeof s.finished==='boolean'&&s.finished===(s.phase==='finished')&&finite(s.elapsed,0,310)&&finite(s.remaining,0,303)&&s.laps===3&&s.trackLength===TRACK.length&&typeof s.reason==='string'&&s.reason.length<200&&(s.winner===''||ids.includes(s.winner))&&Array.isArray(s.players)&&s.players.length===ids.length&&s.players.some(p=>p.id===self)&&new Set(s.players.map(p=>p.id)).size===ids.length&&s.players.every(p=>ids.includes(p.id)&&typeof p.name==='string'&&p.name.length<=40&&finite(p.x,-110,110)&&finite(p.z,-90,90)&&projectTrack(p.x,p.z).d2<49&&finite(p.yaw,-Math.PI,Math.PI)&&finite(p.speed,-5,27)&&finite(p.progress,-10000,TRACK.length*3+5)&&Number.isInteger(p.lap)&&finite(p.lap,0,3)&&typeof p.connected==='boolean'&&typeof p.finished==='boolean'&&finite(p.finishAt,0,310)&&finite(p.stun,0,.55)&&finite(p.shield,0,1.4)&&finite(p.batAge,0,10)&&Number.isSafeInteger(p.swings)&&p.swings>=0&&Number.isSafeInteger(p.hits)&&p.hits>=0&&[-1,1].includes(p.batSide)&&Number.isInteger(p.rank)&&finite(p.rank,1,ids.length))&&Array.isArray(s.events)&&s.events.length<=12&&s.events.every(e=>e&&typeof e.id==='string'&&e.id.length<160&&ids.includes(e.from)&&(e.hit===null||ids.includes(e.hit))&&[-1,1].includes(e.side)&&finite(e.at,0,s.elapsed));
}
