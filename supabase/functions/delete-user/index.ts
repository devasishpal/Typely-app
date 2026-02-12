import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const { userId } = await req.json().catch(() => ({}))
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing userId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Delete the auth user using the service role key (cascades to profiles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      return new Response(JSON.stringify({ success: false, error: deleteError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
