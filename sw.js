importScripts('./ui/tiktok-share-core.js?v=118c2');
const CACHE='one-mobile-alpha-317r40-maison-20260930';
const CORE=['./ui/three17-r40-visuals.js','./ui/three17-parasite-r23.js','./ui/GLTFLoader.js','./ui/BufferGeometryUtils.js','./ui/SkeletonUtils.js','./assets/317/parasite-starkie-r23.glb','./ui/three.module.js','./ui/three.core.js','./ui/one-lobby-3d.css?v=008','./ui/tiktok-share-core.js?v=118c2','./ui/tiktok-share.js?v=118c2','./ui/tiktok-share.css?v=118c2','./ui/tiktok-public.js?v=118c1','./ui/tiktok-public.css?v=118c1','./ui/header-polish.js?v=118c2','./ui/header-polish.css?v=118c2','./ui/social-hub.css?v=118s1','./ui/social-hub.js?v=118s1','./ui/social-account.js?v=118s1','./ui/social-push.js?v=118s1','./ui/friends.js?v=118s1','./ui/friends.css?v=118s1','./ui/notifications.js?v=118s1','./ui/party.js?v=118s1','./ui/together-fullscreen.js?v=118t5','./ui/together-salon.js?v=118t5','./ui/together-catalog.js?v=118c1','./ui/together-browser.js?v=118c1','./ui/together.js?v=118t5','./ui/together-player.js?v=118t5','./ui/together.css?v=118t5','./ui/boutique.js?v=118b1','./ui/boutique-catalog.js?v=118b1','./ui/boutique.css?v=118b1','./ui/boutique-catalog.json?v=118b1','./ui/card-back-bluff-118.svg','./ui/card-back-poker-118.svg','./ui/card-back-blackjack-118.svg','./ui/card-back-trio-118.svg','./ui/card-back-douze-118.svg','./ui/card-back-colors-118.svg','./ui/game-finish-118.css?v=118r2',
  './ui/casino-finish-118.css?v=118r2','./ui/party-collection.css?v=118r2','./ui/salon-polish.css?v=118r2','./ui/blackjack-table-118.png','./ui/party-blackjack.js?v=118r2','./ui/party-blackjack.css?v=118r2','./ui/party-poker.js?v=118r2','./ui/poker-polish.css?v=118r2','./ui/table-themes-117af.js?v=118r2','./ui/table-themes-117af.css?v=117af','./ui/party-collection.js?v=118r2','./ui/party-who.js?v=118r2','./ui/party-art.js?v=118r2','./ui/party-public.js?v=118r2','./ui/catalog-store.js?v=014117','./ui/catalog-manager.js?v=118c1','./ui/catalog-manager.css?v=014117','./ui/mission116.css?v=014117','./ui/game-tables.js?v=118r2','./ui/game-tables.css?v=014117','./ui/bluff-table-structure.css?v=014117','./ui/party-bluff.js?v=014117','./ui/party-game.js?v=118r2','./ui/party-communication.js?v=118b1','./ui/bluff-lounge-109.webp','./ui/bluff-cinema-109.webp','./ui/bluff-shot-109.webm','./ui/bluff-click-109.webm','./ui/party-douze.js?v=014117','./ui/party-douze.css?v=014117','./ui/douze-lounge-109.webp','./ui/game-shell.js?v=014117','./ui/game-shell.css?v=014117','./ui/game-lounge-109.webp','./ui/social-content.js?v=118t1','./ui/social-lounge-cinema.png','./ui/social-core.js?v=118s1','./ui/social-app.js?v=014117','./ui/social.css?v=014117','./ui/social-lounge.svg','./ui/mobile-ux.js?v=014117','./ui/mobile-ux.css?v=014117','./ui/connections.js?v=014117','./ui/icons.js?v=014117','./ui/foundation.css?v=014117','./ui/foundation.js?v=118c1','./','./index.html','./manifest.json','./manifest.webmanifest','./privacy.html','./terms.html','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("one-mobile-alpha-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method==='POST'&&req.url===new URL('./share-tiktok',self.registration.scope).href){event.respondWith(oneReceiveTikTokShare(req));return;}
 if(req.method!=='GET')return;
 if(new URL(req.url).pathname.endsWith('/ui/boutique-catalog.json'))return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   const navigationKey=url.pathname.endsWith('/317.html')?'./317.html':'./index.html';
   event.respondWith(fetch(new Request(req,{cache:'no-store'})).then(async r=>{
     if(r.ok&&r.headers.get('content-type')?.includes('text/html')){
       const copy=r.clone();await caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});
     }
     return r;
   }).catch(()=>caches.open(CACHE).then(c=>c.match('./index.html'))));
   return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{
   if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
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
self.addEventListener('push',event=>{event.waitUntil((async()=>{let data;try{data=event.data?.json();}catch{return;}if(!data?.accountId||await onePushOwner()!==data.accountId)return;let url;try{url=new URL(data.url,self.location.origin);if(url.origin!==self.location.origin)return;}catch{return;}await self.registration.showNotification(String(data.title||'ONE').slice(0,100),{body:String(data.body||'').slice(0,180),icon:'./icon-192.png',badge:'./icon-192.png',tag:String(data.tag||'one').slice(0,200),data:{url:url.href},renotify:false});})());});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{let url;try{url=new URL(event.notification.data?.url||'/',self.location.origin);if(url.origin!==self.location.origin)return;}catch{return;}const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true}),current=windows.find(client=>new URL(client.url).origin===self.location.origin);if(current){await current.focus();current.postMessage({type:'ONE_NOTIFICATION_OPEN',url:url.href});return;}await self.clients.openWindow(url.href);})());});
