/**
 * Wahrscheinlichkeits-Berechnungs-Service
 * 
 * Implementiert den kombinatorischen Algorithmus zur Berechnung
 * von Perfect Match Wahrscheinlichkeiten basierend auf:
 * - Matching Night Ergebnissen (Lichter-Anzahl)
 * - Matchbox-Entscheidungen (Perfect Match / No Match)
 * 
 * Folgt dem Constraint-Satisfaction-Problem (CSP) Ansatz:
 * 1. Generiere alle möglichen Matchings
 * 2. Filtere nach Zeremonien-Constraints
 * 3. Filtere nach Boxentscheidungen
 * 4. Berechne Wahrscheinlichkeiten aus gültigen Lösungen
 */

import type {
  ProbabilityInput,
  ProbabilityResult,
  Matching,
  Pair,
  CeremonyConstraint,
  BoxDecision,
  ProbabilityMatrix
} from '@/types'

/**
 * Performance-Limit für die Anzahl gültiger Matchings
 * Verhindert zu lange Berechnungszeiten
 */
const MAX_VALID_MATCHINGS = 10000000 // Erhöht auf 10 Millionen für vollständige Berechnung

/**
 * Callback-Typ für Progress-Updates
 */
export type ProgressCallback = (progress: number, step: string) => void

/**
 * Hauptfunktion zur Berechnung der Wahrscheinlichkeiten
 */
export async function calculateProbabilities(
  input: ProbabilityInput,
  onProgress?: ProgressCallback
): Promise<ProbabilityResult> {
  const startTime = performance.now()
  
  try {
    // DEBUG: Log Input
    console.log('🔍 Probability Calculation Input:', {
      men: input.men,
      women: input.women,
      ceremonies: input.ceremonies,
      boxDecisions: input.boxDecisions
    })
    
    // Schritt 1: Alle möglichen Matchings generieren
    onProgress?.(10, 'Generiere mögliche Matchings...')
    let validMatchings = generateAllPossibleMatchings(input.men, input.women)
    
    console.log(`✅ Schritt 1: ${validMatchings.length.toLocaleString()} Matchings generiert`)
    onProgress?.(30, `${validMatchings.length.toLocaleString()} Matchings generiert`)
    
    console.log('📊 Input-Zusammenfassung:', {
      männer: input.men.length,
      frauen: input.women.length,
      ceremonies: input.ceremonies.length,
      boxDecisions: input.boxDecisions.length
    })
    
    // Schritt 2: Zeremonien-Constraints anwenden
    if (input.ceremonies.length > 0) {
      console.log('➡️ Starte Zeremonien-Filterung...')
      onProgress?.(40, 'Wende Zeremonien-Constraints an...')
      const beforeCeremonies = validMatchings.length
      
      // DEBUG: Log jede Zeremonie einzeln
      console.log('🔍 Zeremonien Details:')
      input.ceremonies.forEach((ceremony, index) => {
        console.log(`  Zeremonie ${index + 1}:`, {
          paare: ceremony.pairs.length,
          lichter: ceremony.correctCount,
          bekanntePerfectMatches: ceremony.knownPerfectMatches.length,
          knownPMs: ceremony.knownPerfectMatches,
          pairs: ceremony.pairs
        })
      })
      
      // DEBUG: Teste das erste Matching mit der ersten Zeremonie
      if (validMatchings.length > 0 && input.ceremonies.length > 0) {
        const testMatching = validMatchings[0]
        const testCeremony = input.ceremonies[0]
        
        console.log('🧪 Test: Erstes Matching gegen erste Zeremonie:', {
          matching: testMatching.pairs.slice(0, 5).map(p => `${p.man}→${p.woman}`),
          ceremonyPairs: testCeremony.pairs.slice(0, 5).map(p => `${p.woman}-${p.man}`),
          erwartete_Lichter: testCeremony.correctCount,
          tatsächliche_Lichter: countCorrectPairs(testMatching, testCeremony.pairs)
        })
      }
      
      validMatchings = applyCeremonyConstraints(validMatchings, input.ceremonies)
      console.log(`✅ Schritt 2: ${validMatchings.length.toLocaleString()} gültige Matchings nach Zeremonien (vorher: ${beforeCeremonies})`)
      
      if (validMatchings.length === 0) {
        console.error('❌ PROBLEM: Keine gültigen Matchings nach Zeremonien!')
        console.log('💡 Mögliche Ursachen:')
        console.log('  - Widersprüchliche Matching Night Ergebnisse')
        console.log('  - Mathematisch unmögliche Kombination von Lichter-Zahlen')
        console.log('  - Fehler in der Dateneingabe')
      }
      
      onProgress?.(60, `${validMatchings.length.toLocaleString()} gültige Matchings nach Zeremonien`)
    }
    
    // Schritt 3: Boxentscheidungen anwenden
    if (input.boxDecisions.length > 0) {
      onProgress?.(70, 'Wende Matchbox-Entscheidungen an...')
      const beforeBoxes = validMatchings.length
      validMatchings = applyBoxDecisions(validMatchings, input.boxDecisions)
      console.log(`✅ Schritt 3: ${validMatchings.length.toLocaleString()} gültige Matchings nach Boxentscheidungen (vorher: ${beforeBoxes})`)
      onProgress?.(80, `${validMatchings.length.toLocaleString()} gültige Matchings nach Boxentscheidungen`)
    }
    
    // Schritt 4: Wahrscheinlichkeiten berechnen
    onProgress?.(90, 'Berechne Wahrscheinlichkeiten...')
    const probabilityMatrix = computeProbabilityMatrix(
      validMatchings,
      input.men,
      input.women
    )
    
    // Schritt 5: Fixierte Paare extrahieren
    const fixedPairs = extractFixedPairs(probabilityMatrix)
    
    const calculationTime = performance.now() - startTime
    onProgress?.(100, 'Berechnung abgeschlossen')
    
    return {
      probabilityMatrix,
      fixedPairs,
      totalValidMatchings: validMatchings.length,
      calculationTime,
      limitReached: validMatchings.length >= MAX_VALID_MATCHINGS
    }
  } catch (error) {
    console.error('Fehler bei der Wahrscheinlichkeits-Berechnung:', error)
    throw error
  }
}

