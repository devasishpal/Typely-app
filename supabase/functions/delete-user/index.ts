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

const isMissingRelationError = (error: unknown) => {
  if (!error || typeof error !== "object") return false

  const code =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : ""
  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message.toLowerCase()
      : ""

  return code === "42P01" || message.includes("does not exist")
}

serve(async (req: Request) => {
  console.log("[delete-user] request", { method: req.method, url: req.url })

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SERVICE_ROLE_KEY") ??
      ""

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("[delete-user] missing required env vars")
      return jsonResponse(
        {
          success: false,
          error: "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY",
        },
        500
      )
    }

    const authHeader = req.headers.get("Authorization") ?? ""
    console.log("[delete-user] auth header present", { hasAuthHeader: Boolean(authHeader) })

    if (!authHeader) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401)
    }

    const { userId } = await req.json().catch(() => ({}))
    const targetUserId = typeof userId === "string" ? userId.trim() : ""
    console.log("[delete-user] payload", { userId: targetUserId })
    if (!targetUserId) {
      return jsonResponse({ success: false, error: "Missing userId" }, 400)
    }

    // Verify caller JWT using anon key + forwarded Authorization header.
    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user: callerUser },
      error: callerError,
    } = await supabaseUserClient.auth.getUser()

    if (callerError || !callerUser) {
      console.error("[delete-user] invalid caller session", { callerError: callerError?.message })
      return jsonResponse(
        { success: false, error: callerError?.message || "Invalid session" },
        401
      )
    }
    console.log("[delete-user] caller user resolved", { callerUserId: callerUser.id })

    // Service role client is only used for privileged deletes.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    if (callerUser.id !== targetUserId) {
      console.error("[delete-user] caller/user mismatch", { callerUserId: callerUser.id, targetUserId })
      return jsonResponse(
        { success: false, error: "You can only delete your own account" },
        403
      )
    }

    // Delete related rows first. Fail fast with explicit context when cleanup fails.
    const cleanupTasks = [
      { name: "user_certificates.user_id", run: () => supabaseAdmin.from("user_certificates").delete().eq("user_id", targetUserId) },
      { name: "leaderboard_scores.user_id", run: () => supabaseAdmin.from("leaderboard_scores").delete().eq("user_id", targetUserId) },
      { name: "lesson_progress.user_id", run: () => supabaseAdmin.from("lesson_progress").delete().eq("user_id", targetUserId) },
      { name: "typing_sessions.user_id", run: () => supabaseAdmin.from("typing_sessions").delete().eq("user_id", targetUserId) },
      { name: "typing_tests.user_id", run: () => supabaseAdmin.from("typing_tests").delete().eq("user_id", targetUserId) },
      { name: "typing_results.user_id", run: () => supabaseAdmin.from("typing_results").delete().eq("user_id", targetUserId) },
      { name: "user_achievements.user_id", run: () => supabaseAdmin.from("user_achievements").delete().eq("user_id", targetUserId) },
      { name: "statistics.user_id", run: () => supabaseAdmin.from("statistics").delete().eq("user_id", targetUserId) },
      { name: "account_deletion_requests.user_id", run: () => supabaseAdmin.from("account_deletion_requests").delete().eq("user_id", targetUserId) },
      {
        name: "admin_notifications.actor_user_id",
        run: () => supabaseAdmin.from("admin_notifications").delete().eq("actor_user_id", targetUserId),
      },
      { name: "profiles.id", run: () => supabaseAdmin.from("profiles").delete().eq("id", targetUserId) },
    ]

    const cleanupErrors: string[] = []
    for (const task of cleanupTasks) {
      const { error } = await task.run()
      if (error) {
        if (isMissingRelationError(error)) {
          console.warn("[delete-user] skipping missing relation cleanup", { task: task.name })
          continue
        }
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
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

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

    console.log("[delete-user] success", { userId: targetUserId })
    return jsonResponse({ success: true }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[delete-user] unhandled error", { message })
    return jsonResponse({ success: false, error: message }, 500)
  }
})
