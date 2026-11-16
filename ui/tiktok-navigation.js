/* Stable navigation, paused preloads and a single-player recovery after errors. */
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
  const playerUrl=host.v17PlayerUrl,preload=host.v124PreloadTikTokSlide,neighbors=host.v17TikTokNeighbors,fallback=host.v17TikTokFallback;
  let preloadDepth=0,recovery=false;
  const confirmed=new WeakSet(),retried=new WeakMap();
  function isolate(slide){
   if(!slide||slide.dataset.platform!=='tiktok'||slide.getAttribute('data-active')!=='1')return;
   if(!recovery)host.oneTTTrace?.('lecture isolée après erreur',slide,slide.querySelector('iframe'));
   recovery=true;
   const frame=slide.querySelector('iframe');if(frame)confirmed.delete(frame);
   doc.querySelectorAll('.vslide[data-platform="tiktok"]').forEach(other=>{if(other!==slide)host.v17RestoreSlide(other);});
  }
  function source(item){
   const src=playerUrl.call(this,item);
   if(!preloadDepth||item?.p!=='tiktok'||!src)return src;
   const url=new URL(src);url.searchParams.set('autoplay','0');
   return url.href;
  }
  function surrounding(slide){
   if(!recovery)return neighbors.call(this,slide);
   const frame=slide?.querySelector('iframe');
   if(!frame||!confirmed.has(frame)||doc.hidden||!doc.getElementById('vfeed')?.classList.contains('show'))return [];
   const next=host.v17NextPlayableSlide(slide,1);
   return next?.dataset.platform==='tiktok'?[next]:[];
  }
  function warm(slide){
   if(recovery){const active=doc.querySelector('.vslide[data-active="1"]');if(!surrounding(active).includes(slide))return;}
   preloadDepth++;
   try{return preload.call(this,slide);}finally{preloadDepth--;}
  }
  function failed(slide,reason='network'){
   if(reason==='network'||reason==='slow')isolate(slide);
   const result=fallback.call(this,slide,reason);
   if(!['network','slow'].includes(reason)||slide?.getAttribute('data-active')!=='1')return result;
   // The network/slow fallback puts retry first; do not depend on translated text.
   const retry=slide.querySelector('.oneTikTokStatus button');
   if(retry)retry.onclick=event=>{
    event.stopPropagation();
    const now=Date.now(),last=retried.get(slide);
    if(last!==undefined&&now-last<1500)return;
    retried.set(slide,now);isolate(slide);
    // An explicit retry creates one native player, then requests playback once on ready.
    host.v17TikTokNativePlayer(slide);
    const frame=slide.querySelector('iframe');if(frame)frame.dataset.onePlayPending='1';
    host.oneTTTrace?.('reprise lecteur isolé',slide,frame);
   };
   return result;
  }
  function played(event){
   if(!recovery||doc.hidden||!doc.getElementById('vfeed')?.classList.contains('show'))return;
   const slide=doc.querySelector('.vslide[data-active="1"]'),frame=slide?.querySelector('iframe');
   if(!frame||slide.dataset.oneUserPaused==='1'||slide.dataset.ttPlaying!=='1'||slide.dataset.ttTimeAdvanced!=='1')return;
   if(host.v17RawTikTokId(host.v17ItemById(slide.dataset.id))!==event.detail?.id)return;
   confirmed.add(frame);host.v120PrewarmAround(slide);
  }
  host.v17PlayerUrl=source;host.v124PreloadTikTokSlide=warm;host.v17TikTokNeighbors=surrounding;host.v17TikTokFallback=failed;
  host.addEventListener('one-tiktok-playback',played);
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
   if(host.v17PlayerUrl===source)host.v17PlayerUrl=playerUrl;
   if(host.v124PreloadTikTokSlide===warm)host.v124PreloadTikTokSlide=preload;
   if(host.v17TikTokNeighbors===surrounding)host.v17TikTokNeighbors=neighbors;
   if(host.v17TikTokFallback===failed)host.v17TikTokFallback=fallback;
   host.removeEventListener?.('one-tiktok-playback',played);
   for(const type of ['pointerdown','wheel','keydown'])root?.removeEventListener(type,cancel);
   cancel();
  }};
 }
 return {install};
});
