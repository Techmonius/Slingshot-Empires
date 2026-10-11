const CACHE='slingshot-empires-v01-2026-10-11-release';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 if(event.request.mode==='navigate'){
   event.respondWith(fetch(event.request).then(response=>{const clone=response.clone();caches.open(CACHE).then(c=>c.put('./index.html',clone));return response}).catch(()=>caches.match('./index.html')));
   return;
 }
 event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});
