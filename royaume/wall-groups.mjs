import {GRID_MIN,GRID_MAX,MAX_BUILDINGS,placementError} from './village-state.mjs?v=34';
import {jobFor,queuedWallFor} from './builders.mjs?v=34';

export function connectedWalls(village,seeds){
 const walls=village.structures.filter(p=>p.kind==='wall'),byId=new Map(walls.map(p=>[p.id,p])),byCell=new Map(walls.map(p=>[p.x+','+p.z,p])),queue=seeds.filter(id=>byId.has(id)),seen=new Set(queue);
 for(let i=0;i<queue.length;i++){const p=byId.get(queue[i]);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=byCell.get((p.x+dx)+','+(p.z+dz));if(n&&!seen.has(n.id)){seen.add(n.id);queue.push(n.id);}}}
 return [...seen];
}
export function wallBounds(walls){
 if(!walls.length)return {x:0,z:0,w:1,d:1};
 const x=Math.min(...walls.map(p=>p.x)),z=Math.min(...walls.map(p=>p.z));
 return {x,z,w:Math.max(...walls.map(p=>p.x))-x+1,d:Math.max(...walls.map(p=>p.z))-z+1};
}
export function wallMovePlan(state,{ids,x,z,rotation=0}){
 const empty=error=>({cells:[],error});
 if(!Array.isArray(ids)||!ids.length||ids.length>MAX_BUILDINGS||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'))return empty('Sélectionnez au moins un rempart.');
 if(!Number.isInteger(x)||!Number.isInteger(z)||!Number.isInteger(rotation)||rotation<0||rotation>3)return empty('Déplacement invalide.');
 const chosen=new Set(ids),walls=state.village.structures.filter(p=>chosen.has(p.id));
 if(walls.length!==ids.length||walls.some(p=>p.kind!=='wall'))return empty('Un rempart de la sélection est introuvable.');
 const origin=wallBounds(walls),rotated=walls.map(p=>{let dx=p.x-origin.x,dz=p.z-origin.z;for(let i=0;i<rotation;i++)[dx,dz]=[-dz,dx];return {...p,x:dx,z:dz,rotation:(p.rotation+rotation)%4};}),bounds=wallBounds(rotated);
 const cells=rotated.map(p=>({...p,x:x+p.x-bounds.x,z:z+p.z-bounds.z})),freeVillage={...state.village,structures:state.village.structures.filter(p=>!chosen.has(p.id))};
 let error=state.siege?.phase==='active'?'Terminez la défense avant de déplacer les remparts.':walls.some(p=>p.pending||jobFor(state,p.id)||queuedWallFor(state,p.id))?'Un rempart sélectionné est en travaux ou en attente.':null;
 for(const p of cells){if(error)break;error=placementError(freeVillage,'wall',p.x,p.z,p.rotation);}
 // Bounds are validated for the entire group before any original wall moves.
 if(!error&&cells.some(p=>p.x<GRID_MIN||p.z<GRID_MIN||p.x>=GRID_MAX||p.z>=GRID_MAX))error='Restez dans la zone constructible.';
 return {cells,error,w:bounds.w,d:bounds.d,count:cells.length};
}
