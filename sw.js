// Service Worker untuk background notifications
const CACHE_NAME = 'jadwal-sholat-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/assets/logo.png',
  '/assets/audio/adzan-subuh.mp3',
  '/assets/audio/adzan-umum.mp3',
  '/2025.json',
  '/2026.json',
  '/2027.json',
  '/2028.json',
  '/2029.json',
  '/2030.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
  );
});

// Background Sync for notifications
self.addEventListener('sync', event => {
  if (event.tag === 'prayer-time-check') {
    event.waitUntil(checkPrayerTimesInBackground());
  }
});

// Periodic background sync (every 30 minutes)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'prayer-check') {
    event.waitUntil(checkPrayerTimesInBackground());
  }
});

// Background prayer time checking
async function checkPrayerTimesInBackground() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Fetch current schedule
    const response = await fetch(`/${year}.json`);
    const data = await response.json();
    
    if (data && data.time && data.time[month]) {
      const monthData = data.time[month];
      const currentDate = now.getDate();
      
      // Find today's schedule
      const todayData = monthData.find(day => {
        if (day.tanggal) {
          const parts = day.tanggal.split(', ');
          if (parts.length > 1) {
            const datePart = parts[1];
            const [d] = datePart.split('/').map(Number);
            return d === currentDate;
          }
        }
        return false;
      });
      
      if (todayData) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Check each prayer time
        const prayers = [
          { name: 'subuh', time: todayData.subuh },
          { name: 'dzuhur', time: todayData.dzuhur },
          { name: 'ashar', time: todayData.ashar },
          { name: 'maghrib', time: todayData.maghrib },
          { name: 'isya', time: todayData.isya }
        ];
        
        for (const prayer of prayers) {
          if (prayer.time) {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = hours * 60 + minutes;
            
            // If prayer time is within 5 minutes
            if (Math.abs(currentTime - prayerTime) <= 5) {
              // Show notification
              self.registration.showNotification(
                `Waktu Sholat ${prayer.name.toUpperCase()}`,
                {
                  body: `Waktu sholat ${prayer.name} telah tiba`,
                  icon: '/assets/logo.png',
                  badge: '/assets/logo.png',
                  tag: `prayer-${prayer.name}`,
                  requireInteraction: true,
                  actions: [
                    {
                      action: 'open',
                      title: 'Buka Jadwal'
                    }
                  ]
                }
              );
              break;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Background prayer check error:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (const client of windowClients) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});