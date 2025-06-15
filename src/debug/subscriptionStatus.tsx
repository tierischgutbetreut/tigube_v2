import React from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { useSubscription } from '../lib/auth/useSubscription';
import { Crown, Shield, Star, Clock, Users, CheckCircle, XCircle } from 'lucide-react';

export function SubscriptionStatus() {
  const { user, userProfile, loading } = useAuth();
  const {
    subscription,
    subscriptionLoading,
    features,
    hasFeature,
    isBetaUser,
    isPremiumUser,
    isTrialActive,
    isBetaActive,
    daysUntilBetaEnd,
    shouldShowBetaWarning
  } = useSubscription();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Subscription Status</h2>
        <p className="text-gray-600">Du musst angemeldet sein, um den Subscription-Status zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔐 Subscription Status Debug</h2>

      {/* User Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">👤 User Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><strong>ID:</strong> {user.id}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>User Type:</strong> {userProfile?.user_type || 'Unbekannt'}</div>
          <div><strong>Profile Loading:</strong> {loading ? '⏳ Loading...' : '✅ Loaded'}</div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Subscription Details</h3>
        {subscriptionLoading ? (
          <p className="text-blue-600">⏳ Loading subscription...</p>
        ) : subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Plan:</strong> {subscription.plan_type}</div>
            <div><strong>Status:</strong> {subscription.status}</div>
            <div><strong>Trial End:</strong> {subscription.trial_end_date ? new Date(subscription.trial_end_date).toLocaleDateString('de-DE') : 'N/A'}</div>
            <div><strong>Auto Renew:</strong> {subscription.auto_renew ? 'Ja' : 'Nein'}</div>
          </div>
        ) : (
          <p className="text-red-600">❌ Keine Subscription gefunden</p>
        )}
      </div>

      {/* Beta Status */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 Beta Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span><strong>Beta aktiv:</strong> {isBetaActive ? '✅ Ja' : '❌ Nein'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span><strong>Beta User:</strong> {isBetaUser ? '✅ Ja' : '❌ Nein'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span><strong>Trial aktiv:</strong> {isTrialActive ? '✅ Ja' : '❌ Nein'}</span>
          </div>
        </div>
        <div className="mt-2">
          <strong>Tage bis Beta-Ende:</strong> {daysUntilBetaEnd}
          {shouldShowBetaWarning && (
            <span className="ml-2 text-orange-600 font-semibold">⚠️ Warnung anzeigen!</span>
          )}
        </div>
      </div>

      {/* User Status */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">👑 User Status</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span><strong>Premium User:</strong> {isPremiumUser ? '✅ Ja' : '❌ Nein'}</span>
          </div>
        </div>
      </div>

      {/* Feature Matrix */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">🎨 Feature Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(features).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center gap-2">
              {enabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">
                <strong>{feature.replace(/_/g, ' ')}:</strong> 
                {typeof enabled === 'boolean' ? (enabled ? ' ✅' : ' ❌') : ` ${enabled}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Feature Tests */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4">🧪 Quick Feature Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              <strong>Unlimited Contacts:</strong> {hasFeature('unlimited_contacts') ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              <strong>Premium Badge:</strong> {hasFeature('premium_badge') ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              <strong>Ads Free:</strong> {hasFeature('ads_free') ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              <strong>Environment Images:</strong> {hasFeature('environment_images') ? '✅' : '❌'}
            </span>
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <details className="bg-gray-100 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-gray-800">🔍 Raw Subscription Data</summary>
        <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto">
          {JSON.stringify(subscription, null, 2)}
        </pre>
      </details>
    </div>
  );
} 