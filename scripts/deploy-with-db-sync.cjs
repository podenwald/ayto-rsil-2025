#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');

/**
 * Deployment-Script mit automatischer Datenbank-Synchronisation
 * Dieses Script:
 * 1. Exportiert den aktuellen Datenbankstand
 * 2. Aktualisiert die index.json
 * 3. Führt den Build durch
 * 4. Bereitet alles für das Deployment vor
 */

async function deployWithDbSync() {
  try {
    console.log('🚀 Starte Deployment mit Datenbank-Synchronisation...');
    
    // Schritt 1: Aktuellen Datenbankstand exportieren
    console.log('\n📊 Schritt 1: Exportiere aktuellen Datenbankstand...');
    try {
      execSync('node scripts/export-current-db.cjs', { stdio: 'inherit' });
    } catch (exportError) {
      console.warn('⚠️ DB-Export fehlgeschlagen, fahre mit Build fort:', exportError.message);
    }
    
    // Schritt 2: Version-Info generieren
    console.log('\n🏷️  Schritt 2: Generiere Versions-Informationen...');
    try {
      execSync('node scripts/generate-version.cjs', { stdio: 'inherit' });
    } catch (versionError) {
      console.warn('⚠️ Versions-Generierung fehlgeschlagen:', versionError.message);
    }
    
    // Schritt 3: Build durchführen
    console.log('\n🔨 Schritt 3: Führe Build durch...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build erfolgreich abgeschlossen');
    } catch (buildError) {
      console.error('❌ Build fehlgeschlagen:', buildError.message);
      process.exit(1);
    }
    
    // Schritt 4: Deployment-Status prüfen
    console.log('\n📋 Schritt 4: Prüfe Deployment-Status...');
    
    const publicJsonDir = resolve(__dirname, '../public/json');
    const indexJsonPath = resolve(publicJsonDir, 'index.json');
    
    if (existsSync(indexJsonPath)) {
      const indexContent = readFileSync(indexJsonPath, 'utf8');
      const files = JSON.parse(indexContent);
      console.log(`📁 Verfügbare JSON-Dateien: ${files.length}`);
      console.log(`📅 Neueste Datei: ${files[0] || 'Keine'}`);
    }
    
    // Schritt 5: Deployment-Zusammenfassung
    console.log('\n✅ Deployment-Vorbereitung abgeschlossen!');
    console.log('\n📋 Nächste Schritte:');
    console.log('1. Prüfe die generierten Dateien in dist/');
    console.log('2. Stelle sicher, dass public/json/ die neuesten Dateien enthält');
    console.log('3. Deploye die dist/ Inhalte auf den Server');
    console.log('4. Die App wird automatisch die neueste JSON-Datei laden');
    
    console.log('\n🎯 Die App ist bereit für das Deployment mit aktuellem Datenbankstand!');
    
  } catch (error) {
    console.error('❌ Deployment fehlgeschlagen:', error);
    process.exit(1);
  }
}

// Script ausführen
if (require.main === module) {
  deployWithDbSync();
}

module.exports = { deployWithDbSync };
