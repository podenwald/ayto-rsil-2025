/**
 * Komponente für Teilnehmer-Karten
 * 
 * Zeigt einzelne Teilnehmer in Apple-Style Cards an.
 * Folgt dem Single Responsibility Principle.
 */

import React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, User } from "lucide-react"
import type { Participant } from '@/types'

interface ParticipantCardProps {
  person: Participant
  onEdit?: (person: Participant) => void
  onDelete?: (person: Participant) => void
}

/**
 * Teilnehmer-Karte Komponente
 * 
 * Verantwortlichkeiten:
 * - Anzeige der Teilnehmer-Informationen
 * - Bereitstellung von Edit/Delete-Aktionen
 * - Apple-Style Design
 */
export const ParticipantCard = React.memo<ParticipantCardProps>(({ person, onEdit, onDelete }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        {/* Profile Image - Apple Style */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg mb-2">{person.name}</h3>
          
          {/* Badges - Apple Style */}
          <div className="flex gap-3 mb-3">
            {person.age && (
              <Badge className="bg-blue-500 text-white border-0 px-4 py-2 text-sm font-semibold rounded-full shadow-sm">
                {person.age} Jahre
              </Badge>
            )}
            {person.status && (
              <Badge className="bg-green-500 text-white border-0 px-4 py-2 text-sm font-semibold rounded-full shadow-sm">
                {person.status}
              </Badge>
            )}
          </div>
          
          {/* Show */}
          <p className="text-sm text-gray-600 mb-4 font-medium">{person.knownFrom}</p>
          
          {/* Action Buttons - 44pt minimum */}
          <div className="flex gap-3">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-11 w-11 p-0 rounded-2xl hover:bg-blue-50 hover:text-blue-600 shadow-sm"
                onClick={() => onEdit(person)}
              >
                <Edit className="h-5 w-5" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-11 w-11 p-0 rounded-2xl hover:bg-red-50 hover:text-red-600 shadow-sm"
                onClick={() => onDelete(person)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
})
