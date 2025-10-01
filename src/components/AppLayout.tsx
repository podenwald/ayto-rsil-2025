/**
 * Layout-Komponente für die App
 * 
 * Kapselt das gemeinsame Layout und die Versions-Check-Dialog-Logik.
 * Folgt dem Single Responsibility Principle.
 */

import { useVersionCheck } from '@/hooks/useVersionCheck'
import { useDatabaseUpdate } from '@/hooks/useDatabaseUpdate'
import VersionCheckDialog from '@/components/VersionCheckDialog'
import DatabaseUpdateBanner from '@/components/DatabaseUpdateBanner'
import LegalFooter from '@/components/LegalFooter'

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * Layout-Komponente für die App
 * 
 * Verantwortlichkeiten:
 * - Bereitstellung des gemeinsamen Layouts
 * - Integration des Versions-Check-Dialogs
 * - Integration des Legal Footers
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { versionCheck, handleVersionDialogClose, handleCacheCleared } = useVersionCheck()
  const { updateState, performUpdate, dismissUpdate } = useDatabaseUpdate()

  return (
    <>
      {/* Datenbank-Update-Banner */}
      <DatabaseUpdateBanner
        updateState={updateState}
        onUpdate={performUpdate}
        onDismiss={dismissUpdate}
      />
      
      {/* Hauptinhalt mit Top-Padding wenn Banner angezeigt wird */}
      <div style={{ 
        paddingTop: updateState.isUpdateAvailable ? '60px' : '0',
        transition: 'padding-top 0.3s ease'
      }}>
        {children}
      </div>
      
      <LegalFooter />
      
      {/* App-Versions-Check-Dialog */}
      <VersionCheckDialog
        isOpen={versionCheck.shouldShowDialog}
        lastVersion={versionCheck.lastVersion}
        currentVersion={versionCheck.currentVersion}
        onClose={handleVersionDialogClose}
        onCacheCleared={handleCacheCleared}
      />
    </>
  )
}

