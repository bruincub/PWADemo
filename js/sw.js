const staticCacheName = "TUstat-cache-v1";
const allCaches = [
  staticCacheName
];

self.addEventListener("install", function(event) {
    "use strict";

    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll([
                "../index.html",
                "demo.js"
            ]);
        })
    );
});

self.addEventListener("activate", function(event) {
    "use strict";

    event.waitUntil(
        caches.keys().then(function(cacheNames) {
           return Promise.all(
               cacheNames.filter(function(cacheName) {
                   return cacheName.startsWith("TUstat-") &&
                       !allCaches.includes(cacheName);
               }).map(function(cacheName) {
                   return caches.delete(cacheName);
               })
           );
        })
    );
});

