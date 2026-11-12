/* Shared, reversible withdrawals. A timeout or a local player error cannot hide a link. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ONETikTokAvailability=api.create(root);
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const URL='https://raw.githubusercontent.com/moulinanthony60-creator/one-mobile-alpha/one-tiktok-health-data/hidden.json';
 const KEY='one_tiktok_confirmed_withdrawals_v1',MAX_AGE=7*86400000;
 function validate(data,now=Date.now()){
  const generated=Date.parse(data?.generatedAt);
  if(data?.version!==1||!Number.isFinite(generated)||generated>now+300000||now-generated>MAX_AGE||!Array.isArray(data.entries)||data.entries.length>5000)throw Error('Historique TikTok invalide.');
  const ids=new Set();
  for(const row of data.entries){
   const first=Date.parse(row?.firstUnavailableAt),last=Date.parse(row?.lastUnavailableAt);
   if(typeof row?.id!=='string'||!/^\d{8,24}$/.test(row.id)||row.reason!=='invalid_video'||row.code!==1001||row.confirmations!==3||!Number.isFinite(first)||!Number.isFinite(last)||last-first<12*3600000||last>generated)throw Error('Confirmation TikTok invalide.');
   ids.add(row.id);
  }
  return ids;
 }
 function create(host){
  let data=null,hidden=new Set(),pending=null,loadedAt=0;
  try{data=JSON.parse(host.localStorage.getItem(KEY));hidden=validate(data);}catch{data=null;}
  function isHidden(id){return !!data&&Date.now()-Date.parse(data.generatedAt)<=MAX_AGE&&hidden.has(String(id));}
  async function refresh(){
   if(pending)return pending;
   if(loadedAt&&Date.now()-loadedAt<300000)return;
   pending=(async()=>{
    try{
     const response=await host.fetch(URL,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(5000)});
     if(!response.ok)return;
     const next=await response.json(),ids=validate(next);
     if(data&&Date.parse(next.generatedAt)<Date.parse(data.generatedAt))return;
     data=next;hidden=ids;loadedAt=Date.now();
     try{host.localStorage.setItem(KEY,JSON.stringify(data));}catch{}
    }catch{/* Keep the previous valid list; a network failure is not video evidence. */}
   })().finally(()=>{pending=null;});
   return pending;
  }
  return {isHidden,refresh};
 }
 return {validate,create};
});
