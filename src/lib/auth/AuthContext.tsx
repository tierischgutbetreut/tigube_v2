import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, auth } from '../supabase/client';
import { userService } from '../supabase/db';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  updateProfileState: (newProfile: any | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // Overall loading state

  const isAuthenticated = !!user; // Derived state

  // Callback function to load the user profile and update state
  const loadUserProfile = useCallback(async (userId: string) => {
      console.log('🔍 Starting user profile load...', userId);
      setUserProfile(null); // Clear previous profile state while loading
      
      // Verbesserte Profile-Loading mit mehreren Versuchen
      let retryCount = 0;
      const maxRetries = 7;
      let profile = null;
      let profileError = null;

      while (retryCount < maxRetries) {
        if (retryCount > 0) {
           const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 7000);
           console.log(`🔄 Waiting ${delay}ms before profile retry ${retryCount + 1}...`);
           await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await userService.getUserProfile(userId);
        profile = result.data;
        profileError = result.error;

        if (profileError) {
          console.error(`❌ Profile loading error (attempt ${retryCount + 1}):`, profileError);
        } else if (profile) {
          console.log('✅ Profile loaded successfully:', profile);
          setUserProfile(profile); // *** Set profile state on success ***
          console.log('✅ setUserProfile called with profile:', profile);
          return { data: profile, error: null }; // Return success early
        } else {
          console.warn('⚠️ Profile is null but no error during profile load loop');
        }
         retryCount++;
      }

      console.error('❌ Profile loading failed after all retries for user:', userId);
      setUserProfile(null); // Ensure profile is null on final failure
      // TODO: Handle case where profile cannot be loaded (e.g., redirect to profile creation)

      return { data: null, error: profileError || new Error('Failed to load profile after retries') };

  }, []); // Dependencies for useCallback


  // Effect 1: Get initial session on mount and load profile if session exists
  useEffect(() => {
    let mounted = true;
    console.log('✨ AuthContext mounted. Starting initial session effect.');

    const getInitialSessionAndProfile = async () => {
      try {
        console.log('🔍 Starting initial session recovery...');
        // Warte kurz um sicherzustellen, dass Supabase bereit ist
        await new Promise(resolve => setTimeout(resolve, 150));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) { console.log('🚫 Mounted check failed during getInitialSessionAndProfile'); return; }

        if (error) {
          console.error('❌ Initial session loading error:', error);
          setUser(null);
          setUserProfile(null);
        } else {
           console.log('🔍 Initial session status:', !!session, session?.user?.id);
           const currentUser = session?.user ?? null;
           setUser(currentUser);

           if (currentUser) {
             // Load profile after getting session
             // loadUserProfile sets the state internally now
             console.log('🔍 Calling loadUserProfile from initial session effect...');
             await loadUserProfile(currentUser.id);
           } else {
             setUserProfile(null);
           }
        }

      } catch (error) {
        console.error('❌ Initial Session initialization failed:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        // Wichtig: Setze Haupt-loading auf false nach initialem Session- UND Profil-Versuch
        console.log('⚙️ Setting main loading to false after initial session and profile attempt.');
        if (mounted) setLoading(false);
      }
    };

    getInitialSessionAndProfile();

    return () => {
      console.log('🧹 Cleaning up initial session effect.');
      mounted = false;
    };
  }, [loadUserProfile]); // Dependency on loadUserProfile callback

  // Effect 2: Listen for auth changes
  useEffect(() => {
      let mounted = true;
      console.log('✨ AuthContext auth change listener effect started.');

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth state changed (from listener):', event, !!session);

          if (!mounted) { console.log('🚫 Mounted check failed during onAuthStateChange listener'); return; }

          const currentUser = session?.user ?? null;
          setUser(currentUser); // Update user state immediately
          // Profile loading will be handled by the effect that depends on the user state
          // or by the signIn/signOut functions
          if (!currentUser) {
              setUserProfile(null); // Clear profile on sign out
          }

          // Note: Loading state handled by Effect 1 on initial load
          // and explicitly by signIn/signOut.
      });

      return () => {
          console.log('🧹 Cleaning up auth change listener effect.');
          mounted = false;
          subscription.unsubscribe();
      };

  }, []); // Empty dependency array: subscription is stable

  // Effect 3: Load profile when user state changes (if not loading already)
  // This effect is now handled within getInitialSessionAndProfile and signIn
  /*
  useEffect(() => {
    let mounted = true;
    console.log('✨ AuthContext user state change profile load effect.');
    console.log('🔍 User state change effect deps:', { user: !!user, userProfile: !!userProfile, loading });

    const loadProfileIfMissing = async () => {
       if (user && !userProfile && mounted && !loading) { // Only load if user exists, profile missing, mounted, and not in overall loading state
          console.log('🔍 User state changed, profile missing. Attempting to load profile...', user.id);
          // We don't set a specific profileLoading here, relying on the overall loading state
          await loadUserProfile(user.id); // loadUserProfile now updates state internally
       } else if (!user && userProfile) {
           console.log('🔍 User signed out, clearing profile.');
           setUserProfile(null); // Ensure profile is cleared if user becomes null
       }
         console.log('🔍 User state change effect finished.', { user: !!user, userProfile: !!userProfile });
    };

    loadProfileIfMissing();

    return () => {
      console.log('🧹 Cleaning up user state change effect.');
      mounted = false;
    };

  }, [user, loadUserProfile, loading]); // Depend on user, loadUserProfile, and loading state
  */


  const signIn = async (email: string, password: string) => {
    setLoading(true); // Set main loading on sign in start
    setUserProfile(null); // Clear profile state before sign in attempt

    try {
      const { error, data } = await auth.signIn(email, password);
      
      if (error) {
         console.error('❌ Sign in failed:', error);
         setUser(null);
         setUserProfile(null);
         throw error;
      } else if (data?.user) {
         console.log('✅ Signed in successfully, user object received.', data.user.id);
         // ** Wait for profile to load before setting loading to false **
         console.log('🔍 Loading user profile after successful sign in...');
         await loadUserProfile(data.user.id);
         console.log('✅ Profile loaded after sign in.');
         setUser(data.user); // Ensure user state is set
      } else {
          // Should not happen if no error
          console.warn('⚠️ Sign in succeeded but no user data received.');
          setUser(null);
          setUserProfile(null);
      }

    } catch (e) {
       console.error('❌ Exception during sign in:', e);
       setUser(null);
       setUserProfile(null);
       throw e; // Re-throw the error so the caller can handle it (e.g., show error message)
    } finally {
      // Set loading to false ONLY after sign in AND profile load attempts
      console.log('⚙️ Setting main loading to false after sign in process.');
      setLoading(false);
    }

    // The return { error } is no longer needed here if we re-throw errors
    // The calling component will handle errors via the catch block
  };

  const signOut = async () => {
    setLoading(true); // Set main loading on sign out start
    setUser(null); // Explicitly clear user state immediately
    setUserProfile(null); // Explicitly clear profile state immediately
    try {
      const { error } = await auth.signOut();
      if (error) {
        console.error('Logout-Fehler:', error);
        throw error;
      }
      // onAuthStateChange listener will fire, setting user to null, which triggers Effect 3 to clear profile
      // (Effect 3 removed, clearing is now explicit or handled by state reset on user null)
       setUser(null); // Explicitly clear user state
       setUserProfile(null); // Explicitly clear profile state

    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
      throw error;
    } finally {
      console.log('⚙️ Setting main loading to false after sign out attempt.');
      setLoading(false); // Set loading to false after the process
    }
  };

  const updateProfileState = (newProfile: any | null) => {
    console.log('🔄 Manually updating profile state:', newProfile);
    setUserProfile(newProfile);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading, // Use the single, overall loading state
    signIn,
    signOut,
    isAuthenticated,
    updateProfileState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 