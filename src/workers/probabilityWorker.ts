/**
 * Web Worker für Wahrscheinlichkeits-Berechnungen
 * 
 * Führt die rechenintensiven Berechnungen im Hintergrund aus,
 * um die UI nicht zu blockieren.
 * 
 * Message-Protokoll:
 * - IN: { type: 'calculate', input: ProbabilityInput }
 * - OUT: { type: 'progress', progress: number, step: string }
 * - OUT: { type: 'result', result: ProbabilityResult }
 * - OUT: { type: 'error', error: string }
 */

import type { ProbabilityInput, ProbabilityResult } from '@/types'
import { calculateProbabilities } from '@/services/probabilityService'

/**
 * Nachrichten-Typen für Worker-Kommunikation
 */
interface WorkerInputMessage {
  type: 'calculate'
  input: ProbabilityInput
}

interface WorkerProgressMessage {
  type: 'progress'
  progress: number
  step: string
}

interface WorkerResultMessage {
  type: 'result'
  result: ProbabilityResult
}

interface WorkerErrorMessage {
  type: 'error'
  error: string
}

type WorkerOutputMessage = WorkerProgressMessage | WorkerResultMessage | WorkerErrorMessage

/**
 * Worker Message Handler
 */
self.addEventListener('message', async (event: MessageEvent<WorkerInputMessage>) => {
  const { type, input } = event.data
  
  if (type === 'calculate') {
    try {
      // Progress-Callback
      const onProgress = (progress: number, step: string) => {
        const progressMessage: WorkerProgressMessage = {
          type: 'progress',
          progress,
          step
        }
        self.postMessage(progressMessage)
      }
      
      // Starte Berechnung
      const result = await calculateProbabilities(input, onProgress)
      
      // Sende Ergebnis zurück
      const resultMessage: WorkerResultMessage = {
        type: 'result',
        result
      }
      self.postMessage(resultMessage)
      
    } catch (error) {
      // Fehler-Handling
      const errorMessage: WorkerErrorMessage = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
      self.postMessage(errorMessage)
    }
  }
})

// Export für TypeScript
export type { WorkerInputMessage, WorkerOutputMessage }

