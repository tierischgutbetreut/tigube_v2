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
  profileCompleted?: boolean;
  userType?: 'owner' | 'caretaker';
  profilePhotoUrl?: string;
};

export type PetData = {
  name: string;
  type: string; // Zurück zu 'type' entsprechend schema.sql
  breed?: string;
  age?: number;
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
        age: petData.age || null,
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
    if (petData.age !== undefined) updateData.age = petData.age;
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
      .single();

    return { data, error };
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
      .single();
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
      console.log('🔄 Fetching caretakers from view...');
      const { data: caretakers, error } = await supabase
        .from('caretaker_search_view')
        .select('*');
      
      if (error) {
        console.error('❌ View error:', error);
        return { data: [], error };
      }
      
      console.log('📊 Caretakers found:', caretakers?.length);
      
      if (!caretakers || caretakers.length === 0) {
        console.log('⚠️ No caretakers found');
        return { data: [], error: null };
      }

      console.log('🔄 Transforming caretaker data...');
      const transformedResults = caretakers.map((caretaker: any) => ({
        id: caretaker.id,
        name: caretaker.full_name || `${caretaker.first_name || ''} ${caretaker.last_name || ''}`.trim() || 'Unbekannt',
        avatar: caretaker.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(caretaker.first_name || 'U')}&background=f3f4f6&color=374151`,
        location: caretaker.city && caretaker.plz ? `${caretaker.city} ${caretaker.plz}` : (caretaker.city || 'Unbekannt'),
        rating: Number(caretaker.rating) || 0,
        reviewCount: caretaker.review_count || 0,
        hourlyRate: Number(caretaker.hourly_rate) || 0,
        services: Array.isArray(caretaker.services) ? caretaker.services : [],
        bio: caretaker.short_about_me || 'Keine Beschreibung verfügbar.',
        responseTime: 'unter 1 Stunde',
        verified: caretaker.is_verified || false,
      }));

      console.log('🎯 Transformed results:', transformedResults);

      // Wende Filter an
      let filteredResults = transformedResults;
      
      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        filteredResults = filteredResults.filter((caretaker: any) => 
          caretaker.location.toLowerCase().includes(locationLower)
        );
        console.log('📍 After location filter:', filteredResults);
      }

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
      const { data: result, error } = await supabase
        .from('caretaker_search_view')
        .select('*')
        .eq('id', id)
        .single();
      
      console.log('📊 Single caretaker result:', result);
      console.log('❌ Error:', error);
      
      if (error) {
        return { data: null, error };
      }

      if (!result) {
        return { data: null, error: new Error('Caretaker not found') };
      }

      const transformedData = {
        id: result.id,
        name: result.full_name || `${result.first_name || ''} ${result.last_name || ''}`.trim() || 'Unbekannt',
        avatar: result.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.first_name || 'U')}&background=f3f4f6&color=374151`,
        location: result.city && result.plz ? `${result.city} ${result.plz}` : (result.city || 'Unbekannt'),
        rating: Number(result.rating) || 0,
        reviewCount: result.review_count || 0,
        hourlyRate: Number(result.hourly_rate) || 0,
        services: Array.isArray(result.services) ? result.services : [],
        bio: result.short_about_me || 'Keine Beschreibung verfügbar.',
        responseTime: 'unter 1 Stunde',
        verified: result.is_verified || false,
        experienceYears: result.experience_years || 0,
        fullBio: result.long_about_me || result.short_about_me || 'Keine ausführliche Beschreibung verfügbar.',
        qualifications: Array.isArray(result.qualifications) ? result.qualifications : [],
        phone: null, // Nicht in der View verfügbar
        email: null, // Nicht in der View verfügbar
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