import { useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../auth/AuthContext';

export function useRealTimeSubscription() {
  const { user, refreshSubscription } = useAuth();

  const handleSubscriptionChange = useCallback((payload: any) => {
    console.log('🔄 Real-time subscription change detected:', payload);
    
    // Refresh subscription data immediately
    if (refreshSubscription) {
      refreshSubscription();
    }
  }, [refreshSubscription]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🎯 Setting up real-time subscription listener for user:', user.id);

    // Subscribe to subscription changes for the current user
    const subscription = supabase
      .channel(`subscription_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Subscription table change:', payload);
          handleSubscriptionChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 User table change (subscription related):', payload);
          // Check if subscription-related fields changed
          const { new: newUser, old: oldUser } = payload;
          const subscriptionFields = ['premium_badge', 'show_ads', 'search_priority', 'max_contact_requests', 'max_bookings'];
          
          const hasSubscriptionChange = subscriptionFields.some(field => 
            newUser[field] !== oldUser[field]
          );
          
          if (hasSubscriptionChange) {
            console.log('🔄 Subscription-related user fields changed, refreshing...');
            handleSubscriptionChange(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscription listener');
      subscription.unsubscribe();
    };
  }, [user?.id, handleSubscriptionChange]);
} 