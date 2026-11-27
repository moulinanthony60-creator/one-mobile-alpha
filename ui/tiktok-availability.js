/* Temporary feed filtering. Any recent real playback wins over server failures. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{
  root.ONETikTokAvailability=api.create(root);
  // Keep the navigation fix separate from playback observation and account code.
  for(const src of ['ui/tiktok-navigation.js?v=6','ui/tiktok-preload.js?v=2','ui/tiktok-playback-health.js?v=1']){
   const script=root.document.createElement('script');script.src=src;script.async=false;
   root.document.head.append(script);
  }
 }
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const URL='https://raw.githubusercontent.com/moulinanthony60-creator/one-mobile-alpha/one-tiktok-health-data/hidden.json';
 const HEALTH='https://one-tiktok-health.moulinanthony60.workers.dev/health';
 const KEY='one_tiktok_confirmed_withdrawals_v2',PLAYED='one_tiktok_played_v1',WEEK=7*86400000;
 // Retraits du fil ONE approuvés après le contrôle du 27 novembre 2026 (erreur TikTok 1001).
 const removedFromFeed=new Set([
  '7652253834600779040','7670826762649062688','7672419749241916693','7672435766714174740',
  '7673982108582284577','7674918395229375752','7677519896552525074','7677950830376422678',
  '7678059833752341793','7679907062259748128','7680260439833365793','7681379916989943073',
  '7681645129429536032','7682186105319460128','7682775104677301526','7683617946207374625',
  '7684241117046689056','7684375468610571553','7685424722628087073','7686962788157197575',
  '7687746528340872480','7688401804228414752','7688428415728307489','7688465072326315286',
  '7688495153790684448','7688755282025008417','7688847381172915489','7689053481671445793',
  '7689109053670165793','7689304880837561633','7689413279881514272','7689418306054343968',
  '7689435689494039839','7689514106843368737','7689610371652406560','7689829485851561249',
  '7689899459546909985','7689960131257240864','7689973993180368158','7690150729482308897',
  '7690178798788168993','7690230524358479107','7690234911730437408','7690275454791568673',
  '7690380336601074976','7690544184847011104','7690801437915352321','7690823966100852000',
  '7690862059076078880','7690870901578976545','7690913773367856406','7690923603717573921',
  '7690933051714587936','7691011481046961441','7691015368042745121','7691162310521490720',
  '7691166401003916576','7691185218287340833','7691304072611204374','7691347557800316192',
  '7691356429738921248','7691383913415019809','7691427851492445473','7691527004029488416',
  '7691594194447568160','7691594264949607713','7691617249177668896','7691629921868811553',
  '7691639028768066848','7691642311414943008','7691660415633198369','7691661615770438945',
  '7691667551012539680','7691667737713691937','7691667847214271776','7691694433464536352',
  '7691696081012378888','7691714609111223585','7691748383316348192','7691800306044259617',
  '7691977328842362142','7691984514389675296','7692063569646538017','7692108458715303201',
  '7692115414922431777','7692140660622642464','7692141690542427424','7692159448978115862',
  '7692159458138459424','7692175729362095393','7692309754953190688','7692318652493827360',
  '7692370312503119136','7692372616878869792','7692527926914321682','7692563872405851425',
  '7692705440714460449','7692741856181931296','7692893222007295264','7696328788434521374',
  '7701382172208385302','7702461073361767712','7708876580608609568',
 ]);
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
   if(removedFromFeed.has(String(id)))return true;
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
