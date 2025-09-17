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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Avatar,
  IconButton,
  Alert,
  Badge,
  Tooltip,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
  Divider,
  Paper,
  Collapse,
  InputAdornment
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Woman as WomanIcon,
  Man as ManIcon,
  Favorite as FavoriteIcon,
  Upload as UploadIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  Euro as EuroIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  HeartBroken as HeartBrokenIcon,
  AttachMoney as AttachMoneyIcon,
  Savings as SavingsIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  LightMode as LightModeIcon,
  Groups as GroupsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  Warning as WarningIcon,
  DeleteSweep as DeleteSweepIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  HelpOutline as HelpOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  Cached as CachedIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  Nightlife as NightlifeIcon,
} from '@mui/icons-material'
import AdminLayout from '@/components/layout/AdminLayout'
import BroadcastManagement from './BroadcastManagement'
import JsonImportManagement from './JsonImportManagement'
import { db, type Participant, type Matchbox, type MatchingNight, type Penalty } from '@/lib/db'
import { getValidPerfectMatchesForMatchingNight } from '@/utils/broadcastUtils'


// ** Statistics Cards Component
const StatisticsCards: React.FC<{
  participants: Participant[]
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
}> = () => {
  return null
}

// ** Participant Form Component
const ParticipantForm: React.FC<{
  initial?: Participant
  onSaved: () => void
  onCancel?: () => void
}> = ({ initial, onSaved, onCancel }) => {
  const [form, setForm] = useState<Participant>(initial ?? {
    name: '', knownFrom: '', age: undefined, status: '', photoUrl: '', bio: '', gender: 'F', socialMediaAccount: ''
  })

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const oldName = initial?.name?.trim()
      const newName = form.name.trim()

      if (form.id) {
        await db.participants.update(form.id, form)
      } else {
        await db.participants.add(form)
      }

      // Wenn der Name geändert wurde, referenzierte Einträge mitziehen
      if (oldName && oldName !== newName) {
        // Matchboxes: woman/man Felder aktualisieren
        await db.matchboxes.where('woman').equals(oldName).modify({ woman: newName })
        await db.matchboxes.where('man').equals(oldName).modify({ man: newName })

        // Matching Nights: Paare innerhalb der Arrays aktualisieren
        await db.matchingNights.toCollection().modify((mn: any) => {
          if (!Array.isArray(mn.pairs)) return
          let changed = false
          mn.pairs = mn.pairs.map((p: any) => {
            if (p?.woman === oldName) { changed = true; return { ...p, woman: newName } }
            if (p?.man === oldName) { changed = true; return { ...p, man: newName } }
            return p
          })
          if (changed) {
            // no-op; Dexie persist happens via modify
          }
        })
      }
      onSaved()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
    }
  }

  return (
    <Card>
      <CardHeader 
        title={initial ? "Teilnehmer bearbeiten" : "Neuen Teilnehmer hinzufügen"}
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><AddIcon /></Avatar>}
      />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3
            }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Bekannt aus"
                value={form.knownFrom}
                onChange={(e) => setForm({ ...form, knownFrom: e.target.value })}
              />
              <TextField
                fullWidth
                label="Alter"
                type="number"
                value={form.age ?? ''}
                onChange={(e) => setForm({ ...form, age: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              />
              <TextField
                fullWidth
                label="Status"
                value={(form.active !== false) ? 'Aktiv' : 'Perfekt Match'}
                InputProps={{ readOnly: true }}
                helperText="Wird automatisch aus dem Aktiv-Status abgeleitet"
              />
              <TextField
                fullWidth
                label="Foto URL"
                value={form.photoUrl ?? ''}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://..."
              />
              <TextField
                fullWidth
                label="Social Media Account"
                value={form.socialMediaAccount ?? ''}
                onChange={(e) => setForm({ ...form, socialMediaAccount: e.target.value })}
                placeholder="https://instagram.com/username"
              />
            </Box>
            
            <FormControl component="fieldset">
              <FormLabel component="legend">Geschlecht</FormLabel>
              <RadioGroup
                row
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'F' | 'M' })}
              >
                <FormControlLabel value="F" control={<Radio />} label="Frau" />
                <FormControlLabel value="M" control={<Radio />} label="Mann" />
              </RadioGroup>
            </FormControl>
            
            <TextField
              fullWidth
              label="Biografie"
              multiline
              rows={4}
              value={form.bio ?? ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button 
                  variant="outlined" 
                  onClick={onCancel}
                  startIcon={<CancelIcon />}
                >
                  Abbrechen
                </Button>
              )}
              <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                {initial ? 'Aktualisieren' : 'Hinzufügen'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

// ** Participants List Component
const ParticipantsList: React.FC<{
  participants: Participant[]
  onEdit: (participant: Participant) => void
  onDelete: (id: number) => void
  limit: number
  onLoadMore: () => void
}> = ({ participants, onEdit, onDelete, limit, onLoadMore }) => {
  return (
    <Card>
      <CardHeader 
        title={`Teilnehmer (${participants.length})`}
        avatar={<Avatar sx={{ bgcolor: 'info.main' }}><PeopleIcon /></Avatar>}
      />
      <CardContent>
        {/* Gender-based sections */}
        <Box sx={{ mb: 4 }}>
          {/* Women Section */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'pink.main' }}>
                <WomanIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Frauen ({participants.filter(p => p.gender === 'F').length})
              </Typography>
            </Box>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
              gap: 2,
              mb: 4
            }}>
              {participants.filter(p => p.gender === 'F').slice(0, Math.ceil(limit / 2)).map((participant) => (
                <Card 
                  key={participant.id} 
                  sx={{ 
                    height: 300,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundImage: (participant.photoUrl && participant.photoUrl.trim() !== '') ? `url(${participant.photoUrl})` : (participant.gender === 'F' ? 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)' : 'linear-gradient(135deg, #16B1FF 0%, #0288D1 100%)'),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      '& .overlay': {
                        opacity: 1
                      },
                      '& .name-text': {
                        transform: 'translateY(-40px)'
                      },
                      '& .additional-info': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    }
                  }}
                >
                  {/* Semi-transparent overlay */}
                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.3)',
                      opacity: 0.6,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                  />
                  
                  {/* Active status indicator */}
                    <Badge
                      badgeContent=""
                      color="default"
                      variant="dot"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 3,
                      '& .MuiBadge-dot': {
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        border: '2px solid white',
                        backgroundColor: participant.active !== false ? 'success.main' : '#EC4899'
                      }
                    }}
                  />
                  
                  {/* Name - always visible */}
                  <Box
                    className="name-text"
                    sx={{
                      position: 'absolute',
                      bottom: 80,
                      left: 20,
                      right: 20,
                      zIndex: 2,
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        textAlign: 'center'
                      }}
                    >
                        {participant.name}
                      </Typography>
                  </Box>
                  
                  {/* Additional info - only visible on hover */}
                  <Box
                    className="additional-info"
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: 20,
                      right: 20,
                      zIndex: 2,
                      opacity: 0,
                      transform: 'translateY(20px)',
                      transition: 'all 0.3s ease-in-out',
                      textAlign: 'center'
                    }}
                  >
                        {typeof participant.age === 'number' && (
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          mb: 1
                        }}
                      >
                        {participant.age} Jahre
                      </Typography>
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 'medium',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        mb: 2
                      }}
                    >
                      {participant.knownFrom || '—'}
                    </Typography>
                    
                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Bearbeiten">
                        <IconButton
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(participant)
                          }}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.3)'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {participant.id && (
                        <Tooltip title="Löschen">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(participant.id!)
                            }}
                            sx={{
                              bgcolor: 'rgba(244, 67, 54, 0.8)',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(244, 67, 54, 1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      </Box>
                    </Box>
                </Card>
              ))}
                  </Box>
          </Box>

          {/* Men Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <ManIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Männer ({participants.filter(p => p.gender === 'M').length})
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 2
            }}>
              {participants.filter(p => p.gender === 'M').slice(0, Math.ceil(limit / 2)).map((participant) => (
                <Card 
                  key={participant.id} 
                  sx={{ 
                    height: 300,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundImage: (participant.photoUrl && participant.photoUrl.trim() !== '') ? `url(${participant.photoUrl})` : (participant.gender === 'F' ? 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)' : 'linear-gradient(135deg, #16B1FF 0%, #0288D1 100%)'),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      '& .overlay': {
                        opacity: 1
                      },
                      '& .name-text': {
                        transform: 'translateY(-40px)'
                      },
                      '& .additional-info': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    }
                  }}
                >
                  {/* Semi-transparent overlay */}
                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.3)',
                      opacity: 0.6,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                  />
                  
                  {/* Active status indicator */}
                  <Badge
                    badgeContent=""
                    color="default"
                    variant="dot"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 3,
                      '& .MuiBadge-dot': {
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        border: '2px solid white',
                        backgroundColor: participant.active !== false ? 'success.main' : '#EC4899'
                      }
                    }}
                  />
                  
                  {/* Name - always visible */}
                  <Box
                    className="name-text"
                    sx={{
                      position: 'absolute',
                      bottom: 80,
                      left: 20,
                      right: 20,
                      zIndex: 2,
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        textAlign: 'center'
                      }}
                    >
                      {participant.name}
                    </Typography>
                  </Box>
                  
                  {/* Additional info - only visible on hover */}
                  <Box
                    className="additional-info"
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: 20,
                      right: 20,
                      zIndex: 2,
                      opacity: 0,
                      transform: 'translateY(20px)',
                      transition: 'all 0.3s ease-in-out',
                      textAlign: 'center'
                    }}
                  >
                    {typeof participant.age === 'number' && (
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          mb: 1
                        }}
                      >
                        {participant.age} Jahre
                      </Typography>
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 'medium',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        mb: 2
                      }}
                    >
                    {participant.knownFrom || '—'}
                  </Typography>
                    
                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="Bearbeiten">
                      <IconButton
                        size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(participant)
                          }}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.3)'
                            }
                          }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {participant.id && (
                      <Tooltip title="Löschen">
                        <IconButton
                          size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(participant.id!)
                            }}
                            sx={{
                              bgcolor: 'rgba(244, 67, 54, 0.8)',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(244, 67, 54, 1)'
                              }
                            }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  </Box>
              </Card>
          ))}
            </Box>
          </Box>
        </Box>
        {limit < participants.length && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button variant="outlined" onClick={onLoadMore}>
              Mehr laden ({participants.length - limit} weitere)
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ** Matchbox Management Component
const MatchboxManagement: React.FC<{
  participants: Participant[]
  matchboxes: Matchbox[]
  onUpdate: () => void
}> = ({ participants, matchboxes, onUpdate }) => {
  const [editingMatchbox, setEditingMatchbox] = useState<Matchbox | undefined>(undefined)
  const [matchboxForm, setMatchboxForm] = useState<Omit<Matchbox, 'id' | 'createdAt' | 'updatedAt'>>({
    woman: '',
    man: '',
    matchType: 'no-match',
    price: undefined,
    buyer: undefined,
    soldDate: undefined,
    ausstrahlungsdatum: undefined,
    ausstrahlungszeit: undefined
  })
  const [showDialog, setShowDialog] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const women = participants.filter(p => p.gender === 'F')
  const men = participants.filter(p => p.gender === 'M')
  
  // Get available participants (excluding perfect matches for new matchboxes)
  const availableWomen = editingMatchbox ? women : women.filter(woman => 
    !matchboxes.some(mb => mb.matchType === 'perfect' && mb.woman === woman.name)
  )
  const availableMen = editingMatchbox ? men : men.filter(man => 
    !matchboxes.some(mb => mb.matchType === 'perfect' && mb.man === man.name)
  )

  const perfectMatches = matchboxes.filter(mb => mb.matchType === 'perfect').length
  const noMatches = matchboxes.filter(mb => mb.matchType === 'no-match').length
  const totalRevenue = matchboxes
    .filter(mb => mb.matchType === 'sold' && mb.price && typeof mb.price === 'number')
    .reduce((sum, mb) => sum + (mb.price || 0), 0)

  const resetForm = () => {
    setMatchboxForm({
      woman: '',
      man: '',
      matchType: 'no-match',
      price: undefined,
      buyer: undefined,
      soldDate: undefined
    })
    setEditingMatchbox(undefined)
    setShowDialog(false)
  }

  const startEditing = (matchbox: Matchbox) => {
    setEditingMatchbox(matchbox)
    setMatchboxForm({
      woman: matchbox.woman,
      man: matchbox.man,
      matchType: matchbox.matchType,
      price: matchbox.price,
      buyer: matchbox.buyer,
      soldDate: matchbox.soldDate,
      ausstrahlungsdatum: matchbox.ausstrahlungsdatum,
      ausstrahlungszeit: matchbox.ausstrahlungszeit
    })
    setShowDialog(true)
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
      
      if (editingMatchbox) {
        await db.matchboxes.update(editingMatchbox.id!, {
          ...matchboxForm,
          updatedAt: now,
          soldDate: matchboxForm.matchType === 'sold' ? (matchboxForm.soldDate || now) : undefined
        })
        // Wenn Perfect Match, setze beide Teilnehmer auf inaktiv
        if (matchboxForm.matchType === 'perfect') {
          await db.participants.where('name').equals(matchboxForm.woman).modify({ active: false })
          await db.participants.where('name').equals(matchboxForm.man).modify({ active: false })
        }
        setSnackbar({ open: true, message: 'Matchbox wurde erfolgreich aktualisiert!', severity: 'success' })
      } else {
        await db.matchboxes.add({
          ...matchboxForm,
          createdAt: now,
          updatedAt: now,
          soldDate: matchboxForm.matchType === 'sold' ? now : undefined
        })
        // Wenn Perfect Match, setze beide Teilnehmer auf inaktiv
        if (matchboxForm.matchType === 'perfect') {
          await db.participants.where('name').equals(matchboxForm.woman).modify({ active: false })
          await db.participants.where('name').equals(matchboxForm.man).modify({ active: false })
        }
        setSnackbar({ open: true, message: 'Matchbox wurde erfolgreich erstellt!', severity: 'success' })
      }

      resetForm()
      onUpdate()
    } catch (error) {
      console.error('Fehler beim Speichern der Matchbox:', error)
      setSnackbar({ open: true, message: `Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  const deleteMatchbox = async (id: number) => {
    try {
      await db.matchboxes.delete(id)
      onUpdate()
      setSnackbar({ open: true, message: 'Matchbox wurde erfolgreich gelöscht!', severity: 'success' })
    } catch (error) {
      console.error('Fehler beim Löschen der Matchbox:', error)
      setSnackbar({ open: true, message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }


  return (
    <Box>

      {/* Action Button with Labels */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setShowDialog(true)}
        >
          Neue Matchbox erstellen
        </Button>
        <Chip icon={<FavoriteIcon />} label={`${perfectMatches}`} color="success" size="small" />
        <Chip icon={<HeartBrokenIcon />} label={`${noMatches}`} color="error" size="small" />
        <Chip icon={<AttachMoneyIcon />} label={`${totalRevenue.toLocaleString('de-DE')} €`} sx={{ bgcolor: '#9c27b0', color: 'white', '& .MuiChip-icon': { color: 'white' } }} size="small" />
        {editingMatchbox && (
          <Button variant="outlined" onClick={resetForm}>
            Bearbeitung abbrechen
          </Button>
        )}
      </Box>

      {/* Matchboxes List */}
      <Card>
        <CardHeader 
          title={`Matchboxes (${matchboxes.length})`}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><AnalyticsIcon /></Avatar>}
        />
        <CardContent>
          {matchboxes.length === 0 ? (
            <Alert severity="info">Noch keine Matchboxes vorhanden</Alert>
          ) : (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2
            }}>
              {matchboxes
                .sort((a, b) => {
                  const dateA = a.ausstrahlungsdatum ? new Date(a.ausstrahlungsdatum).getTime() : new Date(a.createdAt).getTime()
                  const dateB = b.ausstrahlungsdatum ? new Date(b.ausstrahlungsdatum).getTime() : new Date(b.createdAt).getTime()
                  return dateB - dateA
                })
                .map((matchbox) => (
                <Card key={matchbox.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: matchbox.matchType === 'perfect' ? 'success.main' : 
                                  matchbox.matchType === 'sold' ? 'info.main' : 'error.main'
                        }}>
                          <FavoriteIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {matchbox.woman} + {matchbox.man}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip 
                              label={
                                matchbox.matchType === 'perfect' ? 'Perfect Match' :
                                matchbox.matchType === 'no-match' ? 'No Match' : 'Verkauft'
                              }
                              color={
                                matchbox.matchType === 'perfect' ? 'success' :
                                matchbox.matchType === 'sold' ? 'info' : 'error'
                              }
                              size="small"
                            />
                            {matchbox.matchType === 'sold' && matchbox.price && (
                              <Chip 
                                label={`€${matchbox.price}`}
                                color="primary"
                                size="small"
                                icon={<EuroIcon />}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box>
                        <Tooltip title="Bearbeiten">
                          <IconButton onClick={() => startEditing(matchbox)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton onClick={() => deleteMatchbox(matchbox.id!)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    {matchbox.matchType === 'sold' && matchbox.buyer && (
                      <Typography variant="body2" color="text.secondary">
                        Käufer: {matchbox.buyer}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      {matchbox.ausstrahlungsdatum ? 
                        `Ausstrahlung: ${new Date(matchbox.ausstrahlungsdatum).toLocaleDateString('de-DE')}` :
                        `Erstellt: ${new Date(matchbox.createdAt).toLocaleString('de-DE', { 
                          day: '2-digit', month: '2-digit', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}`
                      }
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onClose={resetForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMatchbox ? 'Matchbox bearbeiten' : 'Neue Matchbox erstellen'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2
            }}>
              <FormControl fullWidth>
                <InputLabel>Frau</InputLabel>
                <Select
                  value={matchboxForm.woman}
                  label="Frau"
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
                <InputLabel>Mann</InputLabel>
                <Select
                  value={matchboxForm.man}
                  label="Mann"
                  onChange={(e) => setMatchboxForm({...matchboxForm, man: e.target.value})}
                >
                  {availableMen.map(man => (
                    <MenuItem key={man.id} value={man.name || ''}>
                      {man.name || 'Unbekannt'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
            </Box>

            {/* Ausstrahlungsdatum und Zeit */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2
            }}>
              <TextField
                fullWidth
                label="Ausstrahlungsdatum"
                type="date"
                value={matchboxForm.ausstrahlungsdatum || ''}
                onChange={(e) => setMatchboxForm({...matchboxForm, ausstrahlungsdatum: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Ausstrahlungszeit"
                type="time"
                value={matchboxForm.ausstrahlungszeit || ''}
                onChange={(e) => setMatchboxForm({...matchboxForm, ausstrahlungszeit: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {matchboxForm.matchType === 'sold' && (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2
              }}>
                <TextField
                  fullWidth
                  label="Preis (€)"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={matchboxForm.price || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setMatchboxForm({...matchboxForm, price: isNaN(value) ? undefined : value})
                  }}
                  placeholder="0.00"
                />

                <FormControl fullWidth>
                  <InputLabel>Käufer</InputLabel>
                  <Select
                    value={matchboxForm.buyer || ''}
                    label="Käufer"
                    onChange={(e) => setMatchboxForm({...matchboxForm, buyer: e.target.value})}
                  >
                    {[...women, ...men]
                      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
                      .map(participant => (
                        <MenuItem key={participant.id} value={participant.name || ''}>
                          {participant.name || 'Unbekannt'} ({participant.gender === 'F' ? 'F' : 'M'})
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Abbrechen</Button>
          <Button onClick={saveMatchbox} variant="contained" startIcon={<SaveIcon />}>
            {editingMatchbox ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

// ** Matching Night Management Component
const MatchingNightManagement: React.FC<{
  participants: Participant[]
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  onUpdate: () => void
}> = ({ participants, matchboxes, matchingNights, onUpdate }) => {
  const [editingMatchingNight, setEditingMatchingNight] = useState<MatchingNight | undefined>(undefined)
  const [matchingNightForm, setMatchingNightForm] = useState<{
    name: string;
    totalLights: number;
    pairs: Array<{woman: string, man: string}>;
    ausstrahlungsdatum: string;
    ausstrahlungszeit: string;
  }>({
    name: '',
    totalLights: 0,
    pairs: [],
    ausstrahlungsdatum: '',
    ausstrahlungszeit: ''
  })
  const [selectedWoman, setSelectedWoman] = useState<string>('')
  const [selectedMan, setSelectedMan] = useState<string>('')
  const [showDialog, setShowDialog] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Perfect Match Logik - nur Matchboxes die VOR der aktuellen Matching Night ausgestrahlt wurden
  const getValidPerfectMatches = (currentMatchingNightDate?: string) => {
    if (!currentMatchingNightDate) {
      // Wenn keine Matching Night ausgewählt ist, alle Perfect Matches anzeigen
      return matchboxes
        .filter(mb => mb.matchType === 'perfect')
        .map(mb => ({ woman: mb.woman, man: mb.man }))
    }
    
    // Erstelle ein temporäres Matching Night Objekt für die zentrale Logik
    const tempMatchingNight: MatchingNight = {
      id: 0,
      name: 'temp',
      date: currentMatchingNightDate,
      pairs: [],
      createdAt: new Date(),
      ausstrahlungsdatum: currentMatchingNightDate,
      ausstrahlungszeit: '20:15' // Standard AYTO Zeit
    }
    
    return getValidPerfectMatchesForMatchingNight(matchboxes, tempMatchingNight)
  }
  
  const perfectMatchPairs = getValidPerfectMatches(matchingNightForm.ausstrahlungsdatum)

  const women = participants.filter(p => p.gender === 'F')
  const men = participants.filter(p => p.gender === 'M')

  // Used participants in current form
  const usedWomen = [
    ...matchingNightForm.pairs.map(pair => pair.woman),
    ...perfectMatchPairs.map(pair => pair.woman)
  ]
  const usedMen = [
    ...matchingNightForm.pairs.map(pair => pair.man),
    ...perfectMatchPairs.map(pair => pair.man)
  ]

  // Lichter-Berechnungen
  const automaticLights = matchingNightForm.pairs.filter(pair => 
    perfectMatchPairs.some(pm => pm.woman === pair.woman && pm.man === pair.man)
  ).length
  const manualLights = Math.max(0, matchingNightForm.totalLights - automaticLights)

  const resetForm = () => {
    setMatchingNightForm({
      name: '',
      totalLights: 0,
      pairs: [],
      ausstrahlungsdatum: '',
      ausstrahlungszeit: ''
    })
    setSelectedWoman('')
    setSelectedMan('')
    setEditingMatchingNight(undefined)
    setShowDialog(false)
  }

  const startEditing = (matchingNight: MatchingNight) => {
    setEditingMatchingNight(matchingNight)
    setMatchingNightForm({
      name: matchingNight.name,
      totalLights: matchingNight.totalLights || 0,
      pairs: [...matchingNight.pairs],
      ausstrahlungsdatum: matchingNight.ausstrahlungsdatum || '',
      ausstrahlungszeit: matchingNight.ausstrahlungszeit || ''
    })
    setShowDialog(true)
  }

  const addPair = () => {
    if (selectedWoman && selectedMan) {
      setMatchingNightForm({
        ...matchingNightForm,
        pairs: [...matchingNightForm.pairs, { woman: selectedWoman, man: selectedMan }]
      })
      setSelectedWoman('')
      setSelectedMan('')
    }
  }

  const removePair = (index: number) => {
    setMatchingNightForm({
      ...matchingNightForm,
      pairs: matchingNightForm.pairs.filter((_, i) => i !== index)
    })
  }


  const saveMatchingNight = async () => {
    try {
      // Validierung: Maximum 10 Lichter erlaubt
      if (matchingNightForm.totalLights > 10) {
        setSnackbar({ open: true, message: 'Maximum 10 Lichter erlaubt!', severity: 'error' })
        return
      }

      // Validierung: Alle 10 Paare müssen vollständig sein
      const completePairs = matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man)
      
      if (completePairs.length !== 10) {
        setSnackbar({ 
          open: true, 
          message: `Alle 10 Pärchen müssen vollständig sein! Aktuell: ${completePairs.length}/10 vollständig`, 
          severity: 'error' 
        })
        return
      }

      // Validierung: Geschlechts-Konflikte prüfen
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
      
      // Validierung: Gesamtlichter dürfen nicht weniger als Perfect Match Lichter sein
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

      const now = new Date()
      
      if (editingMatchingNight) {
        await db.matchingNights.update(editingMatchingNight.id!, {
          name: matchingNightForm.name,
          totalLights: matchingNightForm.totalLights,
          pairs: matchingNightForm.pairs,
          ausstrahlungsdatum: matchingNightForm.ausstrahlungsdatum,
          ausstrahlungszeit: matchingNightForm.ausstrahlungszeit
        })
        setSnackbar({ open: true, message: 'Matching Night wurde erfolgreich aktualisiert!', severity: 'success' })
      } else {
        const autoGeneratedName = `Matching Night #${matchingNights.length + 1}`
        
        await db.matchingNights.add({
          name: autoGeneratedName,
          date: new Date().toISOString().split('T')[0],
          totalLights: matchingNightForm.totalLights,
          pairs: matchingNightForm.pairs,
          createdAt: now,
          ausstrahlungsdatum: matchingNightForm.ausstrahlungsdatum,
          ausstrahlungszeit: matchingNightForm.ausstrahlungszeit
        })
        setSnackbar({ open: true, message: `Matching Night "${autoGeneratedName}" wurde erfolgreich erstellt!`, severity: 'success' })
      }

      resetForm()
      onUpdate()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      setSnackbar({ open: true, message: `Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  const deleteMatchingNight = async (id: number) => {
    try {
      await db.matchingNights.delete(id)
      onUpdate()
      setSnackbar({ open: true, message: 'Matching Night wurde erfolgreich gelöscht!', severity: 'success' })
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      setSnackbar({ open: true, message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }


  return (
    <Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setShowDialog(true)}
        >
          Neue Matching Night erstellen
        </Button>
        {editingMatchingNight && (
          <Button variant="outlined" onClick={resetForm}>
            Bearbeitung abbrechen
          </Button>
        )}
      </Box>

      {/* Matching Nights List */}
      <Card>
        <CardHeader 
          title={`Matching Nights (${matchingNights.length})`}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><FavoriteIcon /></Avatar>}
        />
        <CardContent>
          {matchingNights.length === 0 ? (
            <Alert severity="info">Noch keine Matching Nights vorhanden</Alert>
          ) : (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2
            }}>
              {matchingNights
                .sort((a, b) => {
                  const dateA = a.ausstrahlungsdatum ? new Date(a.ausstrahlungsdatum).getTime() : new Date(a.createdAt).getTime()
                  const dateB = b.ausstrahlungsdatum ? new Date(b.ausstrahlungsdatum).getTime() : new Date(b.createdAt).getTime()
                  return dateB - dateA
                })
                .map((matchingNight) => (
                <Card key={matchingNight.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'pink.main' }}>
                          <FavoriteIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {matchingNight.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Chip 
                              label={`${matchingNight.pairs.length} Paare`}
                              color="primary"
                              size="small"
                              icon={<GroupsIcon />}
                            />
                            {matchingNight.totalLights !== undefined && (
                              <Chip 
                                label={`${matchingNight.totalLights} Lichter`}
                                color="warning"
                                size="small"
                                icon={<LightModeIcon />}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box>
                        <Tooltip title="Bearbeiten">
                          <IconButton onClick={() => startEditing(matchingNight)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton onClick={() => deleteMatchingNight(matchingNight.id!)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {matchingNight.ausstrahlungsdatum ? 
                        `Ausstrahlung: ${new Date(matchingNight.ausstrahlungsdatum).toLocaleDateString('de-DE')}` :
                        `Datum: ${new Date(matchingNight.date).toLocaleDateString('de-DE')}`
                      }
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary">
                      Erstellt: {new Date(matchingNight.createdAt).toLocaleString('de-DE', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onClose={resetForm} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingMatchingNight ? 'Matching Night bearbeiten' : 'Neue Matching Night erstellen'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Name und Lichter */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2
            }}>
              <TextField
                fullWidth
                label="Name"
                value={matchingNightForm.name}
                onChange={(e) => setMatchingNightForm({...matchingNightForm, name: e.target.value})}
                placeholder="z.B. Episode 1, Matching Night 1..."
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
            </Box>

            {/* Ausstrahlungsdatum und Zeit */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2
            }}>
              <TextField
                fullWidth
                label="Ausstrahlungsdatum"
                type="date"
                value={matchingNightForm.ausstrahlungsdatum}
                onChange={(e) => setMatchingNightForm({...matchingNightForm, ausstrahlungsdatum: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Ausstrahlungszeit"
                type="time"
                value={matchingNightForm.ausstrahlungszeit}
                onChange={(e) => setMatchingNightForm({...matchingNightForm, ausstrahlungszeit: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Lichter-Analyse */}
            {matchingNightForm.totalLights > 0 && (
              <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LightModeIcon /> Lichter-Analyse
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 2
                  }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h5" color="warning.main">{matchingNightForm.totalLights}</Typography>
                        <Typography variant="caption">Gesamtlichter</Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h5" color="success.main">{automaticLights}</Typography>
                        <Typography variant="caption">Perfect Matches</Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h5" color="info.main">{manualLights}</Typography>
                        <Typography variant="caption">Andere Paare</Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h5" color="text.secondary">{Math.max(0, 11 - matchingNightForm.pairs.length)}</Typography>
                        <Typography variant="caption">Fehlende Paare</Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  {manualLights < 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Achtung: Mehr Perfect Matches als Gesamtlichter!
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Paar hinzufügen */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Paar hinzufügen</Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 120px' },
                  gap: 2,
                  alignItems: 'end'
                }}>
                  <FormControl fullWidth>
                    <InputLabel>Frau auswählen</InputLabel>
                    <Select
                      value={selectedWoman}
                      label="Frau auswählen"
                      onChange={(e) => setSelectedWoman(e.target.value)}
                    >
                      {women.map(woman => (
                        <MenuItem 
                          key={woman.id} 
                          value={woman.name || ''}
                          disabled={usedWomen.includes(woman.name || '')}
                        >
                          {woman.name || 'Unbekannt'} {usedWomen.includes(woman.name || '') ? '(verwendet)' : ''}
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
                        <MenuItem 
                          key={man.id} 
                          value={man.name || ''}
                          disabled={usedMen.includes(man.name || '')}
                        >
                          {man.name || 'Unbekannt'} {usedMen.includes(man.name || '') ? '(verwendet)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button 
                    onClick={addPair}
                    disabled={!selectedWoman || !selectedMan}
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Hinzufügen
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Ausgewählte Paare */}
            {matchingNightForm.pairs.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Ausgewählte Paare ({matchingNightForm.pairs.length})
                  </Typography>
                  <Stack spacing={1}>
                    {matchingNightForm.pairs.map((pair, index) => {
                      const isPerfectMatch = perfectMatchPairs.some(
                        pm => pm.woman === pair.woman && pm.man === pair.man
                      )
                      
                      return (
                        <Card 
                          key={index} 
                          variant="outlined"
                          sx={{ 
                            bgcolor: isPerfectMatch ? 'success.50' : 'grey.50',
                            border: '1px solid',
                            borderColor: isPerfectMatch ? 'success.200' : 'grey.200'
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ 
                                  bgcolor: isPerfectMatch ? 'success.main' : 'pink.main',
                                  width: 32, height: 32
                                }}>
                                  {isPerfectMatch ? <AutoAwesomeIcon /> : <GroupsIcon />}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {pair.woman} + {pair.man}
                                  </Typography>
                                  {isPerfectMatch && (
                                    <Chip 
                                      label="Perfect Match" 
                                      color="success" 
                                      size="small" 
                                      sx={{ mt: 0.5 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                              <Box>
                                {!isPerfectMatch ? (
                                  <Tooltip title="Entfernen">
                                    <IconButton 
                                      onClick={() => removePair(index)}
                                      color="error"
                                      size="small"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Chip label="Fest gesetzt" color="success" variant="outlined" size="small" />
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Abbrechen</Button>
          <Button onClick={saveMatchingNight} variant="contained" startIcon={<SaveIcon />}>
            {editingMatchingNight ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

// ** Settings Management Component
const SettingsManagement: React.FC<{
  participants: Participant[]
  matchboxes: Matchbox[]
  matchingNights: MatchingNight[]
  penalties: Penalty[]
  onUpdate: () => void
  renderContext?: 'settings' | 'json-import'
}> = ({ participants, matchboxes, matchingNights, penalties, onUpdate, renderContext = 'settings' }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    severity?: 'warning' | 'error';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const [isSeedResetting, setIsSeedResetting] = useState(false)
  const [budgetSettings, setBudgetSettings] = useState({
    startingBudget: 200000,
    showDialog: false
  })
  const [newBudget, setNewBudget] = useState<string>('')
  const [penaltyForm, setPenaltyForm] = useState({
    participantName: '',
    reason: '',
    amount: '',
    description: '',
    showDialog: false
  })
  const [editingPenalty, setEditingPenalty] = useState<Penalty | undefined>(undefined)

  const totalEntries = participants.length + matchingNights.length + matchboxes.length + penalties.length

  // ** Load budget settings from localStorage **
  useEffect(() => {
    const savedBudget = localStorage.getItem('ayto-starting-budget')
    if (savedBudget) {
      setBudgetSettings(prev => ({ ...prev, startingBudget: parseInt(savedBudget, 10) }))
    }
  }, [])

  // ** Budget Functions **
  const saveBudgetSettings = () => {
    const budget = parseInt(newBudget, 10)
    if (isNaN(budget) || budget < 0) {
      setSnackbar({ open: true, message: '❌ Bitte geben Sie eine gültige Summe ein!', severity: 'error' })
      return
    }

    setBudgetSettings(prev => ({ ...prev, startingBudget: budget, showDialog: false }))
    localStorage.setItem('ayto-starting-budget', budget.toString())
    setNewBudget('')
    setSnackbar({ open: true, message: `✅ Startsumme wurde auf ${budget.toLocaleString('de-DE')} € gesetzt!`, severity: 'success' })
  }

  const openBudgetDialog = () => {
    setNewBudget(budgetSettings.startingBudget.toString())
    setBudgetSettings(prev => ({ ...prev, showDialog: true }))
  }

  const closeBudgetDialog = () => {
    setBudgetSettings(prev => ({ ...prev, showDialog: false }))
    setNewBudget('')
  }

  // ** Penalty Functions **
  const openPenaltyDialog = () => {
    setPenaltyForm({
      participantName: '',
      reason: '',
      amount: '',
      description: '',
      showDialog: true
    })
    setEditingPenalty(undefined)
  }

  const openEditPenaltyDialog = (penalty: Penalty) => {
    setPenaltyForm({
      participantName: penalty.participantName,
      reason: penalty.reason,
      amount: penalty.amount.toString(),
      description: penalty.description || '',
      showDialog: true
    })
    setEditingPenalty(penalty)
  }

  const closePenaltyDialog = () => {
    setPenaltyForm({
      participantName: '',
      reason: '',
      amount: '',
      description: '',
      showDialog: false
    })
    setEditingPenalty(undefined)
  }

  const savePenalty = async () => {
    try {
      const amount = parseFloat(penaltyForm.amount)
      if (!penaltyForm.participantName || !penaltyForm.reason || isNaN(amount) || amount === 0) {
        setSnackbar({ open: true, message: '❌ Bitte füllen Sie alle Pflichtfelder aus und geben Sie einen Betrag ≠ 0 ein!', severity: 'error' })
        return
      }

      const now = new Date()
      
      if (editingPenalty) {
        await db.penalties.update(editingPenalty.id!, {
          participantName: penaltyForm.participantName,
          reason: penaltyForm.reason,
          amount: amount,
          description: penaltyForm.description,
          date: new Date().toISOString().split('T')[0]
        })
        setSnackbar({ open: true, message: '✅ Transaktion wurde erfolgreich aktualisiert!', severity: 'success' })
      } else {
        await db.penalties.add({
          participantName: penaltyForm.participantName,
          reason: penaltyForm.reason,
          amount: amount,
          description: penaltyForm.description,
          date: new Date().toISOString().split('T')[0],
          createdAt: now
        })
        setSnackbar({ open: true, message: '✅ Transaktion wurde erfolgreich hinzugefügt!', severity: 'success' })
      }

      closePenaltyDialog()
      await onUpdate()
    } catch (error) {
      console.error('Fehler beim Speichern der Strafe:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  const deletePenalty = async (id: number) => {
    setConfirmDialog({
      open: true,
      title: 'Strafe löschen',
      message: 'Wirklich diese Strafe löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!',
      severity: 'warning',
      onConfirm: async () => {
        try {
          await db.penalties.delete(id)
          await onUpdate()
          setSnackbar({ open: true, message: 'Transaktion wurde erfolgreich gelöscht!', severity: 'success' })
        } catch (error) {
          console.error('Fehler beim Löschen der Strafe:', error)
          setSnackbar({ open: true, message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
        }
      }
    })
  }

  // ** Export Functions **
  const exportParticipants = async () => {
    try {
      const data = await db.participants.toArray()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `participants-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSnackbar({ open: true, message: `✅ ${data.length} Teilnehmer wurden exportiert!`, severity: 'success' })
    } catch (error) {
      console.error('Fehler beim Export der Teilnehmer:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  const exportMatchingNights = async () => {
    try {
      const data = await db.matchingNights.toArray()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matching-nights-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSnackbar({ open: true, message: `✅ ${data.length} Matching Nights wurden exportiert!`, severity: 'success' })
    } catch (error) {
      console.error('Fehler beim Export der Matching Nights:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  const exportMatchboxes = async () => {
    try {
      const data = await db.matchboxes.toArray()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matchboxes-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSnackbar({ open: true, message: `✅ ${data.length} Matchboxes wurden exportiert!`, severity: 'success' })
    } catch (error) {
      console.error('Fehler beim Export der Matchboxes:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  const exportPenalties = async () => {
    try {
      const data = await db.penalties.toArray()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `penalties-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSnackbar({ open: true, message: `✅ ${data.length} Strafen/Transaktionen wurden exportiert!`, severity: 'success' })
    } catch (error) {
      console.error('Fehler beim Export der Strafen:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  // ** Seed Reset (DB leeren und neu starten) **
  function triggerSeedReset() {
    setConfirmDialog({
      open: true,
      title: 'Seed zurücksetzen (DB leeren)',
      message: 'Dies löscht alle Daten in der lokalen Datenbank. Beim nächsten Laden wird der Seed erneut eingespielt. Fortfahren?',
      severity: 'warning',
      onConfirm: async () => {
        try {
          setIsSeedResetting(true)
          await Promise.all([
            db.participants.clear(),
            db.matchboxes.clear(),
            db.matchingNights.clear(),
            db.penalties.clear()
          ])
          setSnackbar({ open: true, message: 'Datenbank geleert. Seite wird neu geladen…', severity: 'success' })
          window.location.reload()
        } catch (error) {
          console.error('Seed-Reset fehlgeschlagen:', error)
          setSnackbar({ open: true, message: 'Fehler beim Seed-Reset', severity: 'error' })
        } finally {
          setIsSeedResetting(false)
        }
      }
    })
  }

  const exportAllData = async () => {
    try {
      const [participantsData, matchingNightsData, matchboxesData, penaltiesData] = await Promise.all([
        db.participants.toArray(),
        db.matchingNights.toArray(),
        db.matchboxes.toArray(),
        db.penalties.toArray()
      ])
      
      const allData = {
        participants: participantsData,
        matchingNights: matchingNightsData,
        matchboxes: matchboxesData,
        penalties: penaltiesData,
        exportedAt: new Date().toISOString(),
        version: "1.1"
      }
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ayto-complete-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      const totalItems = participantsData.length + matchingNightsData.length + matchboxesData.length + penaltiesData.length
      setSnackbar({ open: true, message: `✅ Kompletter Export erfolgreich!\n\n${participantsData.length} Teilnehmer\n${matchingNightsData.length} Matching Nights\n${matchboxesData.length} Matchboxes\n${penaltiesData.length} Strafen/Transaktionen\n\nGesamt: ${totalItems} Einträge`, severity: 'success' })
    } catch (error) {
      console.error('Fehler beim kompletten Export:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim kompletten Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
    }
  }

  // ** Delete Functions **
  const deleteParticipants = async () => {
    setConfirmDialog({
      open: true,
      title: 'Alle Teilnehmer löschen',
      message: `Wirklich alle ${participants.length} Teilnehmer löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`,
      severity: 'warning',
      onConfirm: async () => {
        try {
          setIsLoading(true)
          await db.participants.clear()
          await onUpdate()
          setSnackbar({ open: true, message: 'Alle Teilnehmer wurden erfolgreich gelöscht!', severity: 'success' })
        } catch (error) {
          console.error('Fehler beim Löschen der Teilnehmer:', error)
          setSnackbar({ open: true, message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  const deleteMatchingNights = async () => {
    setConfirmDialog({
      open: true,
      title: 'Alle Matching Nights löschen',
      message: `Wirklich alle ${matchingNights.length} Matching Nights löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`,
      severity: 'warning',
      onConfirm: async () => {
        try {
          setIsLoading(true)
          await db.matchingNights.clear()
          await onUpdate()
          setSnackbar({ open: true, message: 'Alle Matching Nights wurden erfolgreich gelöscht!', severity: 'success' })
        } catch (error) {
          console.error('Fehler beim Löschen der Matching Nights:', error)
          setSnackbar({ open: true, message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  const deleteMatchboxes = async () => {
    setConfirmDialog({
      open: true,
      title: 'Alle Matchboxes löschen',
      message: `Wirklich alle ${matchboxes.length} Matchboxes löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`,
      severity: 'warning',
      onConfirm: async () => {
        try {
          setIsLoading(true)
          await db.matchboxes.clear()
          await onUpdate()
          setSnackbar({ open: true, message: 'Alle Matchboxes wurden erfolgreich gelöscht!', severity: 'success' })
        } catch (error) {
          console.error('Fehler beim Löschen der Matchboxes:', error)
          setSnackbar({ open: true, message: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  const clearCache = async () => {
    setConfirmDialog({
      open: true,
      title: '🗑️ Kompletter Browser-Reset',
      message: 'Browser-Cache, Cookies und alle gespeicherten Daten löschen?\n\nDies setzt die Seite komplett zurück und kann bei Problemen helfen.\n\nDie Datenbank bleibt unverändert.',
      severity: 'warning',
      onConfirm: async () => {
        try {
          setIsLoading(true)
          
          // Service Worker Cache löschen
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
          }
          
          // Local Storage löschen (außer Datenbank)
          const keysToKeep = ['dexie-database-version', 'dexie-database-schema']
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
            // Alle Cookies für die aktuelle Domain löschen
            const cookies = document.cookie.split(';')
            cookies.forEach(cookie => {
              const eqPos = cookie.indexOf('=')
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
              if (name) {
                // Cookie für verschiedene Pfade und Domains löschen
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure`
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;samesite=strict`
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;samesite=lax`
              }
            })
          }
          
          // IndexedDB Cache löschen (nur Cache, nicht die Daten)
          if ('indexedDB' in window) {
            try {
              // Versuche IndexedDB zu leeren (nur Cache-Tabellen)
              const databases = await indexedDB.databases()
              for (const database of databases) {
                if (database.name && database.name.includes('cache')) {
                  const deleteReq = indexedDB.deleteDatabase(database.name)
                  await new Promise((resolve, reject) => {
                    deleteReq.onsuccess = () => resolve(true)
                    deleteReq.onerror = () => reject(deleteReq.error)
                  })
                }
              }
            } catch (error) {
              console.log('IndexedDB Cache-Löschung übersprungen:', error)
            }
          }
          
          // Web Storage API erweitert löschen
          try {
            // Clear all storage types
            if ('storage' in navigator && 'estimate' in navigator.storage) {
              // Quota-Informationen löschen
              await navigator.storage.persist()
            }
          } catch (error) {
            console.log('Storage API Löschung übersprungen:', error)
          }
          
          setSnackbar({ open: true, message: '✅ Browser wurde komplett zurückgesetzt! Cache, Cookies und alle Daten wurden gelöscht. Die Seite wird neu geladen.', severity: 'success' })
          
          // Seite nach kurzer Verzögerung neu laden
          setTimeout(() => {
            window.location.reload()
          }, 2000)
          
        } catch (error) {
          console.error('Fehler beim Löschen des Caches:', error)
          setSnackbar({ open: true, message: `❌ Fehler beim Browser-Reset: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  const resetCompleteDatabase = async () => {
    // Erste Bestätigung
    const firstConfirm = window.confirm(`⚠️ KOMPLETTER DATENBANK-RESET ⚠️

Diese Aktion wird ALLE Daten unwiderruflich löschen:

• ${participants.length} Teilnehmer
• ${matchingNights.length} Matching Nights
• ${matchboxes.length} Matchboxes
• ${penalties.length} Strafen/Transaktionen
• Gesamt: ${totalEntries} Einträge

Dieser Vorgang kann NICHT rückgängig gemacht werden!

Sind Sie sich absolut sicher?`)

    if (!firstConfirm) return

    // Zweite Bestätigung
    const secondConfirm = window.confirm(`LETZTE WARNUNG!

Wirklich die KOMPLETTE Datenbank löschen?

Alle Daten gehen unwiderruflich verloren!`)

    if (!secondConfirm) return

    try {
      setIsLoading(true)
      console.log('Starte kompletten Datenbank-Reset...')
      
      // Alle Tabellen leeren
      await Promise.all([
        db.participants.clear(),
        db.matchingNights.clear(),
        db.matchboxes.clear(),
        db.penalties.clear()
      ])
      
      console.log('Datenbank erfolgreich geleert, lade Daten neu...')
      await onUpdate()
      
      setSnackbar({ 
        open: true, 
        message: '✅ Datenbank wurde komplett zurückgesetzt! Alle Daten wurden erfolgreich gelöscht.', 
        severity: 'success' 
      })
      
      console.log('Datenbank-Reset abgeschlossen')
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Datenbank:', error)
      setSnackbar({ 
        open: true, 
        message: `❌ Fehler beim Zurücksetzen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 
        severity: 'error' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ** Test Data Function **
  const loadTestData = async () => {
    setConfirmDialog({
      open: true,
      title: 'Testdaten laden',
      message: 'Testdaten laden?\n\nDies fügt Beispieldaten zu allen Kategorien hinzu.',
      onConfirm: async () => {
        try {
          setIsLoading(true)
          
          // Testdaten für Teilnehmer
          const testParticipants: Omit<Participant, 'id'>[] = [
            // Frauen
            { name: "Antonia", gender: "F", age: 25, knownFrom: "Germany Shore (2022), DSDS (2024)", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/antonia" },
            { name: "Beverly", gender: "F", age: 23, knownFrom: "Love Island", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/beverly" },
            { name: "Nelly", gender: "F", age: 24, knownFrom: "Bachelor", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/nelly" },
            { name: "Elli", gender: "F", age: 26, knownFrom: "Bachelorette", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/elli" },
            { name: "Joanna", gender: "F", age: 22, knownFrom: "Temptation Island", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/joanna" },
            
            // Männer
            { name: "Xander S.", gender: "M", age: 28, knownFrom: "Make Love, Fake Love", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/xanders" },
            { name: "Oli", gender: "M", age: 27, knownFrom: "Die Wilden Kerle", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/oli" },
            { name: "Leandro", gender: "M", age: 25, knownFrom: "Love Island VIP", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/leandro" },
            { name: "Nico", gender: "M", age: 24, knownFrom: "Germany Shore", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/nico" },
            { name: "Kevin Nje", gender: "M", age: 26, knownFrom: "Too Hot To Handle Germany", status: "Aktiv", active: true, socialMediaAccount: "https://instagram.com/kevinnje" },
          ];

          for (const participant of testParticipants) {
            await db.participants.add(participant);
          }
          
          // Testdaten für Matching Night
          await db.matchingNights.add({
            name: "Test Matching Night",
            date: new Date().toISOString().split('T')[0],
            pairs: [
              { woman: "Antonia", man: "Oli" },
              { woman: "Beverly", man: "Leandro" }
            ],
            createdAt: new Date()
          });

          // Testdaten für Matchboxes
          const now = new Date()
          await db.matchboxes.add({
            woman: "Nelly",
            man: "Xander S.",
            matchType: "perfect",
            createdAt: now,
            updatedAt: now
          })

          await db.matchboxes.add({
            woman: "Elli", 
            man: "Nico",
            matchType: "no-match",
            createdAt: now,
            updatedAt: now
          })
          
          await onUpdate()
          setSnackbar({ open: true, message: '✅ Testdaten wurden erfolgreich geladen!', severity: 'success' })
        } catch (error) {
          console.error('Fehler beim Laden der Testdaten:', error)
          setSnackbar({ open: true, message: `❌ Fehler beim Laden der Testdaten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  // ** Import Functions **
  const importParticipantsJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setIsLoading(true)
      const text = await file.text()
      const arr = JSON.parse(text)
      
      // Daten normalisieren und Gender-Mapping durchführen
      const normalizedParticipants = arr.map((participant: any) => {
        // Gender-Mapping: w/m -> F/M
        let gender = participant.gender
        if (gender === 'w' || gender === 'weiblich' || gender === 'female') {
          gender = 'F'
        } else if (gender === 'm' || gender === 'männlich' || gender === 'male') {
          gender = 'M'
        }
        
        // Sicherstellen, dass alle erforderlichen Felder vorhanden sind
        return {
          name: participant.name || 'Unbekannt',
          knownFrom: participant.knownFrom || '',
          age: participant.age ? parseInt(participant.age.toString(), 10) : undefined,
          status: participant.status || 'Aktiv',
          active: participant.active !== false, // Default: aktiv
          photoUrl: participant.photoUrl || '',
          bio: participant.bio || '',
          gender: gender || 'F', // Default: weiblich falls unbekannt
        }
      })
      
      setConfirmDialog({
        open: true,
        title: 'JSON Import bestätigen',
        message: `${normalizedParticipants.length} Teilnehmer aus JSON importieren?\n\nDies ersetzt alle bestehenden Teilnehmer!`,
        severity: 'warning',
        onConfirm: async () => {
          try {
            await db.transaction('rw', db.participants, async () => {
              await db.participants.clear()
              await db.participants.bulkAdd(normalizedParticipants)
            })
            
            await onUpdate()
            setSnackbar({ open: true, message: `✅ Import erfolgreich! ${normalizedParticipants.length} Teilnehmer wurden importiert.`, severity: 'success' })
          } catch (error) {
            console.error('Fehler beim Import:', error)
            setSnackbar({ open: true, message: `❌ Fehler beim Import: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
          }
        }
      })
    } catch (error) {
      console.error('Fehler beim Import:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim Import: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nBitte überprüfen Sie die JSON-Datei.`, severity: 'error' })
    } finally {
      setIsLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const importCompleteData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setIsLoading(true)
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Validiere das Format
      if (!data.participants || !data.matchingNights || !data.matchboxes) {
        throw new Error('Ungültiges Backup-Format. Fehlende Tabellen.')
      }
      
      setConfirmDialog({
        open: true,
        title: 'Komplettdaten importieren',
        message: `Alle Daten aus Backup importieren?\n\n${data.participants.length} Teilnehmer\n${data.matchingNights.length} Matching Nights\n${data.matchboxes.length} Matchboxes\n${data.penalties?.length || 0} Strafen/Transaktionen\n\n⚠️ Dies ersetzt ALLE bestehenden Daten!`,
        severity: 'warning',
        onConfirm: async () => {
          try {
            // Alle Daten in einer Transaktion importieren
            await db.transaction('rw', [db.participants, db.matchingNights, db.matchboxes, db.penalties], async () => {
              // Alle Tabellen löschen
              await db.participants.clear()
              await db.matchingNights.clear()
              await db.matchboxes.clear()
              await db.penalties.clear()
              
              // Neue Daten einfügen
              if (data.participants.length > 0) {
                await db.participants.bulkAdd(data.participants)
              }
              if (data.matchingNights.length > 0) {
                await db.matchingNights.bulkAdd(data.matchingNights)
              }
              if (data.matchboxes.length > 0) {
                await db.matchboxes.bulkAdd(data.matchboxes)
              }
              if (data.penalties && data.penalties.length > 0) {
                await db.penalties.bulkAdd(data.penalties)
              }
            })
            
            await onUpdate()
            const totalImported = data.participants.length + data.matchingNights.length + data.matchboxes.length + (data.penalties?.length || 0)
            setSnackbar({ 
              open: true, 
              message: `✅ Kompletter Import erfolgreich!\n\n${data.participants.length} Teilnehmer\n${data.matchingNights.length} Matching Nights\n${data.matchboxes.length} Matchboxes\n${data.penalties?.length || 0} Strafen/Transaktionen\n\nGesamt: ${totalImported} Einträge`, 
              severity: 'success' 
            })
          } catch (error) {
            console.error('Fehler beim Komplettimport:', error)
            setSnackbar({ open: true, message: `❌ Fehler beim Komplettimport: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, severity: 'error' })
          }
        }
      })
    } catch (error) {
      console.error('Fehler beim Komplettimport:', error)
      setSnackbar({ open: true, message: `❌ Fehler beim Komplettimport: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nBitte überprüfen Sie die Backup-Datei.`, severity: 'error' })
    } finally {
      setIsLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  // ** Budget Calculations **
  const soldMatchboxes = matchboxes.filter(mb => mb.matchType === 'sold' && mb.price && typeof mb.price === 'number')
  const totalRevenue = soldMatchboxes.reduce((sum, mb) => sum + (mb.price || 0), 0)
  // Separate penalties (negative amounts) and credits (positive amounts)  
  const totalPenalties = penalties.reduce((sum, penalty) => {
    return penalty.amount < 0 ? sum + Math.abs(penalty.amount) : sum
  }, 0)
  const totalCredits = penalties.reduce((sum, penalty) => {
    return penalty.amount > 0 ? sum + penalty.amount : sum
  }, 0)
  const currentBalance = budgetSettings.startingBudget - totalRevenue - totalPenalties + totalCredits


  const exportItems = [
    { title: 'Teilnehmer', count: participants.length, onClick: exportParticipants, icon: <PeopleIcon />, disabled: participants.length === 0 },
    { title: 'Matching Nights', count: matchingNights.length, onClick: exportMatchingNights, icon: <NightlifeIcon />, disabled: matchingNights.length === 0 },
    { title: 'Matchboxes', count: matchboxes.length, onClick: exportMatchboxes, icon: <InventoryIcon />, disabled: matchboxes.length === 0 },
    { title: 'Strafen/Transaktionen', count: penalties.length, onClick: exportPenalties, icon: <AccountBalanceWalletIcon />, disabled: penalties.length === 0 },
    { title: 'Komplettexport', count: totalEntries, onClick: exportAllData, icon: <BackupIcon />, disabled: totalEntries === 0, variant: 'contained' as const }
  ]

  const deleteItems = [
    { title: 'Teilnehmer', count: participants.length, onClick: deleteParticipants, icon: <PeopleIcon />, disabled: participants.length === 0 },
    { title: 'Matching Nights', count: matchingNights.length, onClick: deleteMatchingNights, icon: <NightlifeIcon />, disabled: matchingNights.length === 0 },
    { title: 'Matchboxes', count: matchboxes.length, onClick: deleteMatchboxes, icon: <InventoryIcon />, disabled: matchboxes.length === 0 }
  ]

  return (
    <Box>

      {/* Budget Settings Section (hidden in Datenhaltung) */}
      {renderContext !== 'json-import' && (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Budget Einstellungen"
          avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><SavingsIcon /></Avatar>}
        />
        <CardContent>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 4,
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Aktuelle Startsumme
              </Typography>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 3, bgcolor: 'success.50' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  {budgetSettings.startingBudget.toLocaleString('de-DE')} €
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verfügbares Startkapital
                </Typography>
              </Card>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Budget-Details
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Startsumme:</Typography>
                  <Chip 
                    label={`${budgetSettings.startingBudget.toLocaleString('de-DE')} €`} 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Verkaufte Matchboxes:</Typography>
                  <Chip 
                    label={`-${totalRevenue.toLocaleString('de-DE')} €`} 
                    color="info" 
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Strafen:</Typography>
                  <Chip 
                    label={`-${totalPenalties.toLocaleString('de-DE')} €`} 
                    color="error" 
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Gutschriften:</Typography>
                  <Chip 
                    label={`+${totalCredits.toLocaleString('de-DE')} €`} 
                    color="success" 
                    variant="outlined"
                  />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Aktueller Kontostand:</Typography>
                  <Chip 
                    label={`${currentBalance.toLocaleString('de-DE')} €`} 
                    color={currentBalance >= 0 ? 'success' : 'error'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Stack>
            </Box>
          </Box>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={openBudgetDialog}
              disabled={isLoading}
            >
              Startsumme ändern
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>💡 Hinweis:</strong> Die Startsumme wird lokal gespeichert und beeinflusst die Berechnung des aktuellen Kontostands basierend auf verkauften Matchboxes.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
      )}

      {/* Penalties Management Section (hidden in Datenhaltung) */}
      {renderContext !== 'json-import' && (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Strafen-Verwaltung"
          avatar={<Avatar sx={{ bgcolor: 'error.main' }}><WarningIcon /></Avatar>}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openPenaltyDialog}
              disabled={isLoading}
            >
              Transaktion hinzufügen
            </Button>
          }
        />
        <CardContent>
          {penalties.length === 0 ? (
            <Alert severity="info">
              Noch keine Strafen erfasst
            </Alert>
          ) : (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2
            }}>
              {penalties
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((penalty) => (
                <Card key={penalty.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <WarningIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {penalty.participantName}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip 
                              label={penalty.reason}
                              color="error"
                              size="small"
                            />
                            <Chip 
                              label={`${penalty.amount >= 0 ? '+' : ''}${penalty.amount.toLocaleString('de-DE')} €`}
                              color={penalty.amount >= 0 ? "success" : "error"}
                              size="small"
                              icon={penalty.amount >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Box>
                        <Tooltip title="Bearbeiten">
                          <IconButton onClick={() => openEditPenaltyDialog(penalty)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton onClick={() => deletePenalty(penalty.id!)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    {penalty.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {penalty.description}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Datum: {new Date(penalty.date).toLocaleDateString('de-DE')} | 
                      Erstellt: {new Date(penalty.createdAt).toLocaleString('de-DE', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>💡 Hinweis:</strong> Strafen werden automatisch vom aktuellen Kontostand abgezogen und sind sofort in der Budget-Übersicht sichtbar.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
      )}

      {/* Import & Test Data Section */}
      {renderContext === 'json-import' && (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Import & Testdaten"
          avatar={<Avatar sx={{ bgcolor: 'info.main' }}><CloudUploadIcon /></Avatar>}
        />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={isLoading}
            >
              Teilnehmer Backup importieren
              <input
                type="file"
                hidden
                accept="application/json"
                onChange={importParticipantsJSON}
              />
            </Button>
            <Button
              variant="contained"
              component="label"
              startIcon={<BackupIcon />}
              disabled={isLoading}
              color="primary"
            >
              Komplettbackup importieren
              <input
                type="file"
                hidden
                accept="application/json"
                onChange={importCompleteData}
              />
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={loadTestData}
              disabled={isLoading}
            >
              Testdaten laden
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>JSON Import:</strong> Gender wird automatisch von w/m zu F/M konvertiert. Der Import ersetzt alle bestehenden Teilnehmer.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
      )}

      {/* Export Section */}
      {renderContext === 'json-import' && (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Daten exportieren"
          avatar={<Avatar sx={{ bgcolor: 'success.main' }}><DownloadIcon /></Avatar>}
        />
        <CardContent>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            {exportItems.map((item, index) => (
              <Card key={index} variant="outlined" sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                    {item.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.count} Einträge
                  </Typography>
                  <Button
                    variant={item.variant || 'outlined'}
                    fullWidth
                    onClick={item.onClick}
                    disabled={item.disabled || isLoading}
                    startIcon={<DownloadIcon />}
                    color={item.variant === 'contained' ? 'success' : 'primary'}
                  >
                    Exportieren
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>💡 Tipp:</strong> Alle Exports werden als JSON-Dateien mit Datum heruntergeladen. Der Komplettexport enthält alle Daten in einer strukturierten Datei.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
      )}

      {/* Selective Delete Section */}
      {renderContext === 'json-import' && (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Selektive Löschungen"
          avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><DeleteSweepIcon /></Avatar>}
        />
        <CardContent>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2
          }}>
            {deleteItems.map((item, index) => (
              <Card key={index} variant="outlined" sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                    {item.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.count} Einträge
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={item.onClick}
                    disabled={item.disabled || isLoading}
                    startIcon={<DeleteIcon />}
                  >
                    Alle löschen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>
      )}

      {/* Danger Zone */}
      {renderContext === 'json-import' && (
      <Card sx={{ border: '2px solid', borderColor: 'error.main', mb: 4 }}>
        <CardHeader 
          title="⚠️ Gefahrenzone"
          avatar={<Avatar sx={{ bgcolor: 'error.main' }}><WarningIcon /></Avatar>}
          sx={{ bgcolor: 'error.50' }}
        />
        <CardContent sx={{ textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'error.main' }}>
            Kompletter Datenbank-Reset
          </Typography>
          <Typography variant="body1" color="error.main" sx={{ mb: 3 }}>
            ⚠️ Diese Aktion löscht ALLE Daten unwiderruflich ({totalEntries} Einträge)
          </Typography>
          <Button
            variant="contained"
            color="error"
            size="large"
            onClick={resetCompleteDatabase}
            disabled={isLoading || totalEntries === 0}
            startIcon={<DeleteSweepIcon />}
            sx={{ px: 4, py: 1.5, mb: 2 }}
          >
            Komplette Datenbank löschen
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Cache Management */}
      {renderContext === 'json-import' && (
      <Card sx={{ border: '2px solid', borderColor: 'warning.main', mb: 4 }}>
        <CardHeader 
          title="🗑️ Browser-Reset"
          avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><CachedIcon /></Avatar>}
          sx={{ bgcolor: 'warning.50' }}
        />
        <CardContent sx={{ textAlign: 'center' }}>
          <CachedIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'warning.main' }}>
            Kompletter Browser-Reset
          </Typography>
          <Typography variant="body1" color="warning.main" sx={{ mb: 3 }}>
            🗑️ Löscht Cache, Cookies und alle gespeicherten Daten (Datenbank bleibt erhalten)
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={clearCache}
            disabled={isLoading}
            startIcon={<CachedIcon />}
            sx={{ px: 4, py: 1.5 }}
          >
            Browser zurücksetzen
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Help Section */}
      {renderContext === 'json-import' && (
      <Card variant="outlined">
        <CardHeader 
          title="Wichtige Hinweise"
          avatar={<Avatar sx={{ bgcolor: 'grey.400' }}><HelpOutlineIcon /></Avatar>}
        />
        <CardContent>
          <Alert severity="info">
            <Typography variant="body2" component="div">
              <strong>Wichtige Hinweise:</strong>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li><strong>Export:</strong> Alle Daten können einzeln oder komplett als JSON exportiert werden</li>
                <li>Alle Löschvorgänge sind <strong>unwiderruflich</strong></li>
                <li>Vor jedem Vorgang erscheint eine Sicherheitsabfrage</li>
                <li>Kompletter Reset erfordert doppelte Bestätigung</li>
                <li>Testdaten können zur Demonstration geladen werden</li>
                <li><strong>JSON-Import:</strong> Gender wird automatisch von w/m zu F/M konvertiert</li>
                <li>JSON-Import ersetzt alle bestehenden Teilnehmer</li>
              </Box>
            </Typography>
          </Alert>
        </CardContent>
      </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {confirmDialog.severity === 'error' ? (
            <WarningIcon color="error" />
          ) : (
            <WarningIcon color="warning" />
          )}
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-line' }}>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              confirmDialog.onConfirm()
              setConfirmDialog(prev => ({ ...prev, open: false }))
            }}
            color={confirmDialog.severity === 'error' ? 'error' : 'warning'}
            variant="contained"
            autoFocus
          >
            Bestätigen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Penalty Dialog */}
      <Dialog
        open={penaltyForm.showDialog}
        onClose={closePenaltyDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon color="error" />
          {editingPenalty ? 'Transaktion bearbeiten' : 'Neue Transaktion hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2
            }}>
              <FormControl fullWidth>
                <InputLabel>Teilnehmer</InputLabel>
                <Select
                  value={penaltyForm.participantName}
                  label="Teilnehmer"
                  onChange={(e) => setPenaltyForm({...penaltyForm, participantName: e.target.value})}
                >
                  {[...participants]
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
                    .map(participant => (
                      <MenuItem key={participant.id} value={participant.name || ''}>
                        {participant.name || 'Unbekannt'} ({participant.gender === 'F' ? 'F' : 'M'})
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Grund"
                value={penaltyForm.reason}
                onChange={(e) => setPenaltyForm({...penaltyForm, reason: e.target.value})}
                placeholder="z.B. Regelverstoß, Unpünktlichkeit..."
              />
            </Box>

            <TextField
              fullWidth
              label="Betrag (€)"
              type="text"
              inputProps={{ 
                inputMode: 'decimal',
                pattern: '[0-9]*',
                step: 0.01
              }}
              value={penaltyForm.amount}
              onChange={(e) => {
                const value = e.target.value
                // Allow numbers, minus sign, and decimal point
                if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                  setPenaltyForm({...penaltyForm, amount: value})
                }
              }}
              helperText="Negative Beträge = Strafen | Positive Beträge = Gutschriften/Rückzahlungen"
              placeholder="-1000.00 oder +500.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>
              }}
            />

            <TextField
              fullWidth
              label="Beschreibung (optional)"
              multiline
              rows={3}
              value={penaltyForm.description}
              onChange={(e) => setPenaltyForm({...penaltyForm, description: e.target.value})}
              placeholder="Zusätzliche Details zur Strafe..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePenaltyDialog}>
            Abbrechen
          </Button>
          <Button
            onClick={savePenalty}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!penaltyForm.participantName || !penaltyForm.reason || !penaltyForm.amount || isNaN(parseFloat(penaltyForm.amount)) || parseFloat(penaltyForm.amount) === 0}
          >
            {editingPenalty ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Budget Settings Dialog */}
      <Dialog
        open={budgetSettings.showDialog}
        onClose={closeBudgetDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SavingsIcon color="primary" />
          Startsumme ändern
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Geben Sie die neue Startsumme für das Budget ein. Dies beeinflusst die Berechnung des aktuellen Kontostands.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Neue Startsumme (€)"
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
            placeholder="200000"
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Aktuelle Startsumme:</strong> {budgetSettings.startingBudget.toLocaleString('de-DE')} €<br />
              <strong>Verkaufte Matchboxes:</strong> {totalRevenue.toLocaleString('de-DE')} €<br />
              <strong>Aktueller Kontostand:</strong> {currentBalance.toLocaleString('de-DE')} €
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBudgetDialog}>
            Abbrechen
          </Button>
          <Button
            onClick={saveBudgetSettings}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!newBudget || parseInt(newBudget, 10) < 0}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {isLoading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Verarbeitung läuft...</Typography>
          </Paper>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// ** Main AdminPanel Component
const AdminPanelMUI: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([])
  const [matchingNights, setMatchingNights] = useState<MatchingNight[]>([])
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [activeTab, setActiveTab] = useState('participants')
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined)
  const [limit, setLimit] = useState(12)
  const [showParticipantForm, setShowParticipantForm] = useState(false)
  
  // Ref for the participant form to scroll to it
  const participantFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const [participantsData, matchboxesData, matchingNightsData, penaltiesData] = await Promise.all([
        db.participants.toArray(),
        db.matchboxes.toArray(),
        db.matchingNights.toArray(),
        db.penalties.toArray()
      ])
      setParticipants(participantsData)
      setMatchboxes(matchboxesData)
      setMatchingNights(matchingNightsData)
      setPenalties(penaltiesData)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    }
  }

  const handleEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant)
    setShowParticipantForm(true)
    
    // Scroll to the form after a short delay to ensure it's rendered
    setTimeout(() => {
      participantFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }, 100)
  }

  const handleDeleteParticipant = async (id: number) => {
    if (!confirm('Wirklich löschen?')) return
    try {
      await db.participants.delete(id)
      loadAllData()
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
    }
  }



  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <Box>
        {/* Statistics Overview */}
        <StatisticsCards 
          participants={participants}
          matchboxes={matchboxes}
          matchingNights={matchingNights}
          penalties={penalties}
        />

        {/* Main Content */}
        <Card>

          {/* Participants */}
          {activeTab === 'participants' && (
            <Box sx={{ p: 3 }}>
              <ParticipantsList
                participants={participants}
                onEdit={handleEditParticipant}
                onDelete={handleDeleteParticipant}
                limit={limit}
                onLoadMore={() => setLimit(limit + 12)}
              />

              {/* Collapsible Add/Edit Form */}
              <Box ref={participantFormRef} sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  startIcon={editingParticipant ? <EditIcon /> : <AddIcon />}
                  endIcon={
                    <ExpandMoreIcon 
                      sx={{ 
                        transform: showParticipantForm ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }} 
                    />
                  }
                  onClick={() => setShowParticipantForm(!showParticipantForm)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {editingParticipant ? 'Teilnehmer bearbeiten' : 'Neuen Teilnehmer hinzufügen'}
                </Button>
                
                <Collapse in={showParticipantForm}>
                  <Card variant="outlined">
                    <CardContent>
                      <ParticipantForm 
                        initial={editingParticipant} 
                        onSaved={() => { 
                          setEditingParticipant(undefined)
                          setShowParticipantForm(false)
                          loadAllData() 
                        }} 
                        onCancel={() => {
                          setEditingParticipant(undefined)
                          setShowParticipantForm(false)
                        }}
                      />
                    </CardContent>
                  </Card>
                </Collapse>
              </Box>
            </Box>
          )}

          {/* Matching Nights */}
          {activeTab === 'matching-nights' && (
            <Box sx={{ p: 3 }}>
              <MatchingNightManagement 
                participants={participants}
                matchboxes={matchboxes}
                matchingNights={matchingNights}
                onUpdate={loadAllData}
              />
            </Box>
          )}

          {/* Matchbox */}
          {activeTab === 'matchbox' && (
            <Box sx={{ p: 3 }}>
              <MatchboxManagement 
                participants={participants}
                matchboxes={matchboxes}
                onUpdate={loadAllData}
              />
            </Box>
          )}

          {/* Broadcast */}
          {activeTab === 'broadcast' && (
            <Box sx={{ p: 3 }}>
              <BroadcastManagement />
            </Box>
          )}

          {/* Settings (ohne Datenhaltungs-Sektionen) */}
          {activeTab === 'settings' && (
            <Box sx={{ p: 3 }}>
              <SettingsManagement 
                participants={participants}
                matchboxes={matchboxes}
                matchingNights={matchingNights}
                penalties={penalties}
                onUpdate={loadAllData}
                renderContext="settings"
              />
            </Box>
          )}

          {/* Datenhaltung (vormals JSON Import) */}
          {activeTab === 'json-import' && (
            <Box sx={{ p: 3 }}>
              {/* JSON-Daten Import an erster Stelle */}
              <Box sx={{ mb: 4 }}>
                <JsonImportManagement onDataUpdate={loadAllData} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={triggerSeedReset}
                  disabled={isSeedResetting}
                >
                  {isSeedResetting ? 'Zurücksetzen…' : 'Seed zurücksetzen (DB leeren)'}
                </Button>
              </Box>
              <SettingsManagement 
                participants={participants}
                matchboxes={matchboxes}
                matchingNights={matchingNights}
                penalties={penalties}
                onUpdate={loadAllData}
                renderContext="json-import"
              />
            </Box>
          )}
        </Card>
      </Box>
    </AdminLayout>
  )
}

export default AdminPanelMUI
