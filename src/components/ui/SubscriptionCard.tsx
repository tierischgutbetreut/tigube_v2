import React from 'react';
import { Check, Crown, Star, Zap, Users, Calendar, Camera, TrendingUp } from 'lucide-react';
import Button from './Button';
import { useSubscription } from '../../lib/auth/useSubscription';

interface SubscriptionCardProps {
  plan: 'basic' | 'premium';
  userType: 'owner' | 'caretaker';
  onSelectPlan?: (plan: 'basic' | 'premium') => void;
  className?: string;
  highlighted?: boolean;
}

export function SubscriptionCard({ 
  plan, 
  userType, 
  onSelectPlan, 
  className = '',
  highlighted = false 
}: SubscriptionCardProps) {
  const { subscription, isBetaUser } = useSubscription();
  const isCurrentPlan = subscription?.plan_type === plan;

  const planConfig = getPlanConfig(plan, userType);
  const cardClasses = `
    relative bg-white rounded-xl border transition-all duration-300 hover:shadow-lg
    ${highlighted ? 'border-2 border-blue-500 shadow-lg transform scale-105' : 'border-gray-200'}
    ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses}>
      {/* Popular Badge */}
      {highlighted && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Beliebteste Wahl
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Aktueller Plan
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            {planConfig.icon}
            <h3 className="text-2xl font-bold text-gray-900 ml-2">{planConfig.name}</h3>
          </div>
          
          <div className="mb-2">
            <span className="text-4xl font-bold text-gray-900">{planConfig.price}</span>
            {planConfig.price !== 'Kostenlos' && (
              <span className="text-gray-500 ml-1">/Monat</span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm">{planConfig.description}</p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {planConfig.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {feature.available ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm ${feature.available ? 'text-gray-900' : 'text-gray-400'}`}>
                  {feature.name}
                </span>
                {feature.limit && (
                  <span className="text-xs text-gray-500 ml-2">({feature.limit})</span>
                )}
                {feature.highlight && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full ml-2">
                    {feature.highlight}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Beta Notice */}
        {isBetaUser && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              <strong>Beta-Phase:</strong> Alle Features bis 31. Oktober 2025 kostenlos verfügbar
            </p>
          </div>
        )}

        {/* Development Test Notice */}
        {!isBetaUser && import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              <strong>Test-Modus:</strong> Nutze Karte 4242 4242 4242 4242 für Test-Zahlungen
            </p>
          </div>
        )}

        {/* CTA Button */}
        <div className="pt-4">
          {isCurrentPlan ? (
            <Button variant="outline" disabled className="w-full">
              Aktueller Plan
            </Button>
          ) : isBetaUser ? (
            <Button variant="outline" disabled className="w-full">
              In Beta verfügbar
            </Button>
          ) : (
            <Button
              variant={highlighted ? 'primary' : 'outline'}
              className="w-full"
              onClick={() => onSelectPlan?.(plan)}
            >
              {plan === 'basic' ? 'Kostenlos starten' : `Upgrade zu ${planConfig.name}`}
            </Button>
          )}
        </div>


      </div>
    </div>
  );
}

interface FeatureItem {
  name: string;
  available: boolean;
  limit?: string;
  highlight?: string;
}

