# Teilnehmer Datenbank Schema

## 📊 Vollständige Feldliste

### Pflichtfelder
- `name` (string) - Name des Teilnehmers
- `gender` ('F' | 'M') - Geschlecht
- `knownFrom` (string) - Bekannt aus (TV-Shows, etc.)

### Optionale Basis-Daten
- `id` (number?) - Eindeutige Datenbank-ID
- `age` (number?) - Alter
- `status` (string?) - Status-Text (meist "aktiv")
- `active` (boolean?) - Aktiv/Inaktiv Flag
- `bio` (string?) - Biografie/Beschreibung

### Media & Fotos
- `photoUrl` (string?) - URL zum offiziellen Profilbild
- `photoBlob` (Blob?) - Lokales Foto als Blob (nur in Browser)
- `freeProfilePhotoUrl` (string?) - URL zu freiem/lizenzfreiem Profilbild
- `freeProfilePhotoAttribution` (string?) - Namensnennung für freies Bild
- `freeProfilePhotoLicense` (string?) - Lizenz des freien Bildes

### Social Media
- `socialMediaAccount` (string?) - Link zu Social Media Account

## 🆕 Neue Felder (erweitert 2025-09-05)

### Free Photo Fields
Diese Felder ermöglichen die Verwendung lizenzfreier Bilder als Alternative zu urheberrechtlich geschützten Bildern:

```json
{
  "freeProfilePhotoUrl": "https://unsplash.com/photos/example-portrait",
  "freeProfilePhotoAttribution": "Photo by Jane Doe on Unsplash", 
  "freeProfilePhotoLicense": "Unsplash License"
}
```

**Unterstützte Lizenzen:**
- `CC BY 4.0` - Creative Commons Attribution
- `CC BY-SA 4.0` - Creative Commons Attribution-ShareAlike
- `CC0` - Public Domain
- `Unsplash License` - Unsplash kostenlose Lizenz
- `Pexels License` - Pexels kostenlose Lizenz
- `Pixabay License` - Pixabay kostenlose Lizenz

### Vollständige JSON-Struktur

```json
{
  "name": "Max Mustermann",
  "knownFrom": "Love Island Germany (2024)",
  "age": 25,
  "status": "aktiv",
  "active": true,
  "photoUrl": "https://example.com/official-photo.jpg",
  "bio": "Fitness-Coach und Reality TV Star",
  "gender": "M",
  "id": 1,
  "socialMediaAccount": "https://instagram.com/max_mustermann",
  "photoBlob": null,
  "freeProfilePhotoUrl": "https://unsplash.com/photos/fitness-model-portrait",
  "freeProfilePhotoAttribution": "Photo by John Smith on Unsplash",
  "freeProfilePhotoLicense": "Unsplash License"
}
```

## 🗄️ Datenbank Migration

Die Datenbank wurde auf Version 8 erweitert:

```javascript
this.version(8).stores({
  participants: '++id, name, gender, status, active, socialMediaAccount, freeProfilePhotoUrl',
  // ... andere Tabellen
})
```

## 📝 Verwendung

### Foto-Priorität
1. `photoUrl` - Offizielles Bild (falls verfügbar)
2. `freeProfilePhotoUrl` - Lizenzfreies Bild (als Fallback)
3. Avatar mit Initialen (falls keine Bilder)

### Social Media Integration
```javascript
if (participant.socialMediaAccount) {
  // Zeige Social Media Link an
}
```

### Lizenz-Attribution
```javascript
if (participant.freeProfilePhotoUrl && participant.freeProfilePhotoAttribution) {
  // Zeige Bildnachweis an
}
```
