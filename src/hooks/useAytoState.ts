/**
 * Custom Hook für AYTO State Management
 * 
 * Kapselt die gesamte AYTO-Business-Logik.
 * Folgt dem Single Responsibility Principle.
 */

import { useState, useMemo } from 'react'
// import type { Participant } from '@/types' // Wird später verwendet

// === AYTO-spezifische Typen ===
type Gender = "F" | "M"

interface Person { 
  id: number
  name: string
  gender: Gender
  age?: number
  show?: string
  status?: "Aktiv" | "Inaktiv"
  imageUrl?: string
  knownFrom: string
}

interface Pair { a: number; b: number } // ids

interface TruthBoothEntry { pair: Pair; isMatch: boolean }

interface Ceremony {
  id: string
  pairs: Pair[] // vollständige Sitzordnung
  beams: number // Anzahl Lichter
}

interface StateModel {
  men: Person[]
  women: Person[]
  forbidden: Record<number, Record<number, boolean>> // forbidden[manId][womanId] = true
  confirmed: Record<number, number> // manId -> womanId (confirmed PM)
  truthBooths: TruthBoothEntry[]
  ceremonies: Ceremony[]
}

// === Utility-Funktionen ===
function uid() { return crypto.randomUUID() }

function emptyMatrix(men: Person[], women: Person[]) {
  const f: Record<number, Record<number, boolean>> = {}
  for (const m of men) { 
    f[m.id] = {}
    for (const w of women) f[m.id][w.id] = false
  }
  return f
}

// naive heuristics: verteilt Rest-Wahrscheinlichkeit gleichmäßig auf alle (nicht verbotenen, nicht kollidierenden) Kanten
function computeHeuristicProbabilities(state: StateModel) {
  const { men, women, forbidden, confirmed } = state
  const probs: Record<number, Record<number, number>> = {}
  const takenWomen = new Set(Object.values(confirmed))
  
  for (const m of men) {
    probs[m.id] = {}
    if (confirmed[m.id]) {
      for (const w of women) probs[m.id][w.id] = (w.id === confirmed[m.id]) ? 1 : 0
      continue
    }
    const candidates = women.filter(w => !forbidden[m.id]?.[w.id] && !takenWomen.has(w.id))
    const p = candidates.length ? 1 / candidates.length : 0
    for (const w of women) probs[m.id][w.id] = candidates.some(c => c.id===w.id) ? p : 0
  }
  return probs
}

// Apply TruthBooth knowledge to matrices
function applyTruthBooths(base: StateModel): StateModel {
  const next: StateModel = JSON.parse(JSON.stringify(base))
  for (const tb of base.truthBooths) {
    const { a, b } = tb.pair // a=man, b=woman
    if (tb.isMatch) {
      next.confirmed[a] = b
      // sperre Zeile/Spalte
      for (const w of base.women) if (w.id !== b) next.forbidden[a][w.id] = true
      for (const m of base.men) if (m.id !== a) next.forbidden[m.id][b] = true
    } else {
      next.forbidden[a][b] = true
    }
  }
  return next
}

interface UseAytoStateResult {
  model: StateModel
  probabilities: Record<number, Record<number, number>>
  addTruthBooth: (mId: number, wId: number, isMatch: boolean) => void
  removeTruthBooth: (index: number) => void
  addCeremony: (pairs: Array<{a: number, b: number}>, beams: number) => void
  exportJSON: () => void
}

/**
 * Hook für AYTO State Management
 * 
 * Verantwortlichkeiten:
 * - State-Management für AYTO-Daten
 * - Truth Booth Logik
 * - Ceremony Management
 * - Wahrscheinlichkeits-Berechnung
 * - Export-Funktionalität
 */
export function useAytoState(): UseAytoStateResult {
  // Default: 11 Paare (22 Singles) - jetzt leer, wird aus Admin Panel geladen
  const [men] = useState<Person[]>([])
  const [women] = useState<Person[]>([])

  const [model, setModel] = useState<StateModel>({
    men, 
    women,
    forbidden: emptyMatrix(men, women),
    confirmed: {},
    truthBooths: [],
    ceremonies: [],
  })

  const probabilities = useMemo(() => computeHeuristicProbabilities(model), [model])

  function addTruthBooth(mId: number, wId: number, isMatch: boolean) {
    const tb: TruthBoothEntry = { pair: { a: mId, b: wId }, isMatch }
    const withTB: StateModel = { ...model, truthBooths: [...model.truthBooths, tb] }
    setModel(applyTruthBooths(withTB))
  }

  function removeTruthBooth(i: number) {
    const base: StateModel = { ...model, truthBooths: model.truthBooths.filter((_, idx) => idx!==i) }
    // re-derive matrix fresh
    const clean = { ...base, forbidden: emptyMatrix(base.men, base.women), confirmed: {} } as StateModel
    setModel(applyTruthBooths(clean))
  }

  function addCeremony(pairs: Array<{a: number, b: number}>, beams: number) {
    const c: Ceremony = { id: uid(), pairs, beams }
    setModel({ ...model, ceremonies: [...model.ceremonies, c] })
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ayto-rsil-2025.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    model,
    probabilities,
    addTruthBooth,
    removeTruthBooth,
    addCeremony,
    exportJSON
  }
}
