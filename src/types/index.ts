/**
 * Zentrale Typdefinitionen für die AYTO RSIL 2025 App
 * 
 * Alle Domain-Typen werden hier zentral gepflegt und nicht dupliziert.
 * Folgt dem Single Source of Truth Prinzip.
 */

// === Basis-Typen ===
export type Gender = 'F' | 'M'

export type MatchType = 'perfect' | 'no-match' | 'sold'

export type ParticipantStatus = 'Aktiv' | 'aktiv' | 'Inaktiv' | 'Perfekt Match'

// === Domain-Entitäten ===
export interface Participant {
  id?: number
  name: string
  knownFrom: string
  age?: number
  status?: ParticipantStatus
  active?: boolean
  photoUrl?: string
  bio?: string
  gender: Gender
  photoBlob?: Blob
  socialMediaAccount?: string
  freeProfilePhotoUrl?: string
  freeProfilePhotoAttribution?: string
  freeProfilePhotoLicense?: string
}

export interface MatchingNight {
  id?: number
  name: string
  date: string
  pairs: Array<{ woman: string; man: string }>
  totalLights?: number
  createdAt: Date
  ausstrahlungsdatum?: string
  ausstrahlungszeit?: string
}

export interface Matchbox {
  id?: number
  woman: string
  man: string
  matchType: MatchType
  price?: number
  buyer?: string
  soldDate?: Date
  createdAt: Date
  updatedAt: Date
  ausstrahlungsdatum?: string
  ausstrahlungszeit?: string
}

export interface Penalty {
  id?: number
  participantName: string
  reason: string
  amount: number
  date: string
  description?: string
  createdAt: Date
}

export interface BroadcastNote {
  id?: number
  date: string // ISO date (YYYY-MM-DD)
  notes: string
  createdAt: Date
  updatedAt: Date
}

// === API/DTO-Typen ===
export interface ParticipantDTO {
  id?: number
  name: string
  knownFrom: string
  age?: number
  status?: string
  active?: boolean
  photoUrl?: string
  bio?: string
  gender: Gender
  photoBlob?: Blob
  socialMediaAccount?: string
  freeProfilePhotoUrl?: string
  freeProfilePhotoAttribution?: string
  freeProfilePhotoLicense?: string
}

export interface MatchingNightDTO {
  id?: number
  name: string
  date: string
  pairs: Array<{ woman: string; man: string }>
  totalLights?: number
  createdAt: string // ISO string für JSON
  ausstrahlungsdatum?: string
  ausstrahlungszeit?: string
}

export interface MatchboxDTO {
  id?: number
  woman: string
  man: string
  matchType: MatchType
  price?: number
  buyer?: string
  soldDate?: string // ISO string für JSON
  createdAt: string // ISO string für JSON
  updatedAt: string // ISO string für JSON
  ausstrahlungsdatum?: string
  ausstrahlungszeit?: string
}

export interface PenaltyDTO {
  id?: number
  participantName: string
  reason: string
  amount: number
  date: string
  description?: string
  createdAt: string // ISO string für JSON
}

export interface BroadcastNoteDTO {
  id?: number
  date: string
  notes: string
  createdAt: string
  updatedAt: string
}

// === Import/Export-Typen ===
export interface DatabaseExport {
  participants: Participant[]
  matchingNights: MatchingNight[]
  matchboxes: Matchbox[]
  penalties: Penalty[]
  probabilityCache?: ProbabilityCache[]
  broadcastNotes?: BroadcastNote[]
}

export interface DatabaseImport {
  participants: ParticipantDTO[]
  matchingNights: MatchingNightDTO[]
  matchboxes: MatchboxDTO[]
  penalties: PenaltyDTO[]
  probabilityCache?: ProbabilityCacheDTO[]
  broadcastNotes?: BroadcastNoteDTO[]
}

// === UI-State-Typen ===
export interface AppRoute {
  type: 'root' | 'admin'
}

export interface VersionCheckState {
  shouldShowDialog: boolean
  lastVersion: string | null
  currentVersion: string
}

export interface AppState {
  route: AppRoute['type']
  isInitializing: boolean
  initError: string | null
  versionCheck: VersionCheckState
}

// === Utility-Typen ===
export interface Pair {
  woman: string
  man: string
}

export interface DatabaseCounts {
  participants: number
  matchingNights: number
  matchboxes: number
  penalties: number
}

// === Error-Typen ===
export interface AppError {
  message: string
  code?: string
  details?: unknown
}

export interface ValidationError extends AppError {
  field: string
  value: unknown
}

// === Broadcast-Utility-Typen ===
export interface BroadcastDateTime {
  ausstrahlungsdatum: string // YYYY-MM-DD
  ausstrahlungszeit: string   // HH:MM
}

export interface BroadcastInfo extends BroadcastDateTime {
  createdAt: Date
}

// === Wahrscheinlichkeits-Analyse-Typen ===

/**
 * Ein Matching ist eine vollständige Zuordnung von Männern zu Frauen
 * Repräsentiert als Array von Paaren
 */
export interface Matching {
  pairs: Pair[]
}

/**
 * Wahrscheinlichkeits-Matrix
 * Speichert für jedes mögliche Paar (Frau, Mann) die Wahrscheinlichkeit [0..1]
 */
export interface ProbabilityMatrix {
  [womanName: string]: {
    [manName: string]: number
  }
}

/**
 * Ergebnis der Wahrscheinlichkeits-Berechnung
 */
export interface ProbabilityResult {
  probabilityMatrix: ProbabilityMatrix
  fixedPairs: Pair[]
  totalValidMatchings: number
  calculationTime: number // in ms
  limitReached: boolean
}

/**
 * Cache-Eintrag für Wahrscheinlichkeits-Berechnungen
 * Wird in IndexedDB gespeichert um wiederholte Berechnungen zu vermeiden
 */
export interface ProbabilityCache {
  id?: number
  dataHash: string // Hash der Input-Daten (Teilnehmer, Zeremonien, Matchboxen)
  result: ProbabilityResult
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO für Probability Cache (JSON Export/Import)
 */
export interface ProbabilityCacheDTO {
  id?: number
  dataHash: string
  result: ProbabilityResult
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

/**
 * Input-Daten für die Wahrscheinlichkeits-Berechnung
 */
export interface ProbabilityInput {
  men: string[] // Namen der Männer
  women: string[] // Namen der Frauen
  ceremonies: CeremonyConstraint[]
  boxDecisions: BoxDecision[]
}

/**
 * Constraint aus einer Matching Night Zeremonie
 */
export interface CeremonyConstraint {
  pairs: Pair[]
  correctCount: number // Anzahl korrekter Lichter
  knownPerfectMatches: Pair[] // Perfect Matches die VOR dieser Zeremonie bekannt waren
}

/**
 * Fixierung durch Matchbox-Entscheidung
 */
export interface BoxDecision {
  woman: string
  man: string
  isPerfectMatch: boolean // true = perfect match, false = no match
}

/**
 * Status der Wahrscheinlichkeits-Berechnung
 */
export interface ProbabilityCalculationStatus {
  isCalculating: boolean
  progress: number // 0-100
  currentStep: string
  error?: string
}

