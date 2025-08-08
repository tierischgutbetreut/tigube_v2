import { supabase } from './client';
import type { Database } from './database.types';

// Typen für die Benutzerregistrierung und -aktualisierung
export type UserRegistration = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'owner' | 'caretaker';
};

export type UserProfileUpdate = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  plz?: string;
  city?: string;
  street?: string;
  profileCompleted?: boolean;
  userType?: 'owner' | 'caretaker';
  profilePhotoUrl?: string;
};

export type PetData = {
  name: string;
  type: string; // Zurück zu 'type' entsprechend schema.sql
  breed?: string;
  birthDate?: string;
  weight?: number;
  photoUrl?: string;
  description?: string;
  gender?: string;
  neutered?: boolean;
};

export type OwnerPreferences = {
  services: string[];
  otherServices?: string;
  vetInfo?: string;
  vetName?: string;
  vetAddress?: string;
  vetPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  careInstructions?: string;
  shareSettings?: ShareSettings;
};

export type ShareSettings = {
  phoneNumber: boolean;
  email: boolean;
  address: boolean;
  vetInfo: boolean;
  emergencyContact: boolean;
  petDetails: boolean;
  carePreferences: boolean;
};

// Benutzer-Funktionen
export const userService = {
  // Benutzer registrieren
  registerUser: async ({ email, password, firstName, lastName, userType }: UserRegistration) => {
    // 1. Benutzer in Auth erstellen
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { data: null, error: authError };
    }

    // 2. Benutzerprofil wird automatisch durch Trigger erstellt
    // Aktualisiere es mit den richtigen Daten
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        return { data: null, error: profileError };
      }
    }

    return { data: authData, error: null };
  },

  // Benutzerprofil aktualisieren
  updateUserProfile: async (userId: string, profileData: UserProfileUpdate) => {
    const updateData: Record<string, any> = {};

    // Konvertiere camelCase zu snake_case für die Datenbank
    if (profileData.firstName !== undefined) updateData.first_name = profileData.firstName;
    if (profileData.lastName !== undefined) updateData.last_name = profileData.lastName;
    if (profileData.phoneNumber !== undefined) updateData.phone_number = profileData.phoneNumber;
    if (profileData.plz !== undefined) updateData.plz = profileData.plz;
    if (profileData.city !== undefined) updateData.city = profileData.city;
    if (profileData.street !== undefined) updateData.street = profileData.street;
    if (profileData.profileCompleted !== undefined) updateData.profile_completed = profileData.profileCompleted;
    if (profileData.userType !== undefined) updateData.user_type = profileData.userType;
    if (profileData.profilePhotoUrl !== undefined) updateData.profile_photo_url = profileData.profilePhotoUrl;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    return { data, error };
  },

  // Benutzerprofil abrufen
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Benutzer komplett löschen
  deleteUser: async (userId: string) => {
    try {
      // Aktuelles Session-Token abrufen
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { error: new Error('No valid session found') };
      }

      console.log('Versuche Edge Function aufzurufen...');
      
      try {
        // Versuche Edge Function für komplette Löschung (DB + Auth)
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('User komplett gelöscht via Edge Function:', result);
          await supabase.auth.signOut();
          return { error: null };
        }
        
        console.warn('Edge Function nicht verfügbar oder fehlgeschlagen, verwende Fallback...');
      } catch (edgeFunctionError) {
        console.warn('Edge Function Fehler, verwende Fallback:', edgeFunctionError);
      }

      // Fallback: Nur Database-Daten löschen
      console.log('Führe Database-only Cleanup durch...');

      // Lösche Haustiere
      await supabase
        .from('pets')
        .delete()
        .eq('owner_id', userId);

      // Lösche Owner Preferences
      await supabase
        .from('owner_preferences')
        .delete()
        .eq('owner_id', userId);

      // Lösche Caretaker Profiles (falls vorhanden)
      await supabase
        .from('caretaker_profiles')
        .delete()
        .eq('user_id', userId);

      // Lösche User Profile
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Fehler beim Löschen der User-Daten:', deleteError);
        return { error: deleteError };
      }

      console.log('Database cleanup erfolgreich. Auth-User bleibt bestehen.');

      // Lokales Ausloggen
      await supabase.auth.signOut();

      return { error: null };
    } catch (error: any) {
      console.error('Fehler beim Löschen des Users:', error);
      return { error };
    }
  },
};

