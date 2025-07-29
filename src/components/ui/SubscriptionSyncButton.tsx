import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { SubscriptionService } from '../../lib/services/subscriptionService';
import Button from './Button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SubscriptionSyncButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showText?: boolean;
  className?: string;
}

export function SubscriptionSyncButton({ 
  size = 'md', 
  variant = 'outline', 
  showText = true,
  className = ''
}: SubscriptionSyncButtonProps) {
  const { user, refreshSubscription } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSync = async () => {
    if (!user?.id || syncing) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      console.log('🔄 Manual subscription sync triggered');
      
      // Call manual sync from SubscriptionService
      const result = await SubscriptionService.manualStripeSync(user.id);
      
      setSyncResult({
        success: result.success,
        message: result.message
      });

      if (result.success) {
        // Also refresh the subscription in AuthContext
        await refreshSubscription?.(true);
        console.log('✅ Manual sync completed successfully');
      } else {
        console.error('❌ Manual sync failed:', result.error);
      }

      // Clear result after 5 seconds
      setTimeout(() => {
        setSyncResult(null);
      }, 5000);

    } catch (error) {
      console.error('❌ Exception during manual sync:', error);
      setSyncResult({
        success: false,
        message: 'Synchronisation fehlgeschlagen'
      });

      setTimeout(() => {
        setSyncResult(null);
      }, 5000);
    } finally {
      setSyncing(false);
    }
  };

  const getIcon = () => {
    if (syncing) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    if (syncResult?.success) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (syncResult && !syncResult.success) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <RefreshCw className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (syncing) return 'Synchronisiere...';
    if (syncResult?.success) return 'Synchronisiert';
    if (syncResult && !syncResult.success) return 'Fehler';
    return 'Premium-Status synchronisieren';
  };

  const getButtonVariant = () => {
    if (syncResult?.success) return 'primary';
    if (syncResult && !syncResult.success) return 'secondary';
    return variant;
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={handleSync}
        disabled={syncing || !user?.id}
        size={size}
        variant={getButtonVariant()}
        className="flex items-center gap-2"
      >
        {getIcon()}
        {showText && (
          <span className="hidden sm:inline">
            {getButtonText()}
          </span>
        )}
      </Button>
      
      {/* Success/Error Message */}
      {syncResult && (
        <div className={`absolute top-full left-0 right-0 mt-2 p-2 rounded-md text-sm z-10 ${
          syncResult.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {syncResult.message}
        </div>
      )}
    </div>
  );
} 