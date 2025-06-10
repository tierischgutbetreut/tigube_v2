import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Umgebungsvariablen für Supabase
// Unterstützt: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (lokal/Vite)
//              NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Supabase URL oder Anon Key fehlt! Bitte .env Datei prüfen und Dev-Server neu starten.');
}

// Supabase Client erstellen
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth-Hilfsfunktionen mit deutscher Fehlerübersetzung
const translateAuthError = (error: any): Error => {
  if (!error) return error;
  
  let germanMessage = error.message;
  
  if (error.message.includes('Unable to validate email address: invalid format')) {
    germanMessage = 'E-Mail-Adresse hat ein ungültiges Format';
  } else if (error.message.includes('Invalid login credentials')) {
    germanMessage = 'Ungültige Anmeldedaten';
  } else if (error.message.includes('Email not confirmed')) {
    germanMessage = 'E-Mail-Adresse wurde noch nicht bestätigt';
  } else if (error.message.includes('Too many requests')) {
    germanMessage = 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut';
  } else if (error.message.includes('User already registered')) {
    germanMessage = 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert';
  } else if (error.message.includes('Password should be at least')) {
    germanMessage = 'Das Passwort muss mindestens 6 Zeichen lang sein';
  } else if (error.message.includes('Signup is disabled')) {
    germanMessage = 'Registrierung ist derzeit deaktiviert';
  } else if (error.message.includes('Email rate limit exceeded')) {
    germanMessage = 'E-Mail-Limit erreicht. Bitte versuchen Sie es später erneut';
  }
  
  return new Error(germanMessage);
};

// Auth-Hilfsfunktionen
export const auth = {
  // Registrierung mit E-Mail und Passwort (mit optionalen Optionen)
  signUp: async (email: string, password: string, options?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(options || {})
    });
    
    if (error) {
      return { data, error: translateAuthError(error) };
    }
    
    return { data, error };
  },

  // Anmeldung mit E-Mail und Passwort
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { data, error: translateAuthError(error) };
    }
    
    return { data, error };
  },

  // Abmeldung
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: translateAuthError(error) };
    }
    return { error };
  },

  // Aktuellen Benutzer abrufen
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return { data, error: translateAuthError(error) };
    }
    return { data, error };
  },

  // Session abrufen
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { data, error: translateAuthError(error) };
    }
    return { data, error };
  },
};