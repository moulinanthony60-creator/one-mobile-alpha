/* Decode the first muted frames before a swipe, one neighbour at a time. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ONETikTokPreload=api.install(root);
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const ORIGIN='https://www.tiktok.com';
 function install(host){
  const doc=host.document,attempted=new WeakSet();let warming=null,timer=null,stopped=false;
  const active=()=>doc.querySelector('.vslide[data-platform="tiktok"][data-active="1"]');
  function finish(){
   host.clearTimeout(timer);timer=null;
   const frame=warming;warming=null;if(!frame)return;
   delete frame.dataset.oneWarming;
   // A swipe may promote this very frame. Never pause it after promotion.
   if(frame.isConnected&&frame.closest('.vslide')?.getAttribute('data-active')!=='1'){
    host.v17SendTikTok(frame,'mute');host.v17SendTikTok(frame,'pause');
   }
  }
  function pump(){
   if(stopped)return;
   const slide=active(),frame=slide?.querySelector('iframe');
   const neighbours=slide?host.v17TikTokNeighbors(slide):[];
   const usable=!doc.hidden&&doc.getElementById('vfeed')?.classList.contains('show')&&frame&&slide.dataset.ttPlaying==='1'&&slide.dataset.ttTimeAdvanced==='1'&&slide.dataset.oneUserPaused!=='1'&&!frame.dataset.onePreloadError;
   if(warming&&(!usable||!warming.isConnected||!neighbours.includes(warming.closest('.vslide'))))finish();
   if(warming||!usable)return;
   const next=host.v17NextPlayableSlide(slide,1),next2=host.v17NextPlayableSlide(next,1);
   const order=[next,next2,...neighbours];
   const target=order.find(s=>neighbours.includes(s)&&s?.querySelector('iframe')?.dataset.oneReady==='1'&&!s.querySelector('iframe').dataset.onePreloadError&&!attempted.has(s.querySelector('iframe')));
   const candidate=target?.querySelector('iframe');
   if(!candidate||candidate.dataset.onePreload!=='1')return;
   let url;try{url=new URL(candidate.src);}catch{return;}
   if(url.origin!==ORIGIN||url.searchParams.get('muted')!=='1')return;
   attempted.add(candidate);warming=candidate;candidate.dataset.oneWarming='1';
   host.v17SendTikTok(candidate,'mute');
   // The normal command helper blocks background play. This one bounded path
   // permits it only for an existing muted neighbour in the live 2+1 window.
   timer=host.setTimeout(()=>{finish();pump();},1200);
   try{candidate.contentWindow.postMessage({'x-tiktok-player':true,type:'play'},ORIGIN);}
   catch{finish();pump();}
   host.oneTTTrace?.('amorce préchargement',target,candidate);
  }
  function message(event){
   const data=event.data;
   if(event.origin!==ORIGIN||data?.['x-tiktok-player']!==true)return;
   const slide=[...doc.querySelectorAll('.vslide[data-platform="tiktok"]')].find(s=>s.querySelector('iframe')?.contentWindow===event.source);
   const frame=slide?.querySelector('iframe');if(!frame)return;
   if(frame===warming&&slide.getAttribute('data-active')==='1')finish();
   if(frame===warming){
    const time=data.value?.currentTime??data.value;
    if((data.type==='onCurrentTime'&&typeof time==='number'&&Number.isFinite(time)&&time>.025)||data.type==='onError'||data.type==='onPlayerError'){
     if(data.type==='onCurrentTime'){frame.dataset.oneWarm='1';host.oneTTTrace?.('préchargement amorcé',slide,frame);}
     finish();
    }
   }
   pump();
  }
  function visibility(){if(doc.hidden)finish();else pump();}
  host.addEventListener('message',message);doc.addEventListener('visibilitychange',visibility);host.addEventListener('pagehide',finish);
  pump();
  return {stop(){stopped=true;finish();host.removeEventListener?.('message',message);doc.removeEventListener?.('visibilitychange',visibility);host.removeEventListener?.('pagehide',finish);}};
 }
 return {install};
});
