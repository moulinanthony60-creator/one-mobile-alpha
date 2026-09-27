/* Shared by the installed app and its service worker. No account tokens are stored. */
(()=>{
 'use strict';
 const TTL=7*86400000;
 function links(text){
  const found=new Map();
  for(const raw of String(text).slice(0,40000).match(/https?:\/\/[^\s<>"']+/gi)||[]){
   try{
    const u=new URL(raw.replace(/[.,;!?)\]}]+$/g,''));
    if(u.protocol!=='https:'||u.username||u.password||u.port||!['tiktok.com','www.tiktok.com','m.tiktok.com','vm.tiktok.com','vt.tiktok.com'].includes(u.hostname))continue;
    const id=u.pathname.match(/^\/@[^/]+\/video\/(\d{8,24})\/?$/)?.[1]||u.pathname.match(/^\/player\/v1\/(\d{8,24})\/?$/)?.[1];
    if(!id&&(!['vm.tiktok.com','vt.tiktok.com'].includes(u.hostname)||!/^\/[\w-]+\/?$/.test(u.pathname)))continue;
    u.search='';u.hash='';if(u.href.length>2048)continue;
    found.set(id||u.href,u.href);
   }catch{}
  }
  if(found.size>20)throw Error('Partage jusqu’à 20 vidéos à la fois.');
  return [...found.values()];
 }
 function transaction(mode,run){return new Promise((resolve,reject)=>{
  const open=indexedDB.open('one-tiktok-incoming',1);
  open.onupgradeneeded=()=>open.result.createObjectStore('shares',{keyPath:'id'});
  open.onerror=()=>reject(open.error);
  open.onsuccess=()=>{
   const db=open.result,tx=db.transaction('shares',mode);let value,failure;
   tx.oncomplete=()=>{db.close();resolve(value);};
   tx.onabort=tx.onerror=()=>{db.close();reject(failure||tx.error||Error('Impossible de conserver le partage.'));};
   try{run(tx.objectStore('shares'),v=>{value=v;},e=>{failure=e;tx.abort();});}catch(e){failure=e;tx.abort();}
  };
 });}
 const get=id=>transaction('readonly',(store,done)=>{const r=store.get(id);r.onsuccess=()=>done(r.result);});
 const mutate=(id,change)=>transaction('readwrite',(store,done,fail)=>{
  const r=store.get(id);r.onsuccess=()=>{try{const record=r.result;if(!record||Date.now()-record.createdAt>TTL)throw Error('Ce partage a expiré. Partage à nouveau la vidéo depuis TikTok.');change(record);store.put(record);done(record);}catch(e){fail(e);}};
 });
 async function receive(text){
  const urls=links(text);if(!urls.length)throw Error('Ce partage ne contient pas de lien de vidéo TikTok publique.');
  const record={id:crypto.randomUUID(),createdAt:Date.now(),urls,owner:'',added:0,duplicates:0,lock:null};
  await transaction('readwrite',(store,done,fail)=>{
   const r=store.getAll();r.onsuccess=()=>{
    const active=r.result.filter(v=>Date.now()-v.createdAt<=TTL&&v.urls.length);
    for(const v of r.result)if(Date.now()-v.createdAt>TTL||!v.urls.length)store.delete(v.id);
    if(active.length>=20){fail(Error('Trop de partages en attente. Termine les ajouts dans ONE avant de réessayer.'));return;}
    store.put(record);done(record);
   };
  });return record.id;
 }
 // A receipt is bound to the first signed-in account; another tab cannot drain it concurrently.
 async function drain(id,{account,publish,store={get,mutate},now=()=>Date.now()}){
  const start=account();if(!start?.id||!start.token)return {state:'login'};
  const nonce=crypto.randomUUID();
  let record=await store.mutate(id,r=>{
   if(r.owner&&r.owner!==start.id)throw Error('Reconnecte le compte ONE qui a commencé ce partage pour le terminer.');
   if(r.lock&&now()-r.lock.at<60000)throw Error('Ce partage est déjà en cours. Patiente un instant puis réessaie.');
   r.owner=start.id;r.lock={nonce,at:now()};
  });
  try{
   while(record.urls.length){
    const current=account();if(current?.id!==start.id||current.token!==start.token)return {state:'account'};
    const url=record.urls[0],result=await publish(url,start.token);
    record=await store.mutate(id,r=>{
     if(r.lock?.nonce!==nonce)throw Error('Le partage a repris dans une autre fenêtre.');
     r.urls=r.urls.filter(v=>v!==url);result.added?r.added++:r.duplicates++;r.lock.at=now();
    });
   }
   return {state:'done',added:record.added,duplicates:record.duplicates};
  }finally{await store.mutate(id,r=>{if(r.lock?.nonce===nonce)r.lock=null;});}
 }
 globalThis.ONETikTokShareCore={links,receive,get,mutate,drain};
})();
