import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

// Erstelle einen typisieren Supabase-Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type ActionType = 'contact_request' | 'booking_request' | 'profile_view';

export interface UsageStats {
  contact_requests: number;
  booking_requests: number;
  profile_views: number;
}

export class UsageTrackingService {
  /**
   * Trackt eine User-Aktion
   */
  static async trackAction(
    userId: string,
    actionType: ActionType,
    targetUserId?: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // Verwende die PostgreSQL-Funktion für atomares Tracking
      const { error } = await supabase.rpc('track_user_action', {
        user_uuid: userId,
        action: actionType,
        target_uuid: targetUserId
      });

      if (error) {
        console.error('Error tracking action:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in trackAction:', error);
      return { success: false, error };
    }
  }

  /**
   * Holt die monatliche Usage für einen User
   */
  static async getMonthlyUsage(
    userId: string,
    actionType: ActionType
  ): Promise<number> {
    try {
      // Verwende die PostgreSQL-Funktion
      const { data, error } = await supabase.rpc('get_monthly_usage', {
        user_uuid: userId,
        action: actionType
      });

      if (error) {
        console.error('Error getting monthly usage:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getMonthlyUsage:', error);
      return 0;
    }
  }

  /**
   * Holt die aktuelle Monats-Usage für einen User (Alias für getMonthlyUsage)
   */
  static async getCurrentMonthUsage(
    userId: string,
    actionType: ActionType
  ): Promise<number> {
    return this.getMonthlyUsage(userId, actionType);
  }

  /**
   * Holt alle Usage-Statistiken für einen User für den aktuellen Monat
   */
  static async getUserStats(userId: string): Promise<UsageStats> {
    try {
      const [contactRequests, bookingRequests, profileViews] = await Promise.all([
        this.getMonthlyUsage(userId, 'contact_request'),
        this.getMonthlyUsage(userId, 'booking_request'),
        this.getMonthlyUsage(userId, 'profile_view')
      ]);

      return {
        contact_requests: contactRequests,
        booking_requests: bookingRequests,
        profile_views: profileViews
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        contact_requests: 0,
        booking_requests: 0,
        profile_views: 0
      };
    }
  }

  /**
   * Prüft ob ein User sein Limit für eine bestimmte Aktion erreicht hat
   */
  static async checkLimit(
    userId: string,
    actionType: ActionType,
    limit: number
  ): Promise<{ canPerform: boolean; currentUsage: number; remaining: number }> {
    const currentUsage = await this.getMonthlyUsage(userId, actionType);
    const remaining = Math.max(0, limit - currentUsage);
    const canPerform = currentUsage < limit;

    return {
      canPerform,
      currentUsage,
      remaining
    };
  }

  /**
   * Holt detaillierte Usage-Historie für einen User
   */
  static async getUsageHistory(
    userId: string,
    actionType?: ActionType,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    action_type: string;
    target_user_id: string | null;
    month_year: string;
    count: number | null;
    created_at: string | null;
  }>> {
    try {
      let query = supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting usage history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUsageHistory:', error);
      return [];
    }
  }

  /**
   * Holt monatliche Statistiken für Analytics
   */
  static async getMonthlyStats(
    userId: string
  ): Promise<Array<{
    month_year: string;
    contact_requests: number;
    booking_requests: number;
    profile_views: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('month_year, action_type, count')
        .eq('user_id', userId)
        .order('month_year', { ascending: false });

      if (error) {
        console.error('Error getting monthly stats:', error);
        return [];
      }

      // Gruppiere die Daten nach Monat
      const monthlyStats = new Map<string, {
        month_year: string;
        contact_requests: number;
        booking_requests: number;
        profile_views: number;
      }>();

      data?.forEach(record => {
        const existing = monthlyStats.get(record.month_year) || {
          month_year: record.month_year,
          contact_requests: 0,
          booking_requests: 0,
          profile_views: 0
        };

        switch (record.action_type) {
          case 'contact_request':
            existing.contact_requests += record.count || 0;
            break;
          case 'booking_request':
            existing.booking_requests += record.count || 0;
            break;
          case 'profile_view':
            existing.profile_views += record.count || 0;
            break;
        }

        monthlyStats.set(record.month_year, existing);
      });

      return Array.from(monthlyStats.values());
    } catch (error) {
      console.error('Error in getMonthlyStats:', error);
      return [];
    }
  }

  /**
   * Löscht alte Usage-Daten (für GDPR Compliance)
   */
  static async cleanupOldData(monthsToKeep: number = 12): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
      const cutoffMonthYear = cutoffDate.toISOString().slice(0, 7); // YYYY-MM format

      const { error } = await supabase
        .from('usage_tracking')
        .delete()
        .lt('month_year', cutoffMonthYear);

      if (error) {
        console.error('Error cleaning up old data:', error);
      }
    } catch (error) {
      console.error('Error in cleanupOldData:', error);
    }
  }

  /**
   * Reset Usage-Daten für einen User (für Tests oder Admin-Funktionen)
   */
  static async resetUserUsage(userId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('usage_tracking')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting user usage:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in resetUserUsage:', error);
      return { success: false, error };
    }
  }
} 