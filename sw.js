const CACHE='one-mobile-alpha-113-sharepost-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./privacy.html','./terms.html','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;

  // Android Web Share Target: receive the shared TikTok text/URL as POST,
  // then redirect into ONE using the same parameters the app already knows how to import.
  if(req.method==='POST' && url.pathname==='/one-mobile-alpha/share-target'){
    event.respondWith((async()=>{
      try{
        const form=await req.formData();
        const target=new URL('/one-mobile-alpha/',self.location.origin);
        for(const key of ['share_title','share_text','share_url']){
          const value=form.get(key);
          if(typeof value==='string' && value.trim())target.searchParams.set(key,value);
        }
        return Response.redirect(target.toString(),303);
      }catch(e){
        return Response.redirect(new URL('/one-mobile-alpha/',self.location.origin).toString(),303);
      }
    })());
    return;
  }

  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r})));
});
