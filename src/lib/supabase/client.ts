import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Umgebungsvariablen für Supabase
// Unterstützt: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (lokal/Vite)
//              NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL oder Anon Key fehlt! Bitte .env Datei prüfen und Dev-Server neu starten.');
}

// Supabase Client erstellen
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth-Hilfsfunktionen
export const auth = {
  // Registrierung mit E-Mail und Passwort (mit optionalen Optionen)
  signUp: async (email: string, password: string, options?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(options || {})
    });
    return { data, error };
  },

  // Anmeldung mit E-Mail und Passwort
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Abmeldung
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Aktuellen Benutzer abrufen
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Session abrufen
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },
};