/**
 * Komponente für App-Initialisierung
 * 
 * Zeigt Loading- und Error-States während der App-Initialisierung.
 * Folgt dem Single Responsibility Principle.
 */

import { useAppInitialization } from '@/hooks/useAppInitialization'

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

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Initialisiere Daten ...</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800">Initialisierungsfehler</h2>
          <p className="text-gray-600">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

