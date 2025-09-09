import React from 'react'

/**
 * Device Detection Utilities
 * Erweiterte Geräteerkennung für Smartphones vs Tablets
 */

export interface DeviceInfo {
  isSmartphone: boolean
  isTablet: boolean
  isDesktop: boolean
  isMobile: boolean // Smartphone only
  orientation: 'portrait' | 'landscape'
  screenWidth: number
  screenHeight: number
}

/**
 * Erkennt den Gerätetyp basierend auf User Agent und Bildschirmgröße
 */
export const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase()
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait'
  
  // Smartphone Detection
  const isSmartphone = 
    // Kleine Bildschirme (typisch für Smartphones)
    (screenWidth <= 480 && screenHeight <= 900) ||
    // User Agent Patterns für Smartphones
    /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  // Tablet Detection
  const isTablet = 
    // Mittlere Bildschirme (typisch für Tablets)
    (screenWidth > 480 && screenWidth <= 1024 && screenHeight > 600) ||
    // User Agent Patterns für Tablets
    /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
  
  // Desktop Detection
  const isDesktop = screenWidth > 1024 && !isTablet && !isSmartphone
  
  return {
    isSmartphone,
    isTablet,
    isDesktop,
    isMobile: isSmartphone, // Nur Smartphones gelten als "mobile"
    orientation,
    screenWidth,
    screenHeight
  }
}

/**
 * Hook für React Components zur Geräteerkennung
 */
export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => detectDevice())
  
  React.useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDevice())
    }
    
    // Listener für Orientierungsänderungen
    window.addEventListener('orientationchange', updateDeviceInfo)
    window.addEventListener('resize', updateDeviceInfo)
    
    return () => {
      window.removeEventListener('orientationchange', updateDeviceInfo)
      window.removeEventListener('resize', updateDeviceInfo)
    }
  }, [])
  
  return deviceInfo
}

/**
 * Deaktiviert die Rotation auf Tablets (nur Querformat erlaubt)
 */
export const lockTabletOrientation = (): void => {
  const deviceInfo = detectDevice()
  
  if (deviceInfo.isTablet && deviceInfo.orientation === 'portrait') {
    // Zeige Warnung für Portrait-Modus auf Tablets
    const warningElement = document.createElement('div')
    warningElement.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <h2>📱 Tablet-Rotation erforderlich</h2>
        <p>Bitte drehen Sie Ihr Tablet ins Querformat für die beste Erfahrung.</p>
        <p>Die App ist für Tablets nur im Querformat optimiert.</p>
      </div>
    `
    document.body.appendChild(warningElement)
    
    // Entferne Warnung wenn Orientierung geändert wird
    const removeWarning = () => {
      if (detectDevice().orientation === 'landscape') {
        document.body.removeChild(warningElement)
        window.removeEventListener('orientationchange', removeWarning)
      }
    }
    window.addEventListener('orientationchange', removeWarning)
  }
}

/**
 * Deaktiviert die Rotation auf Smartphones (nur Hochformat erlaubt)
 */
export const lockSmartphoneOrientation = (): void => {
  const deviceInfo = detectDevice()
  
  if (deviceInfo.isSmartphone && deviceInfo.orientation === 'landscape') {
    // Zeige Warnung für Querformat-Modus auf Smartphones
    const warningElement = document.createElement('div')
    warningElement.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <h2>📱 Smartphone-Rotation erforderlich</h2>
        <p>Bitte drehen Sie Ihr Smartphone ins Hochformat für die beste Erfahrung.</p>
        <p>Die App ist für Smartphones nur im Hochformat optimiert.</p>
      </div>
    `
    document.body.appendChild(warningElement)
    
    // Entferne Warnung wenn Orientierung geändert wird
    const removeWarning = () => {
      if (detectDevice().orientation === 'portrait') {
        document.body.removeChild(warningElement)
        window.removeEventListener('orientationchange', removeWarning)
      }
    }
    window.addEventListener('orientationchange', removeWarning)
  }
}

/**
 * CSS Media Query Helper für erweiterte Geräteerkennung
 */
export const getDeviceMediaQuery = (deviceInfo: DeviceInfo): string => {
  if (deviceInfo.isSmartphone) {
    return '(max-width: 600px)'
  } else if (deviceInfo.isTablet) {
    return '(min-width: 601px) and (max-width: 1024px)'
  } else {
    return '(min-width: 1025px)'
  }
}
