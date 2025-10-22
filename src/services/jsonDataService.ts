/**
 * JSON-basierte Datenverwaltung
 * 
 * Dieser Service verwaltet alle Daten direkt über JSON-Dateien
 * und synchronisiert sie mit der IndexedDB für bessere Performance.
 */

import { db } from '@/lib/db'
import type { Participant, MatchingNight, Matchbox, Penalty } from '@/types'

export interface JsonDataState {
  participants: Participant[]
  matchingNights: MatchingNight[]
  matchboxes: Matchbox[]
  penalties: Penalty[]
  lastUpdated: string
  version: string
}

export interface JsonDataUpdateResult {
  success: boolean
  message: string
  data?: JsonDataState
}

/**
 * Lädt die aktuellen JSON-Daten vom Server
 */
export async function loadJsonData(): Promise<JsonDataState> {
  try {
    // Versuche verschiedene Datenquellen in Prioritätsreihenfolge
    const dataSources = [
      '/json/ayto-vip-2025.json',  // Primäre Datenquelle (korrekter Pfad)
      '/ayto-vip-2025.json',  // Fallback-Pfad (Root)
      '/json/ayto-vip-2024.json'  // Letzter Fallback
    ]
    
    let lastError: Error | null = null
    
    for (const source of dataSources) {
      try {
        console.log(`🔄 Lade JSON-Daten von: ${source}`)
        
        const response = await fetch(source, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (response.ok) {
          const data: any = await response.json()
          
          // Validierung der Datenstruktur
          if (data.participants && Array.isArray(data.participants)) {
            console.log(`✅ JSON-Daten erfolgreich geladen von: ${source}`)
            
            // Transformiere Matchbox-Daten falls nötig (womanId/manId -> woman/man)
            const transformedMatchboxes = data.matchboxes?.map((mb: any) => ({
              ...mb,
              woman: mb.womanId || mb.woman,
              man: mb.manId || mb.man,
              womanId: undefined,
              manId: undefined
            })) || []
            
            return {
              participants: data.participants || [],
              matchingNights: data.matchingNights || [],
              matchboxes: transformedMatchboxes,
              penalties: data.penalties || [],
              lastUpdated: data.exportedAt || new Date().toISOString(),
              version: data.version || 'unknown'
            }
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unbekannter Fehler')
        console.warn(`⚠️ Fehler beim Laden von ${source}:`, error)
      }
    }
    
    throw lastError || new Error('Keine gültigen JSON-Datenquellen gefunden')
  } catch (error) {
    console.error('Fehler beim Laden der JSON-Daten:', error)
    throw new Error(`JSON-Daten konnten nicht geladen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
  }
}

/**
 * Synchronisiert JSON-Daten mit der IndexedDB
 */
export async function syncJsonToIndexedDB(jsonData: JsonDataState): Promise<void> {
  try {
    console.log('🔄 Synchronisiere JSON-Daten mit IndexedDB...')
    
    await db.transaction('rw', [db.participants, db.matchingNights, db.matchboxes, db.penalties], async () => {
      // Alle Tabellen leeren
      await db.participants.clear()
      await db.matchingNights.clear()
      await db.matchboxes.clear()
      await db.penalties.clear()
      
      // Neue Daten einfügen
      if (jsonData.participants.length > 0) {
        await db.participants.bulkPut(jsonData.participants)
      }
      if (jsonData.matchingNights.length > 0) {
        await db.matchingNights.bulkPut(jsonData.matchingNights)
      }
      if (jsonData.matchboxes.length > 0) {
        await db.matchboxes.bulkPut(jsonData.matchboxes)
      }
      if (jsonData.penalties.length > 0) {
        await db.penalties.bulkPut(jsonData.penalties)
      }
    })
    
    console.log('✅ JSON-Daten erfolgreich mit IndexedDB synchronisiert')
  } catch (error) {
    console.error('Fehler bei der Synchronisation mit IndexedDB:', error)
    throw error
  }
}

/**
 * Lädt JSON-Daten und synchronisiert sie mit der IndexedDB
 */
export async function loadAndSyncJsonData(): Promise<JsonDataState> {
  const jsonData = await loadJsonData()
  await syncJsonToIndexedDB(jsonData)
  return jsonData
}

/**
 * Aktualisiert einen Teilnehmer in der JSON-Datenquelle
 */
export async function updateParticipantInJson(participant: Participant): Promise<JsonDataUpdateResult> {
  try {
    // Lade aktuelle JSON-Daten
    const jsonData = await loadJsonData()
    
    // Aktualisiere den Teilnehmer
    const updatedParticipants = jsonData.participants.map(p => 
      p.id === participant.id ? { ...participant, updatedAt: new Date().toISOString() } : p
    )
    
    // Aktualisiere auch in der IndexedDB
    await db.participants.put(participant)
    
    console.log(`✅ Teilnehmer ${participant.name} in JSON-Datenquelle aktualisiert`)
    console.log('📊 Aktuelle Teilnehmer-Daten:', await db.participants.toArray())
    
    return {
      success: true,
      message: `Teilnehmer ${participant.name} erfolgreich aktualisiert`,
      data: {
        ...jsonData,
        participants: updatedParticipants,
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Teilnehmers:', error)
    return {
      success: false,
      message: `Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Fügt einen neuen Teilnehmer zur JSON-Datenquelle hinzu
 */
export async function addParticipantToJson(participant: Participant): Promise<JsonDataUpdateResult> {
  try {
    // Lade aktuelle JSON-Daten
    const jsonData = await loadJsonData()
    
    // Generiere neue ID
    const maxId = Math.max(0, ...jsonData.participants.map(p => p.id || 0))
    const newParticipant = {
      ...participant,
      id: maxId + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Füge zur IndexedDB hinzu
    await db.participants.add(newParticipant)
    
    console.log(`✅ Neuer Teilnehmer ${newParticipant.name} zur JSON-Datenquelle hinzugefügt`)
    
    return {
      success: true,
      message: `Teilnehmer ${newParticipant.name} erfolgreich hinzugefügt`,
      data: {
        ...jsonData,
        participants: [...jsonData.participants, newParticipant],
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Teilnehmers:', error)
    return {
      success: false,
      message: `Fehler beim Hinzufügen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Löscht einen Teilnehmer aus der JSON-Datenquelle
 */
export async function deleteParticipantFromJson(participantId: number): Promise<JsonDataUpdateResult> {
  try {
    // Lade aktuellen Teilnehmer für Fehlermeldung
    const participant = await db.participants.get(participantId)
    const participantName = participant?.name || `ID ${participantId}`
    
    // Lösche aus IndexedDB
    await db.participants.delete(participantId)
    
    console.log(`✅ Teilnehmer ${participantName} aus JSON-Datenquelle gelöscht`)
    
    return {
      success: true,
      message: `Teilnehmer ${participantName} erfolgreich gelöscht`
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Teilnehmers:', error)
    return {
      success: false,
      message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Lädt alle Daten aus der JSON-Datenquelle (für Admin Panel)
 */
export async function loadAllJsonData(): Promise<{
  participants: Participant[]
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
}> {
  try {
    // Lade JSON-Daten und synchronisiere mit IndexedDB
    const jsonData = await loadAndSyncJsonData()
    
    return {
      participants: jsonData.participants,
      matchboxes: jsonData.matchboxes,
      matchingNights: jsonData.matchingNights,
      penalties: jsonData.penalties
    }
  } catch (error) {
    console.error('Fehler beim Laden aller JSON-Daten:', error)
    
    // Fallback: Lade aus IndexedDB
    console.log('🔄 Fallback: Lade Daten aus IndexedDB...')
    const [participants, matchboxes, matchingNights, penalties] = await Promise.all([
      db.participants.toArray(),
      db.matchboxes.toArray(),
      db.matchingNights.toArray(),
      db.penalties.toArray()
    ])
    
    return { participants, matchboxes, matchingNights, penalties }
  }
}

/**
 * Aktualisiert eine Matchbox in der JSON-Datenquelle
 */
export async function updateMatchboxInJson(matchbox: Matchbox): Promise<JsonDataUpdateResult> {
  try {
    // Aktualisiere in IndexedDB
    await db.matchboxes.put(matchbox)
    
    console.log(`✅ Matchbox ${matchbox.woman} + ${matchbox.man} in JSON-Datenquelle aktualisiert`)
    console.log('📊 Aktuelle Matchbox-Daten:', await db.matchboxes.toArray())
    
    return {
      success: true,
      message: `Matchbox ${matchbox.woman} + ${matchbox.man} erfolgreich aktualisiert`
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Matchbox:', error)
    return {
      success: false,
      message: `Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Löscht eine Matchbox aus der JSON-Datenquelle
 */
export async function deleteMatchboxFromJson(matchboxId: number): Promise<JsonDataUpdateResult> {
  try {
    // Lade aktuelle Matchbox für Fehlermeldung
    const matchbox = await db.matchboxes.get(matchboxId)
    const matchboxName = matchbox ? `${matchbox.woman} + ${matchbox.man}` : `ID ${matchboxId}`
    
    // Lösche aus IndexedDB
    await db.matchboxes.delete(matchboxId)
    
    console.log(`✅ Matchbox ${matchboxName} aus JSON-Datenquelle gelöscht`)
    
    return {
      success: true,
      message: `Matchbox ${matchboxName} erfolgreich gelöscht`
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Matchbox:', error)
    return {
      success: false,
      message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Aktualisiert eine Matching Night in der JSON-Datenquelle
 */
export async function updateMatchingNightInJson(matchingNight: MatchingNight): Promise<JsonDataUpdateResult> {
  try {
    // Aktualisiere in IndexedDB
    await db.matchingNights.put(matchingNight)
    
    console.log(`✅ Matching Night ${matchingNight.name} in JSON-Datenquelle aktualisiert`)
    
    return {
      success: true,
      message: `Matching Night ${matchingNight.name} erfolgreich aktualisiert`
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Matching Night:', error)
    return {
      success: false,
      message: `Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Löscht eine Matching Night aus der JSON-Datenquelle
 */
export async function deleteMatchingNightFromJson(matchingNightId: number): Promise<JsonDataUpdateResult> {
  try {
    // Lade aktuelle Matching Night für Fehlermeldung
    const matchingNight = await db.matchingNights.get(matchingNightId)
    const matchingNightName = matchingNight?.name || `ID ${matchingNightId}`
    
    // Lösche aus IndexedDB
    await db.matchingNights.delete(matchingNightId)
    
    console.log(`✅ Matching Night ${matchingNightName} aus JSON-Datenquelle gelöscht`)
    
    return {
      success: true,
      message: `Matching Night ${matchingNightName} erfolgreich gelöscht`
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Matching Night:', error)
    return {
      success: false,
      message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Aktualisiert eine Strafe in der JSON-Datenquelle
 */
export async function updatePenaltyInJson(penalty: Penalty): Promise<JsonDataUpdateResult> {
  try {
    // Aktualisiere in IndexedDB
    await db.penalties.put(penalty)
    
    console.log(`✅ Strafe für ${penalty.participantName} in JSON-Datenquelle aktualisiert`)
    console.log('📊 Aktuelle Penalty-Daten:', await db.penalties.toArray())
    
    return {
      success: true,
      message: `Strafe für ${penalty.participantName} erfolgreich aktualisiert`
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Strafe:', error)
    return {
      success: false,
      message: `Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Fügt eine neue Strafe zur JSON-Datenquelle hinzu
 */
export async function addPenaltyToJson(penalty: Penalty): Promise<JsonDataUpdateResult> {
  try {
    // Füge zur IndexedDB hinzu
    await db.penalties.add(penalty)
    
    console.log(`✅ Neue Strafe für ${penalty.participantName} zur JSON-Datenquelle hinzugefügt`)
    
    return {
      success: true,
      message: `Strafe für ${penalty.participantName} erfolgreich hinzugefügt`
    }
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Strafe:', error)
    return {
      success: false,
      message: `Fehler beim Hinzufügen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Löscht eine Strafe aus der JSON-Datenquelle
 */
export async function deletePenaltyFromJson(penaltyId: number): Promise<JsonDataUpdateResult> {
  try {
    // Lade aktuelle Strafe für Fehlermeldung
    const penalty = await db.penalties.get(penaltyId)
    const penaltyName = penalty ? `${penalty.participantName} - ${penalty.reason}` : `ID ${penaltyId}`
    
    // Lösche aus IndexedDB
    await db.penalties.delete(penaltyId)
    
    console.log(`✅ Strafe ${penaltyName} aus JSON-Datenquelle gelöscht`)
    
    return {
      success: true,
      message: `Strafe ${penaltyName} erfolgreich gelöscht`
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Strafe:', error)
    return {
      success: false,
      message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

/**
 * Debug-Funktion: Zeigt alle aktuellen Daten an
 * Kann im Browser Console ausgeführt werden: window.debugJsonData()
 */
export async function debugJsonData() {
  try {
    console.log('🔍 === JSON-DATEN DEBUG ===')
    
    const [participants, matchboxes, matchingNights, penalties] = await Promise.all([
      db.participants.toArray(),
      db.matchboxes.toArray(),
      db.matchingNights.toArray(),
      db.penalties.toArray()
    ])
    
    console.log('👥 Teilnehmer:', participants.length, participants)
    console.log('💝 Matchboxes:', matchboxes.length, matchboxes)
    console.log('🌙 Matching Nights:', matchingNights.length, matchingNights)
    console.log('💰 Strafen:', penalties.length, penalties)
    
    console.log('🔍 === ENDE DEBUG ===')
    
    return { participants, matchboxes, matchingNights, penalties }
  } catch (error) {
    console.error('❌ Debug-Fehler:', error)
  }
}

// Globale Funktion für Browser Console
if (typeof window !== 'undefined') {
  (window as any).debugJsonData = debugJsonData
}