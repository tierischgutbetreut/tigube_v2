import { useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../auth/AuthContext';

export function useRealTimeSubscription() {
  const { user, refreshSubscription } = useAuth();

  const handleUserPlanChange = useCallback((payload: any) => {
    console.log('🔄 Real-time user plan change detected:', payload);
    
    // Refresh subscription data immediately
    if (refreshSubscription) {
      refreshSubscription();
    }
  }, [refreshSubscription]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🎯 Setting up real-time user plan listener for user:', user.id);

    // Subscribe nur zu user plan changes (subscription-Daten sind jetzt in users-Tabelle)
    const subscription = supabase
      .channel(`user_plan_realtime_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 User plan change (real-time hook):', payload);
          
          // Check if plan-related fields changed
          const { new: newUser, old: oldUser } = payload;
          const planFields = ['plan_type', 'plan_expires_at', 'premium_badge', 'show_ads', 'max_contact_requests', 'max_bookings', 'search_priority'];
          
          const hasPlanChange = planFields.some(field => 
            newUser[field] !== oldUser[field]
          );
          
          if (hasPlanChange) {
            console.log('🔄 Plan fields changed, triggering refresh...');
            handleUserPlanChange(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time user plan subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up real-time user plan subscription');
      subscription.unsubscribe();
    };
  }, [user?.id, handleUserPlanChange]);

  return { 
    // Return useful status if needed
    isListening: !!user?.id 
  };
} 