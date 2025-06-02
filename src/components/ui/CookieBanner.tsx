import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings } from 'lucide-react';
import Button from './Button';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'tigube-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'tigube-cookie-preferences';

function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      setIsVisible(true);
    }

    // Load existing preferences if available
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error('Error parsing saved cookie preferences:', error);
      }
    }

    // Listen for custom event to show cookie settings
    const handleShowCookieSettings = () => {
      setIsVisible(true);
      setShowDetails(true);
    };

    window.addEventListener('showCookieSettings', handleShowCookieSettings);
    
    return () => {
      window.removeEventListener('showCookieSettings', handleShowCookieSettings);
    };
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    setIsVisible(false);
    
    // Here you would typically initialize analytics, marketing tools, etc.
    initializeServices(allAccepted);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    setIsVisible(false);
    
    initializeServices(preferences);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(onlyNecessary));
    setIsVisible(false);
    
    initializeServices(onlyNecessary);
  };

  const initializeServices = (prefs: CookiePreferences) => {
    // Initialize services based on preferences
    if (prefs.analytics) {
      // Initialize Google Analytics, etc.
      console.log('Analytics cookies enabled');
    }
    
    if (prefs.marketing) {
      // Initialize marketing tools
      console.log('Marketing cookies enabled');
    }
    
    if (prefs.functional) {
      // Initialize functional cookies
      console.log('Functional cookies enabled');
    }
  };

  const handlePreferenceChange = (category: keyof CookiePreferences) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-4xl w-full pointer-events-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Cookie className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Cookie-Einstellungen
                </h2>
                <p className="text-sm text-gray-600">
                  Wir respektieren Ihre Privatsphäre
                </p>
              </div>
            </div>
            <button
              onClick={handleRejectAll}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Banner schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
              Einige Cookies sind notwendig für die Funktionalität der Website, während andere uns helfen, 
              die Website zu verbessern und Ihnen personalisierte Inhalte anzuzeigen.
            </p>
            
            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center space-x-1"
              >
                <Settings className="h-4 w-4" />
                <span>Cookie-Einstellungen anpassen</span>
              </button>
            )}
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Cookie-Kategorien
              </h3>
              
              {/* Necessary Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-gray-900">Notwendige Cookies</h4>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Immer aktiv
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                  </p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Analyse-Cookies</h4>
                  <p className="text-sm text-gray-600">
                    Helfen uns zu verstehen, wie Besucher mit der Website interagieren, um die Benutzererfahrung zu verbessern.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('analytics')}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      preferences.analytics ? 'bg-primary-500 justify-end' : 'bg-gray-300 justify-start'
                    } px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Marketing-Cookies</h4>
                  <p className="text-sm text-gray-600">
                    Werden verwendet, um Ihnen relevante Werbung und personalisierte Inhalte anzuzeigen.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('marketing')}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      preferences.marketing ? 'bg-primary-500 justify-end' : 'bg-gray-300 justify-start'
                    } px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Funktionale Cookies</h4>
                  <p className="text-sm text-gray-600">
                    Ermöglichen erweiterte Funktionen und Personalisierung der Website.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('functional')}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      preferences.functional ? 'bg-primary-500 justify-end' : 'bg-gray-300 justify-start'
                    } px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showDetails ? (
              <>
                <Button
                  onClick={handleAcceptSelected}
                  variant="primary"
                  className="flex-1"
                >
                  Auswahl bestätigen
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  variant="outline"
                  className="flex-1"
                >
                  Alle akzeptieren
                </Button>
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="ghost"
                  className="flex-1"
                >
                  Zurück
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleAcceptAll}
                  variant="primary"
                  className="flex-1"
                >
                  Alle Cookies akzeptieren
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-1"
                >
                  Nur notwendige Cookies
                </Button>
              </>
            )}
          </div>

          {/* Legal Links */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Weitere Informationen finden Sie in unserer{' '}
              <a href="/datenschutz" className="text-primary-600 hover:text-primary-700 underline">
                Datenschutzerklärung
              </a>
              {' '}und den{' '}
              <a href="/agb" className="text-primary-600 hover:text-primary-700 underline">
                Allgemeinen Geschäftsbedingungen
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;