import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { cn } from '../lib/utils';
import { searchCaretakers as searchCaretakersService, type CaretakerDisplayData } from '../lib/supabase/caretaker-search';

// Using the type from the service
type Caretaker = CaretakerDisplayData;

interface CaretakerCardProps {
  caretaker: Caretaker;
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize filters from URL params
  const initialLocation = searchParams.get('location') || '';
  const initialServices = searchParams.get('services')?.split(',').filter(Boolean) || [];
  const initialMinPrice = parseInt(searchParams.get('minPrice') || '0');
  const initialMaxPrice = parseInt(searchParams.get('maxPrice') || '100');
  
  // States
  const [location, setLocation] = useState(initialLocation);
  const [activeFilters, setActiveFilters] = useState<string[]>(initialServices);
  const [priceRange, setPriceRange] = useState<[number, number]>([initialMinPrice, initialMaxPrice]);
  const [showFilters, setShowFilters] = useState(false);
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  // Filter options
  const serviceOptions = [
    'Gassi-Service',
    'Haustierbetreuung', 
    'Übernachtung',
    'Kurzbesuche',
    'Haussitting',
    'Katzenbetreuung',
    'Hundetagesbetreuung',
    'Kleintierbetreuung'
  ];

  // Search function using database
  const performSearch = async () => {
    console.log('🔍 performSearch called');
    setLoading(true);
    setError(null);
    try {
      console.log('📞 Calling searchCaretakersService...');
      const data = await searchCaretakersService();
      console.log('📊 Service returned:', data);
      
      console.log(`✅ Setting ${data?.length || 0} caretakers to state`);
      setCaretakers(data || []);
      setTotalResults(data?.length || 0);
    } catch (err) {
      console.error('🚨 Unexpected error:', err);
      setError('Unerwarteter Fehler beim Suchen. Bitte versuche es erneut.');
      setCaretakers([]);
    } finally {
      setLoading(false);
    }
  };

  // Nur einmal beim Mount suchen
  useEffect(() => {
    console.log('🚀 Component mounted, starting search...');
    performSearch();
  }, []);
  
  // Debug: State-Änderungen loggen
  useEffect(() => {
    console.log('📌 State updated:', {
      caretakers: caretakers,
      caretakersLength: caretakers.length,
      loading: loading,
      error: error,
      totalResults: totalResults
    });
  }, [caretakers, loading, error, totalResults]);

  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleRemoveFilter = (filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setPriceRange([0, 100]);
    setLocation('');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Location Search */}
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="PLZ oder Stadt eingeben"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            
            {/* Filter Button */}
            <Button 
              variant="outline" 
              leftIcon={<Filter className="h-5 w-5" />}
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "lg:w-auto",
                (activeFilters.length > 0 || priceRange[0] > 0 || priceRange[1] < 100) && "border-primary-500 text-primary-600"
              )}
            >
              Filter {(activeFilters.length > 0 || priceRange[0] > 0 || priceRange[1] < 100) && `(${activeFilters.length + (priceRange[0] > 0 || priceRange[1] < 100 ? 1 : 0)})`}
            </Button>
          </div>

          {/* Active Filters */}
          {(activeFilters.length > 0 || priceRange[0] > 0 || priceRange[1] < 100) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Aktive Filter:</span>
              
              {activeFilters.map(filter => (
                <div key={filter} className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                  {filter}
                  <button
                    onClick={() => handleRemoveFilter(filter)}
                    className="ml-2 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {(priceRange[0] > 0 || priceRange[1] < 100) && (
                <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                  Preis: €{priceRange[0]}-{priceRange[1]}/Std
                  <button
                    onClick={() => setPriceRange([0, 100])}
                    className="ml-2 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                Alle entfernen
              </Button>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-6 bg-gray-50 rounded-xl border">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Service Filters */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Services</h3>
                  <div className="space-y-2">
                    {serviceOptions.map(service => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(service)}
                          onChange={() => handleFilterToggle(service)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Preis pro Stunde</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Von</label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="text-center text-sm text-gray-600 mt-1">€{priceRange[0]}</div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Bis</label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="text-center text-sm text-gray-600 mt-1">€{priceRange[1]}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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