// Basic Service Worker for PWA installation requirements
const CACHE_NAME = 'agendai-v1';

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through fetch
    event.respondWith(fetch(event.request));
});
