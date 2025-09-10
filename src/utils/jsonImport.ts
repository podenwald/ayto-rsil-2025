import { db, type Participant, type Matchbox, type MatchingNight, type Penalty } from '../lib/db'

// Interface für die JSON-Import-Daten
export interface JsonImportData {
  participants: Participant[]
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
}

/**
 * Lädt die neueste JSON-Datei und importiert die Daten in die Datenbank
 * @param version - Die Version für die neue JSON-Datei (z.B. "0.2.1")
 * @returns Promise<boolean> - true wenn erfolgreich, false bei Fehler
 */
export async function importJsonDataForVersion(version: string): Promise<boolean> {
  try {
    // Lade die neueste JSON-Datei
    const jsonFileName = `ayto-complete-export-2025-09-10.json` // Aktuellste Datei
    const response = await fetch(`/json/${jsonFileName}`)
    
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der JSON-Datei: ${response.statusText}`)
    }
    
    const jsonData: JsonImportData = await response.json()
    
    // Lösche alle bestehenden Daten
    await db.transaction('rw', [db.participants, db.matchboxes, db.matchingNights, db.penalties], async () => {
      await db.participants.clear()
      await db.matchboxes.clear()
      await db.matchingNights.clear()
      await db.penalties.clear()
    })
    
    // Importiere neue Daten
    await db.transaction('rw', [db.participants, db.matchboxes, db.matchingNights, db.penalties], async () => {
      if (jsonData.participants && jsonData.participants.length > 0) {
        await db.participants.bulkAdd(jsonData.participants)
      }
      
      if (jsonData.matchboxes && jsonData.matchboxes.length > 0) {
        await db.matchboxes.bulkAdd(jsonData.matchboxes)
      }
      
      if (jsonData.matchingNights && jsonData.matchingNights.length > 0) {
        await db.matchingNights.bulkAdd(jsonData.matchingNights)
      }
      
      if (jsonData.penalties && jsonData.penalties.length > 0) {
        await db.penalties.bulkAdd(jsonData.penalties)
      }
    })
    
    console.log(`✅ JSON-Daten erfolgreich für Version ${version} importiert`)
    return true
    
  } catch (error) {
    console.error('❌ Fehler beim Importieren der JSON-Daten:', error)
    return false
  }
}

/**
 * Erstellt eine neue Version mit JSON-Import
 * @param version - Die neue Versionsnummer
 * @returns Promise<boolean> - true wenn erfolgreich
 */
export async function createVersionWithJsonImport(version: string): Promise<boolean> {
  try {
    // 1. JSON-Daten importieren
    const importSuccess = await importJsonDataForVersion(version)
    
    if (!importSuccess) {
      throw new Error('JSON-Import fehlgeschlagen')
    }
    
    // 2. Version-Info aktualisieren (wird normalerweise vom Build-Script gemacht)
    console.log(`✅ Version ${version} mit JSON-Import erfolgreich erstellt`)
    return true
    
  } catch (error) {
    console.error(`❌ Fehler beim Erstellen der Version ${version}:`, error)
    return false
  }
}

/**
 * Lädt verfügbare JSON-Dateien
 * @returns Promise<string[]> - Liste der verfügbaren JSON-Dateien
 */
export async function getAvailableJsonFiles(): Promise<string[]> {
  try {
    // Für jetzt hardcoded, später könnte man das dynamisch machen
    return [
      'ayto-complete-export-2025-09-10.json',
      'ayto-complete-export-2025-09-08.json'
    ]
  } catch (error) {
    console.error('Fehler beim Laden der verfügbaren JSON-Dateien:', error)
    return []
  }
}
