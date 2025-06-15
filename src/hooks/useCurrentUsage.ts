import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/auth/AuthContext';

export type FeatureType = 'contact_request' | 'booking_request' | 'profile_view';

interface UseCurrentUsageReturn {
  currentUsage: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCurrentUsage(featureType: FeatureType): UseCurrentUsageReturn {
  const { user } = useAuth();
  const [currentUsage, setCurrentUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUsage = async () => {
    if (!user) {
      setCurrentUsage(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Berechne den Start des aktuellen Monats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let count = 0;

      // Je nach Feature-Type verschiedene Tabellen abfragen
      switch (featureType) {
        case 'contact_request':
          // Zähle Konversationen, die der User in diesem Monat gestartet hat
          const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('owner_id', user.id)
            .gte('created_at', startOfMonth.toISOString());
          
          if (convError) {
            console.error('Error fetching conversations:', convError);
          } else {
            count = conversations?.length || 0;
          }
          break;

        case 'booking_request':
          // Zähle Buchungen, die der User in diesem Monat erstellt hat
          const { data: bookings, error: bookError } = await supabase
            .from('bookings')
            .select('id')
            .eq('caretaker_id', user.id) // Assuming user is caretaker for bookings
            .gte('created_at', startOfMonth.toISOString());
          
          if (bookError) {
            console.error('Error fetching bookings:', bookError);
          } else {
            count = bookings?.length || 0;
          }
          break;

        case 'profile_view':
          // Für Profile Views verwenden wir eine Mock-Implementierung
          // da wir noch keine Tracking-Tabelle haben
          count = Math.floor(Math.random() * 10); // Mock-Wert
          break;

        default:
          count = 0;
      }

      setCurrentUsage(count);
    } catch (err) {
      console.error('Unexpected error fetching usage:', err);
      setError('Unerwarteter Fehler beim Laden der Nutzungsdaten');
      setCurrentUsage(0);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchCurrentUsage();
  };

  useEffect(() => {
    fetchCurrentUsage();
  }, [user, featureType]);

  return {
    currentUsage,
    isLoading,
    error,
    refresh
  };
}

// Default export für Kompatibilität mit SearchPage
export default useCurrentUsage; 