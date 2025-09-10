import { type Matchbox, type MatchingNight } from '../lib/db'

/**
 * Zentrale Utility-Funktionen für zeitbasierte Broadcast-Logik
 * Alle Berechnungen basieren auf ausstrahlungsdatum und ausstrahlungszeit
 */

/**
 * Erstellt einen vollständigen Zeitstempel aus Ausstrahlungsdatum und -zeit
 * @param ausstrahlungsdatum - Datum im Format YYYY-MM-DD
 * @param ausstrahlungszeit - Zeit im Format HH:MM
 * @param fallbackDate - Fallback-Datum falls ausstrahlungsdatum fehlt
 * @returns Date-Objekt mit vollständigem Zeitstempel
 */
export const createBroadcastDateTime = (
  ausstrahlungsdatum?: string,
  ausstrahlungszeit?: string,
  fallbackDate?: Date
): Date => {
  if (ausstrahlungsdatum && ausstrahlungszeit) {
    return new Date(`${ausstrahlungsdatum}T${ausstrahlungszeit}`)
  }
  
  if (ausstrahlungsdatum) {
    return new Date(ausstrahlungsdatum)
  }
  
  return fallbackDate || new Date()
}

/**
 * Erstellt einen Zeitstempel für eine MatchBox
 * @param matchbox - MatchBox Objekt
 * @returns Date-Objekt mit Ausstrahlungszeitstempel
 */
export const getMatchboxBroadcastDateTime = (matchbox: Matchbox): Date => {
  return createBroadcastDateTime(
    matchbox.ausstrahlungsdatum,
    matchbox.ausstrahlungszeit,
    new Date(matchbox.createdAt)
  )
}

/**
 * Erstellt einen Zeitstempel für eine Matching Night
 * @param matchingNight - Matching Night Objekt
 * @returns Date-Objekt mit Ausstrahlungszeitstempel
 */
export const getMatchingNightBroadcastDateTime = (matchingNight: MatchingNight): Date => {
  return createBroadcastDateTime(
    matchingNight.ausstrahlungsdatum,
    matchingNight.ausstrahlungszeit,
    new Date(matchingNight.createdAt)
  )
}

/**
 * Prüft ob eine MatchBox vor einer Matching Night ausgestrahlt wurde
 * @param matchbox - MatchBox Objekt
 * @param matchingNight - Matching Night Objekt
 * @returns true wenn MatchBox vor Matching Night ausgestrahlt wurde
 */
export const isMatchboxAiredBeforeMatchingNight = (
  matchbox: Matchbox,
  matchingNight: MatchingNight
): boolean => {
  const matchboxDateTime = getMatchboxBroadcastDateTime(matchbox)
  const matchingNightDateTime = getMatchingNightBroadcastDateTime(matchingNight)
  
  return matchboxDateTime.getTime() < matchingNightDateTime.getTime()
}

/**
 * Prüft ob eine MatchBox vor einem bestimmten Zeitpunkt ausgestrahlt wurde
 * @param matchbox - MatchBox Objekt
 * @param referenceDateTime - Referenz-Zeitstempel
 * @returns true wenn MatchBox vor dem Referenz-Zeitpunkt ausgestrahlt wurde
 */
export const isMatchboxAiredBeforeDateTime = (
  matchbox: Matchbox,
  referenceDateTime: Date
): boolean => {
  const matchboxDateTime = getMatchboxBroadcastDateTime(matchbox)
  return matchboxDateTime.getTime() < referenceDateTime.getTime()
}

/**
 * Filtert Perfect Match MatchBoxes die vor einer Matching Night ausgestrahlt wurden
 * @param matchboxes - Array von MatchBoxes
 * @param matchingNight - Matching Night Objekt
 * @returns Array von Perfect Match Paaren
 */
export const getValidPerfectMatchesForMatchingNight = (
  matchboxes: Matchbox[],
  matchingNight: MatchingNight
): Array<{ woman: string; man: string }> => {
  return matchboxes
    .filter(mb => {
      if (mb.matchType !== 'perfect') return false
      return isMatchboxAiredBeforeMatchingNight(mb, matchingNight)
    })
    .map(mb => ({ woman: mb.woman, man: mb.man }))
}

