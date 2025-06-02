import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import Button from '../components/ui/Button';

function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12">
      <div className="text-center px-4">
        <div className="animate-pulse-slow mb-8">
          <svg width="120" height="120" viewBox="0 0 24 24" className="mx-auto text-primary-500">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Seite nicht gefunden</h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-4">
          Wuff! 🐕 Auch unser bester Spürhund konnte diese Seite nicht finden.
        </p>
        <p className="text-base text-gray-500 max-w-md mx-auto mb-8">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Home className="h-5 w-5" />}
            onClick={() => window.location.href = '/'}
          >
            Zurück zur Startseite
          </Button>
          <Button
            variant="outline"
            size="lg"
            leftIcon={<Search className="h-5 w-5" />}
            onClick={() => window.location.href = '/suche'}
          >
            Betreuer finden
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;