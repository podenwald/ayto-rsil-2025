import { useEffect, useState } from 'react';
// Avatar utilities removed - using simple fallback logic
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SafeSelect from '@/components/SafeSelect';
import { db, type Participant, type MatchingNight, type Matchbox } from '@/lib/db';
import { Users, Search, User, Edit, Trash2, Heart, Calendar, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';

export default function Overview() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [matchingNightPairs, setMatchingNightPairs] = useState<Array<{woman: string, man: string}>>([]);
  const [selectedWoman, setSelectedWoman] = useState<string>('');
  const [selectedMan, setSelectedMan] = useState<string>('');
  const [savedMatchingNights, setSavedMatchingNights] = useState<MatchingNight[]>([]);
  const [matchingNightName, setMatchingNightName] = useState<string>('');
  const [totalLights, setTotalLights] = useState<number>(0);
  const [editingMatchingNight, setEditingMatchingNight] = useState<MatchingNight | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Matchbox states
  const [matchboxes, setMatchboxes] = useState<Matchbox[]>([]);
  const [selectedMatchboxWoman, setSelectedMatchboxWoman] = useState<string>('');
  const [selectedMatchboxMan, setSelectedMatchboxMan] = useState<string>('');
  const [matchboxType, setMatchboxType] = useState<'perfect' | 'no-match'>('no-match');
  const [isSold, setIsSold] = useState<boolean>(false);
  const [matchboxPrice, setMatchboxPrice] = useState<number>(0);
  const [matchboxBuyer, setMatchboxBuyer] = useState<string>('');

  // Collapsible Matching Nights state
  const [expandedMatchingNights, setExpandedMatchingNights] = useState<Set<number>>(new Set());

  // Load participants from IndexedDB
  useEffect(() => {
    loadParticipants();
    loadMatchingNights();
    loadMatchboxes();
  }, []);

  async function loadParticipants() {
    try {
      console.log('Loading participants...');
      const data = await db.participants.toArray();
      console.log('Loaded participants:', data);
      setParticipants(data);
    } catch (error) {
      console.error('Fehler beim Laden der Teilnehmer:', error);
      alert(`Fehler beim Laden der Teilnehmer: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  async function loadMatchingNights() {
    try {
      console.log('Loading matching nights...');
      const data = await db.matchingNights.toArray();
      console.log('Loaded matching nights:', data);
      setSavedMatchingNights(data);
    } catch (error) {
      console.error('Fehler beim Laden der Matching Nights:', error);
      alert(`Fehler beim Laden der Matching Nights: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  async function loadMatchboxes() {
    try {
      console.log('Loading matchboxes...');
      const data = await db.matchboxes.toArray();
      console.log('Loaded matchboxes:', data);
      setMatchboxes(data);
    } catch (error) {
      console.error('Fehler beim Laden der Matchboxes:', error);
      alert(`Fehler beim Laden der Matchboxes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  // Add test data function
  async function addTestData() {
    try {
      console.log('Adding test data...');
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
        
        // Männer
        { name: "Xander S.", gender: "M", age: 28, knownFrom: "Make Love, Fake Love", status: "Aktiv", active: true },
        { name: "Oli", gender: "M", age: 27, knownFrom: "Die Wilden Kerle", status: "Aktiv", active: true },
        { name: "Leandro", gender: "M", age: 25, knownFrom: "Love Island VIP", status: "Aktiv", active: true },
        { name: "Nico", gender: "M", age: 24, knownFrom: "Germany Shore", status: "Aktiv", active: true },
        { name: "Kevin Nje", gender: "M", age: 26, knownFrom: "Too Hot To Handle Germany", status: "Aktiv", active: true },
        { name: "Jonny", gender: "M", age: 23, knownFrom: "Are You The One?", status: "Aktiv", active: true },
        { name: "Rob", gender: "M", age: 29, knownFrom: "Ex on the Beach", status: "Aktiv", active: true },
        { name: "Sidar Sa", gender: "M", age: 25, knownFrom: "Love Island", status: "Aktiv", active: true },
        { name: "Calvin O.", gender: "M", age: 27, knownFrom: "Bachelor", status: "Aktiv", active: true },
        { name: "Calvin S.", gender: "M", age: 24, knownFrom: "Bachelorette", status: "Aktiv", active: true },
        { name: "Lennart", gender: "M", age: 26, knownFrom: "Temptation Island", status: "Aktiv", active: true },
      ];

      for (const participant of testParticipants) {
        await db.participants.add(participant);
      }
      
      await loadParticipants();
      console.log('Test data added successfully');
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Testdaten:', error);
      alert(`Fehler beim Hinzufügen der Testdaten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  // Reset and add test data function
  async function resetAndAddTestData() {
    try {
      if (confirm('Datenbank komplett zurücksetzen und Testdaten laden?')) {
        console.log('Resetting database...');
        await db.participants.clear();
        await db.matchingNights.clear();
        await db.matchboxes.clear();
        console.log('Database cleared, adding test data...');
        await addTestData();
        await loadMatchingNights();
        await loadMatchboxes();
        alert('Datenbank wurde zurückgesetzt und Testdaten wurden geladen!');
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Datenbank:', error);
      alert(`Fehler beim Zurücksetzen der Datenbank: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  // Filter participants based on search
  const filteredParticipants = (participants || []).filter(person => 
    person && person.name && (
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.knownFrom?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Separate women and men
  const women = filteredParticipants.filter(p => p.gender === 'F') || [];
  const men = filteredParticipants.filter(p => p.gender === 'M') || [];

  // Get perfect match pairs
  const perfectMatchPairs = (matchboxes || [])
    .filter(mb => mb && mb.matchType === 'perfect')
    .map(mb => ({ woman: mb.woman, man: mb.man }));

  // Get already used participants for current matching night (including perfect matches)
  const usedWomen = [
    ...(matchingNightPairs || []).map(pair => pair.woman).filter(name => name),
    ...perfectMatchPairs.map(pair => pair.woman)
  ];
  const usedMen = [
    ...(matchingNightPairs || []).map(pair => pair.man).filter(name => name),
    ...perfectMatchPairs.map(pair => pair.man)
  ];

  const activeCount = (participants || []).filter(p => p && p.active !== false).length;

  // Lichter-Berechnungen
  const automaticLights = matchingNightPairs.filter(pair => 
    perfectMatchPairs.some(pm => pm.woman === pair.woman && pm.man === pair.man)
  ).length;
  
  const manualLights = Math.max(0, totalLights - automaticLights);

  // Collapsible Functions
  function toggleMatchingNightExpansion(matchingNightId: number) {
    const newExpanded = new Set(expandedMatchingNights);
    if (newExpanded.has(matchingNightId)) {
      newExpanded.delete(matchingNightId);
    } else {
      newExpanded.add(matchingNightId);
    }
    setExpandedMatchingNights(newExpanded);
  }

  // Matching Night Functions
  function initializeMatchingNightWithPerfectMatches() {
    // Automatisch Perfect Match Paare zur neuen Matching Night hinzufügen
    if (perfectMatchPairs.length > 0 && matchingNightPairs.length === 0) {
      setMatchingNightPairs([...perfectMatchPairs]);
    }
  }

  // Function to sort pairs: perfect matches first, then alphabetically by women's names
  function sortPairs(pairs: Array<{woman: string, man: string}>) {
    return [...pairs].sort((a, b) => {
      const aIsPerfect = perfectMatchPairs.some(pm => pm.woman === a.woman && pm.man === a.man);
      const bIsPerfect = perfectMatchPairs.some(pm => pm.woman === b.woman && pm.man === b.man);
      
      // Perfect matches first
      if (aIsPerfect && !bIsPerfect) return -1;
      if (!aIsPerfect && bIsPerfect) return 1;
      
      // Then alphabetically by women's names
      return a.woman.localeCompare(b.woman, 'de', { sensitivity: 'base' });
    });
  }

  // Perfect Matches automatisch hinzufügen wenn eine neue Matching Night gestartet wird
  useEffect(() => {
    if (activeTab === 'matching' && matchingNightPairs.length === 0) {
      initializeMatchingNightWithPerfectMatches();
    }
  }, [activeTab, perfectMatchPairs.length]);

  function addPair() {
    if (selectedWoman && selectedMan) {
      setMatchingNightPairs([...matchingNightPairs, { woman: selectedWoman, man: selectedMan }]);
      setSelectedWoman('');
      setSelectedMan('');
    }
  }

  function removePair(index: number) {
    const newPairs = matchingNightPairs.filter((_, i) => i !== index);
    setMatchingNightPairs(newPairs);
  }

  async function saveMatchingNight() {
    try {
      if (matchingNightPairs.length > 0) {
        const name = matchingNightName || `Matching Night ${new Date().toLocaleDateString()}`;
        const matchingNight: Omit<MatchingNight, 'id'> = {
          name,
          date: new Date().toISOString().split('T')[0],
          pairs: matchingNightPairs,
          totalLights: totalLights,
          createdAt: new Date()
        };
        
        console.log('Saving matching night:', matchingNight);
        await db.matchingNights.add(matchingNight);
        await loadMatchingNights();
        
        alert(`Matching Night "${name}" mit ${matchingNightPairs.length} Paaren und ${totalLights} Lichtern gespeichert!`);
        setMatchingNightPairs([]);
        setMatchingNightName('');
        setTotalLights(0);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Matching Night:', error);
      alert(`Fehler beim Speichern der Matching Night: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  async function deleteMatchingNight(id: number) {
    try {
      if (confirm('Matching Night wirklich löschen?')) {
        await db.matchingNights.delete(id);
        await loadMatchingNights();
        alert('Matching Night wurde erfolgreich gelöscht!');
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Matching Night:', error);
      alert(`Fehler beim Löschen der Matching Night: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  function startEditing(matchingNight: MatchingNight) {
    setEditingMatchingNight(matchingNight);
    setMatchingNightName(matchingNight.name);
    setTotalLights(matchingNight.totalLights || 0);
    setMatchingNightPairs([...matchingNight.pairs]);
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditingMatchingNight(null);
    setMatchingNightName('');
    setTotalLights(0);
    setMatchingNightPairs([]);
    setIsEditing(false);
  }

  async function updateMatchingNight() {
    try {
      if (editingMatchingNight && matchingNightPairs.length > 0) {
        const updateData = {
          name: matchingNightName || `Matching Night ${new Date().toLocaleDateString()}`,
          pairs: matchingNightPairs,
          totalLights: totalLights
        };
        
        console.log('Updating matching night:', editingMatchingNight.id, updateData);
        await db.matchingNights.update(editingMatchingNight.id!, updateData);
        
        await loadMatchingNights();
        alert(`Matching Night "${matchingNightName || 'Unbenannt'}" wurde aktualisiert!`);
        cancelEditing();
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Matching Night:', error);
      alert(`Fehler beim Aktualisieren der Matching Night: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  // Matchbox Functions
  async function createMatchbox() {
    console.log('createMatchbox called with:', {
      selectedMatchboxWoman,
      selectedMatchboxMan,
      matchboxType,
      matchboxPrice,
      matchboxBuyer
    });

    try {
      // Basic validation
      if (!selectedMatchboxWoman || !selectedMatchboxMan) {
        alert('Bitte wähle eine Frau und einen Mann aus!');
        return;
      }

      // Validate sold matchbox data
      if (isSold) {
        if (!matchboxPrice || matchboxPrice <= 0) {
          alert('Bei verkauften Matchboxes muss ein gültiger Preis angegeben werden!');
          return;
        }
        if (!matchboxBuyer) {
          alert('Bei verkauften Matchboxes muss ein Käufer ausgewählt werden!');
          return;
        }
      }

      // Create matchbox object
      const matchboxData: Omit<Matchbox, 'id'> = {
        woman: selectedMatchboxWoman,
        man: selectedMatchboxMan,
        matchType: isSold ? 'sold' : matchboxType,
        price: isSold ? matchboxPrice : undefined,
        buyer: isSold ? matchboxBuyer : undefined,
        soldDate: isSold ? new Date() : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating matchbox with data:', matchboxData);

      // Add to database
      const id = await db.matchboxes.add(matchboxData);
      console.log('Matchbox created with ID:', id);

      // Reload data
      await loadMatchboxes();
      
      // Reset form
      setSelectedMatchboxWoman('');
      setSelectedMatchboxMan('');
      setMatchboxType('no-match');
      setIsSold(false);
      setMatchboxPrice(0);
      setMatchboxBuyer('');
      
      alert(`Matchbox für ${selectedMatchboxWoman} + ${selectedMatchboxMan} wurde erfolgreich erstellt!`);
      
    } catch (error) {
      console.error('Fehler beim Erstellen der Matchbox:', error);
      alert(`Fehler beim Erstellen der Matchbox: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }


  // Get available participants (excluding perfect matches)
  const availableWomen = (women || []).filter(woman => 
    woman && woman.name && !matchboxes.some(mb => mb && mb.matchType === 'perfect' && mb.woman === woman.name)
  );
  const availableMen = (men || []).filter(man => 
    man && man.name && !matchboxes.some(mb => mb && mb.matchType === 'perfect' && mb.man === man.name)
  );

  // Game constants
  const STARTING_BUDGET = 200000; // €200,000 starting budget

  // Get statistics
  const perfectMatches = (matchboxes || []).filter(mb => mb && mb.matchType === 'perfect').length;
  const noMatches = (matchboxes || []).filter(mb => mb && mb.matchType === 'no-match').length;
  const totalRevenue = (matchboxes || [])
    .filter(mb => mb && mb.matchType === 'sold' && mb.price && typeof mb.price === 'number')
    .reduce((sum, mb) => sum + (mb.price || 0), 0);
  const currentBalance = STARTING_BUDGET - totalRevenue;
  
  // Calculate total lights from all matching nights
  const totalLightsFromAllNights = (savedMatchingNights || [])
    .reduce((sum, night) => sum + (night.totalLights || 0), 0);
  const maxPossibleLights = (savedMatchingNights || []).length * 11; // 11 is max lights per night

  // Participant Card Component
  function ParticipantCard({ person }: { person: Participant }) {
    const tooltipContent = (
      <div className="text-sm">
        <div className="font-bold mb-1">{person.name}</div>
        {person.age && <div>{person.age} Jahre</div>}
        {person.knownFrom && <div className="text-gray-600">{person.knownFrom}</div>}
        <div className={`mt-1 ${person.active !== false ? 'text-green-600' : 'text-gray-500'}`}>
          {person.active !== false ? 'Aktiv' : 'Inaktiv'}
        </div>
      </div>
    );

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="relative">
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
              {tooltipContent}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          {/* Participant Card */}
          <div className="flex flex-col items-center space-y-3 group">
            {/* Profile Image - Circle Avatar */}
            <div className="relative">
              {/* Active Status Indicator */}
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-3 border-white shadow-lg ${
                person.active !== false ? 'bg-green-500' : 'bg-gray-400'
              } z-10`}></div>
              
              {/* Avatar Circle */}
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg ring-3 ring-white hover:ring-4 transition-all duration-300 hover:scale-110">
                {(person.photoUrl && person.photoUrl.trim() !== '') ? (
                  <img 
                    src={person.photoUrl} 
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xl ${
                    person.gender === 'F' 
                      ? 'bg-gradient-to-br from-pink-400 to-pink-600' 
                      : 'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    {person.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Name */}
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-purple-600 transition-colors duration-200">
                {person.name}
              </h3>
            </div>
      </div>
    </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.h1 
              initial={{opacity:0,y:-6}} 
              animate={{opacity:1,y:0}} 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              AYTO RSIL 2025 – Overview
            </motion.h1>
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 px-4 py-2 text-sm font-bold rounded-full shadow-lg">
              RSIL 2025
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-12">
        <motion.p 
          initial={{opacity:0,y:10}} 
          animate={{opacity:1,y:0}} 
          className="text-lg text-gray-600 text-center max-w-3xl mx-auto leading-relaxed font-medium"
        >
          Übersicht aller Teilnehmer der aktuellen Staffel
        </motion.p>

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
            <div className="flex gap-2">
              <Button 
                onClick={() => setActiveTab('overview')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'overview' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="h-5 w-5 mr-2" />
                Übersicht
              </Button>
              <Button 
                onClick={() => setActiveTab('matching')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'matching' 
                    ? 'bg-pink-500 text-white shadow-lg' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className="h-5 w-5 mr-2" />
                Matching Nights
              </Button>
              <Button 
                onClick={() => setActiveTab('matchbox')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'matchbox' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Matchbox
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">Teilnehmer Übersicht</CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/?admin=1'}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-14 px-8 rounded-2xl font-semibold text-base shadow-lg"
                  >
                    <Users className="h-6 w-6 mr-3"/>Admin Panel
                  </Button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <Input 
                    placeholder="Namen oder Show suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 h-14 bg-white/90 border-0 rounded-2xl text-gray-900 placeholder-gray-500 text-lg font-medium shadow-lg"
                  />
                </div>
                
                {/* Statistics */}
                <div className="flex gap-6 text-base">
                  <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm">
                    <span className="font-bold">{(filteredParticipants || []).length} von {(participants || []).length} Teilnehmern</span>
                  </div>
                  <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm">
                    <span className="font-bold">{activeCount} Aktiv</span>
                  </div>
                  <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm">
                    <span className="font-bold">{(women || []).length} Frauen</span>
                  </div>
                  <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm">
                    <span className="font-bold">{(men || []).length} Männer</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Women Section */}
              <div className="mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Frauen</h3>
                  </div>
                  <Badge className="bg-gradient-to-r from-pink-400 to-pink-600 text-white border-0 px-4 py-2 text-base font-bold rounded-full shadow-lg">
                    {(women || []).length}
                  </Badge>
                    </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-8">
                  {(women || []).map((person) => (
                    <ParticipantCard key={person.id} person={person} />
                      ))}
                    </div>
                
                {(women || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-base">Keine Frauen gefunden</p>
                  </div>
                )}
              </div>

              {/* Men Section */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Männer</h3>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0 px-4 py-2 text-base font-bold rounded-full shadow-lg">
                    {(men || []).length}
                  </Badge>
                    </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-8">
                  {(men || []).map((person) => (
                    <ParticipantCard key={person.id} person={person} />
                      ))}
                    </div>
                
                {(men || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-base">Keine Männer gefunden</p>
                  </div>
                )}
              </div>
              
              {(filteredParticipants || []).length === 0 && (participants || []).length > 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Search className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <p className="text-lg font-medium">Keine Teilnehmer gefunden</p>
                </div>
              )}
              
              {(participants || []).length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <p className="text-lg font-medium">Keine Teilnehmer vorhanden</p>
                  <div className="flex gap-4 justify-center mt-6">
                    <Button 
                      onClick={resetAndAddTestData}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Testdaten laden
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/?admin=1'}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Teilnehmer hinzufügen
                    </Button>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
        )}

        {/* Matching Nights Tab */}
        {activeTab === 'matching' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">Matching Nights</CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/?admin=1'}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-14 px-8 rounded-2xl font-semibold text-base shadow-lg"
                  >
                    <Users className="h-6 w-6 mr-3"/>Admin Panel
                  </Button>
                </div>
                
                <p className="text-lg opacity-90">
                  Paare für die Matching Night auswählen und speichern
                </p>
                
                {perfectMatchPairs.length > 0 && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-green-800">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {perfectMatchPairs.length} Perfect Match{perfectMatchPairs.length > 1 ? 'es' : ''} werden automatisch zu jeder Matching Night hinzugefügt
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Pair Selection */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Heart className="h-6 w-6 text-pink-500" />
                  {isEditing ? 'Matching Night bearbeiten' : 'Paar hinzufügen'}
                </h3>
                
                {/* Matching Night Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Name der Matching Night</label>
                    <Input 
                      value={matchingNightName}
                      onChange={(e) => setMatchingNightName(e.target.value)}
                      placeholder="z.B. Episode 1, Matching Night 1..."
                      className="h-12 bg-white/90 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      Gesamtlichter aus der Show
                    </label>
                    <div className="relative">
                      <Input 
                        type="number"
                        min="0"
                        max="11"
                        value={totalLights}
                        onChange={(e) => setTotalLights(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="h-12 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 text-center text-lg font-bold text-yellow-800"
                      />
                      {totalLights > 0 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-yellow-600 font-bold">/ 11</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
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
                      className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Paar hinzufügen
                    </Button>
                  </div>
                  
                  {/* Edit Mode Buttons */}
                  {isEditing && (
                    <div className="md:col-span-3 flex gap-3 justify-center mt-4">
                      <Button 
                        onClick={updateMatchingNight}
                        disabled={matchingNightPairs.length === 0}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aktualisieren
                      </Button>
                      <Button 
                        onClick={cancelEditing}
                        variant="outline"
                        className="px-6 py-3 rounded-xl font-semibold shadow-lg"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Pairs */}
              {matchingNightPairs.length > 0 && (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                      <Heart className="h-6 w-6 text-pink-500" />
                      Ausgewählte Paare
                    </h3>
                    <Button 
                      onClick={saveMatchingNight}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
                    >
                      Matching Night speichern
                    </Button>
                  </div>

                  {/* Lichter-Übersicht */}
                  {totalLights > 0 && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-lg">
                      <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <span className="text-2xl">💡</span>
                        Lichter-Analyse
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl border-2 border-yellow-300 shadow-md">
                          <div className="text-3xl font-bold text-yellow-700 mb-1">{totalLights}</div>
                          <div className="text-yellow-800 font-semibold">Gesamtlichter</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl border-2 border-green-300 shadow-md">
                          <div className="text-3xl font-bold text-green-700 mb-1">{automaticLights}</div>
                          <div className="text-green-800 font-semibold">Perfect Matches</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl border-2 border-blue-300 shadow-md">
                          <div className="text-3xl font-bold text-blue-700 mb-1">{manualLights}</div>
                          <div className="text-blue-800 font-semibold">Andere Paare</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-xl border-2 border-gray-300 shadow-md">
                          <div className="text-3xl font-bold text-gray-700 mb-1">{Math.max(0, 11 - matchingNightPairs.length)}</div>
                          <div className="text-gray-800 font-semibold">Fehlende Paare</div>
                        </div>
                      </div>
                      {manualLights < 0 && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                          ⚠️ Achtung: Mehr Perfect Matches als Gesamtlichter! Bitte Gesamtlichter korrigieren.
                        </div>
                      )}
                    </div>
                  )}
          

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortPairs(matchingNightPairs).map((pair, index) => {
                      const isPerfectMatch = perfectMatchPairs.some(
                        pm => pm.woman === pair.woman && pm.man === pair.man
                      );
                      
                      return (
                        <div key={index} className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 border shadow-lg ${
                          isPerfectMatch ? 'border-green-300 bg-green-50' : 'border-pink-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isPerfectMatch 
                                  ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                  : 'bg-gradient-to-br from-pink-400 to-red-500'
                              }`}>
                                {isPerfectMatch ? (
                                  <Heart className="h-5 w-5 text-white" />
                                ) : (
                                  <User className="h-5 w-5 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-800">{pair.woman}</p>
                                  {isPerfectMatch && (
                                    <Badge className="bg-green-500 text-white border-0 text-xs px-2 py-0.5">
                                      Perfect Match
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">+ {pair.man}</p>
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {matchingNightPairs.length === 0 && perfectMatchPairs.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Heart className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <p className="text-lg font-medium">Noch keine Paare ausgewählt</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Wähle oben Paare aus, um eine Matching Night zu erstellen
                  </p>
                </div>
              )}

              {/* Perfect Match Info when no manual pairs but perfect matches exist */}
              {matchingNightPairs.length === perfectMatchPairs.length && perfectMatchPairs.length > 0 && (
                <div className="text-center py-8 text-green-600">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">Perfect Matches automatisch hinzugefügt</p>
                  <p className="text-sm text-green-500 mt-2">
                    Füge weitere Paare hinzu oder speichere die Matching Night so
                  </p>
                </div>
              )}

              {/* Saved Matching Nights */}
              {(savedMatchingNights || []).length > 0 && (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-pink-500" />
                    Gespeicherte Matching Nights
                  </h3>

                  <div className="space-y-3">
                    {(savedMatchingNights || []).map((matchingNight) => {
                      const isExpanded = expandedMatchingNights.has(matchingNight.id!);
                      
                      return (
                        <div key={matchingNight.id} className="bg-white/90 backdrop-blur-sm rounded-xl border border-pink-200 shadow-lg overflow-hidden">
                          {/* Header - Always visible */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <Button
                                  onClick={() => toggleMatchingNightExpansion(matchingNight.id!)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-pink-50"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-pink-600" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-pink-600" />
                                  )}
                                </Button>
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-gray-800">{matchingNight.name}</h4>
                                  <div className="flex items-center gap-3">
                                    <p className="text-sm text-gray-600">
                                      {new Date(matchingNight.date).toLocaleDateString('de-DE')}
                                    </p>
                                    {matchingNight.totalLights !== undefined && (
                                      <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                                        <span className="text-lg">💡</span>
                                        <span className="text-sm font-bold text-yellow-700">{matchingNight.totalLights} Lichter</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Erstellt: {new Date(matchingNight.createdAt).toLocaleString('de-DE', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => startEditing(matchingNight)}
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  onClick={() => deleteMatchingNight(matchingNight.id!)}
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expandable Content - Horizontal strip */}
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-pink-200"
                            >
                              <div className="p-4 bg-pink-25">
                                {/* Lichter-Information für aufgeklappte Matching Night */}
                                {matchingNight.totalLights !== undefined && matchingNight.totalLights > 0 && (
                                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium text-gray-700">💡 Lichter-Verteilung:</span>
                                      <div className="flex gap-4">
                                        <span className="text-yellow-600">
                                          Gesamt: <strong>{matchingNight.totalLights}</strong>
                                        </span>
                                        <span className="text-green-600">
                                          Perfect Matches: <strong>
                                            {matchingNight.pairs.filter(pair => 
                                              perfectMatchPairs.some(pm => pm.woman === pair.woman && pm.man === pair.man)
                                            ).length}
                                          </strong>
                                        </span>
                                        <span className="text-blue-600">
                                          Andere: <strong>
                                            {Math.max(0, matchingNight.totalLights - matchingNight.pairs.filter(pair => 
                                              perfectMatchPairs.some(pm => pm.woman === pair.woman && pm.man === pair.man)
                                            ).length)}
                                          </strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-3">
                                  {sortPairs(matchingNight.pairs).map((pair, index) => {
                                    const isPerfectMatch = perfectMatchPairs.some(
                                      pm => pm.woman === pair.woman && pm.man === pair.man
                                    );
                                    
                                    return (
                                      <div key={index} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                        isPerfectMatch 
                                          ? 'bg-green-50 border-green-200' 
                                          : 'bg-white border-pink-200'
                                      }`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                          isPerfectMatch
                                            ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                                            : 'bg-gradient-to-br from-pink-400 to-red-500'
                                        }`}>
                                          {isPerfectMatch ? (
                                            <Heart className="h-3 w-3 text-white" />
                                          ) : (
                                            <User className="h-3 w-3 text-white" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-800">
                                            {pair.woman} + {pair.man}
                                          </span>
                                          {isPerfectMatch && (
                                            <Badge className="bg-green-500 text-white border-0 text-xs px-1 py-0">
                                              PM
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
        )}

        {/* Matchbox Tab */}
        {activeTab === 'matchbox' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">Matchbox</CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/?admin=1'}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-14 px-8 rounded-2xl font-semibold text-base shadow-lg"
                  >
                    <Users className="h-6 w-6 mr-3"/>Admin Panel
                  </Button>
                </div>
                
                <p className="text-lg opacity-90">
                  Matchbox-Ergebnisse verwalten und verkaufen
                </p>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm text-center">
                    <div className="text-2xl font-bold">{perfectMatches}</div>
                    <div className="text-sm opacity-90">Perfekt Matches</div>
                  </div>
                  <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm text-center">
                    <div className="text-2xl font-bold">{noMatches}</div>
                    <div className="text-sm opacity-90">No Matches</div>
                  </div>
                  <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm text-center">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1 mb-2">
                      <span>💡</span>
                      <span>{totalLightsFromAllNights}</span>
                      {maxPossibleLights > 0 && (
                        <span className="text-lg opacity-75">/{maxPossibleLights}</span>
                      )}
                    </div>
                    {maxPossibleLights > 0 && (
                      <div className="w-full bg-white/40 rounded-full h-2 mb-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (totalLightsFromAllNights / maxPossibleLights) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                    <div className="text-sm opacity-90">Lichter Fortschritt</div>
                  </div>
                </div>
                
                {/* Kontostand - mittig */}
                <div className="bg-white/20 px-8 py-6 rounded-2xl backdrop-blur-sm text-center">
                  <div className="text-sm opacity-90 mb-2">Aktueller Kontostand</div>
                  <div className={`text-4xl font-bold ${currentBalance >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    €{currentBalance.toLocaleString('de-DE')}
                  </div>
                  <div className="text-xs opacity-70 mt-2">
                    Startkapital: €{STARTING_BUDGET.toLocaleString('de-DE')}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Matchbox Creation */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                  Neue Matchbox erstellen
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Frau auswählen</label>
                    <SafeSelect
                      value={selectedMatchboxWoman}
                      onValueChange={setSelectedMatchboxWoman}
                      placeholder="Frau wählen..."
                      items={availableWomen.map(woman => ({
                        id: woman.id || 0,
                        name: woman.name || 'Unbekannt',
                        value: woman.name || ''
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mann auswählen</label>
                    <SafeSelect
                      value={selectedMatchboxMan}
                      onValueChange={setSelectedMatchboxMan}
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
                    <Select value={matchboxType} onValueChange={(value: 'perfect' | 'no-match') => setMatchboxType(value)} disabled={isSold}>
                      <SelectTrigger className={`h-14 bg-white/90 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 ${isSold ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perfect">Perfekt Match</SelectItem>
                        <SelectItem value="no-match">No Match</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Verkauft</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isSold"
                        checked={isSold}
                        onChange={(e) => setIsSold(e.target.checked)}
                        className="h-5 w-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <label htmlFor="isSold" className="text-sm text-gray-700">
                        Diese Matchbox wurde verkauft
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Button 
                      onClick={createMatchbox}
                      disabled={
                        !selectedMatchboxWoman || 
                        !selectedMatchboxMan || 
                        (isSold && (!matchboxPrice || matchboxPrice <= 0 || !matchboxBuyer))
                      }
                      className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Matchbox erstellen
                    </Button>
                  </div>
                </div>

                {/* Sold Matchbox Fields */}
                                  {isSold && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Preis (€)</label>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={matchboxPrice}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setMatchboxPrice(isNaN(value) ? 0 : value);
                        }}
                        placeholder="0.00"
                        className="h-12 bg-white/90 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Käufer (Teilnehmer)</label>
                      <SafeSelect
                        value={matchboxBuyer}
                        onValueChange={setMatchboxBuyer}
                        placeholder="Käufer auswählen..."
                        items={[
                          { id: 'placeholder', name: 'Käufer auswählen...', value: '', disabled: true },
                          ...[...availableWomen, ...availableMen]
                            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
                            .map((participant) => ({
                              id: participant.id || 0,
                              name: `${participant.name || 'Unbekannt'} (${participant.gender === 'F' ? 'F' : 'M'})`,
                              value: participant.name || ''
                            }))
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Matchboxes */}
              {(matchboxes || []).length > 0 && (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-green-500" />
                    Bestehende Matchboxes ({(matchboxes || []).length})
                  </h3>
                  
                  <div className="space-y-4">
                    {(matchboxes || []).map((matchbox) => (
                      <div key={matchbox.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-green-200 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
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
                                    {(() => {
                                      const buyer = [...women, ...men].find(p => p.name === matchbox.buyer);
                                      return buyer ? ` (${buyer.gender === 'F' ? 'Frau' : 'Mann'})` : '';
                                    })()}
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
                                    <span className="block">Bearbeitet: {new Date(matchbox.updatedAt).toLocaleString('de-DE', { 
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {matchboxes.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <p className="text-lg font-medium">Noch keine Matchboxes vorhanden</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Erstelle oben deine erste Matchbox
                  </p>
                </div>
              )}
              </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}


