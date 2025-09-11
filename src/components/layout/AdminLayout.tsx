import React, { useEffect, useState } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  Avatar,
  Chip
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Nightlife as NightlifeIcon,
  Settings as SettingsIcon,
  ImportExport as ImportExportIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  Favorite as FavoriteIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material'
import { db } from '@/lib/db'
import { liveQuery } from 'dexie'

const drawerWidth = 260

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  activeTab = 'participants',
  onTabChange 
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  console.log('Mobile:', isMobile) // Keep for responsive debugging
  const [mobileOpen, setMobileOpen] = useState(false)

  // Stats für Menüleiste
  const [stats, setStats] = useState({
    activeParticipants: 0,
    perfectMatches: 0,
    currentLights: 0,
    currentBalance: 0,
    matchingNightsCount: 0,
    matchboxesCount: 0
  })

  const loadStats = async () => {
    try {
      const [participants, matchboxes, matchingNights, penalties] = await Promise.all([
        db.participants.toArray(),
        db.matchboxes.toArray(),
        db.matchingNights.toArray(),
        db.penalties.toArray()
      ])

      const activeParticipants = participants.filter(p => p.active !== false).length
      const matchingNightsCount = matchingNights.length
      const matchboxesCount = matchboxes.length
      const perfectMatches = matchboxes.filter(mb => mb.matchType === 'perfect').length
      const lastMN = matchingNights
        .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())[0]
      const currentLights = lastMN?.totalLights || 0

      const sold = matchboxes.filter(mb => mb.matchType === 'sold' && typeof mb.price === 'number')
      const totalRevenue = sold.reduce((sum, mb) => sum + (mb.price || 0), 0)
      const totalPenalties = penalties.reduce((sum, p) => (p.amount < 0 ? sum + Math.abs(p.amount) : sum), 0)
      const totalCredits = penalties.reduce((sum, p) => (p.amount > 0 ? sum + p.amount : sum), 0)
      const savedBudget = typeof window !== 'undefined' ? localStorage.getItem('ayto-starting-budget') : null
      const startingBudget = savedBudget ? parseInt(savedBudget, 10) : 200000
      const currentBalance = startingBudget - totalRevenue - totalPenalties + totalCredits

      setStats({ activeParticipants, perfectMatches, currentLights, currentBalance, matchingNightsCount, matchboxesCount })
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    loadStats()
    // Live-Updates bei DB-Änderungen
    const subscription = liveQuery(async () => {
      const [participants, matchboxes, matchingNights, penalties] = await Promise.all([
        db.participants.toArray(),
        db.matchboxes.toArray(),
        db.matchingNights.toArray(),
        db.penalties.toArray()
      ])
      return { participants, matchboxes, matchingNights, penalties }
    }).subscribe(({ participants, matchboxes, matchingNights, penalties }) => {
      try {
        const activeParticipants = participants.filter(p => p.active !== false).length
        const matchingNightsCount = matchingNights.length
        const matchboxesCount = matchboxes.length
        const perfectMatches = matchboxes.filter(mb => mb.matchType === 'perfect').length
        const lastMN = matchingNights
          .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())[0]
        const currentLights = lastMN?.totalLights || 0

        const sold = matchboxes.filter(mb => mb.matchType === 'sold' && typeof mb.price === 'number')
        const totalRevenue = sold.reduce((sum, mb) => sum + (mb.price || 0), 0)
        const totalPenalties = penalties.reduce((sum, p) => (p.amount < 0 ? sum + Math.abs(p.amount) : sum), 0)
        const totalCredits = penalties.reduce((sum, p) => (p.amount > 0 ? sum + p.amount : sum), 0)
        const savedBudget = typeof window !== 'undefined' ? localStorage.getItem('ayto-starting-budget') : null
        const startingBudget = savedBudget ? parseInt(savedBudget, 10) : 200000
        const currentBalance = startingBudget - totalRevenue - totalPenalties + totalCredits

        setStats({ activeParticipants, perfectMatches, currentLights, currentBalance, matchingNightsCount, matchboxesCount })
      } catch {
        // ignore
      }
    })

    // Budget-Änderungen via storage-Event
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ayto-starting-budget') {
        loadStats()
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      value: 'dashboard',
      disabled: true
    },
    {
      text: 'Teilnehmer',
      icon: <PeopleIcon />,
      value: 'participants'
    },
    {
      text: 'Matching Nights',
      icon: <NightlifeIcon />,
      value: 'matching-nights'
    },
    {
      text: 'Matchbox',
      icon: <InventoryIcon />,
      value: 'matchbox'
    },
    {
      text: 'Ausstrahlung',
      icon: <ScheduleIcon />,
      value: 'broadcast'
    },
    {
      text: 'Budget & Stafen',
      icon: <SettingsIcon />,
      value: 'settings'
    },
    {
      text: 'Datenhaltung',
      icon: <ImportExportIcon />,
      value: 'json-import'
    },
    // entfernt: doppelter 'Einstellungen'-Eintrag
  ]

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              width: 40,
              height: 40,
              fontSize: '1.25rem',
              fontWeight: 600
            }}
          >
            A
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              AYTO Admin
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reality Show IL 2025
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 2 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            px: 3, 
            color: 'text.secondary',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          Navigation
        </Typography>
        <List sx={{ px: 2, mt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.value} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onTabChange?.(item.value)}
                disabled={item.disabled}
                sx={{
                  borderRadius: 1.5,
                  px: 2,
                  py: 1.5,
                  backgroundColor: activeTab === item.value ? 'primary.main' : 'transparent',
                  color: activeTab === item.value ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: activeTab === item.value 
                      ? 'primary.dark' 
                      : 'action.hover'
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                    color: 'text.disabled'
                  }
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: 'inherit',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: activeTab === item.value ? 600 : 500,
                    color: activeTab === item.value ? 'common.white' : 'text.primary'
                  }}
                />
                {item.disabled && (
                  <Chip 
                    label="Soon" 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.6875rem',
                      bgcolor: 'action.selected',
                      color: 'text.secondary'
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              A
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Admin User
              </Typography>
              <Typography variant="caption" color="text.secondary">
                admin@ayto.com
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0px 2px 4px rgba(165, 163, 174, 0.3)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            AYTO Reality Show IL 2025 - Admin Panel
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip label={`Aktiv: ${stats.activeParticipants}`} size="small" color="primary" sx={{ fontWeight: 600 }} />
            <Chip icon={<NightlifeIcon fontSize="small" />} label={`${stats.matchingNightsCount}`} size="small" color="info" sx={{ fontWeight: 600 }} />
            <Chip icon={<InventoryIcon fontSize="small" />} label={`${stats.matchboxesCount}`} size="small" color="secondary" sx={{ fontWeight: 600 }} />
            <Chip icon={<FavoriteIcon fontSize="small" />} label={`${stats.perfectMatches}`} size="small" color="success" sx={{ fontWeight: 600 }} />
            <Chip icon={<LightModeIcon fontSize="small" />} label={`${stats.currentLights}`} size="small" color="warning" sx={{ fontWeight: 600 }} />
            <Chip label={`${stats.currentBalance.toLocaleString('de-DE')} €`} size="small" color={stats.currentBalance >= 0 ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider'
            }
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }} />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default AdminLayout
