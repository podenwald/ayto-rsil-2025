import { useEffect, useState } from 'react'
// Avatar utilities removed - using simple fallback logic
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { db, type Participant, type Matchbox, type MatchingNight } from '@/lib/db'
import { ImportExport } from './ImportExport'
import SafeSelect from '@/components/SafeSelect'
import { Edit, Trash2, Users, HelpCircle, Upload, Download, BarChart3, Heart, Database, AlertTriangle, Settings } from 'lucide-react'
import { isFileNewerThanLast, saveLastImportedJsonFile } from '@/utils/jsonVersion'

function useParticipants() {
  const [items, setItems] = useState<Participant[]>([])
  useEffect(() => { db.participants.toArray().then(setItems) }, [])
  const reload = async () => setItems(await db.participants.toArray())
  return { items, reload }
}

function ParticipantForm({ initial, onSaved }:{ initial?: Participant, onSaved: ()=>void }) {
  const [form, setForm] = useState<Participant>(initial ?? {
    name: '', knownFrom: '', age: undefined, status: '', photoUrl: '', bio: '', gender: 'F', socialMediaAccount: ''
  })

  useEffect(()=>{ if(initial) setForm(initial) }, [initial])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.id) await db.participants.update(form.id, form)
    else await db.participants.add(form)
    onSaved()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Name</label>
        <Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required className="h-10"/>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Bekannt aus</label>
        <Input value={form.knownFrom} onChange={e=>setForm({...form, knownFrom: e.target.value})} className="h-10"/>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Alter</label>
        <Input type="number" value={form.age ?? ''} onChange={e=>setForm({...form, age: e.target.value? parseInt(e.target.value,10): undefined})} className="h-10"/>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <Input value={form.status ?? ''} onChange={e=>setForm({...form, status: e.target.value})} className="h-10"/>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Foto URL</label>
        <Input value={form.photoUrl ?? ''} onChange={e=>setForm({...form, photoUrl: e.target.value})} placeholder="https://..." className="h-10"/>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Social Media Account</label>
        <Input value={form.socialMediaAccount ?? ''} onChange={e=>setForm({...form, socialMediaAccount: e.target.value})} placeholder="https://instagram.com/username" className="h-10"/>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Geschlecht</label>
        <div className="flex gap-4 items-center h-10">
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="gender" checked={form.gender==='F'} onChange={()=>setForm({...form, gender:'F'})}/> Frau</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="gender" checked={form.gender==='M'} onChange={()=>setForm({...form, gender:'M'})}/> Mann</label>
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-sm font-medium text-gray-700">Biografie</label>
        <Textarea value={form.bio ?? ''} onChange={e=>setForm({...form, bio: e.target.value})} rows={4} className="resize-none"/>
      </div>
      <div className="md:col-span-2 flex justify-end gap-3">
        <Button type="submit" className="h-10 px-6">Speichern</Button>
      </div>
    </form>
  )
}

