import { getDisplayVersion } from './version'

const VERSION_STORAGE_KEY = 'ayto-last-version'
const VERSION_CHECK_DISABLED_KEY = 'ayto-version-check-disabled'

export interface VersionCheckResult {
  isNewVersion: boolean
  lastVersion: string | null
  currentVersion: string
  shouldShowDialog: boolean
}

/**
 * Überprüft, ob sich die Version seit dem letzten Besuch geändert hat
 */
export function checkVersionChange(): VersionCheckResult {
  const currentVersion = getDisplayVersion()
  const lastVersion = localStorage.getItem(VERSION_STORAGE_KEY)
  const isDisabled = localStorage.getItem(VERSION_CHECK_DISABLED_KEY) === 'true'
  
  const isNewVersion = lastVersion !== null && lastVersion !== currentVersion
  const shouldShowDialog = isNewVersion && !isDisabled
  
  return {
    isNewVersion,
    lastVersion,
    currentVersion,
    shouldShowDialog
  }
}

/**
 * Speichert die aktuelle Version als letzte bekannte Version
 */
export function saveCurrentVersion(): void {
  const currentVersion = getDisplayVersion()
  localStorage.setItem(VERSION_STORAGE_KEY, currentVersion)
}

/**
 * Deaktiviert die Versions-Check-Warnung dauerhaft
 */
export function disableVersionCheck(): void {
  localStorage.setItem(VERSION_CHECK_DISABLED_KEY, 'true')
}

/**
 * Aktiviert die Versions-Check-Warnung wieder
 */
export function enableVersionCheck(): void {
  localStorage.removeItem(VERSION_CHECK_DISABLED_KEY)
}

/**
 * Löscht den Browsercache und alle gespeicherten Daten (außer Datenbank)
 */
export async function clearBrowserCache(): Promise<void> {
  try {
    // Service Worker Cache löschen
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
    
    // Local Storage löschen (außer Datenbank und Versions-Info)
    const keysToKeep = [
      'dexie-database-version', 
      'dexie-database-schema',
      VERSION_STORAGE_KEY,
      VERSION_CHECK_DISABLED_KEY
    ]
    const allKeys = Object.keys(localStorage)
    allKeys.forEach(key => {
      if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key)
      }
    })
    
    // Session Storage löschen
    sessionStorage.clear()
    
    // Cookies löschen
    if (document.cookie) {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      })
    }
    
    // Service Worker neu registrieren
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    }
    
    console.log('✅ Browser-Cache erfolgreich gelöscht')
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Browser-Caches:', error)
    throw error
  }
}

/**
 * Initialisiert die Versionsverwaltung beim App-Start
 */
export function initializeVersionCheck(): VersionCheckResult {
  const result = checkVersionChange()
  
  // Speichere die aktuelle Version, wenn es der erste Besuch ist
  if (result.lastVersion === null) {
    saveCurrentVersion()
  }
  
  return result
}
