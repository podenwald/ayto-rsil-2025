/**
 * Service für Teilnehmer-Management
 * 
 * Kapselt alle Business Logic für Teilnehmer-Operationen.
 * Trennt UI von Business Logic.
 */

import { db } from '@/lib/db'
import type { Participant, ParticipantDTO } from '@/types'
import { withErrorHandling, validateRequired, validateStringLength, validateNumberRange } from '@/utils/errorHandling'

export class ParticipantService {
  /**
   * Lädt alle Teilnehmer aus der Datenbank
   */
  static async getAllParticipants(): Promise<Participant[]> {
    return await withErrorHandling(
      () => db.participants.toArray(),
      'Fehler beim Laden der Teilnehmer'
    )
  }

  /**
   * Lädt Teilnehmer nach Geschlecht
   */
  static async getParticipantsByGender(gender: 'F' | 'M'): Promise<Participant[]> {
    return await db.participants.where('gender').equals(gender).toArray()
  }

  /**
   * Lädt aktive Teilnehmer
   */
  static async getActiveParticipants(): Promise<Participant[]> {
    return await withErrorHandling(
      () => db.participants.where('active').equals(1).toArray(),
      'Fehler beim Laden der aktiven Teilnehmer'
    )
  }

  /**
   * Sucht Teilnehmer nach Name oder Show
   */
  static async searchParticipants(query: string): Promise<Participant[]> {
    const allParticipants = await this.getAllParticipants()
    const lowerQuery = query.toLowerCase()
    
    return allParticipants.filter(participant => 
      participant.name.toLowerCase().includes(lowerQuery) ||
      participant.knownFrom.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Erstellt einen neuen Teilnehmer
   */
  static async createParticipant(participant: Omit<Participant, 'id'>): Promise<number> {
    return await db.participants.add(participant)
  }

  /**
   * Aktualisiert einen Teilnehmer
   */
  static async updateParticipant(id: number, updates: Partial<Participant>): Promise<void> {
    await db.participants.update(id, updates)
  }

  /**
   * Löscht einen Teilnehmer
   */
  static async deleteParticipant(id: number): Promise<void> {
    await db.participants.delete(id)
  }

  /**
   * Konvertiert DTO zu Domain-Objekt
   */
  static fromDTO(dto: ParticipantDTO): Participant {
    return {
      ...dto,
      status: dto.status as Participant['status'],
      // Zusätzliche Validierung/Transformation falls nötig
    }
  }

  /**
   * Konvertiert Domain-Objekt zu DTO
   */
  static toDTO(participant: Participant): ParticipantDTO {
    return {
      ...participant,
      // Zusätzliche Transformation falls nötig
    }
  }

  /**
   * Validiert Teilnehmer-Daten
   */
  static validateParticipant(participant: Partial<Participant>): string[] {
    const errors: string[] = []

    try {
      validateRequired(participant.name, 'Name')
      if (participant.name) {
        validateStringLength(participant.name, 'Name', 1, 100)
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        errors.push((error as { message: string }).message)
      }
    }

    if (!participant.gender || !['F', 'M'].includes(participant.gender)) {
      errors.push('Geschlecht muss F oder M sein')
    }

    if (participant.age !== undefined) {
      try {
        validateNumberRange(participant.age, 'Alter', 18, 100)
      } catch (error) {
        if (error && typeof error === 'object' && 'message' in error) {
          errors.push((error as { message: string }).message)
        }
      }
    }

    return errors
  }
}
