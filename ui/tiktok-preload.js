/* Decode the first muted frames before a swipe, one neighbour at a time. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ONETikTokPreload=api.install(root);
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const ORIGIN='https://www.tiktok.com';
 function install(host){
  const doc=host.document,attempted=new WeakSet(),upgradedFor=new WeakSet();
  const scroller=doc.getElementById('vfeedScroller');
  let warming=null,timer=null,stopped=false;
  let approaching=null,lastScroll=scroller?.scrollTop??0;
  const active=()=>doc.querySelector('.vslide[data-platform="tiktok"][data-active="1"]');
  function finish(){
   host.clearTimeout(timer);timer=null;
   const frame=warming;warming=null;if(!frame)return;
   delete frame.dataset.oneWarming;
   // A swipe may promote this very frame. Never pause it after promotion.
   if(frame.isConnected&&frame.closest('.vslide')?.getAttribute('data-active')!=='1'){
    host.v17SendTikTok(frame,'mute');host.v17SendTikTok(frame,'pause');
    // A nonresponsive autoplay embed cannot acknowledge pause. Unmount it.
    if(frame.dataset.oneMutedPreview==='1'&&(frame.dataset.oneWarm!=='1'||frame.dataset.oneReady!=='1'))frame.remove();
   }
  }
  function canPreview(slide,frame){
   return !doc.hidden&&!host.navigator?.connection?.saveData&&doc.getElementById('vfeed')?.classList.contains('show')&&frame&&slide.dataset.oneUserPaused!=='1'&&!frame.dataset.onePreloadError;
  }
  function onScroll(){
   const top=scroller.scrollTop,movement=top-lastScroll;
   lastScroll=top;
   const current=active();
   if(!current||!movement)return;
   const bounds=current.getBoundingClientRect();
   const offset=scroller.getBoundingClientRect().top-bounds.top;
   const toward=Math.abs(offset)>=6&&Math.abs(offset)<bounds.height&&Math.sign(offset)===Math.sign(movement);
   const target=toward?(offset>0?current.nextElementSibling:current.previousElementSibling):null;
   const candidate=target?.querySelector('iframe');
   if(approaching&&approaching!==candidate){
    if(approaching===warming)finish();
    approaching=null;
   }
   if(!candidate||candidate===approaching||candidate.dataset.onePreload!=='1'||candidate.dataset.oneReady!=='1'||candidate.dataset.onePreloadError)return;
   if(!canPreview(current,current.querySelector('iframe'))||!host.v17TikTokNeighbors(current).includes(target))return;
   if(!mutedEmbed(candidate))return;
   if(warming&&warming!==candidate)finish();
   approaching=candidate;
   // Resume on the first visible part of the incoming slide. A held drag stays bounded.
   if(warming!==candidate)startMuted(candidate,650);
   else limitPlayback(650);
  }
  function mutedEmbed(frame){
   try{
    const url=new URL(frame.src);
    return url.origin===ORIGIN&&url.searchParams.get('muted')==='1';
   }catch{return false;}
  }
  function limitPlayback(timeout){
   host.clearTimeout(timer);
   timer=host.setTimeout(()=>{finish();pump();},timeout);
  }
  function startMuted(frame,timeout){
   attempted.add(frame);warming=frame;frame.dataset.oneWarming='1';
   host.v17SendTikTok(frame,'mute');
   limitPlayback(timeout);
   try{frame.contentWindow.postMessage({'x-tiktok-player':true,type:'play'},ORIGIN);}
   catch{finish();}
  }
  function pump(){
   if(stopped)return;
   const slide=active(),frame=slide?.querySelector('iframe');
   const neighbours=slide?host.v17TikTokNeighbors(slide):[];
   const eligible=canPreview(slide,frame);
   const usable=eligible&&slide.dataset.ttPlaying==='1'&&slide.dataset.ttTimeAdvanced==='1';
   const userSwiping=eligible&&warming===approaching;
   if(warming&&((!usable&&!userSwiping)||!warming.isConnected||!neighbours.includes(warming.closest('.vslide'))))finish();
   if(warming||!usable)return;
   const next=host.v17NextPlayableSlide(slide,1),next2=host.v17NextPlayableSlide(next,1);
   const preview=next?.querySelector('iframe');
   // Some autoplay=0 embeds finish loading without ever exposing the player API.
   // Upgrade only the immediate next item, once per foreground player.
   if(neighbours.includes(next)&&preview?.dataset.onePreload==='1'&&preview.dataset.oneLoaded==='1'&&preview.dataset.oneReady!=='1'&&!preview.dataset.onePreloadError&&!upgradedFor.has(frame)){
    upgradedFor.add(frame);preview.remove();
    const replacement=host.v124PreloadTikTokSlide(next,true);
    if(replacement){
     attempted.add(replacement);warming=replacement;
     replacement.dataset.oneMutedPreview='1';replacement.dataset.oneWarming='1';
     limitPlayback(4000);
     host.oneTTTrace?.('amorce silencieuse du prochain lecteur',next,replacement);
    }
    return;
   }
   const order=[next,next2,...neighbours];
   const target=order.find(s=>neighbours.includes(s)&&s?.querySelector('iframe')?.dataset.oneReady==='1'&&!s.querySelector('iframe').dataset.onePreloadError&&!attempted.has(s.querySelector('iframe')));
   const candidate=target?.querySelector('iframe');
   if(!candidate||candidate.dataset.onePreload!=='1')return;
   if(!mutedEmbed(candidate))return;
   startMuted(candidate,1200);
   host.oneTTTrace?.('amorce préchargement',target,candidate);
  }
  function message(event){
   const data=event.data;
   if(event.origin!==ORIGIN||data?.['x-tiktok-player']!==true)return;
   const frame=[...doc.querySelectorAll('.vslide[data-platform="tiktok"] iframe')].find(f=>f.contentWindow===event.source);
   if(!frame)return;
   const slide=frame.closest('.vslide');
   if(frame===warming&&slide.getAttribute('data-active')==='1')finish();
   if(frame===warming){
    const time=data.value?.currentTime??data.value;
    if(data.type==='onMute'&&data.value===false){host.v17SendTikTok(frame,'mute');finish();}
    else if(data.type==='onCurrentTime'&&typeof time==='number'&&Number.isFinite(time)&&time>.025){
     if(frame.dataset.oneWarm!=='1'){
      frame.dataset.oneWarm='1';
      host.v17ShowTikTokFrame(slide,frame);
      host.oneTTTrace?.('préchargement amorcé',slide,frame);
     }
     if(frame!==approaching)finish();
    }else if(data.type==='onError'||data.type==='onPlayerError')finish();
   }
   pump();
  }
  function visibility(){if(doc.hidden)finish();else pump();}
  scroller?.addEventListener('scroll',onScroll,{passive:true});
  host.addEventListener('message',message);doc.addEventListener('visibilitychange',visibility);host.addEventListener('pagehide',finish);
  pump();
  return {stop(){stopped=true;finish();scroller?.removeEventListener('scroll',onScroll);host.removeEventListener?.('message',message);doc.removeEventListener?.('visibilitychange',visibility);host.removeEventListener?.('pagehide',finish);}};
 }
 return {install};
});
