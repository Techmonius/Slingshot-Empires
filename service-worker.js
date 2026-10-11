const CACHE='slingshot-empires-v05-2026-10-11';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('slingshot-empires-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const clone=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',clone));}return r;}).catch(()=>caches.match('./index.html')));
  return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
