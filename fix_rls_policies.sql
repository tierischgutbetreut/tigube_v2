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

-- Zeige finale Policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, cmd; 