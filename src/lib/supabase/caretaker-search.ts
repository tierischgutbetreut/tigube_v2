import { supabase } from './client';
import type { CaretakerSearchResult } from './database.types';

export interface SearchFilters {
  petType?: string;
  service?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  availabilityDay?: string;
  availabilityTime?: string;
  minRating?: string;
  radius?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Interface für die Anzeige in der UI (basierend auf der alten CaretakerResult)
export interface CaretakerDisplayData {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  services: string[];
  bio: string;
  verified: boolean;
}

/**
 * Konvertiert View-Daten in ein UI-freundliches Format
 */
function transformCaretakerData(viewData: CaretakerSearchResult): CaretakerDisplayData {
  console.log('🔄 Transforming view data:', viewData);
  
  const firstName = viewData.first_name || '';
  // full_name kommt bereits korrekt formatiert aus der View (Vorname + N.)
  const fullName = viewData.full_name || firstName || 'Unbekannt';
  
  // Services korrekt verarbeiten - kann JSON string oder Array sein
  let services: string[] = [];
  try {
    if (viewData.services) {
      if (Array.isArray(viewData.services)) {
        services = (viewData.services as string[]).filter(s => typeof s === 'string');
      } else if (typeof viewData.services === 'string') {
        // Falls es ein JSON string ist, parsen
        services = JSON.parse(viewData.services).filter((s: any) => typeof s === 'string');
      } else {
        // Falls es ein Object ist (JSON), direkt verwenden
        services = Object.values(viewData.services).filter(s => typeof s === 'string') as string[];
      }
    }
  } catch (error) {
    console.warn('⚠️ Error parsing services:', error, 'Original value:', viewData.services);
    services = [];
  }
  
  const result = {
    id: viewData.id || '',
    name: fullName,
    avatar: viewData.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'U')}&background=f3f4f6&color=374151`,
    location: viewData.city && viewData.plz ? `${viewData.city} ${viewData.plz}` : (viewData.city || 'Unbekannt'),
    rating: Number(viewData.rating) || 0,
    reviewCount: viewData.review_count || 0,
    hourlyRate: Number(viewData.hourly_rate) || 0,
    services: services,
    bio: viewData.short_about_me || viewData.long_about_me || 'Keine Beschreibung verfügbar.',
    verified: viewData.is_verified || false,
  };
  
  console.log('✅ Transformed result:', result);
  return result;
}

/**
 * Sucht nach Tierbetreuern mithilfe des caretaker_search_view
 * Der View kombiniert automatisch Daten aus users und caretaker_profiles
 */
export async function searchCaretakers(filters?: SearchFilters): Promise<CaretakerDisplayData[]> {
  console.log('🔍 Starting caretaker search with filters:', filters);

  try {
    let query = supabase
      .from('caretaker_search_view')
      .select('*');

    // Optional: Standort-Filter
    if (filters?.location) {
      const location = filters.location.toLowerCase();
      console.log('📍 Adding location filter:', location);
      query = query.or(`city.ilike.%${location}%,plz.ilike.%${location}%`);
    }

    // Optional: Preis-Filter
    if (filters?.minPrice !== undefined) {
      console.log('💰 Adding min price filter:', filters.minPrice);
      query = query.gte('hourly_rate', filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      console.log('💰 Adding max price filter:', filters.maxPrice);
      query = query.lte('hourly_rate', filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error searching caretakers:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No caretakers found');
      return [];
    }

    console.log(`✅ Found ${data.length} caretakers from database`);

    // Transformiere die Daten für die UI
    let transformedData = data.map(transformCaretakerData);

    // Client-seitige Filterung für service (da PostgreSQL JSON-Array-Suche kompliziert ist)
    if (filters?.service) {
      console.log('🔧 Applying client-side service filter:', filters.service);
      transformedData = transformedData.filter(caretaker => {
        return caretaker.services.includes(filters.service!);
      });
      console.log(`🔧 After service filter: ${transformedData.length} caretakers`);
    }

    // Client-seitige Filterung für petType (da wir noch keine pet_types in der DB haben)
    if (filters?.petType) {
      console.log('🐾 Applying client-side pet type filter:', filters.petType);
      transformedData = transformedData.filter(caretaker => {
        // Vereinfachte Logik: Wenn Tierart "Hund" ist, schauen wir nach hunde-bezogenen Services
        if (filters.petType === 'Hund') {
          return caretaker.services.some(service => 
            service.toLowerCase().includes('hund') || 
            service.toLowerCase().includes('gassi')
          );
        }
        if (filters.petType === 'Katze') {
          return caretaker.services.some(service => 
            service.toLowerCase().includes('katze')
          );
        }
        // Für andere Tierarten oder "Alle Tiere" alle anzeigen
        return true;
      });
      console.log(`🐾 After pet type filter: ${transformedData.length} caretakers`);
    }

    console.log(`🎯 Final result: ${transformedData.length} caretakers`);
    return transformedData;
  } catch (error) {
    console.error('❌ Exception in searchCaretakers:', error);
    throw error;
  }
}

/**
 * Holt einen spezifischen Tierbetreuer nach ID
 */
export async function getCaretakerById(id: string): Promise<CaretakerDisplayData | null> {
  console.log('🔍 Getting caretaker by ID:', id);

  try {
    const { data, error } = await supabase
      .from('caretaker_search_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error getting caretaker:', error);
      throw error;
    }

    console.log('✅ Found caretaker:', data);
    return data ? transformCaretakerData(data) : null;
  } catch (error) {
    console.error('❌ Exception in getCaretakerById:', error);
    throw error;
  }
}

export const getAvailableServices = async (): Promise<{
  data: string[];
  error: any;
}> => {
  try {
    const { data: profiles, error } = await supabase
      .from('caretaker_profiles')
      .select('services')
      .not('services', 'is', null);

    if (error) {
      return { data: [], error };
    }

    const allServices = new Set<string>();
    profiles?.forEach(profile => {
      if (Array.isArray(profile.services)) {
        profile.services.forEach(service => {
          if (typeof service === 'string') {
            allServices.add(service);
          }
        });
      }
    });

    return { data: Array.from(allServices), error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}; 