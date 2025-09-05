import React from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { CacheProvider, type EmotionCache } from '@emotion/react'
import createCache from '@emotion/cache'
import theme from './index'

// ** Emotion Cache Setup
const createEmotionCache = (): EmotionCache => {
  return createCache({ key: 'css', prepend: true })
}

const clientSideEmotionCache = createEmotionCache()

interface ThemeProviderProps {
  children: React.ReactNode
  emotionCache?: EmotionCache
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  emotionCache = clientSideEmotionCache 
}) => {
  return (
    <CacheProvider value={emotionCache}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  )
}

export default ThemeProvider