function getPlanConfig(plan: 'basic' | 'premium', userType: 'owner' | 'caretaker') {
  if (userType === 'owner') {
    // Owner-spezifische Pläne
    const ownerFeatures: Record<string, {
      name: string;
      price: string;
      description: string;
      icon: React.ReactNode;
      features: FeatureItem[];
    }> = {
      basic: {
        name: 'Starter',
        price: 'Kostenlos',
        description: 'Perfekt zum Starten',
        icon: <Users className="w-8 h-8 text-gray-600" />,
        features: [
          { name: 'Kontaktanfragen', available: true, limit: '3 pro Monat' },
          { name: 'Basis-Suchfilter', available: true },
          { name: 'Profil erstellen', available: true },
          { name: 'Bewertungen lesen', available: true },
          { name: 'Bewertungen schreiben', available: false },
          { name: 'Werbefrei', available: false },
          { name: 'Erweiterte Filter', available: false },
          { name: 'Premium Support', available: false }
        ]
      },
      premium: {
        name: 'Premium',
        price: '€4,90',
        description: 'Für aktive Tierbesitzer',
        icon: <Star className="w-8 h-8 text-blue-600" />,
        features: [
          { name: 'Kontaktanfragen', available: true, highlight: 'Unlimited' },
          { name: 'Basis-Suchfilter', available: true },
          { name: 'Profil erstellen', available: true },
          { name: 'Bewertungen lesen', available: true },
          { name: 'Bewertungen schreiben', available: true },
          { name: 'Werbefrei', available: true },
          { name: 'Erweiterte Filter', available: true },
          { name: 'Premium Support', available: true }
        ]
      }
    };
    return ownerFeatures[plan];
  } else {
    // Caretaker-spezifische Pläne
    const caretakerFeatures: Record<string, {
      name: string;
      price: string;
      description: string;
      icon: React.ReactNode;
      features: FeatureItem[];
    }> = {
      basic: {
        name: 'Starter',
        price: 'Kostenlos',
        description: 'Erste Schritte als Betreuer',
        icon: <Users className="w-8 h-8 text-gray-600" />,
        features: [
          { name: 'Basis-Profil erstellen', available: true },
          { name: 'Buchungsanfragen empfangen', available: true, limit: '3 pro Monat' },
          { name: 'Bewertungen lesen', available: true },
          { name: 'Chat mit Kunden', available: true, limit: 'Basis' },
          { name: 'Premium Badge', available: false },
          { name: 'Erweiterte Profilfeatures', available: false },
          { name: 'Umgebungsbilder', available: false },

          { name: 'Priorität in Suche', available: false },
          { name: 'Werbefrei', available: false }
        ]
      },
      premium: {
        name: 'Professional',
        price: '€12,90',
        description: 'Für professionelle Betreuer',
        icon: <Crown className="w-8 h-8 text-yellow-600" />,
        features: [
          { name: 'Erweiterte Profilgestaltung', available: true },
          { name: 'Buchungsanfragen empfangen', available: true, highlight: 'Unlimited' },
          { name: 'Bewertungen lesen & antworten', available: true },
          { name: 'Premium Chat-Features', available: true },
          { name: 'Premium Badge', available: true, highlight: 'Vertrauensbonus' },
          { name: 'Umgebungsbilder', available: true, limit: 'Bis zu 6 Bilder' },

          { name: 'Höchste Priorität in Suche', available: true, highlight: 'Top-Ranking' },
          { name: 'Werbefrei', available: true },
          { name: 'Premium Support', available: true }
        ]
      }
    };
    return caretakerFeatures[plan];
  }
}

// Pricing-Seiten-Layout-Komponente
interface PricingGridProps {
  userType: 'owner' | 'caretaker';
  onSelectPlan?: (plan: 'basic' | 'premium') => void;
  className?: string;
}

export function PricingGrid({ userType, onSelectPlan, className = '' }: PricingGridProps) {
  const { isBetaUser } = useSubscription();

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Wähle den passenden Plan für dich
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {userType === 'owner' 
            ? 'Finde die perfekte Betreuung für dein Haustier mit den Funktionen, die du brauchst.'
            : 'Erweitere dein Betreuungsgeschäft mit professionellen Tools und Features.'
          }
        </p>
        
        {isBetaUser && (
          <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">
              Beta-Phase: Alle Features kostenlos bis 31. Oktober 2025
            </span>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <SubscriptionCard 
          plan="basic" 
          userType={userType} 
          onSelectPlan={onSelectPlan}
        />
        <SubscriptionCard 
          plan="premium" 
          userType={userType} 
          onSelectPlan={onSelectPlan}
          highlighted={!isBetaUser} // Highlight Premium wenn nicht Beta
        />
      </div>

      {/* Feature Comparison Toggle */}
      <div className="mt-12 text-center">
        <details className="bg-gray-50 rounded-lg p-6">
          <summary className="cursor-pointer text-lg font-semibold text-gray-900 hover:text-blue-600">
            Detaillierter Feature-Vergleich anzeigen
          </summary>
          <div className="mt-6">
            <FeatureComparisonTable userType={userType} />
          </div>
        </details>
      </div>
    </div>
  );
}

function FeatureComparisonTable({ userType }: { userType: 'owner' | 'caretaker' }) {
  const planName = userType === 'owner' ? 'Premium' : 'Professional';
  const planPrice = userType === 'owner' ? '€4,90/Monat' : '€12,90/Monat';
  
  const features = [
    { name: 'Kontaktanfragen', basic: '3/Monat', premium: 'Unlimited' },
    { name: 'Suchfilter', basic: 'Basis', premium: 'Erweitert' },
    { name: 'Premium Badge', basic: '❌', premium: '✅' },
    { name: 'Werbung', basic: 'Mit Werbung', premium: 'Werbefrei' },
    { name: 'Support', basic: 'E-Mail Support', premium: 'Premium Chat' },
    ...(userType === 'caretaker' ? [
      { name: 'Buchungsanfragen', basic: '3/Monat', premium: 'Unlimited' },
      { name: 'Priorität in Suche', basic: 'Normal', premium: 'Höchste' },
      { name: 'Umgebungsbilder', basic: '❌', premium: '✅ (6 max)' }
    ] : [
      { name: 'Favoriten-Listen', basic: '❌', premium: '✅' },
      { name: 'Erweiterte Filter', basic: '❌', premium: '✅' }
    ])
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Feature
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gratis
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {planName}
              <div className="text-xs font-normal text-gray-400 mt-1">{planPrice}</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {features.map((feature, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {feature.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                {feature.basic}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                {feature.premium}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 