/**
 * Generiert alle möglichen Matchings
 * 
 * AYTO-Regel: 
 * - Jeder Mann hat genau 1 Perfect Match
 * - Wenn mehr Männer als Frauen: Manche Frauen haben 2 Perfect Matches
 * 
 * @param men - Liste der Männer-Namen
 * @param women - Liste der Frauen-Namen
 * @returns Array aller möglichen Matchings
 */
function generateAllPossibleMatchings(men: string[], women: string[]): Matching[] {
  const matchings: Matching[] = []
  
  // Fall 1: Gleiche Anzahl → 1:1 Matching (Permutationen)
  if (men.length === women.length) {
    const permutations = generatePermutations(women, men.length)
    
    for (const perm of permutations) {
      const pairs: Pair[] = men.map((man, idx) => ({
        woman: perm[idx],
        man
      }))
      matchings.push({ pairs })
      
      if (matchings.length >= MAX_VALID_MATCHINGS) {
        break
      }
    }
    
    return matchings
  }
  
  // Fall 2: Ungleiche Anzahl → Mehrfachzuweisungen möglich
  function generateAssignments(menIndex: number, currentAssignment: string[]): void {
    if (menIndex === men.length) {
      const pairs: Pair[] = men.map((man, idx) => ({
        woman: currentAssignment[idx],
        man
      }))
      matchings.push({ pairs })
      return
    }
    
    if (matchings.length >= MAX_VALID_MATCHINGS) {
      return
    }
    
    for (const woman of women) {
      const count = currentAssignment.filter(w => w === woman).length
      const maxPerWoman = Math.ceil(men.length / women.length)
      
      if (count < maxPerWoman) {
        generateAssignments(menIndex + 1, [...currentAssignment, woman])
      }
    }
  }
  
  generateAssignments(0, [])
  
  return matchings
}

/**
 * Generiert alle k-Permutationen von items
 * 
 * @param items - Array von Items
 * @param k - Anzahl zu wählen
 * @returns Array von Permutationen
 */
