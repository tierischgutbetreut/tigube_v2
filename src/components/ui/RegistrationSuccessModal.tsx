import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  userType: 'owner' | 'caretaker';
  userName: string;
  onComplete: () => void;
}

const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  isOpen,
  userType,
  userName,
  onComplete
}) => {

  useEffect(() => {
    if (!isOpen) return;

    // Automatisch weiterleiten nach 1.5 Sekunden
    const timeoutId = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center animate-slideInUp">
        {/* Success Icon */}
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Du hast dich erfolgreich registriert!
        </h2>
        
        {/* Message */}
        <p className="text-gray-600 mb-4">
          Im nächsten Schritt kannst du dein Profil vervollständigen.
        </p>
        
        {/* Auto redirect info */}
        <p className="text-sm text-gray-500">
          Du wirst automatisch weitergeleitet...
        </p>
      </div>
    </div>
  );
};

export default RegistrationSuccessModal;
