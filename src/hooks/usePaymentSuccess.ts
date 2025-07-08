import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StripeService } from '../lib/stripe/stripeService';
import { useAuth } from '../lib/auth/AuthContext';

interface PaymentSuccessData {
  isOpen: boolean;
  planType: 'premium' | 'professional';
  userType: 'owner' | 'caretaker';
  sessionData?: {
    amount_total?: number;
    customer_email?: string;
    session_id?: string;
  };
}

export function usePaymentSuccess() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshSubscription } = useAuth();
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccessData>({
    isOpen: false,
    planType: 'premium',
    userType: 'owner'
  });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const checkPaymentSuccess = async () => {
      // Check for payment success parameters in URL
      const sessionId = searchParams.get('session_id');
      const paymentSuccessFlag = searchParams.get('payment_success');
      const planFromUrl = searchParams.get('plan') as 'premium' | 'professional';
      const userTypeFromUrl = searchParams.get('user_type') as 'owner' | 'caretaker';

      if (sessionId || paymentSuccessFlag === 'true') {
        setIsValidating(true);
        
        try {
          let sessionData = null;
          
          if (sessionId) {
            console.log('🔍 Validating Stripe session:', sessionId);
            
            // First, trigger synchronization of the checkout session
            try {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://puvzrdnziuowznetwwey.supabase.co';
              const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-checkout-session`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                  checkout_session_id: sessionId
                })
              });

              if (syncResponse.ok) {
                const syncResult = await syncResponse.json();
                console.log('✅ Checkout session synced:', syncResult);
                
                // Refresh subscription data to update UI with premium features
                try {
                  await refreshSubscription();
                  console.log('✅ Subscription data refreshed after sync');
                } catch (refreshError) {
                  console.warn('⚠️ Failed to refresh subscription data:', refreshError);
                }
              } else {
                console.warn('⚠️ Failed to sync checkout session:', await syncResponse.text());
              }
            } catch (syncError) {
              console.warn('⚠️ Sync error (continuing anyway):', syncError);
            }

                         // Then validate the session data
             const result = await StripeService.validateCheckoutSession(sessionId);
             if (result.success && result.session) {
               sessionData = {
                 amount_total: result.session.amount_total,
                 customer_email: result.session.customer_details?.email,
                 session_id: sessionId
               };
               console.log('✅ Session validation successful:', sessionData);
             } else {
               console.warn('⚠️ Session validation failed:', result.error);
             }
          }

          // Determine plan and user type
          let planType: 'premium' | 'professional' = 'premium';
          let userType: 'owner' | 'caretaker' = 'owner';

          if (planFromUrl && userTypeFromUrl) {
            planType = planFromUrl;
            userType = userTypeFromUrl;
          } else if (sessionData?.amount_total) {
            // Determine from amount
            if (sessionData.amount_total === 490) {
              planType = 'premium';
              userType = 'owner';
            } else if (sessionData.amount_total === 1290) {
              planType = 'professional';
              userType = 'caretaker';
            }
          }

          console.log('🎯 Opening payment success modal:', { planType, userType, sessionData });
          
                     setPaymentSuccess({
             isOpen: true,
             planType,
             userType,
             sessionData: sessionData || undefined
           });

        } catch (error) {
          console.error('❌ Payment success validation error:', error);
          // Still show modal with basic info from URL params
          if (planFromUrl && userTypeFromUrl) {
            setPaymentSuccess({
              isOpen: true,
              planType: planFromUrl,
              userType: userTypeFromUrl
            });
          }
        } finally {
          setIsValidating(false);
        }
      }
    };

    checkPaymentSuccess();
  }, [searchParams]);

  const closeModal = () => {
    console.log('🔐 Closing payment success modal and cleaning URL');
    setPaymentSuccess(prev => ({ ...prev, isOpen: false }));
    
    // Clean up URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('session_id');
    newSearchParams.delete('payment_success');
    newSearchParams.delete('plan');
    newSearchParams.delete('user_type');
    
    setSearchParams(newSearchParams, { replace: true });
  };

  return {
    paymentSuccess,
    isValidating,
    closeModal
  };
} 