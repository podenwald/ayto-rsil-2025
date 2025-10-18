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
  LinearProgress
} from '@mui/material'
import { useDeviceDetection, lockTabletOrientation, lockSmartphoneOrientation } from '@/lib/deviceDetection'
import MenuLayout from '@/components/layout/MenuLayout'
import {
  Favorite as FavoriteIcon,
  Woman as WomanIcon,
  Man as ManIcon,
  LightMode as LightModeIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import ThemeProvider from '@/theme/ThemeProvider'
import { db, type Participant, type MatchingNight, type Matchbox, type Penalty } from '@/lib/db'
import { loadAllJsonData } from '@/services/jsonDataService'
import { 
  isPairConfirmedAsPerfectMatch,
  getValidPerfectMatchesBeforeDateTime,
  getMatchboxBroadcastDateTime
} from '@/utils/broadcastUtils'
import { useProbabilityCalculation } from '@/hooks/useProbabilityCalculation'
import { MatchboxService } from '@/services/matchboxService'
import { MatchingNightService } from '@/services/matchingNightService'

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
  const [tooltipOpen, setTooltipOpen] = React.useState(false)
  
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

  // Handle click to toggle tooltip on mobile
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setTooltipOpen(!tooltipOpen)
  }

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
      enterTouchDelay={0}
      leaveTouchDelay={3000}
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
        sx={{ 
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
      enterTouchDelay={0}
      leaveTouchDelay={3000}
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
                  <WomanIcon sx={{ fontSize: '20px' }} />
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
                  <ManIcon sx={{ fontSize: '20px' }} />
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
                  icon={<LightModeIcon />}
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
              const isConfirmedPerfectMatch = isPairConfirmedAsPerfectMatch(pair, matchingNight, matchboxes)
              
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


// Helper function to calculate statistics
const calculateStatistics = (matchboxes: Matchbox[], matchingNights: MatchingNight[], penalties: Penalty[]) => {
  const perfectMatches = matchboxes.filter(mb => mb.matchType === 'perfect')
  
  // Calculate penalties and credits
  const totalPenalties = penalties
    .filter(penalty => penalty.amount < 0)
    .reduce((sum, penalty) => sum + Math.abs(penalty.amount), 0)
  const totalCredits = penalties
    .filter(penalty => penalty.amount > 0)
    .reduce((sum, penalty) => sum + penalty.amount, 0)
  
  // Get starting budget
  const getStartingBudget = () => {
    const savedBudget = localStorage.getItem('ayto-starting-budget')
    return savedBudget ? parseInt(savedBudget, 10) : 200000
  }
  const startingBudget = getStartingBudget()
  const soldMatchboxes = matchboxes.filter(mb => mb.matchType === 'sold')
  const totalRevenue = soldMatchboxes.reduce((sum, mb) => sum + (mb.price || 0), 0)
  const currentBalance = startingBudget - totalRevenue - totalPenalties + totalCredits

  // Get latest matching night lights
  const latestMatchingNight = matchingNights
    .sort((a, b) => {
      const dateA = a.ausstrahlungsdatum ? new Date(a.ausstrahlungsdatum).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.ausstrahlungsdatum ? new Date(b.ausstrahlungsdatum).getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    })[0]
  const currentLights = latestMatchingNight?.totalLights || 0
  
  // Debug-Ausgabe für Lichter-Berechnung
  console.log('🔍 Frontend Lichter-Debug:', {
    matchingNightsCount: matchingNights.length,
    latestMatchingNight: latestMatchingNight?.name,
    latestMatchingNightLights: latestMatchingNight?.totalLights,
    currentLights,
    allMatchingNights: matchingNights.map(mn => ({ name: mn.name, lights: mn.totalLights, date: mn.ausstrahlungsdatum || mn.createdAt }))
  })

  return {
    matchingNightsCount: matchingNights.length,
    currentLights,
    perfectMatchesCount: perfectMatches.length,
    currentBalance
  }
}


// ** Main Overview Component
const OverviewMUI: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matchingNights, setMatchingNights] = useState<MatchingNight[]>([])
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([])
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [expandedMatchingNights, setExpandedMatchingNights] = useState<Set<number>>(new Set())
  
  // Wahrscheinlichkeits-Berechnung Hook
  const { result: probabilityResult, status: probabilityStatus, triggerCalculation, clearCache: clearProbabilityCache } = useProbabilityCalculation()

  // Benutzer-Lösungs-Matrix State
  const [userSolution, setUserSolution] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    loadAllData()
  }, [])

  // Lade gespeicherte Benutzer-Lösung
  useEffect(() => {
    const savedSolution = localStorage.getItem('userSolution')
    if (savedSolution) {
      try {
        setUserSolution(JSON.parse(savedSolution))
      } catch (error) {
        console.error('Fehler beim Laden der gespeicherten Lösung:', error)
      }
    }
  }, [])
  
  // Trigger probability calculation when switching to probability tab
  useEffect(() => {
    console.log('🔍 useEffect Wahrscheinlichkeit:', {
      activeTab,
      probabilityResult: !!probabilityResult,
      isCalculating: probabilityStatus.isCalculating
    })
    
    if (activeTab === 3 && !probabilityResult && !probabilityStatus.isCalculating) {
      console.log('▶️ Starte Wahrscheinlichkeits-Berechnung...')
      triggerCalculation()
    }
  }, [activeTab, probabilityResult, probabilityStatus.isCalculating, triggerCalculation])

  const loadAllData = async () => {
    try {
      // Lade Daten direkt aus IndexedDB
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
      
      console.log('✅ Frontend: Daten direkt aus IndexedDB geladen')
    } catch (error) {
      console.error('❌ Fehler beim Laden der Frontend-Daten aus IndexedDB:', error)
    }
  }

  const toggleMatchingNight = (id: number) => {
    const newExpanded = new Set(expandedMatchingNights)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedMatchingNights(newExpanded)
  }



  // Handler functions for MenuLayout
  const handleCreateMatchbox = () => {
    setMatchboxDialog(true)
  }

  const handleCreateMatchingNight = () => {
    resetMatchingNightFormWithPerfectMatches()
    setMatchingNightDialog(true)
  }

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
    pairs: [] as Array<{woman: string, man: string}>,
    ausstrahlungsdatum: '',
    ausstrahlungszeit: ''
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
  // Only includes Perfect Matches that were aired BEFORE the current matching night
  const getAutoPlaceablePerfectMatches = () => {
    return getValidPerfectMatchesBeforeDateTime(matchboxes, new Date())
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
      totalLights: perfectMatches.length, // Auto-set lights for Perfect Matches
      ausstrahlungsdatum: '',
      ausstrahlungszeit: ''
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
    buyer: '',
    ausstrahlungsdatum: '',
    ausstrahlungszeit: ''
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

  // Helper functions - Zeige alle aktiven Teilnehmer (inkl. Perfect Matches)
  const women = participants.filter(p => 
    p.gender === 'F' && 
    (p.status === 'Aktiv' || p.status === 'aktiv' || p.status === 'Perfekt Match')
  )
  const men = participants.filter(p => 
    p.gender === 'M' && 
    (p.status === 'Aktiv' || p.status === 'aktiv' || p.status === 'Perfekt Match')
  )
  
  // Get available participants (excluding perfect matches for new matchboxes)
  const availableWomen = women.filter(woman => 
    !matchboxes.some(mb => mb.matchType === 'perfect' && mb.woman === woman.name)
  )
  const availableMen = men.filter(man => 
    !matchboxes.some(mb => mb.matchType === 'perfect' && mb.man === man.name)
  )

  // Get pair probabilities from calculation result or use empty matrix
  const pairProbabilities: Record<string, Record<string, number>> = probabilityResult?.probabilityMatrix || {}
  
  // Helper: Check if participant has a perfect match (nur ausgestrahlte Matchboxes)
  const hasConfirmedPerfectMatch = (participantName: string, gender: 'M' | 'F') => {
    const now = new Date()
    return matchboxes.some(mb => {
      // Nur Perfect Matches berücksichtigen
      if (mb.matchType !== 'perfect') return false
      
      // Nur wenn die richtige Person betroffen ist
      const isCorrectParticipant = gender === 'F' ? mb.woman === participantName : mb.man === participantName
      if (!isCorrectParticipant) return false
      
      // Nur Matchboxes mit gültigen Ausstrahlungsdaten berücksichtigen
      if (!mb.ausstrahlungsdatum || !mb.ausstrahlungszeit) return false
      
      // Prüfe, ob bereits ausgestrahlt
      try {
        const broadcastDate = getMatchboxBroadcastDateTime(mb)
        return broadcastDate <= now
      } catch {
        return false
      }
    })
  }
  
  // Helper: Get perfect match partner name (nur ausgestrahlte Matchboxes)
  const getPerfectMatchPartner = (participantName: string, gender: 'M' | 'F'): string | null => {
    const now = new Date()
    const match = matchboxes.find(mb => {
      // Nur Perfect Matches berücksichtigen
      if (mb.matchType !== 'perfect') return false
      
      // Nur wenn die richtige Person betroffen ist
      const isCorrectParticipant = gender === 'F' ? mb.woman === participantName : mb.man === participantName
      if (!isCorrectParticipant) return false
      
      // Nur Matchboxes mit gültigen Ausstrahlungsdaten berücksichtigen
      if (!mb.ausstrahlungsdatum || !mb.ausstrahlungszeit) return false
      
      // Prüfe, ob bereits ausgestrahlt
      try {
        const broadcastDate = getMatchboxBroadcastDateTime(mb)
        return broadcastDate <= now
      } catch {
        return false
      }
    })
    return match ? (gender === 'F' ? match.man : match.woman) : null
  }

  // Helper: Check if pair was in a "Perfect Light" Matching Night (alle Lichter angegangen)
  const isPairInPerfectLightMatchingNight = (womanName: string, manName: string): boolean => {
    const now = new Date()
    return matchingNights.some(mn => {
      // Nur ausgestrahlte Matching Nights berücksichtigen
      if (mn.ausstrahlungsdatum && mn.ausstrahlungszeit) {
        try {
          const broadcastDate = new Date(`${mn.ausstrahlungsdatum}T${mn.ausstrahlungszeit}`)
          if (broadcastDate > now) return false
        } catch {
          return false
        }
      }
      
      // Prüfe ob alle Lichter angegangen sind (z.B. 10 von 10)
      const maxPairs = 10 // Maximale Anzahl Paare
      const isPerfectLight = mn.totalLights === maxPairs && mn.pairs.length === maxPairs
      
      if (!isPerfectLight) return false
      
      // Prüfe ob dieses Paar in dieser Matching Night war
      return mn.pairs.some(pair => pair.woman === womanName && pair.man === manName)
    })
  }

  // Helper: Check if a match is definitively excluded (by box decisions OR perfect match logic)
  const isDefinitivelyExcluded = (womanName: string, manName: string): boolean => {
    // 1. Direkt ausgeschlossen durch Box-Entscheidung
    const excludedByBox = matchboxes.some(mb => 
      mb.matchType === 'no-match' && 
      mb.woman === womanName && 
      mb.man === manName
    )
    
    // 2. Ausgeschlossen durch Perfect Match Logik:
    // Wenn eine Person bereits ein Perfect Match hat, sind alle anderen Matches unmöglich
    const womanHasPerfectMatch = hasConfirmedPerfectMatch(womanName, 'F')
    const manHasPerfectMatch = hasConfirmedPerfectMatch(manName, 'M')
    const womanPerfectPartner = getPerfectMatchPartner(womanName, 'F')
    const manPerfectPartner = getPerfectMatchPartner(manName, 'M')
    
    // Wenn beide bereits Perfect Matches haben, aber nicht miteinander
    const excludedByPerfectMatch = (womanHasPerfectMatch && womanPerfectPartner !== manName) ||
                                  (manHasPerfectMatch && manPerfectPartner !== womanName)
    
  // Debug-Logging entfernt für Build-Stabilität
    
    return excludedByBox || excludedByPerfectMatch
  }

  // (entfernt) getOtherPartnerNights – Quadrate für andere Partner werden nicht mehr angezeigt

  // Helper: Find ALL matching nights where participants sat together (including before they became Perfect Match)
  const getAllMatchingNightsTogether = (womanName: string, manName: string): { nightNumbers: number[], allLights: number[] } => {
    const sortedNights = [...matchingNights].sort((a, b) => {
      const dateA = a.ausstrahlungsdatum ? new Date(a.ausstrahlungsdatum) : new Date(a.createdAt)
      const dateB = b.ausstrahlungsdatum ? new Date(b.ausstrahlungsdatum) : new Date(b.createdAt)
      return dateA.getTime() - dateB.getTime()
    })
    
    const nightNumbers: number[] = []
    const allLights: number[] = []
    
    for (let i = 0; i < sortedNights.length; i++) {
      const night = sortedNights[i]
      const pairExists = night.pairs.some(pair => 
        pair.woman === womanName && pair.man === manName
      )
      if (pairExists) {
        nightNumbers.push(i + 1)
        allLights.push(night.totalLights || 0)
      }
    }
    
    return { nightNumbers, allLights }
  }

  // Admin functions
  const saveMatchingNight = async () => {
    try {
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
      // Only count Perfect Matches that were aired BEFORE this matching night
      const currentMatchingNightDate = new Date()
      const perfectMatchLights = completePairs.filter(pair => 
        matchboxes.some(mb => {
          if (mb.matchType !== 'perfect' || mb.woman !== pair.woman || mb.man !== pair.man) {
            return false
          }
          
          // Use centralized broadcast utility
          return getMatchboxBroadcastDateTime(mb).getTime() < currentMatchingNightDate.getTime()
        })
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

      const autoGeneratedName = `Matching Night #${matchingNights.length + 1}`
      
      // Verwende den MatchingNightService für die Erstellung
      await MatchingNightService.createMatchingNight({
        name: autoGeneratedName,
        date: new Date().toISOString().split('T')[0],
        totalLights: matchingNightForm.totalLights,
        pairs: completePairs
      })

      setSnackbar({ open: true, message: `Matching Night "${autoGeneratedName}" mit allen 10 Paaren wurde erfolgreich erstellt!`, severity: 'success' })
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

      // Check if this pair already exists as a Perfect Match
      if (matchboxForm.matchType === 'perfect') {
        const existingPerfectMatch = matchboxes.find(mb => 
          mb.matchType === 'perfect' && 
          mb.woman === matchboxForm.woman && 
          mb.man === matchboxForm.man
        )
        if (existingPerfectMatch) {
          setSnackbar({ open: true, message: 'Dieses Paar ist bereits als Perfect Match bestätigt!', severity: 'error' })
          return
        }
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

      // Verwende den MatchboxService für die Erstellung
      await MatchboxService.createMatchbox({
        ...matchboxForm,
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
      pairs: [],
      ausstrahlungsdatum: '',
      ausstrahlungszeit: ''
    })
    setPlacedParticipants(new Set())
  }

  const resetMatchingNightFormWithPerfectMatches = () => {
    setMatchingNightForm({
      name: '',
      totalLights: 0,
      pairs: [],
      ausstrahlungsdatum: '',
      ausstrahlungszeit: ''
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
      buyer: '',
      ausstrahlungsdatum: '',
      ausstrahlungszeit: ''
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

  // Erweiterte Geräteerkennung
  const deviceInfo = useDeviceDetection()
  const isMobile = deviceInfo.isSmartphone // Nur Smartphones gelten als "mobile"
  
  // Geräte-spezifische Rotation-Locks aktivieren
  useEffect(() => {
    if (deviceInfo.isTablet) {
      lockTabletOrientation()
    } else if (deviceInfo.isSmartphone) {
      lockSmartphoneOrientation()
    }
  }, [deviceInfo.isTablet, deviceInfo.isSmartphone])
  // Calculate statistics for the menu
  const statistics = calculateStatistics(matchboxes, matchingNights, penalties)

  return (
    <MenuLayout
      activeTab={activeTab === 0 ? 'overview' : activeTab === 1 ? 'matching-nights' : activeTab === 2 ? 'matchbox' : 'probabilities'}
      onTabChange={(tab) => {
        if (tab === 'overview') setActiveTab(0)
        else if (tab === 'matching-nights') setActiveTab(1)
        else if (tab === 'matchbox') setActiveTab(2)
        else if (tab === 'probabilities') setActiveTab(3)
      }}
      onCreateMatchbox={handleCreateMatchbox}
      onCreateMatchingNight={handleCreateMatchingNight}
      matchingNightsCount={statistics.matchingNightsCount}
      currentLights={statistics.currentLights}
      perfectMatchesCount={statistics.perfectMatchesCount}
      currentBalance={statistics.currentBalance}
    >

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
                          <WomanIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
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
                          <ManIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
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

            

            {/* Participants by Gender */}
            {participants.length === 0 ? (
              <Alert severity="info">
                {'Noch keine Teilnehmer vorhanden'}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Women Section */}
                {participants.filter(p => p.gender === 'F').length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <WomanIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        Frauen ({participants.filter(p => p.gender === 'F').length})
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 3,
                      justifyContent: 'flex-start'
                    }}>
                      {participants
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
                {participants.filter(p => p.gender === 'M').length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <ManIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Männer ({participants.filter(p => p.gender === 'M').length})
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 3,
                      justifyContent: 'flex-start'
                    }}>
                      {participants
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

            
          </TabPanel>

          {/* Matching Nights Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Matching Nights
              </Typography>
            </Box>
            
            {/* Matching Nights List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {matchingNights.map((matchingNight) => (
                      <MatchingNightCard
                        key={matchingNight.id}
                        matchingNight={matchingNight}
                        participants={participants}
                        matchboxes={matchboxes}
                  expanded={expandedMatchingNights.has(matchingNight.id || 0)}
                  onToggle={() => toggleMatchingNight(matchingNight.id || 0)}
                      />
              ))}
            </Box>
          </TabPanel>

          {/* Matchbox Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Matchboxes ({matchboxes.length})
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
                      matchbox.matchType === 'sold' && matchbox.price ? `${matchbox.price.toLocaleString('de-DE')} €` : null,
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
          <TabPanel value={activeTab} index={3}>
            {/* Error Message */}
            {probabilityStatus.error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {probabilityStatus.error}
              </Alert>
            )}

            {/* Warning: Missing Broadcast Data */}
                    {(() => {
              const matchboxesWithoutBroadcast = matchboxes.filter(mb => 
                !mb.ausstrahlungsdatum || !mb.ausstrahlungszeit
              )
              const matchingNightsWithoutBroadcast = matchingNights.filter(mn => 
                !mn.ausstrahlungsdatum || !mn.ausstrahlungszeit
              )
              
              if (matchboxesWithoutBroadcast.length > 0 || matchingNightsWithoutBroadcast.length > 0) {
                return (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <strong>Fehlende Ausstrahlungsdaten:</strong>
                    {matchboxesWithoutBroadcast.length > 0 && (
                      <div>
                        • {matchboxesWithoutBroadcast.length} Matchbox{matchboxesWithoutBroadcast.length > 1 ? 'en' : ''} ohne Ausstrahlungsdatum/-zeit 
                        (werden nicht in der Matrix berücksichtigt)
                      </div>
                    )}
                    {matchingNightsWithoutBroadcast.length > 0 && (
                      <div>
                        • {matchingNightsWithoutBroadcast.length} Matching Night{matchingNightsWithoutBroadcast.length > 1 ? 's' : ''} ohne Ausstrahlungsdatum/-zeit 
                        (verwenden Erstellungsdatum als Fallback)
                      </div>
                    )}
                    <div style={{ marginTop: '8px' }}>
                      → Bitte Ausstrahlungsdaten im <strong>Admin-Panel → Ausstrahlungsplan</strong> vervollständigen.
                    </div>
                  </Alert>
                )
              }
              return null
                    })()}

            {/* Heatmap Matrix */}
            <Card sx={{ height: 'fit-content', mb: 3 }}>
                <CardHeader 
                  title="Wahrscheinlichkeits-Matrix"
                  subheader="Heatmap aller Paar-Kombinationen"
                  action={
                    <Button
                      variant="contained"
                      onClick={async () => {
                        if (probabilityResult) {
                          console.log('🗑️ Lösche Cache vor Neuberechnung...')
                          await clearProbabilityCache()
                        }
                        triggerCalculation()
                      }}
                      disabled={probabilityStatus.isCalculating}
                    >
                      {probabilityResult ? 'Neu berechnen' : 'Berechnen'}
                    </Button>
                  }
                />
                
                {/* Progress Bar */}
                {probabilityStatus.isCalculating && (
                  <Box sx={{ mx: 2, mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={probabilityStatus.progress} 
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {probabilityStatus.progress}% - {probabilityStatus.currentStep}
                  </Typography>
                  </Box>
                )}
                
                {/* Calculation Info */}
                {probabilityResult && !probabilityStatus.isCalculating && (
                  <Alert severity="info" sx={{ mx: 2, mt: 2 }}>
                    Berechnung abgeschlossen: {probabilityResult.totalValidMatchings.toLocaleString()} gültige Kombinationen gefunden 
                    in {(probabilityResult.calculationTime / 1000).toFixed(2)}s
                    {probabilityResult.limitReached && ' (Limit erreicht)'}
                    {probabilityResult.fixedPairs.length > 0 && ` • ${probabilityResult.fixedPairs.length} fixierte Paare`}
                  </Alert>
                )}
                
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Box sx={{ overflow: 'visible' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                        <TableCell sx={{ 
                          fontWeight: 'bold',
                          bgcolor: 'white',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}></TableCell>
                          {men.map(man => {
                            const hasPerfectMatch = hasConfirmedPerfectMatch(man.name!, 'M')
                            const partner = getPerfectMatchPartner(man.name!, 'M')
                            return (
                            <TableCell key={man.id} sx={{ 
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              minWidth: '80px',
                              textAlign: 'center',
                              verticalAlign: 'top',
                              p: 1,
                              bgcolor: 'white',
                              border: '1px solid',
                              borderColor: 'divider'
                          }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Avatar 
                                src={man.photoUrl}
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.9rem',
                                  bgcolor: 'white',
                                  border: hasPerfectMatch ? '2px solid' : '1px solid',
                                  borderColor: hasPerfectMatch ? 'success.dark' : 'grey.300'
                                }}
                              >
                                {man.name?.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.9rem',
                                lineHeight: 1,
                                textAlign: 'center',
                                wordBreak: 'break-word',
                                color: 'black',
                                fontWeight: hasPerfectMatch ? 'bold' : 'normal'
                            }}>
                              {man.name?.substring(0, 8)}
                  </Typography>
                              {hasPerfectMatch && partner && (
                                <Typography variant="caption" sx={{ 
                                  fontSize: '0.7rem',
                                  color: 'success.dark',
                                  fontWeight: 'bold'
                                }}>
                                  ↔ {partner.substring(0, 6)}
                  </Typography>
                              )}
                            </Box>
                            </TableCell>
                            )
                          })}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {women.map(woman => {
                          const womanHasPerfectMatch = hasConfirmedPerfectMatch(woman.name!, 'F')
                          const womanPartner = getPerfectMatchPartner(woman.name!, 'F')
                          return (
                          <TableRow key={woman.id}>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem',
                              width: '1%',
                              whiteSpace: 'nowrap',
                              p: 1,
                              bgcolor: 'white',
                              border: '1px solid',
                              borderColor: 'divider',
                              textAlign: 'right'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.9rem',
                                lineHeight: 1,
                                wordBreak: 'break-word',
                                  color: 'black',
                                  fontWeight: womanHasPerfectMatch ? 'bold' : 'normal'
                            }}>
                              {woman.name?.substring(0, 10)}
                  </Typography>
                                {womanHasPerfectMatch && womanPartner && (
                                  <Typography variant="caption" sx={{ 
                                    fontSize: '0.7rem',
                                    color: 'success.dark',
                                    fontWeight: 'bold'
                                  }}>
                                    ↔ {womanPartner.substring(0, 6)}
                  </Typography>
                                )}
      </Box>
                              <Avatar 
                                src={woman.photoUrl}
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.9rem',
                                  bgcolor: 'white',
                                  border: womanHasPerfectMatch ? '2px solid' : '1px solid',
                                  borderColor: womanHasPerfectMatch ? 'success.dark' : 'grey.300'
                                }}
                              >
                                {woman.name?.charAt(0)}
                              </Avatar>
                            </Box>
                            </TableCell>
                            {men.map(man => {
                              const probability = pairProbabilities[woman.name!]?.[man.name!] || 0
                              const percentage = Math.round(probability * 100)
                              
                              // Prüfe zusätzlich, ob es ein bestätigter Perfect Match ist
                              const isConfirmedPerfectMatch = percentage === 100 || 
                                (hasConfirmedPerfectMatch(woman.name!, 'F') && 
                                 hasConfirmedPerfectMatch(man.name!, 'M') && 
                                 getPerfectMatchPartner(woman.name!, 'F') === man.name!) ||
                                isPairInPerfectLightMatchingNight(woman.name!, man.name!)
                              
                              // Prüfe, ob es definitiv ausgeschlossen ist (durch Box-Entscheidungen)
                              const isDefinitelyExcluded = isDefinitivelyExcluded(woman.name!, man.name!)
                              
                              // Prüfe, ob das Paar bereits in einer Matching Night zusammensaß (Ergebnis wird unten dargestellt)
                              // const matchingNightInfo = getMatchingNightInfo(woman.name!, man.name!)
                              
                              // Für alle Paare: Zeige ALLE Matching Nights, in denen sie zusammensaßen
                              const allMatchingNightsTogether = getAllMatchingNightsTogether(woman.name!, man.name!)

                              // Andere Partner-Nächte nicht mehr visualisieren
                              
                              return (
                                <TableCell 
                                  key={`${woman.id}-${man.id}`}
                                  sx={{ 
                                    bgcolor: 'white',  // Alle Felder weiß
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.5rem',  // Alle Felder gleich groß
                                    color: isConfirmedPerfectMatch ? 'success.main' :     // Perfect Match = Grün
                                           isDefinitelyExcluded ? 'error.main' :          // Definitiv ausgeschlossen = Rot
                                           'text.secondary',                               // Andere = Grau
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    minWidth: '40px',
                                    maxWidth: '50px',
                                    width: '45px',
                                    height: '45px',
                                    p: 0.25,
                                    '&:hover': {
                                      bgcolor: 'grey.50',
                                      transform: 'scale(1.02)'
                                    },
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                  }}
                                  title={`${woman.name} & ${man.name}: ${isConfirmedPerfectMatch ? '100' : percentage}%${
                                    isConfirmedPerfectMatch ? 
                                      allMatchingNightsTogether.nightNumbers.length > 0 ?
                                        ` (PERFECT MATCH ✓ - Matching Nights: ${allMatchingNightsTogether.nightNumbers.map((num: number, idx: number) => `#${num} (${allMatchingNightsTogether.allLights[idx]} Lichter)`).join(', ')})` :
                                        ' (PERFECT MATCH ✓)' : 
                                    isDefinitelyExcluded ? ' (DEFINITIV AUSGESCHLOSSEN ✗)' : 
                                    allMatchingNightsTogether.nightNumbers.length > 0 ? ` (Matching Nights: ${allMatchingNightsTogether.nightNumbers.map((num: number, idx: number) => `#${num} (${allMatchingNightsTogether.allLights[idx]} Lichter)`).join(', ')})` : ''
                                  }`}
                                >
                                  {/* Oberer Teil: Symbol */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    minHeight: '24px',
                                    borderBottom: allMatchingNightsTogether.nightNumbers.length > 0 ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                    pb: allMatchingNightsTogether.nightNumbers.length > 0 ? 0.5 : 0
                                  }}>
                                    {isConfirmedPerfectMatch ? '💚' : 
                                     isDefinitelyExcluded ? '✗' : 
                                     '?'}
                                  </Box>
                                  
                                  {/* Unterer Teil: Matching Night Informationen */}
                                  {allMatchingNightsTogether.nightNumbers.length > 0 && (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      flexDirection: 'column',
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      pt: 0.5,
                                      minHeight: '20px'
                                    }}>
                                      <Typography variant="caption" sx={{ 
                                        fontSize: '0.6rem', 
                                        lineHeight: 1.2, 
                                        color: isConfirmedPerfectMatch ? 'success.main' : 'info.main',
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                      }}>
                                        {allMatchingNightsTogether.nightNumbers.map((nightNum: number, idx: number) => 
                                          `#${nightNum}(${allMatchingNightsTogether.allLights[idx]})`
                                        ).join(' ')}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {/* Andere Partner Quadrate entfernt */}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                  
                  {/* Legende */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Legende:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, border: '1px solid', borderColor: 'divider', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                          💚
                        </Box>
                        <Typography variant="caption">100% Perfect Match</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'error.main', fontWeight: 'bold' }}>
                          ✗
                        </Box>
                        <Typography variant="caption">0% Definitiv ausgeschlossen</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.6rem', 
                          color: 'info.main',
                          fontWeight: 'bold',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '2px',
                          px: 0.5,
                          py: 0.25
                        }}>
                          #0(0)
                        </Typography>
                        <Typography variant="caption">Matching Night (Night & Lichter)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'text.secondary', fontWeight: 'bold' }}>
                          ?
                        </Box>
                        <Typography variant="caption">Unbekannte Wahrscheinlichkeit</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

            {/* Benutzer-Lösungs-Matrix */}
            <Card sx={{ height: 'fit-content', mb: 3 }}>
                <CardHeader 
                  title="Meine Lösung"
                  subheader="Trage hier deine eigene Lösung ein"
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Lösungs-Matrix zurücksetzen
                          const newSolution: Record<string, Record<string, string>> = {}
                          women.forEach(woman => {
                            newSolution[woman.name!] = {}
                            men.forEach(man => {
                              newSolution[woman.name!][man.name!] = ''
                            })
                          })
                          setUserSolution(newSolution)
                        }}
                      >
                        Zurücksetzen
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          // Lösungs-Matrix speichern
                          localStorage.setItem('userSolution', JSON.stringify(userSolution))
                          setSnackbar({ open: true, message: 'Lösung gespeichert!', severity: 'success' })
                        }}
                      >
                        Speichern
                      </Button>
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
                              fontSize: '1rem',
                            minWidth: '80px',
                              textAlign: 'center',
                              height: '80px',
                            verticalAlign: 'bottom',
                              p: 1,
                              bgcolor: 'white'
                          }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Avatar 
                                src={man.photoUrl}
                                sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    fontSize: '1rem',
                                    border: '2px solid',
                                    borderColor: 'primary.main'
                                }}
                              >
                                {man.name?.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" sx={{ 
                                  fontSize: '1rem',
                                lineHeight: 1,
                                wordBreak: 'break-word',
                                  color: 'black',
                                  fontWeight: 'bold'
                            }}>
                                  {man.name?.substring(0, 10)}
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
                              fontSize: '1rem',
                            minWidth: '100px',
                              p: 1,
                              bgcolor: 'white'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography variant="caption" sx={{ 
                                    fontSize: '1rem',
                                lineHeight: 1,
                                wordBreak: 'break-word',
                                    color: 'black',
                                    fontWeight: 'bold'
                            }}>
                              {woman.name?.substring(0, 10)}
                              </Typography>
                                </Box>
                              <Avatar 
                                src={woman.photoUrl}
                                sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    fontSize: '1rem',
                                    border: '2px solid',
                                    borderColor: 'primary.main'
                                }}
                              >
                                {woman.name?.charAt(0)}
                              </Avatar>
                            </Box>
                            </TableCell>
                            {men.map(man => (
                                <TableCell 
                                  key={`${woman.id}-${man.id}`}
                                  sx={{ 
                                  bgcolor: 'white',
                                    textAlign: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '1.2rem',
                                    cursor: 'pointer',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  minWidth: 60,
                                  height: 40,
                                  p: 0.5,
                                  color: userSolution[woman.name!]?.[man.name!] === '✓' ? 'success.main' :
                                         userSolution[woman.name!]?.[man.name!] === '✗' ? 'error.main' :
                                         'text.primary'
                                }}
                                onClick={() => {
                                  // Toggle zwischen verschiedenen Zuständen
                                  const currentValue = userSolution[woman.name!]?.[man.name!] || ''
                                  const states = ['', '✓', '✗', '?']
                                  const currentIndex = states.indexOf(currentValue)
                                  const nextIndex = (currentIndex + 1) % states.length
                                  const nextValue = states[nextIndex]
                                  
                                  setUserSolution(prev => ({
                                    ...prev,
                                    [woman.name!]: {
                                      ...prev[woman.name!],
                                      [man.name!]: nextValue
                                    }
                                  }))
                                }}
                                title={`${woman.name} & ${man.name}: ${userSolution[woman.name!]?.[man.name!] || 'Leer'} - Klicken zum Wechseln`}
                              >
                                {userSolution[woman.name!]?.[man.name!] || ''}
                                </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                  
                  {/* Legende für die Benutzer-Matrix */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Legende:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 20, 
                          height: 20, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: 'success.main'
                        }}>
                          ✓
                        </Box>
                        <Typography variant="caption">Perfect Match</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 20, 
                          height: 20, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: 'error.main'
                        }}>
                          ✗
                        </Box>
                        <Typography variant="caption">Kein Match</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 20, 
                          height: 20, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          ?
                        </Box>
                        <Typography variant="caption">Unsicher</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 20, 
                          height: 20, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          
                        </Box>
                        <Typography variant="caption">Leer</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Klicke auf eine Zelle, um zwischen den Zuständen zu wechseln
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

          </TabPanel>
        </Card>



      {/* Matching Night Dialog */}
      <Dialog open={matchingNightDialog} onClose={() => setMatchingNightDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ width: '100%' }}>Neue Matching Night erstellen</Typography>
              {!isMobile && (
                <Typography variant="body2" color="text.secondary">
                  🎯 Ziehe Teilnehmer direkt in die Pärchen-Container
                </Typography>
              )}
            </Box>
            {!isMobile && (
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
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                color: 'text.primary',
                fontSize: isMobile ? '18px' : '16px',
                textAlign: 'center'
              }}>
                {matchingNightForm.name}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Lichter:
                  </Typography>
                  <TextField
                    fullWidth={false}
                    label="Lichter (max. 10)"
                    type="number"
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        width: '60px !important',
                        minWidth: '60px !important',
                        maxWidth: '60px !important',
                        fontSize: '16px !important',
                        padding: '16px 14px !important'
                      },
                      '& .MuiOutlinedInput-root': {
                        width: '100px !important',
                        minWidth: '100px !important',
                        maxWidth: '100px !important'
                      }
                    }}
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
                </Box>
                
                {/* Visual Light Dots */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

            {/* Drag & Drop Pairs Grid - nur auf Desktop */}
            {!isMobile && (
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
            )}

            {/* Manuelle Paar-Auswahl - mobil */}
            {isMobile && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Pärchen zusammenstellen
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: 10 }, (_, index) => {
                  const pair = matchingNightForm.pairs[index] || { woman: '', man: '' }
                  const isPerfectMatch = matchboxes.some(mb => 
                    mb.matchType === 'perfect' && 
                    mb.woman === pair.woman && 
                    mb.man === pair.man
                  )
                  return (
                    <Card key={index} sx={{ p: 2, bgcolor: isPerfectMatch ? 'warning.50' : 'grey.50' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 60 }}>
                          Paar {index + 1}
                        </Typography>
                        {isPerfectMatch && (
                          <Chip label="Perfect Match" color="warning" size="small" />
                        )}
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Frau</InputLabel>
                          <Select
                            value={pair.woman}
                            label="Frau"
                            disabled={isPerfectMatch}
                            sx={isMobile ? {
                              '& .MuiFormControl-root': {
                                width: '100% !important'
                              },
                              '& .MuiInputBase-input': {
                                width: '100% !important',
                                minWidth: '100% !important'
                              }
                            } : {}}
                            onChange={(e) => {
                              const newPairs = [...matchingNightForm.pairs]
                              if (!newPairs[index]) newPairs[index] = { woman: '', man: '' }
                              newPairs[index].woman = e.target.value
                              setMatchingNightForm({...matchingNightForm, pairs: newPairs})
                            }}
                          >
                            <MenuItem value="">
                              <em>Keine Auswahl</em>
                            </MenuItem>
                            {women.map((woman) => {
                              const isUsed = matchingNightForm.pairs.some((p, i) => i !== index && p.woman === woman.name)
                              return (
                                <MenuItem key={woman.id} value={woman.name} disabled={isUsed || isPerfectMatch}>
                                  {woman.name} {isUsed && '(bereits verwendet)'} {isPerfectMatch && '(Perfect Match - gesperrt)'}
                                </MenuItem>
                              )
                            })}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth>
                          <InputLabel>Mann</InputLabel>
                          <Select
                            value={pair.man}
                            label="Mann"
                            disabled={isPerfectMatch}
                            sx={isMobile ? {
                              '& .MuiFormControl-root': {
                                width: '100% !important'
                              },
                              '& .MuiInputBase-input': {
                                width: '100% !important',
                                minWidth: '100% !important'
                              }
                            } : {}}
                            onChange={(e) => {
                              const newPairs = [...matchingNightForm.pairs]
                              if (!newPairs[index]) newPairs[index] = { woman: '', man: '' }
                              newPairs[index].man = e.target.value
                              setMatchingNightForm({...matchingNightForm, pairs: newPairs})
                            }}
                          >
                            <MenuItem value="">
                              <em>Keine Auswahl</em>
                            </MenuItem>
                            {men.map((man) => {
                              const isUsed = matchingNightForm.pairs.some((p, i) => i !== index && p.man === man.name)
                              return (
                                <MenuItem key={man.id} value={man.name} disabled={isUsed || isPerfectMatch}>
                                  {man.name} {isUsed && '(bereits verwendet)'} {isPerfectMatch && '(Perfect Match - gesperrt)'}
                                </MenuItem>
                              )
                            })}
                          </Select>
                        </FormControl>
                      </Box>
                    </Card>
                  )
                })}
              </Box>
            </Box>
            )}

            {/* Available Participants for Drag & Drop - nur auf Desktop */}
            {!isMobile && (
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
            )}

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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Neue Matchbox erstellen
            </Typography>
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
                      <WomanIcon sx={{ fontSize: '2rem' }} />
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
                      <ManIcon sx={{ fontSize: '2rem' }} />
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
                  {availableWomen.map(woman => (
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
                  {availableMen.map(man => (
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
    </MenuLayout>
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
