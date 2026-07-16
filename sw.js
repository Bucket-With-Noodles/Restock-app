
const CACHE_NAME = 'restock-v4';

const FILES_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json'
];

// 1. INSTALLATION (Download the new files)
self.addEventListener('install', event => {
    // This forces the new service worker to take over
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })
    );
});

// 2. ACTIVATION (Clean up the old cache)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                // If the cache name doesn't match our current version, DELETE IT.
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    // Tell the new service worker to instantly control the open webpage
    self.clients.claim();
});

// 3. FETCHING (Serve the files)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});