import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { FEATURE_MATRIX } from '../lib/services/subscriptionService';

export const useFeatureAccess = () => {
  const { user, subscription } = useAuth();
  
  // Verwende die bereits geladene Subscription aus dem AuthContext (jetzt aus users-Tabelle)
  const effectiveSubscription = subscription;

  // Berechne Feature-Zugriff basierend auf der Subscription
  const checkFeature = useCallback((featureName: string): boolean => {
    if (!user) return false;
    
    if (!effectiveSubscription) {
      // Benutzer ohne Subscription haben nur Free-Features
      const freeFeatures = FEATURE_MATRIX.free;
      return freeFeatures[featureName as keyof typeof freeFeatures] as boolean || false;
    }

    // Prüfe ob Premium abgelaufen ist
    const isPremiumExpired = effectiveSubscription.plan_type === 'premium' && 
                            effectiveSubscription.plan_expires_at && 
                            new Date(effectiveSubscription.plan_expires_at) <= new Date();

    const planType = isPremiumExpired ? 'free' : effectiveSubscription.plan_type;
    const planFeatures = FEATURE_MATRIX[planType as keyof typeof FEATURE_MATRIX];
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
      return FEATURE_MATRIX.free.max_environment_images;
    }
    
    // Prüfe ob Premium abgelaufen ist
    const isPremiumExpired = effectiveSubscription.plan_type === 'premium' && 
                            effectiveSubscription.plan_expires_at && 
                            new Date(effectiveSubscription.plan_expires_at) <= new Date();

    const planType = isPremiumExpired ? 'free' : effectiveSubscription.plan_type;
    return FEATURE_MATRIX[planType as keyof typeof FEATURE_MATRIX].max_environment_images;
  }, [effectiveSubscription]);

  const contactLimit = effectiveSubscription ? 
    FEATURE_MATRIX[effectiveSubscription.plan_type as keyof typeof FEATURE_MATRIX].max_contact_requests : 
    FEATURE_MATRIX.free.max_contact_requests;

  const bookingLimit = effectiveSubscription ? 
    FEATURE_MATRIX[effectiveSubscription.plan_type as keyof typeof FEATURE_MATRIX].max_bookings :
    FEATURE_MATRIX.free.max_bookings;

  const isEffectivelyPremium = effectiveSubscription?.plan_type === 'premium' && 
                              (!effectiveSubscription.plan_expires_at || new Date(effectiveSubscription.plan_expires_at) > new Date());

  return {
    checkFeature,
    hasAdvancedFilters,
    hasPriorityRanking,
    maxEnvironmentImages,
    contactLimit,
    bookingLimit,
    isEffectivelyPremium,
    subscription: effectiveSubscription
  };
}; 