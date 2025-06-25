import { UsageTrackingService } from './usageTrackingService';

export type FeatureType = 'contact_request' | 'booking_request' | 'profile_view' | 'review_writing' | 'environment_images' | 'advanced_filters' | 'premium_support';

export interface FeatureLimits {
  contact_requests_per_month: number;
  booking_requests_per_month: number;
  profile_views_per_month: number;
  can_write_reviews: boolean;
  can_reply_to_reviews: boolean;
  max_environment_images: number;
  has_premium_badge: boolean;
  has_advanced_filters: boolean;
  has_premium_support: boolean;
  is_ad_free: boolean;
  search_priority: number; // 0=basic, 1=premium, 2=professional
}

export interface SubscriptionData {
  plan_type: 'basic' | 'premium';
  user_type: 'owner' | 'caretaker';
  status: 'active' | 'trial' | 'cancelled' | 'expired';
}

export class FeatureGateService {
  // Feature Matrix basierend auf Plan und User-Type
  static getFeatureLimits(planType: string, userType: 'owner' | 'caretaker'): FeatureLimits {
    if (userType === 'owner') {
      switch (planType) {
        case 'basic':
          return {
            contact_requests_per_month: 3,
            booking_requests_per_month: 0, // Owner erstellen keine Bookings
            profile_views_per_month: 50,
            can_write_reviews: false,
            can_reply_to_reviews: false,
            max_environment_images: 0,
            has_premium_badge: false,
            has_advanced_filters: false,
            has_premium_support: false,
            is_ad_free: false,
            search_priority: 0
          };
        case 'premium':
          return {
            contact_requests_per_month: -1, // Unlimited
            booking_requests_per_month: 0,
            profile_views_per_month: -1,
            can_write_reviews: true,
            can_reply_to_reviews: false,
            max_environment_images: 0,
            has_premium_badge: true,
            has_advanced_filters: true,
            has_premium_support: true,
            is_ad_free: true,
            search_priority: 1
          };
        default:
          return this.getFeatureLimits('basic', userType);
      }
    } else { // caretaker
      switch (planType) {
        case 'basic':
          return {
            contact_requests_per_month: 0, // Caretaker senden keine Contact Requests
            booking_requests_per_month: 3, // Können 3 Bookings pro Monat empfangen
            profile_views_per_month: 30,
            can_write_reviews: false,
            can_reply_to_reviews: false,
            max_environment_images: 0,
            has_premium_badge: false,
            has_advanced_filters: false,
            has_premium_support: false,
            is_ad_free: false,
            search_priority: 0
          };
        case 'premium': // Professional für Caretaker
          return {
            contact_requests_per_month: 0,
            booking_requests_per_month: -1, // Unlimited
            profile_views_per_month: -1,
            can_write_reviews: false,
            can_reply_to_reviews: true,
            max_environment_images: 6,
            has_premium_badge: true,
            has_advanced_filters: true,
            has_premium_support: true,
            is_ad_free: true,
            search_priority: 2
          };
        default:
          return this.getFeatureLimits('basic', userType);
      }
    }
  }

