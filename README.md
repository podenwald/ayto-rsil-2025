# AYTO RSIL 2025 – Live‑Tracker

Eine moderne Web‑App zur Nachverfolgung und Auswertung der Staffel „Are You The One? – Reality Stars in Love 2025“.

Ziel der Anwendung:
- Transparente, konsistente Erfassung und Visualisierung von Matching Nights, Matchboxes und Teilnehmern
- Bedienoberfläche für schnelles Planen/Validieren von Paarungen (Drag & Drop)
- Korrekte Berücksichtigung der Timeline (Ausstrahlungsreihenfolge) bei Perfect Matches
- Datenhaltung im Browser (Offline‑fähig, PWA‑fähig) mit komfortabler Admin‑Verwaltung

## Kernfunktionen

- Matching Night (Drag & Drop, Single‑View)
  - 2 Reihen mit je 5 Pärchen‑Containern (insgesamt 10)
  - Teilnehmer per Drag & Drop platzieren; Avatare werden nach Platzierung ausgegraut
  - Automatisches Vorbelegen von bestätigten Perfect Matches (🔒) in die ersten freien Container
  - Visuelles Feedback und Validierungen (z. B. Geschlechter‑Konsistenz)
  - „Gesamtlichter“ mit Limit 0–10; Wert muss ≥ sichere Lichter (Anzahl Perfect Matches) sein
  - Speichern erst möglich, wenn alle 10 Pärchen vollständig sind

- Matchbox‑Verwaltung
  - Neue Matchbox per Drag & Drop aus dem Home‑Bereich erstellen
  - Typen: „perfect“, „no‑match“, „sold“ (inkl. Preis/Käufer‑Felder)
  - Teilnehmer, die bereits als Perfect Match bestätigt sind, stehen NICHT für neue Matchboxen zur Verfügung (deaktiviert)
  - Chronologische Auswertung: Für Anzeige/Validierung wird die Ausstrahlung vor dem Erstellungsdatum priorisiert

- Teilnehmer‑Übersicht (Home)
  - Gefilterte Listen nach Geschlecht mit Avataren
  - Bestätigte Perfect‑Match‑Teilnehmer sind deaktiviert (grau, nicht draggable)
  - Schnellerzeugung einer Matchbox über eine schwebende Box (Drag‑Zone Frau/Mann)

- Admin‑Panel
  - Import/Export von JSON‑Daten
  - Tabellenweise Löschung (Teilnehmer, Matching Nights, Matchboxes, Strafen)
  - Gefahrenzone: Komplett‑Reset aller Datenbanktabellen (mit doppelter Bestätigung)
  - Cache‑/Browser‑Reset: Löscht Cache, Local/Session Storage und Cookies (Datenbank bleibt erhalten)

- PWA/Offline
  - Service Worker, Assets‑Caching
  - Datenpersistenz clientseitig via IndexedDB (Dexie)

## Validierungen & Logik

- Matching Night
  - 10 vollständige Paare erforderlich (Speicherbedingung)
  - Nur Mann + Frau pro Pärchen; visuelles Feedback bei Konflikten
  - Gesamtlichter: max. 10; min. = Anzahl sicherer Lichter (Perfect Matches)
  - Perfect Matches werden automatisch fixiert (nicht entfernbar)

- Matchbox
  - Erstellen nur mit Frau + Mann
  - Bei „sold“: Preis > 0 und Käufer erforderlich
  - Teilnehmer in bestätigten Perfect Matches sind ausgeschlossen
  - Timeline‑Regel: Ausstrahlungsdatum (ausstrahlungsdatum) hat Vorrang vor createdAt

## Datenhaltung

- IndexedDB via Dexie (siehe `src/lib/db.ts`)
  - Tabellen: `participants`, `matchingNights`, `matchboxes`, `penalties`
  - Datensätze enthalten u. a. `createdAt` und optional `ausstrahlungsdatum` für zeitliche Bewertung

## UI/UX

- Technologien: React + TypeScript + MUI + Tailwind Utility‑Klassen (selektiv)
- Kompakte, mobile‑freundliche Single‑View für Matching Nights
- Konsistente, reduzierte Layouts (kleinere Avatare, Abstände) für hohe Informationsdichte

### Responsive Design & Geräteerkennung

Die App implementiert ein erweiterte Geräteerkennung für optimale Benutzererfahrung:

