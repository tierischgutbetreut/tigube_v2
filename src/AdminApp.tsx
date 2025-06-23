import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth/AuthContext';
import { NotificationProvider } from './lib/notifications/NotificationContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy loaded admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

function AdminApp() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/*" element={<AdminDashboardPage />} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Routes>
        </Suspense>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default AdminApp; 