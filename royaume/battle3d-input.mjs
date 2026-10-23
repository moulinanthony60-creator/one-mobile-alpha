// Pointer gestures are kept separate from combat so dragging and zooming cannot deploy.
export function bindBattleInput(canvas,{enabled,tap,pan,zoom,hold,holdKey=()=>null,schedule=setTimeout,cancelTimer=clearTimeout}) {
  const pointers=new Map(),listeners=[];
  let gesture=false,pinchDistance=0,holdTimer=null;
  const stopHold=()=>{if(holdTimer!==null)cancelTimer(holdTimer);holdTimer=null;};
  const on=(type,callback,options)=>{canvas.addEventListener(type,callback,options);listeners.push([type,callback,options]);};
  const distance=()=>{const [a,b]=[...pointers.values()];return b?Math.hypot(a.x-b.x,a.y-b.y):0;};
  const clear=()=>{stopHold();pointers.clear();gesture=false;pinchDistance=0;};
  on('pointerdown',event=>{
    if(!enabled()||event.button!==0)return;
    canvas.setPointerCapture(event.pointerId);
    const pointer={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,held:false,key:holdKey()};
    pointers.set(event.pointerId,pointer);
    if(pointers.size>1){stopHold();gesture=true;pinchDistance=distance();for(const p of pointers.values())p.moved=true;}
    else if(hold&&pointer.key){
      const repeat=()=>{holdTimer=null;if(!enabled()||gesture||pointer.moved||pointers.size!==1||!pointers.has(event.pointerId))return;pointer.held=true;if(hold(pointer.x,pointer.y,pointer.key)!==false)holdTimer=schedule(repeat,160);};
      holdTimer=schedule(repeat,360);
    }
  });
  on('pointermove',event=>{
    const p=pointers.get(event.pointerId);if(!p)return;
    if(!enabled()){clear();return;}
    const dx=event.clientX-p.x,dy=event.clientY-p.y;p.x=event.clientX;p.y=event.clientY;
    if(Math.hypot(p.x-p.startX,p.y-p.startY)>9){p.moved=true;stopHold();}
    if(pointers.size===1&&p.moved)pan(dx,dy);
    if(pointers.size>=2){const next=distance();if(pinchDistance>5&&next>5)zoom(next/pinchDistance);pinchDistance=next;}
  });
  on('pointerup',event=>{
    const p=pointers.get(event.pointerId);if(!p)return;
    stopHold();pointers.delete(event.pointerId);
    if(enabled()&&!gesture&&!p.moved&&!p.held&&Math.hypot(event.clientX-p.startX,event.clientY-p.startY)<=9)tap(event.clientX,event.clientY);
    if(!pointers.size){gesture=false;pinchDistance=0;}
  });
  const cancel=event=>{stopHold();pointers.delete(event.pointerId);if(!pointers.size){gesture=false;pinchDistance=0;}};
  on('pointercancel',cancel);on('lostpointercapture',cancel);
  on('wheel',event=>{if(!enabled())return;event.preventDefault();zoom(Math.exp(-event.deltaY*.0015));},{passive:false});
  return {clear,dispose(){clear();for(const args of listeners)canvas.removeEventListener(...args);}};
}
