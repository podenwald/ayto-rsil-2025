/**
 * Toast-Komponente für Update-Feedback
 * 
 * Zeigt kurze Erfolgs- oder Fehlermeldungen für Datenbank-Updates an.
 * Implementiert ein benutzer-freundliches Feedback-System.
 */

import { useEffect, useState } from 'react'
import type { DatabaseUpdateResult } from '@/services/databaseUpdateService'

interface UpdateFeedbackToastProps {
  result: DatabaseUpdateResult | null
  onClose: () => void
}

export default function UpdateFeedbackToast({ result, onClose }: UpdateFeedbackToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (result) {
      setIsVisible(true)
      
      // Toast nach 5 Sekunden automatisch ausblenden
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Warten auf Animation
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [result, onClose])

  if (!result || !isVisible) {
    return null
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const isSuccess = result.success

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: isSuccess ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        zIndex: 2000,
        maxWidth: '400px',
        minWidth: '300px',
        transform: isVisible ? 'translateY(0)' : 'translateY(100px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease',
        border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          {isSuccess ? '✅' : '❌'}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '4px'
          }}>
            {isSuccess ? 'Daten erfolgreich aktualisiert' : 'Update fehlgeschlagen'}
          </div>
          
          {isSuccess ? (
            <div style={{
              fontSize: '12px',
              opacity: 0.9,
              lineHeight: 1.4
            }}>
              Version {result.newVersion} wurde installiert
              {result.releasedDate && (
                <> • {formatDate(result.releasedDate)}</>
              )}
            </div>
          ) : (
            <div style={{
              fontSize: '12px',
              opacity: 0.9,
              lineHeight: 1.4
            }}>
              {result.error || 'Unbekannter Fehler'}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '16px',
            lineHeight: 1,
            flexShrink: 0,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
          }}
        >
          ×
        </button>
      </div>

      {/* Progress Bar für Auto-Close */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden'
      }}>
        <div
          style={{
            height: '100%',
            background: 'rgba(255, 255, 255, 0.8)',
            width: '100%',
            transform: 'translateX(-100%)',
            animation: 'progress 5s linear forwards'
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

