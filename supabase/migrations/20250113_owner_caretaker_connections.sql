-- Migration: Owner-Caretaker Connections für öffentliche Profile
-- Erstellt: 13.01.2025
-- Zweck: Verwaltet welche Betreuer auf welche Tierbesitzer-Profile zugreifen dürfen

-- 1. Tabelle für Owner-Caretaker Verbindungen erstellen
CREATE TABLE IF NOT EXISTS public.owner_caretaker_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  caretaker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked')) NOT NULL,
  
  -- Eindeutige Verbindung pro Owner-Caretaker Paar
  UNIQUE(owner_id, caretaker_id)
);

-- 2. Indizes für Performance-Optimierung
CREATE INDEX IF NOT EXISTS idx_owner_caretaker_connections_owner_id 
  ON public.owner_caretaker_connections(owner_id);

CREATE INDEX IF NOT EXISTS idx_owner_caretaker_connections_caretaker_id 
  ON public.owner_caretaker_connections(caretaker_id);

CREATE INDEX IF NOT EXISTS idx_owner_caretaker_connections_status 
  ON public.owner_caretaker_connections(status);

-- Composite Index für häufige Lookup-Queries
CREATE INDEX IF NOT EXISTS idx_owner_caretaker_lookup 
  ON public.owner_caretaker_connections(owner_id, caretaker_id, status);

-- 3. Trigger für automatische updated_at Aktualisierung
CREATE OR REPLACE FUNCTION public.update_owner_caretaker_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_owner_caretaker_connections_updated_at
  BEFORE UPDATE ON public.owner_caretaker_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_owner_caretaker_connections_updated_at();

-- 4. Row Level Security (RLS) aktivieren
ALTER TABLE public.owner_caretaker_connections ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies erstellen

-- Policy: Benutzer können ihre eigenen Verbindungen sehen (als Owner oder Caretaker)
CREATE POLICY "Users can view their own connections" 
ON public.owner_caretaker_connections
FOR SELECT 
USING (
  auth.uid() = owner_id OR auth.uid() = caretaker_id
);

-- Policy: Nur Owner können neue Verbindungen erstellen (durch Chat/Kontakt)
CREATE POLICY "Owners can create connections" 
ON public.owner_caretaker_connections
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id
);

-- Policy: Beide Parteien können Status ändern (z.B. blockieren)
CREATE POLICY "Both parties can update connection status" 
ON public.owner_caretaker_connections
FOR UPDATE 
USING (
  auth.uid() = owner_id OR auth.uid() = caretaker_id
) 
WITH CHECK (
  auth.uid() = owner_id OR auth.uid() = caretaker_id
);

-- Policy: Beide Parteien können Verbindungen löschen
CREATE POLICY "Both parties can delete connections" 
ON public.owner_caretaker_connections
FOR DELETE 
USING (
  auth.uid() = owner_id OR auth.uid() = caretaker_id
);

-- 6. Mock-Daten basierend auf bestehenden Chat-Verbindungen einfügen
-- Diese Daten simulieren bestehende Kontakte aus dem OwnerDashboardPage

-- Beispiel-Verbindungen für Demo-User (falls diese existieren)
-- Diese werden nur eingefügt wenn die User-IDs existieren
DO $$
DECLARE
  demo_owner_id UUID;
  demo_caretaker_id UUID;
BEGIN
  -- Versuche Demo-Owner zu finden (falls vorhanden)
  SELECT id INTO demo_owner_id 
  FROM public.users 
  WHERE email ILIKE '%owner%' OR user_type = 'owner' 
  LIMIT 1;
  
  -- Versuche Demo-Caretaker zu finden (falls vorhanden)  
  SELECT id INTO demo_caretaker_id 
  FROM public.users 
  WHERE email ILIKE '%caretaker%' OR user_type = 'caretaker' 
  LIMIT 1;
  
  -- Füge Verbindung ein falls beide User existieren
  IF demo_owner_id IS NOT NULL AND demo_caretaker_id IS NOT NULL THEN
    INSERT INTO public.owner_caretaker_connections (owner_id, caretaker_id, status)
    VALUES (demo_owner_id, demo_caretaker_id, 'active')
    ON CONFLICT (owner_id, caretaker_id) DO NOTHING;
    
    RAISE NOTICE 'Demo-Verbindung zwischen Owner % und Caretaker % erstellt', demo_owner_id, demo_caretaker_id;
  ELSE
    RAISE NOTICE 'Keine Demo-User gefunden - keine Mock-Verbindungen erstellt';
  END IF;
END $$;

-- 7. Hilfsfunktion: Prüft ob Caretaker auf Owner-Profil zugreifen darf
CREATE OR REPLACE FUNCTION public.check_caretaker_access(
  target_owner_id UUID,
  requesting_caretaker_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.owner_caretaker_connections 
    WHERE owner_id = target_owner_id 
      AND caretaker_id = requesting_caretaker_id 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Kommentare für Dokumentation
COMMENT ON TABLE public.owner_caretaker_connections IS 
'Verwaltet Beziehungen zwischen Tierbesitzern und Betreuern für Zugriff auf öffentliche Profile';

COMMENT ON COLUMN public.owner_caretaker_connections.status IS 
'Status der Verbindung: active = Zugriff erlaubt, blocked = Zugriff gesperrt';

COMMENT ON FUNCTION public.check_caretaker_access(UUID, UUID) IS 
'Hilfsfunktion: Prüft ob ein Betreuer auf das öffentliche Profil eines Besitzers zugreifen darf';

-- Migration erfolgreich abgeschlossen
-- Tabelle: owner_caretaker_connections ✅
-- Indizes: Performance-optimiert ✅  
-- RLS: Sicherheitsrichtlinien ✅
-- Mock-Daten: Demo-Verbindungen ✅
-- Hilfsfunktionen: Zugriffsprüfung ✅ 