import React from 'react';
import { useSubscription } from '../../lib/auth/useSubscription';
import { AlertTriangle, CheckCircle, Clock, Crown } from 'lucide-react';

interface UsageLimitIndicatorProps {
  featureType: 'contact_request' | 'booking_request' | 'profile_view';
  currentUsage: number;
  className?: string;
  showProgress?: boolean;
}

export function UsageLimitIndicator({ 
  featureType, 
  currentUsage, 
  className = '',
  showProgress = true 
}: UsageLimitIndicatorProps) {
  const { features, isBetaUser, subscription } = useSubscription();

  // Feature-spezifische Limits und Labels
  const getFeatureConfig = () => {
    switch (featureType) {
      case 'contact_request':
        return {
          label: 'Kontaktanfragen',
          limit: features.max_contact_requests,
          unlimited: features.unlimited_contacts,
          icon: <Crown className="w-5 h-5 text-blue-500" />
        };
      case 'booking_request':
        return {
          label: 'Buchungsanfragen',
          limit: features.max_bookings,
          unlimited: features.unlimited_bookings,
          icon: <Clock className="w-5 h-5 text-green-500" />
        };
      case 'profile_view':
        return {
          label: 'Profil-Ansichten',
          limit: 50, // Basic limit
          unlimited: true, // Views sind immer unlimited
          icon: <CheckCircle className="w-5 h-5 text-purple-500" />
        };
      default:
        return {
          label: 'Nutzung',
          limit: 0,
          unlimited: false,
          icon: <AlertTriangle className="w-5 h-5 text-gray-500" />
        };
    }
  };

  const config = getFeatureConfig();
  const isUnlimited = config.unlimited;
  const limit = config.limit;
  const percentage = isUnlimited ? 100 : Math.min((currentUsage / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && currentUsage >= limit;

  // Beta-User haben immer unlimited
  const effectivelyUnlimited = isBetaUser || isUnlimited;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {config.icon}
        <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
      </div>

      {/* Usage Display */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {effectivelyUnlimited ? (
            <span className="flex items-center justify-center gap-2">
              <span className="text-green-600">Unlimited</span>
              {isBetaUser && (
                <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2 py-1 rounded-full">
                  Beta
                </span>
              )}
            </span>
          ) : (
            <span>
              {currentUsage}
              <span className="text-lg text-gray-500 font-normal"> / {limit}</span>
            </span>
          )}
        </div>
        
        {!effectivelyUnlimited && (
          <p className="text-sm text-gray-600">
            {isAtLimit ? 'Limit erreicht' : `${limit - currentUsage} übrig`}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && !effectivelyUnlimited && (
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Status Badge */}
      {!effectivelyUnlimited && (
        <div className="flex justify-center">
          {isAtLimit ? (
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              Limit erreicht
            </span>
          ) : isNearLimit ? (
            <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-sm font-medium px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              Fast erreicht
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              Verfügbar
            </span>
          )}
        </div>
      )}
    </div>
  );
} 