import { useState, useCallback } from 'react';
import { useSubscription } from '../lib/auth/useSubscription';
import { useAuth } from '../lib/auth/AuthContext';
import { FeatureGateService, FeatureType } from '../lib/services/featureGateService';

export function useFeatureAccess() {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  // Beta-Phase Logik: Während der Beta-Phase sind ALLE authentifizierten User Premium
  const betaEndDate = new Date('2025-10-31T23:59:59.000Z');
  const isBetaPhaseActive = new Date() < betaEndDate;
  
  // Während der Beta-Phase: ALLE User haben Premium-Zugriff, unabhängig von der Subscription
  const isBetaActive = isBetaPhaseActive && user?.id;
  
  // Fallback für fehlende Subscription während der Beta-Phase
  const effectiveSubscription = subscription || (isBetaActive ? {
    id: 'beta-fallback',
    user_id: user?.id || '',
    plan_type: 'free',
    status: 'trial',
    trial_end: betaEndDate
  } : null);

  const checkFeature = useCallback(async (
    featureType: FeatureType,
    targetUserId?: string
  ) => {
    if (!user?.id) {
      return { allowed: false, reason: 'Not authenticated' };
    }
    
    // Während der Beta-Phase: Alle Features sind für alle User erlaubt
    if (isBetaActive) {
      return { allowed: true, reason: 'Beta access - unlimited during trial period' };
    }

    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
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
  }, [user, subscription, isBetaActive]);

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
    if (isBetaActive) return true; // Beta users get all features
    if (!effectiveSubscription) return false;
    return FeatureGateService.getFeatureLimits(effectiveSubscription.plan_type, 'owner').can_write_reviews;
  }, [effectiveSubscription, isBetaActive]);

  const hasAdvancedFilters = useCallback(() => {
    if (isBetaActive) return true; // Beta users get all features
    if (!effectiveSubscription) return false;
    return FeatureGateService.getFeatureLimits(effectiveSubscription.plan_type, 'owner').has_advanced_filters;
  }, [effectiveSubscription, isBetaActive]);

  const maxEnvironmentImages = useCallback(() => {
    if (isBetaActive) return 6; // Beta users get max environment images
    if (!effectiveSubscription) return 0;
    return FeatureGateService.getFeatureLimits(effectiveSubscription.plan_type, 'owner').max_environment_images;
  }, [effectiveSubscription, isBetaActive]);

  const contactLimit = isBetaActive ? 999 : (effectiveSubscription ? 
    FeatureGateService.getFeatureLimits(effectiveSubscription.plan_type, 'owner').contact_requests_per_month : 0);

  const bookingLimit = isBetaActive ? 999 : (effectiveSubscription ? 
    FeatureGateService.getFeatureLimits(effectiveSubscription.plan_type, 'owner').booking_requests_per_month : 0);

  // During beta phase, all users should be treated as premium users
  const isEffectivelyPremium = isBetaActive || effectiveSubscription?.plan_type === 'premium' || effectiveSubscription?.plan_type === 'professional';

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
    isBetaActive,
    isEffectivelyPremium,
    
    // Subscription info
    subscription: effectiveSubscription,
    user
  };
}

export default useFeatureAccess; 