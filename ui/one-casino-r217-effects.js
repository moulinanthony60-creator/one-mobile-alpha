import * as THREE from './three.module.js';
import {slotMotion,rouletteMotion,wheelOrder,TAU,mod,visibleCardTotal} from './one-casino-r217-motion.js';

export function buildCardTotals(top){
 const panels=['TOI','CROUPIER'].map((name,row)=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;const material=new THREE.MeshStandardMaterial({map,roughness:.8,emissive:'#ffffff',emissiveMap:map,emissiveIntensity:.18});const face=new THREE.Mesh(new THREE.PlaneGeometry(.76,.475),material);face.position.set(-1.40,.16,row===0?-.65:.65);face.rotation.set(-Math.PI/2,0,Math.PI);top.add(face);return {name,canvas,map,face,score:null};});
 return {resize(compact){for(const p of panels){p.face.position.x=compact?-.47:-1.40;p.face.scale.setScalar(compact?.56:1);p.face.updateMatrix();}},update(round){panels.forEach((p,row)=>{const s=visibleCardTotal(row===0?round.player:round.dealer);p.score=s;const g=p.canvas.getContext('2d');g.fillStyle='#12272b';g.fillRect(0,0,512,320);g.strokeStyle=s.bust?'#e58585':row===0?'#9bdec8':'#e4c576';g.lineWidth=12;g.strokeRect(6,6,500,308);g.textAlign='center';g.textBaseline='middle';g.fillStyle=row===0?'#9bdec8':'#e4c576';g.font='800 56px system-ui';g.fillText(p.name,256,61);g.fillStyle=s.bust?'#ffb0a7':'#fff9e8';g.font='900 112px system-ui';g.fillText(!s.visible?'—':s.total+(s.hidden?' + ?':''),256,164,468);g.font='600 40px system-ui';g.fillStyle='#d6e2de';g.fillText(!s.visible?'À DISTRIBUER':s.hidden?'CARTE CACHÉE':s.bust?'DÉPASSÉ':s.soft?'POINTS · AS = 11':'POINTS',256,260);p.map.needsUpdate=true;});},inspect:camera=>panels.map(p=>{const corners=camera?[[-.38,-.2375],[.38,-.2375],[.38,.2375],[-.38,.2375]].map(([x,y])=>p.face.localToWorld(new THREE.Vector3(x,y,0)).project(camera)):[];return {name:p.name,...p.score,inView:corners.length===4&&corners.every(v=>Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z>-1&&v.z<1)};})};
}

export function buildReels(group,symbolMats){
 const motion=slotMotion(),tiles=[],frames=[];
 let round=null,lastPositions=[],won=new Set(),lastActive=false,lastState=null;
 // Each visible piece is cropped to the window, then curved around the drum.
 // Moving the UVs with the geometry makes symbols scroll instead of flipping.
 for(let c=0;c<5;c++)for(let k=-1;k<=3;k++){
  const geometry=new THREE.PlaneGeometry(.235,.342,1,6),o=new THREE.Mesh(geometry,symbolMats[(c+Math.max(0,k))%8]);o.position.set((c-2)*.247,1.748,.52);o.userData.casinoAnimated=true;group.add(o);tiles.push({o,c,k});
 }
 const lineMaterial=new THREE.LineBasicMaterial({color:'#ffe093',transparent:true,opacity:.9,depthWrite:false,toneMapped:false});
 for(let c=0;c<5;c++)for(let r=0;r<3;r++){
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.114,.156,0),new THREE.Vector3(.114,.156,0),new THREE.Vector3(.114,-.156,0),new THREE.Vector3(-.114,-.156,0)]),line=new THREE.LineLoop(geo,lineMaterial);line.position.set((c-2)*.247,2.09-r*.342,.585);line.visible=false;line.raycast=()=>{};group.add(line);frames.push(line);
 }
 function update(t){const state=motion.sample(t);lastState=state;for(const {o,c,k}of tiles){const reel=state.reels[c],pos=reel.position;if(lastPositions[c]===pos)continue;
   const fraction=mod(pos,1),top=1.5-k+fraction,hi=Math.min(1.5,top),lo=Math.max(-1.5,top-1);o.visible=hi-lo>.00001;if(!o.visible)continue;
   o.material=symbolMats[reel.strip[mod(Math.floor(pos)+k,reel.strip.length)]];
   const positions=o.geometry.attributes.position,uv=o.geometry.attributes.uv;
   for(let row=0;row<=6;row++){const y=hi+(lo-hi)*row/6,z=.053*(1-(y/1.5)**2);for(let side=0;side<2;side++){const i=row*2+side;positions.setXYZ(i,(side-.5)*.235,y*.342,z);uv.setXY(i,side,1-(top-y));}}
   positions.needsUpdate=true;uv.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();
  }
  lastPositions=state.reels.map(r=>r.position);
  for(let i=0;i<frames.length;i++)frames[i].visible=!state.active&&won.has(i);
  lineMaterial.opacity=.72+Math.sin(t/260)*.16;
  lastActive=state.active;return state.active;
 }
 update(0);
 return {start(t){round=null;won.clear();motion.start(t);lastActive=true;},receive(r,t){if(!motion.receive(r.grid,t))return false;round=r;for(const win of r.wins||[])for(let c=0;c<win.count;c++)won.add(c*3+win.rows[c]);return true;},
  restore(r){round=r;won.clear();motion.restore(r?.grid);lastPositions=[];lastActive=false;update(0);},tick:update,
  inspect(){const state=lastState;return {type:'rolling-reels',active:lastActive,phase:state.phase,positions:state.reels.map(r=>r.position),phases:state.reels.map(r=>r.phase),stopped:state.reels.filter(r=>r.phase==='stopped').length,symbols:lastActive?null:motion.symbols(),winningCells:[...won]};}
 };
}

