import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { importJsonDataForVersion, getAvailableJsonFiles } from '../../utils/jsonImport'
import { VERSION_INFO } from '@/utils/version'
import { db } from '../../lib/db'

interface JsonImportManagementProps {
  onDataUpdate?: () => void
}

const JsonImportManagement: React.FC<JsonImportManagementProps> = ({ onDataUpdate }) => {
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  })
  const [dataCounts, setDataCounts] = useState<{
    participants: number
    matchboxes: number
    matchingNights: number
    penalties: number
  }>({
    participants: 0,
    matchboxes: 0,
    matchingNights: 0,
    penalties: 0
  })

  useEffect(() => {
    loadAvailableFiles()
    loadDataCounts()
  }, [])

  const loadAvailableFiles = async () => {
    const files = await getAvailableJsonFiles()
    setAvailableFiles(files)
    if (files.length > 0) {
      setSelectedFile(files[0]) // Wähle die erste Datei als Standard
    }
  }

  const loadDataCounts = async () => {
    try {
      // Lade Datenzählungen direkt aus IndexedDB
      const [participants, matchboxes, matchingNights, penalties] = await Promise.all([
        db.participants.count(),
        db.matchboxes.count(),
        db.matchingNights.count(),
        db.penalties.count()
      ])
      
      setDataCounts({
        participants,
        matchboxes,
        matchingNights,
        penalties
      })
      
      console.log('✅ JSON Import Management: Datenzählungen direkt aus IndexedDB geladen')
    } catch (error) {
      console.error('❌ Fehler beim Laden der Datenzählungen aus IndexedDB:', error)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: 'Bitte wähle eine JSON-Datei aus',
        severity: 'error'
      })
      return
    }

    setIsImporting(true)
    setImportDialogOpen(false)

    try {
      // Nutze die aktuelle App-Version für das Logging im Import
      const version = VERSION_INFO.version
      const success = await importJsonDataForVersion(selectedFile, version)
      
      if (success) {
        setSnackbar({
          open: true,
          message: `JSON-Daten erfolgreich aus ${selectedFile} importiert!`,
          severity: 'success'
        })
        loadDataCounts()
        onDataUpdate?.()
      } else {
        setSnackbar({
          open: true,
          message: 'Fehler beim Importieren der JSON-Daten',
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Import-Fehler:', error)
      setSnackbar({
        open: true,
        message: `Fehler beim Importieren: ${error}`,
        severity: 'error'
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Entfernt: Erstellung einer Version mit JSON-Import

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        JSON-Daten Import
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Importiere Daten aus JSON-Dateien für neue Versionen. Alle bestehenden Daten werden dabei überschrieben.
      </Typography>

      {/* Aktuelle Daten-Übersicht */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Aktuelle Daten in der Datenbank
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              icon={<CheckCircleIcon />} 
              label={`${dataCounts.participants} Teilnehmer`} 
              color="primary" 
            />
            <Chip 
              icon={<CheckCircleIcon />} 
              label={`${dataCounts.matchboxes} Match Boxes`} 
              color="secondary" 
            />
            <Chip 
              icon={<CheckCircleIcon />} 
              label={`${dataCounts.matchingNights} Matching Nights`} 
              color="success" 
            />
            <Chip 
              icon={<CheckCircleIcon />} 
              label={`${dataCounts.penalties} Strafen`} 
              color="warning" 
            />
          </Box>
        </CardContent>
      </Card>

      {/* Verfügbare JSON-Dateien */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Verfügbare JSON-Dateien
            </Typography>
            <IconButton onClick={loadAvailableFiles} disabled={isImporting}>
              <RefreshIcon />
            </IconButton>
          </Box>
          
          {availableFiles.length === 0 ? (
            <Alert severity="info">
              Keine JSON-Dateien gefunden. Stelle sicher, dass JSON-Dateien im /json/ Verzeichnis vorhanden sind.
            </Alert>
          ) : (
            <List>
              {availableFiles.map((file, index) => (
                <React.Fragment key={file}>
                  <ListItem>
                    <ListItemText 
                      primary={file}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant={selectedFile === file ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setSelectedFile(file)}
                        disabled={isImporting}
                      >
                        {selectedFile === file ? 'Ausgewählt' : 'Auswählen'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < availableFiles.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Import-Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={isImporting ? <CircularProgress size={20} /> : <UploadIcon />}
          onClick={() => setImportDialogOpen(true)}
          disabled={isImporting || availableFiles.length === 0}
        >
          {isImporting ? 'Importiere...' : 'JSON-Daten importieren'}
        </Button>
      </Box>

      {/* Import-Bestätigungs-Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>JSON-Daten importieren</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du die Daten aus <strong>{selectedFile}</strong> importieren?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Achtung:</strong> Alle bestehenden Daten werden dabei überschrieben!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleImport} variant="contained" color="error">
            Importieren
          </Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar für Benachrichtigungen */}
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

export default JsonImportManagement
