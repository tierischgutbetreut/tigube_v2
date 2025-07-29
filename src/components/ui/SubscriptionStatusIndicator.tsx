import React from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useSubscription } from '../../lib/auth/useSubscription';
import { Badge, Crown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SubscriptionStatusIndicatorProps {
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SubscriptionStatusIndicator({ 
  showDetails = true, 
  size = 'md',
  className = ''
}: SubscriptionStatusIndicatorProps) {
  const { userProfile, subscription, subscriptionLoading } = useAuth();
  const { isPremiumUser, features } = useSubscription();

  if (subscriptionLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-sm text-gray-500">Lädt...</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (isPremiumUser && userProfile?.premium_badge) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    if (subscription && !userProfile?.premium_badge) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    if (isPremiumUser && !subscription) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <Badge className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isPremiumUser && userProfile?.premium_badge) {
      return subscription?.plan_type === 'premium' ? 'Premium' : 'Professional';
    }
    if (subscription && !userProfile?.premium_badge) {
      return 'Synchronisation erforderlich';
    }
    if (isPremiumUser && !subscription) {
      return 'Status inkonsistent';
    }
    return 'Basic';
  };

  const getStatusColor = () => {
    if (isPremiumUser && userProfile?.premium_badge) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    if (subscription && !userProfile?.premium_badge) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    if (isPremiumUser && !subscription) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const isConsistent = () => {
    if (!subscription && !isPremiumUser && !userProfile?.premium_badge) return true;
    if (subscription && isPremiumUser && userProfile?.premium_badge) return true;
    return false;
  };

  return (
    <div className={`${className}`}>
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {getStatusText()}
        </span>
        {!isConsistent() && (
          <AlertCircle className="w-3 h-3 text-orange-500" />
        )}
      </div>

      {showDetails && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>Kontakte: {features.max_contact_requests === -1 ? '∞' : features.max_contact_requests}</div>
              <div>Buchungen: {features.max_bookings === -1 ? '∞' : features.max_bookings}</div>
              <div>Werbefrei: {features.ads_free ? '✅' : '❌'}</div>
              <div>Premium Badge: {userProfile?.premium_badge ? '✅' : '❌'}</div>
            </div>
          </div>
          
          {!isConsistent() && (
            <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
              ⚠️ Status-Inkonsistenz erkannt. Bitte synchronisieren Sie Ihren Premium-Status.
            </div>
          )}
          
          {subscription && (
            <div className="text-xs text-gray-500">
              Plan: {subscription.plan_type} | Status: {subscription.status}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 