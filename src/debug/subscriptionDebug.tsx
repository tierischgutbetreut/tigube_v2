import React, { useState } from 'react';
import { SubscriptionService } from '../lib/services/subscriptionService';

interface DebugResult {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export function SubscriptionDebug() {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (type: DebugResult['type'], message: string) => {
    const result: DebugResult = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev.slice(0, 9)]); // Keep only last 10 results
  };

  const handleCreateMissingTrials = async () => {
    setLoading(true);
    addResult('info', 'Creating missing trial subscriptions...');
    
    try {
      const result = await SubscriptionService.createMissingTrialSubscriptions();
      addResult('success', 
        `✅ ${result.message} - Created: ${result.created}, Errors: ${result.errors}`
      );
    } catch (error) {
      addResult('error', `❌ Failed to create trial subscriptions: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetBetaStats = async () => {
    setLoading(true);
    addResult('info', 'Fetching beta statistics...');
    
    try {
      const stats = await SubscriptionService.getBetaStats();
      addResult('success', 
        `📊 Beta Stats - Total: ${stats.totalUsers}, Active: ${stats.activeUsers}, Days: ${stats.daysRemaining}`
      );
    } catch (error) {
      addResult('error', `❌ Failed to fetch beta stats: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBetaStatus = () => {
    const isActive = SubscriptionService.isBetaActive();
    const daysLeft = SubscriptionService.getDaysUntilBetaEnd();
    const showWarning = SubscriptionService.shouldShowBetaWarning();
    
    addResult('info', 
      `🕒 Beta Status - Active: ${isActive}, Days Left: ${daysLeft}, Show Warning: ${showWarning}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Subscription Debug Tool</h2>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleCreateMissingTrials}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? '⏳ Loading...' : '🎯 Create Missing Trials'}
        </button>
        
        <button
          onClick={handleGetBetaStats}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? '⏳ Loading...' : '📊 Get Beta Stats'}
        </button>
        
        <button
          onClick={handleCheckBetaStatus}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          🕒 Check Beta Status
        </button>
      </div>

      {/* Results Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Debug Results</h3>
        
        {results.length === 0 ? (
          <p className="text-gray-500 italic">No results yet. Click a button above to start debugging.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.type === 'success' 
                    ? 'bg-green-50 border-green-400 text-green-800'
                    : result.type === 'error'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-blue-50 border-blue-400 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-sm">{result.message}</span>
                  <span className="text-xs opacity-70">{result.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Debug Info</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li><strong>Create Missing Trials:</strong> Erstellt Trial-Subscriptions für User ohne Subscription</li>
          <li><strong>Get Beta Stats:</strong> Zeigt aktuelle Beta-Statistiken (User-Anzahl, aktive User)</li>
          <li><strong>Check Beta Status:</strong> Überprüft ob Beta noch aktiv ist und zeigt verbleibende Tage</li>
        </ul>
      </div>
    </div>
  );
} 