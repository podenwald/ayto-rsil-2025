/**
 * Zentrale Utility-Funktionen für Broadcast-Zeitberechnungen
 * 
 * Alle zeitbasierten Berechnungen müssen sowohl ausstrahlungsdatum als auch
 * ausstrahlungszeit berücksichtigen. Diese Logik ist hier zentralisiert.
 */

import type { BroadcastDateTime, BroadcastInfo, Matchbox, MatchingNight } from '@/types'

/**
 * Kombiniert Ausstrahlungsdatum und -zeit zu einem vollständigen Date-Objekt
 */
export function createBroadcastDateTime(broadcastInfo: BroadcastDateTime): Date {
  const { ausstrahlungsdatum, ausstrahlungszeit } = broadcastInfo
  
  // Validiere Datumsformat (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ausstrahlungsdatum)) {
    throw new Error(`Ungültiges Datumsformat: ${ausstrahlungsdatum}. Erwartet: YYYY-MM-DD`)
  }
  
  // Validiere Zeitformat (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(ausstrahlungszeit)) {
    throw new Error(`Ungültiges Zeitformat: ${ausstrahlungszeit}. Erwartet: HH:MM`)
  }
  
  const [hours, minutes] = ausstrahlungszeit.split(':').map(Number)
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Ungültige Zeit: ${ausstrahlungszeit}. Stunden: 0-23, Minuten: 0-59`)
  }
  
  const date = new Date(ausstrahlungsdatum)
  date.setHours(hours, minutes, 0, 0)
  
  return date
}

/**
 * Extrahiert Ausstrahlungsdatum und -zeit aus einem Date-Objekt
 */
export function extractBroadcastDateTime(date: Date): BroadcastDateTime {
  const ausstrahlungsdatum = date.toISOString().split('T')[0] // YYYY-MM-DD
  const ausstrahlungszeit = date.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
  
  return {
    ausstrahlungsdatum,
    ausstrahlungszeit
  }
}

/**
 * Vergleicht zwei Broadcast-Zeitpunkte chronologisch
 * @returns -1 wenn a vor b, 0 wenn gleich, 1 wenn a nach b
 */
export function compareBroadcastTimes(a: BroadcastInfo, b: BroadcastInfo): number {
  const dateA = createBroadcastDateTime(a)
  const dateB = createBroadcastDateTime(b)
  
  return dateA.getTime() - dateB.getTime()
}

/**
 * Sortiert ein Array von Broadcast-Objekten chronologisch (älteste zuerst)
 */
export function sortBroadcastsChronologically<T extends BroadcastInfo>(broadcasts: T[]): T[] {
  return [...broadcasts].sort(compareBroadcastTimes)
}

/**
 * Sortiert ein Array von Broadcast-Objekten chronologisch (neueste zuerst)
 */
export function sortBroadcastsReverseChronologically<T extends BroadcastInfo>(broadcasts: T[]): T[] {
  return [...broadcasts].sort((a, b) => compareBroadcastTimes(b, a))
}

/**
 * Validiert, ob ein Broadcast-Objekt gültige Zeitdaten hat
 */
export function validateBroadcastDateTime(broadcastInfo: BroadcastDateTime): boolean {
  try {
    createBroadcastDateTime(broadcastInfo)
    return true
  } catch {
    return false
  }
}

/**
 * Formatiert eine Broadcast-Zeit für die Anzeige
 */
export function formatBroadcastDateTime(broadcastInfo: BroadcastDateTime): string {
  try {
    const date = createBroadcastDateTime(broadcastInfo)
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return `${broadcastInfo.ausstrahlungsdatum} ${broadcastInfo.ausstrahlungszeit}`
  }
}

/**
 * Erstellt ein Date-Objekt aus einer Matchbox
 */
export function getMatchboxBroadcastDateTime(matchbox: Matchbox): Date {
  if (matchbox.ausstrahlungsdatum && matchbox.ausstrahlungszeit) {
    return createBroadcastDateTime({
      ausstrahlungsdatum: matchbox.ausstrahlungsdatum,
      ausstrahlungszeit: matchbox.ausstrahlungszeit
    })
  }
  // Fallback auf createdAt wenn keine Broadcast-Zeit vorhanden
  return matchbox.createdAt
}

/**
 * Prüft, ob ein Paar als Perfect Match bestätigt ist
 */
export function isPairConfirmedAsPerfectMatch(
  pair: { woman: string; man: string },
  _matchingNight: MatchingNight,
  matchboxes: Matchbox[]
): boolean {
  return matchboxes.some(mb => 
    mb.matchType === 'perfect' &&
    ((mb.woman === pair.woman && mb.man === pair.man) ||
     (mb.woman === pair.man && mb.man === pair.woman))
  )
}

/**
 * Lädt alle Perfect Matches vor einem bestimmten Datum
 */
export function getValidPerfectMatchesBeforeDateTime(matchboxes: Matchbox[], beforeDate: Date): Matchbox[] {
  return matchboxes.filter(mb => {
    if (mb.matchType !== 'perfect') return false
    
    // Nur Matchboxes mit gültigen Ausstrahlungsdaten berücksichtigen
    if (!mb.ausstrahlungsdatum || !mb.ausstrahlungszeit) return false
    
    const broadcastDate = getMatchboxBroadcastDateTime(mb)
    return broadcastDate < beforeDate
  })
}

/**
 * Lädt alle Perfect Matches für eine Matching Night
 */
export function getValidPerfectMatchesForMatchingNight(matchboxes: Matchbox[], matchingNight: MatchingNight): Matchbox[] {
  const matchingNightDate = matchingNight.ausstrahlungsdatum && matchingNight.ausstrahlungszeit 
    ? createBroadcastDateTime({
        ausstrahlungsdatum: matchingNight.ausstrahlungsdatum,
        ausstrahlungszeit: matchingNight.ausstrahlungszeit
      })
    : matchingNight.createdAt

  return getValidPerfectMatchesBeforeDateTime(matchboxes, matchingNightDate)
}

/**
 * Erstellt einen Sort-Key für Broadcast-Zeiten
 */
export function createBroadcastSortKey(broadcastInfo: BroadcastDateTime): string {
  return `${broadcastInfo.ausstrahlungsdatum}T${broadcastInfo.ausstrahlungszeit}`
}

/**
 * Zentrale Logik für Standard-Ausstrahlungsdaten
 * 
 * Diese Funktionen stellen sicher, dass alle erstellten Matchboxes und Matching Nights
 * automatisch die korrekten Ausstrahlungsdaten erhalten.
 */

/**
 * Erstellt Standard-Ausstrahlungsdaten für Matchboxes
 * Matchboxes werden standardmäßig um 20:15 ausgestrahlt
 */
export function createDefaultMatchboxBroadcastData(): BroadcastDateTime {
  const now = new Date()
  return {
    ausstrahlungsdatum: now.toISOString().split('T')[0], // Heutiges Datum
    ausstrahlungszeit: '20:15' // Standard AYTO Zeit für Matchboxes
  }
}

/**
 * Erstellt Standard-Ausstrahlungsdaten für Matching Nights
 * Matching Nights werden standardmäßig um 21:00 ausgestrahlt
 */
export function createDefaultMatchingNightBroadcastData(): BroadcastDateTime {
  const now = new Date()
  return {
    ausstrahlungsdatum: now.toISOString().split('T')[0], // Heutiges Datum
    ausstrahlungszeit: '21:00' // Standard AYTO Zeit für Matching Nights
  }
}

/**
 * Ergänzt ein Matchbox-Objekt um Standard-Ausstrahlungsdaten falls diese fehlen
 */
export function ensureMatchboxBroadcastData<T extends Partial<Matchbox>>(matchbox: T): T & BroadcastDateTime {
  return {
    ...matchbox,
    ausstrahlungsdatum: matchbox.ausstrahlungsdatum || createDefaultMatchboxBroadcastData().ausstrahlungsdatum,
    ausstrahlungszeit: matchbox.ausstrahlungszeit || createDefaultMatchboxBroadcastData().ausstrahlungszeit
  }
}

/**
 * Ergänzt ein Matching Night-Objekt um Standard-Ausstrahlungsdaten falls diese fehlen
 */
export function ensureMatchingNightBroadcastData<T extends Partial<MatchingNight>>(matchingNight: T): T & BroadcastDateTime {
  return {
    ...matchingNight,
    ausstrahlungsdatum: matchingNight.ausstrahlungsdatum || createDefaultMatchingNightBroadcastData().ausstrahlungsdatum,
    ausstrahlungszeit: matchingNight.ausstrahlungszeit || createDefaultMatchingNightBroadcastData().ausstrahlungszeit
  }
}