import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { AdminService } from '../../lib/admin/adminService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface UserManagementStats {
  total_users: number;
  active_users_7d: number;
  new_registrations_7d: number;
  pending_support_tickets: number;
  user_type_distribution: Record<string, number>;
  subscription_distribution: Record<string, number>;
  geographic_distribution: Record<string, number>;
}

interface AnalyticsPanelProps {
  adminService: AdminService;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ adminService }) => {
  const [stats, setStats] = useState<UserManagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userStats = await adminService.getUserManagementStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fehler beim Laden der Analytics</p>
      </div>
    );
  }

  const userTypeData = Object.entries(stats.user_type_distribution || {}).map(([type, count]) => ({
    label: type === 'caretaker' ? 'Betreuer' : type === 'owner' ? 'Besitzer' : 'Unbekannt',
    value: Number(count),
    percentage: ((Number(count) / stats.total_users) * 100).toFixed(1)
  }));

  const subscriptionData = Object.entries(stats.subscription_distribution || {}).map(([type, count]) => ({
    label: type === 'premium' ? 'Premium' : type === 'basic' ? 'Basic' : type,
    value: Number(count),
    percentage: stats.total_users > 0 ? ((Number(count) / stats.total_users) * 100).toFixed(1) : '0'
  }));

  const geoData = Object.entries(stats.geographic_distribution || {}).slice(0, 5).map(([city, count]) => ({
    city,
    count: Number(count),
    percentage: stats.total_users > 0 ? ((Number(count) / stats.total_users) * 100).toFixed(1) : '0'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics & Insights</h2>
          <p className="text-gray-600">Detaillierte Benutzerstatistiken und Trends</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
            <option value="1y">Letztes Jahr</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
          >
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Gesamt Benutzer"
          value={stats.total_users}
          change={stats.new_registrations_7d}
          changeText="Neue diese Woche"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Aktive Benutzer"
          value={stats.active_users_7d}
          change={Math.round((stats.active_users_7d / stats.total_users) * 100)}
          changeText="% der Gesamtbenutzer"
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Neue Registrierungen"
          value={stats.new_registrations_7d}
          change={0} // Would need historical data for trend
          changeText="Diese Woche"
          icon={Calendar}
          color="purple"
        />
        <MetricCard
          title="Support-Tickets"
          value={stats.pending_support_tickets}
          change={0} // Would need historical data for trend
          changeText="Offen"
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Type Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Benutzertyp-Verteilung</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {userTypeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Abonnement-Verteilung</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {subscriptionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-purple-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Standorte</h3>
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {geoData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center mr-3">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.city}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.count}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Aktivitäts-Timeline</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Timeline-Daten werden geladen...</p>
              <p className="text-xs">Benötigt historische Datensammlung</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detaillierte Statistiken</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Benutzer-Engagement</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Aktive Benutzer (7 Tage)</span>
                  <span className="font-medium">{stats.active_users_7d}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Engagement-Rate</span>
                  <span className="font-medium">
                    {stats.total_users > 0 ? 
                      Math.round((stats.active_users_7d / stats.total_users) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Wachstum</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neue Registrierungen</span>
                  <span className="font-medium">{stats.new_registrations_7d}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Wachstumsrate</span>
                  <span className="font-medium text-green-600">
                    {stats.total_users > 0 ? 
                      ((stats.new_registrations_7d / stats.total_users) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Support</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Offene Tickets</span>
                  <span className="font-medium">{stats.pending_support_tickets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ticket-Rate</span>
                  <span className="font-medium">
                    {stats.total_users > 0 ? 
                      ((stats.pending_support_tickets / stats.total_users) * 100).toFixed(2) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  changeText: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeText, 
  icon: Icon, 
  color 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    purple: 'bg-purple-500 text-purple-100',
    orange: 'bg-orange-500 text-orange-100'
  };

  const getChangeIcon = () => {
    if (change > 0) return <ArrowUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <ArrowDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value.toLocaleString()}
          </p>
          <div className="flex items-center mt-2">
            {getChangeIcon()}
            <span className="text-sm text-gray-600 ml-1">
              {Math.abs(change)} {changeText}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel; 