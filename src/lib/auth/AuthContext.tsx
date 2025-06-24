import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { userService } from '../supabase/db';

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
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription] = useState<any | null>(null);
  const [subscriptionLoading] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');

      if (accessToken && refreshToken) {
        // Setze die Session mit den Tokens aus der URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session setzen fehlgeschlagen:', error);
        } else if (data?.user) {
          setUser(data.user);
          // Profil neu laden
          const { data: profile } = await userService.getUserProfile(data.user.id);
          if (mounted && profile) setUserProfile(profile);
        }

        // URL bereinigen
        window.history.replaceState({}, document.title, window.location.pathname);

        // Lade-Status beenden
        setLoading(false);
        return;
      }

      // Fallback: Normale Session holen
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        setUser(session.user);
        const { data: profile } = await userService.getUserProfile(session.user.id);
        if (profile) setUserProfile(profile);
      }
      setLoading(false);
    };

    initAuth();

    // Auth-Event-Listener (optional, für weitere Events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') setUserProfile(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        const { data: profile } = await userService.getUserProfile(data.user.id);
        setUserProfile(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileState = (newProfile: any | null) => {
    setUserProfile(newProfile);
  };

  const refreshSubscription = async () => {
    // Placeholder
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signOut,
        isAuthenticated,
        updateProfileState,
        subscription,
        subscriptionLoading,
        refreshSubscription,
      }}
    >
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