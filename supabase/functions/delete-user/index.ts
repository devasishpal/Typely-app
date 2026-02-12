import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL') ?? ''
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SERVICE_ROLE_KEY') ??
      ''

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({
        success: false,
        error: 'Missing SUPABASE_URL/PROJECT_URL or SUPABASE_SERVICE_ROLE_KEY/SERVICE_ROLE_KEY',
      })
    }

    if (serviceRoleKey.startsWith('PASTE_')) {
      return jsonResponse({
        success: false,
        error: 'SERVICE_ROLE_KEY is still a placeholder value.',
      })
    }

    const { userId } = await req.json().catch(() => ({}))
    if (!userId) {
      return jsonResponse({ success: false, error: 'Missing userId' })
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const authHeader = req.headers.get('Authorization') ?? ''
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!accessToken) {
      return jsonResponse({ success: false, error: 'Missing access token.' })
    }

    const {
      data: { user: callerUser },
      error: callerError,
    } = await supabaseAdmin.auth.getUser(accessToken)

    if (callerError || !callerUser) {
      return jsonResponse({ success: false, error: callerError?.message || 'Invalid user session.' })
    }

    if (callerUser.id !== userId) {
      return jsonResponse({ success: false, error: 'You can only delete your own account.' })
    }

    // Delete the auth user using the service role key (cascades to profiles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      return jsonResponse({ success: false, error: deleteError.message })
    }

    // Best-effort cleanup of related data (do not fail if some tables are missing)
    await Promise.allSettled([
      supabaseAdmin.from('lesson_progress').delete().eq('user_id', userId),
      supabaseAdmin.from('typing_sessions').delete().eq('user_id', userId),
      supabaseAdmin.from('typing_tests').delete().eq('user_id', userId),
      supabaseAdmin.from('user_achievements').delete().eq('user_id', userId),
      supabaseAdmin.from('statistics').delete().eq('user_id', userId),
      supabaseAdmin.from('admin_notifications').delete().eq('actor_user_id', userId),
      supabaseAdmin.from('profiles').delete().eq('id', userId),
    ])

    return jsonResponse({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ success: false, error: message })
  }
})
