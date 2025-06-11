import React, { ReactNode, useEffect, useRef, useState } from 'react';
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
    __n8nChatInstance?: any;
  }
}

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const chatRef = useRef<HTMLDivElement>(null);
  const [chatError, setChatError] = useState<boolean>(false);

  // Check if current page is messages page
  const isMessagesPage = location.pathname.startsWith('/nachrichten');

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

  // Cleanup-Funktion für Chat-Widget (z.B. bei App-Reload)
  useEffect(() => {
    return () => {
      console.log('🧹 Layout unmounting, Chat bleibt erhalten');
    };
  }, []);

  // Chat-Widget nur einmal initialisieren (nicht bei jedem Seitenwechsel)
  useEffect(() => {
    // Debugging: Status prüfen
    console.log('🔍 Chat Status:', {
      initialized: window.__n8nChatInitialized,
      hasInstance: !!window.__n8nChatInstance,
      currentPage: location.pathname + location.search,
      error: chatError
    });

    // Nur initialisieren, wenn noch nicht geschehen und kein Fehler aufgetreten
    if (!window.__n8nChatInitialized && !chatError) {
      console.log('🤖 Initialisiere n8n Chat Widget...');
      
      try {
        const chatInstance = createChat({
          webhookUrl: 'https://auto.larsmacario.de/webhook/2e670011-4790-46c0-b0e4-ce6c9605a82c/chat',
          mode: 'window',
          showWelcomeScreen: true,
          defaultLanguage: 'en',
          // Session-Management deaktivieren um Konflikte zu vermeiden
          // sessionId wird automatisch generiert wenn nicht angegeben
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
            page: location.pathname + location.search,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        });
        
        // Chat-Instanz speichern für spätere Referenz
        window.__n8nChatInstance = chatInstance;
        window.__n8nChatInitialized = true;
        
        console.log('✅ n8n Chat Widget erfolgreich initialisiert');
        setChatError(false);
      } catch (error) {
        console.error('❌ Fehler beim Initialisieren des Chat Widgets:', error);
        console.log('📧 Fallback: Nutze Kontakt-Link statt Chat Widget');
        // Fehler-Status setzen, aber Flag nicht zurücksetzen um weitere Versuche zu vermeiden
        setChatError(true);
      }
    } else if (window.__n8nChatInitialized && !chatError) {
      console.log('🔄 Chat Widget bereits initialisiert, überspringe...');
      
      // Optional: Metadata für aktuelle Seite aktualisieren
      if (window.__n8nChatInstance && typeof window.__n8nChatInstance.updateMetadata === 'function') {
        try {
          window.__n8nChatInstance.updateMetadata({
            page: location.pathname + location.search,
            timestamp: new Date().toISOString()
          });
          console.log('📝 Chat Metadata aktualisiert für:', location.pathname);
        } catch (error) {
          console.warn('⚠️ Fehler beim Aktualisieren der Chat Metadata:', error);
        }
      }
    }
  }, []); // Leeres Dependency-Array = nur beim ersten Mount ausführen

  // Optional: Metadata bei Seitenwechsel aktualisieren (ohne Neuinitialisierung)
  useEffect(() => {
    if (window.__n8nChatInstance && typeof window.__n8nChatInstance.updateMetadata === 'function') {
      window.__n8nChatInstance.updateMetadata({
        page: location.pathname + location.search
      });
    }
  }, [location.pathname, location.search]);

  return (
    <div className={`flex flex-col ${isMessagesPage ? 'h-screen' : 'min-h-screen'}`}>
      <Header />
      <main className={isMessagesPage ? 'flex-1 overflow-hidden' : 'flex-grow'}>
        {children}
      </main>
      {!isMessagesPage && <Footer />}
      <CookieBanner />
      <div id="n8n-chat" ref={chatRef} />
    </div>
  );
}

export default Layout;