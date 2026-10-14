// v0.15.1 PLAYTEST — cache the live game and the linked shipyard separately.
// In particular, never overwrite the game's offline shell with shipyard HTML.
const CACHE='slingshot-empires-v0151-cargo-playtest';
const ASSETS=['./','./index.html','./ship-builder.html','./ship-core.js',
 './manifest.webmanifest','./icons/icon-192.png','./release.json'];
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'}))))
 .then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('slingshot-empires-')&&key!==CACHE).map(key=>caches.delete(key))))
 .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 if(event.request.mode==='navigate'){
  const url=new URL(event.request.url);
  const isShipyard=url.pathname.endsWith('/ship-builder.html');
  const isMain=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  // Non-game pages must never replace either of our offline app pages.
  if(!isMain&&!isShipyard){
   event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
   return;
  }
  const offlinePath=isShipyard?'./ship-builder.html':'./index.html';
  event.respondWith(
   fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok){
     const copy=response.clone();
     event.waitUntil(caches.open(CACHE).then(cache=>cache.put(offlinePath,copy)));
    }
    return response;
   }).catch(()=>caches.match(offlinePath))
  );
  return;
 }
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