/**
 * Filtert Perfect Match MatchBoxes die vor einem bestimmten Zeitpunkt ausgestrahlt wurden
 * @param matchboxes - Array von MatchBoxes
 * @param referenceDateTime - Referenz-Zeitstempel (optional, Standard: aktueller Zeitpunkt)
 * @returns Array von Perfect Match Paaren
 */
export const getValidPerfectMatchesBeforeDateTime = (
  matchboxes: Matchbox[],
  referenceDateTime: Date = new Date()
): Array<{ woman: string; man: string }> => {
  return matchboxes
    .filter(mb => {
      if (mb.matchType !== 'perfect') return false
      return isMatchboxAiredBeforeDateTime(mb, referenceDateTime)
    })
    .map(mb => ({ woman: mb.woman, man: mb.man }))
}

/**
 * Prüft ob ein Paar in einer Matching Night als Perfect Match bestätigt ist
 * @param pair - Paar Objekt mit woman und man
 * @param matchingNight - Matching Night Objekt
 * @param matchboxes - Array von MatchBoxes
 * @returns true wenn das Paar als Perfect Match bestätigt ist
 */
export const isPairConfirmedAsPerfectMatch = (
  pair: { woman: string; man: string },
  matchingNight: MatchingNight,
  matchboxes: Matchbox[]
): boolean => {
  return matchboxes.some(mb => {
    if (mb.woman !== pair.woman || mb.man !== pair.man || mb.matchType !== 'perfect') {
      return false
    }
    return isMatchboxAiredBeforeMatchingNight(mb, matchingNight)
  })
}

/**
 * Zählt die Anzahl der Perfect Match Lichter in einer Matching Night
 * @param pairs - Array von Paaren
 * @param matchingNight - Matching Night Objekt
 * @param matchboxes - Array von MatchBoxes
 * @returns Anzahl der Perfect Match Lichter
 */
export const countPerfectMatchLights = (
  pairs: Array<{ woman: string; man: string }>,
  matchingNight: MatchingNight,
  matchboxes: Matchbox[]
): number => {
  return pairs.filter(pair => 
    isPairConfirmedAsPerfectMatch(pair, matchingNight, matchboxes)
  ).length
}

/**
 * Sortiert Events chronologisch nach Ausstrahlungszeitstempel
 * @param events - Array von Events mit ausstrahlungsdatum und ausstrahlungszeit
 * @param ascending - true für aufsteigende Sortierung (älteste zuerst), false für absteigende (neueste zuerst)
 * @returns Sortiertes Array
 */
export const sortEventsByBroadcastDateTime = <T extends { ausstrahlungsdatum?: string; ausstrahlungszeit?: string }>(
  events: T[],
  ascending: boolean = false
): T[] => {
  return [...events].sort((a, b) => {
    const dateTimeA = createBroadcastDateTime(a.ausstrahlungsdatum, a.ausstrahlungszeit)
    const dateTimeB = createBroadcastDateTime(b.ausstrahlungsdatum, b.ausstrahlungszeit)
    
    return ascending 
      ? dateTimeA.getTime() - dateTimeB.getTime()
      : dateTimeB.getTime() - dateTimeA.getTime()
  })
}

/**
 * Formatiert Ausstrahlungsdatum und -zeit für die Anzeige
 * @param ausstrahlungsdatum - Datum im Format YYYY-MM-DD
 * @param ausstrahlungszeit - Zeit im Format HH:MM
 * @returns Formatiertes Datum und Zeit
 */
export const formatBroadcastDateTime = (
  ausstrahlungsdatum?: string,
  ausstrahlungszeit?: string
): { date: string; time: string } => {
  const dateTime = createBroadcastDateTime(ausstrahlungsdatum, ausstrahlungszeit)
  
  return {
    date: dateTime.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    time: dateTime.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
}

/**
 * Erstellt einen Sort-Key für chronologische Sortierung
 * @param ausstrahlungsdatum - Datum im Format YYYY-MM-DD
 * @param ausstrahlungszeit - Zeit im Format HH:MM
 * @param fallbackDate - Fallback-Datum falls ausstrahlungsdatum fehlt
 * @returns Zeitstempel als Zahl für Sortierung
 */
export const createBroadcastSortKey = (
  ausstrahlungsdatum?: string,
  ausstrahlungszeit?: string,
  fallbackDate?: Date
): number => {
  return createBroadcastDateTime(ausstrahlungsdatum, ausstrahlungszeit, fallbackDate).getTime()
}
