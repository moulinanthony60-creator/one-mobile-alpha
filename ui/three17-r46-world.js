// The host owns all shared decisions. Guests only submit bounded control inputs.
export const COOP_VERSION=1;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function controls(value){
  if(!value||![value.x,value.forward,value.yaw,value.pitch].every(Number.isFinite))return null;
  const length=Math.max(1,Math.hypot(value.x,value.forward));
  return {x:clamp(value.x/length,-1,1),forward:clamp(value.forward/length,-1,1),yaw:Math.atan2(Math.sin(value.yaw),Math.cos(value.yaw)),pitch:clamp(value.pitch,-.8,.7),paused:!!value.paused,sprint:!!value.sprint};
}
export function createCoopWorld({house,monster,model,members,spawns}){
  const {movePlayer,blockedAt,hasLineOfSight,circleHitsDoor,PLAYER_RADIUS=.24}=model;
  const events=[];let eventId=0,remaining=900,outcome=null,targetId=null,revision=0;
  const players=members.map((m,i)=>({id:m.id,name:m.name,position:{...spawns[i]},yaw:spawns[i].yaw||0,pitch:spawns[i].pitch||0,flash:true,hidden:false,hideId:null,returnPoint:null,known:false,dead:false,escaped:false,connected:true,carryingRevive:false,walked:0,input:{x:0,forward:0,yaw:spawns[i].yaw||0,pitch:0,paused:false,sprint:false},inputAge:0,lastAction:-1}));
  const player=id=>players.find(p=>p.id===id);
  const emit=(kind,who,data={})=>{events.push({id:++eventId,kind,who,...data});if(events.length>32)events.shift();};
  const active=p=>!p.dead&&!p.escaped&&p.connected;
  const count=()=>house.items.filter(i=>!i.revive&&i.taken).length;
  function resolve(){
    if(outcome)return;
    if(!players.some(active))outcome=players.some(p=>p.escaped)?'win':'caught';
  }
  function select(p){
    if(p.hidden)return {type:'hide',object:house.hideSpots.find(s=>s.id===p.hideId)};
    let best=null,score=Infinity;const from={...p.position,y:p.position.y+1.62},fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
    function candidate(object,type,point){
      if(object.room){const floor=house.rooms.find(r=>r.id===object.room)?.floorY;if(Number.isFinite(floor)&&Math.abs(floor-p.position.y)>.45)return;}
      const dx=point.x-p.position.x,dz=point.z-p.position.z,dy=point.y-from.y,d=Math.hypot(dx,dy,dz),horizontal=Math.hypot(dx,dz);
      const facing=horizontal<.2?1:(fx*dx+fz*dz)/horizontal;
      if(d>2.05||facing<.38||!hasLineOfSight(house,from,point,type==='door'?object.id:'',object.occluders||[]))return;
      const bias=type==='item'?-1.05:type==='container'?(object.opened?.65:-.5):0,rank=d+(1-facing)*.75+bias;
      if(rank<score){score=rank;best={type,object};}
    }
    for(const s of house.hideSpots)candidate(s,'hide',{x:s.x,y:(s.y||0)+1,z:s.z});
    for(const c of house.containers)candidate(c,'container',c);
    for(const i of house.items)if(!i.taken&&!i.hidden)candidate(i,'item',i);
    for(const d of house.doors)candidate(d,'door',{x:d.hingeX+Math.cos(d.angle)*d.width*.72,y:(d.bottom||0)+1.2,z:d.hingeZ-Math.sin(d.angle)*d.width*.72});
    return best;
  }
  function action(id,type,serial){
    const p=player(id);if(!p||!active(p)||outcome||!Number.isSafeInteger(serial)||serial<=p.lastAction)return false;
    p.lastAction=serial;
    if(type==='flash'){if(!p.hidden)p.flash=!p.flash;return true;}
    if(type==='revive'){
      if(!p.carryingRevive){emit('message',id,{text:'Récupérez le Sceau de rappel avant de réanimer un allié.'});return false;}
      const target=players.filter(q=>q!==p&&q.dead&&q.connected&&!q.escaped).sort((a,b)=>distance(p.position,a.position)-distance(p.position,b.position)).find(q=>distance(p.position,q.position)<=2.2&&Math.abs(p.position.y-q.position.y)<1.4);
      if(!target){emit('message',id,{text:'Approchez-vous du cadavre d’un allié pour le faire réapparaître.'});return false;}
      p.carryingRevive=false;target.dead=false;target.hidden=false;target.hideId=null;target.returnPoint=null;target.known=false;target.flash=true;target.inputAge=0;
      emit('revived',id,{target:target.id,text:p.name+' a réanimé '+target.name+' !'});return true;
    }
    if(type!=='interact')return false;
    const s=select(p);if(!s?.object){emit('message',id,{text:'Approchez-vous et regardez la porte ou l’objet.'});return false;}
    const o=s.object;
    if(s.type==='item'){
      if(o.hidden||o.taken)return false;o.taken=true;
      if(o.revive){p.carryingRevive=true;emit('revive-kit-picked',id,{text:p.name+' a récupéré le Sceau de rappel. Emmenez-le jusqu’à un allié attrapé.'});}
      else {if(count()===3)house.doors.find(d=>d.exit).locked=false;emit('collect',id,{item:o.id,text:p.name+' a récupéré '+o.label+'.'});}
    }else if(s.type==='container'){
      const first=!o.opened;o.opened=true;
      if(first){monster.noise(p.position,9);emit('search',id,{container:o.id,at:{...p.position},seconds:600-remaining});}
      const item=house.items.find(i=>i.id===o.contains);
      if(item&&!item.taken){if(item.hidden){item.hidden=false;Object.assign(item,item.reveal);item.occluders=[];}emit('message',id,{text:item.label+' découvert · visez-le puis appuyez sur AGIR.'});}
      else emit('message',id,{text:(first?'Vous fouillez ':'Déjà fouillé : ')+o.label+' · rien d’utile.'});
    }else if(s.type==='hide'){
      if(p.hidden){
        const exit=[p.returnPoint,{x:o.exitX,y:o.y||0,z:o.exitZ}].find(q=>q&&!blockedAt(house,q.x,q.z,q.y));
        if(!exit){emit('message',id,{text:'La sortie de la cachette est bloquée.'});return false;}
        Object.assign(p.position,exit);p.hidden=false;p.hideId=null;p.known=false;p.flash=p.savedFlash??true;p.yaw=p.savedYaw??p.yaw;
        emit('hide',id,{hidden:false,text:'Vous sortez de la cachette.'});
      }else{
        if(players.some(q=>q!==p&&active(q)&&q.hideId===o.id)){emit('message',id,{text:'Cette cachette est déjà occupée.'});return false;}
        p.returnPoint={...p.position};p.known=monster.canSee(p.position,p.flash,false);p.savedFlash=p.flash;p.savedYaw=p.yaw;
        p.hidden=true;p.hideId=o.id;p.flash=false;Object.assign(p.position,{x:o.x,y:o.y??p.position.y,z:o.z});p.yaw=Math.atan2(o.x-o.exitX,o.z-o.exitZ);p.pitch=o.id==='h-under-bed'?0:-.015;
        if(p.known){targetId=id;monster.state.memory=monster.rules.memory;monster.state.state='chase';}
        emit('hide',id,{hidden:true,text:p.known?'Il vous a vu entrer ! Cette cachette ne vous protège pas.':'Vous êtes caché · attendez qu’il s’éloigne.'});
      }
    }else if(o.exit){
      if(count()<3)emit('message',id,{text:'Il manque '+(3-count())+' objet(s).'});
      else{p.escaped=true;p.hidden=false;p.hideId=null;emit('escaped',id,{text:p.name+' a atteint la sortie.'});resolve();}
    }else if(!o.locked){
      const opening=Math.abs(o.targetAngle-o.closedAngle)<.01;let desired=o.closedAngle;
      if(opening){const mid=a=>({x:o.hingeX+Math.cos(a)*o.width*.5,z:o.hingeZ-Math.sin(a)*o.width*.5}),plus=mid(o.closedAngle+Math.PI/2),minus=mid(o.closedAngle-Math.PI/2);
        const d=q=>(q.x-p.position.x)**2+(q.z-p.position.z)**2;desired+=d(plus)>=d(minus)?Math.PI/2:-Math.PI/2;}
      const actors=[monster.state.position,...players.filter(q=>q!==p&&active(q)&&!q.hidden).map(q=>q.position)].filter(q=>q.y+.04<(o.bottom||0)+o.height&&q.y+1.72>(o.bottom||0));
      for(let n=1;n<=18;n++)if(actors.some(q=>circleHitsDoor(q.x,q.z,PLAYER_RADIUS+.02,o,o.angle+(desired-o.angle)*n/18))){emit('message',id,{text:'Le passage de la porte est occupé.'});return false;}
      o.targetAngle=desired;monster.noise(p.position,9);emit('door',id,{open:opening,at:{x:o.x,y:o.bottom||0,z:o.z}});
    }
    return true;
  }
  function input(id,value){const p=player(id),v=controls(value);if(!p||!v||!p.connected)return false;p.input=v;p.inputAge=0;if(!p.hidden){p.yaw=v.yaw;p.pitch=v.pitch;}return true;}
  function step(dt){
    if(outcome||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);remaining=Math.max(0,remaining-dt);if(!remaining){outcome='time';return;}
    for(const p of players){
      p.inputAge+=dt;if(!active(p)||p.hidden||p.input.paused||p.inputAge>.50)continue;
      p.yaw=p.input.yaw;p.pitch=p.input.pitch;const before={...p.position},s=Math.sin(p.yaw),c=Math.cos(p.yaw);
      const speed=p.input.sprint?4.1:2.5;
      movePlayer(house,p.position,(-s*p.input.forward+c*p.input.x)*speed*dt,(-c*p.input.forward-s*p.input.x)*speed*dt);
      p.walked+=Math.hypot(p.position.x-before.x,p.position.z-before.z);
      if(p.walked>.62){p.walked=0;monster.noise(p.position,4.8);emit('step',p.id,{at:{...p.position}});}
    }
    for(const d of house.doors){
      const delta=d.targetAngle-d.angle;if(Math.abs(delta)<.0001)continue;const next=d.angle+Math.sign(delta)*Math.min(Math.abs(delta),dt*5);
      const actors=[monster.state.position,...players.filter(p=>active(p)&&!p.hidden).map(p=>p.position)];
      if(actors.some(p=>p.y+.04<(d.bottom||0)+d.height&&p.y+1.72>(d.bottom||0)&&circleHitsDoor(p.x,p.z,PLAYER_RADIUS+.015,d,next))){d.targetAngle=d.angle;continue;}d.angle=next;
    }
    const living=players.filter(active);if(!living.length){resolve();return;}
    let target=living.find(p=>p.id===targetId);
    const seen=living.filter(p=>monster.canSee(p.position,p.flash,p.hidden)).sort((a,b)=>distance(monster.state.position,a.position)-distance(monster.state.position,b.position));
    if(!target)target=seen[0]||living[0];
    else if(seen[0]&&(!monster.canSee(target.position,target.flash,target.hidden)||distance(monster.state.position,seen[0].position)+1.5<distance(monster.state.position,target.position)))target=seen[0];
    if(targetId!==target.id){monster.state.attack=0;monster.state.sense=0;targetId=target.id;}
    monster.state.knownHide=target.hidden&&target.known?{id:target.hideId,point:target.returnPoint}:null;
    monster.update(dt,{player:target.position,flashOn:target.flash,hidden:target.hidden});
    if(monster.state.captured){
      target.dead=true;target.hidden=false;target.hideId=null;target.flash=false;
      if(target.carryingRevive){const kit=house.items.find(i=>i.revive);if(kit){kit.taken=false;kit.hidden=false;kit.x=target.position.x;kit.y=target.position.y+.28;kit.z=target.position.z;}target.carryingRevive=false;}
      emit('caught',target.id,{text:target.name+' a été attrapé. Les autres peuvent encore le faire réapparaître.'});
      Object.assign(monster.state,{captured:false,attack:0,knownHide:null,memory:0,sense:0,state:'search',search:3,target:null,path:[]});targetId=null;resolve();
    }
  }
  function disconnect(id){const p=player(id);if(!p)return;p.connected=false;p.hidden=false;p.hideId=null;if(p.carryingRevive){const kit=house.items.find(i=>i.revive);if(kit)kit.taken=false;p.carryingRevive=false;}emit('left',id,{text:p.name+' a quitté la partie.'});resolve();}
  function snapshot(){return {revision:++revision,remaining,outcome,targetId,players:players.map(({input,inputAge,lastAction,walked,savedFlash,savedYaw,returnPoint,...p})=>({...p,position:{...p.position}})),
    monster:monster.snapshot(),doors:house.doors.map(d=>({id:d.id,angle:d.angle,targetAngle:d.targetAngle,locked:!!d.locked})),
    items:house.items.map(i=>({id:i.id,revive:!!i.revive,taken:!!i.taken,hidden:!!i.hidden,x:i.x,y:i.y,z:i.z})),containers:house.containers.filter(c=>c.opened).map(c=>c.id),events:events.map(e=>({...e}))};}
  return {players,player,input,action,select,step,disconnect,snapshot,get outcome(){return outcome;}};
}



