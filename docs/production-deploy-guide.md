## Produktions-Deployment – Leitfaden (Always up-to-date)

Dieser Leitfaden beschreibt, wie bei jedem Deployment sichergestellt wird, dass auf Production immer die aktuellste App-Version und Datengrundlage verfügbar ist.

### Überblick
- Primärdatenquelle: `public/json/ayto-vip-2025.json`
- Fallback-Datenquelle: `public/json/ayto-complete-noPicture.json`
- Beim Build wird automatisch:
  1) die App-Version aus Git ermittelt
  2) ein tagesaktueller Export erstellt und `ayto-vip-2025.json` damit synchronisiert
  3) das Manifest mit Version (Git-Tag) und Daten-Hash der finalen `ayto-vip-2025.json` generiert

### Voraussetzungen
- Netlify baut den `main` Branch (Production Context)
- Build-Command: `npm run build`
- Publish Directory: `dist`

### Standard-Ablauf für ein Release
1. Änderungen in `main` mergen (Code + Daten im Repo, falls nötig)
2. Optional: Git-Tag setzen (z. B. `v0.5.4`)
3. Netlify-Deploy abwarten
4. Nach dem Deploy: Seite in Production öffnen und Version prüfen:
   - Footer → „Versionsinformationen“
   - Manifest (Aufruf `/manifest.json`) zeigt `version` = Git-Tag, `dataHash` ≠ `unknown`

### Durchführungsreihenfolge (Schritt für Schritt)
1) IndexedDB → JSON aktualisieren (vor dem Deploy)
   - App öffnen → Admin-Panel → Tab „Datenhaltung“
   - „Export für Deployment“ klicken (lädt vollständige JSON des aktuellen IndexedDB‑Stands herunter)
   - Heruntergeladene Datei als `public/json/ayto-vip-2025.json` speichern (vorhandene Datei überschreiben)

2) (Optional) Git-Tag setzen
   - Tag repräsentiert die Release-Version der App (z. B. `v0.5.4`)

3) Deploy starten (Netlify baut `main`)
   - Build-Command: `npm run build`
   - Publish Directory: `dist`
   - Falls Diskrepanzen/Cache-Probleme: „Clear cache and deploy site“ auslösen

4) Post-Deploy prüfen
   - Footer → „Versionsinformationen“ zeigt Git-Tag/Commit, Environment = Production
   - `/manifest.json` → `version` = Git-Tag und `dataHash` ≠ `unknown`
   - `/json/ayto-vip-2025.json` erreichbar; Felder `exportedAt` ≈ Build‑Zeit, `version` = Package-Version

### Was der Build automatisch macht
- `prebuild` führt aus:
  - `scripts/generate-version.cjs` → ermittelt Git-Tag, Commit, Build-Zeit, Production-Flag
  - `scripts/export-current-db.cjs` → erzeugt tagesaktuellen Export und überschreibt `public/json/ayto-vip-2025.json`
  - `scripts/update-manifest.cjs` → schreibt `/public/manifest.json` mit:
    - `version`: aktueller Git-Tag
    - `dataHash`: Hash der finalen `ayto-vip-2025.json`
    - `released`: Datum/Uhrzeit des Tags

Damit sind App-Version (Code) und Daten-Stand (JSON) synchron und eindeutig identifizierbar.

### IndexedDB → JSON aktualisieren (Detail)
Ziel: Production soll immer die aktuellsten Daten nutzen. Primärquelle ist `public/json/ayto-vip-2025.json`. Diese wird vor dem Deployment aus der aktuellen IndexedDB erzeugt.

Schritte:
1) App öffnen → Admin-Panel → Tab „Datenhaltung“
2) „Export für Deployment“ klicken → vollständige JSON wird heruntergeladen
3) Datei lokal als `public/json/ayto-vip-2025.json` speichern (vorhandene Datei überschreiben)
4) Änderungen (falls erforderlich) committen/mergen → Netlify baut automatisch

Hinweise:
- Die Exportdatei `ayto-complete-export-YYYY-MM-DD.json` dient als Fallback. Die App lädt primär `ayto-vip-2025.json`.
- Der Build synchronisiert `ayto-vip-2025.json` zusätzlich mit dem tagesaktuellen Export, und generiert ein Manifest mit Tag/Hash.

### Nach dem Deploy – Checks
- In der App (Footer → „Versionsinformationen“):
  - Version = erwarteter Git-Tag (z. B. `v0.5.4`)
  - Commit = 7-stelliger Prefix des letzten Commits
  - Environment = „Production“
- Manifest unter `/manifest.json`:
  - `version` = Git-Tag
  - `dataHash` ≠ `unknown`
  - `released` plausibel
- JSON-Erreichbarkeit:
  - `GET /json/ayto-vip-2025.json` liefert aktuelle Daten (Feld `exportedAt` ~ Build-Zeit, `version` = Package-Version)

### Häufige Probleme und Lösungen
- Problem: Production zeigt alte Version / alten Tag
  - Ursache: Build hat älteren Commit/Tag gebaut
  - Lösung: In Netlify „Clear cache and deploy site“ auf `main` auslösen
- Problem: Manifest zeigt `dataHash: "unknown"`
  - Ursache: `ayto-vip-2025.json` nicht vorhanden oder nicht synchron
  - Lösung: Erneut deployen, ggf. „Clear cache and deploy site“; sicherstellen, dass `public/json/ayto-vip-2025.json` im Repo vorhanden ist
- Problem: App meldet „Keine JSON-Dateien gefunden“
  - Ursache: `dist/json` fehlt oder Pfade falsch
  - Lösung: Prüfen, dass `public/json/*` existiert (wird von Vite nach `dist/json` kopiert); Build erneut ausführen
- Problem: Service Worker zeigt alten Stand
  - Lösung: Seite hart neu laden (Cmd+Shift+R) oder in DevTools → Application → Service Workers → Update/Unregister; App lädt danach den neuen Build

### Best Practices
- Git-Tag immer auf den aktuellen Release-Commit setzen (falls Tags verwendet werden)
- Keine manuellen Änderungen an `dist/` vornehmen – immer über `npm run build`
- Bei Datenänderungen (z. B. neue Broadcasting-Zeiten) einfach commiten; der Build synchronisiert `ayto-vip-2025.json` automatisch
- Bei Netlify-Problemen: „Clear cache and deploy site“ auf `main`

### Kurzanleitung (TL;DR)
1. Merge nach `main`
2. (Optional) Tag setzen
3. Netlify-Deploy abwarten
4. Prüfen:
   - Footer-Version = erwarteter Tag
   - `/manifest.json` hat korrekte `version` und `dataHash`
   - `/json/ayto-vip-2025.json` ist erreichbar und aktuell

