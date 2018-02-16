const staticCacheName = "TUstat-cache-v1";
const allCaches = [
  staticCacheName
];

self.addEventListener("install", function(event) {
    "use strict";

    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll([
                "index.html",
                "js/demo.js",
                "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css",
                "css/demo.css",
                "https://code.jquery.com/jquery-3.2.1.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js",
                "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"
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

self.addEventListener("fetch", function(event) {
    "use strict";

    let requestUrl = new URL(event.request.url);

    if (requestUrl.origin === "https://query.yahooapis.com" || requestUrl.origin === "https://api.weather.gov") {
        event.respondWith(serveWeather(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

function serveWeather(request) {
    "use strict";

    return caches.open(staticCacheName).then(function(cache) {
        return cache.match(request).then(function(cacheResponse) {
            if (cacheResponse) {
                return cacheResponse;
            }

            return fetch(request).then(function(networkResponse) {
                cache.put(request, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}