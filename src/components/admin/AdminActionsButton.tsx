import React, { useState } from 'react';
import { Settings, UserX, Crown, ShieldPlus } from 'lucide-react';
import { UserManagementService } from '../../lib/admin/userManagementService';

interface AdminActionsButtonProps {
  userId: string;
  isAdmin: boolean;
  adminRole?: string | null;
  currentAdminId: string;
  onActionComplete: () => void;
}

const AdminActionsButton: React.FC<AdminActionsButtonProps> = ({ 
  userId, 
  isAdmin, 
  adminRole, 
  currentAdminId, 
  onActionComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handlePromoteToAdmin = async (role: 'admin' | 'moderator' | 'support' = 'admin') => {
    try {
      setLoading(true);
      await UserManagementService.promoteToAdmin(userId, currentAdminId, role);
      onActionComplete();
    } catch (error) {
      console.error('Error promoting user to admin:', error);
    } finally {
      setLoading(false);
      setShowRoleSelector(false);
    }
  };

  const handleRemoveAdmin = async () => {
    try {
      setLoading(true);
      await UserManagementService.removeAdminPrivileges(userId, currentAdminId, 'Admin-Rechte entfernt');
      onActionComplete();
    } catch (error) {
      console.error('Error removing admin privileges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <button
        onClick={handleRemoveAdmin}
        disabled={loading}
        className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
        title="Admin-Rechte entfernen"
      >
        <UserX className="h-4 w-4" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowRoleSelector(!showRoleSelector)}
        disabled={loading}
        className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
        title="Zu Admin ernennen"
      >
        <ShieldPlus className="h-4 w-4" />
      </button>

      {/* Modal-Style Dropdown */}
      {showRoleSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25">
          {/* Hintergrund zum Schließen */}
          <div 
            className="absolute inset-0" 
            onClick={() => setShowRoleSelector(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Admin-Rolle zuweisen
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handlePromoteToAdmin('admin')}
                disabled={loading}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3 border border-gray-200 transition-colors disabled:opacity-50"
              >
                <Crown className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="font-medium">Administrator</div>
                  <div className="text-xs text-gray-500">Vollzugriff auf alle Funktionen</div>
                </div>
              </button>
              
              <button
                onClick={() => handlePromoteToAdmin('moderator')}
                disabled={loading}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3 border border-gray-200 transition-colors disabled:opacity-50"
              >
                <Settings className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Moderator</div>
                  <div className="text-xs text-gray-500">Content-Moderation und Benutzerverwaltung</div>
                </div>
              </button>
              
              <button
                onClick={() => handlePromoteToAdmin('support')}
                disabled={loading}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3 border border-gray-200 transition-colors disabled:opacity-50"
              >
                <UserX className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Support</div>
                  <div className="text-xs text-gray-500">Benutzer-Support und grundlegende Verwaltung</div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowRoleSelector(false)}
              className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminActionsButton; 