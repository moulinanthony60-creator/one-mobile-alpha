import * as THREE from './three.module.js';

// Each control is a solid object in the scene. The same raycast is used for
// mouse, touch and keyboard interaction; the HTML panel is only an optional aid.
export function buildCasinoInteractions(root,stations){
 const boards=new Map(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),resources=[];
 const red=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
 const material=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.5,metalness:.2});resources.push(m);return m;};
 const gold=material('#b69760'),base=material('#15242f'),chipMat=material('#e9bb64');
 const geo=(w,h,d)=>{const g=new THREE.BoxGeometry(w,h,d);resources.push(g);return g;};
 function texture(w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;resources.push(map);const m=new THREE.MeshBasicMaterial({map,toneMapped:false});resources.push(m);return {canvas,ctx:canvas.getContext('2d'),map,material:m};}
 function surface(parent,w,h,x,y,color,text){const t=texture(512,Math.max(64,Math.round(512*h/w))),edge=material(color),mesh=new THREE.Mesh(geo(w,h,.055),edge);mesh.position.set(x,y,.11);const faceGeo=new THREE.PlaneGeometry(w,h);resources.push(faceGeo);const face=new THREE.Mesh(faceGeo,t.material);face.position.z=.028;mesh.add(face);parent.add(mesh);return {mesh,...t,w,h,color,label:text,last:'',enabled:true};}
 function draw(o,text,selected=false,enabled=true){const key=[text,selected,enabled].join('|');if(o.last===key)return;o.last=key;const {ctx:g,canvas:c}=o;g.fillStyle=selected?'#dab779':enabled?o.color:'#222d34';g.fillRect(0,0,c.width,c.height);g.strokeStyle=selected?'#fff1b2':'#a69369';g.lineWidth=5;g.strokeRect(4,4,c.width-8,c.height-8);g.fillStyle=selected?'#172931':enabled?'#fff3d7':'#899799';const lines=String(text).split('\n');g.font=`800 ${Math.min(c.height/(lines.length+1)*1.1,c.width/(Math.max(...lines.map(s=>s.length))*.66+1))}px system-ui`;g.textAlign='center';g.textBaseline='middle';lines.forEach((s,i)=>g.fillText(s,c.width/2,c.height*(i+1)/(lines.length+1),c.width-18));o.map.needsUpdate=true;o.enabled=enabled;}
 function button(b,id,label,x,y,w,h,color='#26473f'){const o=surface(b.group,w,h,x,y,color,label);o.id=id;o.label=label;o.mesh.userData.casinoAction=id;o.baseZ=o.mesh.position.z;b.targets.push(o);draw(o,label);return o;}
 for(const s of stations){const group=new THREE.Group();root.add(group);group.name='Pupitre interactif '+s.name;group.rotation.set(s.kind==='roulette'?1.42:.42,Math.PI,0);group.position.set(s.x,s.kind==='slots'?.78:s.kind==='roulette'?1.27:1.05,s.z-(s.kind==='slots'?.77:s.kind==='roulette'?1.42:1.6));const b={id:s.id,kind:s.kind,group,targets:[],chips:new Map(),selected:null,hover:null,pressed:null,pressUntil:0};boards.set(s.id,b);
  const w=s.kind==='slots'?1.27:3.25,h=s.kind==='slots'?.92:s.kind==='roulette'?2.27:.82;
  const frame=new THREE.Mesh(geo(w+.1,h+.1,.15),gold);group.add(frame);const plate=new THREE.Mesh(geo(w+.045,h+.045,.155),base);plate.position.z=.01;group.add(plate);
  b.display=surface(group,w-.06,.17,0,h/2-.11,'#101d23','');
  if(s.kind==='roulette'){
   // Six columns keep every number usable on a portrait phone.
   button(b,'bet:n:0','0',-1.32,.68,.51,.23,'#235d43');
   for(let n=1;n<=36;n++){const col=(n-1)%6,row=Math.floor((n-1)/6);button(b,'bet:n:'+n,String(n),(col-2.5)*.53,.43-row*.205,.50,.185,red.has(n)?'#8d3443':'#20303a');}
   for(const [i,[id,label]]of [['red','ROUGE'],['black','NOIR'],['even','PAIR'],['odd','IMPAIR'],['low','1–18'],['high','19–36']].entries())button(b,'bet:'+id,label,(i-2.5)*.53,-.84,.50,.21,id==='red'?'#8d3443':'#245044');
   button(b,'undo','ANNULER',-.72,.68,.61,.23);button(b,'clear','EFFACER',-.02,.68,.73,.23);
   button(b,'play','LANCER',1.05,.68,1.03,.23,'#3b7759');
   for(const [i,n]of [10,25,50,100].entries())button(b,'stake:'+n,String(n)+' ●',(i-1.5)*.81,-1.07,.76,.19,'#354457');
  }else if(s.kind==='slots'){
   for(const [i,n]of [10,25,50,100].entries())button(b,'stake:'+n,String(n),((i%2)-.5)*.61,.08-Math.floor(i/2)*.19,.56,.16,'#354457');
   button(b,'play','LANCER',0,-.33,1.17,.2,'#38775a');
  }else{
   for(const [i,n]of [10,25,50,100].entries())button(b,'stake:'+n,String(n)+' ●',(i-1.5)*.80,.04,.74,.18,'#354457');
   button(b,'play','DISTRIBUER',-1.04,-.23,1.03,.26,'#38775a');button(b,'hit','CARTE',.09,-.23,1.03,.26,'#366586');button(b,'stand','RESTER',1.21,-.23,.77,.26,'#8c444b');
  }
  // A status screen is a physical part of the console, including recovery.
  b.display.id='recover';b.display.label='Retrouver le résultat / actualiser';b.display.baseZ=b.display.mesh.position.z;b.targets.push(b.display);
 }
 function update(id,state){const b=boards.get(id);if(!b)return;b.state=state;
  draw(b.display,state.display,false,true);
  for(const o of b.targets){if(o===b.display){o.enabled=state.recover;continue;}const amount=Number(o.id.split(':')[1]);let enabled=state.ready&&!state.busy,selected=false,label=o.label;
   if(o.id.startsWith('stake:')){enabled&&=!state.active&&!state.free;selected=state.stake===amount;}
   if(o.id.startsWith('bet:')){enabled&&=state.canAdd;const bet=state.bets.find(b=>b.key===o.id.slice(4));selected=!!bet;label=bet?o.label+' · '+bet.amount:o.label;
    if(bet&&!b.chips.has(o.id)){const g=new THREE.CylinderGeometry(.045,.045,.025,18);g.rotateX(Math.PI/2);resources.push(g);const c=new THREE.Mesh(g,chipMat);c.position.set(o.mesh.position.x+o.w*.35,o.mesh.position.y+o.h*.25,.165);b.group.add(c);b.chips.set(o.id,c);}if(b.chips.has(o.id))b.chips.get(o.id).visible=!!bet;
   }
   if(o.id==='play'){enabled&&=state.canPlay;label=state.busy?'PATIENCE…':state.free?'TOUR GRATUIT':o.label;}
   if(o.id==='hit'||o.id==='stand')enabled&&=state.active;
   if(o.id==='clear'||o.id==='undo')enabled&&=state.bets.length>0;
   draw(o,label,selected,enabled);
  }
 }
 function pick(id,x,y,camera,rect){const b=boards.get(id);if(!b)return null;root.updateMatrixWorld(true);camera.updateMatrixWorld();pointer.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(b.targets.map(t=>t.mesh),false)[0];return hit?b.targets.find(t=>t.mesh===hit.object):null;}
 function hover(id,target){const b=boards.get(id);if(b)b.hover=target?.enabled?target:null;}
 return {update,pick,hover,press(id,target,t){const b=boards.get(id);if(b&&target?.enabled){b.pressed=target;b.pressUntil=t+160;}},clear(id){const b=boards.get(id);if(b){b.hover=null;b.pressed=null;}},
  tick(t){for(const b of boards.values())for(const o of b.targets){o.mesh.position.z=o.baseZ-(b.pressed===o&&t<b.pressUntil?.028:0);const scale=b.hover===o?1.025:1;o.mesh.scale.set(scale,scale,1);o.mesh.updateMatrix();}},
  targets(id,camera,rect){const b=boards.get(id);if(!b)return[];root.updateMatrixWorld(true);camera.updateMatrixWorld();return b.targets.map(o=>{const p=o.mesh.getWorldPosition(new THREE.Vector3()).project(camera);return {id:o.id,label:o.label,enabled:o.enabled,x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};});},
  dispose(){for(const b of boards.values())root.remove(b.group);for(const r of resources)r.dispose();}
 };
}


