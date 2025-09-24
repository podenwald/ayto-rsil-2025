/**
 * Zentrale Typdefinitionen für die AYTO RSIL 2025 App
 * 
 * Alle Domain-Typen werden hier zentral gepflegt und nicht dupliziert.
 * Folgt dem Single Source of Truth Prinzip.
 */

// === Basis-Typen ===
export type Gender = 'F' | 'M'

export type MatchType = 'perfect' | 'no-match' | 'sold'

export type ParticipantStatus = 'Aktiv' | 'Inaktiv'

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

// === Import/Export-Typen ===
export interface DatabaseExport {
  participants: Participant[]
  matchingNights: MatchingNight[]
  matchboxes: Matchbox[]
  penalties: Penalty[]
}

export interface DatabaseImport {
  participants: ParticipantDTO[]
  matchingNights: MatchingNightDTO[]
  matchboxes: MatchboxDTO[]
  penalties: PenaltyDTO[]
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

