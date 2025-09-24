# 🔍 Code Review Checklist

Bitte prüfe die folgenden Punkte, bevor du den PR approvest oder mergest:

## ✅ Allgemein / Clean Code
- [ ] Funktionen & Komponenten sind klein (max. ~50 LOC) und haben **eine Verantwortlichkeit** (Single Responsibility).
- [ ] Variablen-, Funktions- und Klassennamen sind **aussagekräftig und beschreibend**.
- [ ] Kommentare erklären das „Warum“ – nicht das „Wie“.
- [ ] Fehler- und Ausnahmebehandlung ist vorhanden und verständlich.

## 🛠️ TypeScript / Typisierung
- [ ] `strict` Mode aktiv, keine ungewollten `any`-Typen.
- [ ] API-Interfaces und DTOs sind klar definiert.
- [ ] Domain-Typen werden zentral gepflegt und nicht dupliziert.
- [ ] TypeScript-Compiler (`tsc`) läuft fehlerfrei.

## 🏗️ Architektur / Struktur
- [ ] UI, Business-Logic und Datenzugriff sind klar getrennt.
- [ ] Komponenten sind **presentational vs. container/hooks** getrennt.
- [ ] Side-Effects (API-Calls, Storage, WS) sind ausgelagert.
- [ ] Ordnerstruktur folgt Projektkonventionen (`components`, `hooks`, `lib`, `services`, `pages`).

## ⚛️ React / Next.js
- [ ] React Hooks-Regeln werden eingehalten (`eslint-plugin-react-hooks` prüft dies).
- [ ] Data-Fetching folgt Next.js Best Practices (SSR/SSG/CSR klar abgegrenzt).
- [ ] Performance-Optimierungen: `next/image`, lazy loading, dynamic imports wo sinnvoll.
- [ ] Komponenten sind **testbar** und möglichst „pure“.

## 🎨 Styling / Tailwind
- [ ] Tailwind-Klassen sind konsistent und lesbar, ggf. mit `clsx`/`tailwind-merge`.
- [ ] Wiederkehrende Styles sind im `tailwind.config.js` oder via `@apply` zentralisiert.
- [ ] Purge/Content-Konfiguration ist korrekt → keine unnötigen CSS-Reste.

## 🤖 Automatisierte Prüfungen
- [ ] ESLint läuft fehlerfrei (`eslint .`).
- [ ] Prettier-Formatierung stimmt (`prettier --check .`).
- [ ] Tests (Unit + ggf. E2E) laufen grün in CI.
- [ ] CI-Jobs prüfen: build, type-check, lint, test.
- [ ] Keine ungenutzten Imports, Variablen oder Dependencies.

## 🔒 Sicherheit / Qualität
- [ ] Keine geheimen Keys, Passwörter oder Tokens im Code.
- [ ] Dependencies sind aktuell (Dependabot/Snyk geprüft).
- [ ] PR ist in sinnvolle Commits aufgeteilt und < 300 LOC (sofern möglich).

---

👉 **Reviewer-Hinweis:** Wenn du einen Punkt findest, der fehlt oder unklar ist, bitte direkt im PR kommentieren oder als Verbesserungsvorschlag markieren.
