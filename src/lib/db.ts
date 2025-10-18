import Dexie, { type Table } from 'dexie'
import type { 
  Participant, 
  MatchingNight, 
  Matchbox, 
  Penalty,
  ProbabilityCache,
  BroadcastNote,
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
  ProbabilityCache,
  DatabaseCounts,
  BroadcastNote
} from '@/types'

export class AytoDB extends Dexie {
  participants!: Table<Participant, number>
  matchingNights!: Table<MatchingNight, number>
  matchboxes!: Table<Matchbox, number>
  penalties!: Table<Penalty, number>
  probabilityCache!: Table<ProbabilityCache, number>
  broadcastNotes!: Table<BroadcastNote, number>
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
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt'
    })
    this.version(5).stores({
      participants: '++id, name, gender, status, active',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt'
    })
    this.version(6).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt'
    })
    this.version(7).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt',
      penalties: '++id, participantName, reason, amount, date, createdAt'
    })
    this.version(8).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt',
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt',
      penalties: '++id, participantName, reason, amount, date, createdAt'
    })
    this.version(9).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt, ausstrahlungsdatum, ausstrahlungszeit',
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt, ausstrahlungsdatum, ausstrahlungszeit',
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
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt, ausstrahlungsdatum, ausstrahlungszeit',
      penalties: '++id, participantName, reason, amount, date, createdAt',
      meta: 'key, value, updatedAt'
    })
    // Version 11: Wahrscheinlichkeits-Cache hinzufügen
    this.version(11).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt, ausstrahlungsdatum, ausstrahlungszeit',
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt, ausstrahlungsdatum, ausstrahlungszeit',
      penalties: '++id, participantName, reason, amount, date, createdAt',
      probabilityCache: '++id, dataHash, createdAt, updatedAt',
      meta: 'key, value, updatedAt'
    })
    this.version(12).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt, ausstrahlungsdatum, ausstrahlungszeit',
      matchboxes: '++id, woman, man, matchType, price, buyer, soldDate, createdAt, updatedAt, ausstrahlungsdatum, ausstrahlungszeit',
      penalties: '++id, participantName, reason, amount, date, createdAt',
      probabilityCache: '++id, dataHash, createdAt, updatedAt',
      broadcastNotes: '++id, date, notes, createdAt, updatedAt',
      meta: 'key, value, updatedAt'
    })
    this.version(13).stores({
      participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
      matchingNights: '++id, name, date, pairs, totalLights, createdAt, ausstrahlungsdatum, ausstrahlungszeit',
      matchboxes: '++id, woman, man, matchType, price, buyer, createdAt, updatedAt, ausstrahlungsdatum, ausstrahlungszeit',
      penalties: '++id, participantName, reason, amount, date, createdAt',
      probabilityCache: '++id, dataHash, createdAt, updatedAt',
      broadcastNotes: '++id, date, notes, createdAt, updatedAt',
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
   * Holt den aktuellen Wahrscheinlichkeits-Cache basierend auf dem Data-Hash
   */
  static async getProbabilityCache(dataHash: string): Promise<ProbabilityCache | undefined> {
    return await db.probabilityCache.where('dataHash').equals(dataHash).first()
  }

  /**
   * Speichert oder aktualisiert den Wahrscheinlichkeits-Cache
   */
  static async saveProbabilityCache(cache: ProbabilityCache): Promise<number> {
    const existing = await this.getProbabilityCache(cache.dataHash)
    
    if (existing && existing.id) {
      // Update existing cache
      cache.id = existing.id
      cache.updatedAt = new Date()
      await db.probabilityCache.put(cache)
      return existing.id
    } else {
      // Create new cache
      cache.createdAt = new Date()
      cache.updatedAt = new Date()
      return await db.probabilityCache.add(cache)
    }
  }

  /**
   * Löscht alle Wahrscheinlichkeits-Cache-Einträge
   */
  static async clearProbabilityCache(): Promise<void> {
    await db.probabilityCache.clear()
  }

  /**
   * Broadcast Notes Funktionen
   */
  static async getBroadcastNoteByDate(date: string): Promise<BroadcastNote | undefined> {
    return await db.broadcastNotes.where('date').equals(date).first()
  }

  static async saveBroadcastNote(note: BroadcastNote): Promise<number> {
    const existing = await this.getBroadcastNoteByDate(note.date)
    
    if (existing && existing.id) {
      note.id = existing.id
      note.updatedAt = new Date()
      await db.broadcastNotes.put(note)
      return existing.id
    } else {
      note.createdAt = new Date()
      note.updatedAt = new Date()
      return await db.broadcastNotes.add(note)
    }
  }

  static async deleteBroadcastNote(id: number): Promise<void> {
    await db.broadcastNotes.delete(id)
  }

  static async getAllBroadcastNotes(): Promise<BroadcastNote[]> {
    return await db.broadcastNotes.toArray()
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
    // Dexie erlaubt maximal 6 Tabellen in einer Transaktion
    // Daher führen wir die Löschungen sequentiell aus
    await Promise.all([
      db.participants.clear(),
      db.matchingNights.clear(),
      db.matchboxes.clear(),
      db.penalties.clear(),
      db.probabilityCache.clear(),
      db.broadcastNotes.clear()
    ])
  }

  /**
   * Importiert Daten atomar in die Datenbank
   */
  static async importData(data: {
    participants: Participant[]
    matchingNights: MatchingNight[]
    matchboxes: Matchbox[]
    penalties: Penalty[]
    probabilityCache?: ProbabilityCache[]
    broadcastNotes?: BroadcastNote[]
  }): Promise<void> {
    // Dexie erlaubt maximal 6 Tabellen in einer Transaktion
    // Daher importieren wir in zwei separaten Transaktionen
    await db.transaction('rw', db.participants, db.matchingNights, db.matchboxes, db.penalties, async () => {
      await Promise.all([
        db.participants.bulkPut(data.participants),
        db.matchingNights.bulkPut(data.matchingNights),
        db.matchboxes.bulkPut(data.matchboxes),
        db.penalties.bulkPut(data.penalties)
      ])
    })
    
    // Probability Cache separat importieren
    if (data.probabilityCache && data.probabilityCache.length > 0) {
      await db.probabilityCache.bulkPut(data.probabilityCache)
    }
    
    // Broadcast Notes separat importieren
    if (data.broadcastNotes && data.broadcastNotes.length > 0) {
      await db.broadcastNotes.bulkPut(data.broadcastNotes)
    }
  }

  /**
   * Exportiert alle Daten aus der Datenbank
   */
  static async exportData(): Promise<{
    participants: Participant[]
    matchingNights: MatchingNight[]
    matchboxes: Matchbox[]
    penalties: Penalty[]
    probabilityCache: ProbabilityCache[]
    broadcastNotes: BroadcastNote[]
  }> {
    const [participants, matchingNights, matchboxes, penalties, probabilityCache, broadcastNotes] = await Promise.all([
      db.participants.toArray(),
      db.matchingNights.toArray(),
      db.matchboxes.toArray(),
      db.penalties.toArray(),
      db.probabilityCache.toArray(),
      db.broadcastNotes.toArray()
    ])

    return {
      participants,
      matchingNights,
      matchboxes,
      penalties,
      probabilityCache,
      broadcastNotes
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

  static async getDbVersion(): Promise<string> {
    const version = await this.getMetaValue('dbVersion')
    return typeof version === 'string' ? version : 'v0.0.0'
  }

  static async setDbVersion(version: string): Promise<void> {
    await this.setMetaValue('dbVersion', version)
  }

  static async getDataHash(): Promise<string> {
    const hash = await this.getMetaValue('dataHash')
    return typeof hash === 'string' ? hash : 'unknown'
  }

  static async setDataHash(hash: string): Promise<void> {
    await this.setMetaValue('dataHash', hash)
  }

  static async getLastUpdateDate(): Promise<string | null> {
    const date = await this.getMetaValue('lastUpdateDate')
    return typeof date === 'string' ? date : null
  }

  static async setLastUpdateDate(date: string): Promise<void> {
    await this.setMetaValue('lastUpdateDate', date)
  }
}


