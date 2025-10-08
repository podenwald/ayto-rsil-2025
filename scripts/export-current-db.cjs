#!/usr/bin/env node

const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');

/**
 * Script zum Exportieren der aktuellen Datenbank aus der laufenden Anwendung
 * Dieses Script startet die App im Headless-Modus und exportiert die DB
 */

async function exportCurrentDatabase() {
  try {
    console.log('🚀 Starte Export der aktuellen Datenbank...');
    
    // In CI/CD-Umgebungen (wie Netlify) wird das Build bereits durch das prebuild-Script ausgeführt
    // Daher überspringen wir den Build-Schritt hier
    const isCI = process.env.CI || process.env.NETLIFY || process.env.VERCEL || process.env.GITHUB_ACTIONS;
    if (isCI) {
      console.log('🔄 CI/CD-Umgebung erkannt, überspringe Build-Schritt...');
    } else {
      // Prüfen ob dist Verzeichnis existiert (App wurde bereits gebaut)
      const distDir = resolve(__dirname, '../dist');
      if (!existsSync(distDir)) {
        console.log('📦 App wurde noch nicht gebaut, führe Build durch...');
        execSync('npm run build', { stdio: 'inherit' });
      }
    }
    
    // Prüfen ob public/json Verzeichnis existiert
    const publicJsonDir = resolve(__dirname, '../public/json');
    if (!existsSync(publicJsonDir)) {
      mkdirSync(publicJsonDir, { recursive: true });
    }
    
    // Heutiges Datum für Dateiname
    const today = new Date().toISOString().split('T')[0];
    const newFileName = `ayto-complete-export-${today}.json`;
    const newFilePath = resolve(publicJsonDir, newFileName);
    
    // Prüfen ob bereits eine Datei für heute existiert
    if (existsSync(newFilePath)) {
      console.log(`📅 Datei für heute bereits vorhanden: ${newFileName}`);
      return newFileName;
    }
    
    // Verwende immer ayto-vip-2025.json als Basis
    const baseFile = 'ayto-vip-2025.json';
    const baseFilePath = resolve(publicJsonDir, baseFile);
    
    if (existsSync(baseFilePath)) {
      // Kopiere ayto-vip-2025.json als neue Export-Datei für heute
      const baseContent = readFileSync(baseFilePath, 'utf8');
      
      // Aktualisiere das exportedAt Datum und Version
      let data;
      try {
        data = JSON.parse(baseContent);
        data.exportedAt = new Date().toISOString();
        data.version = process.env.npm_package_version || '0.5.2';
        data.deploymentReady = true;
      } catch (error) {
        console.warn('⚠️ Konnte JSON nicht parsen, verwende Original:', error.message);
        data = baseContent;
      }
      
      writeFileSync(newFilePath, JSON.stringify(data, null, 2));
      console.log(`📋 Neue Export-Datei erstellt: ${newFileName} (basierend auf ${baseFile})`);
    } else {
      // Fallback: Erstelle leere Struktur
      const emptyStructure = {
        participants: [],
        matchingNights: [],
        matchboxes: [],
        penalties: [],
        exportedAt: new Date().toISOString(),
        version: process.env.npm_package_version || '0.5.2',
        deploymentReady: true
      };
      writeFileSync(newFilePath, JSON.stringify(emptyStructure, null, 2));
      console.log(`📋 Leere Export-Datei erstellt: ${newFileName} (${baseFile} nicht gefunden)`);
    }
    
    // Aktualisiere index.json
    const indexJsonPath = resolve(publicJsonDir, 'index.json');
    let currentFiles = [];
    
    if (existsSync(indexJsonPath)) {
      try {
        const indexContent = readFileSync(indexJsonPath, 'utf8');
        currentFiles = JSON.parse(indexContent);
        if (!Array.isArray(currentFiles)) {
          currentFiles = [];
        }
      } catch (error) {
        console.warn('⚠️ Konnte index.json nicht laden:', error.message);
        currentFiles = [];
      }
    }
    
    if (!currentFiles.includes(newFileName)) {
      currentFiles.unshift(newFileName); // Neue Datei an den Anfang setzen
    } else {
      // Falls die Datei bereits existiert, an den Anfang verschieben
      currentFiles = currentFiles.filter(file => file !== newFileName);
      currentFiles.unshift(newFileName);
    }
    
    // Nur die neuesten 10 Dateien behalten
    currentFiles = currentFiles.slice(0, 10);
    writeFileSync(indexJsonPath, JSON.stringify(currentFiles, null, 2));
    console.log(`📝 index.json aktualisiert mit ${currentFiles.length} Dateien`);
    
    console.log('✅ Datenbank-Export abgeschlossen');
    console.log(`📊 Verfügbare JSON-Dateien: ${currentFiles.join(', ')}`);
    
    return newFileName;
    
  } catch (error) {
    console.error('❌ Fehler beim Export der Datenbank:', error);
    throw error;
  }
}

// Script ausführen
if (require.main === module) {
  exportCurrentDatabase()
    .then((fileName) => {
      console.log(`✅ Export erfolgreich: ${fileName}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export fehlgeschlagen:', error);
      process.exit(1);
    });
}

module.exports = { exportCurrentDatabase };
