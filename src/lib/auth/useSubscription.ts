import { useAuth } from './AuthContext';
import { SubscriptionService, FEATURE_MATRIX } from '../services/subscriptionService';
import { useMemo } from 'react';

export function useSubscription() {
  const { subscription, subscriptionLoading, refreshSubscription, user } = useAuth();

  // Feature-Zugriff basierend auf aktueller Subscription
  const features = useMemo(() => {
    if (!subscription) {
      return FEATURE_MATRIX.basic;
    }

    return FEATURE_MATRIX[subscription.plan_type as keyof typeof FEATURE_MATRIX] || FEATURE_MATRIX.basic;
  }, [subscription]);

  // Helper-Funktionen für Feature-Checks
  const hasFeature = (featureName: keyof typeof features): boolean => {
    return Boolean(features[featureName]);
  };

  const canUseFeature = async (featureName: string): Promise<boolean> => {
    if (!user?.id) return false;
    return await SubscriptionService.checkFeatureAccess(user.id, featureName);
  };

  // Subscription-Status checks
  const isPremiumUser = subscription?.plan_type === 'premium' || subscription?.plan_type === 'professional';

  return {
    subscription,
    subscriptionLoading,
    refreshSubscription,
    features,
    hasFeature,
    canUseFeature,
    isPremiumUser
  };
} 