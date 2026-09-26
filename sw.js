const CACHE='one-mobile-alpha-14117-resultats-k';
const CORE=['./ui/douze-target.css?v=117k','./ui/catalog-store.js?v=014117','./ui/catalog-manager.js?v=014117','./ui/catalog-manager.css?v=014117','./ui/mission116.css?v=014117','./ui/game-tables.js?v=014117','./ui/game-tables.css?v=014117','./ui/bluff-table-structure.css?v=014117','./ui/party-bluff.js?v=014117','./ui/party-game.js?v=014117','./ui/party-communication.js?v=014117','./ui/bluff-lounge-109.webp','./ui/bluff-cinema-109.webp','./ui/bluff-shot-109.webm','./ui/bluff-click-109.webm','./ui/party-douze.js?v=014117','./ui/party-douze.css?v=014117','./ui/douze-lounge-109.webp','./ui/game-shell.js?v=014117','./ui/game-shell.css?v=014117','./ui/game-lounge-109.webp','./ui/social-content.js?v=014117','./ui/social-lounge-cinema.png','./ui/social-core.js?v=014117','./ui/social-app.js?v=014117','./ui/social.css?v=014117','./ui/social-lounge.svg','./ui/mobile-ux.js?v=014117','./ui/mobile-ux.css?v=014117','./ui/connections.js?v=014117','./ui/icons.js?v=014117','./ui/foundation.css?v=014117','./ui/foundation.js?v=014117','./','./index.html','./manifest.json','./manifest.webmanifest','./privacy.html','./terms.html','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 const home=await fetch(new Request('./index.html',{cache:'reload'}));
 if(!home.ok)throw Error('Accueil indisponible');await cache.put('./index.html',home);
 await Promise.allSettled(CORE.filter(p=>p!=='./'&&p!=='./index.html').map(async p=>{
  const response=await fetch(new Request(p,{cache:'reload'}));if(response.ok)await cache.put(p,response);
 }));await self.skipWaiting();
})())});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(req.mode==='navigate'||/\.(?:js|css|html|json|webmanifest)$/.test(url.pathname)){
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{
   const response=await fetch(new Request(req,{cache:'no-cache'}));
   if(response.ok){await cache.put(req,response.clone());return response;}
   return await cache.match(req)||response;
  }catch(error){const saved=await cache.match(req)||(req.mode==='navigate'?await cache.match('./index.html'):null);if(saved)return saved;throw error;}})());return;
 }
 event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(req);if(saved)return saved;const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response;})());
});
