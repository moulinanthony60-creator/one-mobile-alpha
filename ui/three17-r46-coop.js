import {createAvatar,animateAvatar,orientAvatarCamera} from './three17-r44-avatar.js?v=lobby-shoot-v93';
import * as THREE from './three.module.js?v=lobby-shoot-v93';
import {createCoopWorld,controls} from './three17-r46-world.js?v=lobby-shoot-v93';

const packet=(kind,data={})=>({game:'317',v:1,kind,...data});
const now=()=>performance.now();
const safeName=value=>String(value||'Membre').slice(0,40);
const yes=value=>value===true||value===1||value==='1'||value==='true';

const movingControls=value=>!!value&&Math.hypot(value.x||0,value.forward||0)>.04;
const validPositionHint=(value,reference)=>!!value&&[value.x,value.y,value.z].every(Number.isFinite)&&Math.abs(value.x)<100&&Math.abs(value.y)<15&&Math.abs(value.z)<100&&(!reference||Math.abs(value.y-reference.y)<.65);

// Remote avatars are visual-only. Keep a slightly deeper jitter buffer than the
// network tick, then add a tiny critically-damped visual catch-up. This avoids
// packet-by-packet stepping without extrapolating past the point where a player
// actually stopped.
function createRemotePoseTrack(delay=95){
  let samples=[],identity=null,ready=false,lastAt=0;
  const result={x:0,y:0,z:0,yaw:0,pitch:0};
  return {
    push(p,time,source=p){
      if(source===identity)return;identity=source;
      const next={x:p.x,y:p.y||0,z:p.z,yaw:p.yaw||0,pitch:Number.isFinite(p.pitch)?p.pitch:0,t:time},last=samples.at(-1);
      if(last&&Math.hypot(next.x-last.x,next.y-last.y,next.z-last.z)>3){samples=[];ready=false;}
      samples.push(next);if(samples.length>32)samples.shift();
    },
    at(time){
      if(!samples.length)return null;
      const t=time-delay;while(samples.length>2&&samples[1].t<=t)samples.shift();
      const a=samples[0],b=samples[1]||a,latest=samples.at(-1);
      let tx,ty,tz,tyaw,tpitch;
      if(t>=latest.t){tx=latest.x;ty=latest.y;tz=latest.z;tyaw=latest.yaw;tpitch=latest.pitch;}
      else{
        const k=Math.max(0,Math.min(1,(t-a.t)/Math.max(1,b.t-a.t)));
        tx=a.x+(b.x-a.x)*k;ty=a.y+(b.y-a.y)*k;tz=a.z+(b.z-a.z)*k;
        tyaw=a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*k;tpitch=a.pitch+(b.pitch-a.pitch)*k;
      }
      const jump=ready?Math.hypot(tx-result.x,ty-result.y,tz-result.z):Infinity;
      if(!ready||jump>2.25){result.x=tx;result.y=ty;result.z=tz;result.yaw=tyaw;result.pitch=tpitch;ready=true;lastAt=time;return result;}
      const dt=Math.min(.05,Math.max(.001,(time-(lastAt||time-16))/1000));lastAt=time;
      const blend=1-Math.exp(-dt*34);
      result.x+=(tx-result.x)*blend;result.y+=(ty-result.y)*blend;result.z+=(tz-result.z)*blend;
      result.yaw+=Math.atan2(Math.sin(tyaw-result.yaw),Math.cos(tyaw-result.yaw))*blend;
      result.pitch+=(tpitch-result.pitch)*blend;
      return result;
    },
    clear(){samples=[];identity=null;ready=false;lastAt=0;}
  };
}
// Read the salon object; never infer identity by comparing two absent IDs.
export function normalizeRoom(value){
  if(!value||typeof value.id!=='string'||!Array.isArray(value.members))return null;
  const members=value.members.map(m=>({...m,accountId:String(m.accountId||m.id||''),isYou:yes(m.isYou)||yes(m.me),isHost:yes(m.isHost)})).filter(m=>m.accountId);
  const self=members.find(m=>m.isYou);
  if(self&&yes(value.isHost))self.isHost=true;
  const owner=value.hostId||value.ownerId||value.owner_id;
  if(owner){const h=members.find(m=>m.accountId===owner);if(h)h.isHost=true;}
  return {...value,members};
}
let publishedRoom=null;
const roomNow=()=>normalizeRoom(window.oneSocialRoom?.()||publishedRoom);
let joined=false,notice='',roster=[],round=null,unsubscribe=null,hostSeen=0,connecting=false,generation=0,session='',ready=false,pending=null;
const applicants=new Map(),poses=new Map(),observers=new Set(),shotObservers=new Set(),seenShotEvents=new Map();
let openGame=null;
const link=()=>window.ONEPartyGameLink;
const me=()=>roomNow()?.members?.find(m=>m.isYou);
const host=()=>roomNow()?.members?.find(m=>m.isHost);
const isHost=()=>!!me()&&me().accountId===host()?.accountId;
const connected=id=>id===me()?.accountId||!!link()?.peers().some(p=>p.accountId===id&&p.connected);
const send=(to,kind,data)=>link()?.send(to,packet(kind,{room:roomNow()?.id,...data}));
const sendReliable=(to,kind,data)=>{const l=link(),msg=packet(kind,{room:roomNow()?.id,...data});return l?.sendReliable?l.sendReliable(to,msg):l?.send(to,msg);};
const member=id=>roomNow()?.members?.find(m=>m.accountId===id);
function broadcast(kind,data,ids=roster.map(m=>m.id)){for(const id of ids)if(id!==me()?.accountId)send(id,kind,data);}
function canStart(){return joined&&isHost()&&!!openGame&&!pending&&roster.length>=2&&roster.length<=4&&roster.every(p=>p.ready&&connected(p.id));}
export const lobbyPose=id=>poses.get(id);
export function lobbyState(){
  const mine=me(),owner=host();
  let text=notice;
  if(!text)text=joined&&!openGame?'Le jeu se charge encore. Si ce message reste affiché, recharge ONE.':connecting?'Connexion aux membres…':!joined?'Connexion au salon…':!owner?'Identification de l’hôte en cours…':!isHost()&&(!hostSeen||now()-hostSeen>7000)?'L’hôte doit aussi entrer dans le lobby 3D.':!roster.some(p=>p.id===mine?.accountId)?'Les quatre places sont prises. Attends une place libre.':roster.length<2?'Un ami doit entrer dans ce lobby depuis le même salon.':!roster.every(p=>p.ready)?'Chaque joueur choisit « Je suis prêt ».':isHost()?'Tout le monde est prêt. Tu peux lancer 3:17.':'Prêts ! L’hôte peut lancer 3:17.';
  return {room:roomNow()?.name||'Salon ONE',self:mine?.accountId,host:owner?.accountId,isHost:isHost(),joined,connecting,ready,canStart:canStart(),notice:text,players:roster.map(p=>({...p,connected:connected(p.id)})),poses:Object.fromEntries(poses)};
}
function redraw(){for(const fn of observers)fn(lobbyState());}
export function subscribeLobby(fn){observers.add(fn);fn(lobbyState());return()=>observers.delete(fn);}
export function subscribeLobbyShot(fn){shotObservers.add(fn);return()=>shotObservers.delete(fn);}
function rememberShot(id){const t=now();for(const [key,at] of seenShotEvents)if(t-at>5000)seenShotEvents.delete(key);if(seenShotEvents.has(id))return false;seenShotEvents.set(id,t);return true;}
function emitShot(payload){if(!payload||payload.target!==me()?.accountId||!rememberShot(payload.id))return false;for(const fn of shotObservers)fn({id:payload.id,shooter:payload.shooter,target:payload.target});return true;}
export function sendLobbyShot(target){
 const shooter=me()?.accountId,owner=host()?.accountId;
 if(!joined||round||!shooter||typeof target!=='string'||!target||target===shooter||!roster.some(p=>p.id===target))return false;
 const payload={id:crypto.randomUUID(),shooter,target};
 // Gun hits are discrete gameplay events: always route them over the reliable
 // data channel. Guests send to the host, which either applies the hit locally
 // or relays it reliably to the target. The host sends directly to guests.
 if(isHost()){
   if(target===shooter)return false;
   return sendReliable(target,'shot-hit46',payload)!==false;
 }
 if(!owner)return false;
 return sendReliable(owner,'shot-route46',payload)!==false;
}
function rebuildRoster(){
  if(!joined||!isHost()||round)return;
  const mine=me();if(!mine)return;
  const guests=[...applicants].filter(([id,a])=>id!==mine.accountId&&now()-a.at<7000&&member(id)&&connected(id)).slice(0,3);
  const next=[{id:mine.accountId,name:safeName(mine.name),ready,session},...guests.map(([id,a])=>({id,name:safeName(member(id).name),ready:a.ready,session:a.session}))];
  if(pending&&JSON.stringify(next)!==JSON.stringify(roster)){pending=null;notice='Le groupe a changé. Vérifiez les joueurs prêts, puis relancez.';}
  roster=next;for(const id of poses.keys())if(!roster.some(p=>p.id===id))poses.delete(id);
  broadcast('lobby43',{players:roster},[...applicants.keys()].filter(id=>member(id))); redraw();
}
const validPose=p=>p&&[p.x,p.z,p.yaw].every(Number.isFinite)&&Math.abs(p.x)<=22.4&&Math.abs(p.z)<=6.2&&Math.abs(p.yaw)<=Math.PI*2&&(!('pitch' in p)||Number.isFinite(p.pitch)&&Math.abs(p.pitch)<=1.2)&&(!('bat' in p)||typeof p.bat==='boolean')&&(!('gun' in p)||typeof p.gun==='boolean')&&(!('down' in p)||typeof p.down==='boolean')&&(!('swingSeq' in p)||Number.isSafeInteger(p.swingSeq)&&p.swingSeq>=0&&p.swingSeq<=1000000000)&&(!('shotSeq' in p)||Number.isSafeInteger(p.shotSeq)&&p.shotSeq>=0&&p.shotSeq<=1000000000)&&(!('shotTarget' in p)||typeof p.shotTarget==='string'&&p.shotTarget.length<=160);
function receive(from,p){
  if(!member(from)||p.room!==roomNow()?.id)return;
  if(p.kind==='hello43'&&isHost()&&typeof p.session==='string'&&p.session.length===36){
    if(round){send(from,'busy43',{});return;}
    if(!joined)return;
    applicants.set(from,{at:now(),ready:p.ready===true,session:p.session});rebuildRoster();
  }else if(p.kind==='lobby43'&&from===host()?.accountId&&joined&&!round&&validRoster(p.players)){
    roster=p.players;hostSeen=now();if(!pending)notice='';redraw();
  }else if(p.kind==='busy43'&&from===host()?.accountId&&joined&&!round){notice='Une partie est en cours. Rejoins la prochaine.';redraw();}
  else if(p.kind==='shot-route46'&&joined&&!round&&isHost()&&typeof p.id==='string'&&p.id.length===36&&p.shooter===from&&typeof p.target==='string'&&p.target!==from&&roster.some(m=>m.id===from)&&roster.some(m=>m.id===p.target)){
    if(p.target===me()?.accountId)emitShot({id:p.id,shooter:from,target:p.target});
    else sendReliable(p.target,'shot-hit46',{id:p.id,shooter:from,target:p.target,relay:true});
  }
  else if(p.kind==='shot-hit46'&&joined&&!round&&typeof p.id==='string'&&p.id.length===36&&typeof p.shooter==='string'&&typeof p.target==='string'&&p.target===me()?.accountId&&roster.some(m=>m.id===p.shooter)&&((from===p.shooter)||from===host()?.accountId)){
    emitShot({id:p.id,shooter:p.shooter,target:p.target});
  }
  else if(p.kind==='pose43'&&joined&&!round&&isHost()&&validPose(p.pose)&&roster.some(m=>m.id===from&&m.session===p.session))poses.set(from,p.pose);
  else if(p.kind==='poses43'&&joined&&!round&&from===host()?.accountId&&Array.isArray(p.poses)&&p.poses.length<=4){
    for(const entry of p.poses)if(entry.id!==me()?.accountId&&roster.some(m=>m.id===entry.id)&&validPose(entry.pose))poses.set(entry.id,entry.pose);
  }else if(p.kind==='prepare43'&&from===host()?.accountId&&joined&&!round&&validRound(p.config)){
    if(!openGame){send(from,'reject43',{id:p.config.id});notice='Le jeu se charge encore. Réessayez dans quelques secondes.';redraw();return;}
    pending={config:p.config,at:now()};notice='Le groupe lance 3:17…';send(from,'ack43',{id:p.config.id,session});redraw();
  }else if(p.kind==='ack43'&&isHost()&&pending?.config.id===p.id&&pending.config.players.some(m=>m.id===from&&m.session===p.session)){
    pending.acks.add(from);if(pending.acks.size===pending.config.players.length){const config=pending.config;broadcast('launch43',{config},config.players.map(p=>p.id));launch(config);}
  }else if(p.kind==='reject43'&&isHost()&&pending?.config.id===p.id){pending=null;notice='Un joueur charge encore le jeu. Réessayez dans quelques secondes.';redraw();}
  else if(p.kind==='launch43'&&from===host()?.accountId&&joined&&!round&&pending?.config.id===p.config?.id&&validRound(p.config))launch(p.config);
  else if(p.kind==='leave-lobby43'&&isHost()&&!round){applicants.delete(from);poses.delete(from);rebuildRoster();}
  else if(p.kind==='host-left43'&&from===host()?.accountId&&joined&&!round){roster=[];poses.clear();hostSeen=0;pending=null;notice='L’hôte a quitté le lobby. Attends son retour.';redraw();}
}
function validRoster(list){return Array.isArray(list)&&list.length>=1&&list.length<=4&&new Set(list.map(p=>p.id)).size===list.length&&list.every(p=>p&&typeof p.id==='string'&&member(p.id)&&typeof p.name==='string'&&p.name.length<=40&&typeof p.ready==='boolean'&&typeof p.session==='string'&&p.session.length===36);}
function validRound(c){return c&&typeof c.id==='string'&&/^[a-f\d-]{36}$/i.test(c.id)&&c.room===roomNow()?.id&&c.host===host()?.accountId&&validRoster(c.players)&&c.players.length>=2&&c.players.every(p=>p.ready)&&c.players.some(p=>p.id===me()?.accountId&&p.session===session)&&c.players.some(p=>p.id===c.host)&&Number.isInteger(c.seed)&&c.seed>=0&&c.seed<=0xffffffff;}
function launch(config){
  if(!validRound(config)||!openGame)return;
  round={...config,self:me().accountId};pending=null;notice='';
  window.ONELobby3D?.close?.({launch:true});window.oneCloseSalon?.();openGame({coop:round});
}
export function startRound(){
  rebuildRoster();if(!canStart()){redraw();return;}
  const config={id:crypto.randomUUID(),room:roomNow().id,host:me().accountId,players:roster,seed:crypto.getRandomValues(new Uint32Array(1))[0]};
  pending={config,acks:new Set([me().accountId]),at:now()};notice='Préparation des joueurs…';broadcast('prepare43',{config});redraw();
}
export function setLobbyReady(){if(!joined||pending||!roster.some(p=>p.id===me()?.accountId))return;ready=!ready;notice='';heartbeat();redraw();}
export function updateLobbyPose(pose){if(!joined||round||!validPose(pose))return;poses.set(me()?.accountId,pose);if(!isHost())send(host()?.accountId,'pose43',{pose,session});}
function bind(){if(!unsubscribe&&link())unsubscribe=link().subscribe(receive);}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function connectWithRetry(reconnect=false){
  let failure;
  for(let attempt=0;attempt<3;attempt++){
    try{if(attempt===0&&!reconnect)await link().connect();else await link().reconnect();return;}
    catch(error){failure=error;if(attempt<2)await pause(180*(attempt+1));}
  }
  throw failure||Error('Connexion au lobby indisponible.');
}
export async function joinLobby(context,reconnect=false){
  if(context?.room)publishedRoom=context.room;
  if(round||connecting)return;
  const own=++generation;connecting=true;notice='';redraw();
  try{
    // L'état du salon est déjà fourni par l'écran précédent : on rejoint
    // immédiatement avec ce cache et on rafraîchit en arrière-plan. Le
    // rafraîchissement bloquant ajoutait une attente visible avant chaque
    // synchronisation entre joueurs.
    const cached=roomNow(),cachedReady=!!cached&&cached.members.some(m=>m.isYou)&&cached.members.some(m=>m.isHost);
    if(cachedReady)Promise.resolve().then(()=>window.oneRefreshSalonState?.()).catch(()=>{});
    else await window.oneRefreshSalonState?.();
    if(own!==generation)return;
    if(!roomNow())throw Error('Rejoins d’abord un salon ONE, puis ouvre son lobby 3D.');
    if(!me())throw Error('Ton compte n’est pas identifié dans le salon. Ferme puis rouvre le salon ONE.');
    if(!host())throw Error('L’hôte du salon n’est pas identifié. Ferme puis rouvre le salon ONE.');
    if(!link())throw Error('Connexion absente : recharge ONE après avoir copié le dossier ui du correctif R43.');
    bind();await connectWithRetry(reconnect);
    if(own!==generation)return;
    if(!joined){session=crypto.randomUUID();ready=false;poses.clear();roster=[];hostSeen=0;applicants.clear();}
    joined=true;notice='';heartbeat();
  }catch(e){if(own===generation){joined=false;notice=e.message||'Connexion impossible. Utilise Réessayer.';}}
  finally{if(own===generation){connecting=false;redraw();}}
}
export function leaveLobby(){
  generation++;
  if(joined&&!round){if(isHost())broadcast('host-left43',{});else send(host()?.accountId,'leave-lobby43',{});}
  joined=false;connecting=false;ready=false;roster=[];pending=null;applicants.clear();poses.clear();notice='';
}
function heartbeat(){
  if(!joined||round)return;
  if(pending&&now()-pending.at>8000){pending=null;notice='Un joueur ne répond pas au lancement. Réessayez la connexion.';}
  if(isHost())rebuildRoster();else if(host())send(host().accountId,'hello43',{ready,session});
  redraw();
}
export function installCoop(open){
  openGame=open;bind();
  const style=document.createElement('style');style.textContent=`.three17-team{position:absolute;top:137px;left:14px;z-index:3;max-width:min(310px,65vw);padding:7px 10px;border:1px solid #ffffff20;border-radius:8px;background:#080b10b8;color:#e5dfd0;font:11px/1.6 system-ui;pointer-events:none;white-space:pre-line}@media(max-height:500px){.three17-team{top:132px;font-size:10px;line-height:1.35}}`;document.head.append(style);
  window.ONEThree17Coop={open:()=>window.ONEOpen3DLobby?.()};
  redraw();
}
window.addEventListener('one-party-state',e=>{
  const prior=roomNow()?.id;publishedRoom=e.detail;bind();
  const next=normalizeRoom(e.detail);
  if((joined||connecting)&&(!next||!next.members.some(m=>m.isYou)||round&&round.room!==next.id||prior&&prior!==next.id)){window.ONEThree17?.close();window.ONELobby3D?.close();leaveLobby();return;}
  redraw();
});
window.addEventListener('one-account-changed',()=>{window.ONEThree17?.close();window.ONELobby3D?.close();leaveLobby();});
// Le lobby doit refléter une arrivée ou un départ presque immédiatement.
setInterval(()=>{bind();heartbeat();},200);
setInterval(()=>{if(joined&&isHost()&&!round)broadcast('poses43',{poses:[...poses].filter(([id])=>roster.some(p=>p.id===id)).map(([id,pose])=>({id,pose}))});},100);

