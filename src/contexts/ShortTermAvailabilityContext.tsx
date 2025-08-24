import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { caretakerProfileService } from '../lib/supabase/db';

interface ShortTermAvailabilityContextType {
  shortTermAvailable: boolean;
  setShortTermAvailable: (available: boolean) => void;
  loading: boolean;
}

const ShortTermAvailabilityContext = createContext<ShortTermAvailabilityContextType | undefined>(undefined);

export const useShortTermAvailability = () => {
  const context = useContext(ShortTermAvailabilityContext);
  if (context === undefined) {
    throw new Error('useShortTermAvailability must be used within a ShortTermAvailabilityProvider');
  }
  return context;
};

interface ShortTermAvailabilityProviderProps {
  children: ReactNode;
}

export const ShortTermAvailabilityProvider: React.FC<ShortTermAvailabilityProviderProps> = ({ children }) => {
  const [shortTermAvailable, setShortTermAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Lade den short_term_available Status aus der Datenbank wenn sich der User ändert
  useEffect(() => {
    const loadShortTermAvailability = async () => {
      if (!user) {
        setShortTermAvailable(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await caretakerProfileService.getProfile(user.id);
        if (error) {
          console.error('Fehler beim Laden der Kurzfristig-Verfügbar Option:', error);
          setShortTermAvailable(false);
        } else if (data) {
          setShortTermAvailable((data as any).short_term_available || false);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Kurzfristig-Verfügbar Option:', error);
        setShortTermAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    loadShortTermAvailability();
  }, [user]);

  return (
    <ShortTermAvailabilityContext.Provider value={{ shortTermAvailable, setShortTermAvailable, loading }}>
      {children}
    </ShortTermAvailabilityContext.Provider>
  );
};