import * as THREE from './three.module.js';
import {buildReels,buildWheel,buildCardTotals} from './one-casino-r217-effects.js';
import {drawCasinoSymbol,casinoSymbolNames} from './one-casino-r216-symbols.js';
import {buildPeople} from './one-casino-r212-people.js';
import {stations} from './one-casino-r212-layout.js';
export function buildCasino(root){
 const group=new THREE.Group();group.name='Casino ONE';root.add(group);const models=new Map(),materials=new Map(),symbolMats=[],cardMats=new Map();
 const mat=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.52,metalness:c==='#c8a969'?.65:.05}));return materials.get(c);};
 const mesh=(geo,m,x,y,z,parent=group)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o;},box=(w,h,d,c,x,y,z,parent)=>mesh(new THREE.BoxGeometry(w,h,d),mat(c),x,y,z,parent),cylinder=(r,h,c,x,y,z,parent)=>mesh(new THREE.CylinderGeometry(r,r,h,48),mat(c),x,y,z,parent);
 function texture(draw,w=512,h=256){const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return new THREE.MeshStandardMaterial({map,roughness:.7});}
 function label(text,w,h,x,y,z,parent=group,color='#ecd39a'){const m=texture((g,W,H)=>{g.fillStyle='#10232b';g.fillRect(0,0,W,H);g.strokeStyle='#c8a969';g.lineWidth=6;g.strokeRect(5,5,W-10,H-10);g.fillStyle=color;g.font='800 '+Math.min(H*.55,(W-30)/(.65*text.length))+'px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,H/2,W-30);},768,Math.round(768*h/w));return mesh(new THREE.PlaneGeometry(w,h),m,x,y,z,parent);}
 // Third room, joined by a walkable passage at the back of the main lounge.
 box(3.6,.14,4.4,'#263b3c',0,-.09,9.1);box(18,.14,14,'#102f32',0,-.09,18);
 for(const x of [-1.8,1.8])box(.18,4,4.2,'#213540',x,2,9.1);
 for(const x of [-9,9]){box(.2,4,14,'#15242e',x,2,18);for(let z=12;z<25;z+=2){box(.14,2.8,.06,'#c8a969',x+(x>0?-.12:.12),1.8,z);}}
 box(18,4,.2,'#15242e',0,2,25);for(const x of [-5.4,5.4])box(7.2,4,.2,'#15242e',x,2,11);
 box(18,.12,14,'#24323c',0,4.03,18);box(3.6,.12,4.3,'#24323c',0,4.03,9.05);
 for(const x of [-7.8,7.8])box(.035,.01,12,'#c8a969',x,.005,18);for(const z of [11.8,24.2])box(15.6,.01,.035,'#c8a969',0,.005,z);
 const carpet=texture((g,W,H)=>{g.fillStyle='#161c36';g.fillRect(0,0,W,H);for(const [x,y]of [[0,0],[W,H],[W/2,H/2]]){g.strokeStyle='#624365';g.lineWidth=13;g.beginPath();g.ellipse(x,y,140,94,-.35,0,Math.PI*2);g.stroke();g.strokeStyle='#b08954';g.lineWidth=4;g.beginPath();g.ellipse(x,y,125,78,-.35,.2,Math.PI*1.9);g.stroke();}for(const [x,y]of [[100,330],[360,120]]){g.save();g.translate(x,y);g.rotate(.5);g.fillStyle='#376270';g.fillRect(-13,-13,26,26);g.strokeStyle='#b29665';g.lineWidth=2;g.strokeRect(-19,-19,38,38);g.restore();}},512,512);carpet.map.wrapS=carpet.map.wrapT=THREE.RepeatWrapping;carpet.map.repeat.set(9,7);carpet.roughness=.97;const rug=mesh(new THREE.PlaneGeometry(17.9,13.9),carpet,0,.012,18);rug.rotation.x=-Math.PI/2;
 const neonCanvas=document.createElement('canvas');neonCanvas.width=1536;neonCanvas.height=320;const ng=neonCanvas.getContext('2d');ng.textAlign='center';ng.textBaseline='middle';ng.font='900 142px system-ui';ng.shadowColor='#b653ff';ng.shadowBlur=45;ng.strokeStyle='#a74bff';ng.lineWidth=17;ng.strokeText('ONE CASINO',768,160);ng.shadowBlur=22;ng.lineWidth=7;ng.strokeText('ONE CASINO',768,160);ng.fillStyle='#fff5df';ng.shadowBlur=12;ng.fillText('ONE CASINO',768,160);const neonMap=new THREE.CanvasTexture(neonCanvas);neonMap.colorSpace=THREE.SRGBColorSpace;
 const neonMat=new THREE.MeshBasicMaterial({map:neonMap,transparent:true,depthWrite:false,toneMapped:false});const entry=mesh(new THREE.PlaneGeometry(4.4,.93),neonMat,0,3.43,6.82);entry.rotation.y=Math.PI;
 const tubeMat=new THREE.MeshBasicMaterial({color:'#b868ff',toneMapped:false});for(const x of [-8.85,8.85])mesh(new THREE.BoxGeometry(.03,.035,13.6),tubeMat,x,3.75,18);mesh(new THREE.BoxGeometry(17.7,.035,.035),tubeMat,0,3.75,24.84);for(const x of [-1.7,1.7])mesh(new THREE.BoxGeometry(.035,2.7,.035),tubeMat,x,1.4,6.83);mesh(new THREE.BoxGeometry(3.43,.035,.035),tubeMat,0,2.75,6.83);
 const entranceLight=new THREE.PointLight('#b05aff',12,6,2);entranceLight.position.set(0,2.7,6.1);group.add(entranceLight);
 label('ONE CASINO · À TOI DE JOUER',8,.85,0,3.2,24.83).rotation.y=Math.PI;
 for(const z of [13,20]){const l=new THREE.PointLight('#ffe1a1',26,16,2);l.position.set(0,3.55,z);group.add(l);cylinder(.65,.1,'#c8a969',0,3.72,z);}
 for(let i=0;i<casinoSymbolNames.length;i++)symbolMats.push(texture((g,W,H)=>drawCasinoSymbol(g,W,H,i),320,416));
 function cardMaterial(value){if(cardMats.has(value))return cardMats.get(value);const m=texture((g,W,H)=>{g.fillStyle=value===null?'#35455e':'#fff9e8';g.fillRect(0,0,W,H);g.strokeStyle='#c6a86b';g.lineWidth=8;g.strokeRect(7,7,W-14,H-14);g.textAlign='center';g.textBaseline='middle';if(value===null){g.fillStyle='#dfc68d';g.font='bold 44px system-ui';g.fillText('ONE',W/2,H/2);}else{const suit=Math.floor(value/13),rank=['A','2','3','4','5','6','7','8','9','10','J','Q','K'][value%13];g.fillStyle=suit===1||suit===2?'#ba334a':'#233039';g.font='bold 72px Georgia';g.fillText(rank,W/2,H*.28);g.font='80px Georgia';g.fillText(['♠','♥','♦','♣'][suit],W/2,H*.68);}},256,360);cardMats.set(value,m);return m;}
 const cardGeo=new THREE.BoxGeometry(.43,.018,.63);
 for(const s of stations){const g=new THREE.Group();g.position.set(s.x,0,s.z);group.add(g);const model={station:s,group:g,busy:false,until:0,round:null,lastKey:'',parts:[],cardValues:[]};models.set(s.id,model);
  if(s.kind==='slots'){
   g.rotation.y=Math.PI;const glow=new THREE.MeshBasicMaterial({color:['#a664df','#55c79a','#efb352','#c15e9c'][Number(s.id.slice(-1))],toneMapped:false});for(const x of [-.62,.62])mesh(new THREE.BoxGeometry(.018,1.06,.022),glow,x,1.74,.512,g);box(1.48,.18,1.18,'#0d1824',0,.09,0,g);box(1.32,2.32,.88,'#293142',0,1.27,0,g);for(const x of [-.68,.68])box(.065,2.4,1,'#c8a969',x,1.4,0,g);
   box(1.32,.44,.98,'#162832',0,2.67,0,g);label(s.name.toUpperCase(),1.18,.32,0,2.66,.506,g);
   box(1.28,1.15,.05,'#0a0f18',0,1.74,.474,g);
   model.animation=buildReels(g,symbolMats);
   label('POINTS ONE',.85,.19,0,.7,.455,g);
   const lever=cylinder(.025,.58,'#c8a969',.79,1.42,0,g);mesh(new THREE.SphereGeometry(.09,12,8),mat('#963347'),.79,1.75,0,g);
  }else if(s.kind==='roulette'){
   cylinder(1.68,.14,'#49342c',0,.57,0,g);box(3.5,.10,2.8,'#49342c',0,.36,-1.35,g);for(const x of [-1.4,1.4])box(.15,.32,.15,'#c8a969',x,.16,-2.3,g);cylinder(1.56,.025,'#1b5644',0,.655,0,g);cylinder(.36,.50,'#26303b',0,.25,0,g);cylinder(.86,.18,'#26303b',0,.75,.35,g);cylinder(1.045,.04,'#c8a969',0,.865,.35,g);
   model.animation=buildWheel(g,{mesh,mat,cylinder,texture,box});
  }else{
   const top=new THREE.Group();top.position.y=.84;top.rotation.x=-.20;g.add(top);model.top=top;box(3.8,.14,2.55,'#51392b',0,0,0,top);box(3.62,.025,2.35,'#185548',0,.083,0,top);for(const x of [-1.45,1.45])for(const z of [-.85,.85]){const height=.76+Math.sin(.20)*z;box(.18,height,.18,'#18232a',x,height/2,z,g);}
   const text=label('BLACKJACK · ONE',2.25,.4,0,.104,0,top);text.rotation.set(-Math.PI/2,0,Math.PI);model.cards=new THREE.Group();top.add(model.cards);model.totals=buildCardTotals(top);
   for(const x of [-1.55,1.55])for(let n=0;n<5;n++)cylinder(.105,.025,n%2?'#cfb274':'#84354e',x,.13+n*.027,.75,top);
  }
 }
 function layoutCards(m,compact){m.compact=compact;m.totals.resize(compact);for(const card of m.cards.children){const {i,length}=card.userData;card.scale.setScalar(compact?.68:1);card.position.x=(compact?.25:.40)+(i-(length-1)/2)*Math.min(compact?.31:.48,(compact?.54:2.14)/Math.max(1,length-1));card.updateMatrix();}}
 function setRound(id,round){const m=models.get(id);if(!m||!round||round.kind!==m.station.kind)return;const changed=m.round?.id!==round.id;m.round=round;if(m.animation){if(m.busy){if(changed)m.accepted=m.animation.receive(round,performance.now())||m.accepted;}else if(changed)m.animation.restore(round);}if(m.station.kind==='blackjack'){const key=JSON.stringify([round.player,round.dealer]);if(key===m.lastKey)return;m.lastKey=key;m.cards.clear();m.cardValues=[...round.player,...round.dealer];m.totals.update(round);for(const [row,values]of [round.player,round.dealer].entries())values.forEach((value,i)=>{const face=cardMaterial(value),card=mesh(cardGeo,[mat('#e4d6b3'),mat('#e4d6b3'),face,mat('#35455e'),mat('#e4d6b3'),mat('#e4d6b3')], .40+(i-(values.length-1)/2)*Math.min(.48,2.14/Math.max(1,values.length-1)),.13+i*.002,row===0?-.65:.65,m.cards);card.userData={i,length:values.length};card.rotation.y=Math.PI+(i-(values.length-1)/2)*.035;});layoutCards(m,!!m.compact);}}
 for(const s of stations)if(s.kind==='blackjack')setRound(s.id,{kind:'blackjack',player:[null,null],dealer:[null,null]});
 const people=buildPeople(group);
 function resolve(m){for(const done of m.waiters||[])done();m.waiters=[];}
 return {group,models,people,aim:ray=>people.aim(ray),melee:(p,y,r)=>people.melee(p,y,r),setRound,
  setBusy(id,busy){const m=models.get(id);if(!m)return;if(busy&&!m.busy){m.previousRound=m.round;m.accepted=false;m.animation?.start(performance.now());}if(!busy&&m.busy){if(m.animation&&!m.complete)m.animation.restore(m.previousRound);resolve(m);}m.busy=busy;if(busy)m.complete=false;},
  finish(id,ok){const m=models.get(id);if(!m||!m.busy)return Promise.resolve();if(!ok||!m.animation){m.complete=!m.animation;return Promise.resolve();}if(!m.accepted&&m.round)m.accepted=m.animation.receive(m.round,performance.now());if(!m.accepted)return Promise.resolve();return new Promise(done=>{(m.waiters||=[]).push(done);});},
  tick(t,aspect=1){for(const m of models.values()){if(m.totals&&m.compact!==(aspect<.85))layoutCards(m,aspect<.85);if(m.animation){const active=m.animation.tick(t);if(m.busy&&m.accepted&&!active){m.complete=true;resolve(m);}}}},
  inspect:camera=>[...models.values()].map(m=>{const animation=m.animation?.inspect();return {id:m.station.id,kind:m.station.kind,busy:m.busy,round:m.round?.id||null,number:m.round?.number,cards:m.cardValues,totals:m.totals?.inspect(camera),tiles:m.station.kind==='slots'?15:0,symbols:m.station.kind==='slots'?animation.symbols?.map(i=>casinoSymbolNames[i]):undefined,animation};}),
  dispose(){for(const m of models.values())resolve(m);for(const m of [...symbolMats,...cardMats.values()]){m.map?.dispose();m.dispose();}cardGeo.dispose();}};
}
