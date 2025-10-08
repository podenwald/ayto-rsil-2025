#!/usr/bin/env node

/**
 * Script zur Aktualisierung der manifest.json
 * 
 * Generiert Manifest aus Git-Tag und Daten-Hash.
 * Zentrale Version für Code und Daten.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execSync } = require('child_process')

const MANIFEST_PATH = path.join(__dirname, '..', 'public', 'manifest.json')
const DATA_FILE_PATH = path.join(__dirname, '..', 'public', 'json', 'ayto-vip-2025.json')

function getGitTag() {
  try {
    // Versuche aktuellen Tag zu bekommen
    const tag = execSync('git describe --tags --exact-match HEAD', { encoding: 'utf8' }).trim()
    return tag
  } catch {
    try {
      // Fallback: Neuester Tag
      const describe = execSync('git describe --tags', { encoding: 'utf8' }).trim()
      const match = describe.match(/^([^-]+)/)
      return match ? match[1] : 'v0.0.0'
    } catch {
      return 'v0.0.0'
    }
  }
}

function getDataHash() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf8')
      return crypto.createHash('md5').update(content).digest('hex').substring(0, 8)
    }
  } catch (error) {
    console.warn('⚠️ Konnte Daten-Hash nicht berechnen:', error.message)
  }
  return 'unknown'
}

function getTagDate(tag) {
  try {
    const date = execSync(`git log -1 --format=%ai ${tag}`, { encoding: 'utf8' }).trim()
    return new Date(date).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function updateManifest() {
  try {
    // Git-Tag und Daten-Hash ermitteln
    const gitTag = getGitTag()
    const dataHash = getDataHash()
    const released = getTagDate(gitTag)

    // Manifest erstellen
    const manifest = {
      version: gitTag,
      dataHash: dataHash,
      released: released,
      description: "AYTO RSIL 2025 - Zentrale Version für Code und Daten"
    }

    // Manifest speichern
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

    console.log('✅ Manifest erfolgreich generiert:')
    console.log(`   Version: ${manifest.version}`)
    console.log(`   Data Hash: ${manifest.dataHash}`)
    console.log(`   Released: ${manifest.released}`)
    
    return manifest
  } catch (error) {
    console.error('❌ Fehler beim Generieren des Manifests:', error)
    process.exit(1)
  }
}

// Script ausführen
if (require.main === module) {
  updateManifest()
}

module.exports = { updateManifest }
