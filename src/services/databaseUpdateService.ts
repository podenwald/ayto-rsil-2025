/**
 * Service für benutzer-gesteuerte Datenbank-Updates
 * 
 * Implementiert das PWA + IndexedDB Update-System mit:
 * - Versions-Check über manifest.json
 * - Benutzer-gesteuerte Updates
 * - Atomic Updates für Konsistenz
 * - Service Worker Integration
 */

import { DatabaseUtils, db, type Participant, type MatchingNight, type Matchbox, type Penalty } from '@/lib/db'
import type { DatabaseImport, ParticipantDTO, MatchingNightDTO, MatchboxDTO, PenaltyDTO } from '@/types'

// Manifest-Interface
export interface DatabaseManifest {
  version: string
  dataHash: string
  released: string
  description?: string
}

// Update-State-Interface
export interface DatabaseUpdateState {
  isUpdateAvailable: boolean
  currentVersion: string
  latestVersion: string
  currentDataHash: string
  latestDataHash: string
  releasedDate: string
  isUpdating: boolean
  updateError: string | null
}

// Update-Result-Interface
export interface DatabaseUpdateResult {
  success: boolean
  newVersion: string
  newDataHash: string
  releasedDate: string
  error?: string
}

/**
 * Lädt das aktuelle Manifest von der Server
 */
