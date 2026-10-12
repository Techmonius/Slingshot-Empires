const CACHE='slingshot-empires-v014-persistent-stations';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./release.json'];
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
  event.respondWith(
   fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)));}
    return response;
   }).catch(()=>caches.match('./index.html'))
  );
  return;
 }
 event.respondWith(
  caches.match(event.request).then(hit=>hit||fetch(event.request))
 );
});
