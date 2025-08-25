import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Filter, X, ChevronDown, PawPrint, Briefcase, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { UsageLimitIndicator } from '../components/ui/UsageLimitIndicator';
import { AdvancedFilters } from '../components/ui/AdvancedFilters';
import MultiDaySelector from '../components/ui/MultiDaySelector';
import { cn } from '../lib/utils';
import { searchCaretakers as searchCaretakersService, type CaretakerDisplayData, type SearchFilters } from '../lib/supabase/caretaker-search';
import { DEFAULT_SERVICE_CATEGORIES } from '../lib/types/service-categories';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import useCurrentUsage from '../hooks/useCurrentUsage';
import { useShortTermAvailability } from '../contexts/ShortTermAvailabilityContext';
import { useAuth } from "../lib/auth/AuthContext";

// Using the type from the service
type Caretaker = CaretakerDisplayData;

interface CaretakerCardProps {
  caretaker: Caretaker;
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { contactLimit, subscription } = useFeatureAccess();
  const { currentUsage: contactUsage } = useCurrentUsage('contact_request');
  const { shortTermAvailable } = useShortTermAvailability();
  const { user } = useAuth();
  const isFirstRender = useRef(true);
  
  // Initialize filters from URL params
  const initialLocation = searchParams.get('location') || '';
  const initialPetType = searchParams.get('petType') || '';
  const initialService = searchParams.get('service') || '';
  const initialAvailabilityDays = searchParams.getAll('availabilityDay');
  const initialAvailabilityTime = searchParams.get('availabilityTime') || '';
  const initialMaxPrice = parseInt(searchParams.get('maxPrice') || '100');
  
