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

const sendDeletionRequestEmail = async (params: {
  email: string
  username?: string | null
}) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""
  const fromEmail = Deno.env.get("ACCOUNT_DELETION_FROM_EMAIL") ?? "onboarding@resend.dev"
  const appName = Deno.env.get("APP_NAME") ?? "Typely"
  const supportEmail = Deno.env.get("SUPPORT_EMAIL") ?? "support@typely.app"
  const requestedAt = new Date().toUTCString()

  if (!resendApiKey) {
    return { success: false, error: "Missing RESEND_API_KEY for deletion request email." }
  }

  const greeting = params.username?.trim() || "there"

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.email],
      subject: `${appName}: Your account is deleted successfully`,
      text: [
        `Hello ${greeting},`,
        ``,
        `Your account is deleted successfully.`,
        `We have received your account deletion request on ${requestedAt}.`,
        ``,
        `If this was not requested by you, contact us immediately at ${supportEmail}.`,
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
                <h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.3;color:#111827;">Your account is deleted successfully</h1>
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">
                  Hello ${greeting}, your account deletion request has been received and is being processed securely.
                </p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                  Request time: <strong>${requestedAt}</strong>
                </p>
                <div style="margin:18px 0 0 0;padding:14px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;">
                  <p style="margin:0;font-size:14px;line-height:1.5;color:#9a3412;">
                    If this was not requested by you, contact us immediately at
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
      error: `Failed to send deletion request email: ${response.status} ${
        errorBody || response.statusText
      }`,
    }
  }

  return { success: true, error: null }
}

serve(async (req: Request) => {
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

    const payload = await req.json().catch(() => ({}))
    const source =
      typeof payload?.source === "string" && payload.source.trim()
        ? payload.source.trim().slice(0, 50)
        : "app"

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

    const { data: existingRequest, error: existingError } = await supabaseAdmin
      .from("account_deletion_requests")
      .select("id")
      .eq("user_id", callerUser.id)
      .in("status", ["pending", "processing"])
      .maybeSingle()

    if (existingError) {
      return jsonResponse({ success: false, error: existingError.message }, 500)
    }

    if (existingRequest) {
      return jsonResponse(
        { success: false, error: "A deletion request is already pending for this account." },
        409
      )
    }

    const { data: insertedRequest, error: insertError } = await supabaseAdmin
      .from("account_deletion_requests")
      .insert({
        user_id: callerUser.id,
        status: "pending",
        source,
      })
      .select("id")
      .single()

    if (insertError) {
      const duplicateCode = (insertError as { code?: string }).code
      if (duplicateCode === "23505") {
        return jsonResponse(
          { success: false, error: "A deletion request is already pending for this account." },
          409
        )
      }
      return jsonResponse({ success: false, error: insertError.message }, 500)
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("username,email")
      .eq("id", callerUser.id)
      .maybeSingle()

    const recipientEmail = callerUser.email?.trim() || callerProfile?.email?.trim() || ""

    if (!recipientEmail) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          error_message: "No email found for this account. Confirmation email was not sent.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", insertedRequest.id)

      return jsonResponse(
        {
          success: true,
          message:
            "Deletion request submitted successfully. No email is linked to this account, so confirmation email was skipped.",
        },
        200
      )
    }

    const emailResult = await sendDeletionRequestEmail({
      email: recipientEmail,
      username:
        (callerUser.user_metadata?.username as string | undefined) ??
        callerProfile?.username ??
        null,
    })

    if (!emailResult.success) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          error_message: emailResult.error || "Failed to send deletion confirmation email.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", insertedRequest.id)

      return jsonResponse(
        {
          success: true,
          message:
            "Deletion request submitted successfully, but confirmation email could not be sent.",
        },
        200
      )
    }

    await supabaseAdmin
      .from("account_deletion_requests")
      .update({
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", insertedRequest.id)

    return jsonResponse(
      {
        success: true,
        message:
          "Deletion request submitted successfully. A confirmation email has been sent to your inbox.",
      },
      200
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ success: false, error: message }, 500)
  }
})
