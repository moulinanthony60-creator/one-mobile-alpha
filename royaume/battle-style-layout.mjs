// Dedicated practice map. Campaign layouts and saved villages stay unchanged.
export const VALDORIA_FIELD=Object.freeze({width:40,height:32,margin:6,seconds:150});
export function createValdoriaFort(){
 const buildings=[];
 function add(kind,x,y,hp,{damage=0,range=0,art=kind,w=2.1,d=2.1,rotation=0}={}){
  buildings.push({id:`b${buildings.length}`,kind,art,x,y,hp,maxHp:hp,damage,range,cooldown:0,rotation,facing:Math.atan2(y-16,x-20),collision:{width:w,depth:d}});
 }
 add('castle',20.5,16.5,1080,{art:'castle4',w:4.1,d:3.8});
 const xs=[7,15,25,33],ys=[6,12,21,26];
 const rooms=[
  [0,0,['mine','vault','tower','cottage']], [1,0,['barracks','tower','forge','camp']], [2,0,['reservoir','mill','cannon','cottage']],
  [0,1,['arcane','mine','cottage','barracks']], [2,1,['cottage','vault','mine','mortar']],
  [0,2,['cottage','tower','forge','mill']], [1,2,['cannon','barracks','cottage','reservoir']], [2,2,['tower','cottage','mine','arcane']]
 ];
 for(const [col,row,kinds]of rooms){const x0=xs[col],x1=xs[col+1],y0=ys[row],y1=ys[row+1];
  kinds.forEach((art,i)=>{const x=(i%2?x1-2:x0+2)+.5,y=(i<2?y0+1.7:y1-1.7)+.0;
   const kind=['vault','reservoir'].includes(art)?'mine':art==='camp'?'barracks':art;
   const defense=['tower','cannon','mortar','arcane'].includes(kind);
   add(kind,x,y,defense?280:210,{art,damage:defense?(kind==='mortar'?13:8):0,range:defense?4.5:0,w:2,d:1.9});
  });
 }
 add('tower',17.5,14.5,280,{damage:8,range:4.5,w:1.7,d:1.7});
 add('cannon',23.5,18.5,280,{damage:8,range:4.5,w:1.8,d:1.8});
 // Connected outer walls and internal partitions, with two narrow entrances.
 const occupied=new Set();const wall=(x,y,rotation=0)=>{const key=x+','+y;if(occupied.has(key))return;occupied.add(key);add('wall',x,y,65,{w:rotation?.70:1,d:rotation?1:.70,rotation});};
 for(const y of ys)for(let x=7;x<=33;x++){if((y===6||y===26)&&[19,20,21].includes(x))continue;wall(x,y);}
 for(const x of xs)for(let y=7;y<26;y++)wall(x,y,Math.PI/2);
 return buildings;
}