// Haustier-Funktionen
export const petService = {
  // Haustier hinzufügen
  addPet: async (ownerId: string, petData: PetData) => {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        owner_id: ownerId,
        name: petData.name,
        type: petData.type,
        breed: petData.breed || null,
        birth_date: petData.birthDate || null,
        weight: petData.weight || null,
        photo_url: petData.photoUrl || null,
        description: petData.description || null,
        gender: petData.gender || null,
        neutered: petData.neutered ?? false,
      })
      .select();

    return { data, error };
  },

  // Haustiere eines Besitzers abrufen
  getOwnerPets: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', ownerId);

    return { data, error };
  },

  // Haustier aktualisieren
  updatePet: async (petId: string, petData: Partial<PetData>) => {
    const updateData: Record<string, any> = {};

    // Konvertiere camelCase zu snake_case für die Datenbank
    if (petData.name !== undefined) updateData.name = petData.name;
    if (petData.type !== undefined) updateData.type = petData.type;
    if (petData.breed !== undefined) updateData.breed = petData.breed;
    if (petData.birthDate !== undefined) updateData.birth_date = petData.birthDate;
    if (petData.weight !== undefined) updateData.weight = petData.weight;
    if (petData.photoUrl !== undefined) updateData.photo_url = petData.photoUrl;
    if (petData.description !== undefined) updateData.description = petData.description;
    if (petData.gender !== undefined) updateData.gender = petData.gender;
    if (petData.neutered !== undefined) updateData.neutered = petData.neutered;

    const { data, error } = await supabase
      .from('pets')
      .update(updateData)
      .eq('id', petId)
      .select();

    return { data, error };
  },

  // Haustier löschen
  deletePet: async (petId: string) => {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', petId);

    return { error };
  },
};

// Besitzer-Präferenzen-Funktionen
export const ownerPreferencesService = {
  // Präferenzen erstellen oder aktualisieren
  savePreferences: async (ownerId: string, preferences: OwnerPreferences) => {
    // Prüfen, ob bereits Präferenzen existieren
    const { data: existingData } = await supabase
      .from('owner_preferences')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle();

    const preferencesData = {
      owner_id: ownerId,
      services: preferences.services,
      other_services: preferences.otherServices || null,
      vet_info: preferences.vetInfo
        ? preferences.vetInfo
        : (preferences.vetName || preferences.vetAddress || preferences.vetPhone
            ? JSON.stringify({
                name: preferences.vetName || '',
                address: preferences.vetAddress || '',
                phone: preferences.vetPhone || ''
              })
            : null),
      emergency_contact_name: preferences.emergencyContactName || null,
      emergency_contact_phone: preferences.emergencyContactPhone || null,
      care_instructions: preferences.careInstructions || null,
      // share_settings wird nach Migration hinzugefügt
    };

    let result;

    if (existingData) {
      // Aktualisieren
      result = await supabase
        .from('owner_preferences')
        .update(preferencesData)
        .eq('owner_id', ownerId)
        .select();
    } else {
      // Neu erstellen
      result = await supabase
        .from('owner_preferences')
        .insert(preferencesData)
        .select();
    }

    return result;
  },

  // Präferenzen abrufen
  getPreferences: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('owner_preferences')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    return { data, error };
  },

  // Tierarzt-Informationen speichern (ohne andere Felder zu überschreiben)
  saveVetInfo: async (ownerId: string, vetName: string, vetAddress: string, vetPhone: string) => {
    try {
      // Erst bestehende Daten laden
      const { data: existingData } = await supabase
        .from('owner_preferences')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();

      const vetInfo = JSON.stringify({
        name: vetName || '',
        address: vetAddress || '',
        phone: vetPhone || ''
      });

      if (existingData) {
        // Nur vet_info aktualisieren
        const result = await supabase
          .from('owner_preferences')
          .update({ vet_info: vetInfo })
          .eq('owner_id', ownerId)
          .select();
        return result;
      } else {
        // Neuen Eintrag erstellen mit Minimal-Daten
        const result = await supabase
          .from('owner_preferences')
          .insert({
            owner_id: ownerId,
            services: [],
            vet_info: vetInfo
          })
          .select();
        return result;
      }
    } catch (error) {
      return { data: null, error };
    }
  },

  // Notfallkontakt speichern (ohne andere Felder zu überschreiben)
  saveEmergencyContact: async (ownerId: string, emergencyName: string, emergencyPhone: string) => {
    try {
      // Erst bestehende Daten laden
      const { data: existingData } = await supabase
        .from('owner_preferences')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();

      if (existingData) {
        // Nur emergency_contact Felder aktualisieren
        const result = await supabase
          .from('owner_preferences')
          .update({ 
            emergency_contact_name: emergencyName || null,
            emergency_contact_phone: emergencyPhone || null
          })
          .eq('owner_id', ownerId)
          .select();
        return result;
      } else {
        // Neuen Eintrag erstellen mit Minimal-Daten
        const result = await supabase
          .from('owner_preferences')
          .insert({
            owner_id: ownerId,
            services: [],
            emergency_contact_name: emergencyName || null,
            emergency_contact_phone: emergencyPhone || null
          })
          .select();
        return result;
      }
    } catch (error) {
      return { data: null, error };
    }
  },

  // Share-Settings speichern
  saveShareSettings: async (ownerId: string, shareSettings: ShareSettings) => {
    const { data: existingData } = await supabase
      .from('owner_preferences')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle();

    const updateData = {
      share_settings: shareSettings
    };

    let result;
    if (existingData) {
      result = await supabase
        .from('owner_preferences')
        .update(updateData)
        .eq('owner_id', ownerId)
        .select();
    } else {
      result = await supabase
        .from('owner_preferences')
        .insert({
          owner_id: ownerId,
          services: [],
          share_settings: shareSettings
        })
        .select();
    }
    return result;
  },

  // Share-Settings abrufen
  getShareSettings: async (ownerId: string): Promise<{ data: ShareSettings | null; error: any }> => {
    const { data, error } = await supabase
      .from('owner_preferences')
      .select('share_settings')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    const defaultSettings: ShareSettings = {
      phoneNumber: false,
      email: false,
      address: false,
      vetInfo: false,
      emergencyContact: false,
      petDetails: false,
      carePreferences: false
    };

    if (!data?.share_settings) {
      return { data: defaultSettings, error: null };
    }

    // Sicherstellen, dass die Werte Boolean sind (falls sie als Strings kommen)
    const rawSettings = data.share_settings as any;
    
    // Sehr robuste Boolean-Konvertierung
    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      if (typeof value === 'number') return value === 1;
      return Boolean(value);
    };
    
    const normalizedSettings: ShareSettings = {
      phoneNumber: toBool(rawSettings.phoneNumber),
      email: toBool(rawSettings.email),
      address: toBool(rawSettings.address),
      vetInfo: toBool(rawSettings.vetInfo),
      emergencyContact: toBool(rawSettings.emergencyContact),
      petDetails: toBool(rawSettings.petDetails),
      carePreferences: toBool(rawSettings.carePreferences)
    };

    return { 
      data: normalizedSettings, 
      error: null 
    };
  },
};

