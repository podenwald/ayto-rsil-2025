# Datenbank-Update-System

## Übersicht

Das benutzer-gesteuerte Datenbank-Update-System ermöglicht es, neue Daten (z.B. wöchentliche Aktualisierungen) zu erkennen und den Nutzern die Kontrolle über den Update-Zeitpunkt zu geben.

## Architektur

### 1. Manifest-basierte Versionierung

**Datei:** `public/manifest.json`
```json
{
  "dbVersion": 1,
  "released": "2025-01-15T08:00:00Z",
  "description": "AYTO RSIL 2025 Datenbank-Versionierung"
}
```

- `dbVersion`: Wird bei jedem Release erhöht
- `released`: ISO-Datum des Releases
- Wird bei jedem Deployment automatisch aktualisiert

### 2. IndexedDB Meta Store

**Erweiterung:** `src/lib/db.ts`
- Neuer `meta` Store für Versions-Informationen
- Speichert aktuelle `dbVersion` und `lastUpdateDate`
- Atomic Updates für Konsistenz

### 3. Update-Service

**Datei:** `src/services/databaseUpdateService.ts`
- Lädt und vergleicht Manifest-Versionen
- Führt atomare Datenbank-Updates durch
- Service Worker Integration für Hintergrund-Downloads

### 4. UI-Komponenten

**Banner:** `src/components/DatabaseUpdateBanner.tsx`
- Zeigt Update-Hinweis an, wenn neue Version verfügbar
- Benutzer kann "Jetzt aktualisieren" oder "Später" wählen
- Integriertes Feedback-System

**Toast:** `src/components/UpdateFeedbackToast.tsx`
- Zeigt Erfolgs- oder Fehlermeldungen an
- Auto-Close nach 5 Sekunden
- Benutzer-freundliches Design

### 5. Service Worker

**Datei:** `public/sw.js`
- Cacht App-Shell und Datenbank-Daten
- Lädt neue Daten im Hintergrund vor
- Offline-Funktionalität

## Workflow

### App-Start
1. Service Worker wird registriert
2. Datenbank-Update-Service wird initialisiert
3. Versions-Check wird durchgeführt
4. Bei neuer Version: Banner wird angezeigt

### Update-Prozess
1. Nutzer klickt "Jetzt aktualisieren"
2. Neue Daten werden vom Server geladen
3. IndexedDB wird atomar aktualisiert
4. Meta-Daten werden aktualisiert
5. Erfolgs-Feedback wird angezeigt

### Deployment
1. Neue Daten werden hochgeladen
2. `scripts/update-manifest.js` wird ausgeführt
3. `dbVersion` wird erhöht
4. `released` wird aktualisiert

## Verwendung

### Automatische Manifest-Aktualisierung

```bash
# Bei jedem Deployment ausführen
node scripts/update-manifest.js
```

### Manuelle Versions-Prüfung

```typescript
import { checkForDatabaseUpdate } from '@/services/databaseUpdateService'

const updateState = await checkForDatabaseUpdate()
if (updateState.isUpdateAvailable) {
  console.log(`Neue Version ${updateState.latestVersion} verfügbar`)
}
```

### Update durchführen

```typescript
import { performDatabaseUpdate } from '@/services/databaseUpdateService'

const result = await performDatabaseUpdate()
if (result.success) {
  console.log(`Update auf Version ${result.newVersion} erfolgreich`)
}
```

## Best Practices

### 1. Atomic Updates
- Neue Daten werden zuerst in temporäre Struktur geladen
- Alte Daten werden erst nach erfolgreichem Import gelöscht
- Verhindert inkonsistente Zustände

### 2. Error Handling
- Umfassende Fehlerbehandlung auf allen Ebenen
- Benutzer-freundliche Fehlermeldungen
- Fallback-Strategien bei Netzwerkfehlern

### 3. Performance
- Hintergrund-Downloads über Service Worker
- Caching für Offline-Funktionalität
- Lazy Loading der Update-Komponenten

### 4. User Experience
- Benutzer entscheidet über Update-Zeitpunkt
- Klare Feedback-Messages
- Keine Unterbrechung der App-Nutzung

## Konfiguration

### Datenquellen
Die folgenden Dateien werden für Updates verwendet:
- `/json/ayto-complete-export-2025-01-15.json`
- `/json/ayto-complete-export-2025-09-17.json`
- `/json/ayto-complete-export-2025-09-24.json`
- `/ayto-complete-noPicture.json`

### Cache-Einstellungen
- App-Shell: Cache-First-Strategie
- Datenbank-Daten: Netzwerk-First-Strategie
- Manifest: Immer vom Server laden

## Troubleshooting

### Update schlägt fehl
1. Netzwerk-Verbindung prüfen
2. Browser-Konsole auf Fehler prüfen
3. Service Worker Status prüfen
4. IndexedDB Quota prüfen

### Banner wird nicht angezeigt
1. Manifest-Datei erreichbar?
2. IndexedDB Meta Store funktioniert?
3. Versions-Check läuft korrekt?

### Service Worker Probleme
1. Browser-Cache leeren
2. Service Worker neu registrieren
3. Offline-Modus testen

## Erweiterungen

### Zukünftige Features
- [ ] Automatische Update-Benachrichtigungen
- [ ] Update-Historie anzeigen
- [ ] Rollback-Funktionalität
- [ ] Delta-Updates für große Datenmengen
- [ ] Update-Statistiken

### API-Erweiterungen
- [ ] REST-API für Update-Status
- [ ] Webhook-Integration
- [ ] A/B-Testing für Updates
- [ ] Graduelle Rollouts

