-- Fix Storage Buckets für Tigube v2
-- Erstelle fehlende Storage Buckets und RLS-Policies

-- 1. Bucket für Caretaker Home Photos erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'caretaker-home-photos',
  'caretaker-home-photos', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Bucket für Profile Photos erstellen (falls nicht vorhanden)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 3. Bucket für Pet Photos erstellen (falls nicht vorhanden)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos',
  'pet-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 4. RLS für Storage Objects aktivieren (falls nicht bereits aktiviert)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Bestehende Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Caretaker home photos upload" ON storage.objects;
DROP POLICY IF EXISTS "Caretaker home photos read" ON storage.objects;
DROP POLICY IF EXISTS "Caretaker home photos update" ON storage.objects;
DROP POLICY IF EXISTS "Caretaker home photos delete" ON storage.objects;

DROP POLICY IF EXISTS "Profile photos upload" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos read" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos update" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos delete" ON storage.objects;

DROP POLICY IF EXISTS "Pet photos upload" ON storage.objects;
DROP POLICY IF EXISTS "Pet photos read" ON storage.objects;
DROP POLICY IF EXISTS "Pet photos update" ON storage.objects;
DROP POLICY IF EXISTS "Pet photos delete" ON storage.objects;

-- 6. Policies für caretaker-home-photos
CREATE POLICY "Caretaker home photos upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'caretaker-home-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Caretaker home photos read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'caretaker-home-photos'
  );

CREATE POLICY "Caretaker home photos update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'caretaker-home-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Caretaker home photos delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'caretaker-home-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7. Policies für profile-photos
CREATE POLICY "Profile photos upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Profile photos read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-photos'
  );

CREATE POLICY "Profile photos update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Profile photos delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 8. Policies für pet-photos
CREATE POLICY "Pet photos upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Pet photos read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pet-photos'
  );

CREATE POLICY "Pet photos update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pet-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Pet photos delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pet-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9. Verifikation - Zeige erstellte Buckets an
SELECT 'Buckets created:' as info;
SELECT name, public, file_size_limit FROM storage.buckets 
WHERE name IN ('caretaker-home-photos', 'profile-photos', 'pet-photos');

-- 10. Verifikation - Zeige erstellte Policies an
SELECT 'Storage Policies created:' as info;
SELECT policyname, cmd, bucket_id FROM storage.policies 
WHERE bucket_id IN ('caretaker-home-photos', 'profile-photos', 'pet-photos')
ORDER BY bucket_id, cmd; 