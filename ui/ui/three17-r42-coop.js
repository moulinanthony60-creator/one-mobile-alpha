import * as THREE from './three.module.js';
import {createCoopWorld,controls} from './three17-r42-world.js';

const packet=(kind,data={})=>({game:'317',v:1,kind,...data});
const now=()=>performance.now();
const safeName=value=>String(value||'Membre').slice(0,40);
const roomNow=()=>window.oneSocialRoom?.();
let joined=false,panel=null,notice='',roster=[],round=null,unsubscribe=null,hostSeen=0;
const applicants=new Map();
let openGame=null;
const link=()=>window.ONEPartyGameLink;
const me=()=>roomNow()?.members?.find(m=>m.isYou);
const host=()=>roomNow()?.members?.find(m=>m.isHost);
const isHost=()=>!!me()&&me().accountId===host()?.accountId;
const connected=id=>id===me()?.accountId||link()?.peers().some(p=>p.accountId===id&&p.connected);
const send=(to,kind,data)=>link()?.send(to,packet(kind,{room:roomNow()?.id,...data}));
const member=id=>roomNow()?.members?.find(m=>m.accountId===id);
function broadcast(kind,data,ids=roomNow()?.members?.map(m=>m.accountId)||[]){for(const id of ids)if(id!==me()?.accountId)send(id,kind,data);}
function redraw(){
  if(!panel)return;const list=panel.querySelector('[data-roster]');list.replaceChildren();
  const people=roster.length?roster:me()?[{id:me().accountId,name:me().name}]:[];
  for(const p of people){const row=document.createElement('li');row.textContent=safeName(p.name)+(p.id===host()?.accountId?' · hôte':'')+(p.id===me()?.accountId?' · toi':'')+(connected(p.id)?' · connecté':' · connexion…');list.append(row);}
  panel.querySelector('[data-status]').textContent=notice||(isHost()?'Les membres doivent ouvrir 3:17 dans ce même salon.':hostSeen&&now()-hostSeen<6000?'Attends que l’hôte lance la partie.':'En attente de l’hôte du salon…');
  const start=panel.querySelector('[data-start]');start.hidden=!isHost();start.disabled=!joined||roster.length<2||roster.length>4||roster.some(p=>!connected(p.id));
}
function rebuildRoster(){
  if(!joined||!isHost()||round)return;
  const mine=me();if(!mine)return;
  const guests=[...applicants].filter(([id,t])=>id!==mine.accountId&&now()-t<7000&&member(id)&&connected(id)).slice(0,3);
  roster=[{id:mine.accountId,name:safeName(mine.name)},...guests.map(([id])=>({id,name:safeName(member(id).name)}))];
  broadcast('lobby',{players:roster});redraw();
}
function receive(from,p){
  if(!member(from)||p.room!==roomNow()?.id)return;
  if(p.kind==='hello'&&isHost()){
    applicants.set(from,now());if(round){send(from,'busy',{text:'Une partie est déjà en cours. Rejoins la prochaine.'});return;}rebuildRoster();
  }else if(p.kind==='lobby'&&from===host()?.accountId&&joined&&!round&&validRoster(p.players)){
    roster=p.players;hostSeen=now();notice=roster.some(m=>m.id===me()?.accountId)?'':'Les quatre places sont prises. Attends la prochaine partie.';redraw();
  }else if(p.kind==='busy'&&from===host()?.accountId&&joined&&!round){notice='Une partie est déjà en cours. Rejoins la prochaine.';redraw();}
  else if(p.kind==='launch'&&from===host()?.accountId&&joined&&!round&&validRound(p.config))launch(p.config);
  else if(p.kind==='leave-lobby'&&isHost()&&!round){applicants.delete(from);rebuildRoster();}
}
function validRoster(list){return Array.isArray(list)&&list.length>=1&&list.length<=4&&new Set(list.map(p=>p.id)).size===list.length&&list.every(p=>typeof p.id==='string'&&member(p.id)&&typeof p.name==='string'&&p.name.length<=40);}
function validRound(c){return c&&typeof c.id==='string'&&/^[a-f\d-]{36}$/i.test(c.id)&&c.room===roomNow()?.id&&c.host===host()?.accountId&&validRoster(c.players)&&c.players.length>=2&&c.players.some(p=>p.id===me()?.accountId)&&c.players.some(p=>p.id===c.host)&&Number.isInteger(c.seed)&&c.seed>=0&&c.seed<=0xffffffff;}
function launch(config){
  if(!validRound(config))return;round={...config,self:me().accountId};notice='';panel?.remove();panel=null;
  window.ONELobby3D?.close?.();window.oneCloseSalon?.();openGame({coop:round});
}
function startRound(){
  rebuildRoster();if(!isHost()||roster.length<2||roster.some(p=>!connected(p.id)))return;
  const config={id:crypto.randomUUID(),room:roomNow().id,host:me().accountId,players:roster,seed:crypto.getRandomValues(new Uint32Array(1))[0]};
  broadcast('launch',{config},roster.map(p=>p.id));launch(config);
}
async function openLobby(){
  if(round){notice='Termine ou quitte la partie en cours.';return;}
  if(!roomNow()||!me()||!host()){window.oneOpenSalon?.();return;}
  panel?.remove();panel=document.createElement('section');panel.className='three17-coop-lobby';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','3:17 avec le salon');
  panel.innerHTML='<div class="three17-coop-card"><small>3:17 · COOPÉRATION</small><h1>Entrer ensemble</h1><p data-room></p><p>2 à 4 membres · objets partagés · chacun sa cachette</p><ul data-roster></ul><p data-status role="status"></p><button data-start disabled>Lancer avec le groupe</button><button data-reconnect>Réessayer la connexion</button><button data-close>Retour au salon</button></div>';
  panel.querySelector('[data-room]').textContent=roomNow().name;document.body.append(panel);panel.querySelector('[data-close]').onclick=leaveLobby;panel.querySelector('[data-start]').onclick=startRound;notice='Connexion aux membres du salon…';redraw();
  panel.querySelector('[data-reconnect]').onclick=async e=>{e.target.disabled=true;notice='Rétablissement de la connexion…';redraw();try{await link().reconnect();joined=true;notice='';heartbeat();}catch(error){notice=error.message;}finally{e.target.disabled=false;redraw();}};
  try{await link()?.connect();if(!panel)return;if(!link())throw Error('Recharge ONE avec le correctif R42.');joined=true;notice='';heartbeat();redraw();}
  catch(e){notice=e.message;redraw();}
}
function leaveLobby(){if(joined&&!isHost())send(host()?.accountId,'leave-lobby',{});joined=false;roster=[];applicants.clear();panel?.remove();panel=null;window.oneOpenSalon?.();}
function heartbeat(){
  if(!joined||round)return;
  if(isHost())rebuildRoster();else if(host())send(host().accountId,'hello',{});
  if(panel&&joined&&!isHost()&&now()-hostSeen>15000){notice='Connexion en attente. L’hôte doit ouvrir 3:17. Si vous êtes déjà tous ici, vérifiez vos connexions.';redraw();}
}
export function installCoop(open){
  openGame=open;
  const style=document.createElement('style');style.textContent=`
  .three17-coop-lobby{position:fixed;inset:0;z-index:2147483600;background:#090b10ed;color:#eee;display:grid;place-items:center;padding:16px;box-sizing:border-box;font-family:system-ui;overflow:auto}
  .three17-coop-card{width:min(480px,100%);box-sizing:border-box;padding:26px;border:1px solid #756959;border-radius:18px;background:#151519;box-shadow:0 16px 80px #0008}
  .three17-coop-card h1{font-size:30px;margin:8px 0}.three17-coop-card small{color:#c5b488;letter-spacing:.16em}.three17-coop-card p{line-height:1.5;color:#c5c3c1}.three17-coop-card ul{padding:0;list-style:none;min-height:60px}.three17-coop-card li{padding:12px 0;border-bottom:1px solid #ffffff18}
  .three17-coop-card button{display:block;width:100%;margin-top:12px;padding:14px;border-radius:10px;border:1px solid #9a886a;background:#51432c;color:#fff;font:inherit;font-weight:700}.three17-coop-card button:disabled{opacity:.4}.three17-coop-card button[hidden]{display:none}.three17-coop-card [data-close]{background:transparent}
  .three17-team{position:absolute;top:137px;left:14px;z-index:3;max-width:min(310px,65vw);padding:7px 10px;border:1px solid #ffffff20;border-radius:8px;background:#080b10b8;color:#e5dfd0;font:11px/1.6 system-ui;pointer-events:none;white-space:pre-line}.three17-team strong{display:block;color:#c5b488}
  @media(max-height:500px){.three17-team{top:132px;font-size:10px;line-height:1.35}.three17-coop-card{padding:14px}.three17-coop-card h1{font-size:22px}.three17-coop-card li{padding:5px 0}}
  `;document.head.append(style);
  const bind=()=>{if(!unsubscribe&&link())unsubscribe=link().subscribe(receive);};bind();
  window.addEventListener('one-party-state',()=>{bind();if(joined&&(!roomNow()||round&&round.room!==roomNow()?.id)){window.ONEThree17?.close();leaveLobby();}if(panel)redraw();});
  window.addEventListener('one-account-changed',()=>{window.ONEThree17?.close();leaveLobby();});
  setInterval(()=>{bind();heartbeat();},1000);
  window.ONEThree17Coop={open:openLobby};
}

