import { useEffect, useState } from 'react'
import OverviewMUI from "@/features/overview/OverviewMUI"
import AdminPanelMUI from "@/features/admin/AdminPanelMUI"
import ThemeProvider from "@/theme/ThemeProvider"
import LegalFooter from "@/components/LegalFooter"

export default function App() {
  const [route, setRoute] = useState<'root' | 'admin'>('root')

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
        return
      }
      // Standard: OverviewMUI unter /
      window.history.replaceState({}, '', '/')
      setRoute('root')
      return
    }

    // Pfadbasiertes Routing
    if (pathname.startsWith('/admin')) {
      setRoute('admin')
      return
    }
    setRoute('root')
  }, [])

  if (route === 'admin') {
    return (
      <ThemeProvider>
        <div>
          <AdminPanelMUI />
          <LegalFooter />
        </div>
      </ThemeProvider>
    )
  }

  // Root rendert OverviewMUI als Standard
  return (
    <div>
      <OverviewMUI />
      <LegalFooter />
    </div>
  )
}
