-- Migration: Create Subscription System
-- Created: 2025-01-29
-- Description: Adds subscription tables and extends profiles for membership features

-- 1. Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'caretaker')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'professional')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  billing_start_date TIMESTAMPTZ,
  billing_end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_method_id TEXT, -- Stripe payment method ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create usage_tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('contact_request', 'booking_request', 'profile_view')),
  target_user_id UUID REFERENCES users(id),
  month_year TEXT NOT NULL, -- Format: '2025-01'
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, action_type, target_user_id, month_year)
);

-- 3. Create caretaker_images table
CREATE TABLE caretaker_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caretaker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('profile', 'environment')),
  image_category TEXT CHECK (image_category IN ('living_room', 'garden', 'sleeping_area', 'feeding_area', 'play_area', 'outdoor')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create billing_history table
CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Extend users table with subscription-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_contact_requests INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_bookings INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_ads BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_badge BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_priority INTEGER DEFAULT 0; -- 0=basic, 1=premium, 2=professional

-- 6. Create indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month_year);
CREATE INDEX idx_usage_tracking_action_type ON usage_tracking(action_type);
CREATE INDEX idx_caretaker_images_caretaker_id ON caretaker_images(caretaker_id);
CREATE INDEX idx_caretaker_images_type ON caretaker_images(image_type);
CREATE INDEX idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX idx_users_search_priority ON users(search_priority);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE caretaker_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" 
  ON subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" 
  ON subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions" 
  ON subscriptions FOR INSERT 
  WITH CHECK (true); -- Service role kann alles

-- 9. Create RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage" 
  ON usage_tracking FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage tracking" 
  ON usage_tracking FOR ALL 
  USING (true); -- Service role für automatisches Tracking

-- 10. Create RLS Policies for caretaker_images
CREATE POLICY "Anyone can view caretaker images" 
  ON caretaker_images FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "Caretakers can manage own images" 
  ON caretaker_images FOR ALL 
  USING (auth.uid() = caretaker_id);

-- 11. Create RLS Policies for billing_history
CREATE POLICY "Users can view own billing history" 
  ON billing_history FOR SELECT 
  USING (
    auth.uid() = (
      SELECT user_id FROM subscriptions 
      WHERE subscriptions.id = billing_history.subscription_id
    )
  );

-- 12. Create helper functions
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  plan_type TEXT,
  status TEXT,
  trial_end_date TIMESTAMPTZ,
  billing_end_date TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_type,
    s.status,
    s.trial_end_date,
    s.billing_end_date
  FROM subscriptions s
  WHERE s.user_id = user_uuid
  AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_monthly_usage(user_uuid UUID, action TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  usage_count INTEGER;
BEGIN
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  SELECT COALESCE(SUM(count), 0) INTO usage_count
  FROM usage_tracking
  WHERE user_id = user_uuid
    AND action_type = action
    AND month_year = current_month;
    
  RETURN usage_count;
END;
$$;

CREATE OR REPLACE FUNCTION track_user_action(
  user_uuid UUID,
  action TEXT,
  target_uuid UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  INSERT INTO usage_tracking (user_id, action_type, target_user_id, month_year, count)
  VALUES (user_uuid, action, target_uuid, current_month, 1)
  ON CONFLICT (user_id, action_type, target_user_id, month_year)
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    created_at = now();
END;
$$;

-- 13. Create function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(
  user_uuid UUID,
  feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  user_status TEXT;
BEGIN
  -- Get user's current subscription
  SELECT plan_type, status INTO user_plan, user_status
  FROM subscriptions
  WHERE user_id = user_uuid
    AND status IN ('active', 'trial')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to basic if no subscription found
  IF user_plan IS NULL THEN
    user_plan := 'basic';
  END IF;
  
  -- Feature access matrix
  CASE feature_name
    WHEN 'unlimited_contacts' THEN
      RETURN user_plan IN ('premium', 'professional');
    WHEN 'unlimited_bookings' THEN
      RETURN user_plan = 'professional';
    WHEN 'advanced_filters' THEN
      RETURN user_plan IN ('premium', 'professional');
    WHEN 'priority_ranking' THEN
      RETURN user_plan IN ('premium', 'professional');
    WHEN 'environment_images' THEN
      RETURN user_plan = 'professional';
    WHEN 'premium_badge' THEN
      RETURN user_plan IN ('premium', 'professional');
    WHEN 'ads_free' THEN
      RETURN user_plan IN ('premium', 'professional');
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 14. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 15. Insert beta trial subscriptions for existing users
DO $$
DECLARE
  user_record RECORD;
  trial_end_date TIMESTAMPTZ := '2025-10-31 23:59:59+00';
BEGIN
  -- Create trial subscriptions for all existing users
  FOR user_record IN SELECT id, user_type FROM users LOOP
    INSERT INTO subscriptions (
      user_id,
      user_type,
      plan_type,
      status,
      trial_start_date,
      trial_end_date
    ) VALUES (
      user_record.id,
      user_record.user_type,
      'basic',
      'trial',
      now(),
      trial_end_date
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 16. Update existing users with trial settings
UPDATE users SET
  max_contact_requests = 999, -- Unlimited during beta
  max_bookings = 999, -- Unlimited during beta
  show_ads = false, -- No ads during beta
  premium_badge = true, -- Everyone gets premium features during beta
  search_priority = 1 -- Everyone gets premium ranking during beta
WHERE subscription_id IS NULL;

-- 17. Link users to their subscriptions
UPDATE users SET subscription_id = (
  SELECT s.id FROM subscriptions s 
  WHERE s.user_id = users.id 
  ORDER BY s.created_at DESC 
  LIMIT 1
) WHERE subscription_id IS NULL; 