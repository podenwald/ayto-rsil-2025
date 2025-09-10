import { useState } from 'react'
import { clearBrowserCache, disableVersionCheck, saveCurrentVersion } from '@/utils/versionCheck'

interface VersionCheckDialogProps {
  isOpen: boolean
  lastVersion: string | null
  currentVersion: string
  onClose: () => void
  onCacheCleared: () => void
}

export default function VersionCheckDialog({
  isOpen,
  lastVersion,
  currentVersion,
  onClose,
  onCacheCleared
}: VersionCheckDialogProps) {
  const [isClearing, setIsClearing] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  const handleClearCache = async () => {
    try {
      setIsClearing(true)
      await clearBrowserCache()
      saveCurrentVersion()
      onCacheCleared()
      onClose()
    } catch (error) {
      console.error('Fehler beim Löschen des Caches:', error)
      alert('Fehler beim Löschen des Caches. Bitte versuchen Sie es manuell.')
    } finally {
      setIsClearing(false)
    }
  }

  const handleDisableCheck = () => {
    disableVersionCheck()
    setIsDisabled(true)
    onClose()
  }

  const handleSkip = () => {
    saveCurrentVersion()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      onClick={onClose} 
      style={{
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.7)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 3000,
        padding: '20px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{
          background: 'white', 
          maxWidth: 500, 
          width: '100%', 
          padding: 24, 
          borderRadius: 16, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16 
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}>
              🔄
            </div>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: 20, 
                fontWeight: 600, 
                color: '#1f2937' 
              }}>
                Neue Version verfügbar
              </h2>
              <p style={{ 
                margin: 0, 
                fontSize: 14, 
                color: '#6b7280' 
              }}>
                Die Anwendung wurde aktualisiert
              </p>
            </div>
          </div>
          
          <div style={{ 
            background: '#f8fafc', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 20 
          }}>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Vorherige Version:</strong> {lastVersion || 'Unbekannt'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Aktuelle Version:</strong> {currentVersion}
              </div>
            </div>
          </div>

          <div style={{ 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 20 
          }}>
            <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.5 }}>
              <strong>💡 Empfehlung:</strong> Um sicherzustellen, dass alle neuen Features 
              korrekt funktionieren, sollten Sie Ihren Browser-Cache und Cookies löschen.
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 12, 
          flexDirection: 'column' 
        }}>
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            style={{
              background: isClearing ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: isClearing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              if (!isClearing) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isClearing) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {isClearing ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Cache wird gelöscht...
              </>
            ) : (
              <>
                🗑️ Cache & Cookies löschen
              </>
            )}
          </button>

          <div style={{ 
            display: 'flex', 
            gap: 8 
          }}>
            <button
              onClick={handleSkip}
              style={{
                flex: 1,
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6'
              }}
            >
              Jetzt nicht
            </button>

            <button
              onClick={handleDisableCheck}
              disabled={isDisabled}
              style={{
                flex: 1,
                background: isDisabled ? '#9ca3af' : '#fef2f2',
                color: isDisabled ? '#ffffff' : '#dc2626',
                border: `1px solid ${isDisabled ? '#9ca3af' : '#fecaca'}`,
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.background = '#fee2e2'
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.background = '#fef2f2'
                }
              }}
            >
              {isDisabled ? 'Deaktiviert' : 'Nicht mehr fragen'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