function generatePermutations(items: string[], k: number): string[][] {
  const result: string[][] = []
  
  function permute(arr: string[], m: string[] = []) {
    if (m.length === k) {
      result.push([...m])
      return
    }
    
    // Performance-Limit
    if (result.length >= MAX_VALID_MATCHINGS) {
      return
    }
    
    for (let i = 0; i < arr.length; i++) {
      const curr = arr.slice()
      const next = curr.splice(i, 1)
      permute(curr, m.concat(next))
    }
  }
  
  permute(items)
  return result
}

/**
 * Wendet Zeremonien-Constraints auf Matchings an
 * 
 * WICHTIG: Berücksichtigt auch zeitliche Perfect Matches!
 * 
 * @param matchings - Alle möglichen Matchings
 * @param ceremonies - Zeremonien mit Paar-Listen und korrekter Lichter-Anzahl
 * @returns Gefilterte Matchings, die alle Zeremonien-Constraints erfüllen
 */
function applyCeremonyConstraints(
  matchings: Matching[],
  ceremonies: CeremonyConstraint[]
): Matching[] {
  // DEBUG: Prüfe jede Zeremonie einzeln
  console.log('🔍 Teste Zeremonien einzeln:')
  ceremonies.forEach((ceremony, idx) => {
    const validCount = matchings.filter(matching => {
      // Constraint 1: Known PMs
      if (!containsKnownPerfectMatches(matching, ceremony.knownPerfectMatches)) {
        return false
      }
      // Constraint 2: Lichter
      const correctCount = countCorrectPairs(matching, ceremony.pairs)
      return correctCount === ceremony.correctCount
    }).length
    
    console.log(`  Zeremonie ${idx + 1}: ${validCount.toLocaleString()} Matchings erfüllen diese Zeremonie`)
  })
  
  return matchings.filter(matching => {
    // Matching muss ALLE Zeremonien-Constraints erfüllen
    return ceremonies.every(ceremony => {
      // Constraint 1: Bekannte Perfect Matches müssen im Matching sein
      if (!containsKnownPerfectMatches(matching, ceremony.knownPerfectMatches)) {
        return false
      }
      
      // Constraint 2: Lichter-Anzahl muss stimmen
      const correctCount = countCorrectPairs(matching, ceremony.pairs)
      return correctCount === ceremony.correctCount
    })
  })
}

/**
 * Zählt, wie viele Paare aus der Zeremonie im Matching korrekt sind
 * 
 * @param matching - Ein Matching
 * @param ceremonyPairs - Paare aus der Zeremonie
 * @returns Anzahl korrekter Paare
 */
function countCorrectPairs(matching: Matching, ceremonyPairs: Pair[]): number {
  let count = 0
  
  for (const ceremonyPair of ceremonyPairs) {
    // Prüfe, ob dieses Paar im Matching existiert
    const isCorrect = matching.pairs.some(
      matchingPair =>
        matchingPair.woman === ceremonyPair.woman &&
        matchingPair.man === ceremonyPair.man
    )
    
    if (isCorrect) {
      count++
    }
  }
  
  return count
}

/**
 * Prüft, ob ein Matching alle bekannten Perfect Matches enthält
 * 
 * WICHTIG: Zu einer bestimmten Zeremonie waren bestimmte Perfect Matches
 * bereits bekannt. Diese MÜSSEN in der Zeremonie vorkommen!
 * 
 * @param matching - Ein Matching
 * @param knownPerfectMatches - Perfect Matches die bekannt waren
 * @returns true wenn alle bekannten Perfect Matches im Matching sind
 */
function containsKnownPerfectMatches(matching: Matching, knownPerfectMatches: Pair[]): boolean {
  for (const knownPM of knownPerfectMatches) {
    const isInMatching = matching.pairs.some(
      pair => pair.woman === knownPM.woman && pair.man === knownPM.man
    )
    
    if (!isInMatching) {
      return false
    }
  }
  
  return true
}

/**
 * Wendet Boxentscheidungen auf Matchings an
 * 
 * @param matchings - Gefilterte Matchings nach Zeremonien
 * @param boxDecisions - Perfect Match / No Match Entscheidungen
 * @returns Gefilterte Matchings nach Boxentscheidungen
 */