#### **Smartphones** 📱
- **Ansicht**: Mobile UI mit allen mobilen Features
- **Rotation-Lock**: Portrait-Modus wird blockiert mit Hinweis-Overlay (nur Hochformat)
- **Features**: 
  - Eingeklappte Menü-Sidebar (max. 1/3 Bildschirmhöhe)
  - Menü-Icon oben rechts zum Aufklappen
  - Vollbreite Content-Bereiche
  - Manuelle Teilnehmer-Auswahl (kein Drag & Drop)
  - Vergrößerte Eingabefelder für bessere Bedienbarkeit

#### **Tablets** 📱
- **Ansicht**: Desktop UI (nur im Querformat)
- **Rotation-Lock**: Portrait-Modus wird blockiert mit Hinweis-Overlay (nur Querformat)
- **Features**: Vollständige Desktop-Funktionalität mit Drag & Drop

#### **Desktop** 🖥️
- **Ansicht**: Desktop UI
- **Features**: Vollständige Funktionalität ohne Einschränkungen

#### **Geräteerkennung**
```typescript
// Automatische Erkennung basierend auf:
- User Agent Patterns
- Bildschirmgröße
- Orientierung

// Smartphone: ≤480px Breite
// Tablet: 481px-1024px Breite  
// Desktop: >1024px Breite
```

## Sicherheit & Qualität

- Strikte Client‑Validierungen vor dem Speichern
- Guard Clauses zur Fehlervermeidung (undefined/null Checks)
- Deaktivierte Interaktionen, wo Datenlage es erfordert (z. B. Perfect Matches)

## Getting Started

Voraussetzungen: Node.js ≥ 18

Installation:
```bash
npm ci
```

Entwicklung starten (Vite Dev Server):
```bash
npm run dev
```

Lints ausführen:
```bash
npm run lint
```

Build (Vite):
```bash
npm run build
```

Vorschau des Builds:
```bash
npm run preview
```

## Deploy

- Statischer Build in `dist/`
- Kann auf beliebigen Static Hosts (z. B. Netlify, Vercel, GitHub Pages) bereitgestellt werden
- GitLab CI/CD Konfiguration liegt unter `.gitlab-ci.yml` (Build/Deploy‑Stages exemplarisch)

## Datenverwaltung (Admin)

- Admin‑Panel: `/?admin=1&mui=1`
  - Einzelnes Löschen je Tabelle
  - „Gefahrenzone“: Komplett‑Reset aller Tabellen (doppelte Bestätigung)
  - „Browser‑Reset“: Löscht Cache, Cookies, Local/Session Storage (Datenbank bleibt erhalten), Seite wird neu geladen
  - Import/Export: JSON‑basierte Sicherung/Wiederherstellung

## Bekannte Einschränkungen

- Wahrscheinlichkeiten/Analyse: Menüpunkt ist aktuell deaktiviert; Inhalte ggf. sichtbar, jedoch nicht interaktiv
- Berechnungen für heuristische Wahrscheinlichkeiten sind als Ausblick vorgesehen

## Roadmap

- Aktivierung und Ausbau der Wahrscheinlichkeits‑Analyse (Heatmaps, Worker‑basierte Berechnung)
- Erweiterte Konsistenzprüfungen (SAT/Backtracking über alle gültigen Lösungen)
- Verbesserte Historien‑/Timeline‑Ansichten
- Optionaler Mehrbenutzer‑Sync (Server‑API)

## Tech‑Stack

- React 18, TypeScript
- Vite, ESLint
- MUI (Material UI)
- Dexie (IndexedDB)
- Tailwind Utilities (selektiv)

### Erweiterte Features

- **Geräteerkennung**: Intelligente Unterscheidung zwischen Smartphones, Tablets und Desktop
- **Responsive Design**: Mobile-First Ansatz mit gerätespezifischen UI-Anpassungen
- **Rotation-Lock**: 
  - Smartphones: Nur Hochformat (Portrait)
  - Tablets: Nur Querformat (Landscape)
- **PWA-Ready**: Service Worker und Offline-Funktionalität

---

Fragen/Feedback willkommen – Viel Spaß beim Tracken! 🚀

## Feedback / Issues

Fehler oder Ideen? → Bitte als Issue eintragen: https://github.com/podenwald/ayto-rsil-2025/issues
