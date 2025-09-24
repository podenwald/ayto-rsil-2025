/**
 * Komponente für Wahrscheinlichkeits-Grid
 * 
 * Zeigt die Perfect-Match-Wahrscheinlichkeiten in einer Tabelle an.
 * Folgt dem Single Responsibility Principle.
 */

import React from "react"
import { CheckCircle, XCircle } from "lucide-react"
import type { Participant } from '@/types'

interface ProbabilityGridProps {
  men: Participant[]
  women: Participant[]
  probabilities: Record<number, Record<number, number>>
  forbidden: Record<number, Record<number, boolean>>
  confirmed: Record<number, number>
}

/**
 * Wahrscheinlichkeits-Grid Komponente
 * 
 * Verantwortlichkeiten:
 * - Anzeige der Wahrscheinlichkeits-Matrix
 * - Visualisierung von bestätigten und ausgeschlossenen Paaren
 * - Responsive Tabellen-Darstellung
 */
export const ProbabilityGrid = React.memo<ProbabilityGridProps>(({ 
  men, 
  women, 
  probabilities, 
  forbidden, 
  confirmed 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4 text-left font-semibold text-gray-700">\</th>
            {women.map(w => (
              <th key={w.id} className="p-4 text-center font-semibold text-gray-700 min-w-[80px]">
                {w.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {men.map(m => (
            <tr key={m.id} className="border-t border-gray-100">
              <td className="p-4 font-semibold text-gray-700 bg-gray-50">{m.name}</td>
              {women.map(w => {
                const p = probabilities[m.id!]?.[w.id!] ?? 0
                const f = forbidden[m.id!]?.[w.id!] ?? false
                const c = confirmed[m.id!] === w.id!
                
                return (
                  <td key={w.id} className={`p-4 text-center border-l border-gray-100 transition-colors ${
                    c ? "bg-green-100 text-green-800 font-semibold" : 
                    f ? "bg-red-100 text-red-800 font-semibold" : 
                    "bg-white hover:bg-gray-50"
                  }`}>
                    <div className="text-lg font-bold">{(p*100).toFixed(0)}%</div>
                    {c && <CheckCircle className="h-5 w-5 mx-auto mt-1 text-green-600" />}
                    {f && <XCircle className="h-5 w-5 mx-auto mt-1 text-red-600" />}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
