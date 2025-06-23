-- Migration: Create Admin System
-- Created: 2025-02-01
-- Description: Adds admin authentication and audit logging system

-- 1. Extend users table with admin fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role TEXT CHECK (admin_role IN ('super_admin', 'admin', 'moderator', 'support'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT; -- für 2FA
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMPTZ;

-- 2. Create admin_audit_logs table
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_values JSON,
  new_values JSON,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for better performance
CREATE INDEX idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for admin_audit_logs
CREATE POLICY "Super admins can view all audit logs" 
  ON admin_audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true 
      AND users.admin_role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view own audit logs" 
  ON admin_audit_logs FOR SELECT 
  USING (
    auth.uid() = admin_user_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true 
      AND users.admin_role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs" 
  ON admin_audit_logs FOR INSERT 
  WITH CHECK (true); -- Service role kann alles

-- 6. Create helper functions for admin operations
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_id UUID,
  action_name TEXT,
  table_name TEXT DEFAULT NULL,
  record_id UUID DEFAULT NULL,
  old_data JSON DEFAULT NULL,
  new_data JSON DEFAULT NULL,
  ip_addr INET DEFAULT NULL,
  user_agent_str TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_audit_logs (
    admin_user_id,
    action,
    target_table,
    target_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    admin_id,
    action_name,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_addr,
    user_agent_str
  );
END;
$$;

CREATE OR REPLACE FUNCTION check_admin_access(
  user_id UUID,
  required_role TEXT DEFAULT 'admin'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_admin_role TEXT;
  user_is_admin BOOLEAN;
BEGIN
  SELECT is_admin, admin_role 
  INTO user_is_admin, user_admin_role
  FROM users 
  WHERE id = user_id;
  
  -- Check if user is admin
  IF NOT user_is_admin THEN
    RETURN false;
  END IF;
  
  -- Super admin has access to everything
  IF user_admin_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Check specific role requirements
  CASE required_role
    WHEN 'super_admin' THEN
      RETURN user_admin_role = 'super_admin';
    WHEN 'admin' THEN
      RETURN user_admin_role IN ('super_admin', 'admin');
    WHEN 'moderator' THEN
      RETURN user_admin_role IN ('super_admin', 'admin', 'moderator');
    WHEN 'support' THEN
      RETURN user_admin_role IN ('super_admin', 'admin', 'moderator', 'support');
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 7. Create admin dashboard statistics function
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  -- Check if user has admin access
  IF NOT check_admin_access(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'total_owners', (SELECT COUNT(*) FROM users WHERE user_type = 'owner'),
    'total_caretakers', (SELECT COUNT(*) FROM users WHERE user_type = 'caretaker'),
    'active_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active', 'trial')),
    'total_conversations', (SELECT COUNT(*) FROM conversations),
    'total_messages', (SELECT COUNT(*) FROM messages),
    'total_revenue', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM billing_history 
      WHERE payment_status = 'paid'
    ),
    'users_last_30_days', (
      SELECT COUNT(*) 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- 8. Update updated_at trigger for admin audit logs
CREATE TRIGGER update_admin_audit_logs_updated_at
  BEFORE UPDATE ON admin_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert initial super admin (only if no admins exist yet)
-- This should be manually configured in production
DO $$
BEGIN
  -- Only create initial admin if no admins exist
  IF NOT EXISTS (SELECT 1 FROM users WHERE is_admin = true) THEN
    -- Log that we're creating initial admin setup
    RAISE NOTICE 'No admin users found. Initial admin setup should be done manually via Supabase dashboard.';
    RAISE NOTICE 'To create an admin: UPDATE users SET is_admin = true, admin_role = ''super_admin'' WHERE email = ''your-admin-email@domain.com'';';
  END IF;
END $$; 