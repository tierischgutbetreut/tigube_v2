import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ExternalLink, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { auth, supabase } from '../lib/supabase/client';
import { userService } from '../lib/supabase/db';
import { useAuth } from '../lib/auth/AuthContext';

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateProfileState, isAuthenticated, userProfile, loading: authLoading } = useAuth();
  const initialType = searchParams.get('type') || 'owner';
  
  // Redirect if already authenticated and have profile
  React.useEffect(() => {
    if (isAuthenticated && userProfile && !authLoading) {
      console.log('🔄 Already authenticated with profile, redirecting to dashboard...');
      const dashboardPath = userProfile.user_type === 'caretaker' 
        ? '/dashboard-caretaker' 
        : '/dashboard-owner';
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, userProfile, authLoading, navigate]);
  
  // Fix: Accept both 'caregiver' and 'caretaker' as valid caretaker types
  const [userType, setUserType] = useState<'owner' | 'caretaker'>(
    initialType === 'caregiver' || initialType === 'caretaker' ? 'caretaker' : 'owner'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Onboarding wird nach Dashboard-Load angezeigt, nicht mehr hier
  
  // Formular-Daten für Schritt 1 (Grundlegende Kontoinformationen)
  const [formStep1, setFormStep1] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    termsAccepted: false
  });

  const [showPassword, setShowPassword] = useState(false);

  // Funktion zum Abschließen der Registrierung (vereinfacht)
  const completeRegistration = async () => {
    setError(null);
    
      // Validierung für Schritt 1
      if (!formStep1.firstName || !formStep1.lastName || !formStep1.email || !formStep1.password) {
        setError('Bitte fülle alle Pflichtfelder aus.');
        return;
      }
      
      if (formStep1.password.length < 8) {
        setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
        return;
      }

      if (!formStep1.termsAccepted) {
        setError('Bitte akzeptiere die Nutzungsbedingungen und Datenschutzbestimmungen.');
        return;
      }

      try {
        setLoading(true);
        // Benutzer bei Supabase registrieren
        const { data, error } = await auth.signUp(
          formStep1.email,
          formStep1.password,
          {
            options: {
              data: {
                full_name: `${formStep1.firstName} ${formStep1.lastName}`,
                first_name: formStep1.firstName,
                last_name: formStep1.lastName
              }
            }
          }
        );
        
        if (error) throw error;
        
        if (data.user) {
          // Benutzer in users-Tabelle anlegen
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: formStep1.email,
              first_name: formStep1.firstName,
              last_name: formStep1.lastName,
              user_type: userType,
            profile_completed: false // Profile ist noch nicht vollständig
            });

          if (insertError) {
            setError("Profil konnte nicht gespeichert werden. Bitte versuche es erneut.");
            return;
          }

        // Auth-Kontext robuste aktualisieren
        console.log('🔄 Starting robust profile update after registration...');
        let profileUpdated = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!profileUpdated && attempts < maxAttempts) {
          attempts++;
          try {
            // Kurze Verzögerung zwischen Versuchen
            await new Promise(resolve => setTimeout(resolve, 300 * attempts));
            
            console.log(`🔍 Profile update attempt ${attempts}/${maxAttempts}...`);
            const { data: freshProfile, error: freshProfileError } = await userService.getUserProfile(data.user.id);
            
          if (!freshProfileError && freshProfile) {
              // Profile erfolgreich geladen und ist vollständig
            updateProfileState(freshProfile);
              console.log(`✅ Profile state updated successfully on attempt ${attempts}:`, freshProfile);
              profileUpdated = true;
              
              // Zusätzliche Pause für React State Update
        await new Promise(resolve => setTimeout(resolve, 200));
        
            } else if (freshProfileError) {
              console.warn(`⚠️ Profile update attempt ${attempts} failed:`, freshProfileError);
              if (attempts === maxAttempts) {
                // Auch bei Fehlern weitermachen - Dashboard kann mit basic profile arbeiten
                console.log('⚠️ Profile update failed, but continuing with basic auth...');
                profileUpdated = true;
              }
            }
          } catch (profileErr) {
            console.error(`❌ Error in profile update attempt ${attempts}:`, profileErr);
            if (attempts === maxAttempts) {
              // Bei kritischen Fehlern trotzdem weitermachen
              console.log('❌ Max profile update attempts reached, continuing anyway...');
              profileUpdated = true;
            }
          }
        }
        
        // Setze Onboarding-Flag für das Dashboard und leite direkt weiter
        try {
          sessionStorage.setItem(
            'onboardingData',
            JSON.stringify({ userType, userName: formStep1.firstName })
          );
        } catch (e) {
          console.warn('⚠️ Konnte onboardingData nicht in sessionStorage setzen:', e);
        }

        const dashboardPath = userType === 'owner' ? '/dashboard-owner' : '/dashboard-caretaker';
        console.log('✅ Registration completed. Redirecting to dashboard for onboarding:', dashboardPath);
        window.location.href = dashboardPath;
        }
      } catch (err: any) {
        console.error('Fehler bei der Registrierung:', err);
        setError(err.message || 'Bei der Registrierung ist ein Fehler aufgetreten.');
      } finally {
        setLoading(false);
    }
  };

  // Modal-Completion entfällt hier, da Onboarding im Dashboard gestartet wird

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-3xl">
        {/* Headline & Beschreibung */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center mb-6">
              <img src="/Image/Logos/tigube_logo_klein.png" alt="tigube Logo" className="h-10 w-auto mr-2" />
            </Link>
            <h1 className="text-3xl font-bold mb-4">
              {userType === 'owner' ? 'Als Tierbesitzer registrieren' : 'Als Betreuer registrieren'}
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              {userType === 'owner' 
                ? 'Erstelle ein Konto, um vertrauenswürdige Betreuer für deine Tiere zu finden.'
                : 'Erstelle ein Konto, um Betreuungsdienste anzubieten und Tierbesitzer zu erreichen.'}
            </p>
          </div>
        
        {/* User Type Toggle */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex">
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                  userType === 'owner'
                    ? 'bg-primary-500 text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setUserType('owner')}
              >
                Tierbesitzer
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                  userType === 'caretaker'
                    ? 'bg-primary-500 text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setUserType('caretaker')}
              >
                Betreuer
              </button>
            </div>
          </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        

        
        {/* Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 animate-fade-in">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6">Konto erstellen</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Vorname
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="input"
                      placeholder="Dein Vorname"
                      value={formStep1.firstName}
                      onChange={(e) => setFormStep1({...formStep1, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nachname
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="input"
                      placeholder="Dein Nachname"
                      value={formStep1.lastName}
                      onChange={(e) => setFormStep1({...formStep1, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input"
                    placeholder="deine.email@beispiel.de"
                    value={formStep1.email}
                    onChange={(e) => setFormStep1({...formStep1, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="input pr-10"
                      placeholder="Sicheres Passwort erstellen"
                      value={formStep1.password}
                      onChange={(e) => setFormStep1({...formStep1, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mindestens 8 Zeichen, eine Zahl und ein Sonderzeichen
                  </p>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    checked={formStep1.termsAccepted}
                    onChange={(e) => setFormStep1({...formStep1, termsAccepted: e.target.checked})}
                    required
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                    Ich akzeptiere die{' '}
                    <Link to="/agb" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                      Nutzungsbedingungen
                      <ExternalLink className="h-3 w-3" />
                    </Link>{' '}
                    und{' '}
                    <Link to="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                      Datenschutzbestimmungen
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </label>
                </div>
                <div className="flex justify-end mt-8">
                  <Button
                    variant="primary"
                onClick={completeRegistration}
                    isLoading={loading}
                disabled={loading}
                  >
                    Jetzt Registrieren
                  </Button>
                </div>
              </div>
                          </div>
        
        {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Bereits registriert?{' '}
              <Link to="/anmelden" className="text-primary-600 hover:text-primary-700 font-medium">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        
        {/* Onboarding-Modal wird jetzt im Dashboard angezeigt */}
      </div>
    </div>
  );
}

export default RegisterPage;