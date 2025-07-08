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
  RefreshCw
} from 'lucide-react';
import { UserManagementService } from '../../lib/admin/userManagementService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface UserSearchFilters {
  searchTerm?: string;
  userType?: string;
  subscriptionStatus?: string;
  location?: string;
  registrationDateFrom?: string;
  registrationDateTo?: string;
}

interface UserManagementPanelProps {
  currentAdminId: string;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ currentAdminId }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserSearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const pageSize = 25;

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // For now, mock data since the backend functions aren't implemented yet
      const mockUsers = [
        {
          id: '1',
          email: 'caretaker@mail.com',
          first_name: 'Max',
          last_name: 'Mustermann',
          user_type: 'caretaker',
          city: 'Berlin',
          created_at: '2025-01-01T00:00:00Z',
          profile_completed: true,
          subscription_status: 'active',
          subscription_plan: 'premium',
          last_activity: '2025-02-01T10:00:00Z'
        },
        {
          id: '2',
          email: 'owner@example.com',
          first_name: 'Anna',
          last_name: 'Beispiel',
          user_type: 'owner',
          city: 'München',
          created_at: '2025-01-15T00:00:00Z',
          profile_completed: true,
          subscription_status: 'none',
          subscription_plan: null,
          last_activity: '2025-01-30T15:30:00Z'
        }
      ];
      
      setUsers(mockUsers);
      setTotalUsers(mockUsers.length);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleViewUser = async (userId: string) => {
    try {
      // Mock user details
      const mockUserDetails = {
        user_info: {
          id: userId,
          email: 'caretaker@mail.com',
          first_name: 'Max',
          last_name: 'Mustermann',
          phone_number: '+49 123 456789',
          city: 'Berlin',
          plz: '10115',
          created_at: '2025-01-01T00:00:00Z'
        },
        subscription_info: {
          plan_type: 'premium',
          status: 'active',
          current_period_end: '2025-03-01T00:00:00Z'
        },
        caretaker_profile: {
          hourly_rate: 25,
          rating: 4.8,
          review_count: 42,
          is_verified: true,
          experience_years: 5
        },
        recent_activity: [
          {
            type: 'message_sent',
            timestamp: '2025-02-01T10:00:00Z'
          }
        ],
        support_tickets: [],
        admin_notes: []
      };
      setSelectedUser(mockUserDetails);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const getBadge = (variant: string, children: React.ReactNode) => {
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
      secondary: 'bg-gray-100 text-gray-800 border-gray-200',
      primary: 'bg-blue-100 text-blue-800 border-blue-200',
      outline: 'bg-white text-gray-700 border-gray-300'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${variants[variant as keyof typeof variants] || variants.secondary}`}>
        {children}
      </span>
    );
  };

  const getStatusBadge = (user: any) => {
    if (user.subscription_status === 'active') {
      return getBadge('success', 'Aktiv');
    } else if (user.subscription_status === 'trial') {
      return getBadge('warning', 'Trial');
    } else {
      return getBadge('secondary', 'Kostenlos');
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'caretaker':
        return getBadge('primary', 'Betreuer');
      case 'owner':
        return getBadge('secondary', 'Besitzer');
      default:
        return getBadge('outline', 'Unbekannt');
    }
  };

  const getActivityStatus = (lastActivity: string) => {
    const now = new Date();
    const lastActiveDate = new Date(lastActivity);
    const daysDiff = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      return { status: 'online', text: 'Heute aktiv', color: 'text-green-600' };
    } else if (daysDiff <= 7) {
      return { status: 'recent', text: `Vor ${daysDiff} Tagen`, color: 'text-yellow-600' };
    } else if (daysDiff <= 30) {
      return { status: 'inactive', text: `Vor ${daysDiff} Tagen`, color: 'text-orange-600' };
    } else {
      return { status: 'dormant', text: `Vor ${daysDiff} Tagen`, color: 'text-red-600' };
    }
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Benutzerverwaltung</h2>
          <p className="text-gray-600">
            {totalUsers} Benutzer • {users.filter(u => u.subscription_status === 'active').length} aktive Abonnements
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button
            onClick={loadUsers}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nach E-Mail, Name, Stadt suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <LoadingSpinner className="h-4 w-4" /> : 'Suchen'}
        </button>
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Benutzertyp
              </label>
              <select
                value={filters.userType || ''}
                onChange={(e) => setFilters({ ...filters, userType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle Typen</option>
                <option value="owner">Besitzer</option>
                <option value="caretaker">Betreuer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abonnement-Status
              </label>
              <select
                value={filters.subscriptionStatus || ''}
                onChange={(e) => setFilters({ ...filters, subscriptionStatus: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="trial">Trial</option>
                <option value="none">Kostenlos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Standort
              </label>
              <input
                type="text"
                placeholder="Stadt oder PLZ"
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setFilters({});
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedUsers.size} Benutzer ausgewählt
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Nachricht senden
              </button>
              <button className="px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(users.map(u => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                    checked={selectedUsers.size === users.length && users.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
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
                  Letzte Aktivität
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const activity = getActivityStatus(user.last_activity);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.first_name ? user.first_name[0] : user.email[0]}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.city && (
                            <div className="text-xs text-gray-400">{user.city}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getUserTypeBadge(user.user_type)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {getStatusBadge(user)}
                        {user.profile_completed && (
                          <div className="flex items-center text-xs text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Profil vollständig
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs ${activity.color}`}>
                        {activity.text}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Zeige {((currentPage - 1) * pageSize) + 1} bis {Math.min(currentPage * pageSize, totalUsers)} von {totalUsers} Benutzern
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <span className="text-sm text-gray-500">
                Seite {currentPage} von {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          adminService={adminService}
        />
      )}
    </div>
  );
};

