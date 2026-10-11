import {people} from './one-casino-r212-people.js';
import {casinoWalkable,validLobbyPosition} from './one-casino-r212-layout.js';
const walk=(x,z)=>(Math.abs(x)<8.1&&z>4.6&&z<6.1)||casinoWalkable(x,z);
function waypoint(start,goal){
 const d=Math.hypot(goal.x-start.x,goal.z-start.z);let clear=true;for(let i=1;i<=Math.ceil(d/.15);i++){const f=i/Math.ceil(d/.15);if(!walk(start.x+(goal.x-start.x)*f,start.z+(goal.z-start.z)*f)){clear=false;break;}}if(clear)return goal;
 const cell=.4,key=(x,z)=>x+','+z,sx=Math.round(start.x/cell),sz=Math.round(start.z/cell),gx=Math.round(goal.x/cell),gz=Math.round(goal.z/cell),first=key(sx,sz),last=key(gx,gz),queue=[[sx,sz]],prev=new Map([[first,null]]);let found=false;
 for(let at=0;at<queue.length&&queue.length<2600;at++){const [x,z]=queue[at];if(key(x,z)===last){found=true;break;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(prev.has(k)||!walk(nx*cell,nz*cell))continue;prev.set(k,key(x,z));queue.push([nx,nz]);}}
 if(!found)return start;let next=last;while(prev.get(next)&&prev.get(next)!==first)next=prev.get(next);const [x,z]=next.split(',').map(Number);return {x:x*cell,z:z*cell};
}
// Cosmetic combat is separate from the account service: it cannot alter a wager.
// The lobby host validates attacks and controls the two guards for all peers.
export function casinoSecurity({visual,lobbyState,lobbyPose,onHit,onExpel}){
 const epoch=crypto.randomUUID();let remoteEpoch='';const npcs=people.map(p=>({...p,yaw:0,down:false,walk:false,punch:false,hits:0,until:0,hit:0})),incidents=new Map(),rates=new Map();let remote=null,serial=0,lastRevision=0,lastHost='',disposed=false,lastSend=0,lastTime=performance.now();
 const link=()=>window.ONEPartyGameLink,me=()=>lobbyState().self,host=()=>lobbyState().host,isHost=()=>me()===host();
 const send=(id,data)=>link()?.sendReliable?.(id,{game:'317',v:1,kind:'casino212',room:lobbyState().roomId,epoch,...data});
 const broadcast=data=>{for(const p of lobbyState().players)if(p.id!==me())send(p.id,data);};
 function accept(from,p){const t=performance.now(),pose=lobbyPose(from),npc=npcs.find(n=>n.id===p.target);if(!npc||npc.down||!['bat','gun'].includes(p.weapon)||!pose||pose[p.weapon]!==true||!lobbyState().players.some(p=>p.id===from)||t-(rates.get(from)||-Infinity)<(p.weapon==='bat'?430:280))return false;
  const dx=npc.x-pose.x,dz=npc.z-pose.z,d=Math.hypot(dx,dz);if(d>(p.weapon==='bat'?2.2:18)||d<.05||(-Math.sin(pose.yaw)*dx-Math.cos(pose.yaw)*dz)/d<(p.weapon==='bat'?.2:.88))return false;
  // Structural walls stop attacks even if a modified client sends an intent.
  for(let i=1;i<d/.15;i++){const f=i/(d/.15),x=pose.x+dx*f,z=pose.z+dz*f;if(z>6.1&&z<11.35&&Math.abs(x)>1.52||z>=11.35&&Math.abs(x)>=8.6)return false;}
  rates.set(from,t);npc.hits++;npc.lastStrike=t;npc.hit=1;npc.until=t+(npc.hits>=3?4500:400);if(npc.hits>=3)npc.down=true;
  if(!incidents.has(from))incidents.set(from,{hits:0,last:0,started:t});publish(t);return true;
 }
 function publish(t){lastSend=t;const data={type:'state',revision:++serial,npcs:npcs.map(({id,x,z,yaw,down,walk,punch,hit})=>({id,x,z,yaw,down,walk,punch,hit}))};broadcast(data);}
 const off=link()?.subscribe?.((from,p)=>{if(disposed||p?.game!=='317'||p.v!==1||p.kind!=='casino212'||p.room!==lobbyState().roomId||!lobbyState().players.some(x=>x.id===from))return;if(p.type==='strike'&&isHost())accept(from,p);else if(from===host()&&!isHost()){
  if(p.type==='state'&&typeof p.epoch==='string'&&p.epoch.length===36&&Number.isSafeInteger(p.revision)&&(p.epoch!==remoteEpoch||p.revision>lastRevision)&&Array.isArray(p.npcs)&&p.npcs.length===4&&new Set(p.npcs.map(n=>n.id)).size===4&&p.npcs.every(n=>people.some(v=>v.id===n.id)&&[n.x,n.z,n.yaw,n.hit].every(Number.isFinite)&&validLobbyPosition(n.x,n.z)&&Math.abs(n.yaw)<=Math.PI*2&&typeof n.down==='boolean'&&typeof n.walk==='boolean'&&typeof n.punch==='boolean')){remoteEpoch=p.epoch;lastRevision=p.revision;remote=p.npcs;}
  else if(p.type==='hit'&&p.target===me())onHit();else if(p.type==='expel'&&p.target===me())onExpel();
 }});
 function step(){if(disposed)return;const t=performance.now(),dt=Math.min(.2,(t-lastTime)/1000);lastTime=t;if(host()!==lastHost){lastHost=host();lastRevision=0;remote=null;incidents.clear();}if(!isHost())return;
  for(const n of npcs){n.walk=false;n.punch=false;if(n.down&&t>=n.until){n.down=false;n.hits=0;}if(!n.down&&t-(n.lastStrike||0)>8000)n.hits=0;n.hit=Math.max(0,n.hit-dt*3);}
  for(const [id,v]of incidents){const p=lobbyPose(id);if(!p||!lobbyState().players.some(m=>m.id===id)||p.z<5.2||Math.abs(p.x)>8.6){incidents.delete(id);continue;}}
  const targets=[...incidents];for(const [i,g]of npcs.filter(n=>n.role==='guard').entries()){if(g.down)continue;const target=targets.length?targets[i%targets.length]:null,pose=target?lobbyPose(target[0]):people.find(p=>p.id===g.id),dx=pose.x-g.x,dz=pose.z-g.z,d=Math.hypot(dx,dz);g.yaw=d>.01?Math.atan2(-dx,-dz):g.yaw;
   if(d>(target?1.15:.1)){const dest=waypoint(g,pose),ax=dest.x-g.x,az=dest.z-g.z,ad=Math.hypot(ax,az)||1,step=Math.min(ad,dt*3.9),nx=g.x+ax/ad*step,nz=g.z+az/ad*step;if(walk(nx,g.z))g.x=nx;if(walk(g.x,nz))g.z=nz;g.walk=true;
   }else if(target&&t-target[1].last>700){const [id,v]=target;v.last=t;v.hits++;g.punch=true;if(id===me())onHit();else send(id,{type:'hit',target:id});if(v.hits>=3){incidents.delete(id);if(id===me())onExpel();else send(id,{type:'expel',target:id});}}
  }if(t-lastSend>180)publish(t);
 }
 const timer=setInterval(step,100);return {strike(target,weapon){const p={type:'strike',target,weapon};return isHost()?accept(me(),p):send(host(),p);},tick(t){visual.people.update(isHost()?npcs:remote,t);},inspect:()=>({npcs:visual.people.inspect(),aggressors:[...incidents.keys()]}),dispose(){disposed=true;clearInterval(timer);off?.();}};
}
