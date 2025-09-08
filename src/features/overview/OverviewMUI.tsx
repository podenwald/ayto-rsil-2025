import React, { useEffect, useState } from 'react'
// Avatar utilities removed - using simple fallback logic
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  useMediaQuery
} from '@mui/material'
import {
  People as PeopleIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Analytics as AnalyticsIcon,
  AdminPanelSettings as AdminIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Menu as MenuIcon
} from '@mui/icons-material'
import ThemeProvider from '@/theme/ThemeProvider'
import { db, type Participant, type MatchingNight, type Matchbox, type Penalty } from '@/lib/db'

// ** Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

// ** Couple Avatar Component for Matching Nights and Matchboxes
const CoupleAvatars: React.FC<{ 
  womanName: string
  manName: string
  womanPhoto?: string
  manPhoto?: string
  additionalInfo?: string
  matchType?: 'perfect' | 'no-match' | 'sold'
  participants?: Participant[]
}> = ({ womanName, manName, womanPhoto, manPhoto, additionalInfo, matchType, participants = [] }) => {
  // Find participant photos dynamically
  const womanParticipant = participants.find(p => p.name === womanName)
  const manParticipant = participants.find(p => p.name === manName)
  
  // Simple fallback logic
  const finalWomanPhoto = womanPhoto || (womanParticipant?.photoUrl && womanParticipant.photoUrl.trim() !== '' ? womanParticipant.photoUrl : null)
  const finalManPhoto = manPhoto || (manParticipant?.photoUrl && manParticipant.photoUrl.trim() !== '' ? manParticipant.photoUrl : null)
  // Tooltip content
  const tooltipLines = [
    `${womanName} & ${manName}`,
    additionalInfo || null
  ].filter(Boolean)
  
  const tooltipContent = tooltipLines.join('\n')

  // Get color based on match type
  const getBorderColor = () => {
    switch (matchType) {
      case 'perfect': return 'success.main'
      case 'no-match': return 'error.main'
      case 'sold': return 'info.main'
      default: return 'grey.400' // Default gray for unconfirmed matches
    }
  }

  return (
    <Tooltip 
      title={tooltipContent} 
      placement="top"
      enterDelay={300}
      leaveDelay={200}
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            whiteSpace: 'pre-line',
            textAlign: 'center',
            fontSize: '0.875rem'
          }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        cursor: 'pointer',
        '&:hover': {
          '& .avatar': {
            transform: 'scale(1.1)'
          }
        }
      }}>
        {/* Couple Avatars */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1,
          position: 'relative'
        }}>
          {/* Woman Avatar */}
          <Avatar 
            className="avatar"
            src={finalWomanPhoto || undefined}
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: finalWomanPhoto ? undefined : 'secondary.main',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              border: `2px solid`,
              borderColor: getBorderColor(),
              boxShadow: 2,
              transition: 'all 0.3s ease',
              zIndex: 2
            }}
          >
            {!finalWomanPhoto && womanName?.charAt(0)}
          </Avatar>
          
          {/* Heart/Connection Icon */}
          <Box sx={{ 
            mx: -1, 
            zIndex: 3,
            bgcolor: 'background.paper',
            borderRadius: '50%',
            p: 0.5,
            boxShadow: 1
          }}>
            {matchType === 'perfect' ? '💕' : matchType === 'no-match' ? '💔' : matchType === 'sold' ? '💼' : '🤍'}
          </Box>
          
          {/* Man Avatar */}
          <Avatar 
            className="avatar"
            src={finalManPhoto || undefined}
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: finalManPhoto ? undefined : 'primary.main',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              border: `2px solid`,
              borderColor: getBorderColor(),
              boxShadow: 2,
              transition: 'all 0.3s ease',
              zIndex: 2
            }}
          >
            {!finalManPhoto && manName?.charAt(0)}
          </Avatar>
        </Box>
        
        {/* Names */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '0.75rem', 
            textAlign: 'center',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {womanName} & {manName}
        </Typography>
      </Box>
    </Tooltip>
  )
}

// ** Participant Card Component
const ParticipantCard: React.FC<{ 
  participant: Participant 
  draggable?: boolean
  onDragStart?: (participant: Participant) => void
  isPlaced?: boolean
}> = ({ participant, draggable = false, onDragStart, isPlaced = false }) => {
  // Simple fallback logic
  const hasPhoto = participant.photoUrl && participant.photoUrl.trim() !== ''
  const initials = participant.name?.charAt(0)?.toUpperCase() || '?'
  const genderColor = participant.gender === 'F' ? 'secondary.main' : 'primary.main'

  const isActive = participant.active !== false

  // Tooltip content as simple text
  const tooltipLines = [
    participant.name,
    participant.age ? `${participant.age} Jahre` : null,
    participant.knownFrom || null
  ].filter(Boolean)
  
  const tooltipContent = tooltipLines.join('\n')

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(participant)
      e.dataTransfer.setData('participant', JSON.stringify(participant))
      e.dataTransfer.effectAllowed = 'copy'
    }
  }

  return (
    <Tooltip 
      title={tooltipContent} 
      placement="top"
      enterDelay={300}
      leaveDelay={200}
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            whiteSpace: 'pre-line',
            textAlign: 'center',
            fontSize: '0.875rem'
          }
        }
      }}
    >
      <Box 
        draggable={draggable && !isPlaced}
        onDragStart={handleDragStart}
      sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          cursor: draggable && !isPlaced ? 'grab' : 'pointer',
          opacity: isPlaced ? 0.4 : 1,
          filter: isPlaced ? 'grayscale(100%)' : 'none',
          transition: 'all 0.3s ease',
        '&:hover': {
            '& .avatar': {
              transform: isPlaced ? 'scale(1)' : 'scale(1.1)',
              boxShadow: isPlaced ? 2 : 4
            }
          },
          '&:active': {
            cursor: draggable && !isPlaced ? 'grabbing' : 'pointer'
          }
        }}
      >
        <Box sx={{ position: 'relative', mb: 1 }}>
          <Avatar 
            className="avatar"
            src={hasPhoto ? participant.photoUrl : undefined}
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: hasPhoto ? undefined : genderColor,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              border: '2px solid white',
              boxShadow: 2,
              transition: 'all 0.3s ease'
            }}
          >
            {!hasPhoto && initials}
          </Avatar>
          
          {/* Status Indicator Dot */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 18,
              height: 18,
              borderRadius: '50%',
              bgcolor: isActive ? 'success.main' : 'error.main',
              border: '3px solid white',
              boxShadow: 2,
              zIndex: 1
            }}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '0.875rem', 
            textAlign: 'center',
            maxWidth: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {participant.name || 'Unbekannt'}
        </Typography>
        </Box>
    </Tooltip>
  )
}

