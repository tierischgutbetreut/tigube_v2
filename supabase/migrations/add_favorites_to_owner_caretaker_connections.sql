-- Migration: Favoriten-Funktionalität für Owner-Caretaker Verbindungen
-- Erstellt: 2025-02-02
-- Zweck: Ermöglicht es Besitzern, ihre Lieblings-Betreuer zu markieren

-- 1. is_favorite Spalte zur bestehenden Tabelle hinzufügen
ALTER TABLE public.owner_caretaker_connections 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS is_caretaker BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Index für Performance bei Favoriten-Abfragen
CREATE INDEX IF NOT EXISTS idx_owner_caretaker_connections_favorites 
  ON public.owner_caretaker_connections(owner_id, is_favorite) 
  WHERE is_favorite = TRUE;

-- 3. Index für Performance bei Betreuer-Abfragen
CREATE INDEX IF NOT EXISTS idx_owner_caretaker_connections_caretakers 
  ON public.owner_caretaker_connections(owner_id, is_caretaker) 
  WHERE is_caretaker = TRUE;

-- 4. Kommentar für Dokumentation
COMMENT ON COLUMN public.owner_caretaker_connections.is_favorite IS 
'Markiert ob dieser Betreuer als Favorit des Besitzers markiert ist';

-- 5. Update existing records to mark them as caretakers (since they were saved from chats)
UPDATE public.owner_caretaker_connections 
SET is_caretaker = TRUE 
WHERE is_caretaker IS NULL OR is_caretaker = FALSE;

-- 6. Add constraint: a connection cannot be both favorite and caretaker
ALTER TABLE public.owner_caretaker_connections 
ADD CONSTRAINT check_favorite_or_caretaker_not_both 
CHECK (NOT (is_favorite = TRUE AND is_caretaker = TRUE));

-- Migration erfolgreich abgeschlossen
-- Spalte: is_favorite hinzugefügt ✅
-- Index: Favoriten-Performance optimiert ✅
-- Index: Betreuer-Performance optimiert ✅
-- Dokumentation: Kommentar hinzugefügt ✅ 