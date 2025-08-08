import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, auth } from '../supabase/client';
import { userService } from '../supabase/db';
import { SubscriptionService } from '../services/subscriptionService';

// Cross-Tab-Logout-Konstanten
const LOGOUT_BROADCAST_CHANNEL = 'tigube_logout';
const LOGOUT_STORAGE_KEY = 'tigube_logout_signal';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  updateProfileState: (newProfile: any | null) => void;
  subscription: any | null;
  subscriptionLoading: boolean;
  refreshSubscription: (forceSync?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // Overall loading state
  const [subscription, setSubscription] = useState<any | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const isAuthenticated = !!user; // Derived state

  // Cross-Tab-Logout-Funktionen
  const broadcastLogout = useCallback(() => {
    try {
      // Versuche BroadcastChannel API (moderne Browser)
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(LOGOUT_BROADCAST_CHANNEL);
        channel.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
        channel.close();
        console.log('📡 Logout broadcast sent via BroadcastChannel');
      } else {
        // Fallback zu localStorage Event (für ältere Browser)
        localStorage.setItem(LOGOUT_STORAGE_KEY, Date.now().toString());
        // Entferne den Key sofort wieder (localStorage Event wird trotzdem gefeuert)
        localStorage.removeItem(LOGOUT_STORAGE_KEY);
        console.log('📡 Logout broadcast sent via localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to broadcast logout:', error);
    }
  }, []);

  const handleCrossTabLogout = useCallback(async () => {
    console.log('🔄 Cross-tab logout detected, signing out...');
    
    // Prüfe ob wir überhaupt eingeloggt sind (verhindert unnötige Aktionen)
    if (!user) {
      console.log('👍 Already logged out, ignoring cross-tab logout signal');
      return;
    }
    
    setLoading(true);
    setUser(null);
    setUserProfile(null);
    setSubscription(null);
    
    try {
      // Stille Logout ohne Broadcast (um Endlosschleife zu vermeiden)
      await supabase.auth.signOut();
      console.log('✅ Cross-tab logout completed');
    } catch (error) {
      console.error('❌ Error during cross-tab logout:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cross-Tab-Logout-Listener
  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;
    
    const setupCrossTabLogout = () => {
      try {
        // Versuche BroadcastChannel API
        if (typeof BroadcastChannel !== 'undefined') {
          broadcastChannel = new BroadcastChannel(LOGOUT_BROADCAST_CHANNEL);
          broadcastChannel.addEventListener('message', (event) => {
            if (event.data?.type === 'LOGOUT') {
              console.log('📡 Received logout broadcast via BroadcastChannel');
              handleCrossTabLogout();
            }
          });
          console.log('✅ BroadcastChannel logout listener setup');
        } else {
          // Fallback zu localStorage Event
          const handleStorageChange = (event: StorageEvent) => {
            if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
              console.log('📡 Received logout broadcast via localStorage');
              handleCrossTabLogout();
            }
          };
          
          window.addEventListener('storage', handleStorageChange);
          console.log('✅ localStorage logout listener setup');
          
          // Cleanup function für localStorage
          return () => {
            window.removeEventListener('storage', handleStorageChange);
          };
        }
      } catch (error) {
        console.error('❌ Failed to setup cross-tab logout listener:', error);
      }
    };

    const cleanup = setupCrossTabLogout();

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [handleCrossTabLogout]);

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
          
          // Lade Subscription-Daten
          try {
            const userSubscription = await SubscriptionService.getActiveSubscription(userId);
            setSubscription(userSubscription);
            console.log('✅ Subscription loaded:', userSubscription);
          } catch (error) {
            console.error('❌ Failed to load subscription:', error);
            setSubscription(null);
          }
          
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
  // Dieser Effect sorgt dafür, dass das Profil geladen wird, wenn der User verfügbar ist aber das Profil fehlt
  // Das passiert z.B. beim direkten Navigieren zu Dashboard-Seiten
  useEffect(() => {
    let mounted = true;
    console.log('✨ AuthContext user state change profile load effect.');
    console.log('🔍 User state change effect deps:', { user: !!user, userProfile: !!userProfile, loading });

    const loadProfileIfMissing = async () => {
       if (user && !userProfile && mounted && !loading) { 
          console.log('🔍 User exists but profile missing. Loading profile...', user.id);
          // Setze Loading-State temporär um Race-Conditions zu vermeiden
          setLoading(true);
          try {
            await loadUserProfile(user.id);
          } finally {
            if (mounted) setLoading(false);
          }
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

  }, [user, userProfile, loading, loadUserProfile]); // Depend on user, userProfile, loading, and loadUserProfile


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
    setSubscription(null); // Clear subscription data
    
    try {
      // Benachrichtige alle anderen Tabs BEVOR der eigentliche Logout
      console.log('📡 Broadcasting logout to all tabs...');
      broadcastLogout();
      
      const { error } = await auth.signOut();
      if (error) {
        console.error('Logout-Fehler:', error);
        throw error;
      }
      
      console.log('✅ Successfully signed out');
      // onAuthStateChange listener will fire, setting user to null, which triggers Effect 3 to clear profile
      // (Effect 3 removed, clearing is now explicit or handled by state reset on user null)
       setUser(null); // Explicitly clear user state
       setUserProfile(null); // Explicitly clear profile state
       setSubscription(null); // Clear subscription data

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
    console.log('📊 Current userProfile before update:', userProfile);

    // Verhindere, dass die UI zwischenzeitlich null rendert:
    // Mergen wir das neue Profil mit dem alten, wo sinnvoll, statt komplett null zu setzen
    if (newProfile === null && userProfile) {
      // Ignoriere Null-Updates, wenn bereits ein Profil vorhanden ist
      console.warn('⚠️ Ignoring transient null profile update to avoid UI flicker.');
      return;
    }

    // Robuste State-Aktualisierung
    setUserProfile(newProfile);

    // Zusätzlicher State-Update nach kurzer Verzögerung um React zu zwingen
    setTimeout(() => {
      setUserProfile(newProfile);
      console.log('✅ Profile state force-updated:', newProfile?.first_name);
    }, 50);

    console.log('✅ Profile state update completed');
  };

  // Subscription refresh function
  const refreshSubscription = useCallback(async (forceSync?: boolean) => {
    if (!user?.id) return;

    setSubscriptionLoading(true);
    try {
      console.log('🔄 Refreshing user subscription from users table...');

      // Neue vereinfachte Methode - holt Daten direkt aus users-Tabelle
      const subscription = await SubscriptionService.getUserSubscription(user.id);
      setSubscription(subscription);
      console.log('✅ User subscription refreshed:', subscription);
    } catch (error) {
      console.error('❌ Failed to refresh user subscription:', error);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user?.id]);

  // Real-time subscription listener
  useEffect(() => {
    if (!user?.id) return;

    console.log('🎯 Setting up real-time user plan listener for user:', user.id);

    // Subscribe nur zu user changes (da subscription-Daten jetzt in users-Tabelle)
    const subscriptionChannel = supabase
      .channel(`user_plan_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 User table change (plan related):', payload);
          // Check if plan-related fields changed
          const { new: newUser, old: oldUser } = payload;
          const planFields = ['plan_type', 'plan_expires_at', 'premium_badge', 'show_ads', 'max_contact_requests', 'max_bookings', 'search_priority'];
          
          const hasPlanChange = planFields.some(field => 
            newUser[field] !== oldUser[field]
          );
          
          if (hasPlanChange) {
            console.log('🔄 Plan-related user fields changed, refreshing...');
            refreshSubscription();
            
            // Also refresh user profile to get updated fields
            if (userProfile) {
              loadUserProfile(user.id);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time user plan status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up real-time user plan listener');
      subscriptionChannel.unsubscribe();
    };
  }, [user?.id, refreshSubscription, userProfile]);

  const value: AuthContextType = {
    user,
    userProfile,
    loading, // Use the single, overall loading state
    signIn,
    signOut,
    isAuthenticated,
    updateProfileState,
    subscription,
    subscriptionLoading,
    refreshSubscription,
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