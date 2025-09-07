import Dexie, { type Table } from 'dexie'

export interface Participant {
  id?: number
  name: string
  knownFrom: string
  age?: number
  status?: string
  active?: boolean
  photoUrl?: string
  bio?: string
  gender: 'F' | 'M'
  photoBlob?: Blob
  socialMediaAccount?: string  // Link zu Social Media Account (Instagram, TikTok, etc.)
  freeProfilePhotoUrl?: string  // URL zu freiem Profilbild
  freeProfilePhotoAttribution?: string  // Namensnennung für freies Bild
  freeProfilePhotoLicense?: string  // Lizenz des freien Bildes (CC, etc.)
}

export interface MatchingNight {
  id?: number
  name: string
  date: string
  pairs: Array<{woman: string, man: string}>
  totalLights?: number  // Gesamtanzahl der Lichter aus der Show
  createdAt: Date
  ausstrahlungsdatum?: string  // Ausstrahlungsdatum (YYYY-MM-DD)
  ausstrahlungszeit?: string   // Ausstrahlungszeit (HH:MM)
}

export interface Matchbox {
  id?: number
  woman: string
  man: string
  matchType: 'perfect' | 'no-match' | 'sold'
  price?: number
  buyer?: string
  soldDate?: Date
  createdAt: Date
  updatedAt: Date
  ausstrahlungsdatum?: string  // Ausstrahlungsdatum (YYYY-MM-DD)
  ausstrahlungszeit?: string   // Ausstrahlungszeit (HH:MM)
}

export interface Penalty {
  id?: number
  participantName: string
  reason: string
  amount: number
  date: string
  description?: string
  createdAt: Date
}

export class AytoDB extends Dexie {
  participants!: Table<Participant, number>
  matchingNights!: Table<MatchingNight, number>
  matchboxes!: Table<Matchbox, number>
  penalties!: Table<Penalty, number>

  constructor() {
    super('aytoDB')
    this.version(1).stores({
      participants: '++id, name, gender, status'
    })
    this.version(2).stores({
      participants: '++id, name, gender, status, active'
    }).upgrade(tx => {
      return tx.table('participants').toCollection().modify((p: any) => {
        if (p.active === undefined) p.active = (p.status ? String(p.status).toLowerCase() === 'aktiv' : true)
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
        tx.table('matchingNights').toCollection().modify((matchingNight: any) => {
          if (!matchingNight.ausstrahlungsdatum && matchingNight.createdAt) {
            const createdDate = new Date(matchingNight.createdAt)
            matchingNight.ausstrahlungsdatum = createdDate.toISOString().split('T')[0] // YYYY-MM-DD
            matchingNight.ausstrahlungszeit = createdDate.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
          }
        }),
        tx.table('matchboxes').toCollection().modify((matchbox: any) => {
          if (!matchbox.ausstrahlungsdatum && matchbox.createdAt) {
            const createdDate = new Date(matchbox.createdAt)
            matchbox.ausstrahlungsdatum = createdDate.toISOString().split('T')[0] // YYYY-MM-DD
            matchbox.ausstrahlungszeit = createdDate.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
          }
        })
      ])
    })
  }
}

export const db = new AytoDB()


