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

### Was der Build automatisch macht
- `prebuild` führt aus:
  - `scripts/generate-version.cjs` → ermittelt Git-Tag, Commit, Build-Zeit, Production-Flag
  - `scripts/export-current-db.cjs` → erzeugt tagesaktuellen Export und überschreibt `public/json/ayto-vip-2025.json`
  - `scripts/update-manifest.cjs` → schreibt `/public/manifest.json` mit:
    - `version`: aktueller Git-Tag
    - `dataHash`: Hash der finalen `ayto-vip-2025.json`
    - `released`: Datum/Uhrzeit des Tags

Damit sind App-Version (Code) und Daten-Stand (JSON) synchron und eindeutig identifizierbar.

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

