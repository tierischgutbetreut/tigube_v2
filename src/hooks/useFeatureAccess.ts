import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { SubscriptionService } from '../lib/services/subscriptionService';

export const useFeatureAccess = () => {
  const { user, subscription } = useAuth();
  
  // Verwende die bereits geladene Subscription aus dem AuthContext
  const effectiveSubscription = subscription;

  // Berechne Feature-Zugriff basierend auf der Subscription
  const checkFeature = useCallback((featureName: string): boolean => {
    if (!user) return false;
    
    if (!effectiveSubscription) {
      // Benutzer ohne Subscription haben nur Basic-Features
      const basicFeatures = SubscriptionService.getFeatures('basic');
      return basicFeatures[featureName as keyof typeof basicFeatures] as boolean || false;
    }

    const planFeatures = SubscriptionService.getFeatures(effectiveSubscription.plan_type);
    return planFeatures[featureName as keyof typeof planFeatures] as boolean || false;
  }, [user, effectiveSubscription]);

  const hasAdvancedFilters = useCallback(() => {
    return checkFeature('advanced_filters');
  }, [checkFeature]);

  const hasPriorityRanking = useCallback(() => {
    return checkFeature('priority_ranking');
  }, [checkFeature]);

  const maxEnvironmentImages = useCallback(() => {
    if (!effectiveSubscription) {
      return SubscriptionService.getFeatures('basic').max_environment_images;
    }
    return SubscriptionService.getFeatures(effectiveSubscription.plan_type).max_environment_images;
  }, [effectiveSubscription]);

  const contactLimit = effectiveSubscription ? 
    SubscriptionService.getFeatures(effectiveSubscription.plan_type).max_contact_requests : 
    SubscriptionService.getFeatures('basic').max_contact_requests;

  const bookingLimit = effectiveSubscription ? 
    SubscriptionService.getFeatures(effectiveSubscription.plan_type).max_bookings :
    SubscriptionService.getFeatures('basic').max_bookings;

  const isEffectivelyPremium = effectiveSubscription?.plan_type === 'premium' || effectiveSubscription?.plan_type === 'professional';

  const trackUsage = useCallback(async (featureName: string, amount: number = 1) => {
    if (!user) return false;
    
    // Implementiere Usage-Tracking falls benötigt
    console.log(`Feature ${featureName} verwendet (${amount}x) von User ${user.id}`);
    return true;
  }, [user]);

  return {
    // Feature-Checks
    checkFeature,
    hasAdvancedFilters,
    hasPriorityRanking,
    maxEnvironmentImages,
    
    // Limits
    contactLimit,
    bookingLimit,
    
    // Status
    isEffectivelyPremium,
    subscription: effectiveSubscription,
    
    // Actions
    trackUsage
  };
}; 