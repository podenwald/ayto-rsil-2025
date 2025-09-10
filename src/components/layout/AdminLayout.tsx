import React, { useState } from 'react'
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
  Schedule as ScheduleIcon
} from '@mui/icons-material'

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
      text: 'Einstellungen',
      icon: <SettingsIcon />,
      value: 'settings'
    },
    {
      text: 'Import/Export',
      icon: <ImportExportIcon />,
      value: 'import-export',
      disabled: true
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
                    fontWeight: activeTab === item.value ? 600 : 500
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
          <Chip 
            label="Beta" 
            size="small" 
            color="primary" 
            sx={{ fontWeight: 600 }}
          />
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
