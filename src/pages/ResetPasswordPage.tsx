import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase/client';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        // Check if user has a valid session (Supabase automatically handles token validation)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          // Don't show error immediately, let the user try first
          return;
        }

        // Only show error if there's clearly no valid way to reset password
        if (!session) {
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          const code = searchParams.get('code');
          
          // If no session and no tokens/code in URL, the link might be invalid
          // But we'll let the actual password update attempt handle the validation
          if (!accessToken && !refreshToken && !code) {
            console.warn('No session or tokens found, but allowing user to attempt password reset');
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        // Don't show error immediately, let the user try first
      }
    };

    checkAuthSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password) {
      setError('Bitte gib ein neues Passwort ein.');
      return;
    }
    
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Clear any previous error when starting password update
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        // If update fails, it means the session/link is invalid
        if (error.message.includes('session') || error.message.includes('unauthorized')) {
          setError('Ungültiger oder abgelaufener Link. Bitte fordere einen neuen Link an.');
        } else {
          throw error;
        }
        return;
      }
      
      setSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/anmelden', { replace: true });
      }, 3000);
      
    } catch (err: any) {
      console.error('Fehler beim Zurücksetzen des Passworts:', err);
      setError(err.message || 'Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex items-center justify-center">
            <img src="/Image/Logos/tigube_logo_klein.png" alt="tigube Logo" className="h-12 w-auto" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Passwort geändert
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Passwort erfolgreich geändert</p>
                <p className="text-sm mt-1">
                  Dein Passwort wurde erfolgreich geändert. Du wirst automatisch zur Anmeldung weitergeleitet.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                to="/anmelden" 
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Jetzt anmelden
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center">
          <img src="/Image/Logos/tigube_logo_klein.png" alt="tigube Logo" className="h-12 w-auto" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Neues Passwort setzen
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Gib dein neues Passwort ein.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Neues Passwort
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Passwort bestätigen
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={loading}
                disabled={loading}
              >
                {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              to="/anmelden" 
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage; 