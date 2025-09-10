import { db, type Participant, type Matchbox, type MatchingNight, type Penalty } from '../lib/db'

// Interface für die JSON-Import-Daten
export interface JsonImportData {
  participants: Participant[]
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
}

/**
 * Lädt eine spezifische JSON-Datei und importiert die Daten in die Datenbank
 * @param fileName - Der Name der JSON-Datei (z.B. "ayto-complete-export-2025-09-08.json")
 * @param version - Die Version für die neue JSON-Datei (z.B. "0.2.1")
 * @returns Promise<boolean> - true wenn erfolgreich, false bei Fehler
 */
export async function importJsonDataForVersion(fileName: string, version: string): Promise<boolean> {
  try {
    // Lade die spezifische JSON-Datei
    const response = await fetch(`/json/${fileName}`)
    
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der JSON-Datei ${fileName}: ${response.statusText}`)
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
 * @param fileName - Der Name der JSON-Datei
 * @param version - Die neue Versionsnummer
 * @returns Promise<boolean> - true wenn erfolgreich
 */
export async function createVersionWithJsonImport(fileName: string, version: string): Promise<boolean> {
  try {
    // 1. JSON-Daten importieren
    const importSuccess = await importJsonDataForVersion(fileName, version)
    
    if (!importSuccess) {
      throw new Error('JSON-Import fehlgeschlagen')
    }
    
    // 2. Version-Info aktualisieren (wird normalerweise vom Build-Script gemacht)
    console.log(`✅ Version ${version} mit JSON-Import aus ${fileName} erfolgreich erstellt`)
    return true
    
  } catch (error) {
    console.error(`❌ Fehler beim Erstellen der Version ${version} mit ${fileName}:`, error)
    return false
  }
}

/**
 * Lädt verfügbare JSON-Dateien dynamisch
 * @returns Promise<string[]> - Liste der verfügbaren JSON-Dateien
 */
export async function getAvailableJsonFiles(): Promise<string[]> {
  try {
    // Versuche eine bekannte JSON-Datei zu laden, um das Verzeichnis zu testen
    const testResponse = await fetch('/json/ayto-complete-export-2025-09-10.json')
    
    if (!testResponse.ok) {
      console.warn('JSON-Verzeichnis nicht erreichbar, verwende Fallback-Liste')
      // Fallback auf hardcoded Liste
      return [
        'ayto-complete-export-2025-09-10.json',
        'ayto-complete-export-2025-09-08.json'
      ]
    }

    // Da wir das Verzeichnis nicht direkt auflisten können (CORS/Browser-Limitation),
    // verwenden wir eine erweiterte Liste bekannter Dateien
    const knownFiles = [
      'ayto-complete-export-2025-09-10.json',
      'ayto-complete-export-2025-09-08.json'
    ]

    // Teste welche Dateien tatsächlich verfügbar sind
    const availableFiles: string[] = []
    
    for (const fileName of knownFiles) {
      try {
        const response = await fetch(`/json/${fileName}`)
        if (response.ok) {
          availableFiles.push(fileName)
        }
      } catch (error) {
        // Datei nicht verfügbar, überspringen
        console.debug(`Datei ${fileName} nicht verfügbar:`, error)
      }
    }

    return availableFiles.length > 0 ? availableFiles : knownFiles

  } catch (error) {
    console.error('Fehler beim Laden der verfügbaren JSON-Dateien:', error)
    // Fallback auf bekannte Dateien
    return [
      'ayto-complete-export-2025-09-10.json'
    ]
  }
}
