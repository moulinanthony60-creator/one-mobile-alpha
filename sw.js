const CACHE='one-mobile-alpha-14118t1';
const CORE=['./ui/together.js?v=118t1','./ui/together-player.js?v=118t1','./ui/together.css?v=118t1','./ui/boutique.js?v=118b1','./ui/boutique-catalog.js?v=118b1','./ui/boutique.css?v=118b1','./ui/boutique-catalog.json?v=118b1','./ui/card-back-bluff-118.svg','./ui/card-back-poker-118.svg','./ui/card-back-blackjack-118.svg','./ui/card-back-trio-118.svg','./ui/card-back-douze-118.svg','./ui/card-back-colors-118.svg','./ui/game-finish-118.css?v=118r2',
  './ui/casino-finish-118.css?v=118r2','./ui/party-collection.css?v=118r2','./ui/salon-polish.css?v=118r2','./ui/blackjack-table-118.png','./ui/party-blackjack.js?v=118r2','./ui/party-blackjack.css?v=118r2','./ui/party-poker.js?v=118r2','./ui/poker-polish.css?v=118r2','./ui/table-themes-117af.js?v=118r2','./ui/table-themes-117af.css?v=117af','./ui/party-collection.js?v=118r2','./ui/party-who.js?v=118r2','./ui/party-art.js?v=118r2','./ui/party-public.js?v=118r2','./ui/catalog-store.js?v=014117','./ui/catalog-manager.js?v=014117','./ui/catalog-manager.css?v=014117','./ui/mission116.css?v=014117','./ui/game-tables.js?v=118r2','./ui/game-tables.css?v=014117','./ui/bluff-table-structure.css?v=014117','./ui/party-bluff.js?v=014117','./ui/party-game.js?v=118r2','./ui/party-communication.js?v=118b1','./ui/bluff-lounge-109.webp','./ui/bluff-cinema-109.webp','./ui/bluff-shot-109.webm','./ui/bluff-click-109.webm','./ui/party-douze.js?v=014117','./ui/party-douze.css?v=014117','./ui/douze-lounge-109.webp','./ui/game-shell.js?v=014117','./ui/game-shell.css?v=014117','./ui/game-lounge-109.webp','./ui/social-content.js?v=118t1','./ui/social-lounge-cinema.png','./ui/social-core.js?v=118r2','./ui/social-app.js?v=014117','./ui/social.css?v=014117','./ui/social-lounge.svg','./ui/mobile-ux.js?v=014117','./ui/mobile-ux.css?v=014117','./ui/connections.js?v=014117','./ui/icons.js?v=014117','./ui/foundation.css?v=014117','./ui/foundation.js?v=014117','./','./index.html','./manifest.json','./manifest.webmanifest','./privacy.html','./terms.html','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("one-mobile-alpha-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 if(new URL(req.url).pathname.endsWith('/ui/boutique-catalog.json'))return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).then(r=>r).catch(()=>caches.match('./index.html')));
   return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{
   if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
   return r;
 })));
});

