import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { isFileNewerThanLast, saveLastImportedJsonFile } from '@/utils/jsonVersion'

export function ImportExport(){
  async function doExport(){
    const all = await db.participants.toArray()
    const blob = new Blob([JSON.stringify(all,null,2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='participants.json'; a.click(); URL.revokeObjectURL(url)
  }
  async function doImport(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]; if(!file) return
    
    try {
      const text = await file.text();
      // Dateinamen-/Datumsprüfung
      const check = isFileNewerThanLast(file.name)
      if (check.isNewer === false) {
        const proceed = confirm(
          `Die ausgewählte Datei scheint nicht neuer zu sein als die zuletzt verwendete.\n\n`+
          `Zuletzt importiert: ${check.lastFileName ?? 'unbekannt'}\n`+
          `Aktuelle Datei: ${file.name}\n\n`+
          `Trotzdem importieren?`
        )
        if (!proceed) return
      }
      const arr = JSON.parse(text);
      
      // Daten normalisieren und Gender-Mapping durchführen
      const normalizedParticipants = arr.map((participant: any) => {
        // Gender-Mapping: w/m -> F/M
        let gender = participant.gender;
        if (gender === 'w' || gender === 'weiblich' || gender === 'female') {
          gender = 'F';
        } else if (gender === 'm' || gender === 'männlich' || gender === 'male') {
          gender = 'M';
        }
        
        // Sicherstellen, dass alle erforderlichen Felder vorhanden sind
        return {
          name: participant.name || 'Unbekannt',
          knownFrom: participant.knownFrom || '',
          age: participant.age ? parseInt(participant.age.toString(), 10) : undefined,
          status: participant.status || 'Aktiv',
          active: participant.active !== false, // Default: aktiv
          photoUrl: participant.photoUrl || '',
          bio: participant.bio || '',
          gender: gender || 'F', // Default: weiblich falls unbekannt
          socialMediaAccount: participant.socialMediaAccount || '',
          // ID wird von der Datenbank automatisch vergeben
          ...(participant.id && { id: participant.id })
        };
      });
      
      console.log('Normalisierte Teilnehmer:', normalizedParticipants);
      
      await db.transaction('rw', db.participants, async () => {
        await db.participants.clear();
        await db.participants.bulkPut(normalizedParticipants);
      });
      
      // Nach Erfolg: Dateiname speichern
      saveLastImportedJsonFile(file.name)
      alert(`Import erfolgreich abgeschlossen!\n\n${normalizedParticipants.length} Teilnehmer wurden importiert.`);
      location.reload();
    } catch (error) {
      console.error('Fehler beim Import:', error);
      alert(`Fehler beim Import: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nBitte überprüfen Sie die JSON-Datei.`);
    }
  }
  return (
    <div className="flex gap-2">
      <Button onClick={doExport} variant="outline">Export JSON</Button>
      <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 h-10">
        <span>Import JSON</span>
        <input type="file" accept="application/json" className="hidden" onChange={doImport}/>
      </label>
    </div>
  )
}


