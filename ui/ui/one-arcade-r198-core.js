// Shared geometry and host-authoritative rules. No DOM or transport dependency.
export const GAMES=Object.freeze([
 {id:'paint',name:'Cache-cache peinture',min:2,max:8,icon:'◒',color:'#ad70ed',description:'Peins ton personnage, prends la bonne pose et fonds-toi dans le décor.'},
 {id:'murder',name:'Murder',min:3,max:8,icon:'◇',color:'#e46c85',description:'Un tueur caché, un innocent armé. Observe, bluffe et survis.'},
 {id:'shoot',name:'Tir en équipes',min:2,max:8,icon:'◎',color:'#56b9ed',description:'Une arène, deux équipes : 1 contre 1 à 4 contre 4.'},
 {id:'prop',name:'Prop Hunt',min:2,max:8,icon:'▣',color:'#62c6a0',description:'Deviens un objet du décor et échappe aux chasseurs.'}
]);
export const COLORS=['#d8c5ac','#517f70','#c67d60','#526e9a','#ab8eba','#555967'];
export const PROP_TYPES={crate:{name:'Caisse',w:.9,h:.9,d:.9,icon:'▣'},chair:{name:'Chaise',w:.65,h:1.05,d:.65,icon:'♧'},plant:{name:'Plante',w:.7,h:1.35,d:.7,icon:'♣'},lamp:{name:'Lampe',w:.45,h:1.55,d:.45,icon:'♙'},barrel:{name:'Tonneau',w:.7,h:1.0,d:.7,icon:'◉'}};
export const WORLD={width:28,depth:22,walls:[
 {x:-14,z:0,w:.3,d:22,h:3.6,c:0},{x:14,z:0,w:.3,d:22,h:3.6,c:3},{x:0,z:-11,w:28,d:.3,h:3.6,c:1},{x:0,z:11,w:28,d:.3,h:3.6,c:2},
 {x:-7,z:-6,w:.28,d:6,h:3.2,c:1},{x:-7,z:6,w:.28,d:6,h:3.2,c:2},{x:7,z:-6,w:.28,d:6,h:3.2,c:3},{x:7,z:6,w:.28,d:6,h:3.2,c:4},
 {x:-3.5,z:-3,w:3,d:.4,h:1.2,c:0},{x:3.5,z:3,w:3,d:.4,h:1.2,c:5},{x:0,z:-7,w:2,d:1.4,h:1.2,c:3},{x:0,z:7,w:2,d:1.4,h:1.2,c:2}
],props:[
 ['crate',-11,-8],['crate',-10,-8],['plant',-12,0],['chair',-10,5],['lamp',-12,8],['barrel',-4,-8],['chair',-4,0],['plant',-5,8],
 ['lamp',4,-8],['barrel',4,0],['crate',5,8],['chair',11,-8],['plant',12,-4],['barrel',10,0],['chair',10,5],['crate',12,8]
].map(([type,x,z],i)=>({id:'p'+i,type,x,z,c:i%COLORS.length})),spawns:[[-11,2],[11,-2],[-11,-2],[11,2],[-11,0],[11,0],[-11,4],[11,-4]]};
// Each game shares one authoritative geometry with its renderer and collision checks.
const boundary=WORLD.walls.slice(0,4);
const wall=(x,z,w,d,h,c)=>({x,z,w,d,h,c});
const objects=rows=>rows.map(([type,x,z,c],i)=>({id:'p'+i,type,x,z,c:c??i%COLORS.length}));
export const WORLDS={
 shoot:{...WORLD,name:'Traverse',floor:'#aebec7',sky:'#99bccc',walls:[...WORLD.walls,wall(0,0,2,.55,1.95,5)],zones:[[-10,0,7,21,3],[10,0,7,21,4]],labels:['BASE BLEUE','BASE ROSE']},
 paint:{...WORLD,name:'Galerie Chromatique',floor:'#d8c5ac',sky:'#c4d4cc',walls:[...boundary,wall(-7,-6,.35,5,2.8,1),wall(-7,6,.35,5,2.8,2),wall(7,-6,.35,5,2.8,3),wall(7,6,.35,5,2.8,4),wall(-2,-6,3,.35,2.4,1),wall(2,6,3,.35,2.4,4),wall(0,0,2.4,.5,2.4,5)],zones:[[-10,-6,7,9,1],[-10,6,7,9,2],[10,-6,7,9,3],[10,6,7,9,4],[0,0,7,4,5]],labels:['GALERIE VERTE','GALERIE MAUVE']},
 murder:{...WORLD,name:'Villa Minuit',floor:'#b7afa5',sky:'#9cacb7',walls:[...boundary,wall(-5,-6.7,.35,7,3,1),wall(-5,6.7,.35,7,3,2),wall(5,-6.7,.35,7,3,3),wall(5,6.7,.35,7,3,4),wall(-10,-3,5.5,.35,3,1),wall(10,3,5.5,.35,3,4),wall(0,-7,2.4,1.2,1.1,5),wall(0,7,2.4,1.2,1.1,0)],props:objects([['plant',-12,-8],['chair',-9,-8],['lamp',-12,8],['chair',-9,7],['barrel',-3,-8],['plant',-3,4],['lamp',3,-4],['chair',3,8],['plant',12,-8],['chair',9,-7],['lamp',12,8],['crate',9,8]]),zones:[[-9.5,-7,8,7,1],[-9.5,7,8,7,2],[9.5,-7,8,7,3],[9.5,7,8,7,4]],labels:['SALON','BIBLIOTHÈQUE']},
 prop:{...WORLD,name:'Dépôt des curiosités',floor:'#b2bbb3',sky:'#a7c4bf',walls:[...boundary,wall(-5,-6,.5,5,2.3,1),wall(-5,6,.5,5,2.3,1),wall(5,-6,.5,5,2.3,2),wall(5,6,.5,5,2.3,2),wall(0,0,2,1.5,1.7,5)],props:objects([['crate',-11,-8],['crate',-10,-8],['crate',-9,-8],['plant',-12,0],['chair',-10,5],['lamp',-12,8],['lamp',-10,8],['barrel',-3,-8],['barrel',-2,-8],['chair',-3,0],['plant',-3,8],['plant',-2,8],['lamp',3,-8],['lamp',2,-8],['barrel',3,0],['crate',3,8],['crate',2,8],['chair',11,-8],['chair',10,-8],['plant',12,-4],['barrel',10,0],['barrel',12,0],['chair',10,5],['crate',12,8],['crate',11,8]]),zones:[[-9,0,7,20,1],[9,0,7,20,2]],labels:['DÉPÔT A','DÉPÔT B']}
};
const worldBlocks=new WeakMap();
export function worldFor(game){return WORLDS[game]||WORLD;}
export function blocksFor(world=WORLD){if(!worldBlocks.has(world))worldBlocks.set(world,[...world.walls,...world.props.map(p=>({...p,...PROP_TYPES[p.type]}))]);return worldBlocks.get(world);}
export function bodyRadius(p){return p.prop?Math.max(PROP_TYPES[p.prop].w,PROP_TYPES[p.prop].d)/2+.02:.3;}
export function freePosition(x,z,r=.3,world=WORLD){return Math.abs(x)<world.width/2-.45&&Math.abs(z)<world.depth/2-.45&&!blocksFor(world).some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function requiredPlayers(game,size=1){return game==='shoot'?size*2:GAMES.find(g=>g.id===game)?.min||99;}
export function validMode(game,size=1,count=2){const g=GAMES.find(g=>g.id===game);return !!g&&Number.isInteger(count)&&count>=g.min&&count<=g.max&&(game!=='shoot'||Number.isInteger(size)&&size>=1&&size<=4&&count===size*2);}
const boxes=()=>[...WORLD.walls,...WORLD.props.map(p=>({...p,...PROP_TYPES[p.type]}))];
export const BLOCKS=boxes();
export function moveBody(p,dx,dz,r=.3,world=WORLD){
 const free=(x,z)=>freePosition(x,z,r,world);
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));for(let i=0;i<steps;i++){if(free(p.x+dx/steps,p.z))p.x+=dx/steps;if(free(p.x,p.z+dz/steps))p.z+=dz/steps;}return p;
}
export function rayBox(o,d,b,max=50){let near=0,far=max;for(const [k,lo,hi]of [['x',b.x-b.w/2,b.x+b.w/2],['y',0,b.h],['z',b.z-b.d/2,b.z+b.d/2]]){if(Math.abs(d[k])<1e-8){if(o[k]<lo||o[k]>hi)return Infinity;}else{let a=(lo-o[k])/d[k],c=(hi-o[k])/d[k];if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);if(near>far)return Infinity;}}return near;}
export function dimensions(p){return p.prop?PROP_TYPES[p.prop]:{w:.6,h:p.frozen?1.0:1.8,d:.6};}
export function eyeHeight(p){return p.prop?Math.min(1.15,dimensions(p).h*.8):p.frozen ? .8 : 1.57;}
export function aim(p){return {x:-Math.sin(p.yaw)*Math.cos(p.pitch),y:Math.sin(p.pitch),z:-Math.cos(p.yaw)*Math.cos(p.pitch)};}
export function nearbyProp(p,world=WORLD){let best=null,distance=2.8;for(const o of world.props){const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<distance){distance=d;best=o;}}return best;}
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
export function createMatch({game,size=1,players,randomize=random}){
 if(!validMode(game,size,players?.length)||new Set(players.map(p=>p.id)).size!==players.length)throw Error('Nombre de joueurs incompatible avec ce mode.');
 const shuffled=players.map(p=>({...p}));for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(randomize()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const world=worldFor(game),blocks=blocksFor(world),hiding=game==='paint'||game==='prop',state={game,size,elapsed:0,phase:hiding?'prepare':'play',until:hiding?35:180,score:[0,0],target:size*5,finished:false,winner:'',reason:'',gun:null,events:[],players:[]};
 const hunters=Math.max(1,Math.floor(players.length/3));
 state.players=shuffled.map((p,i)=>{const role=game==='shoot'?'fighter':game==='murder'?i===0?'murderer':i===1?'armed':'innocent':i<hunters?'seeker':'hider';const team=game==='shoot'?i%2:role==='hider'?1:0,spawn=game==='shoot'?world.spawns[i]:hiding&&role==='seeker'?[0,9.5]:world.spawns[i];return {id:p.id,name:String(p.name||'Membre').slice(0,40),role,team,x:spawn[0],z:spawn[1],yaw:spawn[0]<-1?-Math.PI/2:spawn[0]>1?Math.PI/2:0,pitch:0,hp:100,alive:true,connected:true,kills:0,deaths:0,ammo:12,reloadAt:0,respawnAt:0,invincible:0,cooldown:0,drawn:game==='shoot'||role==='seeker',colors:[0,0,0],prop:null,propColor:0,frozen:false,seq:0,input:{x:0,z:0}}});
 const player=id=>state.players.find(p=>p.id===id);
 function finish(winner,reason){if(state.finished)return;state.finished=true;state.phase='finished';state.winner=winner;state.reason=reason;for(const p of state.players)p.input={x:0,z:0};}
 function endCheck(){
  if(state.finished)return;const live=state.players.filter(p=>p.alive&&p.connected);
  if(game==='shoot'){if([0,1].some(t=>!state.players.some(p=>p.team===t&&p.connected)))finish('Partie interrompue','Une équipe a quitté la partie.');}
  else if(game==='murder'){if(!live.some(p=>p.role==='murderer'))finish('Les innocents gagnent','Le tueur a été arrêté.');else if(!live.some(p=>p.role!=='murderer'))finish('Le tueur gagne','Tous les innocents ont été éliminés.');}
  else if(!live.some(p=>p.role==='hider'))finish('Les chasseurs gagnent','Tous les joueurs cachés ont été trouvés.');else if(!live.some(p=>p.role==='seeker'))finish('Les cachés gagnent','Il ne reste aucun chasseur.');
 }
 function eliminate(p,by){if(!p.alive)return;p.alive=false;p.hp=0;p.deaths++;p.input={x:0,z:0};if(by&&by!==p)by.kills++;if(game==='murder'&&p.role==='armed')state.gun={x:p.x,z:p.z};if(game==='shoot'){p.respawnAt=state.elapsed+3;if(by&&by.team!==p.team){state.score[by.team]++;if(state.score[by.team]>=state.target)finish(by.team===0?'Équipe bleue gagnante':'Équipe rose gagnante','Objectif de '+state.target+' éliminations atteint.');}}endCheck();}
 function input(id,data){const p=player(id);if(!p||!p.connected||!data||![data.x,data.z,data.yaw,data.pitch].every(Number.isFinite))return false;p.input={x:clamp(data.x,-1,1),z:clamp(data.z,-1,1)};const length=Math.hypot(p.input.x,p.input.z);if(length>1){p.input.x/=length;p.input.z/=length;}p.yaw=Math.atan2(Math.sin(data.yaw),Math.cos(data.yaw));p.pitch=clamp(data.pitch,-1.25,1.25);return true;}
 function action(id,a){const p=player(id);if(!p||!p.connected||!p.alive||state.finished||!a||!Number.isSafeInteger(a.seq)||a.seq<=p.seq||a.seq>1e9)return false;
  if(!['fire','reload','draw','paint','transform','freeze','pickup'].includes(a.type))return false;p.seq=a.seq;
  if(Number.isFinite(a.yaw)&&Number.isFinite(a.pitch)){p.yaw=Math.atan2(Math.sin(a.yaw),Math.cos(a.yaw));p.pitch=clamp(a.pitch,-1.25,1.25);}
  if(a.type==='paint'){if(game!=='paint'||p.role!=='hider'||state.phase!=='prepare'||!Number.isInteger(a.part)||a.part<0||a.part>2||!Number.isInteger(a.color)||a.color<0||a.color>=COLORS.length)return false;p.colors[a.part]=a.color;return true;}
  if(a.type==='freeze'){if(p.role!=='hider')return false;p.frozen=!p.frozen;return true;}
  if(a.type==='transform'){const obj=world.props.find(o=>o.id===a.prop);if(game!=='prop'||p.role!=='hider'||!obj||Math.hypot(obj.x-p.x,obj.z-p.z)>2.8)return false;const radius=bodyRadius({prop:obj.type});if(!freePosition(p.x,p.z,radius,world))return false;p.prop=obj.type;p.propColor=obj.c;p.frozen=false;return true;}
  if(a.type==='pickup'){if(game!=='murder'||p.role!=='innocent'||!state.gun||Math.hypot(state.gun.x-p.x,state.gun.z-p.z)>1.8)return false;p.role='armed';p.ammo=12;state.gun=null;return true;}
  if(a.type==='draw'){if(game!=='murder'||!['armed','murderer'].includes(p.role))return false;p.drawn=!p.drawn;return true;}
  if(a.type==='reload'){if(!(game==='shoot'||p.role==='armed'||p.role==='seeker')||p.reloadAt||p.ammo===12)return false;p.reloadAt=state.elapsed+1.5;return true;}
  if(state.phase!=='play'||p.cooldown>state.elapsed||p.reloadAt||!(game==='shoot'||p.role==='seeker'||game==='murder'&&p.drawn&&p.role!=='innocent'))return false;
  const knife=p.role==='murderer',range=knife?1.85:45;if(!knife&&p.ammo<=0){p.reloadAt=state.elapsed+1.5;return false;}p.cooldown=state.elapsed+(knife?.65:game==='shoot'?.24:.85);if(!knife)p.ammo--;
  const o={x:p.x,y:eyeHeight(p),z:p.z},d=aim(p);let nearest=range,hit=null;
  for(const b of blocks)nearest=Math.min(nearest,rayBox(o,d,b,range));
  for(const other of state.players){if(other===p||!other.alive||!other.connected||other.invincible>state.elapsed)continue;const distance=rayBox(o,d,{...other,...dimensions(other)},range);if(distance<nearest){nearest=distance;hit=other;}}
  const event={id:id+':'+a.seq,from:id,x:p.x,z:p.z,hit:null,knife};
  if(hit){if(game==='shoot'&&hit.team===p.team){}else if(hiding&&hit.role==='seeker'){}else{hit.hp-=game==='shoot'?25:100;event.hit=hit.id;if(hit.hp<=0)eliminate(hit,p);if(game==='murder'&&p.role==='armed'&&hit.role!=='murderer')eliminate(p,p);}}
  else if(hiding&&p.role==='seeker'){p.hp-=5;if(p.hp<=0)eliminate(p,p);}
  state.events.push(event);if(state.events.length>12)state.events.shift();endCheck();return true;
 }
 function tick(dt){if(state.finished||!Number.isFinite(dt)||dt<=0)return;state.elapsed+=Math.min(dt,30);const moveDt=Math.min(dt,.1);
  if(state.phase==='prepare'&&state.elapsed>=state.until){state.phase='play';state.until=state.elapsed+120;}
  for(const p of state.players){if(!p.connected)continue;if(p.reloadAt&&state.elapsed>=p.reloadAt){p.ammo=12;p.reloadAt=0;}if(game==='shoot'&&!p.alive&&state.elapsed>=p.respawnAt){const i=state.players.indexOf(p),pos=world.spawns[i];p.x=pos[0];p.z=pos[1];p.alive=true;p.hp=100;p.ammo=12;p.reloadAt=0;p.invincible=state.elapsed+1.5;}if(!p.alive||p.frozen||state.phase==='prepare'&&p.role==='seeker')continue;const speed=game==='shoot'?4.8:p.prop?3:3.8;moveBody(p,p.input.x*speed*moveDt,p.input.z*speed*moveDt,bodyRadius(p),world);}
  if(state.elapsed>=state.until&&state.phase==='play'){if(game==='shoot')finish(state.score[0]===state.score[1]?'Égalité':state.score[0]>state.score[1]?'Équipe bleue gagnante':'Équipe rose gagnante','Temps écoulé.');else finish(game==='murder'?'Les innocents gagnent':'Les cachés gagnent','Temps écoulé.');}endCheck();
 }
 function remove(id){const p=player(id);if(p){p.connected=false;eliminate(p);endCheck();}}
 function snapshot(id){const mine=player(id);return {game,size,phase:state.phase,remaining:Math.max(0,state.until-state.elapsed),score:[...state.score],target:state.target,finished:state.finished,winner:state.winner,reason:state.reason,gun:state.gun,events:state.events.slice(-6),selfRole:mine?.role,players:state.players.filter(p=>!(state.phase==='prepare'&&mine?.role==='seeker'&&p.role==='hider')).map(p=>({id:p.id,name:p.name,x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,hp:p.hp,alive:p.alive,connected:p.connected,kills:p.kills,deaths:p.deaths,team:game==='shoot'?p.team:null,role:state.finished||p.id===id?p.role:null,weapon:p.drawn?(p.role==='murderer'?'knife':['armed','seeker','fighter'].includes(p.role)?'gun':null):null,colors:[...p.colors],prop:p.prop,propColor:p.propColor,frozen:p.frozen,ammo:p.id===id?p.ammo:null,reloading:p.id===id&&!!p.reloadAt,respawn:p.id===id&&!p.alive&&game==='shoot'?Math.max(0,p.respawnAt-state.elapsed):0}))};}
 return {state,input,action,tick,remove,snapshot,finish};
}
