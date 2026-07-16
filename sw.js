const CACHE_NAME = 'restock-cache-v4';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// 1. Install the Service Worker and save files to the phone
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// 2. When the app opens, load from the phone's cache first, NOT the internet
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return the cached version if found, otherwise fetch from the network
                return response || fetch(event.request);
            })
    );
});