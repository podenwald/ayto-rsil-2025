import React, { useEffect, useMemo, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Download, X, Heart, Users, Calendar, BarChart3, Search } from "lucide-react"
import { ParticipantCard } from "@/components/ayto/ParticipantCard"
import { ProbabilityGrid } from "@/components/ayto/ProbabilityGrid"
import { useAytoState } from "@/hooks/useAytoState"

/**
 * AYTO RSIL 2025 – Mobile MVP (React PWA shell)
 * ------------------------------------------------
 * Refactored nach Single Responsibility Principle:
 * - Business Logic in useAytoState Hook ausgelagert
 * - UI-Komponenten in separate Dateien ausgelagert
 * - Nur noch UI-Koordination und Layout
 *
 * Apple Design Guidelines:
 * - 44pt x 44pt minimum touch targets
 * - Generous white space
 * - Modern typography (SF Pro)
 * - Glassmorphism effects
 * - Vibrant, friendly colors
 */

export default function AYTO_Mobile_MVP() {
  const [title] = useState("AYTO RSIL 2025 – Live Tracker")
  const [summary] = useState(
    "Manuelle Eingabe von Matchbox & Matching Nights. Heuristische Wahrscheinlichkeiten je Paar. (Exakter Solver folgt.)"
  )
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // AYTO State Management
  const { model, probabilities, addTruthBooth, removeTruthBooth, addCeremony, exportJSON } = useAytoState()

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) root.classList.add("dark")
    else root.classList.remove("dark")
  }, [darkMode])

  // Filter participants based on search query
  const filteredParticipants = useMemo(() => {
    const allParticipants = [...model.men, ...model.women]
    if (!searchQuery) return allParticipants
    
    return allParticipants.filter(person => 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.show?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [model.men, model.women, searchQuery])

  // Quick ceremony input: pairs by index like "1-3,2-5,..." and beam count
  const [ceremonyInput, setCeremonyInput] = useState("")
  const [beamsInput, setBeamsInput] = useState("")
  
  const parseAndAddCeremony = useCallback(() => {
    try {
      const pairs: Array<{a: number, b: number}> = []
      const chunks = ceremonyInput.split(',').map(s => s.trim()).filter(Boolean)
      chunks.forEach(ch => {
        const [mi, wi] = ch.split('-').map(x => parseInt(x.trim(), 10))
        const m = model.men[mi-1]
        const w = model.women[wi-1]
        if (!m || !w) throw new Error("Index out of range")
        pairs.push({ a: m.id, b: w.id })
      })
      const beams = parseInt(beamsInput, 10)
      if (Number.isNaN(beams)) throw new Error("Beams ungültig")
      addCeremony(pairs, beams)
      setCeremonyInput("")
      setBeamsInput("")
    } catch (e: unknown) { 
      const errorMessage = e instanceof Error ? e.message : "Eingabe fehlerhaft"
      alert(errorMessage)
    }
  }, [ceremonyInput, beamsInput, model.men, model.women, addCeremony])

  // Truth Booth quick add
  const [tbM, setTbM] = useState(1)
  const [tbW, setTbW] = useState(1)
  const [tbIsMatch, setTbIsMatch] = useState(false)

  // Performance-optimierte Callbacks
  const handleEditParticipant = useCallback((person: unknown) => {
    console.log('Edit:', person)
  }, [])

  const handleDeleteParticipant = useCallback((person: unknown) => {
    console.log('Delete:', person)
  }, [])

  const handleAddTruthBooth = useCallback(() => {
    const m = model.men[tbM-1]
    const w = model.women[tbW-1]
    if (!m || !w) return alert("Index fehlerhaft")
    addTruthBooth(m.id, w.id, tbIsMatch)
  }, [tbM, tbW, tbIsMatch, model.men, model.women, addTruthBooth])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900">
      {/* Header - Apple Style */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.h1 
              initial={{opacity:0,y:-6}} 
              animate={{opacity:1,y:0}} 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              {title}
            </motion.h1>
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 px-4 py-2 text-sm font-bold rounded-full shadow-lg">
              RSIL 2025
            </Badge>
          </div>
          <label className="flex items-center gap-4 text-sm bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <span className="font-semibold text-gray-700">Dark</span>
            <Switch checked={darkMode} onCheckedChange={setDarkMode}/>
          </label>
        </div>
      </div>

      {/* Main Content - Apple Style */}
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-12">
        <motion.p 
          initial={{opacity:0,y:10}} 
          animate={{opacity:1,y:0}} 
          className="text-lg text-gray-600 text-center max-w-3xl mx-auto leading-relaxed font-medium"
        >
          {summary}
        </motion.p>

        <Tabs defaultValue="participants" className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full h-16 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-2 shadow-lg">
            <TabsTrigger value="participants" className="rounded-2xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <Users className="h-6 w-6 mr-3" />
              Teilnehmer
            </TabsTrigger>
            <TabsTrigger value="tb" className="rounded-2xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <Heart className="h-6 w-6 mr-3" />
              Matchbox
            </TabsTrigger>
            <TabsTrigger value="ceremonies" className="rounded-2xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <Calendar className="h-6 w-6 mr-3" />
              Matching Nights
            </TabsTrigger>
            <TabsTrigger value="probs" className="rounded-2xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <BarChart3 className="h-6 w-6 mr-3" />
              Wahrscheinlichkeiten
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="space-y-8">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold">Teilnehmer verwalten</CardTitle>
                    <Button 
                      variant="outline" 
                      onClick={exportJSON}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-14 px-8 rounded-2xl font-semibold text-base shadow-lg"
                    >
                      <Download className="h-6 w-6 mr-3"/>Export
                    </Button>
                  </div>
                  
                  {/* Search Bar - Apple Style */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                    <Input 
                      placeholder="Namen oder Show suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-14 h-14 bg-white/90 border-0 rounded-2xl text-gray-900 placeholder-gray-500 text-lg font-medium shadow-lg"
                    />
                  </div>
                  
                  {/* Statistics - Apple Style */}
                  <div className="flex gap-6 text-base">
                    <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm">
                      <span className="font-bold">{filteredParticipants.length} Aktive Teilnehmer</span>
                    </div>
                    <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm">
                      <span className="font-bold">{model.women.length} Frauen</span>
                    </div>
                    <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm">
                      <span className="font-bold">{model.men.length} Männer</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Users className="h-6 w-6" />
                    Alle Teilnehmer
                  </h3>
                  <div className="text-base text-gray-600 font-medium">
                    {filteredParticipants.length} von {model.men.length + model.women.length} Teilnehmern
                  </div>
                </div>
                
                {/* Participant Grid - 4 per row - Apple Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                  {filteredParticipants.map((person) => (
                    <ParticipantCard 
                      key={person.id} 
                      person={person}
                      onEdit={handleEditParticipant}
                      onDelete={handleDeleteParticipant}
                    />
                  ))}
                </div>
                
                {filteredParticipants.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                    <p className="text-lg font-medium">Keine Teilnehmer gefunden</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tb" className="space-y-8">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-8">
                <CardTitle className="text-2xl font-bold">Matchbox (Truth Booth)</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-3xl p-8 space-y-6">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-4">
                      <Input 
                        type="number" 
                        min={1} 
                        max={model.men.length} 
                        value={tbM} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setTbM(parseInt(e.target.value,10))} 
                        className="w-24 h-14 text-center text-xl font-bold border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 shadow-sm"
                      />
                      <span className="text-3xl font-bold text-pink-600">×</span>
                      <Input 
                        type="number" 
                        min={1} 
                        max={model.women.length} 
                        value={tbW} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setTbW(parseInt(e.target.value,10))} 
                        className="w-24 h-14 text-center text-xl font-bold border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 shadow-sm"
                      />
                    </div>
                    <label className="flex items-center gap-4 text-base font-semibold">
                      <Switch checked={tbIsMatch} onCheckedChange={setTbIsMatch}/>
                      <span className="text-gray-700">Perfect Match</span>
                    </label>
                    <Button 
                      onClick={handleAddTruthBooth}
                      className="bg-gradient-to-r from-pink-500 to-red-500 text-white h-14 px-10 rounded-2xl font-bold text-lg hover:from-pink-600 hover:to-red-600 shadow-xl"
                    >
                      Hinzufügen
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {model.truthBooths.map((tb, idx) => {
                    const m = model.men.find(x=>x.id===tb.pair.a)!;
                    const w = model.women.find(x=>x.id===tb.pair.b)!;
                    return (
                      <div key={idx} className="flex items-center justify-between rounded-3xl border-2 p-6 bg-white shadow-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-semibold">{m.name} × {w.name}</span>
                          {tb.isMatch ? (
                            <Badge className="bg-green-500 text-white border-0 px-4 py-2 text-base font-bold rounded-full shadow-sm">
                              MATCH ✅
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500 text-white border-0 px-4 py-2 text-base font-bold rounded-full shadow-sm">
                              kein Match ❌
                            </Badge>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={()=>removeTruthBooth(idx)}
                          className="h-14 w-14 rounded-2xl hover:bg-red-50 hover:text-red-600 shadow-sm"
                        >
                          <X className="h-7 w-7"/>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ceremonies" className="space-y-8">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8">
                <CardTitle className="text-2xl font-bold">Matching Nights</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-8 space-y-6">
                  <div className="flex flex-wrap items-end gap-6">
                    <div className="grow">
                      <label className="text-base font-semibold text-gray-700 mb-3 block">Paare (Format: 1-3,2-5,...) – entspricht Mx × Fy</label>
                      <Input 
                        value={ceremonyInput} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setCeremonyInput(e.target.value)} 
                        placeholder="1-3,2-5,3-1,4-7,..."
                        className="h-14 text-lg border-2 border-green-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-base font-semibold text-gray-700 mb-3 block">Beams</label>
                      <Input 
                        className="w-36 h-14 text-center text-xl font-bold border-2 border-green-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm" 
                        value={beamsInput} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setBeamsInput(e.target.value)} 
                        placeholder="#"
                      />
                    </div>
                    <Button 
                      onClick={parseAndAddCeremony}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white h-14 px-10 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 shadow-xl"
                    >
                      Hinzufügen
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {model.ceremonies.map((c, idx) => (
                    <div key={c.id} className="rounded-3xl border-2 border-gray-200 p-8 bg-white shadow-lg">
                      <div className="flex justify-between items-center mb-6">
                        <strong className="text-xl font-bold text-gray-800">Nacht {idx+1}</strong>
                        <Badge className="bg-blue-500 text-white border-0 px-6 py-3 text-base font-bold rounded-full shadow-sm">
                          Beams: {c.beams}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {c.pairs.map((p, i) => {
                          const m = model.men.find(x=>x.id===p.a)!; 
                          const w = model.women.find(x=>x.id===p.b)!;
                          return (
                            <Badge 
                              key={i} 
                              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 font-semibold text-base shadow-sm"
                            >
                              {m.name} × {w.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="probs" className="space-y-8">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-8">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">Perfect-Match Wahrscheinlichkeiten (heuristisch)</CardTitle>
                  <div className="text-base bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm font-medium">
                    Grün = bestätigt, Rot = ausgeschlossen
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl">
                  <ProbabilityGrid
                    men={model.men}
                    women={model.women}
                    probabilities={probabilities}
                    forbidden={model.forbidden}
                    confirmed={model.confirmed}
                  />
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6">
                  <div className="text-base text-orange-800 font-medium">
                    <strong>Hinweis:</strong> Aktuell wird nur das Wissen aus Matchbox und manuell ausgeschlossenen Paaren einbezogen. 
                    Die exakte Berechnung über alle gültigen Gesamtlösungen (Backtracking/SAT) inklusive Beam-Constraints
                    folgt als nächster Schritt und läuft dann in einem WebWorker.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
