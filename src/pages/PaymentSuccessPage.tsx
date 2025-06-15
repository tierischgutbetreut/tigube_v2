import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, Crown, Star, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { StripeService } from '../lib/stripe/stripeService';
import { useAuth } from '../lib/auth/AuthContext';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    session?: any;
    error?: string;
  } | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const validatePayment = async () => {
      if (!sessionId) {
        setValidationResult({
          success: false,
          error: 'Keine Session-ID gefunden'
        });
        setIsValidating(false);
        return;
      }

      try {
        const result = await StripeService.validateCheckoutSession(sessionId);
        setValidationResult(result);
        
        // Refresh user's subscription data if payment was successful
        if (result.success && refreshSubscription) {
          await refreshSubscription();
        }
      } catch (error) {
        console.error('Payment validation error:', error);
        setValidationResult({
          success: false,
          error: 'Fehler bei der Validierung'
        });
      } finally {
        setIsValidating(false);
      }
    };

    validatePayment();
  }, [sessionId, refreshSubscription]);

  const getPlanInfo = () => {
    if (!validationResult?.session?.metadata) return null;
    
    const { planType, userType } = validationResult.session.metadata;
    
    if (userType === 'owner' && planType === 'premium') {
      return {
        name: 'Premium',
        icon: <Star className="w-12 h-12 text-yellow-500" />,
        features: [
          'Unlimited Kontaktanfragen',
          'Bewertungen schreiben',
          'Erweiterte Suchfilter',
          'Werbefrei',
          'Premium Support'
        ]
      };
    }
    
    if (userType === 'caretaker' && planType === 'professional') {
      return {
        name: 'Professional',
        icon: <Crown className="w-12 h-12 text-purple-500" />,
        features: [
          'Unlimited Buchungsanfragen',
          'Premium Badge',
          'Bis zu 6 Umgebungsbilder',
          'Höchste Priorität in Suche',
          'Werbefrei',
          'Premium Support'
        ]
      };
    }
    
    return null;
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Zahlung wird überprüft...
            </h2>
            <p className="text-gray-600">
              Bitte warte einen Moment, während wir deine Zahlung bestätigen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!validationResult?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Zahlung konnte nicht bestätigt werden
            </h2>
            <p className="text-gray-600 mb-6">
              {validationResult?.error || 'Es gab ein Problem bei der Verarbeitung deiner Zahlung.'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/mitgliedschaften')}
                className="w-full"
              >
                Zurück zu den Mitgliedschaften
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Zum Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const planInfo = getPlanInfo();
  const amount = validationResult.session?.amount_total ? 
    (validationResult.session.amount_total / 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Zahlung erfolgreich!
            </h1>
            <p className="text-lg text-gray-600">
              Willkommen in deinem neuen {planInfo?.name || 'Premium'} Plan
            </p>
          </div>

          {/* Plan Details */}
          {planInfo && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                {planInfo.icon}
                <h3 className="text-2xl font-bold text-gray-900 ml-3">
                  {planInfo.name} Plan
                </h3>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-gray-900">
                  €{amount}
                </p>
                <p className="text-gray-600">pro Monat</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h4 className="font-semibold text-gray-900 mb-2">Zahlungsdetails</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>E-Mail:</span>
                <span>{validationResult.session?.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span>Betrag:</span>
                <span>€{amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-600 font-medium">Bezahlt</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-4">Was passiert als nächstes?</h4>
            <div className="text-sm text-gray-600 mb-6 space-y-2">
              <p>• Dein Account wurde automatisch auf {planInfo?.name || 'Premium'} upgegradet</p>
              <p>• Alle neuen Features sind sofort verfügbar</p>
              <p>• Du erhältst eine Bestätigungs-E-Mail</p>
              <p>• Deine erste Rechnung wird am Ende des Monats erstellt</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8"
              >
                Zum Dashboard
              </Button>
              <div className="text-center">
                <button
                  onClick={() => navigate('/mitgliedschaften')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Alle Mitgliedschaftsdetails anzeigen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 