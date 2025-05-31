import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Filter, Star, Clock, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';
import { mockCaregivers } from '../data/mockData';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';
  
  const [location, setLocation] = useState(initialLocation);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);
  const [caregivers, setCaregivers] = useState(mockCaregivers);

  useEffect(() => {
    // In a real app, this would fetch caregivers based on filters
    const filteredCaregivers = mockCaregivers.filter(caregiver => {
      // Filter by service type
      if (activeFilters.length > 0 && !activeFilters.some(filter => caregiver.services.includes(filter))) {
        return false;
      }
      
      // Filter by price range
      if (caregiver.hourlyRate < priceRange[0] || caregiver.hourlyRate > priceRange[1]) {
        return false;
      }
      
      // Filter by location
      if (location && !caregiver.location.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    setCaregivers(filteredCaregivers);
    
    // Update URL params
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (activeFilters.length > 0) params.set('services', activeFilters.join(','));
    params.set('minPrice', priceRange[0].toString());
    params.set('maxPrice', priceRange[1].toString());
    setSearchParams(params, { replace: true });
  }, [location, activeFilters, priceRange]);

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Search Header */}
      <div className="bg-primary-600 py-6">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search location"
                className="block w-full bg-white border border-gray-300 rounded-lg pl-10 py-3 focus:ring-primary-500 focus:border-primary-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="bg-white"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Services</h3>
                <div className="space-y-2">
                  {['Dog Walking', 'Pet Sitting', 'Boarding', 'Drop-In Visits', 'House Sitting', 'Doggy Day Care'].map((service) => (
                    <label key={service} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                        checked={activeFilters.includes(service)}
                        onChange={() => toggleFilter(service)}
                      />
                      <span className="ml-2 text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Price Range (€/hour)</h3>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-600">€{priceRange[0]}</span>
                    <span className="text-sm text-gray-600">€{priceRange[1]}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Rating</h3>
                  <div className="space-y-2">
                    {[5, 4, 3].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                        <span className="ml-2 flex items-center">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-accent-500 fill-accent-500" />
                          ))}
                          {[...Array(5 - rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-gray-300" />
                          ))}
                          <span className="ml-1 text-gray-700">& up</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveFilters([]);
                  setPriceRange([0, 100]);
                  setLocation('');
                }}
              >
                Clear All
              </Button>
              <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Pet Caregivers in {location || 'All Locations'}</h1>
          <p className="text-gray-600">{caregivers.length} caregivers available</p>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map(filter => (
              <span
                key={filter}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                {filter}
                <button
                  onClick={() => toggleFilter(filter)}
                  className="ml-1 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setActiveFilters([])}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Caregiver List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caregivers.length > 0 ? (
            caregivers.map(caregiver => (
              <CaregiverCard key={caregiver.id} caregiver={caregiver} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="text-gray-500 mb-4">
                <SearchIcon className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No caregivers found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search for a different location</p>
              <Button
                onClick={() => {
                  setActiveFilters([]);
                  setPriceRange([0, 100]);
                  setLocation('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Caregiver {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  services: string[];
  bio: string;
  responseTime: string;
  verified: boolean;
}

interface CaregiverCardProps {
  caregiver: Caregiver;
}

function CaregiverCard({ caregiver }: CaregiverCardProps) {
  return (
    <div className="card group hover:border-primary-200 transition-all duration-200">
      <div className="relative">
        <img
          src={caregiver.avatar}
          alt={caregiver.name}
          className="w-full h-48 object-cover object-center rounded-t-xl"
        />
        {caregiver.verified && (
          <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Verified
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary-600 transition-colors">
              {caregiver.name}
            </h3>
            <p className="text-gray-600 text-sm flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> {caregiver.location}
            </p>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-accent-500 fill-accent-500 mr-1" />
            <span className="font-medium">{caregiver.rating}</span>
            <span className="text-gray-500 text-sm ml-1">({caregiver.reviewCount})</span>
          </div>
        </div>
        
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{caregiver.bio}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {caregiver.services.slice(0, 3).map(service => (
            <span
              key={service}
              className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
            >
              {service}
            </span>
          ))}
          {caregiver.services.length > 3 && (
            <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              +{caregiver.services.length - 3} more
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="flex items-center text-xs text-gray-600">
            <Clock className="h-3 w-3 mr-1" /> 
            Responds in {caregiver.responseTime}
          </p>
          <p className="font-semibold text-primary-600">€{caregiver.hourlyRate}/hr</p>
        </div>
        
        <Button
          variant="primary"
          className="w-full mt-4"
          onClick={() => window.location.href = `/caregivers/${caregiver.id}`}
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-search", props.className)}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default SearchPage;