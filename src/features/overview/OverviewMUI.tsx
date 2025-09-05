import React, { useEffect, useState, useRef } from 'react'
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
  TableCell
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
  Euro as EuroIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Close as CloseIcon,
  BusinessCenter as BusinessCenterIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Save as SaveIcon
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
}> = ({ participant, draggable = false, onDragStart }) => {
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
        draggable={draggable}
        onDragStart={handleDragStart}
      sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          cursor: draggable ? 'grab' : 'pointer',
          opacity: draggable ? 1 : 1,
        '&:hover': {
            '& .avatar': {
              transform: 'scale(1.1)',
              boxShadow: 4
            }
          },
          '&:active': {
            cursor: draggable ? 'grabbing' : 'pointer'
          }
        }}
      >
        <Box sx={{ position: 'relative', mb: 1 }}>
          <Avatar 
            className="avatar"
            src={hasPhoto ? participant.photoUrl : undefined}
            sx={{ 
              width: 64, 
              height: 64,
              bgcolor: hasPhoto ? undefined : genderColor,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              border: '3px solid white',
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
                  {new Date(matchingNight.date).toLocaleDateString('de-DE')}
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
              // BUT only if the matchbox was created BEFORE this matching night
              const isConfirmedPerfectMatch = matchboxes.some(mb => 
                mb.woman === pair.woman && 
                mb.man === pair.man && 
                mb.matchType === 'perfect' &&
                new Date(mb.createdAt).getTime() < new Date(matchingNight.createdAt).getTime()
              )
              
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

// ** Matchbox Card Component
const MatchboxCard: React.FC<{ matchbox: Matchbox }> = ({ matchbox }) => {
  const getMatchboxColor = () => {
    switch (matchbox.matchType) {
      case 'perfect': return 'success'
      case 'sold': return 'info'
      default: return 'error'
    }
  }

  const getMatchboxLabel = () => {
    switch (matchbox.matchType) {
      case 'perfect': return 'Perfect Match'
      case 'sold': return 'Verkauft'
      default: return 'No Match'
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: `${getMatchboxColor()}.main` }}>
              <FavoriteIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {matchbox.woman} + {matchbox.man}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(matchbox.createdAt).toLocaleDateString('de-DE')}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Chip 
              label={getMatchboxLabel()}
              color={getMatchboxColor() as any}
              size="small"
            />
          </Box>
        </Box>
        
        {matchbox.matchType === 'sold' && (
          <Box sx={{ mt: 2 }}>
            {matchbox.price && (
              <Chip 
                label={`€${matchbox.price.toLocaleString('de-DE')}`}
                color="primary"
                icon={<EuroIcon />}
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            {matchbox.buyer && (
              <Typography variant="body2" color="text.secondary">
                Käufer: {matchbox.buyer}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ** Statistics Component
const StatisticsCards: React.FC<{
  participants: Participant[]
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
  onCardClick: (type: string, data: any) => void
}> = ({ participants, matchboxes, penalties, onCardClick }) => {
  const activeParticipants = participants.filter(p => p.active !== false)
  const women = participants.filter(p => p.gender === 'F')
  const men = participants.filter(p => p.gender === 'M')
  
  const perfectMatches = matchboxes.filter(mb => mb.matchType === 'perfect')
  const soldMatchboxes = matchboxes.filter(mb => mb.matchType === 'sold')
  const totalRevenue = soldMatchboxes.reduce((sum, mb) => sum + (mb.price || 0), 0)
  
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
  const currentBalance = startingBudget - totalRevenue - totalPenalties + totalCredits

  const stats = [
    { 
      title: 'Aktive Teilnehmer', 
      value: activeParticipants.length, 
      icon: <PeopleIcon />, 
      color: 'primary',
      type: 'participants',
      data: { active: activeParticipants, inactive: participants.filter(p => p.active === false) }
    },
    { 
      title: 'Frauen', 
      value: women.length, 
      icon: <FemaleIcon />, 
      color: 'secondary',
      type: 'women',
      data: women
    },
    { 
      title: 'Männer', 
      value: men.length, 
      icon: <MaleIcon />, 
      color: 'primary',
      type: 'men',
      data: men
    },
    { 
      title: 'Perfect Matches', 
      value: perfectMatches.length, 
      icon: <FavoriteIcon />, 
      color: 'success',
      type: 'perfect-matches',
      data: perfectMatches
    },
    { 
      title: 'Verkaufte Matchboxes', 
      value: soldMatchboxes.length, 
      icon: <TrendingUpIcon />, 
      color: 'info',
      type: 'sold-matchboxes',
      data: soldMatchboxes
    },
    { 
      title: 'Kontostand', 
      value: `€${currentBalance.toLocaleString('de-DE')}`, 
      icon: <AccountBalanceIcon />, 
      color: currentBalance >= 0 ? 'success' : 'error',
      type: 'budget',
      data: { startingBudget, totalRevenue, totalPenalties, totalCredits, currentBalance, penalties }
    }
  ]

  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
      gap: 2,
      mb: 3
    }}>
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          sx={{ 
            textAlign: 'center', 
            height: '100%',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4
            }
          }}
          onClick={() => onCardClick(stat.type, stat.data)}
        >
          <CardContent sx={{ p: 2 }}>
            <Avatar sx={{ bgcolor: `${stat.color}.main`, mx: 'auto', mb: 1, width: 36, height: 36 }}>
              {stat.icon}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${stat.color}.main`, fontSize: '1.1rem' }}>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {stat.title}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

// ** Detail Dialog Component
const DetailDialog: React.FC<{
  open: boolean
  onClose: () => void
  title: string
  type: string
  data: any
}> = ({ open, onClose, title, type, data }) => {
  const renderContent = () => {
    switch (type) {
      case 'participants':
        return (
          <Box>
            <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
              Aktive Teilnehmer ({data.active.length})
            </Typography>
            <List sx={{ mb: 3 }}>
              {data.active.map((participant: Participant) => (
                <ListItem key={participant.id}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: participant.gender === 'F' ? 'secondary.main' : 'primary.main', width: 32, height: 32 }}>
                      {participant.name?.charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText primary={participant.name} secondary={`${participant.age} Jahre, ${participant.gender === 'F' ? 'Weiblich' : 'Männlich'}`} />
                </ListItem>
              ))}
            </List>
            {data.inactive.length > 0 && (
              <>
                <Typography variant="h6" color="error.main" sx={{ mb: 2 }}>
                  Inaktive Teilnehmer ({data.inactive.length})
                </Typography>
                <List>
                  {data.inactive.map((participant: Participant) => (
                    <ListItem key={participant.id}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'grey.400', width: 32, height: 32 }}>
                          {participant.name?.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText primary={participant.name} secondary={`${participant.age} Jahre, ${participant.gender === 'F' ? 'Weiblich' : 'Männlich'}`} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )
      
      case 'women':
      case 'men':
        return (
          <List>
            {data.map((participant: Participant) => (
              <ListItem key={participant.id}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: participant.gender === 'F' ? 'secondary.main' : 'primary.main', width: 32, height: 32 }}>
                    {participant.name?.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText 
                  primary={participant.name} 
                  secondary={`${participant.age} Jahre • ${participant.active !== false ? 'Aktiv' : 'Inaktiv'} • ${participant.knownFrom || 'Unbekannt'}`} 
                />
              </ListItem>
            ))}
          </List>
        )
      
      case 'perfect-matches':
        return (
          <List>
            {data.map((matchbox: Matchbox, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <FavoriteIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${matchbox.woman} ❤️ ${matchbox.man}`}
                  secondary={`Erstellt: ${matchbox.createdAt ? new Date(matchbox.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}`}
                />
              </ListItem>
            ))}
          </List>
        )
      
      case 'sold-matchboxes':
        return (
          <List>
            {data.map((matchbox: Matchbox, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <EuroIcon color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${matchbox.woman} & ${matchbox.man}`}
                  secondary={`Käufer: ${matchbox.buyer} • Preis: €${matchbox.price?.toLocaleString('de-DE')} • ${matchbox.soldDate ? new Date(matchbox.soldDate).toLocaleDateString('de-DE') : 'Unbekannt'}`}
                />
              </ListItem>
            ))}
          </List>
        )
      
      case 'budget':
        return (
          <Box>
            <List>
              <ListItem>
                <ListItemIcon><AccountBalanceIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Startkapital" secondary={`€${data.startingBudget.toLocaleString('de-DE')}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon><TrendingUpIcon color="info" /></ListItemIcon>
                <ListItemText primary="Einnahmen (Verkaufte Matchboxes)" secondary={`-€${data.totalRevenue.toLocaleString('de-DE')}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon><InfoIcon color="warning" /></ListItemIcon>
                <ListItemText primary="Strafen" secondary={`-€${data.totalPenalties.toLocaleString('de-DE')}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon><TrendingUpIcon color="success" /></ListItemIcon>
                <ListItemText primary="Gutschriften" secondary={`+€${data.totalCredits.toLocaleString('de-DE')}`} />
              </ListItem>
              <Divider sx={{ my: 2 }} />
              <ListItem>
                <ListItemIcon>
                  <AccountBalanceIcon color={data.currentBalance >= 0 ? 'success' : 'error'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Aktueller Kontostand" 
                  secondary={`€${data.currentBalance.toLocaleString('de-DE')}`}
                  sx={{ '& .MuiListItemText-secondary': { color: data.currentBalance >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' } }}
                />
              </ListItem>
            </List>
            
            {data.penalties.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Strafen Details:</Typography>
                <List>
                  {data.penalties.map((penalty: Penalty) => (
                    <ListItem key={penalty.id}>
                      <ListItemText 
                        primary={`${penalty.participantName} - ${penalty.reason}`}
                        secondary={`${penalty.amount > 0 ? '+' : ''}€${penalty.amount.toLocaleString('de-DE')} • ${new Date(penalty.date).toLocaleDateString('de-DE')} • ${penalty.description || 'Keine Beschreibung'}`}
                        sx={{
                          '& .MuiListItemText-secondary': {
                            color: penalty.amount > 0 ? 'success.main' : 'error.main'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )
      
      default:
        return <Typography>Keine Details verfügbar</Typography>
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{title}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {renderContent()}
      </DialogContent>
    </Dialog>
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
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean
    title: string
    type: string
    data: any
  }>({
    open: false,
    title: '',
    type: '',
    data: null
  })

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

  const handleCardClick = (type: string, data: any) => {
    const titles: { [key: string]: string } = {
      'participants': 'Teilnehmer Details',
      'women': 'Frauen Details',
      'men': 'Männer Details',
      'perfect-matches': 'Perfect Match Details',
      'sold-matchboxes': 'Verkaufte Matchbox Details',
      'budget': 'Budget Details'
    }
    
    setDetailDialog({
      open: true,
      title: titles[type] || 'Details',
      type,
      data
    })
  }

  const closeDetailDialog = () => {
    setDetailDialog({
      open: false,
      title: '',
      type: '',
      data: null
    })
  }

  const tabItems = [
    { label: 'Übersicht', icon: <PeopleIcon /> },
    { label: 'Matching Nights', icon: <FavoriteIcon /> },
    { label: 'Matchbox', icon: <AnalyticsIcon /> },
    { label: 'Wahrscheinlichkeiten', icon: <TrendingUpIcon /> }
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
  const [selectedWoman, setSelectedWoman] = useState('')
  const [selectedMan, setSelectedMan] = useState('')

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
  const [isDragMode, setIsDragMode] = useState(false)
  const [dragOverTarget, setDragOverTarget] = useState<'woman' | 'man' | null>(null)
  
  // Floating box position state
  const [boxPosition, setBoxPosition] = useState(() => ({
    x: Math.max(10, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 300),
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
    const totalPerfectMatches = Math.max(womenCount, menCount)
    
    let baseProbabilityForWomen: number
    let baseProbabilityForMen: number
    
    if (womenCount === menCount) {
      // Equal numbers: each person has exactly 1 perfect match
      baseProbabilityForWomen = 1 / menCount
      baseProbabilityForMen = 1 / womenCount
    } else if (womenCount < menCount) {
      // More men: some women have multiple perfect matches
      // Total matches = menCount, distributed among womenCount women
      const avgMatchesPerWoman = menCount / womenCount
      baseProbabilityForWomen = avgMatchesPerWoman / menCount
      baseProbabilityForMen = 1 / womenCount
    } else {
      // More women: some men have multiple perfect matches  
      // Total matches = womenCount, distributed among menCount men
      const avgMatchesPerMan = womenCount / menCount
      baseProbabilityForWomen = 1 / menCount
      baseProbabilityForMen = avgMatchesPerMan / womenCount
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

  // Get top matches for each person
  const getTopMatches = (personName: string, isWoman: boolean) => {
    const matches: Array<{name: string, probability: number}> = []
    
    if (isWoman && pairProbabilities[personName]) {
      Object.entries(pairProbabilities[personName]).forEach(([manName, prob]) => {
        matches.push({ name: manName, probability: prob })
      })
    } else {
      // For men, look through all women's probabilities
      Object.entries(pairProbabilities).forEach(([womanName, womanProbs]) => {
        if (womanProbs[personName] !== undefined) {
          matches.push({ name: womanName, probability: womanProbs[personName] })
        }
      })
    }
    
    return matches.sort((a, b) => b.probability - a.probability).slice(0, 5)
  }

  // Admin functions
  const saveMatchingNight = async () => {
    try {
      if (!matchingNightForm.name || matchingNightForm.pairs.length === 0) {
        setSnackbar({ open: true, message: 'Bitte Name eingeben und mindestens ein Paar hinzufügen!', severity: 'error' })
        return
      }

      const now = new Date()
      await db.matchingNights.add({
        name: matchingNightForm.name,
        date: new Date().toISOString().split('T')[0],
        totalLights: matchingNightForm.totalLights,
        pairs: matchingNightForm.pairs,
        createdAt: now
      })

      setSnackbar({ open: true, message: 'Matching Night wurde erfolgreich erstellt!', severity: 'success' })
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

  const addPair = () => {
    if (selectedWoman && selectedMan) {
      setMatchingNightForm(prev => ({
        ...prev,
        pairs: [...prev.pairs, { woman: selectedWoman, man: selectedMan }]
      }))
      setSelectedWoman('')
      setSelectedMan('')
    }
  }

  const removePair = (index: number) => {
    setMatchingNightForm(prev => ({
      ...prev,
      pairs: prev.pairs.filter((_, i) => i !== index)
    }))
  }

  const resetMatchingNightForm = () => {
    setMatchingNightForm({
      name: '',
      totalLights: 0,
      pairs: []
    })
    setSelectedWoman('')
    setSelectedMan('')
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
    setIsDragMode(false)
  }

  // Drag and Drop handlers
  const handleDrop = (e: React.DragEvent, target: 'woman' | 'man') => {
    e.preventDefault()
    setDragOverTarget(null)
    const participantData = e.dataTransfer.getData('participant')
    if (participantData) {
      const participant = JSON.parse(participantData) as Participant
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ position: 'sticky', top: 0, zIndex: 1000, bgcolor: 'background.paper' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                AYTO RSIL 2025
              </Typography>
              <Chip label="Overview" color="primary" />
            </Box>
            <Button
              variant="contained"
              startIcon={<AdminIcon />}
              onClick={() => window.location.href = '/?admin=1&mui=1'}
              sx={{ ml: 'auto' }}
            >
              Admin Panel
            </Button>
          </Box>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Übersicht aller Teilnehmer der aktuellen Staffel
          </Typography>
          
          {/* Statistics */}
          <StatisticsCards 
            participants={participants}
            matchboxes={matchboxes}
            matchingNights={matchingNights}
            penalties={penalties}
            onCardClick={handleCardClick}
          />
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
        {/* Tabs */}
        <Card sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {tabItems.map((tab, index) => (
              <Tab 
                key={index}
                label={tab.label} 
                icon={tab.icon}
                iconPosition="start"
                sx={{ minHeight: 64, fontSize: '1rem', fontWeight: 'bold' }}
              />
            ))}
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            {/* Floating Matchbox Creator */}
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

            {/* Search */}
            <Box sx={{ mb: 4 }}>
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
                        .map((participant) => (
                          <ParticipantCard 
                            key={participant.id} 
                            participant={participant} 
                            draggable={true}
                            onDragStart={(p) => setDraggedParticipants(prev => ({...prev, woman: p}))}
                          />
                        ))}
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
                        .map((participant) => (
                          <ParticipantCard 
                            key={participant.id} 
                            participant={participant} 
                            draggable={true}
                            onDragStart={(p) => setDraggedParticipants(prev => ({...prev, man: p}))}
                          />
                        ))}
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
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setMatchingNightDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Neue Matching Night
              </Button>
            </Box>
            
            {matchingNights.length === 0 ? (
              <Alert severity="info">
                Noch keine Matching Nights vorhanden
              </Alert>
            ) : (
              <Box>
                {matchingNights
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
          </TabPanel>

          {/* Matchbox Tab */}
          <TabPanel value={activeTab} index={2}>
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
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((matchbox) => {
                    const additionalInfo = [
                      matchbox.matchType === 'sold' && matchbox.price ? `€${matchbox.price.toLocaleString('de-DE')}` : null,
                      matchbox.matchType === 'sold' && matchbox.buyer ? `Käufer: ${matchbox.buyer}` : null,
                      new Date(matchbox.createdAt).toLocaleDateString('de-DE')
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Wahrscheinlichkeits-Analyse
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  🧮 Basiert auf Matching Nights & Matchbox-Ergebnissen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
                  {(() => {
                    const womenCount = women.length
                    const menCount = men.length
                    const totalMatches = Math.max(womenCount, menCount)
                    
                    if (womenCount === menCount) {
                      return `📊 Basis: 1/${menCount} = ${Math.round(100/menCount)}% (${womenCount}F + ${menCount}M = ${totalMatches} Matches, je 1:1)`
                    } else if (womenCount < menCount) {
                      const avgPerWoman = menCount / womenCount
                      const probPerPair = Math.round(avgPerWoman * 100 / menCount)
                      return `📊 Basis: ${avgPerWoman.toFixed(1)}/${menCount} = ${probPerPair}% (${womenCount}F + ${menCount}M = ${totalMatches} Matches, ⌀${avgPerWoman.toFixed(1)} pro Frau)`
                    } else {
                      const avgPerMan = womenCount / menCount  
                      const probPerPair = Math.round(100 / menCount)
                      return `📊 Basis: 1/${menCount} = ${probPerPair}% (${womenCount}F + ${menCount}M = ${totalMatches} Matches, ⌀${avgPerMan.toFixed(1)} pro Mann)`
                    }
                  })()}
                </Typography>
              </Box>
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

            {/* Probability Matrix */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
              {/* Top Matches per Person */}
              <Card sx={{ height: 'fit-content' }}>
                <CardHeader 
                  title="Top Matches pro Person"
                  subheader="Die wahrscheinlichsten Partner basierend auf bisherigen Daten"
                />
                <CardContent>
                  <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {[...women, ...men].map(person => {
                      const topMatches = getTopMatches(person.name!, person.gender === 'F')
                      return (
                        <Box key={person.id} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar 
                              src={person.photoUrl}
                              sx={{ 
                                width: 50, 
                                height: 50,
                                bgcolor: person.gender === 'F' ? 'secondary.main' : 'primary.main'
                              }}
                            >
                              {person.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {person.name}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {topMatches.slice(0, 3).map((match, index) => {
                              const partner = participants.find(p => p.name === match.name)
                              const percentage = Math.round(match.probability * 100)
                              
                              return (
                                <Box key={match.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ 
                                      color: index === 0 ? 'success.main' : index === 1 ? 'warning.main' : 'text.secondary',
                                      fontWeight: 'bold',
                                      minWidth: '20px'
                                    }}>
                                      #{index + 1}
                                    </Typography>
                                    <Avatar 
                                      src={partner?.photoUrl}
                                      sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                                    >
                                      {match.name.charAt(0)}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {match.name}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                      width: 60, 
                                      height: 6, 
                                      bgcolor: 'grey.200', 
                                      borderRadius: 3,
                                      overflow: 'hidden'
                                    }}>
                                      <Box sx={{ 
                                        width: `${percentage}%`, 
                                        height: '100%',
                                        bgcolor: percentage >= 80 ? 'success.main' : 
                                                percentage >= 60 ? 'warning.main' : 
                                                percentage >= 40 ? 'info.main' : 'error.main',
                                        transition: 'width 0.3s ease'
                                      }} />
                                    </Box>
                                    <Typography variant="body2" sx={{ 
                                      minWidth: '35px',
                                      fontWeight: 'bold',
                                      color: percentage >= 80 ? 'success.main' : 
                                             percentage >= 60 ? 'warning.main' : 
                                             percentage >= 40 ? 'info.main' : 'error.main'
                                    }}>
                                      {percentage}%
                                    </Typography>
                                  </Box>
                                </Box>
                              )
                            })}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </CardContent>
              </Card>

              {/* Heatmap Matrix */}
              <Card sx={{ height: 'fit-content' }}>
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
                          <TableCell sx={{ fontWeight: 'bold' }}>👩‍🦰 \ 👨‍🦱</TableCell>
                          {men.map(man => (
                            <TableCell key={man.id} sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.75rem',
                              minWidth: '60px',
                              textAlign: 'center',
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'center',
                              height: '80px',
                              verticalAlign: 'bottom'
                            }}>
                              {man.name?.substring(0, 8)}
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
                              minWidth: '80px'
                            }}>
                              {woman.name?.substring(0, 10)}
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
            </Box>
          </TabPanel>
        </Card>
      </Box>


      {/* Matching Night Dialog */}
      <Dialog open={matchingNightDialog} onClose={() => setMatchingNightDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Neue Matching Night erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Name der Matching Night"
              value={matchingNightForm.name}
              onChange={(e) => setMatchingNightForm({...matchingNightForm, name: e.target.value})}
              placeholder="z.B. Matching Night 1"
            />
            
            <TextField
              fullWidth
              label="Gesamtlichter aus der Show"
              type="number"
              inputProps={{ min: 0, max: 11 }}
              value={matchingNightForm.totalLights}
              onChange={(e) => setMatchingNightForm({...matchingNightForm, totalLights: parseInt(e.target.value) || 0})}
              placeholder="0"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 2, alignItems: 'end' }}>
              <FormControl fullWidth>
                <InputLabel>Frau auswählen</InputLabel>
                <Select
                  value={selectedWoman}
                  label="Frau auswählen"
                  onChange={(e) => setSelectedWoman(e.target.value)}
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
                  value={selectedMan}
                  label="Mann auswählen"
                  onChange={(e) => setSelectedMan(e.target.value)}
                >
                  {men.map(man => (
                    <MenuItem key={man.id} value={man.name || ''}>
                      {man.name || 'Unbekannt'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={addPair}
                disabled={!selectedWoman || !selectedMan}
              >
                Hinzufügen
              </Button>
            </Box>

            {matchingNightForm.pairs.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Paare ({matchingNightForm.pairs.length})</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {matchingNightForm.pairs.map((pair, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <Typography>{pair.woman} + {pair.man}</Typography>
                        <IconButton onClick={() => removePair(index)} color="error" size="small">
                          <CloseIcon />
                        </IconButton>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setMatchingNightDialog(false); resetMatchingNightForm();}}>Abbrechen</Button>
          <Button onClick={saveMatchingNight} variant="contained" startIcon={<SaveIcon />}>
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Matchbox Dialog */}
      <Dialog open={matchboxDialog} onClose={() => setMatchboxDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Neue Matchbox erstellen
            <Typography variant="body2" color="text.secondary">
              💡 Ziehe Teilnehmer aus der Übersicht hier hinein
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Drag & Drop Areas */}
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

            {/* Fallback Dropdowns */}
            <Typography variant="h6" sx={{ mt: 2 }}>Oder manuell auswählen:</Typography>
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

      {/* Detail Dialog */}
      <DetailDialog
        open={detailDialog.open}
        onClose={closeDetailDialog}
        title={detailDialog.title}
        type={detailDialog.type}
        data={detailDialog.data}
      />
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
