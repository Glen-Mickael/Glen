const CACHE='glen-v185';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('glen-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(request.mode==='navigate')event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);let response;try{response=await fetch(request,{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}if(response.ok){await cache.put(request,response.clone());await cache.put(new URL('./index.html',self.registration.scope).href,response.clone());return response;}const saved=await cache.match(request)||await cache.match(new URL('./index.html',self.registration.scope).href);return saved||response;}catch(error){const saved=await cache.match(request)||await cache.match(new URL('./index.html',self.registration.scope).href);if(saved)return saved;return new Response('Connexion Internet indisponible. Reconnecte-toi puis rouvre GLEN.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}})());
});
