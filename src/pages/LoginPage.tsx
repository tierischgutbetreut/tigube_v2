import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/auth/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get URL parameters for redirect handling
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');
  const action = searchParams.get('action');
  const caretakerName = searchParams.get('caretaker');

  // Get the page the user was trying to access before login
  const from = (location.state as any)?.from?.pathname || redirectUrl || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Bitte gib deine E-Mail-Adresse und dein Passwort ein.');
      return;
    }
    
    try {
      setLoading(true);
      await signIn(email, password);
      
      // Handle different redirect scenarios
      if (redirectUrl && redirectUrl !== '/') {
        // Redirect to the originally requested page
        navigate(redirectUrl, { replace: true });
      } else if (from && from !== '/') {
        // Redirect to the page user was trying to access
        navigate(from, { replace: true });
      } else {
        // Default redirect to owner dashboard
        navigate('/dashboard-owner', { replace: true });
      }
    } catch (err: any) {
      console.error('Fehler bei der Anmeldung:', err);
      setError(err.message || 'Bei der Anmeldung ist ein Fehler aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center">
          <img src="public\Image\Logos\tigube_logo_klein.png" alt="tigube Logo" className="h-12 w-auto" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Willkommen zurück
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {action === 'contact' && caretakerName 
            ? `Melde dich an, um ${decodeURIComponent(caretakerName)} zu kontaktieren`
            : 'Melde dich an, um fortzufahren'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {action === 'contact' && caretakerName && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <MessageCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Kontakt aufnehmen</p>
                <p className="text-sm mt-1">
                  Nach der Anmeldung können Sie direkt mit {decodeURIComponent(caretakerName)} chatten.
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail-Adresse
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
                  Angemeldet bleiben
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Passwort vergessen?
                </Link>
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
                Anmelden
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Noch kein Konto?{' '}
              <Link to="/registrieren" className="font-medium text-primary-600 hover:text-primary-500">
                Jetzt kostenlos registrieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;