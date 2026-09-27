/* Expand the existing player in place, preserving the embedded video and sync. */
(()=>{
 'use strict';
 let active=null;
 const nativeElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const leaveNative=()=>{try{return Promise.resolve((document.exitFullscreen||document.webkitExitFullscreen)?.call(document)).catch(()=>{});}catch{return Promise.resolve();}};
 function restore(session){
  if(active!==session)return;
  active=null;
  session.player.classList.remove('ot-fullscreen-page','ot-fullscreen-active');
  session.close.remove();
  for(const [node,x,y]of session.ancestors){node.classList.remove('ot-fullscreen-ancestor');node.scrollLeft=x;node.scrollTop=y;}
  document.documentElement.classList.remove('ot-fullscreen-lock');
  window.scrollTo(session.x,session.y);
  session.trigger?.setAttribute('aria-expanded','false');
  if(session.trigger?.isConnected)session.trigger.focus({preventScroll:true});
 }
 function exit(player){
  const session=active;if(!session||(player&&player!==session.player))return;
  restore(session);
  if(nativeElement()===session.player)leaveNative();
 }
 async function toggle(player,trigger){
  if(active?.player===player){exit(player);return;}
  if(!player?.isConnected)return;
  if(active)exit();
  const close=document.createElement('button');close.type='button';close.className='ot-fullscreen-close';close.textContent='× Quitter le plein écran';
  const session={player,trigger,close,ancestors:[],x:window.scrollX,y:window.scrollY,native:false};active=session;
  for(let node=player.parentElement;node;node=node.parentElement){session.ancestors.push([node,node.scrollLeft,node.scrollTop]);node.classList.add('ot-fullscreen-ancestor');}
  close.onclick=()=>exit(player);player.append(close);player.classList.add('ot-fullscreen-active','ot-fullscreen-page');
  document.documentElement.classList.add('ot-fullscreen-lock');trigger?.setAttribute('aria-expanded','true');close.focus({preventScroll:true});
  // The in-page mode also covers phones that cannot fullscreen an embedded player.
  const request=player.requestFullscreen||player.webkitRequestFullscreen;
  if(!request)return;
  try{
   await request.call(player);
   if(active!==session){if(nativeElement()===player)await leaveNative();return;}
   if(nativeElement()===player){session.native=true;player.classList.remove('ot-fullscreen-page');}
  }catch{ /* Keep the expanded player and its visible exit button. */ }
 }
 function changed(){if(active&&nativeElement()===active.player){active.native=true;active.player.classList.remove('ot-fullscreen-page');}else if(active?.native)restore(active);}
 document.addEventListener('fullscreenchange',changed);document.addEventListener('webkitfullscreenchange',changed);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();exit();}});
 window.addEventListener('pagehide',()=>exit());
 window.ONETogetherFullscreen={toggle,exit};
})();
