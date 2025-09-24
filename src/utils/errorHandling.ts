/**
 * Zentrale Fehlerbehandlung für die AYTO App
 * 
 * Bietet konsistente Fehlerbehandlung und -validierung.
 * Folgt dem Single Responsibility Principle.
 */

import type { AppError, ValidationError } from '@/types'

/**
 * Erstellt einen AppError
 */
export function createAppError(message: string, code?: string, details?: unknown): AppError {
  return {
    message,
    code,
    details
  }
}

/**
 * Erstellt einen ValidationError
 */
export function createValidationError(field: string, value: unknown, message: string): ValidationError {
  return {
    message,
    field,
    value,
    code: 'VALIDATION_ERROR'
  }
}

/**
 * Wrapper für async Funktionen mit Fehlerbehandlung
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  errorMessage: string = 'Ein Fehler ist aufgetreten'
): Promise<T> {
  try {
    return await asyncFn()
  } catch (error) {
    console.error(errorMessage, error)
    
    if (error instanceof Error) {
      throw createAppError(error.message, 'ASYNC_ERROR', error)
    }
    
    throw createAppError(errorMessage, 'UNKNOWN_ERROR', error)
  }
}

/**
 * Wrapper für sync Funktionen mit Fehlerbehandlung
 */
export function withSyncErrorHandling<T>(
  syncFn: () => T,
  errorMessage: string = 'Ein Fehler ist aufgetreten'
): T {
  try {
    return syncFn()
  } catch (error) {
    console.error(errorMessage, error)
    
    if (error instanceof Error) {
      throw createAppError(error.message, 'SYNC_ERROR', error)
    }
    
    throw createAppError(errorMessage, 'UNKNOWN_ERROR', error)
  }
}

/**
 * Validiert, ob ein Wert nicht null/undefined ist
 */
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw createValidationError(fieldName, value, `${fieldName} ist erforderlich`)
  }
}

/**
 * Validiert String-Länge
 */
export function validateStringLength(
  value: string, 
  fieldName: string, 
  minLength: number = 1, 
  maxLength: number = 255
): void {
  if (value.length < minLength) {
    throw createValidationError(fieldName, value, `${fieldName} muss mindestens ${minLength} Zeichen lang sein`)
  }
  
  if (value.length > maxLength) {
    throw createValidationError(fieldName, value, `${fieldName} darf maximal ${maxLength} Zeichen lang sein`)
  }
}

/**
 * Validiert Zahlenbereich
 */
export function validateNumberRange(
  value: number, 
  fieldName: string, 
  min: number = 0, 
  max: number = Number.MAX_SAFE_INTEGER
): void {
  if (value < min) {
    throw createValidationError(fieldName, value, `${fieldName} muss mindestens ${min} sein`)
  }
  
  if (value > max) {
    throw createValidationError(fieldName, value, `${fieldName} darf maximal ${max} sein`)
  }
}

/**
 * Validiert E-Mail-Format
 */
export function validateEmail(email: string, fieldName: string = 'E-Mail'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createValidationError(fieldName, email, 'Ungültiges E-Mail-Format')
  }
}

/**
 * Validiert Datumsformat (YYYY-MM-DD)
 */
export function validateDateFormat(date: string, fieldName: string = 'Datum'): void {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    throw createValidationError(fieldName, date, 'Datum muss im Format YYYY-MM-DD sein')
  }
  
  // Prüfe, ob das Datum gültig ist
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    throw createValidationError(fieldName, date, 'Ungültiges Datum')
  }
}

/**
 * Validiert Zeitformat (HH:MM)
 */
export function validateTimeFormat(time: string, fieldName: string = 'Zeit'): void {
  const timeRegex = /^\d{2}:\d{2}$/
  if (!timeRegex.test(time)) {
    throw createValidationError(fieldName, time, 'Zeit muss im Format HH:MM sein')
  }
  
  const [hours, minutes] = time.split(':').map(Number)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw createValidationError(fieldName, time, 'Ungültige Zeit (Stunden: 0-23, Minuten: 0-59)')
  }
}

/**
 * Sammelt alle Validierungsfehler
 */
export function collectValidationErrors(validators: (() => void)[]): ValidationError[] {
  const errors: ValidationError[] = []
  
  for (const validator of validators) {
    try {
      validator()
    } catch (error) {
      if (error && typeof error === 'object' && 'field' in error) {
        errors.push(error as ValidationError)
      }
    }
  }
  
  return errors
}

/**
 * Formatiert Fehler für die Anzeige
 */
export function formatErrorForDisplay(error: AppError | ValidationError): string {
  if ('field' in error) {
    return `${error.field}: ${error.message}`
  }
  
  return error.message
}

/**
 * Loggt Fehler für Debugging
 */
export function logError(error: AppError | ValidationError, context?: string): void {
  const prefix = context ? `[${context}]` : '[ERROR]'
  console.error(`${prefix}`, error)
  
  // Hier könnte zusätzlich ein Error-Tracking-Service integriert werden
  // z.B. Sentry, LogRocket, etc.
}

