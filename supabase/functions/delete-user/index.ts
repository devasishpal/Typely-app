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
  console.log("[delete-user] request", { method: req.method, url: req.url })

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
      console.error("[delete-user] missing required env vars")
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
    console.log("[delete-user] auth header present", { hasAuthHeader: Boolean(authHeader), hasToken: Boolean(accessToken) })

    if (!accessToken) {
      return jsonResponse({ success: false, error: "Missing access token" }, 401)
    }

    const { userId } = await req.json().catch(() => ({}))
    console.log("[delete-user] payload", { userId })
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
      console.error("[delete-user] invalid caller session", { callerError: callerError?.message })
      return jsonResponse(
        { success: false, error: callerError?.message || "Invalid session" },
        401
      )
    }
    console.log("[delete-user] caller user resolved", { callerUserId: callerUser.id })

    if (callerUser.id !== userId) {
      console.error("[delete-user] caller/user mismatch", { callerUserId: callerUser.id, userId })
      return jsonResponse(
        { success: false, error: "You can only delete your own account" },
        403
      )
    }

    // Delete related rows first. Fail fast with explicit context when cleanup fails.
    const cleanupTasks = [
      { name: "lesson_progress.user_id", run: () => supabaseAdmin.from("lesson_progress").delete().eq("user_id", userId) },
      { name: "typing_sessions.user_id", run: () => supabaseAdmin.from("typing_sessions").delete().eq("user_id", userId) },
      { name: "typing_tests.user_id", run: () => supabaseAdmin.from("typing_tests").delete().eq("user_id", userId) },
      { name: "user_achievements.user_id", run: () => supabaseAdmin.from("user_achievements").delete().eq("user_id", userId) },
      { name: "statistics.user_id", run: () => supabaseAdmin.from("statistics").delete().eq("user_id", userId) },
      {
        name: "admin_notifications.actor_user_id",
        run: () => supabaseAdmin.from("admin_notifications").delete().eq("actor_user_id", userId),
      },
      { name: "profiles.id", run: () => supabaseAdmin.from("profiles").delete().eq("id", userId) },
    ]

    const cleanupErrors: string[] = []
    for (const task of cleanupTasks) {
      const { error } = await task.run()
      if (error) {
        cleanupErrors.push(`${task.name}: ${error.message}`)
      }
    }

    if (cleanupErrors.length > 0) {
      console.error("[delete-user] cleanup failed", { cleanupErrors })
      return jsonResponse(
        {
          success: false,
          error: "Cleanup failed before auth delete",
          details: cleanupErrors,
        },
        500
      )
    }

    // Delete auth user last
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("[delete-user] auth delete failed", { deleteError: deleteError.message })
      return jsonResponse(
        {
          success: false,
          error: deleteError.message,
          details: "auth.admin.deleteUser failed",
        },
        500
      )
    }

    console.log("[delete-user] success", { userId })
    return jsonResponse({ success: true }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[delete-user] unhandled error", { message })
    return jsonResponse({ success: false, error: message }, 500)
  }
})
