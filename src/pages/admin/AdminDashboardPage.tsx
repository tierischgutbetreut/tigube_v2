import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import AnalyticsPanel from '../../components/admin/AnalyticsPanel';
import { AdminService, AdminDashboardStats } from '../../lib/admin/adminService';
import { Users, DollarSign, MessageCircle, CreditCard, TrendingUp, Calendar, Database, PieChart } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics'>('dashboard');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await AdminService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Fehler beim Laden der Dashboard-Statistiken');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Dashboard-Daten...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Fehler</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadDashboardStats}
              className="mt-4 btn btn-outline"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const adminService = new AdminService();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">
                Willkommen im tigube Admin-Bereich. Hier finden Sie einen Überblick über die wichtigsten Platform-Metriken.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Übersicht
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Benutzerverwaltung
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Analytics
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Gesamt Nutzer</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.total_users)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex text-sm text-gray-600">
                  <span>{formatNumber(stats.total_owners)} Owner</span>
                  <span className="mx-2">•</span>
                  <span>{formatNumber(stats.total_caretakers)} Betreuer</span>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Gesamt Umsatz</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.total_revenue)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Aus bezahlten Transaktionen
                </p>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Aktive Abos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.active_subscriptions)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Premium & Professional
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageCircle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Nachrichten</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.total_messages)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  In {formatNumber(stats.total_conversations)} Gesprächen
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Users Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Neue Nutzer</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            {stats && (
              <div>
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.users_last_30_days)}
                    </p>
                    <p className="text-sm text-gray-600">in den letzten 30 Tagen</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Das entspricht durchschnittlich{' '}
                    <span className="font-medium">
                      {Math.round(stats.users_last_30_days / 30)} neuen Nutzern pro Tag
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h3>
            <div className="space-y-3">
              <a 
                href="/admin/users"
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Nutzer verwalten</p>
                    <p className="text-sm text-gray-600">Nutzer anzeigen und bearbeiten</p>
                  </div>
                </div>
              </a>
              
              <a 
                href="/admin/revenue"
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Umsatz-Analytics</p>
                    <p className="text-sm text-gray-600">Detaillierte Finanz-Berichte</p>
                  </div>
                </div>
              </a>
              
              <a 
                href="/admin/analytics"
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Platform-Analytics</p>
                    <p className="text-sm text-gray-600">Nutzung und Engagement</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

            {/* Coming Soon */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">Bald verfügbar</h3>
              <p className="text-primary-700 mb-4">
                Diese Features sind in Entwicklung und werden in den nächsten Phasen hinzugefügt:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                  <h4 className="font-medium text-primary-900">Werbe-Management</h4>
                  <p className="text-sm text-primary-700">Kampagnen und Werbeplätze verwalten</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                  <h4 className="font-medium text-primary-900">Content-Moderation</h4>
                  <p className="text-sm text-primary-700">Gemeldete Inhalte bearbeiten</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                  <h4 className="font-medium text-primary-900">Advanced Analytics</h4>
                  <p className="text-sm text-primary-700">Detaillierte Berichte und Exports</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <UserManagementPanel adminService={adminService} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsPanel adminService={adminService} />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage; 