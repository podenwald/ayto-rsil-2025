# Changelog

## [0.5.7] - 2025-10-17

### 🚀 Neue Features
- **Mobile Tooltip-Verbesserungen**
  - Tooltips öffnen sich jetzt beim Antippen von Teilnehmern auf mobilen Geräten
  - Toggle-Funktion: Ein-/Ausschalten per Tap
  - Bessere mobile Benutzerfreundlichkeit

### 🔧 PWA-Verbesserungen
- **Theme Color**: Address Bar wird mit korrekter Farbe angezeigt
- **Apple Touch Icon**: iOS-Homescreen-Support hinzugefügt
- **Maskable Icons**: Android adaptive Icons implementiert
- **Vollständige PWA-Compliance**: Alle Standards erfüllt

### 🛠️ UI/UX-Verbesserungen
- **Z-Index-Fixes**: Update-Banner ist jetzt sichtbar über dem Header
- **VersionCheckDialog**: Korrekte Layering-Hierarchie
- **DatabaseUpdateBanner**: Sichtbarkeit verbessert

### 🔄 Versionierung & Build
- **Build-Datum**: Deutsche Zeit (MEZ) korrekt angezeigt
- **Version-Fix**: Korrekte Version aus package.json gelesen
- **Git-Tag-Integration**: Verbesserte Tag-Erkennung

### 🐛 Bugfixes
- **Perfect Matches**: Korrekte Anzeige in Matching Nights #7, #5 & #4
- **Matchbox-Import**: Datenstruktur-Konsistenz zwischen Export/Import
- **Broadcast-Logik**: Zeitliche Reihenfolge für Perfect Matches korrigiert

### 🎯 Technische Details
- **Git-Tag**: v0.5.7
- **Commit**: d2cffdd
- **Build-Datum**: 2025-10-17T20:27:32.612Z (deutsche Zeit)
- **Environment**: Development/Production korrekt erkannt

---

## [0.3.1] - 2025-09-17

### 🚀 Neue Features
- **Automatische Datenbank-Synchronisation für Deployment**
  - Neues Deployment-System, das sicherstellt, dass der aktuelle Datenbankstand beim Deployment verfügbar ist
  - Automatischer Export der aktuellen Datenbank vor jedem Build
  - Automatische Aktualisierung der `index.json` mit der neuesten Export-Datei

### 🔧 Neue NPM-Scripts
- `npm run deploy` - Komplettes Deployment mit Datenbank-Synchronisation
- `npm run export-db` - Nur Datenbank-Export ohne Build

### 🛠️ Erweiterte Admin-Panel-Funktionen
- Verbesserte "Export für Deployment" Funktion im Admin-Panel
- Detaillierte Export-Informationen und Anweisungen
- Automatische Generierung von Deployment-bereiten JSON-Dateien

### 📁 Neue Scripts
- `scripts/export-current-db.cjs` - Exportiert aktuellen Datenbankstand
- `scripts/deploy-with-db-sync.cjs` - Kompletter Deployment-Prozess
- Erweiterte `scripts/generate-version.cjs` mit DB-Export-Integration

### 📚 Dokumentation
- Vollständige Deployment-Dokumentation in `DEPLOYMENT.md`
- Detaillierte Anweisungen für den neuen Deployment-Prozess
- Troubleshooting-Guide und Best Practices

### 🔄 Verbesserungen
- **App-Initialisierung**: Lädt automatisch die neueste JSON-Datei beim ersten Start
- **Datenbank-Management**: Bessere Synchronisation zwischen IndexedDB und JSON-Exporten
- **Versionierung**: Korrekte Git-Tag-Integration für Versions-Informationen

### 🐛 Bugfixes
- Behebung des Problems, dass neue Benutzer oder nach Cache-Clear veraltete Daten geladen wurden
- Korrekte Sortierung der JSON-Dateien in `index.json` (neueste zuerst)

### 🎯 Technische Details
- **Git-Tag**: v0.3.1
- **Commit**: 9901265
- **Build-Datum**: 2025-09-17T20:13:22.366Z
- **Produktions-Build**: Bereit für Deployment

---

## [0.2.1] - Vorherige Version
- Grundlegende AYTO-Tracker-Funktionalität
- Admin-Panel mit Import/Export-Funktionen
- IndexedDB-Integration
- PWA-Unterstützung
