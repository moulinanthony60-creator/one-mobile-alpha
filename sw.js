importScripts('./ui/tiktok-share-core.js?v=118c2');
const CACHE='one-mobile-alpha-lobby-world-casino-v75';
const CORE=['./ui/one-calls-v22.css?v=appels-sonnerie-v56','./ui/one-visual-v20.css?v=appels-sonnerie-v56','./ui/one-game-loader.js?v=house-layout-v61','./ui/one-three17-game.js?v=house-layout-v61','./ui/one-media-text.js?v=appels-sonnerie-v56','./ui/one-home-camera.css?v=appels-sonnerie-v56','./ui/one-home-camera.js?v=appels-sonnerie-v56','./ui/one-sharing.js?v=appels-sonnerie-v56','./ui/one-chat-v8.js?v=appels-sonnerie-v56','./ui/one-chat-v8.css?v=appels-sonnerie-v56','./ui/one-shop.js?v=appels-sonnerie-v56','./ui/one-private-communications.js?v=appels-sonnerie-v56','./ui/one-discussions.css?v=appels-sonnerie-v56','./ui/one-desktop-pages.js?v=appels-sonnerie-v56','./ui/one-shop.css?v=appels-sonnerie-v56','./ui/shop-assets/monitor.svg','./ui/shop-assets/audio.svg','./ui/shop-assets/gaming.svg','./ui/shop-assets/pc.svg','./ui/shop-assets/phone.svg','./ui/shop-assets/accessory.svg','./ui/shop-assets/product.svg','./ui/three17-r46-render.js?v=appels-v56','./ui/three17-r46-warmup.js?v=appels-v56','./ui/one-lobby-r46-screen.js?v=appels-v56','./ui/three17-r44-render.js?v=appels-v56','./ui/three17-r44-avatar.js?v=appels-v56','./ui/one-lobby-r46-room.js?v=lobby-world-casino-v75','./ui/one-lobby-r46.js?v=lobby-world-casino-v75','./ui/three17-r46-coop.js?v=lobby-world-casino-v75','./ui/three17-r46-world.js?v=appels-v56','./ui/three17-r41-furniture.js?v=appels-v56','./ui/three17-r44-visuals.js?v=appels-v56','./ui/three17-r41-scares.js?v=appels-v56','./ui/three17-r41-furniture.js?v=appels-v56','./ui/three17-parasite-r41.js?v=appels-v56','./ui/bluff-cinematic.js?v=appels-v56','./317.html','./ui/three17-r41-furniture.js','./ui/three17-parasite-r41.js','./ui/three17-r41-audio.js','./ui/three17-r41-scares.js','./ui/three17-r44-visuals.js','./ui/three17-parasite-r23.js','./ui/GLTFLoader.js','./ui/BufferGeometryUtils.js','./ui/SkeletonUtils.js','./assets/317/parasite-starkie-r23.glb','./ui/one-slot-symbols-real.png?v=014117','./ui/three.module.js','./ui/three.core.js','./ui/tiktok-share-core.js?v=118c2','./ui/tiktok-share.js?v=118c2','./ui/tiktok-share.css?v=118c2','./ui/tiktok-public.js?v=118c1','./ui/tiktok-public.css?v=118c1','./ui/header-polish.js?v=appels-sonnerie-v56','./ui/header-polish.css?v=118c2','./ui/social-hub.css?v=118s1','./ui/social-hub.js?v=118s1','./ui/social-account.js?v=118s1','./ui/social-push.js?v=118s1','./ui/friends.js?v=appels-sonnerie-v56','./ui/friends.css?v=118s1','./ui/notifications.js?v=118s1','./ui/party.js?v=118s1','./ui/together-fullscreen.js?v=118t5','./ui/together-salon.js?v=118t5','./ui/together-catalog.js?v=118c1','./ui/together-browser.js?v=118c1','./ui/together.js?v=118t5','./ui/together-player.js?v=118t5','./ui/together.css?v=118t5','./ui/boutique.js?v=118b1','./ui/boutique-catalog.js?v=118b1','./ui/boutique.css?v=118b1','./ui/boutique-catalog.json?v=118b1','./ui/card-back-bluff-118.svg','./ui/card-back-poker-118.svg','./ui/card-back-blackjack-118.svg','./ui/card-back-trio-118.svg','./ui/card-back-douze-118.svg','./ui/card-back-colors-118.svg','./ui/game-finish-118.css?v=118r2',
  './ui/casino-finish-118.css?v=118r2','./ui/party-collection.css?v=118r2','./ui/salon-polish.css?v=118r2','./ui/blackjack-table-118.png','./ui/party-blackjack.js?v=118r2','./ui/party-blackjack.css?v=118r2','./ui/party-poker.js?v=118r2','./ui/poker-polish.css?v=118r2','./ui/table-themes-117af.js?v=118r2','./ui/table-themes-117af.css?v=117af','./ui/party-collection.js?v=118r2','./ui/party-who.js?v=118r2','./ui/party-art.js?v=118r2','./ui/party-public.js?v=118r2','./ui/catalog-store.js?v=014117','./ui/catalog-manager.js?v=118c1','./ui/catalog-manager.css?v=014117','./ui/mission116.css?v=014117','./ui/game-tables.js?v=appels-sonnerie-v56','./ui/game-tables.css?v=014117','./ui/bluff-table-structure.css?v=014117','./ui/party-bluff.js?v=014117','./ui/party-game.js?v=118r2','./ui/bluff-lounge-109.webp','./ui/bluff-cinema-109.webp','./ui/bluff-shot-109.webm','./ui/bluff-click-109.webm','./ui/party-douze.js?v=014117','./ui/party-douze.css?v=014117','./ui/douze-lounge-109.webp','./ui/game-shell.js?v=014117','./ui/game-shell.css?v=014117','./ui/game-lounge-109.webp','./ui/social-content.js?v=appels-sonnerie-v56','./ui/social-lounge-cinema.png','./ui/social-core.js?v=118s1','./ui/social-app.js?v=014117','./ui/social.css?v=014117','./ui/social-lounge.svg','./ui/mobile-ux.js?v=014117','./ui/mobile-ux.css?v=014117','./ui/connections.js?v=014117','./ui/icons.js?v=014117','./ui/foundation.css?v=014117','./ui/foundation.js?v=118c1','./','./index.html','./manifest.json','./manifest.webmanifest','./privacy.html','./terms.html','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // Only the app document is mandatory. A missing optional asset must not block updates.
 await cache.addAll(['./','./index.html']);
 const startup=CORE.filter(p=>!/^\.\/(?:317\.html|assets\/317\/|ui\/(?:three|one-lobby|GLTFLoader|BufferGeometryUtils|SkeletonUtils|bluff-|douze-lounge|game-lounge))/.test(p)&&p!=='./'&&p!=='./index.html');
 await Promise.allSettled(startup.map(p=>cache.add(p)));
 await self.skipWaiting();
})())});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("one-mobile-alpha-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method==='POST'&&req.url===new URL('./share-tiktok',self.registration.scope).href){event.respondWith(oneReceiveTikTokShare(req));return;}
 if(req.method!=='GET')return;
 if(/\/ui\/(?:boutique-catalog|shop-products)\.json$/.test(new URL(req.url).pathname))return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   const scopePath=new URL(self.registration.scope).pathname;const navigationKey=url.pathname===scopePath?'./index.html':url.origin+url.pathname;
   event.respondWith(fetch(new Request(req,{cache:'no-store'})).then(async r=>{
     if(r.ok&&r.headers.get('content-type')?.includes('text/html')){
       const copy=r.clone();await caches.open(CACHE).then(c=>c.put(navigationKey,copy)).catch(()=>{});
     }
     return r;
   }).catch(()=>caches.open(CACHE).then(async c=>(await c.match(navigationKey))||new Response('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ONE · Hors ligne</title><body><h1>Tu es hors ligne</h1><p>Cette page sera disponible dès le retour de la connexion.</p><a href="./">Retour à ONE</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}}))));
   return;
 }
 event.respondWith(caches.open(CACHE).then(c=>c.match(req)).then(cached=>cached||fetch(req).then(r=>{
   if(r.ok){const copy=r.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}));}
   return r;
 })));
});

