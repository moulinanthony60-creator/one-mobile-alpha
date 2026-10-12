import * as THREE from './three.module.js';

// Inclined betting cloth, real chips and physical controls share one world raycast.
export function buildCasinoInteractions(root,stations){
 const boards=new Map(),resources=[],ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
 const keep=o=>(resources.push(o),o),mat=c=>keep(new THREE.MeshStandardMaterial({color:c,roughness:.68}));
 const gold=mat('#b79a62'),wood=mat('#29323d'),clear=keep(new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
 const box=(w,h,d)=>keep(new THREE.BoxGeometry(w,h,d)),plane=(w,h)=>keep(new THREE.PlaneGeometry(w,h));
 function image(w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const map=keep(new THREE.CanvasTexture(canvas));map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return {canvas,ctx:canvas.getContext('2d'),map,material:keep(new THREE.MeshBasicMaterial({map,toneMapped:false}))};}
 function draw(o,text,selected=false,enabled=true){const key=[text,selected,enabled].join('|');if(o.last===key)return;o.last=key;const {ctx:g,canvas:c}=o;g.fillStyle=selected?'#c9a86b':o.color;g.fillRect(0,0,c.width,c.height);g.strokeStyle=selected?'#fff0b1':'#8e997e';g.lineWidth=4;g.strokeRect(5,5,c.width-10,c.height-10);g.fillStyle=selected?'#162b31':enabled?'#fff0c7':'#89938f';g.font=`800 ${Math.min(c.height*.48,c.width/(text.length*.63+1))}px system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,c.width/2,c.height/2,c.width-18);o.map.needsUpdate=true;}
 function button(b,id,label,x,y,w,h,color='#285448'){const im=image(512,Math.max(80,Math.round(512*h/w))),mesh=new THREE.Mesh(box(w,h,.035),wood);mesh.position.set(x,y,.055);const face=new THREE.Mesh(plane(w,h),im.material);face.position.z=.018;mesh.add(face);b.group.add(mesh);const o={...im,id,label,mesh,w,h,color,enabled:false,baseZ:.055};mesh.userData.casinoControl=true;b.targets.push(o);draw(o,label);return o;}
 const chipGeo=keep(new THREE.CylinderGeometry(.072,.072,.025,24));chipGeo.rotateX(Math.PI/2);
 const chipFace=plane(.143,.143),chipLooks=new Map();
 for(const [i,value]of [10,25,50,100].entries()){const im=image(192,192),g=im.ctx,c=['#306f9e','#a63855','#487f55','#8152a4'][i];g.fillStyle=c;g.beginPath();g.arc(96,96,94,0,Math.PI*2);g.fill();g.strokeStyle='#fff1d7';g.lineWidth=12;g.setLineDash([13,13]);g.beginPath();g.arc(96,96,84,0,Math.PI*2);g.stroke();g.setLineDash([]);g.lineWidth=3;g.beginPath();g.arc(96,96,66,0,Math.PI*2);g.stroke();g.fillStyle='#fff6df';g.font='900 55px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(String(value),96,98);im.map.needsUpdate=true;im.material.transparent=true;const edge=mat(c),ghostEdge=keep(edge.clone()),ghostFace=keep(im.material.clone());for(const m of [ghostEdge,ghostFace]){m.transparent=true;m.opacity=.48;m.depthWrite=false;}chipLooks.set(value,{...im,edge,ghostEdge,ghostFace});}
 function chip(value){const look=chipLooks.get(value),mesh=new THREE.Mesh(chipGeo,look.edge),face=new THREE.Mesh(chipFace,look.material);face.position.z=.013;mesh.add(face);mesh.userData.casinoChip=true;return mesh;}
 function rack(b,x,y,spacing){for(const [i,value]of [10,25,50,100].entries()){const mesh=chip(value);mesh.scale.setScalar(1.4);mesh.position.set(x+i*spacing,y,.075);b.group.add(mesh);mesh.userData.casinoControl=true;b.targets.push({id:'stake:'+value,label:'Jeton '+value,mesh,enabled:false,baseZ:.075,scale:1.4});}}
 function cell(b,id,label,x,y,w,h){const mesh=new THREE.Mesh(plane(w,h),clear);mesh.position.set(x,y,.032);mesh.userData.casinoControl=true;b.group.add(mesh);b.targets.push({id,label,mesh,w,h,enabled:false,flat:true,baseZ:.032});return {id,label,x,y,w,h};}
 for(const s of stations){const group=new THREE.Group();group.name='Jeu direct '+s.name;group.rotation.set(s.kind==='slots'?.42:s.kind==='roulette'?1.30:1.05,Math.PI,0);group.position.set(s.x,s.kind==='slots'?.78:s.kind==='roulette'?.76:.64,s.z-(s.kind==='slots'?.77:s.kind==='roulette'?1.52:1.38));if(s.kind==='roulette')group.scale.y=.70;root.add(group);const b={id:s.id,kind:s.kind,group,targets:[],chips:[],hover:null};boards.set(s.id,b);
  const w=s.kind==='slots'?1.28:s.kind==='roulette'?3.38:1.26,h=s.kind==='roulette'?2.4:s.kind==='slots'?.95:1.14,offset=s.kind==='blackjack'?-.19:0;
  const frame=new THREE.Mesh(box(w+.07,h+.07,.07),gold);frame.position.set(0,offset,-.04);group.add(frame);
  const cloth=image(2048,Math.round(2048*h/w)),felt=new THREE.Mesh(plane(w,h),cloth.material);felt.position.set(0,offset,.012);group.add(felt);const g=cloth.ctx,W=cloth.canvas.width,H=cloth.canvas.height;
  g.fillStyle=s.kind==='slots'?'#152731':'#144e40';g.fillRect(0,0,W,H);
  const cells=[];
  if(s.kind==='roulette'){
   cells.push(cell(b,'bet:n:0','0',-1.50,.39,.22,.9));
   for(let n=1;n<=36;n++){const col=Math.floor((n-1)/3),row=(n-1)%3;cells.push(cell(b,'bet:n:'+n,String(n),-1.24+col*.228,.69-row*.30,.228,.30));}
   for(let i=1;i<=3;i++){cells.push(cell(b,'bet:c:'+i,'×3',1.52,.69-(i-1)*.30,.21,.30));cells.push(cell(b,'bet:d:'+i,((i-1)*12+1)+'–'+i*12,-.90+(i-1)*.92,-.24,.92,.30));}
   for(const [i,[key,label]]of [['low','1–18'],['even','PAIR'],['red','ROUGE'],['black','NOIR'],['odd','IMPAIR'],['high','19–36']].entries())cells.push(cell(b,'bet:'+key,label,-1.13+i*.455,-.57,.455,.32));
   rack(b,-.54,-.87,.36);button(b,'undo','ANNULER',-.44,-1.12,.41,.18);button(b,'clear','VIDER',0,-1.12,.41,.18);button(b,'play','LANCER',.44,-1.12,.41,.18,'#476938');
   b.display=button(b,'recover','POINTS ONE',0,1.03,3.15,.15,'#10382f');
  }else if(s.kind==='blackjack'){
   const c=cell(b,'place','Poser la mise',0,.065,.64,.23);cells.push(c);rack(b,-.315,-.15,.21);
   button(b,'play','DISTRIBUER',0,-.36,.83,.17);button(b,'hit','CARTE',-.215,-.57,.40,.18,'#285778');button(b,'stand','RESTER',.215,-.57,.40,.18,'#854452');
   b.display=button(b,'recover','POINTS ONE',0,.30,1.14,.14,'#10382f');
  }else{
   rack(b,-.45,.06,.30);button(b,'play','LANCER',0,-.27,1.15,.23,'#476938');b.display=button(b,'recover','POINTS ONE',0,.32,1.16,.16,'#142631');
  }
  // Numbers are ink on a continuous cloth, not raised buttons.
  for(const c of cells){const x=(c.x-c.w/2+w/2)/w*W,y=(h/2+offset-c.y-c.h/2)/h*H,cw=c.w/w*W,ch=c.h/h*H,n=Number(c.id.slice(6));g.fillStyle=c.id.startsWith('bet:n:')?(n===0?'#236b52':reds.has(n)?'#a33148':'#162b2c'):c.id==='bet:red'?'#a33148':c.id==='bet:black'?'#162b2c':'#1c604b';g.fillRect(x,y,cw,ch);g.strokeStyle='#ddcfa6';g.lineWidth=2;g.strokeRect(x,y,cw,ch);g.fillStyle='#fff1d0';g.font=`800 ${Math.min(ch*.50,cw/(c.label.length*.66+1))}px system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillText(c.label,x+cw/2,y+ch/2,cw-8);}
  cloth.map.needsUpdate=true;b.ghost=chip(10);b.ghost.visible=false;group.add(b.ghost);
 }
 function paintChips(b,placements){const key=JSON.stringify(placements);if(key===b.chipKey)return;b.chipKey=key;for(const c of b.chips)b.group.remove(c);b.chips=[];for(const p of placements){const c=chip(p.amount),stack=placements.slice(0,b.chips.length).filter(a=>Math.hypot(a.x-p.x,a.y-p.y)<.10).length;c.position.set(p.x,p.y,.06+Math.min(stack,12)*.026);b.group.add(c);b.chips.push(c);}}
 function update(id,state){const b=boards.get(id);if(!b)return;b.state=state;paintChips(b,state.placements||[]);
  for(const o of b.targets){let enabled=state.ready&&!state.busy,selected=false,label=o.label;
   if(o.id==='recover'){enabled=state.recover;label=state.display;}
   else if(o.id.startsWith('stake:')){enabled&&=!state.active&&!state.free;selected=state.stake===Number(o.id.slice(6));}
   else if(o.id.startsWith('bet:')||o.id==='place')enabled&&=state.canAdd;
   else if(o.id==='play'){enabled&&=state.canPlay;label=state.busy?'…':state.free?'GRATUIT':o.label;}
   else if(o.id==='hit'||o.id==='stand')enabled&&=state.active&&b.kind==='blackjack';
   else if(o.id==='clear'||o.id==='undo')enabled&&=!state.active&&(state.placements?.length||0)>0;
   o.enabled=!!enabled;o.selected=selected;if(o.canvas)draw(o,label,selected,o.enabled);
  }
 }
 function visible(o){for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;}
 function ignored(o){for(let n=o;n&&n!==root.parent;n=n.parent)if(n.userData.casinoChip||n.userData.casinoControl)return true;return o.material?.transparent&&o.material.opacity===0;}
 function pick(id,x,y,camera,rect){const b=boards.get(id);if(!b)return null;root.parent.updateMatrixWorld(true);camera.updateMatrixWorld();pointer.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);ray.far=4.25;const hit=ray.intersectObjects(b.targets.map(t=>t.mesh),false)[0];if(!hit)return null;const obstacle=ray.intersectObject(root.parent,true).find(h=>visible(h.object)&&!ignored(h.object)&&h.distance>.04);if(obstacle&&obstacle.distance+.035<hit.distance)return null;const o=b.targets.find(t=>t.mesh===hit.object),p=b.group.worldToLocal(hit.point.clone());return {...o,point:{x:p.x,y:p.y},world:hit.point.clone(),station:id};}
 function hover(id,target){for(const b of boards.values()){b.hover=b.id===id?target:null;b.ghost.visible=false;if(b.hover?.enabled&&(target.id.startsWith('bet:')||target.id==='place')){const look=chipLooks.get(b.state.stake);b.ghost.material=look.ghostEdge;b.ghost.children[0].material=look.ghostFace;b.ghost.visible=true;b.ghost.position.set(target.point.x,target.point.y,.12);b.ghost.updateMatrix();}}}
 return {update,pick,hover,confirm(hit,camera,rect){if(!hit?.world)return null;camera.updateMatrixWorld();const p=hit.world.clone().project(camera);if(p.z<-1||p.z>1)return null;const current=pick(hit.station,rect.left+(p.x+1)*rect.width/2,rect.top+(1-p.y)*rect.height/2,camera,rect);return current?.id===hit.id&&current.enabled?{...current,point:hit.point}:null;},press(id,o,t){const b=boards.get(id);if(b&&o?.enabled){b.pressed=o.id;b.until=t+150;}},clear(){hover(null,null);},
  tick(t){for(const b of boards.values())for(const o of b.targets){if(o.flat)continue;o.mesh.position.z=o.baseZ+(o.selected?.016:0)-(b.pressed===o.id&&t<b.until?.016:0);const scale=(o.scale||1)*(b.hover?.id===o.id&&o.enabled?1.035:1);o.mesh.scale.setScalar(scale);o.mesh.updateMatrix();}},
  targets(id,camera,rect){const b=boards.get(id);if(!b)return[];root.updateMatrixWorld(true);camera.updateMatrixWorld();return b.targets.map(o=>{const world=o.mesh.getWorldPosition(new THREE.Vector3()),p=world.clone().project(camera);return {world:{x:world.x,y:world.y,z:world.z},id:o.id,label:o.label,enabled:o.enabled,x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2,inView:p.z>-1&&p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1};});},
  dispose(){for(const b of boards.values())root.remove(b.group);for(const r of resources)r.dispose();}
 };
}