function avatar(scene,name,color){return createAvatar(scene,name,color);}
export function createCoopRuntime(config,b){
  const {house,monster,model,scene,shell,spawns}=b,localId=config.self,hosting=config.host===localId;
  const net=link();if(!net)throw Error('Connexion du salon absente.');
  const ids=config.players.map(p=>p.id),world=hosting?createCoopWorld({house,monster,model,members:config.players,spawns}):null;
  const visuals=new Map(config.players.filter(p=>p.id!==localId).map((p,i)=>[p.id,avatar(scene,p.name,[0x76868c,0x716b8c,0x8a7957][i])]));
  for(const v of visuals.values())v.track=createRemotePoseTrack();
  const freezeHeadCamera=(v)=>{
    const element=v.videoElement;if(!element||!element.videoWidth||!element.videoHeight||!v.cameraScreen?.material)return;
    try{const canvas=document.createElement('canvas');canvas.width=element.videoWidth;canvas.height=element.videoHeight;canvas.getContext('2d').drawImage(element,0,0,canvas.width,canvas.height);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;v.videoTexture?.dispose?.();v.videoTexture=texture;v.cameraScreen.material.map=texture;v.cameraScreen.material.color.set(0xffffff);v.cameraScreen.material.needsUpdate=true;v.videoFrozen=true;v.videoReady=true;}catch{}
  };
  const syncHeadCamera=(id,v,dead=false)=>{
    const element=window.ONEPartyMedia?.videoForMember?.(id)||null;
    const ready=!!element&&element.readyState>=2&&element.videoWidth>0&&element.videoHeight>0;
    if(dead&&v.videoElement===element){if(!v.videoFrozen&&ready)freezeHeadCamera(v);return;}
    if(element===v.videoElement&&!v.videoFrozen&&ready===v.videoReady)return;
    v.videoElement=element;v.videoFrozen=false;v.videoReady=ready;
    if(v.videoTexture){v.videoTexture.dispose();v.videoTexture=null;}
    const material=v.cameraScreen?.material;if(!material)return;
    if(element&&!ready){material.map=null;material.color.set(0x11151d);material.needsUpdate=true;return;}
    if(element){try{element.muted=true;element.playsInline=true;element.play?.().catch?.(()=>{});v.videoTexture=new THREE.VideoTexture(element);v.videoTexture.colorSpace=THREE.SRGBColorSpace;v.videoTexture.minFilter=THREE.LinearFilter;v.videoTexture.magFilter=THREE.LinearFilter;material.map=v.videoTexture;material.color.set(0xffffff);}catch{material.map=null;material.color.set(0x11151d);}}else{material.map=null;material.color.set(0x11151d);}material.needsUpdate=true;
  };
  const cameraRequest=window.ONEPartyMedia?.enable?.({camera:true});cameraRequest?.catch?.(()=>{});
  const hud=document.createElement('div');hud.className='three17-team';shell.append(hud);
  let stopped=false,armed=false,begun=false,finished=false,lastState=null,lastStateAt=now(),lastEvent=0,lastRevision=0,inputSeq=0,actionSeq=0,hostPaused=false,reconnecting=false,lastReconnect=0;
  let input={x:0,forward:0,yaw:spawns[ids.indexOf(localId)].yaw||0,pitch:0,paused:false};
  const ready=new Set(),lastInput=new Map(ids.map(id=>[id,now()])),inputSerial=new Map();
  const wire=(kind,data={})=>packet(kind,{room:config.room,round:config.id,...data});
  const transmit=(id,kind,data)=>net.send(id,wire(kind,data));
  const all=(kind,data)=>{for(const id of ids)if(id!==localId)transmit(id,kind,data);};
  function accept(s,trusted=false){
    if((!trusted&&!validSnapshot(s,ids,house))||s.revision<=lastRevision)return;lastRevision=s.revision;lastState=s;lastStateAt=now();
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
        const c=controls(p.controls);if(!c)return;
        const player=world.player(from),wasMoving=movingControls(player?.input),willMove=movingControls(c);
        inputSerial.set(from,p.seq);lastInput.set(from,now());if(p.ready===true)ready.add(from);world.input(from,c);
        // Client prediction is intentionally immediate, while the host receives
        // the same controls one network trip later. At the exact moving->idle
        // edge, accept only a small collision-swept final-position hint. This
        // removes the classic backwards snap when a guest releases the stick,
        // without giving the guest arbitrary teleport authority.
        if(wasMoving&&!willMove&&player&&validPositionHint(p.position,player.position)){
          const dx=p.position.x-player.position.x,dz=p.position.z-player.position.z,dist=Math.hypot(dx,dz);
          if(dist>.015&&dist<1.65){const step=Math.min(dist,1.20);model.movePlayer(house,player.position,dx/dist*step,dz/dist*step);}
        }
      }else if(p.kind==='action'&&begun&&!finished&&!hostPaused&&Number.isSafeInteger(p.seq)&&['interact','flash','revive'].includes(p.action)){if(controls(p.controls)){world.input(from,p.controls);world.action(from,p.action,p.seq);publish();}}
      else if(p.kind==='round-leave'){world.disconnect(from);ready.delete(from);if(!begun){all('end',{text:'Un membre a quitté la préparation. Revenez au salon pour relancer.'});abort('Un membre a quitté la préparation. Revenez au salon pour relancer.');}}
    }else if(from===config.host){
      if(p.kind==='state'){
        if(!validSnapshot(p.state,ids,house))return;hostPaused=!!p.paused;
        if(p.started===true&&!begun){begun=true;b.begin();}
        accept(p.state,true);if(!begun)b.wait(Number.isInteger(p.ready)?p.ready:0,ids.length);
      }else if(p.kind==='end')abort('L’hôte a quitté la partie. Revenez au salon pour jouer à nouveau.');
    }
  });
  function publish(){const state=world.snapshot();accept(state,true);all('state',{state,started:begun,paused:hostPaused,ready:ready.size});}
  function pump(){
    if(stopped)return;
    if(!roomNow()||roomNow().id!==config.room||!member(config.host)){abort('Le salon a été fermé ou l’hôte est parti.');return;}
    if(hosting){
      hostPaused=b.paused();if(armed)ready.add(localId);world.input(localId,{...input,paused:hostPaused});
      if(!finished&&!begun&&ready.size===ids.length){begun=true;b.begin();}
      for(const id of ids)if(id!==localId&&now()-lastInput.get(id)>45000){
        if(!begun){all('end',{});abort('Un membre ne répond plus. Revenez au salon pour relancer.');return;}
        if(world.player(id).connected)world.disconnect(id);
      }
      publish();
      if(!begun)b.wait(ready.size,ids.length);
    }else{
      const age=now()-lastStateAt;transmit(config.host,'input',{seq:++inputSeq,controls:{...input,paused:b.paused()},position:{x:b.position.x,y:b.position.y,z:b.position.z},ready:armed});
      // A brief WebRTC delivery gap is normal on mobile. Reconnecting after only
      // 2.5 s made the non-host visibly freeze and repeatedly renegotiate.
      if(age>8000&&now()-lastReconnect>12000&&!reconnecting){lastReconnect=now();reconnecting=true;Promise.resolve().then(()=>link()?.reconnect?.()).catch(()=>{}).finally(()=>{reconnecting=false;});}
      if(age>45000)abort('Connexion avec l’hôte perdue. Revenez au salon pour relancer.');
    }
    updateHud();
  }
  function updateHud(){
    const lines=['ÉQUIPE · '+ids.length+' JOUEURS'];
    for(const p of lastState?.players||config.players)lines.push(safeName(p.name)+(p.id===localId?' · toi':'')+' · '+(!p.connected&&lastState?'déconnecté':p.escaped?'sorti':p.dead?'attrapé':p.hidden?'caché':'en jeu'));
    if(begun&&(hostPaused||!hosting&&now()-lastStateAt>3500))lines.push('Connexion en cours…');
    const text=lines.join('\n');if(hud.textContent!==text)hud.textContent=text;
  }
  // L'invité envoie ses commandes à 30 Hz pour que l'hôte ne fasse plus de
  // pause visible entre deux paquets réseau.
  const timer=setInterval(pump,33);
  function step(elapsed,value){
    input=controls(value)||input;
    if(!begun||finished||stopped)return;
    if(hosting){
      world.input(localId,input);let left=Math.min(.25,elapsed);while(left>1e-6){const dt=Math.min(.05,left);world.step(dt);left-=dt;}
      accept(world.snapshot(),true);
    }else if(!hostPaused&&now()-lastStateAt<8000){
      const p=lastState?.players.find(x=>x.id===localId);if(p&&!p.hidden&&!p.dead&&!p.escaped){const s=Math.sin(input.yaw),c=Math.cos(input.yaw),dt=Math.min(elapsed,.1);model.movePlayer(house,b.position,(-s*input.forward+c*input.x)*(input.sprint?4.1:2.5)*dt,(-c*input.forward-s*input.x)*(input.sprint?4.1:2.5)*dt);}
    }
      const localPlayer=lastState?.players.find(x=>x.id===localId),spectating=!!localPlayer?.dead||!!localPlayer?.escaped,follow= spectating ? (lastState?.players.find(x=>x.connected&&!x.dead&&!x.escaped)||localPlayer) : null,followId=follow?.id;
      for(const [id,v] of visuals){const p=lastState?.players.find(x=>x.id===id);syncHeadCamera(id,v,!!p?.dead);if(!p)continue;v.cameraHead.visible=!spectating;v.head.visible=spectating;v.cap.visible=spectating;v.face.visible=spectating;
        // Le spectateur reprend exactement la première personne du survivant
        // suivi : son propre avatar ne doit donc pas apparaître dans la caméra.
        v.group.visible=p.connected&&!p.hidden&&!p.escaped&&p.id!==followId;v.group.scale.setScalar(p.dead?.82:1);if(!v.group.visible)continue;
      const time=now();v.track.push({...p.position,yaw:p.yaw,pitch:p.pitch},time,p);const point=v.track.at(time);if(point){animateAvatar(v,{...point,dead:!!p.dead},elapsed);orientAvatarCamera(v,{x:b.position.x,y:(b.position.y||0)+1.65,z:b.position.z});}v.glow.visible=p.flash||p.dead;
    }
  }
  return {
    step,ready(){armed=true;b.wait(ready.size,ids.length);pump();},
    action(type,value){input=controls(value)||input;if(!begun||finished||hostPaused||!hosting&&now()-lastStateAt>5000)return;if(hosting){world.input(localId,input);world.action(localId,type,++actionSeq);publish();}else transmit(config.host,'action',{action:type,seq:++actionSeq,controls:input});},
    get local(){return lastState?.players.find(p=>p.id===localId);},get isHost(){return hosting;},get state(){return lastState;},moving:()=>Math.hypot(input.x,input.forward)>.04,
      dispose(){if(stopped)return;stopped=true;clearInterval(timer);off();for(const v of visuals.values()){v.videoTexture?.dispose?.();v.videoTexture=null;}if(hosting)all('end',{});else transmit(config.host,'round-leave',{});round=null;leaveLobby();hud.remove();},
    inspect:()=>({hosting,begun,ready:[...ready],state:lastState,peers:net.peers()}),
    ...(window.__ONE317_TEST__===true?{world}:{}),
  };
}
function validSnapshot(s,ids,house){
  const point=p=>p&&[p.x,p.y,p.z].every(Number.isFinite)&&Math.abs(p.x)<100&&Math.abs(p.y)<15&&Math.abs(p.z)<100;
  return s&&Number.isSafeInteger(s.revision)&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=900&&[null,'win','caught','time'].includes(s.outcome)&&
    Array.isArray(s.players)&&s.players.length===ids.length&&new Set(s.players.map(p=>p.id)).size===ids.length&&s.players.every(p=>ids.includes(p.id)&&point(p.position)&&Number.isFinite(p.yaw)&&Number.isFinite(p.pitch)&&typeof p.name==='string'&&p.name.length<=40)&&
    s.monster&&point(s.monster.position)&&Number.isFinite(s.monster.yaw)&&['dormant','patrol','chase','investigate','search','caught'].includes(s.monster.state)&&
    Array.isArray(s.doors)&&s.doors.length===house.doors.length&&s.doors.every(d=>house.doors.some(x=>x.id===d.id)&&Number.isFinite(d.angle)&&Number.isFinite(d.targetAngle))&&
    Array.isArray(s.items)&&(s.items.length===house.items.length||s.items.length===house.items.length-1)&&s.items.every(i=>{const expected=house.items.find(x=>x.id===i.id);return !!expected&&(i.revive===undefined?!expected.revive:i.revive===!!expected.revive)&&point(i);})&&Array.isArray(s.containers)&&s.containers.length<=house.containers.length&&
    Array.isArray(s.events)&&s.events.length<=32&&s.events.every(e=>Number.isSafeInteger(e.id)&&typeof e.kind==='string'&&ids.includes(e.who));
}




