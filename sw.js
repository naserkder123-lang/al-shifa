const CACHE="alshifa-v19";
self.addEventListener("install",function(e){self.skipWaiting();});
self.addEventListener("activate",function(e){
 e.waitUntil((async function(){
  var ks=await caches.keys();
  await Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",function(e){
 var req=e.request;
 if(req.method!=="GET")return;
 var url=new URL(req.url);
 if(url.origin!==location.origin)return;
 e.respondWith((async function(){
  try{
   var res=await fetch(req,{cache:"no-store"});
   if(res&&res.status===200){
    try{var c=await caches.open(CACHE);await c.put(req,res.clone());}catch(x){}
   }
   return res;
  }catch(err){
   var hit=await caches.match(req);
   if(hit)return hit;
   throw err;
  }
 })());
});
