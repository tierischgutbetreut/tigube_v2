import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/auth/AuthContext';
import { NotificationProvider } from './lib/notifications/NotificationContext';
import { ShortTermAvailabilityProvider } from './contexts/ShortTermAvailabilityContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ShortTermAvailabilityProvider>
            <App />
          </ShortTermAvailabilityProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);