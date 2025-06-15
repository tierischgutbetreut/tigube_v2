import { useSubscription } from './useSubscription';
import { FeatureGateService, FeatureType, FeatureLimits } from '../services/featureGateService';
import { useMemo } from 'react';

export function useFeatureGate() {
  const { user } = { user: null }; // TODO: Replace with correct auth hook
  const { subscription } = useSubscription();

  // Get current feature limits
  const featureLimits = useMemo<FeatureLimits | null>(() => {
    if (!subscription) return null;
    
    return FeatureGateService.getFeatureLimits(
      subscription.plan_type, 
      subscription.user_type
    );
  }, [subscription]);

  // Check specific feature access
  const checkFeatureAccess = async (
    featureType: FeatureType,
    targetUserId?: string
  ) => {
    if (!user?.id || !subscription) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    return FeatureGateService.checkFeatureAccess(
      subscription,
      user.id,
      featureType,
      targetUserId
    );
  };

  // Convenience methods for common feature checks
  const canSendContactRequest = async (): Promise<boolean> => {
    if (!user?.id || !subscription) return false;
    return FeatureGateService.canSendContactRequest(subscription, user.id);
  };

  const canReceiveBookingRequest = async (): Promise<boolean> => {
    if (!user?.id || !subscription) return false;
    return FeatureGateService.canReceiveBookingRequest(subscription, user.id);
  };

  const canWriteReviews = (): boolean => {
    if (!subscription) return false;
    return FeatureGateService.canWriteReviews(subscription);
  };

  const canUploadEnvironmentImages = (): boolean => {
    if (!subscription) return false;
    return FeatureGateService.canUploadEnvironmentImage(subscription);
  };

  const hasAdvancedFilters = (): boolean => {
    if (!subscription) return false;
    return FeatureGateService.hasAdvancedFilters(subscription);
  };

  const hasPremiumSupport = (): boolean => {
    if (!subscription) return false;
    return FeatureGateService.hasPremiumSupport(subscription);
  };

  // Track feature usage
  const trackFeatureUsage = async (
    featureType: FeatureType,
    targetUserId?: string
  ): Promise<void> => {
    if (!user?.id) return;
    
    await FeatureGateService.trackFeatureUsage(
      user.id,
      featureType,
      targetUserId
    );
  };

  // Beta check
  const isBetaUser = subscription?.status === 'trial';
  const betaEndDate = new Date('2025-10-31');
  const isBetaActive = new Date() < betaEndDate && isBetaUser;

  return {
    // Feature limits and subscription info
    featureLimits,
    subscription,
    isBetaUser,
    isBetaActive,
    
    // Feature access methods
    checkFeatureAccess,
    canSendContactRequest,
    canReceiveBookingRequest,
    canWriteReviews,
    canUploadEnvironmentImages,
    hasAdvancedFilters,
    hasPremiumSupport,
    
    // Usage tracking
    trackFeatureUsage,
    
    // Quick access to specific limits
    get contactRequestLimit() {
      return featureLimits?.contact_requests_per_month || 0;
    },
    
    get bookingRequestLimit() {
      return featureLimits?.booking_requests_per_month || 0;
    },
    
    get profileViewLimit() {
      return featureLimits?.profile_views_per_month || 0;
    },
    
    get maxEnvironmentImages() {
      return featureLimits?.max_environment_images || 0;
    },
    
    get searchPriority() {
      return featureLimits?.search_priority || 0;
    },
    
    get isAdFree() {
      return featureLimits?.is_ad_free || false;
    },
    
    get hasPremiumBadge() {
      return featureLimits?.has_premium_badge || false;
    }
  };
}

export default useFeatureGate; 