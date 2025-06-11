import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOwner?: boolean;
  requireCaretaker?: boolean;
}

function ProtectedRoute({ children, requireOwner = false, requireCaretaker = false }: ProtectedRouteProps) {
  const { isAuthenticated, userProfile, loading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
      console.log('🛡️ ProtectedRoute state check:', {
          loading,
          isAuthenticated,
          user: !!user,
          userProfile: !!userProfile,
          userType: userProfile?.user_type,
          requireOwner,
          requireCaretaker
      });

      if (!loading && isAuthenticated && requireOwner && userProfile === null) {
          console.warn('⚠️ ProtectedRoute: User authenticated, but profile is null and owner required. This might indicate a profile loading issue.');
      }
       if (!loading && isAuthenticated && requireOwner && userProfile?.user_type !== 'owner') {
           console.warn('⚠️ ProtectedRoute: User authenticated, owner required, but userType is not owner or profile incomplete.', userProfile?.user_type);
       }
       if (!loading && isAuthenticated && requireCaretaker && userProfile?.user_type !== 'caretaker') {
           console.warn('⚠️ ProtectedRoute: User authenticated, caretaker required, but userType is not caretaker or profile incomplete.', userProfile?.user_type);
       }

  }, [loading, isAuthenticated, userProfile, user, requireOwner, requireCaretaker]); // Log state changes


  if (loading) {
      console.log('🛡️ ProtectedRoute: Showing loading spinner.');
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Not authenticated, redirecting to login.');
    // Redirect to login page with return url
    return <Navigate to="/anmelden" state={{ from: location }} replace />;
  }

  // User is authenticated
  if (requireOwner) {
      console.log('🛡️ ProtectedRoute: Authenticated, checking owner requirement.', { userType: userProfile?.user_type });
      // Wait for userProfile to be loaded if owner is required
      if (userProfile === null && !loading) {
          console.log('🛡️ ProtectedRoute: Waiting for userProfile...');
          // Zeige einen Lade-Spinner statt null
          return <LoadingSpinner />;
      }

      if (userProfile?.user_type !== 'owner') {
          console.log('🛡️ ProtectedRoute: Authenticated, but not owner. Redirecting to /.', userProfile?.user_type);
          // Redirect non-owners away from owner-only pages
          return <Navigate to="/" replace />;
      }
       console.log('🛡️ ProtectedRoute: Authenticated and owner. Granting access.');
  }

  if (requireCaretaker) {
      console.log('🛡️ ProtectedRoute: Authenticated, checking caretaker requirement.', { userType: userProfile?.user_type });
      // Wait for userProfile to be loaded if caretaker is required
      if (userProfile === null && !loading) {
          console.log('🛡️ ProtectedRoute: Waiting for userProfile...');
          // Zeige einen Lade-Spinner statt null
          return <LoadingSpinner />;
      }

      if (userProfile?.user_type !== 'caretaker') {
          console.log('🛡️ ProtectedRoute: Authenticated, but not caretaker. Redirecting to /.', userProfile?.user_type);
          // Redirect non-caretakers away from caretaker-only pages
          return <Navigate to="/" replace />;
      }
       console.log('🛡️ ProtectedRoute: Authenticated and caretaker. Granting access.');
  }

  // If not requireOwner or requireCaretaker, or if requirements are met
  return <>{children}</>;
}

export default ProtectedRoute; 