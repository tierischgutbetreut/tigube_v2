import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Heart, Search, MessageCircle, Star, PawPrint, Shield } from 'lucide-react';
import Button from './Button';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

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
  const [currentStep, setCurrentStep] = useState(0);

  const ownerSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Willkommen bei tigube!`,
      subtitle: `Hi ${userName}! 👋`,
      description: 'Schön, dass du da bist! tigube hilft dir dabei, vertrauensvolle Betreuer für deine geliebten Tiere zu finden.',
      icon: <Heart className="w-12 h-12 text-primary-500" />
    },
    {
      id: 'profile',
      title: 'Nächster Schritt: Dein Profil',
      subtitle: 'Erzähle uns von deinen Lieblingen',
      description: 'Erstelle Profile für dein(e) Tier(e) und teile deine Betreuungsvorlieben mit.',
      icon: <PawPrint className="w-12 h-12 text-primary-500" />
    },
    {
      id: 'search',
      title: 'Finde den perfekten Betreuer',
      subtitle: 'Einfach und sicher',
      description: 'Durchsuche Profile von erfahrenen Tierbetreuern in deiner Nähe.',
      icon: <Search className="w-12 h-12 text-primary-500" />
    },
    {
      id: 'connect',
      title: 'Direkte Kommunikation',
      subtitle: 'Lerne dich kennen',
      description: 'Chatte direkt mit potenziellen Betreuern, stelle Fragen und plane ein Kennenlernen.',
      icon: <MessageCircle className="w-12 h-12 text-primary-500" />
    },
    {
      id: 'trust',
      title: 'Vertrauen durch Transparenz',
      subtitle: 'Sicherheit steht an erster Stelle',
      description: 'Bewertungen, Referenzen und verifizierte Profile geben dir die Sicherheit, die dein Tier verdient.',
      icon: <Shield className="w-12 h-12 text-primary-500" />
    }
  ];

  const caretakerSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Willkommen bei Tigube!`,
      subtitle: `Hi ${userName}! 👋`,
      description: 'Großartig, dass du dabei bist! Als Tierbetreuer kannst du deine Leidenschaft für Tiere zum Beruf machen.',
      icon: <PawPrint className="w-12 h-12 text-primary-500" />
    },
    {
      id: 'profile',
      title: 'Erstelle dein Profil',
      subtitle: 'Zeige deine Erfahrung',
      description: 'Vervollständige dein Profil mit Fotos, Erfahrungen und Services. Je detaillierter, desto mehr Anfragen erhältst du.',
      icon: <Star className="w-12 h-12 text-primary-500" />
    },
    {
      id: 'connect',
      title: 'Verbinde dich mit Tierbesitzern',
      subtitle: 'Neue Kunden finden',
      description: 'Tierbesitzer in deiner Nähe suchen nach zuverlässigen Betreuern. Chatte mit ihnen und vereinbare Kennenlerntermine.',
      icon: <MessageCircle className="w-12 h-12 text-primary-500" />
    },
    {
      id: 'grow',
      title: 'Baue dein Business auf',
      subtitle: 'Bewertungen sammeln',
      description: 'Mit jeder erfolgreichen Betreuung baust du deine Reputation auf und erhältst mehr Buchungsanfragen.',
      icon: <Heart className="w-12 h-12 text-primary-500" />
    }
  ];

  const steps = userType === 'owner' ? ownerSteps : caretakerSteps;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-sm max-w-lg w-full overflow-hidden animate-slideInUp">
        {/* Content */}
        <div className="p-8 text-center min-h-[400px] flex flex-col justify-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {currentStepData.icon}
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          <h3 className="text-lg font-medium text-gray-600 mb-4">
            {currentStepData.subtitle}
          </h3>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
            {currentStepData.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8">
          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentStep
                    ? 'bg-primary-500 w-8'
                    : index < currentStep
                    ? 'bg-primary-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            {/* Back Button */}
            {currentStep > 0 ? (
              <Button
                variant="ghost"
                onClick={prevStep}
                className="text-gray-600"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Zurück
              </Button>
            ) : (
              <div></div>
            )}

            {/* Next/Finish Button */}
            <Button
              variant="primary"
              onClick={nextStep}
              className="px-6"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Weiter
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                'Los geht\'s!'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessModal;