async function oneReceiveTikTokShare(req){
 const origin=req.headers.get('Origin'),site=req.headers.get('Sec-Fetch-Site');
 if(req.mode!=='navigate'||site==='cross-site'||(origin&&origin!=='null'&&origin!==self.location.origin))return new Response('Partage non autorisé.',{status:403});
 try{
  // Read a bounded text form. File uploads are not part of this share target.
  if(!req.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return new Response('Partage un lien de vidéo TikTok.',{status:415});
  const reader=req.body.getReader(),chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();return new Response('Ce partage est trop volumineux.',{status:413});}chunks.push(value);}
  const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}
  const form=new URLSearchParams(new TextDecoder().decode(bytes));
  const id=await ONETikTokShareCore.receive(['share_title','share_text','share_url'].map(k=>form.get(k)||'').join('\n'));
  return Response.redirect(new URL('./#one-share='+id,self.registration.scope).href,303);
 }catch(e){return new Response(e.message||'Impossible de conserver le partage. Réessaie depuis TikTok.',{status:400,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
}


// Persist only the account id, never its authentication token, in the service worker.
function onePushOwner(value){return new Promise((resolve,reject)=>{const open=indexedDB.open('one-push-device',1);open.onupgradeneeded=()=>open.result.createObjectStore('settings');open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction('settings',value===undefined?'readonly':'readwrite'),store=tx.objectStore('settings'),req=value===undefined?store.get('account'):store.put(value,'account');let result='';req.onsuccess=()=>result=req.result||'';tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};};});}
self.addEventListener('message',event=>{if(event.data?.type==='ONE_PUSH_ACCOUNT'&&event.source?.url?.startsWith(self.location.origin+'/'))event.waitUntil(onePushOwner(String(event.data.accountId||'').slice(0,100)));});
const ONE_MEDIA_MARK=/\[\[ONE_MEDIA_V2\|([pv])\|([0-9a-f-]{36})\|([A-Za-z0-9_-]{40,})\]\]/i;
const ONE_Z0='\u200B',ONE_Z1='\u200C',ONE_ZP='\u2063\u200B\u2063\u200C\u2063';

