import {paintPropBlocks} from './one-arcade-r209-surfaces.js';
import {roundLayout} from './one-arcade-r208-layout.js';
// Shared geometry and host-authoritative rules. No DOM or transport dependency.
export const GAMES=Object.freeze([
 {id:'paint',name:'Cache-cache peinture',min:2,max:8,icon:'◒',color:'#ad70ed',description:'Trouve une cachette, puis peins ton personnage sur place pour te fondre dans le décor.'},
 {id:'murder',name:'Murder',min:3,max:8,icon:'◇',color:'#e46c85',description:'Un tueur caché, un innocent armé. Observe, bluffe et survis.'},
 {id:'shoot',name:'Tir en équipes',min:2,max:8,icon:'◎',color:'#56b9ed',description:'Une arène, deux équipes : 1 contre 1 à 4 contre 4.'},
 {id:'prop',name:'Prop Hunt',min:2,max:8,icon:'▣',color:'#62c6a0',description:'Deviens un objet du décor et échappe aux chasseurs.'}
]);
export const PAINT_SHOT_COLORS=['#ae62f2','#2ddac2','#ffb446'];
export function validPaintShot(p){return !!p&&[p.from,p.to].every(a=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isFinite(n)&&Math.abs(n)<=100))&&Math.hypot(...p.to.map((n,i)=>n-p.from[i]))<=45.01&&PAINT_SHOT_COLORS.includes(p.color)&&typeof p.surface==='boolean';}
export const COLORS=['#d8c5ac','#517f70','#c67d60','#526e9a','#ab8eba','#555967'];
export const PROP_TYPES={crate:{name:'Caisse',w:.9,h:.9,d:.9,icon:'▣'},chair:{name:'Chaise',w:.65,h:1.05,d:.65,icon:'♧'},plant:{name:'Plante',w:.7,h:1.35,d:.7,icon:'♣'},lamp:{name:'Lampe',w:.45,h:1.55,d:.45,icon:'♙'},barrel:{name:'Tonneau',w:.7,h:1.0,d:.7,icon:'◉'}};
Object.assign(PROP_TYPES,{
 table:{name:'Table',w:1.8,h:1,d:1.1},bench:{name:'Banc',w:1.8,h:1.15,d:.72},sofa:{name:'Canapé',w:2.1,h:1.15,d:1.05},shelf:{name:'Étagère',w:1.6,h:2.3,d:.72},easel:{name:'Chevalet',w:.95,h:1.9,d:.8},stool:{name:'Tabouret',w:.55,h:.7,d:.55},paintpot:{name:'Pot de peinture',w:.42,h:.52,d:.42},cone:{name:'Plot',w:.55,h:.85,d:.55},trolley:{name:'Chariot',w:1.15,h:1.2,d:.85},sculpture:{name:'Sculpture',w:.9,h:1.9,d:.9},fountain:{name:'Fontaine',w:2.5,h:1.7,d:2.5},arcade:{name:"Borne d’arcade",w:.85,h:1.8,d:.85}
});
export const WORLD={width:28,depth:22,walls:[
 {x:-14,z:0,w:.3,d:22,h:3.6,c:0},{x:14,z:0,w:.3,d:22,h:3.6,c:3},{x:0,z:-11,w:28,d:.3,h:3.6,c:1},{x:0,z:11,w:28,d:.3,h:3.6,c:2},
 {x:-7,z:-6,w:.28,d:6,h:3.2,c:1},{x:-7,z:6,w:.28,d:6,h:3.2,c:2},{x:7,z:-6,w:.28,d:6,h:3.2,c:3},{x:7,z:6,w:.28,d:6,h:3.2,c:4},
 {x:-3.5,z:-3,w:3,d:.4,h:1.2,c:0},{x:3.5,z:3,w:3,d:.4,h:1.2,c:5},{x:0,z:-7,w:2,d:1.4,h:1.2,c:3},{x:0,z:7,w:2,d:1.4,h:1.2,c:2}
],props:[
 ['crate',-11,-8],['crate',-10,-8],['plant',-12,0],['chair',-10,5],['lamp',-12,8],['barrel',-4,-8],['chair',-4,0],['plant',-5,8],
 ['lamp',4,-8],['barrel',4,0],['crate',5,8],['chair',11,-8],['plant',12,-4],['barrel',10,0],['chair',10,5],['crate',12,8]
].map(([type,x,z],i)=>({id:'p'+i,type,x,z,c:i%COLORS.length})),spawns:[[-11,2],[11,-2],[-11,-2],[11,2],[-11,0],[11,0],[-11,4],[11,-4]]};
const boundary=(w,d,c=0)=>[{x:-w/2,z:0,w:.35,d,h:4.2,c},{x:w/2,z:0,w:.35,d,h:4.2,c},{x:0,z:-d/2,w,d:.35,h:4.2,c},{x:0,z:d/2,w,d:.35,h:4.2,c}];
const wall=(x,z,w,d,h,c)=>({x,z,w,d,h,c});
const objects=rows=>rows.map(([type,x,z,c],i)=>({id:'p'+i,type,x,z,c:c??i%COLORS.length}));
const galleryProps=[];
for(const side of [-1,1])for(const z of [-12,-6,2,8])galleryProps.push(['crate',side*19,z],['paintpot',side*18,z-1.1],['stool',side*20.3,z+.9]);
for(const x of [-13,13])for(const z of [-12,12])galleryProps.push(['easel',x,z],['paintpot',x+1.4,z],['bench',x,z>0?z-3:z+3]);
for(const x of [-4,4])for(const z of [-12,-6,6,12])galleryProps.push(['sculpture',x,z],['plant',x+(x<0?-1.6:1.6),z]);
galleryProps.push(['fountain',0,0,3],['plant',-10,0,1],['plant',10,0,4],['bench',0,-9,1],['bench',0,9,4]);
const depotProps=[];
for(const side of [-1,1])for(const z of [-12,-6,2,8])depotProps.push(['crate',side*19,z],['barrel',side*20.5,z+1.2],['cone',side*18,z-1.2]);
for(const x of [-13,13])for(const z of [-12,-5,5,12])depotProps.push(['shelf',x,z],['trolley',x+(x<0?-2:2),z+1.8]);
for(const x of [-4,4])for(const z of [-11,11])depotProps.push(['table',x,z],['chair',x,z-1.2],['lamp',x+1.8,z],['plant',x-1.8,z]);
depotProps.push(['sofa',-3,-3,2],['sofa',3,3,3],['bench',3,-3,1],['bench',-3,3,4],['arcade',0,-14,3],['arcade',0,14,4],['barrel',-10,0,2],['crate',10,0,0]);
const spawns=[[-17,-10],[17,-10],[-17,-4],[17,-4],[-17,4],[17,4],[-17,10],[17,10]];
export const WORLDS={
 paint:{width:44,depth:34,name:'Les ateliers Chromatiques',floor:'#d6c6ad',sky:'#c4d8db',surface:'tile',spawns,seekerSpawn:[0,15],prepare:55,hunt:160,walls:[...boundary(44,34,0),wall(-7,-11,.4,10,3.4,1),wall(-7,11,.4,10,3.4,2),wall(7,-11,.4,10,3.4,3),wall(7,11,.4,10,3.4,4),wall(-14,-5,6,.4,2.3,1),wall(14,5,6,.4,2.3,4)],props:objects(galleryProps),zones:[[-14,-10,13,12,1],[-14,10,13,12,2],[14,-10,13,12,3],[14,10,13,12,4]],labels:['ATELIERS / JARDIN','COULEURS / SCULPTURES']},
 prop:{width:44,depth:34,name:'La brocante des objets perdus',floor:'#bbb6a8',sky:'#bfd0d7',surface:'concrete',spawns,seekerSpawn:[0,15],prepare:55,hunt:160,walls:[...boundary(44,34,0),wall(-7,-11,.45,10,3.6,1),wall(-7,11,.45,10,3.6,1),wall(7,-11,.45,10,3.6,2),wall(7,11,.45,10,3.6,2),wall(0,-7,4,.5,2.2,5),wall(0,7,4,.5,2.2,5)],props:objects(depotProps),zones:[[-14,0,12,32,1],[14,0,12,32,2]],labels:['MOBILIER / RÉSERVE','OBJETS / ATELIER']},
 shoot:{width:40,depth:30,name:'Traverse · quartier industriel',floor:'#a5adb3',sky:'#a8c8d8',surface:'concrete',spawns:[[-16,-8],[16,8],[-16,-3],[16,3],[-16,3],[16,-3],[-16,8],[16,-8]],walls:[...boundary(40,30,5),wall(-8,-9,.6,7,3.3,1),wall(8,9,.6,7,3.3,2),wall(-8,7,1.7,4,2.2,1),wall(8,-7,1.7,4,2.2,2),wall(0,-10,4,1.5,1.5,5),wall(0,10,4,1.5,1.5,5),wall(0,0,3,.7,2.6,5)],props:objects([['crate',-13,-12],['barrel',-12,-12],['crate',13,12],['barrel',12,12],['crate',-3,-4],['barrel',-4,-4],['crate',3,4],['barrel',4,4],['cone',-10,0],['cone',10,0],['crate',-4,8],['crate',4,-8],['trolley',-18,11],['trolley',18,-11],['barrel',-2,13],['barrel',2,-13],['crate',-18,-12],['crate',18,12]]),zones:[[-16,0,6,28,3],[16,0,6,28,4]],labels:['BASE BLEUE','BASE ROSE']},
 murder:{width:40,depth:32,name:'Villa Minuit · les salons',floor:'#b08c64',sky:'#7f91a8',surface:'wood',spawns:[[-16,-10],[16,-10],[-16,-3],[16,-3],[-16,3],[16,3],[-16,10],[16,10]],walls:[...boundary(40,32,5),wall(-6,-11,.45,9,3.7,1),wall(-6,11,.45,9,3.7,2),wall(6,-11,.45,9,3.7,3),wall(6,11,.45,9,3.7,4),wall(-14,-5,6,.4,3.2,1),wall(14,5,6,.4,3.2,4)],props:objects([['sofa',-13,-12],['table',-13,-9],['lamp',-16,-12],['shelf',-9,-13],['plant',-18,-13],['sofa',13,12],['table',13,9],['lamp',16,12],['shelf',9,13],['plant',18,13],['table',-13,9],['chair',-13,7.6],['chair',-13,10.4],['arcade',-9,13],['plant',-18,13],['shelf',13,-12],['chair',13,-8],['lamp',16,-12],['plant',18,-13],['bench',0,-10],['bench',0,10],['sculpture',-3,0],['sculpture',3,0],['plant',-9,0],['plant',9,0],['shelf',-3,-13],['shelf',3,13],['stool',10,-8],['stool',-10,8]]),zones:[[-13,-10,12,9,1],[-13,10,12,9,2],[13,-10,12,9,3],[13,10,12,9,4]],labels:['BIBLIOTHÈQUE / SALON','ATELIER / VESTIBULE']}
};
// Two outer galleries add hiding routes without closing the central paths.
{
 const m=WORLDS.paint;m.width=64;m.depth=48;m.name='Les ateliers Chromatiques · Grande galerie';
 m.walls.splice(0,4,...boundary(64,48,0));
 m.spawns=[[-28,-19],[28,-19],[-28,-7],[28,-7],[-28,7],[28,7],[-28,19],[28,19]];
 m.seekerSpawn=[0,21];m.hunt=190;
 for(const s of [-1,1])for(const z of [-14,14])m.walls.push(wall(s*24,z,.4,12,4.2,s<0?1:3));
 for(const s of [-1,1])for(const z of [-20,-12,-4,4,12,20]){
  const rows=[['shelf',s*30.8,z,Math.abs(z)%6],['paintpot',s*29.6,z-1,2],['stool',s*28.6,z+.9,1],['crate',s*25.8,z+.9,3]];
  for(const [type,x,d,c]of rows)m.props.push({id:'extra'+m.props.length,type,x,z:d,c});
 }
 for(const z of [-21,21])for(const x of [-18,-10,10,18])for(const [type,dx,dz,c]of [['easel',0,0,4],['paintpot',1.3,0,2],['bench',0,z<0?2:-2,1],['plant',-1.7,0,1]])m.props.push({id:'extra'+m.props.length,type,x:x+dx,z:z+dz,c});
 m.zones.push([-28,-13,7,19,1],[-28,13,7,19,2],[28,-13,7,19,3],[28,13,7,19,4],[0,-21,38,5,5],[0,21,38,5,0]);
}
{
 const m=WORLDS.prop;m.width=64;m.depth=48;m.name='La grande brocante · Dépôts et ateliers';m.walls.splice(0,4,...boundary(64,48,0));
 m.spawns=[[-28,-18],[28,-18],[-28,-6],[28,-6],[-28,6],[28,6],[-28,18],[28,18]];m.seekerSpawn=[0,21];m.hunt=190;
 for(const side of [-1,1])for(const z of [-16,0,16]){
  // Low-to-high furniture forms reachable jumping routes.
  for(const [type,dx,dz,c]of [['stool',0,0,0],['table',1.5,0,1],['shelf',3.5,0,2],['crate',1.5,2,3],['barrel',4,2,4],['lamp',4.6,-1.8,5],['plant',-1.4,-1.4,1]])m.props.push({id:'prop-extra'+m.props.length,type,x:side*(25+dx),z:z+dz,c});
 }
 for(const z of [-21,21])for(const x of [-18,-9,9,18])for(const [type,dx,dz,c]of [['sofa',0,0,2],['stool',-1.6,0,0],['table',0,z<0?1.8:-1.8,1],['trolley',2.2,0,3],['cone',3.3,0,4]])m.props.push({id:'prop-extra'+m.props.length,type,x:x+dx,z:z+dz,c});
 m.zones.push([-27,0,9,45,2],[27,0,9,45,3],[0,-21,38,5,0],[0,21,38,5,4]);
}