// PLZ-Funktionen
export const plzService = {
  // PLZ suchen (alle Städte zu einer PLZ)
  getAllByPlz: async (plz: string) => {
    const { data, error } = await supabase
      .from('plzs')
      .select('*')
      .eq('plz', plz);

    return { data, error };
  },

  // PLZ und Stadt-Kombination suchen
  getByPlzAndCity: async (plz: string, city: string) => {
    const { data, error } = await supabase
      .from('plzs')
      .select('*')
      .eq('plz', plz)
      .eq('city', city)
      .single();

    return { data, error };
  },

  // PLZ suchen (erste gefundene - für Rückwärtskompatibilität)
  getByPlz: async (plz: string) => {
    const { data, error } = await supabase
      .from('plzs')
      .select('*')
      .eq('plz', plz)
      .limit(1)
      .single();

    return { data, error };
  },

  // Neue PLZ und Ort hinzufügen (nur wenn PLZ+Stadt-Kombination noch nicht existiert)
  create: async (plz: string, city: string) => {
    // Prüfe erst, ob die PLZ+Stadt-Kombination bereits existiert
    const { data: existing, error: checkError } = await supabase
      .from('plzs')
      .select('*')
      .eq('plz', plz)
      .eq('city', city)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return { data: null, error: checkError };
    }

    // Falls bereits vorhanden, gib die vorhandenen Daten zurück
    if (existing) {
      return { data: existing, error: null };
    }

    // Andernfalls erstelle neuen Eintrag
    const { data, error } = await supabase
      .from('plzs')
      .insert({
        plz: plz,
        city: city,
      })
      .select()
      .single();

    return { data, error };
  },
};

