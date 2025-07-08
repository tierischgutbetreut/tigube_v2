import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('🚀 sync-checkout-session function called')
    
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

    console.log('🔍 Processing checkout session:', checkout_session_id)

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call the sync function
    console.log('📞 Calling sync_checkout_session_to_subscription function')
    const { data, error } = await supabase.rpc('sync_checkout_session_to_subscription', {
      p_checkout_session_id: checkout_session_id
    })

    if (error) {
      console.error('❌ Database function error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Database sync failed', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Sync completed successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription_id: data,
        message: 'Checkout session synced successfully' 
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
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 