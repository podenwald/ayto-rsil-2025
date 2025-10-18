/**
 * Custom Hook für Datenbank-Updates
 * 
 * Kapselt die Logik für benutzer-gesteuerte Datenbank-Updates.
 * Folgt dem Single Responsibility Principle.
 */

import { useEffect, useState, useCallback } from 'react'
import { 
  checkForDatabaseUpdate, 
  performDatabaseUpdate,
  initializeDatabaseUpdateService,
  type DatabaseUpdateState,
  type DatabaseUpdateResult 
} from '@/services/databaseUpdateService'

interface UseDatabaseUpdateResult {
  updateState: DatabaseUpdateState
  checkForUpdates: () => Promise<void>
  performUpdate: () => Promise<DatabaseUpdateResult>
  dismissUpdate: () => void
  isInitialized: boolean
}

/**
 * Hook für Datenbank-Updates
 * 
 * Verantwortlichkeiten:
 * - Initialisierung des Update-Services
 * - Versions-Check beim App-Start
 * - State-Management für Update-UI
 * - Update-Ausführung
 */
export function useDatabaseUpdate(): UseDatabaseUpdateResult {
  const [updateState, setUpdateState] = useState<DatabaseUpdateState>({
    isUpdateAvailable: false,
    currentVersion: 'unknown',
    latestVersion: 'unknown',
    currentDataHash: 'unknown',
    latestDataHash: 'unknown',
    releasedDate: '',
    isUpdating: false,
    updateError: null
  })
  
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialisierung beim ersten Laden (nur einmal)
  useEffect(() => {
    let isMounted = true
    
    const initialize = async () => {
      try {
        await initializeDatabaseUpdateService()
        
        // Nur Updates prüfen wenn Component noch gemountet ist
        if (isMounted) {
          await checkForUpdates()
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Fehler bei der Initialisierung:', error)
        if (isMounted) {
          setIsInitialized(true) // Trotzdem als initialisiert markieren
        }
      }
    }
    
    initialize()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  // Versions-Check durchführen
  const checkForUpdates = useCallback(async () => {
    try {
      const state = await checkForDatabaseUpdate()
      setUpdateState(prev => ({
        ...state,
        isUpdating: prev.isUpdating // Update-Status beibehalten
      }))
    } catch (error) {
      console.error('Fehler beim Versions-Check:', error)
      setUpdateState(prev => ({
        ...prev,
        updateError: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }))
    }
  }, [])

  // Update durchführen
  const performUpdate = useCallback(async (): Promise<DatabaseUpdateResult> => {
    setUpdateState(prev => ({ ...prev, isUpdating: true, updateError: null }))
    
    try {
      const result = await performDatabaseUpdate()
      
      if (result.success) {
        setUpdateState(prev => ({
          ...prev,
          isUpdateAvailable: false,
          currentVersion: result.newVersion,
          isUpdating: false,
          updateError: null
        }))
      } else {
        setUpdateState(prev => ({
          ...prev,
          isUpdating: false,
          updateError: result.error || 'Update fehlgeschlagen'
        }))
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        updateError: errorMessage
      }))
      
      return {
        success: false,
        newVersion: 'unknown',
        newDataHash: 'unknown',
        releasedDate: '',
        error: errorMessage
      }
    }
  }, [])

  // Update-Hinweis verwerfen
  const dismissUpdate = useCallback(() => {
    setUpdateState(prev => ({ ...prev, isUpdateAvailable: false }))
  }, [])

  return {
    updateState,
    checkForUpdates,
    performUpdate,
    dismissUpdate,
    isInitialized
  }
}

