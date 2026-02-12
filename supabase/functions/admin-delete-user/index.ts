import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  })

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SERVICE_ROLE_KEY") ??
      ""

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(
        {
          success: false,
          error: "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY",
        },
        500
      )
    }

    const authHeader = req.headers.get("Authorization") ?? ""
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Missing authorization header" }, 401)
    }

    const { userId } = await req.json().catch(() => ({}))
    if (!userId || typeof userId !== "string") {
      return jsonResponse({ success: false, error: "Missing userId" }, 400)
    }

    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user: callerUser },
      error: callerError,
    } = await supabaseUserClient.auth.getUser()

    if (callerError || !callerUser) {
      return jsonResponse(
        { success: false, error: callerError?.message || "Invalid session" },
        401
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .maybeSingle()

    if (profileError) {
      return jsonResponse(
        { success: false, error: `Failed to verify admin: ${profileError.message}` },
        500
      )
    }

    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse(
        { success: false, error: "Only admins can delete other users" },
        403
      )
    }

    await Promise.allSettled([
      supabaseAdmin.from("lesson_progress").delete().eq("user_id", userId),
      supabaseAdmin.from("typing_sessions").delete().eq("user_id", userId),
      supabaseAdmin.from("typing_tests").delete().eq("user_id", userId),
      supabaseAdmin.from("user_achievements").delete().eq("user_id", userId),
      supabaseAdmin.from("statistics").delete().eq("user_id", userId),
      supabaseAdmin.from("admin_notifications").delete().eq("actor_user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ])

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      return jsonResponse({ success: false, error: deleteError.message }, 500)
    }

    return jsonResponse({ success: true }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ success: false, error: message }, 500)
  }
})
