import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Nur POST-Requests erlauben
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Authorization header prüfen
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // JWT Token verifizieren mit normalem Client
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;
    console.log(`Lösche User: ${userId}`);

    // Admin Client für Service Role Operationen
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Alle abhängigen Daten löschen
    console.log('Lösche abhängige Daten...');
    
    // Haustiere löschen
    await supabaseAdmin
      .from('pets')
      .delete()
      .eq('owner_id', userId);

    // Besitzer-Präferenzen löschen
    await supabaseAdmin
      .from('owner_preferences')
      .delete()
      .eq('owner_id', userId);

    // Betreuer-Profile löschen (falls der User auch Betreuer ist)
    await supabaseAdmin
      .from('caretaker_profiles')
      .delete()
      .eq('user_id', userId);

    // 2. User-Profil aus users-Tabelle löschen
    console.log('Lösche User-Profil...');
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      console.error('Fehler beim Löschen des User-Profils:', deleteUserError);
      return new Response(JSON.stringify({ error: 'Failed to delete user profile' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. User aus Auth löschen (nur mit Service Role Key möglich)
    console.log('Lösche Auth-User...');
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Fehler beim Löschen des Auth-Users:', deleteAuthError);
      return new Response(JSON.stringify({ error: 'Failed to delete auth user' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`User ${userId} erfolgreich komplett gelöscht`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'User successfully deleted from auth and database'
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fehler beim Löschen des Users:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 