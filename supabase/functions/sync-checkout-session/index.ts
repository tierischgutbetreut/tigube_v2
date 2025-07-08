import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 sync-checkout-session function called (Payment Link Version)')
    
    // Parse request body
    const { checkout_session_id } = await req.json()
    
    if (!checkout_session_id) {
      console.error('❌ Missing checkout_session_id in request')
      return new Response(
        JSON.stringify({ error: 'Missing checkout_session_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Processing Payment Link checkout session:', checkout_session_id)

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
    })

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Get session data from Stripe API (since Payment Links don't go through our DB)
    console.log('📞 Fetching session from Stripe API...')
    const session = await stripe.checkout.sessions.retrieve(checkout_session_id, {
      expand: ['subscription', 'customer']
    })

    if (!session) {
      console.error('❌ Session not found in Stripe:', checkout_session_id)
      return new Response(
        JSON.stringify({ 
          error: 'Checkout session not found in Stripe', 
          details: `Session ${checkout_session_id} does not exist` 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Session found in Stripe:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      client_reference_id: session.client_reference_id
    })

    // Validate session is complete
    if (session.payment_status !== 'paid' || session.status !== 'complete') {
      console.warn('⚠️ Session not completed yet:', { 
        payment_status: session.payment_status, 
        status: session.status 
      })
      return new Response(
        JSON.stringify({ 
          error: 'Payment not completed yet', 
          details: `Payment status: ${session.payment_status}, Session status: ${session.status}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Extract user data
    const userId = session.client_reference_id
    
    if (!userId) {
      console.error('❌ No client_reference_id (user ID) in session')
      return new Response(
        JSON.stringify({ 
          error: 'User ID not found in session', 
          details: 'client_reference_id missing from Payment Link session' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 3: Determine plan and user type from amount
    let planType: string
    let userType: string
    
    switch (session.amount_total) {
      case 490: // €4.90 for Owner Premium
        planType = 'premium'
        userType = 'owner'
        break
      case 1290: // €12.90 for Caretaker Professional  
        planType = 'professional'
        userType = 'caretaker'
        break
      default:
        console.error('❌ Unknown amount for subscription:', session.amount_total)
        return new Response(
          JSON.stringify({ 
            error: 'Unknown subscription amount', 
            details: `Amount: ${session.amount_total} cents not recognized` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    console.log('🎯 Determined plan details:', { planType, userType, userId, amount: session.amount_total })

    // Step 4: Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_checkout_session_id', checkout_session_id)
      .single()

    if (existingSubscription) {
      console.log('✅ Subscription already exists:', existingSubscription.id)
      return new Response(
        JSON.stringify({ 
          success: true, 
          subscription_id: existingSubscription.id,
          message: 'Subscription already exists',
          status: 'already_synced'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 5: Create new subscription record
    console.log('📝 Creating new subscription record...')
    const { data: newSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        stripe_checkout_session_id: checkout_session_id,
        plan_type: planType,
        user_type: userType,
        status: 'active',
        amount_paid_cents: session.amount_total,
        currency: session.currency || 'eur',
        started_at: new Date().toISOString(),
        metadata: {
          payment_status: session.payment_status,
          mode: session.mode,
          created_at: session.created,
          source: 'payment_link'
        }
      })
      .select('id')
      .single()

    if (subscriptionError) {
      console.error('❌ Error creating subscription:', subscriptionError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create subscription', 
          details: subscriptionError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Subscription created:', newSubscription.id)

    // Step 6: Update user premium features
    console.log('🔄 Updating user premium features...')
    const { error: updateError } = await supabase.rpc('update_user_premium_features', {
      p_user_id: userId
    })

    if (updateError) {
      console.warn('⚠️ Warning: Failed to update user features (subscription still created):', updateError)
      // Don't fail the entire sync if feature update fails
    } else {
      console.log('✅ User premium features updated for user:', userId)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription_id: newSubscription.id,
        message: 'Payment Link checkout session synced successfully',
        plan_type: planType,
        user_type: userType,
        status: 'newly_synced'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 