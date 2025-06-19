import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, PawPrint as Paw, MessageCircle, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth/AuthContext';
import { useNotifications } from '../../lib/notifications/NotificationContext';
import NotificationBadge from '../ui/NotificationBadge';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userProfile, signOut, loading } = useAuth();
  const { unreadCount } = useNotifications();
  
  const isActive = (path: string) => location.pathname === path;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
      // Auch bei Fehler zur Startseite navigieren
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Bessere Owner-Prüfung mit Fallback
  const isOwner = userProfile?.user_type === 'owner' || (!userProfile && isAuthenticated);
  const isCaretaker = userProfile?.user_type === 'caretaker';
  
  // Debug: Log current state
  if (import.meta.env.DEV) {
    console.log('Header State:', { 
      loading, 
      isAuthenticated, 
      hasUserProfile: !!userProfile, 
      userType: userProfile?.user_type,
      calculatedIsOwner: isOwner,
      calculatedIsCaretaker: isCaretaker 
    });
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/Image/Logos/tigube_logo.png" alt="tigube Logo" className="h-10 w-auto" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {isOwner && (
                  <NavLink to="/dashboard-owner" isActive={isActive('/dashboard-owner')}>
                    Dashboard
                  </NavLink>
                )}
                {isCaretaker && (
                  <NavLink to="/dashboard-caretaker" isActive={isActive('/dashboard-caretaker')}>
                    Dashboard
                  </NavLink>
                )}
                <NavLink to="/suche" isActive={isActive('/suche')}>
                  Betreuer finden
                </NavLink>
                <NavLink to="/mitgliedschaften" isActive={isActive('/mitgliedschaften') || isActive('/preise')}>
                  Mitgliedschaften
                </NavLink>
                <Link to="/nachrichten" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors relative">
                  <MessageCircle className="h-5 w-5" /> 
                  Nachrichten
                  <NotificationBadge count={unreadCount} className="ml-1" />
                </Link>
                <button
                  type="button"
                  className="ml-4 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  aria-label="Ausloggen"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
            <NavLink to="/" isActive={isActive('/')}>
              Startseite
            </NavLink>
            <NavLink to="/suche" isActive={isActive('/suche')}>
            Betreuer finden
            </NavLink>
            <NavLink to="/registrieren?type=caregiver" isActive={isActive('/registrieren?type=caregiver')}>
            Betreuer werden
            </NavLink>
            <NavLink to="/mitgliedschaften" isActive={isActive('/mitgliedschaften') || isActive('/preise')}>
            Preise
            </NavLink>
            <Link
              to="/anmelden"
              className="btn btn-outline"
            >
              Login
            </Link>
            <Link
              to="/registrieren"
              className="btn btn-primary"
            >
              Anmelden
            </Link>
              </>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={toggleMenu}
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-4 space-y-1 animate-fade-in">
              {isAuthenticated ? (
                <>
                  {isOwner && (
                    <MobileNavLink to="/dashboard-owner" isActive={isActive('/dashboard-owner')} onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </MobileNavLink>
                  )}
                  {isCaretaker && (
                    <MobileNavLink to="/dashboard-caretaker" isActive={isActive('/dashboard-caretaker')} onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </MobileNavLink>
                  )}
                  <MobileNavLink to="/suche" isActive={isActive('/suche')} onClick={() => setIsMenuOpen(false)}>
                    Betreuer finden
                  </MobileNavLink>
                  <MobileNavLink 
                    to="/mitgliedschaften" 
                    isActive={isActive('/mitgliedschaften') || isActive('/preise')} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mitgliedschaften
                  </MobileNavLink>
                  <Link to="/nachrichten" className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-700 relative" onClick={() => setIsMenuOpen(false)}>
                    <MessageCircle className="h-5 w-5" /> 
                    Nachrichten
                    <NotificationBadge count={unreadCount} className="ml-1" />
                  </Link>
                  <button
                    type="button"
                    className="ml-3 text-gray-400 hover:text-red-600 transition-colors px-3 py-2 disabled:opacity-50"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    disabled={isLoggingOut}
                    aria-label="Ausloggen"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
              <MobileNavLink to="/" isActive={isActive('/')} onClick={() => setIsMenuOpen(false)}>
                    Startseite
              </MobileNavLink>
              <MobileNavLink to="/suche" isActive={isActive('/suche')} onClick={() => setIsMenuOpen(false)}>
                    Betreuer finden
              </MobileNavLink>
              <MobileNavLink 
                to="/registrieren?type=caregiver"
                isActive={isActive('/registrieren?type=caregiver')}
                onClick={() => setIsMenuOpen(false)}
              >
                    Betreuer werden
              </MobileNavLink>
              <MobileNavLink 
                to="/mitgliedschaften" 
                isActive={isActive('/mitgliedschaften') || isActive('/preise')} 
                onClick={() => setIsMenuOpen(false)}
              >
                    Preise
              </MobileNavLink>
              <div className="pt-2 flex flex-col space-y-2">
                <Link
                  to="/anmelden"
                  className="btn btn-outline w-full justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                      Login
                </Link>
                <Link
                  to="/registrieren"
                  className="btn btn-primary w-full justify-center"
                >
                      Anmelden
                </Link>
              </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
}

function NavLink({ to, isActive, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200',
        isActive
          ? 'border-primary-500 text-gray-900'
          : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
      )}
    >
      {children}
    </Link>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

function MobileNavLink({ to, isActive, onClick, children }: MobileNavLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'block px-3 py-2 rounded-md text-base font-medium',
        isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export default Header;