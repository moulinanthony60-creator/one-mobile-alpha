const CACHE='one-mobile-alpha-14107-social';
const CORE=['./ui/social-content.js?v=014107','./ui/social-lounge-cinema.png','./ui/social-core.js?v=014107','./ui/social-app.js?v=014107','./ui/social.css?v=014107','./ui/social-lounge.svg','./ui/mobile-ux.js?v=014105','./ui/mobile-ux.css?v=014105','./ui/connections.js?v=014105','./ui/icons.js?v=014105','./ui/foundation.css?v=014105','./ui/foundation.js?v=014107','./','./index.html','./manifest.json','./manifest.webmanifest','./privacy.html','./terms.html','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("one-mobile-alpha-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
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

