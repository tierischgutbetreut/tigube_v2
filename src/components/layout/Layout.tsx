import React, { ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CookieBanner from '../ui/CookieBanner';

// n8n Chat importieren
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

// Window-Typ für n8n-Chat-Init-Flag erweitern
declare global {
  interface Window {
    __n8nChatInitialized?: boolean;
  }
}

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const chatRef = useRef<HTMLDivElement>(null);

  // CSS-Variablen für das Chat-Branding (nur einmal setzen)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--chat--color-primary', '#5A6B4B');
    root.style.setProperty('--chat--color-secondary', '#2563eb');
    root.style.setProperty('--chat--toggle--size', '56px');
    root.style.setProperty('--chat--window--width', '420px');
    root.style.setProperty('--chat--window--height', '620px');
    root.style.setProperty('--chat--border-radius', '0.75rem');
    root.style.setProperty('--chat--message--font-size', '0.88rem');
    root.style.setProperty('--chat--heading--font-size', '1.1em');
  }, []);

  // Chat-Widget bei jedem Seitenwechsel neu initialisieren
  useEffect(() => {
    // Vorheriges Widget entfernen (falls vorhanden)
    const chatContainer = document.getElementById('n8n-chat');
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }
    window.__n8nChatInitialized = false;

    createChat({
      webhookUrl: 'https://auto.larsmacario.de/webhook/2e670011-4790-46c0-b0e4-ce6c9605a82c/chat',
      mode: 'window',
      showWelcomeScreen: true,
      defaultLanguage: 'en',
      initialMessages: [
        'Hey! 👋',
        'Wie kann ich dir helfen? Sende uns Feedback oder Aufgaben direkt hier.'
      ],
      i18n: {
        en: {
          title: 'Feedback & Aufgaben',
          subtitle: 'Starte einen Chat. Wir sind für dich da!',
          footer: '',
          getStarted: 'Neue Konversation',
          inputPlaceholder: 'Deine Nachricht...',
          closeButtonTooltip: 'Schließen',
        }
      },
      metadata: {
        page: location.pathname + location.search
      }
    });
    window.__n8nChatInitialized = true;
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <CookieBanner />
      <div id="n8n-chat" ref={chatRef} />
    </div>
  );
}

export default Layout;