// ** Matching Night Pair Container Component
const MatchingNightPairContainer: React.FC<{
  pairIndex: number
  pair: { woman: string, man: string }
  participants: Participant[]
  isDragOver: boolean
  dragOverSlot: 'woman' | 'man' | null
  onDragOver: (e: React.DragEvent, pairIndex: number, slot: 'woman' | 'man') => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, pairIndex: number, slot: 'woman' | 'man') => void
  onRemove: (pairIndex: number, slot: 'woman' | 'man') => void
  isPerfectMatch?: boolean
}> = ({ pairIndex, pair, participants, isDragOver, dragOverSlot, onDragOver, onDragLeave, onDrop, onRemove, isPerfectMatch = false }) => {
  // Ensure pair exists, otherwise create empty pair
  const safePair = pair || { woman: '', man: '' }
  const womanParticipant = participants.find(p => p.name === safePair.woman)
  const manParticipant = participants.find(p => p.name === safePair.man)
  
  // Check if pair is complete
  const isComplete = safePair.woman && safePair.man
  
  // Check for gender conflict
  const hasGenderConflict = () => {
    if (!safePair.woman || !safePair.man) return false
    const womanParticipant = participants.find(p => p.name === safePair.woman)
    const manParticipant = participants.find(p => p.name === safePair.man)
    return womanParticipant && manParticipant && womanParticipant.gender === manParticipant.gender
  }
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        minHeight: 65,
        border: isDragOver ? '2px dashed' : isPerfectMatch ? '2px solid' : hasGenderConflict() ? '2px solid' : isComplete ? '2px solid' : '1px solid',
        borderColor: isDragOver ? 'primary.main' : isPerfectMatch ? 'warning.main' : hasGenderConflict() ? 'error.main' : isComplete ? 'success.main' : 'grey.300',
        bgcolor: isDragOver ? 'primary.50' : isPerfectMatch ? 'warning.50' : hasGenderConflict() ? 'error.50' : isComplete ? 'success.50' : 'background.paper',
        transition: 'all 0.3s ease',
        position: 'relative',
        boxShadow: isComplete ? 1 : 0,
        cursor: isPerfectMatch ? 'default' : 'pointer'
      }}
    >
      <CardContent sx={{ p: 1, height: '100%' }}>
        {isPerfectMatch && (
          <Typography sx={{ 
            position: 'absolute', 
            bottom: 4, 
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '16px',
            color: 'warning.main'
          }}>
            🔒
          </Typography>
        )}
        {hasGenderConflict() && (
          <Typography sx={{ 
            position: 'absolute', 
            bottom: 4, 
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '16px',
            color: 'error.main'
          }}>
            ⚠️
          </Typography>
        )}
        {isComplete && !isPerfectMatch && !hasGenderConflict() && (
          <Typography sx={{ 
            position: 'absolute', 
            bottom: 4, 
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '16px',
            color: 'success.main'
          }}>
            ✅
          </Typography>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          height: '100%',
          pt: 1
        }}>
          {/* Left Slot */}
          <Box
            onDrop={isPerfectMatch ? undefined : (e) => onDrop(e, pairIndex, 'woman')}
            onDragOver={isPerfectMatch ? undefined : (e) => onDragOver(e, pairIndex, 'woman')}
            onDragLeave={isPerfectMatch ? undefined : onDragLeave}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 0.5,
              border: dragOverSlot === 'woman' ? '2px dashed' : '2px solid transparent',
              borderColor: dragOverSlot === 'woman' ? 'primary.main' : 'transparent',
              borderRadius: 2,
              bgcolor: dragOverSlot === 'woman' ? 'primary.50' : 'transparent',
              transition: 'all 0.3s ease',
              minHeight: 60,
              justifyContent: 'center'
            }}
          >
            {safePair.woman ? (
              <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  src={womanParticipant?.photoUrl}
                  sx={{ 
                    width: 40, 
                    height: 40,
                    bgcolor: womanParticipant?.photoUrl ? undefined : (womanParticipant?.gender === 'F' ? 'secondary.main' : 'primary.main'),
                    border: '1px solid',
                    borderColor: womanParticipant?.gender === 'F' ? 'secondary.main' : 'primary.main',
                    mb: 0.5
                  }}
                >
                  {!womanParticipant?.photoUrl && (womanParticipant?.name?.charAt(0) || '?')}
                </Avatar>
                <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                  {safePair.woman}
                </Typography>
                {!isPerfectMatch && (
                  <IconButton
                    size="small"
                    onClick={() => onRemove(pairIndex, 'woman')}
                    sx={{
                      position: 'absolute',
                    top: -6,
                    right: -6,
                    bgcolor: 'error.main',
                    color: 'white',
                    width: 16,
                    height: 16,
                    '&:hover': { bgcolor: 'error.dark' }
                  }}
                >
                  <Typography sx={{ fontSize: '10px', color: 'white' }}>×</Typography>
                </IconButton>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                <Avatar sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'grey.300',
                  border: '1px dashed',
                  borderColor: 'grey.400',
                  mb: 0.5
                }}>
                  <PeopleIcon sx={{ fontSize: '20px' }} />
                </Avatar>
                <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '10px' }}>
                  Teilnehmer hier hinziehen
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Pair Title - positioned between participants */}
          <Box sx={{ mx: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              fontSize: '12px',
              mb: 0.5
            }}>
              Paar {pairIndex + 1}
            </Typography>
            <Typography sx={{ fontSize: '20px' }}>💕</Typography>
          </Box>
          
          {/* Right Slot */}
          <Box
            onDrop={isPerfectMatch ? undefined : (e) => onDrop(e, pairIndex, 'man')}
            onDragOver={isPerfectMatch ? undefined : (e) => onDragOver(e, pairIndex, 'man')}
            onDragLeave={isPerfectMatch ? undefined : onDragLeave}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 0.5,
              border: dragOverSlot === 'man' ? '2px dashed' : '2px solid transparent',
              borderColor: dragOverSlot === 'man' ? 'primary.main' : 'transparent',
              borderRadius: 2,
              bgcolor: dragOverSlot === 'man' ? 'primary.50' : 'transparent',
              transition: 'all 0.3s ease',
              minHeight: 60,
              justifyContent: 'center'
            }}
          >
            {safePair.man ? (
              <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  src={manParticipant?.photoUrl}
                  sx={{ 
                    width: 40, 
                    height: 40,
                    bgcolor: manParticipant?.photoUrl ? undefined : (manParticipant?.gender === 'F' ? 'secondary.main' : 'primary.main'),
                    border: '1px solid',
                    borderColor: manParticipant?.gender === 'F' ? 'secondary.main' : 'primary.main',
                    mb: 0.5
                  }}
                >
                  {!manParticipant?.photoUrl && (manParticipant?.name?.charAt(0) || '?')}
                </Avatar>
                <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                  {safePair.man}
                </Typography>
                {!isPerfectMatch && (
                  <IconButton
                    size="small"
                    onClick={() => onRemove(pairIndex, 'man')}
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      bgcolor: 'error.main',
                      color: 'white',
                      width: 16,
                      height: 16,
                      '&:hover': { bgcolor: 'error.dark' }
                    }}
                  >
                    <Typography sx={{ fontSize: '10px', color: 'white' }}>×</Typography>
                  </IconButton>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                <Avatar sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'grey.300',
                  border: '1px dashed',
                  borderColor: 'grey.400',
                  mb: 0.5
                }}>
                  <PeopleIcon sx={{ fontSize: '20px' }} />
                </Avatar>
                <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '10px' }}>
                  Teilnehmer hier hinziehen
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ** Matching Night Card Component
const MatchingNightCard: React.FC<{ 
  matchingNight: MatchingNight
  expanded: boolean
  onToggle: () => void
  participants: Participant[]
  matchboxes: Matchbox[]
}> = ({ matchingNight, expanded, onToggle, participants, matchboxes }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <FavoriteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{matchingNight.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {matchingNight.ausstrahlungsdatum ? 
                    `Ausstrahlung: ${new Date(matchingNight.ausstrahlungsdatum).toLocaleDateString('de-DE')}` :
                    `Ausstrahlung: ${new Date(matchingNight.date).toLocaleDateString('de-DE')}`
                  }
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {matchingNight.totalLights !== undefined && (
                <Chip 
                  label={`${matchingNight.totalLights} Lichter`}
                  color="warning"
                  icon={<TrendingUpIcon />}
                />
              )}
              <IconButton onClick={onToggle}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>
        }
      />
      <Collapse in={expanded}>
        <CardContent>
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'flex-start'
          }}>
            {matchingNight.pairs.map((pair, index) => {
              // Check if this pair has been confirmed as a perfect match in matchboxes
              // BUT only if the matchbox was aired BEFORE this matching night
              const isConfirmedPerfectMatch = matchboxes.some(mb => {
                if (mb.woman !== pair.woman || mb.man !== pair.man || mb.matchType !== 'perfect') {
                  return false
                }
                
                // Get airing dates for comparison
                const matchboxAiringDate = mb.ausstrahlungsdatum ? new Date(mb.ausstrahlungsdatum) : new Date(mb.createdAt)
                const matchingNightAiringDate = matchingNight.ausstrahlungsdatum ? new Date(matchingNight.ausstrahlungsdatum) : new Date(matchingNight.createdAt)
                
                // Matchbox must be aired BEFORE the matching night
                return matchboxAiringDate.getTime() < matchingNightAiringDate.getTime()
              })
              
              return (
                <CoupleAvatars
                key={index}
                  womanName={pair.woman}
                  manName={pair.man}
                  additionalInfo={`Matching Night: ${matchingNight.name}${isConfirmedPerfectMatch ? ' • ✅ Bestätigt' : ' • ⏳ Unbestätigt'}`}
                  matchType={isConfirmedPerfectMatch ? 'perfect' : undefined}
                  participants={participants}
                />
              )
            })}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}


