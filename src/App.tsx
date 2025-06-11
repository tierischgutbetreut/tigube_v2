import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LaunchPage = lazy(() => import('./pages/LaunchPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BetreuerProfilePage = lazy(() => import('./pages/BetreuerProfilePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ImpressumPage = lazy(() => import('./pages/ImpressumPage'));
const DatenschutzPage = lazy(() => import('./pages/DatenschutzPage'));
const AgbPage = lazy(() => import('./pages/AgbPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const OwnerDashboardPage = lazy(() => import('./pages/OwnerDashboardPage'));
const CaretakerDashboardPage = lazy(() => import('./pages/CaretakerDashboardPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const OwnerPublicProfilePage = lazy(() => import('./pages/OwnerPublicProfilePage'));

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/launch" element={<LaunchPage />} />
          <Route path="/suche" element={<SearchPage />} />
          <Route path="/betreuer/:id" element={<BetreuerProfilePage />} />
          <Route path="/registrieren" element={<RegisterPage />} />
          <Route path="/anmelden" element={<LoginPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />
          <Route path="/agb" element={<AgbPage />} />
          <Route path="/ueber-uns" element={<AboutPage />} />
          <Route path="/kontakt" element={<ContactPage />} />
          <Route path="/hilfe" element={<HelpPage />} />
          <Route 
            path="/dashboard-owner" 
            element={
              <ProtectedRoute requireOwner={true}>
                <OwnerDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard-caretaker"
            element={
              <ProtectedRoute requireCaretaker={true}>
                <CaretakerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/nachrichten" 
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nachrichten/:conversationId" 
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner/:userId" 
            element={
              <ProtectedRoute>
                <OwnerPublicProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;