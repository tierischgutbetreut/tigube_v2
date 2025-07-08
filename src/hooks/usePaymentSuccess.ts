import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StripeService } from '../lib/stripe/stripeService';

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
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccessData>({
    isOpen: false,
    planType: 'premium',
    userType: 'owner'
  });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const checkPaymentSuccess = async () => {
      // Check for payment success indicators in URL
      const sessionId = searchParams.get('session_id');
      const paymentSuccess = searchParams.get('payment_success');
      const planType = searchParams.get('plan') as 'premium' | 'professional' | null;
      const userType = searchParams.get('user_type') as 'owner' | 'caretaker' | null;

      if (!sessionId && !paymentSuccess) {
        return;
      }

      console.log('🎉 Payment success detected:', {
        sessionId,
        paymentSuccess,
        planType,
        userType,
        allParams: Object.fromEntries(searchParams.entries())
      });

      setIsValidating(true);

      try {
        if (sessionId) {
          // Real payment with session ID
          const result = await StripeService.validateCheckoutSession(sessionId);
          
          if (result.success && result.session) {
            // Determine plan and user type from amount
            let determinedPlanType: 'premium' | 'professional' = 'premium';
            let determinedUserType: 'owner' | 'caretaker' = 'owner';
            
            if (result.session.amount_total === 1290) { // €12.90
              determinedPlanType = 'professional';
              determinedUserType = 'caretaker';
            } else if (result.session.amount_total === 490) { // €4.90
              determinedPlanType = 'premium';
              determinedUserType = 'owner';
            }

            // Use URL params if provided, otherwise use determined values
            const finalPlanType = planType || determinedPlanType;
            const finalUserType = userType || determinedUserType;

            setPaymentSuccess({
              isOpen: true,
              planType: finalPlanType,
              userType: finalUserType,
              sessionData: {
                amount_total: result.session.amount_total,
                customer_email: result.session.customer_details?.email || result.session.customer_email,
                session_id: sessionId
              }
            });

            console.log('✅ Payment session validated:', {
              planType: finalPlanType,
              userType: finalUserType,
              amount: result.session.amount_total,
              email: result.session.customer_details?.email
            });
          } else {
            console.error('❌ Payment session validation failed:', result.error);
          }
        } else if (paymentSuccess === 'true') {
          // URL-based success (backup method)
          setPaymentSuccess({
            isOpen: true,
            planType: planType || 'premium',
            userType: userType || 'owner',
            sessionData: {
              amount_total: planType === 'professional' ? 1290 : 490
            }
          });

          console.log('✅ Payment success from URL params:', {
            planType: planType || 'premium',
            userType: userType || 'owner'
          });
        }

        // Clean up URL parameters after processing
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('session_id');
        newSearchParams.delete('payment_success');
        newSearchParams.delete('plan');
        newSearchParams.delete('user_type');
        
        // Only update if parameters were actually removed
        if (newSearchParams.toString() !== searchParams.toString()) {
          setSearchParams(newSearchParams, { replace: true });
        }

      } catch (error) {
        console.error('❌ Payment success validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };

    checkPaymentSuccess();
  }, [searchParams, setSearchParams]);

  const closeModal = () => {
    setPaymentSuccess(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return {
    paymentSuccess,
    isValidating,
    closeModal
  };
} 