import React from 'react';
import { CheckCircle, Crown, Star, X } from 'lucide-react';
import Button from './Button';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'premium' | 'professional';
  userType: 'owner' | 'caretaker';
  sessionData?: {
    amount_total?: number;
    customer_email?: string;
  };
}

export default function PaymentSuccessModal({ 
  isOpen, 
  onClose, 
  planType, 
  userType,
  sessionData 
}: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  const getPlanInfo = () => {
    if (userType === 'owner' && planType === 'premium') {
      return {
        name: 'Premium',
        icon: <Star className="w-16 h-16 text-yellow-500" />,
        color: 'bg-yellow-50 border-yellow-200',
        features: [
          'Unlimited Kontaktanfragen',
          'Bewertungen schreiben',
          'Erweiterte Suchfilter',
          'Werbefrei',
          'Premium Support'
        ],
        price: '€4,90/Monat'
      };
    }
    
    if (userType === 'caretaker' && planType === 'professional') {
      return {
        name: 'Professional',
        icon: <Crown className="w-16 h-16 text-purple-500" />,
        color: 'bg-purple-50 border-purple-200',
        features: [
          'Unlimited Buchungsanfragen',
          'Premium Badge',
          'Bis zu 6 Umgebungsbilder',
          'Höchste Priorität in Suche',
          'Werbefrei',
          'Premium Support'
        ],
        price: '€12,90/Monat'
      };
    }
    
    return null;
  };

  const planInfo = getPlanInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Zahlung erfolgreich!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {planInfo && (
            <div className={`rounded-lg border p-4 mb-6 ${planInfo.color}`}>
              <div className="flex items-center space-x-4 mb-4">
                {planInfo.icon}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Tigube {planInfo.name}
                  </h3>
                  <p className="text-lg font-medium text-gray-600">
                    {planInfo.price}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Deine neuen Features:
                </h4>
                <ul className="space-y-1">
                  {planInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-green-900 mb-2">
              ✅ Zahlung bestätigt
            </h4>
            <p className="text-sm text-green-700">
              Dein {planInfo?.name || 'Premium'}-Abonnement ist ab sofort aktiv. 
              Du kannst alle Features direkt nutzen!
            </p>
            {sessionData?.customer_email && (
              <p className="text-xs text-green-600 mt-2">
                Bestätigung gesendet an: {sessionData.customer_email}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Dashboard weiter nutzen
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Du kannst dein Abonnement jederzeit in den Einstellungen verwalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 