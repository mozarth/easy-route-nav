import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Role = 'admin' | 'portero' | 'usuario'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerId = userData.user.id

    // Server-side admin check
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')
    const full_name = String(body?.full_name ?? '').trim()
    const role = String(body?.role ?? 'usuario') as Role
    const property_ids = Array.isArray(body?.property_ids) ? (body.property_ids as string[]) : []

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['admin', 'portero', 'usuario'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError || !created?.user) {
      const msg = createError?.message ?? 'Could not create user'
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const newUserId = created.user.id

    // Ensure profile exists
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id')
      .eq('user_id', newUserId)
      .maybeSingle()

    if (!profile) {
      const { data: insertedProfile, error: profileInsertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: newUserId,
          email,
          full_name,
          is_active: true,
        })
        .select('id, user_id')
        .single()

      if (profileInsertError) {
        return new Response(JSON.stringify({ error: profileInsertError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      profile = insertedProfile
    }

    // Set role (authoritative) in user_roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role })

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Property access
    if (role !== 'admin') {
      await supabaseAdmin.from('user_property_access').delete().eq('profile_id', profile.id)

      if (property_ids.length > 0) {
        const rows = property_ids.map((property_id) => ({
          profile_id: profile.id,
          property_id,
        }))
        const { error: accessError } = await supabaseAdmin.from('user_property_access').insert(rows)
        if (accessError) {
          return new Response(JSON.stringify({ error: accessError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, user_id: newUserId, profile_id: profile.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
