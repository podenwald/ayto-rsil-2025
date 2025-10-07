import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Nightlife as NightlifeIcon,
  Group as GroupIcon,
  Inventory as InventoryIcon,
  Notes as NotesIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { db, DatabaseUtils, type MatchingNight, type Matchbox, type BroadcastNote } from '../../lib/db'
// import { 
//   createBroadcastSortKey,
//   formatBroadcastDateTime
// } from '../../utils/broadcastUtils'

// Interface für ein Broadcast Event
interface BroadcastEvent {
  id: string
  type: 'matching-night' | 'matchbox'
  title: string
  description: string
  ausstrahlungsdatum: string
  ausstrahlungszeit: string
  data: MatchingNight | Matchbox
  sortKey: number // Für chronologische Sortierung
}

// ** Broadcast Management Component
interface BroadcastManagementProps {
  matchingNights: MatchingNight[]
  matchboxes: Matchbox[]
  onUpdate: () => void
}

const BroadcastManagement: React.FC<BroadcastManagementProps> = ({ 
  matchingNights, 
  matchboxes, 
  onUpdate 
}) => {
  const [broadcastEvents, setBroadcastEvents] = useState<BroadcastEvent[]>([])
  const [editingEvent, setEditingEvent] = useState<BroadcastEvent | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [notes, setNotes] = useState<Record<string, string>>({}) // date -> notes
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({}) // date -> isSaving

  useEffect(() => {
    generateBroadcastEvents(matchingNights, matchboxes)
  }, [matchingNights, matchboxes])

  useEffect(() => {
    loadAllNotes()
  }, [])

  const loadAllNotes = async () => {
    try {
      const allNotes = await DatabaseUtils.getAllBroadcastNotes()
      const notesMap: Record<string, string> = {}
      allNotes.forEach(note => {
        notesMap[note.date] = note.notes
      })
      setNotes(notesMap)
    } catch (error) {
      console.error('Fehler beim Laden der Notizen:', error)
    }
  }

  const handleSaveNote = async (date: string) => {
    const noteText = notes[date] || ''
    
    setSavingNotes(prev => ({ ...prev, [date]: true }))
    
    try {
      const note: BroadcastNote = {
        date,
        notes: noteText.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      if (noteText.trim()) {
        await DatabaseUtils.saveBroadcastNote(note)
        setSnackbar({
          open: true,
          message: 'Notiz gespeichert!',
          severity: 'success'
        })
      } else {
        // Wenn leer, lösche die Notiz
        const existing = await DatabaseUtils.getBroadcastNoteByDate(date)
        if (existing && existing.id) {
          await DatabaseUtils.deleteBroadcastNote(existing.id)
        }
        setSnackbar({
          open: true,
          message: 'Notiz gelöscht!',
          severity: 'success'
        })
      }
      
      await loadAllNotes()
    } catch (error) {
      console.error('Fehler beim Speichern der Notiz:', error)
      setSnackbar({
        open: true,
        message: 'Fehler beim Speichern!',
        severity: 'error'
      })
    } finally {
      setSavingNotes(prev => ({ ...prev, [date]: false }))
    }
  }

  const generateBroadcastEvents = (matchingNights: MatchingNight[], matchboxes: Matchbox[]) => {
    const events: BroadcastEvent[] = []

    // Matching Nights zu Events konvertieren
    matchingNights.forEach(mn => {
      const ausstrahlungsdatum = mn.ausstrahlungsdatum || mn.date
      const ausstrahlungszeit = mn.ausstrahlungszeit || '20:15' // Standard AYTO Zeit
      
      // Nur Events mit gültigen Ausstrahlungsdaten hinzufügen
      if (ausstrahlungsdatum && ausstrahlungszeit) {
        events.push({
          id: `mn-${mn.id}`,
          type: 'matching-night',
          title: mn.name,
          description: `Matching Night mit ${mn.pairs.length} Paaren und ${mn.totalLights || 0} Lichtern`,
          ausstrahlungsdatum,
          ausstrahlungszeit,
          data: mn,
          sortKey: new Date(`${ausstrahlungsdatum}T${ausstrahlungszeit}`).getTime()
        })
      }
    })

    // MatchBoxes zu Events konvertieren
    matchboxes.forEach(mb => {
      const ausstrahlungsdatum = mb.ausstrahlungsdatum || new Date(mb.createdAt).toISOString().split('T')[0]
      const ausstrahlungszeit = mb.ausstrahlungszeit || '20:15' // Standard AYTO Zeit
      
      // Nur Events mit gültigen Ausstrahlungsdaten hinzufügen
      if (ausstrahlungsdatum && ausstrahlungszeit) {
        let title = ''
        let description = ''
        
        // MatchBox Name im Format "Teilnehmer 1 + Teilnehmer 2"
        const matchboxName = `${mb.woman} + ${mb.man}`
        
        switch (mb.matchType) {
          case 'perfect':
            title = `Perfect Match: ${matchboxName}`
            description = 'MatchBox bestätigt als Perfect Match'
            break
          case 'no-match':
            title = `No Match: ${matchboxName}`
            description = 'MatchBox bestätigt als No Match'
            break
          case 'sold':
            title = `MatchBox Verkauf: ${matchboxName}`
            description = `Verkauft für ${mb.price} € an ${mb.buyer}`
            break
        }
        
        events.push({
          id: `mb-${mb.id}`,
          type: 'matchbox',
          title,
          description,
          ausstrahlungsdatum,
          ausstrahlungszeit,
          data: mb,
          sortKey: new Date(`${ausstrahlungsdatum}T${ausstrahlungszeit}`).getTime()
        })
      }
    })

    // Chronologisch sortieren - neueste zuerst
    events.sort((a, b) => b.sortKey - a.sortKey)
    setBroadcastEvents(events)
  }

  const handleEditEvent = (event: BroadcastEvent) => {
    setEditingEvent(event)
    setEditDialogOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!editingEvent) return

    try {
      if (editingEvent.type === 'matching-night') {
        const matchingNight = editingEvent.data as MatchingNight
        await db.matchingNights.update(matchingNight.id!, {
          ausstrahlungsdatum: editingEvent.ausstrahlungsdatum,
          ausstrahlungszeit: editingEvent.ausstrahlungszeit
        })
      } else {
        const matchbox = editingEvent.data as Matchbox
        await db.matchboxes.update(matchbox.id!, {
          ausstrahlungsdatum: editingEvent.ausstrahlungsdatum,
          ausstrahlungszeit: editingEvent.ausstrahlungszeit
        })
      }

      setSnackbar({ open: true, message: 'Ausstrahlungsdaten erfolgreich aktualisiert!', severity: 'success' })
      setEditDialogOpen(false)
      setEditingEvent(null)
      onUpdate()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      setSnackbar({ open: true, message: 'Fehler beim Speichern der Daten', severity: 'error' })
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'matching-night':
        return <NightlifeIcon sx={{ color: 'white' }} />
      case 'matchbox':
        return <InventoryIcon sx={{ color: 'white' }} />
      default:
        return <ScheduleIcon sx={{ color: 'white' }} />
    }
  }

  const getEventColor = (type: string, data: any) => {
    if (type === 'matching-night') {
      return 'primary'
    }
    
    if (type === 'matchbox') {
      switch (data.matchType) {
        case 'perfect':
          return 'success'
        case 'no-match':
          return 'error'
        case 'sold':
          return 'warning'
        default:
          return 'default'
      }
    }
    
    return 'default'
  }

  // formatDateTime wird jetzt durch formatBroadcastDateTime aus broadcastUtils ersetzt

  // Gruppiere Events nach Datum
  const groupedEvents = broadcastEvents.reduce((groups, event) => {
    const date = event.ausstrahlungsdatum
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {} as Record<string, BroadcastEvent[]>)

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ScheduleIcon />
        Ausstrahlungsplan
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Chronologische Übersicht aller Match Boxes und Matching Nights basierend auf Ausstrahlungsdatum und -zeit.
      </Typography>

      {Object.keys(groupedEvents).length === 0 ? (
        <Alert severity="info">
          Noch keine Events mit Ausstrahlungsdaten vorhanden. Erstelle MatchBoxes oder Matching Nights und setze deren Ausstrahlungsdaten.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(groupedEvents)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dateKey, events]) => {
              const formattedDate = new Date(dateKey).toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
              
              const hasNotes = notes[dateKey] && notes[dateKey].trim().length > 0
              
              return (
                <Accordion key={dateKey}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="h6">{formattedDate}</Typography>
                      <Chip 
                        label={`${events.length} Event${events.length !== 1 ? 's' : ''}`}
                        color="primary"
                        size="small"
                      />
                      {hasNotes && (
                        <Chip 
                          icon={<NotesIcon />}
                          label="Hat Notizen"
                          color="secondary"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {events.map((event, index) => {
                        const time = new Date(`${event.ausstrahlungsdatum}T${event.ausstrahlungszeit}`).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        const color = getEventColor(event.type, event.data)
                        
                        return (
                          <React.Fragment key={event.id}>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: `${color}.main` }}>
                                  {getEventIcon(event.type)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                disableTypography
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                      {event.title}
                                    </Typography>
                                    <Chip 
                                      label={time}
                                      size="small"
                                      color={color}
                                      variant="outlined"
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {event.description}
                                    </Typography>
                                    {event.type === 'matching-night' && (
                                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Chip 
                                          label={`${(event.data as MatchingNight).pairs.length} Paare`}
                                          size="small"
                                          icon={<GroupIcon />}
                                        />
                                        <Chip 
                                          label={`${(event.data as MatchingNight).totalLights || 0} Lichter`}
                                          size="small"
                                          color="warning"
                                        />
                                      </Box>
                                    )}
                                    {event.type === 'matchbox' && (event.data as Matchbox).matchType === 'sold' && (
                                      <Chip 
                                        label={`${(event.data as Matchbox).price} €`}
                                        size="small"
                                        color="warning"
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  edge="end" 
                                  onClick={() => handleEditEvent(event)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                            {index < events.length - 1 && <Divider variant="inset" component="li" />}
                          </React.Fragment>
                        )
                      })}
                    </List>

                    {/* Notizen Bereich */}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <NotesIcon color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Notizen zum Ausstrahlungstag
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Notizen zu diesem Ausstrahlungstag..."
                        value={notes[dateKey] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [dateKey]: e.target.value }))}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={() => handleSaveNote(dateKey)}
                          disabled={savingNotes[dateKey]}
                        >
                          {savingNotes[dateKey] ? 'Speichere...' : 'Notiz speichern'}
                        </Button>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )
            })}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Ausstrahlungsdaten bearbeiten
        </DialogTitle>
        <DialogContent>
          {editingEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="h6">{editingEvent.title}</Typography>
              
              <TextField
                label="Ausstrahlungsdatum"
                type="date"
                value={editingEvent.ausstrahlungsdatum}
                onChange={(e) => setEditingEvent({
                  ...editingEvent,
                  ausstrahlungsdatum: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              
              <TextField
                label="Ausstrahlungszeit"
                type="time"
                value={editingEvent.ausstrahlungszeit}
                onChange={(e) => setEditingEvent({
                  ...editingEvent,
                  ausstrahlungszeit: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSaveEvent} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default BroadcastManagement
