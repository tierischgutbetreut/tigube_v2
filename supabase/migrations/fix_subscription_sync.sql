-- Migration: Fix Subscription Sync - Real-time Premium Status Updates
-- Created: 2025-02-02
-- Description: Adds triggers and functions for automatic subscription sync

-- 1. Create enhanced function to update user premium features
CREATE OR REPLACE FUNCTION update_user_premium_features(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_subscription RECORD;
    plan_type_value TEXT;
BEGIN
    -- Log the function call
    RAISE LOG 'update_user_premium_features called for user: %', user_uuid;
    
    -- Get active subscription for user
    SELECT * INTO active_subscription
    FROM subscriptions
    WHERE user_id = user_uuid 
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Determine plan type
    IF active_subscription.id IS NOT NULL THEN
        plan_type_value := active_subscription.plan_type;
        RAISE LOG 'Found active subscription with plan: %', plan_type_value;
    ELSE
        plan_type_value := 'basic';
        RAISE LOG 'No active subscription found, using basic plan';
    END IF;
    
    -- Update user profile based on plan type
    IF plan_type_value = 'premium' THEN
        -- Owner Premium features
        UPDATE users SET
            show_ads = false,
            premium_badge = true,
            search_priority = 5,
            max_contact_requests = -1, -- unlimited
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RAISE LOG 'Applied premium features for user: %', user_uuid;
        
    ELSIF plan_type_value = 'professional' THEN
        -- Caretaker Professional features
        UPDATE users SET
            show_ads = false,
            premium_badge = true,
            search_priority = 10,
            max_contact_requests = -1, -- unlimited
            max_bookings = -1, -- unlimited
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RAISE LOG 'Applied professional features for user: %', user_uuid;
        
    ELSE
        -- Basic/Free plan
        UPDATE users SET
            show_ads = true,
            premium_badge = false,
            search_priority = 0,
            max_contact_requests = 3,
            max_bookings = 3,
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RAISE LOG 'Applied basic features for user: %', user_uuid;
    END IF;
    
    RAISE LOG 'Successfully updated user premium features for: %', user_uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in update_user_premium_features: %', SQLERRM;
        RAISE;
END;
$$;

-- 2. Create trigger function for automatic subscription updates
CREATE OR REPLACE FUNCTION trigger_update_user_premium_features()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Handle INSERT and UPDATE events
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        RAISE LOG 'Subscription trigger fired for user: % (operation: %)', NEW.user_id, TG_OP;
        PERFORM update_user_premium_features(NEW.user_id);
        RETURN NEW;
    END IF;
    
    -- Handle DELETE events
    IF TG_OP = 'DELETE' THEN
        RAISE LOG 'Subscription deleted for user: %', OLD.user_id;
        PERFORM update_user_premium_features(OLD.user_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- 3. Create trigger on subscriptions table
DROP TRIGGER IF EXISTS subscription_change_trigger ON subscriptions;
CREATE TRIGGER subscription_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_premium_features();

-- 4. Function to manually sync all user subscriptions (for admin use)
CREATE OR REPLACE FUNCTION sync_all_user_subscriptions()
RETURNS TABLE (user_id UUID, plan_type TEXT, success BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users with subscriptions
    FOR user_record IN 
        SELECT DISTINCT s.user_id, s.plan_type, s.status
        FROM subscriptions s
        WHERE s.status = 'active'
    LOOP
        BEGIN
            PERFORM update_user_premium_features(user_record.user_id);
            
            -- Return success
            user_id := user_record.user_id;
            plan_type := user_record.plan_type;
            success := true;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Return failure
                user_id := user_record.user_id;
                plan_type := user_record.plan_type;
                success := false;
                RETURN NEXT;
        END;
    END LOOP;
    
    -- Also process users without active subscriptions (set to basic)
    FOR user_record IN 
        SELECT u.id as user_id
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
        WHERE s.id IS NULL
    LOOP
        BEGIN
            PERFORM update_user_premium_features(user_record.user_id);
            
            -- Return success
            user_id := user_record.user_id;
            plan_type := 'basic';
            success := true;
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Return failure
                user_id := user_record.user_id;
                plan_type := 'basic';
                success := false;
                RETURN NEXT;
        END;
    END LOOP;
END;
$$;

-- 5. Function to get user's current subscription status with premium features
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    has_active_subscription BOOLEAN,
    plan_type TEXT,
    subscription_status TEXT,
    premium_badge BOOLEAN,
    show_ads BOOLEAN,
    search_priority INTEGER,
    max_contact_requests INTEGER,
    max_bookings INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_active_subscription,
        COALESCE(s.plan_type, 'basic') as plan_type,
        COALESCE(s.status, 'none') as subscription_status,
        u.premium_badge,
        u.show_ads,
        u.search_priority,
        u.max_contact_requests,
        u.max_bookings
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    WHERE u.id = user_uuid;
END;
$$;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_premium_features(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_premium_features(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION sync_all_user_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO service_role;

-- 7. Run initial sync for all existing users
SELECT sync_all_user_subscriptions();

-- 8. Add comments
COMMENT ON FUNCTION update_user_premium_features(UUID) IS 'Updates user premium features based on active subscription';
COMMENT ON FUNCTION trigger_update_user_premium_features() IS 'Trigger function to automatically update user features when subscription changes';
COMMENT ON FUNCTION sync_all_user_subscriptions() IS 'Admin function to manually sync all user subscriptions';
COMMENT ON FUNCTION get_user_subscription_status(UUID) IS 'Returns comprehensive subscription status for a user';

-- 9. Log completion
DO $$
BEGIN
    RAISE NOTICE 'Subscription sync migration completed successfully';
    RAISE NOTICE 'All users with active subscriptions will now automatically receive premium features';
    RAISE NOTICE 'Real-time updates are enabled via database triggers';
END $$; 