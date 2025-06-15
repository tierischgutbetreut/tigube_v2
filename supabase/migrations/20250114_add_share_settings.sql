-- Migration: Add share_settings to owner_preferences
-- Datum: 2025-01-14
-- Beschreibung: Fügt JSON-Spalte für Datenschutz-Einstellungen hinzu

-- Füge share_settings Spalte zur owner_preferences Tabelle hinzu
ALTER TABLE public.owner_preferences 
ADD COLUMN IF NOT EXISTS share_settings JSONB DEFAULT '{
  "phoneNumber": true,
  "email": false,
  "address": true,
  "vetInfo": true,
  "emergencyContact": false,
  "petDetails": true,
  "carePreferences": true
}'::jsonb;

-- Füge einen Index für bessere Performance hinzu
CREATE INDEX IF NOT EXISTS idx_owner_preferences_share_settings 
ON public.owner_preferences USING GIN (share_settings);

-- Kommentar für Dokumentation
COMMENT ON COLUMN public.owner_preferences.share_settings IS 
'JSON object containing privacy settings for sharing information with caretakers. Controls which data fields are visible to connected caretakers.'; 