function oneReadHiddenMedia(text){
 const s=String(text||''),i=s.indexOf(ONE_ZP);if(i<0)return null;
 const bits=[...s.slice(i+ONE_ZP.length)].filter(c=>c===ONE_Z0||c===ONE_Z1);
 if(!bits.length||bits.length%8)return null;
 const bytes=new Uint8Array(bits.length/8);
 for(let n=0;n<bytes.length;n++){let b=0;for(let j=0;j<8;j++)b=(b<<1)|(bits[n*8+j]===ONE_Z1?1:0);bytes[n]=b}
 try{return new TextDecoder().decode(bytes)}catch{return null}
}
function oneParseMediaText(value){
 const s=String(value||''),legacy=s.match(ONE_MEDIA_MARK);
 if(legacy)return {type:legacy[1].toLowerCase()==='v'?'video':'photo',id:legacy[2],shareToken:legacy[3],latest:false};
 const raw=oneReadHiddenMedia(s);if(raw){const p=raw.split('|');if(p.length===3&&['p','v'].includes(p[0])&&/^[0-9a-f-]{36}$/i.test(p[1])&&/^[A-Za-z0-9_-]{40,}$/.test(p[2]))return {type:p[0]==='v'?'video':'photo',id:p[1],shareToken:p[2],latest:false}}
 return null;
}
function oneMediaFromPush(data){
 if(data?.media?.id&&data?.media?.shareToken)return {type:data.media.type==='video'||data.media.type==='v'?'video':'photo',id:String(data.media.id),shareToken:String(data.media.shareToken),latest:false};
 const seen=new Set(),queue=[data];
 while(queue.length){
  const v=queue.shift();if(v==null)continue;
  if(typeof v==='string'){const m=oneParseMediaText(v);if(m)return m;continue}
  if(typeof v!=='object'||seen.has(v))continue;seen.add(v);
  for(const x of Object.values(v))if(typeof x==='string'||(x&&typeof x==='object'))queue.push(x);
 }
 const visible=[data?.title,data?.body,data?.text,data?.message].filter(Boolean).join(' ').toLowerCase();
 if(/\bvid[ée]o\b/.test(visible))return {type:'video',latest:true};
 if(/\bphoto\b/.test(visible))return {type:'photo',latest:true};
 return null;
}
function oneCleanNotificationText(value){
 return String(value||'')
  .replace(ONE_MEDIA_MARK,'')
  .replace(/[\u200B\u200C\u2063]/g,'')
  .replace(/\bPhoto ONE\b/gi,'photo')
  .replace(/\bVid[ée]o ONE\b/gi,'vidéo')
  .replace(/\s{2,}/g,' ')
  .trim();
}

self.addEventListener('push',event=>{event.waitUntil((async()=>{
 let data;try{data=event.data?.json();}catch{return;}
 if(!data?.accountId||await onePushOwner()!==data.accountId)return;
 let url;try{url=new URL(data.url,self.location.origin);if(url.origin!==self.location.origin)return;}catch{return;}
 const media=oneMediaFromPush(data);
 if(media){url.searchParams.set('one_media','1');url.searchParams.set('one_media_type',media.type||'');}
 const title=oneCleanNotificationText(data.title||'ONE')||'ONE';
 const body=oneCleanNotificationText(data.body||'');
 await self.registration.showNotification(title,{
  body:body.slice(0,180),icon:'./icon-192.png',badge:'./icon-192.png',
  tag:String(data.tag||'one').slice(0,200),data:{url:url.href,...(media?{media}:{})},renotify:false
 });
})());});

self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 let url;try{url=new URL(event.notification.data?.url||'/',self.location.origin);if(url.origin!==self.location.origin)return;}catch{return;}
 const media=event.notification.data?.media||null;
 if(media){url.searchParams.set('one_media','1');url.searchParams.set('one_media_type',media.type||'');}
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 const current=windows.find(client=>new URL(client.url).origin===self.location.origin);
 if(current){
  await current.focus();
  if(media)current.postMessage({type:'ONE_MEDIA_NOTIFICATION_OPEN',media});
  else current.postMessage({type:'ONE_NOTIFICATION_OPEN',url:url.href});
  return;
 }
 const opened=await self.clients.openWindow(url.href);
 if(opened&&media){
  await new Promise(resolve=>setTimeout(resolve,450));
  try{opened.postMessage({type:'ONE_MEDIA_NOTIFICATION_OPEN',media})}catch{}
 }
})());});


















