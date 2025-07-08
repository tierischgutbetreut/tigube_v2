-- Migration: Add sync_checkout_session_to_subscription function
-- This function syncs data from checkout_sessions to subscriptions table

CREATE OR REPLACE FUNCTION sync_checkout_session_to_subscription(p_checkout_session_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_checkout_session RECORD;
    v_user_id UUID;
    v_plan_type TEXT;
    v_user_type TEXT;
    v_subscription_id UUID;
BEGIN
    -- Log the start of the function
    RAISE LOG 'sync_checkout_session_to_subscription called with session_id: %', p_checkout_session_id;
    
    -- Fetch checkout session data
    SELECT * INTO v_checkout_session
    FROM checkout_sessions
    WHERE session_id = p_checkout_session_id;
    
    -- Check if checkout session exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Checkout session not found: %', p_checkout_session_id;
    END IF;
    
    RAISE LOG 'Found checkout session: % with amount: %', v_checkout_session.session_id, v_checkout_session.amount_total;
    
    -- Extract user_id from client_reference_id
    v_user_id := v_checkout_session.client_reference_id::UUID;
    
    -- Determine plan type based on amount
    CASE v_checkout_session.amount_total
        WHEN 490 THEN -- €4.90 for Owner Premium
            v_plan_type := 'premium';
            v_user_type := 'owner';
        WHEN 1290 THEN -- €12.90 for Caretaker Professional  
            v_plan_type := 'professional';
            v_user_type := 'caretaker';
        ELSE
            RAISE EXCEPTION 'Unknown amount for subscription: %', v_checkout_session.amount_total;
    END CASE;
    
    RAISE LOG 'Determined plan: % for user_type: %', v_plan_type, v_user_type;
    
    -- Check if subscription already exists for this checkout session
    SELECT id INTO v_subscription_id
    FROM subscriptions
    WHERE stripe_checkout_session_id = p_checkout_session_id;
    
    IF FOUND THEN
        RAISE LOG 'Subscription already exists: %', v_subscription_id;
        RETURN v_subscription_id;
    END IF;
    
    -- Create new subscription record
    INSERT INTO subscriptions (
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_checkout_session_id,
        plan_type,
        user_type,
        status,
        amount_paid_cents,
        currency,
        started_at,
        ends_at,
        metadata
    ) VALUES (
        v_user_id,
        v_checkout_session.customer,
        v_checkout_session.subscription,
        v_checkout_session.session_id,
        v_plan_type,
        v_user_type,
        'active',
        v_checkout_session.amount_total,
        v_checkout_session.currency,
        NOW(),
        NULL, -- Will be set when we get subscription details from Stripe
        jsonb_build_object(
            'payment_status', v_checkout_session.payment_status,
            'mode', v_checkout_session.mode,
            'created_at', v_checkout_session.created
        )
    ) RETURNING id INTO v_subscription_id;
    
    RAISE LOG 'Created subscription: %', v_subscription_id;
    
    -- Update user premium features (trigger will handle this automatically)
    -- But let's also call the function explicitly to ensure it runs
    PERFORM update_user_premium_features(v_user_id);
    
    RAISE LOG 'Updated user premium features for user: %', v_user_id;
    
    RETURN v_subscription_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in sync_checkout_session_to_subscription: %', SQLERRM;
        RAISE;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION sync_checkout_session_to_subscription(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_checkout_session_to_subscription(TEXT) TO service_role;

-- Add comment
COMMENT ON FUNCTION sync_checkout_session_to_subscription(TEXT) IS 'Syncs Stripe checkout session data to subscriptions table and updates user premium features'; 