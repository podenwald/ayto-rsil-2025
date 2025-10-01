/**
 * Custom Hook für die App-Initialisierung
 * 
 * Kapselt die gesamte Bootstrap-Logik und Datenbank-Initialisierung.
 * Folgt dem Single Responsibility Principle.
 */

import { useEffect, useState } from 'react'
import { DatabaseUtils } from '@/lib/db'
import type { 
  Participant, 
  MatchingNight, 
  Matchbox, 
  Penalty,
  DatabaseImport 
} from '@/types'
import { extractDateFromFilename } from '@/utils/jsonVersion'

interface UseAppInitializationResult {
  isInitializing: boolean
  initError: string | null
}

/**
 * Hook für die App-Initialisierung
 * 
 * Verantwortlichkeiten:
 * - Prüfung, ob Daten bereits vorhanden sind
 * - Laden von Seed-Daten aus JSON-Dateien
 * - Fehlerbehandlung bei der Initialisierung
 */
export function useAppInitialization(): UseAppInitializationResult {
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    const bootstrap = async () => {
      try {
        console.log('🚀 Starte App-Initialisierung...')
        
        // Debugging: Umgebungsinformationen
        if (typeof window !== 'undefined') {
          console.log('🌐 Browser-Umgebung:', {
            url: window.location.href,
            origin: window.location.origin,
            userAgent: navigator.userAgent,
            online: navigator.onLine
          })
        }
        
        // Überspringen, wenn bereits Daten vorhanden sind
        if (!(await DatabaseUtils.isEmpty())) {
          console.log('✅ Datenbank bereits initialisiert, überspringe Seed-Loading')
          setIsInitializing(false)
          return
        }
        
        // Leere Browser-Cache für JSON-Dateien
        await clearJsonCache()
        
        // Deaktiviere Service Worker temporär, falls er Probleme verursacht
        await disableServiceWorkerIfNeeded()

        // Teste Erreichbarkeit der JSON-Dateien
        await testJsonAvailability()

        console.log('📥 Datenbank ist leer, lade Seed-Daten...')
        
        // Lade Seed-Daten mit Retry-Logik
        const seedData = await loadSeedDataWithRetry()
        
        console.log('💾 Importiere Seed-Daten in die Datenbank...')
        
        // Importiere Daten atomar
        await DatabaseUtils.importData(seedData)
        
        console.log('✅ App-Initialisierung erfolgreich abgeschlossen')
      } catch (err: unknown) {
        console.error('❌ Bootstrap-Fehler:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Initialisieren'
        setInitError(errorMessage)
      } finally {
        setIsInitializing(false)
      }
    }

    bootstrap()
  }, [])

  return { isInitializing, initError }
}

/**
 * Leert den Browser-Cache für JSON-Dateien
 */
async function clearJsonCache(): Promise<void> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          if (request.url.includes('/json/') && request.url.endsWith('.json')) {
            await cache.delete(request)
            console.log(`🗑️ Cache geleert für: ${request.url}`)
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Leeren des Caches:', error)
  }
}

/**
 * Testet die Erreichbarkeit der JSON-Dateien
 */
async function testJsonAvailability(): Promise<void> {
  const testFiles = [
    'ayto-complete-export-2025-10-01.json',
    'ayto-vip-2025.json',
    'ayto-vip-2024.json',
    'ayto-complete-noPicture.json',
    'index.json'
  ]
  
  const possiblePaths = [
    '/json/',
    '/',
    './json/',
    './'
  ]
  
  console.log('🔍 Teste Erreichbarkeit der JSON-Dateien...')
  
  for (const fileName of testFiles) {
    console.log(`📁 Teste ${fileName}:`)
    for (const path of possiblePaths) {
      const url = `${path}${fileName}`
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          cache: 'no-store'
        })
        console.log(`  ${url}: ${response.status} ${response.statusText}`)
      } catch (error) {
        console.warn(`  ${url}: Fehler - ${error instanceof Error ? error.message : 'Unbekannt'}`)
      }
    }
  }
}

/**
 * Deaktiviert den Service Worker temporär, falls er Probleme verursacht
 */
async function disableServiceWorkerIfNeeded(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        // Prüfe, ob der Service Worker JSON-Dateien cached
        if (registration.scope.includes('/json/')) {
          console.log('⚠️ Service Worker könnte JSON-Dateien cachen, deaktiviere temporär')
          await registration.unregister()
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Deaktivieren des Service Workers:', error)
  }
}

