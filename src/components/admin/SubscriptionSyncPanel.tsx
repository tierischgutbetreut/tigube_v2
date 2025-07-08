import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, CreditCard, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase/client';

interface SubscriptionSyncData {
  supabase_count: number;
  sync_status: string;
}

interface SyncResult {
  success: boolean;
  summary?: {
    total_stripe_subscriptions: number;
    existing_in_supabase: number;
    newly_synced: number;
    errors: number;
    user_not_found: number;
  };
  results?: Array<{
    stripe_subscription_id: string;
    status: string;
    message: string;
    customer_email?: string;
  }>;
  error?: string;
}

export default function SubscriptionSyncPanel() {
  const [syncData, setSyncData] = useState<SubscriptionSyncData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSyncData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get subscription count from Supabase
      const { count: supabaseCount, error: countError } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true });

      if (countError) throw countError;

      setSyncData({
        supabase_count: supabaseCount || 0,
        sync_status: 'loaded'
      });

    } catch (err) {
      console.error('Error loading sync data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sync data');
    } finally {
      setIsLoading(false);
    }
  };

  const runBulkSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      console.log('🔄 Starting bulk sync via Edge Function...');

             // Call our enhanced sync function with email matching
       const { data, error: functionError } = await supabase.functions.invoke('sync-subscriptions-with-email-matching', {
         body: {}
       });

      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }

      setSyncResult(data);

      if (data.success) {
        // Reload data to show updated counts
        await loadSyncData();
      }

    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin h-6 w-6 text-blue-600 mr-2" />
          <span>Loading subscription data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Subscription Synchronization
              </h3>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={loadSyncData}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={runBulkSync}
                disabled={isSyncing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Bulk Sync'}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    Supabase Subscriptions
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {syncData?.supabase_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Sync Status
                  </p>
                  <p className="text-sm text-gray-600">
                    {syncData?.sync_status || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-4 border-red-200 bg-red-50 border rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sync Results */}
          {syncResult && (
            <div className="mb-6">
              {syncResult.success ? (
                <div className="border-green-200 bg-green-50 border rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-green-800">
                        Sync Completed Successfully
                      </p>
                      {syncResult.summary && (
                        <div className="text-sm text-green-700 mt-1">
                          <p>• Found {syncResult.summary.total_stripe_subscriptions} Stripe subscriptions</p>
                          <p>• {syncResult.summary.existing_in_supabase} already in Supabase</p>
                          <p>• {syncResult.summary.newly_synced} newly synced</p>
                          <p>• {syncResult.summary.user_not_found} users not found</p>
                          {syncResult.summary.errors > 0 && (
                            <p className="text-red-700">• {syncResult.summary.errors} errors occurred</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-red-200 bg-red-50 border rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-red-800">Sync Failed</p>
                      <p className="text-sm text-red-700">{syncResult.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync Details */}
          {syncResult?.results && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Detailed Sync Results
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {syncResult.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center">
                        {result.status === 'synced' && (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                        )}
                        {result.status === 'user_not_found' && (
                          <AlertCircle className="h-3 w-3 text-yellow-500 mr-1 flex-shrink-0" />
                        )}
                        {result.status === 'error' && (
                          <AlertCircle className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" />
                        )}
                        <span className="font-mono">
                          {result.stripe_subscription_id.substring(0, 20)}...
                        </span>
                        {result.customer_email && (
                          <span className="ml-2 text-gray-600">
                            ({result.customer_email})
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium
                        ${result.status === 'synced' ? 'bg-green-100 text-green-800' : ''}
                        ${result.status === 'user_not_found' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${result.status === 'error' ? 'bg-red-100 text-red-800' : ''}
                        ${result.status === 'already_exists' ? 'bg-blue-100 text-blue-800' : ''}
                      `}>
                        {result.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Diese Funktion synchronisiert alle aktiven Stripe-Subscriptions mit Supabase. 
              Subscriptions können nur synchronisiert werden, wenn der entsprechende User-Account in Supabase existiert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 