  // Prüft ob User ein bestimmtes Feature nutzen kann (vereinfacht - ohne DB-Abfrage)
  static async checkFeatureAccess(
    subscription: SubscriptionData,
    userId: string,
    featureType: FeatureType,
    targetUserId?: string
  ): Promise<{ allowed: boolean; reason?: string; currentUsage?: number; limit?: number }> {
    try {
      // Während Beta-Phase: Alles erlaubt für Trial-User
      const betaEndDate = new Date('2025-10-31T23:59:59.000Z');
      const now = new Date();
      if (now < betaEndDate && subscription.status === 'trial') {
        return { allowed: true, reason: 'Beta access - unlimited during trial period' };
      }

      const limits = this.getFeatureLimits(subscription.plan_type, subscription.user_type);

      // Feature-spezifische Checks
      switch (featureType) {
        case 'contact_request':
          if (subscription.user_type !== 'owner') {
            return { allowed: false, reason: 'Only owners can send contact requests' };
          }
          
          if (limits.contact_requests_per_month === -1) {
            return { allowed: true, reason: 'Unlimited access' };
          }

          const contactUsage = await UsageTrackingService.getCurrentMonthUsage(userId, 'contact_request');
          return {
            allowed: contactUsage < limits.contact_requests_per_month,
            reason: contactUsage >= limits.contact_requests_per_month ? 'Monthly limit reached' : undefined,
            currentUsage: contactUsage,
            limit: limits.contact_requests_per_month
          };

        case 'booking_request':
          if (subscription.user_type !== 'caretaker') {
            return { allowed: false, reason: 'Only caretakers can receive booking requests' };
          }

          if (limits.booking_requests_per_month === -1) {
            return { allowed: true, reason: 'Unlimited access' };
          }

          const bookingUsage = await UsageTrackingService.getCurrentMonthUsage(userId, 'booking_request');
          return {
            allowed: bookingUsage < limits.booking_requests_per_month,
            reason: bookingUsage >= limits.booking_requests_per_month ? 'Monthly limit reached' : undefined,
            currentUsage: bookingUsage,
            limit: limits.booking_requests_per_month
          };

        case 'profile_view':
          if (limits.profile_views_per_month === -1) {
            return { allowed: true, reason: 'Unlimited access' };
          }

          const viewUsage = await UsageTrackingService.getCurrentMonthUsage(userId, 'profile_view');
          return {
            allowed: viewUsage < limits.profile_views_per_month,
            reason: viewUsage >= limits.profile_views_per_month ? 'Monthly limit reached' : undefined,
            currentUsage: viewUsage,
            limit: limits.profile_views_per_month
          };

        case 'review_writing':
          return {
            allowed: limits.can_write_reviews,
            reason: !limits.can_write_reviews ? 'Upgrade required for review writing' : undefined
          };

        case 'environment_images':
          if (subscription.user_type !== 'caretaker') {
            return { allowed: false, reason: 'Only caretakers can upload environment images' };
          }

          return {
            allowed: limits.max_environment_images > 0,
            reason: limits.max_environment_images === 0 ? 'Upgrade required for environment images' : undefined,
            limit: limits.max_environment_images
          };

        case 'advanced_filters':
          return {
            allowed: limits.has_advanced_filters,
            reason: !limits.has_advanced_filters ? 'Upgrade required for advanced filters' : undefined
          };

        case 'premium_support':
          return {
            allowed: limits.has_premium_support,
            reason: !limits.has_premium_support ? 'Upgrade required for premium support' : undefined
          };

        default:
          return { allowed: false, reason: 'Unknown feature type' };
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return { allowed: false, reason: 'Error checking access' };
    }
  }

  // Convenience Methods für häufige Checks
  static async canSendContactRequest(subscription: SubscriptionData, userId: string): Promise<boolean> {
    const result = await this.checkFeatureAccess(subscription, userId, 'contact_request');
    return result.allowed;
  }

  static async canReceiveBookingRequest(subscription: SubscriptionData, userId: string): Promise<boolean> {
    const result = await this.checkFeatureAccess(subscription, userId, 'booking_request');
    return result.allowed;
  }

  static async canWriteReviews(subscription: SubscriptionData): Promise<boolean> {
    const limits = this.getFeatureLimits(subscription.plan_type, subscription.user_type);
    return limits.can_write_reviews;
  }

  static async canUploadEnvironmentImage(subscription: SubscriptionData): Promise<boolean> {
    const limits = this.getFeatureLimits(subscription.plan_type, subscription.user_type);
    return limits.max_environment_images > 0;
  }

  static async hasAdvancedFilters(subscription: SubscriptionData): Promise<boolean> {
    const limits = this.getFeatureLimits(subscription.plan_type, subscription.user_type);
    return limits.has_advanced_filters;
  }

  static async hasPremiumSupport(subscription: SubscriptionData): Promise<boolean> {
    const limits = this.getFeatureLimits(subscription.plan_type, subscription.user_type);
    return limits.has_premium_support;
  }

  // Track Feature Usage
  static async trackFeatureUsage(
    userId: string, 
    featureType: FeatureType, 
    targetUserId?: string
  ): Promise<void> {
    // Map FeatureType zu UsageTrackingService ActionType
    const actionTypeMap: Record<string, string> = {
      'contact_request': 'contact_request',
      'booking_request': 'booking_request', 
      'profile_view': 'profile_view'
    };

    const actionType = actionTypeMap[featureType];
    if (actionType && ['contact_request', 'booking_request', 'profile_view'].includes(actionType)) {
      await UsageTrackingService.trackAction(userId, actionType as any, targetUserId);
    }
  }
}

export default FeatureGateService; 