/**
 * Lädt Seed-Daten mit Retry-Logik
 */
async function loadSeedDataWithRetry(maxRetries: number = 3): Promise<{
  participants: Participant[]
  matchingNights: MatchingNight[]
  matchboxes: Matchbox[]
  penalties: Penalty[]
}> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Versuch ${attempt}/${maxRetries}: Lade Seed-Daten...`)
      
      // Debugging: Prüfe ob wir im Browser sind
      if (typeof window !== 'undefined') {
        console.log(`🌐 Browser-Umgebung erkannt, aktuelle URL: ${window.location.href}`)
        console.log(`🌐 Base URL: ${window.location.origin}`)
      }
      
      return await loadSeedData()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unbekannter Fehler')
      console.error(`❌ Versuch ${attempt}/${maxRetries} fehlgeschlagen:`, lastError.message)
      console.error(`❌ Vollständiger Fehler:`, error)
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`⏳ Warte ${delay}ms vor nächstem Versuch...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // Detaillierte Fehlerinformationen für Debugging
  const errorDetails = {
    message: lastError?.message || 'Unbekannter Fehler',
    stack: lastError?.stack,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unbekannt',
    url: typeof window !== 'undefined' ? window.location.href : 'Unbekannt',
    timestamp: new Date().toISOString()
  }
  
  console.error('❌ Detaillierte Fehlerinformationen:', errorDetails)
  
  throw new Error(`Seed-Daten konnten nach ${maxRetries} Versuchen nicht geladen werden. Letzter Fehler: ${lastError?.message}`)
}

/**
 * Lädt Seed-Daten aus JSON-Dateien
 */
