// Utilitaires pour la PWA et le mode hors ligne

// Fonction pour enregistrer le service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker enregistré avec succès:', registration.scope);
        })
        .catch(error => {
          console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        });
    });
  }
}

// Gestionnaire d'état de connexion
export function setupConnectivityListeners(onlineCallback: () => void, offlineCallback: () => void) {
  // Vérifier l'état initial
  if (navigator.onLine) {
    onlineCallback();
  } else {
    offlineCallback();
  }

  // Ajouter des écouteurs pour les changements d'état
  window.addEventListener('online', () => {
    onlineCallback();
    // Informer le service worker du changement d'état
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ONLINE_STATUS_CHANGE',
        online: true
      });
    }
  });

  window.addEventListener('offline', offlineCallback);
}

// Base de données IndexedDB pour le stockage local
const DB_NAME = 'permis-chasse-offline-db';
const DB_VERSION = 1;

// Fonction pour ouvrir la base de données
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Erreur lors de l\'ouverture de la base de données:', event);
      reject(new Error('Impossible d\'ouvrir la base de données'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Créer les object stores nécessaires
      if (!db.objectStoreNames.contains('permits')) {
        db.createObjectStore('permits', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('hunters')) {
        db.createObjectStore('hunters', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('activities')) {
        db.createObjectStore('activities', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingSync')) {
        const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Fonction générique pour stocker des données
export async function storeData<T>(storeName: string, data: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.put(data);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      console.error(`Erreur lors du stockage des données dans ${storeName}:`, event);
      reject(new Error(`Impossible de stocker les données dans ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Fonction générique pour récupérer des données
export async function getData<T>(storeName: string, id: string | number): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la récupération des données depuis ${storeName}:`, event);
      reject(new Error(`Impossible de récupérer les données depuis ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Fonction générique pour récupérer toutes les données
export async function getAllData<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la récupération de toutes les données depuis ${storeName}:`, event);
      reject(new Error(`Impossible de récupérer toutes les données depuis ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Fonction pour enregistrer une requête pour synchronisation ultérieure
export async function savePendingRequest(url: string, method: string, body: any): Promise<void> {
  const pendingRequest = {
    url,
    method,
    body: JSON.stringify(body),
    timestamp: Date.now()
  };
  
  await storeData('pendingSync', pendingRequest);
  
  // Tenter de synchroniser immédiatement si en ligne
  if (navigator.onLine) {
    await syncPendingRequests();
  }
}

// Fonction pour synchroniser les requêtes en attente
export async function syncPendingRequests(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Hors ligne, impossible de synchroniser les requêtes en attente');
    return;
  }
  
  const db = await openDatabase();
  const transaction = db.transaction('pendingSync', 'readwrite');
  const store = transaction.objectStore('pendingSync');
  
  const pendingRequests = await new Promise<any[]>((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = (event) => {
      console.error('Erreur lors de la récupération des requêtes en attente:', event);
      reject(new Error('Impossible de récupérer les requêtes en attente'));
    };
  });
  
  if (pendingRequests.length === 0) {
    console.log('Aucune requête en attente à synchroniser');
    db.close();
    return;
  }
  
  console.log(`Synchronisation de ${pendingRequests.length} requêtes en attente`);
  
  for (const request of pendingRequests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: ['POST', 'PUT', 'PATCH'].includes(request.method) ? request.body : undefined,
        credentials: 'include'
      });
      
      if (response.ok) {
        // Supprimer la requête synchronisée
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(request.id);
          
          deleteRequest.onsuccess = () => {
            resolve();
          };
          
          deleteRequest.onerror = (event) => {
            console.error('Erreur lors de la suppression de la requête synchronisée:', event);
            reject(new Error('Impossible de supprimer la requête synchronisée'));
          };
        });
        
        console.log(`Requête ${request.id} synchronisée avec succès`);
      } else {
        console.error(`Erreur lors de la synchronisation de la requête ${request.id}:`, response.statusText);
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de la requête ${request.id}:`, error);
    }
  }
  
  db.close();
}

// Fonction pour créer un wrapper autour de fetch qui gère le mode hors ligne
export function createOfflineFetch() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    
    try {
      // Essayer d'abord une requête réseau normale
      const response = await originalFetch(input, init);
      
      // Si c'est une requête GET et qu'elle a réussi, mettre en cache la réponse
      if (method === 'GET' && response.ok && url.includes('/api/')) {
        const responseClone = response.clone();
        const responseData = await responseClone.json();
        
        // Déterminer le store approprié en fonction de l'URL
        let storeName = 'misc';
        if (url.includes('/hunters')) {
          storeName = 'hunters';
        } else if (url.includes('/permits')) {
          storeName = 'permits';
        } else if (url.includes('/requests')) {
          storeName = 'requests';
        } else if (url.includes('/activities')) {
          storeName = 'activities';
        }
        
        // Stocker les données dans IndexedDB
        if (Array.isArray(responseData)) {
          // Si c'est un tableau, stocker chaque élément individuellement
          for (const item of responseData) {
            if (item.id) {
              await storeData(storeName, item);
            }
          }
        } else if (responseData.id) {
          // Si c'est un objet unique avec un ID, le stocker
          await storeData(storeName, responseData);
        }
      }
      
      return response;
    } catch (error) {
      // Si la requête réseau échoue et que c'est une requête GET, essayer de récupérer depuis le cache
      if (method === 'GET' && url.includes('/api/')) {
        console.log(`Récupération des données hors ligne pour ${url}`);
        
        // Déterminer le store approprié et l'ID en fonction de l'URL
        let storeName = 'misc';
        let id = null;
        
        // Analyser l'URL pour déterminer le store et l'ID
        if (url.includes('/hunters')) {
          storeName = 'hunters';
          // Extraire l'ID de l'URL si présent (ex: /api/hunters/123)
          const match = url.match(/\/hunters\/(\d+)/);
          id = match ? match[1] : null;
        } else if (url.includes('/permits')) {
          storeName = 'permits';
          const match = url.match(/\/permits\/(\d+)/);
          id = match ? match[1] : null;
        } else if (url.includes('/requests')) {
          storeName = 'requests';
          const match = url.match(/\/requests\/(\d+)/);
          id = match ? match[1] : null;
        } else if (url.includes('/activities')) {
          storeName = 'activities';
          const match = url.match(/\/activities\/(\d+)/);
          id = match ? match[1] : null;
        }
        
        try {
          let data;
          if (id) {
            // Si un ID a été extrait, récupérer cet élément spécifique
            data = await getData(storeName, id);
          } else {
            // Sinon, récupérer tous les éléments du store
            data = await getAllData(storeName);
          }
          
          if (data) {
            // Créer une réponse simulée avec les données du cache
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Cache-Source': 'indexed-db'
              }
            });
          }
        } catch (dbError) {
          console.error('Erreur lors de la récupération des données depuis IndexedDB:', dbError);
        }
      } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && url.includes('/api/')) {
        // Pour les requêtes de modification, les enregistrer pour synchronisation ultérieure
        console.log(`Enregistrement de la requête ${method} ${url} pour synchronisation ultérieure`);
        
        let body = null;
        if (init?.body) {
          if (typeof init.body === 'string') {
            body = JSON.parse(init.body);
          } else if (init.body instanceof FormData) {
            // Convertir FormData en objet
            const formData = init.body;
            body = {};
            formData.forEach((value, key) => {
              body[key] = value;
            });
          }
        }
        
        await savePendingRequest(url, method, body);
        
        // Retourner une réponse simulée pour indiquer que la requête a été mise en file d'attente
        return new Response(JSON.stringify({
          success: true,
          message: 'Requête mise en file d\'attente pour synchronisation ultérieure',
          offlineQueued: true
        }), {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
            'X-Offline-Queued': 'true'
          }
        });
      }
      
      // Si tout échoue, propager l'erreur
      throw error;
    }
  };
}

// Fonction pour initialiser toutes les fonctionnalités PWA
export function initPWA() {
  registerServiceWorker();
  createOfflineFetch();
  
  setupConnectivityListeners(
    // Callback en ligne
    () => {
      console.log('Application en ligne');
      document.body.classList.remove('offline-mode');
      // Tenter de synchroniser les requêtes en attente
      syncPendingRequests().catch(error => {
        console.error('Erreur lors de la synchronisation des requêtes en attente:', error);
      });
    },
    // Callback hors ligne
    () => {
      console.log('Application hors ligne');
      document.body.classList.add('offline-mode');
    }
  );
}
