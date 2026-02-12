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
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SERVICE_ROLE_KEY") ??
      ""

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          success: false,
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        },
        500
      )
    }

    const authHeader = req.headers.get("Authorization") ?? ""
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim()

    if (!accessToken) {
      return jsonResponse({ success: false, error: "Missing access token" }, 401)
    }

    const { userId } = await req.json().catch(() => ({}))
    if (!userId) {
      return jsonResponse({ success: false, error: "Missing userId" }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user: callerUser },
      error: callerError,
    } = await supabaseAdmin.auth.getUser(accessToken)

    if (callerError || !callerUser) {
      return jsonResponse(
        { success: false, error: callerError?.message || "Invalid session" },
        401
      )
    }

    if (callerUser.id !== userId) {
      return jsonResponse(
        { success: false, error: "You can only delete your own account" },
        403
      )
    }

    // Delete related tables first
    await Promise.allSettled([
      supabaseAdmin.from("lesson_progress").delete().eq("user_id", userId),
      supabaseAdmin.from("typing_sessions").delete().eq("user_id", userId),
      supabaseAdmin.from("typing_tests").delete().eq("user_id", userId),
      supabaseAdmin.from("user_achievements").delete().eq("user_id", userId),
      supabaseAdmin.from("statistics").delete().eq("user_id", userId),
      supabaseAdmin.from("admin_notifications").delete().eq("actor_user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ])

    // Delete auth user last
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