async function loadSeedData(): Promise<{
  participants: Participant[]
  matchingNights: MatchingNight[]
  matchboxes: Matchbox[]
  penalties: Penalty[]
}> {
  // Liste der möglichen Seed-Dateien in Prioritätsreihenfolge
  const seedFiles = [
    'ayto-complete-export-2025-10-01.json',
    'ayto-vip-2025.json',
    'ayto-vip-2024.json',
    'ayto-complete-noPicture.json'
  ]
  
  // Zusätzliche Pfade für verschiedene Deployment-Szenarien
  const possiblePaths = [
    '/json/',  // Standard-Pfad
    '/',       // Root-Pfad (falls JSON-Dateien im Root sind)
    './json/', // Relativer Pfad
    './'       // Relativer Root-Pfad
  ]
  
  let lastError: Error | null = null
  
  // Versuche jede Datei mit verschiedenen Pfaden
  for (const fileName of seedFiles) {
    for (const path of possiblePaths) {
      const url = `${path}${fileName}`
      try {
        console.log(`🔄 Versuche Seed-Datei: ${url}`)
        
        const response = await fetch(url, { 
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (response.ok) {
          console.log(`✅ Seed-Daten erfolgreich geladen von: ${url}`)
          return await parseSeedData(response)
        } else {
          console.warn(`⚠️ Datei nicht erreichbar (${response.status}): ${url}`)
          lastError = new Error(`HTTP ${response.status}: ${url}`)
        }
      } catch (error) {
        console.warn(`⚠️ Fehler beim Laden von ${url}:`, error)
        lastError = error instanceof Error ? error : new Error(`Unbekannter Fehler: ${url}`)
      }
    }
  }
  
  // Wenn alle Dateien fehlschlagen, versuche das Manifest
  try {
    console.log(`🔄 Versuche Manifest-basierte Seed-Auflösung...`)
    const seedUrl = await resolveSeedUrl()
    console.log(`🔄 Lade Seed-Daten von: ${seedUrl}`)
    
    const response = await fetch(seedUrl, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (response.ok) {
      console.log(`✅ Seed-Daten erfolgreich geladen von: ${seedUrl}`)
      return await parseSeedData(response)
    } else {
      console.warn(`⚠️ Manifest-basierte Auflösung fehlgeschlagen (${response.status}): ${seedUrl}`)
      lastError = new Error(`HTTP ${response.status}: ${seedUrl}`)
    }
  } catch (error) {
    console.warn(`⚠️ Fehler bei Manifest-basierter Auflösung:`, error)
    lastError = error instanceof Error ? error : new Error('Manifest-Auflösung fehlgeschlagen')
  }
  
  // Letzter Versuch: Verwende die neueste verfügbare Datei direkt
  console.log(`🔄 Letzter Versuch: Verwende neueste verfügbare Datei direkt...`)
  const latestFile = 'ayto-complete-export-2025-10-01.json' // Neueste Datei basierend auf dem Dateinamen
  const latestUrl = `/json/${latestFile}`
  
  try {
    console.log(`🔄 Versuche neueste Datei: ${latestUrl}`)
    const response = await fetch(latestUrl, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (response.ok) {
      console.log(`✅ Neueste Datei erfolgreich geladen: ${latestUrl}`)
      return await parseSeedData(response)
    } else {
      console.error(`❌ Auch neueste Datei fehlgeschlagen (${response.status}): ${latestUrl}`)
      lastError = new Error(`HTTP ${response.status}: ${latestUrl}`)
    }
  } catch (error) {
    console.error(`❌ Fehler beim Laden der neuesten Datei:`, error)
    lastError = error instanceof Error ? error : new Error(`Neueste Datei fehlgeschlagen: ${latestUrl}`)
  }
  
  // Notfall-Strategie: Verwende leere Daten als Fallback
  console.warn('⚠️ Alle Seed-Dateien konnten nicht geladen werden. Verwende leere Daten als Fallback.')
  console.warn('⚠️ Letzter Fehler:', lastError?.message)
  
  return {
    participants: [],
    matchingNights: [],
    matchboxes: [],
    penalties: []
  }
}

/**
 * Ermittelt die URL der neuesten Seed-Datei
 */
async function resolveSeedUrl(): Promise<string> {
  try {
    const manifestResp = await fetch('/json/index.json', { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    if (manifestResp.ok) {
      const files = await manifestResp.json()
      if (Array.isArray(files) && files.length > 0) {
        const sorted = files
          .filter((f: unknown) => typeof f === 'string' && (f as string).endsWith('.json'))
          .map((f: string) => ({
            name: f,
            date: extractDateFromFilename(f) ?? new Date(0)
          }))
          .sort((a, b) => b.date.getTime() - a.date.getTime())
        
        if (sorted.length > 0) {
          const selectedFile = sorted[0].name
          console.log(`📁 Verwende Seed-Datei aus Manifest: ${selectedFile}`)
          return `/json/${selectedFile}`
        }
      }
    } else {
      console.warn(`⚠️ Manifest nicht erreichbar (${manifestResp.status}): /json/index.json`)
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Laden des Manifests:', error)
  }
  
  // Fallback: ayto-vip-2025.json als zuverlässige Datenquelle
  console.log('📁 Verwende Fallback Seed-Datei: ayto-vip-2025.json')
  return '/json/ayto-vip-2025.json'
}

/**
 * Parst Seed-Daten aus einer Response
 */
async function parseSeedData(response: Response): Promise<{
  participants: Participant[]
  matchingNights: MatchingNight[]
  matchboxes: Matchbox[]
  penalties: Penalty[]
}> {
  try {
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      throw new Error(`Unerwarteter Inhaltstyp: ${contentType || 'unbekannt'}; Beginn: ${text.slice(0, 80)}`)
    }

    const json = await response.json() as DatabaseImport

    // Validiere die Datenstruktur
    if (!json.participants || !Array.isArray(json.participants)) {
      throw new Error('Ungültige Datenstruktur: participants fehlt oder ist kein Array')
    }

    // Konvertiere Datumsfelder von String zu Date
    const matchingNights: MatchingNight[] = (json.matchingNights || []).map(mn => ({
      ...mn,
      createdAt: new Date(mn.createdAt)
    }))

    const matchboxes: Matchbox[] = (json.matchboxes || []).map(mb => ({
      ...mb,
      createdAt: new Date(mb.createdAt),
      updatedAt: new Date(mb.updatedAt),
      soldDate: mb.soldDate ? new Date(mb.soldDate) : undefined
    }))

    const penalties: Penalty[] = (json.penalties || []).map(p => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }))

    console.log(`📊 Seed-Daten geparst: ${json.participants.length} Teilnehmer, ${matchingNights.length} Matching Nights, ${matchboxes.length} Matchboxes, ${penalties.length} Penalties`)

    return {
      participants: json.participants.map(p => ({
        ...p,
        status: p.status as Participant['status']
      })),
      matchingNights,
      matchboxes,
      penalties
    }
  } catch (error) {
    console.error('❌ Fehler beim Parsen der Seed-Daten:', error)
    throw new Error(`Fehler beim Parsen der Seed-Daten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
  }
}