// Larger galleries retain the familiar interior walls and their climb anchors.
for(const game of ['paint','prop']){
 const m=WORLDS[game];m.width=80;m.depth=60;m.walls.splice(0,4,...boundary(80,60,0));
 m.spawns=[[-35,-24],[35,-24],[-35,-8],[35,-8],[-35,8],[35,8],[-35,24],[35,24]];m.seekerSpawn=[0,27];
 m.zones.push([-36,0,7,56,1],[36,0,7,56,3],[0,-26,62,6,2],[0,26,62,6,4]);
}
WORLDS.paint.paintDetails=true;
const roundWorlds=new Map();
const worldBlocks=new WeakMap();
export function worldFor(game,round='preview'){
 const base=WORLDS[game]||WORLD;if(game!=='paint'&&game!=='prop')return base;
 const key=game+':'+round;if(!roundWorlds.has(key)){const world=roundLayout(base,PROP_TYPES,game,round);roundWorlds.set(key,world);if(roundWorlds.size>12)roundWorlds.delete(roundWorlds.keys().next().value);}return roundWorlds.get(key);
}
export function blocksFor(world=WORLD){if(!worldBlocks.has(world))worldBlocks.set(world,[...world.walls,...world.props.flatMap(p=>world.paintDetails?paintPropBlocks(p,PROP_TYPES[p.type]):[{...p,...PROP_TYPES[p.type]}])]);return worldBlocks.get(world);}
export const avatarScale=(game,role)=>game==='paint'?(role==='seeker'?1:.35):game==='prop'?.76:1;
export function bodyRadius(p){if(p.paintPose)return paintRadius(p);return p.prop?Math.max(PROP_TYPES[p.prop].w,PROP_TYPES[p.prop].d)/2+.02:.3*(p.scale||1);}
export function freePosition(x,z,r=.3,world=WORLD){return Math.abs(x)<world.width/2-.2-r&&Math.abs(z)<world.depth/2-.2-r&&!blocksFor(world).some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}

