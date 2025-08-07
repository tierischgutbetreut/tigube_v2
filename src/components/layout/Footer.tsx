import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#5A6B4B] bg-opacity-75 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo und Beschreibung */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img src="/Image/Logos/tigube_logo.png" alt="tigube Logo" className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed">
              Deutschlands vertrauensvolle Plattform für professionelle Tierbetreuung. Finde den perfekten Betreuer für deinen Liebling oder werde selbst Teil unserer Gemeinschaft.
            </p>
            <div className="flex space-x-3 mt-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Für Tierbesitzer */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Für Tierbesitzer</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/betreuer-finden">Betreuer finden</FooterLink></li>
              <li><FooterLink to="/wie-funktioniert">Wie es funktioniert</FooterLink></li>
              <li><FooterLink to="/preise">Preise</FooterLink></li>
              <li><FooterLink to="/hilfe">FAQ</FooterLink></li>
            </ul>
          </div>

          {/* Für Betreuer */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Für Betreuer</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/betreuer-werden">Betreuer werden</FooterLink></li>
              <li><FooterLink to="/voraussetzungen">Voraussetzungen</FooterLink></li>
              <li><FooterLink to="/ressourcen">Ressourcen</FooterLink></li>
              <li><FooterLink to="/betreuer-faq">Betreuer-FAQ</FooterLink></li>
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Unternehmen</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/ueber-uns">Über uns</FooterLink></li>
              <li><FooterLink to="/kontakt">Kontakt</FooterLink></li>
              <li><FooterLink to="/impressum">Impressum</FooterLink></li>
              <li><FooterLink to="/datenschutz">Datenschutz</FooterLink></li>
              <li><FooterLink to="/agb">AGB</FooterLink></li>
            </ul>
          </div>
        </div>
        
        <hr className="my-8 border-gray-600" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-300">
            &copy; {currentYear} tigube. Alle Rechte vorbehalten.
          </p>
          <p className="text-sm text-gray-300 mt-2 md:mt-0 flex items-center">
            Mit <Heart size={14} className="mx-1 text-[#a21b18]" /> gemacht in Moos & Hamburg
          </p>
        </div>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  to: string;
  children: React.ReactNode;
}

function FooterLink({ to, children }: FooterLinkProps) {
  return (
    <Link 
      to={to} 
      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
    >
      {children}
    </Link>
  );
}

export default Footer;