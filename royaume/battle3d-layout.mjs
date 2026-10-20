export const BUILDING_FOOTPRINTS={castle:[3.2,3],mine:[2,2],mill:[2,2],cottage:[1.65,1.65],tower:[1.5,1.5],cannon:[1.6,1.6],forge:[1.9,1.65],barracks:[1.9,1.8],wall:[1,.7]};

// Only the independent training uses this village and its collision footprints.
export function createTrainingFort(){
  const buildings=[];
  function add(kind,x,y,hp,damage=0,range=0,rotation=0){
    const [width,depth]=BUILDING_FOOTPRINTS[kind];
    buildings.push({id:`b${buildings.length}`,kind,x,y,hp,maxHp:hp,damage,range,cooldown:0,rotation,
      collision:{width:rotation?depth:width,depth:rotation?width:depth}});
  }
  add('castle',10,7.6,1296);
  add('mine',7,9,626);
  add('mill',13.2,5.3,626);
  add('cottage',6.7,4.5,454);
  add('cottage',9,4.4,454);
  add('tower',6.5,6.5,605,38,4.5);
  add('cannon',13.5,8,670,53,4);
  add('cottage',13.6,10.5,454);
  add('forge',10,10.8,540);
  add('barracks',11.1,4.4,540);
  add('cottage',6.7,11.3,454);
  for(let x=4;x<=16;x++){
    if(x<9||x>11)add('wall',x,3,240);
    if(x<9||x>11)add('wall',x,13,240);
  }
  for(const x of [4,16])for(let y=4;y<=12;y++)if(y<7||y>9)add('wall',x,y,240,0,0,Math.PI/2);
  return buildings;
}
