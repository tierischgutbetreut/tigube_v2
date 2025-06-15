import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

// Erstelle einen typisieren Supabase-Client für die neuen Tabellen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// TypeScript-Types aus der Datenbank
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

export interface FeatureMatrix {
  [planType: string]: {
    unlimited_contacts: boolean;
    unlimited_bookings: boolean;
    advanced_filters: boolean;
    priority_ranking: boolean;
    environment_images: boolean;
    premium_badge: boolean;
    ads_free: boolean;
    max_contact_requests: number;
    max_bookings: number;
    max_environment_images: number;
  };
}

export const FEATURE_MATRIX: FeatureMatrix = {
  basic: {
    unlimited_contacts: false,
    unlimited_bookings: false,
    advanced_filters: false,
    priority_ranking: false,
    environment_images: false,
    premium_badge: false,
    ads_free: false,
    max_contact_requests: 3,
    max_bookings: 3,
    max_environment_images: 0
  },
  premium: {
    unlimited_contacts: true,
    unlimited_bookings: false, // Nur für Owner
    advanced_filters: true,
    priority_ranking: true,
    environment_images: false, // Nur für Caretaker
    premium_badge: true,
    ads_free: true,
    max_contact_requests: 999,
    max_bookings: 3, // Owner können unlimited kontaktieren, aber Caretaker haben limits
    max_environment_images: 0
  },
  professional: {
    unlimited_contacts: true,
    unlimited_bookings: true,
    advanced_filters: true,
    priority_ranking: true,
    environment_images: true,
    premium_badge: true,
    ads_free: true,
    max_contact_requests: 999,
    max_bookings: 999,
    max_environment_images: 6
  }
};

// Beta-Konfiguration
export const BETA_CONFIG = {
  startDate: '2025-02-01',
  endDate: '2025-10-31T23:59:59.000Z',
  allFeaturesUnlocked: true,
  showBetaBanner: true,
  warningPeriod: 30 // Tage vor Ende warnen
};

export class SubscriptionService {
  /**
   * Erstellt eine Trial-Subscription für neue User während der Beta-Phase
   */
  static async createTrialSubscription(
    userId: string, 
    userType: 'owner' | 'caretaker'
  ): Promise<{ data: Subscription | null; error: any }> {
    const trialEndDate = new Date(BETA_CONFIG.endDate);
    
    const subscriptionData: SubscriptionInsert = {
      user_id: userId,
      user_type: userType,
      plan_type: 'basic',
      status: 'trial',
      trial_start_date: new Date().toISOString(),
      trial_end_date: trialEndDate.toISOString()
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating trial subscription:', error);
      return { data: null, error };
    }

    // Update user profile mit Beta-Settings
    await this.updateUserProfileForBeta(userId, data.id);

    return { data, error: null };
  }

