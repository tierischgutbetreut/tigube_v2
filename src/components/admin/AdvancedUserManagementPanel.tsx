import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Shield, 
  ShieldOff, 
  UserPlus, 
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Download,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Star,
  StarOff,
  Ban,
  FileText,
  Settings,
  Trash2,
  Edit3,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Activity,
  TrendingUp,
  DollarSign,
  BadgeCheck
} from 'lucide-react';
import { UserManagementService, UserManagementStats, DetailedUserInfo } from '../../lib/admin/userManagementService';
import { UserSearchFilters, UserSearchResult } from '../../lib/supabase/adminClient';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import AdminActionsButton from './AdminActionsButton';

interface AdvancedUserManagementPanelProps {
  currentAdminId: string;
}

const AdvancedUserManagementPanel: React.FC<AdvancedUserManagementPanelProps> = ({ 
  currentAdminId 
}) => {
  const [stats, setStats] = useState<UserManagementStats | null>(null);
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DetailedUserInfo | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserSearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState<{
    type: 'suspend' | 'delete' | 'verify' | 'note' | null;
    userId: string | null;
  }>({ type: null, userId: null });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchUsers();
  }, [currentPage, filters, searchTerm]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsData] = await Promise.all([
        UserManagementService.getUserManagementStats()
      ]);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      const searchFilters = {
        ...filters,
        searchTerm: searchTerm || undefined
      };
      
      const result = await UserManagementService.searchUsers(
        searchFilters, 
        currentPage, 
        pageSize
      );
      setSearchResult(result);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserAction = async (
    action: 'suspend' | 'unsuspend' | 'delete' | 'verify' | 'unverify',
    userId: string,
    reason?: string
  ) => {
    try {
      setActionLoading(action);
      
      switch (action) {
        case 'suspend':
          if (reason) {
            await UserManagementService.suspendUser(userId, reason, currentAdminId);
          }
          break;
        case 'unsuspend':
          await UserManagementService.unsuspendUser(userId, currentAdminId);
          break;
        case 'delete':
          if (reason) {
            await UserManagementService.deleteUser(userId, currentAdminId, reason);
          }
          break;
        case 'verify':
          await UserManagementService.verifyCaretaker(userId, currentAdminId);
          break;
        case 'unverify':
          if (reason) {
            await UserManagementService.unverifyCaretaker(userId, currentAdminId, reason);
          }
          break;
      }
      
      // Refresh data
      await searchUsers();
      if (selectedUser && selectedUser.user_info.id === userId) {
        await loadUserDetails(userId);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(null);
      setShowActionModal({ type: null, userId: null });
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const userDetails = await UserManagementService.getUserDetails(userId);
      setSelectedUser(userDetails);
      setShowUserDetails(true);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };



  const getStatusBadge = (user: any) => {
    if (user.is_suspended) {
      return <Badge variant="danger">Gesperrt</Badge>;
    }
    
    switch (user.subscription_status) {
      case 'active':
        return <Badge variant="success">Premium</Badge>;
      case 'trial':
        return <Badge variant="warning">Trial</Badge>;
      default:
        return <Badge variant="secondary">Kostenlos</Badge>;
    }
  };

  const getUserTypeBadge = (userType: string, isAdmin?: boolean, adminRole?: string) => {
    if (isAdmin) {
      const roleText = adminRole === 'super_admin' ? 'Super Admin' : 
                      adminRole === 'admin' ? 'Administrator' : 
                      adminRole === 'moderator' ? 'Moderator' : 
                      adminRole === 'support' ? 'Support' : 'Admin';
      return <Badge variant="danger">{roleText}</Badge>;
    }
    
    switch (userType) {
      case 'caretaker':
        return <Badge variant="primary">Betreuer</Badge>;
      case 'owner':
        return <Badge variant="outline">Besitzer</Badge>;
      default:
        return <Badge variant="secondary">Unbekannt</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt Benutzer</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.new_users_this_month} diesen Monat
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive Nutzer</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_users_today}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {stats.active_users_this_week} diese Woche
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verifizierte Betreuer</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified_caretakers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.unverified_caretakers} unverifiziert
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Premium Abos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.premium_subscribers}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <CreditCard className="h-3 w-3 mr-1" />
              {stats.trial_users} im Trial
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Name, E-Mail oder Stadt suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                  showFilters ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
              
              <button
                onClick={searchUsers}
                disabled={searchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${searchLoading ? 'animate-spin' : ''}`} />
                Aktualisieren
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benutzertyp
                  </label>
                  <select
                    value={filters.userType || ''}
                    onChange={(e) => setFilters({ ...filters, userType: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Alle</option>
                    <option value="owner">Besitzer</option>
                    <option value="caretaker">Betreuer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abo-Status
                  </label>
                  <select
                    value={filters.subscriptionStatus || ''}
                    onChange={(e) => setFilters({ ...filters, subscriptionStatus: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Alle</option>
                    <option value="none">Kostenlos</option>
                    <option value="trial">Trial</option>
                    <option value="active">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.isSuspended === undefined ? '' : filters.isSuspended.toString()}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      isSuspended: e.target.value === '' ? undefined : e.target.value === 'true'
                    })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Alle</option>
                    <option value="false">Aktiv</option>
                    <option value="true">Gesperrt</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User List */}
        <div className="overflow-x-auto">
          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Benutzer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registriert
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Letzter Login
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResult?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {user.first_name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getUserTypeBadge(user.user_type, user.is_admin, user.admin_role || undefined)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Nie'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => loadUserDetails(user.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Details anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {user.user_type === 'caretaker' && (
                          <button
                            onClick={() => handleUserAction('verify', user.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Verifizieren"
                            disabled={actionLoading === 'verify'}
                          >
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setShowActionModal({ type: 'suspend', userId: user.id })}
                          className="text-yellow-600 hover:text-yellow-800"
                          title={user.is_suspended ? 'Entsperren' : 'Sperren'}
                        >
                          {user.is_suspended ? <Shield className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>

                        <AdminActionsButton
                          userId={user.id}
                          isAdmin={user.is_admin || false}
                          adminRole={user.admin_role}
                          currentAdminId={currentAdminId}
                          onActionComplete={searchUsers}
                        />

                        <button
                          onClick={() => setShowActionModal({ type: 'delete', userId: user.id })}
                          className="text-red-600 hover:text-red-800"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {searchResult && searchResult.total_pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Zeige {((currentPage - 1) * pageSize) + 1} bis{' '}
              {Math.min(currentPage * pageSize, searchResult.total_count)} von{' '}
              {searchResult.total_count} Einträgen
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Vorherige
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(searchResult.total_pages, currentPage + 1))}
                disabled={currentPage === searchResult.total_pages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Nächste
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowUserDetails(false)}
          onAction={handleUserAction}
          currentAdminId={currentAdminId}
          actionLoading={actionLoading}
        />
      )}

      {/* Action Modals */}
      {showActionModal.type && showActionModal.userId && (
        <ActionModal
          type={showActionModal.type}
          userId={showActionModal.userId}
          onConfirm={(reason) => handleUserAction(showActionModal.type!, showActionModal.userId!, reason)}
          onCancel={() => setShowActionModal({ type: null, userId: null })}
          loading={actionLoading !== null}
        />
      )}
    </div>
  );
};

// User Details Modal Component
interface UserDetailsModalProps {
  user: DetailedUserInfo;
  onClose: () => void;
  onAction: (action: string, userId: string, reason?: string) => void;
  currentAdminId: string;
  actionLoading: string | null;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  onClose,
  onAction,
  currentAdminId,
  actionLoading
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'warning' | 'positive'>('general');

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Users },
    { id: 'activity', label: 'Aktivität', icon: Activity },
    { id: 'support', label: 'Support', icon: MessageSquare },
    { id: 'notes', label: 'Notizen', icon: FileText }
  ];

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await UserManagementService.createAdminNote(
        user.user_info.id,
        currentAdminId,
        newNote,
        noteType
      );
      setNewNote('');
      // Refresh user data here
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-600">
                {user.user_info.first_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.user_info.first_name} {user.user_info.last_name}
              </h2>
              <p className="text-gray-500">{user.user_info.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <UserOverviewTab user={user} onAction={onAction} actionLoading={actionLoading} />
          )}
          {activeTab === 'activity' && (
            <UserActivityTab activities={user.recent_activity} />
          )}
          {activeTab === 'support' && (
            <UserSupportTab tickets={user.support_tickets} />
          )}
          {activeTab === 'notes' && (
            <UserNotesTab 
              notes={user.admin_notes} 
              newNote={newNote}
              setNewNote={setNewNote}
              noteType={noteType}
              setNoteType={setNoteType}
              onAddNote={addNote}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const UserOverviewTab: React.FC<{
  user: DetailedUserInfo;
  onAction: (action: string, userId: string, reason?: string) => void;
  actionLoading: string | null;
}> = ({ user, onAction, actionLoading }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Grundinformationen</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.user_info.email}</span>
          </div>
          
          {user.user_info.phone_number && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{user.user_info.phone_number}</span>
            </div>
          )}
          
          {(user.user_info.city || user.user_info.plz) && (
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {user.user_info.plz} {user.user_info.city}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Registriert: {new Date(user.user_info.created_at).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>

        {/* Profile Type Specific Info */}
        {user.caretaker_profile && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Betreuer-Profil</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Stundenlohn:</span>
                <span className="text-sm font-medium">
                  {user.caretaker_profile.hourly_rate ? `€${user.caretaker_profile.hourly_rate}` : 'Nicht angegeben'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bewertung:</span>
                <span className="text-sm font-medium">
                  {user.caretaker_profile.rating.toFixed(1)}/5 ({user.caretaker_profile.review_count} Bewertungen)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Verifiziert:</span>
                <span className={`text-sm font-medium ${user.caretaker_profile.is_verified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.caretaker_profile.is_verified ? 'Ja' : 'Nein'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription & Actions */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Abonnement</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={user.subscription_info.status === 'active' ? 'success' : 'secondary'}>
                {user.subscription_info.status === 'active' ? 'Premium' : 'Kostenlos'}
              </Badge>
            </div>
            {user.subscription_info.plan_type && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Plan:</span>
                <span className="text-sm font-medium">{user.subscription_info.plan_type}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Aktionen</h3>
          <div className="space-y-2">
            {user.user_info.user_type === 'caretaker' && (
              <button
                onClick={() => onAction(
                  user.caretaker_profile?.is_verified ? 'unverify' : 'verify',
                  user.user_info.id
                )}
                disabled={actionLoading !== null}
                className={`w-full flex items-center justify-center px-4 py-2 border rounded-lg ${
                  user.caretaker_profile?.is_verified
                    ? 'border-yellow-200 text-yellow-800 bg-yellow-50'
                    : 'border-green-200 text-green-800 bg-green-50'
                }`}
              >
                {user.caretaker_profile?.is_verified ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                {user.caretaker_profile?.is_verified ? 'Verifizierung entfernen' : 'Verifizieren'}
              </button>
            )}
            
            <button
              onClick={() => onAction(
                user.user_info.is_suspended ? 'unsuspend' : 'suspend',
                user.user_info.id
              )}
              disabled={actionLoading !== null}
              className={`w-full flex items-center justify-center px-4 py-2 border rounded-lg ${
                user.user_info.is_suspended
                  ? 'border-green-200 text-green-800 bg-green-50'
                  : 'border-yellow-200 text-yellow-800 bg-yellow-50'
              }`}
            >
              {user.user_info.is_suspended ? <Shield className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              {user.user_info.is_suspended ? 'Entsperren' : 'Sperren'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Tab Component
const UserActivityTab: React.FC<{
  activities: any[];
}> = ({ activities }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Letzte Aktivitäten</h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Keine Aktivitäten verfügbar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.activity_type}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(activity.created_at).toLocaleString('de-DE')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Support Tab Component
const UserSupportTab: React.FC<{
  tickets: any[];
}> = ({ tickets }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Support Tickets</h3>
      
      {tickets.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Keine Support Tickets vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                <Badge variant={ticket.status === 'open' ? 'danger' : 'success'}>
                  {ticket.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
              <p className="text-xs text-gray-400">
                Erstellt: {new Date(ticket.created_at).toLocaleString('de-DE')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Notes Tab Component
const UserNotesTab: React.FC<{
  notes: any[];
  newNote: string;
  setNewNote: (note: string) => void;
  noteType: 'general' | 'warning' | 'positive';
  setNoteType: (type: 'general' | 'warning' | 'positive') => void;
  onAddNote: () => void;
}> = ({ notes, newNote, setNewNote, noteType, setNoteType, onAddNote }) => {
  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Neue Notiz hinzufügen</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as any)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="general">Allgemein</option>
              <option value="warning">Warnung</option>
              <option value="positive">Positiv</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Notiz eingeben..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
          <button
            onClick={onAddNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Notiz hinzufügen
          </button>
        </div>
      </div>

      {/* Existing Notes */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Vorhandene Notizen</h4>
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Notizen vorhanden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      note.note_type === 'warning' ? 'danger' :
                      note.note_type === 'positive' ? 'success' : 'secondary'
                    }>
                      {note.note_type}
                    </Badge>
                    <span className="text-sm text-gray-600">von {note.admin_name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(note.created_at).toLocaleString('de-DE')}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{note.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Action Modal Component
interface ActionModalProps {
  type: 'suspend' | 'delete' | 'verify' | 'note';
  userId: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const ActionModal: React.FC<ActionModalProps> = ({
  type,
  userId,
  onConfirm,
  onCancel,
  loading
}) => {
  const [reason, setReason] = useState('');

  const getModalConfig = () => {
    switch (type) {
      case 'suspend':
        return {
          title: 'Benutzer sperren',
          description: 'Möchten Sie diesen Benutzer wirklich sperren? Bitte geben Sie einen Grund an.',
          confirmText: 'Sperren',
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700',
          requiresReason: true
        };
      case 'delete':
        return {
          title: 'Benutzer löschen',
          description: 'Möchten Sie diesen Benutzer PERMANENT löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
          confirmText: 'Löschen',
          confirmClass: 'bg-red-600 hover:bg-red-700',
          requiresReason: true
        };
      default:
        return {
          title: 'Aktion bestätigen',
          description: 'Möchten Sie diese Aktion ausführen?',
          confirmText: 'Bestätigen',
          confirmClass: 'bg-blue-600 hover:bg-blue-700',
          requiresReason: false
        };
    }
  };

  const config = getModalConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{config.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{config.description}</p>
          
          {config.requiresReason && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grund (erforderlich)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Grund für die Aktion eingeben..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onConfirm(config.requiresReason ? reason : undefined)}
              disabled={loading || (config.requiresReason && !reason.trim())}
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${config.confirmClass}`}
            >
              {loading ? 'Wird ausgeführt...' : config.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedUserManagementPanel; 