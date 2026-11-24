/* Stable navigation, paused 2+1 preloading and isolated error recovery. */
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
  const preload=host.v124PreloadTikTokSlide,neighbors=host.v17TikTokNeighbors,fallback=host.v17TikTokFallback;
  let recovery=false;
  let clocks=new WeakMap();
  const retried=new WeakMap();
  function isolate(slide){
   if(!slide||slide.dataset.platform!=='tiktok'||slide.getAttribute('data-active')!=='1')return;
   if(!recovery)host.oneTTTrace?.('lecture isolée après erreur',slide,slide.querySelector('iframe'));
   recovery=true;clocks=new WeakMap();
   doc.querySelectorAll('.vslide[data-platform="tiktok"]').forEach(other=>{if(other!==slide)host.v17RestoreSlide(other);});
  }
  function surrounding(slide){return recovery?[]:neighbors.call(this,slide);}
  function warm(slide,autoplayMuted=false){
   const active=doc.querySelector('.vslide[data-active="1"]');
   if(recovery||!surrounding(active).includes(slide))return;
   return preload.call(this,slide,autoplayMuted);
  }
  function resetClocks(){clocks=new WeakMap();}
  function progress(event){
   const data=event.data;
   if(event.origin!=='https://www.tiktok.com'||data?.['x-tiktok-player']!==true)return;
   const active=doc.querySelector('.vslide[data-active="1"]'),frame=active?.querySelector('iframe');
   if(!frame||frame.contentWindow!==event.source)return;
   if(data.type!=='onCurrentTime'){
    if(['onStateChange','onPlayerError','onError'].includes(data.type))clocks.delete(frame);
    return;
   }
   if(!recovery)return;
   const time=data.value?.currentTime??data.value,previous=clocks.get(frame);
   if(doc.hidden||!doc.getElementById('vfeed')?.classList.contains('show')||active.dataset.oneUserPaused==='1'||active.dataset.ttPlaying!=='1'||typeof time!=='number'||!Number.isFinite(time)||time<0){clocks.delete(frame);return;}
   clocks.set(frame,time);
   if(previous===undefined||time<=previous||time-previous>5||active.dataset.ttTimeAdvanced!=='1'||frame.dataset.onePreloadError)return;
   // Resume warming on real visible progress, without waiting for health telemetry.
   recovery=false;host.v120PrewarmAround(active);
  }
  function failed(slide,reason='network'){
   // Legacy onError(1) is followed by the specific error in the phone trace.
   // Neither that abort nor a single INVALID_VIDEO should discard healthy neighbours.
   const code=slide?.querySelector('iframe')?.dataset.onePreloadError;
   if(reason==='slow'||(reason==='network'&&code!=='1'))isolate(slide);
   const result=fallback.call(this,slide,reason);
   if(reason==='invalid'&&slide?.getAttribute('data-active')==='1'){
    host.clearTimeout(slide._ttSkipTimer);
    const panel=slide.querySelector('.oneTikTokStatus'),message=panel?.querySelector('p');
    if(message)message.textContent='Cette vidéo est indisponible dans le lecteur TikTok.';
    // No automatic next-video request on failure; keep the explicit Next button.
    for(const button of panel?.querySelectorAll('button')||[])if(button.textContent==='Rester ici')button.remove();
   }
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
  host.v124PreloadTikTokSlide=warm;host.v17TikTokNeighbors=surrounding;host.v17TikTokFallback=failed;
  // The loader may arrive after the feed opens. Reuse only the bounded window.
  const current=doc.querySelector('.vslide[data-active="1"]');
  const currentError=current?.querySelector('iframe')?.dataset.onePreloadError;
  if(currentError&&!['1','1001'].includes(currentError))isolate(current);
  else if(current)host.v120PrewarmAround(current);
  host.addEventListener('message',progress);
  doc.addEventListener('visibilitychange',resetClocks);
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
   if(automatic&&slide?.dataset.platform==='tiktok')return;
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
   if(host.v124PreloadTikTokSlide===warm)host.v124PreloadTikTokSlide=preload;
   if(host.v17TikTokNeighbors===surrounding)host.v17TikTokNeighbors=neighbors;
   if(host.v17TikTokFallback===failed)host.v17TikTokFallback=fallback;
   host.removeEventListener?.('message',progress);
   doc.removeEventListener?.('visibilitychange',resetClocks);
   for(const type of ['pointerdown','wheel','keydown'])root?.removeEventListener(type,cancel);
   cancel();
  }};
 }
 return {install};
});
