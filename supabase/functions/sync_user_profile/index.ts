import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { user } = await req.json();
    if (!user) {
      return new Response(JSON.stringify({ error: 'No user data provided' }), { status: 400 });
    }

    // Supabase Service Key (aus den Umgebungsvariablen)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Metadaten aus Auth-User
    const { id, user_metadata } = user;
    const first_name = user_metadata?.first_name || null;
    const last_name = user_metadata?.last_name || null;

    // Update users-Tabelle
    const { error } = await supabase
      .from("users")
      .update({ first_name, last_name })
      .eq("id", id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 