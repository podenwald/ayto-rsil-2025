import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Upload, Download, X, HelpCircle, Heart, Users, Calendar, BarChart3, CheckCircle, XCircle, Search, Edit, Trash2, User } from "lucide-react";

/**
 * AYTO RSIL 2025 – Mobile MVP (React PWA shell)
 * ------------------------------------------------
 * Ziel: Während der Show per Smartphone mitfiebern, Truth-Box & Matching-Night
 * dokumentieren und daraus zunächst einfache (heuristische) Wahrscheinlichkeiten
 * je Paar ableiten. Der exakte Solver (Backtracking/SAT) wird als TODO markiert
 * und später per WebWorker ausgelagert.
 *
 * Apple Design Guidelines:
 * - 44pt x 44pt minimum touch targets
 * - Generous white space
 * - Modern typography (SF Pro)
 * - Glassmorphism effects
 * - Vibrant, friendly colors
 */

// --- Types ---------------------------------------------------------------

type Gender = "F" | "M";

interface Person { 
  id: string; 
  name: string; 
  gender: Gender;
  age?: number;
  show?: string;
  status?: "Aktiv" | "Inaktiv";
  imageUrl?: string;
}

interface Pair { a: string; b: string } // ids

interface TruthBoothEntry { pair: Pair; isMatch: boolean }

interface Ceremony {
  id: string;
  pairs: Pair[]; // vollständige Sitzordnung
  beams: number; // Anzahl Lichter
}

interface StateModel {
  men: Person[];
  women: Person[];
  forbidden: Record<string, Record<string, boolean>>; // forbidden[manId][womanId] = true
  confirmed: Record<string, string>; // manId -> womanId (confirmed PM)
  truthBooths: TruthBoothEntry[];
  ceremonies: Ceremony[];
}

// --- Helpers -------------------------------------------------------------

function uid() { return crypto.randomUUID(); }

function emptyMatrix(men: Person[], women: Person[]) {
  const f: Record<string, Record<string, boolean>> = {};
  for (const m of men) { f[m.id] = {}; for (const w of women) f[m.id][w.id] = false; }
  return f;
}

// naive heuristics: verteilt Rest-Wahrscheinlichkeit gleichmäßig auf alle (nicht verbotenen, nicht kollidierenden) Kanten
function computeHeuristicProbabilities(state: StateModel) {
  const { men, women, forbidden, confirmed } = state;
  const probs: Record<string, Record<string, number>> = {};
  const takenWomen = new Set(Object.values(confirmed));
  for (const m of men) {
    probs[m.id] = {};
    if (confirmed[m.id]) {
      for (const w of women) probs[m.id][w.id] = (w.id === confirmed[m.id]) ? 1 : 0;
      continue;
    }
    let candidates = women.filter(w => !forbidden[m.id][w.id] && !takenWomen.has(w.id));
    const p = candidates.length ? 1 / candidates.length : 0;
    for (const w of women) probs[m.id][w.id] = candidates.some(c => c.id===w.id) ? p : 0;
  }
  return probs;
}

// Apply TruthBooth knowledge to matrices
function applyTruthBooths(base: StateModel): StateModel {
  const next: StateModel = JSON.parse(JSON.stringify(base));
  for (const tb of base.truthBooths) {
    const { a, b } = tb.pair; // a=man, b=woman
    if (tb.isMatch) {
      next.confirmed[a] = b;
      // sperre Zeile/Spalte
      for (const w of base.women) if (w.id !== b) next.forbidden[a][w.id] = true;
      for (const m of base.men) if (m.id !== a) next.forbidden[m.id][b] = true;
    } else {
      next.forbidden[a][b] = true;
    }
  }
  return next;
}

// --- Component -----------------------------------------------------------