// ** Statistics Sidebar Component
const StatisticsSidebar: React.FC<{
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
  onCreateMatchbox: () => void
  onCreateMatchingNight: () => void
  isOpenMobile?: boolean
  onToggleMobile?: () => void
}> = ({ matchboxes, matchingNights, penalties, onCreateMatchbox, onCreateMatchingNight, isOpenMobile, onToggleMobile }) => {
  const isMobile = useMediaQuery('(max-width:600px)')
  const [internalOpen, setInternalOpen] = React.useState(false)
  const mobileOpen = typeof isOpenMobile === 'boolean' ? isOpenMobile : internalOpen
  const toggleMobile = onToggleMobile ? onToggleMobile : () => setInternalOpen(v => !v)
  const perfectMatches = matchboxes.filter(mb => mb.matchType === 'perfect')
  
  // Calculate penalties and credits like in AdminPanelMUI
  const totalPenalties = penalties
    .filter(penalty => penalty.amount < 0)
    .reduce((sum, penalty) => sum + Math.abs(penalty.amount), 0)
  const totalCredits = penalties
    .filter(penalty => penalty.amount > 0)
    .reduce((sum, penalty) => sum + penalty.amount, 0)
  
  // Get starting budget (same logic as AdminPanelMUI)
  const getStartingBudget = () => {
    const savedBudget = localStorage.getItem('ayto-starting-budget')
    return savedBudget ? parseInt(savedBudget, 10) : 200000
  }
  const startingBudget = getStartingBudget()
  const soldMatchboxes = matchboxes.filter(mb => mb.matchType === 'sold')
  const totalRevenue = soldMatchboxes.reduce((sum, mb) => sum + (mb.price || 0), 0)
  const currentBalance = startingBudget - totalRevenue - totalPenalties + totalCredits

  // Get latest matching night lights (sort by ausstrahlungsdatum, fallback to createdAt)
  const latestMatchingNight = matchingNights
    .sort((a, b) => {
      const dateA = a.ausstrahlungsdatum ? new Date(a.ausstrahlungsdatum).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.ausstrahlungsdatum ? new Date(b.ausstrahlungsdatum).getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    })[0]
  const currentLights = latestMatchingNight?.totalLights || 0

  if (isMobile) {
    return (
      <Box sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        zIndex: 1000,
      }}>
        <Box onClick={toggleMobile} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Statistiken</Typography>
          {mobileOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </Box>
        {mobileOpen && (
          <Box sx={{ maxHeight: '33vh', overflowY: 'auto', p: 2 }}>
            <Button variant="contained" color="secondary" fullWidth startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={onCreateMatchingNight}>
              Neue Matching Night
            </Button>
            <Button variant="contained" color="primary" fullWidth startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={onCreateMatchbox}>
              Matchbox erstellen
            </Button>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Matching Nights Count */}
              <Card>
                <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <FavoriteIcon sx={{ fontSize: '1rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                      Matching Nights
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem', lineHeight: 1.2 }}>
                      {matchingNights.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Current Lights */}
              <Card>
                <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                    <TrendingUpIcon sx={{ fontSize: '1rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                      Lichter aktuell
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main', fontSize: '1rem', lineHeight: 1.2 }}>
                      {currentLights}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              
              {/* Perfect matches */}
              <Card>
                <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                    <FavoriteIcon sx={{ fontSize: '1rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                      Perfect Matches
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1rem', lineHeight: 1.2 }}>
                      {perfectMatches.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Budget */}
              <Card>
                <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                    <AccountBalanceIcon sx={{ fontSize: '1rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                      Budget
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main', fontSize: '1rem', lineHeight: 1.2 }}>
                      {currentBalance.toLocaleString('de-DE')} €
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ 
      width: 280,
      height: '100vh',
      position: 'fixed',
      top: 0,
      right: 0,
      bgcolor: 'background.paper',
      borderLeft: '1px solid',
      borderColor: 'divider',
      overflowY: 'auto',
      p: 3,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        Statistiken
      </Typography>
      <Button variant="contained" color="secondary" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={onCreateMatchingNight}>
        Neue Matching Night
      </Button>
      <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={onCreateMatchbox}>
        Matchbox erstellen
      </Button>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {/* Matching Nights Count */}
        <Card>
          <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <FavoriteIcon sx={{ fontSize: '1rem' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                Matching Nights
            </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem', lineHeight: 1.2 }}>
                {matchingNights.length}
            </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Current Lights */}
        <Card>
          <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
              <TrendingUpIcon sx={{ fontSize: '1rem' }} />
                    </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                Lichter aktuell
                </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main', fontSize: '1rem', lineHeight: 1.2 }}>
                {currentLights}
              </Typography>
          </Box>
          </CardContent>
        </Card>

        {/* Perfect Matches */}
        <Card>
          <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
              <FavoriteIcon sx={{ fontSize: '1rem' }} />
                  </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                Perfect Matches
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1rem', lineHeight: 1.2 }}>
                {perfectMatches.length}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card>
          <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 'auto' }}>
            <Avatar sx={{ bgcolor: currentBalance >= 0 ? 'success.main' : 'error.main', width: 32, height: 32 }}>
              <AccountBalanceIcon sx={{ fontSize: '1rem' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                Kontostand
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: currentBalance >= 0 ? 'success.main' : 'error.main', fontSize: '1rem', lineHeight: 1.2 }}>
                €{currentBalance.toLocaleString('de-DE')}
              </Typography>
          </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Admin Button at bottom */}
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button
          variant="contained"
          startIcon={<AdminIcon />}
          onClick={() => window.location.href = '/admin'}
      fullWidth
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Admin Panel
        </Button>
      </Box>
    </Box>
  )
}


// ** Main Overview Component
const OverviewMUI: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matchingNights, setMatchingNights] = useState<MatchingNight[]>([])
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([])
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [expandedMatchingNights, setExpandedMatchingNights] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const [participantsData, matchingNightsData, matchboxesData, penaltiesData] = await Promise.all([
        db.participants.toArray(),
        db.matchingNights.toArray(),
        db.matchboxes.toArray(),
        db.penalties.toArray()
      ])
      setParticipants(participantsData)
      setMatchingNights(matchingNightsData)
      setMatchboxes(matchboxesData)
      setPenalties(penaltiesData)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    }
  }

  const filteredParticipants = participants.filter(participant =>
    participant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.knownFrom?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleMatchingNight = (id: number) => {
    const newExpanded = new Set(expandedMatchingNights)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedMatchingNights(newExpanded)
  }


  const tabItems = [
    { label: 'Home', icon: <PeopleIcon /> },
    { label: 'Matchbox', icon: <AnalyticsIcon /> },
    { label: 'Wahrscheinlichkeiten', icon: <TrendingUpIcon />, disabled: true }
  ]

  // Admin functionality states
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Matching Night form states
  const [matchingNightDialog, setMatchingNightDialog] = useState(false)
  const [matchingNightForm, setMatchingNightForm] = useState({
    name: '',
    totalLights: 0,
    pairs: [] as Array<{woman: string, man: string}>
  })
  
  // Drag & Drop states for Matching Night
  const [draggedParticipant, setDraggedParticipant] = useState<Participant | null>(null)
  const [dragOverPairIndex, setDragOverPairIndex] = useState<number | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<'woman' | 'man' | null>(null)
  const [placedParticipants, setPlacedParticipants] = useState<Set<string>>(new Set())
  
  // Get all participants who are already confirmed as Perfect Matches (regardless of airing order)
  const getAllConfirmedPerfectMatchParticipants = () => {
    const confirmedParticipants = new Set<string>()
    matchboxes
      .filter(mb => mb.matchType === 'perfect')
      .forEach(mb => {
        confirmedParticipants.add(mb.woman)
        confirmedParticipants.add(mb.man)
      })
    return confirmedParticipants
  }

  // Get Perfect Match pairs that should be auto-placed
  const getAutoPlaceablePerfectMatches = () => {
    return matchboxes
      .filter(mb => mb.matchType === 'perfect')
      .map(mb => ({ woman: mb.woman, man: mb.man }))
      .slice(0, 10) // Max 10 Perfect Matches (one per container)
  }

  // Auto-initialize Perfect Matches when dialog opens
  const initializePerfectMatches = () => {
    const perfectMatches = getAutoPlaceablePerfectMatches()
    const newPairs = Array.from({ length: 10 }, (_, index) => {
      if (index < perfectMatches.length) {
        return perfectMatches[index]
      }
      return { woman: '', man: '' }
    })
    
    setMatchingNightForm(prev => ({
      ...prev,
      pairs: newPairs,
      totalLights: perfectMatches.length // Auto-set lights for Perfect Matches
    }))
    
    // Mark Perfect Match participants as placed
    const perfectMatchParticipants = new Set<string>()
    perfectMatches.forEach(pair => {
      perfectMatchParticipants.add(pair.woman)
      perfectMatchParticipants.add(pair.man)
    })
    setPlacedParticipants(perfectMatchParticipants)
  }

  // Set confirmed Perfect Matches manually
  const setConfirmedPerfectMatches = () => {
    const perfectMatches = getAutoPlaceablePerfectMatches()
    
    if (perfectMatches.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Keine bestätigten Perfect Matches verfügbar!', 
        severity: 'error' 
      })
      return
    }

    // Create new pairs array with Perfect Matches in first containers
    const newPairs = Array.from({ length: 10 }, (_, index) => {
      if (index < perfectMatches.length) {
        return perfectMatches[index]
      }
      return { woman: '', man: '' }
    })
    
    setMatchingNightForm(prev => ({
      ...prev,
      pairs: newPairs,
      totalLights: perfectMatches.length // Auto-set lights for Perfect Matches
    }))
    
    // Mark Perfect Match participants as placed
    const perfectMatchParticipants = new Set<string>()
    perfectMatches.forEach(pair => {
      perfectMatchParticipants.add(pair.woman)
      perfectMatchParticipants.add(pair.man)
    })
    setPlacedParticipants(perfectMatchParticipants)

    setSnackbar({ 
      open: true, 
      message: `${perfectMatches.length} bestätigte Perfect Matches wurden gesetzt!`, 
      severity: 'success' 
    })
  }

  // Matchbox form states
  const [matchboxDialog, setMatchboxDialog] = useState(false)
  const [matchboxForm, setMatchboxForm] = useState({
    woman: '',
    man: '',
    matchType: 'no-match' as 'perfect' | 'no-match' | 'sold',
    price: 0,
    buyer: ''
  })
  const [draggedParticipants, setDraggedParticipants] = useState<{woman?: Participant, man?: Participant}>({})
  const [dragOverTarget, setDragOverTarget] = useState<'woman' | 'man' | null>(null)
  
  // Floating box position state
  const [boxPosition, setBoxPosition] = useState(() => ({
    x: Math.max(10, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 300), // Back to original position
    y: Math.max(10, (typeof window !== 'undefined' ? window.innerHeight : 800) - 450) // Unten rechts
  }))
  const [isDraggingBox, setIsDraggingBox] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Helper functions
  const women = participants.filter(p => p.gender === 'F' && p.active !== false)
  const men = participants.filter(p => p.gender === 'M' && p.active !== false)

  // Probability calculation functions
  const calculatePairProbabilities = () => {
    const probabilities: Record<string, Record<string, number>> = {}
    
    // Calculate correct base probability based on AYTO rules
    const womenCount = women.length
    const menCount = men.length
    
    // AYTO Rule: Total Perfect Matches = max(womenCount, menCount)
    // If unequal, some participants have multiple perfect matches
    
    let baseProbabilityForWomen: number
    
    if (womenCount === menCount) {
      // Equal numbers: each person has exactly 1 perfect match
      baseProbabilityForWomen = 1 / menCount
    } else if (womenCount < menCount) {
      // More men: some women have multiple perfect matches
      // Total matches = menCount, distributed among womenCount women
      const avgMatchesPerWoman = menCount / womenCount
      baseProbabilityForWomen = avgMatchesPerWoman / menCount
    } else {
      // More women: some men have multiple perfect matches  
      // Total matches = womenCount, distributed among menCount men
      baseProbabilityForWomen = 1 / menCount
    }
    
    // Initialize probability matrix with correct AYTO mathematics
    women.forEach(woman => {
      probabilities[woman.name!] = {}
      men.forEach(man => {
        probabilities[woman.name!][man.name!] = baseProbabilityForWomen
      })
    })

    // Analyze Matching Night results
    matchingNights.forEach(night => {
      const totalPairs = night.pairs.length
      const lights = night.totalLights || 0
      
      if (totalPairs > 0) {
        // Calculate evidence strength based on light ratio
        const lightRatio = lights / totalPairs
        const evidenceStrength = lightRatio * 0.4 // Max 40% boost for perfect night
        
        night.pairs.forEach(pair => {
          if (probabilities[pair.woman] && probabilities[pair.woman][pair.man] !== undefined) {
            if (lights > 0) {
              // Boost probability for pairs in a successful night
              const boost = evidenceStrength / totalPairs // Distribute boost among all pairs
              probabilities[pair.woman][pair.man] *= (1 + boost)
            } else {
              // Reduce probability for pairs in a failed night (0 lights)
              probabilities[pair.woman][pair.man] *= 0.8 // 20% reduction
            }
          }
        })
        
        // Also reduce probability for pairs NOT in this night (if it was successful)
        if (lights > 0) {
          const reductionFactor = Math.min(0.1, lightRatio * 0.05) // Max 10% reduction
          women.forEach(woman => {
            men.forEach(man => {
              const wasInNight = night.pairs.some(p => p.woman === woman.name && p.man === man.name)
              if (!wasInNight && probabilities[woman.name!] && probabilities[woman.name!][man.name!] !== undefined) {
                probabilities[woman.name!][man.name!] *= (1 - reductionFactor)
              }
            })
          })
        }
      }
    })

    // Analyze Matchbox results
    matchboxes.forEach(matchbox => {
      if (probabilities[matchbox.woman] && probabilities[matchbox.woman][matchbox.man] !== undefined) {
        switch (matchbox.matchType) {
          case 'perfect':
            probabilities[matchbox.woman][matchbox.man] = 1.0 // 100% if confirmed perfect match
            break
          case 'no-match':
            probabilities[matchbox.woman][matchbox.man] = 0.0 // 0% if confirmed no match
            break
          case 'sold':
            probabilities[matchbox.woman][matchbox.man] += 0.2 // +20% if someone bought it
            break
        }
      }
    })

    // Normalize probabilities to 0-1 range
    Object.keys(probabilities).forEach(woman => {
      Object.keys(probabilities[woman]).forEach(man => {
        probabilities[woman][man] = Math.max(0, Math.min(1, probabilities[woman][man]))
      })
    })

    return probabilities
  }

  const pairProbabilities = calculatePairProbabilities()


  // Admin functions
  const saveMatchingNight = async () => {
    try {
      if (!matchingNightForm.name) {
        setSnackbar({ open: true, message: 'Bitte Name eingeben!', severity: 'error' })
        return
      }

      if (matchingNightForm.totalLights > 10) {
        setSnackbar({ open: true, message: 'Maximum 10 Lichter erlaubt!', severity: 'error' })
        return
      }

      // Check if all 10 pairs are complete
      const completePairs = matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man)
      
      // Check for gender conflicts in complete pairs
      const genderConflicts = completePairs.filter(pair => {
        const womanParticipant = participants.find(p => p.name === pair.woman)
        const manParticipant = participants.find(p => p.name === pair.man)
        return womanParticipant && manParticipant && womanParticipant.gender === manParticipant.gender
      })

      if (genderConflicts.length > 0) {
        setSnackbar({ 
          open: true, 
          message: `Geschlechts-Konflikt gefunden! Jedes Paar muss aus einem Mann und einer Frau bestehen.`, 
          severity: 'error' 
        })
        return
      }
      
      // Check if total lights is at least as many as Perfect Match lights
      const perfectMatchLights = completePairs.filter(pair => 
        matchboxes.some(mb => 
          mb.matchType === 'perfect' && 
          mb.woman === pair.woman && 
          mb.man === pair.man
        )
      ).length

      if (matchingNightForm.totalLights < perfectMatchLights) {
        setSnackbar({ 
          open: true, 
          message: `Gesamtlichter (${matchingNightForm.totalLights}) dürfen nicht weniger als sichere Lichter (${perfectMatchLights}) sein!`, 
          severity: 'error' 
        })
        return
      }
      
      if (completePairs.length !== 10) {
        setSnackbar({ 
          open: true, 
          message: `Alle 10 Pärchen müssen vollständig sein! Aktuell: ${completePairs.length}/10 vollständig`, 
          severity: 'error' 
        })
        return
      }

      const now = new Date()
      await db.matchingNights.add({
        name: matchingNightForm.name,
        date: new Date().toISOString().split('T')[0],
        totalLights: matchingNightForm.totalLights,
        pairs: completePairs,
        createdAt: now
      })

      setSnackbar({ open: true, message: `Matching Night "${matchingNightForm.name}" mit allen 10 Paaren wurde erfolgreich erstellt!`, severity: 'success' })
      setMatchingNightDialog(false)
      resetMatchingNightForm()
      loadAllData()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      setSnackbar({ open: true, message: `Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  const saveMatchbox = async () => {
    try {
      if (!matchboxForm.woman || !matchboxForm.man) {
        setSnackbar({ open: true, message: 'Bitte wähle eine Frau und einen Mann aus!', severity: 'error' })
        return
      }

      if (matchboxForm.matchType === 'sold') {
        if (!matchboxForm.price || matchboxForm.price <= 0) {
          setSnackbar({ open: true, message: 'Bei verkauften Matchboxes muss ein gültiger Preis angegeben werden!', severity: 'error' })
          return
        }
        if (!matchboxForm.buyer) {
          setSnackbar({ open: true, message: 'Bei verkauften Matchboxes muss ein Käufer ausgewählt werden!', severity: 'error' })
          return
        }
      }

      const now = new Date()
      await db.matchboxes.add({
        ...matchboxForm,
        createdAt: now,
        updatedAt: now,
        soldDate: matchboxForm.matchType === 'sold' ? now : undefined
      })

      setSnackbar({ open: true, message: 'Matchbox wurde erfolgreich erstellt!', severity: 'success' })
      setMatchboxDialog(false)
      resetMatchboxForm()
      loadAllData()
    } catch (error) {
      console.error('Fehler beim Speichern der Matchbox:', error)
      setSnackbar({ open: true, message: `Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }



  const resetMatchingNightForm = () => {
    setMatchingNightForm({
      name: '',
      totalLights: 0,
      pairs: []
    })
    setPlacedParticipants(new Set())
  }

  const resetMatchingNightFormWithPerfectMatches = () => {
    setMatchingNightForm({
      name: '',
      totalLights: 0,
      pairs: []
    })
    setPlacedParticipants(new Set())
    // Auto-initialize Perfect Matches
    setTimeout(() => initializePerfectMatches(), 100)
  }


  const handleMatchingNightDragOver = (e: React.DragEvent, pairIndex: number, slot: 'woman' | 'man') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverPairIndex(pairIndex)
    setDragOverSlot(slot)
  }

  const handleMatchingNightDragLeave = () => {
    setDragOverPairIndex(null)
    setDragOverSlot(null)
  }

  const handleMatchingNightDrop = (e: React.DragEvent, pairIndex: number, slot: 'woman' | 'man') => {
    e.preventDefault()
    setDragOverPairIndex(null)
    setDragOverSlot(null)
    
    if (!draggedParticipant) return
    
    // Check if participant is already placed or confirmed as Perfect Match
    if (placedParticipants.has(draggedParticipant.name || '') || getAllConfirmedPerfectMatchParticipants().has(draggedParticipant.name || '')) return
    
    // Check if the target slot already has someone of the same gender
    const targetPair = matchingNightForm.pairs[pairIndex] || { woman: '', man: '' }
    if (slot === 'woman' && targetPair.man) {
      const manParticipant = participants.find(p => p.name === targetPair.man)
      if (manParticipant && manParticipant.gender === draggedParticipant.gender) {
        setSnackbar({ 
          open: true, 
          message: `Nicht möglich: ${draggedParticipant.name} und ${targetPair.man} haben das gleiche Geschlecht!`, 
          severity: 'error' 
        })
        return
      }
    }
    if (slot === 'man' && targetPair.woman) {
      const womanParticipant = participants.find(p => p.name === targetPair.woman)
      if (womanParticipant && womanParticipant.gender === draggedParticipant.gender) {
        setSnackbar({ 
          open: true, 
          message: `Nicht möglich: ${draggedParticipant.name} und ${targetPair.woman} haben das gleiche Geschlecht!`, 
          severity: 'error' 
        })
        return
      }
    }
    
    // Update pairs array
    const newPairs = [...matchingNightForm.pairs]
    if (!newPairs[pairIndex]) {
      newPairs[pairIndex] = { woman: '', man: '' }
    }
    
    // Remove participant from other pairs if already placed
    const participantName = draggedParticipant.name || ''
    newPairs.forEach((pair, index) => {
      if (index !== pairIndex && pair) {
        if (pair.woman === participantName) pair.woman = ''
        if (pair.man === participantName) pair.man = ''
      }
    })
    
    // Place participant in new slot
    newPairs[pairIndex][slot] = participantName
    
      setMatchingNightForm(prev => ({
        ...prev,
      pairs: newPairs
    }))
    
    // Update placed participants
    setPlacedParticipants(prev => {
      const newSet = new Set(prev)
      newSet.add(participantName)
      return newSet
    })
    
    setDraggedParticipant(null)
  }

  const removeParticipantFromPair = (pairIndex: number, slot: 'woman' | 'man') => {
    const participantName = matchingNightForm.pairs[pairIndex]?.[slot]
    if (!participantName) return
    
    const newPairs = [...matchingNightForm.pairs]
    newPairs[pairIndex][slot] = ''
    
    setMatchingNightForm(prev => ({
      ...prev,
      pairs: newPairs
    }))
    
    // Remove from placed participants
    setPlacedParticipants(prev => {
      const newSet = new Set(prev)
      newSet.delete(participantName)
      return newSet
    })
  }

  const resetMatchboxForm = () => {
    setMatchboxForm({
      woman: '',
      man: '',
      matchType: 'no-match',
      price: 0,
      buyer: ''
    })
    setDraggedParticipants({})
  }

  // Drag and Drop handlers
  const handleDrop = (e: React.DragEvent, target: 'woman' | 'man') => {
    e.preventDefault()
    setDragOverTarget(null)
    const participantData = e.dataTransfer.getData('participant')
    if (participantData) {
      const participant = JSON.parse(participantData) as Participant
      // Blockiere bestätigte Perfect Matches für neue Matchboxen
      if (getAllConfirmedPerfectMatchParticipants().has(participant.name || '')) {
        setSnackbar({ open: true, message: `${participant.name} ist bereits als Perfect Match bestätigt und kann nicht für eine neue Matchbox verwendet werden.`, severity: 'error' })
        return
      }
      if ((target === 'woman' && participant.gender === 'F') || 
          (target === 'man' && participant.gender === 'M')) {
        setMatchboxForm(prev => ({
          ...prev,
          [target]: participant.name || ''
        }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent, target?: 'woman' | 'man') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (target && dragOverTarget !== target) {
      setDragOverTarget(target)
    }
  }

  const handleDragLeave = () => {
    setDragOverTarget(null)
  }

  // Floating box drag handlers
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    console.log('Starting drag...')
    setIsDraggingBox(true)
    
    // Use the current box position to calculate offset
    setDragOffset({
      x: e.clientX - boxPosition.x,
      y: e.clientY - boxPosition.y
    })
    
    e.preventDefault()
    e.stopPropagation()
  }

  const handleBoxMouseMove = (e: MouseEvent) => {
    if (isDraggingBox) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Keep box within viewport bounds
      const maxX = window.innerWidth - 300 // box width + some margin
      const maxY = window.innerHeight - 400 // box height + some margin
      
      const boundedPosition = {
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      }
      
      console.log('Moving to:', boundedPosition)
      setBoxPosition(boundedPosition)
    }
  }

  const handleBoxMouseUp = () => {
    console.log('Drag ended')
    setIsDraggingBox(false)
  }

  // Add global mouse event listeners
  useEffect(() => {
    if (isDraggingBox) {
      document.addEventListener('mousemove', handleBoxMouseMove)
      document.addEventListener('mouseup', handleBoxMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleBoxMouseMove)
        document.removeEventListener('mouseup', handleBoxMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDraggingBox, dragOffset])

  // Update form when dragged participants change
  useEffect(() => {
    if (draggedParticipants.woman) {
      setMatchboxForm(prev => ({ ...prev, woman: draggedParticipants.woman?.name || '' }))
    }
    if (draggedParticipants.man) {
      setMatchboxForm(prev => ({ ...prev, man: draggedParticipants.man?.name || '' }))
    }
  }, [draggedParticipants])

  const isMobile = useMediaQuery('(max-width:600px)')
  const [isStatsOpenMobile, setIsStatsOpenMobile] = useState(false)
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Main Content Area */}
      <Box sx={{ mr: isMobile ? 0 : '280px' }}>
        {/* Header with Menu */}
      <Paper sx={{ position: 'sticky', top: 0, zIndex: 1000, bgcolor: 'background.paper', left: 0, right: 0, width: isMobile ? '100vw' : 'auto' }}>
          <Box sx={{ p: isMobile ? 2 : 3, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                AYTO RSIL 2025
              </Typography>
              <Chip label="Overview" color="primary" />
              </Box>
              {isMobile && (
                <IconButton aria-label="Statistik öffnen" onClick={() => setIsStatsOpenMobile(prev => !prev)}>
                  <MenuIcon />
                </IconButton>
              )}
          </Box>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Übersicht aller Teilnehmer der aktuellen Staffel
          </Typography>
        </Box>

          {/* Menu Tabs integrated into header */}
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => {
              // Wechsel zum deaktivierten Tab (Index 2) verhindern
              if (newValue === 2) return
              setActiveTab(newValue)
            }}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {tabItems.map((tab, index) => (
              <Tab 
                key={index}
                label={tab.label} 
                icon={tab.icon}
                iconPosition="start"
                disabled={Boolean(tab.disabled)}
                sx={{ minHeight: 64, fontSize: '1rem', fontWeight: 'bold' }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Main Content */}
        <Box sx={{ maxWidth: isMobile ? '100%' : '1200px', mx: isMobile ? 0 : 'auto', p: isMobile ? 2 : 3 }}>
          <Card sx={{ mb: 4 }}>

          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            {/* Floating Matchbox Creator - nur auf Desktop */}
            {!isMobile && (
            <Box
              data-floating-box
              sx={{
                position: 'fixed',
                left: boxPosition.x,
                top: boxPosition.y,
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                userSelect: 'none',
                transition: isDraggingBox ? 'none' : 'all 0.3s ease'
              }}
            >
              {/* Quick Matchbox Creator */}
              <Card
                sx={{
                  width: 280,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: 4,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <CardHeader
                  onMouseDown={handleBoxMouseDown}
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FavoriteIcon />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Neue Matchbox
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          opacity: 0.7,
                          p: 1,
                          borderRadius: 1,
                          '&:hover': { 
                            opacity: 1,
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        <Typography sx={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)' }}>
                          ⋮⋮⋮
                        </Typography>
                      </Box>
                    </Box>
                  }
                  subheader={
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Ziehe Teilnehmer hier hinein • Header klicken zum Verschieben
                    </Typography>
                  }
                  sx={{ 
                    pb: 1,
                    cursor: isDraggingBox ? 'grabbing' : 'grab',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Woman Drop Zone */}
                    <Box
                      onDrop={(e) => {
                        e.stopPropagation()
                        handleDrop(e, 'woman')
                      }}
                      onDragOver={(e) => {
                        e.stopPropagation()
                        handleDragOver(e, 'woman')
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation()
                        handleDragLeave()
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      sx={{
                        border: '2px dashed rgba(255,255,255,0.5)',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        bgcolor: dragOverTarget === 'woman' ? 'rgba(255,255,255,0.4)' : 
                                 matchboxForm.woman ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                        borderColor: dragOverTarget === 'woman' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)',
                        transform: dragOverTarget === 'woman' ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.3s ease',
                        minHeight: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          borderColor: 'rgba(255,255,255,0.8)'
                        }
                      }}
                    >
                      {matchboxForm.woman ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {(() => {
                            const woman = women.find(w => w.name === matchboxForm.woman)
                            const hasPhoto = woman?.photoUrl && woman.photoUrl.trim() !== ''
                            return (
                              <Avatar 
                                src={hasPhoto ? woman.photoUrl : undefined}
                                sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  bgcolor: hasPhoto ? undefined : 'secondary.main',
                                  border: '2px solid white'
                                }}
                              >
                                {!hasPhoto && (woman?.name?.charAt(0) || 'F')}
                              </Avatar>
                            )
                          })()}
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {matchboxForm.woman}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setMatchboxForm(prev => ({...prev, woman: ''}))}
                            sx={{ color: 'white', ml: 'auto' }}
                          >
                            <Typography sx={{ fontSize: '16px' }}>×</Typography>
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FemaleIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Frau hinzufügen
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Man Drop Zone */}
                    <Box
                      onDrop={(e) => {
                        e.stopPropagation()
                        handleDrop(e, 'man')
                      }}
                      onDragOver={(e) => {
                        e.stopPropagation()
                        handleDragOver(e, 'man')
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation()
                        handleDragLeave()
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      sx={{
                        border: '2px dashed rgba(255,255,255,0.5)',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        bgcolor: dragOverTarget === 'man' ? 'rgba(255,255,255,0.4)' : 
                                 matchboxForm.man ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                        borderColor: dragOverTarget === 'man' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)',
                        transform: dragOverTarget === 'man' ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.3s ease',
                        minHeight: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          borderColor: 'rgba(255,255,255,0.8)'
                        }
                      }}
                    >
                      {matchboxForm.man ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {(() => {
                            const man = men.find(m => m.name === matchboxForm.man)
                            const hasPhoto = man?.photoUrl && man.photoUrl.trim() !== ''
                            return (
                              <Avatar 
                                src={hasPhoto ? man.photoUrl : undefined}
                                sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  bgcolor: hasPhoto ? undefined : 'primary.main',
                                  border: '2px solid white'
                                }}
                              >
                                {!hasPhoto && (man?.name?.charAt(0) || 'M')}
                              </Avatar>
                            )
                          })()}
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {matchboxForm.man}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setMatchboxForm(prev => ({...prev, man: ''}))}
                            sx={{ color: 'white', ml: 'auto' }}
                          >
                            <Typography sx={{ fontSize: '16px' }}>×</Typography>
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MaleIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Mann hinzufügen
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }} onMouseDown={(e) => e.stopPropagation()}>
                      {matchboxForm.woman && matchboxForm.man ? (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMatchboxDialog(true)
                          }}
                          sx={{
                            bgcolor: 'white',
                            color: 'primary.main',
                            fontWeight: 'bold',
                            '&:hover': {
                              bgcolor: 'grey.100'
                            }
                          }}
                        >
                          Details festlegen
                        </Button>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', width: '100%', py: 1 }}>
                          Beide Teilnehmer hinzufügen
                        </Typography>
                      )}
                      {(matchboxForm.woman || matchboxForm.man) && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            resetMatchboxForm()
                          }}
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                          }}
                        >
                          <Typography sx={{ fontSize: '16px' }}>↻</Typography>
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
            )}

            {/* Search */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Namen oder Show suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 600 }}
              />
            </Box>

            {/* Participants by Gender */}
            {filteredParticipants.length === 0 ? (
              <Alert severity="info">
                {searchQuery ? 'Keine Teilnehmer gefunden' : 'Noch keine Teilnehmer vorhanden'}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Women Section */}
                {filteredParticipants.filter(p => p.gender === 'F').length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <PeopleIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        Frauen ({filteredParticipants.filter(p => p.gender === 'F').length})
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 3,
                      justifyContent: 'flex-start'
                    }}>
                      {filteredParticipants
                        .filter(p => p.gender === 'F')
                        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
                        .map((participant) => {
                          const isConfirmedPM = getAllConfirmedPerfectMatchParticipants().has(participant.name || '')
                          const isUnavailable = isConfirmedPM || placedParticipants.has(participant.name || '')
                          return (
                            <ParticipantCard 
                              key={participant.id} 
                              participant={participant} 
                              draggable={!isUnavailable}
                              onDragStart={(p) => setDraggedParticipant(p)}
                              isPlaced={isUnavailable}
                            />
                          )
                        })}
                    </Box>
                  </Box>
                )}

                {/* Men Section */}
                {filteredParticipants.filter(p => p.gender === 'M').length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <PeopleIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Männer ({filteredParticipants.filter(p => p.gender === 'M').length})
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 3,
                      justifyContent: 'flex-start'
                    }}>
                      {filteredParticipants
                        .filter(p => p.gender === 'M')
                        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
                        .map((participant) => {
                          const isConfirmedPM = getAllConfirmedPerfectMatchParticipants().has(participant.name || '')
                          const isUnavailable = isConfirmedPM || placedParticipants.has(participant.name || '')
                          return (
                            <ParticipantCard 
                              key={participant.id} 
                              participant={participant} 
                              draggable={!isUnavailable}
                              onDragStart={(p) => setDraggedParticipant(p)}
                              isPlaced={isUnavailable}
                            />
                          )
                        })}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Matching Nights Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Matching Nights
              </Typography>
              
              {matchingNights.length === 0 ? (
                <Alert severity="info">
                  Noch keine Matching Nights vorhanden
                </Alert>
              ) : (
                <Box>
                  {matchingNights
                    .sort((a, b) => {
                      const dateA = a.ausstrahlungsdatum ? new Date(a.ausstrahlungsdatum).getTime() : new Date(a.createdAt).getTime()
                      const dateB = b.ausstrahlungsdatum ? new Date(b.ausstrahlungsdatum).getTime() : new Date(b.createdAt).getTime()
                      return dateB - dateA
                    })
                    .map((matchingNight) => (
                      <MatchingNightCard
                        key={matchingNight.id}
                        matchingNight={matchingNight}
                        expanded={expandedMatchingNights.has(matchingNight.id!)}
                        onToggle={() => toggleMatchingNight(matchingNight.id!)}
                        participants={participants}
                        matchboxes={matchboxes}
                      />
                    ))
                  }
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Matchbox Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Matchboxes ({matchboxes.length})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                💡 Nutze die schwebende Matchbox-Zone rechts für Drag & Drop
              </Typography>
            </Box>
            
            {matchboxes.length === 0 ? (
              <Alert severity="info">
                Noch keine Matchboxes vorhanden
              </Alert>
            ) : (
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'flex-start'
              }}>
                {matchboxes
                  .sort((a, b) => {
                    const dateA = a.ausstrahlungsdatum ? new Date(a.ausstrahlungsdatum).getTime() : new Date(a.createdAt).getTime()
                    const dateB = b.ausstrahlungsdatum ? new Date(b.ausstrahlungsdatum).getTime() : new Date(b.createdAt).getTime()
                    return dateB - dateA
                  })
                  .map((matchbox) => {
                    const additionalInfo = [
                      matchbox.matchType === 'sold' && matchbox.price ? `€${matchbox.price.toLocaleString('de-DE')}` : null,
                      matchbox.matchType === 'sold' && matchbox.buyer ? `Käufer: ${matchbox.buyer}` : null,
                      matchbox.ausstrahlungsdatum ? 
                        `Ausstrahlung: ${new Date(matchbox.ausstrahlungsdatum).toLocaleDateString('de-DE')}` :
                        `Erstellt: ${new Date(matchbox.createdAt).toLocaleDateString('de-DE')}`
                    ].filter(Boolean).join(' • ')
                    
                    return (
                      <CoupleAvatars
                        key={matchbox.id}
                        womanName={matchbox.woman}
                        manName={matchbox.man}
                        additionalInfo={additionalInfo}
                        matchType={matchbox.matchType}
                        participants={participants}
                      />
                    )
                  })
                }
              </Box>
            )}
          </TabPanel>

          {/* Probability Analysis Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Wahrscheinlichkeits-Analyse
                </Typography>
            </Box>

            {/* Overall Statistics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {(() => {
                      // Berechne aktuelle mögliche Paare (ohne 0% und 100%)
                      let possiblePairs = 0
                      Object.values(pairProbabilities).forEach(womanProbs => {
                        Object.values(womanProbs).forEach(prob => {
                          const percentage = Math.round(prob * 100)
                          if (percentage > 0 && percentage < 100) {
                            possiblePairs++
                          }
                        })
                      })
                      return possiblePairs
                    })()}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.9)' }}>
                    Mögliche Paare
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {matchboxes.filter(m => m.matchType === 'perfect').length}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.9)' }}>
                    Bestätigte Matches
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#333' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {matchingNights.length}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(51,51,51,0.8)' }}>
                    Matching Nights
                  </Typography>
                </CardContent>
        </Card>
      </Box>

              {/* Heatmap Matrix */}
            <Card sx={{ height: 'fit-content', mb: 3 }}>
                <CardHeader 
                  title="Wahrscheinlichkeits-Matrix"
                  subheader="Heatmap aller Paar-Kombinationen"
                  action={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.7rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: '2px' }} />
                        <Typography variant="caption">100% Perfect Match ✓</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: '2px' }} />
                        <Typography variant="caption">0% No Match ✗</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          background: 'linear-gradient(90deg, hsl(0, 70%, 80%) 0%, hsl(60, 70%, 70%) 50%, hsl(120, 70%, 60%) 100%)',
                          borderRadius: '2px' 
                        }} />
                        <Typography variant="caption">1-99% Wahrscheinlichkeit</Typography>
                      </Box>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ overflow: 'auto', maxHeight: 600 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}></TableCell>
                          {men.map(man => (
                            <TableCell key={man.id} sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.75rem',
                            minWidth: '80px',
                              textAlign: 'center',
                              height: '80px',
                            verticalAlign: 'bottom',
                            p: 1
                          }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Avatar 
                                src={man.photoUrl}
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  fontSize: '0.7rem',
                                  bgcolor: 'white',
                                  border: '1px solid',
                                  borderColor: 'grey.300'
                                }}
                              >
                                {man.name?.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.65rem',
                                lineHeight: 1,
                                textAlign: 'center',
                                wordBreak: 'break-word',
                                color: 'black'
                            }}>
                              {man.name?.substring(0, 8)}
                              </Typography>
                            </Box>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {women.map(woman => (
                          <TableRow key={woman.id}>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.75rem',
                            minWidth: '100px',
                            p: 1
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.65rem',
                                lineHeight: 1,
                                wordBreak: 'break-word',
                                color: 'black'
                            }}>
                              {woman.name?.substring(0, 10)}
                              </Typography>
                              <Avatar 
                                src={woman.photoUrl}
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  fontSize: '0.7rem',
                                  bgcolor: 'white',
                                  border: '1px solid',
                                  borderColor: 'grey.300'
                                }}
                              >
                                {woman.name?.charAt(0)}
                              </Avatar>
                            </Box>
                            </TableCell>
                            {men.map(man => {
                              const probability = pairProbabilities[woman.name!]?.[man.name!] || 0
                              const percentage = Math.round(probability * 100)
                              
                              return (
                                <TableCell 
                                  key={`${woman.id}-${man.id}`}
                                  sx={{ 
                                    bgcolor: percentage === 100 ? 'success.main' :  // 100% = Grün
                                             percentage === 0 ? 'error.main' :      // 0% = Rot
                                             `hsl(${probability * 120}, 70%, ${90 - probability * 30}%)`, // Normal HSL
                                    textAlign: 'center',
                                    fontWeight: percentage === 0 || percentage === 100 ? 'bold' : 'bold',
                                    fontSize: percentage === 0 || percentage === 100 ? '0.9rem' : '0.75rem',
                                    color: percentage === 100 ? 'white' :           // Perfect Match = Weiß
                                           percentage === 0 ? 'white' :             // No Match = Weiß  
                                           probability > 0.5 ? 'white' : 'black',   // Normal logic
                                    cursor: 'pointer',
                                    border: percentage === 0 || percentage === 100 ? '2px solid' : 'none',
                                    borderColor: percentage === 100 ? 'success.dark' : 
                                                percentage === 0 ? 'error.dark' : 'transparent',
                                    '&:hover': {
                                      bgcolor: percentage === 100 ? 'success.dark' :
                                               percentage === 0 ? 'error.dark' :
                                               `hsl(${probability * 120}, 70%, ${80 - probability * 30}%)`,
                                      transform: 'scale(1.1)',
                                      boxShadow: percentage === 0 || percentage === 100 ? 3 : 1
                                    },
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    '&::after': percentage === 100 ? {
                                      content: '"✓"',
                                      position: 'absolute',
                                      top: 2,
                                      right: 2,
                                      fontSize: '0.7rem',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    } : percentage === 0 ? {
                                      content: '"✗"',
                                      position: 'absolute',
                                      top: 2,
                                      right: 2,
                                      fontSize: '0.7rem',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    } : {}
                                  }}
                                  title={`${woman.name} & ${man.name}: ${percentage}%${
                                    percentage === 100 ? ' (PERFECT MATCH ✓)' : 
                                    percentage === 0 ? ' (NO MATCH ✗)' : ''
                                  }`}
                                >
                                  {percentage === 100 ? '100%' : percentage === 0 ? '0%' : `${percentage}%`}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>

          </TabPanel>
        </Card>
        </Box>
      </Box>

      {/* Statistics Sidebar */}
      <StatisticsSidebar 
        matchboxes={matchboxes}
        matchingNights={matchingNights}
        penalties={penalties}
        onCreateMatchbox={() => setMatchboxDialog(true)}
        onCreateMatchingNight={() => {
          resetMatchingNightFormWithPerfectMatches()
          setMatchingNightDialog(true)
        }}
        isOpenMobile={isStatsOpenMobile}
        onToggleMobile={() => setIsStatsOpenMobile(v => !v)}
      />


      {/* Matching Night Dialog */}
      <Dialog open={matchingNightDialog} onClose={() => setMatchingNightDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Neue Matching Night erstellen</Typography>
              <Typography variant="body2" color="text.secondary">
                🎯 Ziehe Teilnehmer direkt in die Pärchen-Container
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Typography sx={{ fontSize: '16px' }}>🔒</Typography>}
                onClick={setConfirmedPerfectMatches}
                sx={{ 
                  whiteSpace: 'nowrap',
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  '&:hover': {
                    borderColor: 'warning.dark',
                    bgcolor: 'warning.50'
                  }
                }}
              >
                Perfect Matches setzen
              </Button>
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {getAutoPlaceablePerfectMatches().length} bestätigte Perfect Matches verfügbar
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Info */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label="Name der Matching Night"
                value={matchingNightForm.name}
                onChange={(e) => setMatchingNightForm({...matchingNightForm, name: e.target.value})}
                placeholder="z.B. Matching Night 1"
              />
              
              <Box>
                <TextField
                  fullWidth
                  label="Gesamtlichter aus der Show (max. 10)"
                  type="number"
                  inputProps={{ 
                    min: (() => {
                      const perfectMatchLights = matchingNightForm.pairs.filter(pair => 
                        pair && pair.woman && pair.man && 
                        matchboxes.some(mb => 
                          mb.matchType === 'perfect' && 
                          mb.woman === pair.woman && 
                          mb.man === pair.man
                        )
                      ).length
                      return perfectMatchLights
                    })(), 
                    max: 10 
                  }}
                  value={matchingNightForm.totalLights}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setMatchingNightForm({...matchingNightForm, totalLights: value})
                  }}
                  placeholder="0"
                  error={(() => {
                    const perfectMatchLights = matchingNightForm.pairs.filter(pair => 
                      pair && pair.woman && pair.man && 
                      matchboxes.some(mb => 
                        mb.matchType === 'perfect' && 
                        mb.woman === pair.woman && 
                        mb.man === pair.man
                      )
                    ).length
                    return matchingNightForm.totalLights > 10 || matchingNightForm.totalLights < perfectMatchLights
                  })()}
                  helperText={(() => {
                    const perfectMatchLights = matchingNightForm.pairs.filter(pair => 
                      pair && pair.woman && pair.man && 
                      matchboxes.some(mb => 
                        mb.matchType === 'perfect' && 
                        mb.woman === pair.woman && 
                        mb.man === pair.man
                      )
                    ).length
                    
                    if (matchingNightForm.totalLights > 10) {
                      return "Maximum 10 Lichter erlaubt!"
                    }
                    if (matchingNightForm.totalLights < perfectMatchLights) {
                      return `Minimum ${perfectMatchLights} Lichter erforderlich (Perfect Matches)`
                    }
                    return ""
                  })()}
                />
                {/* Visual Light Indicator */}
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Lichter:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {Array.from({ length: 10 }, (_, index) => {
                      const perfectMatchLights = matchingNightForm.pairs.filter(pair => 
                        pair && pair.woman && pair.man && 
                        matchboxes.some(mb => 
                          mb.matchType === 'perfect' && 
                          mb.woman === pair.woman && 
                          mb.man === pair.man
                        )
                      ).length
                      
                      const isActive = index < matchingNightForm.totalLights
                      const isSecureLight = index < perfectMatchLights
                      
                      return (
                        <Box
                          key={index}
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: isActive ? (isSecureLight ? 'warning.dark' : 'warning.main') : 'grey.300',
                            border: '1px solid',
                            borderColor: isActive ? (isSecureLight ? 'warning.darker' : 'warning.dark') : 'grey.400',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}
                        >
                          {isSecureLight && isActive && (
                            <Typography sx={{ 
                              position: 'absolute',
                              top: -2,
                              left: -2,
                              fontSize: '8px',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              🔒
                            </Typography>
                          )}
                        </Box>
                      )
                    })}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {matchingNightForm.totalLights}/10
                  </Typography>
                </Box>
                
              </Box>
            </Box>

            {/* Drag & Drop Pairs Grid - 2 rows of 5 pairs */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Pärchen-Container - Beliebige Paarungen möglich
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* First Row - 5 pairs */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                  {Array.from({ length: 5 }, (_, index) => {
                    const pair = matchingNightForm.pairs[index] || { woman: '', man: '' }
                    const isPerfectMatch = matchboxes.some(mb => 
                      mb.matchType === 'perfect' && 
                      mb.woman === pair.woman && 
                      mb.man === pair.man
                    )
                    return (
                      <MatchingNightPairContainer
                        key={index}
                        pairIndex={index}
                        pair={pair}
                        participants={participants}
                        isDragOver={dragOverPairIndex === index}
                        dragOverSlot={dragOverPairIndex === index ? dragOverSlot : null}
                        onDragOver={handleMatchingNightDragOver}
                        onDragLeave={handleMatchingNightDragLeave}
                        onDrop={handleMatchingNightDrop}
                        onRemove={removeParticipantFromPair}
                        isPerfectMatch={isPerfectMatch}
                      />
                    )
                  })}
                </Box>
                
                {/* Second Row - 5 pairs */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                  {Array.from({ length: 5 }, (_, index) => {
                    const pair = matchingNightForm.pairs[index + 5] || { woman: '', man: '' }
                    const isPerfectMatch = matchboxes.some(mb => 
                      mb.matchType === 'perfect' && 
                      mb.woman === pair.woman && 
                      mb.man === pair.man
                    )
                    return (
                      <MatchingNightPairContainer
                        key={index + 5}
                        pairIndex={index + 5}
                        pair={pair}
                        participants={participants}
                        isDragOver={dragOverPairIndex === index + 5}
                        dragOverSlot={dragOverPairIndex === index + 5 ? dragOverSlot : null}
                        onDragOver={handleMatchingNightDragOver}
                        onDragLeave={handleMatchingNightDragLeave}
                        onDrop={handleMatchingNightDrop}
                        onRemove={removeParticipantFromPair}
                        isPerfectMatch={isPerfectMatch}
                      />
                    )
                  })}
                </Box>
              </Box>
            </Box>

            {/* Available Participants for Drag & Drop */}
            <Box>
              
              {/* Participants Layout: Men Left, Women Right */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                {/* Men Section - Left */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                    Männer ({men.filter(m => !placedParticipants.has(m.name || '') && !getAllConfirmedPerfectMatchParticipants().has(m.name || '')).length} verfügbar)
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    p: 1.5,
                    border: '1px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                    minHeight: 80,
                    alignItems: 'center'
                  }}>
                    {men.filter(m => !placedParticipants.has(m.name || '') && !getAllConfirmedPerfectMatchParticipants().has(m.name || '')).map((man) => (
                      <ParticipantCard 
                        key={man.id} 
                        participant={man} 
                        draggable={true}
                        onDragStart={(p) => setDraggedParticipant(p)}
                        isPlaced={false}
                      />
                    ))}
                    {men.filter(m => !placedParticipants.has(m.name || '') && !getAllConfirmedPerfectMatchParticipants().has(m.name || '')).length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%', fontSize: '12px' }}>
                        Alle Männer sind bereits platziert
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Women Section - Right */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                    Frauen ({women.filter(w => !placedParticipants.has(w.name || '') && !getAllConfirmedPerfectMatchParticipants().has(w.name || '')).length} verfügbar)
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    p: 1.5,
                    border: '1px dashed',
                    borderColor: 'secondary.main',
                    borderRadius: 2,
                    bgcolor: 'secondary.50',
                    minHeight: 80,
                    alignItems: 'center'
                  }}>
                    {women.filter(w => !placedParticipants.has(w.name || '') && !getAllConfirmedPerfectMatchParticipants().has(w.name || '')).map((woman) => (
                      <ParticipantCard 
                        key={woman.id} 
                        participant={woman} 
                        draggable={true}
                        onDragStart={(p) => setDraggedParticipant(p)}
                        isPlaced={false}
                      />
                    ))}
                    {women.filter(w => !placedParticipants.has(w.name || '') && !getAllConfirmedPerfectMatchParticipants().has(w.name || '')).length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%', fontSize: '12px' }}>
                        Alle Frauen sind bereits platziert
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setMatchingNightDialog(false); resetMatchingNightForm();}}>Abbrechen</Button>
          <Button 
            onClick={saveMatchingNight} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man).length !== 10}
            sx={{
              bgcolor: matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man).length === 10 
                ? 'success.main' 
                : 'grey.400',
              '&:hover': {
                bgcolor: matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man).length === 10 
                  ? 'success.dark' 
                  : 'grey.500'
              }
            }}
          >
            {matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man).length === 10 
              ? 'Erstellen (10/10)' 
              : `Erstellen (${matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man).length}/10)`
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Matchbox Dialog */}
      <Dialog open={matchboxDialog} onClose={() => setMatchboxDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Neue Matchbox erstellen
            <Typography variant="body2" color="text.secondary">
              {isMobile ? '📱 Wähle Teilnehmer aus den Listen aus' : '💡 Ziehe Teilnehmer aus der Übersicht hier hinein'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Drag & Drop Areas - nur auf Desktop */}
            {!isMobile && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {/* Woman Drop Zone */}
              <Box
                onDrop={(e) => handleDrop(e, 'woman')}
                onDragOver={handleDragOver}
                sx={{
                  border: '2px dashed',
                  borderColor: matchboxForm.woman ? 'secondary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: matchboxForm.woman ? 'secondary.50' : 'grey.50',
                  transition: 'all 0.3s ease',
                  minHeight: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2
                }}
              >
                {matchboxForm.woman ? (
                  // Selected woman participant
                  <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      {(() => {
                        const woman = women.find(w => w.name === matchboxForm.woman)
                        const hasPhoto = woman?.photoUrl && woman.photoUrl.trim() !== ''
                        return (
                          <Avatar 
                            src={hasPhoto ? woman.photoUrl : undefined}
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              bgcolor: hasPhoto ? undefined : 'secondary.main',
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              border: '3px solid',
                              borderColor: 'secondary.main',
                              boxShadow: 3
                            }}
                          >
                            {!hasPhoto && (woman?.name?.charAt(0) || 'F')}
                          </Avatar>
                        )
                      })()}
                      <IconButton
                        size="small"
                        onClick={() => setMatchboxForm(prev => ({...prev, woman: ''}))}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'error.main',
                          color: 'white',
                          width: 24,
                          height: 24,
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                      >
                        <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>×</Typography>
                      </IconButton>
                    </Box>
                    <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                      {matchboxForm.woman}
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      ✅ Ausgewählt
                    </Typography>
                  </Box>
                ) : (
                  // Empty drop zone
                  <>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'grey.300', 
                      border: '3px dashed',
                      borderColor: 'grey.400'
                    }}>
                      <FemaleIcon sx={{ fontSize: '2rem' }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Frau hier hinziehen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drop Zone für Frauen
                    </Typography>
                  </>
                )}
              </Box>

              {/* Man Drop Zone */}
              <Box
                onDrop={(e) => handleDrop(e, 'man')}
                onDragOver={handleDragOver}
                sx={{
                  border: '2px dashed',
                  borderColor: matchboxForm.man ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: matchboxForm.man ? 'primary.50' : 'grey.50',
                  transition: 'all 0.3s ease',
                  minHeight: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2
                }}
              >
                {matchboxForm.man ? (
                  // Selected man participant
                  <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      {(() => {
                        const man = men.find(m => m.name === matchboxForm.man)
                        const hasPhoto = man?.photoUrl && man.photoUrl.trim() !== ''
                        return (
                          <Avatar 
                            src={hasPhoto ? man.photoUrl : undefined}
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              bgcolor: hasPhoto ? undefined : 'primary.main',
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              border: '3px solid',
                              borderColor: 'primary.main',
                              boxShadow: 3
                            }}
                          >
                            {!hasPhoto && (man?.name?.charAt(0) || 'M')}
                          </Avatar>
                        )
                      })()}
                      <IconButton
                        size="small"
                        onClick={() => setMatchboxForm(prev => ({...prev, man: ''}))}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'error.main',
                          color: 'white',
                          width: 24,
                          height: 24,
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                      >
                        <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>×</Typography>
                      </IconButton>
                    </Box>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {matchboxForm.man}
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      ✅ Ausgewählt
                    </Typography>
                  </Box>
                ) : (
                  // Empty drop zone
                  <>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'grey.300', 
                      border: '3px dashed',
                      borderColor: 'grey.400'
                    }}>
                      <MaleIcon sx={{ fontSize: '2rem' }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Mann hier hinziehen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drop Zone für Männer
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
            )}

            {/* Manuelle Auswahl - immer sichtbar */}
            <Typography variant="h6" sx={{ mt: 2 }}>{isMobile ? 'Teilnehmer auswählen:' : 'Oder manuell auswählen:'}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Frau auswählen</InputLabel>
                <Select
                  value={matchboxForm.woman}
                  label="Frau auswählen"
                  onChange={(e) => setMatchboxForm({...matchboxForm, woman: e.target.value})}
                >
                  {women.map(woman => (
                    <MenuItem key={woman.id} value={woman.name || ''}>
                      {woman.name || 'Unbekannt'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Mann auswählen</InputLabel>
                <Select
                  value={matchboxForm.man}
                  label="Mann auswählen"
                  onChange={(e) => setMatchboxForm({...matchboxForm, man: e.target.value})}
                >
                  {men.map(man => (
                    <MenuItem key={man.id} value={man.name || ''}>
                      {man.name || 'Unbekannt'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Match-Typ</InputLabel>
              <Select
                value={matchboxForm.matchType}
                label="Match-Typ"
                onChange={(e) => setMatchboxForm({...matchboxForm, matchType: e.target.value as 'perfect' | 'no-match' | 'sold'})}
              >
                <MenuItem value="perfect">Perfect Match</MenuItem>
                <MenuItem value="no-match">No Match</MenuItem>
                <MenuItem value="sold">Verkauft</MenuItem>
              </Select>
            </FormControl>

            {matchboxForm.matchType === 'sold' && (
              <>
                <TextField
                  fullWidth
                  label="Preis (€)"
                  type="number"
                  value={matchboxForm.price}
                  onChange={(e) => setMatchboxForm({...matchboxForm, price: parseFloat(e.target.value) || 0})}
                />
                <TextField
                  fullWidth
                  label="Käufer"
                  value={matchboxForm.buyer}
                  onChange={(e) => setMatchboxForm({...matchboxForm, buyer: e.target.value})}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setMatchboxDialog(false); resetMatchboxForm();}}>Abbrechen</Button>
          <Button onClick={saveMatchbox} variant="contained" startIcon={<SaveIcon />}>
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  )
}

// ** Wrapped Component with Theme
const OverviewWithTheme: React.FC = () => {
  return (
    <ThemeProvider>
      <OverviewMUI />
    </ThemeProvider>
  )
}

export default OverviewWithTheme
