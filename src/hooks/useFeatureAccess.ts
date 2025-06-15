import { useState, useCallback } from 'react';
import { useSubscription } from '../lib/auth/useSubscription';
import { useAuth } from '../lib/auth/AuthContext';
import { FeatureGateService, FeatureType } from '../lib/services/featureGateService';

export function useFeatureAccess() {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkFeature = useCallback(async (
    featureType: FeatureType,
    targetUserId?: string
  ) => {
    if (!user?.id || !subscription) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    setIsChecking(true);
    try {
      const result = await FeatureGateService.checkFeatureAccess(
        subscription,
        user.id,
        featureType,
        targetUserId
      );
      return result;
    } finally {
      setIsChecking(false);
    }
  }, [user, subscription]);

  const trackUsage = useCallback(async (
    featureType: FeatureType,
    targetUserId?: string
  ) => {
    if (!user?.id) return;
    
    await FeatureGateService.trackFeatureUsage(
      user.id,
      featureType,
      targetUserId
    );
  }, [user]);

  // Quick access methods
  const canSendContactRequest = useCallback(async () => {
    const result = await checkFeature('contact_request');
    return result.allowed;
  }, [checkFeature]);

  const canReceiveBookingRequest = useCallback(async () => {
    const result = await checkFeature('booking_request');
    return result.allowed;
  }, [checkFeature]);

  const canWriteReviews = useCallback(() => {
    if (!subscription) return false;
    return FeatureGateService.getFeatureLimits(subscription.plan_type, subscription.user_type).can_write_reviews;
  }, [subscription]);

  const hasAdvancedFilters = useCallback(() => {
    if (!subscription) return false;
    return FeatureGateService.getFeatureLimits(subscription.plan_type, subscription.user_type).has_advanced_filters;
  }, [subscription]);

  const maxEnvironmentImages = useCallback(() => {
    if (!subscription) return 0;
    return FeatureGateService.getFeatureLimits(subscription.plan_type, subscription.user_type).max_environment_images;
  }, [subscription]);

  const contactLimit = subscription ? 
    FeatureGateService.getFeatureLimits(subscription.plan_type, subscription.user_type).contact_requests_per_month : 0;

  const bookingLimit = subscription ? 
    FeatureGateService.getFeatureLimits(subscription.plan_type, subscription.user_type).booking_requests_per_month : 0;

  const isBetaUser = subscription?.status === 'trial';
  const betaEndDate = new Date('2025-10-31');
  const isBetaActive = new Date() < betaEndDate && isBetaUser;

  return {
    // Core methods
    checkFeature,
    trackUsage,
    isChecking,
    
    // Quick access
    canSendContactRequest,
    canReceiveBookingRequest,
    canWriteReviews,
    hasAdvancedFilters,
    maxEnvironmentImages,
    
    // Limits
    contactLimit,
    bookingLimit,
    
    // Beta status
    isBetaUser,
    isBetaActive,
    
    // Subscription info
    subscription,
    user
  };
}

export default useFeatureAccess; 