  // States
  const [location, setLocation] = useState(initialLocation);
  const [selectedPetType, setSelectedPetType] = useState(initialPetType);
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(searchParams.get('serviceCategory') || '');
  const [selectedAvailabilityDays, setSelectedAvailabilityDays] = useState<string[]>(initialAvailabilityDays);
  const [selectedAvailabilityTime, setSelectedAvailabilityTime] = useState(initialAvailabilityTime);
  const [selectedMinRating, setSelectedMinRating] = useState(searchParams.get('minRating') || '');
  const [selectedRadius, setSelectedRadius] = useState(searchParams.get('radius') || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  


  // Filter options
  const petTypeOptions = [
    { value: '', label: 'Alle Tiere' },
    { value: 'Hund', label: 'Hund' },
    { value: 'Katze', label: 'Katze' },
    { value: 'Kleintier', label: 'Kleintier' },
    { value: 'Vogel', label: 'Vogel' },
    { value: 'Reptil', label: 'Reptil' },
    { value: 'Sonstiges', label: 'Sonstiges' }
  ];

  const serviceOptions = [
    { value: '', label: 'Alle Services' },
    { value: 'Gassi-Service', label: 'Gassi-Service' },
    { value: 'Haustierbetreuung', label: 'Haustierbetreuung' },
    { value: 'Übernachtung', label: 'Übernachtung' },
    { value: 'Kurzbesuche', label: 'Kurzbesuche' },
    { value: 'Haussitting', label: 'Haussitting' },
    { value: 'Katzenbetreuung', label: 'Katzenbetreuung' },
    { value: 'Hundetagesbetreuung', label: 'Hundetagesbetreuung' },
    { value: 'Kleintierbetreuung', label: 'Kleintierbetreuung' }
  ];

  const serviceCategoryOptions = [
    { value: '', label: 'Alle Kategorien' },
    ...DEFAULT_SERVICE_CATEGORIES.map(category => ({
      value: category.id,
      label: category.name
    }))
  ];



  const availabilityTimeOptions = [
    { value: '', label: 'Alle Zeiten' },
    { value: 'morgens', label: 'Morgens (6-12 Uhr)' },
    { value: 'mittags', label: 'Mittags (12-18 Uhr)' },
    { value: 'abends', label: 'Abends (18-22 Uhr)' },
    { value: 'ganztags', label: 'Ganztags verfügbar' }
  ];

  // Hilfsfunktion für die Anzeige der Wochentage
  const getDayLabel = (dayValue: string) => {
    const dayLabels: { [key: string]: string } = {
      'montag': 'Montag',
      'dienstag': 'Dienstag',
      'mittwoch': 'Mittwoch',
      'donnerstag': 'Donnerstag',
      'freitag': 'Freitag',
      'samstag': 'Samstag',
      'sonntag': 'Sonntag'
    };
    return dayLabels[dayValue] || dayValue;
  };

  // Search function using database with filters
  const performSearch = async () => {
    console.log('🔍 performSearch called with filters:', {
      location,
      petType: selectedPetType,
      service: selectedService,
      availabilityDays: selectedAvailabilityDays,
      availabilityTime: selectedAvailabilityTime,
      minRating: selectedMinRating,
      radius: selectedRadius,
      maxPrice: maxPrice
    });
    
    setLoading(true);
    setError(null);
    setNoResults(false);
    try {
      const filters: SearchFilters = {};
      
      if (location.trim()) filters.location = location.trim();
      if (selectedPetType) filters.petType = selectedPetType;
      if (selectedService) filters.service = selectedService;
      if (selectedServiceCategory) filters.serviceCategory = selectedServiceCategory;
      
      // Nur Preis-Filter setzen wenn er nicht dem Default-Wert entspricht
      if (maxPrice < 100) {
        filters.maxPrice = maxPrice;
      }

      console.log('📞 Calling searchCaretakersService with filters:', filters);
      let data;
      try {
        data = await searchCaretakersService(filters);
        console.log('📊 Service returned:', data);
      } catch (serviceError) {
        console.warn('⚠️ Service error, falling back to mock data:', serviceError);
        data = [];
      }
      
      // Fallback to mock data only if service failed completely (not for empty results)
      if (data === undefined || data === null) {
        console.log('🔄 Service failed, using mock data for development');
        const { mockCaregivers } = await import('../data/mockData');
        data = mockCaregivers.map(mock => ({
          id: mock.id,
          userId: mock.id, // Using id as userId for mock data
          name: mock.name,
          avatar: mock.avatar,
          location: mock.location,
          rating: mock.rating,
          reviewCount: mock.reviewCount,
          hourlyRate: mock.hourlyRate,
          prices: { default: mock.hourlyRate },
          services: mock.services,
          bio: mock.bio,
          verified: mock.verified,
          isCommercial: false,
          short_term_available: user && mock.id === user.id ? shortTermAvailable : false // Use context value for current user
        }));
        console.log('📊 Using mock data:', data);
      }
      
      // Client-seitige Standort-Filterung (muss zuerst kommen)
      if (location.trim() && data) {
        console.log('📍 Applying location filter:', location.trim());
        const searchLocation = location.trim().toLowerCase();
        data = data.filter(caretaker => {
          const caretakerLocation = caretaker.location?.toLowerCase() || '';
          
          // Wenn Betreuer "Unbekannt" oder ähnliche Werte hat, nicht anzeigen bei spezifischer PLZ-Suche
          if (caretakerLocation === 'unbekannt' || 
              caretakerLocation === 'unknown' || 
              caretakerLocation === '' || 
              caretakerLocation === 'n/a' ||
              caretakerLocation === 'nicht angegeben' ||
              caretakerLocation === 'ort nicht angegeben') {
            console.log(`📍 Filtering out caretaker with location: "${caretaker.location}"`);
            return false;
          }
          
          // Wenn eine PLZ gesucht wird (5-stellige Zahl), dann nur Betreuer mit PLZ anzeigen
          if (/^\d{5}$/.test(location.trim())) {
            // Prüfe ob der Betreuer eine PLZ in seinem Standort hat
            if (!/\d{5}/.test(caretakerLocation)) {
              console.log(`📍 PLZ search but caretaker has no PLZ: "${caretaker.location}"`);
              return false;
            }
          }
          
          // Prüfe ob Standort die gesuchte PLZ oder Stadt enthält
          const matches = caretakerLocation.includes(searchLocation) || 
                         searchLocation.includes(caretakerLocation);
          
          if (!matches) {
            console.log(`📍 Location mismatch: searching for "${searchLocation}", caretaker has "${caretaker.location}"`);
          }
          
          return matches;
        });
        console.log(`📍 After location filter: ${data.length} caretakers`);
      }
      
      // Client-seitige Verfügbarkeits-Filterung (da noch keine DB-Unterstützung)
      if ((selectedAvailabilityDays.length > 0 || selectedAvailabilityTime) && data) {
        console.log('🕒 Applying availability filters...');
        data = data.filter(caretaker => {
          // Vereinfachte Verfügbarkeits-Logik - in Zukunft aus DB
          // Für jetzt nehmen wir an, dass alle Betreuer verfügbar sind
          // TODO: Implementiere echte Verfügbarkeits-Prüfung
          return true;
        });
        console.log(`🕒 After availability filter: ${data.length} caretakers`);
      }

      // Client-seitige Bewertungs-Filterung
      if (selectedMinRating && data) {
        const minRating = parseFloat(selectedMinRating);
        console.log('⭐ Applying rating filter:', minRating);
        data = data.filter(caretaker => caretaker.rating >= minRating);
        console.log(`⭐ After rating filter: ${data.length} caretakers`);
      }

      // Client-seitige Umkreis-Filterung (vereinfacht)
      if (selectedRadius && data) {
        const radius = parseInt(selectedRadius);
        console.log('📍 Applying radius filter:', radius, 'km');
        // TODO: Implementiere echte Geolocation-basierte Filterung
        // Für jetzt: Mock-Filterung basierend auf Radius
        data = data.filter(caretaker => {
          // Vereinfachte Logik: Kleinere Radien = weniger Ergebnisse
          const randomDistance = Math.random() * 100;
          return randomDistance <= radius;
        });
        console.log(`📍 After radius filter: ${data.length} caretakers`);
      }
      
      console.log(`✅ Setting ${data?.length || 0} caretakers to state`);
      setCaretakers(data || []);
      setTotalResults(data?.length || 0);
      
      // Prüfe ob keine Ergebnisse gefunden wurden
      if (!data || data.length === 0) {
        setNoResults(true);
        setError(null);
        console.log('📭 No results found, showing no results message');
      } else {
        setNoResults(false);
        setError(null);
        console.log('✅ Results found, showing results');
      }
      
      // URL aktualisieren
      const newParams = new URLSearchParams();
      if (location.trim()) newParams.set('location', location.trim());
      if (selectedPetType) newParams.set('petType', selectedPetType);
      if (selectedService) newParams.set('service', selectedService);
      if (selectedServiceCategory) newParams.set('serviceCategory', selectedServiceCategory);
      if (selectedAvailabilityDays.length > 0) {
        selectedAvailabilityDays.forEach(day => newParams.append('availabilityDay', day));
      }
      if (selectedAvailabilityTime) newParams.set('availabilityTime', selectedAvailabilityTime);
      if (selectedMinRating) newParams.set('minRating', selectedMinRating);
      if (selectedRadius) newParams.set('radius', selectedRadius);
      if (maxPrice < 100) newParams.set('maxPrice', maxPrice.toString());
      
      setSearchParams(newParams);
    } catch (err) {
      console.error('🚨 Unexpected error:', err);
      // Nur echte Fehler als Fehler behandeln, nicht "keine Ergebnisse"
      if (err instanceof Error && (err.message.includes('network') || err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
        setError('Unerwarteter Fehler beim Suchen. Bitte versuche es erneut.');
        setCaretakers([]);
      } else {
        // Bei anderen Fehlern einfach keine Ergebnisse anzeigen
        setError(null);
        setCaretakers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Beim Mount und bei Filter-Änderungen suchen
  useEffect(() => {
    console.log('🚀 Component mounted, starting initial search...');
    performSearch();
  }, []); // Nur beim Mount ausführen

  // Live-Suche bei Filter-Änderungen (aber nicht beim ersten Mount)
  useEffect(() => {
    // Skip first render to avoid double search
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timeoutId = setTimeout(() => {
      console.log('🔄 Filter changed, performing search...');
      performSearch();
    }, 300); // 300ms Debounce
    
    return () => clearTimeout(timeoutId);
  }, [location, selectedPetType, selectedService, selectedAvailabilityDays, selectedAvailabilityTime, selectedMinRating, selectedRadius, maxPrice]); // Dependencies für Live-Suche

  const clearAllFilters = () => {
    setSelectedPetType('');
    setSelectedService('');
    setSelectedServiceCategory('');
    setSelectedAvailabilityDays([]);
    setSelectedAvailabilityTime('');
    setSelectedMinRating('');
    setSelectedRadius('');
    setMaxPrice(100);
    setLocation('');
    setNoResults(false);
    setError(null);
  };

  const hasActiveFilters = selectedPetType || selectedService || selectedServiceCategory || selectedAvailabilityDays.length > 0 || selectedAvailabilityTime || selectedMinRating || selectedRadius || maxPrice < 100 || location.trim();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content Layout */}
      <div className="container-custom py-8">
        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold mb-6">Filter</h2>
              
              <div className="space-y-6">
                {/* PLZ/Stadt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Standort</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="PLZ oder Stadt"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Tierart Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tierart</label>
                  <div className="relative">
                    <PawPrint className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={selectedPetType}
                      onChange={(e) => setSelectedPetType(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                    >
                      {petTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Service Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                    >
                      {serviceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Service Kategorie Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={selectedServiceCategory}
                      onChange={(e) => setSelectedServiceCategory(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                    >
                      {serviceCategoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Max Preis Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max. Preis: €{maxPrice === 100 ? '100+' : maxPrice}/Std
                  </label>
                  <div className="relative">
                    <div className="relative h-2 bg-gray-200 rounded-lg mt-1">
                      <div 
                        className="absolute h-2 bg-primary-500 rounded-lg"
                        style={{
                          left: '0%',
                          width: `${maxPrice}%`
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer range-slider"
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>€0</span>
                      <span>€100+</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Filter Toggle */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={cn(
                      "w-full",
                      showAdvancedFilters && "bg-primary-50 border-primary-300 text-primary-700"
                    )}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Erweiterte Filter
                  </Button>
                </div>

                {/* Premium Filter (nur sichtbar wenn showAdvancedFilters true ist) */}
                {showAdvancedFilters && (
                  <div className="border-t pt-6">
                    <AdvancedFilters
                      availabilityDay={selectedAvailabilityDays.join(',')}
                      availabilityTime={selectedAvailabilityTime}
                      minRating={selectedMinRating}
                      radius={selectedRadius}
                      onAvailabilityDayChange={(day) => setSelectedAvailabilityDays(day ? day.split(',').filter(d => d) : [])}
                      onAvailabilityTimeChange={setSelectedAvailabilityTime}
                      onMinRatingChange={setSelectedMinRating}
                      onRadiusChange={setSelectedRadius}
                    />
                  </div>
                )}
                
                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="border-t pt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-600 hover:text-gray-900 w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Alle Filter zurücksetzen
                    </Button>
                  </div>
                )}

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Aktive Filter:</h3>
                    <div className="flex flex-wrap gap-2">
                      {location.trim() && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          📍 {location.trim()}
                          <button
                            onClick={() => setLocation('')}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {selectedPetType && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          🐾 {petTypeOptions.find(opt => opt.value === selectedPetType)?.label}
                          <button
                            onClick={() => setSelectedPetType('')}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {selectedService && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          💼 {serviceOptions.find(opt => opt.value === selectedService)?.label}
                          <button
                            onClick={() => setSelectedService('')}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      {selectedAvailabilityDays.length > 0 && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          🕒 {selectedAvailabilityDays.length === 1 
                            ? getDayLabel(selectedAvailabilityDays[0])
                            : `${selectedAvailabilityDays.length} Tage ausgewählt`
                          }
                          <button
                            onClick={() => setSelectedAvailabilityDays([])}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {selectedAvailabilityTime && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          ⏰ {availabilityTimeOptions.find(opt => opt.value === selectedAvailabilityTime)?.label}
                          <button
                            onClick={() => setSelectedAvailabilityTime('')}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {selectedMinRating && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          ⭐ {selectedMinRating}+ Sterne
                          <button
                            onClick={() => setSelectedMinRating('')}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {selectedRadius && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          📍 {selectedRadius} km Umkreis
                          <button
                            onClick={() => setSelectedRadius('')}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {maxPrice < 100 && (
                        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                          💰 Max. €{maxPrice}/Std
                          <button
                            onClick={() => setMaxPrice(100)}
                            className="ml-2 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
        {/* Usage Limit Display for Contact Requests - Compact Badge */}
        {subscription && subscription.user_type === 'owner' && (
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-medium text-gray-700">Kontaktanfragen:</span>
                <span className="text-gray-900 font-semibold">
                  {contactUsage}/{contactLimit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-gray-600">Suche läuft...</span>
              </div>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Tierbetreuer in allen Orten</h1>
                <p className="text-gray-600">
                  {totalResults} {totalResults === 1 ? 'Betreuer verfügbar' : 'Betreuer verfügbar'}
                  {location && ` in ${location}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={performSearch}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* No Results - Humorvolle Nachricht */}
        {!loading && !error && noResults && (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="text-6xl mb-4">🐕‍🦺</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Wuff! Keine Betreuer in der Nähe gefunden
              </h3>
              <p className="text-gray-600 mb-4">
                Auch unser bester Spürhund konnte in dieser Gegend keine Tierbetreuer aufspüren! 
              </p>
              <p className="text-gray-500 text-sm">
                {location && `Für "${location}" haben wir leider keine passenden Betreuer.`}
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                💡 Tipp: Versuche es mit anderen Suchkriterien oder erweitere deine Filter
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={clearAllFilters} variant="outline">
                  Filter zurücksetzen
                </Button>
                
                <Button onClick={performSearch}>
                  Erneut suchen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && caretakers.length > 0 && (
          <div className="grid grid-cols-3 gap-8">
            {caretakers.map(caretaker => (
              <CaretakerCard key={caretaker.id} caretaker={caretaker} />
            ))}
          </div>
        )}</div>
        </div>
      </div>
    </div>
  );
}

function CaretakerCard({ caretaker }: CaretakerCardProps) {
  // Funktion zum Ermitteln des besten Preises für die Anzeige
  const getDisplayPrice = (caretaker: Caretaker) => {
    // 1. Wenn Service-spezifische Preise vorhanden sind, zeige den niedrigsten
    if (caretaker.prices && Object.keys(caretaker.prices).length > 0) {
      const prices = Object.values(caretaker.prices)
        .filter(price => price !== '' && price !== null && price !== undefined) // Filtere leere Strings
        .map(price => {
          const num = typeof price === 'string' ? parseFloat(price) : price;
          return isNaN(num) ? 0 : num;
        })
        .filter(price => price > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return `ab €${minPrice}/Std.`;
      }
    }
    
    // 2. Fallback zu hourlyRate
    if (caretaker.hourlyRate > 0) {
      return `ab €${caretaker.hourlyRate}/Std.`;
    }
    
    // 3. Standard-Text
    return 'Preis auf Anfrage';
  };

  return (
    <div className="card group hover:border-primary-200 transition-all duration-200 w-60">
      <div className="relative">
        {/* Quadratisches Bild */}
        <div className="relative w-full aspect-square">
          <img
            src={caretaker.avatar}
            alt={caretaker.name}
            className="w-full h-full object-cover object-center rounded-t-xl"
            onError={(e) => {
              // Fallback für gebrochene Bilder
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(caretaker.name)}&background=f3f4f6&color=374151&size=400`;
            }}
          />
          
          {/* Badges overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-center">
            {caretaker.verified && (
              <div className="bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full text-center">
                Verifiziert
              </div>
            )}
            {caretaker.isCommercial && (
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center justify-center">
                <Briefcase className="h-3 w-3 mr-1" /> Pro
              </div>
            )}
            {caretaker.short_term_available && (
              <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center justify-center">
                <Clock className="h-3 w-3 mr-1" /> Kurzfristig
              </div>
            )}
          </div>
        </div>

        {/* Info-Bereich - unter dem Bild */}
        <div className="p-4 bg-white rounded-b-xl">
          {/* Name und Bewertung */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 mr-2">
              <h3 className="font-semibold text-base group-hover:text-primary-600 transition-colors truncate" title={caretaker.name}>
                {caretaker.name}
              </h3>
              <p className="text-gray-600 text-xs flex items-center truncate" title={caretaker.location}>
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" /> 
                <span className="truncate">{caretaker.location}</span>
              </p>
            </div>
            <div className="flex items-center flex-shrink-0">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
              <span className="font-medium text-sm">{caretaker.rating > 0 ? caretaker.rating.toFixed(1) : '—'}</span>
              <span className="text-gray-500 text-xs ml-1">({caretaker.reviewCount})</span>
            </div>
          </div>

          {/* Bio - kürzer für quadratisches Format */}
          <p className="text-gray-700 text-sm mb-3 line-clamp-2 leading-tight">
            {caretaker.bio}
          </p>

          {/* Services - kompakter */}
          <div className="flex flex-wrap gap-1 mb-3">
            {caretaker.services.slice(0, 2).map((service: string) => (
              <span
                key={service}
                className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
              >
                {service}
              </span>
            ))}
            {caretaker.services.length > 2 && (
              <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                +{caretaker.services.length - 2}
              </span>
            )}
          </div>

          {/* Preis und Button */}
          <div className="space-y-2">
            <p className="font-semibold text-primary-600 text-sm text-center">
              {getDisplayPrice(caretaker)}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => window.location.href = `/betreuer/${caretaker.id}`}
            >
              Profil ansehen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;