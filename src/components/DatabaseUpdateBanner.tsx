/**
 * Banner-Komponente für Datenbank-Updates
 * 
 * Zeigt einen benutzer-freundlichen Hinweis an, wenn neue Daten verfügbar sind.
 * Implementiert das benutzer-gesteuerte Update-System.
 */

import { useState } from 'react'
import type { DatabaseUpdateState, DatabaseUpdateResult } from '@/services/databaseUpdateService'
import UpdateFeedbackToast from './UpdateFeedbackToast'

interface DatabaseUpdateBannerProps {
  updateState: DatabaseUpdateState
  onUpdate: () => Promise<DatabaseUpdateResult>
  onDismiss: () => void
}

export default function DatabaseUpdateBanner({
  updateState,
  onUpdate,
  onDismiss
}: DatabaseUpdateBannerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<DatabaseUpdateResult | null>(null)

  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      setUpdateResult(null)
      
      const result = await onUpdate()
      setUpdateResult(result)
      
      if (result.success) {
        // Erfolgreiches Update - Banner nach kurzer Zeit ausblenden
        setTimeout(() => {
          onDismiss()
        }, 2000)
      }
    } catch (error) {
      console.error('Fehler beim Update:', error)
      setUpdateResult({
        success: false,
        newVersion: 'unknown',
        newDataHash: 'unknown',
        releasedDate: '',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToastClose = () => {
    setUpdateResult(null)
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

  // Nur anzeigen, wenn Update verfügbar ist
  if (!updateState.isUpdateAvailable) {
    return null
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        color: 'white',
        padding: '12px 16px',
        zIndex: 1300,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Update-Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🔄
          </div>
          
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600,
              marginBottom: '2px'
            }}>
              Neue Daten verfügbar
            </div>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.9,
              lineHeight: 1.4
            }}>
              Version {updateState.latestVersion} verfügbar 
              {updateState.releasedDate && (
                <> • Veröffentlicht am {formatDate(updateState.releasedDate)}</>
              )}
            </div>
          </div>
        </div>


        {/* Aktions-Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleUpdate}
            disabled={isUpdating || updateState.isUpdating}
            style={{
              background: isUpdating || updateState.isUpdating 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isUpdating || updateState.isUpdating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: '120px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isUpdating && !updateState.isUpdating) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isUpdating && !updateState.isUpdating) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            {isUpdating || updateState.isUpdating ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Aktualisiere...
              </>
            ) : (
              <>Jetzt aktualisieren</>
            )}
          </button>

          <button
            onClick={onDismiss}
            disabled={isUpdating || updateState.isUpdating}
            style={{
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isUpdating || updateState.isUpdating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isUpdating && !updateState.isUpdating) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'white'
              }
            }}
            onMouseLeave={(e) => {
              if (!isUpdating && !updateState.isUpdating) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
              }
            }}
          >
            Später
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Feedback Toast */}
      <UpdateFeedbackToast
        result={updateResult}
        onClose={handleToastClose}
      />
    </div>
  )
}
