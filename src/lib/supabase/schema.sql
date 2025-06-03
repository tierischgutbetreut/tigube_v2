-- Schema für Tigube v2 Datenbank

-- Benutzer-Tabelle
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  postal_code TEXT,
  city TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'caregiver')),
  profile_completed BOOLEAN DEFAULT FALSE NOT NULL
);

-- Sicherheitsrichtlinien für Benutzer-Tabelle
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können nur ihre eigenen Daten sehen" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Benutzer können nur ihre eigenen Daten aktualisieren" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Haustier-Tabelle
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  owner_id UUID REFERENCES public.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  weight DECIMAL,
  photo_url TEXT,
  description TEXT
);

-- Sicherheitsrichtlinien für Haustier-Tabelle
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Besitzer können ihre eigenen Haustiere sehen" ON public.pets
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Besitzer können ihre eigenen Haustiere bearbeiten" ON public.pets
  FOR ALL USING (auth.uid() = owner_id);

-- Besitzer-Präferenzen-Tabelle
CREATE TABLE IF NOT EXISTS public.owner_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  owner_id UUID REFERENCES public.users NOT NULL UNIQUE,
  services TEXT[] NOT NULL,
  other_services TEXT,
  vet_info TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  care_instructions TEXT
);

-- Sicherheitsrichtlinien für Besitzer-Präferenzen-Tabelle
ALTER TABLE public.owner_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Besitzer können ihre eigenen Präferenzen sehen" ON public.owner_preferences
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Besitzer können ihre eigenen Präferenzen bearbeiten" ON public.owner_preferences
  FOR ALL USING (auth.uid() = owner_id);

-- Trigger für die Erstellung eines Benutzereintrags nach der Registrierung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, user_type, profile_completed)
  VALUES (new.id, new.email, '', '', 'owner', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();