/* Keep one destination when stale scroll observations report an unavailable slot. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ONETikTokNavigation=api.install(root);
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function install(host){
  const doc=host.document,activate=host.v17ActivateSlide,step=host.v17StepSlide;
  if(typeof activate!=='function'||typeof step!=='function')return {stop(){}};
  let redirects=new WeakMap();
  const root=doc.getElementById('vfeedScroller');
  const cancel=()=>{redirects=new WeakMap();};
  const unavailable=slide=>!!slide&&host.v17TikTokIsUnavailable(host.v17ItemById(slide.dataset.id));
  function move(slide){
   if(!slide||!unavailable(slide))return activate.call(this,slide);
   const active=doc.querySelector('.vslide[data-active="1"]');
   let target=redirects.get(slide);
   if(!target?.isConnected||unavailable(target)){
    const slides=[...doc.querySelectorAll('.vslide')];
    const direction=active&&slides.indexOf(slide)<slides.indexOf(active)?-1:1;
    target=host.v17NextPlayableSlide(slide,direction);
    if(!target)return activate.call(this,slide);
    redirects.set(slide,target);
    host.oneTTTrace?.('redirection indisponible stabilisée',slide,null,{direction});
   }
   // Do not reverse direction just because the active ID now lies past the bad slot.
   if(active===target)return;
   target.scrollIntoView({behavior:'instant',block:'start'});
   return activate.call(this,target);
  }
  function advance(slide,direction,automatic=false){
   const target=host.v17NextPlayableSlide(slide,direction);
   if(!target||slide?.dataset.platform!=='tiktok')return step.call(this,slide,direction,automatic);
   // Intermediate failed slots may still occur in a queued observer callback.
   let skipped=direction<0?slide.previousElementSibling:slide.nextElementSibling;
   while(skipped?.classList.contains('vslide')&&skipped!==target){
    if(unavailable(skipped))redirects.set(skipped,target);
    skipped=direction<0?skipped.previousElementSibling:skipped.nextElementSibling;
   }
   // Existing step() uses "auto", which otherwise inherits CSS smooth scrolling.
   const previous=root?.style.scrollBehavior;
   if(root)root.style.scrollBehavior='auto';
   try{return step.call(this,slide,direction,automatic);}
   finally{if(root)root.style.scrollBehavior=previous||'';}
  }
  host.v17ActivateSlide=move;host.v17StepSlide=advance;
  for(const type of ['pointerdown','wheel','keydown'])root?.addEventListener(type,cancel,{passive:true});
  return {stop(){
   if(host.v17ActivateSlide===move)host.v17ActivateSlide=activate;
   if(host.v17StepSlide===advance)host.v17StepSlide=step;
   for(const type of ['pointerdown','wheel','keydown'])root?.removeEventListener(type,cancel);
   cancel();
  }};
 }
 return {install};
});