function avatar(scene,name,color){
  const group=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color,roughness:.9}),skin=new THREE.MeshStandardMaterial({color:0xa99283,roughness:.85});
  const mesh=(geometry,material,x,y,z)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);group.add(o);return o;};
  mesh(new THREE.CapsuleGeometry(.22,.55,4,8),cloth,0,1.06,0);mesh(new THREE.SphereGeometry(.18,10,8),skin,0,1.65,0);
  const limbs=[];for(const sign of [-1,1]){limbs.push(mesh(new THREE.CapsuleGeometry(.085,.56,3,6),cloth,sign*.14,.4,0));limbs.push(mesh(new THREE.CapsuleGeometry(.065,.51,3,6),cloth,sign*.32,1.0,0));}
  const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#080b10cc';ctx.fillRect(0,0,256,64);ctx.fillStyle='#eee';ctx.font='bold 24px system-ui';ctx.textAlign='center';ctx.fillText(safeName(name).slice(0,18),128,41);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));label.scale.set(1.4,.35,1);label.position.y=2.05;group.add(label);
  const torch=mesh(new THREE.CylinderGeometry(.035,.045,.16,6),new THREE.MeshStandardMaterial({color:0x272a25}),.34,.87,-.08);torch.rotation.x=Math.PI/2;
  const glow=mesh(new THREE.SphereGeometry(.035,6,4),new THREE.MeshBasicMaterial({color:0xffdd9c}),.34,.87,-.17);
  scene.add(group);return {group,limbs,glow,last:null,phase:0};
}
export function createCoopRuntime(config,b){
  const {house,monster,model,scene,shell,spawns}=b,localId=config.self,hosting=config.host===localId;
  const net=link();if(!net)throw Error('Connexion du salon absente.');
  const ids=config.players.map(p=>p.id),world=hosting?createCoopWorld({house,monster,model,members:config.players,spawns}):null;
  const visuals=new Map(config.players.filter(p=>p.id!==localId).map((p,i)=>[p.id,avatar(scene,p.name,[0x76868c,0x716b8c,0x8a7957][i])]));
  const hud=document.createElement('div');hud.className='three17-team';shell.append(hud);
  let stopped=false,armed=false,begun=false,finished=false,lastState=null,lastStateAt=now(),lastEvent=0,lastRevision=0,inputSeq=0,actionSeq=0,hostPaused=false;
  let input={x:0,forward:0,yaw:spawns[ids.indexOf(localId)].yaw||0,pitch:0,paused:false};
  const ready=new Set(),lastInput=new Map(ids.map(id=>[id,now()])),inputSerial=new Map();
  const wire=(kind,data={})=>packet(kind,{room:config.room,round:config.id,...data});
  const transmit=(id,kind,data)=>net.send(id,wire(kind,data));
  const all=(kind,data)=>{for(const id of ids)if(id!==localId)transmit(id,kind,data);};
  function accept(s){
    if(!validSnapshot(s,ids,house)||s.revision<=lastRevision)return;lastRevision=s.revision;lastState=s;lastStateAt=now();
    for(const d of s.doors){const dest=house.doors.find(x=>x.id===d.id);Object.assign(dest,d);}
    for(const i of s.items){const dest=house.items.find(x=>x.id===i.id);Object.assign(dest,i);if(!i.hidden)dest.occluders=[];}
    for(const c of house.containers)c.opened=s.containers.includes(c.id);
    if(!hosting)Object.assign(monster.state,{...s.monster,position:{...s.monster.position}});
    const local=s.players.find(p=>p.id===localId);b.apply(s,local,hosting);
    for(const e of s.events){if(e.id>lastEvent){lastEvent=e.id;b.event(e,local);}}
    if(s.outcome&&!finished){finished=true;b.finish(s.outcome);}
  }
  function abort(text){if(finished||stopped)return;finished=true;b.abort(text);}
  const off=net.subscribe((from,p)=>{
    if(stopped||p.room!==config.room||p.round!==config.id||!ids.includes(from))return;
    if(hosting){
      if(p.kind==='input'&&Number.isSafeInteger(p.seq)&&p.seq>(inputSerial.get(from)||0)){
        const c=controls(p.controls);if(!c)return;inputSerial.set(from,p.seq);lastInput.set(from,now());if(p.ready===true)ready.add(from);world.input(from,c);
      }else if(p.kind==='action'&&begun&&!finished&&!hostPaused&&Number.isSafeInteger(p.seq)&&['interact','flash'].includes(p.action)){if(controls(p.controls)){world.input(from,p.controls);world.action(from,p.action,p.seq);}}
      else if(p.kind==='round-leave'){world.disconnect(from);ready.delete(from);if(!begun){all('end',{text:'Un membre a quitté la préparation. Revenez au salon pour relancer.'});abort('Un membre a quitté la préparation. Revenez au salon pour relancer.');}}
    }else if(from===config.host){
      if(p.kind==='state'){
        if(!validSnapshot(p.state,ids,house))return;hostPaused=!!p.paused;
        if(p.started===true&&!begun){begun=true;b.begin();}
        accept(p.state);if(!begun)b.wait(Number.isInteger(p.ready)?p.ready:0,ids.length);
      }else if(p.kind==='end')abort('L’hôte a quitté la partie. Revenez au salon pour jouer à nouveau.');
    }
  });
  function pump(){
    if(stopped)return;
    if(!roomNow()||roomNow().id!==config.room||!member(config.host)){abort('Le salon a été fermé ou l’hôte est parti.');return;}
    if(hosting){
      hostPaused=b.paused();if(armed)ready.add(localId);world.input(localId,{...input,paused:hostPaused});
      if(!finished&&!begun&&ready.size===ids.length){begun=true;b.begin();}
      for(const id of ids)if(id!==localId&&now()-lastInput.get(id)>15000){
        if(!begun){all('end',{});abort('Un membre ne répond plus. Revenez au salon pour relancer.');return;}
        if(world.player(id).connected)world.disconnect(id);
      }
      const state=world.snapshot();accept(state);all('state',{state,started:begun,paused:hostPaused,ready:ready.size});
      if(!begun)b.wait(ready.size,ids.length);
    }else{
      transmit(config.host,'input',{seq:++inputSeq,controls:{...input,paused:b.paused()},ready:armed});
      if(now()-lastStateAt>15000)abort('Connexion avec l’hôte perdue. Revenez au salon pour relancer.');
    }
    updateHud();
  }
  function updateHud(){
    const lines=['ÉQUIPE · '+ids.length+' JOUEURS'];
    for(const p of lastState?.players||config.players)lines.push(safeName(p.name)+(p.id===localId?' · toi':'')+' · '+(!p.connected&&lastState?'déconnecté':p.escaped?'sorti':p.dead?'attrapé':p.hidden?'caché':'en jeu'));
    if(begun&&(hostPaused||!hosting&&now()-lastStateAt>1500))lines.push('En attente de l’hôte…');
    hud.textContent=lines.join('\n');
  }
  const timer=setInterval(pump,100);
  function step(elapsed,value){
    input=controls(value)||input;
    if(!begun||finished||stopped)return;
    if(hosting){
      world.input(localId,input);let left=Math.min(.25,elapsed);while(left>1e-6){const dt=Math.min(.05,left);world.step(dt);left-=dt;}
      accept(world.snapshot());
    }else if(!hostPaused&&now()-lastStateAt<1500){
      const p=lastState?.players.find(x=>x.id===localId);if(p&&!p.hidden&&!p.dead&&!p.escaped){const s=Math.sin(input.yaw),c=Math.cos(input.yaw),dt=Math.min(elapsed,.1);model.movePlayer(house,b.position,(-s*input.forward+c*input.x)*2.5*dt,(-c*input.forward-s*input.x)*2.5*dt);}
    }
    for(const [id,v] of visuals){const p=lastState?.players.find(x=>x.id===id);if(!p)continue;v.group.visible=p.connected&&!p.hidden&&!p.dead&&!p.escaped;if(!v.group.visible)continue;
      const point=new THREE.Vector3(p.position.x,p.position.y,p.position.z);if(!v.last||v.group.position.distanceTo(point)>3)v.group.position.copy(point);else v.group.position.lerp(point,1-Math.exp(-elapsed*14));
      const delta=Math.atan2(Math.sin(p.yaw-v.group.rotation.y),Math.cos(p.yaw-v.group.rotation.y));v.group.rotation.y+=delta*(1-Math.exp(-elapsed*12));
      const speed=v.last?Math.hypot(v.group.position.x-v.last.x,v.group.position.z-v.last.z)/Math.max(.001,elapsed):0;v.phase+=elapsed*Math.min(speed,3)*4;
      v.limbs.forEach((limb,i)=>limb.rotation.x=speed>.05?Math.sin(v.phase+(i<2?0:Math.PI))*.3:0);v.glow.visible=p.flash;v.last={x:v.group.position.x,z:v.group.position.z};
    }
  }
  return {
    step,ready(){armed=true;b.wait(ready.size,ids.length);pump();},
    action(type){if(!begun||finished||hostPaused||!hosting&&now()-lastStateAt>1500)return;if(hosting){world.input(localId,input);world.action(localId,type,++actionSeq);accept(world.snapshot());}else transmit(config.host,'action',{action:type,seq:++actionSeq,controls:input});},
    get local(){return lastState?.players.find(p=>p.id===localId);},get isHost(){return hosting;},get state(){return lastState;},
    dispose(){if(stopped)return;stopped=true;clearInterval(timer);off();if(hosting)all('end',{});else transmit(config.host,'round-leave',{});round=null;joined=false;roster=[];applicants.clear();hud.remove();},
    inspect:()=>({hosting,begun,ready:[...ready],state:lastState,peers:net.peers()}),
    ...(window.__ONE317_TEST__===true?{world}:{}),
  };
}
function validSnapshot(s,ids,house){
  const point=p=>p&&[p.x,p.y,p.z].every(Number.isFinite)&&Math.abs(p.x)<100&&Math.abs(p.y)<15&&Math.abs(p.z)<100;
  return s&&Number.isSafeInteger(s.revision)&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=600&&[null,'win','caught','time'].includes(s.outcome)&&
    Array.isArray(s.players)&&s.players.length===ids.length&&new Set(s.players.map(p=>p.id)).size===ids.length&&s.players.every(p=>ids.includes(p.id)&&point(p.position)&&Number.isFinite(p.yaw)&&Number.isFinite(p.pitch)&&typeof p.name==='string'&&p.name.length<=40)&&
    s.monster&&point(s.monster.position)&&Number.isFinite(s.monster.yaw)&&['dormant','patrol','chase','investigate','search','caught'].includes(s.monster.state)&&
    Array.isArray(s.doors)&&s.doors.length===house.doors.length&&s.doors.every(d=>house.doors.some(x=>x.id===d.id)&&Number.isFinite(d.angle)&&Number.isFinite(d.targetAngle))&&
    Array.isArray(s.items)&&s.items.length===3&&s.items.every(i=>house.items.some(x=>x.id===i.id)&&point(i))&&Array.isArray(s.containers)&&s.containers.length<=house.containers.length&&
    Array.isArray(s.events)&&s.events.length<=32&&s.events.every(e=>Number.isSafeInteger(e.id)&&typeof e.kind==='string'&&ids.includes(e.who));
}