// Caretaker-Profil-Funktionen
export const caretakerProfileService = {
  // Profil anlegen oder aktualisieren
  saveProfile: async (userId: string, profile: {
    services: string[];
    animalTypes: string[];
    prices: Record<string, any>;
    serviceRadius: number;
    availability: Record<string, string[]>;
    homePhotos: string[];
    qualifications: string[];
    experienceDescription: string;
    shortAboutMe?: string;
    longAboutMe?: string;
    languages?: string[];
    isCommercial?: boolean;
    companyName?: string;
    taxNumber?: string;
    vatId?: string;
  }) => {
    const { data, error } = await supabase
      .from('caretaker_profiles')
      .upsert({
        id: userId,
        services: profile.services,
        animal_types: profile.animalTypes,
        prices: profile.prices,
        service_radius: profile.serviceRadius,
        availability: profile.availability,
        home_photos: profile.homePhotos,
        qualifications: profile.qualifications,
        experience_description: profile.experienceDescription,
        short_about_me: profile.shortAboutMe || null,
        long_about_me: profile.longAboutMe || null,
        languages: profile.languages || [],
        is_commercial: profile.isCommercial || false,
        company_name: profile.companyName || null,
        tax_number: profile.taxNumber || null,
        vat_id: profile.vatId || null,
      }, { onConflict: 'id' })
      .select();
    return { data, error };
  },

  // Caretaker-Profil abrufen
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('caretaker_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return { data, error };
  },
};

// Caretaker-Such-Service
// Search filter interface
interface SearchFilters {
  location?: string;
  services?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
}

