import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Filter, X, ChevronDown, PawPrint, Briefcase, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { cn } from '../lib/utils';
import { searchCaretakers as searchCaretakersService, type CaretakerDisplayData, type SearchFilters } from '../lib/supabase/caretaker-search';

// Using the type from the service
type Caretaker = CaretakerDisplayData;

interface CaretakerCardProps {
  caretaker: Caretaker;
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isFirstRender = useRef(true);
  
  // Initialize filters from URL params
  const initialLocation = searchParams.get('location') || '';
  const initialPetType = searchParams.get('petType') || '';
  const initialService = searchParams.get('service') || '';
  const initialAvailabilityDay = searchParams.get('availabilityDay') || '';
  const initialAvailabilityTime = searchParams.get('availabilityTime') || '';
  const initialMaxPrice = parseInt(searchParams.get('maxPrice') || '100');
  
  // States
  const [location, setLocation] = useState(initialLocation);
  const [selectedPetType, setSelectedPetType] = useState(initialPetType);
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState(initialAvailabilityDay);
  const [selectedAvailabilityTime, setSelectedAvailabilityTime] = useState(initialAvailabilityTime);
  const [selectedMinRating, setSelectedMinRating] = useState(searchParams.get('minRating') || '');
  const [selectedRadius, setSelectedRadius] = useState(searchParams.get('radius') || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const availabilityDayOptions = [
    { value: '', label: 'Alle Tage' },
    { value: 'montag', label: 'Montag' },
    { value: 'dienstag', label: 'Dienstag' },
    { value: 'mittwoch', label: 'Mittwoch' },
    { value: 'donnerstag', label: 'Donnerstag' },
    { value: 'freitag', label: 'Freitag' },
    { value: 'samstag', label: 'Samstag' },
    { value: 'sonntag', label: 'Sonntag' }
  ];

  const availabilityTimeOptions = [
    { value: '', label: 'Alle Zeiten' },
    { value: 'morgens', label: 'Morgens (6-12 Uhr)' },
    { value: 'mittags', label: 'Mittags (12-18 Uhr)' },
    { value: 'abends', label: 'Abends (18-22 Uhr)' },
    { value: 'ganztags', label: 'Ganztags verfügbar' }
  ];

  // Search function using database with filters
  const performSearch = async () => {
    console.log('🔍 performSearch called with filters:', {
      location,
      petType: selectedPetType,
      service: selectedService,
      availabilityDay: selectedAvailabilityDay,
      availabilityTime: selectedAvailabilityTime,
      minRating: selectedMinRating,
      radius: selectedRadius,
      maxPrice: maxPrice
    });
    
    setLoading(true);
    setError(null);
    try {
      const filters: SearchFilters = {};
      
      if (location.trim()) filters.location = location.trim();
      if (selectedPetType) filters.petType = selectedPetType;
      if (selectedService) filters.service = selectedService;
      
      // Nur Preis-Filter setzen wenn er nicht dem Default-Wert entspricht
      if (maxPrice < 100) {
        filters.maxPrice = maxPrice;
      }

      console.log('📞 Calling searchCaretakersService with filters:', filters);
      let data = await searchCaretakersService(filters);
      console.log('📊 Service returned:', data);
      
      // Client-seitige Verfügbarkeits-Filterung (da noch keine DB-Unterstützung)
      if ((selectedAvailabilityDay || selectedAvailabilityTime) && data) {
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
      
      // URL aktualisieren
      const newParams = new URLSearchParams();
      if (location.trim()) newParams.set('location', location.trim());
      if (selectedPetType) newParams.set('petType', selectedPetType);
      if (selectedService) newParams.set('service', selectedService);
      if (selectedAvailabilityDay) newParams.set('availabilityDay', selectedAvailabilityDay);
      if (selectedAvailabilityTime) newParams.set('availabilityTime', selectedAvailabilityTime);
      if (selectedMinRating) newParams.set('minRating', selectedMinRating);
      if (selectedRadius) newParams.set('radius', selectedRadius);
      if (maxPrice < 100) newParams.set('maxPrice', maxPrice.toString());
      
      setSearchParams(newParams);
    } catch (err) {
      console.error('🚨 Unexpected error:', err);
      setError('Unerwarteter Fehler beim Suchen. Bitte versuche es erneut.');
      setCaretakers([]);
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
  }, [location, selectedPetType, selectedService, selectedAvailabilityDay, selectedAvailabilityTime, selectedMinRating, selectedRadius, maxPrice]); // Dependencies für Live-Suche

  const clearAllFilters = () => {
    setSelectedPetType('');
    setSelectedService('');
    setSelectedAvailabilityDay('');
    setSelectedAvailabilityTime('');
    setSelectedMinRating('');
    setSelectedRadius('');
    setMaxPrice(100);
    setLocation('');
  };

  const hasActiveFilters = selectedPetType || selectedService || selectedAvailabilityDay || selectedAvailabilityTime || selectedMinRating || selectedRadius || maxPrice < 100 || location.trim();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom py-4">
          {/* Filter-Zeile */}
          <div className="space-y-4">
            {/* Erste Zeile: Grundfilter */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* PLZ/Stadt */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
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
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tierart</label>
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
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
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

              {/* Max Preis Slider - Horizontal Mittig */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                  Max. Preis: €{maxPrice === 100 ? '100+' : maxPrice}/Std
                </label>
                <div className="flex justify-center">
                  <div className="relative w-full max-w-xs">
                    {/* Single Range Slider */}
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
                    {/* Preis-Werte unter dem Slider */}
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>€0</span>
                      <span>€100+</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter & Clear Buttons */}
              <div className="lg:col-span-1 flex flex-col gap-1">
                {/* Advanced Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn(
                    "w-full text-xs",
                    showAdvancedFilters && "bg-primary-50 border-primary-300 text-primary-700"
                  )}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
                
                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-gray-600 hover:text-gray-900 w-full text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Erweiterte Filter (nur sichtbar wenn showAdvancedFilters true ist) */}
            {showAdvancedFilters && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                  {/* Verfügbar am Tag */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verfügbar am</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={selectedAvailabilityDay}
                        onChange={(e) => setSelectedAvailabilityDay(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                      >
                        {availabilityDayOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Verfügbar zur Zeit */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zur Zeit</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={selectedAvailabilityTime}
                        onChange={(e) => setSelectedAvailabilityTime(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                      >
                        {availabilityTimeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Bewertungs-Filter */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Bewertung</label>
                    <div className="relative">
                      <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={selectedMinRating}
                        onChange={(e) => setSelectedMinRating(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                      >
                        <option value="">Alle Bewertungen</option>
                        <option value="4.5">4.5+ Sterne</option>
                        <option value="4.0">4.0+ Sterne</option>
                        <option value="3.5">3.5+ Sterne</option>
                        <option value="3.0">3.0+ Sterne</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Umkreis-Filter */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Umkreis</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={selectedRadius}
                        onChange={(e) => setSelectedRadius(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                      >
                        <option value="">Beliebige Entfernung</option>
                        <option value="5">5 km</option>
                        <option value="10">10 km</option>
                        <option value="25">25 km</option>
                        <option value="50">50 km</option>
                        <option value="100">100 km</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Aktive Filter:</span>
              
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
              
              {selectedAvailabilityDay && (
                <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                  🕒 {availabilityDayOptions.find(opt => opt.value === selectedAvailabilityDay)?.label}
                  <button
                    onClick={() => setSelectedAvailabilityDay('')}
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
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container-custom py-8">
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

        {/* No Results */}
        {!loading && !error && caretakers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Betreuer gefunden</h3>
            <p className="text-gray-600 mb-6">
              Versuche es mit anderen Suchkriterien oder erweitere deine Filter.
            </p>
            
            <Button onClick={clearAllFilters}>
              Filter zurücksetzen
            </Button>
            
            <Button onClick={performSearch} className="ml-2">
              Suche wiederholen
            </Button>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && caretakers.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caretakers.map(caretaker => (
              <CaretakerCard key={caretaker.id} caretaker={caretaker} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CaretakerCard({ caretaker }: CaretakerCardProps) {
  return (
    <div className="card group hover:border-primary-200 transition-all duration-200">
      <div className="relative">
        <img
          src={caretaker.avatar}
          alt={caretaker.name}
          className="w-full h-48 object-cover object-center rounded-t-xl"
          onError={(e) => {
            // Fallback für gebrochene Bilder
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(caretaker.name)}&background=f3f4f6&color=374151`;
          }}
        />
        {caretaker.verified && (
          <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Verifiziert
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary-600 transition-colors">
              {caretaker.name}
            </h3>
            <p className="text-gray-600 text-sm flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> {caretaker.location}
            </p>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-accent-500 fill-accent-500 mr-1" />
            <span className="font-medium">{caretaker.rating > 0 ? caretaker.rating.toFixed(1) : '—'}</span>
            <span className="text-gray-500 text-sm ml-1">({caretaker.reviewCount})</span>
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{caretaker.bio}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {caretaker.services.slice(0, 3).map((service: string) => (
            <span
              key={service}
              className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
            >
              {service}
            </span>
          ))}
          {caretaker.services.length > 3 && (
            <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              +{caretaker.services.length - 3} weitere
            </span>
          )}
        </div>

        <div className="flex items-center justify-end">
          <p className="font-semibold text-primary-600">
            {caretaker.hourlyRate > 0 ? `€${caretaker.hourlyRate}/Std.` : 'Preis auf Anfrage'}
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full mt-4"
          onClick={() => window.location.href = `/betreuer/${caretaker.id}`}
        >
          Profil ansehen
        </Button>
      </div>
    </div>
  );
}

export default SearchPage;