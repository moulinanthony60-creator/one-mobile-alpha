/* Temporary feed filtering. Any recent real playback wins over server failures. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{
  root.ONETikTokAvailability=api.create(root);
  // Keep the navigation fix separate from playback observation and account code.
  for(const src of ['ui/tiktok-navigation.js?v=5','ui/tiktok-preload.js?v=1','ui/tiktok-playback-health.js?v=1']){
   const script=root.document.createElement('script');script.src=src;script.async=false;
   root.document.head.append(script);
  }
 }
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const URL='https://raw.githubusercontent.com/moulinanthony60-creator/one-mobile-alpha/one-tiktok-health-data/hidden.json';
 const HEALTH='https://one-tiktok-health.moulinanthony60.workers.dev/health';
 const KEY='one_tiktok_confirmed_withdrawals_v2',PLAYED='one_tiktok_played_v1',WEEK=7*86400000;
 const validId=id=>typeof id==='string'&&/^\d{8,24}$/.test(id);
 function validate(data,now=Date.now()){
  const generated=Date.parse(data?.generatedAt);
  if(data?.version!==2||data.withdrawalPolicy!=='temporary-v1'||!Number.isFinite(generated)||generated>now+300000||now-generated>86400000||!Array.isArray(data.entries)||data.entries.length>5000)throw Error('Historique TikTok invalide.');
  const ids=new Map();
  for(const row of data.entries){
   const first=Date.parse(row?.firstUnavailableAt),last=Date.parse(row?.lastUnavailableAt),until=Date.parse(row?.hiddenUntil);
   if(!validId(row?.id)||row.reason!=='invalid_video'||row.code!==1001||row.confirmations!==3||!Number.isFinite(first)||!Number.isFinite(last)||last-first<12*3600000||last>generated||!Number.isFinite(until)||until!==last+86400000)throw Error('Observation TikTok invalide.');
   if(until>now)ids.set(row.id,row);
  }
  return ids;
 }
 function validateHealth(data,now=Date.now()){
  const generated=Date.parse(data?.generatedAt),started=Date.parse(data?.startedAt);
  if(data?.ok!==true||data.version!==1||data.policy!=='temporary-v1'||!Number.isFinite(generated)||Math.abs(now-generated)>300000||!Number.isFinite(started)||started>generated||!Array.isArray(data.entries)||data.entries.length>5000)throw Error('Collecte TikTok indisponible.');
  const played=new Map();
  for(const row of data.entries){
   const at=Date.parse(row?.playedAt);
   if(!validId(row?.id)||!Number.isFinite(at)||at>generated||at<started||generated-at>WEEK||played.has(row.id))throw Error('Lecture TikTok invalide.');
   played.set(row.id,at);
  }
  return {played,started};
 }
 function create(host){
  let data=null,hidden=new Map(),pending=null,loadedAt=0,healthAt=0,shared={played:new Map(),started:0};
  let local={};
  try{const saved=JSON.parse(host.localStorage.getItem(PLAYED));if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const [id,at]of Object.entries(saved).slice(0,5000))if(validId(id)&&typeof at==='number'&&at<=Date.now()&&Date.now()-at<WEEK)local[id]=at;}catch{}
  try{data=JSON.parse(host.localStorage.getItem(KEY));hidden=validate(data);}catch{data=null;}
  function isHidden(id){
   const now=Date.now(),row=hidden.get(String(id));
   // Offline/missing collection, stale policy, or successful playback: show the video.
   if(!row||!healthAt||now-healthAt>300000||Date.parse(row.hiddenUntil)<=now||now-Date.parse(data.generatedAt)>86400000)return false;
   if(Date.parse(row.firstUnavailableAt)<shared.started)return false;
   const played=Math.max(local[id]||0,shared.played.get(String(id))||0);
   return !(played&&now-played<WEEK);
  }
  function notePlayback(id){
   if(!validId(id))return;
   const now=Date.now();local[id]=now;
   local=Object.fromEntries(Object.entries(local).filter(([,at])=>now-at<WEEK).sort((a,b)=>b[1]-a[1]).slice(0,5000));
   try{host.localStorage.setItem(PLAYED,JSON.stringify(local));}catch{}
   if(host.CustomEvent)host.dispatchEvent?.(new host.CustomEvent('one-tiktok-playback',{detail:{id}}));
  }
  async function refresh(){
   if(pending)return pending;
   if(loadedAt&&Date.now()-loadedAt<60000)return;
   pending=(async()=>{
    try{
     const options=()=>({cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(5000)});
     const [response,evidence]=await Promise.all([host.fetch(URL,options()),host.fetch(HEALTH,options())]);
     if(!response.ok||!evidence.ok)throw Error('Collecte indisponible.');
     const [next,observed]=await Promise.all([response.json(),evidence.json()]);
     // An old empty manifest is safe while the first new bot run is pending.
     const ids=next?.version===1&&Array.isArray(next.entries)&&next.entries.length===0?new Map():validate(next);
     const nextHealth=validateHealth(observed);
     if(data&&Date.parse(next.generatedAt)<Date.parse(data.generatedAt))throw Error('Historique ancien.');
     data=next;hidden=ids;shared=nextHealth;loadedAt=healthAt=Date.now();
     try{host.localStorage.setItem(KEY,JSON.stringify(data));}catch{}
    }catch{healthAt=0;loadedAt=0;}
   })().finally(()=>{pending=null;});
   return pending;
  }
  return {isHidden,refresh,notePlayback};
 }
 return {validate,validateHealth,create};
});
