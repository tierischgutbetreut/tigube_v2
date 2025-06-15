import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response('Webhook secret or signature missing', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseClient, session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(supabaseClient, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabaseClient, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseClient, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabaseClient, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseClient, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions for handling different events
async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  console.log(`Checkout completed for session: ${session.id}`);
  
  const { userId, planType, userType } = session.metadata || {};
  
  if (!userId || !planType || !userType) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update user's subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      plan_type: planType,
      billing_start_date: new Date().toISOString(),
      billing_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      payment_method_id: session.payment_method,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
    return;
  }

  // Update user profile with new limits based on plan
  await updateUserProfileForPlan(supabase, userId, planType);
  
  console.log(`Successfully activated ${planType} subscription for user ${userId}`);
}

async function handleSubscriptionCreated(supabase: any, subscription: Stripe.Subscription) {
  console.log(`Subscription created: ${subscription.id}`);
  
  const { userId, planType } = subscription.metadata || {};
  
  if (!userId || !planType) {
    console.error('Missing metadata in subscription');
    return;
  }

  // Log billing history
  await supabase
    .from('billing_history')
    .insert({
      subscription_id: (await getSubscriptionByUserId(supabase, userId))?.id,
      amount: subscription.items.data[0]?.price.unit_amount / 100, // Convert from cents
      currency: subscription.currency.toUpperCase(),
      billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      billing_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      payment_status: 'paid',
      stripe_invoice_id: subscription.latest_invoice
    });
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}`);
  // Handle subscription changes (plan upgrades, etc.)
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);
  
  const { userId } = subscription.metadata || {};
  
  if (userId) {
    // Downgrade to basic plan
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        plan_type: 'basic',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Reset user profile to basic limits
    await updateUserProfileForPlan(supabase, userId, 'basic');
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  // Update billing history, extend subscription period
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);
  // Handle failed payments, maybe send notification
}

// Helper function to get subscription by user ID
async function getSubscriptionByUserId(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
  
  return data;
}

// Helper function to update user profile based on plan
async function updateUserProfileForPlan(supabase: any, userId: string, planType: string) {
  const limits = getPlanLimits(planType);
  
  const { error } = await supabase
    .from('users')
    .update({
      max_contact_requests: limits.maxContactRequests,
      max_bookings: limits.maxBookings,
      show_ads: !limits.adFree,
      premium_badge: limits.premiumBadge,
      search_priority: limits.searchPriority
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
  }
}

// Plan limits configuration
function getPlanLimits(planType: string) {
  switch (planType) {
    case 'premium':
      return {
        maxContactRequests: 999,
        maxBookings: 999,
        adFree: true,
        premiumBadge: false,
        searchPriority: 1
      };
    case 'professional':
      return {
        maxContactRequests: 999,
        maxBookings: 999,
        adFree: true,
        premiumBadge: true,
        searchPriority: 2
      };
    default: // basic
      return {
        maxContactRequests: 3,
        maxBookings: 3,
        adFree: false,
        premiumBadge: false,
        searchPriority: 0
      };
  }
} 