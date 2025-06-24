import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CookieBanner from '../ui/CookieBanner';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Spezielle Layout-Behandlung für Nachrichten-Seite
  const isMessagesPage = location.pathname.startsWith('/nachrichten');

  return (
    <div className={`flex flex-col ${isMessagesPage ? 'h-screen' : 'min-h-screen'}`}>
      <Header />
      <main className={isMessagesPage ? 'flex-1 overflow-hidden' : 'flex-grow'}>
        {children}
      </main>
      {!isMessagesPage && <Footer />}
      <CookieBanner />
    </div>
  );
}

export default Layout;