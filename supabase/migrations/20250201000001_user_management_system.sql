-- Migration: User Management System
-- Created: 2025-02-01
-- Description: Extends admin system with user management capabilities

-- 1. Create support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category TEXT CHECK (category IN ('account', 'billing', 'technical', 'feature', 'complaint', 'other')) DEFAULT 'other',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 2. Create user analytics table for tracking patterns
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSON,
  date_recorded DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create user notes table for admin comments
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_type TEXT CHECK (note_type IN ('general', 'warning', 'positive', 'billing', 'technical')) DEFAULT 'general',
  content TEXT NOT NULL,
  is_visible_to_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create indexes for performance
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_admin_id ON support_tickets(assigned_admin_id);
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_metric_type ON user_analytics(metric_type);
CREATE INDEX idx_user_analytics_date_recorded ON user_analytics(date_recorded);
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);

-- 5. Enable RLS on new tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets" 
  ON support_tickets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" 
  ON support_tickets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" 
  ON support_tickets FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 7. RLS Policies for user_analytics (admin-only)
CREATE POLICY "Admins can manage user analytics" 
  ON user_analytics FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 8. RLS Policies for user_notes
CREATE POLICY "Users can view own visible notes" 
  ON user_notes FOR SELECT 
  USING (auth.uid() = user_id AND is_visible_to_user = true);

CREATE POLICY "Admins can manage all notes" 
  ON user_notes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 9. Create enhanced admin functions
CREATE OR REPLACE FUNCTION get_user_management_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  -- Check admin access
  IF NOT check_admin_access(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'active_users_7d', (
      SELECT COUNT(DISTINCT user_id) 
      FROM conversations 
      WHERE last_message_at >= NOW() - INTERVAL '7 days'
    ),
    'new_registrations_7d', (
      SELECT COUNT(*) 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    ),
    'pending_support_tickets', (
      SELECT COUNT(*) 
      FROM support_tickets 
      WHERE status IN ('open', 'in_progress')
    ),
    'user_type_distribution', (
      SELECT json_object_agg(user_type, count)
      FROM (
        SELECT 
          COALESCE(user_type, 'unknown') as user_type, 
          COUNT(*) as count
        FROM users 
        GROUP BY user_type
      ) t
    ),
    'subscription_distribution', (
      SELECT json_object_agg(plan_type, count)
      FROM (
        SELECT 
          s.plan_type, 
          COUNT(*) as count
        FROM subscriptions s
        WHERE s.status IN ('active', 'trial')
        GROUP BY s.plan_type
      ) t
    ),
    'geographic_distribution', (
      SELECT json_object_agg(city, count)
      FROM (
        SELECT 
          COALESCE(city, 'Unknown') as city, 
          COUNT(*) as count
        FROM users 
        WHERE city IS NOT NULL
        GROUP BY city
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_details(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSON;
BEGIN
  -- Check admin access
  IF NOT check_admin_access(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  SELECT json_build_object(
    'user_info', to_json(u.*),
    'subscription_info', (
      SELECT to_json(s.*) 
      FROM subscriptions s 
      WHERE s.user_id = target_user_id 
      ORDER BY s.created_at DESC 
      LIMIT 1
    ),
    'caretaker_profile', (
      SELECT to_json(cp.*) 
      FROM caretaker_profiles cp 
      WHERE cp.id = target_user_id
    ),
    'owner_preferences', (
      SELECT to_json(op.*) 
      FROM owner_preferences op 
      WHERE op.owner_id = target_user_id
    ),
    'recent_activity', (
      SELECT json_agg(
        json_build_object(
          'type', 'conversation',
          'timestamp', c.last_message_at,
          'details', json_build_object(
            'conversation_id', c.id,
            'status', c.status
          )
        )
      )
      FROM conversations c
      WHERE c.owner_id = target_user_id OR c.caretaker_id = target_user_id
      ORDER BY c.last_message_at DESC
      LIMIT 5
    ),
    'support_tickets', (
      SELECT json_agg(to_json(st.*))
      FROM support_tickets st
      WHERE st.user_id = target_user_id
      ORDER BY st.created_at DESC
      LIMIT 10
    ),
    'admin_notes', (
      SELECT json_agg(
        json_build_object(
          'id', un.id,
          'note_type', un.note_type,
          'content', un.content,
          'is_visible_to_user', un.is_visible_to_user,
          'created_at', un.created_at,
          'admin_name', u.first_name || ' ' || u.last_name
        )
      )
      FROM user_notes un
      LEFT JOIN users u ON u.id = un.admin_id
      WHERE un.user_id = target_user_id
      ORDER BY un.created_at DESC
    )
  ) INTO user_data
  FROM users u
  WHERE u.id = target_user_id;
  
  RETURN user_data;
END;
$$;

CREATE OR REPLACE FUNCTION search_users(
  search_term TEXT DEFAULT NULL,
  user_type_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 50,
  offset_count INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results JSON;
BEGIN
  -- Check admin access
  IF NOT check_admin_access(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  SELECT json_build_object(
    'users', (
      SELECT json_agg(
        json_build_object(
          'id', u.id,
          'email', u.email,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'user_type', u.user_type,
          'city', u.city,
          'created_at', u.created_at,
          'profile_completed', u.profile_completed,
          'subscription_status', COALESCE(s.status, 'none'),
          'subscription_plan', s.plan_type,
          'last_activity', GREATEST(
            u.updated_at,
            COALESCE(c1.last_message_at, '1970-01-01'::timestamptz),
            COALESCE(c2.last_message_at, '1970-01-01'::timestamptz)
          )
        )
      )
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trial')
      LEFT JOIN conversations c1 ON c1.owner_id = u.id
      LEFT JOIN conversations c2 ON c2.caretaker_id = u.id
      WHERE 
        (search_term IS NULL OR 
         u.email ILIKE '%' || search_term || '%' OR
         u.first_name ILIKE '%' || search_term || '%' OR
         u.last_name ILIKE '%' || search_term || '%' OR
         u.city ILIKE '%' || search_term || '%')
        AND (user_type_filter IS NULL OR u.user_type = user_type_filter)
      ORDER BY u.created_at DESC
      LIMIT limit_count
      OFFSET offset_count
    ),
    'total_count', (
      SELECT COUNT(*)
      FROM users u
      WHERE 
        (search_term IS NULL OR 
         u.email ILIKE '%' || search_term || '%' OR
         u.first_name ILIKE '%' || search_term || '%' OR
         u.last_name ILIKE '%' || search_term || '%' OR
         u.city ILIKE '%' || search_term || '%')
        AND (user_type_filter IS NULL OR u.user_type = user_type_filter)
    )
  ) INTO results;
  
  RETURN results;
END;
$$;

-- 10. Create triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert sample analytics data for existing users
INSERT INTO user_analytics (user_id, metric_type, metric_value, metadata)
SELECT 
  u.id,
  'profile_completion_score',
  CASE 
    WHEN u.profile_completed THEN 100
    ELSE 50
  END,
  json_build_object(
    'has_profile_photo', u.profile_photo_url IS NOT NULL,
    'has_phone', u.phone_number IS NOT NULL,
    'has_address', u.city IS NOT NULL AND u.plz IS NOT NULL
  )
FROM users u; 