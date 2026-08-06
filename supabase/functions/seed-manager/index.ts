import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const setupToken = Deno.env.get('SEED_MANAGER_TOKEN') ?? ''
    const provided = req.headers.get('x-setup-token') ?? ''
    if (!setupToken || provided !== setupToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')
    const full_name = String(body?.full_name ?? email)
    const property_slug = String(body?.property_slug ?? '')

    if (!email || !password || !property_slug) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let userId: string | null = null
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      if (!createError.message.includes('already been registered')) throw createError
      const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 2000 })
      if (listError) throw listError
      userId = list.users.find((u) => (u.email ?? '').toLowerCase() === email)?.id ?? null
      if (userId) await admin.auth.admin.updateUserById(userId, { password })
    } else {
      userId = created.user?.id ?? null
    }

    if (!userId) throw new Error('No se pudo crear/encontrar el usuario')

    let { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!profile) {
      const { data: inserted, error: pErr } = await admin
        .from('profiles')
        .insert({ user_id: userId, email, full_name, is_active: true })
        .select('id')
        .single()
      if (pErr) throw pErr
      profile = inserted
    }

    await admin.from('user_roles').delete().eq('user_id', userId)
    const { error: roleError } = await admin
      .from('user_roles')
      .insert({ user_id: userId, role: 'portero' })
    if (roleError) throw roleError

    const { data: property, error: propError } = await admin
      .from('properties')
      .select('id')
      .eq('slug', property_slug)
      .maybeSingle()
    if (propError) throw propError
    if (!property) throw new Error('Propiedad no encontrada: ' + property_slug)

    await admin.from('user_property_access').delete().eq('profile_id', profile.id)
    const { error: accessError } = await admin
      .from('user_property_access')
      .insert({ profile_id: profile.id, property_id: property.id, can_manage: true })
    if (accessError) throw accessError

    return new Response(JSON.stringify({ ok: true, user_id: userId, property_id: property.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
