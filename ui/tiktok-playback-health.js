/* Observe the existing player. Never start, mute, seek or replace it. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ONETikTokPlaybackHealth=api.install(root);
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const ENDPOINT='https://one-tiktok-health.moulinanthony60.workers.dev/playback';
 function tracker(){
  let playing=false,last=null,advanced=0,elapsed=0,at=null,done=false;
  return (data,now)=>{
   if(done)return false;
   if(data.type==='onStateChange'){playing=data.value===1;last=null;at=null;advanced=0;elapsed=0;return false;}
   if(data.type==='onPlayerError'||data.type==='onError'){playing=false;last=null;at=null;advanced=0;elapsed=0;return false;}
   if(data.type!=='onCurrentTime'||!playing)return false;
   const time=data.value?.currentTime;
   if(typeof time!=='number'||!Number.isFinite(time)||time<0||!Number.isFinite(now)){last=null;at=null;advanced=0;elapsed=0;return false;}
   if(last!==null){
    const delta=time-last,wall=(now-at)/1000;
    // Seeking, looping, buffering and replayed messages cannot establish progress.
    if(delta<=0||wall<=0||wall>5||delta>Math.min(5,wall*2+.25)){advanced=0;elapsed=0;}
    else{advanced+=delta;elapsed+=wall;}
   }
   last=time;at=now;
   if(advanced>=2&&elapsed>=1.5){done=true;return true;}
   return false;
  };
 }
 function install(host){
  const doc=host.document,frames=new WeakMap(),sent=new Map();
  function reset(){doc.querySelectorAll('.vslide[data-platform="tiktok"] iframe').forEach(f=>frames.delete(f));}
  async function publish(id){
   host.ONETikTokAvailability?.notePlayback(id);
   const key=id,previous=sent.get(key),now=Date.now();
   if(previous&&now-previous<6*3600000)return;
   sent.set(key,now);
   try{
    const r=await host.fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoId:id,seconds:2}),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(5000)});
    if(!r.ok)sent.delete(key);
   }catch{sent.delete(key);}
   if(sent.size>500)sent.clear();
  }
  function message(event){
   const d=event.data;
   if(event.origin!=='https://www.tiktok.com'||!d||d['x-tiktok-player']!==true)return;
   const slide=doc.querySelector('.vslide[data-platform="tiktok"][data-active="1"]');
   const frame=slide?.querySelector('iframe');
   if(!frame||frame.contentWindow!==event.source){
    doc.querySelectorAll('.vslide[data-platform="tiktok"] iframe').forEach(f=>{if(f.contentWindow===event.source)frames.delete(f);});return;
   }
   if(doc.hidden||!doc.getElementById('vfeed')?.classList.contains('show')||slide.dataset.oneUserPaused==='1'){frames.delete(frame);return;}
   let id;try{const u=new URL(frame.src);if(u.origin!=='https://www.tiktok.com')return;id=u.pathname.match(/^\/player\/v1\/(\d{8,24})$/)?.[1];}catch{return;}
   if(!id)return;
   let read=frames.get(frame);if(!read){read=tracker();frames.set(frame,read);}
   if(read(d,host.performance.now()))publish(id);
  }
  host.addEventListener('message',message);
  doc.addEventListener('visibilitychange',reset);
  function updated(){host.loadTikTokLocal?.();host.ONETikTokPublic?.updateView?.();}
  host.addEventListener('one-tiktok-playback',updated);
  const timer=host.setInterval?.(()=>{if(!doc.hidden)host.ONETikTokAvailability?.refresh().then(updated);},60000);
  return {stop(){host.removeEventListener('message',message);doc.removeEventListener('visibilitychange',reset);host.removeEventListener('one-tiktok-playback',updated);host.clearInterval?.(timer);sent.clear();}};
 }
 return {tracker,install};
});
