#!/usr/bin/env node

/**
 * Script zur Aktualisierung der manifest.json
 * 
 * Erhöht die dbVersion und setzt das released-Datum.
 * Kann bei jedem Deployment automatisch ausgeführt werden.
 */

const fs = require('fs')
const path = require('path')

const MANIFEST_PATH = path.join(__dirname, '..', 'public', 'manifest.json')

function updateManifest() {
  try {
    // Manifest laden
    let manifest
    if (fs.existsSync(MANIFEST_PATH)) {
      const content = fs.readFileSync(MANIFEST_PATH, 'utf8')
      manifest = JSON.parse(content)
    } else {
      // Neues Manifest erstellen
      manifest = {
        dbVersion: 0,
        released: new Date().toISOString(),
        description: "AYTO RSIL 2025 Datenbank-Versionierung"
      }
    }

    // Version erhöhen
    manifest.dbVersion = (manifest.dbVersion || 0) + 1
    manifest.released = new Date().toISOString()

    // Manifest speichern
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

    console.log('✅ Manifest erfolgreich aktualisiert:')
    console.log(`   Version: ${manifest.dbVersion}`)
    console.log(`   Released: ${manifest.released}`)
    
    return manifest
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Manifests:', error)
    process.exit(1)
  }
}

// Script ausführen
if (require.main === module) {
  updateManifest()
}

module.exports = { updateManifest }

