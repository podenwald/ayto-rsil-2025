/**
 * Custom Hook für Versions-Check
 * 
 * Kapselt die Versions-Check-Logik.
 * Folgt dem Single Responsibility Principle.
 */

import { useEffect, useState } from 'react'
import { initializeVersionCheck } from '@/utils/versionCheck'
import type { VersionCheckState } from '@/types'

interface UseVersionCheckResult {
  versionCheck: VersionCheckState
  handleVersionDialogClose: () => void
  handleCacheCleared: () => void
}

/**
 * Hook für Versions-Check
 * 
 * Verantwortlichkeiten:
 * - Initialisierung des Versions-Checks
 * - State-Management für Versions-Dialog
 * - Cache-Clear-Handling
 */
export function useVersionCheck(): UseVersionCheckResult {
  const [versionCheck, setVersionCheck] = useState<VersionCheckState>({
    shouldShowDialog: false,
    lastVersion: null,
    currentVersion: ''
  })

  useEffect(() => {
    const versionResult = initializeVersionCheck()
    setVersionCheck({
      shouldShowDialog: versionResult.shouldShowDialog,
      lastVersion: versionResult.lastVersion,
      currentVersion: versionResult.currentVersion
    })
  }, [])

  const handleVersionDialogClose = () => {
    setVersionCheck(prev => ({ ...prev, shouldShowDialog: false }))
  }

  const handleCacheCleared = () => {
    // Seite neu laden nach Cache-Clear
    window.location.reload()
  }

  return {
    versionCheck,
    handleVersionDialogClose,
    handleCacheCleared
  }
}

