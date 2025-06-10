import { supabase } from './client';
import type { CaretakerSearchResult } from './database.types';

export interface SearchFilters {
  petType?: string;
  service?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
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
  
  const result = {
    id: viewData.id || '',
    name: fullName,
    avatar: viewData.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'U')}&background=f3f4f6&color=374151`,
    location: viewData.city && viewData.plz ? `${viewData.city} ${viewData.plz}` : (viewData.city || 'Unbekannt'),
    rating: Number(viewData.rating) || 0,
    reviewCount: viewData.review_count || 0,
    hourlyRate: Number(viewData.hourly_rate) || 0,
    services: Array.isArray(viewData.services) ? (viewData.services as string[]).filter(s => typeof s === 'string') : [],
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

    // Optional: Service-Filter (falls services als JSON-Array gespeichert ist)
    if (filters?.service) {
      console.log('🔧 Adding service filter:', filters.service);
      query = query.contains('services', [filters.service]);
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

    console.log(`✅ Found ${data.length} caretakers`);

    // Transformiere die Daten für die UI
    const transformedData = data.map(transformCaretakerData);
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