export default function AYTO_Mobile_MVP() {
  const [title] = useState("AYTO RSIL 2025 – Live Tracker");
  const [summary] = useState(
    "Manuelle Eingabe von Matchbox & Matching Nights. Heuristische Wahrscheinlichkeiten je Paar. (Exakter Solver folgt.)"
  );
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark"); else root.classList.remove("dark");
  }, [darkMode]);

  // Default: 11 Paare (22 Singles) - jetzt leer, wird aus Admin Panel geladen
  const [men] = useState<Person[]>([]);
  const [women] = useState<Person[]>([]);

  const [model, setModel] = useState<StateModel>({
    men, women,
    forbidden: emptyMatrix(men, women),
    confirmed: {},
    truthBooths: [],
    ceremonies: [],
  });

  function renamePerson(list: "men"|"women", id: string, name: string) {
    const src = list === "men" ? [...model.men] : [...model.women];
    const idx = src.findIndex(p => p.id === id); if (idx<0) return;
    src[idx] = { ...src[idx], name };
    list === "men" ? setModel({ ...model, men: src }) : setModel({ ...model, women: src });
  }

  function addTruthBooth(mId: string, wId: string, isMatch: boolean) {
    const tb: TruthBoothEntry = { pair: { a: mId, b: wId }, isMatch };
    const withTB: StateModel = { ...model, truthBooths: [...model.truthBooths, tb] };
    setModel(applyTruthBooths(withTB));
  }

  function removeTruthBooth(i: number) {
    const base: StateModel = { ...model, truthBooths: model.truthBooths.filter((_, idx) => idx!==i) };
    // re-derive matrix fresh
    const clean = { ...base, forbidden: emptyMatrix(base.men, base.women), confirmed: {} } as StateModel;
    setModel(applyTruthBooths(clean));
  }

  function addCeremony(pairs: Pair[], beams: number) {
    const c: Ceremony = { id: uid(), pairs, beams };
    setModel({ ...model, ceremonies: [...model.ceremonies, c] });
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ayto-rsil-2025.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try { const parsed = JSON.parse(String(fr.result)); setModel(parsed); }
      catch { alert("Ungültige Datei"); }
    };
    fr.readAsText(file);
  }

  const probs = useMemo(() => computeHeuristicProbabilities(model), [model]);

  // Filter participants based on search query
  const filteredParticipants = useMemo(() => {
    const allParticipants = [...model.men, ...model.women];
    if (!searchQuery) return allParticipants;
    
    return allParticipants.filter(person => 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.show?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [model.men, model.women, searchQuery]);

  // --- UI helpers --------------------------------------------------------

  function ProbabilityGrid() {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left font-semibold text-gray-700">\</th>
              {model.women.map(w => (
                <th key={w.id} className="p-4 text-center font-semibold text-gray-700 min-w-[80px]">
                  {w.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.men.map(m => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="p-4 font-semibold text-gray-700 bg-gray-50">{m.name}</td>
                {model.women.map(w => {
                  const p = probs[m.id]?.[w.id] ?? 0;
                  const f = model.forbidden[m.id][w.id];
                  const c = model.confirmed[m.id] === w.id;
                  return (
                    <td key={w.id} className={`p-4 text-center border-l border-gray-100 transition-colors ${
                      c ? "bg-green-100 text-green-800 font-semibold" : 
                      f ? "bg-red-100 text-red-800 font-semibold" : 
                      "bg-white hover:bg-gray-50"
                    }`}>
                      <div className="text-lg font-bold">{(p*100).toFixed(0)}%</div>
                      {c && <CheckCircle className="h-5 w-5 mx-auto mt-1 text-green-600" />}
                      {f && <XCircle className="h-5 w-5 mx-auto mt-1 text-red-600" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Quick ceremony input: pairs by index like "1-3,2-5,..." and beam count
  const [ceremonyInput, setCeremonyInput] = useState("");
  const [beamsInput, setBeamsInput] = useState("");
  function parseAndAddCeremony() {
    try {
      const pairs: Pair[] = [];
      const chunks = ceremonyInput.split(',').map(s => s.trim()).filter(Boolean);
      chunks.forEach(ch => {
        const [mi, wi] = ch.split('-').map(x => parseInt(x.trim(), 10));
        const m = model.men[mi-1]; const w = model.women[wi-1];
        if (!m || !w) throw new Error("Index out of range");
        pairs.push({ a: m.id, b: w.id });
      });
      const beams = parseInt(beamsInput, 10);
      if (Number.isNaN(beams)) throw new Error("Beams ungültig");
      addCeremony(pairs, beams);
      setCeremonyInput(""); setBeamsInput("");
    } catch (e:any) { alert(e.message || "Eingabe fehlerhaft"); }
  }

  // Truth Booth quick add
  const [tbM, setTbM] = useState(1);
  const [tbW, setTbW] = useState(1);
  const [tbIsMatch, setTbIsMatch] = useState(false);

  // Participant Card Component - Apple Style
  function ParticipantCard({ person }: { person: Person }) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-start gap-4">
          {/* Profile Image - Apple Style */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-2">{person.name}</h3>
            
            {/* Badges - Apple Style */}
            <div className="flex gap-3 mb-3">
              <Badge className="bg-blue-500 text-white border-0 px-4 py-2 text-sm font-semibold rounded-full shadow-sm">
                {person.age} Jahre
              </Badge>
              <Badge className="bg-green-500 text-white border-0 px-4 py-2 text-sm font-semibold rounded-full shadow-sm">
                {person.status}
              </Badge>
            </div>
            
            {/* Show */}
            <p className="text-sm text-gray-600 mb-4 font-medium">{person.show}</p>
            
            {/* Action Buttons - 44pt minimum */}
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-11 w-11 p-0 rounded-2xl hover:bg-blue-50 hover:text-blue-600 shadow-sm"
              >
                <Edit className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-11 w-11 p-0 rounded-2xl hover:bg-red-50 hover:text-red-600 shadow-sm"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

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
                  {filteredParticipants.map((person, index) => (
                    <ParticipantCard key={person.id} person={person} />
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
                      onClick={()=>{
                        const m = model.men[tbM-1]; const w = model.women[tbW-1];
                        if (!m||!w) return alert("Index fehlerhaft");
                        addTruthBooth(m.id, w.id, tbIsMatch);
                      }}
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
                  <ProbabilityGrid/>
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
