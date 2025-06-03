import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PawPrint as Paw } from 'lucide-react';
import { cn } from '../../lib/utils';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
            <NavLink to="/" isActive={isActive('/')}>
              Startseite
            </NavLink>
            <NavLink to="/launch" isActive={isActive('/launch')}>
              Launch
            </NavLink>
            <NavLink to="/suche" isActive={isActive('/suche')}>
            Betreuer finden
            </NavLink>
            <NavLink to="/registrieren?type=caregiver" isActive={isActive('/registrieren?type=caregiver')}>
            Betreuer werden
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
              <MobileNavLink to="/" isActive={isActive('/')} onClick={() => setIsMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink to="/launch" isActive={isActive('/launch')} onClick={() => setIsMenuOpen(false)}>
                Launch
              </MobileNavLink>
              <MobileNavLink to="/suche" isActive={isActive('/suche')} onClick={() => setIsMenuOpen(false)}>
                Find Caregivers
              </MobileNavLink>
              <MobileNavLink 
                to="/registrieren?type=caregiver"
                isActive={isActive('/registrieren?type=caregiver')}
                onClick={() => setIsMenuOpen(false)}
              >
                Become a Caregiver
              </MobileNavLink>
              <div className="pt-2 flex flex-col space-y-2">
                <Link
                  to="/anmelden"
                  className="btn btn-outline w-full justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/registrieren"
                  className="btn btn-primary w-full justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
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