// User Details Modal Component
interface UserDetailsModalProps {
  user: any;
  onClose: () => void;
  adminService: AdminService;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Eye },
    { id: 'activity', label: 'Aktivität', icon: Clock },
    { id: 'support', label: 'Support', icon: MessageSquare },
    { id: 'notes', label: 'Notizen', icon: UserPlus },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.user_info?.first_name} {user.user_info?.last_name}
            </h3>
            <p className="text-sm text-gray-500">{user.user_info?.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Benutzerdaten</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">E-Mail</dt>
                      <dd className="text-sm text-gray-900">{user.user_info?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Telefon</dt>
                      <dd className="text-sm text-gray-900">{user.user_info?.phone_number || 'Nicht angegeben'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Standort</dt>
                      <dd className="text-sm text-gray-900">
                        {user.user_info?.city ? `${user.user_info.city}, ${user.user_info.plz}` : 'Nicht angegeben'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Registriert</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(user.user_info?.created_at).toLocaleDateString('de-DE')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Abonnement</h4>
                  {user.subscription_info ? (
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">Plan</dt>
                        <dd className="text-sm text-gray-900">{user.subscription_info.plan_type}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900">{user.subscription_info.status}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Läuft ab</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(user.subscription_info.current_period_end).toLocaleDateString('de-DE')}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-gray-500">Kein aktives Abonnement</p>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              {user.caretaker_profile && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Betreuer-Profil</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm text-gray-500">Stundensatz</dt>
                        <dd className="text-sm text-gray-900">{user.caretaker_profile.hourly_rate}€/Stunde</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Bewertung</dt>
                        <dd className="text-sm text-gray-900">
                          {user.caretaker_profile.rating}/5 ({user.caretaker_profile.review_count} Bewertungen)
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Verifiziert</dt>
                        <dd className="text-sm text-gray-900">
                          {user.caretaker_profile.is_verified ? 'Ja' : 'Nein'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Erfahrung</dt>
                        <dd className="text-sm text-gray-900">{user.caretaker_profile.experience_years} Jahre</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Letzte Aktivitäten</h4>
              {user.recent_activity?.length > 0 ? (
                <div className="space-y-3">
                  {user.recent_activity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-900">{activity.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString('de-DE')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Keine Aktivitäten gefunden</p>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Support-Tickets</h4>
              <p className="text-sm text-gray-500">Keine Support-Tickets gefunden</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Admin-Notizen</h4>
              <p className="text-sm text-gray-500">Keine Notizen vorhanden</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Schließen
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Bearbeiten
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPanel; 