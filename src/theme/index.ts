import { createTheme, type ThemeOptions } from '@mui/material/styles'

// ** Materio Theme Colors
const themeColors = {
  primary: '#9155FD',
  secondary: '#8A8D93', 
  success: '#56CA00',
  error: '#FF4C51',
  warning: '#FFB400',
  info: '#16B1FF',
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
}

// ** Typography
const typography = {
  fontFamily: '"Inter", sans-serif',
  h1: {
    fontWeight: 500,
    fontSize: '2.375rem',
    lineHeight: 1.375,
    color: '#3A3541'
  },
  h2: {
    fontWeight: 500,
    fontSize: '2rem',
    lineHeight: 1.375,
    color: '#3A3541'
  },
  h3: {
    fontWeight: 500,
    fontSize: '1.75rem',
    lineHeight: 1.375,
    color: '#3A3541'
  },
  h4: {
    fontWeight: 500,
    fontSize: '1.5rem',
    lineHeight: 1.375,
    color: '#3A3541'
  },
  h5: {
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: 1.375,
    color: '#3A3541'
  },
  h6: {
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: 1.375,
    color: '#3A3541'
  },
  body1: {
    fontSize: '0.9375rem',
    lineHeight: 1.467,
    color: '#6F6B7D'
  },
  body2: {
    fontSize: '0.8125rem',
    lineHeight: 1.538,
    color: '#6F6B7D'
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    color: '#6F6B7D'
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.57,
    color: '#6F6B7D'
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.25,
    color: '#A8AAAE'
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.5px',
    lineHeight: 1.25,
    textTransform: 'uppercase' as const,
    color: '#A8AAAE'
  }
}

// ** Shadows
const shadows = [
  'none',
  '0px 2px 4px rgba(165, 163, 174, 0.3)',
  '0px 4px 8px rgba(165, 163, 174, 0.3)',
  '0px 6px 12px rgba(165, 163, 174, 0.3)',
  '0px 8px 16px rgba(165, 163, 174, 0.3)',
  '0px 10px 20px rgba(165, 163, 174, 0.3)',
  '0px 12px 24px rgba(165, 163, 174, 0.3)',
  '0px 14px 28px rgba(165, 163, 174, 0.3)',
  '0px 16px 32px rgba(165, 163, 174, 0.3)',
  '0px 18px 36px rgba(165, 163, 174, 0.3)',
  '0px 20px 40px rgba(165, 163, 174, 0.3)',
  '0px 22px 44px rgba(165, 163, 174, 0.3)',
  '0px 24px 48px rgba(165, 163, 174, 0.3)',
  '0px 26px 52px rgba(165, 163, 174, 0.3)',
  '0px 28px 56px rgba(165, 163, 174, 0.3)',
  '0px 30px 60px rgba(165, 163, 174, 0.3)',
  '0px 32px 64px rgba(165, 163, 174, 0.3)',
  '0px 34px 68px rgba(165, 163, 174, 0.3)',
  '0px 36px 72px rgba(165, 163, 174, 0.3)',
  '0px 38px 76px rgba(165, 163, 174, 0.3)',
  '0px 40px 80px rgba(165, 163, 174, 0.3)',
  '0px 42px 84px rgba(165, 163, 174, 0.3)',
  '0px 44px 88px rgba(165, 163, 174, 0.3)',
  '0px 46px 92px rgba(165, 163, 174, 0.3)',
  '0px 48px 96px rgba(165, 163, 174, 0.3)'
]

// ** Theme Options
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: themeColors.primary,
      light: '#A979FF',
      dark: '#804BDF',
      contrastText: '#FFF'
    },
    secondary: {
      main: themeColors.secondary,
      light: '#9C9FA4',
      dark: '#777B82',
      contrastText: '#FFF'
    },
    success: {
      main: themeColors.success,
      light: '#7BC03A',
      dark: '#4DA90E',
      contrastText: '#FFF'
    },
    error: {
      main: themeColors.error,
      light: '#FF6F70',
      dark: '#E73D3E',
      contrastText: '#FFF'
    },
    warning: {
      main: themeColors.warning,
      light: '#FFC633',
      dark: '#E69E00',
      contrastText: '#FFF'
    },
    info: {
      main: themeColors.info,
      light: '#4FC3F7',
      dark: '#0288D1',
      contrastText: '#FFF'
    },
    grey: themeColors.grey,
    text: {
      primary: '#3A3541',
      secondary: '#6F6B7D',
      disabled: '#A8AAAE'
    },
    background: {
      default: '#F8F7FA',
      paper: '#FFFFFF'
    },
    divider: '#DBDADE'
  },
  typography: typography as any,
  shadows: shadows as any,
  shape: {
    borderRadius: 6
  },
  spacing: 4,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 2px 4px rgba(165, 163, 174, 0.3)',
          border: '1px solid #DBDADE'
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '1.5rem',
          borderBottom: '1px solid #DBDADE',
          '& .MuiCardHeader-title': {
            fontSize: '1.125rem',
            fontWeight: 500,
            color: '#3A3541'
          }
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '1.5rem',
          '&:last-child': {
            paddingBottom: '1.5rem'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem'
        },
        containedPrimary: {
          backgroundColor: themeColors.primary,
          '&:hover': {
            backgroundColor: '#804BDF'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '& fieldset': {
              borderColor: '#DBDADE'
            },
            '&:hover fieldset': {
              borderColor: themeColors.primary
            },
            '&.Mui-focused fieldset': {
              borderColor: themeColors.primary
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.75rem'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#FFFFFF'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #DBDADE',
          fontSize: '0.875rem',
          color: '#6F6B7D'
        },
        head: {
          fontWeight: 600,
          color: '#3A3541',
          backgroundColor: '#F8F7FA'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          color: '#6F6B7D',
          '&.Mui-selected': {
            color: themeColors.primary
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: themeColors.primary
        }
      }
    }
  }
}

// ** Create and export theme
export const theme = createTheme(themeOptions)
export default theme
