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
    try {
      console.log('🔍 Fetching active subscription for user:', userId);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching subscription:', error);
        return null;
      }

      if (data) {
        console.log('✅ Found active subscription:', data);
        return data as Subscription;
      } else {
        console.log('ℹ️ No active subscription found for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Exception in getActiveSubscription:', error);
      return null;
    }
  }

  /**
   * Holt alle Subscriptions eines Users (auch inaktive)
   */
  static async getAllUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user subscriptions:', error);
        return [];
      }

      return data as Subscription[];
    } catch (error) {
      console.error('❌ Exception in getAllUserSubscriptions:', error);
      return [];
    }
  }

  /**
   * Synchronisiert Subscription-Status mit der Datenbank
   * Wird von Stripe-Webhooks und Manual-Sync verwendet
   */
  static async syncSubscriptionStatus(userId: string): Promise<{ success: boolean; subscription?: Subscription | null; error?: any }> {
    try {
      console.log('🔄 Syncing subscription status for user:', userId);

      // Hol die aktuelle Subscription
      const subscription = await this.getActiveSubscription(userId);
      
      if (subscription) {
        // Trigger eine Update-User-Profile-Funktion
        await this.updateUserProfileForPlan(userId, subscription.plan_type);
        
        console.log('✅ Subscription sync completed successfully');
        return { success: true, subscription };
      } else {
        // Kein aktives Abo - setze User auf Basic zurück
        console.log('ℹ️ No active subscription - resetting to basic');
        await this.updateUserProfileForPlan(userId, 'basic');
        
        return { success: true, subscription: null };
      }
    } catch (error) {
      console.error('❌ Error syncing subscription status:', error);
      return { success: false, error };
    }
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
    let updateData: any;
    
    if (planType === 'premium') {
      // Owner Premium features - MATCH database function values
      updateData = {
        show_ads: false,
        premium_badge: true,
        search_priority: 5,
        max_contact_requests: -1 // unlimited
      };
        
    } else if (planType === 'professional') {
      // Caretaker Professional features - MATCH database function values
      updateData = {
        show_ads: false,
        premium_badge: true,
        search_priority: 10,
        max_contact_requests: -1, // unlimited
        max_bookings: -1 // unlimited
      };
        
    } else {
      // Basic/Free plan - MATCH database function values
      updateData = {
        show_ads: true,
        premium_badge: false,
        search_priority: 0,
        max_contact_requests: 3,
        max_bookings: 3
      };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user profile:', error);
        throw error;
      }

      console.log(`✅ Updated user ${userId} with ${planType} features`);
    } catch (error) {
      console.error('❌ Failed to update user profile for plan:', error);
      throw error;
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

  /**
   * Manuelle Synchronisation von Stripe-Daten
   * Kann von Admin oder User ausgelöst werden
   */
  static async manualStripeSync(userId: string): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      console.log('🔄 Starting manual Stripe sync for user:', userId);

      // Sync subscription status
      const syncResult = await this.syncSubscriptionStatus(userId);
      
      if (!syncResult.success) {
        return {
          success: false,
          message: 'Fehler beim Synchronisieren der Subscription-Daten',
          error: syncResult.error
        };
      }

      if (syncResult.subscription) {
        return {
          success: true,
          message: `Premium-Status erfolgreich synchronisiert. Plan: ${syncResult.subscription.plan_type}`
        };
      } else {
        return {
          success: true,
          message: 'Kein aktives Premium-Abo gefunden. Basic-Plan aktiviert.'
        };
      }
    } catch (error) {
      console.error('❌ Manual Stripe sync failed:', error);
      return {
        success: false,
        message: 'Synchronisation fehlgeschlagen',
        error
      };
    }
  }
} 