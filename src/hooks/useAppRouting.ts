/**
 * Custom Hook für App-Routing
 * 
 * Kapselt die Routing-Logik und Legacy-Parameter-Behandlung.
 * Folgt dem Single Responsibility Principle.
 */

import { useEffect, useState } from 'react'
import type { AppRoute } from '@/types'

interface UseAppRoutingResult {
  route: AppRoute['type']
}

/**
 * Hook für App-Routing
 * 
 * Verantwortlichkeiten:
 * - Legacy-Query-Parameter-Behandlung
 * - Pfadbasiertes Routing
 * - URL-History-Management
 */
export function useAppRouting(): UseAppRoutingResult {
  const [route, setRoute] = useState<AppRoute['type']>('root')

  useEffect(() => {
    const handleRouting = () => {
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
    }

    handleRouting()
  }, [])

  return { route }
}