// The six painted body pieces define both the displayed pose and shot volumes.
export const PAINT_POSES={stand:'Debout',crouch:'Accroupi',prone:'Allongé',spread:'Écarté'};
export const PAINT_CEILING=4.2;
const ident=[1,0,0,0,1,0,0,0,1];
const rotX=a=>[1,0,0,0,Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a)];
const rotY=a=>[Math.cos(a),0,Math.sin(a),0,1,0,-Math.sin(a),0,Math.cos(a)];
const rotZ=a=>[Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a),0,0,0,1];
const vector=(r,v)=>[0,1,2].map(i=>r[i*3]*v[0]+r[i*3+1]*v[1]+r[i*3+2]*v[2]);
const multiply=(a,b)=>Array.from({length:9},(_,i)=>{const y=Math.floor(i/3),x=i%3;return a[y*3]*b[x]+a[y*3+1]*b[x+3]+a[y*3+2]*b[x+6];});
export function paintModel(p){
 const pose=p.paintPose||'stand',part=(size,position,rotation=ident)=>({size,position,rotation});
 const pieces=[part([.43,.43,.4],[0,1.54,0]),part([.48,.62,.3],[0,.99,0]),part([.13,.55,.2],[-.30,1,0]),part([.13,.55,.2],[.30,1,0]),part([.2,.64,.27],[-.13,.34,0]),part([.2,.64,.27],[.13,.34,0])];
 if(pose==='crouch'){
  pieces[0].position=[0,.98,-.06];pieces[1].position=[0,.64,.03];pieces[1].rotation=rotX(-.16);
  for(const [i,s]of [[2,-1],[3,1]]){pieces[i].position=[s*.30,.57,-.14];pieces[i].rotation=rotX(-.65);}
  for(const [i,s]of [[4,-1],[5,1]]){pieces[i].position=[s*.15,.22,.02];pieces[i].rotation=rotX(1.05);}
 }else if(pose==='spread'){
  for(const [i,s]of [[2,-1],[3,1]]){pieces[i].position=[s*.46,1.13,0];pieces[i].rotation=rotZ(s*-.95);}
  for(const [i,s]of [[4,-1],[5,1]]){pieces[i].position=[s*.23,.33,0];pieces[i].rotation=rotZ(s*.34);}
 }
 if(pose==='prone'||p.anchor?.kind==='ceiling'){for(const piece of pieces){piece.position=vector(rotX(-Math.PI/2),piece.position).map((n,i)=>n+[0,.235,.86][i]);piece.rotation=multiply(rotX(-Math.PI/2),piece.rotation);}const bottom=Math.min(...pieces.map(piece=>piece.position[1]-piece.size.reduce((sum,n,j)=>sum+Math.abs(piece.rotation[3+j])*n/2,0)));for(const piece of pieces)piece.position[1]+=.025-bottom;}
 if(p.anchor?.kind==='ceiling')for(const piece of pieces){piece.position=vector(rotX(Math.PI),piece.position);piece.rotation=multiply(rotX(Math.PI),piece.rotation);}
 return pieces;
}
export function paintYaw(p){return paintSideAttached(p)?Math.atan2(p.anchor.nx,p.anchor.nz):p.frozen||p.anchor?.kind==='prop-top'?(p.facing||0):(p.yaw||0);}
// Compress against the supporting surface, never shrink the seeker's body.
export function paintCompression(p){
 if(!p.paintPose||!(p.scale>0&&p.scale<.6))return [1,1,1];
 if(paintSideAttached(p))return [1,1,.06];
 if(p.anchor?.kind==='ceiling')return [1,.06,1];
 return [1,1,1];
}
export function paintParts(p){const scale=p.scale||.35,r=rotY(paintYaw(p)),s=paintCompression(p);return paintModel(p).map(piece=>({size:piece.size.map(n=>n*scale),position:vector(r,piece.position.map((n,i)=>n*scale*s[i])).map((n,i)=>n+[p.x||0,p.y||0,p.z||0][i]),rotation:multiply(r,piece.rotation.map((n,i)=>n*s[Math.floor(i/3)]))}));}
export function paintBounds(p){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const part of paintParts(p))for(let axis=0;axis<3;axis++){const extent=part.size.reduce((sum,n,j)=>sum+Math.abs(part.rotation[axis*3+j])*n/2,0);min[axis]=Math.min(min[axis],part.position[axis]-extent);max[axis]=Math.max(max[axis],part.position[axis]+extent);}return {min,max,w:max[0]-min[0],h:max[1]-min[1],d:max[2]-min[2]};}
export function paintRadius(p){const model=paintBounds({...p,x:0,y:0,z:0,yaw:0,frozen:false,anchor:p.anchor?.kind==='ceiling'?{kind:'ceiling'}:null});return Math.hypot(Math.max(Math.abs(model.min[0]),Math.abs(model.max[0])),Math.max(Math.abs(model.min[2]),Math.abs(model.max[2])))+.015;}
export function paintEye(p){const h=paintParts(p)[0];return {x:h.position[0],y:h.position[1]+.02*(p.anchor?.kind==='ceiling'?-1:1),z:h.position[2]};}
// Invert the full affine transform: a flattened limb is no longer an
// orthonormal box. Keep the ray unnormalised so t stays a world distance.
function inverseMatrix(m){const [a,b,c,d,e,f,g,h,i]=m,A=e*i-f*h,B=c*h-b*i,C=b*f-c*e,D=f*g-d*i,E=a*i-c*g,F=c*d-a*f,G=d*h-e*g,H=b*g-a*h,I=a*e-b*d,det=a*A+b*D+c*G;return [A,B,C,D,E,F,G,H,I].map(n=>n/det);}
export function paintRayHit(o,d,p,range=45){let hit=Infinity;for(const part of paintParts(p)){const r=part.rotation,inv=inverseMatrix(r),v=vector(inv,[o.x-part.position[0],o.y-part.position[1],o.z-part.position[2]]),dir=vector(inv,[d.x,d.y,d.z]);hit=Math.min(hit,rayBox({x:v[0],y:v[1]+part.size[1]/2,z:v[2]},{x:dir[0],y:dir[1],z:dir[2]},{x:0,z:0,w:part.size[0],h:part.size[1],d:part.size[2]},range));}return hit;}
export const paintSideAttached=p=>['wall','prop'].includes(p.anchor?.kind);
const topOf=b=>(b.y||0)+b.h;
const onFootprint=(p,b)=>{const r=paintBounds(p);return r.min[0]<b.x+b.w/2&&r.max[0]>b.x-b.w/2&&r.min[2]<b.z+b.d/2&&r.max[2]>b.z-b.d/2;};
function insideTop(p,b){const r=paintBounds(p);return r.min[0]>=b.x-b.w/2+.008&&r.max[0]<=b.x+b.w/2-.008&&r.min[2]>=b.z-b.d/2+.008&&r.max[2]<=b.z+b.d/2-.008;}
function anchorBox(a,world){if(a.kind==='wall')return world.walls[a.wall];const p=world.props.find(o=>o.id===a.prop);return p?{...p,...PROP_TYPES[p.type]}:null;}
export function paintFits(p,world=worldFor('paint'),ignore=-1){const b=paintBounds(p),edge=paintCompression(p).some(n=>n<1)?.17:.2;if(b.min[0]<-world.width/2+edge||b.max[0]>world.width/2-edge||b.min[2]<-world.depth/2+edge||b.max[2]>world.depth/2-edge||b.min[1]<-.025||b.max[1]>PAINT_CEILING-.005)return false;return !blocksFor(world).some((o,i)=>i!==ignore&&b.min[0]<o.x+o.w/2&&b.max[0]>o.x-o.w/2&&b.min[2]<o.z+o.d/2&&b.max[2]>o.z-o.d/2&&b.min[1]<topOf(o)&&b.max[1]>(o.y||0));}
function wallPosition(p,a,world){const w=anchorBox(a,world);if(!w)return null;const n=a.nx?'x':'z',extent=a.nx?w.w:w.d,normal=a.nx||a.nz,b=paintBounds({...p,x:0,y:0,z:0,anchor:a}),depth=Math.max(Math.abs(b.min[a.nx?0:2]),Math.abs(b.max[a.nx?0:2]));return {...p,anchor:a,[n]:w[n]+normal*(extent/2+depth+(a.kind==='wall'?.018:.006))};}
function propTop(p,id,world){
 const candidates=blocksFor(world).map((b,block)=>({b,block})).filter(({b})=>b.prop===id&&b.w>.22&&b.d>.22).sort((a,b)=>topOf(b.b)-topOf(a.b));
 for(const {b,block}of candidates)for(const pose of ['prone','crouch','stand']){
  const next={...p,anchor:{kind:'prop-top',prop:id,block},paintPose:pose,facing:paintYaw(p),x:b.x,z:b.z,y:topOf(b)+.006,grounded:false,velocity:0};
  const bounds=paintBounds(next);next.x+=b.x-(bounds.min[0]+bounds.max[0])/2;next.z+=b.z-(bounds.min[2]+bounds.max[2])/2;
  if(insideTop(next,b)&&paintFits(next,world))return next;
 }return null;
}
export function nearbyPaintWall(p,world=worldFor('paint')){
 if(p.anchor||p.falling)return null;let best=null,range=1.1;
 const surfaces=[...world.walls.map((w,wall)=>({w,a:{kind:'wall',wall}})),...world.props.map(o=>({w:{...o,...PROP_TYPES[o.type]},a:{kind:'prop',prop:o.id}}))];
 for(const {w,a}of surfaces)for(const [nx,nz]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const anchor={...a,nx,nz},next=wallPosition(p,anchor,world),shape=paintBounds({...p,x:0,y:0,z:0,anchor}),margin=(nx?shape.d:shape.w)/2+.015;
  const d=Math.hypot(p.x-next.x,p.z-next.z),along=nx?Math.abs(p.z-w.z)<w.d/2-margin:Math.abs(p.x-w.x)<w.w/2-margin;
  if((p.x-w.x)*nx+(p.z-w.z)*nz<(nx?w.w:w.d)/2||!along||d>range||p.y>w.h||!paintFits(next,world))continue;
  if(a.kind==='prop'&&!propTop(next,a.prop,world))continue;
  const o=paintEye(p),dest=paintEye(next),length=Math.hypot(dest.x-o.x,dest.y-o.y,dest.z-o.z),direction={x:(dest.x-o.x)/(length||1),y:(dest.y-o.y)/(length||1),z:(dest.z-o.z)/(length||1)};
  if(blocksFor(world).some(b=>rayBox(o,direction,b,length)<length-.02))continue;best=next;range=d;
 }return best;
}
function supportedPaint(p,world){return p.y<=.001||blocksFor(world).some(b=>Math.abs(p.y-topOf(b))<.035&&onFootprint(p,b));}
export function paintDrop(p,world=worldFor('paint')){let next={...p,anchor:null,frozen:false,facing:p.yaw||0};if(paintSideAttached(p)){const r=paintRadius(next);next.x+=p.anchor.nx*(r+.04);next.z+=p.anchor.nz*(r+.04);}if(p.anchor?.kind==='ceiling')next.y=Math.min(next.y,PAINT_CEILING-paintBounds({...next,y:0}).max[1]-.015);if(!paintFits(next,world))return null;next.grounded=supportedPaint(next,world);next.falling=!next.grounded;next.velocity=0;return next;}
export function changePaintPose(p,pose,world=worldFor('paint')){if(!Object.hasOwn(PAINT_POSES,pose)||p.falling)return false;let next={...p,paintPose:pose};if(paintSideAttached(p))next=wallPosition(next,p.anchor,world);if(!paintFits(next,world)||p.anchor?.kind==='prop-top'&&!insideTop(next,blocksFor(world)[p.anchor.block]))return false;Object.assign(p,next);return true;}
export function advancePaintBody(p,input,dt,world=worldFor('paint')){
 const blocks=blocksFor(world),speed=p.paintPose==='prone'?1.2:p.paintPose==='crouch'?2:3.8,steps=Math.max(1,Math.ceil(dt/.012)),slice=dt/steps;
 for(let i=0;i<steps;i++){
  const before=p.y||0,shape=paintBounds({...p,x:0,y:0,z:0});if(!p.grounded)p.velocity=(p.velocity||0)-10*slice;let y=before+(p.velocity||0)*slice;
  if((p.velocity||0)<=0){let top=0;for(const b of blocks)if(before>=topOf(b)-.025&&y<=topOf(b)&&onFootprint(p,b))top=Math.max(top,topOf(b));if(y<=top){y=top;p.velocity=0;p.grounded=true;}}
  else{let ceiling=PAINT_CEILING-.01;for(const b of blocks)if(before+shape.max[1]<=(b.y||0)+.01&&y+shape.max[1]>(b.y||0)&&onFootprint(p,b))ceiling=Math.min(ceiling,(b.y||0)-.006);if(y+shape.max[1]>ceiling){y=ceiling-shape.max[1];p.velocity=0;}}
  p.y=Math.max(0,y);
  if(!p.frozen)for(const [axis,n]of [['x',input.x],['z',input.z]]){const next={...p,[axis]:p[axis]+n*speed*slice};if(paintFits(next,world))p[axis]=next[axis];}
  if(p.grounded&&!supportedPaint(p,world))p.grounded=false;
 }
}
export function advancePaint(p,input,dt,world=worldFor('paint')){
 if(p.falling){p.grounded=false;advancePaintBody(p,{x:0,z:0},dt,world);if(p.grounded)p.falling=false;return;}
 if(p.frozen)return;const a=p.anchor;
 if(paintSideAttached(p)){
  const w=anchorBox(a,world);if(!w)return;const top=a.kind==='prop'?propTop(p,a.prop,world):null,b=paintBounds({...p,y:0}),maxY=Math.max(0,(top?top.y:w.h)-b.max[1]-.03),next={...p,y:clamp((p.y||0)-input.z*1.7*dt,0,maxY)};
  next.x+=a.nz*input.x*1.7*dt;next.z-=a.nx*input.x*1.7*dt;
  const body=paintBounds(next),within=a.nx?body.min[2]>w.z-w.d/2&&body.max[2]<w.z+w.d/2:body.min[0]>w.x-w.w/2&&body.max[0]<w.x+w.w/2;
  if(within&&paintFits(next,world))Object.assign(p,next);
  if(input.z<-.1&&p.y>=maxY-.02){
   if(top)Object.assign(p,top); // The top keeps an anchor until the player releases it.
   else if(w.h<PAINT_CEILING-.08){const ledge={...p,anchor:null,paintPose:'stand',y:w.h+.006,grounded:true,velocity:0};if(a.nx)ledge.x=w.x;else ledge.z=w.z;if(paintFits(ledge,world))Object.assign(p,ledge);}
   else{const roof={...p,anchor:{kind:'ceiling'},paintPose:'prone',y:PAINT_CEILING-.025};const offset=paintRadius(roof)+.06;roof.x=w.x+a.nx*(w.w/2+offset)+(a.nx?0:p.x-w.x);roof.z=w.z+a.nz*(w.d/2+offset)+(a.nz?0:p.z-w.z);if(paintFits(roof,world))Object.assign(p,roof);}
  }
 }else if(a?.kind==='ceiling'||a?.kind==='prop-top'){
  const steps=Math.max(1,Math.ceil(Math.hypot(input.x,input.z)*1.9*dt/.06));for(let i=0;i<steps;i++)for(const [axis,n]of [['x',input.x],['z',input.z]]){const next={...p,[axis]:p[axis]+n*1.9*dt/steps};if(paintFits(next,world)&&(a.kind==='ceiling'||insideTop(next,blocksFor(world)[a.block])))p[axis]=next[axis];}
 }else advancePaintBody(p,input,dt,world);
}
export function validPaintPlayer(p,world=worldFor('paint')){
 const a=p.anchor,normal=a&&[[1,0],[-1,0],[0,1],[0,-1]].some(([x,z])=>x===a.nx&&z===a.nz);
 return Object.hasOwn(PAINT_POSES,p.paintPose)&&Number.isFinite(p.y)&&p.y>=0&&p.y<=PAINT_CEILING&&Number.isFinite(p.facing)&&typeof p.falling==='boolean'&&Number.isFinite(p.velocity)&&typeof p.grounded==='boolean'&&(!a||a.kind==='ceiling'&&Math.abs(p.y-(PAINT_CEILING-.025))<.001||a.kind==='wall'&&normal&&Number.isInteger(a.wall)&&a.wall>=0&&a.wall<world.walls.length||a.kind==='prop'&&normal&&world.props.some(o=>o.id===a.prop)||a.kind==='prop-top'&&Number.isInteger(a.block)&&a.block>=0&&blocksFor(world)[a.block]?.prop===a.prop&&Math.abs(p.y-topOf(blocksFor(world)[a.block])-.006)<.001);
}

