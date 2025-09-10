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
  Card,
  Avatar,
  Chip,
  Button
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Nightlife as NightlifeIcon,
  Inventory as InventoryIcon,
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  LightMode as LightModeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Savings as SavingsIcon,
  Percent as PercentIcon
} from '@mui/icons-material'

const drawerWidth = 260

interface MenuLayoutProps {
  children: React.ReactNode
  activeTab?: string
  onTabChange?: (tab: string) => void
  onCreateMatchbox?: () => void
  onCreateMatchingNight?: () => void
  // Statistics data
  matchingNightsCount?: number
  currentLights?: number
  perfectMatchesCount?: number
  currentBalance?: number
}

const MenuLayout: React.FC<MenuLayoutProps> = ({ 
  children, 
  activeTab = 'overview',
  onTabChange,
  onCreateMatchbox,
  onCreateMatchingNight,
  matchingNightsCount = 0,
  currentLights = 0,
  perfectMatchesCount = 0,
  currentBalance = 0
}) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const menuItems = [
    {
      text: 'Übersicht',
      icon: <HomeIcon />,
      value: 'overview'
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
      text: 'Wahrscheinlichkeit',
      icon: <PercentIcon />,
      value: 'probabilities'
    },
    {
      text: 'Admin Panel',
      icon: <AdminIcon />,
      value: 'admin',
      action: () => window.location.href = '/admin'
    }
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
              AYTO
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reality Stars in Love 2025
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button 
          variant="contained" 
          color="secondary" 
          fullWidth 
          startIcon={<AddIcon />} 
          sx={{ mb: 1.5 }} 
          onClick={onCreateMatchingNight}
        >
          Neue Matching Night
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          startIcon={<AddIcon />} 
          onClick={onCreateMatchbox}
        >
          Matchbox erstellen
        </Button>
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
                onClick={() => {
                  if (item.action) {
                    item.action()
                  } else {
                    onTabChange?.(item.value)
                  }
                }}
                sx={{
                  borderRadius: 1.5,
                  px: 2,
                  py: 1.5,
                  backgroundColor: activeTab === item.value ? 'primary.main' : 'transparent',
                  color: activeTab === item.value ? 'white !important' : 'text.primary',
                  '&:hover': {
                    backgroundColor: activeTab === item.value 
                      ? 'primary.dark' 
                      : 'action.hover'
                  },
                  '& .MuiListItemIcon-root': {
                    color: activeTab === item.value ? 'white !important' : 'inherit'
                  },
                  '& .MuiListItemText-primary': {
                    color: activeTab === item.value ? 'white !important' : 'inherit'
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
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Statistics */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography 
          variant="overline" 
          sx={{ 
            color: 'text.secondary',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            mb: 1,
            display: 'block'
          }}
        >
          Statistiken
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Matching Nights */}
          <Card sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}>
                <NightlifeIcon sx={{ fontSize: '0.875rem' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Matching Nights
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {matchingNightsCount}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Current Lights */}
          <Card sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 28, height: 28 }}>
                <LightModeIcon sx={{ fontSize: '0.875rem' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Lichter aktuell
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {currentLights}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Perfect Matches */}
          <Card sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 28, height: 28 }}>
                <AutoAwesomeIcon sx={{ fontSize: '0.875rem' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Perfect Matches
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {perfectMatchesCount}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Current Balance */}
          <Card sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: currentBalance >= 0 ? 'success.main' : 'error.main', width: 28, height: 28 }}>
                <SavingsIcon sx={{ fontSize: '0.875rem' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Kontostand
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: currentBalance >= 0 ? 'success.main' : 'error.main' }}>
                  €{currentBalance.toLocaleString('de-DE')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
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
            AYTO - Reality Stars in Love 2025
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

export default MenuLayout
