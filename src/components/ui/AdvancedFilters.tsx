import React from 'react';
import { Lock, Crown, Filter, Clock, Star, MapPin, ChevronDown } from 'lucide-react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { Link } from 'react-router-dom';

interface AdvancedFiltersProps {
  // Current filter values
  availabilityDay?: string;
  availabilityTime?: string;
  minRating?: string;
  radius?: string;
  
  // Change handlers
  onAvailabilityDayChange: (value: string) => void;
  onAvailabilityTimeChange: (value: string) => void;
  onMinRatingChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
  
  className?: string;
}

export function AdvancedFilters({
  availabilityDay = '',
  availabilityTime = '',
  minRating = '',
  radius = '',
  onAvailabilityDayChange,
  onAvailabilityTimeChange,
  onMinRatingChange,
  onRadiusChange,
  className = ''
}: AdvancedFiltersProps) {
  const { hasAdvancedFilters, subscription } = useFeatureAccess();

  const canUseAdvanced = hasAdvancedFilters();

  // Filter options
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

  // Feature Gate für Non-Premium Users
  if (!canUseAdvanced) {
    return (
      <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2 flex-nowrap">
          <Filter className="w-4 h-4 text-yellow-700 shrink-0" />
          <Crown className="w-4 h-4 text-yellow-600 shrink-0" />
          <div className="flex-1 min-w-0 text-base leading-6 font-bold text-yellow-800 whitespace-nowrap overflow-hidden text-ellipsis">Erweiterte Filter</div>
        </div>
        <div>
            <p className="text-yellow-700 text-sm mb-4 text-left">
              Finde den perfekten Betreuer mit präzisen Filteroptionen. Premium-Mitglieder können nach 
              Verfügbarkeit, Bewertung, Umkreis und vielem mehr filtern.
            </p>
            
            {/* Preview of advanced filters (disabled) */}
            <div className="space-y-4 mb-4 opacity-50">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Verfügbar am</label>
                <select disabled className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-2 py-1">
                  <option>Alle Tage</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Zur Zeit</label>
                <select disabled className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-2 py-1">
                  <option>Alle Zeiten</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min. Bewertung</label>
                <select disabled className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-2 py-1">
                  <option>Alle Bewertungen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Umkreis</label>
                <select disabled className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-2 py-1">
                  <option>Beliebige Entfernung</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link
                to="/mitgliedschaften"
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-sm rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 shadow-md"
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium werden
              </Link>
              <div className="text-xs text-yellow-600 text-left">
                Bereits Premium? Die Filter werden automatisch freigeschaltet.
              </div>
            </div>
          </div>
        </div>
      );
    }
  
  // Premium users - show advanced filters
  return (
    <div className={className}>
        <div className="flex items-center gap-2 mb-4 flex-nowrap">
          <Filter className="w-4 h-4 text-primary-600 shrink-0" />
          <Crown className="w-4 h-4 text-primary-600 shrink-0" />
          <div className="flex-1 min-w-0 text-base leading-6 font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">Erweiterte Filter</div>
          {canUseAdvanced && (
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full shrink-0">
              Premium
            </span>
          )}
        </div>

        <div className="space-y-4">
        {/* Verfügbar am Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Verfügbar am</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={availabilityDay}
              onChange={(e) => onAvailabilityDayChange(e.target.value)}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zur Zeit</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={availabilityTime}
              onChange={(e) => onAvailabilityTimeChange(e.target.value)}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min. Bewertung</label>
          <div className="relative">
            <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={minRating}
              onChange={(e) => onMinRatingChange(e.target.value)}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Umkreis</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={radius}
              onChange={(e) => onRadiusChange(e.target.value)}
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

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 Diese erweiterten Filter helfen dir dabei, Betreuer zu finden, die zu deinen 
          spezifischen Verfügbarkeits- und Qualitätsanforderungen passen.
        </p>
        </div>
      </div>
  );
}

export default AdvancedFilters;