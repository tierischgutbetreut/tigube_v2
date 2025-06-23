import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase/client';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Fehler beim Senden der E-Mail:', err);
      setError(err.message || 'Beim Senden der E-Mail ist ein Fehler aufgetreten.');
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
            E-Mail versendet
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">E-Mail erfolgreich versendet</p>
                <p className="text-sm mt-1">
                  Wir haben dir einen Link zum Zurücksetzen deines Passworts an {email} gesendet.
                  Bitte überprüfe auch deinen Spam-Ordner.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                to="/anmelden" 
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zurück zur Anmeldung
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
          Passwort zurücksetzen
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail-Adresse
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                {loading ? 'Wird gesendet...' : 'Link senden'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              to="/anmelden" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage; 