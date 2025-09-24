/**
 * Service für Matchbox Management
 * 
 * Kapselt alle Business Logic für Matchbox-Operationen.
 * Trennt UI von Business Logic.
 */

import { db } from '@/lib/db'
import type { Matchbox, MatchboxDTO, MatchType } from '@/types'
import { createBroadcastDateTime, sortBroadcastsChronologically } from '@/utils/broadcastUtils'

export class MatchboxService {
  /**
   * Lädt alle Matchboxes aus der Datenbank
   */
  static async getAllMatchboxes(): Promise<Matchbox[]> {
    return await db.matchboxes.toArray()
  }

  /**
   * Lädt Matchboxes chronologisch sortiert
   */
  static async getMatchboxesChronologically(): Promise<Matchbox[]> {
    const matchboxes = await this.getAllMatchboxes()
    // Filtere nur die mit Broadcast-Zeit für die Sortierung
    const withBroadcastTime = matchboxes.filter(mb => 
      mb.ausstrahlungsdatum && mb.ausstrahlungszeit
    ) as (Matchbox & { ausstrahlungsdatum: string; ausstrahlungszeit: string })[]
    return sortBroadcastsChronologically(withBroadcastTime)
  }

  /**
   * Lädt Matchboxes nach Typ
   */
  static async getMatchboxesByType(type: MatchType): Promise<Matchbox[]> {
    return await db.matchboxes.where('matchType').equals(type).toArray()
  }

  /**
   * Lädt Perfect Matches
   */
  static async getPerfectMatches(): Promise<Matchbox[]> {
    return await this.getMatchboxesByType('perfect')
  }

  /**
   * Lädt No-Matches
   */
  static async getNoMatches(): Promise<Matchbox[]> {
    return await this.getMatchboxesByType('no-match')
  }

  /**
   * Lädt verkaufte Matchboxes
   */
  static async getSoldMatchboxes(): Promise<Matchbox[]> {
    return await this.getMatchboxesByType('sold')
  }

  /**
   * Erstellt eine neue Matchbox
   */
  static async createMatchbox(matchbox: Omit<Matchbox, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date()
    const newMatchbox: Omit<Matchbox, 'id'> = {
      ...matchbox,
      createdAt: now,
      updatedAt: now
    }
    return await db.matchboxes.add(newMatchbox)
  }

  /**
   * Aktualisiert eine Matchbox
   */
  static async updateMatchbox(id: number, updates: Partial<Matchbox>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    }
    await db.matchboxes.update(id, updateData)
  }

  /**
   * Löscht eine Matchbox
   */
  static async deleteMatchbox(id: number): Promise<void> {
    await db.matchboxes.delete(id)
  }

  /**
   * Markiert eine Matchbox als verkauft
   */
  static async sellMatchbox(id: number, price: number, buyer: string): Promise<void> {
    await this.updateMatchbox(id, {
      matchType: 'sold',
      price,
      buyer,
      soldDate: new Date()
    })
  }

  /**
   * Validiert Matchbox-Daten
   */
  static validateMatchbox(matchbox: Partial<Matchbox>): string[] {
    const errors: string[] = []

    if (!matchbox.woman?.trim()) {
      errors.push('Frau ist erforderlich')
    }

    if (!matchbox.man?.trim()) {
      errors.push('Mann ist erforderlich')
    }

    if (!matchbox.matchType || !['perfect', 'no-match', 'sold'].includes(matchbox.matchType)) {
      errors.push('Match-Typ muss perfect, no-match oder sold sein')
    }

    if (matchbox.matchType === 'sold') {
      if (!matchbox.price || matchbox.price <= 0) {
        errors.push('Preis ist für verkaufte Matchboxes erforderlich')
      }
      if (!matchbox.buyer?.trim()) {
        errors.push('Käufer ist für verkaufte Matchboxes erforderlich')
      }
    }

    // Validiere Broadcast-Zeit falls vorhanden
    if (matchbox.ausstrahlungsdatum && matchbox.ausstrahlungszeit) {
      try {
        createBroadcastDateTime({
          ausstrahlungsdatum: matchbox.ausstrahlungsdatum,
          ausstrahlungszeit: matchbox.ausstrahlungszeit
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
  static fromDTO(dto: MatchboxDTO): Matchbox {
    return {
      ...dto,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      soldDate: dto.soldDate ? new Date(dto.soldDate) : undefined
    }
  }

  /**
   * Konvertiert Domain-Objekt zu DTO
   */
  static toDTO(matchbox: Matchbox): MatchboxDTO {
    return {
      ...matchbox,
      createdAt: matchbox.createdAt.toISOString(),
      updatedAt: matchbox.updatedAt.toISOString(),
      soldDate: matchbox.soldDate?.toISOString()
    }
  }

  /**
   * Prüft, ob ein Paar bereits als Perfect Match bestätigt ist
   */
  static async isPerfectMatch(woman: string, man: string): Promise<boolean> {
    const perfectMatches = await this.getPerfectMatches()
    return perfectMatches.some(mb => 
      (mb.woman === woman && mb.man === man) ||
      (mb.woman === man && mb.man === woman)
    )
  }

  /**
   * Prüft, ob ein Paar bereits als No-Match bestätigt ist
   */
  static async isNoMatch(woman: string, man: string): Promise<boolean> {
    const noMatches = await this.getNoMatches()
    return noMatches.some(mb => 
      (mb.woman === woman && mb.man === man) ||
      (mb.woman === man && mb.man === woman)
    )
  }

  /**
   * Berechnet den Gesamtwert aller verkauften Matchboxes
   */
  static async getTotalSalesValue(): Promise<number> {
    const soldMatchboxes = await this.getSoldMatchboxes()
    return soldMatchboxes.reduce((total, matchbox) => total + (matchbox.price || 0), 0)
  }
}

