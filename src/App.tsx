import { useEffect, useState } from 'react'
import Overview from "@/features/overview/Overview"
import OverviewMUI from "@/features/overview/OverviewMUI"
import AdminPanel from "@/features/admin/AdminPanel"
import AdminPanelMUI from "@/features/admin/AdminPanelMUI"
import AYTO_Mobile_MVP from "@/features/ayto/AYTO_Mobile_MVP"
import ThemeProvider from "@/theme/ThemeProvider"
import LegalFooter from "@/components/LegalFooter"

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOverview, setIsOverview] = useState(false)
  const [useMUIAdmin, setUseMUIAdmin] = useState(false)
  const [useMUIOverview, setUseMUIOverview] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    setIsAdmin(urlParams.get('admin') === '1')
    setIsOverview(urlParams.get('overview') === '1' || (!urlParams.get('admin') && !urlParams.get('ayto')))
    setUseMUIAdmin(urlParams.get('mui') === '1')
    setUseMUIOverview(urlParams.get('mui') === '1')
  }, [])

  if (isAdmin) {
    if (useMUIAdmin) {
      return (
        <ThemeProvider>
          <div>
            <AdminPanelMUI />
            <LegalFooter />
          </div>
        </ThemeProvider>
      )
    }
    return (
      <div>
        <AdminPanel />
        <LegalFooter />
      </div>
    )
  }

  if (isOverview) {
    if (useMUIOverview) {
      return (
        <div>
          <OverviewMUI />
          <LegalFooter />
        </div>
      )
    }
    return (
      <div>
        <Overview />
        <LegalFooter />
      </div>
    )
  }

  return (
    <div>
      <AYTO_Mobile_MVP />
      <LegalFooter />
    </div>
  )
}
