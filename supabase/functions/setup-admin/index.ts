import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-setup-secret",
}

const usernamePattern = /^[A-Za-z0-9_]{3,32}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  })

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const sanitizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

const isStrongPassword = (password: string): boolean =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405)
  }

  try {
    const setupEnabled = (Deno.env.get("ENABLE_SETUP_ADMIN") ?? "").toLowerCase() === "true"
    if (!setupEnabled) {
      return jsonResponse(
        {
          success: false,
          error: "setup-admin is disabled. Set ENABLE_SETUP_ADMIN=true to run this function.",
        },
        403
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL") ?? ""
    const serviceRoleKey =
      Deno.env.get("SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      ""
    const setupSecret = Deno.env.get("SETUP_ADMIN_SECRET") ?? ""

    if (!supabaseUrl || !serviceRoleKey || !setupSecret) {
      return jsonResponse(
        {
          success: false,
          error:
            "Missing required environment variables. Expected SUPABASE_URL/PROJECT_URL, SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY, and SETUP_ADMIN_SECRET.",
        },
        500
      )
    }

    const rawPayload = await req.json().catch(() => ({}))
    const payload =
      rawPayload && typeof rawPayload === "object"
        ? (rawPayload as Record<string, unknown>)
        : {}

    const providedSecret =
      sanitizeString(req.headers.get("x-setup-secret")) ||
      sanitizeString(payload.setupSecret)

    if (!providedSecret || providedSecret !== setupSecret) {
      return jsonResponse({ success: false, error: "Invalid setup secret." }, 401)
    }

    const adminUsername =
      sanitizeString(payload.username) ||
      sanitizeString(Deno.env.get("SETUP_ADMIN_USERNAME"))
    const adminPassword =
      (typeof payload.password === "string" ? payload.password : "") ||
      (Deno.env.get("SETUP_ADMIN_PASSWORD") ?? "")
    const explicitEmail =
      sanitizeString(payload.email) ||
      sanitizeString(Deno.env.get("SETUP_ADMIN_EMAIL"))
    const adminEmail = explicitEmail || `${adminUsername}@typely.in`

    if (!usernamePattern.test(adminUsername)) {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid username. Use 3-32 characters containing only letters, numbers, and underscores.",
        },
        400
      )
    }

    if (!emailPattern.test(adminEmail)) {
      return jsonResponse({ success: false, error: "Invalid admin email." }, 400)
    }

    if (!isStrongPassword(adminPassword)) {
      return jsonResponse(
        {
          success: false,
          error:
            "Weak admin password. Use at least 12 characters with uppercase, lowercase, number, and symbol.",
        },
        400
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: existingProfile, error: existingError } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("username", adminUsername)
      .maybeSingle()

    if (existingError) {
      return jsonResponse({ success: false, error: existingError.message }, 500)
    }

    if (existingProfile) {
      return jsonResponse(
        {
          success: false,
          message: "Admin user already exists",
          username: adminUsername,
        },
        200
      )
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        username: adminUsername,
      },
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user")
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      username: adminUsername,
      email: adminEmail,
      role: "admin",
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Profile error: ${profileError.message}`)
    }

    return jsonResponse(
      {
        success: true,
        message: "Admin user created successfully",
        username: adminUsername,
        userId: authData.user.id,
      },
      200
    )
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: getErrorMessage(error),
      },
      400
    )
  }
})
