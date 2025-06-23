-- Migration: weight Feld zur pets Tabelle hinzufügen
-- Date: 2025-02-02

-- Füge weight Spalte zur pets Tabelle hinzu
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS weight DECIMAL;

-- Kommentar für bessere Dokumentation
COMMENT ON COLUMN public.pets.weight IS 'Gewicht des Tieres in kg'; 