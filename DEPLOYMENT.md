# Deployment mit Datenbank-Synchronisation

Dieses Dokument beschreibt den neuen Deployment-Prozess, der sicherstellt, dass der aktuelle Datenbankstand beim Deployment der neuesten Version verfügbar ist.

## Problem

Beim normalen Deployment wird nur der Code aktualisiert, aber die JSON-Daten in `/public/json/` bleiben unverändert. Das führt dazu, dass neue Benutzer oder nach einem Cache-Clear die App mit veralteten Daten startet.

## Lösung

Das neue System exportiert automatisch den aktuellen Datenbankstand vor dem Deployment und stellt sicher, dass die neueste Version der Daten verfügbar ist.

## Deployment-Prozess

### Automatisches Deployment

```bash
npm run deploy
```

Dieses Kommando führt folgende Schritte aus:

1. **Datenbank-Export**: Exportiert den aktuellen Datenbankstand
2. **Index-Update**: Aktualisiert `public/json/index.json` mit der neuesten Datei
3. **Version-Generierung**: Erstellt Versions-Informationen
4. **Build**: Führt den normalen Build-Prozess durch
5. **Deployment-Vorbereitung**: Bereitet alles für das Deployment vor

### Manueller Export

Falls nur die Datenbank exportiert werden soll:

```bash
npm run export-db
```

### Admin-Panel Export

Im Admin-Panel gibt es eine "Export für Deployment" Funktion, die:

- Den aktuellen Datenbankstand exportiert
- Eine JSON-Datei mit aktuellem Datum erstellt
- Die `index.json` aktualisiert (simuliert)
- Eine Download-Datei bereitstellt

## Dateistruktur

```
public/json/
├── index.json                    # Liste der verfügbaren JSON-Dateien
├── ayto-complete-export-2025-01-15.json
├── ayto-complete-export-2025-09-17.json
└── ayto-complete-export-YYYY-MM-DD.json  # Neueste Datei
```

## App-Initialisierung

Beim App-Start:

1. Prüft die App, ob bereits Daten in der IndexedDB vorhanden sind
2. Falls keine Daten vorhanden sind, lädt sie die neueste JSON-Datei aus `index.json`
3. Die neueste Datei wird basierend auf dem Dateinamen (Datum) ermittelt
4. Die Daten werden in die IndexedDB importiert

## Skripte

### `scripts/export-current-db.js`
- Exportiert den aktuellen Datenbankstand
- Erstellt eine neue JSON-Datei mit aktuellem Datum
- Aktualisiert `index.json`

### `scripts/deploy-with-db-sync.js`
- Führt den kompletten Deployment-Prozess durch
- Kombiniert DB-Export, Version-Generierung und Build

### `scripts/generate-version.cjs`
- Generiert Versions-Informationen
- Führt automatisch den DB-Export vor dem Build durch

## Best Practices

1. **Vor jedem Deployment**: Führe `npm run deploy` aus
2. **Nach Datenänderungen**: Exportiere die Daten über das Admin-Panel
3. **Backup**: Behalte alte JSON-Dateien als Backup
4. **Testing**: Teste die App nach dem Deployment mit einem leeren Cache

## Troubleshooting

### Problem: App lädt veraltete Daten
**Lösung**: Führe `npm run export-db` aus und deploye erneut

### Problem: Index.json ist nicht aktuell
**Lösung**: Prüfe die `index.json` und stelle sicher, dass die neueste Datei an erster Stelle steht

### Problem: Build schlägt fehl
**Lösung**: Prüfe die Konsolen-Ausgabe und führe `npm run build` manuell aus

## Sicherheit

- JSON-Dateien enthalten sensible Daten (Teilnehmer, Matches, etc.)
- Stelle sicher, dass nur autorisierte Personen Zugriff auf die JSON-Dateien haben
- Verwende HTTPS für das Deployment
- Implementiere entsprechende Zugriffskontrollen

## Monitoring

Nach dem Deployment:

1. Öffne die App in einem neuen Browser-Tab (oder Incognito-Modus)
2. Prüfe die Browser-Konsole auf Fehler
3. Verifiziere, dass die neuesten Daten geladen wurden
4. Teste alle Funktionen der App

## Versionierung

Die JSON-Dateien enthalten Versions-Informationen:

```json
{
  "participants": [...],
  "matchingNights": [...],
  "matchboxes": [...],
  "penalties": [...],
  "exportedAt": "2025-01-15T10:30:00.000Z",
  "version": "0.3.1",
  "deploymentReady": true
}
```

Dies hilft bei der Nachverfolgung und dem Debugging von Datenproblemen.
