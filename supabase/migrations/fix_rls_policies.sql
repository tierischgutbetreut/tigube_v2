-- Überprüfe aktuelle RLS Policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, cmd;

-- Überprüfe ob RLS aktiviert ist
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversations', 'messages');

-- DELETE Policy für messages (falls nicht vorhanden)
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" 
  ON messages 
  FOR DELETE 
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.owner_id = auth.uid() OR c.caretaker_id = auth.uid())
    )
  );

-- DELETE Policy für conversations (falls nicht vorhanden)
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
CREATE POLICY "Users can delete their own conversations" 
  ON conversations 
  FOR DELETE 
  USING (
    owner_id = auth.uid() OR caretaker_id = auth.uid()
  );

-- SELECT Policy für conversations (falls benötigt)
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" 
  ON conversations 
  FOR SELECT 
  USING (
    owner_id = auth.uid() OR caretaker_id = auth.uid()
  );

-- SELECT Policy für messages (falls benötigt)
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" 
  ON messages 
  FOR SELECT 
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.owner_id = auth.uid() OR c.caretaker_id = auth.uid())
    )
  );

-- INSERT Policy für messages (falls benötigt)
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
CREATE POLICY "Users can insert messages in their conversations" 
  ON messages 
  FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.owner_id = auth.uid() OR c.caretaker_id = auth.uid())
    )
  );

-- **NEUE RLS-POLICY FÜR OWNER_PREFERENCES**
-- Betreuer können die Präferenzen ihrer gespeicherten Kunden lesen
DROP POLICY IF EXISTS "Betreuer können Präferenzen ihrer Kunden sehen" ON owner_preferences;
CREATE POLICY "Betreuer können Präferenzen ihrer Kunden sehen" 
  ON owner_preferences 
  FOR SELECT 
  USING (
    -- Besitzer kann seine eigenen Präferenzen sehen
    auth.uid() = owner_id 
    OR 
    -- Betreuer kann Präferenzen seiner gespeicherten Kunden sehen
    EXISTS (
      SELECT 1 FROM owner_caretaker_connections occ 
      WHERE occ.owner_id = owner_preferences.owner_id 
      AND occ.caretaker_id = auth.uid()
    )
  );

-- **NEUE RLS-POLICY FÜR PETS**
-- Betreuer können die Haustiere ihrer gespeicherten Kunden sehen
DROP POLICY IF EXISTS "Betreuer können Haustiere ihrer Kunden sehen" ON pets;
CREATE POLICY "Betreuer können Haustiere ihrer Kunden sehen" 
  ON pets 
  FOR SELECT 
  USING (
    -- Besitzer kann seine eigenen Haustiere sehen
    auth.uid() = owner_id 
    OR 
    -- Betreuer kann Haustiere seiner gespeicherten Kunden sehen
    EXISTS (
      SELECT 1 FROM owner_caretaker_connections occ 
      WHERE occ.owner_id = pets.owner_id 
      AND occ.caretaker_id = auth.uid()
    )
  );

-- Zeige finale Policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'owner_preferences')
ORDER BY tablename, cmd; 