// Matchbox Management Component
function MatchboxManagement() {
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [editingMatchbox, setEditingMatchbox] = useState<Matchbox | undefined>(undefined)
  const [matchboxForm, setMatchboxForm] = useState<Omit<Matchbox, 'id' | 'createdAt' | 'updatedAt'>>({
    woman: '',
    man: '',
    matchType: 'no-match',
    price: undefined,
    buyer: undefined,
    soldDate: undefined
  })
  const [showDetailsFor, setShowDetailsFor] = useState<'perfect' | 'no-match' | 'sold' | 'balance' | null>(null)

  useEffect(() => {
    loadMatchboxes()
    loadParticipants()
  }, [])

  async function loadMatchboxes() {
    try {
      const data = await db.matchboxes.toArray()
      setMatchboxes(data)
    } catch (error) {
      console.error('Fehler beim Laden der Matchboxes:', error)
    }
  }

  async function loadParticipants() {
    try {
      const data = await db.participants.toArray()
      setParticipants(data)
    } catch (error) {
      console.error('Fehler beim Laden der Teilnehmer:', error)
    }
  }

  function resetForm() {
    setMatchboxForm({
      woman: '',
      man: '',
      matchType: 'no-match',
      price: undefined,
      buyer: undefined,
      soldDate: undefined
    })
    setEditingMatchbox(undefined)
  }

  function startEditing(matchbox: Matchbox) {
    setEditingMatchbox(matchbox)
    setMatchboxForm({
      woman: matchbox.woman,
      man: matchbox.man,
      matchType: matchbox.matchType,
      price: matchbox.price,
      buyer: matchbox.buyer,
      soldDate: matchbox.soldDate
    })
  }

  async function saveMatchbox() {
    try {
      if (!matchboxForm.woman || !matchboxForm.man) {
        alert('Bitte wähle eine Frau und einen Mann aus!')
        return
      }

      if (matchboxForm.matchType === 'sold') {
        if (!matchboxForm.price || matchboxForm.price <= 0) {
          alert('Bei verkauften Matchboxes muss ein gültiger Preis angegeben werden!')
          return
        }
        if (!matchboxForm.buyer) {
          alert('Bei verkauften Matchboxes muss ein Käufer ausgewählt werden!')
          return
        }
      }

      const now = new Date()
      
      if (editingMatchbox) {
        // Update existing matchbox
        const updatedMatchbox = {
          ...editingMatchbox,
          ...matchboxForm,
          updatedAt: now,
          soldDate: matchboxForm.matchType === 'sold' ? (matchboxForm.soldDate || now) : undefined
        }
        await db.matchboxes.update(editingMatchbox.id!, updatedMatchbox)
        
        // Update state directly for immediate UI update
        setMatchboxes(prev => prev.map(mb => 
          mb.id === editingMatchbox.id ? updatedMatchbox : mb
        ))
        alert('Matchbox wurde erfolgreich aktualisiert!')
      } else {
        // Create new matchbox
        const newMatchbox = {
          ...matchboxForm,
          createdAt: now,
          updatedAt: now,
          soldDate: matchboxForm.matchType === 'sold' ? now : undefined
        }
        const id = await db.matchboxes.add(newMatchbox)
        
        // Update state directly for immediate UI update
        setMatchboxes(prev => [...prev, { ...newMatchbox, id }])
        alert('Matchbox wurde erfolgreich erstellt!')
      }

      resetForm()
      // No need to reload from DB since we updated state directly
    } catch (error) {
      console.error('Fehler beim Speichern der Matchbox:', error)
      alert(`Fehler beim Speichern der Matchbox: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  async function deleteMatchbox(id: number) {
    try {
      if (confirm('Matchbox wirklich löschen?')) {
        await db.matchboxes.delete(id)
        // Update state directly for immediate UI update
        setMatchboxes(prev => prev.filter(mb => mb.id !== id))
        alert('Matchbox wurde erfolgreich gelöscht!')
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Matchbox:', error)
      alert(`Fehler beim Löschen der Matchbox: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

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
  const soldMatchboxes = matchboxes.filter(mb => mb.matchType === 'sold').length
  const totalRevenue = matchboxes
    .filter(mb => mb.matchType === 'sold' && mb.price && typeof mb.price === 'number')
    .reduce((sum, mb) => sum + (mb.price || 0), 0)
  const STARTING_BUDGET = 200000
  const currentBalance = STARTING_BUDGET - totalRevenue

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex-row items-center justify-between border-b border-gray-100">
        <CardTitle className="text-lg font-semibold" style={{color: '#111827'}}>Matchbox Management</CardTitle>
        <div className="flex gap-3">
          {editingMatchbox && (
            <Button variant="outline" onClick={resetForm} className="h-10 px-6">
              Abbrechen
          </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowDetailsFor(showDetailsFor === 'perfect' ? null : 'perfect')}
            className="bg-green-50 border border-green-200 hover:border-green-300 rounded-2xl p-4 text-center transition-all hover:shadow-md"
          >
            <div className="text-2xl font-bold text-green-700">{perfectMatches}</div>
            <div className="text-sm text-green-600">Perfekt Matches</div>
          </button>
          <button 
            onClick={() => setShowDetailsFor(showDetailsFor === 'no-match' ? null : 'no-match')}
            className="bg-red-50 border border-red-200 hover:border-red-300 rounded-2xl p-4 text-center transition-all hover:shadow-md"
          >
            <div className="text-2xl font-bold text-red-700">{noMatches}</div>
            <div className="text-sm text-red-600">No Matches</div>
          </button>
          <button 
            onClick={() => setShowDetailsFor(showDetailsFor === 'sold' ? null : 'sold')}
            className="bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-2xl p-4 text-center transition-all hover:shadow-md"
          >
            <div className="text-2xl font-bold text-blue-700">{soldMatchboxes}</div>
            <div className="text-sm text-blue-600">Verkauft</div>
          </button>
          <button 
            onClick={() => setShowDetailsFor(showDetailsFor === 'balance' ? null : 'balance')}
            className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-4 text-center transition-all hover:shadow-md"
          >
            <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {currentBalance.toLocaleString('de-DE')} €
            </div>
            <div className="text-sm text-gray-600">Kontostand</div>
          </button>
        </div>

        {/* Detail Views */}
        {showDetailsFor && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              {showDetailsFor === 'perfect' && 'Perfect Matches Details'}
              {showDetailsFor === 'no-match' && 'No Matches Details'}
              {showDetailsFor === 'sold' && 'Verkaufte Matchboxes Details'}
              {showDetailsFor === 'balance' && 'Kontostand Details'}
            </h3>
            
            {showDetailsFor === 'perfect' && (
              <div className="space-y-3">
                {matchboxes.filter(mb => mb.matchType === 'perfect').length === 0 ? (
                  <p className="text-gray-500">Keine Perfect Matches vorhanden</p>
                ) : (
                  matchboxes
                    .filter(mb => mb.matchType === 'perfect')
                    .map((matchbox) => (
                      <div key={matchbox.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <span className="font-semibold">{matchbox.woman} + {matchbox.man}</span>
                          <p className="text-xs text-gray-500">
                            Erstellt: {new Date(matchbox.createdAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <Heart className="h-5 w-5 text-green-600" />
                      </div>
                    ))
                )}
              </div>
            )}

            {showDetailsFor === 'no-match' && (
              <div className="space-y-3">
                {matchboxes.filter(mb => mb.matchType === 'no-match').length === 0 ? (
                  <p className="text-gray-500">Keine No Matches vorhanden</p>
                ) : (
                  matchboxes
                    .filter(mb => mb.matchType === 'no-match')
                    .map((matchbox) => (
                      <div key={matchbox.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <span className="font-semibold">{matchbox.woman} + {matchbox.man}</span>
                          <p className="text-xs text-gray-500">
                            Erstellt: {new Date(matchbox.createdAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    ))
                )}
              </div>
            )}

            {showDetailsFor === 'sold' && (
              <div className="space-y-3">
                {matchboxes.filter(mb => mb.matchType === 'sold').length === 0 ? (
                  <p className="text-gray-500">Keine verkauften Matchboxes vorhanden</p>
                ) : (
                  matchboxes
                    .filter(mb => mb.matchType === 'sold')
                    .map((matchbox) => (
                      <div key={matchbox.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <span className="font-semibold">{matchbox.woman} + {matchbox.man}</span>
                          <p className="text-sm text-gray-600">
                            Käufer: {matchbox.buyer} • {matchbox.price?.toLocaleString('de-DE')} €
                          </p>
                          <p className="text-xs text-gray-500">
                            Verkauft: {matchbox.soldDate ? new Date(matchbox.soldDate).toLocaleDateString('de-DE') : 'Unbekannt'}
                          </p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                    ))
                )}
              </div>
            )}

            {showDetailsFor === 'balance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xl font-bold text-green-700">{STARTING_BUDGET.toLocaleString('de-DE')} €</div>
                    <div className="text-sm text-green-600">Startkapital</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-xl font-bold text-red-700">-{totalRevenue.toLocaleString('de-DE')} €</div>
                    <div className="text-sm text-red-600">Ausgaben</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className={`text-xl font-bold ${currentBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {currentBalance.toLocaleString('de-DE')} €
                    </div>
                    <div className="text-sm text-gray-600">Aktueller Stand</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Berechnung:</strong> Startkapital ({STARTING_BUDGET.toLocaleString('de-DE')} €) - Verkaufte Matchboxes ({totalRevenue.toLocaleString('de-DE')} €) = {currentBalance.toLocaleString('de-DE')} €</p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowDetailsFor(null)}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Schließen
            </button>
          </div>
        )}

        {/* Matchbox Form */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {editingMatchbox ? 'Matchbox bearbeiten' : 'Neue Matchbox erstellen'}
            </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Frau</label>
              <SafeSelect
                value={matchboxForm.woman}
                onValueChange={(value) => setMatchboxForm({...matchboxForm, woman: value})}
                placeholder="Frau wählen..."
                items={availableWomen.map(woman => ({
                  id: woman.id || 0,
                  name: woman.name || 'Unbekannt',
                  value: woman.name || ''
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mann</label>
              <SafeSelect
                value={matchboxForm.man}
                onValueChange={(value) => setMatchboxForm({...matchboxForm, man: value})}
                placeholder="Mann wählen..."
                items={availableMen.map(man => ({
                  id: man.id || 0,
                  name: man.name || 'Unbekannt',
                  value: man.name || ''
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Match-Typ</label>
              <Select 
                value={matchboxForm.matchType} 
                onValueChange={(value: 'perfect' | 'no-match' | 'sold') => setMatchboxForm({...matchboxForm, matchType: value})}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perfect">Perfekt Match</SelectItem>
                  <SelectItem value="no-match">No Match</SelectItem>
                  <SelectItem value="sold">Verkauft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {matchboxForm.matchType === 'sold' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Preis (€)</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={matchboxForm.price || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      setMatchboxForm({...matchboxForm, price: isNaN(value) ? undefined : value})
                    }}
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Käufer</label>
                  <SafeSelect
                    value={matchboxForm.buyer || ''}
                    onValueChange={(value) => setMatchboxForm({...matchboxForm, buyer: value})}
                    placeholder="Käufer wählen..."
                    items={[...women, ...men]
                      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
                      .map(participant => ({
                        id: participant.id || 0,
                        name: `${participant.name || 'Unbekannt'} (${participant.gender === 'F' ? 'F' : 'M'})`,
                        value: participant.name || ''
                      }))
                    }
                  />
            </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={saveMatchbox} className="h-10 px-6">
              {editingMatchbox ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </div>

        {/* Existing Matchboxes */}
          <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bestehende Matchboxes ({matchboxes.length})</h3>
          
          {matchboxes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Noch keine Matchboxes vorhanden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchboxes
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((matchbox) => (
                <div key={matchbox.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{matchbox.woman} + {matchbox.man}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className={`text-xs ${
                            matchbox.matchType === 'perfect' ? 'bg-green-500' :
                            matchbox.matchType === 'no-match' ? 'bg-red-500' :
                            'bg-blue-500'
                          } text-white border-0`}>
                            {matchbox.matchType === 'perfect' ? 'Perfekt Match' :
                             matchbox.matchType === 'no-match' ? 'No Match' :
                             'Verkauft'}
                  </Badge>
                          {matchbox.matchType === 'sold' && matchbox.price && (
                            <Badge className="bg-blue-500 text-white border-0 text-xs">
                              €{matchbox.price}
                            </Badge>
                          )}
                        </div>
                        {matchbox.matchType === 'sold' && matchbox.buyer && (
                          <p className="text-sm text-gray-600 mt-1">
                            Käufer: {matchbox.buyer}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Erstellt: {new Date(matchbox.createdAt).toLocaleString('de-DE', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {matchbox.updatedAt && new Date(matchbox.updatedAt).getTime() !== new Date(matchbox.createdAt).getTime() && (
                            <span className="block mt-1">Bearbeitet: {new Date(matchbox.updatedAt).toLocaleString('de-DE', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => startEditing(matchbox)}
                        variant="outline" 
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Bearbeiten
                      </Button>
                      <Button 
                        onClick={() => deleteMatchbox(matchbox.id!)}
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Matching Night Management Component
function MatchingNightManagement() {
  const [matchingNights, setMatchingNights] = useState<MatchingNight[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([])
  const [editingMatchingNight, setEditingMatchingNight] = useState<MatchingNight | undefined>(undefined)
  const [matchingNightForm, setMatchingNightForm] = useState<{
    name: string;
    totalLights: number;
    pairs: Array<{woman: string, man: string}>;
  }>({
    name: '',
    totalLights: 0,
    pairs: []
  })
  const [selectedWoman, setSelectedWoman] = useState<string>('')
  const [selectedMan, setSelectedMan] = useState<string>('')

  useEffect(() => {
    loadAllData()
  }, [])

  // Initialize total lights from last matching night when data loads
  useEffect(() => {
    if (matchingNights.length > 0 && matchingNightForm.totalLights === 0 && !editingMatchingNight) {
      const lastMatchingNight = matchingNights
        .sort((a: MatchingNight, b: MatchingNight) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      const lastTotalLights = lastMatchingNight?.totalLights || 0
      
      if (lastTotalLights > 0) {
        setMatchingNightForm(prev => ({
          ...prev,
          totalLights: lastTotalLights
        }))
      }
    }
  }, [matchingNights, matchingNightForm.totalLights, editingMatchingNight])

  async function loadAllData() {
    try {
      const [matchingNightsData, participantsData, matchboxesData] = await Promise.all([
        db.matchingNights.toArray(),
        db.participants.toArray(),
        db.matchboxes.toArray()
      ])
      setMatchingNights(matchingNightsData)
      setParticipants(participantsData)
      setMatchboxes(matchboxesData)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    }
  }

  // Perfect Match Logik - nur Matchboxes die VOR der aktuellen Matching Night ausgestrahlt wurden
  const getValidPerfectMatches = (currentMatchingNightDate?: string) => {
    if (!currentMatchingNightDate) {
      // Wenn keine Matching Night ausgewählt ist, alle Perfect Matches anzeigen
      return matchboxes
        .filter(mb => mb.matchType === 'perfect')
        .map(mb => ({ woman: mb.woman, man: mb.man }))
    }
    
    const currentDate = new Date(currentMatchingNightDate)
    return matchboxes
      .filter(mb => {
        if (mb.matchType !== 'perfect') return false
        
        // Matchbox muss VOR der Matching Night ausgestrahlt worden sein
        if (mb.ausstrahlungsdatum && mb.ausstrahlungszeit) {
          const matchboxDateTime = new Date(`${mb.ausstrahlungsdatum}T${mb.ausstrahlungszeit}`)
          return matchboxDateTime.getTime() < currentDate.getTime()
        }
        
        const matchboxDate = mb.ausstrahlungsdatum ? new Date(mb.ausstrahlungsdatum) : new Date(mb.createdAt)
        return matchboxDate.getTime() < currentDate.getTime()
      })
      .map(mb => ({ woman: mb.woman, man: mb.man }))
  }
  
  const perfectMatchPairs = getValidPerfectMatches()

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

  function resetForm() {
    // Get the last matching night's total lights for carryover
    const lastMatchingNight = matchingNights
      .sort((a: MatchingNight, b: MatchingNight) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const lastTotalLights = lastMatchingNight?.totalLights || 0
    
    setMatchingNightForm({
      name: '',
      totalLights: lastTotalLights,
      pairs: []
    })
    setSelectedWoman('')
    setSelectedMan('')
    setEditingMatchingNight(undefined)
  }

  function startEditing(matchingNight: MatchingNight) {
    setEditingMatchingNight(matchingNight)
    setMatchingNightForm({
      name: matchingNight.name,
      totalLights: matchingNight.totalLights || 0,
      pairs: [...matchingNight.pairs]
    })
  }

  function addPair() {
    if (selectedWoman && selectedMan) {
      setMatchingNightForm({
        ...matchingNightForm,
        pairs: [...matchingNightForm.pairs, { woman: selectedWoman, man: selectedMan }]
      })
      setSelectedWoman('')
      setSelectedMan('')
    }
  }

  function removePair(index: number) {
    setMatchingNightForm({
      ...matchingNightForm,
      pairs: matchingNightForm.pairs.filter((_, i) => i !== index)
    })
  }

  // Perfect Matches automatisch hinzufügen
  function initializeWithPerfectMatches() {
    if (perfectMatchPairs.length > 0 && matchingNightForm.pairs.length === 0) {
      setMatchingNightForm({
        ...matchingNightForm,
        pairs: [...perfectMatchPairs]
      })
    }
  }

  async function saveMatchingNight() {
    try {
      // Validierung: Maximum 10 Lichter erlaubt
      if (matchingNightForm.totalLights > 10) {
        alert('Maximum 10 Lichter erlaubt!')
        return
      }

      // Validierung: Alle 10 Paare müssen vollständig sein
      const completePairs = matchingNightForm.pairs.filter(pair => pair && pair.woman && pair.man)
      
      if (completePairs.length !== 10) {
        alert(`Alle 10 Pärchen müssen vollständig sein! Aktuell: ${completePairs.length}/10 vollständig`)
        return
      }

      // Validierung: Geschlechts-Konflikte prüfen
      const genderConflicts = completePairs.filter(pair => {
        const womanParticipant = participants.find(p => p.name === pair.woman)
        const manParticipant = participants.find(p => p.name === pair.man)
        return womanParticipant && manParticipant && womanParticipant.gender === manParticipant.gender
      })

      if (genderConflicts.length > 0) {
        alert('Geschlechts-Konflikt gefunden! Jedes Paar muss aus einem Mann und einer Frau bestehen.')
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
        alert(`Gesamtlichter (${matchingNightForm.totalLights}) dürfen nicht weniger als sichere Lichter (${perfectMatchLights}) sein!`)
        return
      }

      const now = new Date()
      
      if (editingMatchingNight) {
        // Update existing
        await db.matchingNights.update(editingMatchingNight.id!, {
          name: matchingNightForm.name,
          totalLights: matchingNightForm.totalLights,
          pairs: matchingNightForm.pairs
        })
        alert('Matching Night wurde erfolgreich aktualisiert!')
    } else {
        // Create new
        const autoGeneratedName = `Matching Night #${matchingNights.length + 1}`
        
        await db.matchingNights.add({
          name: autoGeneratedName,
          date: new Date().toISOString().split('T')[0],
          totalLights: matchingNightForm.totalLights,
          pairs: matchingNightForm.pairs,
          createdAt: now
        })
        alert(`Matching Night "${autoGeneratedName}" wurde erfolgreich erstellt!`)
      }

      resetForm()
      loadAllData()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  async function deleteMatchingNight(id: number) {
    try {
      if (confirm('Matching Night wirklich löschen?')) {
        await db.matchingNights.delete(id)
        loadAllData()
        alert('Matching Night wurde erfolgreich gelöscht!')
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      alert(`Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex-row items-center justify-between border-b border-gray-100">
        <CardTitle className="text-lg font-semibold" style={{color: '#111827'}}>Matching Night Management</CardTitle>
        <div className="flex gap-3">
          {editingMatchingNight && (
            <Button variant="outline" onClick={resetForm} className="h-10 px-6">
              Abbrechen
            </Button>
          )}
          {perfectMatchPairs.length > 0 && (
            <Button variant="outline" onClick={initializeWithPerfectMatches} disabled className="h-10 px-6 opacity-50 cursor-not-allowed">
              <Heart className="h-4 w-4 mr-2"/>Perfect Matches hinzufügen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-pink-700">{matchingNights.length}</div>
            <div className="text-sm text-pink-600">Gespeicherte Matching Nights</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{perfectMatchPairs.length}</div>
            <div className="text-sm text-green-600">Perfect Matches</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{matchingNightForm.totalLights}</div>
            <div className="text-sm text-yellow-600">Aktuelle Lichter</div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {editingMatchingNight ? 'Matching Night bearbeiten' : 'Neue Matching Night erstellen'}
          </h3>
          
          {/* Name und Lichter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Name</label>
                  <Input 
                value={matchingNightForm.name}
                onChange={(e) => setMatchingNightForm({...matchingNightForm, name: e.target.value})}
                placeholder="z.B. Episode 1, Matching Night 1..."
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gesamtlichter aus der Show</label>
              <Input
                type="number"
                min="0"
                max="11"
                value={matchingNightForm.totalLights}
                onChange={(e) => setMatchingNightForm({...matchingNightForm, totalLights: parseInt(e.target.value) || 0})}
                placeholder="0"
                className="h-10"
              />
            </div>
          </div>

          {/* Lichter-Analyse */}
          {matchingNightForm.totalLights > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                💡 Lichter-Analyse
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
                  <div className="text-xl font-bold text-yellow-600">{matchingNightForm.totalLights}</div>
                  <div className="text-yellow-700">Gesamtlichter</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-xl font-bold text-green-600">{automaticLights}</div>
                  <div className="text-green-700">Perfect Matches</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                  <div className="text-xl font-bold text-blue-600">{manualLights}</div>
                  <div className="text-blue-700">Andere Paare</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-xl font-bold text-gray-600">{Math.max(0, 11 - matchingNightForm.pairs.length)}</div>
                  <div className="text-gray-700">Fehlende Paare</div>
                </div>
              </div>
              {manualLights < 0 && (
                <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                  ⚠️ Achtung: Mehr Perfect Matches als Gesamtlichter!
                </div>
              )}
            </div>
          )}

          {/* Paar hinzufügen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Frau auswählen</label>
              <SafeSelect
                value={selectedWoman}
                onValueChange={setSelectedWoman}
                placeholder="Frau wählen..."
                items={women.map(woman => ({
                  id: woman.id || 0,
                  name: `${woman.name || 'Unbekannt'} ${usedWomen.includes(woman.name || '') ? '(bereits verwendet)' : ''}`,
                  value: woman.name || '',
                  disabled: usedWomen.includes(woman.name || ''),
                  className: usedWomen.includes(woman.name || '') ? 'opacity-50 cursor-not-allowed' : ''
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mann auswählen</label>
              <SafeSelect
                value={selectedMan}
                onValueChange={setSelectedMan}
                placeholder="Mann wählen..."
                items={men.map(man => ({
                  id: man.id || 0,
                  name: `${man.name || 'Unbekannt'} ${usedMen.includes(man.name || '') ? '(bereits verwendet)' : ''}`,
                  value: man.name || '',
                  disabled: usedMen.includes(man.name || ''),
                  className: usedMen.includes(man.name || '') ? 'opacity-50 cursor-not-allowed' : ''
                }))}
              />
            </div>
            
            <div>
              <Button 
                onClick={addPair}
                disabled={!selectedWoman || !selectedMan}
                className="w-full h-10 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Paar hinzufügen
              </Button>
            </div>
          </div>

          {/* Ausgewählte Paare */}
          {matchingNightForm.pairs.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                Ausgewählte Paare ({matchingNightForm.pairs.length})
              </h4>
              <div className="space-y-2">
                {matchingNightForm.pairs.map((pair, index) => {
                  const isPerfectMatch = perfectMatchPairs.some(
                    pm => pm.woman === pair.woman && pm.man === pair.man
                  )
                  
                  return (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isPerfectMatch ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPerfectMatch 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-br from-pink-400 to-red-500'
                        }`}>
                          {isPerfectMatch ? (
                            <Heart className="h-4 w-4 text-white" />
                          ) : (
                            <Users className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{pair.woman} + {pair.man}</span>
                            {isPerfectMatch && (
                              <Badge className="bg-green-500 text-white border-0 text-xs px-2 py-0.5">
                                Perfect Match
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isPerfectMatch && (
                        <Button 
                          onClick={() => removePair(index)}
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {isPerfectMatch && (
                        <div className="text-xs text-green-600 font-medium">
                          Fest gesetzt
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button onClick={saveMatchingNight} className="h-10 px-6">
              {editingMatchingNight ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </div>

        {/* Existing Matching Nights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bestehende Matching Nights ({matchingNights.length})</h3>
          
          {matchingNights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Noch keine Matching Nights vorhanden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchingNights
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((matchingNight) => (
                <div key={matchingNight.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{matchingNight.name}</p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-600">
                          <span>{new Date(matchingNight.date).toLocaleDateString('de-DE')}</span>
                          <span>{matchingNight.pairs.length} Paare</span>
                          {matchingNight.totalLights !== undefined && (
                            <span>💡 {matchingNight.totalLights} Lichter</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Erstellt: {new Date(matchingNight.createdAt).toLocaleString('de-DE', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => startEditing(matchingNight)}
                        variant="outline" 
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Bearbeiten
                      </Button>
                      <Button 
                        onClick={() => deleteMatchingNight(matchingNight.id!)}
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
      </CardContent>
    </Card>
  )
}

// Import & Export Management Component
function ImportExportManagement() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matchingNights, setMatchingNights] = useState<any[]>([])
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    try {
      setIsLoading(true)
      const [participantsData, matchingNightsData, matchboxesData] = await Promise.all([
        db.participants.toArray(),
        db.matchingNights.toArray(),
        db.matchboxes.toArray()
      ])
      setParticipants(participantsData)
      setMatchingNights(matchingNightsData)
      setMatchboxes(matchboxesData)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
      alert(`Fehler beim Laden der Daten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Export-Funktionen
  async function exportParticipants() {
    try {
      const data = await db.participants.toArray()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `participants-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      alert(`✅ ${data.length} Teilnehmer wurden exportiert!`)
    } catch (error) {
      console.error('Fehler beim Export der Teilnehmer:', error)
      alert(`❌ Fehler beim Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  async function exportMatchingNights() {
    try {
      const data = await db.matchingNights.toArray()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matching-nights-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      alert(`✅ ${data.length} Matching Nights wurden exportiert!`)
    } catch (error) {
      console.error('Fehler beim Export der Matching Nights:', error)
      alert(`❌ Fehler beim Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  async function exportMatchboxes() {
    try {
      const data = await db.matchboxes.toArray()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matchboxes-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      alert(`✅ ${data.length} Matchboxes wurden exportiert!`)
    } catch (error) {
      console.error('Fehler beim Export der Matchboxes:', error)
      alert(`❌ Fehler beim Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  async function exportAllData() {
    try {
      const [participantsData, matchingNightsData, matchboxesData] = await Promise.all([
        db.participants.toArray(),
        db.matchingNights.toArray(),
        db.matchboxes.toArray()
      ])
      
      const allData = {
        participants: participantsData,
        matchingNights: matchingNightsData,
        matchboxes: matchboxesData,
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
      
      const totalItems = participantsData.length + matchingNightsData.length + matchboxesData.length
      alert(`✅ Kompletter Export erfolgreich!\n\n${participantsData.length} Teilnehmer\n${matchingNightsData.length} Matching Nights\n${matchboxesData.length} Matchboxes\n\nGesamt: ${totalItems} Einträge`)
    } catch (error) {
      console.error('Fehler beim kompletten Export:', error)
      alert(`❌ Fehler beim kompletten Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  async function importParticipantsJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setIsLoading(true)
      const text = await file.text()
      // Dateinamen-/Datumsprüfung
      const check = isFileNewerThanLast(file.name)
      if (check.isNewer === false) {
        const proceed = confirm(
          `Die ausgewählte Datei scheint nicht neuer zu sein als die zuletzt verwendete.\n\n`+
          `Zuletzt importiert: ${check.lastFileName ?? 'unbekannt'}\n`+
          `Aktuelle Datei: ${file.name}\n\n`+
          `Trotzdem importieren?`
        )
        if (!proceed) return
      }
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
      
      console.log('Normalisierte Teilnehmer:', normalizedParticipants)
      
      if (!confirm(`${normalizedParticipants.length} Teilnehmer aus JSON importieren?\n\nDies ersetzt alle bestehenden Teilnehmer!`)) {
        return
      }
      
      await db.transaction('rw', db.participants, async () => {
        await db.participants.clear()
        await db.participants.bulkAdd(normalizedParticipants)
      })
      
      await loadAllData()
      // Nach Erfolg: Dateiname speichern
      saveLastImportedJsonFile(file.name)
      alert(`✅ Import erfolgreich abgeschlossen!\n\n${normalizedParticipants.length} Teilnehmer wurden importiert.`)
    } catch (error) {
      console.error('Fehler beim Import:', error)
      alert(`❌ Fehler beim Import: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nBitte überprüfen Sie die JSON-Datei.`)
    } finally {
      setIsLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  async function loadTestData() {
    try {
      if (!confirm('Testdaten laden?\n\nDies fügt Beispieldaten zu allen Kategorien hinzu.')) {
        return
      }
      
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
      
      await loadAllData()
      alert('✅ Testdaten wurden erfolgreich geladen!')
    } catch (error) {
      console.error('Fehler beim Laden der Testdaten:', error)
      alert(`❌ Fehler beim Laden der Testdaten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const totalEntries = participants.length + matchingNights.length + matchboxes.length

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex-row items-center justify-between border-b border-gray-100">
        <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{color: '#111827'}}>
          <Upload className="h-5 w-5" />
          Import & Export
        </CardTitle>
        <div className="flex gap-3">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 h-10 bg-white hover:bg-gray-50 transition-colors">
            <Upload className="h-4 w-4"/> Teilnehmer JSON
            <input 
              type="file" 
              className="hidden" 
              accept="application/json" 
              onChange={importParticipantsJSON}
              disabled={isLoading}
            />
          </label>
          <Button 
            variant="outline" 
            onClick={loadTestData}
            disabled={isLoading}
            className="h-10 px-6"
          >
            <Upload className="h-4 w-4 mr-2"/>
            Testdaten laden
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Export Actions */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Daten exportieren
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-xl border border-green-200">
              <div className="text-center mb-4">
                <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <h4 className="font-semibold text-gray-800">Teilnehmer</h4>
                <p className="text-sm text-gray-600">{participants.length} Einträge</p>
              </div>
              <Button 
                variant="outline" 
                onClick={exportParticipants}
                disabled={isLoading || participants.length === 0}
                className="w-full h-10"
              >
                <Download className="h-4 w-4 mr-2"/>
                JSON Export
              </Button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-green-200">
              <div className="text-center mb-4">
                <Heart className="h-8 w-8 mx-auto text-pink-600 mb-2" />
                <h4 className="font-semibold text-gray-800">Matching Nights</h4>
                <p className="text-sm text-gray-600">{matchingNights.length} Einträge</p>
              </div>
              <Button 
                variant="outline" 
                onClick={exportMatchingNights}
                disabled={isLoading || matchingNights.length === 0}
                className="w-full h-10"
              >
                <Download className="h-4 w-4 mr-2"/>
                JSON Export
              </Button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-green-200">
              <div className="text-center mb-4">
                <BarChart3 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <h4 className="font-semibold text-gray-800">Matchboxes</h4>
                <p className="text-sm text-gray-600">{matchboxes.length} Einträge</p>
              </div>
              <Button 
                variant="outline" 
                onClick={exportMatchboxes}
                disabled={isLoading || matchboxes.length === 0}
                className="w-full h-10"
              >
                <Download className="h-4 w-4 mr-2"/>
                JSON Export
              </Button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-green-200">
              <div className="text-center mb-4">
                <Database className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <h4 className="font-semibold text-gray-800">Komplettexport</h4>
                <p className="text-sm text-gray-600">{totalEntries} Einträge</p>
              </div>
              <Button 
                variant="outline" 
                onClick={exportAllData}
                disabled={isLoading || totalEntries === 0}
                className="w-full h-10 bg-green-500 text-white hover:bg-green-600 border-green-500"
              >
                <Download className="h-4 w-4 mr-2"/>
                Alles exportieren
              </Button>
            </div>
          </div>
          
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-green-800 text-sm">
            <strong>💡 Tipp:</strong> Alle Exports werden als JSON-Dateien mit Datum heruntergeladen. 
            Der Komplettexport enthält alle Daten in einer strukturierten Datei.
          </div>
        </div>

        {/* Warning Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <strong>Wichtige Hinweise:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Export:</strong> Alle Daten können einzeln oder komplett als JSON exportiert werden</li>
                <li>Testdaten können zur Demonstration geladen werden</li>
                <li><strong>JSON-Import:</strong> Gender wird automatisch von w/m zu F/M konvertiert</li>
                <li>JSON-Import ersetzt alle bestehenden Teilnehmer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Verarbeitung läuft...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Database Management Component (DB specific functions)
function DBManagement() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matchingNights, setMatchingNights] = useState<any[]>([])
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([])
  const [penalties, setPenalties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    try {
      setIsLoading(true)
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
      alert(`Fehler beim Laden der Daten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteParticipants() {
    try {
      if (!confirm(`Wirklich alle ${participants.length} Teilnehmer löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`)) {
        return
      }
      
      setIsLoading(true)
      await db.participants.clear()
      await loadAllData()
      alert('Alle Teilnehmer wurden erfolgreich gelöscht!')
    } catch (error) {
      console.error('Fehler beim Löschen der Teilnehmer:', error)
      alert(`Fehler beim Löschen der Teilnehmer: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteMatchingNights() {
    try {
      if (!confirm(`Wirklich alle ${matchingNights.length} Matching Nights löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`)) {
        return
      }
      
      setIsLoading(true)
      await db.matchingNights.clear()
      await loadAllData()
      alert('Alle Matching Nights wurden erfolgreich gelöscht!')
    } catch (error) {
      console.error('Fehler beim Löschen der Matching Nights:', error)
      alert(`Fehler beim Löschen der Matching Nights: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteMatchboxes() {
    try {
      if (!confirm(`Wirklich alle ${matchboxes.length} Matchboxes löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`)) {
        return
      }
      
      setIsLoading(true)
      await db.matchboxes.clear()
      await loadAllData()
      alert('Alle Matchboxes wurden erfolgreich gelöscht!')
    } catch (error) {
      console.error('Fehler beim Löschen der Matchboxes:', error)
      alert(`Fehler beim Löschen der Matchboxes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function resetCompleteDatabase() {
    try {
      const totalItems = participants.length + matchingNights.length + matchboxes.length + penalties.length
      
      if (!confirm(`⚠️ ACHTUNG: KOMPLETTER DATENBANK-RESET ⚠️

Diese Aktion wird ALLE Daten unwiderruflich löschen:
• ${participants.length} Teilnehmer
• ${matchingNights.length} Matching Nights  
• ${matchboxes.length} Matchboxes
• ${penalties.length} Strafen/Transaktionen
• Gesamt: ${totalItems} Einträge

Dieser Vorgang kann NICHT rückgängig gemacht werden!

Sind Sie sich absolut sicher?`)) {
        return
      }

      // Doppelte Bestätigung für kompletten Reset
      if (!confirm('LETZTE WARNUNG!\n\nWirklich die KOMPLETTE Datenbank löschen?\n\nAlle Daten gehen unwiderruflich verloren!')) {
        return
      }
      
      setIsLoading(true)
      
      // Alle Tabellen leeren
      await Promise.all([
        db.participants.clear(),
        db.matchingNights.clear(),
        db.matchboxes.clear(),
        db.penalties.clear()
      ])
      
      await loadAllData()
      alert('✅ Datenbank wurde komplett zurückgesetzt!\n\nAlle Daten wurden erfolgreich gelöscht.')
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Datenbank:', error)
      alert(`❌ Fehler beim Zurücksetzen der Datenbank: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const totalEntries = participants.length + matchingNights.length + matchboxes.length

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex-row items-center justify-between border-b border-gray-100">
        <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{color: '#111827'}}>
          <Database className="h-5 w-5" />
          DB
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Database Statistics */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Datenbank Übersicht
            </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{participants.length}</div>
              <div className="text-sm text-blue-600">Teilnehmer</div>
                </div>
            <div className="text-center p-4 bg-white rounded-xl border border-pink-200">
              <div className="text-2xl font-bold text-pink-700">{matchingNights.length}</div>
              <div className="text-sm text-pink-600">Matching Nights</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-700">{matchboxes.length}</div>
              <div className="text-sm text-green-600">Matchboxes</div>
          </div>
            <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-700">{totalEntries}</div>
              <div className="text-sm text-gray-600">Gesamt</div>
            </div>
          </div>
        </div>


        {/* Selective Delete Actions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-yellow-600" />
            Selektive Löschungen
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-yellow-200">
              <div className="text-center mb-4">
                <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <h4 className="font-semibold text-gray-800">Teilnehmer</h4>
                <p className="text-sm text-gray-600">{participants.length} Einträge</p>
                </div>
              <Button 
                variant="destructive" 
                onClick={deleteParticipants}
                disabled={isLoading || participants.length === 0}
                className="w-full h-10"
              >
                <Trash2 className="h-4 w-4 mr-2"/>
                Alle löschen
              </Button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-yellow-200">
              <div className="text-center mb-4">
                <Heart className="h-8 w-8 mx-auto text-pink-600 mb-2" />
                <h4 className="font-semibold text-gray-800">Matching Nights</h4>
                <p className="text-sm text-gray-600">{matchingNights.length} Einträge</p>
          </div>
              <Button 
                variant="destructive" 
                onClick={deleteMatchingNights}
                disabled={isLoading || matchingNights.length === 0}
                className="w-full h-10"
              >
                <Trash2 className="h-4 w-4 mr-2"/>
                Alle löschen
              </Button>
        </div>

            <div className="bg-white p-4 rounded-xl border border-yellow-200">
              <div className="text-center mb-4">
                <BarChart3 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <h4 className="font-semibold text-gray-800">Matchboxes</h4>
                <p className="text-sm text-gray-600">{matchboxes.length} Einträge</p>
          </div>
              <Button 
                variant="destructive" 
                onClick={deleteMatchboxes}
                disabled={isLoading || matchboxes.length === 0}
                className="w-full h-10"
              >
                <Trash2 className="h-4 w-4 mr-2"/>
                Alle löschen
              </Button>
        </div>
          </div>
        </div>

        {/* Complete Database Reset */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Gefahrenzone</h3>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-red-200">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <h4 className="text-lg font-bold text-red-800 mb-2">Kompletter Datenbank-Reset</h4>
              <p className="text-sm text-red-700 mb-6">
                ⚠️ Diese Aktion löscht ALLE Daten unwiderruflich ({totalEntries} Einträge)
              </p>
              
              <Button 
                variant="destructive" 
                onClick={resetCompleteDatabase}
                disabled={isLoading || totalEntries === 0}
                className="h-12 px-8 text-base font-semibold"
              >
                <AlertTriangle className="h-5 w-5 mr-2"/>
                Komplette Datenbank löschen
              </Button>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <strong>Wichtige Hinweise:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Export:</strong> Alle Daten können einzeln oder komplett als JSON exportiert werden</li>
                <li>Alle Löschvorgänge sind <strong>unwiderruflich</strong></li>
                <li>Vor jedem Vorgang erscheint eine Sicherheitsabfrage</li>
                <li>Kompletter Reset erfordert doppelte Bestätigung</li>
                <li>Testdaten können zur Demonstration geladen werden</li>
                <li><strong>JSON-Import:</strong> Gender wird automatisch von w/m zu F/M konvertiert</li>
                <li>JSON-Import ersetzt alle bestehenden Teilnehmer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Verarbeitung läuft...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminPanel() {
  const { items, reload } = useParticipants()
  const [editing, setEditing] = useState<Participant|undefined>(undefined)
  const [limit, setLimit] = useState(12)

  // Counts removed (no longer displayed in UI)

  async function remove(id:number){
    if (!confirm('Wirklich löschen?')) return
    await db.participants.delete(id); reload()
  }

  async function removeAll(){
    if (!confirm('Wirklich alle Teilnehmer löschen?')) return
    await db.participants.clear()
    reload()
  }

  async function resetAndAddTestData() {
    if (!confirm('Datenbank zurücksetzen und Testdaten laden?')) return
    await db.participants.clear()
    
    const testParticipants: Omit<Participant, 'id'>[] = [
      // Frauen
      { name: "Antonia", gender: "F", age: 25, knownFrom: "Germany Shore (2022), DSDS (2024)", status: "Aktiv", active: true },
      { name: "Beverly", gender: "F", age: 23, knownFrom: "Love Island", status: "Aktiv", active: true },
      { name: "Nelly", gender: "F", age: 24, knownFrom: "Bachelor", status: "Aktiv", active: true },
      { name: "Elli", gender: "F", age: 26, knownFrom: "Bachelorette", status: "Aktiv", active: true },
      { name: "Joanna", gender: "F", age: 22, knownFrom: "Temptation Island", status: "Aktiv", active: true },
      { name: "Sandra J.", gender: "F", age: 27, knownFrom: "Too Hot To Handle", status: "Aktiv", active: true },
      { name: "Henna", gender: "F", age: 25, knownFrom: "Ex on the Beach", status: "Aktiv", active: true },
      { name: "Viki", gender: "F", age: 24, knownFrom: "Love Island VIP", status: "Aktiv", active: true },
      { name: "Ariel", gender: "F", age: 26, knownFrom: "Germany Shore", status: "Aktiv", active: true },
      { name: "Hati Suar", gender: "F", age: 23, knownFrom: "Bachelor in Paradise", status: "Aktiv", active: true },
      { name: "F11", gender: "F", age: 25, knownFrom: "Love Island UK", status: "Aktiv", active: true },
      
      // Männer
      { name: "Xander S.", gender: "M", age: 28, knownFrom: "Make Love, Fake Love", status: "Aktiv", active: true },
      { name: "Oli", gender: "M", age: 27, knownFrom: "Die Wilden Kerle", status: "Aktiv", active: true },
      { name: "Rob", gender: "M", age: 25, knownFrom: "Love Island VIP", status: "Aktiv", active: true },
      { name: "Nico", gender: "M", age: 24, knownFrom: "Germany Shore", status: "Aktiv", active: true },
      { name: "Kevin Nje", gender: "M", age: 26, knownFrom: "Too Hot To Handle Germany", status: "Aktiv", active: true },
      { name: "Jonny", gender: "M", age: 23, knownFrom: "Are You The One?", status: "Aktiv", active: true },
      { name: "Lennert", gender: "M", age: 29, knownFrom: "Ex on the Beach", status: "Aktiv", active: true },
      { name: "Sidar Sa", gender: "M", age: 25, knownFrom: "Love Island", status: "Aktiv", active: true },
      { name: "Calvin O.", gender: "M", age: 27, knownFrom: "Bachelor", status: "Aktiv", active: true },
      { name: "Calvin S.", gender: "M", age: 24, knownFrom: "Bachelorette", status: "Aktiv", active: true },
      { name: "M11", gender: "M", age: 26, knownFrom: "Temptation Island", status: "Aktiv", active: true },
    ];

    for (const participant of testParticipants) {
      await db.participants.add(participant);
    }
    
    reload()
  }

  return (
    <div className="min-h-screen w-full" style={{backgroundColor: '#f9fafb'}}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-4" style={{color: '#111827'}}>Admin Panel</h1>
        </div>

        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="w-full grid grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="participants" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">Teilnehmer</TabsTrigger>
            <TabsTrigger value="matchbox" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Matchbox
            </TabsTrigger>
            <TabsTrigger value="matching-nights" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Matching Nights
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="space-y-6">
            {/* Bestehende Teilnehmer Liste zuerst */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold" style={{color: '#111827'}}>Bestehende Teilnehmer ({items.length})</h2>
                <div className="flex gap-3">
                  <ImportExport/>
                  <Button variant="destructive" onClick={removeAll} className="h-10 px-6">
                    <Trash2 className="h-4 w-4 mr-2"/>Alle löschen
                  </Button>
                  <Button variant="outline" onClick={resetAndAddTestData} className="h-10 px-6">
                    <Upload className="h-4 w-4 mr-2"/>Testdaten laden
                  </Button>
                </div>
              </div>
              
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Noch keine Teilnehmer vorhanden</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Fügen Sie unten neue Teilnehmer hinzu oder laden Sie Testdaten
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.slice(0, limit).map(p=> (
                    <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          {(p.photoUrl && p.photoUrl.trim() !== '') ? (
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${
                              p.gender === 'F' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}>
                              {p.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <span className={`absolute -right-0 -top-0 h-3 w-3 rounded-full ring-2 ring-white ${p.active!==false? 'bg-green-500':'bg-gray-300'}`} title={p.active!==false? 'Aktiv':'Inaktiv'}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-1">
                            <span className="font-semibold truncate" style={{color: '#111827'}}>{p.name}</span>
                            {typeof p.age === 'number' ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{backgroundColor: '#dbeafe', color: '#1d4ed8'}}>{p.age} Jahre</span> : null}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active!==false? 'bg-green-50 text-green-700':'bg-gray-50 text-gray-600'}`}>
                              {p.active!==false? 'Aktiv':'Inaktiv'}
                            </span>
                          </div>
                          <div className="text-xs mt-1 truncate" style={{color: '#374151'}}>{p.knownFrom || '—'}</div>
                          {p.socialMediaAccount && (
                            <div className="text-xs mt-1 truncate" style={{color: '#6b7280'}}>
                              <a href={p.socialMediaAccount} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                Social Media
                              </a>
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={()=>setEditing(p)} className="h-8 px-3 text-xs">
                              <Edit className="h-3.5 w-3.5 mr-1"/> Bearbeiten
                            </Button>
                            {p.id ? (
                              <Button size="sm" variant="ghost" onClick={()=>remove(p.id!)} className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-3.5 w-3.5"/>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {limit < items.length ? (
                <div className="flex justify-center pt-6">
                  <Button variant="outline" onClick={()=>setLimit(limit+12)} className="h-10 px-6">
                    Mehr laden ({items.length - limit} weitere)
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Formular zum Hinzufügen/Bearbeiten danach */}
            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex-row items-center justify-between border-b border-gray-100">
                <CardTitle className="text-lg font-semibold" style={{color: '#111827'}}>
                  {editing ? `Teilnehmer bearbeiten: ${editing.name}` : 'Neuen Teilnehmer hinzufügen'}
                </CardTitle>
                {editing && (
                  <Button variant="ghost" onClick={() => setEditing(undefined)} className="h-8 px-3 text-sm">
                    Abbrechen
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <ParticipantForm initial={editing} onSaved={()=>{ setEditing(undefined); reload() }}/>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matchbox" className="space-y-6">
            <MatchboxManagement />
          </TabsContent>

          <TabsContent value="matching-nights" className="space-y-6">
            <MatchingNightManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-6" style={{color: '#111827'}}>Einstellungen</h2>
              
              <Tabs defaultValue="import-export" className="space-y-6">
                <TabsList className="w-full grid grid-cols-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                  <TabsTrigger value="import-export" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Import & Export
                  </TabsTrigger>
                  <TabsTrigger value="db" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    DB
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="import-export" className="space-y-6">
                  <ImportExportManagement />
                </TabsContent>

                <TabsContent value="db" className="space-y-6">
                  <DBManagement />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}