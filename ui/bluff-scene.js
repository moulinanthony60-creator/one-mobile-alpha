/* Original low-poly room, generated locally. WebGL 1, no external assets. */
(()=>{
 let stop=()=>{};
 window.addEventListener('one-game-before-render',()=>stop());
 window.addEventListener('pagehide',()=>stop());window.addEventListener('one-account-changed',()=>stop());window.addEventListener('one-party-state',e=>{if(!e.detail)stop();});
 window.ONEBluffScene=(host,players,pending)=>{
  stop();const canvas=document.createElement('canvas');canvas.className='bluff-canvas';canvas.setAttribute('aria-label','Salon de bluff en trois dimensions');host.prepend(canvas);
  const gl=canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'low-power'});
  if(!gl){canvas.remove();host.classList.add('bluff-fallback');return;}
  const vs=`attribute vec3 pos;attribute vec3 normal;attribute vec3 color;uniform float aspect;uniform float yaw;uniform float pull;varying vec3 shade;
  void main(){float c=cos(yaw),s=sin(yaw);vec3 p=vec3(c*pos.x+s*pos.z,pos.y,-s*pos.x+c*pos.z);float y=.954*(p.y-3.0)-.300*(p.z-7.0);float d=-.300*(p.y-3.0)-.954*(p.z-7.0)+pull;gl_Position=vec4(p.x*2.8/aspect,y*2.8,d*1.002-0.2002,d);float light=.32+.68*max(dot(normal,normalize(vec3(-.45,1.,.55))),0.);shade=color*light;}`;
  const fs=`precision mediump float;varying vec3 shade;void main(){gl_FragColor=vec4(shade,1.);}`;
  let observer,frame=0,dead=false;const shaders=[],buffers=[];
  stop=()=>{dead=true;cancelAnimationFrame(frame);observer?.disconnect();for(const b of buffers)gl.deleteBuffer(b);for(const s of shaders)gl.deleteShader(s);if(program)gl.deleteProgram(program);canvas.remove();};
  let program=null;
  try{
   const shader=(type,source)=>{const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader unavailable');return s;};
   program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Scene unavailable');gl.useProgram(program);
   const vertices=[];const tri=(a,b,c,n,col)=>{for(const p of [a,b,c])vertices.push(...p,...n,...col);};
   function box(x,y,z,w,h,d,col){const v=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];for(const [a,b,c,e,n]of [[0,1,2,3,[0,0,-1]],[4,7,6,5,[0,0,1]],[0,4,5,1,[0,-1,0]],[3,2,6,7,[0,1,0]],[0,3,7,4,[-1,0,0]],[1,5,6,2,[1,0,0]]]){tri(v[a],v[b],v[c],n,col);tri(v[a],v[c],v[e],n,col);}}
   function cylinder(x,y,z,r,h,col,segments=40){for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments,p=(t,dy)=>[x+r*Math.cos(t),y+dy,z+r*Math.sin(t)];tri([x,y+h,z],p(a,h),p(b,h),[0,1,0],col);const n=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)];tri(p(a,0),p(b,0),p(b,h),n,col);tri(p(a,0),p(b,h),p(a,h),n,col);}}
   function sphere(x,y,z,rx,ry,rz,col){const p=(a,b)=>[x+rx*Math.sin(a)*Math.cos(b),y+ry*Math.cos(a),z+rz*Math.sin(a)*Math.sin(b)];for(let i=0;i<8;i++)for(let j=0;j<12;j++){const a=i*Math.PI/8,b=j*Math.PI/6,c=(i+1)*Math.PI/8,d=(j+1)*Math.PI/6;const n=[Math.sin((a+c)/2)*Math.cos((b+d)/2),Math.cos((a+c)/2),Math.sin((a+c)/2)*Math.sin((b+d)/2)];tri(p(a,b),p(c,b),p(c,d),n,col);tri(p(a,b),p(c,d),p(a,d),n,col);}}
   // Floorboards, back wall, pillars, shelves, bottles and warm lamps.
   for(let i=-7;i<7;i++)box(i,-1.18,0,.96,.12,18,[.14+(i%2)*.015,.09,.075]);
   box(0,-1.1,-5.2,16,7,.2,[.115,.075,.09]);for(let i=-7;i<=7;i+=2)box(i,-1,-5,.13,6,.2,[.22,.12,.10]);
   for(const x of [-4,4]){box(x,.6,-4.8,2.4,.14,.7,[.23,.13,.09]);box(x,2,-4.8,2.4,.14,.7,[.23,.13,.09]);for(let k=0;k<5;k++){const xx=x-.8+k*.4;cylinder(xx,2.14,-4.65,.10,.38,[.07,.23+k*.015,.16],8);cylinder(xx,2.5,-4.65,.047,.16,[.13,.24,.16],8);}cylinder(x,3.7,-4.3,.45,.1,[.75,.42,.13]);sphere(x,3.6,-4.3,.15,.24,.15,[1,.70,.26]);}
   // Thick wooden tabletop, inset velvet and supporting pedestal.
   cylinder(0,-1.1,0,.65,1.1,[.18,.09,.065]);cylinder(0,0,0,2.55,.20,[.30,.14,.095],80);cylinder(0,.20,0,2.48,.025,[.54,.30,.16],80);cylinder(0,.226,0,2.28,.015,[.18,.24,.22],80);
   const rivals=players.filter(p=>!p.isYou);const angles=rivals.length===1?[Math.PI]:rivals.length===2?[-2.12,2.12]:[-1.97,Math.PI,1.97];
   const slots=[];rivals.forEach((p,i)=>{const angle=angles[i],x=Math.sin(angle)*2.9,z=Math.cos(angle)*2.9;const cloth=p.faults>=3?[.15,.15,.17]:[[.28,.19,.35],[.19,.29,.30],[.34,.20,.16]][i];
    box(x,-.5,z,.9,1.7,.45,[.16,.08,.06]);sphere(x,1.02,z,.47,.67,.29,cloth);sphere(x,1.98,z,.29,.36,.26,[.59,.39,.29]);cylinder(x,2.20,z,.36,.075,[.11,.09,.12],12);cylinder(x,2.26,z,.26,.22,cloth,12);
    for(const side of [-1,1]){sphere(x+side*.38,.83,z*.88,.17,.40,.22,cloth);sphere(x+side*.36,.41,z*.70,.18,.10,.22,[.59,.39,.29]);}
    for(let k=0;k<Math.min(p.count,5);k++)box(x+(k-2)*.10,.27,z*.72,.16,.014,.28,[.43,.24,.21]);
    slots.push({p,x,y:1.99,z:z+.27});
   });
   // First-person hands and facedown cards on the central pile.
   sphere(-1.10,.39,2.28,.21,.11,.37,[.60,.40,.29]);sphere(1.10,.39,2.28,.21,.11,.37,[.60,.40,.29]);
   for(let i=0;i<(pending?.count||0);i++)box(-.18+i*.14,.26+i*.014,.10,.36,.01,.53,[.57,.31,.18]);
   const buffer=gl.createBuffer();buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);['pos','normal','color'].forEach((name,i)=>{const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,i*12);});gl.enable(gl.DEPTH_TEST);
   const overlays=slots.map(({p})=>{const node=document.createElement('div');node.className='bluff-person'+(p.isTurn?' active':'')+(p.faults>=3?' eliminated':'');const face=document.createElement('div');face.className='cg-face';face.dataset.cameraSeat=p.accountId;const initial=document.createElement('span');initial.className='cg-avatar';initial.textContent=p.name.slice(0,1).toUpperCase();face.append(initial);const label=document.createElement('b');label.textContent=p.name;const info=document.createElement('small');info.textContent=p.faults>=3?'Éliminé':p.count+' cartes · '+p.faults+'/3 erreurs';node.append(face,label,info);host.append(node);return node;});
   let yaw=0;const aspectLoc=gl.getUniformLocation(program,'aspect'),yawLoc=gl.getUniformLocation(program,'yaw'),pullLoc=gl.getUniformLocation(program,'pull');
   function draw(){if(dead)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const ratio=Math.min(devicePixelRatio||1,1.5),aspect=w/h,pull=Math.max(0,(1.3-aspect)*5);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.038,.025,.047,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(aspectLoc,aspect);gl.uniform1f(yawLoc,yaw);gl.uniform1f(pullLoc,pull);gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);
    slots.forEach((s,i)=>{const x=Math.cos(yaw)*s.x+Math.sin(yaw)*s.z,z=-Math.sin(yaw)*s.x+Math.cos(yaw)*s.z,y=.954*(s.y-3)-.300*(z-7),d=-.300*(s.y-3)-.954*(z-7)+pull;const n=overlays[i];n.style.left=(.5+x*2.8/aspect/d/2)*w+'px';n.style.top=(.5-y*2.8/d/2)*h+'px';n.style.setProperty('--face',Math.max(28,.54*2.8/d*h/2)+'px');});
   }
   let drag=null;canvas.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,start:yaw};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw=Math.max(-.18,Math.min(.18,drag.start+(e.clientX-drag.x)/1200));cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();overlays.forEach(n=>{n.style.left='';n.style.top='';});host.classList.add('bluff-fallback');});observer=new ResizeObserver(draw);observer.observe(host);draw();
  }catch(e){stop();host.classList.add('bluff-fallback');const p=document.createElement('p');p.textContent='La 3D est indisponible sur cet appareil. Les commandes du jeu restent accessibles.';host.append(p);}
 };
})();
