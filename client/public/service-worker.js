// Service Worker pour la PWA de Gestion des Permis de Chasse
const CACHE_NAME = 'permis-chasse-cache-v1';
const OFFLINE_URL = '/offline.html';

// Liste des ressources à mettre en cache immédiatement
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Ajoutez ici les CSS et JS principaux de votre application
  '/assets/index.css',
  '/assets/index.js'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des ressources essentielles');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du service worker et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache pour les requêtes API
self.addEventListener('fetch', (event) => {
  // Vérifier si la requête est une requête API
  if (event.request.url.includes('/api/')) {
    // Stratégie Network First pour les API
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Mettre en cache la réponse fraîche
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si réseau indisponible, essayer le cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                // Ajouter un en-tête pour indiquer que c'est du cache
                const headers = new Headers(cachedResponse.headers);
                headers.append('X-Cache-Source', 'service-worker');
                
                // Enregistrer la requête pour synchronisation ultérieure
                if (event.request.method === 'POST' || event.request.method === 'PUT' || event.request.method === 'DELETE') {
                  saveRequestForSync(event.request.clone());
                }
                
                return cachedResponse;
              }
              
              // Si pas en cache, retourner la page hors ligne
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              
              // Sinon, échec
              return new Response('Ressource non disponible hors ligne', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  } else {
    // Stratégie Cache First pour les ressources statiques
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
              // Ne pas mettre en cache les réponses d'erreur
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Mettre en cache la nouvelle ressource
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
              return response;
            })
            .catch(() => {
              // Retourner la page hors ligne pour les navigations
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              return new Response('Ressource non disponible hors ligne', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
});

// Gestion de la synchronisation en arrière-plan
const DB_NAME = 'offline-requests-db';
const STORE_NAME = 'pending-requests';

// Fonction pour sauvegarder les requêtes pour synchronisation ultérieure
function saveRequestForSync(request) {
  return request.text().then(body => {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(DB_NAME, 1);
      
      dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const addRequest = store.add(requestData);
        addRequest.onsuccess = () => {
          console.log('Requête enregistrée pour synchronisation ultérieure');
          resolve();
        };
        addRequest.onerror = () => {
          console.error('Erreur lors de l\'enregistrement de la requête pour synchronisation');
          reject();
        };
      };
      
      dbRequest.onerror = () => {
        console.error('Erreur lors de l\'ouverture de la base de données IndexedDB');
        reject();
      };
    });
  });
}

// Fonction pour synchroniser les requêtes en attente
function syncPendingRequests() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, 1);
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const pendingRequests = getAllRequest.result;
        
        if (pendingRequests.length === 0) {
          console.log('Aucune requête en attente à synchroniser');
          resolve();
          return;
        }
        
        console.log(`Synchronisation de ${pendingRequests.length} requêtes en attente`);
        
        const syncPromises = pendingRequests.map(requestData => {
          const { url, method, headers, body } = requestData;
          
          return fetch(url, {
            method: method,
            headers: new Headers(headers),
            body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
            credentials: 'include'
          })
          .then(response => {
            if (response.ok) {
              // Supprimer la requête synchronisée
              const deleteRequest = store.delete(requestData.id);
              return new Promise((resolve) => {
                deleteRequest.onsuccess = resolve;
              });
            }
          })
          .catch(error => {
            console.error('Erreur lors de la synchronisation de la requête:', error);
          });
        });
        
        Promise.all(syncPromises)
          .then(() => {
            console.log('Synchronisation terminée');
            resolve();
          })
          .catch(error => {
            console.error('Erreur lors de la synchronisation:', error);
            reject(error);
          });
      };
      
      getAllRequest.onerror = (error) => {
        console.error('Erreur lors de la récupération des requêtes en attente:', error);
        reject(error);
      };
    };
    
    dbRequest.onerror = (error) => {
      console.error('Erreur lors de l\'ouverture de la base de données IndexedDB:', error);
      reject(error);
    };
  });
}

// Écouter l'événement de synchronisation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Écouter l'événement de connectivité
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ONLINE_STATUS_CHANGE' && event.data.online) {
    // Lancer la synchronisation lorsque la connexion est rétablie
    self.registration.sync.register('sync-pending-requests')
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement de la tâche de synchronisation:', error);
        // Fallback si l'API Sync n'est pas disponible
        syncPendingRequests();
      });
  }
});
