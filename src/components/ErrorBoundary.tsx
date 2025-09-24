/**
 * Error Boundary Komponente
 * 
 * Fängt JavaScript-Fehler in der Komponenten-Baum ab und zeigt eine Fallback-UI.
 * Folgt dem Single Responsibility Principle.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * Error Boundary Komponente
 * 
 * Verantwortlichkeiten:
 * - Abfangen von JavaScript-Fehlern
 * - Anzeige einer Fallback-UI
 * - Logging von Fehlern
 * - Möglichkeit zur Wiederherstellung
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Aktualisiere den State, damit die nächste Render-Phase die Fallback-UI zeigt
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logge den Fehler
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Hier könnte zusätzlich ein Error-Tracking-Service integriert werden
    // z.B. Sentry, LogRocket, etc.
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Fallback-UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 p-4">
          <Card className="w-full max-w-2xl border-red-200 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-800">
                Etwas ist schiefgelaufen
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center text-gray-600">
                <p className="mb-4">
                  Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
                </p>
                
                {this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                      Technische Details anzeigen
                    </summary>
                    <div className="mt-2 rounded bg-gray-100 p-3 text-sm">
                      <p className="font-medium text-red-600">Fehler:</p>
                      <p className="font-mono text-xs break-all">{this.state.error.message}</p>
                      
                      {this.state.errorInfo && (
                        <>
                          <p className="mt-2 font-medium text-red-600">Stack Trace:</p>
                          <pre className="mt-1 text-xs overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Erneut versuchen
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Seite neu laden
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>
                  Falls das Problem weiterhin besteht, wenden Sie sich an den Support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook für Error Boundary Funktionalität in Funktionskomponenten
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('Error captured by useErrorHandler:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}