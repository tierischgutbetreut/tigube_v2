import { supabase } from './client';
import type { Database } from './database.types';

// Typen für die Benutzerregistrierung und -aktualisierung
export type UserRegistration = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'owner' | 'caregiver';
};

export type UserProfileUpdate = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  plz?: string;
  city?: string;
  profileCompleted?: boolean;
  userType?: 'owner' | 'caregiver';
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