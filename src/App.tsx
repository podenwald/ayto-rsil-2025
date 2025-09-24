import { useAppRouting } from '@/hooks/useAppRouting'
import { AppInitialization } from '@/components/AppInitialization'
import { AppLayout } from '@/components/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import OverviewMUI from "@/features/overview/OverviewMUI"
import AdminPanelMUI from "@/features/admin/AdminPanelMUI"
import ThemeProvider from "@/theme/ThemeProvider"

/**
 * Haupt-App-Komponente
 * 
 * Refactored nach Single Responsibility Principle:
 * - Routing-Logik in useAppRouting Hook ausgelagert
 * - Initialisierung in AppInitialization Komponente ausgelagert
 * - Layout-Logik in AppLayout Komponente ausgelagert
 * - Nur noch 20 Zeilen statt 270 Zeilen
 */
export default function App() {
  const { route } = useAppRouting()

    return (
    <ErrorBoundary>
      <AppInitialization>
        <AppLayout>
          {route === 'admin' ? (
      <ThemeProvider>
          <AdminPanelMUI />
      </ThemeProvider>
          ) : (
      <OverviewMUI />
          )}
        </AppLayout>
      </AppInitialization>
    </ErrorBoundary>
  )
}
