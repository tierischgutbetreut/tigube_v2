import React, { useState, useEffect } from 'react';
import { PricingGrid } from '../components/ui/SubscriptionCard';
import { UsageLimitIndicator } from '../components/ui/UsageLimitIndicator';
import { UpgradePrompt } from '../components/ui/UpgradePrompt';
import { useAuth } from '../lib/auth/AuthContext';
import { useSubscription } from '../lib/auth/useSubscription';
import { useCurrentUsage } from '../hooks/useCurrentUsage';
import { StripeService } from '../lib/stripe/stripeService';
import { config } from '../lib/stripe/stripeConfig';
import Button from '../components/ui/Button';

export default function PricingPage() {
  const { user, userProfile } = useAuth();
  const { subscription } = useSubscription();
  
  // Debug Stripe configuration on component mount
  React.useEffect(() => {
    console.log('[PricingPage] Stripe configuration check:', {
      stripeEnabled: StripeService.isStripeReady(),
      environment: config.app.environment,
      appUrl: config.app.url
    });
  }, []);
  
  // Separate Usage Hooks für verschiedene Features
  const { currentUsage: contactUsage, isLoading: contactLoading } = useCurrentUsage('contact_request');
  const { currentUsage: bookingUsage, isLoading: bookingLoading } = useCurrentUsage('booking_request');
  const { currentUsage: profileUsage, isLoading: profileLoading } = useCurrentUsage('profile_view');
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<'limit_reached' | 'feature_blocked' | 'general'>('general');
  
  // Setze den Default-Tab basierend auf dem User-Profil, aber nur beim ersten Laden
  const [selectedUserType, setSelectedUserType] = useState<'owner' | 'caretaker'>('owner');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Update selectedUserType nur beim ersten Laden des User-Profils, danach ist der Toggle frei
  useEffect(() => {
    // Nur beim ersten Laden das User-Profil als Default setzen
    if (userProfile?.user_type && !hasInitialized) {
      setSelectedUserType(userProfile.user_type);
      setHasInitialized(true);
    }
  }, [userProfile?.user_type, hasInitialized]);

  const handleSelectPlan = async (plan: 'basic' | 'premium') => {
    console.log('Plan selected:', plan);
    
    // Basic plan ist kostenlos - keine Aktion nötig
    if (plan === 'basic') {
      alert('Du bist bereits im Starter-Plan!');
      return;
    }

    // Check if user is logged in
    if (!user || !userProfile) {
      alert('Bitte melde dich an, um ein Upgrade durchzuführen.');
      return;
    }

    // Check if Stripe is configured
    if (!StripeService.isStripeReady()) {
      alert('Zahlungssystem ist momentan nicht verfügbar. Bitte versuche es später erneut.');
      return;
    }

    // Beta users can still upgrade to test payment processing
    if (subscription?.status === 'trial') {
      const confirmed = confirm(
        'Als Beta-User hast du bereits Zugriff auf alle Premium-Features bis zum 31. Oktober 2025!\n\n' +
        'Möchtest du trotzdem ein Premium-Upgrade durchführen, um die Zahlungsabwicklung zu testen? ' +
        '(Du wirst nicht doppelt belastet - dies ist nur für Test-Zwecke)'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      console.log('🚀 Starting checkout process...');
      console.log('User:', { id: user.id, email: user.email, type: displayUserType });
      
      // Map plan to actual plan type
      const planType = displayUserType === 'owner' ? 'premium' : 'professional';
      console.log('Plan type:', planType);
      
      // Check Stripe readiness
      console.log('Stripe ready:', StripeService.isStripeReady());
      
      // Start Stripe checkout
      console.log('Calling StripeService.startCheckout...');
      await StripeService.startCheckout({
        userType: displayUserType,
        plan: planType,
        userId: user.id,
        userEmail: user.email!
      });
      
      console.log('✅ Checkout completed successfully');
      
    } catch (error) {
      console.error('❌ Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error details:', {
        message: errorMessage,
        error: error
      });
      alert(`Fehler beim Starten des Zahlungsvorgangs: ${errorMessage}\n\nBitte versuche es erneut oder öffne die Browser-Konsole für Details.`);
    }
  };

  const handleUpgradePrompt = (plan: 'premium') => {
    console.log('Upgrade triggered for:', plan);
    setShowUpgradeModal(false);
    handleSelectPlan(plan);
  };

  // Verwende den ausgewählten User-Type für die Anzeige
  const displayUserType = selectedUserType;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              tigube Mitgliedschaften
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Starte kostenlos oder upgrade für erweiterte Features
            </p>
          </div>
        </div>
      </div>

              {/* Main Pricing Section */}
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PricingGrid 
              userType={displayUserType}
              onSelectPlan={handleSelectPlan}
              onUserTypeChange={setSelectedUserType}
            />
          </div>
        </div>

      {/* Usage Overview (nur für eingeloggte User) */}
      {user && (
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Deine aktuelle Nutzung
              </h2>
              <p className="text-gray-600 mb-4">
                Übersicht über deine Limits und Nutzung in diesem Monat
              </p>
              
              {/* Global Beta Notice */}
              {subscription?.status === 'trial' && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Beta-Phase: Alle Features unlimited bis 31. Oktober 2025
                </div>
              )}
            </div>

            {/* Loading State */}
            {(contactLoading || bookingLoading || profileLoading) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <UsageLimitIndicator
                  featureType="contact_request"
                  currentUsage={contactUsage}
                  showProgress={true}
                />
                <UsageLimitIndicator
                  featureType="booking_request"
                  currentUsage={bookingUsage}
                  showProgress={true}
                />
                <UsageLimitIndicator
                  featureType="profile_view"
                  currentUsage={profileUsage}
                  showProgress={true}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demo Section für Upgrade-Prompts */}
      <div className="py-12 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Demo: Upgrade-Benachrichtigungen
            </h2>
            <p className="text-gray-600 mb-6">
              So sehen Upgrade-Prompts in verschiedenen Situationen aus
            </p>

            {/* Demo Controls */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTrigger('limit_reached');
                  setShowUpgradeModal(true);
                }}
              >
                Limit erreicht (Modal)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTrigger('feature_blocked')}
              >
                Feature blockiert (Banner)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTrigger('general')}
              >
                Allgemein (Inline)
              </Button>
            </div>
          </div>

          {/* Upgrade Prompt Examples */}
          <div className="space-y-6">
            {/* Banner Example */}
                         {selectedTrigger === 'feature_blocked' && (
               <UpgradePrompt
                 variant="banner"
                 trigger="feature_blocked"
                 featureType="premium_badge"
                 userType={displayUserType}
                 onClose={() => setSelectedTrigger('general')}
                 onUpgrade={handleUpgradePrompt}
               />
             )}

             {/* Inline Example */}
             {selectedTrigger === 'general' && (
               <UpgradePrompt
                 variant="inline"
                 trigger="general"
                 userType={displayUserType}
                 onUpgrade={handleUpgradePrompt}
               />
             )}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Häufig gestellte Fragen
            </h2>
          </div>

          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Was passiert, wenn die Beta-Phase endet?
              </h3>
              <p className="text-gray-600">
                Am 31. Oktober 2025 wechseln wir vom Beta-Modus zu unserem regulären Freemium-Modell. 
                Du behältst alle deine Daten und kannst weiterhin den kostenlosen Basic-Plan nutzen oder 
                zu Premium/Professional upgraden für erweiterte Features.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kann ich meinen Plan jederzeit ändern?
              </h3>
              <p className="text-gray-600">
                Ja! Du kannst jederzeit upgraden oder downgraden. Bei einem Upgrade werden die neuen 
                Features sofort freigeschaltet. Bei einem Downgrade gelten die neuen Limits ab dem 
                nächsten Abrechnungszyklus.
              </p>
            </div>



            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unterscheiden sich die Pläne für Tierbesitzer und Betreuer?
              </h3>
              <p className="text-gray-600">
                Ja, beide nutzen das gleiche 2-Plan-System, aber mit unterschiedlichen Namen und Features: 
                Tierbesitzer erhalten "Premium" (€4,90/Monat) mit unlimited Kontakten und erweiterten Filtern. 
                Betreuer erhalten "Professional" (€12,90/Monat) mit zusätzlichen Business-Features wie 
                Umgebungsbildern und erweiterten Analytics.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Werden meine Limits am Monatsende zurückgesetzt?
              </h3>
              <p className="text-gray-600">
                Ja, alle monatlichen Limits werden am ersten Tag des neuen Monats automatisch zurückgesetzt. 
                Du startest also jeden Monat mit vollen Kontingenten.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
             {showUpgradeModal && (
         <UpgradePrompt
           variant="modal"
           trigger={selectedTrigger}
           featureType="contact_request"
           userType={displayUserType}
           onClose={() => setShowUpgradeModal(false)}
           onUpgrade={handleUpgradePrompt}
         />
       )}
    </div>
  );
} 