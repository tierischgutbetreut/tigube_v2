import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Heart, PawPrint as Paw } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/Image/tigube_logo_klein.png" alt="TiGuBe Logo" className="h-10 w-auto" />
            </Link>
            <p className="mt-4 text-sm">
            Deutschlands vertrauensvolle Plattform für professionelle Tierbetreuung. Finden Sie den perfekten Betreuer für Ihren Liebling oder werden Sie selbst Teil unserer Gemeinschaft.
            </p>
            <div className="mt-6 flex space-x-4">
              <SocialLink href="#" icon={<Facebook size={20} />} />
              <SocialLink href="#" icon={<Instagram size={20} />} />
            </div>
          </div>

          {/* Für Tierbesitzer */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Für Tierbesitzer</h3>
            <ul className="space-y-2">
              <FooterLink to="/search">Betreuer finden</FooterLink>
              <FooterLink to="/how-it-works">Wie es funktioniert</FooterLink>
              <FooterLink to="/pricing">Preise</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
            </ul>
          </div>

          {/* Für Betreuer */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Für Betreuer</h3>
            <ul className="space-y-2">
              <FooterLink to="/register?type=caregiver">Betreuer werden</FooterLink>
              <FooterLink to="/caregiver-requirements">Voraussetzungen</FooterLink>
              <FooterLink to="/caregiver-resources">Ressourcen</FooterLink>
              <FooterLink to="/caregiver-faq">Betreuer-FAQ</FooterLink>
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Unternehmen</h3>
            <ul className="space-y-2">
              <FooterLink to="/about">Über uns</FooterLink>
              <FooterLink to="/contact">Kontakt</FooterLink>
              <FooterLink to="/privacy">Datenschutz</FooterLink>
              <FooterLink to="/terms">AGB</FooterLink>
            </ul>
          </div>
        </div>
        
        <hr className="my-8 border-gray-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} TiGuBe. Alle Rechte vorbehalten.
          </p>
          <p className="text-sm text-gray-400 mt-2 md:mt-0 flex items-center">
            Mit <Heart size={14} className="mx-1 text-primary-400" /> gemacht in Moos
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
    <li>
      <Link 
        to={to} 
        className="text-gray-400 hover:text-primary-400 transition-colors duration-200"
      >
        {children}
      </Link>
    </li>
  );
}

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
}

function SocialLink({ href, icon }: SocialLinkProps) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-gray-400 hover:text-primary-400 transition-colors duration-200"
    >
      {icon}
    </a>
  );
}

export default Footer;