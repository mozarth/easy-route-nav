import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAIL = 'administracion@salenza.com'
const ADMIN_PASSWORD = 'Salenza2025'
const ADMIN_FULL_NAME = 'Administrador Salenza'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Try create admin user
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_FULL_NAME,
      },
    })

    // If already exists, find the user by email
    let adminUserId: string | null = created?.user?.id ?? null

    if (createError) {
      if (!createError.message.includes('already been registered')) {
        throw createError
      }

      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 2000,
      })

      if (listError) throw listError

      const existing = listData.users.find((u) => (u.email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase())
      adminUserId = existing?.id ?? null

      if (!adminUserId) {
        return new Response(JSON.stringify({ error: 'No se pudo encontrar el usuario admin existente' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!adminUserId) {
      return new Response(JSON.stringify({ error: 'No se pudo crear el usuario admin' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Ensure profile exists
    const { data: profileExisting, error: profileSelectError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', adminUserId)
      .maybeSingle()

    if (profileSelectError) throw profileSelectError

    if (!profileExisting) {
      const { error: profileInsertError } = await supabaseAdmin.from('profiles').insert({
        user_id: adminUserId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_FULL_NAME,
        is_active: true,
      })

      if (profileInsertError) throw profileInsertError
    }

    // Ensure admin role is set in user_roles (authoritative)
    await supabaseAdmin.from('user_roles').delete().eq('user_id', adminUserId)
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: adminUserId,
      role: 'admin',
    })

    if (roleError) throw roleError

    return new Response(
      JSON.stringify({ ok: true, message: 'Usuario administrador asegurado', user_id: adminUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

