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
        // Überspringen, wenn bereits Daten vorhanden sind
        if (!(await DatabaseUtils.isEmpty())) {
          setIsInitializing(false)
          return
        }

        // Lade Seed-Daten
        const seedData = await loadSeedData()
        
        // Importiere Daten atomar
        await DatabaseUtils.importData(seedData)
      } catch (err: unknown) {
        console.error('Bootstrap-Fehler:', err)
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
  const response = await fetch(seedUrl, { cache: 'no-store' })
  
  if (!response.ok) {
    // Versuche Fallback auf ayto-complete-noPicture.json
    const fallbackUrl = '/ayto-complete-noPicture.json'
    const fallbackResponse = await fetch(fallbackUrl, { cache: 'no-store' })
    
    if (fallbackResponse.ok) {
      return await parseSeedData(fallbackResponse)
    }
    
    throw new Error(`Seed-JSON nicht ladbar (${response.status}): ${seedUrl}`)
  }

  return await parseSeedData(response)
}

/**
 * Ermittelt die URL der neuesten Seed-Datei
 */
async function resolveSeedUrl(): Promise<string> {
  try {
    const manifestResp = await fetch('/json/index.json', { cache: 'no-store' })
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
          return `/json/${sorted[0].name}`
        }
      }
    }
  } catch {
    // Ignorieren und Fallback nutzen
  }
  
  // Fallback: jüngste bekannte Datei im Repo
  return '/json/ayto-complete-export-2025-09-10.json'
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
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(`Unerwarteter Inhaltstyp: ${contentType || 'unbekannt'}; Beginn: ${text.slice(0, 80)}`)
  }

  const json = await response.json() as DatabaseImport

  // Konvertiere Datumsfelder von String zu Date
  const matchingNights: MatchingNight[] = json.matchingNights.map(mn => ({
    ...mn,
    createdAt: new Date(mn.createdAt)
  }))

  const matchboxes: Matchbox[] = json.matchboxes.map(mb => ({
    ...mb,
    createdAt: new Date(mb.createdAt),
    updatedAt: new Date(mb.updatedAt),
    soldDate: mb.soldDate ? new Date(mb.soldDate) : undefined
  }))

  const penalties: Penalty[] = json.penalties.map(p => ({
    ...p,
    createdAt: new Date(p.createdAt)
  }))

  return {
    participants: json.participants.map(p => ({
      ...p,
      status: p.status as Participant['status']
    })),
    matchingNights,
    matchboxes,
    penalties
  }
}
