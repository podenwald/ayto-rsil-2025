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
      return await loadSeedData()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unbekannter Fehler')
      console.warn(`⚠️ Versuch ${attempt}/${maxRetries} fehlgeschlagen:`, lastError.message)
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`⏳ Warte ${delay}ms vor nächstem Versuch...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
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
  // Ermittele Seed-Quelle: Versuche Manifest /json/index.json, sonst Fallback
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
  
  if (!response.ok) {
    console.warn(`⚠️ Erste Seed-Quelle fehlgeschlagen (${response.status}): ${seedUrl}`)
    
    // Versuche Fallback auf ayto-vip-2025.json
    const fallbackUrl = '/json/ayto-vip-2025.json'
    console.log(`🔄 Versuche Fallback: ${fallbackUrl}`)
    
    const fallbackResponse = await fetch(fallbackUrl, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (fallbackResponse.ok) {
      console.log(`✅ Fallback erfolgreich: ${fallbackUrl}`)
      return await parseSeedData(fallbackResponse)
    }
    
    console.error(`❌ Auch Fallback fehlgeschlagen (${fallbackResponse.status}): ${fallbackUrl}`)
    throw new Error(`Seed-JSON nicht ladbar (${response.status}): ${seedUrl} und Fallback (${fallbackResponse.status}): ${fallbackUrl}`)
  }

  console.log(`✅ Seed-Daten erfolgreich geladen von: ${seedUrl}`)
  return await parseSeedData(response)
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
