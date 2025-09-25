import Dexie, { type Table } from 'dexie'
import type { 
  Participant, 
  MatchingNight, 
  Matchbox, 
  Penalty,
  DatabaseCounts 
} from '@/types'

// Meta Store Interface für Datenbank-Versionierung
export interface DatabaseMeta {
  key: string
  value: string | number
  updatedAt: Date
}

// Re-export types for backward compatibility
export type { 
  Participant, 
  MatchingNight, 
  Matchbox, 
  Penalty,
  DatabaseCounts 
} from '@/types'

export class AytoDB extends Dexie {
  participants!: Table<Participant, number>
  matchingNights!: Table<MatchingNight, number>
  matchboxes!: Table<Matchbox, number>
  penalties!: Table<Penalty, number>
  meta!: Table<DatabaseMeta, string>

  constructor() {
    super('aytoDB')
    this.version(1).stores({
      participants: '++id, name, gender, status'
    })
    this.version(2).stores({
      participants: '++id, name, gender, status, active'
    }).upgrade(tx => {
      return tx.table('participants').toCollection().modify((p: Participant) => {
        if (p.active === undefined) {
          p.active = (p.status ? String(p.status).toLowerCase() === 'aktiv' : true)
        }
      })
    })
    this.version(3).stores({
      participants: '++id, name, gender, status, active',
      matchingNights: '++id, name, date, pairs, createdAt'
    })
    this.version(4).stores({
      participants: '++id, name, gender, status, active',
      matchingNights: '++id, name, date, pairs, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt'
    })
    this.version(5).stores({
      participants: '++id, name, gender, status, active',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt'
    })
    this.version(6).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt'
    })
    this.version(7).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt',
      penalties: '++id, participantName, reason, amount, date, createdAt'
    })
    this.version(8).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt',
      penalties: '++id, participantName, reason, amount, date, createdAt'
    })
    this.version(9).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt, ausstrahlungsdatum, ausstrahlungszeit',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt, ausstrahlungsdatum, ausstrahlungszeit',
      penalties: '++id, participantName, reason, amount, date, createdAt'
    }).upgrade(tx => {
      // Migration: Übertrage Erstellungsdatum in Ausstrahlungsdatum für bestehende Daten
      return Promise.all([
        tx.table('matchingNights').toCollection().modify((matchingNight: MatchingNight) => {
          if (!matchingNight.ausstrahlungsdatum && matchingNight.createdAt) {
            const createdDate = new Date(matchingNight.createdAt)
            matchingNight.ausstrahlungsdatum = createdDate.toISOString().split('T')[0] // YYYY-MM-DD
            matchingNight.ausstrahlungszeit = createdDate.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
          }
        }),
        tx.table('matchboxes').toCollection().modify((matchbox: Matchbox) => {
          if (!matchbox.ausstrahlungsdatum && matchbox.createdAt) {
            const createdDate = new Date(matchbox.createdAt)
            matchbox.ausstrahlungsdatum = createdDate.toISOString().split('T')[0] // YYYY-MM-DD
            matchbox.ausstrahlungszeit = createdDate.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
          }
        })
      ])
    })
    this.version(10).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt, ausstrahlungsdatum, ausstrahlungszeit',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt, ausstrahlungsdatum, ausstrahlungszeit',
      penalties: '++id, participantName, reason, amount, date, createdAt',
      meta: 'key, value, updatedAt'
    })
  }
}

export const db = new AytoDB()

/**
 * Utility-Funktionen für die Datenbank
 */
export class DatabaseUtils {
  /**
   * Zählt alle Einträge in der Datenbank
   */
  static async getCounts(): Promise<DatabaseCounts> {
    const [participants, matchingNights, matchboxes, penalties] = await Promise.all([
      db.participants.count(),
      db.matchingNights.count(),
      db.matchboxes.count(),
      db.penalties.count()
    ])
    
    return {
      participants,
      matchingNights,
      matchboxes,
      penalties
    }
  }

  /**
   * Prüft, ob die Datenbank leer ist
   */
  static async isEmpty(): Promise<boolean> {
    const counts = await this.getCounts()
    return Object.values(counts).every(count => count === 0)
  }

  /**
   * Leert alle Tabellen atomar
   */
  static async clearAll(): Promise<void> {
    await db.transaction('rw', db.participants, db.matchingNights, db.matchboxes, db.penalties, async () => {
      await Promise.all([
        db.participants.clear(),
        db.matchingNights.clear(),
        db.matchboxes.clear(),
        db.penalties.clear()
      ])
    })
  }

  /**
   * Importiert Daten atomar in die Datenbank
   */
  static async importData(data: {
    participants: Participant[]
    matchingNights: MatchingNight[]
    matchboxes: Matchbox[]
    penalties: Penalty[]
  }): Promise<void> {
    await db.transaction('rw', db.participants, db.matchingNights, db.matchboxes, db.penalties, async () => {
      await Promise.all([
        db.participants.bulkAdd(data.participants),
        db.matchingNights.bulkAdd(data.matchingNights),
        db.matchboxes.bulkAdd(data.matchboxes),
        db.penalties.bulkAdd(data.penalties)
      ])
    })
  }

  /**
   * Exportiert alle Daten aus der Datenbank
   */
  static async exportData(): Promise<{
    participants: Participant[]
    matchingNights: MatchingNight[]
    matchboxes: Matchbox[]
    penalties: Penalty[]
  }> {
    const [participants, matchingNights, matchboxes, penalties] = await Promise.all([
      db.participants.toArray(),
      db.matchingNights.toArray(),
      db.matchboxes.toArray(),
      db.penalties.toArray()
    ])

    return {
      participants,
      matchingNights,
      matchboxes,
      penalties
    }
  }

  /**
   * Meta-Daten-Funktionen für Datenbank-Versionierung
   */
  static async getMetaValue(key: string): Promise<string | number | null> {
    const meta = await db.meta.get(key)
    return meta?.value ?? null
  }

  static async setMetaValue(key: string, value: string | number): Promise<void> {
    await db.meta.put({
      key,
      value,
      updatedAt: new Date()
    })
  }

  static async getDbVersion(): Promise<number> {
    const version = await this.getMetaValue('dbVersion')
    return typeof version === 'number' ? version : 0
  }

  static async setDbVersion(version: number): Promise<void> {
    await this.setMetaValue('dbVersion', version)
  }

  static async getLastUpdateDate(): Promise<string | null> {
    const date = await this.getMetaValue('lastUpdateDate')
    return typeof date === 'string' ? date : null
  }

  static async setLastUpdateDate(date: string): Promise<void> {
    await this.setMetaValue('lastUpdateDate', date)
  }
}


