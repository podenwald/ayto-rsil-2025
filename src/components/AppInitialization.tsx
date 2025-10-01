/**
 * Komponente für App-Initialisierung
 * 
 * Zeigt Loading- und Error-States während der App-Initialisierung.
 * Folgt dem Single Responsibility Principle.
 */

import { useAppInitialization } from '@/hooks/useAppInitialization'
import { InitializationError } from '@/components/InitializationError'

interface AppInitializationProps {
  children: React.ReactNode
}

/**
 * Wrapper-Komponente für App-Initialisierung
 * 
 * Verantwortlichkeiten:
 * - Anzeige des Loading-States
 * - Anzeige von Initialisierungsfehlern
 * - Rendering der App nach erfolgreicher Initialisierung
 */
export function AppInitialization({ children }: AppInitializationProps) {
  const { isInitializing, initError } = useAppInitialization()

  const handleRetry = () => {
    window.location.reload()
  }

  const handleReload = () => {
    window.location.reload()
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Initialisiere Daten ...</p>
          <p className="text-sm text-gray-500">Lade Seed-Daten und bereite die Anwendung vor</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <InitializationError
        error={initError}
        onRetry={handleRetry}
        onReload={handleReload}
      />
    )
  }

  return <>{children}</>
}

