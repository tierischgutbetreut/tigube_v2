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
              <Paw className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold text-white">PetPal</span>
            </Link>
            <p className="mt-4 text-sm">
              Connecting pet owners with loving caregivers since 2023. Trusted, verified, and passionate pet care.
            </p>
            <div className="mt-6 flex space-x-4">
              <SocialLink href="#" icon={<Facebook size={20} />} />
              <SocialLink href="#" icon={<Instagram size={20} />} />
              <SocialLink href="#" icon={<Twitter size={20} />} />
            </div>
          </div>

          {/* For Pet Owners */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">For Pet Owners</h3>
            <ul className="space-y-2">
              <FooterLink to="/search">Find a Caregiver</FooterLink>
              <FooterLink to="/how-it-works">How It Works</FooterLink>
              <FooterLink to="/pricing">Pricing</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
            </ul>
          </div>

          {/* For Caregivers */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">For Caregivers</h3>
            <ul className="space-y-2">
              <FooterLink to="/register?type=caregiver">Become a Caregiver</FooterLink>
              <FooterLink to="/caregiver-requirements">Requirements</FooterLink>
              <FooterLink to="/caregiver-resources">Resources</FooterLink>
              <FooterLink to="/caregiver-faq">Caregiver FAQ</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/terms">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>
        
        <hr className="my-8 border-gray-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} PetPal. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mt-2 md:mt-0 flex items-center">
            Made with <Heart size={14} className="mx-1 text-primary-400" /> in Berlin, Germany
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