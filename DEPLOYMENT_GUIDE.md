# Deployment Guide - GitHub Actions

## Automatische Deployments

### 1. Normales Deployment (Code-Änderungen)
```bash
git add .
git commit -m "Neue Features hinzugefügt"
git push origin main
```
→ **Automatisch:** Manifest wird aktualisiert, App wird gebaut und deployed

### 2. Manuelles Deployment (nur Datenbank-Update)
1. Gehe zu **Actions** Tab in GitHub
2. Wähle **"Update Database Only"**
3. Klicke **"Run workflow"**
4. Gib eine Update-Nachricht ein (z.B. "Neue Teilnehmer-Daten")
5. Klicke **"Run workflow"**

→ **Ergebnis:** Nur die Datenbank-Version wird erhöht und deployed

## Workflow-Übersicht

### `deploy.yml` - Standard Deployment
- **Trigger:** Push auf main branch
- **Aktionen:**
  - Manifest-Version erhöhen
  - App bauen
  - Auf Netlify deployen
  - Aktualisiertes Manifest committen

### `update-database.yml` - Nur Datenbank-Update
- **Trigger:** Manuell über GitHub Actions UI
- **Aktionen:**
  - Manifest-Version erhöhen
  - App bauen
  - Auf Netlify deployen
  - Aktualisiertes Manifest committen

## Setup-Anleitung

### 1. GitHub Secrets konfigurieren
```
NETLIFY_AUTH_TOKEN = dein_netlify_auth_token
NETLIFY_SITE_ID = deine_netlify_site_id
```

### 2. Netlify Auth Token erhalten
1. [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens)
2. **New access token** erstellen
3. Token kopieren und als Secret hinzufügen

### 3. Netlify Site ID finden
1. Netlify Dashboard → Site Settings → General
2. **Site ID** kopieren und als Secret hinzufügen

## Verwendung

### Für Entwickler
```bash
# Normale Entwicklung
git add .
git commit -m "Feature: Neue Funktion"
git push origin main
# → Automatisches Deployment mit Version-Update
```

### Für Content-Updates
1. Neue JSON-Dateien in `/public/json/` hochladen
2. GitHub Actions → "Update Database Only" → "Run workflow"
3. Update-Nachricht eingeben
4. → Nur Datenbank wird aktualisiert

## Workflow-Status prüfen

### GitHub Actions Tab
- **Grün** ✅ = Deployment erfolgreich
- **Rot** ❌ = Deployment fehlgeschlagen
- **Gelb** 🟡 = Deployment läuft

### Netlify Dashboard
- **Deploys** Tab zeigt alle Deployments
- **Functions** Tab zeigt Serverless Functions
- **Analytics** Tab zeigt Nutzungsstatistiken

## Troubleshooting

### Deployment schlägt fehl
1. **GitHub Actions Logs** prüfen
2. **Netlify Deploy Logs** prüfen
3. **Secrets** überprüfen (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID)

### Manifest wird nicht aktualisiert
1. **GitHub Token** Berechtigung prüfen
2. **Repository Settings** → **Actions** → **General**
3. **Workflow permissions** auf "Read and write" setzen

### App funktioniert nicht nach Deployment
1. **Browser Cache** leeren
2. **Service Worker** neu registrieren
3. **IndexedDB** in DevTools prüfen

## Erweiterte Features

### Branch-basierte Deployments
```yaml
# Nur main branch deployen
on:
  push:
    branches: [ main ]
```

### Environment-spezifische Deployments
```yaml
# Staging und Production
strategy:
  matrix:
    environment: [staging, production]
```

### Slack/Discord Notifications
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

✅ **Immer** Manifest-Version bei Deployments erhöhen
✅ **Nie** Manifest manuell bearbeiten (außer in Notfällen)
✅ **Immer** Deployment-Logs prüfen
✅ **Immer** nach Deployment testen
✅ **Immer** Backup vor großen Updates

## Notfall-Procedures

### Rollback
1. Netlify Dashboard → Deploys
2. Vorherigen Deployment auswählen
3. **"Restore deploy"** klicken

### Manueller Deployment
```bash
# Lokal
npm run update-manifest
npm run build
netlify deploy --prod
```

### Manifest zurücksetzen
```bash
# Nur in Notfällen!
git checkout HEAD~1 -- public/manifest.json
git commit -m "Emergency: Reset manifest version"
git push
```
