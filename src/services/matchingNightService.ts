/**
 * Service für Matching Night Management
 * 
 * Kapselt alle Business Logic für Matching Night-Operationen.
 * Trennt UI von Business Logic.
 */

import { db } from '@/lib/db'
import type { MatchingNight, MatchingNightDTO, Pair } from '@/types'
import { createBroadcastDateTime, sortBroadcastsChronologically } from '@/utils/broadcastUtils'

export class MatchingNightService {
  /**
   * Lädt alle Matching Nights aus der Datenbank
   */
  static async getAllMatchingNights(): Promise<MatchingNight[]> {
    return await db.matchingNights.toArray()
  }

  /**
   * Lädt Matching Nights chronologisch sortiert
   */
  static async getMatchingNightsChronologically(): Promise<MatchingNight[]> {
    const matchingNights = await this.getAllMatchingNights()
    // Filtere nur die mit Broadcast-Zeit für die Sortierung
    const withBroadcastTime = matchingNights.filter(mn => 
      mn.ausstrahlungsdatum && mn.ausstrahlungszeit
    ) as (MatchingNight & { ausstrahlungsdatum: string; ausstrahlungszeit: string })[]
    return sortBroadcastsChronologically(withBroadcastTime)
  }

  /**
   * Erstellt eine neue Matching Night
   */
  static async createMatchingNight(matchingNight: Omit<MatchingNight, 'id' | 'createdAt'>): Promise<number> {
    const now = new Date()
    const newMatchingNight: Omit<MatchingNight, 'id'> = {
      ...matchingNight,
      createdAt: now,
      ausstrahlungsdatum: matchingNight.ausstrahlungsdatum || now.toISOString().split('T')[0], // Heutiges Datum als Standard
      ausstrahlungszeit: matchingNight.ausstrahlungszeit || '21:00' // Standard AYTO Zeit für Matching Nights
    }
    
    console.log('🔧 Service: Erstelle neue Matching Night mit Ausstrahlungsdaten:', newMatchingNight)
    return await db.matchingNights.add(newMatchingNight)
  }

  /**
   * Aktualisiert eine Matching Night
   */
  static async updateMatchingNight(id: number, updates: Partial<MatchingNight>): Promise<void> {
    await db.matchingNights.update(id, updates)
  }

  /**
   * Löscht eine Matching Night
   */
  static async deleteMatchingNight(id: number): Promise<void> {
    await db.matchingNights.delete(id)
  }

  /**
   * Validiert Matching Night-Daten
   */
  static validateMatchingNight(matchingNight: Partial<MatchingNight>): string[] {
    const errors: string[] = []

    if (!matchingNight.name?.trim()) {
      errors.push('Name ist erforderlich')
    }

    if (!matchingNight.date?.trim()) {
      errors.push('Datum ist erforderlich')
    }

    if (!matchingNight.pairs || !Array.isArray(matchingNight.pairs)) {
      errors.push('Paare sind erforderlich')
    } else {
      // Validiere Paare
      for (const pair of matchingNight.pairs) {
        if (!pair.woman?.trim() || !pair.man?.trim()) {
          errors.push('Jedes Paar muss Frau und Mann haben')
        }
      }
    }

    if (matchingNight.totalLights !== undefined && (matchingNight.totalLights < 0 || matchingNight.totalLights > 10)) {
      errors.push('Gesamtlichter müssen zwischen 0 und 10 liegen')
    }

    // Validiere Broadcast-Zeit falls vorhanden
    if (matchingNight.ausstrahlungsdatum && matchingNight.ausstrahlungszeit) {
      try {
        createBroadcastDateTime({
          ausstrahlungsdatum: matchingNight.ausstrahlungsdatum,
          ausstrahlungszeit: matchingNight.ausstrahlungszeit
        })
      } catch (error) {
        errors.push(`Ungültige Broadcast-Zeit: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
      }
    }

    return errors
  }

  /**
   * Konvertiert DTO zu Domain-Objekt
   */
  static fromDTO(dto: MatchingNightDTO): MatchingNight {
    return {
      ...dto,
      createdAt: new Date(dto.createdAt)
    }
  }

  /**
   * Konvertiert Domain-Objekt zu DTO
   */
  static toDTO(matchingNight: MatchingNight): MatchingNightDTO {
    return {
      ...matchingNight,
      createdAt: matchingNight.createdAt.toISOString()
    }
  }

  /**
   * Berechnet die Gesamtlichter basierend auf Perfect Matches
   */
  static calculateTotalLights(pairs: Pair[], perfectMatches: Set<string>): number {
    return pairs.filter(pair => 
      perfectMatches.has(`${pair.man}-${pair.woman}`) || 
      perfectMatches.has(`${pair.woman}-${pair.man}`)
    ).length
  }

  /**
   * Validiert, ob alle Paare gültig sind (keine Duplikate, etc.)
   */
  static validatePairs(pairs: Pair[]): string[] {
    const errors: string[] = []
    const seenPairs = new Set<string>()

    for (const pair of pairs) {
      const pairKey = `${pair.man}-${pair.woman}`
      const reversePairKey = `${pair.woman}-${pair.man}`

      if (seenPairs.has(pairKey) || seenPairs.has(reversePairKey)) {
        errors.push(`Duplikat gefunden: ${pair.man} × ${pair.woman}`)
      }

      seenPairs.add(pairKey)
    }

    return errors
  }
}

