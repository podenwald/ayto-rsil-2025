import { useEffect, useState } from 'react'
import OverviewMUI from "@/features/overview/OverviewMUI"
import AdminPanelMUI from "@/features/admin/AdminPanelMUI"
import ThemeProvider from "@/theme/ThemeProvider"
import LegalFooter from "@/components/LegalFooter"
import VersionCheckDialog from "@/components/VersionCheckDialog"
import { db, type Participant, type MatchingNight, type Matchbox, type Penalty } from "@/lib/db"
import { initializeVersionCheck } from "@/utils/versionCheck"

export default function App() {
  const [route, setRoute] = useState<'root' | 'admin'>('root')
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [versionCheck, setVersionCheck] = useState<{
    shouldShowDialog: boolean
    lastVersion: string | null
    currentVersion: string
  }>({
    shouldShowDialog: false,
    lastVersion: null,
    currentVersion: ''
  })

  // Versions-Check beim App-Start
  useEffect(() => {
    const versionResult = initializeVersionCheck()
    setVersionCheck({
      shouldShowDialog: versionResult.shouldShowDialog,
      lastVersion: versionResult.lastVersion,
      currentVersion: versionResult.currentVersion
    })
  }, [])

  // Legacy-Query-Weiterleitungen und pfadbasiertes Routing
  useEffect(() => {
    const url = new URL(window.location.href)
    const pathname = url.pathname
    const searchParams = url.searchParams

    // Legacy: /?overview=1&mui=1 -> /
    const isOverviewLegacy = searchParams.get('overview') === '1'
    const isAdminLegacy = searchParams.get('admin') === '1'
    const isMuiLegacy = searchParams.get('mui') === '1'

    // Wenn Legacy-Parameter vorhanden sind, entsprechend umleiten
    if (isOverviewLegacy || isMuiLegacy || isAdminLegacy) {
      if (isAdminLegacy) {
        window.history.replaceState({}, '', '/admin')
        setRoute('admin')
      } else {
        window.history.replaceState({}, '', '/')
        setRoute('root')
      }
    } else {
      // Pfadbasiertes Routing
      if (pathname.startsWith('/admin')) {
        setRoute('admin')
      } else {
        setRoute('root')
      }
    }
  }, [])

  // Bootstrap: Seed-Load aus public/ayto-complete-noPicture.json beim ersten Start
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Überspringen, wenn bereits Daten vorhanden sind
        const [pCount, mnCount, mbCount, peCount] = await Promise.all([
          db.participants.count(),
          db.matchingNights.count(),
          db.matchboxes.count(),
          db.penalties.count()
        ])
        if (pCount + mnCount + mbCount + peCount > 0) {
          setIsInitializing(false)
          return
        }

        const resp = await fetch('/ayto-complete-noPicture.json', { cache: 'no-store' })
        if (!resp.ok) throw new Error(`Seed-JSON nicht ladbar (${resp.status})`)
        const json = await resp.json() as {
          participants: Participant[]
          matchingNights: (Omit<MatchingNight, 'createdAt'> & { createdAt: string })[]
          matchboxes: (Omit<Matchbox, 'createdAt' | 'updatedAt' | 'soldDate'> & { createdAt: string, updatedAt: string, soldDate?: string })[]
          penalties: (Omit<Penalty, 'createdAt'> & { createdAt: string })[]
        }

        // Konvertiere Datumsfelder zu Date
        const matchingNights: MatchingNight[] = json.matchingNights.map(mn => ({
          ...mn,
          createdAt: new Date(mn.createdAt)
        }))
        const matchboxes: Matchbox[] = json.matchboxes.map(mb => ({
          ...mb,
          createdAt: new Date(mb.createdAt),
          updatedAt: new Date(mb.updatedAt),
          soldDate: mb.soldDate ? new Date(mb.soldDate) : undefined
        }))
        const penalties: Penalty[] = json.penalties.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }))

        // Atomar neu befüllen
        await db.transaction('rw', db.participants, db.matchingNights, db.matchboxes, db.penalties, async () => {
          await Promise.all([
            db.participants.clear(),
            db.matchingNights.clear(),
            db.matchboxes.clear(),
            db.penalties.clear()
          ])
          await Promise.all([
            db.participants.bulkAdd(json.participants),
            db.matchingNights.bulkAdd(matchingNights),
            db.matchboxes.bulkAdd(matchboxes),
            db.penalties.bulkAdd(penalties)
          ])
        })
      } catch (err: any) {
        console.error('Bootstrap-Fehler:', err)
        setInitError(err?.message ?? 'Unbekannter Fehler beim Initialisieren')
      } finally {
        setIsInitializing(false)
      }
    }

    bootstrap()
  }, [])

  // Handler für Versions-Check-Dialog
  const handleVersionDialogClose = () => {
    setVersionCheck(prev => ({ ...prev, shouldShowDialog: false }))
  }

  const handleCacheCleared = () => {
    // Seite neu laden nach Cache-Clear
    window.location.reload()
  }

  if (isInitializing) {
    return (
      <div style={{ padding: 16 }}>
        Initialisiere Daten ...
      </div>
    )
  }

  if (initError) {
    return (
      <div style={{ padding: 16, color: 'red' }}>
        Fehler bei der Initialisierung: {initError}
      </div>
    )
  }

  if (route === 'admin') {
    return (
      <ThemeProvider>
        <div>
          <AdminPanelMUI />
          <LegalFooter />
          <VersionCheckDialog
            isOpen={versionCheck.shouldShowDialog}
            lastVersion={versionCheck.lastVersion}
            currentVersion={versionCheck.currentVersion}
            onClose={handleVersionDialogClose}
            onCacheCleared={handleCacheCleared}
          />
        </div>
      </ThemeProvider>
    )
  }

  // Root rendert OverviewMUI als Standard
  return (
    <div>
      <OverviewMUI />
      <LegalFooter />
      <VersionCheckDialog
        isOpen={versionCheck.shouldShowDialog}
        lastVersion={versionCheck.lastVersion}
        currentVersion={versionCheck.currentVersion}
        onClose={handleVersionDialogClose}
        onCacheCleared={handleCacheCleared}
      />
    </div>
  )
}
