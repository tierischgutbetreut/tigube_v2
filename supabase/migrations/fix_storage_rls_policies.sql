-- Fix Storage RLS Policies für Tigube v2
-- Behebt RLS-Probleme beim Upload von Caretaker Home Photos während der Registrierung

-- 1. Prüfe aktuelle Storage RLS Status
SELECT 'Current Storage RLS Status:' as info;
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- 2. Lösche alle bestehenden Storage Policies um Konflikte zu vermeiden
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

-- Lösche auch mögliche generische Policies
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;

-- 3. Stelle sicher dass RLS aktiviert ist
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Erstelle neue, permissive Storage Policies für caretaker-home-photos

-- Upload Policy - Authentifizierte User können in ihren eigenen Ordner uploaden
CREATE POLICY "caretaker_home_photos_insert_policy" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'caretaker-home-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read Policy - Alle können caretaker home photos lesen
CREATE POLICY "caretaker_home_photos_select_policy" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'caretaker-home-photos');

-- Update Policy - User können nur ihre eigenen Dateien updaten
CREATE POLICY "caretaker_home_photos_update_policy" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'caretaker-home-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete Policy - User können nur ihre eigenen Dateien löschen
CREATE POLICY "caretaker_home_photos_delete_policy" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'caretaker-home-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Erstelle ähnliche Policies für profile-photos

CREATE POLICY "profile_photos_insert_policy" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_select_policy" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_update_policy" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'profile-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_delete_policy" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'profile-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Erstelle ähnliche Policies für pet-photos

CREATE POLICY "pet_photos_insert_policy" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'pet-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pet_photos_select_policy" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'pet-photos');

CREATE POLICY "pet_photos_update_policy" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'pet-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pet_photos_delete_policy" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'pet-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7. Überprüfe die Bucket-Konfiguration
SELECT 'Storage Buckets:' as info;
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name IN ('caretaker-home-photos', 'profile-photos', 'pet-photos');

-- 8. Zeige die neu erstellten Policies
SELECT 'Created Storage Policies:' as info;
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%photos%'
ORDER BY policyname, cmd;

-- 9. Test die Storage-Berechtigung für einen authentifizierten User
SELECT 'Storage RLS Test completed. Try uploading photos now.' as result; 