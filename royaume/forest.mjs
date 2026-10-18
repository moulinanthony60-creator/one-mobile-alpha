// Stable scenery IDs: trees are obstacles until a worker finishes clearing them.
function random(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
const rand=random(981),layout=[];
for(let x=-60;x<=60;x+=2.8)for(let z=-60;z<=60;z+=2.8){
 const a=x+(rand()-.5)*1.6,b=z+(rand()-.5)*1.6,edge=Math.max(Math.abs(a),Math.abs(b)),r=Math.hypot(a,b);
 const border=edge>42,grove=r>18&&r<34&&rand()<(.28+.16*Math.sin(a*.24+b*.18))||r>=34&&rand()<.10;
 if((!border&&!grove)||rand()<.08)continue;
 layout.push({id:'forest-'+layout.length,x:a,z:b,kind:rand()<.77?'spruce':'oak',span:2.8+rand()*1.3,variant:rand()});
}
export const FOREST_TREES=layout.filter(o=>(o.x>-42||o.x< -49)&&o.x<60).map(o=>{const r=.75+o.span*.12;return Object.freeze({...o,clearable:o.x+r> -40.5&&o.x-r<40.5&&o.z+r> -40.5&&o.z-r<40.5});});
export const FOREST_DECOR=Array.from({length:200},()=>({x:(rand()-.5)*106,z:(rand()-.5)*106,kind:rand()<.78?'garden':'rocks',span:.7+rand()*1.4,variant:rand()}));
const byId=new Map(FOREST_TREES.map(t=>[t.id,t])),cache=new WeakMap();
export function forestTrees(village){
 if(!village.forest)return [];
 const removed=village.forest.removed,old=cache.get(village);if(old?.removed===removed)return old.trees;
 const gone=new Set(removed),trees=FOREST_TREES.filter(t=>!gone.has(t.id));cache.set(village,{removed,trees});return trees;
}
export const treeById=(village,id)=>forestTrees(village).find(t=>t.id===id)||null;
export function treeDetails(t,village=null){const spec=t.kind==='oak'?{name:'Chêne',gold:40,wood:90,seconds:30}:{name:'Sapins',gold:25,wood:60,seconds:20},castle=village?.structures.find(p=>p.kind==='castle');if(castle)spec.seconds+=Math.ceil((Math.abs(t.x-castle.x-1.5)+Math.abs(t.z-castle.z-1.5))/.42);return spec;}
export const treeRadius=t=>.75+t.span*.12;
export function treeOverlaps(t,{x,z,w,d}){const r=treeRadius(t);return t.x+r>x-.5&&t.x-r<x+w-.5&&t.z+r>z-.5&&t.z-r<z+d-.5;}
export function restoreForest(village,raw,rects,roads=[]){
 const present=raw?.version===1,removed=new Set(present&&Array.isArray(raw.removed)?raw.removed.filter(id=>byId.has(id)):[]);
 // Migration keeps previously visible clearings and never moves existing buildings.
 for(const t of FOREST_TREES)if(rects.some(p=>present?treeOverlaps(t,p):t.x>p.x-2.6&&t.x<p.x+p.w+2.6&&t.z>p.z-2.6&&t.z<p.z+p.d+2.6)||!present&&roads.some(p=>Math.abs(t.x-p.x)<1.3&&Math.abs(t.z-p.z)<1.3))removed.add(t.id);
 village.forest={version:1,removed:[...removed]};return village;
}
export function clearTree(village,id){if(!treeById(village,id))return false;village.forest.removed=[...village.forest.removed,id];return true;}
