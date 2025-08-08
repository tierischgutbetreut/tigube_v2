import { supabase } from './client';

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
  prices?: Record<string, number | string>; // Service-spezifische Preise
  services: string[];
  bio: string;
  verified: boolean;
  isCommercial: boolean;
}

/**
 * Berechnet den besten/niedrigsten Preis aus den verfügbaren Service-Preisen
 */
function getBestPrice(prices: Record<string, number | string>): number {
  if (!prices || Object.keys(prices).length === 0) return 0;
  
  const numericPrices = Object.values(prices)
    .filter(price => price !== '' && price !== null && price !== undefined) // Filtere leere Strings und null/undefined
    .map(price => {
      const num = typeof price === 'string' ? parseFloat(price) : price;
      return isNaN(num) ? 0 : num;
    })
    .filter(price => price > 0);
  
  return numericPrices.length > 0 ? Math.min(...numericPrices) : 0;
}

/**
 * Konvertiert View-Daten in ein UI-freundliches Format
 */
interface CaretakerJoinRow {
  id: string;
  services: any;
  prices: Record<string, any> | null;
  hourly_rate: number | null;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
  short_about_me: string | null;
  long_about_me: string | null;
  is_commercial: boolean | null;
  languages?: string[] | null;
  home_photos?: string[] | null;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    city: string | null;
    plz: string | null;
    profile_photo_url: string | null;
    user_type?: string | null;
  };
}

function transformCaretakerData(viewData: CaretakerJoinRow): CaretakerDisplayData {
  console.log('🔄 Transforming joined data:', viewData);

  const firstName = viewData.users?.first_name || '';
  const lastName = viewData.users?.last_name || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName[0]}.` : (firstName || 'Unbekannt');

  // Services korrekt verarbeiten - kann JSON string oder Array sein
  let services: string[] = [];
  try {
    const rawServices = viewData.services;
    if (rawServices) {
      if (Array.isArray(rawServices)) {
        services = (rawServices as string[]).filter(s => typeof s === 'string');
      } else if (typeof rawServices === 'string') {
        services = JSON.parse(rawServices).filter((s: any) => typeof s === 'string');
      } else if (typeof rawServices === 'object') {
        services = Object.values(rawServices).filter(s => typeof s === 'string') as string[];
      }
    }
  } catch (error) {
    console.warn('⚠️ Error parsing services:', error, 'Original value:', viewData.services);
    services = [];
  }

  // Preise verarbeiten - kann JSON object sein
  let prices: Record<string, number | string> = {};
  try {
    if (viewData.prices && typeof viewData.prices === 'object') {
      prices = viewData.prices as Record<string, number | string>;
    }
  } catch (error) {
    console.warn('⚠️ Error parsing prices:', error, 'Original value:', viewData.prices);
    prices = {};
  }

  const bestPrice = getBestPrice(prices) || Number(viewData.hourly_rate) || 0;

  const result: CaretakerDisplayData = {
    id: viewData.id || '',
    name: fullName,
    avatar: viewData.users?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'U')}&background=f3f4f6&color=374151`,
    location: viewData.users?.city && viewData.users?.plz ? `${viewData.users.city} ${viewData.users.plz}` : (viewData.users?.city || 'Unbekannt'),
    rating: Number(viewData.rating) || 0,
    reviewCount: viewData.review_count || 0,
    hourlyRate: bestPrice,
    prices: prices,
    services: services,
    bio: viewData.short_about_me || viewData.long_about_me || 'Keine Beschreibung verfügbar.',
    verified: viewData.is_verified || false,
    isCommercial: viewData.is_commercial || false,
  };

  console.log('✅ Transformed result:', result);
  console.log('🎯 Prices data:', {
    original_prices: viewData.prices,
    parsed_prices: prices,
    hourly_rate: viewData.hourly_rate,
    final_hourly_rate: result.hourlyRate
  });
  return result;
}

/**
 * Sucht nach Tierbetreuern mithilfe des caretaker_search_view
 * Der View kombiniert automatisch Daten aus users und caretaker_profiles
 */
export async function searchCaretakers(filters?: SearchFilters): Promise<CaretakerDisplayData[]> {
  console.log('🔍 Starting caretaker search with filters:', filters);

  try {
    // Direkt über caretaker_profiles + Join auf users (ohne View)
    let query = supabase
      .from('caretaker_profiles')
      .select(`
        id,
        services,
        prices,
        hourly_rate,
        rating,
        review_count,
        is_verified,
        short_about_me,
        long_about_me,
        is_commercial,
        users!inner(
          id,
          first_name,
          last_name,
          city,
          plz,
          profile_photo_url,
          user_type
        )
      `)
      .eq('users.user_type', 'caretaker');

    // Optional: Standort-Filter
    if (filters?.location) {
      const location = filters.location.toLowerCase();
      console.log('📍 Adding location filter:', location);
      query = query.or(`users.city.ilike.%${location}%,users.plz.ilike.%${location}%`);
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
    let transformedData = (data as unknown as CaretakerJoinRow[]).map(item => transformCaretakerData(item));

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
      .from('caretaker_profiles')
      .select(`
        id,
        services,
        prices,
        hourly_rate,
        rating,
        review_count,
        is_verified,
        short_about_me,
        long_about_me,
        is_commercial,
        users!inner(
          id,
          first_name,
          last_name,
          city,
          plz,
          profile_photo_url,
          user_type
        )
      `)
      .eq('id', id)
      .eq('users.user_type', 'caretaker')
      .single();

    if (error) {
      console.error('❌ Error getting caretaker:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    console.log('✅ Found caretaker:', data);
    return transformCaretakerData(data as unknown as CaretakerJoinRow);
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