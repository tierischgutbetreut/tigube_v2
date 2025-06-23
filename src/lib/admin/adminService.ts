import { supabase } from '../supabase/client';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support';

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  admin_role: AdminRole | null;
  totp_secret: string | null;
  last_admin_login: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  total_owners: number;
  total_caretakers: number;
  active_subscriptions: number;
  total_conversations: number;
  total_messages: number;
  total_revenue: number;
  users_last_30_days: number;
}

export const ROLE_PERMISSIONS = {
  super_admin: ['*'], // All permissions
  admin: [
    'users.read', 'users.write', 'users.delete',
    'revenue.read', 'analytics.read',
    'advertising.read', 'advertising.write',
    'content.moderate', 'audit.read'
  ],
  moderator: [
    'users.read', 'content.moderate', 'support.read'
  ],
  support: [
    'users.read', 'support.read', 'support.write'
  ]
} as const;

export class AdminService {
  /**
   * Check if current user is admin
   */
  static async checkAdminAccess(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      return data?.is_admin === true;
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  }

  /**
   * Get current admin user details
   */
  static async getCurrentAdmin(): Promise<AdminUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          is_admin,
          admin_role,
          totp_secret,
          last_admin_login,
          created_at
        `)
        .eq('id', user.id)
        .eq('is_admin', true)
        .single();

      if (error || !data) return null;
      
      return data as AdminUser;
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  }

  /**
   * Check if admin has specific permission
   */
  static hasPermission(adminRole: AdminRole | null, permission: string): boolean {
    if (!adminRole) return false;
    
    const permissions = ROLE_PERMISSIONS[adminRole];
    return permissions.includes('*') || permissions.includes(permission);
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<AdminDashboardStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

      if (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
      }

      return data as AdminDashboardStats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return null;
    }
  }

  /**
   * Log admin action
   */
  static async logAction(
    action: string,
    targetTable?: string,
    targetId?: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client IP and user agent if available
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;

      await supabase.rpc('log_admin_action', {
        admin_id: user.id,
        action_name: action,
        table_name: targetTable || null,
        record_id: targetId || null,
        old_data: oldValues || null,
        new_data: newValues || null,
        ip_addr: ipAddress,
        user_agent_str: userAgent
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Get audit logs (paginated)
   */
  static async getAuditLogs(
    page = 0, 
    limit = 50
  ): Promise<{ data: AdminAuditLog[]; totalCount: number } | null> {
    try {
      const offset = page * limit;

      // Get total count
      const { count } = await supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact', head: true });

      // Get paginated data
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`
          id,
          admin_user_id,
          action,
          target_table,
          target_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return null;
      }

      return {
        data: data as AdminAuditLog[],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return null;
    }
  }

  /**
   * Update admin last login timestamp
   */
  static async updateLastLogin(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('users')
        .update({ last_admin_login: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Helper: Get client IP address
   */
  private static async getClientIP(): Promise<string | null> {
    try {
      // This is a simple implementation
      // In production, you might want to use a proper IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting client IP:', error);
      return null;
    }
  }

  /**
   * TOTP Secret generation and verification
   */
  static generateTOTPSecret(): string {
    // Simple TOTP secret generation
    // In production, use a proper crypto library like otplib
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  /**
   * Save TOTP secret for user
   */
  static async saveTOTPSecret(secret: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('users')
        .update({ totp_secret: secret })
        .eq('id', user.id);

      return !error;
    } catch (error) {
      console.error('Error saving TOTP secret:', error);
      return false;
    }
  }

  // Phase 2: User Management Extensions
  async getUserManagementStats(): Promise<UserManagementStats> {
    try {
      const { data, error } = await supabase.rpc('get_user_management_stats');
      
      if (error) {
        throw new Error(`Failed to get user management stats: ${error.message}`);
      }
      
      return data || {};
    } catch (error) {
      console.error('Error getting user management stats:', error);
      throw error;
    }
  }

  async searchUsers(filters: UserSearchFilters = {}, limit: number = 50, offset: number = 0): Promise<UserSearchResult> {
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: filters.searchTerm || null,
        user_type_filter: filters.userType || null,
        limit_count: limit,
        offset_count: offset
      });
      
      if (error) {
        throw new Error(`Failed to search users: ${error.message}`);
      }
      
      return data || { users: [], total_count: 0 };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<DetailedUser> {
    try {
      const { data, error } = await supabase.rpc('get_user_details', {
        target_user_id: userId
      });
      
      if (error) {
        throw new Error(`Failed to get user details: ${error.message}`);
      }
      
      return data || {};
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([ticket]);
      
      if (error) {
        throw new Error(`Failed to create support ticket: ${error.message}`);
      }
      
      await this.logAdminAction('create_support_ticket', { ticket_id: ticket.title });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (error) {
        throw new Error(`Failed to update support ticket: ${error.message}`);
      }
      
      await this.logAdminAction('update_support_ticket', { ticket_id: ticketId, updates });
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  async createUserNote(note: Omit<UserNote, 'id' | 'created_at' | 'updated_at' | 'admin_name'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notes')
        .insert([note]);
      
      if (error) {
        throw new Error(`Failed to create user note: ${error.message}`);
      }
      
      await this.logAdminAction('create_user_note', { user_id: note.user_id, note_type: note.note_type });
    } catch (error) {
      console.error('Error creating user note:', error);
      throw error;
    }
  }

  async updateUserNote(noteId: string, updates: Partial<UserNote>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);
      
      if (error) {
        throw new Error(`Failed to update user note: ${error.message}`);
      }
      
      await this.logAdminAction('update_user_note', { note_id: noteId, updates });
    } catch (error) {
      console.error('Error updating user note:', error);
      throw error;
    }
  }

  async deleteUserNote(noteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) {
        throw new Error(`Failed to delete user note: ${error.message}`);
      }
      
      await this.logAdminAction('delete_user_note', { note_id: noteId });
    } catch (error) {
      console.error('Error deleting user note:', error);
      throw error;
    }
  }

  async getUserAnalytics(userId: string, metricType?: string): Promise<UserAnalytics[]> {
    try {
      let query = supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('date_recorded', { ascending: false });

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to get user analytics: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  async createUserAnalytics(analytics: Omit<UserAnalytics, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_analytics')
        .insert([analytics]);
      
      if (error) {
        throw new Error(`Failed to create user analytics: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating user analytics:', error);
      throw error;
    }
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    try {
      // Update user status (assuming we add a status field later)
      const { error } = await supabase
        .from('users')
        .update({ suspended: true, suspension_reason: reason })
        .eq('id', userId);
      
      if (error) {
        throw new Error(`Failed to suspend user: ${error.message}`);
      }
      
      await this.logAdminAction('suspend_user', { user_id: userId, reason });
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  async unsuspendUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ suspended: false, suspension_reason: null })
        .eq('id', userId);
      
      if (error) {
        throw new Error(`Failed to unsuspend user: ${error.message}`);
      }
      
      await this.logAdminAction('unsuspend_user', { user_id: userId });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      throw error;
    }
  }
} 