export function propFree(x,z,y,r,world=worldFor('prop')){return Math.abs(x)<world.width/2-.2-r&&Math.abs(z)<world.depth/2-.2-r&&!blocksFor(world).some(b=>y<b.h-.012&&Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}
function propSupport(p,b,r){return Math.abs(p.x-b.x)<b.w/2+r*.6&&Math.abs(p.z-b.z)<b.d/2+r*.6;}
export function advanceProp(p,input,dt,world=worldFor('prop')){
 const radius=bodyRadius(p),speed=p.moveSpeed||(p.prop?3:3.8),steps=Math.max(1,Math.ceil(dt/.012)),slice=dt/steps;
 for(let i=0;i<steps;i++){
  const before=p.y||0;if(!p.grounded)p.velocity=(p.velocity||0)-10*slice;let y=before+(p.velocity||0)*slice;
  if((p.velocity||0)<=0){let top=0;for(const b of blocksFor(world))if(before>=b.h-.025&&y<=b.h&&propSupport(p,b,radius))top=Math.max(top,b.h);if(y<=top){y=top;p.velocity=0;p.grounded=true;}}
  if(p.paintPose){const top=paintBounds({...p,y:0}).max[1],limit=PAINT_CEILING-top-.01;if(y>limit){y=limit;p.velocity=Math.min(0,p.velocity||0);}}p.y=Math.max(0,y);
  if(!p.frozen){const dx=input.x*speed*slice,dz=input.z*speed*slice;if(propFree(p.x+dx,p.z,p.y,radius,world))p.x+=dx;if(propFree(p.x,p.z+dz,p.y,radius,world))p.z+=dz;}
  if(p.grounded&&p.y>.001&&!blocksFor(world).some(b=>Math.abs(p.y-b.h)<.03&&propSupport(p,b,radius)))p.grounded=false;
 }
}

export function shootSpawn(players,self,world,randomize,serial=0){
 const candidates=world.spawns.concat([[-16,7],[16,-7],[-9,-12],[9,12],[-2,-12],[2,12],[-16,0],[16,0]]).filter(([x,z])=>freePosition(x,z,.31,world));
 const enemies=players.filter(p=>p.id!==self.id&&p.connected&&p.alive&&p.team!==self.team),friends=players.filter(p=>p.id!==self.id&&p.connected&&p.alive&&p.team===self.team),blocks=blocksFor(world);
 const ranked=candidates.map(([x,z],i)=>{let score=20;for(const p of enemies){const distance=Math.hypot(x-p.x,z-p.z),d={x:(p.x-x)/(distance||1),y:0,z:(p.z-z)/(distance||1)},covered=blocks.some(b=>rayBox({x,y:1.5,z},d,b,distance)<distance);score=Math.min(score,distance+(covered?8:0));}if(friends.some(p=>Math.hypot(x-p.x,z-p.z)<1.2))score-=30;if(Math.hypot(x-(self.lastSpawn?.[0]??999),z-(self.lastSpawn?.[1]??999))<1)score-=10;return {x,z,score,i};}).sort((a,b)=>b.score-a.score);
 const safe=ranked.filter(p=>p.score>=ranked[0].score-3).slice(0,4),pick=safe[(Math.floor(randomize()*safe.length)+serial)%safe.length];return [pick.x,pick.z];
}

export const PAINT_GRID=12,PAINT_CELLS=PAINT_GRID*PAINT_GRID*36,PAINT_COLORS=32;
const paintAlphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function encodeSkin(pixels){
 let rle='',count=0,last=pixels[0];for(const c of pixels){if(c!==last||count===1295){rle+=count.toString(36).padStart(2,'0')+last.toString(36);count=0;last=c;}count++;}rle+=count.toString(36).padStart(2,'0')+last.toString(36);
 if(rle.length<=1800)return rle;let packed='^',buffer=0,bits=0;for(const color of pixels){buffer=(buffer<<5)|color;bits+=5;while(bits>=6){bits-=6;packed+=paintAlphabet[(buffer>>bits)&63];}buffer&=(1<<bits)-1;}if(bits)packed+=paintAlphabet[buffer<<(6-bits)];return packed;
}
export function decodeSkin(text){
 if(typeof text!=='string'||text.length>1+PAINT_CELLS*5/6)return null;const data=new Uint8Array(PAINT_CELLS);
 if(text.startsWith('^')){if(text.length!==1+PAINT_CELLS*5/6||!/^\^[A-Za-z0-9+/]+$/.test(text))return null;let buffer=0,bits=0,offset=0;for(let i=1;i<text.length;i++){buffer=(buffer<<6)|paintAlphabet.indexOf(text[i]);bits+=6;while(bits>=5){bits-=5;data[offset++]=(buffer>>bits)&31;}buffer&=(1<<bits)-1;}return data;}
 if(text.startsWith('~')){if(text.length!==1+PAINT_CELLS/2||!/^~[0-9a-z]+$/.test(text))return null;for(let i=1;i<text.length;i++){const n=parseInt(text[i],36);data[(i-1)*2]=Math.floor(n/6);data[(i-1)*2+1]=n%6;}return data;}
 if(text.length%3)return null;let offset=0;for(let i=0;i<text.length;i+=3){const part=text.slice(i,i+3);if(!/^[0-9a-z]{2}[0-v]$/.test(part))return null;const count=parseInt(part.slice(0,2),36);if(!count||offset+count>data.length)return null;data.fill(parseInt(part[2],36),offset,offset+count);offset+=count;}return offset===data.length?data:null;
}
export function validPaintSkin(p){const pixels=decodeSkin(p.skin);return !!pixels&&Array.isArray(p.palette)&&p.palette.length>=6&&p.palette.length<=PAINT_COLORS&&p.palette.every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/.test(c))&&pixels.every(c=>c<p.palette.length);}
function paintColor(p,a){
 if(a.rgb!==undefined){if(typeof a.rgb!=='string'||!/^#[0-9a-fA-F]{6}$/.test(a.rgb))return -1;const rgb=a.rgb.toLowerCase(),old=p.palette.indexOf(rgb);if(old>=0)return old;
  // Never overwrite a colour already used in the drawing.
  if(p.palette.length<PAINT_COLORS){p.palette.push(rgb);return p.palette.length-1;}
  const used=new Set(p.paintPixels);for(let i=6;i<p.palette.length;i++)if(!used.has(i)&&!p.colors.includes(i)){p.palette[i]=rgb;return i;}return -1;
 }
 return Number.isInteger(a.color)&&a.color>=0&&a.color<p.palette.length?a.color:-1;
}
export function stampSkin(p,a){
 if(!Number.isInteger(a.part)||a.part<0||a.part>5||!Number.isInteger(a.face)||a.face<0||a.face>5||![a.u,a.v,a.radius].every(Number.isInteger)||a.u<0||a.u>=PAINT_GRID||a.v<0||a.v>=PAINT_GRID||a.radius<1||a.radius>4)return false;const color=paintColor(p,a);if(color<0)return false;
 const pixels=p.paintPixels.slice(),offset=(a.part*6+a.face)*PAINT_GRID*PAINT_GRID;for(let y=0;y<PAINT_GRID;y++)for(let x=0;x<PAINT_GRID;x++)if(Math.hypot(x-a.u,y-a.v)<=a.radius)pixels[offset+y*PAINT_GRID+x]=color;p.paintPixels=pixels;p.skin=encodeSkin(pixels);return true;
}

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function requiredPlayers(game,size=1){return game==='shoot'?size*2:GAMES.find(g=>g.id===game)?.min||99;}
export function validMode(game,size=1,count=2){const g=GAMES.find(g=>g.id===game);return !!g&&Number.isInteger(count)&&count>=g.min&&count<=g.max&&(game!=='shoot'||Number.isInteger(size)&&size>=1&&size<=4&&count===size*2);}
const boxes=()=>[...WORLD.walls,...WORLD.props.map(p=>({...p,...PROP_TYPES[p.type]}))];
export const BLOCKS=boxes();
export function moveBody(p,dx,dz,r=.3,world=WORLD){
 const free=(x,z)=>freePosition(x,z,r,world);
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));for(let i=0;i<steps;i++){if(free(p.x+dx/steps,p.z))p.x+=dx/steps;if(free(p.x,p.z+dz/steps))p.z+=dz/steps;}return p;
}
export function rayBox(o,d,b,max=50){let near=0,far=max;for(const [k,lo,hi]of [['x',b.x-b.w/2,b.x+b.w/2],['y',b.y||0,(b.y||0)+b.h],['z',b.z-b.d/2,b.z+b.d/2]]){if(Math.abs(d[k])<1e-8){if(o[k]<lo||o[k]>hi)return Infinity;}else{let a=(lo-o[k])/d[k],c=(hi-o[k])/d[k];if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);if(near>far)return Infinity;}}return near;}
export function dimensions(p){return p.prop?PROP_TYPES[p.prop]:{w:.6*(p.scale||1),h:(p.frozen?1.0:1.8)*(p.scale||1),d:.6*(p.scale||1)};}
export function eyeHeight(p){if(p.paintPose)return paintEye(p).y;return (p.y||0)+(p.prop?Math.min(1.15,dimensions(p).h*.8):(p.frozen?.8:1.57)*(p.scale||1));}
export function aim(p){return {x:-Math.sin(p.yaw)*Math.cos(p.pitch),y:Math.sin(p.pitch),z:-Math.cos(p.yaw)*Math.cos(p.pitch)};}
export function nearbyProp(p,world=WORLD){let best=null,distance=2.8;for(const o of world.props){const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<distance){distance=d;best=o;}}return best;}
export function propMaxHp(type){if(!type)return 100;const p=PROP_TYPES[type];if(!p)return 100;const volume=p.w*p.h*p.d;return volume<=.35?60:volume<=1.05?100:volume<=3?150:200;}
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
export function createMatch({id='preview',game,size=1,players,randomize=random}){
 if(!validMode(game,size,players?.length)||new Set(players.map(p=>p.id)).size!==players.length)throw Error('Nombre de joueurs incompatible avec ce mode.');
 const shuffled=players.map(p=>({...p}));for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(randomize()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const world=worldFor(game,id),blocks=blocksFor(world),hiding=game==='paint'||game==='prop',state={game,size,elapsed:0,phase:hiding?'prepare':'play',until:hiding?world.prepare:180,score:[0,0],target:size*5,finished:false,winner:'',reason:'',gun:null,events:[],stones:[],grenades:[],players:[]};
 const hunters=Math.max(1,Math.floor(players.length/3));
 state.players=shuffled.map((p,i)=>{const role=game==='shoot'?'fighter':game==='murder'?i===0?'murderer':i===1?'armed':'innocent':i<hunters?'seeker':'hider';const team=game==='shoot'?i%2:role==='hider'?1:0,spawn=game==='shoot'?world.spawns[i]:hiding&&role==='seeker'?world.seekerSpawn:world.spawns[i];return {id:p.id,name:String(p.name||'Membre').slice(0,40),role,team,y:0,velocity:0,grounded:true,falling:false,paintPose:game==='paint'?'stand':null,anchor:null,facing:0,scale:avatarScale(game,role),palette:[...COLORS],paintPixels:new Uint8Array(PAINT_CELLS),skin:encodeSkin(new Uint8Array(PAINT_CELLS)),x:spawn[0],z:spawn[1],yaw:spawn[0]<-1?-Math.PI/2:spawn[0]>1?Math.PI/2:0,pitch:0,hp:100,maxHp:100,healthRatio:1,alive:true,connected:true,kills:0,deaths:0,ammo:game==='shoot'?24:12,weaponMode:'auto',stamina:100,burstLeft:0,burstAt:0,burstSeq:0,respawnSerial:0,reloadAt:0,respawnAt:0,invincible:0,cooldown:0,stoneAt:0,grenades:game==='prop'&&role==='seeker'?2:0,grenadeAt:0,drawn:game==='shoot'||role==='seeker',colors:[0,0,0],prop:null,propColor:0,frozen:false,seq:0,input:{x:0,z:0}}});
 if(game==='shoot')for(const p of state.players){const pos=shootSpawn(state.players,p,world,randomize);p.x=pos[0];p.z=pos[1];p.lastSpawn=pos;p.yaw=p.x<0?-Math.PI/2:Math.PI/2;}
 const player=id=>state.players.find(p=>p.id===id);
 function finish(winner,reason){if(state.finished)return;state.finished=true;state.phase='finished';state.winner=winner;state.reason=reason;for(const p of state.players)p.input={x:0,z:0};}
 function endCheck(){
  if(state.finished)return;const live=state.players.filter(p=>p.alive&&p.connected);
  if(game==='shoot'){if([0,1].some(t=>!state.players.some(p=>p.team===t&&p.connected)))finish('Partie interrompue','Une équipe a quitté la partie.');}
  else if(game==='murder'){if(!live.some(p=>p.role==='murderer'))finish('Les innocents gagnent','Le tueur a été arrêté.');else if(!live.some(p=>p.role!=='murderer'))finish('Le tueur gagne','Tous les innocents ont été éliminés.');}
  else if(!live.some(p=>p.role==='hider'))finish('Les chasseurs gagnent','Tous les joueurs cachés ont été trouvés.');else if(!live.some(p=>p.role==='seeker'))finish('Les cachés gagnent','Il ne reste aucun chasseur.');
 }
 function eliminate(p,by){if(!p.alive)return;p.alive=false;p.burstLeft=0;p.hp=0;p.deaths++;p.input={x:0,z:0};if(by&&by!==p)by.kills++;if(game==='murder'&&p.role==='armed')state.gun={x:p.x,z:p.z};if(game==='shoot'){p.respawnAt=state.elapsed+3;if(by&&by.team!==p.team){state.score[by.team]++;if(state.score[by.team]>=state.target)finish(by.team===0?'Équipe bleue gagnante':'Équipe rose gagnante','Objectif de '+state.target+' éliminations atteint.');}}endCheck();}
 function input(id,data){const p=player(id);if(!p||!p.connected||!data||![data.x,data.z,data.yaw,data.pitch].every(Number.isFinite))return false;p.input={x:clamp(data.x,-1,1),z:clamp(data.z,-1,1),sprint:game==='shoot'&&data.sprint===true};const length=Math.hypot(p.input.x,p.input.z);if(length>1){p.input.x/=length;p.input.z/=length;}p.yaw=Math.atan2(Math.sin(data.yaw),Math.cos(data.yaw));p.pitch=clamp(data.pitch,-1.25,1.25);return true;}
 function action(id,a){const p=player(id);if(!p||!p.connected||!p.alive||state.finished||!a||!Number.isSafeInteger(a.seq)||a.seq<=p.seq||a.seq>1e9)return false;
  if(!['grenade','stone','fire','reload','draw','paint','brush','transform','freeze','pickup','pose','attach','detach','jump','weapon'].includes(a.type))return false;p.seq=a.seq;
  if(Number.isFinite(a.yaw)&&Number.isFinite(a.pitch)){p.yaw=Math.atan2(Math.sin(a.yaw),Math.cos(a.yaw));p.pitch=clamp(a.pitch,-1.25,1.25);}
  if(a.type==='stone')return throwStone(p,id,a);if(a.type==='grenade')return throwGrenade(p,id,a);
  if(a.type==='weapon'){if(game!=='shoot'||!['auto','burst'].includes(a.mode))return false;p.weaponMode=a.mode;p.burstLeft=0;return true;}
  if(a.type==='jump'){if(game==='prop'&&p.frozen)return false;if(!['paint','prop','shoot'].includes(game)||p.anchor||!p.grounded||state.phase==='prepare'&&p.role==='seeker')return false;p.velocity=6;p.grounded=false;p.frozen=false;return true;}
  if(['pose','attach','detach'].includes(a.type)){if(game!=='paint'||p.role!=='hider'||p.falling)return false;if(a.type==='pose')return changePaintPose(p,a.pose,world);if(a.type==='attach'){const next=nearbyPaintWall(p,world);if(!next)return false;Object.assign(p,next,{frozen:false,grounded:false,velocity:0});return true;}const next=p.anchor&&paintDrop(p,world);if(!next)return false;Object.assign(p,next);return true;}
  if(a.type==='paint'){if(game!=='paint'||p.role!=='hider'||p.falling||!['prepare','play'].includes(state.phase)||!Number.isInteger(a.part)||a.part<0||a.part>2 )return false;const color=paintColor(p,a);if(color<0)return false;p.colors[a.part]=color;p.paintPixels.fill(color,[0,1,4][a.part]*PAINT_CELLS/6,[1,4,6][a.part]*PAINT_CELLS/6);p.skin=encodeSkin(p.paintPixels);return true;}
  if(a.type==='brush'){if(game!=='paint'||p.role!=='hider'||p.falling||!['prepare','play'].includes(state.phase))return false;return stampSkin(p,a);}
  if(a.type==='freeze'){if(p.role!=='hider'||p.falling||!p.anchor&&!p.grounded)return false;p.facing=p.yaw;p.frozen=!p.frozen;return true;}
  if(a.type==='transform'){const obj=world.props.find(o=>o.id===a.prop);if(game!=='prop'||p.role!=='hider'||p.frozen||!obj||Math.hypot(obj.x-p.x,obj.z-p.z)>2.8)return false;const radius=bodyRadius({prop:obj.type});if(!propFree(p.x,p.z,p.y||0,radius,world))return false;p.prop=obj.type;p.propColor=obj.c;p.maxHp=propMaxHp(obj.type);p.hp=Math.max(1,Math.ceil(p.healthRatio*p.maxHp));return true;}
  if(a.type==='pickup'){if(game!=='murder'||p.role!=='innocent'||!state.gun||Math.hypot(state.gun.x-p.x,state.gun.z-p.z)>1.8)return false;p.role='armed';p.ammo=12;state.gun=null;return true;}
  if(a.type==='draw'){if(game!=='murder'||!['armed','murderer'].includes(p.role))return false;p.drawn=!p.drawn;return true;}
  if(a.type==='reload'){if(!(game==='shoot'||p.role==='armed'||p.role==='seeker')||p.reloadAt||p.ammo===(game==='shoot'?24:12))return false;p.burstLeft=0;p.reloadAt=state.elapsed+1.5;return true;}
  return fire(p,id,a);
 }
 function throwStone(p,id,a){
  if(!hiding||p.role!=='hider'||state.phase!=='play'||p.stoneAt>state.elapsed||state.stones.length>=16)return false;
  const o=game==='paint'?paintEye(p):{x:p.x,y:eyeHeight(p),z:p.z},d=aim(p);
  state.stones.push({id:id+':stone:'+a.seq,from:id,x:o.x,y:o.y,z:o.z,vx:d.x*14,vy:d.y*14+2.4,vz:d.z*14,age:0});p.stoneAt=state.elapsed+1.2;return true;
 }
 function advanceStones(dt){
  if(state.phase!=='play')return;
  for(let i=state.stones.length-1;i>=0;i--){const s=state.stones[i];let ended=false;
   const count=Math.max(1,Math.ceil(dt/.015)),step=dt/count;
   for(let n=0;n<count&&!ended;n++){
    const o={x:s.x,y:s.y,z:s.z},next={x:s.x+s.vx*step,y:s.y+s.vy*step-4.5*step*step,z:s.z+s.vz*step},length=Math.hypot(next.x-o.x,next.y-o.y,next.z-o.z),d={x:(next.x-o.x)/length,y:(next.y-o.y)/length,z:(next.z-o.z)/length};let nearest=length,hit=null,blocked=false;
    for(const b of blocks){const distance=rayBox(o,d,b,length);if(distance<=nearest){nearest=distance;blocked=true;}}
    if(Math.abs(d.y)>1e-8&&(d.y<0||game==='paint')){const distance=((d.y<0?0:PAINT_CEILING)-o.y)/d.y;if(distance>=0&&distance<=nearest){nearest=distance;blocked=true;}}
    for(const p of state.players){if(p.id===s.from||!p.alive||!p.connected)continue;const distance=game==='paint'?paintRayHit(o,d,p,length):rayBox(o,d,{...p,...dimensions(p)},length);if(distance<nearest){nearest=distance;hit=p;blocked=true;}}
    s.x=o.x+d.x*nearest;s.y=o.y+d.y*nearest;s.z=o.z+d.z*nearest;s.vy-=9*step;s.age+=step;
    if(blocked||s.age>=2){const struck=hit?.role==='seeker'?hit:null;if(struck){struck.hp=Math.max(0,struck.hp-5);struck.healthRatio=struck.hp/struck.maxHp;if(struck.hp===0)eliminate(struck,player(s.from));}
     state.events.push({id:s.id+':impact',from:s.from,x:s.x,z:s.z,hit:struck?.id||null,knife:false,stone:{at:[s.x,s.y,s.z]}});if(state.events.length>12)state.events.shift();ended=true;
    }
   }
   if(ended)state.stones.splice(i,1);
  }
 }

 function throwGrenade(p,id,a){
  if(game!=='prop'||p.role!=='seeker'||state.phase!=='play'||p.grenades<=0||p.grenadeAt>state.elapsed||state.grenades.length>=8)return false;
  const d=aim(p);state.grenades.push({id:id+':grenade:'+a.seq,from:id,x:p.x,y:eyeHeight(p),z:p.z,vx:d.x*11,vy:d.y*11+3.6,vz:d.z*11,age:0});p.grenades--;p.grenadeAt=state.elapsed+6;return true;
 }
 function explodeGrenade(g){
  const hits=[],radius=3.2,o={x:g.x,y:g.y,z:g.z};
  for(const p of state.players){
   if(p.role!=='hider'||!p.alive||!p.connected)continue;
   const size=dimensions(p),point={x:clamp(g.x,p.x-size.w/2,p.x+size.w/2),y:clamp(g.y,p.y,p.y+size.h),z:clamp(g.z,p.z-size.d/2,p.z+size.d/2)},distance=Math.hypot(point.x-g.x,point.y-g.y,point.z-g.z);
   if(distance>radius)continue;
   const d={x:(point.x-g.x)/(distance||1),y:(point.y-g.y)/(distance||1),z:(point.z-g.z)/(distance||1)};
   if(distance>.001&&blocks.some(b=>rayBox(o,d,b,distance)<distance-.015))continue;
   const damage=Math.round(70-52*distance/radius);p.hp=Math.max(0,p.hp-damage);p.healthRatio=p.hp/p.maxHp;hits.push(p.id);if(p.hp===0)eliminate(p,player(g.from));
  }
  state.events.push({id:g.id+':blast',from:g.from,x:g.x,z:g.z,hit:hits[0]||null,knife:false,grenade:{at:[g.x,g.y,g.z],radius,hits}});if(state.events.length>12)state.events.shift();
 }
 function advanceGrenades(dt){
  if(game!=='prop'||state.phase!=='play')return;
  for(let i=state.grenades.length-1;i>=0;i--){const g=state.grenades[i],count=Math.max(1,Math.ceil(dt/.012)),step=dt/count;
   for(let n=0;n<count&&g.age<1.5;n++){
    const o={x:g.x,y:g.y,z:g.z},next={x:g.x+g.vx*step,y:g.y+g.vy*step-4.5*step*step,z:g.z+g.vz*step},length=Math.hypot(next.x-o.x,next.y-o.y,next.z-o.z),d={x:(next.x-o.x)/(length||1),y:(next.y-o.y)/(length||1),z:(next.z-o.z)/(length||1)};let nearest=length,normal=null;
    for(const b of blocks){const expanded={x:b.x,z:b.z,y:(b.y||0)-.1,w:b.w+.2,h:b.h+.2,d:b.d+.2},t=rayBox(o,d,expanded,length);if(t>nearest)continue;
     nearest=t;const point={x:o.x+d.x*t,y:o.y+d.y*t,z:o.z+d.z*t},faces=[['x',expanded.x-expanded.w/2,-1],['x',expanded.x+expanded.w/2,1],['y',expanded.y,-1],['y',expanded.y+expanded.h,1],['z',expanded.z-expanded.d/2,-1],['z',expanded.z+expanded.d/2,1]].sort((a,b)=>Math.abs(point[a[0]]-a[1])-Math.abs(point[b[0]]-b[1]));normal={x:0,y:0,z:0};normal[faces[0][0]]=faces[0][2];
    }
    if(d.y<0){const t=(.1-o.y)/d.y;if(t>=0&&t<=nearest){nearest=t;normal={x:0,y:1,z:0};}}
    // A direct hit on a hidden object detonates the launched grenade. Solid
    // scenery still takes priority and causes a bounce until the fuse ends.
    let contact=false;for(const p of state.players){if(p.role!=='hider'||!p.alive||!p.connected)continue;const size=dimensions(p),t=rayBox(o,d,{x:p.x,z:p.z,y:p.y-.1,w:size.w+.2,h:size.h+.2,d:size.d+.2},length);if(t<nearest){nearest=t;normal=null;contact=true;}}
    g.x=o.x+d.x*nearest;g.y=o.y+d.y*nearest;g.z=o.z+d.z*nearest;g.vy-=9*step;
    if(normal){const dot=g.vx*normal.x+g.vy*normal.y+g.vz*normal.z;if(dot<0){g.vx-=1.45*dot*normal.x;g.vy-=1.45*dot*normal.y;g.vz-=1.45*dot*normal.z;}g.x+=normal.x*.003;g.y+=normal.y*.003;g.z+=normal.z*.003;if(normal.y>.5){g.vx*=.65;g.vz*=.65;if(Math.abs(g.vy)<.3)g.vy=0;}}
    g.age=contact?1.5:g.age+step;
   }
   if(g.age>=1.5){explodeGrenade(g);state.grenades.splice(i,1);}
  }
 }

 function fire(p,id,a,internal=false){
  if(!p.alive||state.finished||game==='shoot'&&p.burstLeft>0&&!internal)return false;
  if(state.phase!=='play'||p.cooldown>state.elapsed||p.reloadAt||!(game==='shoot'||p.role==='seeker'||game==='murder'&&p.drawn&&p.role!=='innocent'))return false;
  const knife=p.role==='murderer',range=knife?1.85:45;if(!knife&&p.ammo<=0){p.burstLeft=0;p.reloadAt=state.elapsed+1.5;return false;}p.cooldown=state.elapsed+(knife?.65:game==='shoot'?(p.weaponMode==='burst'?.085:.13):game==='paint'?.3:.85);if(game==='shoot'&&p.weaponMode==='burst'&&!internal){p.burstLeft=2;p.burstAt=state.elapsed+.09;p.burstSeq=a.seq;}if(!knife)p.ammo--;
  const o=game==='paint'?paintEye(p):{x:p.x,y:eyeHeight(p),z:p.z},d=aim(p);let nearest=range,hit=null;
  for(const b of blocks)nearest=Math.min(nearest,rayBox(o,d,b,range));
  if(game==='paint'&&Math.abs(d.y)>1e-8){const t=((d.y<0?0:PAINT_CEILING)-o.y)/d.y;if(t>=0)nearest=Math.min(nearest,t);}
  for(const other of state.players){if(other===p||!other.alive||!other.connected||other.invincible>state.elapsed)continue;const distance=game==='paint'?paintRayHit(o,d,other,range):rayBox(o,d,{...other,...dimensions(other)},range);if(distance<nearest){nearest=distance;hit=other;}}
  const event={id:id+':'+a.seq+(internal?':burst'+p.burstLeft:''),from:id,x:p.x,z:p.z,hit:null,knife};
  if(game==='paint'){event.paint={from:[o.x,o.y,o.z],to:[o.x+d.x*nearest,o.y+d.y*nearest,o.z+d.z*nearest],color:PAINT_SHOT_COLORS[state.players.indexOf(p)%PAINT_SHOT_COLORS.length],surface:!hit&&nearest<range};if(p.ammo===0)p.reloadAt=state.elapsed+1.5;}
  if(hit){if(game==='shoot'&&hit.team===p.team){}else if(hiding&&hit.role==='seeker'){}else{hit.hp-=game==='shoot'?25:game==='prop'?35:100;hit.healthRatio=Math.max(0,hit.hp/hit.maxHp);event.hit=hit.id;if(hit.hp<=0)eliminate(hit,p);if(game==='murder'&&p.role==='armed'&&hit.role!=='murderer')eliminate(p,p);}}
  else if(game==='prop'&&p.role==='seeker'){p.hp-=5;if(p.hp<=0)eliminate(p,p);}
  state.events.push(event);if(state.events.length>12)state.events.shift();endCheck();return true;
 }
 function tick(dt){if(state.finished||!Number.isFinite(dt)||dt<=0)return;state.elapsed+=Math.min(dt,30);const moveDt=Math.min(dt,.1);
  if(state.phase==='prepare'&&state.elapsed>=state.until){state.phase='play';state.until=state.elapsed+(world.hunt||120);}
  for(const p of state.players){if(!p.connected)continue;if(p.reloadAt&&state.elapsed>=p.reloadAt){p.ammo=game==='shoot'?24:12;p.reloadAt=0;}if(game==='shoot'&&!p.alive&&state.elapsed>=p.respawnAt){const pos=shootSpawn(state.players,p,world,randomize,++p.respawnSerial);p.x=pos[0];p.z=pos[1];p.y=0;p.velocity=0;p.grounded=true;p.stamina=100;p.lastSpawn=pos;p.alive=true;p.hp=100;p.ammo=24;p.reloadAt=0;p.invincible=state.elapsed+1.5;}if(!p.alive||state.phase==='prepare'&&p.role==='seeker')continue;if(game==='paint'){advancePaint(p,p.input,moveDt,world);continue;}if(game==='prop'){advanceProp(p,p.input,moveDt,world);continue;}if(game==='shoot'){const run=p.input.sprint&&Math.hypot(p.input.x,p.input.z)>.05&&p.stamina>0;p.moveSpeed=run?6.8:4.8;p.stamina=clamp(p.stamina+(run?-24:16)*moveDt,0,100);advanceProp(p,p.input,moveDt,world);if(p.burstLeft&&state.elapsed>=p.burstAt){if(fire(p,p.id,{seq:p.burstSeq},true)){p.burstLeft--;p.burstAt=state.elapsed+.09;if(!p.burstLeft)p.cooldown=state.elapsed+.38;}else p.burstLeft=0;}continue;}if(p.frozen)continue;const speed=game==='shoot'?4.8:p.prop?3:3.8;moveBody(p,p.input.x*speed*moveDt,p.input.z*speed*moveDt,bodyRadius(p),world);}
  advanceStones(moveDt);advanceGrenades(moveDt);if(state.finished){state.stones=[];state.grenades=[];}if(state.elapsed>=state.until&&state.phase==='play'){if(game==='shoot')finish(state.score[0]===state.score[1]?'Égalité':state.score[0]>state.score[1]?'Équipe bleue gagnante':'Équipe rose gagnante','Temps écoulé.');else finish(game==='murder'?'Les innocents gagnent':'Les cachés gagnent','Temps écoulé.');}endCheck();
 }
 function remove(id){const p=player(id);if(p){p.connected=false;eliminate(p);endCheck();}}
 function snapshot(id){const mine=player(id);return {game,size,phase:state.phase,remaining:Math.max(0,state.until-state.elapsed),score:[...state.score],target:state.target,finished:state.finished,winner:state.winner,reason:state.reason,gun:state.gun,grenades:state.finished?[]:state.grenades.map(({id,from,x,y,z})=>({id,from,x,y,z})),stones:state.stones.map(({id,from,x,y,z})=>({id,from,x,y,z})),events:state.events.slice(-6),selfRole:mine?.role,players:state.players.filter(p=>!(state.phase==='prepare'&&mine?.role==='seeker'&&p.role==='hider')).map(p=>({id:p.id,name:p.name,grenades:p.grenades,grenadeReadyIn:Math.max(0,p.grenadeAt-state.elapsed),stoneReadyIn:Math.max(0,p.stoneAt-state.elapsed),palette:game==='paint'?[...p.palette]:null,weaponMode:p.weaponMode,stamina:p.stamina,y:p.y,velocity:p.velocity,grounded:p.grounded,falling:p.falling,paintPose:p.paintPose,anchor:p.anchor?{...p.anchor}:null,facing:p.facing,scale:p.scale,skin:game==='paint'?p.skin:null,x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,hp:p.hp,maxHp:p.maxHp,alive:p.alive,connected:p.connected,kills:p.kills,deaths:p.deaths,team:game==='shoot'?p.team:null,role:game==='paint'||state.finished||p.id===id?p.role:null,weapon:p.drawn?(p.role==='murderer'?'knife':['armed','seeker','fighter'].includes(p.role)?'gun':null):null,colors:[...p.colors],prop:p.prop,propColor:p.propColor,frozen:p.frozen,ammo:p.id===id?p.ammo:null,reloading:p.id===id&&!!p.reloadAt,respawn:p.id===id&&!p.alive&&game==='shoot'?Math.max(0,p.respawnAt-state.elapsed):0}))};}
 return {world,state,input,action,tick,remove,snapshot,finish};
}
