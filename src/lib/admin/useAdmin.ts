import { useState, useEffect } from 'react';
import { AdminService, AdminUser, AdminRole } from './adminService';

export const useAdmin = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const isAdminUser = await AdminService.checkAdminAccess();
      
      if (isAdminUser) {
        const currentAdmin = await AdminService.getCurrentAdmin();
        setAdminUser(currentAdmin);
        setIsAdmin(true);
      } else {
        setAdminUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAdminUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    return AdminService.hasPermission(adminUser.admin_role, permission);
  };

  const logAction = async (
    action: string,
    targetTable?: string,
    targetId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    await AdminService.logAction(action, targetTable, targetId, oldValues, newValues);
  };

  return {
    adminUser,
    isAdmin,
    loading,
    hasPermission,
    logAction,
    refreshAdminStatus: checkAdminStatus
  };
};

export const useAdminPermissions = () => {
  const { adminUser, hasPermission } = useAdmin();

  return {
    canViewUsers: hasPermission('users.read'),
    canEditUsers: hasPermission('users.write'),
    canDeleteUsers: hasPermission('users.delete'),
    canViewRevenue: hasPermission('revenue.read'),
    canViewAnalytics: hasPermission('analytics.read'),
    canManageAdvertising: hasPermission('advertising.write'),
    canModerateContent: hasPermission('content.moderate'),
    canViewAuditLogs: hasPermission('audit.read'),
    isSuperAdmin: adminUser?.admin_role === 'super_admin',
    isAdmin: adminUser?.admin_role === 'admin',
    isModerator: adminUser?.admin_role === 'moderator',
    isSupport: adminUser?.admin_role === 'support'
  };
}; 