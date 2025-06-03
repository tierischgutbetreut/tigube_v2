import { useState } from 'react';
import { PawPrint, Mail, CheckCircle, Heart, Shield, Users, Clock } from 'lucide-react';
import Button from '../components/ui/Button';

function LaunchPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Hier würde normalerweise die E-Mail an einen Service gesendet werden
    // Für jetzt simulieren wir das mit einem Timeout
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      setEmail('');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-primary-700/10"></div>
        
        <div className="relative container-custom py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <PawPrint className="w-12 h-12 text-primary-600" />
              </div>
            </div>

            {/* Hauptüberschrift */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="text-primary-600">tigube</span> startet bald!
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              Die vertrauensvolle Plattform für professionelle Tierbetreuung in Deutschland.
              <br className="hidden md:block" />
              Seien Sie unter den Ersten, die davon erfahren!
            </p>

            {/* Newsletter Anmeldung */}
            <div className="max-w-md mx-auto mb-12">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ihre E-Mail-Adresse"
                      className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg py-4"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Wird angemeldet...' : 'Benachrichtigung erhalten'}
                  </Button>
                </form>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Vielen Dank für Ihr Interesse!
                  </h3>
                  <p className="text-green-700">
                    Sie erhalten eine E-Mail, sobald tigube verfügbar ist.
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Kein Spam. Sie können sich jederzeit abmelden.
            </p>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Was Sie erwartet
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              tigube verbindet liebevolle Tierbesitzer mit vertrauenswürdigen Betreuern
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verifizierte Betreuer
              </h3>
              <p className="text-gray-600">
                Alle Betreuer werden sorgfältig geprüft und verifiziert
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Liebevolle Pflege
              </h3>
              <p className="text-gray-600">
                Ihr Haustier erhält die Aufmerksamkeit und Liebe, die es verdient
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Lokale Gemeinschaft
              </h3>
              <p className="text-gray-600">
                Finden Sie Betreuer in Ihrer direkten Nachbarschaft
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center group">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Flexible Zeiten
              </h3>
              <p className="text-gray-600">
                Betreuung genau dann, wenn Sie sie brauchen
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Preview */}
      <div className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Unsere Services
            </h2>
            <p className="text-lg text-gray-600">
              Umfassende Betreuung für alle Bedürfnisse
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Hundebetreuung', desc: 'Ganztägige liebevolle Betreuung für Ihren Hund' },
              { title: 'Katzenbetreuung', desc: 'Spezialisierte Pflege für Ihre Katze' },
              { title: 'Gassi-Service', desc: 'Regelmäßige Spaziergänge für Ihren Vierbeiner' },
              { title: 'Hausbesuche', desc: 'Betreuung im gewohnten Umfeld Ihres Tieres' },
              { title: 'Haussitting', desc: 'Rundum-Betreuung in Ihrem Zuhause' },
              { title: 'Tagesbetreuung', desc: 'Flexible Tagesbetreuung nach Ihren Bedürfnissen' }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bereit für den Start?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Werden Sie Teil der tigube-Community und erleben Sie, wie einfach Tierbetreuung sein kann.
          </p>
          
          {!isSubmitted && (
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-4">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-Mail-Adresse"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading}
                  className="px-6 py-3 whitespace-nowrap"
                >
                  {isLoading ? 'Lädt...' : 'Anmelden'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default LaunchPage;