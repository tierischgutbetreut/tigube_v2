import { useAuth } from './AuthContext';
import { SubscriptionService, FEATURE_MATRIX } from '../services/subscriptionService';
import { useMemo } from 'react';

export function useSubscription() {
  const { subscription, subscriptionLoading, refreshSubscription, user } = useAuth();

  // Feature-Zugriff basierend auf aktueller Subscription
  const features = useMemo(() => {
    if (!subscription && user?.id) {
      // Fallback: Basic features wenn keine Subscription geladen
      return FEATURE_MATRIX.basic;
    }

    if (!subscription) {
      return FEATURE_MATRIX.basic;
    }

    // During Beta: Everyone gets professional features
    if (subscription.status === 'trial' && SubscriptionService.isBetaActive()) {
      return {
        ...FEATURE_MATRIX.professional,
        unlimited_contacts: true,
        unlimited_bookings: true,
        ads_free: true,
        max_contact_requests: 999,
        max_bookings: 999
      };
    }

    return FEATURE_MATRIX[subscription.plan_type] || FEATURE_MATRIX.basic;
  }, [subscription, user?.id]);

  // Helper-Funktionen für Feature-Checks
  const hasFeature = (featureName: keyof typeof features): boolean => {
    return Boolean(features[featureName]);
  };

  const canUseFeature = async (featureName: string): Promise<boolean> => {
    if (!user?.id) return false;
    return await SubscriptionService.checkFeatureAccess(user.id, featureName);
  };

  // Subscription-Status checks
  const isBetaUser = subscription?.status === 'trial';
  const isPremiumUser = subscription?.plan_type === 'premium' || subscription?.plan_type === 'professional';
  const isTrialActive = isBetaUser && SubscriptionService.isBetaActive();

  return {
    subscription,
    subscriptionLoading,
    refreshSubscription,
    features,
    hasFeature,
    canUseFeature,
    isBetaUser,
    isPremiumUser,
    isTrialActive,
    isBetaActive: SubscriptionService.isBetaActive(),
    daysUntilBetaEnd: SubscriptionService.getDaysUntilBetaEnd(),
    shouldShowBetaWarning: SubscriptionService.shouldShowBetaWarning()
  };
} 