function applyBoxDecisions(
  matchings: Matching[],
  boxDecisions: BoxDecision[]
): Matching[] {
  return matchings.filter(matching => {
    // Matching muss ALLE Boxentscheidungen erfüllen
    return boxDecisions.every(decision => {
      const pairExistsInMatching = matching.pairs.some(
        pair =>
          pair.woman === decision.woman &&
          pair.man === decision.man
      )
      
      if (decision.isPerfectMatch) {
        // Muss im Matching sein
        return pairExistsInMatching
      } else {
        // Darf NICHT im Matching sein
        return !pairExistsInMatching
      }
    })
  })
}

/**
 * Berechnet die Wahrscheinlichkeits-Matrix aus gültigen Matchings
 * 
 * WICHTIG: Bei ungleicher Anzahl von Männern und Frauen werden nicht alle
 * Teilnehmer in jedem Matching vorkommen. Die Matrix muss trotzdem ALLE
 * Teilnehmer enthalten für die Vollständigkeit.
 * 
 * @param validMatchings - Alle gültigen Matchings
 * @param men - Liste der Männer
 * @param women - Liste der Frauen
 * @returns Wahrscheinlichkeits-Matrix
 */
function computeProbabilityMatrix(
  validMatchings: Matching[],
  men: string[],
  women: string[]
): ProbabilityMatrix {
  const matrix: ProbabilityMatrix = {}
  const total = validMatchings.length
  
  // WICHTIG: Initialisiere Matrix für ALLE Teilnehmer (auch die mit 0%)
  // Dies stellt sicher, dass alle Teilnehmer in der Tabelle erscheinen
  for (const woman of women) {
    matrix[woman] = {}
    for (const man of men) {
      matrix[woman][man] = 0
    }
  }
  
  // Guard: Keine gültigen Matchings
  if (total === 0) {
    return matrix
  }
  
  // Zähle Vorkommen jedes Paares
  for (const matching of validMatchings) {
    for (const pair of matching.pairs) {
      if (matrix[pair.woman] && matrix[pair.woman][pair.man] !== undefined) {
        matrix[pair.woman][pair.man]++
      }
    }
  }
  
  // Normiere zu Wahrscheinlichkeiten (0-1)
  for (const woman of women) {
    for (const man of men) {
      matrix[woman][man] = matrix[woman][man] / total
    }
  }
  
  return matrix
}

/**
 * Extrahiert fixierte Paare (Wahrscheinlichkeit = 1.0)
 * 
 * @param matrix - Wahrscheinlichkeits-Matrix
 * @returns Liste fixierter Paare
 */
function extractFixedPairs(matrix: ProbabilityMatrix): Pair[] {
  const fixedPairs: Pair[] = []
  
  for (const woman in matrix) {
    for (const man in matrix[woman]) {
      if (matrix[woman][man] === 1.0) {
        fixedPairs.push({ woman, man })
      }
    }
  }
  
  return fixedPairs
}

/**
 * Generiert einen Hash aus den Input-Daten für Caching
 * 
 * @param input - Input-Daten
 * @returns Hash-String
 */
export function generateDataHash(input: ProbabilityInput): string {
  // Einfacher aber ausreichender Hash:
  // Sortiere alle Daten und erstelle einen String
  
  const menStr = [...input.men].sort().join(',')
  const womenStr = [...input.women].sort().join(',')
  
  const ceremoniesStr = input.ceremonies
    .map(c => {
      const pairsStr = c.pairs
        .map(p => `${p.woman}:${p.man}`)
        .sort()
        .join('|')
      return `${pairsStr}=${c.correctCount}`
    })
    .sort()
    .join(';')
  
  const decisionsStr = input.boxDecisions
    .map(d => `${d.woman}:${d.man}=${d.isPerfectMatch ? '1' : '0'}`)
    .sort()
    .join(';')
  
  const fullString = `men:${menStr}|women:${womenStr}|ceremonies:${ceremoniesStr}|decisions:${decisionsStr}`
  
  // Simple hash function (FNV-1a)
  let hash = 2166136261
  for (let i = 0; i < fullString.length; i++) {
    hash ^= fullString.charCodeAt(i)
    hash *= 16777619
  }
  
  return (hash >>> 0).toString(36)
}

