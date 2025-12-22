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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create admin user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'administracion@salenza.com',
      password: 'Salenza2025',
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador Salenza',
        role: 'admin'
      }
    })

    if (createError) {
      // If user already exists, ensure they have admin role
      if (createError.message.includes('already been registered')) {
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('email', 'administracion@salenza.com')
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (existingProfile?.user_id) {
          await supabaseAdmin.from('user_roles').delete().eq('user_id', existingProfile.user_id)
          await supabaseAdmin.from('user_roles').insert({ user_id: existingProfile.user_id, role: 'admin' })
        }

        return new Response(
          JSON.stringify({ message: 'Usuario existente asegurado como admin' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw createError
    }

    return new Response(
      JSON.stringify({ message: 'Usuario administrador creado exitosamente', user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
