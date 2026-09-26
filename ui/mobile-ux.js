(()=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='ui/mobile-ux.css?v=117ac';document.head.append(css);
 // VisualViewport follows the keyboard on browsers whose layout viewport does not shrink.
 let frame=0;
 const update=()=>{frame=0;const v=window.visualViewport,s=document.documentElement.style;
  s.setProperty('--one-view-height',(v?.height||innerHeight)+'px');
  s.setProperty('--one-view-top',(v?.offsetTop||0)+'px');
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 // Give every native control immediate feedback; native click remains the only action.
 let pressed=null;
 const clearPress=()=>{pressed?.node.removeAttribute('data-one-pressed');pressed=null;};
 document.addEventListener('pointerdown',e=>{
  clearPress();if(e.button!==0||e.isPrimary===false)return;
  const node=e.target.closest?.('button,a[href],summary,[role="button"],[role="switch"]');
  if(!node||node.matches(':disabled,[aria-disabled="true"],[aria-busy="true"]'))return;
  pressed={node,id:e.pointerId,x:e.clientX,y:e.clientY};node.setAttribute('data-one-pressed','true');
 },{passive:true});
 document.addEventListener('pointermove',e=>{if(pressed&&e.pointerId===pressed.id&&Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y)>10)clearPress();},{passive:true});
 for(const type of ['pointerup','pointercancel'])document.addEventListener(type,clearPress,{passive:true});
 document.addEventListener('scroll',clearPress,{passive:true,capture:true});window.addEventListener('blur',clearPress);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearPress();});
 window.visualViewport?.addEventListener('resize',schedule);
 window.visualViewport?.addEventListener('scroll',schedule);
 window.addEventListener('resize',schedule);update();
})();