export async function fetchDatabaseManifest(): Promise<DatabaseManifest> {
  try {
    const response = await fetch('/manifest.json', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const manifest: DatabaseManifest = await response.json()
    
    // Validierung
    if (!manifest.version || !manifest.dataHash || !manifest.released) {
      throw new Error('Ungültiges Manifest-Format')
    }
    
    return manifest
  } catch (error) {
    console.error('Fehler beim Laden des Manifests:', error)
    throw new Error(`Manifest konnte nicht geladen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
  }
}

/**
 * Prüft, ob ein Datenbank-Update verfügbar ist
 */
export async function checkForDatabaseUpdate(): Promise<DatabaseUpdateState> {
  try {
    const [manifest, currentVersion, currentDataHash] = await Promise.all([
      fetchDatabaseManifest(),
      DatabaseUtils.getDbVersion(),
      DatabaseUtils.getDataHash()
    ])
    
    // Update verfügbar wenn Version oder Daten-Hash sich geändert haben
    const isUpdateAvailable = manifest.version !== currentVersion || manifest.dataHash !== currentDataHash
    
    return {
      isUpdateAvailable,
      currentVersion,
      latestVersion: manifest.version,
      currentDataHash,
      latestDataHash: manifest.dataHash,
      releasedDate: manifest.released,
      isUpdating: false,
      updateError: null
    }
  } catch (error) {
    console.error('Fehler beim Versions-Check:', error)
    return {
      isUpdateAvailable: false,
      currentVersion: 'unknown',
      latestVersion: 'unknown',
      currentDataHash: 'unknown',
      latestDataHash: 'unknown',
      releasedDate: '',
      isUpdating: false,
      updateError: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}

/**
 * Lädt die aktuellen Daten vom Server
 */
export async function fetchLatestDatabaseData(): Promise<DatabaseImport> {
  try {
    // Verwende immer die aktuellen Daten aus ayto-vip-2025.json
    const dataSources = [
      '/json/ayto-vip-2025.json',
      '/json/ayto-complete-noPicture.json'
    ]
    
    let lastError: Error | null = null
    
    for (const source of dataSources) {
      try {
        const response = await fetch(source, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (response.ok) {
          const data: DatabaseImport = await response.json()
          
          // Validierung der Datenstruktur
          if (data.participants && Array.isArray(data.participants)) {
            console.log(`✅ Daten erfolgreich von ${source} geladen`)
            return data
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unbekannter Fehler')
        console.warn(`⚠️ Fehler beim Laden von ${source}:`, error)
      }
    }
    
    throw lastError || new Error('Keine gültigen Datenquellen gefunden')
  } catch (error) {
    console.error('Fehler beim Laden der Datenbank-Daten:', error)
    throw new Error(`Daten konnten nicht geladen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
  }
}

/**
 * Führt ein atomares Update der Datenbank durch
 */
export async function performDatabaseUpdate(): Promise<DatabaseUpdateResult> {
  try {
    console.log('🔄 Starte Datenbank-Update...')
    
    // 1. Manifest und neue Daten laden
    const [manifest, newData] = await Promise.all([
      fetchDatabaseManifest(),
      fetchLatestDatabaseData()
    ])
    
    console.log(`📥 Neue Daten geladen (Version ${manifest.version}, Hash ${manifest.dataHash})`)
    
    // 2. Atomares Update: Neue Daten zuerst in temporäre Struktur
    await db.transaction('rw', [db.participants, db.matchingNights, db.matchboxes, db.penalties, db.meta], async () => {
      // Alle bestehenden Daten löschen
      await Promise.all([
        db.participants.clear(),
        db.matchingNights.clear(),
        db.matchboxes.clear(),
        db.penalties.clear()
      ])
      
      // DTO -> Domain Mapping mit Typ-Konvertierungen
      const mapParticipant = (p: ParticipantDTO): Participant => ({
        id: p.id,
        name: p.name,
        knownFrom: p.knownFrom,
        age: p.age,
        status: p.status === 'Aktiv' || p.status === 'Inaktiv' ? p.status : undefined,
        active: p.active,
        photoUrl: p.photoUrl,
        bio: p.bio,
        gender: p.gender,
        photoBlob: p.photoBlob,
        socialMediaAccount: p.socialMediaAccount,
        freeProfilePhotoUrl: p.freeProfilePhotoUrl,
        freeProfilePhotoAttribution: p.freeProfilePhotoAttribution,
        freeProfilePhotoLicense: p.freeProfilePhotoLicense
      })

      const mapMatchingNight = (m: MatchingNightDTO): MatchingNight => ({
        id: m.id,
        name: m.name,
        date: m.date,
        pairs: m.pairs,
        totalLights: m.totalLights,
        createdAt: new Date(m.createdAt),
        ausstrahlungsdatum: m.ausstrahlungsdatum,
        ausstrahlungszeit: m.ausstrahlungszeit
      })

      const mapMatchbox = (m: MatchboxDTO): Matchbox => ({
        id: m.id,
        woman: m.woman,
        man: m.man,
        matchType: m.matchType,
        price: m.price,
        buyer: m.buyer,
        soldDate: m.soldDate ? new Date(m.soldDate) : undefined,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
        ausstrahlungsdatum: m.ausstrahlungsdatum,
        ausstrahlungszeit: m.ausstrahlungszeit
      })

      const mapPenalty = (p: PenaltyDTO): Penalty => ({
        id: p.id,
        participantName: p.participantName,
        reason: p.reason,
        amount: p.amount,
        date: p.date,
        description: p.description,
        createdAt: new Date(p.createdAt)
      })

      const participantsMapped = newData.participants.map(mapParticipant)
      const matchingNightsMapped = newData.matchingNights.map(mapMatchingNight)
      const matchboxesMapped = newData.matchboxes.map(mapMatchbox)
      const penaltiesMapped = newData.penalties.map(mapPenalty)

      // Neue Daten einfügen (upsert)
      await Promise.all([
        db.participants.bulkPut(participantsMapped),
        db.matchingNights.bulkPut(matchingNightsMapped),
        db.matchboxes.bulkPut(matchboxesMapped),
        db.penalties.bulkPut(penaltiesMapped)
      ])
      
      // Meta-Daten aktualisieren
      await Promise.all([
        DatabaseUtils.setDbVersion(manifest.version),
        DatabaseUtils.setDataHash(manifest.dataHash),
        DatabaseUtils.setLastUpdateDate(manifest.released)
      ])
    })
    
    console.log(`✅ Datenbank erfolgreich auf Version ${manifest.version} (Hash: ${manifest.dataHash}) aktualisiert`)
    
    return {
      success: true,
      newVersion: manifest.version,
      newDataHash: manifest.dataHash,
      releasedDate: manifest.released
    }
  } catch (error) {
    console.error('❌ Fehler beim Datenbank-Update:', error)
    return {
      success: false,
      newVersion: 'unknown',
      newDataHash: 'unknown',
      releasedDate: '',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}

/**
 * Service Worker Integration: Lädt Daten im Hintergrund vor
 */
export async function preloadDatabaseData(): Promise<void> {
  try {
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cache = await caches.open('ayto-db-cache')
      
      // Manifest cachen
      await cache.add('/manifest.json')
      
      // Datenquellen cachen
      const dataSources = [
        '/json/ayto-vip-2025.json',
        '/json/ayto-complete-noPicture.json'
      ]
      
      for (const source of dataSources) {
        try {
          await cache.add(source)
        } catch (error) {
          console.warn(`⚠️ Konnte ${source} nicht cachen:`, error)
        }
      }
      
      console.log('✅ Datenbank-Daten im Hintergrund geladen')
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Vorladen der Daten:', error)
  }
}

/**
 * Initialisiert den Datenbank-Update-Service
 */
export async function initializeDatabaseUpdateService(): Promise<void> {
  try {
    // Service Worker für Hintergrund-Downloads registrieren
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('✅ Service Worker registriert:', registration)
    }
    
    // Daten im Hintergrund vorladen
    await preloadDatabaseData()
    
    console.log('✅ Datenbank-Update-Service initialisiert')
  } catch (error) {
    console.warn('⚠️ Fehler bei der Initialisierung des Update-Services:', error)
  }
}
