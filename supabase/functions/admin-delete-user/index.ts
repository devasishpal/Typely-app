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

const sendAccountDeletedEmail = async (email: string) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""
  const fromEmail = Deno.env.get("ACCOUNT_DELETION_FROM_EMAIL") ?? "onboarding@resend.dev"
  const appName = Deno.env.get("APP_NAME") ?? "Typely"
  const supportEmail = Deno.env.get("SUPPORT_EMAIL") ?? "support@typely.app"
  const deletedAt = new Date().toUTCString()

  if (!resendApiKey) {
    return { success: false, error: "Missing RESEND_API_KEY for account deletion email." }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: `${appName}: Your account has been deleted`,
      text: [
        `Hello,`,
        ``,
        `This is a confirmation that your ${appName} account has been successfully deleted.`,
        `Deleted on: ${deletedAt}`,
        ``,
        `If you did not request this deletion, contact us immediately at ${supportEmail}.`,
        ``,
        `Regards,`,
        `${appName} Team`,
      ].join("\n"),
      html: `
        <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:20px 24px;background:#111827;color:#ffffff;font-size:20px;font-weight:700;">
                ${appName}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.3;color:#111827;">Your account has been deleted</h1>
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">
                  This is a confirmation that your <strong>${appName}</strong> account was successfully deleted.
                </p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                  Deleted on: <strong>${deletedAt}</strong>
                </p>
                <div style="margin:18px 0 0 0;padding:14px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;">
                  <p style="margin:0;font-size:14px;line-height:1.5;color:#9a3412;">
                    If you did not request this deletion, contact us immediately at
                    <a href="mailto:${supportEmail}" style="color:#9a3412;font-weight:600;text-decoration:underline;">${supportEmail}</a>.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:12px;color:#6b7280;">
                Regards,<br/>${appName} Team
              </td>
            </tr>
          </table>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    return {
      success: false,
      error: `Failed to send deletion email: ${response.status} ${errorBody || response.statusText}`,
    }
  }

  return { success: true, error: null }
}

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

    const { data: targetUserData, error: targetUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (targetUserError || !targetUserData?.user) {
      return jsonResponse(
        {
          success: false,
          error: targetUserError?.message || "User not found",
        },
        404
      )
    }

    const targetEmail = targetUserData.user.email?.trim()
    if (!targetEmail) {
      return jsonResponse(
        {
          success: false,
          error: "User email is missing; cannot send account deletion confirmation email.",
        },
        400
      )
    }

    const emailResult = await sendAccountDeletedEmail(targetEmail)
    if (!emailResult.success) {
      return jsonResponse(
        {
          success: false,
          error: emailResult.error || "Failed to send account deletion confirmation email.",
        },
        500
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

    return jsonResponse(
      { success: true, message: "User deleted successfully. Confirmation email sent." },
      200
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ success: false, error: message }, 500)
  }
})
