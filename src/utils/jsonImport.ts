import { db, type Participant, type Matchbox, type MatchingNight, type Penalty, type BroadcastNote } from '../lib/db'

// Interface für die JSON-Import-Daten
export interface JsonImportData {
  participants: Participant[]
  matchboxes: (Matchbox | { womanId: string; manId: string; [key: string]: any })[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
  broadcastNotes?: BroadcastNote[]
}

/**
 * Lädt eine spezifische JSON-Datei und importiert die Daten in die Datenbank
 * @param fileName - Der Name der JSON-Datei (z.B. "ayto-complete-export-2025-09-08.json")
 * @param version - Die Version für die neue JSON-Datei (z.B. "0.2.1")
 * @returns Promise<boolean> - true wenn erfolgreich, false bei Fehler
 */
export async function importJsonDataForVersion(fileName: string, version: string): Promise<boolean> {
  try {
    // Lade die spezifische JSON-Datei (ohne Cache) und mit Cache-Busting
    const response = await fetch(`/json/${fileName}?t=${Date.now()}`, { cache: 'no-store' })
    
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
        await db.participants.bulkPut(jsonData.participants)
      }
      
      if (jsonData.matchboxes && jsonData.matchboxes.length > 0) {
        // Transformiere Matchbox-Daten: womanId/manId -> woman/man
        const transformedMatchboxes = jsonData.matchboxes.map((matchbox: any) => ({
          ...matchbox,
          woman: matchbox.womanId || matchbox.woman,
          man: matchbox.manId || matchbox.man,
          // Entferne die alten Felder
          womanId: undefined,
          manId: undefined,
          // Stelle sicher, dass createdAt und updatedAt gesetzt sind
          createdAt: matchbox.createdAt ? new Date(matchbox.createdAt) : new Date(),
          updatedAt: matchbox.updatedAt ? new Date(matchbox.updatedAt) : new Date()
        }))
        await db.matchboxes.bulkPut(transformedMatchboxes)
      }
      
      if (jsonData.matchingNights && jsonData.matchingNights.length > 0) {
        // Transformiere Matching Night-Daten
        const transformedMatchingNights = jsonData.matchingNights.map((matchingNight: any) => ({
          ...matchingNight,
          // Stelle sicher, dass createdAt gesetzt ist
          createdAt: matchingNight.createdAt ? new Date(matchingNight.createdAt) : new Date()
        }))
        await db.matchingNights.bulkPut(transformedMatchingNights)
      }
      
      if (jsonData.penalties && jsonData.penalties.length > 0) {
        // Transformiere Penalty-Daten
        const transformedPenalties = jsonData.penalties.map((penalty: any) => ({
          ...penalty,
          // Stelle sicher, dass createdAt gesetzt ist
          createdAt: penalty.createdAt ? new Date(penalty.createdAt) : new Date()
        }))
        await db.penalties.bulkPut(transformedPenalties)
      }
      
      if (jsonData.broadcastNotes && jsonData.broadcastNotes.length > 0) {
        // Transformiere Broadcast Notes-Daten
        const transformedBroadcastNotes = jsonData.broadcastNotes.map((note: any) => ({
          ...note,
          // Stelle sicher, dass createdAt und updatedAt gesetzt sind
          createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date()
        }))
        await db.broadcastNotes.bulkPut(transformedBroadcastNotes)
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
 * Exportiert den aktuellen Datenbankstand und macht ihn für alle verfügbar
 * @returns Promise<{success: boolean, fileName?: string, error?: string}>
 */
export async function exportCurrentDatabaseState(): Promise<{success: boolean, fileName?: string, error?: string}> {
  try {
    // Alle Daten aus der Datenbank laden
    const [participantsData, matchingNightsData, matchboxesData, penaltiesData, broadcastNotesData] = await Promise.all([
      db.participants.toArray(),
      db.matchingNights.toArray(),
      db.matchboxes.toArray(),
      db.penalties.toArray(),
      db.broadcastNotes.toArray()
    ])
    
    // Matchbox-Daten für Export verwenden (keine Transformation mehr nötig)
    const transformedMatchboxes = matchboxesData.map(m => ({
      id: m.id,
      woman: m.woman,
      man: m.man,
      matchType: m.matchType,
      price: m.price,
      buyer: m.buyer,
      ausstrahlungsdatum: m.ausstrahlungsdatum,
      ausstrahlungszeit: m.ausstrahlungszeit,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }))
    
    // Komplette Datenstruktur erstellen
    const allData: JsonImportData = {
      participants: participantsData,
      matchingNights: matchingNightsData,
      matchboxes: transformedMatchboxes,
      penalties: penaltiesData,
      broadcastNotes: broadcastNotesData
    }
    
    // Dateiname mit aktuellem Datum erstellen
    const today = new Date().toISOString().split('T')[0]
    const fileName = `ayto-complete-export-${today}.json`
    
    // JSON-String erstellen
    const jsonString = JSON.stringify(allData, null, 2)
    
    // Blob erstellen und Download auslösen
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    
    // Index.json aktualisieren (simuliert - in echter App würde das über Server passieren)
    await updateIndexJson(fileName)
    
    const totalItems = participantsData.length + matchingNightsData.length + matchboxesData.length + penaltiesData.length + broadcastNotesData.length
    console.log(`✅ Datenbankstand exportiert: ${fileName}`)
    console.log(`📊 ${participantsData.length} Teilnehmer, ${matchingNightsData.length} Matching Nights, ${matchboxesData.length} Matchboxes, ${penaltiesData.length} Strafen, ${broadcastNotesData.length} Notizen`)
    console.log(`📈 Gesamt: ${totalItems} Einträge`)
    
    return { success: true, fileName }
    
  } catch (error) {
    console.error('❌ Fehler beim Exportieren des Datenbankstands:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    }
  }
}

/**
 * Aktualisiert die index.json mit der neuesten Export-Datei
 * @param fileName - Name der neuen Export-Datei
 */
async function updateIndexJson(fileName: string): Promise<void> {
  try {
    // Lade aktuelle index.json
    const response = await fetch('/json/index.json')
    let currentFiles: string[] = []
    
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        currentFiles = data
      }
    }
    
    // Neue Datei hinzufügen, falls nicht bereits vorhanden
    if (!currentFiles.includes(fileName)) {
      currentFiles.unshift(fileName) // An den Anfang der Liste setzen
      
      // Nur die neuesten 5 Dateien behalten
      currentFiles = currentFiles.slice(0, 5)
      
      console.log(`📝 Index.json würde aktualisiert werden mit:`, currentFiles)
      console.log(`ℹ️ In einer echten App würde hier die index.json auf dem Server aktualisiert werden`)
    }
  } catch (error) {
    console.warn('⚠️ Konnte index.json nicht aktualisieren:', error)
  }
}

/**
 * Lädt verfügbare JSON-Dateien dynamisch
 * @returns Promise<string[]> - Liste der verfügbaren JSON-Dateien
 */
export async function getAvailableJsonFiles(): Promise<string[]> {
  try {
    // Optionales Manifest unter /public/json/index.json verwenden (nur akzeptieren, wenn JSON)
    const manifestResponse = await fetch('/json/index.json', { cache: 'no-store' })
    if (manifestResponse.ok) {
      const manifestType = manifestResponse.headers.get('content-type') || ''
      if (!manifestType.includes('application/json')) {
        console.warn('Manifest /json/index.json hat unerwarteten Content-Type:', manifestType)
      } else {
        const files: unknown = await manifestResponse.json()
      if (Array.isArray(files)) {
        // Nur tatsächlich erreichbare JSON-Dateien zurückgeben (Content-Type prüfen)
        const checks = await Promise.all(files.map(async (name) => {
          try {
            if (typeof name !== 'string') return null
            const url = `/json/${name}`
            const res = await fetch(url, { cache: 'no-store' })
            if (!res.ok) return null
            const type = res.headers.get('content-type') || ''
            return type.includes('application/json') ? name : null
          } catch {
            return null
          }
        }))
        return checks.filter((n): n is string => Boolean(n))
      }
      }
    }

    // Kein Manifest vorhanden oder ungültig → keine Liste anzeigen, um Phantom-Dateien zu vermeiden
    return []
  } catch (error) {
    console.error('Fehler beim Laden der verfügbaren JSON-Dateien:', error)
    return []
  }
}
