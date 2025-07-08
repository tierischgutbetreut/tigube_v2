import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  MessageSquare,
  User,
  Image,
  Star,
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Ban,
  Trash2,
  FileText,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { 
  ContentModerationService, 
  ContentModerationStats, 
  ReportedContentDetails,
  ModerationFilters,
  ModerationSearchResult 
} from '../../lib/admin/contentModerationService';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';

interface ContentModerationPanelProps {
  currentAdminId: string;
}

const ContentModerationPanel: React.FC<ContentModerationPanelProps> = ({ 
  currentAdminId 
}) => {
  const [stats, setStats] = useState<ContentModerationStats | null>(null);
  const [searchResult, setSearchResult] = useState<ModerationSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportedContentDetails | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter states
  const [filters, setFilters] = useState<ModerationFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState<{
    type: 'dismiss' | 'warn_user' | 'suspend_user' | 'delete_content' | 'escalate' | null;
    reportId: string | null;
  }>({ type: null, reportId: null });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchReports();
  }, [currentPage, filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsData] = await Promise.all([
        ContentModerationService.getModerationStats()
      ]);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchReports = async () => {
    try {
      setSearchLoading(true);
      const result = await ContentModerationService.searchReportedContent(
        filters, 
        currentPage, 
        pageSize
      );
      setSearchResult(result);
    } catch (error) {
      console.error('Error searching reports:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleReportAction = async (
    action: 'dismiss' | 'warn_user' | 'suspend_user' | 'delete_content' | 'escalate',
    reportId: string,
    reason: string,
    notes?: string
  ) => {
    try {
      setActionLoading(action);
      
      await ContentModerationService.resolveReport(
        reportId,
        currentAdminId,
        action,
        reason,
        notes
      );
      
      // Refresh data
      await searchReports();
      if (selectedReport && selectedReport.id === reportId) {
        const updatedReport = await ContentModerationService.getReportDetails(reportId);
        setSelectedReport(updatedReport);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(null);
      setShowActionModal({ type: null, reportId: null });
    }
  };

  const loadReportDetails = async (reportId: string) => {
    try {
      const reportDetails = await ContentModerationService.getReportDetails(reportId);
      setSelectedReport(reportDetails);
      setShowReportDetails(true);
    } catch (error) {
      console.error('Error loading report details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Ausstehend</Badge>;
      case 'reviewed':
        return <Badge variant="primary">Überprüft</Badge>;
      case 'resolved':
        return <Badge variant="success">Gelöst</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'profile':
        return <User className="h-4 w-4" />;
      case 'review':
        return <Star className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (reason: string) => {
    const highPriorityReasons = ['harassment', 'spam', 'inappropriate_content'];
    const mediumPriorityReasons = ['misleading', 'off_topic'];
    
    if (highPriorityReasons.some(r => reason.toLowerCase().includes(r))) {
      return <Badge variant="danger">Hoch</Badge>;
    } else if (mediumPriorityReasons.some(r => reason.toLowerCase().includes(r))) {
      return <Badge variant="warning">Mittel</Badge>;
    }
    return <Badge variant="secondary">Niedrig</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
                <p className="text-sm font-medium text-gray-600">Ausstehende Meldungen</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending_reports}</p>
              </div>
              <Flag className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.reports_today} heute
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelöste Meldungen</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved_reports}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              Ø {stats.average_resolution_time.toFixed(1)}h Bearbeitungszeit
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diese Woche</p>
                <p className="text-2xl font-bold text-blue-600">{stats.reports_this_week}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Haupttyp: {stats.most_reported_content_type}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive Moderatoren</p>
                <p className="text-2xl font-bold text-purple-600">{stats.active_moderators}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <XCircle className="h-3 w-3 mr-1" />
              {stats.dismissed_reports} abgelehnt
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Nach Grund oder Benutzer suchen..."
                  value={filters.reason || ''}
                  onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
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
                onClick={searchReports}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Alle</option>
                    <option value="pending">Ausstehend</option>
                    <option value="reviewed">Überprüft</option>
                    <option value="resolved">Gelöst</option>
                    <option value="dismissed">Abgelehnt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inhaltstyp
                  </label>
                  <select
                    value={filters.contentType || ''}
                    onChange={(e) => setFilters({ ...filters, contentType: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Alle</option>
                    <option value="message">Nachrichten</option>
                    <option value="profile">Profile</option>
                    <option value="review">Bewertungen</option>
                    <option value="image">Bilder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Von Datum
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bis Datum
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reports List */}
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
                    Meldung
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gemeldeter Benutzer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorität
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gemeldet am
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResult?.reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getContentTypeIcon(report.content_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.reason}</p>
                          {report.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {report.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {report.reported_user_info.first_name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {report.reported_user_info.first_name} {report.reported_user_info.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{report.reported_user_info.user_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {report.content_type === 'message' ? 'Nachricht' :
                         report.content_type === 'profile' ? 'Profil' :
                         report.content_type === 'review' ? 'Bewertung' :
                         report.content_type === 'image' ? 'Bild' : report.content_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-4 py-3">
                      {getPriorityBadge(report.reason)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => loadReportDetails(report.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Details anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setShowActionModal({ type: 'dismiss', reportId: report.id })}
                              className="text-gray-600 hover:text-gray-800"
                              title="Ablehnen"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => setShowActionModal({ type: 'warn_user', reportId: report.id })}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Benutzer warnen"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => setShowActionModal({ type: 'suspend_user', reportId: report.id })}
                              className="text-red-600 hover:text-red-800"
                              title="Benutzer sperren"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => setShowActionModal({ type: 'delete_content', reportId: report.id })}
                              className="text-red-800 hover:text-red-900"
                              title="Inhalt löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
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

      {/* Report Details Modal */}
      {showReportDetails && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setShowReportDetails(false)}
          onAction={(action, reason, notes) => handleReportAction(action, selectedReport.id, reason, notes)}
          actionLoading={actionLoading}
        />
      )}

      {/* Action Modals */}
      {showActionModal.type && showActionModal.reportId && (
        <ModerationActionModal
          type={showActionModal.type}
          reportId={showActionModal.reportId}
          onConfirm={(reason, notes) => handleReportAction(showActionModal.type!, showActionModal.reportId!, reason, notes)}
          onCancel={() => setShowActionModal({ type: null, reportId: null })}
          loading={actionLoading !== null}
        />
      )}
    </div>
  );
};

// Report Details Modal Component
interface ReportDetailsModalProps {
  report: ReportedContentDetails;
  onClose: () => void;
  onAction: (action: string, reason: string, notes?: string) => void;
  actionLoading: string | null;
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  report,
  onClose,
  onAction,
  actionLoading
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Eye },
    { id: 'content', label: 'Inhalt', icon: FileText },
    { id: 'history', label: 'Verlauf', icon: Clock }
  ];

  const renderContentPreview = () => {
    if (!report.content_details) {
      return <p className="text-gray-500">Inhalt nicht verfügbar</p>;
    }

    switch (report.content_type) {
      case 'message':
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800">{report.content_details.content}</p>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <span className="font-medium">Über mich:</span>
              <p className="text-sm text-gray-800 mt-1">{report.content_details.about_me || 'Nicht verfügbar'}</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(report.content_details, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <Flag className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Meldung Details</h2>
              <p className="text-gray-500">ID: {report.id}</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Meldung</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Grund:</span>
                    <p className="text-sm text-gray-800">{report.reason}</p>
                  </div>
                  
                  {report.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Beschreibung:</span>
                      <p className="text-sm text-gray-800">{report.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <div className="mt-1">
                      {report.status === 'pending' ? (
                        <Badge variant="warning">Ausstehend</Badge>
                      ) : report.status === 'resolved' ? (
                        <Badge variant="success">Gelöst</Badge>
                      ) : (
                        <Badge variant="secondary">Abgelehnt</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Gemeldet am:</span>
                    <p className="text-sm text-gray-800">
                      {new Date(report.created_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Beteiligte Benutzer</h3>
                
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Gemeldeter Benutzer</h4>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-red-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-red-800">
                          {report.reported_user_info.first_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          {report.reported_user_info.first_name} {report.reported_user_info.last_name}
                        </p>
                        <p className="text-sm text-red-700">{report.reported_user_info.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Meldender Benutzer</h4>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-800">
                          {report.reporter_info.first_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {report.reporter_info.first_name} {report.reporter_info.last_name}
                        </p>
                        <p className="text-sm text-blue-700">{report.reporter_info.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Gemeldeter Inhalt</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Typ:</span>
                  <Badge variant="outline">
                    {report.content_type === 'message' ? 'Nachricht' :
                     report.content_type === 'profile' ? 'Profil' :
                     report.content_type === 'review' ? 'Bewertung' : report.content_type}
                  </Badge>
                </div>
                <div className="mt-4">
                  {renderContentPreview()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Bearbeitungsverlauf</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Meldung erstellt</p>
                    <p className="text-sm text-gray-600">
                      Von {report.reporter_info.first_name} {report.reporter_info.last_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(report.created_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                </div>
                
                {report.reviewed_at && (
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Meldung überprüft</p>
                      {report.reviewer_info && (
                        <p className="text-sm text-gray-600">
                          Von {report.reviewer_info.first_name} {report.reviewer_info.last_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(report.reviewed_at).toLocaleString('de-DE')}
                      </p>
                      {report.resolution_note && (
                        <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                          {report.resolution_note}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {report.status === 'pending' && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAction('dismiss', 'Nach Überprüfung als unbegründet eingestuft')}
                disabled={actionLoading !== null}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Ablehnen
              </button>
              <button
                onClick={() => onAction('warn_user', 'Verwarnung aufgrund gemeldeten Verhaltens')}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                Benutzer warnen
              </button>
              <button
                onClick={() => onAction('suspend_user', 'Sperrung aufgrund Verstoß gegen Community-Richtlinien')}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Benutzer sperren
              </button>
              <button
                onClick={() => onAction('delete_content', 'Inhalt entfernt wegen Verstoß gegen Richtlinien')}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50"
              >
                Inhalt löschen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Moderation Action Modal Component
interface ModerationActionModalProps {
  type: 'dismiss' | 'warn_user' | 'suspend_user' | 'delete_content' | 'escalate';
  reportId: string;
  onConfirm: (reason: string, notes?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const ModerationActionModal: React.FC<ModerationActionModalProps> = ({
  type,
  reportId,
  onConfirm,
  onCancel,
  loading
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const getModalConfig = () => {
    switch (type) {
      case 'dismiss':
        return {
          title: 'Meldung ablehnen',
          description: 'Möchten Sie diese Meldung als unbegründet ablehnen?',
          confirmText: 'Ablehnen',
          confirmClass: 'bg-gray-600 hover:bg-gray-700',
          defaultReason: 'Nach Überprüfung als unbegründet eingestuft'
        };
      case 'warn_user':
        return {
          title: 'Benutzer warnen',
          description: 'Der Benutzer erhält eine Warnung. Bitte geben Sie einen Grund an.',
          confirmText: 'Warnung senden',
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700',
          defaultReason: 'Verwarnung aufgrund gemeldeten Verhaltens'
        };
      case 'suspend_user':
        return {
          title: 'Benutzer sperren',
          description: 'Der Benutzer wird gesperrt. Diese Aktion kann rückgängig gemacht werden.',
          confirmText: 'Sperren',
          confirmClass: 'bg-red-600 hover:bg-red-700',
          defaultReason: 'Sperrung aufgrund Verstoß gegen Community-Richtlinien'
        };
      case 'delete_content':
        return {
          title: 'Inhalt löschen',
          description: 'Der gemeldete Inhalt wird permanent gelöscht.',
          confirmText: 'Löschen',
          confirmClass: 'bg-red-800 hover:bg-red-900',
          defaultReason: 'Inhalt entfernt wegen Verstoß gegen Richtlinien'
        };
      default:
        return {
          title: 'Aktion bestätigen',
          description: 'Möchten Sie diese Aktion ausführen?',
          confirmText: 'Bestätigen',
          confirmClass: 'bg-blue-600 hover:bg-blue-700',
          defaultReason: 'Moderationsaktion durchgeführt'
        };
    }
  };

  const config = getModalConfig();

  useEffect(() => {
    setReason(config.defaultReason);
  }, [config.defaultReason]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{config.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{config.description}</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grund
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Grund für die Aktion eingeben..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zusätzliche Notizen (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Weitere Details oder interne Notizen..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onConfirm(reason, notes || undefined)}
              disabled={loading || !reason.trim()}
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

export default ContentModerationPanel; 