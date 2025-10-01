/**
 * Initialisierungsfehler-Komponente
 * 
 * Zeigt eine benutzerfreundliche Fehlermeldung an, wenn die App-Initialisierung fehlschlägt.
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Download, Database } from 'lucide-react'

interface InitializationErrorProps {
  error: string
  onRetry: () => void
  onReload: () => void
}

/**
 * Initialisierungsfehler-Komponente
 * 
 * Verantwortlichkeiten:
 * - Anzeige von Initialisierungsfehlern
 * - Benutzerfreundliche Fehlermeldungen
 * - Handlungsoptionen für den Benutzer
 */
export function InitializationError({ error, onRetry, onReload }: InitializationErrorProps) {
  const handleDownloadData = () => {
    // Erstelle einen Download-Link für die JSON-Dateien
    const dataUrl = '/json/ayto-vip-2025.json'
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'ayto-vip-2025.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClearStorage = () => {
    if (confirm('Möchten Sie wirklich alle gespeicherten Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
      localStorage.clear()
      sessionStorage.clear()
      if ('indexedDB' in window) {
        indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name)
            }
          })
        })
      }
      onReload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4">
      <Card className="w-full max-w-2xl border-orange-200 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Database className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-800">
            Initialisierungsfehler
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p className="mb-4">
              Die Anwendung konnte nicht initialisiert werden. Die Seed-Daten konnten nicht geladen werden.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-orange-800 mb-2">Mögliche Ursachen:</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Netzwerkverbindung unterbrochen</li>
                <li>• JSON-Dateien nicht verfügbar</li>
                <li>• Browser-Cache-Probleme</li>
                <li>• Service Worker-Konflikte</li>
              </ul>
            </div>
            
            <details className="mt-4 text-left">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                Technische Details anzeigen
              </summary>
              <div className="mt-2 rounded bg-gray-100 p-3 text-sm">
                <p className="font-medium text-red-600">Fehler:</p>
                <p className="font-mono text-xs break-all">{error}</p>
              </div>
            </details>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Erneut versuchen
              </Button>
              
              <Button 
                onClick={onReload}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="h-4 w-4" />
                Seite neu laden
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleDownloadData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Daten herunterladen
              </Button>
              
              <Button 
                onClick={handleClearStorage}
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4" />
                Speicher leeren
              </Button>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              Falls das Problem weiterhin besteht, versuchen Sie es später erneut oder wenden Sie sich an den Support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