export const caretakerSearchService = {
  searchCaretakers: async (filters: SearchFilters = {}) => {
    console.log('🔍 Searching caretakers with filters:', filters);

    try {
      console.log('🔄 Fetching caretakers via profiles + users join...');
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

      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        query = query.or(`users.city.ilike.%${locationLower}%,users.plz.ilike.%${locationLower}%`);
      }

      // Preisgrenzen auf DB-Seite anwenden, soweit möglich
      if (filters.minPrice !== undefined) {
        query = query.gte('hourly_rate', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('hourly_rate', filters.maxPrice);
      }

      const { data: caretakers, error } = await query;
      
      if (error) {
        console.error('❌ Query error:', error);
        return { data: [], error };
      }
      
      console.log('📊 Caretakers found:', caretakers?.length);
      
      if (!caretakers || caretakers.length === 0) {
        console.log('⚠️ No caretakers found');
        return { data: [], error: null };
      }

      console.log('🔄 Transforming caretaker data...');
      const transformedResults = caretakers.map((row: any) => {
        const firstName = row.users?.first_name || '';
        const lastName = row.users?.last_name || '';
        const name = firstName && lastName ? `${firstName} ${lastName[0]}.` : (firstName || 'Unbekannt');
        const location = row.users?.city && row.users?.plz
          ? `${row.users.city} ${row.users.plz}`
          : (row.users?.city || 'Unbekannt');

        const services = Array.isArray(row.services) ? row.services : [];

        // Bestpreis aus prices ermitteln, fallback hourly_rate
        const prices = (row.prices && typeof row.prices === 'object') ? row.prices : {};
        const numericPrices = Object.values(prices || {})
          .filter((p: any) => p !== '' && p !== null && p !== undefined)
          .map((p: any) => typeof p === 'string' ? parseFloat(p) : p)
          .filter((p: any) => typeof p === 'number' && !isNaN(p) && p > 0);
        const bestPrice = numericPrices.length > 0 ? Math.min(...numericPrices as number[]) : Number(row.hourly_rate) || 0;

        return {
          id: row.id,
          name,
          avatar: row.users?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'U')}&background=f3f4f6&color=374151`,
          location,
          rating: Number(row.rating) || 0,
          reviewCount: row.review_count || 0,
          hourlyRate: bestPrice,
          services,
          bio: row.short_about_me || 'Keine Beschreibung verfügbar.',
          responseTime: 'unter 1 Stunde',
          verified: row.is_verified || false,
          isCommercial: row.is_commercial || false,
        };
      });

      console.log('🎯 Transformed results:', transformedResults);

      // Wende Filter an
      let filteredResults = transformedResults;
      
      if (filters.services && filters.services.length > 0) {
        filteredResults = filteredResults.filter((caretaker: any) => 
          filters.services!.some(service => caretaker.services.includes(service))
        );
        console.log('🏷️ After service filter:', filteredResults);
      }

      if (filters.minPrice !== undefined) {
        filteredResults = filteredResults.filter((caretaker: any) => caretaker.hourlyRate >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        filteredResults = filteredResults.filter((caretaker: any) => caretaker.hourlyRate <= filters.maxPrice!);
      }

      if (filters.minRating !== undefined) {
        filteredResults = filteredResults.filter((caretaker: any) => caretaker.rating >= filters.minRating!);
      }

      console.log('🎊 Final filtered results:', filteredResults);
      return { data: filteredResults, error: null };
    } catch (error) {
      console.error('🚨 Unexpected error in searchCaretakers:', error);
      return { data: [], error: error as Error };
    }
  },

  getCaretakerById: async (id: string) => {
    console.log('🔍 Getting caretaker by ID:', id);
    
    try {
      // Hole die Daten direkt aus caretaker_profiles + Join users und zusätzlich availability/home_photos
      const { data: profileRow, error: profileJoinError } = await supabase
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
          qualifications,
          experience_years,
          languages,
          availability,
          home_photos,
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

      if (profileJoinError) {
        return { data: null, error: profileJoinError };
      }

      if (!profileRow) {
        return { data: null, error: new Error('Caretaker not found') };
      }

      const result = profileRow as any;

      // Preise verarbeiten - kann JSON object sein
      let prices: Record<string, number | string> = {};
      try {
        if (result.prices && typeof result.prices === 'object') {
          prices = result.prices as Record<string, number | string>;
        }
      } catch (error) {
        console.warn('⚠️ Error parsing prices:', error, 'Original value:', result.prices);
        prices = {};
      }

      // Bestpreis ermitteln - verwende Preis-Object falls verfügbar, sonst hourly_rate
      const getBestPrice = (prices: Record<string, number | string>): number => {
        if (!prices || Object.keys(prices).length === 0) return 0;
        
        const numericPrices = Object.values(prices)
          .filter(price => price !== '' && price !== null && price !== undefined) // Filtere leere Strings
          .map(price => {
            const num = typeof price === 'string' ? parseFloat(price) : price;
            return isNaN(num) ? 0 : num;
          })
          .filter(price => price > 0);
        
        return numericPrices.length > 0 ? Math.min(...numericPrices) : 0;
      };
      
      const bestPrice = getBestPrice(prices) || Number(result.hourly_rate) || 0;

      const firstName = result.users?.first_name || '';
      const lastName = result.users?.last_name || '';
      const name = firstName && lastName ? `${firstName} ${lastName[0]}.` : (firstName || 'Unbekannt');

      const transformedData = {
        id: result.id,
        name,
        avatar: result.users?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'U')}&background=f3f4f6&color=374151`,
        location: result.users?.city && result.users?.plz ? `${result.users.city} ${result.users.plz}` : (result.users?.city || 'Unbekannt'),
        rating: Number(result.rating) || 0,
        reviewCount: result.review_count || 0,
        hourlyRate: bestPrice,
        prices: prices,
        services: Array.isArray(result.services) ? result.services : [],
        bio: result.short_about_me || 'Keine Beschreibung verfügbar.',
        responseTime: 'unter 1 Stunde',
        verified: result.is_verified || false,
        isCommercial: result.is_commercial || false,
        experienceYears: result.experience_years || 0,
        fullBio: result.long_about_me || result.short_about_me || 'Keine ausführliche Beschreibung verfügbar.',
        qualifications: Array.isArray(result.qualifications) ? result.qualifications : [],
        languages: Array.isArray(result.languages) ? result.languages : [],
        availability: result.availability || {},
        home_photos: Array.isArray(result.home_photos) ? result.home_photos : [],
        phone: null,
        email: null,
      };

      console.log('✅ Transformed single caretaker:', transformedData);
      return { data: transformedData, error: null };
    } catch (error) {
      console.error('🚨 Unexpected error in getCaretakerById:', error);
      return { data: null, error: error as Error };
    }
  },

  getAvailableServices: async () => {
    const { data, error } = await supabase
      .from('caretaker_profiles')
      .select('services')
      .not('services', 'is', null);

    if (error) {
      return { data: [], error };
    }

    const allServices = new Set<string>();
    data?.forEach(profile => {
      if (Array.isArray(profile.services)) {
        profile.services.forEach(service => {
          if (typeof service === 'string') {
            allServices.add(service);
          }
        });
      }
    });

    return { data: Array.from(allServices), error: null };
  },
};

