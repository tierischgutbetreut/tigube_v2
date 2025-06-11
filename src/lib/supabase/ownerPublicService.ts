import { supabase } from './client';
import type { 
  PublicOwnerProfile, 
  OwnerCaretakerConnection, 
  OwnerCaretakerConnectionInsert,
  OwnerCaretakerConnectionUpdate
} from './types';

/**
 * Service für öffentliche Owner-Profile
 * Verwaltet Zugriffskontrolle und Datenschutz-Filterung
 */
export const ownerPublicService = {
  
  /**
   * Prüft ob ein Caretaker auf das Owner-Profil zugreifen darf
   */
  checkCaretakerAccess: async (ownerId: string, caretakerId: string): Promise<{ hasAccess: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('owner_caretaker_connections')
        .select('status')
        .eq('owner_id', ownerId)
        .eq('caretaker_id', caretakerId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Fehler bei Zugriffsprüfung:', error);
        return { hasAccess: false, error: error.message };
      }

      return { hasAccess: !!data };
    } catch (error) {
      console.error('Exception bei Zugriffsprüfung:', error);
      return { hasAccess: false, error: 'Unbekannter Fehler bei Zugriffsprüfung' };
    }
  },

  /**
   * Erstellt eine neue Owner-Caretaker Verbindung
   * (wird automatisch beim ersten Chat/Kontakt erstellt)
   */
  createConnection: async (connectionData: OwnerCaretakerConnectionInsert): Promise<{ data: OwnerCaretakerConnection | null; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('owner_caretaker_connections')
        .insert(connectionData)
        .select()
        .single();

      if (error) {
        // Ignoriere Duplicate-Fehler (Verbindung existiert bereits)
        if (error.code === '23505') {
          return { data: null, error: 'Verbindung existiert bereits' };
        }
        console.error('Fehler beim Erstellen der Verbindung:', error);
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Exception beim Erstellen der Verbindung:', error);
      return { data: null, error: 'Unbekannter Fehler beim Erstellen der Verbindung' };
    }
  },

  /**
   * Aktualisiert den Status einer Verbindung (z.B. blockieren)
   */
  updateConnection: async (ownerId: string, caretakerId: string, updateData: OwnerCaretakerConnectionUpdate): Promise<{ data: OwnerCaretakerConnection | null; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('owner_caretaker_connections')
        .update(updateData)
        .eq('owner_id', ownerId)
        .eq('caretaker_id', caretakerId)
        .select()
        .single();

      if (error) {
        console.error('Fehler beim Aktualisieren der Verbindung:', error);
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Exception beim Aktualisieren der Verbindung:', error);
      return { data: null, error: 'Unbekannter Fehler beim Aktualisieren der Verbindung' };
    }
  },

  /**
   * Lädt das öffentliche Owner-Profil (nur für autorisierte Caretaker)
   */
  getPublicOwnerProfile: async (ownerId: string, viewerId: string): Promise<{ data: PublicOwnerProfile | null; error?: string }> => {
    try {
      // 1. Zugriffsberechtigung prüfen
      const { hasAccess, error: accessError } = await ownerPublicService.checkCaretakerAccess(ownerId, viewerId);
      
      if (accessError) {
        return { data: null, error: accessError };
      }
      
      if (!hasAccess) {
        return { data: null, error: 'UNAUTHORIZED' };
      }

      // 2. Basis-Profildaten laden
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url, phone_number, email, plz, city')
        .eq('id', ownerId)
        .single();

      if (userError || !userProfile) {
        return { data: null, error: userError?.message || 'Owner nicht gefunden' };
      }

      // 3. Owner-Präferenzen laden (für Datenschutz-Einstellungen)
      const { data: preferences, error: prefError } = await supabase
        .from('owner_preferences')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();

      // 4. Haustiere laden
      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select('id, name, type, breed, age, photo_url, gender, neutered')
        .eq('owner_id', ownerId);

      if (petsError) {
        console.warn('Fehler beim Laden der Haustiere:', petsError);
      }

      // 5. Datenschutz-Einstellungen anwenden
      // TODO: Diese sollten später aus einer separaten Tabelle/Spalte kommen
      // Für jetzt verwenden wir Standard-Einstellungen
      const shareSettings = {
        phoneNumber: true,
        email: false,
        address: true,
        vetInfo: true,
        emergencyContact: false,
        petDetails: true,
        carePreferences: true
      };

      // 6. Gefilterte Profildaten zusammenstellen
      const publicProfile: PublicOwnerProfile = {
        id: userProfile.id,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        profile_photo_url: userProfile.profile_photo_url,
        share_settings: shareSettings
      };

      // Bedingt sichtbare Kontaktdaten
      if (shareSettings.phoneNumber) {
        publicProfile.phone_number = userProfile.phone_number;
      }
      if (shareSettings.email) {
        publicProfile.email = userProfile.email;
      }
      if (shareSettings.address) {
        publicProfile.plz = userProfile.plz;
        publicProfile.city = userProfile.city;
      }

      // Betreuungsvorlieben
      if (shareSettings.carePreferences && preferences) {
        publicProfile.services = preferences.services;
        publicProfile.other_services = preferences.other_services;
      }

      // Tierarzt-Informationen
      if (shareSettings.vetInfo && preferences?.vet_info) {
        try {
          const vetInfo = typeof preferences.vet_info === 'string' 
            ? JSON.parse(preferences.vet_info) 
            : preferences.vet_info;
          
          if (vetInfo && (vetInfo.name || vetInfo.address || vetInfo.phone)) {
            publicProfile.vet_info = {
              name: vetInfo.name || '',
              address: vetInfo.address || '',
              phone: vetInfo.phone || ''
            };
          }
        } catch (e) {
          console.warn('Fehler beim Parsen der Tierarzt-Informationen:', e);
        }
      }

      // Notfallkontakt
      if (shareSettings.emergencyContact && preferences) {
        if (preferences.emergency_contact_name || preferences.emergency_contact_phone) {
          publicProfile.emergency_contact_name = preferences.emergency_contact_name;
          publicProfile.emergency_contact_phone = preferences.emergency_contact_phone;
        }
      }

      // Betreuungshinweise
      if (shareSettings.carePreferences && preferences?.care_instructions) {
        publicProfile.care_instructions = preferences.care_instructions;
      }

      // Haustiere
      if (shareSettings.petDetails && pets && pets.length > 0) {
        publicProfile.pets = pets.map(pet => ({
          id: pet.id,
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
          age: pet.age,
          photo_url: pet.photo_url,
          gender: pet.gender,
          neutered: pet.neutered
        }));
      }

      return { data: publicProfile };

    } catch (error) {
      console.error('Exception beim Laden des öffentlichen Profils:', error);
      return { data: null, error: 'Unbekannter Fehler beim Laden des Profils' };
    }
  },

  /**
   * Lädt alle Verbindungen eines Owners (für Dashboard-Verwaltung)
   */
  getOwnerConnections: async (ownerId: string): Promise<{ data: OwnerCaretakerConnection[] | null; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('owner_caretaker_connections')
        .select(`
          *,
          caretaker:users!owner_caretaker_connections_caretaker_id_fkey(
            id, first_name, last_name, profile_photo_url
          )
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fehler beim Laden der Owner-Verbindungen:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Exception beim Laden der Owner-Verbindungen:', error);
      return { data: null, error: 'Unbekannter Fehler beim Laden der Verbindungen' };
    }
  },

  /**
   * Lädt alle Verbindungen eines Caretak eers
   */
  getCaretakerConnections: async (caretakerId: string): Promise<{ data: OwnerCaretakerConnection[] | null; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('owner_caretaker_connections')
        .select(`
          *,
          owner:users!owner_caretaker_connections_owner_id_fkey(
            id, first_name, last_name, profile_photo_url
          )
        `)
        .eq('caretaker_id', caretakerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fehler beim Laden der Caretaker-Verbindungen:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Exception beim Laden der Caretaker-Verbindungen:', error);
      return { data: null, error: 'Unbekannter Fehler beim Laden der Verbindungen' };
    }
  }
};

export default ownerPublicService; 