  /**
   * Holt die aktuelle Subscription eines Users
   */
  static async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  }

  /**
   * Prüft ob ein User Zugriff auf ein bestimmtes Feature hat
   */
  static async checkFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription) {
      const basicFeatures = FEATURE_MATRIX.basic;
      return basicFeatures[featureName as keyof typeof basicFeatures] as boolean || false;
    }

    // During Beta: Everyone gets all features
    if (subscription.status === 'trial' && this.isBetaActive()) {
      return true;
    }

    const planFeatures = FEATURE_MATRIX[subscription.plan_type];
    return planFeatures ? planFeatures[featureName as keyof typeof planFeatures] as boolean || false : false;
  }

  /**
   * Holt die Feature-Matrix für einen User
   */
  static async getUserFeatures(userId: string): Promise<FeatureMatrix[keyof FeatureMatrix]> {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription) {
      return FEATURE_MATRIX.basic;
    }

    // During Beta: Everyone gets professional features
    if (subscription.status === 'trial' && this.isBetaActive()) {
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
  }

  /**
   * Prüft ob die Beta-Phase noch aktiv ist
   */
  static isBetaActive(): boolean {
    const now = new Date();
    const endDate = new Date(BETA_CONFIG.endDate);
    return now < endDate;
  }

  /**
   * Berechnet Tage bis zum Ende der Beta-Phase
   */
  static getDaysUntilBetaEnd(): number {
    const now = new Date();
    const endDate = new Date(BETA_CONFIG.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Prüft ob Warnung vor Beta-Ende angezeigt werden soll
   */
  static shouldShowBetaWarning(): boolean {
    const daysLeft = this.getDaysUntilBetaEnd();
    return daysLeft <= BETA_CONFIG.warningPeriod && daysLeft > 0;
  }

  /**
   * Update User-Profile für Beta-Phase
   */
  private static async updateUserProfileForBeta(userId: string, subscriptionId: string) {
    await supabase
      .from('users')
      .update({
        subscription_id: subscriptionId,
        max_contact_requests: 999, // Unlimited during beta
        max_bookings: 999, // Unlimited during beta
        show_ads: false, // No ads during beta
        premium_badge: true, // Everyone gets premium features during beta
        search_priority: 1 // Everyone gets premium ranking during beta
      })
      .eq('id', userId);
  }

  /**
   * Upgrade eine Subscription (für später nach Beta-Phase)
   */
  static async upgradeSubscription(
    userId: string, 
    newPlan: 'premium' | 'professional',
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: any }> {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription) {
      return { success: false, error: 'No active subscription found' };
    }

    const updateData: SubscriptionUpdate = {
      plan_type: newPlan,
      status: 'active',
      billing_start_date: new Date().toISOString(),
      billing_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      payment_method_id: paymentMethodId
    };

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    if (error) {
      console.error('Error upgrading subscription:', error);
      return { success: false, error };
    }

    // Update user profile with new limits
    await this.updateUserProfileForPlan(userId, newPlan);

    return { success: true };
  }

  /**
   * Update User-Profile basierend auf Plan
   */
  private static async updateUserProfileForPlan(userId: string, planType: string) {
    const features = FEATURE_MATRIX[planType];
    
    await supabase
      .from('users')
      .update({
        max_contact_requests: features.max_contact_requests,
        max_bookings: features.max_bookings,
        show_ads: !features.ads_free,
        premium_badge: features.premium_badge,
        search_priority: planType === 'professional' ? 2 : planType === 'premium' ? 1 : 0
      })
      .eq('id', userId);
  }

  /**
   * Bereitet Beta-zu-Freemium-Migration vor
   */
  static async migrateBetaToFreemium(): Promise<void> {
    // Alle Trial-Subscriptions auf expired setzen
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        plan_type: 'basic'
      })
      .eq('status', 'trial');

    // Alle User-Profile auf Basic-Plan setzen
    const { data: expiredSubscriptions } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'expired');

    if (expiredSubscriptions) {
      const userIds = expiredSubscriptions.map(sub => sub.user_id).filter((id): id is string => id !== null);
      
      await supabase
        .from('users')
        .update({
          max_contact_requests: 3,
          max_bookings: 3,
          show_ads: true,
          premium_badge: false,
          search_priority: 0
        })
        .in('id', userIds);
    }
  }

  /**
   * Holt Beta-Statistiken
   */
  static async getBetaStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    daysRemaining: number;
    isActive: boolean;
  }> {
    // Erste Abfrage: Zähle User mit Trial-Subscriptions
    const { count: trialUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'trial');

    // Fallback: Wenn keine Trial-Subscriptions vorhanden, zähle alle User
    // (für den Fall dass die Migration noch nicht korrekt ausgeführt wurde)
    let totalUsers = trialUsers || 0;
    
    if (totalUsers === 0) {
      const { count: allUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      totalUsers = allUsers || 0;
    }

    // Aktive User basierend auf letztem Login (letzte 7 Tage)
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return {
      totalUsers,
      activeUsers: activeUsers || 0,
      daysRemaining: this.getDaysUntilBetaEnd(),
      isActive: this.isBetaActive()
    };
  }

  /**
   * Admin-Tool: Erstellt Trial-Subscriptions für alle User die noch keine haben
   * Nützlich falls die automatische Erstellung fehlgeschlagen ist
   */
  static async createMissingTrialSubscriptions(): Promise<{
    created: number;
    errors: number;
    message: string;
  }> {
    console.log('🔧 Starting bulk trial subscription creation...');
    
    // Finde alle User ohne aktive Subscription
    const { data: usersWithoutSubscription, error: queryError } = await supabase
      .from('users')
      .select('id, user_type')
      .is('subscription_id', null)
      .not('user_type', 'is', null);

    if (queryError) {
      console.error('❌ Error querying users without subscriptions:', queryError);
      return {
        created: 0,
        errors: 1,
        message: 'Failed to query users without subscriptions'
      };
    }

    if (!usersWithoutSubscription || usersWithoutSubscription.length === 0) {
      return {
        created: 0,
        errors: 0,
        message: 'All users already have subscriptions'
      };
    }

    console.log(`🎯 Found ${usersWithoutSubscription.length} users without subscriptions`);

    let created = 0;
    let errors = 0;

    // Erstelle Trial-Subscriptions für alle User ohne Subscription
    for (const user of usersWithoutSubscription) {
      try {
        const result = await this.createTrialSubscription(
          user.id, 
          user.user_type as 'owner' | 'caretaker'
        );

        if (result.error) {
          console.error(`❌ Failed to create subscription for user ${user.id}:`, result.error);
          errors++;
        } else {
          console.log(`✅ Created trial subscription for user ${user.id}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Exception creating subscription for user ${user.id}:`, error);
        errors++;
      }
    }

    const message = `Created ${created} trial subscriptions, ${errors} errors`;
    console.log(`🎯 Bulk creation complete: ${message}`);

    return {
      created,
      errors,
      message
    };
  }
} 