export function buildWheel(group,{mesh,mat,cylinder,texture,box}){
 // Horizontal bowl on a low, solid pedestal. Only the rotor turns.
 const mount=new THREE.Group();mount.position.set(0,.96,.35);group.add(mount);
 const surface=new THREE.Group();surface.position.set(0,-1.195,-.8);mount.add(surface);group=surface;
 // A lathed wooden bowl joins the pocket bed to the raised outer race.
 const bowl=new THREE.Mesh(new THREE.LatheGeometry([[.50,-.085],[.96,-.085],[1.075,-.055],[1.09,.043],[1.07,.075],[1.028,.075],[1.025,.045],[.895,.039],[.885,-.012],[.50,-.012],[.50,-.085]].map(([r,y])=>new THREE.Vector2(r,y)),96),mat('#49342c'));mount.add(bowl);
 const motion=rouletteMotion(),rotating=new THREE.Group();rotating.position.set(0,1.195,.8);group.add(rotating);
 const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
 const wheelMat=texture((ctx,W,H)=>{const cx=W/2,cy=H/2;for(let i=0;i<37;i++){const a=i*TAU/37-Math.PI/2,b=(i+1)*TAU/37-Math.PI/2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,W*.49,a,b);ctx.closePath();ctx.fillStyle=wheelOrder[i]===0?'#277349':reds.has(wheelOrder[i])?'#b63148':'#151c24';ctx.fill();ctx.save();ctx.translate(cx,cy);ctx.rotate((a+b)/2);ctx.fillStyle='#fff5dd';ctx.font='bold 25px system-ui';ctx.textAlign='center';ctx.fillText(String(wheelOrder[i]),W*.443,8);ctx.restore();}},1024,1024);
 const disc=mesh(new THREE.CircleGeometry(.89,96),wheelMat,0,0,0,rotating);disc.rotation.x=-Math.PI/2;
 // A stationary outer race and individual pockets give the ball a visible path.
 const race=mesh(new THREE.RingGeometry(.895,1.025,96),mat('#51382c'),0,1.24,.8,group);race.rotation.x=-Math.PI/2;
 for(const [radius,y,parent,z]of [[1.027,1.255,group,.8],[.902,1.235,group,.8],[.79,.018,rotating,0],[.545,.018,rotating,0]]){const ring=mesh(new THREE.TorusGeometry(radius,.007,8,96),mat('#c8a969'),0,y,z,parent);ring.rotation.x=Math.PI/2;}
 const dividers=new THREE.InstancedMesh(new THREE.BoxGeometry(.007,.014,.245),mat('#c8a969'),37),dummy=new THREE.Object3D();
 for(let i=0;i<37;i++){const a=i*TAU/37-Math.PI/2;dummy.position.set(Math.cos(a)*.668,.007,Math.sin(a)*.668);dummy.rotation.y=Math.PI/2-a;dummy.updateMatrix();dividers.setMatrixAt(i,dummy.matrix);}rotating.add(dividers);
 cylinder(.52,.024,'#583d30',0,.012,0,rotating);cylinder(.37,.045,'#735040',0,.035,0,rotating);cylinder(.045,.065,'#c8a969',0,.083,0,rotating);
 for(let i=0;i<4;i++){const spoke=box(.52,.018,.024,'#c8a969',0,.108,0,rotating);spoke.rotation.y=i*Math.PI/4;}
 const ball=mesh(new THREE.SphereGeometry(.042,20,12),new THREE.MeshStandardMaterial({color:'#fff8de',roughness:.22,metalness:.08}),0,1.249,.8,group);
 const marker=mesh(new THREE.RingGeometry(.57,.767,1,1,0,TAU/37*.8),new THREE.MeshBasicMaterial({color:'#ffd772',transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide}),0,.004,0,rotating);marker.rotation.x=-Math.PI/2;marker.visible=false;marker.raycast=()=>{};
 let last={...motion.sample(0)},number=null;
 function tick(t){last={...motion.sample(t)};rotating.rotation.y=-last.wheel;rotating.updateMatrix();ball.position.set(Math.cos(last.ball)*last.radius,last.height,.8+Math.sin(last.ball)*last.radius);ball.updateMatrix();marker.visible=!last.active&&number!==null;if(marker.visible){const a=(wheelOrder.indexOf(number)+.1)*TAU/37-Math.PI/2;marker.rotation.z=-a-TAU/37*.8;marker.updateMatrix();}return last.active;}
 tick(0);
 return {start(t){number=null;motion.start(t);},receive(r,t){if(!motion.receive(r.number,t))return false;number=r.number;return true;},restore(r){number=r?.number??null;motion.restore(number??0);tick(0);},tick,
  inspect:()=>({type:'wheel-and-ball',horizontal:Math.abs(new THREE.Vector3(0,1,0).transformDirection(mount.matrixWorld).y-1)<1e-6,worldHeight:ball.getWorldPosition(new THREE.Vector3()).y,...last,number:!last.active?number:null,pocket:!last.active?wheelOrder[mod(Math.floor(mod(last.ball-last.wheel+Math.PI/2,TAU)/TAU*37),37)]:null})};
}
