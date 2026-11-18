/* GLEN Multiservice — sw.js v344 (etape63, mode hors réseau étape 1)
   - garde l'application (index.html) ET les bibliothèques qu'elle télécharge (Supabase, Clerk, Excel, PDF, ZIP)
     pour qu'elle s'ouvre sans réseau ;
   - garde les photos déjà affichées (400 au maximum, les plus anciennes sont retirées). */
const CACHE='glen-shell-v344',LIBS='glen-libs-v344',PHOTOS='glen-photos-v344',KEEP=[CACHE,LIBS,PHOTOS],MAX_PHOTOS=400;
const LIB_URLS=[
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
 'https://eminent-dragon-2142.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js'
];
const scopeUrl=p=>new URL(p,self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE),url=scopeUrl('./index.html');
 const response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error('Application non téléchargée');await cache.put(url,response);
 for(const p of ['./glen-icon-192.png','./apple-touch-icon.png']){try{const r=await fetch(scopeUrl(p),{cache:'reload'});if(r.ok)await cache.put(scopeUrl(p),r);}catch(e){}}
 const libs=await caches.open(LIBS);
 await Promise.all(LIB_URLS.map(async u=>{try{const r=await fetch(u,{mode:'cors',cache:'reload'});if(r.ok)await libs.put(u,r);}catch(e){}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const k of await caches.keys())if(!KEEP.includes(k)&&k!=='glen-shell-v343')await caches.delete(k);
 await self.clients.claim();
 try{await caches.delete('glen-shell-v343');}catch(e){}
})()));
function isLib(url){return url.hostname==='cdn.jsdelivr.net'||url.hostname==='cdnjs.cloudflare.com'||(url.hostname.endsWith('.clerk.accounts.dev')&&url.pathname.startsWith('/npm/'));}
function isPhoto(url){return url.hostname.endsWith('.supabase.co')&&url.pathname.includes('/storage/v1/object/');}
function photoKey(url){const u=new URL(url.href);u.searchParams.delete('token');return u.href;}
async function trimPhotos(){try{const c=await caches.open(PHOTOS),keys=await c.keys();for(let i=0;i<keys.length-MAX_PHOTOS;i++)await c.delete(keys[i]);}catch(e){}}
function withTimeout(p,ms){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(Error('timeout')),ms))]);}
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url),scopePath=new URL(self.registration.scope).pathname;
 if(url.origin===self.location.origin&&url.pathname.startsWith(scopePath)){
  if(req.mode==='navigate'){
   event.respondWith((async()=>{const cache=await caches.open(CACHE),index=scopeUrl('./index.html');
    try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);let response;try{response=await fetch(req,{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}
     if(response.ok){await cache.put(index,response.clone());return response;}return await cache.match(index)||response;}
    catch{const saved=await cache.match(index);return saved||new Response('Ouvre une première fois GLEN avec Internet pour préparer le mode hors connexion.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}})());
   return;
  }
  if(/\.(png|jpg|jpeg|svg|ico|webmanifest|json)$/i.test(url.pathname)){
   event.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(req);if(hit)return hit;try{const r=await fetch(req);if(r.ok)cache.put(req,r.clone());return r;}catch(e){return hit||Response.error();}})());
  }
  return;
 }
 if(isLib(url)){
  event.respondWith((async()=>{const cache=await caches.open(LIBS),hit=await cache.match(req.url);
   const network=fetch(req.url,{mode:'cors',credentials:'omit'}).then(r=>{if(r.ok)cache.put(req.url,r.clone());return r;});
   if(hit){event.waitUntil(network.catch(()=>{}));return hit;}
   try{return await network;}catch(e){return Response.error();}})());
  return;
 }
 if(isPhoto(url)){
  event.respondWith((async()=>{const cache=await caches.open(PHOTOS),key=photoKey(url);
   try{const r=await withTimeout(req.mode==='no-cors'?fetch(url.href,{mode:'cors',credentials:'omit'}):fetch(req),8000);if(r.ok){await cache.put(key,r.clone());event.waitUntil(trimPhotos());}return r;}
   catch(e){const hit=await cache.match(key);return hit||Response.error();}})());
 }
});
