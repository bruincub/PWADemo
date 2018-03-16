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
                "js/idb/idb.js",
                "css/demo.css",
                "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css",
                "https://code.jquery.com/jquery-3.2.1.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js",
                "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js",
                "https://fonts.googleapis.com/css?family=Open+Sans:400,400i,600,600i,700,700i",
                "https://fonts.googleapis.com/css?family=Lato:300,300i,400,400i,700,700i",
                "https://fonts.googleapis.com/css?family=Arvo:400,400i,700,700i",
                "fonts/weathericons/css/weather-icons.min.css",
                "fonts/weathericons/font/weathericons-regular-webfont.ttf",
                "fonts/weathericons/font/weathericons-regular-webfont.woff2",
                "fonts/weathericons/font/weathericons-regular-webfont.woff"
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

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('index.html'));
            return;
        }
    }

    if (requestUrl.origin === "https://query.yahooapis.com" || requestUrl.origin === "https://api.weather.gov") {
        event.respondWith(serveWeather(event.request));
    // } else if (requestUrl.origin === "https://systemstatus.temple.edu") {
    //     event.respondWith(serveSystemStatus(event.request));
    } else {
        event.respondWith(
            caches.match(event.request).then(function(response) {
                return response || fetch(event.request);
            })
        );
    }
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

function serveSystemStatus(request) {
    "use strict";

    // Eventually, replace with Push Notifications

    // return caches.open(staticCacheName).then(function(cache) {
    //     return fetch(request).then(function(response) {
    //         cache.put(request, response.clone());
    //         return response;
    //     });
    // });
}