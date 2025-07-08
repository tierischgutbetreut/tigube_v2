import { supabase } from '../supabase/client';

// TypeScript-Types für Subscriptions
export interface Subscription {
  id: string;
  user_id: string;
  user_type: 'owner' | 'caretaker';
  plan_type: 'premium' | 'professional';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_checkout_session_id?: string;
  amount_paid_cents?: number;
  billing_interval?: 'month' | 'year';
  started_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

// Feature Matrix für verschiedene Subscription-Typen
export const FEATURE_MATRIX = {
  basic: {
    max_contact_requests: 3,
    max_bookings: 3,
    max_environment_images: 0,
    advanced_filters: false,
    priority_ranking: false,
    environment_images: false,
    premium_badge: false,
    ads_free: false,
    unlimited_contacts: false,
    unlimited_bookings: false
  },
  premium: {
    max_contact_requests: -1, // unlimited
    max_bookings: 3,
    max_environment_images: 0,
    advanced_filters: true,
    priority_ranking: true,
    environment_images: false,
    premium_badge: true,
    ads_free: true,
    unlimited_contacts: true,
    unlimited_bookings: false
  },
  professional: {
    max_contact_requests: -1, // unlimited
    max_bookings: -1, // unlimited
    max_environment_images: 6,
    advanced_filters: true,
    priority_ranking: true,
    environment_images: true,
    premium_badge: true,
    ads_free: true,
    unlimited_contacts: true,
    unlimited_bookings: true
  }
} as const;

export class SubscriptionService {
  /**
   * Holt die aktuelle aktive Subscription eines Users
   */
  static async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data as Subscription;
  }

  /**
   * Feature-Matrix für Plan-Type abrufen
   */
  static getFeatures(planType: string) {
    return FEATURE_MATRIX[planType as keyof typeof FEATURE_MATRIX] || FEATURE_MATRIX.basic;
  }

  /**
   * Prüft ob ein User Zugriff auf ein bestimmtes Feature hat
   */
  static async checkFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription) {
      // Benutzer ohne Subscription haben nur Basic-Features
      const basicFeatures = FEATURE_MATRIX.basic;
      return basicFeatures[featureName as keyof typeof basicFeatures] as boolean || false;
    }

    const planFeatures = FEATURE_MATRIX[subscription.plan_type];
    return planFeatures ? planFeatures[featureName as keyof typeof planFeatures] as boolean || false : false;
  }

  /**
   * Holt die Feature-Matrix für einen User
   */
  static async getUserFeatures(userId: string) {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription) {
      return FEATURE_MATRIX.basic;
    }

    return FEATURE_MATRIX[subscription.plan_type] || FEATURE_MATRIX.basic;
  }

  /**
   * Upgrade einer Subscription zu einem neuen Plan
   */
  static async upgradeSubscription(
    userId: string, 
    newPlan: 'premium' | 'professional',
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const subscription = await this.getActiveSubscription(userId);

      if (!subscription) {
        return { 
          success: false, 
          error: 'No active subscription found for user' 
        };
      }

      // Update subscription plan
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          plan_type: newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
        .select()
        .single();

      if (error) {
        return { success: false, error };
      }

      // Update user features
      await this.updateUserProfileForPlan(userId, newPlan);

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Update User-Profile basierend auf Plan
   * SYNCHRONIZED with database function update_user_premium_features
   */
  private static async updateUserProfileForPlan(userId: string, planType: string) {
    console.log(`🔄 Updating user profile for plan: ${planType}`);
    
    // Use the same logic as the database function to avoid conflicts
    if (planType === 'premium') {
      // Owner Premium features - MATCH database function values
      await supabase
        .from('users')
        .update({
          show_ads: false,
          premium_badge: true,
          search_priority: 5
        } as any)
        .eq('id', userId);
        
    } else if (planType === 'professional') {
      // Caretaker Professional features - MATCH database function values
      await supabase
        .from('users')
        .update({
          show_ads: false,
          premium_badge: true,
          search_priority: 10
        } as any)
        .eq('id', userId);
        
    } else {
      // Basic/Free plan - MATCH database function values
      await supabase
        .from('users')
        .update({
          show_ads: true,
          premium_badge: false,
          search_priority: 0
        } as any)
        .eq('id', userId);
    }
  }

  /**
   * Kündigt eine Subscription
   */
  static async cancelSubscription(userId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const subscription = await this.getActiveSubscription(userId);

      if (!subscription) {
        return { 
          success: false, 
          error: 'No active subscription found for user' 
        };
      }

      // Set subscription to cancelled
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) {
        return { success: false, error };
      }

      // Reset user to basic features
      await this.updateUserProfileForPlan(userId, 'basic');

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
} 