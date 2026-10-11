// The round UUID is shared before launch and changes on Replay. Geometry must
// never depend on local time, device settings or each client's random source.
function randomFor(key){
 let seed=2166136261;for(let i=0;i<key.length;i++)seed=Math.imul(seed^key.charCodeAt(i),16777619);
 return ()=>{let t=seed=(seed+0x6D2B79F5)|0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const overlaps=(a,b,gap)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;
const rounded=n=>Math.round(n*100)/100;
export function roundLayout(base,types,game,round){
 const rand=randomFor(game+':'+round),props=[],occupied=[],jumpRoutes=[];
 const spawnAreas=[...base.spawns,base.seekerSpawn].map(([x,z])=>({x,z,w:3.6,d:3.6}));
 const fits=(p,extra=[])=>Math.abs(p.x)+p.w/2<base.width/2-1.5&&Math.abs(p.z)+p.d/2<base.depth/2-1.5&&
  !base.walls.some(w=>overlaps(p,w,1.15))&&!spawnAreas.some(s=>overlaps(p,s,.5))&&
  !occupied.some(o=>overlaps(p,o,1.25))&&!extra.some(o=>overlaps(p,o,.9));
 const object=(type,x,z)=>({type,x:rounded(x),z:rounded(z),c:Math.floor(rand()*6),...types[type]});
 const add=p=>{const value={id:'round-p'+props.length,type:p.type,x:p.x,z:p.z,c:p.c};props.push(value);occupied.push(p);return value.id;};
 // Every sector has a climbable sequence. Short, clear gaps allow a transformed
 // prop as well as a character to jump from a stool to a table and a shelf.
 for(let sector=0;sector<8;sector++){
  const cx=-30+(sector%4)*20,cz=sector<4?-15:15;
  let placed=false;
  for(let attempt=0;attempt<1200&&!placed;attempt++){
   const x=cx+(rand()-.5)*12,z=cz+(rand()-.5)*13,sign=rand()<.5?-1:1,group=[];
   for(const [type,offset]of [['stool',0],['table',1.825],['shelf',3.835]]){
    const p=object(type,x,z+sign*offset);if(!fits(p,group))break;group.push(p);
   }
   if(group.length===3){jumpRoutes.push(group.map(add));placed=true;}
  }
  if(!placed)throw Error('Le parcours de meubles n’a pas pu être préparé.');
 }
 const pool=game==='paint'?['easel','easel','easel','easel','paintpot','paintpot','paintpot','paintpot','paintpot','sculpture','sculpture','sculpture','bench','bench','bench','plant','plant','plant','plant','crate','crate','crate','stool','stool','table','table','shelf','shelf','lamp','lamp','sofa','fountain']:['crate','barrel','shelf','table','chair','stool','lamp','plant','sofa','trolley','cone','arcade','bench'];
 const count=game==='paint'?220:240;
 // Shuffle a balanced set of types for every batch, independently of sectors:
 // this avoids putting the same kind of furniture in one corner every round.
 let bag=[];
 for(let i=props.length;i<count;i++){
  if(!bag.length){bag=[...pool];for(let j=bag.length-1;j>0;j--){const k=Math.floor(rand()*(j+1));[bag[j],bag[k]]=[bag[k],bag[j]];}}
  const type=bag.pop(),sector=i%12,cx=-30+(sector%4)*20,cz=-20+Math.floor(sector/4)*20;
  let chosen=null;
  for(let attempt=0;attempt<1800&&!chosen;attempt++){
   // Fill the whole map evenly, then widen the search if a sector is crowded.
   const x=attempt<700?cx+(rand()-.5)*18:(rand()-.5)*(base.width-5);
   const z=attempt<700?cz+(rand()-.5)*18:(rand()-.5)*(base.depth-5);
   const p=object(type,x,z);if(fits(p))chosen=p;
  }
  if(!chosen){
   for(let z=-base.depth/2+2;z<base.depth/2-2&&!chosen;z+=1.25)for(let x=-base.width/2+2;x<base.width/2-2&&!chosen;x+=1.25){const p=object(type,x,z);if(fits(p))chosen=p;}
  }
  if(!chosen)throw Error('La disposition des meubles n’a pas pu être préparée.');
  add(chosen);
 }
 return Object.freeze({...base,layoutSeed:round,props:Object.freeze(props.map(Object.freeze)),jumpRoutes:Object.freeze(jumpRoutes.map(Object.freeze))});
}
