/**
 * Service Worker für AYTO RSIL 2025
 * 
 * Implementiert:
 * - Caching der App-Shell
 * - Hintergrund-Downloads für Datenbank-Updates
 * - Offline-Funktionalität
 * - Cache-Management
 */

const CACHE_NAME = 'ayto-rsil-2025-v1'
const DB_CACHE_NAME = 'ayto-db-cache-v1'

// Dateien, die für die App-Shell gecacht werden sollen
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/avatar-female.svg',
  '/avatar-male.svg'
]

// Datenquellen, die für Updates gecacht werden sollen
const DATA_SOURCES = [
  '/manifest.json',
  '/json/ayto-complete-export-2025-10-03.json',
  '/json/ayto-complete-export-2025-10-02.json',
  '/json/ayto-vip-2025.json',
  '/ayto-complete-noPicture.json'
]

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation gestartet')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: App-Shell wird gecacht')
        return cache.addAll(APP_SHELL_FILES)
      })
      .then(() => {
        console.log('✅ Service Worker: Installation abgeschlossen')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installationsfehler:', error)
      })
  )
})

/**
 * Service Worker Aktivierung
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Aktivierung gestartet')
  
  event.waitUntil(
    Promise.all([
      // Alte Caches löschen
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DB_CACHE_NAME) {
              console.log('🗑️ Service Worker: Alten Cache löschen:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Service Worker sofort übernehmen
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker: Aktivierung abgeschlossen')
    })
  )
})

/**
 * Fetch-Event Handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Nur GET-Requests behandeln
  if (request.method !== 'GET') {
    return
  }
  
  // Manifest und Datenquellen: Immer vom Server laden (für Updates)
  if (url.pathname === '/manifest.json' || DATA_SOURCES.includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Bei erfolgreichem Response: In DB-Cache speichern
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DB_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Bei Netzwerkfehler: Aus Cache laden
          return caches.match(request)
        })
    )
    return
  }
  
  // App-Shell: Cache-First-Strategie
  if (APP_SHELL_FILES.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response
          }
          
          return fetch(request).then((response) => {
            // Nur erfolgreiche Responses cachen
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
            
            return response
          })
        })
    )
    return
  }
  
  // Alle anderen Requests: Netzwerk-First
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request)
      })
  )
})

/**
 * Message-Event Handler für Kommunikation mit der App
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'PRELOAD_DB_DATA':
      handlePreloadDatabaseData()
      break
      
    case 'CLEAR_DB_CACHE':
      handleClearDatabaseCache()
      break
      
    case 'CHECK_DB_UPDATE':
      handleCheckDatabaseUpdate()
      break
      
    default:
      console.log('Service Worker: Unbekannter Message-Typ:', type)
  }
})

/**
 * Lädt Datenbank-Daten im Hintergrund vor
 */
async function handlePreloadDatabaseData() {
  try {
    console.log('📥 Service Worker: Lade Datenbank-Daten vor...')
    
    const cache = await caches.open(DB_CACHE_NAME)
    
    // Alle Datenquellen parallel laden
    const promises = DATA_SOURCES.map(async (source) => {
      try {
        const response = await fetch(source, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (response.ok) {
          await cache.put(source, response.clone())
          console.log(`✅ Service Worker: ${source} vorgeladen`)
        }
      } catch (error) {
        console.warn(`⚠️ Service Worker: Fehler beim Vorladen von ${source}:`, error)
      }
    })
    
    await Promise.all(promises)
    console.log('✅ Service Worker: Datenbank-Daten erfolgreich vorgeladen')
    
    // App über Erfolg benachrichtigen
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'DB_DATA_PRELOADED',
          success: true
        })
      })
    })
  } catch (error) {
    console.error('❌ Service Worker: Fehler beim Vorladen der Daten:', error)
    
    // App über Fehler benachrichtigen
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'DB_DATA_PRELOADED',
          success: false,
          error: error.message
        })
      })
    })
  }
}

/**
 * Löscht den Datenbank-Cache
 */
async function handleClearDatabaseCache() {
  try {
    console.log('🗑️ Service Worker: Lösche Datenbank-Cache...')
    
    const cache = await caches.open(DB_CACHE_NAME)
    const keys = await cache.keys()
    
    await Promise.all(keys.map((key) => cache.delete(key)))
    
    console.log('✅ Service Worker: Datenbank-Cache gelöscht')
    
    // App über Erfolg benachrichtigen
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'DB_CACHE_CLEARED',
          success: true
        })
      })
    })
  } catch (error) {
    console.error('❌ Service Worker: Fehler beim Löschen des Datenbank-Caches:', error)
    
    // App über Fehler benachrichtigen
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'DB_CACHE_CLEARED',
          success: false,
          error: error.message
        })
      })
    })
  }
}

/**
 * Prüft auf Datenbank-Updates
 */
async function handleCheckDatabaseUpdate() {
  try {
    console.log('🔍 Service Worker: Prüfe auf Datenbank-Updates...')
    
    const response = await fetch('/manifest.json', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (response.ok) {
      const manifest = await response.json()
      
      // App über Update-Info benachrichtigen
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'DB_UPDATE_CHECKED',
            manifest
          })
        })
      })
    }
  } catch (error) {
    console.error('❌ Service Worker: Fehler beim Update-Check:', error)
  }
}

console.log('🔧 Service Worker: Script geladen')

