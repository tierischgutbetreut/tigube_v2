import { adminSupabase } from '../supabase/adminClient';
import { SubscriptionService } from '../services/subscriptionService';

export interface SubscriptionSyncResult {
  total_users: number;
  synced_successfully: number;
  failed_syncs: number;
  errors: Array<{
    user_id: string;
    error: string;
  }>;
}

export interface UserSubscriptionStatus {
  user_id: string;
  email: string;
  name: string;
  plan_type: string;
  subscription_status: string;
  has_active_subscription: boolean;
  premium_badge: boolean;
  show_ads: boolean;
  search_priority: number;
  max_contact_requests: number;
  max_bookings: number;
  last_sync: string | null;
}

export class SubscriptionAdminService {
  /**
   * Synchronisiert alle User-Subscriptions global (Admin-Funktion)
   */
  static async syncAllUserSubscriptions(): Promise<SubscriptionSyncResult> {
    try {
      console.log('🔧 [Admin] Starting global subscription sync...');

      // Get all users with their subscription data
      const { data: users, error: usersError } = await adminSupabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          premium_badge,
          show_ads,
          search_priority,
          max_contact_requests,
          max_bookings
        `);

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      const result: SubscriptionSyncResult = {
        total_users: users?.length || 0,
        synced_successfully: 0,
        failed_syncs: 0,
        errors: []
      };

      if (!users || users.length === 0) {
        console.log('ℹ️ [Admin] No users found to sync');
        return result;
      }

      // Sync each user
      for (const user of users) {
        try {
          console.log(`🔄 [Admin] Syncing user: ${user.email}`);
          
          const syncResult = await SubscriptionService.syncSubscriptionStatus(user.id);
          
          if (syncResult.success) {
            result.synced_successfully++;
            console.log(`✅ [Admin] Successfully synced user: ${user.email}`);
          } else {
            result.failed_syncs++;
            result.errors.push({
              user_id: user.id,
              error: syncResult.error?.message || 'Unknown error'
            });
            console.error(`❌ [Admin] Failed to sync user: ${user.email}`, syncResult.error);
          }
        } catch (error: any) {
          result.failed_syncs++;
          result.errors.push({
            user_id: user.id,
            error: error.message || 'Exception during sync'
          });
          console.error(`❌ [Admin] Exception syncing user: ${user.email}`, error);
        }
      }

      console.log('🎉 [Admin] Global subscription sync completed:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [Admin] Global subscription sync failed:', error);
      throw new Error(`Global subscription sync failed: ${error.message}`);
    }
  }

  /**
   * Holt detaillierte Subscription-Status für alle Users (Admin-Übersicht)
   */
  static async getAllUserSubscriptionStatuses(): Promise<UserSubscriptionStatus[]> {
    try {
      console.log('📊 [Admin] Fetching all user subscription statuses...');

      const { data, error } = await adminSupabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          premium_badge,
          show_ads,
          search_priority,
          max_contact_requests,
          max_bookings,
          updated_at,
          subscriptions!inner(
            plan_type,
            status,
            created_at,
            updated_at
          )
        `)
        .order('email', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch user subscription statuses: ${error.message}`);
      }

      // Also get users without subscriptions
      const { data: usersWithoutSubs, error: noSubsError } = await adminSupabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          premium_badge,
          show_ads,
          search_priority,
          max_contact_requests,
          max_bookings,
          updated_at
        `)
        .is('subscription_id', null);

      if (noSubsError) {
        console.warn('⚠️ [Admin] Could not fetch users without subscriptions:', noSubsError);
      }

      const allStatuses: UserSubscriptionStatus[] = [];

      // Process users with subscriptions
      if (data) {
        for (const user of data) {
          const activeSubscription = (user.subscriptions as any[])?.find(sub => sub.status === 'active');
          
          allStatuses.push({
            user_id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`.trim(),
            plan_type: activeSubscription?.plan_type || 'basic',
            subscription_status: activeSubscription?.status || 'none',
            has_active_subscription: !!activeSubscription,
            premium_badge: user.premium_badge || false,
            show_ads: user.show_ads !== false, // Default true
            search_priority: user.search_priority || 0,
            max_contact_requests: user.max_contact_requests || 3,
            max_bookings: user.max_bookings || 3,
            last_sync: user.updated_at
          });
        }
      }

      // Process users without subscriptions
      if (usersWithoutSubs) {
        for (const user of usersWithoutSubs) {
          allStatuses.push({
            user_id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`.trim(),
            plan_type: 'basic',
            subscription_status: 'none',
            has_active_subscription: false,
            premium_badge: user.premium_badge || false,
            show_ads: user.show_ads !== false,
            search_priority: user.search_priority || 0,
            max_contact_requests: user.max_contact_requests || 3,
            max_bookings: user.max_bookings || 3,
            last_sync: user.updated_at
          });
        }
      }

      console.log(`✅ [Admin] Retrieved ${allStatuses.length} user subscription statuses`);
      return allStatuses;

    } catch (error: any) {
      console.error('❌ [Admin] Failed to fetch user subscription statuses:', error);
      throw new Error(`Failed to fetch user subscription statuses: ${error.message}`);
    }
  }

  /**
   * Manuelle Subscription-Synchronisation für einen spezifischen User (Admin)
   */
  static async syncUserSubscription(userId: string): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      console.log(`🔧 [Admin] Manual sync for user: ${userId}`);

      // Get user info first
      const { data: user, error: userError } = await adminSupabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'User nicht gefunden',
          error: userError
        };
      }

      const result = await SubscriptionService.syncSubscriptionStatus(userId);
      
      if (result.success) {
        return {
          success: true,
          message: `Subscription erfolgreich synchronisiert für ${user.email}`
        };
      } else {
        return {
          success: false,
          message: `Synchronisation fehlgeschlagen für ${user.email}`,
          error: result.error
        };
      }

    } catch (error: any) {
      console.error('❌ [Admin] Manual user sync failed:', error);
      return {
        success: false,
        message: 'Synchronisation fehlgeschlagen',
        error
      };
    }
  }

  /**
   * Holt Statistiken über Subscription-Synchronisation
   */
  static async getSubscriptionSyncStats(): Promise<{
    total_users: number;
    users_with_premium_badge: number;
    users_with_active_subscriptions: number;
    sync_issues: number;
  }> {
    try {
      console.log('📊 [Admin] Fetching subscription sync stats...');

      // Get total users count
      const { count: totalUsers } = await adminSupabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get users with premium badge
      const { count: premiumBadgeUsers } = await adminSupabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('premium_badge', true);

      // Get users with active subscriptions
      const { count: activeSubscriptions } = await adminSupabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Potential sync issues: users with active subscriptions but no premium badge
      const { data: syncIssues } = await adminSupabase
        .from('subscriptions')
        .select(`
          user_id,
          users!inner(premium_badge)
        `)
        .eq('status', 'active')
        .eq('users.premium_badge', false);

      const stats = {
        total_users: totalUsers || 0,
        users_with_premium_badge: premiumBadgeUsers || 0,
        users_with_active_subscriptions: activeSubscriptions || 0,
        sync_issues: syncIssues?.length || 0
      };

      console.log('✅ [Admin] Subscription sync stats:', stats);
      return stats;

    } catch (error: any) {
      console.error('❌ [Admin] Failed to fetch subscription sync stats:', error);
      throw new Error(`Failed to fetch subscription sync stats: ${error.message}`);
    }
  }
} 