// Owner Caretaker Connections Service
export const ownerCaretakerService = {
  // Speichere einen Betreuer für einen Tierbesitzer (aus Chat)
  async saveCaretaker(ownerId: string, caretakerId: string) {
    try {
      // Prüfe ob bereits eine Verbindung existiert
      const { data: existing, error: existingError } = await supabase
        .from('owner_caretaker_connections')
        .select('id, connection_type')
        .eq('owner_id', ownerId)
        .eq('caretaker_id', caretakerId)
        .maybeSingle()
      
      if (existingError) throw existingError
      
      if (existing) {
        // Verbindung existiert - wandle zu Betreuer um (egal ob vorher Favorit)
        const { data, error } = await supabase
          .from('owner_caretaker_connections')
          .update({ 
            connection_type: 'caretaker'
          })
          .eq('id', existing.id)
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } else {
        // Neue Verbindung erstellen als Betreuer
        const { data, error } = await supabase
          .from('owner_caretaker_connections')
          .insert({
            owner_id: ownerId,
            caretaker_id: caretakerId,
            connection_type: 'caretaker'
          })
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      }
    } catch (error) {
      console.error('Error saving caretaker:', error)
      return { data: null, error: (error as Error).message }
    }
  },

  // Entferne einen Betreuer für einen Tierbesitzer
  async removeCaretaker(ownerId: string, caretakerId: string) {
    try {
      const { error } = await supabase
        .from('owner_caretaker_connections')
        .delete()
        .eq('owner_id', ownerId)
        .eq('caretaker_id', caretakerId)
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error removing caretaker:', error)
      return { error: (error as Error).message }
    }
  },

  // Prüfe ob ein Betreuer bereits als Betreuer gespeichert ist (nicht nur als Favorit)
  async isCaretakerSaved(ownerId: string, caretakerId: string) {
    try {
      const { data, error } = await supabase
        .from('owner_caretaker_connections')
        .select('id')
        .eq('owner_id', ownerId)
        .eq('caretaker_id', caretakerId)
        .eq('connection_type', 'caretaker')  // Nur echte Betreuer zählen
        .maybeSingle()
      
      if (error) throw error
      return { isSaved: !!data, error: null }
    } catch (error) {
      console.error('Error checking if caretaker is saved:', error)
      return { isSaved: false, error: (error as Error).message }
    }
  },

  // Favoriten-Funktionalität: Betreuer als Favorit markieren oder entfernen (NUR wenn noch kein Betreuer)
  async toggleFavorite(ownerId: string, caretakerId: string) {
    try {
      // Prüfe ob Verbindung bereits existiert
      const { data: existing, error: existingError } = await supabase
        .from('owner_caretaker_connections')
        .select('id, connection_type')
        .eq('owner_id', ownerId)
        .eq('caretaker_id', caretakerId)
        .maybeSingle()
      
      if (existingError) throw existingError
      
      if (existing) {
        // Verbindung existiert
        if (existing.connection_type === 'caretaker') {
          // Bereits ein Betreuer - kann nicht als Favorit markiert werden
          return { isFavorite: false, error: 'Dieser Betreuer ist bereits in Ihren gespeicherten Betreuern' }
        }
        
        if (existing.connection_type === 'favorite') {
          // Favorit entfernen = Verbindung komplett löschen
          const { error } = await supabase
            .from('owner_caretaker_connections')
            .delete()
            .eq('id', existing.id)
          
          if (error) throw error
          return { isFavorite: false, error: null }
        }
      } else {
        // Verbindung existiert nicht - erstelle sie als Favorit
        const { data, error } = await supabase
          .from('owner_caretaker_connections')
          .insert({
            owner_id: ownerId,
            caretaker_id: caretakerId,
            connection_type: 'favorite'
          })
          .select('connection_type')
          .single()
        
        if (error) throw error
        return { isFavorite: data.connection_type === 'favorite', error: null }
      }
      
      return { isFavorite: false, error: null }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      return { isFavorite: false, error: (error as Error).message }
    }
  },

  // Prüfe ob ein Betreuer als Favorit markiert ist
  async isFavorite(ownerId: string, caretakerId: string) {
    try {
      const { data, error } = await supabase
        .from('owner_caretaker_connections')
        .select('connection_type')
        .eq('owner_id', ownerId)
        .eq('caretaker_id', caretakerId)
        .maybeSingle()
      
      if (error) throw error
      return { isFavorite: data?.connection_type === 'favorite', error: null }
    } catch (error) {
      console.error('Error checking if caretaker is favorite:', error)
      return { isFavorite: false, error: (error as Error).message }
    }
  },

  // Lade nur die favorisierten Betreuer für einen Owner (die NICHT als Betreuer gespeichert sind)
  async getFavoriteCaretakers(ownerId: string) {
    try {
      // Erst die Favoriten-Verbindungen laden (nur Favoriten, keine Betreuer)
      const { data: connections, error: connectionsError } = await supabase
        .from('owner_caretaker_connections')
        .select('caretaker_id, created_at')
        .eq('owner_id', ownerId)
        .eq('connection_type', 'favorite')  // Nur reine Favoriten
        .order('created_at', { ascending: false })
      
      if (connectionsError) throw connectionsError
      
      if (!connections || connections.length === 0) {
        return { data: [], error: null }
      }
      
      // Dann die Caretaker-Daten aus caretaker_profiles + users laden
      const caretakerIds = connections.map(c => c.caretaker_id)
      const { data: caretakers, error: careteakersError } = await supabase
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
        .in('id', caretakerIds)
        .eq('users.user_type', 'caretaker')
      
      if (careteakersError) throw careteakersError
      
      // Transform data to match the expected format
      const transformedData = connections.map(connection => {
        const caretaker: any = caretakers?.find((c: any) => c.id === connection.caretaker_id)
        if (!caretaker) return null
        
        return {
          id: caretaker.id,
          name: (caretaker.users?.first_name && caretaker.users?.last_name)
            ? `${caretaker.users.first_name} ${caretaker.users.last_name[0]}.`
            : (caretaker.users?.first_name || 'Unbekannt'),
          avatar: caretaker.users?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(caretaker.users?.first_name || 'U')}&background=f3f4f6&color=374151`,
          location: caretaker.users?.city && caretaker.users?.plz ? `${caretaker.users.city} ${caretaker.users.plz}` : (caretaker.users?.city || 'Ort nicht angegeben'),
          services: Array.isArray(caretaker.services) ? caretaker.services : [],
          rating: Number(caretaker.rating) || 0,
          reviews_count: caretaker.review_count || 0,
          hourly_rate: Number(caretaker.hourly_rate) || 0,
          description: caretaker.short_about_me || 'Keine Beschreibung verfügbar.',
          isCommercial: caretaker.is_commercial || false,
          email: '', // Not available in search view
          phone: '', // Not available in search view
          user_id: caretaker.id, // Use caretaker ID as user_id
          saved_at: connection.created_at,
          isFavorite: true
        }
      }).filter(Boolean)
      
      return { data: transformedData || [], error: null }
    } catch (error) {
      console.error('Error getting favorite caretakers:', error)
      return { data: [], error: (error as Error).message }
    }
  },

  // Lade nur die echten Betreuer für einen Owner (die aus Chat gespeichert wurden)
  async getSavedCaretakers(ownerId: string) {
    try {
      // Erst die Betreuer-Verbindungen laden (nur echte Betreuer, keine Favoriten)
      const { data: connections, error: connectionsError } = await supabase
        .from('owner_caretaker_connections')
        .select('caretaker_id, created_at, connection_type')
        .eq('owner_id', ownerId)
        .eq('connection_type', 'caretaker')  // Nur echte Betreuer, keine reinen Favoriten
        .order('created_at', { ascending: false })
      
      if (connectionsError) throw connectionsError
      
      if (!connections || connections.length === 0) {
        return { data: [], error: null }
      }
      
      // Dann die Caretaker-Daten aus caretaker_profiles + users laden
      const caretakerIds = connections.map(c => c.caretaker_id)
      const { data: caretakers, error: careteakersError } = await supabase
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
        .in('id', caretakerIds)
        .eq('users.user_type', 'caretaker')
      
      if (careteakersError) throw careteakersError
      
      // Transform data to match the expected format
      const transformedData = connections.map(connection => {
        const caretaker: any = caretakers?.find((c: any) => c.id === connection.caretaker_id)
        if (!caretaker) return null
        
        return {
          id: caretaker.id,
          name: (caretaker.users?.first_name && caretaker.users?.last_name)
            ? `${caretaker.users.first_name} ${caretaker.users.last_name[0]}.`
            : (caretaker.users?.first_name || 'Unbekannt'),
          avatar: caretaker.users?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(caretaker.users?.first_name || 'U')}&background=f3f4f6&color=374151`,
          location: caretaker.users?.city && caretaker.users?.plz ? `${caretaker.users.city} ${caretaker.users.plz}` : (caretaker.users?.city || 'Ort nicht angegeben'),
          services: Array.isArray(caretaker.services) ? caretaker.services : [],
          rating: Number(caretaker.rating) || 0,
          reviews_count: caretaker.review_count || 0,
          hourly_rate: Number(caretaker.hourly_rate) || 0,
          description: caretaker.short_about_me || 'Keine Beschreibung verfügbar.',
          isCommercial: caretaker.is_commercial || false,
          email: '', // Not available in search view
          phone: '', // Not available in search view
          user_id: caretaker.id, // Use caretaker ID as user_id
          saved_at: connection.created_at,
          isFavorite: false  // Betreuer sind nie Favoriten (mutual exclusivity)
        }
      }).filter(Boolean)
      
      return { data: transformedData || [], error: null }
    } catch (error) {
      console.error('Error getting saved caretakers:', error)
      return { data: [], error: (error as Error).message }
    }
  },

  // Lade alle Tierbesitzer für einen Betreuer (für das Betreuer Dashboard)
  async getCaretakerClients(caretakerId: string) {
    try {
      // Erst die Verbindungen laden
      const { data: connections, error: connectionsError } = await supabase
        .from('owner_caretaker_connections')
        .select('owner_id, created_at')
        .eq('caretaker_id', caretakerId)
        .order('created_at', { ascending: false })
      
      if (connectionsError) throw connectionsError
      
      if (!connections || connections.length === 0) {
        return { data: [], error: null }
      }
      
      // Dann die Owner-Daten laden
      const ownerIds = connections.map(c => c.owner_id)
      
      const { data: owners, error: ownersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone_number, profile_photo_url, city, plz')
        .in('id', ownerIds)
      
      if (ownersError) throw ownersError
      
      // Transform data to match the ClientData format mit allen benötigten Daten
      const transformedData = await Promise.all(connections.map(async connection => {
        const owner = owners?.find(o => o.id === connection.owner_id)
        if (!owner) return null
        
        // Lade Share-Settings, Owner-Preferences und Pets aus der Datenbank
        const [shareSettingsResult, preferencesResult, petsResult] = await Promise.all([
          ownerPreferencesService.getShareSettings(owner.id),
          ownerPreferencesService.getPreferences(owner.id),
          petService.getOwnerPets(owner.id)
        ]);
        
        console.log(`=== Debug for ${owner.first_name} ${owner.last_name} (ID: ${owner.id}) ===`);
        console.log('ShareSettings result:', shareSettingsResult);
        console.log('Preferences result:', preferencesResult);
        console.log('Pets result:', petsResult);
        
        // Parse Tierarzt-Daten (jetzt da RLS funktioniert)
        let vetInfo = null;
        const prefsData = preferencesResult.data;
        
        if (prefsData?.vet_info) {
          try {
            vetInfo = JSON.parse(prefsData.vet_info);
            console.log(`Vet info for ${owner.first_name} ${owner.last_name}:`, vetInfo);
          } catch (e) {
            console.log(`Failed to parse vet_info for ${owner.first_name} ${owner.last_name}:`, prefsData.vet_info, e);
          }
        } else {
          console.log(`No vet_info found for ${owner.first_name} ${owner.last_name}. Preferences:`, prefsData);
        }
        
        // Transform Pets für ClientData Format
        const pets = (petsResult.data || []).map((pet: any) => ({
          id: pet.id,
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
          age: pet.age?.toString(),
          gender: pet.gender,
          neutered: pet.neutered,
          description: pet.description,
          photoUrl: pet.photo_url
        }));
        
        const finalData = {
          id: owner.id,
          name: `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Unbekannt',
          phoneNumber: owner.phone_number || '',
          email: owner.email || '',
          address: '', // Nicht in Users-Tabelle verfügbar
          city: owner.city || '',
          plz: owner.plz || '',
          vetName: vetInfo?.name || '',
          vetAddress: vetInfo?.address || '',
          vetPhone: vetInfo?.phone || '',
          emergencyContactName: prefsData?.emergency_contact_name || '',
          emergencyContactPhone: prefsData?.emergency_contact_phone || '',
          pets: pets,
          services: prefsData?.services || [],
          otherWishes: (prefsData?.other_services) ? [prefsData?.other_services] : [],
          shareSettings: shareSettingsResult.data || {
            phoneNumber: true,
            email: false,
            address: true,
            vetInfo: true,
            emergencyContact: false,
            petDetails: true,
            carePreferences: true
          },
          // Legacy fields für bestehende UI
          avatar: owner.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.first_name || 'U')}&background=f3f4f6&color=374151`,
          location: shareSettingsResult.data?.address 
            ? (owner.city && owner.plz ? `${owner.plz} ${owner.city}` : (owner.plz || owner.city || 'Ort nicht angegeben'))
            : 'Adresse nicht freigegeben',
          saved_at: connection.created_at
        };
        
        console.log(`Final data for ${finalData.name}:`, {
          vetName: finalData.vetName,
          vetAddress: finalData.vetAddress, 
          vetPhone: finalData.vetPhone,
          shareSettings: finalData.shareSettings
        });
        
        return finalData;
      }))
      
      return { data: transformedData.filter(Boolean) || [], error: null }
    } catch (error) {
      console.error('Error getting caretaker clients:', error)
      return { data: [], error: (error as Error).message }
    }
  }
}