#!/usr/bin/env node

const { writeFileSync, readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

/**
 * Script zum Exportieren der aktuellen Datenbank für das Deployment
 * Dieses Script wird vor dem Build ausgeführt und erstellt eine aktuelle JSON-Datei
 * mit dem neuesten Datenbankstand, der dann beim App-Start geladen wird.
 */

try {
  console.log('🚀 Starte Datenbank-Export für Deployment...');
  
  // Pfade definieren
  const publicJsonDir = resolve(__dirname, '../public/json');
  const indexJsonPath = resolve(publicJsonDir, 'index.json');
  
  // Prüfen ob public/json Verzeichnis existiert
  if (!existsSync(publicJsonDir)) {
    console.error('❌ Verzeichnis public/json existiert nicht!');
    process.exit(1);
  }
  
  // Aktuelle index.json laden
  let currentFiles = [];
  if (existsSync(indexJsonPath)) {
    try {
      const indexContent = readFileSync(indexJsonPath, 'utf8');
      currentFiles = JSON.parse(indexContent);
      if (!Array.isArray(currentFiles)) {
        currentFiles = [];
      }
    } catch (error) {
      console.warn('⚠️ Konnte index.json nicht laden, verwende leere Liste:', error.message);
      currentFiles = [];
    }
  }
  
  // Heutiges Datum für Dateiname
  const today = new Date().toISOString().split('T')[0];
  const newFileName = `ayto-complete-export-${today}.json`;
  
  // Prüfen ob bereits eine Datei für heute existiert
  const existingTodayFile = currentFiles.find(file => file.includes(today));
  if (existingTodayFile) {
    console.log(`📅 Datei für heute bereits vorhanden: ${existingTodayFile}`);
    console.log('✅ Deployment-Export abgeschlossen');
    process.exit(0);
  }
  
  // Neue Datei zur Liste hinzufügen (an den Anfang)
  currentFiles.unshift(newFileName);
  
  // Nur die neuesten 10 Dateien behalten
  currentFiles = currentFiles.slice(0, 10);
  
  // index.json aktualisieren
  writeFileSync(indexJsonPath, JSON.stringify(currentFiles, null, 2));
  console.log(`📝 index.json aktualisiert mit ${currentFiles.length} Dateien`);
  
  // Template-Datei erstellen (falls nicht vorhanden)
  const templatePath = resolve(publicJsonDir, newFileName);
  if (!existsSync(templatePath)) {
    // Verwende die neueste vorhandene Datei als Template
    const latestFile = currentFiles.find(file => file !== newFileName && file.endsWith('.json'));
    if (latestFile && existsSync(resolve(publicJsonDir, latestFile))) {
      const templateContent = readFileSync(resolve(publicJsonDir, latestFile), 'utf8');
      writeFileSync(templatePath, templateContent);
      console.log(`📋 Template-Datei erstellt: ${newFileName} (basierend auf ${latestFile})`);
    } else {
      // Fallback: Leere Struktur erstellen
      const emptyStructure = {
        participants: [],
        matchingNights: [],
        matchboxes: [],
        penalties: [],
        exportedAt: new Date().toISOString(),
        version: "0.3.1"
      };
      writeFileSync(templatePath, JSON.stringify(emptyStructure, null, 2));
      console.log(`📋 Leere Template-Datei erstellt: ${newFileName}`);
    }
  }
  
  console.log('✅ Deployment-Export abgeschlossen');
  console.log(`📊 Verfügbare JSON-Dateien: ${currentFiles.join(', ')}`);
  
} catch (error) {
  console.error('❌ Fehler beim Export für Deployment:', error);
  process.exit(1);
}
