// Server-side sign-in-by-username. Resolves the username to an email using
// the service-role key, then performs password sign-in server-side and
// returns the resulting Supabase session to the caller. The raw email is
// never disclosed, preventing username -> email enumeration through this
// endpoint.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GENERIC_ERROR = "Invalid username or password";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || username.length > 100 || !password || password.length > 200) {
      return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await admin
      .from("kommenszlapf_profiles")
      .select("email")
      .ilike("username", username)
      .maybeSingle();

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Perform password sign-in server-side using the anon client so we
    // never leak the resolved email address back to the caller.
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: signInData, error: signInError } =
      await authClient.auth.signInWithPassword({
        email: profile.email,
        password,
      });

    if (signInError || !signInData?.session) {
      return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    return new Response(JSON.stringify({ session: signInData.session }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});